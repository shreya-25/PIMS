const LRVideo = require("../models/LRVideo");
const fs = require("fs");
const path = require("path");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");


// **Create a new LREnclosure entry with file upload support**
const createLRVideo = async (req, res) => {
    try {
      const isLink = req.body.isLink === "true";

      let filePath = null;
      let originalName = null;
      let filename = null;
      let s3Key = null;
  
      if (!isLink) {
        if (!req.file) return res.status(400).json({ error: 'No file received' });
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

      // Remove local file after upload
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
      }
        // Create a new LREnclosure document with the file reference
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
            videoDescription:req.body.videoDescription,
             accessLevel: req.body.accessLevel, 
            // fileId, // Store the GridFS file reference here
            isLink,
            link: isLink ? req.body.link : null,
            filePath,
            originalName,
            filename,
            s3Key,
        });

        // Save the document in MongoDB
        await newLRVideo.save();

        // Send one final response after successful save
        res.status(201).json({
            message: "Video saved successfully",
            video: newLRVideo
        });
    } catch (err) {
        console.error("Error saving LRVideo:", err.message);
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
    if (lrVideos.length === 0) return res.status(404).json({ message: "No Videos found." });

    // Generate signed URLs for S3 files
    const withUrls = await Promise.all(
      lrVideos.map(async (v) => {
        const signedUrl = v.s3Key ? await getFileFromS3(v.s3Key) : null;
        return { ...v.toObject(), signedUrl };
      })
    );

    res.status(200).json(withUrls);
  } catch (err) {
    console.error("Error fetching LRVideos:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateLRVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await LRVideo.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    // Handle new file upload & S3 replacement
    if (req.file) {
      if (video.s3Key) await deleteFromS3(video.s3Key);

      const { key } = await uploadToS3({
        filePath: req.file.path,
        userId: video.caseNo,
        mimetype: req.file.mimetype,
      });

      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      video.s3Key = key;
      video.originalName = req.file.originalname;
      video.filename = req.file.filename;
    }

    // Update other fields
    video.videoDescription = req.body.videoDescription;
    video.dateVideoRecorded = req.body.dateVideoRecorded;
    video.leadReturnId = req.body.leadReturnId;
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
