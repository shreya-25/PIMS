const express = require("express");
const { createLeadReturnResult, getLeadReturnResultsByOfficer, getLeadReturnResultByLeadNoandLeadName } = require("../controller/leadReturnResultController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

// Route to create a new lead return result (restricted to "CaseManager" role)
router.post("/create", verifyToken, roleMiddleware("CaseManager"), createLeadReturnResult);

// Route to get lead return results assigned to or assigned by the authenticated officer
router.get("/officer-leads", verifyToken, getLeadReturnResultsByOfficer);

router.get("/:leadNo/:leadName/:caseNo/:caseName",verifyToken, getLeadReturnResultByLeadNoandLeadName)

module.exports = router;

