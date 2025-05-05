const LeadReturn = require("../models/leadreturn");

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
  
      res.status(200).json(updatedDoc);
    } catch (err) {
      console.error("Error updating lead return status:", err.message);
      res.status(500).json({ message: "Something went wrong" });
    }
  };

module.exports = { createLeadReturn, getLeadsReturnByOfficer, updateLRStatusToPending };
