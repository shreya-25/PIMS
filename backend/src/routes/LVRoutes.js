const express = require("express");
const { createLRVehicle, getLRVehicleByDetails, getLRVehicleByDetailsandid, updateLRVehicle, deleteLRVehicle, getVehiclesByCaseNo  } = require("../controller/LRVehicleController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all vehicles for a case
router.get("/case/:caseNo", verifyToken, getVehiclesByCaseNo);

// Create a new vehicle entry
router.post("/lrvehicle", verifyToken, createLRVehicle);

// Get vehicle records by lead details
router.get("/lrvehicle/:leadNo/:leadName(*)/:caseId", verifyToken, getLRVehicleByDetails);

router.get("/lrvehicle/:leadNo/:leadName(*)/:caseId/:id", verifyToken, getLRVehicleByDetailsandid);

// PUT   /api/lrvehicle/:leadNo/:caseId/:leadReturnId/:vin
router.put(
    "/:leadNo/:caseId/:leadReturnId/:vin",
    verifyToken,
    updateLRVehicle
  );

  // DELETE   /api/lrvehicle/:leadNo/:caseId/:leadReturnId/:vin
  router.delete(
    "/:leadNo/:caseId/:leadReturnId/:vin",
    verifyToken,
    deleteLRVehicle
  );

module.exports = router;
