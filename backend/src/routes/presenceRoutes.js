// routes/presenceRoutes.js
const express = require("express");
const Case = require("../models/case");
const Presence = require("../models/presence");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();
router.use(verifyToken);

// How long we consider someone "present" (UI filter)
const TTL_MS = 30_000;

const normalize = (s) => String(s ?? "").trim();
const roomKeyFor = ({ caseNo, caseName, page = "CasePageManager" }) =>
  `caseNo=${String(caseNo)}|caseName=${normalize(caseName)}|page=${String(page)}`;

async function getUserRoleForCase({ caseNo, caseName, username }) {
  const doc = await Case.findOne(
    { caseNo, caseName, "assignedOfficers.name": username },
    { "assignedOfficers.$": 1 }
  ).lean();
  if (!doc || !doc.assignedOfficers || !doc.assignedOfficers.length) return null;
  return doc.assignedOfficers[0].role || "User";
}

// Optional: quick health check
router.get("/health", async (req, res) => {
  try {
    // ensure we can talk to Mongo
    await Presence.estimatedDocumentCount();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /api/presence/heartbeat
 * body: { caseNo, caseName, page? }
 */
router.post("/heartbeat", async (req, res) => {
  try {
    const username = req.user?.username || req.user?.name;
    const { caseNo, caseName, page = "CasePageManager" } = req.body || {};

    if (!username || !caseNo || !caseName) {
      return res.status(400).json({ error: "username (token), caseNo, caseName required" });
    }

    const cName = normalize(caseName);
    const role = await getUserRoleForCase({ caseNo, caseName: cName, username });
    if (!role) {
      console.warn("[presence] user not in case:", { username, caseNo, caseName: cName });
      return res.status(403).json({ error: "Not a member of this case" });
    }

    const roomKey = roomKeyFor({ caseNo, caseName: cName, page });

    // Upsert presence row + bump lastSeen
    await Presence.findOneAndUpdate(
      { roomKey, username },
      {
        $set: { role, roomKey, username },
        $currentDate: { lastSeen: true }
      },
      { upsert: true, new: false }
    );

    // Return users seen within our TTL window (don’t wait for TTL monitor)
    const cutoff = new Date(Date.now() - TTL_MS);
    const users = await Presence.find(
      { roomKey, lastSeen: { $gte: cutoff } },
      { _id: 0, username: 1, role: 1 }
    ).lean();

    const others = users.filter((u) => u.username !== username);
    res.json({ others });
  } catch (e) {
    console.error("[presence] heartbeat error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/presence/:caseNo/:caseName/:page
 */
router.get("/:caseNo/:caseName/:page", async (req, res) => {
  try {
    const { caseNo, caseName, page } = req.params;
    const roomKey = roomKeyFor({ caseNo, caseName: normalize(caseName), page });
    const cutoff = new Date(Date.now() - TTL_MS);

    const users = await Presence.find(
      { roomKey, lastSeen: { $gte: cutoff } },
      { _id: 0, username: 1, role: 1 }
    ).lean();

    res.json({ users });
  } catch (e) {
    console.error("[presence] list error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/presence/leave
 * body: { caseNo, caseName, page? }
 */
router.post("/leave", async (req, res) => {
  try {
    const username = req.user?.username || req.user?.name;
    const { caseNo, caseName, page = "CasePageManager" } = req.body || {};

    if (!username || !caseNo || !caseName) {
      return res.status(400).json({ error: "username (token), caseNo, caseName required" });
    }

    const roomKey = roomKeyFor({ caseNo, caseName: normalize(caseName), page });
    await Presence.deleteOne({ roomKey, username }).lean();

    res.json({ ok: true });
  } catch (e) {
    console.error("[presence] leave error:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
