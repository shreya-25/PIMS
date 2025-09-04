const express = require("express");
const { createLead, getLeadsByOfficer, getLeadsByCase, getLeadsForAssignedToOfficer, getLeadsByLeadNoandLeadName, getLeadsforHierarchy, updateLeadStatus, getAssociatedSubNumbers, searchLeadsByKeyword, setLeadStatusToInReview,
  updateLead, removeAssignedOfficer, getAssignedLeadsForOfficer,
  setLeadStatusToComplete, setLeadStatusToPending, updateAssignedToStatus, getLRForCM, getLeadStatus,setLeadStatusToClosed
 } = require("../controller/leadController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");
const Lead = require("../models/lead");



const router = express.Router();

router.post("/create", verifyToken, createLead);

// Fetch leads assigned by the logged-in officer
router.get("/assigned-leads", verifyToken, getLeadsByOfficer);

router.get("/case/:caseNo/:caseName", verifyToken, getLeadsByCase);

router.get("/assignedTo-leads", verifyToken, getLeadsForAssignedToOfficer);

router.get("/lead/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLeadsByLeadNoandLeadName);
router.get("/lead/:leadNo/:caseNo/:caseName", verifyToken, getLeadsforHierarchy);

router.get("/assigned-only", verifyToken, getAssignedLeadsForOfficer);

router.get("/lead-returnforreview", verifyToken, getLRForCM);

router.get(
  '/status/:leadNo/:leadName/:caseNo/:caseName',
  verifyToken,        // if you protect this route
  getLeadStatus
);

router.put("/lead/status/close", setLeadStatusToClosed);

router.put(
  "/update/:leadNo/:description/:caseNo/:caseName",
  verifyToken,
  // roleMiddleware("CaseManager"),
  updateLead
);

router.put('/:leadNo/:leadName/:caseNo/:caseName', verifyToken, updateLeadStatus);


router.get('/associatedSubNumbers/:caseNo/:caseName', getAssociatedSubNumbers);

router.get("/search", verifyToken, searchLeadsByKeyword);

router.put("/status/in-review", verifyToken, setLeadStatusToInReview);

router.put("/status/complete", verifyToken, setLeadStatusToComplete);

router.put("/status/pending", verifyToken, setLeadStatusToPending);

router.put(
  "/:leadNo/:description/:caseNo/:caseName/removeAssigned/:username",
  verifyToken,       // if you protect routes
  removeAssignedOfficer
);


// API to get the maximum lead number
// router.get("/maxLeadNumber", async (req, res) => {
//     try {
//         const maxLead = await Lead.findOne().sort({ leadNo: -1 }).limit(1); // Get the highest lead number
//         const maxLeadNo = maxLead ? maxLead.leadNo : 0; // Default to 0 if no leads exist
//         res.status(200).json({ maxLeadNo });
//     } catch (error) {
//         console.error("Error fetching max lead number:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });


router.get("/maxLeadNumber", async (req, res) => {
  try {
    const { caseNo, caseName } = req.query;

    if (!caseNo || !caseName) {
      return res.status(400).json({ message: "caseNo and caseName are required" });
    }

    // No Number() conversion
    const maxLead = await Lead
      .findOne({ caseNo: caseNo, caseName })
      .sort({ leadNo: -1 })
      .limit(1);

    const maxLeadNo = maxLead ? maxLead.leadNo : 0;
    return res.status(200).json({ maxLeadNo });
  } catch (error) {
    console.error("Error fetching max lead number:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

  // router.patch("/updateStatus", verifyToken, leadController.updateLeadLRStatus);
router.put(
  '/lead/:leadNo/:description/:caseNo/:caseName/assignedTo',
  verifyToken,
  updateAssignedToStatus
);

module.exports = router;
