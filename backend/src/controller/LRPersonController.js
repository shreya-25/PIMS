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
            caseNo: Number(caseNo),
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

module.exports = { createLRPerson, getLRPersonByDetails };
