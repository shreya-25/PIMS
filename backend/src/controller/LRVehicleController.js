const LRVehicle = require("../models/LRVehicle");
const { createAuditLog, sanitizeForAudit } = require("../services/auditService");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");

const createLRVehicle = async (req, res) => {
    try {
        const {
            leadNo, description, enteredBy, caseName, caseNo,
            leadReturnId, enteredDate,
            year, make, model, plate, vin, state, category, type,
            primaryColor, secondaryColor, information,
            additionalData, accessLevel,
        } = req.body;

        // Resolve ObjectId refs
        const refs = await resolveLeadReturnRefs({ caseNo, caseName, leadNo, enteredBy });

        const newLRVehicle = new LRVehicle({
            leadNo, description, enteredBy, caseName, caseNo,
            leadReturnId, enteredDate,
            year, make, model, plate, vin, state, category, type,
            primaryColor, secondaryColor, information,
            additionalData, accessLevel,
            // ObjectId refs
            caseId: refs.caseId,
            leadId: refs.leadId,
            leadReturnObjectId: refs.leadReturnObjectId,
            enteredByUserId: refs.enteredByUserId,
        });

        await newLRVehicle.save();

        await createAuditLog({
            caseNo, caseName, leadNo, leadName: description,
            entityType: "LRVehicle", entityId: `${vin}_${leadReturnId}`, action: "CREATE",
            performedBy: { username: req.user?.name || enteredBy || "Unknown", role: req.user?.role || "Unknown" },
            oldValue: null, newValue: sanitizeForAudit(newLRVehicle.toObject()),
            metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent') },
            accessLevel: accessLevel || "Everyone"
        });

        res.status(201).json(newLRVehicle);
    } catch (err) {
        console.error("Error creating LRVehicle:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLRVehicleByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;
        const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName, isDeleted: { $ne: true } };
        const lrVehicles = await LRVehicle.find(query);
        res.status(200).json(lrVehicles);
    } catch (err) {
        console.error("Error fetching LRVehicle records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLRVehicleByDetailsandid = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName, id } = req.params;
        const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName, leadReturnId: id, isDeleted: { $ne: true } };
        const lrVehicles = await LRVehicle.find(query);
        res.status(200).json(lrVehicles);
    } catch (err) {
        console.error("Error fetching LRVehicles records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const updateLRVehicle = async (req, res) => {
    try {
      const { leadNo, caseNo, leadReturnId, vin } = req.params;
      const updateData = req.body;
      const actualVin = vin === '-EMPTY-' ? '' : vin;

      const existingVehicle = await LRVehicle.findOne({ leadNo: Number(leadNo), caseNo, leadReturnId, vin: actualVin });
      if (!existingVehicle) return res.status(404).json({ message: "Vehicle not found." });

      const updated = await LRVehicle.findOneAndUpdate(
        { leadNo: Number(leadNo), caseNo, leadReturnId, vin: actualVin },
        updateData,
        { new: true, runValidators: true }
      );

      await createAuditLog({
        caseNo, caseName: updated.caseName, leadNo: Number(leadNo), leadName: updated.description,
        entityType: "LRVehicle", entityId: `${vin}_${leadReturnId}`, action: "UPDATE",
        performedBy: { username: req.user?.name || "Unknown", role: req.user?.role || "Unknown" },
        oldValue: sanitizeForAudit(existingVehicle.toObject()), newValue: sanitizeForAudit(updated.toObject()),
        metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent'), changedFields: Object.keys(updateData) },
        accessLevel: updated.accessLevel || "Everyone"
      });

      res.status(200).json(updated);
    } catch (err) {
      console.error("Error updating vehicle:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
};

const deleteLRVehicle = async (req, res) => {
    try {
      const { leadNo, caseNo, leadReturnId, vin } = req.params;
      const actualVin = vin === '-EMPTY-' ? '' : vin;

      const existingVehicle = await LRVehicle.findOne({ leadNo: Number(leadNo), caseNo, leadReturnId, vin: actualVin });
      if (!existingVehicle) return res.status(404).json({ message: "Vehicle not found." });

      await LRVehicle.findOneAndDelete({ leadNo: Number(leadNo), caseNo, leadReturnId, vin: actualVin });

      await createAuditLog({
        caseNo, caseName: existingVehicle.caseName, leadNo: Number(leadNo), leadName: existingVehicle.description,
        entityType: "LRVehicle", entityId: `${vin}_${leadReturnId}`, action: "DELETE",
        performedBy: { username: req.user?.name || "Unknown", role: req.user?.role || "Unknown" },
        oldValue: sanitizeForAudit(existingVehicle.toObject()), newValue: null,
        metadata: { ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('user-agent') },
        accessLevel: existingVehicle.accessLevel || "Everyone"
      });

      res.status(200).json({ message: "Vehicle deleted successfully." });
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { createLRVehicle, getLRVehicleByDetails, getLRVehicleByDetailsandid, updateLRVehicle, deleteLRVehicle };
