const mongoose = require("mongoose");
const { Schema } = mongoose;
const { LR_ACCESS_LEVELS } = require("./leadreturn");

const lrScratchpadSchema = new mongoose.Schema(
    {
        // ── Stable ObjectId refs ──────────────────────────────────
        caseId:            { type: Schema.Types.ObjectId, ref: "Case", default: null },
        leadId:            { type: Schema.Types.ObjectId, ref: "Lead" },  // optional for Case-level scratchpads
        leadReturnObjectId:{ type: Schema.Types.ObjectId, ref: "LeadReturn" }, // optional for Case-level
        enteredByUserId:   { type: Schema.Types.ObjectId, ref: "User", default: null },

        // ── Existing fields ───────────────────────────────────────
        leadNo:        { type: Number },
        description:   { type: String },                   // lead description snapshot
        enteredBy:     { type: String, required: true },   // username snapshot
        caseName:      { type: String, required: true },   // snapshot
        caseNo:        { type: String, required: true },   // snapshot
        leadReturnId:  { type: String },
        enteredDate:   { type: Date, required: true },

        text: { type: String, required: true },
        type: { type: String, required: true, enum: ["Case", "Lead"] },

        accessLevel: {
            type: String,
            enum: LR_ACCESS_LEVELS,
            default: "Everyone"
        },

        // Reference to complete lead return version
        completeLeadReturnId: {
            type: Schema.Types.ObjectId,
            ref: "CompleteleadReturn",
        },

        // Soft-delete
        isDeleted:  { type: Boolean, default: false },
        deletedAt:  { type: Date, default: null },
        deletedBy:  { type: String, default: null },
    },
    { timestamps: true }
);

lrScratchpadSchema.index({ leadReturnObjectId: 1, createdAt: -1 });
lrScratchpadSchema.index({ caseId: 1, type: 1 });

lrScratchpadSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LRScratchpad", lrScratchpadSchema, "LRScratchpads");
