const mongoose = require("mongoose");
const { Schema } = mongoose;
const { LR_ACCESS_LEVELS } = require("./leadreturn");

const lrVehicleSchema = new mongoose.Schema(
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

        // Vehicle Information
        year:           { type: String },
        make:           { type: String },
        model:          { type: String },
        plate:          { type: String },
        vin:            { type: String },
        state:          { type: String },
        category:       { type: String },
        type:           { type: String },
        primaryColor:   { type: String },
        secondaryColor: { type: String },
        information:    { type: String },

        additionalData: { type: Schema.Types.Mixed },

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

lrVehicleSchema.index({ leadReturnObjectId: 1, createdAt: -1 });
lrVehicleSchema.index({ caseId: 1, leadNo: 1 });

lrVehicleSchema.query.notDeleted = function () {
    return this.where({ isDeleted: { $ne: true } });
};

module.exports = mongoose.model("LRVehicle", lrVehicleSchema, "LRVehicles");
