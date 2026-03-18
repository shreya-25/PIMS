const express = require("express");
const router = express.Router();
const Case = require("../models/case");
const caseController = require("../controller/caseController");
const verifyToken = require("../middleware/authMiddleware");

// ── Static/prefix routes (must come before /:id wildcards) ──────────────────

router.post("/", verifyToken, caseController.createCase);
router.get("/", verifyToken, caseController.getAllCases);
router.get("/cases-by-officer", verifyToken, caseController.getCasesByOfficer);

// ── Routes with case ID ──────────────────────────────────────────────────────

router.get("/:id/team", verifyToken, caseController.getCaseTeam);
router.put("/:id/close", verifyToken, caseController.closeCase);
router.put("/:id/officers", verifyToken, caseController.updateCaseOfficers);
router.put("/:id/character", verifyToken, caseController.updateCharacterOfCase);
router.get("/:id/case-summary", verifyToken, caseController.getCaseSummary);
router.put("/:id/case-summary", verifyToken, caseController.updateCaseSummary);
router.get("/:id/executive-summary", verifyToken, caseController.getExecutiveCaseSummary);
router.put("/:id/executive-summary", verifyToken, caseController.updateExecutiveCaseSummary);
router.get("/:id/timeline-flags", verifyToken, caseController.getTimelineFlags);
router.patch("/:id/timeline-flags", verifyToken, caseController.addTimelineFlag);
router.put("/:id/reject", verifyToken, caseController.rejectCase);

router.get("/:id/subCategories", verifyToken, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }
    res.status(200).json({ subCategories: caseDoc.subCategories });
  } catch (err) {
    res.status(500).json({ message: "Error fetching subcategories" });
  }
});

router.get("/:id", verifyToken, caseController.getCaseById);
router.put("/:id", verifyToken, caseController.updateCase);
router.delete("/:id", verifyToken, caseController.deleteCase);

module.exports = router;
