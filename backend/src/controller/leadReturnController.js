const LeadReturn = require("../models/leadreturn");
const Case = require("../models/case");
const { createSnapshot } = require("../utils/leadReturnVersioning");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");
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

        // Resolve ObjectId refs
        const refs = await resolveLeadReturnRefs({
            caseNo,
            caseName,
            leadNo,
            enteredBy: assignedBy.assignee,
            assignedByUsername: assignedBy.assignee,
            assignedToUsernames: assignedTo.assignees,
        });

        // Auto-generate returnNo (count of existing returns for this lead + 1)
        const existingCount = await LeadReturn.countDocuments({ leadNo, caseNo });
        const returnNo = existingCount + 1;

        const newLeadReturn = new LeadReturn({
            leadNo,
            returnNo,
            description,
            submittedDate,
            approvedDate,
            returnedDate,
            caseName,
            caseNo,
            assignedTo,
            assignedBy,
            accessLevel,
            // ObjectId refs
            caseId: refs.caseId,
            leadId: refs.leadId,
            assignedByUserId: refs.assignedByUserId,
            assignedToUserIds: refs.assignedToUserIds,
        });

        await newLeadReturn.save();

        // Create initial snapshot for the new lead return
        try {
            const actor = req.user?.username || assignedBy.assignee || "unknown";
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
        const officerName = req.user.username;

        const leads = await LeadReturn.find({
            $or: [
                { "assignedTo.assignees": officerName },
                { "assignedBy.assignee": officerName }
            ]
        }).lean();

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

      const existingDoc = await LeadReturn.findOne({
        leadNo,
        description,
        caseName,
        caseNo,
      });

      const oldStatus = existingDoc?.assignedTo?.lRStatus;

      const updatedDoc = await LeadReturn.findOneAndUpdate(
        { leadNo, description, caseName, caseNo },
        { $set: { "assignedTo.lRStatus": "Pending" } },
        { new: true }
      );

      if (!updatedDoc) {
        return res.status(404).json({ message: "Lead return not found." });
      }

      // Create snapshot if status changed from Returned or Completed (reopened)
      if (oldStatus && ["Returned", "Completed"].includes(oldStatus)) {
        try {
          const username = req.user?.username || "System";
          await createSnapshot(leadNo, username, "Reopened", caseNo, caseName);
          console.log(`Snapshot created for lead ${leadNo} in case ${caseNo} - Reopened from ${oldStatus} to Pending`);
        } catch (snapshotErr) {
          console.error("Error creating snapshot:", snapshotErr.message);
        }
      }

      // Log status change
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
      const { leadNo, description, caseId, submittedDate, assignedTo, assignedBy, accessLevel } = req.body;

      if (!leadNo || !description || !caseId) {
        return res.status(400).json({ message: "All fields are required." });
      }

      const caseDoc = await Case.findById(caseId).select("caseNo caseName").lean();
      if (!caseDoc) return res.status(404).json({ message: "Case not found." });
      const { caseNo, caseName } = caseDoc;

      let leadReturn = await LeadReturn.findOne({ leadNo, caseNo });

      if (!leadReturn) {
        // Create lead return WITHOUT creating a "Created" snapshot
        console.log(`Lead return not found for lead ${leadNo}, creating it now...`);

        // Resolve refs for the new record
        const refs = await resolveLeadReturnRefs({
            caseNo,
            caseName,
            leadNo,
            enteredBy: assignedBy?.assignee,
            assignedByUsername: assignedBy?.assignee,
            assignedToUsernames: assignedTo?.assignees,
        });

        // Auto-generate returnNo (count of existing returns for this lead + 1)
        const existingCount = await LeadReturn.countDocuments({ leadNo, caseNo });
        const returnNo = existingCount + 1;

        leadReturn = new LeadReturn({
          leadNo,
          returnNo,
          description,
          submittedDate: submittedDate || new Date(),
          approvedDate: null,
          returnedDate: null,
          caseName,
          caseNo,
          assignedTo: assignedTo || { assignees: [], lRStatus: "Submitted" },
          assignedBy: assignedBy || { assignee: "Unknown", lRStatus: "Pending" },
          accessLevel: accessLevel || "Everyone",
          // ObjectId refs
          caseId: refs.caseId,
          leadId: refs.leadId,
          assignedByUserId: refs.assignedByUserId,
          assignedToUserIds: refs.assignedToUserIds,
        });

        await leadReturn.save();
        console.log(`Lead return created for lead ${leadNo} without snapshot`);
      } else {
        // Update existing lead return
        leadReturn.assignedTo.lRStatus = "Submitted";
        leadReturn.submittedDate = submittedDate || new Date();
        await leadReturn.save();
      }

      // Log status change
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
