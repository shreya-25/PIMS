const Agency = require("../models/Agency");

const getAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find().sort({ name: 1 }).lean();
    res.status(200).json({ agencies });
  } catch {
    res.status(500).json({ message: "Something went wrong." });
  }
};

const createAgency = async (req, res) => {
  try {
    const { name, ori } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Agency name is required." });
    }
    const agency = await Agency.create({ name: name.trim(), ori: (ori || "").trim() });
    res.status(201).json({ agency });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "An agency with that name already exists." });
    }
    res.status(500).json({ message: "Something went wrong." });
  }
};

const updateAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if ("name" in req.body) updates.name = req.body.name.trim();
    if ("ori"  in req.body) updates.ori  = req.body.ori.trim();
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }
    const agency = await Agency.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!agency) return res.status(404).json({ message: "Agency not found." });
    res.status(200).json({ agency });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "An agency with that name already exists." });
    }
    res.status(500).json({ message: "Something went wrong." });
  }
};

const deleteAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const agency = await Agency.findByIdAndDelete(id);
    if (!agency) return res.status(404).json({ message: "Agency not found." });
    res.status(200).json({ message: "Agency deleted." });
  } catch {
    res.status(500).json({ message: "Something went wrong." });
  }
};

module.exports = { getAgencies, createAgency, updateAgency, deleteAgency };
