const mongoose = require("mongoose");
const { Schema } = mongoose;
const { LR_ACCESS_LEVELS } = require("../constants/accessLevels");

const lrPersonSchema = new mongoose.Schema(
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

        // Person details
        lastName:       { type: String },
        firstName:      { type: String },
        middleInitial:  { type: String },
        suffix:         { type: String },
        cellNumber:     { type: String },
        alias:          { type: String },
        businessName:   { type: String },
        address: {
            street1:   { type: String },
            street2:   { type: String },
            building:  { type: String },
            apartment: { type: String },
            city:      { type: String },
            state:     { type: String },
            zipCode:   { type: String },
        },
        ssn:          { type: String },
        dateOfBirth:  { type: Date },
        email:        { type: String },
        occupation:   { type: String },
        personType:   { type: String },
        condition:    { type: String },
        cautionType:  { type: String },
        sex:          { type: String, enum: ["Male", "Female", "Other", ""] },
        race:         { type: String },
        ethnicity:    { type: String },
        skinTone:     { type: String },
        eyeColor:     { type: String },
        hairColor:    { type: String },
        glasses:      { type: String, enum: ["Yes", "No", ""] },
        height: {
            feet:   { type: Number },
            inches: { type: Number },
        },
        weight:  { type: Number },
        scar:    { type: String },
        tattoo:  { type: String },
        mark:    { type: String },
        additionalData: { type: Schema.Types.Mixed },

        // Photo
        photoS3Key:       { type: String },
        photoOriginalName:{ type: String },
        photoFilename:    { type: String },

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

lrPersonSchema.index({ leadReturnObjectId: 1, createdAt: -1 });
lrPersonSchema.index({ caseId: 1, leadNo: 1 });

lrPersonSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LRPerson", lrPersonSchema, "LRPersons");
