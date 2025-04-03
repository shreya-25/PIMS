const LREvidence = require("../models/LREvidence");

// **Create a new LREnclosure entry with file upload support**
const createLREvidence = async (req, res) => {
    try {
        console.log('Uploaded file:', req.file);
        if (!req.file) {
            return res.status(400).json({ error: 'No file received' });
        }
        
        // Extract file ID from the uploaded file
        // const fileId = req.file.id; or req.file._id depending on your multer-gridfs-storage version

        // For disk storage, use file details (not fileId)
        const fileLocation = req.file.path;

        // Create a new LREnclosure document with the file reference
        const newLREvidence = new LREvidence({
            leadNo: req.body.leadNo,
            description: req.body.description,
            assignedTo: req.body.assignedTo ? JSON.parse(req.body.assignedTo) : {},
            assignedBy: req.body.assignedBy ? JSON.parse(req.body.assignedBy) : {},
            enteredBy: req.body.enteredBy,
            caseName: req.body.caseName,
            caseNo: req.body.caseNo,
            leadReturnId: req.body.leadReturnId,
            enteredDate: req.body.enteredDate,
            collectionDate:req.body.collectionDate,
            disposedDate: req.body.disposedDate,
            disposition: req.body.disposition,
            type: req.body.type,
            evidenceDescription:req.body.enclosureDescription,
            // fileId, // Store the GridFS file reference here
            filePath: fileLocation,               // Save file path on disk
            originalName: req.file.originalname,  // Save original file name
            filename: req.file.filename           // Save the generated filename on disk
        });

        // Save the document in MongoDB
        await newLREvidence.save();

        // Send one final response after successful save
        res.status(201).json({
            message: "Evidnece created successfully",
            evidence: newLREvidence
        });
    } catch (err) {
        console.error("Error creating LREvidence:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};


// **Get LREnclosure records using leadNo, leadName (description), caseNo, caseName, and leadReturnId**
const getLREvidenceByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo: caseNo,
            caseName: caseName,
        };

        // const lrEnclosures = await LREnclosure.find(query).populate("fileId");
        const lrEvidences = await LREvidence.find(query);

        if (lrEvidences.length === 0) {
            return res.status(404).json({ message: "No evidences found." });
        }

        res.status(200).json(lrEvidences);
    } catch (err) {
        console.error("Error fetching LREvidence records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { createLREvidence, getLREvidenceByDetails };
