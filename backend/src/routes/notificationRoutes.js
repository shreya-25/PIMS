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

    const assignedTo = req.body.assignedTo || [];


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

router.put("/close/:caseNo", async (req, res) => {
  const rawCaseNo = req.params.caseNo;
  const caseNo = String(rawCaseNo).trim();

  console.log("🔎 Searching for caseNo:", caseNo);

  try {
    const match = await Notification.findOne({ caseNo });
    console.log("🔍 Found Notification:", match);

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
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Failed to close notification", details: err.message });
  }
});


// ✅ Update unread status
router.put("/mark-read/:notificationId", async (req, res) => {
  const { notificationId } = req.params;
  const { username }       = req.body;

  if (!username) {
    return res.status(400).json({ error: "username is required in request body" });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      {
        notificationId,
        "assignedTo.username": username
      },
      {
        $set: {
          "assignedTo.$.unread": false,
          // optionally record when they read it:
          // "assignedTo.$.respondedAt": new Date()
        }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification or user slice not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      error:   "Error marking as read",
      details: error.message
    });
  }
});

router.put("/accept/:notificationId", async (req, res) => {
  const { username } = req.body; // Officer's username like "Officer 916"

  try {
    const notification = await Notification.findOne({ notificationId: req.params.notificationId });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const assignee = notification.assignedTo.find(u => u.username === username);
    if (!assignee) {
      return res.status(404).json({ error: "Assigned user not found in notification" });
    }

    // ✅ Update the nested subdocument fields
    assignee.status = "accepted";
    assignee.respondedAt = new Date();
    notification.unread = false;

    // ✅ Tell Mongoose this nested array was modified
    notification.markModified("assignedTo");

    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Error accepting lead", details: error.message });
  }
});

router.put("/decline/:notificationId", async (req, res) => {
  const { username } = req.body; // Officer's username like "Officer 916"

  try {
    const notification = await Notification.findOne({ notificationId: req.params.notificationId });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const assignee = notification.assignedTo.find(u => u.username === username);
    if (!assignee) {
      return res.status(404).json({ error: "Assigned user not found in notification" });
    }

    // ✅ Update the nested subdocument fields
    assignee.status = "declined";
    assignee.respondedAt = new Date();
    notification.unread = false;

    // ✅ Tell Mongoose this nested array was modified
    notification.markModified("assignedTo");

    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Error accepting lead", details: error.message });
  }
});

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
    console.error("Error closing notification case:", err);
    res
      .status(500)
      .json({ error: "Failed to set caseStatus to Close", details: err.message });
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
