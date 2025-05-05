const LRVideo = require("../models/LRVideo");
const fs = require("fs");
const path = require("path");

// **Create a new LREnclosure entry with file upload support**
const createLRVideo = async (req, res) => {
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
            // fileId, // Store the GridFS file reference here
            filePath: fileLocation,               // Save file path on disk
            originalName: req.file.originalname,  // Save original file name
            filename: req.file.filename           // Save the generated filename on disk
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

        // const lrEnclosures = await LREnclosure.find(query).populate("fileId");
        const lrVideos = await LRVideo.find(query);

        if (lrVideos.length === 0) {
            return res.status(404).json({ message: "No Videos found." });
        }

        res.status(200).json(lrVideos);
    } catch (err) {
        console.error("Error fetching lrVideos records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const updateLRVideo = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = {
        leadReturnId:    req.body.leadReturnId,
        videoDescription: req.body.videoDescription,
        dateVideoRecorded: req.body.dateVideoRecorded,
      };
  
      // if a new file was uploaded, delete the old one and store the new path
      if (req.file) {
        const existing = await LRVideo.findById(id);
        if (existing && existing.filePath) {
          fs.unlinkSync(path.resolve(existing.filePath));
        }
        updates.filePath     = req.file.path;
        updates.originalName = req.file.originalname;
        updates.filename     = req.file.filename;
      }
  
      const updated = await LRVideo.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) return res.status(404).json({ message: "Video not found" });
  
      res.json({ message: "Video updated", video: updated });
    } catch (err) {
      console.error("Error updating LRVideo:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  };
  
  // **DELETE** a video entry
  const deleteLRVideo = async (req, res) => {
    try {
      const { id } = req.params;
      const toDel = await LRVideo.findByIdAndDelete(id);
      if (!toDel) return res.status(404).json({ message: "Video not found" });
  
      // delete file from disk
      if (toDel.filePath) {
        fs.unlinkSync(path.resolve(toDel.filePath));
      }
  
      res.json({ message: "Video deleted" });
    } catch (err) {
      console.error("Error deleting LRVideo:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  };

module.exports = { createLRVideo, getLRVideoByDetails,
    updateLRVideo,
    deleteLRVideo, };
