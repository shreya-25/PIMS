const express = require("express");
const { createLead } = require("../controller/leadController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/create", verifyToken, roleMiddleware("CaseManager"), createLead);

module.exports = router;
