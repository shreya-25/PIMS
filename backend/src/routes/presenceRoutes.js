// routes/presenceRoutes.js
const express = require("express");
const Case = require("../models/case");
const User = require("../models/userModel");
const verifyToken = require("../middleware/authMiddleware");
const Presence = require("../models/presence");

const router = express.Router();
router.use(verifyToken);

const TTL_MS = 30_000;
const normalize = (s) => String(s ?? "").trim();

const roomKeyFor = ({ caseNo, caseName }) =>
  `caseNo=${String(caseNo)}|caseName=${normalize(caseName)}`;

async function getUserRoleForCase({ caseNo, caseName, username }) {
  const user = await User.findOne({ username: username.toLowerCase().trim() }).select("_id role").lean();
  if (!user) return null;

  if (user.role === "Admin") return "Admin";

  const doc = await Case.findOne({ caseNo, isDeleted: { $ne: true } })
    .select("caseManagerUserIds detectiveSupervisorUserId investigatorUserIds")
    .lean();
  if (!doc) return null;

  const uid = user._id.toString();
  if ((doc.caseManagerUserIds || []).some(id => id?.toString() === uid)) return "Case Manager";
  if (doc.detectiveSupervisorUserId?.toString() === uid) return "Detective Supervisor";
  if ((doc.investigatorUserIds || []).some(id => id?.toString() === uid)) return "Investigator";
  return null;
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
