const LREvidence = require("../models/LREvidence");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");


// **Create a new LREnclosure entry with file upload support**

const asBool = v => v === true || v === "true" || v === 1 || v === "1";

const createLREvidence = async (req, res) => {
  try {
    const isLink      = req.body.isLink === "true";   // "true" | "false"
    const accessLevel = req.body.accessLevel || "Everyone";

    let s3Key = null;
    let originalName = null;
    let filename = null;

    // Only upload if a file was actually sent
    if (req.file) {
      const { error, key } = await uploadToS3({
        filePath: req.file.path,
        userId: req.body.caseNo,
        mimetype: req.file.mimetype,
      });
      if (error) {
        return res.status(500).json({ message: "S3 upload failed", error: error.message });
      }
      s3Key = key;
      originalName = req.file.originalname;
      filename = req.file.filename;

      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    // Link is optional
    const link = isLink ? (req.body.link || "").trim() || null : null;

    // Build doc (file/link are optional)
    const newLREvidence = new LREvidence({
      leadNo: Number(req.body.leadNo),
      description: req.body.description,
      assignedTo: req.body.assignedTo ? JSON.parse(req.body.assignedTo) : {},
      assignedBy: req.body.assignedBy ? JSON.parse(req.body.assignedBy) : {},
      enteredBy: req.body.enteredBy,
      caseName: req.body.caseName,
      caseNo: req.body.caseNo,
      leadReturnId: req.body.leadReturnId,
      enteredDate: req.body.enteredDate,
      collectionDate: req.body.collectionDate,
      disposedDate: req.body.disposedDate,
      type: req.body.type,
      evidenceDescription: req.body.evidenceDescription,

      // file-related (may be null)
      filePath: req.file ? "uploaded-to-s3" : null,
      originalName,
      filename,
      s3Key,

      // link-related (may be null)
      isLink,
      link,

      accessLevel,
    });

    await newLREvidence.save();
    res.status(201).json({ message: "Evidence created successfully", evidence: newLREvidence });
  } catch (err) {
    console.error("Error creating LREvidence:", err);
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

         const evidencesWithUrls = await Promise.all(
      lrEvidences.map(async (ev) => {
        const signedUrl = ev.s3Key ? await getFileFromS3(ev.s3Key) : null;
        return { ...ev.toObject(), signedUrl };
      })
    );

        res.status(200).json(evidencesWithUrls);
    } catch (err) {
        console.error("Error fetching LREvidence records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// Update an existing LREvidence (and optionally replace its file)
const updateLREvidence = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName, leadReturnId, evidenceDescription: oldDesc } = req.params;

    const ev = await LREvidence.findOne({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
      leadReturnId,
      evidenceDescription: oldDesc
    });
    if (!ev) return res.status(404).json({ message: "Evidence not found" });

    const isLink = asBool(req.body.isLink);
    const newLink = req.body.link?.trim();

    // If a new file is uploaded, replace S3 file and clear link
    if (req.file) {
      if (ev.s3Key) {
        try { await deleteFromS3(ev.s3Key); } catch {}
      }
      const { key } = await uploadToS3({
        filePath: req.file.path,
        userId: caseNo,
        mimetype: req.file.mimetype,
      });
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      ev.s3Key = key;
      ev.originalName = req.file.originalname;
      ev.filename = req.file.filename;
      ev.isLink = false;
      ev.link = null;
    } else if (isLink) {
      // Switching to link-only (or updating link)
      if (ev.s3Key) {
        try { await deleteFromS3(ev.s3Key); } catch {}
      }
      ev.s3Key = undefined;
      ev.originalName = undefined;
      ev.filename = undefined;
      ev.isLink = true;
      ev.link = newLink || null;
    }
    // else: no file uploaded and not switching to link ⇒ keep existing file/link as-is

    // Update common fields
    ev.leadReturnId = req.body.leadReturnId || ev.leadReturnId;
    ev.enteredDate = req.body.enteredDate || ev.enteredDate;
    ev.collectionDate = req.body.collectionDate || ev.collectionDate;
    ev.disposedDate = req.body.disposedDate || ev.disposedDate;
    ev.disposition = req.body.disposition || ev.disposition;
    ev.type = req.body.type || ev.type;
    ev.evidenceDescription = req.body.evidenceDescription || ev.evidenceDescription;
    ev.enteredBy = req.body.enteredBy || ev.enteredBy;

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

    if (ev.s3Key) {
      try {
        await deleteFromS3(ev.s3Key);
      } catch (fsErr) {
        console.warn("Could not delete file from S3:", fsErr);
      }
    }

    return res.json({ message: "Evidence deleted successfully" });
  } catch (err) {
    console.error("Error deleting LREvidence:", err);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};
  

module.exports = { createLREvidence, getLREvidenceByDetails, updateLREvidence, deleteLREvidence };