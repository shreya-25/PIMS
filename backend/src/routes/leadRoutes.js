const express = require("express");
const { createLead, getLeadsByOfficer, getLeadsByCase, getLeadsForAssignedToOfficer, getLeadsByLeadNoandLeadName, getLeadsforHierarchy, updateLeadStatus, getAssociatedSubCategories, searchLeadsByKeyword, setLeadStatusToInReview,
  updateLead, removeAssignedOfficer, getAssignedLeadsForOfficer, deleteLead,setLeadStatusToReturned,setLeadStatusToReopened,
  setLeadStatusToComplete, setLeadStatusToPending, updateAssignedToStatus, getLRForCM, getLeadStatus, getLeadStatusByLeadNo, setLeadStatusToClosed,
  updateLeadFlags, getCaseFlaggedLeads, getCaseAllLeadsWithFlags
 } = require("../controller/leadController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");
const Lead = require("../models/lead");



const router = express.Router();

router.post("/create", verifyToken, createLead);

// Fetch leads assigned by the logged-in officer
router.get("/assigned-leads", verifyToken, getLeadsByOfficer);

router.get("/case/:caseId", verifyToken, getLeadsByCase);

router.get("/assignedTo-leads", verifyToken, getLeadsForAssignedToOfficer);

router.get("/lead/:leadNo/:leadName/:caseId", verifyToken, getLeadsByLeadNoandLeadName);
router.get("/lead/:leadNo/:caseId", verifyToken, getLeadsforHierarchy);

router.get("/assigned-only", verifyToken, getAssignedLeadsForOfficer);

router.get("/lead-returnforreview", verifyToken, getLRForCM);

router.get('/status/:leadNo/:caseId', verifyToken, getLeadStatusByLeadNo);
router.get('/status/:leadNo/:leadName/:caseId', verifyToken, getLeadStatus);

router.put("/lead/status/close", setLeadStatusToClosed);

router.put("/status/reopened", verifyToken, setLeadStatusToReopened);

router.put(
  "/update/:leadNo/:description/:caseId",
  verifyToken,
  updateLead
);

router.put('/:leadNo/:leadName/:caseId', verifyToken, updateLeadStatus);


router.get('/associatedSubCategories/:caseId', getAssociatedSubCategories);

router.get("/search", verifyToken, searchLeadsByKeyword);

router.put("/status/in-review", verifyToken, setLeadStatusToInReview);

router.put("/status/complete", verifyToken, setLeadStatusToComplete);

router.put("/status/pending", verifyToken, setLeadStatusToPending);
router.put("/status/returned", verifyToken, setLeadStatusToReturned);

router.put(
  "/:leadNo/:description/:caseId/removeAssigned/:username",
  verifyToken,
  removeAssignedOfficer
);

router.delete(
  "/:leadNo/:leadName/:caseId",
  verifyToken,
  deleteLead
);


router.get("/maxLeadNumber", async (req, res) => {
  try {
    const { caseId } = req.query;

    if (!caseId) {
      return res.status(400).json({ message: "caseId is required" });
    }

    const maxLead = await Lead
      .findOne({ caseId })
      .sort({ leadNo: -1 })
      .limit(1);

    const maxLeadNo = maxLead ? maxLead.leadNo : 0;
    return res.status(200).json({ maxLeadNo });
  } catch (error) {
    console.error("Error fetching max lead number:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put(
  '/lead/:leadNo/:description/:caseId/assignedTo',
  verifyToken,
  updateAssignedToStatus
);

// Flag routes
router.get("/flagged/:caseId", verifyToken, getCaseFlaggedLeads);
router.get("/all-with-flags/:caseId", verifyToken, getCaseAllLeadsWithFlags);
router.patch("/flags/:leadNo/:leadName/:caseId", verifyToken, updateLeadFlags);

module.exports = router;
