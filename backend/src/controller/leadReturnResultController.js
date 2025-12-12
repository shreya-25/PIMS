const LeadReturnResult = require("../models/leadReturnResult");
const LeadReturn = require("../models/leadreturn");
const LRPerson = require("../models/LRPerson");

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

// const searchCasesAndLeadsByKeyword = async (req, res) => {
//   try {
//     const { keyword, officerName } = req.query;

//     if (!keyword || !keyword.trim()) {
//       return res.status(400).json({ message: "Keyword is required." });
//     }

//     console.log("🔍 searchCasesAndLeadsByKeyword – keyword:", keyword);

//     const regex = new RegExp(keyword.trim(), "i"); 

//     const leadReturns = await LeadReturn.find({
//       $or: [
//         { description: regex },
//         { caseName: regex },
//         { caseNo: regex },
//       ],
//     });


//     const leadReturnResults = await LeadReturnResult.find({
//       $or: [
//         { description: regex },
//         { leadReturnResult: regex },
//         { caseName: regex },
//         { caseNo: regex },
//       ],
//     });

//     const flatResults = [];

//     for (const lr of leadReturns) {
//       flatResults.push({
//         caseNo: lr.caseNo,
//         caseName: lr.caseName,
//         leadNo: lr.leadNo,
//         description: lr.description,
//         source: "LeadReturn",
//         fullLeadReturn: lr,
//       });
//     }

//     for (const lrr of leadReturnResults) {
//       flatResults.push({
//         caseNo: lrr.caseNo,
//         caseName: lrr.caseName,
//         leadNo: lrr.leadNo,
//         description: lrr.description,
//         source: "LeadReturnResult",
//         fullLeadReturn: lrr,
//       });
//     }

//     const dedupMap = new Map();
//     for (const item of flatResults) {
//       const key = `${item.caseNo || ""}::${item.leadNo || ""}::${
//         item.description || ""
//       }`;
//       if (!dedupMap.has(key)) {
//         dedupMap.set(key, item);
//       }
//     }

//     const deduped = Array.from(dedupMap.values());
//     console.log("✅ searchCasesAndLeadsByKeyword – results count:", deduped.length);

//     return res.status(200).json(deduped);
//   } catch (err) {
//     console.error("Error searching cases and leads by keyword:", err);
//     return res.status(500).json({ message: "Something went wrong" });
//   }
// };

// GET /api/leadReturnResult?keyword=...&officerName=...
 const searchCasesAndLeadsByKeyword = async (req, res) => {
  try {
    const { keyword, officerName } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const regex = new RegExp(keyword, "i");

    // 1) Base text search condition
    const textMatch = {
      $or: [
        { description: regex },
        { leadReturnResult: regex },
        { caseName: regex },
        { caseNo: regex },
      ],
    };

    // 2) Build query properly - combine text search with officer filter using $and
    let leadReturnQuery = textMatch;
    let leadReturnResultQuery = textMatch;

    if (officerName) {
      const officerCondition = {
        $or: [
          { "assignedTo.assignees": officerName },
          { "assignedBy.assignee": officerName },
        ],
      };

      leadReturnQuery = {
        $and: [textMatch, officerCondition],
      };

      leadReturnResultQuery = {
        $and: [textMatch, officerCondition],
      };
    }

    // 2a) LeadReturn documents
    const leadReturns = await LeadReturn.find(leadReturnQuery);

    // 2b) LeadReturnResult documents
    const leadReturnResults = await LeadReturnResult.find(leadReturnResultQuery);

    // 2c) Search LRPerson by firstName or lastName (no officer filter for person searches)
    const personTextMatch = {
      $or: [
        { firstName: regex },
        { lastName: regex },
        { alias: regex },
      ],
    };

    const lrPersons = await LRPerson.find(personTextMatch);

    console.log(`📊 Search Results Summary:`);
    console.log(`   - LeadReturn: ${leadReturns.length}`);
    console.log(`   - LeadReturnResult: ${leadReturnResults.length}`);
    console.log(`   - LRPerson: ${lrPersons.length}`);
    if (lrPersons.length > 0) {
      console.log(`   - Found persons:`, lrPersons.map(p => `${p.firstName} ${p.lastName}`));
    }

    // 3) Build a FLAT list of unified lead entries
    const flatResults = [];

    // from LeadReturn
    for (const lr of leadReturns) {
      flatResults.push({
        caseNo: lr.caseNo,
        caseName: lr.caseName,
        leadNo: lr.leadNo,
        description: lr.description,
        source: "LeadReturn",
        fullLeadReturn: lr,
      });
    }

    // from LeadReturnResult
    for (const lrr of leadReturnResults) {
      flatResults.push({
        caseNo: lrr.caseNo,
        caseName: lrr.caseName,
        leadNo: lrr.leadNo,
        description: lrr.description,
        source: "LeadReturnResult",
        fullLeadReturn: lrr,
      });
    }

    // from LRPerson - add the associated lead info
    for (const person of lrPersons) {
      flatResults.push({
        caseNo: person.caseNo,
        caseName: person.caseName,
        leadNo: person.leadNo,
        description: person.description,
        source: "LRPerson",
        matchedPerson: `${person.firstName || ""} ${person.lastName || ""}`.trim(),
        fullLeadReturn: person,
      });
    }

    // 4) Optional: de-duplicate by caseNo + leadNo + description
    const dedupMap = new Map();
    for (const item of flatResults) {
      const key = `${item.caseNo || ""}::${item.leadNo || ""}::${
        item.description || ""
      }`;
      if (!dedupMap.has(key)) {
        dedupMap.set(key, item);
      }
    }

    const deduped = Array.from(dedupMap.values());
    console.log(
      "✅ searchCasesAndLeadsByKeyword – results count:",
      deduped.length
    );

    return res.status(200).json(deduped);
  } catch (err) {
    console.error("Error searching cases and leads by keyword:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};




// module.exports = { createLeadReturnResult, getLeadReturnResultsByOfficer, getLeadReturnResultByLeadNoandLeadName };
module.exports = { createLeadReturnResult, getLeadReturnResultsByOfficer, getLeadReturnResultByLeadNoandLeadName, updateLeadReturnResult,
    deleteLeadReturnResult, searchCasesAndLeadsByKeyword };
