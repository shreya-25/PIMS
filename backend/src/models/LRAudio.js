// models/LRAudio.js
const mongoose = require("mongoose");

const lrAudioSchema = new mongoose.Schema(
  {
    leadNo: { type: Number, required: true },
    description: { type: String, required: true },

    assignedTo: {
      assignees: [{ type: String }],
      lRStatus: {
        type: String,
        enum: ["Assigned", "Pending", "Approved", "Returned", "Completed", "Submitted"],
        default: "Assigned",
      },
    },
    assignedBy: {
      assignee: { type: String },
      lRStatus: { type: String, enum: ["Assigned", "Pending"], default: "Assigned" },
    },

    enteredBy: { type: String, required: true },
    caseName: { type: String, required: true },
    caseNo:   { type: String, required: true },

    leadReturnId:      { type: String, required: true },
    enteredDate:       { type: Date,   required: true },
    dateAudioRecorded: { type: Date,   required: true },
    audioDescription:  { type: String },

    // Storage (all optional to allow metadata-only records)
    isLink:       { type: Boolean, default: false },
    link:         { type: String,  default: null },
    s3Key:        { type: String,  default: null }, // ← no required
    originalName: { type: String,  default: null },
    filename:     { type: String,  default: null },
    filePath:     { type: String,  default: null },

    accessLevel: {
      type: String,
      enum: ["Case Manager Only", "Everyone"], // ← align with frontend option text
      default: "Everyone",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LRAudio", lrAudioSchema, "LRAudios");
