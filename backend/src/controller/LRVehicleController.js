const LRVehicle = require("../models/LRVehicle");
const { createAuditLog, sanitizeForAudit } = require("../services/auditService");

// **Create a new LRVehicle entry**
const createLRVehicle = async (req, res) => {
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
            year,
            make,
            model,
            plate,
            vin,
            state,
            category,
            type,
            primaryColor,
            secondaryColor,
            information,
            additionalData,
            accessLevel,
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

        const newLRVehicle = new LRVehicle({
            leadNo,
            description,
            assignedTo,
            assignedBy,
            enteredBy,
            caseName,
            caseNo,
            leadReturnId,
            enteredDate,
            year,
            make,
            model,
            plate,
            vin,
            state,
            category,
            type,
            primaryColor,
            secondaryColor,
            information,
            additionalData,
            accessLevel,
        });

        await newLRVehicle.save();

        // Log the creation in audit log
        await createAuditLog({
            caseNo,
            caseName,
            leadNo,
            leadName: description,
            entityType: "LRVehicle",
            entityId: `${vin}_${leadReturnId}`,
            action: "CREATE",
            performedBy: {
                username: req.user?.name || enteredBy || "Unknown",
                role: req.user?.role || "Unknown"
            },
            oldValue: null,
            newValue: sanitizeForAudit(newLRVehicle.toObject()),
            metadata: {
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('user-agent')
            },
            accessLevel: accessLevel || "Everyone"
        });

        res.status(201).json(newLRVehicle);
    } catch (err) {
        console.error("Error creating LRVehicle:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// **Get LRVehicle records using leadNo, leadName (description), caseNo, caseName, and leadReturnId**
const getLRVehicleByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo: caseNo,
            caseName: caseName,
        };

        const lrVehicles = await LRVehicle.find(query);

        if (lrVehicles.length === 0) {
            return res.status(404).json({ message: "No vehicle records found." });
        }

        res.status(200).json(lrVehicles);
    } catch (err) {
        console.error("Error fetching LRVehicle records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLRVehicleByDetailsandid = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName, id } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo: caseNo,
            caseName: caseName,
            leadReturnId: id,
        };

        const lrVehicles = await LRVehicle.find(query);

        if (lrVehicles.length === 0) {
            return res.status(404).json({ message: "No records found." });
        }

        res.status(200).json(lrVehicles);
    } catch (err) {
        console.error("Error fetching LRVehicles records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// Update a specific LRVehicle entry
const updateLRVehicle = async (req, res) => {
    try {
      const { leadNo, caseNo, leadReturnId, vin } = req.params;
      const updateData = req.body;

      // Handle empty VIN (sent as '-EMPTY-' from frontend)
      const actualVin = vin === '-EMPTY-' ? '' : vin;

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
      const existingVehicle = await LRVehicle.findOne({
        leadNo: Number(leadNo),
        caseNo,
        leadReturnId,
        vin: actualVin
      });

      if (!existingVehicle) {
        return res.status(404).json({ message: "Vehicle not found." });
      }

      const updated = await LRVehicle.findOneAndUpdate(
        {
          leadNo:       Number(leadNo),
          caseNo,
          leadReturnId,
          vin:          actualVin
        },
        updateData,
        { new: true, runValidators: true }
      );

      // Log the update in audit log
      await createAuditLog({
        caseNo,
        caseName: updated.caseName,
        leadNo: Number(leadNo),
        leadName: updated.description,
        entityType: "LRVehicle",
        entityId: `${vin}_${leadReturnId}`,
        action: "UPDATE",
        performedBy: {
          username: req.user?.name || "Unknown",
          role: req.user?.role || "Unknown"
        },
        oldValue: sanitizeForAudit(existingVehicle.toObject()),
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
      console.error("Error updating vehicle:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  };
  
  // Delete a specific LRVehicle entry
  const deleteLRVehicle = async (req, res) => {
    try {
      const { leadNo, caseNo, leadReturnId, vin } = req.params;

      // Handle empty VIN (sent as '-EMPTY-' from frontend)
      const actualVin = vin === '-EMPTY-' ? '' : vin;

      // Get the record before deleting
      const existingVehicle = await LRVehicle.findOne({
        leadNo: Number(leadNo),
        caseNo,
        leadReturnId,
        vin: actualVin
      });

      if (!existingVehicle) {
        return res.status(404).json({ message: "Vehicle not found." });
      }

      const deleted = await LRVehicle.findOneAndDelete({
        leadNo:       Number(leadNo),
        caseNo,
        leadReturnId,
        vin:          actualVin
      });

      // Log the deletion in audit log
      await createAuditLog({
        caseNo,
        caseName: existingVehicle.caseName,
        leadNo: Number(leadNo),
        leadName: existingVehicle.description,
        entityType: "LRVehicle",
        entityId: `${vin}_${leadReturnId}`,
        action: "DELETE",
        performedBy: {
          username: req.user?.name || "Unknown",
          role: req.user?.role || "Unknown"
        },
        oldValue: sanitizeForAudit(existingVehicle.toObject()),
        newValue: null,
        metadata: {
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent')
        },
        accessLevel: existingVehicle.accessLevel || "Everyone"
      });

      res.status(200).json({ message: "Vehicle deleted successfully." });
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  };

module.exports = { createLRVehicle, getLRVehicleByDetails, getLRVehicleByDetailsandid, updateLRVehicle, deleteLRVehicle  };
