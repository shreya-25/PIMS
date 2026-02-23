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
      enum: ["ONGOING", "COMPLETED", "ARCHIVED"],
      default: "ONGOING",
    },

    subNumbers: {
      type: [String],
      default: [],
    },

    // Membership (stable references)
    caseManagerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    investigatorUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
        index: true,
      },
    ],

    detectiveSupervisorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound indexes (cover all common query patterns)
caseSchema.index({ isDeleted: 1, status: 1, updatedAt: -1 });
caseSchema.index({ caseManagerUserId: 1, status: 1 });

caseSchema.query.notDeleted = function () {
  return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("Case", caseSchema);