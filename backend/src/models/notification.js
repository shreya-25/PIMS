const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, unique: true, required: true },
  assignedBy:     { type: String, required: true },

  // now an array of objects rather than just strings
  assignedTo: [{
    username:    { type: String, required: true },
    unread: { type: Boolean, default: true },
    role: { type: String, required: true },
    status:      {
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
    enum: ["Case", "Lead", "LeadReturn","General"]
  },
  time:   { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", NotificationSchema);
