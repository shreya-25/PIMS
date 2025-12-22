const AuditLog = require("../models/AuditLog");

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.caseNo - Case number
 * @param {string} params.caseName - Case name
 * @param {number} params.leadNo - Lead number
 * @param {string} params.leadName - Lead name/description
 * @param {string} params.entityType - Type of entity (LeadReturnResult, LRPerson, etc.)
 * @param {string} params.entityId - ID of the entity (leadReturnId, personId, etc.)
 * @param {string} params.action - Action performed (CREATE, UPDATE, DELETE, RESTORE)
 * @param {Object} params.performedBy - User who performed the action
 * @param {string} params.performedBy.username - Username
 * @param {string} [params.performedBy.userId] - User ID (optional)
 * @param {string} [params.performedBy.role] - User role (optional)
 * @param {Object} [params.oldValue] - State before change (for UPDATE/DELETE)
 * @param {Object} [params.newValue] - State after change (for CREATE/UPDATE)
 * @param {Object} [params.metadata] - Additional metadata (ip, userAgent, reason, notes)
 * @param {string} [params.accessLevel] - Access level for the log entry
 * @returns {Promise<Object>} Created audit log document
 */
const createAuditLog = async ({
  caseNo,
  caseName,
  leadNo,
  leadName,
  entityType,
  entityId,
  action,
  performedBy,
  oldValue = null,
  newValue = null,
  metadata = {},
  accessLevel = "Everyone"
}) => {
  try {
    const auditLog = new AuditLog({
      caseNo,
      caseName,
      leadNo,
      leadName,
      entityType,
      entityId,
      action,
      performedBy,
      oldValue,
      newValue,
      metadata,
      accessLevel,
      timestamp: new Date()
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw - we don't want audit failures to break the main operation
    // But log it for monitoring
    return null;
  }
};

/**
 * Get audit logs for a specific case/lead
 * @param {Object} filters - Filter parameters
 * @param {string} filters.caseNo - Case number
 * @param {number} filters.leadNo - Lead number
 * @param {string} [filters.entityType] - Filter by entity type
 * @param {string} [filters.action] - Filter by action
 * @param {number} [filters.limit] - Limit results (default: 100)
 * @param {number} [filters.skip] - Skip results for pagination
 * @returns {Promise<Array>} Array of audit log entries
 */
const getAuditLogs = async ({
  caseNo,
  leadNo,
  entityType = null,
  action = null,
  limit = 100,
  skip = 0
}) => {
  try {
    const query = { caseNo, leadNo };

    if (entityType) {
      query.entityType = entityType;
    }

    if (action) {
      query.action = action;
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .limit(limit)
      .skip(skip)
      .lean(); // Convert to plain JS objects for better performance

    return logs;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};

/**
 * Get audit logs for a specific entity
 * @param {Object} params - Parameters
 * @param {string} params.entityType - Entity type
 * @param {string} params.entityId - Entity ID
 * @returns {Promise<Array>} Array of audit log entries for this entity
 */
const getEntityAuditHistory = async ({ entityType, entityId }) => {
  try {
    const logs = await AuditLog.find({ entityType, entityId })
      .sort({ timestamp: -1 })
      .lean();

    return logs;
  } catch (error) {
    console.error("Error fetching entity audit history:", error);
    throw error;
  }
};

/**
 * Get recent activity for a user
 * @param {string} username - Username to query
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Recent audit logs for this user
 */
const getUserActivity = async (username, limit = 50) => {
  try {
    const logs = await AuditLog.find({ "performedBy.username": username })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return logs;
  } catch (error) {
    console.error("Error fetching user activity:", error);
    throw error;
  }
};

/**
 * Helper function to sanitize data before storing in audit log
 * Removes sensitive fields and large binary data
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
const sanitizeForAudit = (data) => {
  if (!data) return null;

  const sanitized = { ...data };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.__v;

  // Convert Mongoose document to plain object if needed
  if (sanitized._doc) {
    return sanitizeForAudit(sanitized._doc);
  }

  // Handle nested objects
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
      // Don't deep-sanitize dates or ObjectIds
      if (!(sanitized[key] instanceof Date) && !sanitized[key]._bsontype) {
        sanitized[key] = sanitizeForAudit(sanitized[key]);
      }
    }
  });

  return sanitized;
};

module.exports = {
  createAuditLog,
  getAuditLogs,
  getEntityAuditHistory,
  getUserActivity,
  sanitizeForAudit
};
