const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const Case = require("../models/case");
const { downloadBlob } = require("../s3");

/**
 * GET /api/files/<blobKey>?caseNo=<caseNo>
 *
 * Streams a file from Azure Blob Storage.
 * Access is granted only to users who are members of the specified case:
 *   - admin
 *   - Case Manager (caseManagerUserIds)
 *   - Investigator (investigatorUserIds)
 *   - Detective Supervisor (detectiveSupervisorUserId)
 */
router.get("/*", verifyToken, async (req, res) => {
  try {
    const key = req.params[0];
    const { caseNo } = req.query;

    if (!key) return res.status(400).json({ message: "File key is required" });
    if (!caseNo) return res.status(400).json({ message: "caseNo is required" });

    const caseDoc = await Case.findOne({ caseNo, isDeleted: { $ne: true } }).lean();
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });

    const userId = req.user.userId;
    const isMember =
      req.user.role === "admin" ||
      caseDoc.caseManagerUserIds.some((id) => id.toString() === userId) ||
      caseDoc.investigatorUserIds.some((id) => id.toString() === userId) ||
      (caseDoc.detectiveSupervisorUserId &&
        caseDoc.detectiveSupervisorUserId.toString() === userId);

    if (!isMember) return res.status(403).json({ message: "Access denied" });

    const { contentType, contentLength, stream } = await downloadBlob(key);

    res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);

    stream.pipe(res);
  } catch (err) {
    console.error("Error serving file:", err);
    if (!res.headersSent) res.status(500).json({ message: "Failed to retrieve file" });
  }
});

module.exports = router;
