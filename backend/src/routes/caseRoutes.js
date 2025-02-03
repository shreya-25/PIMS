const express = require("express");
const router = express.Router();
const caseController = require("../controller/caseController");

// Case Routes
router.post("/", async (req, res) => {
    try {
        await caseController.createCase(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        await caseController.getAllCases(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        await caseController.getCaseById(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        await caseController.updateCase(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await caseController.deleteCase(req, res);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

module.exports = router;
