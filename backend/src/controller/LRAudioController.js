// controllers/lraudio.controller.js
const LRAudio = require("../models/LRAudio");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");

const toBool = (v) => v === true || v === "true" || v === "1";

// CREATE (file optional)
const createLRAudio = async (req, res) => {
  try {
    const isLink = toBool(req.body.isLink);
    let filePath = null, originalName = null, filename = null, s3Key = null;
    let link = isLink ? (req.body.link || "").trim() || null : null;

    // Only upload if a file was actually sent
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
      filePath = null; // no need to store local path after upload
    }

    const newLRAudio = new LRAudio({
      leadNo: req.body.leadNo,
      description: req.body.description,
      assignedTo: req.body.assignedTo ? JSON.parse(req.body.assignedTo) : {},
      assignedBy: req.body.assignedBy ? JSON.parse(req.body.assignedBy) : {},
      enteredBy: req.body.enteredBy,
      caseName: req.body.caseName,
      caseNo: req.body.caseNo,
      leadReturnId: req.body.leadReturnId,
      enteredDate: req.body.enteredDate,
      dateAudioRecorded: req.body.dateAudioRecorded,
      audioDescription: req.body.audioDescription,
      accessLevel: req.body.accessLevel || "Everyone",

      isLink,
      link,
      originalName,
      filename,
      s3Key,
      filePath, // null after upload (kept for compatibility)
    });

    await newLRAudio.save();
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

    const query = {
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
    };

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

// UPDATE (link/file toggles supported; file optional)
const updateLRAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const audio = await LRAudio.findById(id);
    if (!audio) return res.status(404).json({ message: "Audio not found" });

    // Core fields
    if (typeof req.body.audioDescription !== "undefined") audio.audioDescription = req.body.audioDescription;
    if (typeof req.body.dateAudioRecorded !== "undefined") audio.dateAudioRecorded = req.body.dateAudioRecorded;
    if (typeof req.body.leadReturnId !== "undefined") audio.leadReturnId = req.body.leadReturnId;
    if (typeof req.body.accessLevel !== "undefined") audio.accessLevel = req.body.accessLevel;

    // Link/file mode
    if (typeof req.body.isLink !== "undefined") {
      audio.isLink = toBool(req.body.isLink);
    }

    if (audio.isLink) {
      // Link mode: update link and (optionally) keep existing S3 file, or you can delete it:
      audio.link = (req.body.link || "").trim() || null;
      // If you want to drop previously uploaded file when switching to link, uncomment:
      // if (audio.s3Key) { await deleteFromS3(audio.s3Key); audio.s3Key = null; audio.filename = null; audio.originalName = null; }
    } else {
      audio.link = null; // not in link mode
      // Replace file only if a new file was uploaded
      if (req.file) {
        if (audio.s3Key) await deleteFromS3(audio.s3Key);
        const { key } = await uploadToS3({
          filePath: req.file.path,
          userId: audio.caseNo,
          mimetype: req.file.mimetype,
        });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        audio.s3Key = key;
        audio.originalName = req.file.originalname;
        audio.filename = req.file.filename;
      }
    }

    await audio.save();
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
    const audio = await LRAudio.findByIdAndDelete(id);
    if (!audio) return res.status(404).json({ message: "Audio not found" });
    if (audio.s3Key) await deleteFromS3(audio.s3Key);
    res.status(200).json({ message: "Audio deleted" });
  } catch (err) {
    console.error("Error deleting LRAudio:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { createLRAudio, getLRAudioByDetails, updateLRAudio, deleteLRAudio };
