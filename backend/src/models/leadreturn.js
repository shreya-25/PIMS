const mongoose = require("mongoose");

// Standardized access-level enum used across ALL LR* tables
const LR_ACCESS_LEVELS = ["Everyone", "Case Manager and Assignees", "Case Manager Only"];

const leadReturnSchema = new mongoose.Schema(
    {
        // ── Stable ObjectId refs ──────────────────────────────────
        caseId:  { type: mongoose.Schema.Types.ObjectId, ref: "Case", default: null },
        leadId:  { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },

        assignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        assignedToUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

        // ── Existing fields (kept as-is) ──────────────────────────
        leadNo: { type: Number, required: true },

        assignedTo: {
            assignees: [{ type: String, required: true }], // username snapshots
            lRStatus: {
                type: String,
                enum: ["Assigned", "Pending", "Approved", "Returned", "Completed", "Submitted"],
                default: "Assigned"
            }
        },
        assignedBy: {
            assignee: { type: String, required: true }, // username snapshot
            lRStatus: {
                type: String,
                enum: ["Assigned", "Pending"],
                default: "Assigned"
            }
        },

        description: { type: String, required: true },

        submittedDate:  { type: Date },
        approvedDate:   { type: Date },
        returnedDate:   { type: Date },

        // Snapshots (display only, not used as keys)
        caseName: { type: String, required: true },
        caseNo:   { type: String, required: true },

        accessLevel: {
            type: String,
            enum: LR_ACCESS_LEVELS,
            default: "Everyone"
        },

        // Reference to complete lead return version
        completeLeadReturnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompleteleadReturn",
        },
        currentVersionId: {
            type: Number,
            default: 1
        },

        // Soft-delete
        isDeleted:  { type: Boolean, default: false },
        deletedAt:  { type: Date, default: null },
        deletedBy:  { type: String, default: null },
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────
leadReturnSchema.index({ caseId: 1, leadNo: 1 });
leadReturnSchema.index({ caseNo: 1, leadNo: 1 }, { unique: true });
leadReturnSchema.index({ assignedToUserIds: 1 });
leadReturnSchema.index({ isDeleted: 1, "assignedTo.lRStatus": 1 });

leadReturnSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LeadReturn", leadReturnSchema, "LeadReturns");
module.exports.LR_ACCESS_LEVELS = LR_ACCESS_LEVELS;
