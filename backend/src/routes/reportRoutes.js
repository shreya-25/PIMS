const express = require("express");
// const { generateReport, generateTestReport } = require("../controller/reportController.js");
// const { generateReport } = require("../controller/reportController.js");
const { generateReport } = require("../controller/leadreportController.js");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

// Original secure route for report generation
router.post("/generate", verifyToken, roleMiddleware("CaseManager"), generateReport);

// New test route (no authentication) for testing PDF download
// For testing purposes, the route is GET, not POST and also the URL is http://localhost:5000/api/report/test
// router.get("/test", generateTestReport);

module.exports = router;