const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const AuditLog = require("../models/AuditLog");

/**
 * @route   GET /api/audit/logs
 * @desc    Get activity logs
 * @access  Private
 */
router.get("/logs", verifyToken, async (req, res) => {
    try {
        const { caseNo, leadNo, action, entityType, limit = 50 } = req.query;

        if (!leadNo) {
            return res.json({
                success: true,
                logs: []
            });
        }

        // Build query
        const query = { leadNo: parseInt(leadNo) };
        if (action) query.action = action;
        if (entityType) query.entityType = entityType;

        // Fetch from audit log system
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            logs: logs
        });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            logs: []
        });
    }
});

module.exports = router;
