const mongoose = require("mongoose");
const { Schema } = mongoose;

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, unique: true, required: true },
  assignedBy:       { type: String, required: true },
  assignedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },

  // Stable ObjectId refs
  caseId: { type: Schema.Types.ObjectId, ref: "Case", default: null },
  leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null },

  assignedTo: [{
    userId:   { type: Schema.Types.ObjectId, ref: "User", default: null }, // stable ID
    username: { type: String, required: true },                             // snapshot for display
    unread:   { type: Boolean, default: true },
    role:     { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    },
    comment:     { type: String },
    respondedAt: { type: Date }
  }],

  action1:    { type: String, required: true },
  action2:    { type: String },
  post1:      { type: String, required: true },
  post2:      { type: String },
  leadNo:     { type: String },
  leadName:   { type: String },
  caseNo:     { type: String, required: true },
  caseName:   { type: String, required: true },
  caseStatus: {
    type: String,
    enum: ["Open", "Close"],
    default: "Open"
  },
  type: {
    type: String,
    required: true,
    enum: ["Case", "Lead", "LeadReturn", "General"]
  },
  time: { type: Date, default: Date.now }
});

// Indexes for notification queries — keep username index for legacy, add userId index
NotificationSchema.index({ "assignedTo.userId":   1, caseStatus: 1 });
NotificationSchema.index({ "assignedTo.username": 1, caseStatus: 1 });
NotificationSchema.index({ caseNo: 1 });
NotificationSchema.index({ time: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
