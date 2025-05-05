const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  createLRScratchpad,
  getLRScratchpadByDetails,
  getLRScratchpadByDetailsAndId,
  updateLRScratchpad,
  deleteLRScratchpad,
} = require("../controller/LRScratchpadController");

const router = express.Router();

// ✅ Create a new scratchpad entry
router.post("/create", verifyToken, createLRScratchpad);

// ✅ Get all scratchpad entries for a lead + case
router.get("/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLRScratchpadByDetails);

// ✅ Get scratchpad entries filtered by leadReturnId too
router.get("/:leadNo/:leadName/:caseNo/:caseName/:id", verifyToken, getLRScratchpadByDetailsAndId);

// **Update** by Mongo `_id`
router.put("/:id", verifyToken, updateLRScratchpad);

// **Delete** by Mongo `_id`
router.delete("/:id", verifyToken, deleteLRScratchpad);

module.exports = router;
