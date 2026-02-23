const mongoose = require("mongoose");
const { LR_ACCESS_LEVELS } = require("../constants/accessLevels");

const lrAudioSchema = new mongoose.Schema(
  {
    // ── Stable ObjectId refs ──────────────────────────────────
    caseId:            { type: mongoose.Schema.Types.ObjectId, ref: "Case", default: null },
    leadId:            { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
    leadReturnObjectId:{ type: mongoose.Schema.Types.ObjectId, ref: "LeadReturn", required: true },
    enteredByUserId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Existing fields ───────────────────────────────────────
    leadNo:            { type: Number, required: true },
    description:       { type: String, required: true },  // lead description snapshot
    enteredBy:         { type: String, required: true },   // username snapshot
    caseName:          { type: String, required: true },   // snapshot
    caseNo:            { type: String, required: true },   // snapshot
    leadReturnId:      { type: String, required: true },
    enteredDate:       { type: Date,   required: true },
    dateAudioRecorded: { type: Date,   required: true },
    audioDescription:  { type: String, required: true },

    // Storage (all optional)
    isLink:       { type: Boolean, default: false },
    link:         { type: String,  default: null },
    s3Key:        { type: String,  default: null },
    originalName: { type: String,  default: null },
    filename:     { type: String,  default: null },
    filePath:     { type: String,  default: null },

    accessLevel: {
      type: String,
      enum: LR_ACCESS_LEVELS,
      default: "Everyone",
    },

    // Reference to complete lead return version
    completeLeadReturnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompleteleadReturn",
    },

    // Soft-delete
    isDeleted:       { type: Boolean, default: false },
    deletedAt:       { type: Date, default: null },
    deletedBy:       { type: String, default: null },
    deletedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

lrAudioSchema.index({ leadReturnObjectId: 1, createdAt: -1 });
lrAudioSchema.index({ caseId: 1, leadNo: 1 });

lrAudioSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LRAudio", lrAudioSchema, "LRAudios");
