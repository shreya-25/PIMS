const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leadReturnAuditLogSchema = new Schema({
    // ── Stable ObjectId refs ──────────────────────────────────
    caseId:       { type: Schema.Types.ObjectId, ref: "Case" },
    leadId:       { type: Schema.Types.ObjectId, ref: "Lead" },
    leadReturnObjectId: { type: Schema.Types.ObjectId, ref: "LeadReturn" },
    performedByUserId:  { type: Schema.Types.ObjectId, ref: "User" },

    // ── Existing fields ───────────────────────────────────────
    leadNo: {
        type: Number,
        required: true,
    },
    caseNo: {
        type: String,
    },

    action: {
        type: String,
        required: true,
        enum: [
            "LEAD_CREATED", "LEAD_ASSIGNED", "LEAD_SUBMITTED",
            "LEAD_APPROVED", "LEAD_RETURNED", "LEAD_REOPENED",
            "LEAD_COMPLETED", "LEAD_DELETED", "LEAD_UPDATED",

            "NARRATIVE_CREATED", "NARRATIVE_UPDATED", "NARRATIVE_DELETED",

            "PERSON_ADDED", "PERSON_UPDATED", "PERSON_DELETED",
            "VEHICLE_ADDED", "VEHICLE_UPDATED", "VEHICLE_DELETED",
            "TIMELINE_ADDED", "TIMELINE_UPDATED", "TIMELINE_DELETED",
            "EVIDENCE_ADDED", "EVIDENCE_UPDATED", "EVIDENCE_DELETED",

            "PICTURE_UPLOADED", "PICTURE_DELETED",
            "AUDIO_UPLOADED", "AUDIO_DELETED",
            "VIDEO_UPLOADED", "VIDEO_DELETED",
            "ENCLOSURE_UPLOADED", "ENCLOSURE_DELETED",

            "NOTE_CREATED", "NOTE_UPDATED", "NOTE_DELETED",

            "SNAPSHOT_CREATED", "VERSION_RESTORED", "VERSION_COMPARED",

            "LEAD_VIEWED", "LEAD_EXPORTED", "LEAD_PRINTED"
        ]
    },

    entityType: {
        type: String,
        enum: [
            "LeadReturn", "Narrative", "Person", "Vehicle",
            "Timeline", "Evidence", "Picture", "Audio",
            "Video", "Enclosure", "Note", "Version"
        ]
    },
    entityId: {
        type: String
    },

    performedBy: {
        username: { type: String, required: true },
        userId:   { type: String },
        role:     { type: String },
        badge:    { type: String }
    },

    description: {
        type: String,
        required: true
    },

    changes: {
        before: { type: Schema.Types.Mixed },
        after:  { type: Schema.Types.Mixed }
    },

    fieldChanges: [{
        field:    String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed
    }],

    metadata: {
        ipAddress:       String,
        userAgent:       String,
        sessionId:       String,
        versionId:       Number,
        reasonForChange: String,
        comments:        String
    },

    timestamp: {
        type: Date,
        default: Date.now,
    },

    chainOfCustody: {
        transferredFrom: String,
        transferredTo:   String,
        transferReason:  String,
        transferDate:    Date
    }
}, {
    timestamps: true
});

// Compound indexes (cover all query patterns used by static methods)
leadReturnAuditLogSchema.index({ caseId: 1, leadNo: 1, timestamp: -1 });
leadReturnAuditLogSchema.index({ leadNo: 1, timestamp: -1 });
leadReturnAuditLogSchema.index({ 'performedBy.username': 1, timestamp: -1 });
leadReturnAuditLogSchema.index({ performedByUserId: 1, timestamp: -1 });
leadReturnAuditLogSchema.index({ action: 1, timestamp: -1 });
leadReturnAuditLogSchema.index({ entityType: 1, entityId: 1 });

// Static method to log an action
leadReturnAuditLogSchema.statics.logAction = async function(logData) {
    try {
        const log = new this(logData);
        await log.save();
        return log;
    } catch (error) {
        console.error("Error creating audit log:", error);
        throw error;
    }
};

// Static method to get audit trail for a lead
leadReturnAuditLogSchema.statics.getAuditTrail = async function(leadNo, options = {}) {
    const {
        startDate, endDate, action,
        performedBy, entityType,
        limit = 100, skip = 0
    } = options;

    const query = { leadNo };
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (action) query.action = action;
    if (performedBy) query['performedBy.username'] = performedBy;
    if (entityType) query.entityType = entityType;

    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
};

// Static method to get chain of custody
leadReturnAuditLogSchema.statics.getChainOfCustody = async function(leadNo) {
    return this.find({
        leadNo,
        action: {
            $in: [
                "LEAD_CREATED", "LEAD_ASSIGNED", "LEAD_SUBMITTED",
                "LEAD_APPROVED", "LEAD_RETURNED", "LEAD_REOPENED",
                "LEAD_COMPLETED"
            ]
        }
    })
    .sort({ timestamp: 1 })
    .lean();
};

// Static method to get user activity
leadReturnAuditLogSchema.statics.getUserActivity = async function(username, options = {}) {
    const { startDate, endDate, limit = 50 } = options;
    const query = { 'performedBy.username': username };
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

// Instance method to format for display
leadReturnAuditLogSchema.methods.formatForDisplay = function() {
    return {
        id: this._id,
        leadNo: this.leadNo,
        action: this.action,
        description: this.description,
        performedBy: this.performedBy.username,
        timestamp: this.timestamp,
        entityType: this.entityType,
        changes: this.fieldChanges?.length > 0 ? this.fieldChanges : null
    };
};

const LeadReturnAuditLog = mongoose.model("LeadReturnAuditLog", leadReturnAuditLogSchema);

module.exports = LeadReturnAuditLog;
