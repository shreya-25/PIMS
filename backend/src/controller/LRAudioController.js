const LRAudio = require("../models/LRAudio");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");
const { createAuditLog, sanitizeForAudit } = require("../services/auditService");

const toBool = (v) => v === true || v === "true" || v === "1";

// CREATE (file optional)
const createLRAudio = async (req, res) => {
  try {
    const isLink = toBool(req.body.isLink);
    let filePath = null, originalName = null, filename = null, s3Key = null;
    let link = isLink ? (req.body.link || "").trim() || null : null;

    if (!isLink && req.file) {
      filePath = req.file.path;
      originalName = req.file.originalname;
      filename = req.file.filename;

      const { error, key } = await uploadToS3({
        filePath,
        userId: req.body.caseNo,
        mimetype: req.file.mimetype,
      });
      if (error) return res.status(500).json({ message: "S3 upload failed", error: error.message });
      s3Key = key;

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      filePath = null;
    }

    // Resolve ObjectId refs
    const refs = await resolveLeadReturnRefs({
      caseNo: req.body.caseNo,
      caseName: req.body.caseName,
      leadNo: req.body.leadNo,
      enteredBy: req.body.enteredBy,
    });

    const newLRAudio = new LRAudio({
      leadNo: req.body.leadNo,
      description: req.body.description,
      enteredBy: req.body.enteredBy,
      caseName: req.body.caseName,
      caseNo: req.body.caseNo,
      leadReturnId: req.body.leadReturnId,
      enteredDate: req.body.enteredDate,
      dateAudioRecorded: req.body.dateAudioRecorded,
      audioDescription: req.body.audioDescription,
      accessLevel: req.body.accessLevel || "Everyone",
      isLink, link, originalName, filename, s3Key, filePath,
      // ObjectId refs
      caseId: refs.caseId,
      leadId: refs.leadId,
      leadReturnObjectId: refs.leadReturnObjectId,
      enteredByUserId: refs.enteredByUserId,
    });

    await newLRAudio.save();

    await createAuditLog({
      caseNo: req.body.caseNo, caseName: req.body.caseName,
      leadNo: req.body.leadNo, leadName: req.body.description,
      entityType: "LRAudio",
      entityId: `audio_${newLRAudio._id}`,
      action: "CREATE",
      performedBy: { username: req.user?.name || req.body.enteredBy || "Unknown", role: req.user?.role || "Unknown" },
      oldValue: null,
      newValue: sanitizeForAudit(newLRAudio.toObject()),
      metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent') },
      accessLevel: req.body.accessLevel || "Everyone"
    });

    res.status(201).json({ message: "Audio saved successfully", audio: newLRAudio });
  } catch (err) {
    console.error("Error saving LRAudio:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// LIST
const getLRAudioByDetails = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;
    const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName, isDeleted: { $ne: true } };
    const lrAudios = await LRAudio.find(query);
    if (lrAudios.length === 0) return res.status(404).json({ message: "No Audios found." });

    const withUrls = await Promise.all(
      lrAudios.map(async (a) => {
        const signedUrl = a.s3Key ? await getFileFromS3(a.s3Key) : null;
        return { ...a.toObject(), signedUrl };
      })
    );
    res.status(200).json(withUrls);
  } catch (err) {
    console.error("Error fetching lrAudios records:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// UPDATE
const updateLRAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const audio = await LRAudio.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!audio) return res.status(404).json({ message: "Audio not found" });
    const oldAudio = audio.toObject();

    if (typeof req.body.audioDescription !== "undefined") audio.audioDescription = req.body.audioDescription;
    if (typeof req.body.dateAudioRecorded !== "undefined") audio.dateAudioRecorded = req.body.dateAudioRecorded;
    if (typeof req.body.leadReturnId !== "undefined") audio.leadReturnId = req.body.leadReturnId;
    if (typeof req.body.accessLevel !== "undefined") audio.accessLevel = req.body.accessLevel;

    if (typeof req.body.isLink !== "undefined") audio.isLink = toBool(req.body.isLink);

    if (audio.isLink) {
      audio.link = (req.body.link || "").trim() || null;
    } else {
      audio.link = null;
      if (req.file) {
        if (audio.s3Key) await deleteFromS3(audio.s3Key);
        const { key } = await uploadToS3({ filePath: req.file.path, userId: audio.caseNo, mimetype: req.file.mimetype });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        audio.s3Key = key;
        audio.originalName = req.file.originalname;
        audio.filename = req.file.filename;
      }
    }

    await audio.save();

    await createAuditLog({
      caseNo: audio.caseNo, caseName: audio.caseName,
      leadNo: audio.leadNo, leadName: audio.description,
      entityType: "LRAudio",
      entityId: `audio_${audio._id}`,
      action: "UPDATE",
      performedBy: { username: req.user?.name || "Unknown", role: req.user?.role || "Unknown" },
      oldValue: sanitizeForAudit(oldAudio),
      newValue: sanitizeForAudit(audio.toObject()),
      metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent'), changedFields: Object.keys(req.body) },
      accessLevel: audio.accessLevel || "Everyone"
    });

    res.json({ message: "Audio updated", audio });
  } catch (err) {
    console.error("Error updating LRAudio:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE
const deleteLRAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const audio = await LRAudio.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!audio) return res.status(404).json({ message: "Audio not found" });

    const oldAudio = audio.toObject();
    audio.isDeleted = true;
    audio.deletedAt = new Date();
    audio.deletedBy = req.user?.name || "Unknown";
    await audio.save();

    await createAuditLog({
      caseNo: audio.caseNo, caseName: audio.caseName,
      leadNo: audio.leadNo, leadName: audio.description,
      entityType: "LRAudio",
      entityId: `audio_${audio._id}`,
      action: "DELETE",
      performedBy: { username: req.user?.name || "Unknown", role: req.user?.role || "Unknown" },
      oldValue: sanitizeForAudit(oldAudio),
      newValue: null,
      metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent') },
      accessLevel: audio.accessLevel || "Everyone"
    });

    res.status(200).json({ message: "Audio deleted" });
  } catch (err) {
    console.error("Error deleting LRAudio:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const getAudioByCaseNo = async (req, res) => {
    try {
        const { caseNo } = req.params;
        const records = await LRAudio.find({ caseNo, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        const enriched = await Promise.all(
            records.map(async (a) => {
                const signedUrl = a.s3Key ? await getFileFromS3(a.s3Key) : null;
                return { ...a.toObject(), signedUrl };
            })
        );
        res.status(200).json(enriched);
    } catch (err) {
        console.error("Error fetching audio by caseNo:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { createLRAudio, getLRAudioByDetails, updateLRAudio, deleteLRAudio, getAudioByCaseNo };
