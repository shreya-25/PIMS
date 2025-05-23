const express = require("express");
// const { generateReport, generateTestReport } = require("../controller/reportController.js");
// const { generateReport } = require("../controller/reportController.js");
const { generateReport } = require("../controller/leadreportController.js");
const { generateCaseReport } = require("../controller/leadreportCaseController .js");
const { generateCaseReportwithExecSummary } = require("../controller/leadreportCaseControllerExecSummary.js");
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


module.exports = router;