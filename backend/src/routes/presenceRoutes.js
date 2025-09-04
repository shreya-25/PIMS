const express = require("express");
const Case = require("../models/case");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();
router.use(verifyToken);  // keep protection here

// Map<roomKey, Map<username, { role, ts }>>
const ROOMS = new Map();
const TTL_MS = 30_000;

const roomKeyFor = ({ caseNo, caseName, page = "CasePageManager" }) =>
  `caseNo=${String(caseNo)}|caseName=${String(caseName)}|page=${String(page)}`;

function prune(roomKey) {
  const room = ROOMS.get(roomKey);
  if (!room) return;
  const now = Date.now();
  for (const [user, meta] of room.entries()) {
    if (!meta || now - meta.ts > TTL_MS) room.delete(user);
  }
  if (!room.size) ROOMS.delete(roomKey);
}

async function getUserRoleForCase({ caseNo, caseName, username }) {
  const doc = await Case.findOne(
    { caseNo, caseName, "assignedOfficers.name": username },
    { "assignedOfficers.$": 1 }
  ).lean();
  if (!doc || !doc.assignedOfficers || !doc.assignedOfficers.length) return null;
  return doc.assignedOfficers[0].role || "User";
}

router.post("/heartbeat", async (req, res) => {
  try {
    const username = req.user?.username || req.user?.name;
    const { caseNo, caseName, page = "CasePageManager" } = req.body || {};
    if (!username || !caseNo || !caseName) {
      return res.status(400).json({ error: "username (token), caseNo, caseName required" });
    }

    const role = await getUserRoleForCase({ caseNo, caseName, username });
    if (!role) return res.status(403).json({ error: "Not a member of this case" });

    const roomKey = roomKeyFor({ caseNo, caseName, page });
    const room = ROOMS.get(roomKey) || new Map();
    room.set(username, { role, ts: Date.now() });
    ROOMS.set(roomKey, room);

    prune(roomKey);

    console.log("[presence] heartbeat", { user: username, caseNo, caseName, page });

    const others = [...room.entries()]
      .filter(([u]) => u !== username)
      .map(([u, v]) => ({ username: u, role: v.role }));

    res.json({ others });
  } catch (e) {
    console.error("presence heartbeat error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:caseNo/:caseName/:page", async (req, res) => {
  try {
    const { caseNo, caseName, page } = req.params;
    const roomKey = roomKeyFor({ caseNo, caseName, page });
    prune(roomKey);
    const room = ROOMS.get(roomKey) || new Map();
    const users = [...room.entries()].map(([u, v]) => ({ username: u, role: v.role }));
    res.json({ users });
  } catch (e) {
    console.error("presence list error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/leave", async (req, res) => {
  try {
    const username = req.user?.username || req.user?.name;
    const { caseNo, caseName, page = "CasePageManager" } = req.body || {};
    if (!username || !caseNo || !caseName) {
      return res.status(400).json({ error: "username (token), caseNo, caseName required" });
    }
    const roomKey = roomKeyFor({ caseNo, caseName, page });
    const room = ROOMS.get(roomKey);
    if (room) {
      room.delete(username);
      if (!room.size) ROOMS.delete(roomKey);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("presence leave error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
