const LRAudio = require("../models/LRAudio");
const fs      = require("fs");
const path    = require("path");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");


// **Create a new LREnclosure entry with file upload support**
const createLRAudio = async (req, res) => {
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
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }

        // Create a new LREnclosure document with the file reference
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
            audioDescription:req.body.audioDescription,
            accessLevel: req.body.accessLevel || "Everyone",
            // fileId, // Store the GridFS file reference here
            isLink,
            link: isLink ? req.body.link : null,
            filePath,
            originalName,
            filename,
            s3Key,
        });

        // Save the document in MongoDB
        await newLRAudio.save();

        // Send one final response after successful save
        res.status(201).json({
            message: "Audio saved successfully",
            audio: newLRAudio
        });
    } catch (err) {
        console.error("Error saving LRAudio:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};


// **Get LREnclosure records using leadNo, leadName (description), caseNo, caseName, and leadReturnId**
const getLRAudioByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo: caseNo,
            caseName: caseName,
        };

        // const lrEnclosures = await LREnclosure.find(query).populate("fileId");
        const lrAudios = await LRAudio.find(query);

        if (lrAudios.length === 0) {
            return res.status(404).json({ message: "No Audios found." });
        }

        const withUrls = await Promise.all(
      lrAudios.map(async (a) => {
        const signedUrl = a.s3Key ? await getFileFromS3(a.s3Key) : null;
        return { ...a.toObject(), signedUrl };
      })
    );

    res.status(200).json(withUrls);
    } catch (err) {
        console.error("Error fetching lrAudios records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// **UPDATE** an existing audio entry (and optional file replacement)
const updateLRAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const audio = await LRAudio.findById(id);
    if (!audio) return res.status(404).json({ message: "Audio not found" });

    if (req.file) {
      if (audio.s3Key) await deleteFromS3(audio.s3Key);
      const { key } = await uploadToS3({ filePath: req.file.path, userId: audio.caseNo, mimetype: req.file.mimetype });
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      audio.s3Key = key;
      audio.originalName = req.file.originalname;
      audio.filename = req.file.filename;
    }

    audio.audioDescription = req.body.audioDescription;
    audio.dateAudioRecorded = req.body.dateAudioRecorded;
    audio.leadReturnId = req.body.leadReturnId;
    await audio.save();

    res.json({ message: "Audio updated", audio });
  } catch (err) {
    console.error("Error updating LRAudio:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
  
  // **DELETE** an audio entry
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
