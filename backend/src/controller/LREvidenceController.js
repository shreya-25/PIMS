const LREvidence = require("../models/LREvidence");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getProxyUrl } = require("../s3");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");

const asBool = v => v === true || v === "true" || v === 1 || v === "1";

const createLREvidence = async (req, res) => {
  try {
    const isLink = req.body.isLink === "true";
    const accessLevel = req.body.accessLevel || "Everyone";

    let s3Key = null, originalName = null, filename = null;

    if (req.file) {
      const { error, key } = await uploadToS3({ filePath: req.file.path, userId: req.body.caseNo, mimetype: req.file.mimetype });
      if (error) return res.status(500).json({ message: "S3 upload failed", error: error.message });
      s3Key = key;
      originalName = req.file.originalname;
      filename = req.file.filename;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    const link = isLink ? (req.body.link || "").trim() || null : null;

    // Resolve ObjectId refs
    const refs = await resolveLeadReturnRefs({
      caseNo: req.body.caseNo,
      caseName: req.body.caseName,
      leadNo: req.body.leadNo,
      enteredBy: req.body.enteredBy,
    });

    const newLREvidence = new LREvidence({
      leadNo: Number(req.body.leadNo),
      description: req.body.description,
      enteredBy: req.body.enteredBy,
      caseName: req.body.caseName,
      caseNo: req.body.caseNo,
      leadReturnId: req.body.leadReturnId,
      enteredDate: req.body.enteredDate,
      collectionDate: req.body.collectionDate,
      disposedDate: req.body.disposedDate,
      type: req.body.type,
      evidenceDescription: req.body.evidenceDescription,
      filePath: req.file ? "uploaded-to-s3" : null,
      originalName, filename, s3Key,
      isLink, link, accessLevel,
      // ObjectId refs
      caseId: refs.caseId,
      leadId: refs.leadId,
      leadReturnObjectId: refs.leadReturnObjectId,
      enteredByUserId: refs.enteredByUserId,
    });

    await newLREvidence.save();
    res.status(201).json({ message: "Evidence created successfully", evidence: newLREvidence });
  } catch (err) {
    console.error("Error creating LREvidence:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const getLREvidenceByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;
        const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName, isDeleted: { $ne: true } };
        const lrEvidences = await LREvidence.find(query);

        if (lrEvidences.length === 0) {
            return res.status(404).json({ message: "No evidences found." });
        }

        const evidencesWithUrls = lrEvidences.map((ev) => {
            const signedUrl = ev.s3Key ? getProxyUrl(ev.s3Key, caseNo) : null;
            return { ...ev.toObject(), signedUrl };
          });
        res.status(200).json(evidencesWithUrls);
    } catch (err) {
        console.error("Error fetching LREvidence records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const updateLREvidence = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName, leadReturnId, evidenceDescription: oldDesc } = req.params;

    const ev = await LREvidence.findOne({
      leadNo: Number(leadNo), description: leadName, caseNo, caseName, leadReturnId, evidenceDescription: oldDesc,
      isDeleted: { $ne: true }
    });
    if (!ev) return res.status(404).json({ message: "Evidence not found" });

    const isLink = asBool(req.body.isLink);
    const newLink = req.body.link?.trim();

    if (req.file) {
      if (ev.s3Key) { try { await deleteFromS3(ev.s3Key); } catch {} }
      const { key } = await uploadToS3({ filePath: req.file.path, userId: caseNo, mimetype: req.file.mimetype });
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      ev.s3Key = key;
      ev.originalName = req.file.originalname;
      ev.filename = req.file.filename;
      ev.isLink = false;
      ev.link = null;
    } else if (isLink) {
      if (ev.s3Key) { try { await deleteFromS3(ev.s3Key); } catch {} }
      ev.s3Key = undefined; ev.originalName = undefined; ev.filename = undefined;
      ev.isLink = true;
      ev.link = newLink || null;
    }

    ev.leadReturnId = req.body.leadReturnId || ev.leadReturnId;
    ev.enteredDate = req.body.enteredDate || ev.enteredDate;
    ev.collectionDate = req.body.collectionDate || ev.collectionDate;
    ev.disposedDate = req.body.disposedDate || ev.disposedDate;
    ev.disposition = req.body.disposition || ev.disposition;
    ev.type = req.body.type || ev.type;
    ev.evidenceDescription = req.body.evidenceDescription || ev.evidenceDescription;
    ev.enteredBy = req.body.enteredBy || ev.enteredBy;
    if (req.body.accessLevel !== undefined) ev.accessLevel = req.body.accessLevel || "Everyone";

    await ev.save();
    return res.json(ev);
  } catch (err) {
    console.error("Error updating LREvidence:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const deleteLREvidence = async (req, res) => {
    try {
      const { leadNo, leadName, caseNo, caseName, leadReturnId, evidenceDescription } = req.params;

      const ev = await LREvidence.findOne({
        leadNo: Number(leadNo), description: leadName, caseNo, caseName, leadReturnId, evidenceDescription,
        isDeleted: { $ne: true }
      });
      if (!ev) return res.status(404).json({ message: "Evidence not found" });

      ev.isDeleted = true;
      ev.deletedAt = new Date();
      ev.deletedBy = req.user?.name || "Unknown";
      await ev.save();

      return res.json({ message: "Evidence deleted successfully" });
    } catch (err) {
      console.error("Error deleting LREvidence:", err);
      if (!res.headersSent) return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { createLREvidence, getLREvidenceByDetails, updateLREvidence, deleteLREvidence };
