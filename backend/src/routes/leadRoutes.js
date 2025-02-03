const express = require("express");
const { createLead, getLeadsByOfficer } = require("../controller/leadController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");
const Lead = require("../models/lead");



const router = express.Router();

router.post("/create", verifyToken, roleMiddleware("CaseManager"), createLead);

// Fetch leads assigned by the logged-in officer
router.get("/assigned-leads", verifyToken, getLeadsByOfficer);

// API to get the maximum lead number
router.get("/maxLeadNumber", async (req, res) => {
    try {
        const maxLead = await Lead.findOne().sort({ leadNo: -1 }).limit(1); // Get the highest lead number
        const maxLeadNo = maxLead ? maxLead.leadNo : 0; // Default to 0 if no leads exist
        res.status(200).json({ maxLeadNo });
    } catch (error) {
        console.error("Error fetching max lead number:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
