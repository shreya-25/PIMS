const LRVideo = require("../models/LRVideo");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");

const createLRVideo = async (req, res) => {
  try {
    const isLink = req.body.isLink === true || req.body.isLink === "true" || req.body.isLink === 1 || req.body.isLink === "1";

    if (isLink && !req.body.link) {
      return res.status(400).json({ message: "Link is required when isLink is true." });
    }

    let filePath = null, originalName = null, filename = null, s3Key = null;

    if (!isLink && req.file) {
      filePath = req.file.path;
      originalName = req.file.originalname;
      filename = req.file.filename;

      const { error, key } = await uploadToS3({ filePath, userId: req.body.caseNo, mimetype: req.file.mimetype });
      if (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ message: "S3 upload failed", error: error.message });
      }
      s3Key = key;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Resolve ObjectId refs
    const refs = await resolveLeadReturnRefs({
      caseNo: req.body.caseNo,
      caseName: req.body.caseName,
      leadNo: req.body.leadNo,
      enteredBy: req.body.enteredBy,
    });

    const newLRVideo = new LRVideo({
      leadNo: req.body.leadNo,
      description: req.body.description,
      enteredBy: req.body.enteredBy,
      caseName: req.body.caseName,
      caseNo: req.body.caseNo,
      leadReturnId: req.body.leadReturnId,
      enteredDate: req.body.enteredDate,
      dateVideoRecorded: req.body.dateVideoRecorded,
      videoDescription: req.body.videoDescription,
      accessLevel: req.body.accessLevel,
      isLink,
      link: isLink ? req.body.link : null,
      filePath, originalName, filename, s3Key,
      // ObjectId refs
      caseId: refs.caseId,
      leadId: refs.leadId,
      leadReturnObjectId: refs.leadReturnObjectId,
      enteredByUserId: refs.enteredByUserId,
    });

    await newLRVideo.save();
    res.status(201).json({ message: "Video saved successfully", video: newLRVideo });
  } catch (err) {
    console.error("Error saving LRVideo:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const getLRVideoByDetails = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;
    const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName };
    const lrVideos = await LRVideo.find(query);

    const withUrls = await Promise.all(
      lrVideos.map(async (v) => {
        const signedUrl = v.s3Key ? await getFileFromS3(v.s3Key) : null;
        return { ...v.toObject(), signedUrl };
      })
    );
    return res.status(200).json(withUrls);
  } catch (err) {
    console.error("Error fetching LRVideos:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateLRVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await LRVideo.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const wantsLink = req.body.isLink === true || req.body.isLink === "true" || req.body.isLink === 1 || req.body.isLink === "1";

    if (wantsLink) {
      if (!req.body.link) return res.status(400).json({ message: "Link is required when isLink is true." });
      if (video.s3Key) { try { await deleteFromS3(video.s3Key); } catch (e) { console.warn("Failed to delete old S3 object:", e?.message); } }
      video.isLink = true;
      video.link = req.body.link;
      video.s3Key = null; video.filePath = null; video.filename = null; video.originalName = null;
    } else {
      video.isLink = false;
      video.link = null;
      if (req.file) {
        if (video.s3Key) { try { await deleteFromS3(video.s3Key); } catch (e) { console.warn("Failed to delete old S3 object:", e?.message); } }
        const { error, key } = await uploadToS3({ filePath: req.file.path, userId: video.caseNo, mimetype: req.file.mimetype });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        if (error) return res.status(500).json({ message: "S3 upload failed", error: error.message });
        video.s3Key = key;
        video.originalName = req.file.originalname;
        video.filename = req.file.filename;
      }
    }

    if (typeof req.body.videoDescription !== "undefined") video.videoDescription = req.body.videoDescription;
    if (typeof req.body.dateVideoRecorded !== "undefined") video.dateVideoRecorded = req.body.dateVideoRecorded;
    if (typeof req.body.leadReturnId !== "undefined") video.leadReturnId = req.body.leadReturnId;
    if (typeof req.body.accessLevel !== "undefined") video.accessLevel = req.body.accessLevel || "Everyone";

    await video.save();
    res.json({ message: "Video updated", video });
  } catch (err) {
    console.error("Error updating LRVideo:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const deleteLRVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await LRVideo.findByIdAndDelete(id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    if (video.s3Key) await deleteFromS3(video.s3Key);
    res.json({ message: "Video deleted" });
  } catch (err) {
    console.error("Error deleting LRVideo:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { createLRVideo, getLRVideoByDetails, updateLRVideo, deleteLRVideo };
