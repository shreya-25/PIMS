const LREnclosure = require("../models/LREnclosure");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");


// **Create a new LREnclosure entry with file upload support**
const createLREnclosure = async (req, res) => {
    try {
      const isLink = req.body.isLink === "true"; // Handle string from formData
      const accessLevel = req.body.accessLevel || "Everyone";

      let filePath = null;
      let originalName = null;
      let filename = null;
      let s3Key = null;
  
      if (!isLink) {
        if (!req.file) {
          return res.status(400).json({ error: 'No file received for non-link upload' });
        }
  
        // File fields (for disk storage)
        filePath = req.file.path;
        originalName = req.file.originalname;
        filename = req.file.filename;
      
      const { error, key } = await uploadToS3({
                filePath,
                userId: req.body.caseNo,
                mimetype: req.file.mimetype,
            });

            if (error) {
                return res.status(500).json({ message: "S3 upload failed", error: error.message });
            }

            s3Key = key;
             if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }

        // Create a new LREnclosure document with the file reference
        const newLREnclosure = new LREnclosure({
            leadNo: req.body.leadNo,
            description: req.body.description,
            assignedTo: req.body.assignedTo ? JSON.parse(req.body.assignedTo) : {},
            assignedBy: req.body.assignedBy ? JSON.parse(req.body.assignedBy) : {},
            enteredBy: req.body.enteredBy,
            caseName: req.body.caseName,
            caseNo: req.body.caseNo,
            leadReturnId: req.body.leadReturnId,
            enteredDate: req.body.enteredDate,
            type: req.body.type,
            enclosureDescription: req.body.enclosureDescription,
            // fileId, // Store the GridFS file reference here
            filePath: isLink ? "link-only" : filePath,
            originalName: originalName,
            filename: filename,
            s3Key,
            accessLevel,
            isLink,
            link: isLink ? req.body.link : null,
        });

        // Save the document in MongoDB
        await newLREnclosure.save();

        // Send one final response after successful save
        return res.status(201).json({
            message: "Enclosure created successfully",
            enclosure: newLREnclosure
        });
    } catch (err) {
        console.error("Error creating LREnclosure:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};


// **Get LREnclosure records using leadNo, leadName (description), caseNo, caseName, and leadReturnId**
const getLREnclosureByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo: caseNo,
            caseName: caseName,
        };

        // const lrEnclosures = await LREnclosure.find(query).populate("fileId");
        const lrEnclosures = await LREnclosure.find(query);

        if (lrEnclosures.length === 0) {
            return res.status(404).json({ message: "No enclosures found." });
        }

        const enclosuresWithUrls = await Promise.all(
      lrEnclosures.map(async (enc) => {
        const signedUrl = enc.s3Key ? await getFileFromS3(enc.s3Key) : null;
        return { ...enc.toObject(), signedUrl };
      })
    );


        res.status(200).json(enclosuresWithUrls);
    } catch (err) {
        console.error("Error fetching LREnclosure records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const updateLREnclosure = async (req, res) => {
    try {
      const {
        leadNo, leadName, caseNo, caseName,
        leadReturnId, enclosureDescription: oldDesc
      } = req.params;
  
      // 1) Find the existing document
      const enc = await LREnclosure.findOne({
        leadNo: Number(leadNo),
        description: leadName,
        caseNo, caseName,
        leadReturnId,
        enclosureDescription: oldDesc
      });
      if (!enc) return res.status(404).json({ message: "Enclosure not found" });
  
     if (req.file) {
      // Delete old file from S3 if it exists
      if (enc.s3Key) {
        await deleteFromS3(enc.s3Key);
      }

      // Upload new file to S3
      const { key } = await uploadToS3({
        filePath: req.file.path,
        userId: caseNo, // Use caseNo or any identifier
        mimetype: req.file.mimetype,
      });

      // Remove local temp file (uploaded by multer)
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      // Update DB fields with new S3 file info
      enc.s3Key = key;
      enc.originalName = req.file.originalname;
      enc.filename = req.file.filename;
    }

    // 3️⃣ Update other fields
    enc.leadReturnId = req.body.leadReturnId;
    enc.enteredDate = req.body.enteredDate;
    enc.type = req.body.type;
    enc.enclosureDescription = req.body.enclosureDescription;
    enc.enteredBy = req.body.enteredBy;

    // 4️⃣ Save updated record
    await enc.save();

    res.json(enc);
  } catch (err) {
    console.error("Error updating LREnclosure:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
  
  // Delete an enclosure by composite key + description
const deleteLREnclosure = async (req, res) => {
  try {
    const {
      leadNo,
      leadName,
      caseNo,
      caseName,
      leadReturnId,
      enclosureDescription,
    } = req.params;

    const enc = await LREnclosure.findOneAndDelete({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
      leadReturnId,
      enclosureDescription,
    });
    if (!enc) {
      return res.status(404).json({ message: "Enclosure not found" });
    }

    // Remove the file on disk (if present)
    if (enc.s3Key) {
      try {
        await deleteFromS3(enc.s3Key);
      } catch (s3Err) {
        console.warn(`Could not delete file from S3: ${s3Err.message}`);
      }
    }

    return res.json({ message: "Enclosure deleted successfully" });
  } catch (err) {
    console.error("Error deleting LREnclosure:", err);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};


module.exports = { createLREnclosure, getLREnclosureByDetails, updateLREnclosure, deleteLREnclosure };