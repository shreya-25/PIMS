const LREnclosure = require("../models/LREnclosure");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");

// ---------- helpers ----------
const one = (v) => Array.isArray(v) ? v[0] : v;
const asString = (v) => (v == null ? "" : String(v));
const asBool = (v) => v === true || v === "true" || v === 1 || v === "1";
const safeParseJSON = (v) => {
  const val = one(v);
  if (!val) return undefined;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return undefined; }
  }
  if (typeof val === "object") return val;
  return undefined;
};
// --------------------------------

// **Create a new LREnclosure entry with file upload support**
const createLREnclosure = async (req, res) => {
  try {
    const uploadMode = asString(one(req.body.uploadMode)) || "none";
    const linkRaw = asString(one(req.body.link)).trim();

    // accept either explicit isLink or uploadMode === 'link'
    const isLinkRequested = asBool(one(req.body.isLink)) || uploadMode === "link";
    const isLink = isLinkRequested && !!linkRaw;

    const accessLevel = asString(one(req.body.accessLevel)) || "Everyone";

    let originalName = null;
    let filename = null;
    let s3Key = null;

    if (req.file) {
      const { error, key } = await uploadToS3({
        filePath: req.file.path,
        userId: asString(one(req.body.caseNo)),
        mimetype: req.file.mimetype,
      });
      if (error) {
        return res.status(500).json({ message: "S3 upload failed", error: error.message });
      }
      s3Key = key;
      originalName = req.file.originalname;
      filename = req.file.filename;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    const newLREnclosure = new LREnclosure({
      leadNo: Number(one(req.body.leadNo)),
      description: asString(one(req.body.description)),
      assignedTo: safeParseJSON(req.body.assignedTo) || {},
      assignedBy: safeParseJSON(req.body.assignedBy) || {},
      enteredBy: asString(one(req.body.enteredBy)),
      caseName: asString(one(req.body.caseName)),
      caseNo: asString(one(req.body.caseNo)),
      leadReturnId: asString(one(req.body.leadReturnId)),
      enteredDate: asString(one(req.body.enteredDate)),
      type: asString(one(req.body.type)),
      enclosureDescription: asString(one(req.body.enclosureDescription)),

      originalName,
      filename,
      s3Key,
      accessLevel,

      isLink,
      link: isLink ? linkRaw : null,
    });

    await newLREnclosure.save();
    return res.status(201).json({ message: "Enclosure created successfully", enclosure: newLREnclosure });
  } catch (err) {
    console.error("Error creating LREnclosure:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// **Get LREnclosure records using leadNo, leadName (description), caseNo, caseName**
const getLREnclosureByDetails = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;
    const query = {
      leadNo: Number(leadNo),
      description: leadName,
      caseNo: caseNo,
      caseName: caseName,
    };

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
    console.error("Error fetching LREnclosure records:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateLREnclosure = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName, leadReturnId } = req.params;

    const enc = await LREnclosure.findOne({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo, caseName,
      leadReturnId
    });
    if (!enc) return res.status(404).json({ message: "Enclosure not found" });

    // Replace file if a new one was sent
    if (req.file) {
      if (enc.s3Key) {
        try { await deleteFromS3(enc.s3Key); } catch {}
      }
      const { key } = await uploadToS3({
        filePath: req.file.path,
        userId: caseNo,
        mimetype: req.file.mimetype,
      });
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      enc.s3Key = key;
      enc.originalName = req.file.originalname;
      enc.filename = req.file.filename;
    }

    // Link handling
    const uploadMode = asString(one(req.body.uploadMode)) || "none";
    const linkRaw = asString(one(req.body.link)).trim();

    if (uploadMode === "link") {
      enc.isLink = !!linkRaw;
      enc.link = enc.isLink ? linkRaw : null;
    } else if (uploadMode === "none" || uploadMode === "file") {
      enc.isLink = false;
      enc.link = null;
    }

    // Other fields
    enc.leadReturnId = asString(one(req.body.leadReturnId)) || enc.leadReturnId;
    enc.enteredDate = asString(one(req.body.enteredDate)) || enc.enteredDate;
    enc.type = asString(one(req.body.type)) || enc.type;
    enc.enclosureDescription = asString(one(req.body.enclosureDescription)) || enc.enclosureDescription;
    enc.enteredBy = asString(one(req.body.enteredBy)) || enc.enteredBy;

    await enc.save();
    res.json(enc);
  } catch (err) {
    console.error("Error updating LREnclosure:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Delete an enclosure by composite key
const deleteLREnclosure = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName, leadReturnId } = req.params;

    const enc = await LREnclosure.findOneAndDelete({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
      leadReturnId
    });
    if (!enc) return res.status(404).json({ message: "Enclosure not found" });

    if (enc.s3Key) {
      try { await deleteFromS3(enc.s3Key); }
      catch (s3Err) { console.warn(`Could not delete file from S3: ${s3Err.message}`); }
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
