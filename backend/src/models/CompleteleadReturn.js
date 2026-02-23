const mongoose = require("mongoose");
const { Schema } = mongoose;
const { LR_ACCESS_LEVELS } = require("./leadreturn");

const completeLeadReturnSchema = new mongoose.Schema(
    {
        // ── Stable ObjectId refs ──────────────────────────────────
        leadReturnId: { type: Schema.Types.ObjectId, ref: "LeadReturn" },
        caseId:       { type: Schema.Types.ObjectId, ref: "Case" },
        leadId:       { type: Schema.Types.ObjectId, ref: "Lead" },

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

        // Lead Return Result snapshot
        leadReturnResults: [{
            resultId: { type: Schema.Types.ObjectId },
            leadReturnId: { type: String },
            description: { type: String },
            enteredDate: { type: Date },
            enteredBy: { type: String },
            lastModifiedDate: { type: Date },
            lastModifiedBy: { type: String },
            leadReturnResult: { type: String },
            accessLevel: { type: String },
            isDeleted: { type: Boolean, default: false },
            deletedAt: { type: Date },
            deletedBy: { type: String }
        }],

        // Audio files snapshot
        audios: [{
            audioId: { type: Schema.Types.ObjectId },
            description: { type: String },
            enteredBy: { type: String },
            enteredDate: { type: Date },
            dateAudioRecorded: { type: Date },
            audioDescription: { type: String },
            isLink: { type: Boolean, default: false },
            link: { type: String },
            s3Key: { type: String },
            originalName: { type: String },
            filename: { type: String },
            filePath: { type: String },
            accessLevel: { type: String }
        }],

        // Video files snapshot
        videos: [{
            videoId: { type: Schema.Types.ObjectId },
            description: { type: String },
            enteredBy: { type: String },
            enteredDate: { type: Date },
            dateVideoRecorded: { type: Date },
            videoDescription: { type: String },
            filePath: { type: String },
            s3Key: { type: String },
            originalName: { type: String },
            filename: { type: String },
            isLink: { type: Boolean, default: false },
            link: { type: String },
            accessLevel: { type: String }
        }],

        // Pictures snapshot
        pictures: [{
            pictureId: { type: Schema.Types.ObjectId },
            description: { type: String },
            enteredBy: { type: String },
            enteredDate: { type: Date },
            datePictureTaken: { type: Date },
            pictureDescription: { type: String },
            s3Key: { type: String },
            originalName: { type: String },
            filename: { type: String },
            isLink: { type: Boolean, default: false },
            link: { type: String },
            filePath: { type: String },
            accessLevel: { type: String }
        }],

        // Enclosures snapshot
        enclosures: [{
            enclosureId: { type: Schema.Types.ObjectId },
            description: { type: String },
            enteredBy: { type: String },
            enteredDate: { type: Date },
            type: { type: String },
            enclosureDescription: { type: String },
            filePath: { type: String },
            s3Key: { type: String },
            originalName: { type: String },
            filename: { type: String },
            accessLevel: { type: String },
            isLink: { type: Boolean, default: false },
            link: { type: String }
        }],

        // Evidence snapshot
        evidences: [{
            evidenceId: { type: Schema.Types.ObjectId },
            description: { type: String },
            enteredBy: { type: String },
            enteredDate: { type: Date },
            collectionDate: { type: Date },
            disposedDate: { type: Date },
            type: { type: String },
            evidenceDescription: { type: String },
            s3Key: { type: String },
            originalName: { type: String },
            filename: { type: String },
            filePath: { type: String },
            isLink: { type: Boolean, default: false },
            link: { type: String },
            accessLevel: { type: String }
        }],

        // Persons snapshot
        persons: [{
            personId: { type: Schema.Types.ObjectId },
            description: { type: String },
            enteredBy: { type: String },
            enteredDate: { type: Date },
            lastName: { type: String },
            firstName: { type: String },
            middleInitial: { type: String },
            suffix: { type: String },
            cellNumber: { type: String },
            alias: { type: String },
            businessName: { type: String },
            address: {
                street1: { type: String },
                street2: { type: String },
                building: { type: String },
                apartment: { type: String },
                city: { type: String },
                state: { type: String },
                zipCode: { type: String }
            },
            ssn: { type: String },
            age: { type: Number },
            email: { type: String },
            occupation: { type: String },
            personType: { type: String },
            condition: { type: String },
            cautionType: { type: String },
            sex: { type: String },
            race: { type: String },
            ethnicity: { type: String },
            skinTone: { type: String },
            eyeColor: { type: String },
            hairColor: { type: String },
            glasses: { type: String },
            height: {
                feet: { type: Number },
                inches: { type: Number }
            },
            weight: { type: Number },
            scar: { type: String },
            tattoo: { type: String },
            mark: { type: String },
            additionalData: { type: Schema.Types.Mixed },
            accessLevel: { type: String }
        }],

        // Vehicles snapshot
        vehicles: [{
            vehicleId: { type: Schema.Types.ObjectId },
            description: { type: String },
            enteredBy: { type: String },
            enteredDate: { type: Date },
            year: { type: String },
            make: { type: String },
            model: { type: String },
            plate: { type: String },
            vin: { type: String },
            state: { type: String },
            category: { type: String },
            type: { type: String },
            primaryColor: { type: String },
            secondaryColor: { type: String },
            information: { type: String },
            additionalData: { type: Schema.Types.Mixed },
            accessLevel: { type: String }
        }],

        // Scratchpad entries snapshot
        scratchpads: [{
            scratchpadId: { type: Schema.Types.ObjectId },
            description: { type: String },
            enteredBy: { type: String },
            enteredDate: { type: Date },
            text: { type: String },
            type: { type: String },
            accessLevel: { type: String }
        }],

        // Timeline entries snapshot
        timelines: [{
            timelineId: { type: Schema.Types.ObjectId },
            description: { type: String },
            enteredBy: { type: String },
            enteredDate: { type: Date },
            eventDate: { type: Date },
            eventStartDate: { type: Date },
            eventEndDate: { type: Date },
            eventStartTime: { type: Date },
            eventEndTime: { type: Date },
            eventLocation: { type: String },
            eventDescription: { type: String },
            timelineFlag: { type: [String], default: [] },
            accessLevel: { type: String }
        }]
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

module.exports = mongoose.model("CompleteleadReturn", completeLeadReturnSchema, "CompleteleadReturns");
