const mongoose = require("mongoose");
const Case = require("../models/case");

// Create a new case with validation
exports.createCase = async (req, res) => {
    try {
        const { caseNo, caseName, assignedOfficers, caseStatus } = req.body;

        // Validate required fields
        if (!caseNo || !caseName || !Array.isArray(assignedOfficers) || assignedOfficers.length === 0 || !caseStatus) {
            return res.status(400).json({ message: "caseNo, caseName, assignedOfficers, and caseStatus are required" });
        }

        // Validate caseStatus against allowed values
        if (!['Ongoing', 'Completed'].includes(caseStatus)) {
            return res.status(400).json({ message: "Invalid caseStatus value. Allowed values: 'Ongoing', 'Completed'" });
        }

        // Ensure unique case number
        const existingCase = await Case.findOne({ caseNo });
        if (existingCase) {
            return res.status(400).json({ message: "Case number already exists. Please use a unique caseNo." });
        }

        const newCase = new Case({ caseNo, caseName, assignedOfficers, caseStatus });
        await newCase.save();

        res.status(201).json({ message: "Case created successfully", data: newCase });
    } catch (err) {
        console.error("Error creating case:", err);
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
exports.getCasesByOfficer = async (req, res) => {
    try {
        const officerName = req.query.officerName; // Fetch officer's name from request query

        if (!officerName) {
            return res.status(400).json({ message: "Officer name is required in the query parameter" });
        }

        const cases = await Case.find({ "assignedOfficers.name": officerName });

        if (!cases || cases.length === 0) {
            return res.status(404).json({ message: "No cases assigned to this officer" });
        }

        // Extract officer's role for each case
        const formattedCases = cases.map((c) => {
            const officer = c.assignedOfficers.find(o => o.name === officerName);
            return {
                caseNo: c.caseNo,
                caseName: c.caseName,
                caseStatus: c.caseStatus,
                role: officer ? officer.role : "Unknown", // Ensure role is included
            };
        });

        res.status(200).json(formattedCases);
    } catch (err) {
        console.error("Error fetching cases for officer:", err);
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
