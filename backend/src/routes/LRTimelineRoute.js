const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { createLRTimeline, getTimelinesByCase } = require("../controller/LRTimelineController");

const router = express.Router();

// Route to create a new timeline entry
router.post("/create", verifyToken, createLRTimeline);

// Route to fetch timeline entries for a given case using both caseNo and caseName
router.get("/case/:caseNo/:caseName", verifyToken, getTimelinesByCase);

module.exports = router;
