const express = require("express");
const {
  getAuditLogsForCaseLead,
  getEntityHistory,
  getMyActivity,
  getActivityStats
} = require("../controller/auditLogController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get audit logs for a case/lead
// GET /api/audit/logs?caseNo=XXX&leadNo=YYY&entityType=LeadReturnResult&action=UPDATE
router.get("/logs", verifyToken, getAuditLogsForCaseLead);

// Get audit history for a specific entity
// GET /api/audit/entity/:entityType/:entityId
router.get("/entity/:entityType/:entityId", verifyToken, getEntityHistory);

// Get current user's activity
// GET /api/audit/my-activity?limit=50
router.get("/my-activity", verifyToken, getMyActivity);

// Get activity statistics for a case/lead
// GET /api/audit/stats?caseNo=XXX&leadNo=YYY
router.get("/stats", verifyToken, getActivityStats);

module.exports = router;
