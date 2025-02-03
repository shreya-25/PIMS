const mongoose = require("mongoose");
const Case = require("../models/case"); // ✅ Ensure correct import

// Create a new case with validation
exports.createCase = async (req, res) => {
    try {
        const { caseNo, caseName, assignedOfficers } = req.body;

        // Validate required fields
        if (!caseNo || !caseName || !Array.isArray(assignedOfficers) || assignedOfficers.length === 0) {
            return res.status(400).json({ message: "caseNo, caseName, and at least one assigned officer are required" });
        }

        const newCase = new Case({ caseNo, caseName, assignedOfficers });
        await newCase.save();

        res.status(201).json(newCase);
    } catch (err) {
        console.error("Error creating case:", err);
        res.status(500).json({ message: "Error creating case", error: err.message });
    }
};

// Get all cases
exports.getAllCases = async (req, res) => {
    try {
        const cases = await Case.find().populate("assignedOfficers"); // ✅ Populating officers if referenced
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

        const caseData = await Case.findById(req.params.id).populate("assignedOfficers");
        if (!caseData) {
            return res.status(404).json({ message: "Case not found" });
        }
        res.status(200).json(caseData);
    } catch (err) {
        console.error("Error fetching case:", err);
        res.status(500).json({ message: "Error fetching case", error: err.message });
    }
};

// Get cases assigned to the logged-in officer (if authentication is used)
exports.getCasesByOfficer = async (req, res) => {
    try {
        if (!req.user || !req.user.name) {
            return res.status(403).json({ message: "Unauthorized: Officer name missing from request" });
        }

        const officerName = req.user.name;
        const cases = await Case.find({ "assignedOfficers.name": officerName });

        if (!cases || cases.length === 0) {
            return res.status(404).json({ message: "No cases assigned to this officer" });
        }

        res.status(200).json(cases);
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
        res.status(200).json(updatedCase);
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
