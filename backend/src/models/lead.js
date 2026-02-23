const mongoose = require("mongoose");

const leadEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "assigned",
        "accepted",
        "declined",
        "reassigned-added",
        "reassigned-removed",
        "pi-submitted",
        "cm-approved",
        "cm-returned",
        "cm-closed",
        "cm-reopened",
        "cm-deleted",
      ],
    },

    // NEW (stable refs)
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    toUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],

    primaryInvestigatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Keep legacy snapshot strings (optional; safe for UI/audit display)
    by: { type: String, default: null }, // username snapshot
    to: { type: [String], default: [] }, // usernames snapshot
    primaryInvestigator: { type: String, default: null }, // username snapshot

    reason: { type: String, default: null },

    // change to ObjectId ref; keep string snapshot if you still pass strings in UI
    leadReturnObjectId: { type: mongoose.Schema.Types.ObjectId, ref: "LeadReturn", default: null },
    leadReturnId: { type: String, default: null }, // legacy snapshot

    statusAfter: { type: String, default: null }, // uses your LeadStatus enum values (no change)
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leadAssigneeSchema = new mongoose.Schema(
  {
    // NEW (stable ref)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // keep existing username (snapshot / backward compatible)
    username: { type: String, default: null },

    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    leadNo: { type: Number, required: true },
    parentLeadNo: { type: [Number], default: [] },

    incidentNo: { type: String, default: null },
    subNumber: { type: [String], default: [] },
    associatedSubNumbers: { type: [String], default: [] },

    assignedDate: { type: Date, required: true },
    completedDate: { type: Date, default: null },

    assignedTo: { type: [leadAssigneeSchema], default: [] },

    // NEW (stable ref) + keep existing field name + enum unchanged
    primaryInvestigatorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // allow null/unset
          return (this.assignedTo || []).some((a) => a.userId && a.userId.equals(v));
        },
        message: "Primary investigator must be one of the assigned investigators.",
      },
    },

    // keep existing username version for compatibility/UI
    primaryInvestigator: {
      type: String, // username snapshot
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return (this.assignedTo || []).some((a) => a.username === v);
        },
        message: "Primary investigator must be one of the assigned investigators.",
      },
    },

    // NEW stable ref
    assignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // keep existing field for compatibility/UI
    assignedBy: { type: String, required: true }, // username snapshot

    summary: { type: String, required: true },
    description: { type: String, required: true },

    leadStatus: {
      type: String,
      required: true,
      enum: [
        "Created",
        "Assigned",
        "Accepted",
        "To Reassign",
        "Rejected",
        "In Review",
        "Approved",
        "Returned",
        "Completed",
        "Closed",
        "Reopened",
        "Deleted",
      ],
      default: "Assigned",
    },

    dueDate: { type: Date, default: null },
    priority: { type: String, default: null },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedBy: { type: String, default: null }, // username snapshot
    deletedReason: { type: String, default: null },

    // Case link (stable)
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },

    // keep snapshots (you already rely on them)
    caseName: { type: String, required: true },
    caseNo: { type: String, required: true },

    associatedFlags: { type: [String], default: [] },

    submittedDate: { type: Date, default: null },
    approvedDate: { type: Date, default: null },
    returnedDate: { type: Date, default: null },

    closedDate: { type: Date, default: null },
    reopenedDate: { type: Date, default: null },

    // NEW stable ref + keep existing username snapshot
    submittedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    submittedBy: { type: String, default: null }, // username snapshot

    accessLevel: {
      type: String,
      enum: ["Only Case Manager and Assignees", "Everyone"],
      default: "Everyone",
    },

    comment: { type: String, default: null },

    events: { type: [leadEventSchema], default: [] },
  },
  { timestamps: true }
);

// Uniqueness per case & lead (keep as-is)
leadSchema.index({ caseNo: 1, leadNo: 1 }, { unique: true });

// Helpful for chain-of-custody queries and audit timelines (keep existing intent)
leadSchema.index({ caseNo: 1, leadNo: 1, "events.at": 1 });
leadSchema.index({ "events.by": 1, caseNo: 1, leadNo: 1 });

// NEW: common query indexes (safe)
leadSchema.index({ caseId: 1, leadNo: 1 }); // fast lookups within a case
leadSchema.index({ caseId: 1, leadStatus: 1 }); // case page filters
leadSchema.index({ "assignedTo.userId": 1, leadStatus: 1 }); // "my leads" dashboards
leadSchema.index({ primaryInvestigatorUserId: 1 }); // PI dashboards

leadSchema.query.notDeleted = function () {
  return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("Lead", leadSchema, "leads");