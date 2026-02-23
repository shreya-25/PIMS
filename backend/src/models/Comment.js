const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommentSchema = new mongoose.Schema(
    {
        // ── Stable ObjectId refs ──────────────────────────────────
        caseId:          { type: Schema.Types.ObjectId, ref: "Case", default: null },
        leadId:          { type: Schema.Types.ObjectId, ref: "Lead", default: null },
        enteredByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },

        // ── Existing fields ───────────────────────────────────────
        leadNo: { type: Number, required: true },
        description: { type: String, required: true },
        enteredBy: { type: String, required: true },
        caseName: { type: String, required: true },
        caseNo: { type: String, required: true },
        enteredDate: { type: Date, required: true },
        tag: { type: String, required: true },
        comment: { type: String, required: true },

        // Soft-delete
        isDeleted:  { type: Boolean, default: false },
        deletedAt:  { type: Date, default: null },
        deletedBy:  { type: String, default: null },
    },
    { timestamps: true }
);

// Indexes
CommentSchema.index({ caseNo: 1, leadNo: 1, createdAt: -1 });
CommentSchema.index({ caseId: 1, leadNo: 1 });

CommentSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("Comment", CommentSchema, "Comments");
