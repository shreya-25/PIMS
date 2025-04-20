const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { createLRTimeline, getTimelinesByCase, getLRTimelineByDetails } = require("../controller/LRTimelineController");

const router = express.Router();

// Route to create a new timeline entry
router.post("/create", verifyToken, createLRTimeline);

// Route to fetch timeline entries for a given case using both caseNo and caseName
router.get("/case/:caseNo/:caseName", verifyToken, getTimelinesByCase);

router.get("/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLRTimelineByDetails);


module.exports = router;
