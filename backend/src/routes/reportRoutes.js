const express = require("express");
// const { generateReport, generateTestReport } = require("../controller/reportController.js");
// const { generateReport } = require("../controller/reportController.js");
const { generateReport } = require("../controller/leadreportController.js");
const { generateCaseReport, generateTimelineOnlyReport } = require("../controller/leadreportCaseController .js");
const { generateCaseReportwithExecSummary } = require("../controller/leadreportCaseControllerExecSummary.js");
const {
  triggerSaveReport,
  getSavedReportStatus,
  getSavedReportUrl,
  deleteSavedReport,
} = require("../controller/reportSaveController.js");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");
const getUploadMiddleware = require("../middleware/upload");
const upload = require("../middleware/upload-disk");


const router = express.Router();

// Original secure route for report generation
router.post(
  "/generate",
  verifyToken,
  upload.fields([
    { name: "pdfFiles", maxCount: 5 },
    { name: "imageFiles", maxCount: 10 },
  ]),
  generateReport
);

router.post("/generateCase", verifyToken, generateCaseReport);
router.post("/generateTimeline", verifyToken, generateTimelineOnlyReport);

// router.post("/generateCaseExecSummary", verifyToken, roleMiddleware("CaseManager"), generateCaseReportwithExecSummary);

// New test route (no authentication) for testing PDF download
// For testing purposes, the route is GET, not POST and also the URL is http://localhost:5000/api/report/test
// router.get("/test", generateTestReport);

router.post(
  "/generateCaseExecSummary",
  verifyToken,
  upload.single("execSummaryFile"),
  generateCaseReportwithExecSummary
);

// ── Saved-report workflow (generate-once, fetch-always) ───────────────────────
// Trigger background generation and save to Azure; returns { status, reportId }
router.post("/triggerSave",    verifyToken, triggerSaveReport);
// Poll generation status by reportId
router.get("/status/:reportId", verifyToken, getSavedReportStatus);
// Get a signed Azure URL for the saved PDF
router.get("/url/:reportId",   verifyToken, getSavedReportUrl);
// Invalidate saved report for a case (forces fresh regeneration on next trigger)
router.delete("/savedReport/:caseId", verifyToken, deleteSavedReport);

module.exports = router;