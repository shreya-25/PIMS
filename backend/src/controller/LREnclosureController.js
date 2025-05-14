const LREnclosure = require("../models/LREnclosure");
const fs = require("fs");

// **Create a new LREnclosure entry with file upload support**
const createLREnclosure = async (req, res) => {
    try {
      const isLink = req.body.isLink === "true"; // Handle string from formData
      const accessLevel = req.body.accessLevel || "Everyone";

      let filePath = null;
      let originalName = null;
      let filename = null;
  
      if (!isLink) {
        if (!req.file) {
          return res.status(400).json({ error: 'No file received for non-link upload' });
        }
  
        // File fields (for disk storage)
        filePath = req.file.path;
        originalName = req.file.originalname;
        filename = req.file.filename;
      }

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
            // fileId, // Store the GridFS file reference here
            filePath: isLink ? "link-only" : filePath,
            originalName: originalName,
            filename: filename,
            accessLevel,
            isLink,
            link: isLink ? req.body.link : null,
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

        // const lrEnclosures = await LREnclosure.find(query).populate("fileId");
        const lrEnclosures = await LREnclosure.find(query);

        if (lrEnclosures.length === 0) {
            return res.status(404).json({ message: "No enclosures found." });
        }

        res.status(200).json(lrEnclosures);
    } catch (err) {
        console.error("Error fetching LREnclosure records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const updateLREnclosure = async (req, res) => {
    try {
      const {
        leadNo, leadName, caseNo, caseName,
        leadReturnId, enclosureDescription: oldDesc
      } = req.params;
  
      // 1) Find the existing document
      const enc = await LREnclosure.findOne({
        leadNo: Number(leadNo),
        description: leadName,
        caseNo, caseName,
        leadReturnId,
        enclosureDescription: oldDesc
      });
      if (!enc) return res.status(404).json({ message: "Enclosure not found" });
  
      // 2) If a new file arrived, delete the old file
      if (req.file) {
        if (enc.filePath && fs.existsSync(enc.filePath)) {
          fs.unlinkSync(enc.filePath);
        }
        enc.filePath     = req.file.path;
        enc.originalName = req.file.originalname;
        enc.filename     = req.file.filename;
      }
  
      // 3) Update any changed fields
      enc.leadReturnId         = req.body.leadReturnId;
      enc.enteredDate          = req.body.enteredDate;
      enc.type                 = req.body.type;
      enc.enclosureDescription = req.body.enclosureDescription;
      enc.enteredBy            = req.body.enteredBy;
      await enc.save();
  
      res.json(enc);
    } catch (err) {
      console.error("Error updating LREnclosure:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  };
  
  // Delete an enclosure by composite key + description
const deleteLREnclosure = async (req, res) => {
  try {
    const {
      leadNo,
      leadName,
      caseNo,
      caseName,
      leadReturnId,
      enclosureDescription,
    } = req.params;

    const enc = await LREnclosure.findOneAndDelete({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
      leadReturnId,
      enclosureDescription,
    });
    if (!enc) {
      return res.status(404).json({ message: "Enclosure not found" });
    }

    // Remove the file on disk (if present)
    if (enc.filePath) {
      try {
        if (fs.existsSync(enc.filePath)) fs.unlinkSync(enc.filePath);
      } catch (fsErr) {
        console.warn("Could not delete file on disk:", fsErr);
      }
    }

    return res.json({ message: "Enclosure deleted" });
  } catch (err) {
    console.error("Error deleting LREnclosure:", err);
    // Only send if headers aren’t already sent
    if (!res.headersSent) {
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};


module.exports = { createLREnclosure, getLREnclosureByDetails, updateLREnclosure, deleteLREnclosure };
