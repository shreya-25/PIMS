// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { firstName, lastName, username, password, role, email } = req.body;

    if (!username || !password || !role || !email) {
      return res
        .status(400)
        .json({ message: "username, password, role & email are required" });
    }

    // ✅ Keep username casing as-is to match existing imported users
    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // ✅ Check duplicates (case-insensitive for username + email)
    const existing = await User.findOne({
      $or: [
        { username: new RegExp(`^${escapeRegExp(cleanUsername)}$`, "i") },
        { email: cleanEmail },
      ],
    }).lean();

    if (existing) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    // ✅ IMPORTANT:
    // Do NOT bcrypt.hash here IF your userModel has a pre('save') hook that hashes password.
    // This avoids double-hashing and keeps login working.
    const newUser = new User({
      firstName,
      lastName,
      username: cleanUsername,
      password, // raw → model pre-save hook should hash once
      role,
      email: cleanEmail,
    });

    await newUser.save();

    return res.status(201).json({
      message: `User registered with username ${cleanUsername}`,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        message: "Username or email already exists",
        duplicate: err.keyValue,
      });
    }

    if (err?.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        details: Object.fromEntries(
          Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
        ),
      });
    }

    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }

    const cleanUsername = String(username).trim();

    // ✅ Find user case-insensitively (works for Officer001 vs officer001)
    const user = await User.findOne({
      username: new RegExp(`^${escapeRegExp(cleanUsername)}$`, "i"),
    }).select("+password");

    if (!user) {
      return res.status(404).json({ message: `User with ${cleanUsername} not found` });
    }

    // ✅ Compare password safely
    let isMatch = false;
    if (typeof user.comparePassword === "function") {
      isMatch = await user.comparePassword(password);
    } else {
      // fallback
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing in env");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    return res.status(200).json({
      token,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      username: user.username,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// Helper: escape regex special chars in username
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  register,
  login,
};