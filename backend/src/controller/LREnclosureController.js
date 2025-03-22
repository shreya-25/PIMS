const LREnclosure = require("../models/LREnclosure");

// **Create a new LREnclosure entry with file upload support**
const createLREnclosure = async (req, res) => {
    try {
        console.log('Uploaded file:', req.file);
        if (!req.file) {
            return res.status(400).json({ error: 'No file received' });
        }
        
        // Extract file ID from the uploaded file
        const fileId = req.file.id; // or req.file._id depending on your multer-gridfs-storage version

        // Create a new LREnclosure document with the file reference
        const newLREnclosure = new LREnclosure({
            leadNo: req.body.leadNo,
            description: req.body.description,
            assignedTo: req.body.assignedTo ? JSON.parse(req.body.assignedTo) : {},
            assignedBy: req.body.assignedBy ? JSON.parse(req.body.assignedBy) : {},
            enteredBy: req.body.enteredBy,
            caseName: req.body.caseName,
            caseNo: req.body.caseNo,
            leadReturnId: req.body.leadReturnId,
            enteredDate: req.body.enteredDate,
            type: req.body.type,
            enclosureDescription: req.body.enclosureDescription,
            fileId, // Store the GridFS file reference here
        });

        // Save the document in MongoDB
        await newLREnclosure.save();

        // Send one final response after successful save
        res.status(201).json({
            message: "Enclosure created successfully",
            enclosure: newLREnclosure
        });
    } catch (err) {
        console.error("Error creating LREnclosure:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};


// **Get LREnclosure records using leadNo, leadName (description), caseNo, caseName, and leadReturnId**
const getLREnclosureByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo: caseNo,
            caseName: caseName,
        };

        const lrEnclosures = await LREnclosure.find(query).populate("fileId"); // Populating file reference

        if (lrEnclosures.length === 0) {
            return res.status(404).json({ message: "No enclosures found." });
        }

        res.status(200).json(lrEnclosures);
    } catch (err) {
        console.error("Error fetching LREnclosure records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { createLREnclosure, getLREnclosureByDetails };
