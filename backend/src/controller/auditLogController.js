const { getAuditLogs, getEntityAuditHistory, getUserActivity } = require("../services/auditService");

/**
 * Get audit logs for a specific case/lead
 * GET /api/audit/logs?caseNo=XXX&leadNo=YYY&entityType=...&action=...&limit=100&skip=0
 */
const getAuditLogsForCaseLead = async (req, res) => {
  try {
    const { caseNo, leadNo, entityType, action, limit, skip } = req.query;

    if (!caseNo || !leadNo) {
      return res.status(400).json({
        message: "caseNo and leadNo are required query parameters"
      });
    }

    const logs = await getAuditLogs({
      caseNo,
      leadNo: Number(leadNo),
      entityType: entityType || null,
      action: action || null,
      limit: limit ? Number(limit) : 100,
      skip: skip ? Number(skip) : 0
    });

    res.status(200).json({
      count: logs.length,
      logs
    });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

/**
 * Get audit history for a specific entity
 * GET /api/audit/entity/:entityType/:entityId
 */
const getEntityHistory = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
      return res.status(400).json({
        message: "entityType and entityId are required"
      });
    }

    const logs = await getEntityAuditHistory({ entityType, entityId });

    res.status(200).json({
      count: logs.length,
      logs
    });
  } catch (err) {
    console.error("Error fetching entity audit history:", err);
    res.status(500).json({ message: "Failed to fetch entity audit history" });
  }
};

/**
 * Get activity for the current user
 * GET /api/audit/my-activity?limit=50
 */
const getMyActivity = async (req, res) => {
  try {
    const username = req.user?.name;

    if (!username) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const logs = await getUserActivity(username, limit);

    res.status(200).json({
      count: logs.length,
      logs
    });
  } catch (err) {
    console.error("Error fetching user activity:", err);
    res.status(500).json({ message: "Failed to fetch user activity" });
  }
};

/**
 * Get activity stats for a case/lead
 * GET /api/audit/stats?caseNo=XXX&leadNo=YYY
 */
const getActivityStats = async (req, res) => {
  try {
    const { caseNo, leadNo } = req.query;

    if (!caseNo || !leadNo) {
      return res.status(400).json({
        message: "caseNo and leadNo are required"
      });
    }

    const logs = await getAuditLogs({
      caseNo,
      leadNo: Number(leadNo),
      limit: 1000
    });

    // Calculate stats
    const stats = {
      totalActions: logs.length,
      byAction: {},
      byEntityType: {},
      byUser: {},
      recentActivity: logs.slice(0, 10).map(log => ({
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        performedBy: log.performedBy.username,
        timestamp: log.timestamp
      }))
    };

    // Count by action
    logs.forEach(log => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byEntityType[log.entityType] = (stats.byEntityType[log.entityType] || 0) + 1;
      stats.byUser[log.performedBy.username] = (stats.byUser[log.performedBy.username] || 0) + 1;
    });

    res.status(200).json(stats);
  } catch (err) {
    console.error("Error calculating activity stats:", err);
    res.status(500).json({ message: "Failed to calculate activity stats" });
  }
};

module.exports = {
  getAuditLogsForCaseLead,
  getEntityHistory,
  getMyActivity,
  getActivityStats
};
