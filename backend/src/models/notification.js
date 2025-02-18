const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, unique: true, required: true }, // Unique ID for each notification
  assignedBy: { type: String, required: true },
  assignedTo: { type: [String], required: true }, // List of strings
  action1: { type: String, required: true },
  action2: { type: String, required: false },
  post1: { type: String, required: true },
  post2: { type: String, required: false },
  leadNo: { type: String, required: false },
  leadName: { type: String, required: false },
  caseNo:{ type: String, required: true },
  caseName: { type: String, required: true },
  caseStatus: { 
    type: String, 
    required: true, 
    enum: ["Open", "Close"], // Restrict values to "Open" or "Close"
    default: "Open" // Default case status
  },
  // notifyType: {type: String, enum:["CaseAssign","LeadAssign","LeadReturnApprove","LeadReturnReject"], required: true},
  unread: { type: Boolean, default: true },
  accepted: { type: Boolean, default: false },
  comment: { type: String, required: false },
  time: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", NotificationSchema);
