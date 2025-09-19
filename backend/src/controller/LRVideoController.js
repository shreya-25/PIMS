// controllers/lrVideoController.js
const LRVideo = require("../models/LRVideo");
const fs = require("fs");
const path = require("path");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");

const createLRVideo = async (req, res) => {
  try {
    const isLink =
      req.body.isLink === true ||
      req.body.isLink === "true" ||
      req.body.isLink === 1 ||
      req.body.isLink === "1";

    // If link mode, ensure link is provided
    if (isLink && !req.body.link) {
      return res.status(400).json({ message: "Link is required when isLink is true." });
    }

    let filePath = null;
    let originalName = null;
    let filename = null;
    let s3Key = null;

    // If not link mode and a file was actually uploaded → push to S3
    if (!isLink && req.file) {
      filePath = req.file.path;
      originalName = req.file.originalname;
      filename = req.file.filename;

      const { error, key } = await uploadToS3({
        filePath,
        userId: req.body.caseNo,
        mimetype: req.file.mimetype,
      });
      if (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ message: "S3 upload failed", error: error.message });
      }

      s3Key = key;

      // cleanup local temp file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const newLRVideo = new LRVideo({
      leadNo: req.body.leadNo,
      description: req.body.description,
      assignedTo: req.body.assignedTo ? JSON.parse(req.body.assignedTo) : {},
      assignedBy: req.body.assignedBy ? JSON.parse(req.body.assignedBy) : {},
      enteredBy: req.body.enteredBy,
      caseName: req.body.caseName,
      caseNo: req.body.caseNo,
      leadReturnId: req.body.leadReturnId,
      enteredDate: req.body.enteredDate,
      dateVideoRecorded: req.body.dateVideoRecorded,
      videoDescription: req.body.videoDescription,

      // keep if still using access control; otherwise remove
      accessLevel: req.body.accessLevel,

      isLink,
      link: isLink ? req.body.link : null,

      filePath,       // may be null
      originalName,   // may be null
      filename,       // may be null
      s3Key,          // may be null
    });

    await newLRVideo.save();

    res.status(201).json({
      message: "Video saved successfully",
      video: newLRVideo,
    });
  } catch (err) {
    console.error("Error saving LRVideo:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};



// **Get LREnclosure records using leadNo, leadName (description), caseNo, caseName, and leadReturnId**
const getLRVideoByDetails = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;

    const query = {
      leadNo: Number(leadNo),
      description: leadName,
      caseNo: caseNo,
      caseName: caseName,
    };

    const lrVideos = await LRVideo.find(query);

    const withUrls = await Promise.all(
      lrVideos.map(async (v) => {
        const signedUrl = v.s3Key ? await getFileFromS3(v.s3Key) : null;
        return { ...v.toObject(), signedUrl };
      })
    );

    return res.status(200).json(withUrls); // 200 with [] if none
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

    // Parse isLink toggle from body (may be string or boolean)
    const wantsLink =
      req.body.isLink === true ||
      req.body.isLink === "true" ||
      req.body.isLink === 1 ||
      req.body.isLink === "1";

    // 1) If switching to link mode
    if (wantsLink) {
      if (!req.body.link) {
        return res.status(400).json({ message: "Link is required when isLink is true." });
      }

      // If we had a file before, optionally clean it up in S3
      if (video.s3Key) {
        try {
          await deleteFromS3(video.s3Key);
        } catch (e) {
          console.warn("Failed to delete old S3 object:", e?.message);
        }
      }

      video.isLink = true;
      video.link = req.body.link;
      video.s3Key = null;
      video.filePath = null;
      video.filename = null;
      video.originalName = null;
    } else {
      // 2) File mode (may or may not include a new file)
      video.isLink = false;
      video.link = null;

      if (req.file) {
        // Replace existing S3 object if present
        if (video.s3Key) {
          try {
            await deleteFromS3(video.s3Key);
          } catch (e) {
            console.warn("Failed to delete old S3 object:", e?.message);
          }
        }

        const { error, key } = await uploadToS3({
          filePath: req.file.path,
          userId: video.caseNo,
          mimetype: req.file.mimetype,
        });

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (error) {
          return res.status(500).json({ message: "S3 upload failed", error: error.message });
        }

        video.s3Key = key;
        video.originalName = req.file.originalname;
        video.filename = req.file.filename;
      }
      // else: metadata-only update in file mode; keep existing s3Key as is
    }

    // 3) Common metadata updates
    if (typeof req.body.videoDescription !== "undefined")
      video.videoDescription = req.body.videoDescription;
    if (typeof req.body.dateVideoRecorded !== "undefined")
      video.dateVideoRecorded = req.body.dateVideoRecorded;
    if (typeof req.body.leadReturnId !== "undefined")
      video.leadReturnId = req.body.leadReturnId;

    // If you’re no longer using accessLevel, remove this line:
    if (typeof req.body.accessLevel !== "undefined")
      video.accessLevel = req.body.accessLevel || "Everyone";

    await video.save();
    res.json({ message: "Video updated", video });
  } catch (err) {
    console.error("Error updating LRVideo:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

  
  // **DELETE** a video entry
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
module.exports = { createLRVideo, getLRVideoByDetails,
    updateLRVideo,
    deleteLRVideo, };