const express = require("express");
const { createLRVehicle, getLRVehicleByDetails, getLRVehicleByDetailsandid, updateLRVehicle, deleteLRVehicle  } = require("../controller/LRVehicleController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

// Create a new vehicle entry
router.post("/lrvehicle", verifyToken, createLRVehicle);

// Get vehicle records by lead details
router.get("/lrvehicle/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLRVehicleByDetails);

router.get("/lrvehicle/:leadNo/:leadName/:caseNo/:caseName/:id", verifyToken, getLRVehicleByDetailsandid);

// PUT   /api/lrvehicle/:leadNo/:caseNo/:leadReturnId/:vin
router.put(
    "/:leadNo/:caseNo/:leadReturnId/:vin",
    updateLRVehicle
  );
  
  // DELETE   /api/lrvehicle/:leadNo/:caseNo/:leadReturnId/:vin
  router.delete(
    "/:leadNo/:caseNo/:leadReturnId/:vin",
    deleteLRVehicle
  );

module.exports = router;
