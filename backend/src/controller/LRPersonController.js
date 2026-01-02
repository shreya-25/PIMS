const LRPerson = require("../models/LRPerson");
const { createAuditLog, sanitizeForAudit } = require("../services/auditService");

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

        res.status(200).json(lrPersons);
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

        res.status(200).json(lrPersons);
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

module.exports = { createLRPerson, getLRPersonByDetails, getLRPersonByDetailsandid, updateLRPerson, deleteLRPerson };
