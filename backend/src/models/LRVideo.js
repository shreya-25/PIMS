// models/LRVideo.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const lrVideoSchema = new mongoose.Schema(
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
      lRStatus: {
        type: String,
        enum: ["Assigned", "Pending"],
        default: "Assigned",
      },
    },

    enteredBy: { type: String, required: true },
    caseName: { type: String, required: true },
    caseNo: { type: String, required: true },

    leadReturnId: { type: String, required: true },
    enteredDate: { type: Date, required: true },
    dateVideoRecorded: { type: Date, required: true },

    videoDescription: { type: String },

    // Storage fields (all optional)
    filePath: { type: String, default: null },
    s3Key: { type: String, default: null },         // ← no longer conditionally required
    originalName: { type: String, default: null },
    filename: { type: String, default: null },

    isLink: { type: Boolean, default: false },
    link: {
      type: String,
      default: null,
      // require a link only when isLink is true
      required: function () {
        return this.isLink === true;
      },
    },

    // keep if you're still using it elsewhere; otherwise remove from schema+controller
    accessLevel: {
      type: String,
      enum: ["Only Case Manager", "Everyone"],
      default: "Everyone",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LRVideo", lrVideoSchema, "LRVideos");
