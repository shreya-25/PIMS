const mongoose = require("mongoose");
const { LR_ACCESS_LEVELS } = require("./leadreturn");

const auditLogSchema = new mongoose.Schema(
  {
    // Context: which case/lead this action belongs to
    caseNo: { type: String, required: true },
    caseName: { type: String, required: true },
    leadNo: { type: Number, required: true },
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
    },
    entityId: { type: String, required: true },

    // What action was performed
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "RESTORE"],
    },

    // Who performed the action
    performedBy: {
      username: { type: String, required: true },
      userId: { type: String },
      role: { type: String }
    },

    // When it happened
    timestamp: { type: Date, default: Date.now },

    // What changed (before/after snapshots)
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },

    // Optional metadata
    metadata: {
      ip: { type: String },
      userAgent: { type: String },
      reason: { type: String },
      notes: { type: String }
    },

    // For categorization/filtering
    accessLevel: {
      type: String,
      enum: LR_ACCESS_LEVELS,
      default: "Everyone"
    }
  },
  {
    timestamps: true,
    collection: "AuditLogs"
  }
);

// Compound indexes for common queries (removed redundant single-field indexes)
auditLogSchema.index({ caseNo: 1, leadNo: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ "performedBy.username": 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
