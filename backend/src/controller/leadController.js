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

module.exports = { createLead };
