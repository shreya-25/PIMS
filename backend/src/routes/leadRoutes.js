const express = require("express");
const { createLead, getLeadsByOfficer } = require("../controller/leadController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/create", verifyToken, roleMiddleware("CaseManager"), createLead);

// Fetch leads assigned by the logged-in officer
router.get("/assigned-leads", verifyToken, getLeadsByOfficer);

module.exports = router;
