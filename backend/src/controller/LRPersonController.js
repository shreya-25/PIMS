const LRPerson = require("../models/LRPerson");
const { createAuditLog, sanitizeForAudit } = require("../services/auditService");
const fs = require("fs");
const { uploadToS3, deleteFromS3, getFileFromS3 } = require("../s3");

// Validation function to check if at least one meaningful field is filled
const isPersonRecordValid = (data) => {
    // Check name fields
    if (data.firstName?.trim()) return true;
    if (data.lastName?.trim()) return true;
    if (data.alias?.trim()) return true;
    if (data.businessName?.trim()) return true;

    // Check person type
    if (data.personType?.trim()) return true;

    // Check address fields
    const address = data.address || {};
    if (address.street1?.trim()) return true;
    if (address.street2?.trim()) return true;
    if (address.building?.trim()) return true;
    if (address.apartment?.trim()) return true;
    if (address.city?.trim()) return true;
    if (address.state?.trim()) return true;
    if (address.zipCode?.trim()) return true;

    // Check physical descriptors
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

    // Check contact info
    if (data.cellNumber?.trim()) return true;
    if (data.email?.trim()) return true;

    return false;
};

// **Create a new LRPerson entry**
const createLRPerson = async (req, res) => {
    try {
        const {
            leadNo,
            description, // Lead Name
            assignedTo,
            assignedBy,
            enteredBy,
            caseName,
            caseNo,
            leadReturnId,
            enteredDate,
            lastName,
            firstName,
            middleInitial,
            suffix,
            cellNumber,
            alias,
            businessName,
            address,
            ssn,
            age,
            email,
            occupation,
            personType,
            condition,
            cautionType,
            sex,
            race,
            ethnicity,
            skinTone,
            eyeColor,
            hairColor,
            glasses,
            height,
            weight,
            scar,
            tattoo,
            mark,
            accessLevel,
            additionalData // Allows additional dynamic fields
        } = req.body;

        // Validate that at least one meaningful field is filled
        if (!isPersonRecordValid(req.body)) {
            return res.status(400).json({
                message: "Cannot save an empty record. Please fill in at least one field (name, alias, business name, person type, address, physical descriptor, or contact info)."
            });
        }

        // Validate accessLevel if provided
        if (accessLevel) {
            const validAccessLevels = ["Everyone", "Case Manager", "Case Manager and Assignees"];
            if (!validAccessLevels.includes(accessLevel)) {
                return res.status(400).json({
                    message: `Invalid accessLevel. Must be one of: ${validAccessLevels.join(', ')}`
                });
            }
        }

        const newLRPerson = new LRPerson({
            leadNo,
            description,
            assignedTo,
            assignedBy,
            enteredBy,
            caseName,
            caseNo,
            leadReturnId,
            enteredDate,
            lastName,
            firstName,
            middleInitial,
            suffix,
            cellNumber,
            alias,
            businessName,
            address,
            ssn,
            age,
            email,
            occupation,
            personType,
            condition,
            cautionType,
            sex,
            race,
            ethnicity,
            skinTone,
            eyeColor,
            hairColor,
            glasses,
            height,
            weight,
            scar,
            tattoo,
            mark,
            accessLevel,
            additionalData
        });

        await newLRPerson.save();

        // Log the creation in audit log
        await createAuditLog({
            caseNo,
            caseName,
            leadNo,
            leadName: description,
            entityType: "LRPerson",
            entityId: `${firstName}_${leadReturnId}`,
            action: "CREATE",
            performedBy: {
                username: req.user?.name || enteredBy || "Unknown",
                role: req.user?.role || "Unknown"
            },
            oldValue: null,
            newValue: sanitizeForAudit(newLRPerson.toObject()),
            metadata: {
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('user-agent')
            },
            accessLevel: accessLevel || "Everyone"
        });

        res.status(201).json(newLRPerson);
    } catch (err) {
        console.error("Error creating LRPerson:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// **Get LRPerson records using leadNo, leadName (description), caseNo, caseName, and leadReturnId**
const getLRPersonByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo: caseNo,
            caseName: caseName,
        };

        const lrPersons = await LRPerson.find(query);

        if (lrPersons.length === 0) {
            return res.status(404).json({ message: "No records found." });
        }

        const personsWithPhotos = await Promise.all(
            lrPersons.map(async (p) => {
                const obj = p.toObject();
                if (obj.photoS3Key) {
                    try {
                        obj.photoUrl = await getFileFromS3(obj.photoS3Key);
                    } catch (e) {
                        console.warn(`Failed to sign photo key ${obj.photoS3Key}:`, e?.message);
                        obj.photoUrl = null;
                    }
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

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo: caseNo,
            caseName: caseName,
            leadReturnId: id,
        };

        const lrPersons = await LRPerson.find(query);

        if (lrPersons.length === 0) {
            return res.status(404).json({ message: "No records found." });
        }

        const personsWithPhotos = await Promise.all(
            lrPersons.map(async (p) => {
                const obj = p.toObject();
                if (obj.photoS3Key) {
                    try {
                        obj.photoUrl = await getFileFromS3(obj.photoS3Key);
                    } catch (e) {
                        console.warn(`Failed to sign photo key ${obj.photoS3Key}:`, e?.message);
                        obj.photoUrl = null;
                    }
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
      const {
        leadNo,
        caseNo,
        leadReturnId,
        firstName
      } = req.params;
      const updateData = req.body;

      // Validate that at least one meaningful field is filled
      if (!isPersonRecordValid(updateData)) {
        return res.status(400).json({
          message: "Cannot save an empty record. Please fill in at least one field (name, alias, business name, person type, address, physical descriptor, or contact info)."
        });
      }

      // Validate accessLevel if it's being updated
      if (updateData.accessLevel) {
        const validAccessLevels = ["Everyone", "Case Manager", "Case Manager and Assignees"];
        if (!validAccessLevels.includes(updateData.accessLevel)) {
          return res.status(400).json({
            message: `Invalid accessLevel. Must be one of: ${validAccessLevels.join(', ')}`
          });
        }
      }

      // Get the old value before updating
      const existingPerson = await LRPerson.findOne({
        leadNo: Number(leadNo),
        caseNo,
        leadReturnId,
        firstName
      });

      if (!existingPerson) {
        return res.status(404).json({ message: "Person not found." });
      }

      const updated = await LRPerson.findOneAndUpdate(
        {
          leadNo:       Number(leadNo),
          caseNo,
          leadReturnId,
          firstName
        },
        updateData,
        {
          new: true,
          runValidators: true
        }
      );

      // Log the update in audit log
      await createAuditLog({
        caseNo,
        caseName: updated.caseName,
        leadNo: Number(leadNo),
        leadName: updated.description,
        entityType: "LRPerson",
        entityId: `${firstName}_${leadReturnId}`,
        action: "UPDATE",
        performedBy: {
          username: req.user?.name || "Unknown",
          role: req.user?.role || "Unknown"
        },
        oldValue: sanitizeForAudit(existingPerson.toObject()),
        newValue: sanitizeForAudit(updated.toObject()),
        metadata: {
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
          changedFields: Object.keys(updateData)
        },
        accessLevel: updated.accessLevel || "Everyone"
      });

      res.status(200).json(updated);
    } catch (err) {
      console.error("Error updating person:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
  };
  
  // Delete by composite key
  const deleteLRPerson = async (req, res) => {
    try {
      const {
        leadNo,
        caseNo,
        leadReturnId,
        firstName
      } = req.params;

      // Get the record before deleting
      const existingPerson = await LRPerson.findOne({
        leadNo: Number(leadNo),
        caseNo,
        leadReturnId,
        firstName
      });

      if (!existingPerson) {
        return res.status(404).json({ message: "Person not found." });
      }

      const deleted = await LRPerson.findOneAndDelete({
        leadNo:       Number(leadNo),
        caseNo,
        leadReturnId,
        firstName      });

      // Log the deletion in audit log
      await createAuditLog({
        caseNo,
        caseName: existingPerson.caseName,
        leadNo: Number(leadNo),
        leadName: existingPerson.description,
        entityType: "LRPerson",
        entityId: `${firstName}_${leadReturnId}`,
        action: "DELETE",
        performedBy: {
          username: req.user?.name || "Unknown",
          role: req.user?.role || "Unknown"
        },
        oldValue: sanitizeForAudit(existingPerson.toObject()),
        newValue: null,
        metadata: {
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent')
        },
        accessLevel: existingPerson.accessLevel || "Everyone"
      });

      res.status(200).json({ message: "Person deleted successfully." });
    } catch (err) {
      console.error("Error deleting person:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
  };

// Delete by MongoDB _id
const deleteLRPersonById = async (req, res) => {
    try {
      const { id } = req.params;

      const existingPerson = await LRPerson.findById(id);
      if (!existingPerson) {
        return res.status(404).json({ message: "Person not found." });
      }

      await LRPerson.findByIdAndDelete(id);

      // Log the deletion in audit log
      await createAuditLog({
        caseNo: existingPerson.caseNo,
        caseName: existingPerson.caseName,
        leadNo: existingPerson.leadNo,
        leadName: existingPerson.description,
        entityType: "LRPerson",
        entityId: `${existingPerson.firstName}_${existingPerson.leadReturnId}`,
        action: "DELETE",
        performedBy: {
          username: req.user?.name || "Unknown",
          role: req.user?.role || "Unknown"
        },
        oldValue: sanitizeForAudit(existingPerson.toObject()),
        newValue: null,
        metadata: {
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent')
        },
        accessLevel: existingPerson.accessLevel || "Everyone"
      });

      res.status(200).json({ message: "Person deleted successfully." });
    } catch (err) {
      console.error("Error deleting person by id:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
  };

// Upload or replace person photo
const uploadPersonPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: "No photo file provided." });
        }

        const person = await LRPerson.findById(id);
        if (!person) {
            // Clean up temp file
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: "Person not found." });
        }

        // Delete old photo from S3 if exists
        if (person.photoS3Key) {
            try {
                await deleteFromS3(person.photoS3Key);
            } catch (e) {
                console.warn("Failed to delete old photo from S3:", e?.message);
            }
        }

        // Upload new photo to S3
        const { key } = await uploadToS3({
            filePath: req.file.path,
            userId: req.user?.id || "anonymous",
            mimetype: req.file.mimetype,
        });

        // Clean up temp file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        // Update person record
        person.photoS3Key = key;
        person.photoOriginalName = req.file.originalname;
        person.photoFilename = req.file.filename;
        await person.save();

        // Return signed URL
        const photoUrl = await getFileFromS3(key);

        res.status(200).json({ message: "Photo uploaded successfully.", photoUrl, photoS3Key: key });
    } catch (err) {
        // Clean up temp file on error
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Error uploading person photo:", err.message);
        res.status(500).json({ message: "Something went wrong." });
    }
};

// Delete person photo
const deletePersonPhoto = async (req, res) => {
    try {
        const { id } = req.params;

        const person = await LRPerson.findById(id);
        if (!person) {
            return res.status(404).json({ message: "Person not found." });
        }

        if (!person.photoS3Key) {
            return res.status(400).json({ message: "No photo to delete." });
        }

        // Delete from S3
        await deleteFromS3(person.photoS3Key);

        // Clear photo fields
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
