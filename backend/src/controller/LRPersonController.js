const LRPerson = require("../models/LRPerson");

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
        firstName,
        lastName
      } = req.params;
      const updateData = req.body;
  
      const updated = await LRPerson.findOneAndUpdate(
        {
          leadNo:       Number(leadNo),
          caseNo,
          leadReturnId,
          firstName,
          lastName
        },
        updateData,
        {
          new: true,
          runValidators: true
        }
      );
  
      if (!updated) {
        return res.status(404).json({ message: "Person not found." });
      }
  
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
        firstName,
        lastName
      } = req.params;
  
      const deleted = await LRPerson.findOneAndDelete({
        leadNo:       Number(leadNo),
        caseNo,
        leadReturnId,
        firstName,
        lastName
      });
  
      if (!deleted) {
        return res.status(404).json({ message: "Person not found." });
      }
  
      res.status(200).json({ message: "Person deleted successfully." });
    } catch (err) {
      console.error("Error deleting person:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
  };

module.exports = { createLRPerson, getLRPersonByDetails, getLRPersonByDetailsandid, updateLRPerson, deleteLRPerson };
