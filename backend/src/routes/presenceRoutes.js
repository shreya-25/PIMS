// routes/presenceRoutes.js
const express = require("express");
const Case = require("../models/case");
const verifyToken = require("../middleware/authMiddleware");
const { heartbeat: hb, list, leave, redis } = require("../utils/presenceStore");

const router = express.Router();

// Auth for all presence endpoints
router.use(verifyToken);

// Optional: quick health check to verify Redis connectivity
router.get("/health", async (req, res) => {
  try {
    const pong = await redis.ping();
    res.json({ ok: true, redis: pong });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Room key is the same everywhere (front + back)
const roomKeyFor = ({ caseNo, caseName, page = "CasePageManager" }) =>
  `caseNo=${String(caseNo)}|caseName=${String(caseName)}|page=${String(page)}`;

// Make sure the token user belongs to this case; return their role in the case
async function getUserRoleForCase({ caseNo, caseName, username }) {
  // Assumes Case schema has assignedOfficers like [{ name, role, status }, ...]
  const doc = await Case.findOne(
    { caseNo, caseName, "assignedOfficers.name": username },
    { "assignedOfficers.$": 1 }
  ).lean();

  if (!doc || !doc.assignedOfficers || !doc.assignedOfficers.length) return null;
  return doc.assignedOfficers[0].role || "User";
}

/**
 * POST /api/presence/heartbeat
 * body: { caseNo, caseName, page? }
 * Returns: { others: [{ username, role }, ...] }
 */
router.post("/heartbeat", async (req, res) => {
  try {
    const username = req.user?.username || req.user?.name; // depends on your auth middleware
    const { caseNo, caseName, page = "CasePageManager" } = req.body || {};

    if (!username || !caseNo || !caseName) {
      return res.status(400).json({ error: "username (token), caseNo, caseName required" });
    }

    // Confirm membership + role in the case
    const role = await getUserRoleForCase({ caseNo, caseName, username });
    if (!role) return res.status(403).json({ error: "Not a member of this case" });

    // Update presence in shared Redis and list users
    const roomKey = roomKeyFor({ caseNo, caseName, page });
    const users = await hb({ roomKey, username, role });

    // Everyone else but me
    const others = users.filter(u => u.username !== username);
    res.json({ others });
  } catch (e) {
    console.error("[presence] heartbeat error:", e);
    // Degrade gracefully so UI doesn’t break on brief outages:
    res.json({ others: [] });
  }
});

/**
 * GET /api/presence/:caseNo/:caseName/:page
 * Returns: { users: [{ username, role }, ...] }
 */
router.get("/:caseNo/:caseName/:page", async (req, res) => {
  try {
    const { caseNo, caseName, page } = req.params;
    const roomKey = roomKeyFor({ caseNo, caseName, page });
    const users = await list(roomKey);
    res.json({ users });
  } catch (e) {
    console.error("[presence] list error:", e);
    res.status(500).json({ error: "Server error" });
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

    const roomKey = roomKeyFor({ caseNo, caseName, page });
    await leave({ roomKey, username });
    res.json({ ok: true });
  } catch (e) {
    console.error("[presence] leave error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
