const express = require("express");
const { createLeadReturnResult, getLeadReturnResultsByOfficer, getLeadReturnResultByLeadNoandLeadName, getLeadReturnResultByLeadNo,
    updateLeadReturnResult,
    deleteLeadReturnResult, searchCasesAndLeadsByKeyword  } = require("../controller/leadReturnResultController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

// Route to create a new lead return result (restricted to "CaseManager" role)
router.post("/create", verifyToken, createLeadReturnResult);

// Route to get lead return results assigned to or assigned by the authenticated officer
router.get("/officer-leads", verifyToken, getLeadReturnResultsByOfficer);

router.get("/:leadNo/:caseId", verifyToken, getLeadReturnResultByLeadNo);
router.get("/:leadNo/:leadName(*)/:caseId", verifyToken, getLeadReturnResultByLeadNoandLeadName);

router.get("/", verifyToken, searchCasesAndLeadsByKeyword);


// router.delete("/delete/:leadNo/:leadName/:caseNo/:caseName/:leadReturnId", deleteLeadReturnResult);

// Update/delete are keyed by the record's own Mongo _id — leadReturnId (Narrative Id)
// is not guaranteed unique (e.g. a race between concurrent creates), so it must
// never be used to look up a specific narrative entry.
router.patch("/update/id/:id", verifyToken, updateLeadReturnResult);

router.delete("/delete/id/:id", verifyToken, deleteLeadReturnResult);

module.exports = router;

