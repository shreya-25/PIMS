const express = require("express");
const { createLRPerson, getLRPersonByDetails, getLRPersonByDetailsandid } = require("../controller/LRPersonController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();
router.post("/lrperson", verifyToken, createLRPerson);

router.get("/lrperson/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLRPersonByDetails);

router.get("/lrperson/:leadNo/:leadName/:caseNo/:caseName/:id", verifyToken, getLRPersonByDetailsandid);


module.exports = router;
