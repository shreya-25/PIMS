const express      = require("express");
const router       = express.Router();
const mongoose     = require("mongoose");
const Notification = require("../models/notification");
const User         = require("../models/userModel");

// ─── Helper: resolve an array of { username, role, status, unread, userId? }
//     entries, filling in userId from the DB where it is missing.
async function resolveAssignees(assignedTo) {
  if (!Array.isArray(assignedTo) || assignedTo.length === 0) return [];

  // Collect usernames that need resolution
  const needLookup = assignedTo
    .filter(a => !a.userId && a.username)
    .map(a => a.username.toLowerCase().trim());

  let usernameToId = {};
  if (needLookup.length) {
    const users = await User.find(
      { username: { $in: needLookup } },
      { _id: 1, username: 1 }
    ).lean();
    users.forEach(u => { usernameToId[u.username.toLowerCase().trim()] = u._id; });
  }

  return assignedTo.map(a => ({
    userId:   a.userId || usernameToId[a.username?.toLowerCase?.()?.trim()] || null,
    username: a.username,
    role:     a.role,
    status:   a.status   || "pending",
    unread:   a.unread   !== undefined ? a.unread : true,
  }));
}

// ─── Helper: build a query that matches a user by userId OR username (fallback)
function userQuery(userId, username) {
  if (userId && mongoose.isValidObjectId(userId)) {
    return {
      $or: [
        { "assignedTo.userId": new mongoose.Types.ObjectId(userId) },
        { "assignedTo.username": username },
      ]
    };
  }
  return { "assignedTo.username": username };
}

// ─── Create a new notification ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const existing = await Notification.findOne({ notificationId: req.body.notificationId });
    if (existing) {
      return res.status(400).json({ error: "Notification already exists" });
    }

    // Resolve assignedBy userId from the request user (JWT) or body
    let assignedByUserId = req.user?.userId || null;
    if (!assignedByUserId && req.body.assignedBy) {
      const byUser = await User.findOne({ username: req.body.assignedBy.toLowerCase().trim() }, "_id").lean();
      if (byUser) assignedByUserId = byUser._id;
    }

    const assignedTo = await resolveAssignees(req.body.assignedTo || []);

    const newNotification = new Notification({
      notificationId:   req.body.notificationId,
      assignedBy:       req.body.assignedBy,
      assignedByUserId: assignedByUserId || null,
      assignedTo,
      caseId:     req.body.caseId   || null,
      leadId:     req.body.leadId   || null,
      action1:    req.body.action1,
      action2:    req.body.action2,
      post1:      req.body.post1,
      post2:      req.body.post2,
      leadNo:     req.body.leadNo,
      leadName:   req.body.leadName,
      caseNo:     req.body.caseNo,
      caseName:   req.body.caseName,
      caseStatus: req.body.caseStatus,
      type:       req.body.type,
      time:       new Date(),
    });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ error: "Error creating notification", details: error.message });
  }
});

// ─── Get all notifications ──────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching notifications", details: error.message });
  }
});

// ─── Get open case notifications ────────────────────────────────────────────
router.get("/open", async (req, res) => {
  try {
    const openNotifications = await Notification.find({ caseStatus: "Open" });
    res.json(openNotifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching open cases", details: error.message });
  }
});

// ─── Get notifications for a user by userId (preferred) ─────────────────────
router.get("/user/id/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    const objectId = new mongoose.Types.ObjectId(userId);
    // Look up username so we can also match old notifications that lack userId
    const userDoc = await User.findById(objectId).select("username").lean();
    const username = userDoc?.username;
    const query = username
      ? { $or: [{ "assignedTo.userId": objectId }, { "assignedTo.username": username }] }
      : { "assignedTo.userId": objectId };
    const notifications = await Notification.find(query).sort({ time: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching notifications", details: error.message });
  }
});

// ─── Get notifications by username (legacy fallback) ────────────────────────
router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const notifications = await Notification.find({
      $or: [
        { "assignedTo.username": username },
        { assignedBy: username }
      ]
    }).sort({ time: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching notifications", details: error.message });
  }
});

// ─── Get open notifications for a user by userId ─────────────────────────────
router.get("/open/user/id/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    const objectId = new mongoose.Types.ObjectId(userId);
    const userDoc = await User.findById(objectId).select("username").lean();
    const username = userDoc?.username;
    const assigneeClauses = username
      ? [{ "assignedTo.userId": objectId }, { "assignedTo.username": username }]
      : [{ "assignedTo.userId": objectId }];
    const notifications = await Notification.find({
      caseStatus: "Open",
      $or: assigneeClauses,
    }).sort({ time: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching open notifications", details: error.message });
  }
});

// ─── Get open notifications by username (legacy) ─────────────────────────────
router.get("/open/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const notifications = await Notification.find({
      caseStatus: "Open",
      $or: [
        { "assignedTo.username": username },
        { assignedBy: username }
      ]
    }).sort({ time: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching open notifications", details: error.message });
  }
});

// ─── Get unread notifications by userId ──────────────────────────────────────
router.get("/unread/user/id/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    const objectId = new mongoose.Types.ObjectId(userId);
    const userDoc = await User.findById(objectId).select("username").lean();
    const username = userDoc?.username;
    // Match notifications where the current user has an unread entry (by userId OR username)
    const orClauses = [
      { "assignedTo": { $elemMatch: { userId: objectId, unread: true } } },
    ];
    if (username) {
      orClauses.push({ "assignedTo": { $elemMatch: { username, unread: true } } });
    }
    const notifications = await Notification.find({ $or: orClauses }).sort({ time: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching unread notifications", details: error.message });
  }
});

// ─── Get unread notifications by username (legacy) ────────────────────────────
router.get("/unread/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const notifications = await Notification.find({
      unread: true,
      $or: [
        { "assignedTo.username": username },
        { assignedBy: username }
      ]
    }).sort({ time: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching unread notifications", details: error.message });
  }
});

// ─── Close notifications by caseNo ───────────────────────────────────────────
router.put("/close/:caseNo", async (req, res) => {
  const caseNo = String(req.params.caseNo).trim();
  try {
    const match = await Notification.findOne({ caseNo });
    if (!match) {
      return res.status(404).json({ error: "Notification not found", caseNo });
    }
    const updated = await Notification.findOneAndUpdate(
      { caseNo },
      { caseStatus: "Close" },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("Error closing notification:", err);
    res.status(500).json({ error: "Failed to close notification", details: err.message });
  }
});

// ─── Mark notification as read — supports userId or username ─────────────────
router.put("/mark-read/:notificationId", async (req, res) => {
  const { notificationId } = req.params;
  const { userId, username } = req.body;

  if (!userId && !username) {
    return res.status(400).json({ error: "userId or username is required" });
  }

  try {
    let notification;

    if (userId && mongoose.isValidObjectId(userId)) {
      // Prefer userId match
      notification = await Notification.findOneAndUpdate(
        { notificationId, "assignedTo.userId": new mongoose.Types.ObjectId(userId) },
        { $set: { "assignedTo.$.unread": false } },
        { new: true }
      );
    }

    // Fallback to username if userId didn't match
    if (!notification && username) {
      notification = await Notification.findOneAndUpdate(
        { notificationId, "assignedTo.username": username },
        { $set: { "assignedTo.$.unread": false } },
        { new: true }
      );
    }

    if (!notification) {
      return res.status(404).json({ error: "Notification or user slice not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Error marking as read", details: error.message });
  }
});

// ─── Accept notification — supports userId or username ───────────────────────
router.put("/accept/:notificationId", async (req, res) => {
  const { userId, username } = req.body;

  try {
    const notification = await Notification.findOne({ notificationId: req.params.notificationId });
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Find assignee by userId first, then fall back to username
    let assignee = null;
    if (userId && mongoose.isValidObjectId(userId)) {
      assignee = notification.assignedTo.find(
        u => u.userId && u.userId.toString() === userId
      );
    }
    if (!assignee && username) {
      assignee = notification.assignedTo.find(u => u.username === username);
    }

    if (!assignee) {
      return res.status(404).json({ error: "Assigned user not found in notification" });
    }

    assignee.status      = "accepted";
    assignee.respondedAt = new Date();
    notification.unread  = false;
    notification.markModified("assignedTo");

    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Error accepting notification", details: error.message });
  }
});

// ─── Decline notification — supports userId or username ──────────────────────
router.put("/decline/:notificationId", async (req, res) => {
  const { userId, username } = req.body;

  try {
    const notification = await Notification.findOne({ notificationId: req.params.notificationId });
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    let assignee = null;
    if (userId && mongoose.isValidObjectId(userId)) {
      assignee = notification.assignedTo.find(
        u => u.userId && u.userId.toString() === userId
      );
    }
    if (!assignee && username) {
      assignee = notification.assignedTo.find(u => u.username === username);
    }

    if (!assignee) {
      return res.status(404).json({ error: "Assigned user not found in notification" });
    }

    assignee.status      = "declined";
    assignee.respondedAt = new Date();
    notification.unread  = false;
    notification.markModified("assignedTo");

    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Error declining notification", details: error.message });
  }
});

// ─── Close notification by notificationId ─────────────────────────────────────
router.put("/close/:notificationId", async (req, res) => {
  const { notificationId } = req.params;
  try {
    const updated = await Notification.findOneAndUpdate(
      { notificationId },
      { caseStatus: "Close" },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Error closing notification:", err);
    res.status(500).json({ error: "Failed to set caseStatus to Close", details: err.message });
  }
});

// ─── Delete a notification ─────────────────────────────────────────────────────
router.delete("/:notificationId", async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({ notificationId: req.params.notificationId });
    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting notification", details: error.message });
  }
});

module.exports = router;
