const LeadReturnResult = require("../models/leadReturnResult");

// Helpers to convert between A…Z strings and numbers
function alphabetToNumber(str) {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * 26 + (str.charCodeAt(i) - 64); // 'A'→1, 'B'→2, …
  }
  return result;
}
function numberToAlphabet(num) {
  let s = "";
  while (num > 0) {
    const rem = (num - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

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
      leadReturnResult,
      accessLevel,
    } = req.body;

    // 1) validate payload shapes
    if (
      !assignedBy ||
      typeof assignedBy !== "object" ||
      !assignedBy.assignee ||
      !assignedBy.lRStatus
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid assignedBy format. It should have 'assignee' and 'lRStatus'.",
        });
    }
    if (
      !assignedTo ||
      !Array.isArray(assignedTo.assignees) ||
      assignedTo.assignees.length === 0 ||
      !assignedTo.lRStatus
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid assignedTo format. It should have 'assignees' (array) and 'lRStatus'.",
        });
    }

    // 2) fetch existing returns for this exact lead+case
    const existing = await LeadReturnResult.find({
      leadNo,
      description,
      caseNo,
      caseName,
    }).select("leadReturnId");

    // 3) compute highest numeric ID so far
    const maxNum = existing.reduce((max, doc) => {
      const val = doc.leadReturnId
        ? alphabetToNumber(doc.leadReturnId)
        : 0;
      return Math.max(max, val);
    }, 0);

    // 4) bump by one and turn back into letters
    const newId = numberToAlphabet(maxNum + 1);

    // 5) build & save
    const newLeadReturnResult = new LeadReturnResult({
      leadNo,
      description,
      assignedTo,
      assignedBy,
      enteredDate,
      enteredBy,
      caseName,
      caseNo,
      leadReturnId: newId,
      leadReturnResult,
      accessLevel,
    });

    await newLeadReturnResult.save();
    return res.status(201).json(newLeadReturnResult);
  } catch (err) {
    console.error("Error creating lead return result:", err);
    return res.status(500).json({ message: "Something went wrong" });
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
            caseNo: caseNo, 
            caseName: caseName
        };

        const leadReturns = await LeadReturnResult.find(query);
        res.status(200).json(leadReturns);
    } catch (err) {
        console.error("Error fetching lead return results by case and lead:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// Update a specific lead return result entry
const updateLeadReturnResult = async (req, res) => {
    try {
        const { leadNo, caseNo, leadReturnId } = req.params;
        const updateData = req.body;

        const updatedResult = await LeadReturnResult.findOneAndUpdate(
            { leadNo: Number(leadNo), caseNo, leadReturnId },
            updateData,
            { new: true }
        );

        if (!updatedResult) {
            return res.status(404).json({ message: "Lead return result not found." });
        }

        res.status(200).json(updatedResult);
    } catch (err) {
        console.error("Error updating lead return result:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// Delete a specific lead return result entry
const deleteLeadReturnResult = async (req, res) => {
    try {
        const { leadNo, caseNo, leadReturnId } = req.params;

        const deletedResult = await LeadReturnResult.findOneAndDelete({
            leadNo: Number(leadNo),
            caseNo,
            leadReturnId
        });

        if (!deletedResult) {
            return res.status(404).json({ message: "Lead return result not found." });
        }

        res.status(200).json({ message: "Lead return result deleted successfully." });
    } catch (err) {
        console.error("Error deleting lead return result:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};


// module.exports = { createLeadReturnResult, getLeadReturnResultsByOfficer, getLeadReturnResultByLeadNoandLeadName };
module.exports = { createLeadReturnResult, getLeadReturnResultsByOfficer, getLeadReturnResultByLeadNoandLeadName, updateLeadReturnResult,
    deleteLeadReturnResult};
