const LRScratchpad = require("../models/LRScratchpad");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");

const createLRScratchpad = async (req, res) => {
    try {
        const {
            leadNo, description, enteredBy, caseName, caseNo,
            leadReturnId, enteredDate, text, type,
        } = req.body;

        const accessLevel = req.body.accessLevel || "Everyone";

        // Resolve ObjectId refs
        const refs = await resolveLeadReturnRefs({ caseNo, caseName, leadNo, enteredBy });

        const newScratchpad = new LRScratchpad({
            leadNo, description, enteredBy, caseName, caseNo,
            leadReturnId, enteredDate, text, type, accessLevel,
            // ObjectId refs
            caseId: refs.caseId,
            leadId: refs.leadId,
            leadReturnObjectId: refs.leadReturnObjectId,
            enteredByUserId: refs.enteredByUserId,
        });

        await newScratchpad.save();
        res.status(201).json(newScratchpad);
    } catch (err) {
        console.error("Error creating LRScratchpad entry:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLRScratchpadByDetails = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;
        const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName, isDeleted: { $ne: true } };
        const scratchpads = await LRScratchpad.find(query);

        if (scratchpads.length === 0) return res.status(404).json({ message: "No scratchpad entries found." });
        res.status(200).json(scratchpads);
    } catch (err) {
        console.error("Error fetching LRScratchpad records:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLRScratchpadByDetailsAndId = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName, id } = req.params;
        const query = { leadNo: Number(leadNo), description: leadName, caseNo, caseName, leadReturnId: id, isDeleted: { $ne: true } };
        const scratchpads = await LRScratchpad.find(query);

        if (scratchpads.length === 0) return res.status(404).json({ message: "No scratchpad entries found for the given return ID." });
        res.status(200).json(scratchpads);
    } catch (err) {
        console.error("Error fetching LRScratchpad by ID:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

async function updateLRScratchpad(req, res) {
    try {
      const { id } = req.params;
      const { leadReturnId, text, type, accessLevel } = req.body;

      const updateData = { leadReturnId, text, type };
      if (accessLevel !== undefined) updateData.accessLevel = accessLevel || "Everyone";

      const updated = await LRScratchpad.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating scratchpad:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
}

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
    getLRScratchpadByDetailsAndId,
    updateLRScratchpad,
    deleteLRScratchpad,
};
