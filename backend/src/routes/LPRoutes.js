const express = require("express");
const { createLRPerson, getLRPersonByDetails } = require("../controller/LRPersonController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();
router.post("/lrperson", verifyToken, createLRPerson);

router.get("/lrperson/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLRPersonByDetails);

module.exports = router;
