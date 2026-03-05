const mongoose = require("mongoose");
const { Schema } = mongoose;
const { LR_ACCESS_LEVELS } = require("../constants/accessLevels");

const completeLeadReturnSchema = new mongoose.Schema(
    {
        // ── Stable ObjectId refs ──────────────────────────────────
        leadReturnId: { type: Schema.Types.ObjectId, ref: "LeadReturn", required: true },
        caseId:       { type: Schema.Types.ObjectId, ref: "Case", required: true },
        leadId:       { type: Schema.Types.ObjectId, ref: "Lead", required: true },

        // ── Version control fields ────────────────────────────────
        versionId: {
            type: Number,
            required: true,
            default: 1
        },
        isCurrentVersion: {
            type: Boolean,
            default: true,
        },
        parentVersionId: {
            type: Schema.Types.ObjectId,
            ref: "CompleteleadReturn",
            default: null
        },
        versionCreatedAt: {
            type: Date,
            default: Date.now
        },
        versionCreatedBy: {
            type: String,
            required: true
        },
        versionReason: {
            type: String,
            enum: ["Created", "Submitted", "Approved", "Returned", "Reopened", "Manual Snapshot"],
            required: true
        },

        // Core Lead Return Info (snapshots from leadreturn.js)
        leadNo: { type: Number, required: true },
        returnNo: { type: Number },
        assignedTo: {
            assignees: [{ type: String, required: true }],
            lRStatus: {
                type: String,
                enum: ["Assigned", "Pending", "Approved", "Returned", "Completed", "Submitted"],
                default: "Assigned"
            }
        },
        assignedBy: {
            assignee: { type: String, required: true },
            lRStatus: {
                type: String,
                enum: ["Assigned", "Pending"],
                default: "Assigned"
            }
        },
        description: { type: String, required: true },
        submittedDate: { type: Date },
        approvedDate: { type: Date },
        returnedDate: { type: Date },
        caseName: { type: String, required: true },
        caseNo: { type: String, required: true },
        accessLevel: {
            type: String,
            enum: LR_ACCESS_LEVELS,
            default: "Everyone"
        },

        // ── Related-record ObjectId arrays (replaces embedded snapshots) ──
        leadReturnResultIds: [{ type: Schema.Types.ObjectId, ref: "LeadReturnResult" }],
        audioIds:            [{ type: Schema.Types.ObjectId, ref: "LRAudio" }],
        videoIds:            [{ type: Schema.Types.ObjectId, ref: "LRVideo" }],
        pictureIds:          [{ type: Schema.Types.ObjectId, ref: "LRPicture" }],
        enclosureIds:        [{ type: Schema.Types.ObjectId, ref: "LREnclosure" }],
        evidenceIds:         [{ type: Schema.Types.ObjectId, ref: "LREvidence" }],
        personIds:           [{ type: Schema.Types.ObjectId, ref: "LRPerson" }],
        vehicleIds:          [{ type: Schema.Types.ObjectId, ref: "LRVehicle" }],
        scratchpadIds:       [{ type: Schema.Types.ObjectId, ref: "LRScratchpad" }],
        timelineIds:         [{ type: Schema.Types.ObjectId, ref: "LRTimeline" }],
    },
    {
        timestamps: true,
        index: [
            { leadNo: 1, isCurrentVersion: 1 },
            { parentVersionId: 1 }
        ]
    }
);

// Compound index to ensure unique version numbers per lead + case combination
completeLeadReturnSchema.index({ leadNo: 1, caseNo: 1, versionId: 1 }, { unique: true });

// Index to quickly find current version for a lead in a specific case
completeLeadReturnSchema.index({ leadNo: 1, caseNo: 1, isCurrentVersion: 1 });

// ObjectId-based indexes
completeLeadReturnSchema.index({ leadReturnId: 1, isCurrentVersion: 1 });
completeLeadReturnSchema.index({ caseId: 1, leadNo: 1, versionId: -1 });

// Static method to get the latest version for a lead (with optional case filtering)
completeLeadReturnSchema.statics.getCurrentVersion = async function(leadNo, caseNo = null, caseName = null) {
    const query = { leadNo, isCurrentVersion: true };
    if (caseNo) query.caseNo = caseNo;
    if (caseName) query.caseName = caseName;
    return this.findOne(query).sort({ versionId: -1 }).lean();
};

// Static method to get all versions for a lead (with optional case filtering)
completeLeadReturnSchema.statics.getAllVersions = async function(leadNo, caseNo = null, caseName = null) {
    const query = { leadNo };
    if (caseNo) query.caseNo = caseNo;
    if (caseName) query.caseName = caseName;
    return this.find(query).sort({ versionId: -1 }).lean();
};

// Static method to get a specific version (with optional case filtering)
completeLeadReturnSchema.statics.getVersion = async function(leadNo, versionId, caseNo = null, caseName = null) {
    const query = { leadNo, versionId };
    if (caseNo) query.caseNo = caseNo;
    if (caseName) query.caseName = caseName;
    return this.findOne(query).lean();
};

// Static method to get a version with all related data populated
completeLeadReturnSchema.statics.getVersionPopulated = async function(leadNo, versionId, caseNo = null, caseName = null) {
    const query = { leadNo, versionId };
    if (caseNo) query.caseNo = caseNo;
    if (caseName) query.caseName = caseName;
    return this.findOne(query)
        .populate("leadReturnResultIds")
        .populate("audioIds")
        .populate("videoIds")
        .populate("pictureIds")
        .populate("enclosureIds")
        .populate("evidenceIds")
        .populate("personIds")
        .populate("vehicleIds")
        .populate("scratchpadIds")
        .populate("timelineIds")
        .lean();
};

module.exports = mongoose.model("CompleteleadReturn", completeLeadReturnSchema, "CompleteleadReturns");
