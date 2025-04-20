const express = require("express");
const router = express.Router();
const commentController = require("../controller/commentController");
const verifyToken = require("../middleware/authMiddleware"); // Authentication middleware

// Create a new comment entry (Authenticated)
router.post("/", verifyToken, async (req, res) => {
  try {
    await commentController.createComment(req, res);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// Get comments based on query filters (Authenticated)
// Optional query parameters: caseNo, caseName, leadNo, leadName, tag
router.get("/", verifyToken, async (req, res) => {
  try {
    await commentController.getComments(req, res);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = router;
