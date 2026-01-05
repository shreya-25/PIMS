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
        const { caseNo, caseName, leadNo, action, entityType, limit = 50 } = req.query;

        // Build query - filter by both caseNo and leadNo if provided
        const query = {};

        if (leadNo) {
            query.leadNo = parseInt(leadNo);
        }

        if (caseNo) {
            query.caseNo = caseNo;
        }

        if (caseName) {
            query.caseName = caseName;
        }

        if (action) {
            query.action = action;
        }

        if (entityType) {
            query.entityType = entityType;
        }

        // If no filters provided, return empty array
        if (Object.keys(query).length === 0) {
            return res.json({
                success: true,
                logs: []
            });
        }

        // Fetch from audit log system
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            count: logs.length,
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
