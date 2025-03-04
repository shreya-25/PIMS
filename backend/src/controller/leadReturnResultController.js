const LeadReturnResult = require("../models/leadReturnResult");

// Create a new Lead Return Result entry
const createLeadReturnResult = async (req, res) => {
    try {
        const {
            leadNo,
            description,
            assignedTo, 
            assignedBy, 
            enteredDate,
            enteredBy,
            caseName,
            caseNo,
            leadReturnId,
            leadReturnResult
        } = req.body;

        // Validate assignedBy format
        if (!assignedBy || typeof assignedBy !== "object" || !assignedBy.assignee || !assignedBy.lRStatus) {
            return res.status(400).json({ message: "Invalid assignedBy format. It should have 'assignee' and 'lRStatus'." });
        }

        // Validate assignedTo format
        if (!assignedTo || !Array.isArray(assignedTo.assignees) || assignedTo.assignees.length === 0 || !assignedTo.lRStatus) {
            return res.status(400).json({ message: "Invalid assignedTo format. It should have 'assignees' (array) and 'lRStatus'." });
        }

        const newLeadReturnResult = new LeadReturnResult({
            leadNo,
            description,
            assignedTo,
            assignedBy,
            enteredDate,
            enteredBy,
            caseName,
            caseNo,
            leadReturnId,
            leadReturnResult
        });

        await newLeadReturnResult.save();
        res.status(201).json(newLeadReturnResult);
    } catch (err) {
        console.error("Error creating lead return result:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// Get all lead return results assigned to or assigned by an officer
const getLeadReturnResultsByOfficer = async (req, res) => {
    try {
        const officerName = req.user.name; // Extract officer's name from the authenticated request

        // Fetch lead return results where assignedTo contains the officer's name OR assignedBy matches the officer's name
        const leadReturnResults = await LeadReturnResult.find({
            $or: [
                { "assignedTo.assignees": officerName }, 
                { "assignedBy.assignee": officerName }
            ]
        });

        res.status(200).json(leadReturnResults);
    } catch (err) {
        console.error("Error fetching lead return results by officer:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLeadReturnResultByLeadNoandLeadName = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = { 
            leadNo: Number(leadNo), // Ensure number type 
            description: leadName,  
            caseNo: Number(caseNo), 
            caseName: caseName
        };

        const leadReturns = await LeadReturnResult.find(query);
        res.status(200).json(leadReturns);
    } catch (err) {
        console.error("Error fetching lead return results by case and lead:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};


module.exports = { createLeadReturnResult, getLeadReturnResultsByOfficer, getLeadReturnResultByLeadNoandLeadName };
