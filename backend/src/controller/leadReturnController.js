const LeadReturn = require("../models/leadreturn");
const { createSnapshot } = require("../utils/leadReturnVersioning");
const {
    logLeadCreation,
    logStatusChange,
    logSnapshotCreation,
    extractUserInfo,
    extractMetadata
} = require("../utils/auditLogger");

// Create a new lead return entry
const createLeadReturn = async (req, res) => {
    try {
        const {
            leadNo,
            description,
            submittedDate,
            approvedDate,
            returnedDate,
            caseName,
            caseNo,
            assignedTo, // Expected to be an object { assignees: [], lRStatus: "" }
            assignedBy, // Expected to be an object { assignee: "", lRStatus: "" }
            accessLevel,
        } = req.body;

        // Validate assignedBy format
        if (!assignedBy || typeof assignedBy !== "object" || !assignedBy.assignee || !assignedBy.lRStatus) {
            return res.status(400).json({ message: "Invalid assignedBy format. It should have 'assignee' and 'lRStatus'." });
        }

        // Validate assignedTo format
        if (!assignedTo || !Array.isArray(assignedTo.assignees) || assignedTo.assignees.length === 0 || !assignedTo.lRStatus) {
            return res.status(400).json({ message: "Invalid assignedTo format. It should have 'assignees' (array) and 'lRStatus'." });
        }

        const newLeadReturn = new LeadReturn({
            leadNo,
            description,
            submittedDate,
            approvedDate,
            returnedDate,
            caseName,
            caseNo,
            assignedTo,
            assignedBy,
            accessLevel,
        });

        await newLeadReturn.save();

        // Create initial snapshot for the new lead return
        try {
            const actor = req.user?.name || assignedBy.assignee || "unknown";
            await createSnapshot(
                leadNo,
                actor,
                "Created",
                caseNo,
                caseName
            );
            console.log(`Initial snapshot created for lead ${leadNo} in case ${caseNo}`);
        } catch (snapshotErr) {
            console.error("Error creating initial snapshot:", snapshotErr.message);
            // Don't fail the request if snapshot creation fails
        }

        // Log lead creation in audit log
        try {
            const performedBy = {
                username: assignedBy.assignee,
                role: assignedBy.lRStatus
            };
            const metadata = extractMetadata(req);
            await logLeadCreation(leadNo, caseNo, performedBy, metadata);
        } catch (auditErr) {
            console.error("Error logging lead creation:", auditErr.message);
        }

        res.status(201).json(newLeadReturn);
    } catch (err) {
        console.error("Error creating lead return:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};


// Get lead return status by officer's name (AssignedTo or AssignedBy)
const getLeadsReturnByOfficer = async (req, res) => {
    try {
        const officerName = req.user.name; // Extract officer's name from the authenticated request

        // Fetch leads where assignedTo contains the officer's name OR assignedBy matches the officer's name
        const leads = await LeadReturn.find({
            $or: [
                { "assignedTo.assignee": officerName }, 
                { "assignedBy.assignee": officerName }
            ]
        });

        res.status(200).json(leads);
    } catch (err) {
        console.error("Error fetching lead return by officer:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const updateLRStatusToPending = async (req, res) => {
    try {
      const { leadNo, description, caseName, caseNo } = req.body;

      if (!leadNo || !description || !caseName || !caseNo) {
        return res.status(400).json({ message: "All fields are required." });
      }

      // Get old status before update
      const existingDoc = await LeadReturn.findOne({
        leadNo,
        description,
        caseName,
        caseNo,
      });

      const oldStatus = existingDoc?.assignedTo?.lRStatus;

      const updatedDoc = await LeadReturn.findOneAndUpdate(
        {
          leadNo,
          description,
          caseName,
          caseNo,
        },
        {
          $set: {
            "assignedTo.lRStatus": "Pending",
          },
        },
        { new: true }
      );

      if (!updatedDoc) {
        return res.status(404).json({ message: "Lead return not found." });
      }

      // Create snapshot if status changed from Returned or Completed (reopened)
      if (oldStatus && ["Returned", "Completed"].includes(oldStatus)) {
        try {
          const username = req.user?.name || req.user?.username || "System";
          await createSnapshot(leadNo, username, "Reopened", caseNo, caseName);
          console.log(`Snapshot created for lead ${leadNo} in case ${caseNo} - Reopened from ${oldStatus} to Pending`);
        } catch (snapshotErr) {
          console.error("Error creating snapshot:", snapshotErr.message);
          // Don't fail the request if snapshot creation fails
        }
      }

      // Log status change in audit log
      try {
        const performedBy = extractUserInfo(req);
        const metadata = extractMetadata(req, { reasonForChange: "Status updated to Pending" });
        await logStatusChange(leadNo, caseNo, oldStatus || "Unknown", "Pending", performedBy, "Status updated to Pending", metadata);
      } catch (auditErr) {
        console.error("Error logging status change:", auditErr.message);
      }

      res.status(200).json(updatedDoc);
    } catch (err) {
      console.error("Error updating lead return status:", err.message);
      res.status(500).json({ message: "Something went wrong" });
    }
  };

const updateLRStatusToSubmitted = async (req, res) => {
    try {
      const { leadNo, description, caseName, caseNo, submittedDate, assignedTo, assignedBy, accessLevel } = req.body;

      if (!leadNo || !description || !caseName || !caseNo) {
        return res.status(400).json({ message: "All fields are required." });
      }

      // Check if lead return exists
      let leadReturn = await LeadReturn.findOne({
        leadNo,
        description,
        caseName,
        caseNo,
      });

      if (!leadReturn) {
        // Create lead return WITHOUT creating a "Created" snapshot
        console.log(`Lead return not found for lead ${leadNo}, creating it now...`);
        leadReturn = new LeadReturn({
          leadNo,
          description,
          submittedDate: submittedDate || new Date(),
          approvedDate: null,
          returnedDate: null,
          caseName,
          caseNo,
          assignedTo: assignedTo || {
            assignees: [],
            lRStatus: "Submitted"
          },
          assignedBy: assignedBy || {
            assignee: "Unknown",
            lRStatus: "Pending"
          },
          accessLevel: accessLevel || "Everyone",
        });

        await leadReturn.save();
        console.log(`Lead return created for lead ${leadNo} without snapshot`);
      } else {
        // Update existing lead return
        leadReturn.assignedTo.lRStatus = "Submitted";
        leadReturn.submittedDate = submittedDate || new Date();
        await leadReturn.save();
      }

      // Log status change in audit log
      try {
        const performedBy = extractUserInfo(req);
        const metadata = extractMetadata(req, { reasonForChange: "Status updated to Submitted" });
        await logStatusChange(leadNo, caseNo, "Pending", "Submitted", performedBy, "Status updated to Submitted", metadata);
      } catch (auditErr) {
        console.error("Error logging status change:", auditErr.message);
      }

      res.status(200).json(leadReturn);
    } catch (err) {
      console.error("Error updating lead return status to Submitted:", err.message);
      res.status(500).json({ message: "Something went wrong" });
    }
  };

module.exports = { createLeadReturn, getLeadsReturnByOfficer, updateLRStatusToPending, updateLRStatusToSubmitted };
