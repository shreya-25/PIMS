const LRAudio = require("../models/LRAudio");
const fs      = require("fs");
const path    = require("path");

// **Create a new LREnclosure entry with file upload support**
const createLRAudio = async (req, res) => {
    try {
      const isLink = req.body.isLink === "true";

      let filePath = null;
      let originalName = null;
      let filename = null;
  
      if (!isLink) {
        if (!req.file) return res.status(400).json({ error: 'No file received' });
        filePath = req.file.path;
        originalName = req.file.originalname;
        filename = req.file.filename;
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
            accessLevel: req.body.accessLevel, 
            // fileId, // Store the GridFS file reference here
            isLink,
            link: isLink ? req.body.link : null,
            filePath,
            originalName,
            filename
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

        res.status(200).json(lrAudios);
    } catch (err) {
        console.error("Error fetching lrAudios records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// **UPDATE** an existing audio entry (and optional file replacement)
const updateLRAudio = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = {
        leadReturnId: req.body.leadReturnId,
        audioDescription: req.body.audioDescription,
        dateAudioRecorded: req.body.dateAudioRecorded,
      };
  
      // if a new file was uploaded, delete the old one and store the new path
      if (req.file) {
        const existing = await LRAudio.findById(id);
        if (existing && existing.filePath) {
          fs.unlinkSync(path.resolve(existing.filePath));
        }
        updates.filePath     = req.file.path;
        updates.originalName = req.file.originalname;
        updates.filename     = req.file.filename;
      }
  
      const updated = await LRAudio.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) return res.status(404).json({ message: "Audio not found" });
      res.json({ message: "Audio updated", audio: updated });
    } catch (err) {
      console.error("Error updating LRAudio:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  };
  
  // **DELETE** an audio entry
  const deleteLRAudio = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("DELETE /api/lraudio/", id);
    
        const toDel = await LRAudio.findByIdAndDelete(id);
        if (!toDel) {
          console.log("→ not found");
          return res.status(404).json({ message: "Audio not found" });
        }
    
        // remove the file itself
        if (toDel.filePath) {
          fs.unlinkSync(path.resolve(toDel.filePath));
        }
    
        console.log("→ deleted");
        return res.status(200).json({ message: "Audio deleted" });
      } catch (err) {
        console.error("Error deleting LRAudio:", err);
        return res.status(500).json({ message: "Something went wrong" });
      }
  };

module.exports = { createLRAudio, getLRAudioByDetails, updateLRAudio, deleteLRAudio };
