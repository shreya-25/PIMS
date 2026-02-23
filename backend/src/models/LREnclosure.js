const mongoose = require("mongoose");
const { Schema } = mongoose;
const { LR_ACCESS_LEVELS } = require("../constants/accessLevels");

const lrEnclosureSchema = new mongoose.Schema(
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

        // Enclosure details
        type:                  { type: String },
        enclosureDescription:  { type: String },

        // File storage
        filePath:     { type: String, required: false },
        s3Key:        { type: String, default: null },
        originalName: { type: String, default: null },
        filename:     { type: String, default: null },

        // Link
        isLink: { type: Boolean, default: false },
        link:   { type: String, default: null },

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
        isDeleted:       { type: Boolean, default: false },
        deletedAt:       { type: Date, default: null },
        deletedBy:       { type: String, default: null },
        deletedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true }
);

lrEnclosureSchema.index({ leadReturnObjectId: 1, createdAt: -1 });
lrEnclosureSchema.index({ caseId: 1, leadNo: 1 });

lrEnclosureSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LREnclosure", lrEnclosureSchema, "LREnclosures");
