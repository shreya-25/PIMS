const LRVehicle = require("../models/LRVehicle");

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
  
      const updated = await LRVehicle.findOneAndUpdate(
        {
          leadNo:       Number(leadNo),
          caseNo,
          leadReturnId,
          vin            // or whichever unique field you prefer
        },
        updateData,
        { new: true, runValidators: true }
      );
  
      if (!updated) {
        return res.status(404).json({ message: "Vehicle not found." });
      }
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
  
      const deleted = await LRVehicle.findOneAndDelete({
        leadNo:       Number(leadNo),
        caseNo,
        leadReturnId,
        vin
      });
  
      if (!deleted) {
        return res.status(404).json({ message: "Vehicle not found." });
      }
      res.status(200).json({ message: "Vehicle deleted successfully." });
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  };

module.exports = { createLRVehicle, getLRVehicleByDetails, getLRVehicleByDetailsandid, updateLRVehicle, deleteLRVehicle  };
