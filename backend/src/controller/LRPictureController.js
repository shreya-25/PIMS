const LRPicture = require("../models/LRPicture");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");

const createLRPicture = async (req, res) => {
  try {
    const isLink = String(req.body.isLink) === "true";
    const accessLevel = req.body.accessLevel || "Everyone";

    let originalName = null;
    let filename = null;
    let s3Key = null;
    let link = null;

    if (isLink) {
      // Accept empty link as well (user skipped)
      link = (req.body.link || "").trim() || null;
    } else if (req.file) {
      // File path (optional): upload if present, otherwise allow null
      const { error, key } = await uploadToS3({
        filePath: req.file.path,
        userId: req.user?.id || "anonymous",
        mimetype: req.file.mimetype,
      });
      if (error) return res.status(500).json({ message: "S3 upload failed", error: error.message });

      s3Key = key;
      originalName = req.file.originalname;
      filename = req.file.filename;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    const newLRPicture = new LRPicture({
      leadNo: req.body.leadNo,
      description: req.body.description,
      assignedTo: req.body.assignedTo ? JSON.parse(req.body.assignedTo) : {},
      assignedBy: req.body.assignedBy ? JSON.parse(req.body.assignedBy) : {},
      enteredBy: req.body.enteredBy,
      caseName: req.body.caseName,
      caseNo: req.body.caseNo,
      leadReturnId: req.body.leadReturnId,
      enteredDate: req.body.enteredDate,
      datePictureTaken: req.body.datePictureTaken,
      pictureDescription: req.body.pictureDescription,
      originalName,
      filename,
      s3Key,            // may be null
      accessLevel,
      isLink,           // may be true or false
      link,             // may be null
    });

    await newLRPicture.save();
    return res.status(201).json({ message: "Saved successfully", picture: newLRPicture });
  } catch (err) {
    console.error("Error creating LRPicture:", err.message);
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};




const getLRPictureByDetails = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;

    const query = {
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
    };

    const lrPictures = await LRPicture.find(query);

    // Prefer returning an empty array instead of 404
    if (!lrPictures || lrPictures.length === 0) {
      return res.status(200).json([]); // <-- changed from 404
    }

    const picturesWithUrls = await Promise.all(
      lrPictures.map(async (pic) => {
        let signedUrl = null;
        // Only try to sign when we actually have a key
        if (pic.s3Key) {
          try {
            signedUrl = await getFileFromS3(pic.s3Key);
          } catch (e) {
            console.warn(`Failed to sign S3 key ${pic.s3Key}:`, e?.message);
            signedUrl = null;
          }
        }
        return {
          ...pic.toObject(),
          signedUrl,         // may be null for link-only rows
        };
      })
    );

    res.status(200).json(picturesWithUrls);
  } catch (err) {
    console.error("Error fetching lrPictures records:", err?.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};



const updateLRPicture = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName, leadReturnId, pictureDescription: oldDesc } = req.params;

    // 1️⃣ Find existing picture record in DB
    const pic = await LRPicture.findOne({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
      leadReturnId,
      pictureDescription: oldDesc,
    });

    if (!pic) return res.status(404).json({ message: "Picture not found" });

    // 2️⃣ If a new file is uploaded, delete old file from S3 and upload new one
    if (req.file) {
      // Delete old file from S3 if it exists
      if (pic.s3Key) {
        await deleteFromS3(pic.s3Key);
      }

      // Upload new file to S3
      const { key } = await uploadToS3({
        filePath: req.file.path,
        userId: caseNo, // You can use caseNo or any identifier
        mimetype: req.file.mimetype,
      });

      // Remove local temp file (if stored temporarily by multer)
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      // Update DB fields with new S3 file info
      pic.s3Key = key;
      pic.originalName = req.file.originalname;
      pic.filename = req.file.filename;
    }

    // 3️⃣ Update other fields
    pic.leadReturnId = req.body.leadReturnId;
    pic.datePictureTaken = req.body.datePictureTaken;
    pic.pictureDescription = req.body.pictureDescription;
    pic.enteredBy = req.body.enteredBy;

    // 4️⃣ Save updated record
    await pic.save();

    return res.json(pic);
  } catch (err) {
    console.error("Error updating LRPicture:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
  
  

  const deleteLRPicture = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName, leadReturnId, pictureDescription } = req.params;

    // 1️⃣ Find and delete the picture record in DB
    const pic = await LRPicture.findOneAndDelete({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
      leadReturnId,
      pictureDescription,
    });

    if (!pic) return res.status(404).json({ message: "Picture not found" });

    // 2️⃣ Delete file from S3 if fileKey exists
    if (pic.s3Key) {
      const deleted = await deleteFromS3(pic.s3Key);
      if (!deleted) console.warn(`Failed to delete file from S3: ${pic.s3Key}`);
    }

    return res.json({ message: "Picture deleted successfully" });
  } catch (err) {
    console.error("Error deleting LRPicture:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { createLRPicture, getLRPictureByDetails, updateLRPicture, deleteLRPicture  };