const express = require("express");
const { getAgencies, createAgency, updateAgency, deleteAgency } = require("../controller/agencyController");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/",          getAgencies);
router.post("/",         verifyToken, createAgency);
router.patch("/:id",     verifyToken, updateAgency);
router.delete("/:id",    verifyToken, deleteAgency);

module.exports = router;
