const express = require("express");
const { createLeadReturn, getLeadsReturnByOfficer } = require("../controller/leadReturnController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

// Route to create a new lead return (restricted to "CaseManager" role)
router.post("/create", verifyToken, roleMiddleware("CaseManager"), createLeadReturn);

// Route to get lead returns assigned to or assigned by the authenticated officer
router.get("/officer-leads", verifyToken, getLeadsReturnByOfficer);

module.exports = router;
