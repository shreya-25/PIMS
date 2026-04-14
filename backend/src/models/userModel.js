// models/userModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
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
      minlength: 8,
      select: false, // don't return password by default
    },

    role: {
      type: String,
      required: true,
      enum: ["Admin", "Detective Supervisor", "CaseManager", "Detective/Investigator", "External Contributor", "Read Only"],
      index: true,
    },

    agency: { type: String, default: "" },
    badgeId: { type: String, trim: true, default: "" },
    ori: { type: String, trim: true, default: "" },       // e.g. NY1234567
    emailDomain: { type: String, trim: true, default: "" }, // e.g. binghamton.edu

    // Account setup flow (email-verified onboarding)
    setupToken: { type: String, select: false },
    setupTokenExpiry: { type: Date },
    accountSetupComplete: { type: Boolean, default: false, index: true },

    // Password reset flow
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date },

    // Account access expiry (optional, for external/temporary users)
    accessExpiresAt: { type: Date, default: null },

    // Never delete users in audit-heavy systems—disable instead
    // 2FA
    mfaMethod:   { type: String, enum: ["email", "totp"], default: "email" },
    totpSecret:  { type: String, default: null, select: false },
    totpEnabled: { type: Boolean, default: false },

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