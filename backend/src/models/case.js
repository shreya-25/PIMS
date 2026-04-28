// models/case.js
const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
    caseNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    caseName: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["ONGOING", "SUBMITTED", "COMPLETED", "ARCHIVED"],
      default: "ONGOING",
    },

    subCategories: {
      type: [String],
      default: [],
    },

    timelineFlags: {
      type: [String],
      default: [],
    },

    // Membership (stable references)
    caseManagerUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    investigatorUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
        index: true,
      },
    ],

    // Legacy single-value field — kept for backward compatibility with existing documents.
    // New code writes to detectiveSupervisorUserIds (array) instead.
    detectiveSupervisorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    detectiveSupervisorUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    officerUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    readOnlyUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Users whose access has been revoked by admin — they remain in the role arrays
    // but cannot open the case or view its leads.
    blockedUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    archivedAt: { type: Date, default: null },

    characterOfCase: { type: String, default: "" },

    caseSummary: { type: String, default: "" },

    executiveCaseSummary: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound indexes (cover all common query patterns)
caseSchema.index({ isDeleted: 1, status: 1, updatedAt: -1 });
caseSchema.index({ caseManagerUserIds: 1, status: 1 });

caseSchema.query.notDeleted = function () {
  return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("Case", caseSchema);