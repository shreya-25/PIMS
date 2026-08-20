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

// Update/delete are keyed by the record's own Mongo _id — leadReturnId + VIN
// is not guaranteed unique (VIN can be blank/duplicate), so it must never be
// used to look up a specific vehicle.
// PUT   /api/lrvehicle/:id
router.put(
    "/:id",
    verifyToken,
    updateLRVehicle
  );

  // DELETE   /api/lrvehicle/:id
  router.delete(
    "/:id",
    verifyToken,
    deleteLRVehicle
  );

module.exports = router;
