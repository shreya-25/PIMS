const express = require("express");
const router = express.Router();
const caseController = require("../controller/caseController");
const verifyToken = require("../middleware/authMiddleware"); // Import the middleware

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

// Get a specific case by ID (Authenticated)
router.get("/:id", verifyToken, async (req, res) => {
    try {
        await caseController.getCaseById(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Get cases assigned to a specific officer (Authenticated)
router.get("/cases-by-officer", verifyToken, async (req, res) => {
    try {
        await caseController.getCasesByOfficer(req, res);
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

  router.get("/summary/:caseNo", verifyToken, async (req, res) => {
    try {
      await caseController.getCaseSummaryByCaseNo(req, res);
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

module.exports = router;
