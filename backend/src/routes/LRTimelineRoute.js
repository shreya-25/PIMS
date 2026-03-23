const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { createLRTimeline, getTimelinesByCase, getLRTimelineByDetails,  updateLRTimeline, deleteLRTimeline } = require("../controller/LRTimelineController");

const router = express.Router();

// Route to create a new timeline entry
router.post("/create", verifyToken, createLRTimeline);

// Route to fetch timeline entries for a given case using caseId
router.get("/case/:caseId", verifyToken, getTimelinesByCase);

router.get("/:leadNo/:leadName/:caseId", verifyToken, getLRTimelineByDetails);

// update one
router.put("/:id", verifyToken, updateLRTimeline);

// delete one
router.delete("/:id", verifyToken, deleteLRTimeline);


module.exports = router;
