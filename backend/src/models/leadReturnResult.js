const mongoose = require("mongoose");
const { LR_ACCESS_LEVELS } = require("../constants/accessLevels");

const leadReturnResultsSchema = new mongoose.Schema(
    {
        // ── Stable ObjectId refs (populated when available) ──────
        caseId:            { type: mongoose.Schema.Types.ObjectId, ref: "Case", default: null },
        leadId:            { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
        leadReturnObjectId:{ type: mongoose.Schema.Types.ObjectId, ref: "LeadReturn", required: true },
        enteredByUserId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

        // ── Existing fields ───────────────────────────────────────
        leadNo:            { type: Number, required: true },
        description:       { type: String, required: true },  // lead description snapshot

        enteredDate:       { type: Date },
        enteredBy:         { type: String, required: true },   // username snapshot
        lastModifiedDate:  { type: Date },
        lastModifiedBy:    { type: String },

        // Snapshots (display only)
        caseName:          { type: String, required: true },
        caseNo:            { type: String, required: true },

        // The alphabetic return identifier (A, B, C...)
        leadReturnId:      { type: String, required: true },
        // The actual narrative text
        leadReturnResult:  { type: String, required: true },

        accessLevel: {
            type: String,
            enum: LR_ACCESS_LEVELS,
            default: "Everyone"
        },

        // Soft delete fields
        isDeleted:       { type: Boolean, default: false },
        deletedAt:       { type: Date },
        deletedBy:       { type: String },
        deletedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

        // Reference to complete lead return version
        completeLeadReturnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompleteleadReturn",
        }
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────
leadReturnResultsSchema.index({ leadReturnObjectId: 1, leadReturnId: 1 });
leadReturnResultsSchema.index({ caseId: 1, leadNo: 1 });
leadReturnResultsSchema.index({ leadNo: 1, caseNo: 1, isDeleted: 1 });

leadReturnResultsSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LeadReturnResult", leadReturnResultsSchema, "LeadReturnResults");
