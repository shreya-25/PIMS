const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  createLRScratchpad,
  getLRScratchpadByDetails,
  getLRScratchpadByDetailsAndId
} = require("../controller/LRScratchpadController");

const router = express.Router();

// ✅ Create a new scratchpad entry
router.post("/create", verifyToken, createLRScratchpad);

// ✅ Get all scratchpad entries for a lead + case
router.get("/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLRScratchpadByDetails);

// ✅ Get scratchpad entries filtered by leadReturnId too
router.get("/:leadNo/:leadName/:caseNo/:caseName/:id", verifyToken, getLRScratchpadByDetailsAndId);

module.exports = router;
