// models/userModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    // Optional but helpful for UI
    displayName: { type: String, trim: true },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // don't return password by default
    },

    role: {
      type: String,
      required: true,
      enum: ["Admin", "CaseManager", "Investigator", "Detective Supervisor"],
      index: true,
    },

    // Never delete users in audit-heavy systems—disable instead
    isActive: { type: Boolean, default: true, index: true },

    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-set displayName if missing
userSchema.pre("save", function (next) {
  if (!this.displayName) {
    const fn = this.firstName?.trim() || "";
    const ln = this.lastName?.trim() || "";
    const combined = `${fn} ${ln}`.trim();
    this.displayName = combined || this.username;
  }
  next();
});

// Hash password on create/change
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  this.passwordChangedAt = new Date();
  next();
});

// Helper for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);