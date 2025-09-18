// routes/presenceRoutes.js
const express = require("express");
const Case = require("../models/case");
const verifyToken = require("../middleware/authMiddleware");
const Presence = require("../models/presence"); // if you're using the Mongo presence model I gave earlier

const router = express.Router();
router.use(verifyToken);

const TTL_MS = 30_000;
const normalize = (s) => String(s ?? "").trim();

// 👇 CHANGE: room is just (caseNo, caseName) — no page dimension
const roomKeyFor = ({ caseNo, caseName }) =>
  `caseNo=${String(caseNo)}|caseName=${normalize(caseName)}`;

async function getUserRoleForCase({ caseNo, caseName, username }) {
  const doc = await Case.findOne(
    { caseNo, caseName, "assignedOfficers.name": username },
    { "assignedOfficers.$": 1 }
  ).lean();
  if (!doc || !doc.assignedOfficers || !doc.assignedOfficers.length) return null;
  return doc.assignedOfficers[0].role || "User";
}

// POST /api/presence/heartbeat
router.post("/heartbeat", async (req, res) => {
  try {
    const username = req.user?.username || req.user?.name;
    const { caseNo, caseName } = req.body || {};
    if (!username || !caseNo || !caseName) {
      return res.status(400).json({ error: "username (token), caseNo, caseName required" });
    }

    const cName = normalize(caseName);
    const role = await getUserRoleForCase({ caseNo, caseName: cName, username });
    if (!role) return res.status(403).json({ error: "Not a member of this case" });

    const roomKey = roomKeyFor({ caseNo, caseName: cName });

    // upsert + bump lastSeen (Mongo presence model)
    await Presence.findOneAndUpdate(
      { roomKey, username },
      { $set: { role, roomKey, username }, $currentDate: { lastSeen: true } },
      { upsert: true }
    );

    const cutoff = new Date(Date.now() - TTL_MS);
    const users = await Presence.find(
      { roomKey, lastSeen: { $gte: cutoff } },
      { _id: 0, username: 1, role: 1 }
    ).lean();

    res.json({ others: users.filter(u => u.username !== username) });
  } catch (e) {
    console.error("[presence] heartbeat error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/presence/:caseNo/:caseName
router.get("/:caseNo/:caseName/:_ignored?", async (req, res) => {
  try {
    const { caseNo, caseName } = req.params;
    const roomKey = roomKeyFor({ caseNo, caseName: normalize(caseName) });
    const cutoff = new Date(Date.now() - TTL_MS);
    const users = await Presence.find(
      { roomKey, lastSeen: { $gte: cutoff } },
      { _id: 0, username: 1, role: 1 }
    ).lean();
    res.json({ users });
  } catch (e) {
    console.error("[presence] list error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/presence/leave
router.post("/leave", async (req, res) => {
  try {
    const username = req.user?.username || req.user?.name;
    const { caseNo, caseName } = req.body || {};
    if (!username || !caseNo || !caseName) {
      return res.status(400).json({ error: "username (token), caseNo, caseName required" });
    }
    const roomKey = roomKeyFor({ caseNo, caseName: normalize(caseName) });
    await Presence.deleteOne({ roomKey, username });
    res.json({ ok: true });
  } catch (e) {
    console.error("[presence] leave error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
