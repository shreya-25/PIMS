// routes/presenceRoutes.js
const express = require("express");
const Case = require("../models/case");
const verifyToken = require("../middleware/authMiddleware");
const { heartbeat: hb, list, leave } = require("../utils/presenceStore");

const router = express.Router();
router.use(verifyToken);

const TTL_MS = 30_000;
const roomKeyFor = ({ caseNo, caseName, page = "CasePageManager" }) =>
  `caseNo=${String(caseNo)}|caseName=${String(caseName)}|page=${String(page)}`;

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

    const users = await hb({ roomKey, username, role });
    const others = users.filter(u => u.username !== username);
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
    const users = await list(roomKey);
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
    await leave({ roomKey, username });
    res.json({ ok: true });
  } catch (e) {
    console.error("presence leave error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
