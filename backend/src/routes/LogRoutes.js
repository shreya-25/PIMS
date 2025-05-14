// // routes/logs.js
// const express = require("express");
// const router  = express.Router();
// const Log     = require("../models/LogEntry");

// // POST /api/logs
// router.post("/", async (req, res) => {
//   try {
//     const entry = await Log.create(req.body);
//     res.status(201).json(entry);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // GET /api/logs/:caseNo/:leadNo
// router.get("/:caseNo/:leadNo", async (req, res) => {
//   const { caseNo, leadNo } = req.params;
//   const entries = await Log
//     .find({ caseNo, leadNo })
//     .sort({ timestamp: 1 });
//   res.json(entries);
// });

// module.exports = router;
