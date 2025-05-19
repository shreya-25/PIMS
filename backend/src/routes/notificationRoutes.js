const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");

// ✅ Create a new notification (Ensures Unique notificationId)
router.post("/", async (req, res) => {
  try {
    const existingNotification = await Notification.findOne({ notificationId: req.body.notificationId });

    if (existingNotification) {
      return res.status(400).json({ error: "Notification already exists" });
    }

     const assignedTo = (req.body.assignedTo || []).map(u => ({ username: u }));

    const newNotification = new Notification({
      notificationId: req.body.notificationId,
      assignedBy:     req.body.assignedBy,
      assignedTo,
      action1:        req.body.action1,
      action2:        req.body.action2,
      post1:          req.body.post1,
      post2:          req.body.post2,
      leadNo:         req.body.leadNo,
      leadName:       req.body.leadName,
      caseNo:         req.body.caseNo,
      caseName:       req.body.caseName,
      caseStatus:     req.body.caseStatus,
      unread:         true,
      type:           req.body.type,  
      time:           new Date(),
    });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ error: "Error creating notification", details: error.message });
  }
});

// ✅ Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching notifications", details: error.message });
  }
});

// ✅ Get open case notifications
router.get("/open", async (req, res) => {
  try {
    const openNotifications = await Notification.find({ caseStatus: "Open" });
    res.json(openNotifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching open cases", details: error.message });
  }
});

// Get notifications where username is in assignedTo or assignedBy
router.get("/user/:username", async (req, res) => {
  const { username } = req.params;
  const userNotifications = await Notification.find({
    $or: [
      { "assignedTo.username": username },
      { assignedBy: username }
    ]
  });
  res.json(userNotifications);
});

// Get only open case notifications for this user
router.get("/open/user/:username", async (req, res) => {
  const { username } = req.params;
  const notifications = await Notification.find({
    caseStatus: "Open",
    $or: [
      { "assignedTo.username": username },
      { assignedBy: username }
    ]
  });
  res.json(notifications);
});

// Get unread notifications for this user
router.get("/unread/user/:username", async (req, res) => {
  const { username } = req.params;
  const notifications = await Notification.find({
    unread: true,
    $or: [
      { "assignedTo.username": username },
      { assignedBy: username }
    ]
  });
  res.json(notifications);
});


// ✅ Update unread status
router.put("/mark-read/:notificationId", async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { notificationId: req.params.notificationId },
      { unread: false },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Error marking as read", details: error.message });
  }
});

// ✅ Accept a lead (Mark as Read & Accepted)
router.put("/accept/:notificationId", async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { notificationId: req.params.notificationId },
      { unread: false, accepted: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Error accepting lead", details: error.message });
  }
});

// ✅ Delete a notification
router.delete("/:notificationId", async (req, res) => {
  try {
    const deletedNotification = await Notification.findOneAndDelete({ notificationId: req.params.notificationId });
    if (!deletedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting notification", details: error.message });
  }
});

module.exports = router;
