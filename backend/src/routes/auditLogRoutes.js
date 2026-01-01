const express = require("express");
const router = express.Router();
const LeadReturnAuditLog = require("../models/LeadReturnAuditLog");
const verifyToken = require("../middleware/authMiddleware");

/**
 * @route   GET /api/audit-logs/:leadNo
 * @desc    Get complete audit trail for a lead return
 * @access  Private
 */
router.get("/:leadNo", verifyToken, async (req, res) => {
    try {
        const { leadNo } = req.params;
        const {
            startDate,
            endDate,
            action,
            performedBy,
            entityType,
            limit = 100,
            skip = 0
        } = req.query;

        const logs = await LeadReturnAuditLog.getAuditTrail(parseInt(leadNo), {
            startDate,
            endDate,
            action,
            performedBy,
            entityType,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });

        res.json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/audit-logs/:leadNo/chain-of-custody
 * @desc    Get chain of custody for a lead return
 * @access  Private
 */
router.get("/:leadNo/chain-of-custody", verifyToken, async (req, res) => {
    try {
        const { leadNo } = req.params;

        const chainOfCustody = await LeadReturnAuditLog.getChainOfCustody(parseInt(leadNo));

        res.json({
            success: true,
            count: chainOfCustody.length,
            data: chainOfCustody
        });
    } catch (error) {
        console.error("Error fetching chain of custody:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/audit-logs/:leadNo/summary
 * @desc    Get audit log summary with statistics
 * @access  Private
 */
router.get("/:leadNo/summary", verifyToken, async (req, res) => {
    try {
        const { leadNo } = req.params;

        const logs = await LeadReturnAuditLog.find({ leadNo: parseInt(leadNo) }).lean();

        // Calculate statistics
        const summary = {
            totalActions: logs.length,
            actionsByType: {},
            actionsByUser: {},
            entityChanges: {},
            timeline: []
        };

        logs.forEach(log => {
            // Count by action type
            summary.actionsByType[log.action] = (summary.actionsByType[log.action] || 0) + 1;

            // Count by user
            const username = log.performedBy.username;
            summary.actionsByUser[username] = (summary.actionsByUser[username] || 0) + 1;

            // Count by entity type
            if (log.entityType) {
                summary.entityChanges[log.entityType] = (summary.entityChanges[log.entityType] || 0) + 1;
            }

            // Timeline (last 10 actions)
            if (summary.timeline.length < 10) {
                summary.timeline.push({
                    action: log.action,
                    description: log.description,
                    performedBy: username,
                    timestamp: log.timestamp
                });
            }
        });

        // Sort timeline by timestamp (most recent first)
        summary.timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error("Error fetching audit summary:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/audit-logs/user/:username
 * @desc    Get all actions performed by a specific user
 * @access  Private
 */
router.get("/user/:username", verifyToken, async (req, res) => {
    try {
        const { username } = req.params;
        const { startDate, endDate, limit = 50 } = req.query;

        const logs = await LeadReturnAuditLog.getUserActivity(username, {
            startDate,
            endDate,
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error("Error fetching user activity:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/audit-logs/:leadNo/entity/:entityType/:entityId
 * @desc    Get audit trail for a specific entity
 * @access  Private
 */
router.get("/:leadNo/entity/:entityType/:entityId", verifyToken, async (req, res) => {
    try {
        const { leadNo, entityType, entityId } = req.params;

        const logs = await LeadReturnAuditLog.find({
            leadNo: parseInt(leadNo),
            entityType,
            entityId
        })
        .sort({ timestamp: -1 })
        .lean();

        res.json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error("Error fetching entity audit trail:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/audit-logs/:leadNo/export
 * @desc    Export audit trail to JSON
 * @access  Private
 */
router.get("/:leadNo/export", verifyToken, async (req, res) => {
    try {
        const { leadNo } = req.params;

        const logs = await LeadReturnAuditLog.find({ leadNo: parseInt(leadNo) })
            .sort({ timestamp: 1 })
            .lean();

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=audit-log-lead-${leadNo}.json`);
        res.json({
            leadNo: parseInt(leadNo),
            exportDate: new Date(),
            totalRecords: logs.length,
            auditTrail: logs
        });
    } catch (error) {
        console.error("Error exporting audit logs:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   DELETE /api/audit-logs/:leadNo
 * @desc    Delete all audit logs for a lead (Admin only - use with caution)
 * @access  Private/Admin
 */
router.delete("/:leadNo", verifyToken, async (req, res) => {
    try {
        const { leadNo } = req.params;

        // This should be protected with admin authorization
        // Only use when lead is permanently deleted

        const result = await LeadReturnAuditLog.deleteMany({ leadNo: parseInt(leadNo) });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} audit log entries for lead ${leadNo}`
        });
    } catch (error) {
        console.error("Error deleting audit logs:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
