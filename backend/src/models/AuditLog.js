const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // Context: which case/lead this action belongs to
    caseNo: { type: String, required: true, index: true },
    caseName: { type: String, required: true },
    leadNo: { type: Number, required: true, index: true },
    leadName: { type: String, required: true },

    // What entity was affected
    entityType: {
      type: String,
      required: true,
      enum: [
        "LeadReturnResult",
        "LeadReturn",
        "LRPerson",
        "LRVehicle",
        "LREnclosure",
        "LREvidence",
        "LRPicture",
        "LRAudio",
        "LRVideo",
        "LRScratchpad",
        "LRTimeline"
      ],
      index: true
    },
    entityId: { type: String, required: true }, // leadReturnId, personId, etc.

    // What action was performed
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "RESTORE"],
      index: true
    },

    // Who performed the action
    performedBy: {
      username: { type: String, required: true },
      userId: { type: String }, // optional: if you have user IDs
      role: { type: String } // optional: "Investigator", "Case Manager", etc.
    },

    // When it happened
    timestamp: { type: Date, default: Date.now, index: true },

    // What changed (before/after snapshots)
    oldValue: { type: mongoose.Schema.Types.Mixed }, // full object before change
    newValue: { type: mongoose.Schema.Types.Mixed }, // full object after change

    // Optional metadata
    metadata: {
      ip: { type: String },
      userAgent: { type: String },
      reason: { type: String }, // optional: user-provided reason for change
      notes: { type: String }
    },

    // For categorization/filtering
    accessLevel: {
      type: String,
      enum: ["Everyone", "Only Case Manager"],
      default: "Everyone"
    }
  },
  {
    timestamps: true, // adds createdAt, updatedAt
    collection: "AuditLogs"
  }
);

// Compound indexes for common queries
auditLogSchema.index({ caseNo: 1, leadNo: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ "performedBy.username": 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
