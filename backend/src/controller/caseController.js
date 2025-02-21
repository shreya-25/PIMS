const mongoose = require("mongoose");
const Case = require("../models/case");

// Create a new case with validation
// exports.createCase = async (req, res) => {
//     try {
//         const { caseNo, caseName, caseSummary, selectedOfficers } = req.body;

//         // Ensure the user is authenticated and available in request
//         if (!req.user || !req.user.name) {
//             return res.status(401).json({ message: "Unauthorized: User details not found" });
//         }
//         // Validate required fields
//         if (!caseNo || !caseName || !Array.isArray(assignedOfficers) || assignedOfficers.length === 0 || !caseStatus) {
//             return res.status(400).json({ message: "caseNo, caseName, assignedOfficers, and caseStatus are required" });
//         }

//         // Validate caseStatus against allowed values
//         if (!['Ongoing', 'Completed'].includes(caseStatus)) {
//             return res.status(400).json({ message: "Invalid caseStatus value. Allowed values: 'Ongoing', 'Completed'" });
//         }

//         // Ensure unique case number
//         const existingCase = await Case.findOne({ caseNo });
//         if (existingCase) {
//             return res.status(400).json({ message: "Case number already exists. Please use a unique caseNo." });
//         }

//         // Construct assignedOfficers array
//         const assignedOfficers = [
//             {
//                 name: req.user.name, // Current signed-in officer
//                 role: "Case Manager",
//             },
//             ...(selectedOfficers || []).map(officer => ({
//                 name: officer.name,
//                 role: "Investigator"
//             }))
//         ];

//         const newCase = new Case({ caseNo, caseName, assignedOfficers, caseStatus: "Ongoing", caseSummary });
//         await newCase.save();

//         res.status(201).json({ message: "Case created successfully", data: newCase });
//     } catch (err) {
//         console.error("Error creating case:", err);
//         res.status(500).json({ message: "Error creating case", error: err.message });
//     }
// };

exports.createCase = async (req, res) => {
    try {
        const { caseNo, caseName, caseSummary, selectedOfficers, username } = req.body;

        // ✅ Ensure `username` is provided
        if (!username) {
            return res.status(400).json({ message: "Username is required to assign Case Manager" });
        }

        // ✅ Automatically assign the given `username` as `Case Manager`
        const assignedOfficers = [
            {
                name: username,  // User from request body
                role: "Case Manager"
            },
            ...selectedOfficers.map(officer => ({
                name: officer.name,
                role: "Investigator"
            }))
        ];

        // ✅ Create a new case
        const newCase = new Case({
            caseNo,
            caseName,
            caseSummary,
            assignedOfficers,  // Now contains Case Manager + Investigators
            caseStatus: "Ongoing" // Default status
        });

        await newCase.save();

        res.status(201).json({ message: "Case created successfully", data: newCase });
    } catch (err) {
        console.error("❌ Error creating case:", err);
        res.status(500).json({ message: "Error creating case", error: err.message });
    }
};

// Get all cases
exports.getAllCases = async (req, res) => {
    try {
        const cases = await Case.find();
        if (!cases || cases.length === 0) {
            return res.status(404).json({ message: "No cases found" });
        }
        res.status(200).json(cases);
    } catch (err) {
        console.error("Error fetching cases:", err);
        res.status(500).json({ message: "Error fetching cases", error: err.message });
    }
};

// Get a single case by ID with validation
exports.getCaseById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid case ID format" });
        }

        const caseData = await Case.findById(req.params.id);
        if (!caseData) {
            return res.status(404).json({ message: "Case not found" });
        }
        res.status(200).json(caseData);
    } catch (err) {
        console.error("Error fetching case:", err);
        res.status(500).json({ message: "Error fetching case", error: err.message });
    }
};

// Get cases assigned to a specific officer and return their role
// exports.getCasesByOfficer = async (req, res) => {
//     try {
//         const officerName = req.query.officerName; // Fetch officer's name from request query

//         if (!officerName) {
//             return res.status(400).json({ message: "Officer name is required in the query parameter" });
//         }

//         const cases = await Case.find({ "assignedOfficers.name": officerName });

//         if (!cases || cases.length === 0) {
//             return res.status(404).json({ message: "No cases assigned to this officer" });
//         }

//         // Extract officer's role for each case
//         const formattedCases = cases.map((c) => {
//             const officer = c.assignedOfficers.find(o => o.name === officerName);
//             return {
//                 caseNo: c.caseNo,
//                 caseName: c.caseName,
//                 caseStatus: c.caseStatus,
//                 role: officer ? officer.role : "Unknown", // Ensure role is included
//             };
//         });

//         res.status(200).json(formattedCases);
//     } catch (err) {
//         console.error("Error fetching cases for officer:", err);
//         res.status(500).json({ message: "Error fetching cases", error: err.message });
//     }
// };

exports.getCasesByOfficer = async (req, res) => {
    try {
        const officerName = req.query.officerName; // Get officer name from request query

        if (!officerName) {
            return res.status(400).json({ message: "Officer name is required in the query parameter" });
        }

        const cases = await Case.find({ "assignedOfficers.name": officerName });

        if (!cases || cases.length === 0) {
            return res.status(404).json({ message: "No cases assigned to this officer" });
        }

        // ✅ Extract officer's role for each case
        const formattedCases = cases.map((c) => {
            const officer = c.assignedOfficers.find(o => o.name === officerName);
            return {
                caseNo: c.caseNo,
                caseName: c.caseName,
                caseStatus: c.caseStatus,
                role: officer ? officer.role : "Unknown", // ✅ Ensure correct role extraction
            };
        });

        res.status(200).json(formattedCases);
    } catch (err) {
        console.error("❌ Error fetching cases for officer:", err);
        res.status(500).json({ message: "Error fetching cases", error: err.message });
    }
};



// Update case details
exports.updateCase = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid case ID format" });
        }

        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Update data cannot be empty" });
        }

        const updatedCase = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedCase) {
            return res.status(404).json({ message: "Case not found" });
        }
        res.status(200).json({ message: "Case updated successfully", data: updatedCase });
    } catch (err) {
        console.error("Error updating case:", err);
        res.status(500).json({ message: "Error updating case", error: err.message });
    }
};

// Delete a case
exports.deleteCase = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid case ID format" });
        }

        const deletedCase = await Case.findByIdAndDelete(req.params.id);
        if (!deletedCase) {
            return res.status(404).json({ message: "Case not found" });
        }
        res.status(200).json({ message: "Case deleted successfully" });
    } catch (err) {
        console.error("Error deleting case:", err);
        res.status(500).json({ message: "Error deleting case", error: err.message });
    }
};

// Reject a case by setting its Case Manager to "Admin"
exports.rejectCase = async (req, res) => {
    try {
      // Extract case number from route parameters
      const { id } = req.params;
      console.log("Fetched caseNo from URL:", id);
      
      // Convert caseNo to a number
      const parsedCaseNo = parseInt(id, 10);
      if (isNaN(parsedCaseNo)) {
        return res.status(400).json({ message: "Invalid case number format" });
      }
      
      // Find the case by its numeric caseNo field
      const existingCase = await Case.findOne({ caseNo: parsedCaseNo });
      if (!existingCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      // Option B: Preserve existing investigators and replace the Case Manager with "Admin"
      const investigators = existingCase.assignedOfficers.filter(
        (officer) => officer.role === "Investigator"
      );
      existingCase.assignedOfficers = [
        { name: "Admin", role: "Case Manager" },
        ...investigators,
      ];
      
      // Save the updated case
      const updatedCase = await existingCase.save();
      
      return res.status(200).json({
        message: "Case rejected.",
        data: updatedCase,
      });
    } catch (error) {
      console.error("Error rejecting case:", error);
      return res.status(500).json({
        message: "Error rejecting case",
        error: error.message,
      });
    }
  };


  exports.getCaseSummaryByCaseNo = async (req, res) => {
    try {
      const { caseNo } = req.params;
      if (!caseNo) {
        return res.status(400).json({ message: "Case number is required" });
      }
      
      // Assuming caseNo is stored as a Number in your Case model.
      const caseData = await Case.findOne({ caseNo: Number(caseNo) });
      
      if (!caseData) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      // Assuming the summary is stored in a field called "summary"
      res.status(200).json({ summary: caseData.caseSummary});
    } catch (error) {
      console.error("Error fetching case summary:", error);
      res.status(500).json({ message: "Error fetching case summary", error: error.message });
    }
  };
  
  
