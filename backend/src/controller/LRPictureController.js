const LRPicture = require("../models/LRPicture");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");
const { createAuditLog, sanitizeForAudit } = require("../services/auditService");

const createLRPicture = async (req, res) => {
  try {
    const isLink = String(req.body.isLink) === "true";
    const accessLevel = req.body.accessLevel || "Everyone";

    let originalName = null, filename = null, s3Key = null, link = null;

    if (isLink) {
      link = (req.body.link || "").trim() || null;
    } else if (req.file) {
      const { error, key } = await uploadToS3({ filePath: req.file.path, userId: req.user?.id || "anonymous", mimetype: req.file.mimetype });
      if (error) return res.status(500).json({ message: "S3 upload failed", error: error.message });
      s3Key = key;
      originalName = req.file.originalname;
      filename = req.file.filename;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    // Resolve ObjectId refs
    const refs = await resolveLeadReturnRefs({
      caseNo: req.body.caseNo,
      caseName: req.body.caseName,
      leadNo: req.body.leadNo,
      enteredBy: req.body.enteredBy,
    });

    const newLRPicture = new LRPicture({
      leadNo: req.body.leadNo,
      description: req.body.description,
      enteredBy: req.body.enteredBy,
      caseName: req.body.caseName,
      caseNo: req.body.caseNo,
      leadReturnId: req.body.leadReturnId,
      enteredDate: req.body.enteredDate,
      datePictureTaken: req.body.datePictureTaken,
      pictureDescription: req.body.pictureDescription,
      originalName, filename, s3Key, accessLevel, isLink, link,
      // ObjectId refs
      caseId: refs.caseId,
      leadId: refs.leadId,
      leadReturnObjectId: refs.leadReturnObjectId,
      enteredByUserId: refs.enteredByUserId,
    });

    await newLRPicture.save();

    await createAuditLog({
      caseNo: req.body.caseNo, caseName: req.body.caseName,
      leadNo: req.body.leadNo, leadName: req.body.description,
      entityType: "LRPicture",
      entityId: `picture_${newLRPicture._id}`,
      action: "CREATE",
      performedBy: { username: req.user?.name || req.body.enteredBy || "Unknown", role: req.user?.role || "Unknown" },
      oldValue: null,
      newValue: sanitizeForAudit(newLRPicture.toObject()),
      metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent') },
      accessLevel: accessLevel
    });

    return res.status(201).json({ message: "Saved successfully", picture: newLRPicture });
  } catch (err) {
    console.error("Error creating LRPicture:", err.message);
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

const getLRPictureByDetails = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;
    const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName, isDeleted: { $ne: true } };
    const lrPictures = await LRPicture.find(query);

    if (!lrPictures || lrPictures.length === 0) return res.status(200).json([]);

    const picturesWithUrls = await Promise.all(
      lrPictures.map(async (pic) => {
        let signedUrl = null;
        if (pic.s3Key) {
          try { signedUrl = await getFileFromS3(pic.s3Key); }
          catch (e) { console.warn(`Failed to sign S3 key ${pic.s3Key}:`, e?.message); }
        }
        return { ...pic.toObject(), signedUrl };
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

    const pic = await LRPicture.findOne({
      leadNo: Number(leadNo), description: leadName, caseNo, caseName, leadReturnId, pictureDescription: oldDesc,
      isDeleted: { $ne: true },
    });
    if (!pic) return res.status(404).json({ message: "Picture not found" });

    const oldPicture = pic.toObject();

    if (req.file) {
      if (pic.s3Key) await deleteFromS3(pic.s3Key);
      const { key } = await uploadToS3({ filePath: req.file.path, userId: caseNo, mimetype: req.file.mimetype });
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      pic.s3Key = key;
      pic.originalName = req.file.originalname;
      pic.filename = req.file.filename;
    }

    pic.leadReturnId = req.body.leadReturnId;
    pic.datePictureTaken = req.body.datePictureTaken;
    pic.pictureDescription = req.body.pictureDescription;
    pic.enteredBy = req.body.enteredBy;
    if (req.body.accessLevel !== undefined) pic.accessLevel = req.body.accessLevel || "Everyone";

    await pic.save();

    await createAuditLog({
      caseNo: pic.caseNo, caseName: pic.caseName,
      leadNo: pic.leadNo, leadName: pic.description,
      entityType: "LRPicture",
      entityId: `picture_${pic._id}`,
      action: "UPDATE",
      performedBy: { username: req.user?.name || "Unknown", role: req.user?.role || "Unknown" },
      oldValue: sanitizeForAudit(oldPicture),
      newValue: sanitizeForAudit(pic.toObject()),
      metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent'), changedFields: Object.keys(req.body) },
      accessLevel: pic.accessLevel || "Everyone"
    });

    return res.json(pic);
  } catch (err) {
    console.error("Error updating LRPicture:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const deleteLRPicture = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName, leadReturnId, pictureDescription } = req.params;

    const pic = await LRPicture.findOne({
      leadNo: Number(leadNo), description: leadName, caseNo, caseName, leadReturnId, pictureDescription,
      isDeleted: { $ne: true }
    });
    if (!pic) return res.status(404).json({ message: "Picture not found" });

    const oldPicture = pic.toObject();
    pic.isDeleted = true;
    pic.deletedAt = new Date();
    pic.deletedBy = req.user?.name || "Unknown";
    await pic.save();

    await createAuditLog({
      caseNo: pic.caseNo, caseName: pic.caseName,
      leadNo: pic.leadNo, leadName: pic.description,
      entityType: "LRPicture",
      entityId: `picture_${pic._id}`,
      action: "DELETE",
      performedBy: { username: req.user?.name || "Unknown", role: req.user?.role || "Unknown" },
      oldValue: sanitizeForAudit(oldPicture),
      newValue: null,
      metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent') },
      accessLevel: pic.accessLevel || "Everyone"
    });

    return res.json({ message: "Picture deleted successfully" });
  } catch (err) {
    console.error("Error deleting LRPicture:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { createLRPicture, getLRPictureByDetails, updateLRPicture, deleteLRPicture };
