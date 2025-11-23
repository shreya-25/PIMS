const express = require("express");
const { createLeadReturnResult, getLeadReturnResultsByOfficer, getLeadReturnResultByLeadNoandLeadName,
    updateLeadReturnResult,
    deleteLeadReturnResult, searchCasesAndLeadsByKeyword  } = require("../controller/leadReturnResultController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

// Route to create a new lead return result (restricted to "CaseManager" role)
router.post("/create", verifyToken, createLeadReturnResult);

// Route to get lead return results assigned to or assigned by the authenticated officer
router.get("/officer-leads", verifyToken, getLeadReturnResultsByOfficer);

router.get("/:leadNo/:leadName/:caseNo/:caseName",verifyToken, getLeadReturnResultByLeadNoandLeadName);

router.get("/", verifyToken, searchCasesAndLeadsByKeyword);


// router.delete("/delete/:leadNo/:leadName/:caseNo/:caseName/:leadReturnId", deleteLeadReturnResult);

// Route to update a lead return result
router.patch("/update/:leadNo/:caseNo/:leadReturnId", verifyToken, updateLeadReturnResult);

// Route to delete a lead return result
router.delete("/delete/:leadNo/:caseNo/:leadReturnId", verifyToken, deleteLeadReturnResult);

module.exports = router;

