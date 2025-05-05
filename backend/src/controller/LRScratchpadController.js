const LRScratchpad = require("../models/LRScratchpad");

// ✅ Create a new LRScratchpad entry
const createLRScratchpad = async (req, res) => {
    try {
        const {
            leadNo,
            description,
            assignedTo,
            assignedBy,
            enteredBy,
            caseName,
            caseNo,
            leadReturnId,
            enteredDate,
            text,
            type

        } = req.body;

        const newScratchpad = new LRScratchpad({
            leadNo,
            description,
            assignedTo,
            assignedBy,
            enteredBy,
            caseName,
            caseNo,
            leadReturnId,
            enteredDate,
            text,
            type
        });

        await newScratchpad.save();
        res.status(201).json(newScratchpad);
    } catch (err) {
        console.error("Error creating LRScratchpad entry:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// ✅ Get all LRScratchpad entries by lead & case info
const getLRScratchpadByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo,
            caseName
        };

        const scratchpads = await LRScratchpad.find(query);

        if (scratchpads.length === 0) {
            return res.status(404).json({ message: "No scratchpad entries found." });
        }

        res.status(200).json(scratchpads);
    } catch (err) {
        console.error("Error fetching LRScratchpad records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// ✅ Get scratchpad entries by details *and* leadReturnId
const getLRScratchpadByDetailsAndId = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName, id } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseNo,
            caseName,
            leadReturnId: id
        };

        const scratchpads = await LRScratchpad.find(query);

        if (scratchpads.length === 0) {
            return res.status(404).json({ message: "No scratchpad entries found for the given return ID." });
        }

        res.status(200).json(scratchpads);
    } catch (err) {
        console.error("Error fetching LRScratchpad by ID:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

async function updateLRScratchpad(req, res) {
    try {
      const { id } = req.params;
      // Only these fields are updatable
      const { leadReturnId, text, type } = req.body;
  
      const updated = await LRScratchpad.findByIdAndUpdate(
        id,
        { leadReturnId, text, type },
        { new: true }
      );
  
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating scratchpad:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  
  // **Delete** a scratchpad entry
  async function deleteLRScratchpad(req, res) {
    try {
      const { id } = req.params;
      const removed = await LRScratchpad.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error("Error deleting scratchpad:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }

module.exports = {
    createLRScratchpad,
    getLRScratchpadByDetails,
    getLRScratchpadByDetailsAndId  ,
    updateLRScratchpad,
    deleteLRScratchpad,
};
