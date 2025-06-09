const express = require("express");
const router = express.Router();
const caseController = require("../controller/caseController");
const verifyToken = require("../middleware/authMiddleware"); // Import the middleware
const { addOfficerToCase } = require("../controller/caseController");
const { updateCaseOfficers } = require("../controller/caseController");

// Case Routes

// Create a new case (Authenticated)
router.post("/", verifyToken, async (req, res) => {
    try {
        await caseController.createCase(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Get all cases (Authenticated)
router.get("/", verifyToken, async (req, res) => {
    try {
        await caseController.getAllCases(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.put(
  "/:caseNo/:caseName/officers",
  verifyToken,
  caseController.updateCaseOfficers
);

router.put(
  "/executive-summary",
  verifyToken,
  async (req, res) => {
    try {
      await caseController.updateExecutiveCaseSummary(req, res);
    } catch (error) {
      console.error("Router error in executive-summary:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
);

router.put(
  "/case-summary",
  verifyToken,
  async (req, res) => {
    try {
      await caseController.updateCaseSummary(req, res);
    } catch (error) {
      console.error("Router error in case-summary:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
);

router.put(
  "/:caseNo/:caseName/officers",
  verifyToken,
  addOfficerToCase
);

// routes/caseRoutes.js

// … other imports …
router.get(
  "/executive-summary/:caseNo",
  verifyToken,
  (req, res) => caseController.getExecutiveCaseSummary(req, res)
);

router.get(
  "/case-summary/:caseNo",
  verifyToken,
  (req, res) => caseController.getCaseSummary(req, res)
);

// Get cases assigned to a specific officer (Authenticated)
router.get("/cases-by-officer", verifyToken, async (req, res) => {
  try {
      await caseController.getCasesByOfficer(req, res);
  } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.get("/summary/:caseNo", verifyToken, async (req, res) => {
  try {
    await caseController.getCaseSummaryByCaseNo(req, res);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

  // Update status of an assigned officer in a case (Authenticated)
router.put("/update-officer-status", verifyToken, async (req, res) => {
  try {
    await caseController.updateOfficerStatus(req, res);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// Get a specific case by ID (Authenticated)
router.get("/:id", verifyToken, async (req, res) => {
    try {
        await caseController.getCaseById(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Update a case (Authenticated)
router.put("/:id", verifyToken, async (req, res) => {
    try {
        await caseController.updateCase(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Delete a case (Authenticated)
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        await caseController.deleteCase(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Reject a case => sets Case Manager to "Admin"
router.put("/:id/reject", verifyToken, async (req, res) => {
    try {
      await caseController.rejectCase(req, res);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  });

  // GET all subnumbers for a given case by its ID
router.get("/:id/subNumbers", async (req, res) => {
    try {
      const caseDoc = await Case.findById(req.params.id);
      if (!caseDoc) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.status(200).json({ subNumbers: caseDoc.subNumbers });
    } catch (err) {
      res.status(500).json({ message: "Error fetching subnumbers" });
    }
  });

  router.get("/:caseNo/team", caseController.getCaseTeam);



module.exports = router;
