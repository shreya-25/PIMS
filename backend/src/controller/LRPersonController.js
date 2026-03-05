const LRPerson = require("../models/LRPerson");
const { createAuditLog, sanitizeForAudit } = require("../services/auditService");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");

// Validation function to check if at least one meaningful field is filled
const isPersonRecordValid = (data) => {
    if (data.firstName?.trim()) return true;
    if (data.lastName?.trim()) return true;
    if (data.alias?.trim()) return true;
    if (data.businessName?.trim()) return true;
    if (data.personType?.trim()) return true;
    const address = data.address || {};
    if (address.street1?.trim()) return true;
    if (address.street2?.trim()) return true;
    if (address.building?.trim()) return true;
    if (address.apartment?.trim()) return true;
    if (address.city?.trim()) return true;
    if (address.state?.trim()) return true;
    if (address.zipCode?.trim()) return true;
    if (data.sex?.trim()) return true;
    if (data.race?.trim()) return true;
    if (data.ethnicity?.trim()) return true;
    if (data.skinTone?.trim()) return true;
    if (data.eyeColor?.trim()) return true;
    if (data.glasses?.trim()) return true;
    if (data.hairColor?.trim()) return true;
    if (data.tattoo?.trim()) return true;
    if (data.scar?.trim()) return true;
    if (data.mark?.trim()) return true;
    if (data.height?.trim()) return true;
    if (data.weight?.trim()) return true;
    if (data.cellNumber?.trim()) return true;
    if (data.email?.trim()) return true;
    return false;
};

const createLRPerson = async (req, res) => {
    try {
        const {
            leadNo, description, enteredBy, caseName, caseNo,
            leadReturnId, enteredDate,
            lastName, firstName, middleInitial, suffix, cellNumber,
            alias, businessName, address, ssn, age, email,
            occupation, personType, condition, cautionType,
            sex, race, ethnicity, skinTone, eyeColor, hairColor,
            glasses, height, weight, scar, tattoo, mark,
            accessLevel, additionalData
        } = req.body;

        if (!isPersonRecordValid(req.body)) {
            return res.status(400).json({
                message: "Cannot save an empty record. Please fill in at least one field."
            });
        }

        // Resolve ObjectId refs
        const refs = await resolveLeadReturnRefs({ caseNo, caseName, leadNo, enteredBy });

        const newLRPerson = new LRPerson({
            leadNo, description, enteredBy, caseName, caseNo,
            leadReturnId, enteredDate,
            lastName, firstName, middleInitial, suffix, cellNumber,
            alias, businessName, address, ssn, age, email,
            occupation, personType, condition, cautionType,
            sex, race, ethnicity, skinTone, eyeColor, hairColor,
            glasses, height, weight, scar, tattoo, mark,
            accessLevel, additionalData,
            // ObjectId refs
            caseId: refs.caseId,
            leadId: refs.leadId,
            leadReturnObjectId: refs.leadReturnObjectId,
            enteredByUserId: refs.enteredByUserId,
        });

        await newLRPerson.save();

        await createAuditLog({
            caseNo, caseName, leadNo,
            leadName: description,
            entityType: "LRPerson",
            entityId: `${firstName}_${leadReturnId}`,
            action: "CREATE",
            performedBy: { username: req.user?.name || enteredBy || "Unknown", role: req.user?.role || "Unknown" },
            oldValue: null,
            newValue: sanitizeForAudit(newLRPerson.toObject()),
            metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent') },
            accessLevel: accessLevel || "Everyone"
        });

        res.status(201).json(newLRPerson);
    } catch (err) {
        console.error("Error creating LRPerson:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLRPersonByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;
        const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName };
        const lrPersons = await LRPerson.find(query);

        if (lrPersons.length === 0) {
            return res.status(404).json({ message: "No records found." });
        }

        const personsWithPhotos = await Promise.all(
            lrPersons.map(async (p) => {
                const obj = p.toObject();
                if (obj.photoS3Key) {
                    try { obj.photoUrl = await getFileFromS3(obj.photoS3Key); }
                    catch (e) { console.warn(`Failed to sign photo key ${obj.photoS3Key}:`, e?.message); obj.photoUrl = null; }
                }
                return obj;
            })
        );
        res.status(200).json(personsWithPhotos);
    } catch (err) {
        console.error("Error fetching LRPerson records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLRPersonByDetailsandid = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName, id } = req.params;
        const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName, leadReturnId: id };
        const lrPersons = await LRPerson.find(query);

        if (lrPersons.length === 0) {
            return res.status(404).json({ message: "No records found." });
        }

        const personsWithPhotos = await Promise.all(
            lrPersons.map(async (p) => {
                const obj = p.toObject();
                if (obj.photoS3Key) {
                    try { obj.photoUrl = await getFileFromS3(obj.photoS3Key); }
                    catch (e) { console.warn(`Failed to sign photo key ${obj.photoS3Key}:`, e?.message); obj.photoUrl = null; }
                }
                return obj;
            })
        );
        res.status(200).json(personsWithPhotos);
    } catch (err) {
        console.error("Error fetching LRPerson records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const updateLRPerson = async (req, res) => {
    try {
      const { leadNo, caseNo, leadReturnId, firstName } = req.params;
      const updateData = req.body;

      if (!isPersonRecordValid(updateData)) {
        return res.status(400).json({ message: "Cannot save an empty record. Please fill in at least one field." });
      }

      const existingPerson = await LRPerson.findOne({ leadNo: Number(leadNo), caseNo, leadReturnId, firstName });
      if (!existingPerson) {
        return res.status(404).json({ message: "Person not found." });
      }

      const updated = await LRPerson.findOneAndUpdate(
        { leadNo: Number(leadNo), caseNo, leadReturnId, firstName },
        updateData,
        { new: true, runValidators: true }
      );

      await createAuditLog({
        caseNo, caseName: updated.caseName, leadNo: Number(leadNo), leadName: updated.description,
        entityType: "LRPerson", entityId: `${firstName}_${leadReturnId}`, action: "UPDATE",
        performedBy: { username: req.user?.name || "Unknown", role: req.user?.role || "Unknown" },
        oldValue: sanitizeForAudit(existingPerson.toObject()),
        newValue: sanitizeForAudit(updated.toObject()),
        metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent'), changedFields: Object.keys(updateData) },
        accessLevel: updated.accessLevel || "Everyone"
      });

      res.status(200).json(updated);
    } catch (err) {
      console.error("Error updating person:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
};

const deleteLRPerson = async (req, res) => {
    try {
      const { leadNo, caseNo, leadReturnId, firstName } = req.params;

      const existingPerson = await LRPerson.findOne({ leadNo: Number(leadNo), caseNo, leadReturnId, firstName });
      if (!existingPerson) {
        return res.status(404).json({ message: "Person not found." });
      }

      await LRPerson.findOneAndDelete({ leadNo: Number(leadNo), caseNo, leadReturnId, firstName });

      await createAuditLog({
        caseNo, caseName: existingPerson.caseName, leadNo: Number(leadNo), leadName: existingPerson.description,
        entityType: "LRPerson", entityId: `${firstName}_${leadReturnId}`, action: "DELETE",
        performedBy: { username: req.user?.name || "Unknown", role: req.user?.role || "Unknown" },
        oldValue: sanitizeForAudit(existingPerson.toObject()), newValue: null,
        metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent') },
        accessLevel: existingPerson.accessLevel || "Everyone"
      });

      res.status(200).json({ message: "Person deleted successfully." });
    } catch (err) {
      console.error("Error deleting person:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
};

const deleteLRPersonById = async (req, res) => {
    try {
      const { id } = req.params;
      const existingPerson = await LRPerson.findById(id);
      if (!existingPerson) {
        return res.status(404).json({ message: "Person not found." });
      }

      await LRPerson.findByIdAndDelete(id);

      await createAuditLog({
        caseNo: existingPerson.caseNo, caseName: existingPerson.caseName,
        leadNo: existingPerson.leadNo, leadName: existingPerson.description,
        entityType: "LRPerson", entityId: `${existingPerson.firstName}_${existingPerson.leadReturnId}`,
        action: "DELETE",
        performedBy: { username: req.user?.name || "Unknown", role: req.user?.role || "Unknown" },
        oldValue: sanitizeForAudit(existingPerson.toObject()), newValue: null,
        metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent') },
        accessLevel: existingPerson.accessLevel || "Everyone"
      });

      res.status(200).json({ message: "Person deleted successfully." });
    } catch (err) {
      console.error("Error deleting person by id:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
};

const uploadPersonPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: "No photo file provided." });

        const person = await LRPerson.findById(id);
        if (!person) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: "Person not found." });
        }

        if (person.photoS3Key) {
            try { await deleteFromS3(person.photoS3Key); }
            catch (e) { console.warn("Failed to delete old photo from S3:", e?.message); }
        }

        const { key } = await uploadToS3({ filePath: req.file.path, userId: req.user?.id || "anonymous", mimetype: req.file.mimetype });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        person.photoS3Key = key;
        person.photoOriginalName = req.file.originalname;
        person.photoFilename = req.file.filename;
        await person.save();

        const photoUrl = await getFileFromS3(key);
        res.status(200).json({ message: "Photo uploaded successfully.", photoUrl, photoS3Key: key });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Error uploading person photo:", err.message);
        res.status(500).json({ message: "Something went wrong." });
    }
};

const deletePersonPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const person = await LRPerson.findById(id);
        if (!person) return res.status(404).json({ message: "Person not found." });
        if (!person.photoS3Key) return res.status(400).json({ message: "No photo to delete." });

        await deleteFromS3(person.photoS3Key);
        person.photoS3Key = undefined;
        person.photoOriginalName = undefined;
        person.photoFilename = undefined;
        await person.save();

        res.status(200).json({ message: "Photo deleted successfully." });
    } catch (err) {
        console.error("Error deleting person photo:", err.message);
        res.status(500).json({ message: "Something went wrong." });
    }
};

module.exports = { createLRPerson, getLRPersonByDetails, getLRPersonByDetailsandid, updateLRPerson, deleteLRPerson, deleteLRPersonById, uploadPersonPhoto, deletePersonPhoto };
