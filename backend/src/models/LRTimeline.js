const mongoose = require("mongoose");
const { Schema } = mongoose;
const { LR_ACCESS_LEVELS } = require("../constants/accessLevels");

const lrTimelineSchema = new mongoose.Schema(
    {
        // ── Stable ObjectId refs ──────────────────────────────────
        caseId:            { type: Schema.Types.ObjectId, ref: "Case", default: null },
        leadId:            { type: Schema.Types.ObjectId, ref: "Lead", default: null },
        leadReturnObjectId:{ type: Schema.Types.ObjectId, ref: "LeadReturn", required: true },
        enteredByUserId:   { type: Schema.Types.ObjectId, ref: "User", default: null },

        // ── Existing fields ───────────────────────────────────────
        leadNo:        { type: Number, required: true },
        description:   { type: String },                   // lead description snapshot
        enteredBy:     { type: String, required: true },   // username snapshot
        caseName:      { type: String, required: true },   // snapshot
        caseNo:        { type: String, required: true },   // snapshot
        leadReturnId:  { type: String, required: true },
        enteredDate:   { type: Date, required: true },

        // Timeline details
        eventDate:        { type: Date, required: true },
        eventStartDate:   { type: Date },
        eventEndDate:     { type: Date },
        eventStartTime:   { type: Date },
        eventEndTime:     { type: Date },
        eventLocation:    { type: String },
        eventDescription: { type: String, required: true },
        timelineFlag: {
            type: [String],
            default: []
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
        isDeleted:       { type: Boolean, default: false },
        deletedAt:       { type: Date, default: null },
        deletedBy:       { type: String, default: null },
        deletedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true }
);

lrTimelineSchema.index({ leadReturnObjectId: 1, createdAt: -1 });
lrTimelineSchema.index({ caseId: 1, leadNo: 1 });

lrTimelineSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LRTimeline", lrTimelineSchema, "LRTimelines");
