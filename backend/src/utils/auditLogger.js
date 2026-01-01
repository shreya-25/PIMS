const LeadReturnAuditLog = require("../models/LeadReturnAuditLog");

/**
 * Utility functions for audit logging and chain of custody tracking
 */

/**
 * Extract user information from request
 */
function extractUserInfo(req) {
    return {
        username: req.user?.username || req.body?.username || "System",
        userId: req.user?.userId || req.user?._id?.toString(),
        role: req.user?.role || req.user?.accessLevel,
        badge: req.user?.badge || req.user?.badgeNumber
    };
}

/**
 * Extract metadata from request
 */
function extractMetadata(req, additionalData = {}) {
    return {
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        sessionId: req.session?.id || req.sessionID,
        ...additionalData
    };
}

/**
 * Log a lead return action
 */
async function logLeadAction({
    leadNo,
    caseNo,
    action,
    entityType = "LeadReturn",
    entityId = null,
    description,
    performedBy,
    changes = null,
    fieldChanges = null,
    metadata = {},
    chainOfCustody = null
}) {
    try {
        const logData = {
            leadNo,
            caseNo,
            action,
            entityType,
            entityId,
            description,
            performedBy,
            metadata,
            timestamp: new Date()
        };

        if (changes) {
            logData.changes = changes;
        }

        if (fieldChanges && fieldChanges.length > 0) {
            logData.fieldChanges = fieldChanges;
        }

        if (chainOfCustody) {
            logData.chainOfCustody = chainOfCustody;
        }

        return await LeadReturnAuditLog.logAction(logData);
    } catch (error) {
        console.error("Error logging action:", error);
        // Don't throw - logging failures shouldn't break the main operation
        return null;
    }
}

/**
 * Log lead creation
 */
async function logLeadCreation(leadNo, caseNo, performedBy, metadata = {}) {
    return logLeadAction({
        leadNo,
        caseNo,
        action: "LEAD_CREATED",
        description: `Lead return ${leadNo} created for case ${caseNo}`,
        performedBy,
        metadata,
        chainOfCustody: {
            transferredTo: performedBy.username,
            transferReason: "Lead created and assigned",
            transferDate: new Date()
        }
    });
}

/**
 * Log lead assignment/transfer
 */
async function logLeadAssignment(leadNo, caseNo, fromUser, toUser, reason, metadata = {}) {
    return logLeadAction({
        leadNo,
        caseNo,
        action: "LEAD_ASSIGNED",
        description: `Lead ${leadNo} assigned from ${fromUser} to ${toUser}`,
        performedBy: { username: fromUser },
        metadata: { ...metadata, reasonForChange: reason },
        chainOfCustody: {
            transferredFrom: fromUser,
            transferredTo: toUser,
            transferReason: reason,
            transferDate: new Date()
        }
    });
}

/**
 * Log status change
 */
async function logStatusChange(leadNo, caseNo, oldStatus, newStatus, performedBy, reason, metadata = {}) {
    const actionMap = {
        "Pending": "LEAD_SUBMITTED",
        "Approved": "LEAD_APPROVED",
        "Returned": "LEAD_RETURNED",
        "Completed": "LEAD_COMPLETED",
        "Assigned": "LEAD_REOPENED"
    };

    const action = actionMap[newStatus] || "LEAD_UPDATED";

    return logLeadAction({
        leadNo,
        caseNo,
        action,
        description: `Lead ${leadNo} status changed from ${oldStatus} to ${newStatus}`,
        performedBy,
        changes: {
            before: { status: oldStatus },
            after: { status: newStatus }
        },
        fieldChanges: [{
            field: "status",
            oldValue: oldStatus,
            newValue: newStatus
        }],
        metadata: { ...metadata, reasonForChange: reason }
    });
}

/**
 * Log entity creation (narrative, person, vehicle, etc.)
 */
async function logEntityCreation(leadNo, caseNo, entityType, entityId, entityData, performedBy, metadata = {}) {
    const actionMap = {
        "Narrative": "NARRATIVE_CREATED",
        "Person": "PERSON_ADDED",
        "Vehicle": "VEHICLE_ADDED",
        "Timeline": "TIMELINE_ADDED",
        "Evidence": "EVIDENCE_ADDED",
        "Picture": "PICTURE_UPLOADED",
        "Audio": "AUDIO_UPLOADED",
        "Video": "VIDEO_UPLOADED",
        "Enclosure": "ENCLOSURE_UPLOADED",
        "Note": "NOTE_CREATED"
    };

    const action = actionMap[entityType] || `${entityType.toUpperCase()}_CREATED`;
    const label = getEntityLabel(entityType, entityData);

    return logLeadAction({
        leadNo,
        caseNo,
        action,
        entityType,
        entityId,
        description: `Added ${entityType.toLowerCase()}: ${label}`,
        performedBy,
        changes: {
            before: null,
            after: entityData
        },
        metadata
    });
}

/**
 * Log entity update
 */
async function logEntityUpdate(leadNo, caseNo, entityType, entityId, oldData, newData, performedBy, metadata = {}) {
    const actionMap = {
        "Narrative": "NARRATIVE_UPDATED",
        "Person": "PERSON_UPDATED",
        "Vehicle": "VEHICLE_UPDATED",
        "Timeline": "TIMELINE_UPDATED",
        "Evidence": "EVIDENCE_UPDATED",
        "Note": "NOTE_UPDATED"
    };

    const action = actionMap[entityType] || `${entityType.toUpperCase()}_UPDATED`;
    const label = getEntityLabel(entityType, newData);
    const fieldChanges = compareObjects(oldData, newData);

    return logLeadAction({
        leadNo,
        caseNo,
        action,
        entityType,
        entityId,
        description: `Updated ${entityType.toLowerCase()}: ${label}`,
        performedBy,
        changes: {
            before: oldData,
            after: newData
        },
        fieldChanges,
        metadata
    });
}

/**
 * Log entity deletion
 */
async function logEntityDeletion(leadNo, caseNo, entityType, entityId, entityData, performedBy, metadata = {}) {
    const actionMap = {
        "Narrative": "NARRATIVE_DELETED",
        "Person": "PERSON_DELETED",
        "Vehicle": "VEHICLE_DELETED",
        "Timeline": "TIMELINE_DELETED",
        "Evidence": "EVIDENCE_DELETED",
        "Picture": "PICTURE_DELETED",
        "Audio": "AUDIO_DELETED",
        "Video": "VIDEO_DELETED",
        "Enclosure": "ENCLOSURE_DELETED",
        "Note": "NOTE_DELETED"
    };

    const action = actionMap[entityType] || `${entityType.toUpperCase()}_DELETED`;
    const label = getEntityLabel(entityType, entityData);

    return logLeadAction({
        leadNo,
        caseNo,
        action,
        entityType,
        entityId,
        description: `Deleted ${entityType.toLowerCase()}: ${label}`,
        performedBy,
        changes: {
            before: entityData,
            after: null
        },
        metadata
    });
}

/**
 * Log snapshot creation
 */
async function logSnapshotCreation(leadNo, caseNo, versionId, reason, performedBy, metadata = {}) {
    return logLeadAction({
        leadNo,
        caseNo,
        action: "SNAPSHOT_CREATED",
        entityType: "Version",
        entityId: versionId?.toString(),
        description: `Created version ${versionId} snapshot: ${reason}`,
        performedBy,
        metadata: { ...metadata, versionId, reasonForChange: reason }
    });
}

/**
 * Log version restoration
 */
async function logVersionRestore(leadNo, caseNo, versionId, performedBy, metadata = {}) {
    return logLeadAction({
        leadNo,
        caseNo,
        action: "VERSION_RESTORED",
        entityType: "Version",
        entityId: versionId?.toString(),
        description: `Restored lead to version ${versionId}`,
        performedBy,
        metadata: { ...metadata, versionId }
    });
}

/**
 * Log lead view/access
 */
async function logLeadAccess(leadNo, caseNo, performedBy, metadata = {}) {
    return logLeadAction({
        leadNo,
        caseNo,
        action: "LEAD_VIEWED",
        description: `Lead ${leadNo} accessed by ${performedBy.username}`,
        performedBy,
        metadata
    });
}

/**
 * Helper: Get entity label
 */
function getEntityLabel(entityType, data) {
    if (!data) return "Unknown";

    switch (entityType) {
        case "Narrative":
            return data.leadReturnResult?.substring(0, 50) || `Narrative #${data.resultId}`;
        case "Person":
            return `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown Person";
        case "Vehicle":
            return `${data.year || ""} ${data.make || ""} ${data.model || ""}`.trim() || data.vin || "Unknown Vehicle";
        case "Timeline":
            return data.eventDescription?.substring(0, 50) || "Timeline Event";
        case "Evidence":
            return data.evidenceDescription?.substring(0, 50) || "Evidence Item";
        case "Note":
            return data.text?.substring(0, 50) || "Note";
        case "Picture":
        case "Audio":
        case "Video":
        case "Enclosure":
            return data.description?.substring(0, 50) || data.fileName || `${entityType} File`;
        default:
            return "Item";
    }
}

/**
 * Helper: Compare objects for field changes
 */
function compareObjects(oldObj, newObj) {
    const changes = [];
    const skipFields = ['_id', 'createdAt', 'updatedAt', '__v', 'completeLeadReturnId'];

    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    allKeys.forEach(key => {
        if (skipFields.includes(key)) return;

        const oldValue = oldObj?.[key];
        const newValue = newObj?.[key];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({
                field: key,
                oldValue,
                newValue
            });
        }
    });

    return changes;
}

/**
 * Middleware to automatically log certain actions
 */
function auditMiddleware(action, entityType = "LeadReturn") {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function to log after successful response
        res.send = function(data) {
            // Only log on successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const performedBy = extractUserInfo(req);
                const metadata = extractMetadata(req);

                // Extract lead and case info from request
                const leadNo = req.params?.leadNo || req.body?.leadNo || req.query?.leadNo;
                const caseNo = req.params?.caseNo || req.body?.caseNo || req.query?.caseNo;

                if (leadNo) {
                    logLeadAction({
                        leadNo: parseInt(leadNo),
                        caseNo,
                        action,
                        entityType,
                        description: `${action.replace(/_/g, ' ').toLowerCase()} on lead ${leadNo}`,
                        performedBy,
                        metadata
                    }).catch(err => console.error("Audit middleware error:", err));
                }
            }

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
}

module.exports = {
    extractUserInfo,
    extractMetadata,
    logLeadAction,
    logLeadCreation,
    logLeadAssignment,
    logStatusChange,
    logEntityCreation,
    logEntityUpdate,
    logEntityDeletion,
    logSnapshotCreation,
    logVersionRestore,
    logLeadAccess,
    auditMiddleware,
    compareObjects,
    getEntityLabel
};
