const mongoose = require("mongoose");
const { Schema } = mongoose;
const { LR_ACCESS_LEVELS } = require("./leadreturn");

const lrEvidenceSchema = new mongoose.Schema(
    {
        // ── Stable ObjectId refs ──────────────────────────────────
        caseId:            { type: Schema.Types.ObjectId, ref: "Case", default: null },
        leadId:            { type: Schema.Types.ObjectId, ref: "Lead", default: null },
        leadReturnObjectId:{ type: Schema.Types.ObjectId, ref: "LeadReturn", default: null },
        enteredByUserId:   { type: Schema.Types.ObjectId, ref: "User", default: null },

        // ── Existing fields ───────────────────────────────────────
        leadNo:        { type: Number, required: true },
        description:   { type: String, required: true },  // lead description snapshot
        enteredBy:     { type: String, required: true },   // username snapshot
        caseName:      { type: String, required: true },   // snapshot
        caseNo:        { type: String, required: true },   // snapshot
        leadReturnId:  { type: String, required: true },
        enteredDate:   { type: Date, required: true },

        // Evidence details
        collectionDate:      { type: Date, required: true },
        disposedDate:        { type: Date },
        type: {
            type: String,
            enum: ["Document", "Business Records", "Cellular Phone Records", "Deposition", "Statement", ""],
        },
        evidenceDescription: { type: String, required: true },

        // File storage
        s3Key:        { type: String, trim: true },
        originalName: { type: String },
        filename:     { type: String },
        filePath:     { type: String },

        // Link
        isLink: { type: Boolean, default: false },
        link: {
            type: String,
            trim: true,
            validate: {
                validator: v => !v || /^https?:\/\/.+/i.test(v),
                message: 'link must be a valid URL'
            }
        },

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

lrEvidenceSchema.index({ leadReturnObjectId: 1, createdAt: -1 });
lrEvidenceSchema.index({ caseId: 1, leadNo: 1 });

lrEvidenceSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LREvidence", lrEvidenceSchema, "LREvidences");
