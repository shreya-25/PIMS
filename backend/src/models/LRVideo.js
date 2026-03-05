const mongoose = require("mongoose");
const { Schema } = mongoose;
const { LR_ACCESS_LEVELS } = require("../constants/accessLevels");

const lrVideoSchema = new mongoose.Schema(
  {
    // ── Stable ObjectId refs ──────────────────────────────────
    caseId:            { type: Schema.Types.ObjectId, ref: "Case", default: null },
    leadId:            { type: Schema.Types.ObjectId, ref: "Lead", default: null },
    leadReturnObjectId:{ type: Schema.Types.ObjectId, ref: "LeadReturn", default: null },
    enteredByUserId:   { type: Schema.Types.ObjectId, ref: "User", default: null },

    // ── Existing fields ───────────────────────────────────────
    leadNo:            { type: Number, required: true },
    description:       { type: String, required: true },  // lead description snapshot
    enteredBy:         { type: String, required: true },   // username snapshot
    caseName:          { type: String, required: true },   // snapshot
    caseNo:            { type: String, required: true },   // snapshot
    leadReturnId:      { type: String, required: true },
    enteredDate:       { type: Date, required: true },
    dateVideoRecorded: { type: Date, required: true },
    videoDescription:  { type: String },

    // Storage fields (all optional)
    filePath:     { type: String, default: null },
    s3Key:        { type: String, default: null },
    originalName: { type: String, default: null },
    filename:     { type: String, default: null },

    isLink: { type: Boolean, default: false },
    link: {
      type: String,
      default: null,
      required: function () {
        return this.isLink === true;
      },
    },

    accessLevel: {
      type: String,
      enum: LR_ACCESS_LEVELS,
      default: "Everyone",
    },

    // Reference to complete lead return version
    completeLeadReturnId: {
      type: Schema.Types.ObjectId,
      ref: "CompleteleadReturn",
    },

    // Soft-delete
    isDeleted:       { type: Boolean, default: false },
    deletedAt:       { type: Date, default: null },
    deletedBy:       { type: String, default: null },
    deletedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

lrVideoSchema.index({ leadReturnObjectId: 1, createdAt: -1 });
lrVideoSchema.index({ caseId: 1, leadNo: 1 });

lrVideoSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LRVideo", lrVideoSchema, "LRVideos");
