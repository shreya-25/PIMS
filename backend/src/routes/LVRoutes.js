const express = require("express");
const { createLRVehicle, getLRVehicleByDetails, getLRVehicleByDetailsandid, updateLRVehicle, deleteLRVehicle, getVehiclesByCaseNo  } = require("../controller/LRVehicleController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all vehicles for a case
router.get("/case/:caseNo", verifyToken, getVehiclesByCaseNo);

// Create a new vehicle entry
router.post("/lrvehicle", verifyToken, createLRVehicle);

// More-specific route (4 params) must come before the wildcard 3-param route,
// otherwise the greedy (*) in leadName swallows the caseId segment on 4-param URLs.
router.get("/lrvehicle/:leadNo/:leadName(*)/:caseId/:id", verifyToken, getLRVehicleByDetailsandid);

router.get("/lrvehicle/:leadNo/:leadName(*)/:caseId", verifyToken, getLRVehicleByDetails);

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
