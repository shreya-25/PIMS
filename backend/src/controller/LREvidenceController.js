const LREvidence = require("../models/LREvidence");

// **Create a new LREnclosure entry with file upload support**
const createLREvidence = async (req, res) => {
    try {
      const isLink = req.body.isLink === "true";

      let filePath = null;
      let originalName = null;
      let filename = null;
  
      if (!isLink) {
        if (!req.file) {
          return res.status(400).json({ error: 'No file received for non-link upload' });
        }
        filePath = req.file.path;
        originalName = req.file.originalname;
        filename = req.file.filename;
      }
  
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
            type: req.body.type,
            accessLevel,
            evidenceDescription:req.body.evidenceDescription,
            isLink: isLink,
            link: isLink ? req.body.link : null,
            filePath,
            originalName,
            filename
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

// Update an existing LREvidence (and optionally replace its file)
const updateLREvidence = async (req, res) => {
    try {
      const {
        leadNo,
        leadName,
        caseNo,
        caseName,
        leadReturnId,
        evidenceDescription: oldDesc
      } = req.params;
  
      const ev = await LREvidence.findOne({
        leadNo: Number(leadNo),
        description: leadName,
        caseNo,
        caseName,
        leadReturnId,
        evidenceDescription: oldDesc
      });
      if (!ev) {
        return res.status(404).json({ message: "Evidence not found" });
      }
  
      // If a new file arrived, delete the old one
      if (req.file && ev.filePath) {
        try {
          if (fs.existsSync(ev.filePath)) fs.unlinkSync(ev.filePath);
        } catch (fsErr) {
          console.warn("Could not delete old file:", fsErr);
        }
        ev.filePath     = req.file.path;
        ev.originalName = req.file.originalname;
        ev.filename     = req.file.filename;
      }
  
      // Update metadata
      ev.leadReturnId       = req.body.leadReturnId;
      ev.enteredDate        = req.body.enteredDate;
      ev.collectionDate     = req.body.collectionDate;
      ev.disposedDate       = req.body.disposedDate;
      ev.disposition        = req.body.disposition;
      ev.type               = req.body.type;
      ev.evidenceDescription = req.body.evidenceDescription;
      ev.enteredBy          = req.body.enteredBy;
  
      await ev.save();
      return res.json(ev);
    } catch (err) {
      console.error("Error updating LREvidence:", err);
      return res.status(500).json({ message: "Something went wrong" });
    }
  };
  
  // Delete an evidence by composite key + description
  const deleteLREvidence = async (req, res) => {
    try {
      const {
        leadNo,
        leadName,
        caseNo,
        caseName,
        leadReturnId,
        evidenceDescription
      } = req.params;
  
      const ev = await LREvidence.findOneAndDelete({
        leadNo: Number(leadNo),
        description: leadName,
        caseNo,
        caseName,
        leadReturnId,
        evidenceDescription
      });
      if (!ev) {
        return res.status(404).json({ message: "Evidence not found" });
      }
  
      // Remove the file on disk
      if (ev.filePath) {
        try {
          if (fs.existsSync(ev.filePath)) fs.unlinkSync(ev.filePath);
        } catch (fsErr) {
          console.warn("Could not delete file on disk:", fsErr);
        }
      }
  
      return res.json({ message: "Evidence deleted" });
    } catch (err) {
      console.error("Error deleting LREvidence:", err);
      if (!res.headersSent) {
        return res.status(500).json({ message: "Something went wrong" });
      }
    }
  };
  

module.exports = { createLREvidence, getLREvidenceByDetails, updateLREvidence, deleteLREvidence };
