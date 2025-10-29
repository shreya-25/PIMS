const mongoose = require("mongoose");

const leadEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "assigned",
      "accepted",
      "declined",
      "reassigned-added",
      "reassigned-removed",
      // NEW:
      "pi-submitted",
      "cm-approved",
      "cm-returned",
      "cm-closed",
      "cm-reopened",
      "cm-deleted" 
    ],
  },
  by: String,               // actor username (CM/Investigator)
  to: [String],             // affected usernames (if any)
  primaryInvestigator: String,
  reason: String,           // for returns/closes (optional)
  leadReturnId: String,     // optional reference to a lead return record
  statusAfter: String,      // leadStatus after this event
  at: { type: Date, default: Date.now },
}, { _id: false });

const leadSchema = new mongoose.Schema(
  {
    leadNo: { type: Number, required: true },
    parentLeadNo: { type: [Number], default: [] },

    incidentNo: String,
    subNumber: [{ type: String }],
    associatedSubNumbers: [{ type: String }],

    assignedDate: { type: Date, required: true },
    completedDate: { type: Date },

    assignedTo: [{
      username: { type: String },
      status: {
        type: String,
        required: true,
        enum: ["pending", "accepted", "declined"],
        default: "pending",
      },
    }],

    primaryInvestigator: {
      type: String, // store username
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // allow null/unset
          return this.assignedTo?.some(a => a.username === v);
        },
        message: "Primary investigator must be one of the assigned investigators.",
      },
    },

    assignedBy: { type: String, required: true },

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

    dueDate: Date,
    priority: String,
      isDeleted:    { type: Boolean, default: false, index: true },
  deletedAt:    { type: Date },
  deletedBy:    { type: String },
  deletedReason:{ type: String },

    caseName: { type: String, required: true },
    caseNo:   { type: String, required: true },

    associatedFlags: [{ type: String }],

    submittedDate:  { type: Date },
    approvedDate:   { type: Date },
    returnedDate:   { type: Date },

    // 🔹 NEW fields you asked for:
    closedDate:     { type: Date },
    reopenedDate:   { type: Date },
    submittedBy:    { type: String },

    accessLevel: {
      type: String,
      enum: ["Only Case Manager and Assignees", "Everyone"],
      default: "Everyone",
    },

    comment: String,

    events: { type: [leadEventSchema], default: [] },
  },
  { timestamps: true }
);

// Uniqueness per case & lead
leadSchema.index({ caseNo: 1, leadNo: 1 }, { unique: true });

// Helpful for chain-of-custody queries and audit timelines
leadSchema.index({ caseNo: 1, caseName: 1, leadNo: 1, "events.at": 1 });
leadSchema.index({ "events.by": 1, caseNo: 1, leadNo: 1 });

leadSchema.query.notDeleted = function() {
  return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("Lead", leadSchema, "leads");
