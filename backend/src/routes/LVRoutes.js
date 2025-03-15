const express = require("express");
const { createLRVehicle, getLRVehicleByDetails, getLRVehicleByDetailsandid } = require("../controller/LRVehicleController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

// Create a new vehicle entry
router.post("/lrvehicle", verifyToken, createLRVehicle);

// Get vehicle records by lead details
router.get("/lrvehicle/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLRVehicleByDetails);

router.get("/lrvehicle/:leadNo/:leadName/:caseNo/:caseName/:id", verifyToken, getLRVehicleByDetailsandid);


module.exports = router;
