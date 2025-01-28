const Lead = require("../models/lead");

const createLead = async (req, res) => {
    try {
        const { leadNo, incidentNo, assignedDate, assignedTo, assignedBy, summary, description } = req.body;

        const newLead = new Lead({
            leadNo,
            incidentNo,
            assignedDate,
            assignedTo,
            assignedBy,
            summary,
            description,
        });

        await newLead.save();
        res.status(201).json(newLead);
    } catch (err) {
        console.error("Error creating lead:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLeadsByOfficer = async (req, res) => {
    try {
        const officerName = req.user.name; // Extract officer's name from the authenticated request

        // Fetch leads where assignedBy matches the officer's name
        const leads = await Lead.find({ assignedBy: officerName });

        res.status(200).json(leads);
    } catch (err) {
        console.error("Error fetching leads:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { createLead, getLeadsByOfficer };
