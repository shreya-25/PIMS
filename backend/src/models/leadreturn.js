const mongoose = require("mongoose");
const { LR_ACCESS_LEVELS } = require("../constants/accessLevels");

const leadReturnSchema = new mongoose.Schema(
    {
        // ── Stable ObjectId refs ──────────────────────────────────
        caseId:  { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },
        leadId:  { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },

        assignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        assignedToUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

        // ── Existing fields (kept as-is) ──────────────────────────
        leadNo: { type: Number, required: true },
        returnNo: { type: Number, required: true },

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
        isDeleted:       { type: Boolean, default: false },
        deletedAt:       { type: Date, default: null },
        deletedBy:       { type: String, default: null },
        deletedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────
leadReturnSchema.index({ leadId: 1, returnNo: 1 }, { unique: true });
leadReturnSchema.index({ caseId: 1, leadNo: 1 });
leadReturnSchema.index({ caseNo: 1, leadNo: 1 }, { unique: true });
leadReturnSchema.index({ assignedToUserIds: 1 });
leadReturnSchema.index({ isDeleted: 1, "assignedTo.lRStatus": 1 });

leadReturnSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LeadReturn", leadReturnSchema, "LeadReturns");
