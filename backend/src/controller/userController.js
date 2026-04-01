const User = require("../models/userModel");

const getAllUsernames = async (req, res) => {
  try {
    const users = await User.find()
                            .select('-password -__v')
                            .lean();
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["firstName", "lastName", "email", "role", "agency", "ori", "badgeId", "isActive"];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }
    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
                           .select("-password -__v");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ user });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({ message: `That ${field} is already in use.` });
    }
    res.status(500).json({ message: "Something went wrong." });
  }
};

module.exports = { getAllUsernames, updateUser };
