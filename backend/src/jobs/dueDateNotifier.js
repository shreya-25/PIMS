const Lead         = require("../models/lead");
const Notification = require("../models/notification");

/**
 * Runs every hour. Finds leads whose due date is tomorrow and sends
 * one notification per lead per day to every assigned investigator.
 * Deduplication is handled by the notificationId pattern:
 *   "due-soon-<leadId>-<YYYY-MM-DD>"
 */
async function checkDueDates() {
  try {
    const now = new Date();

    // Tomorrow's date window (midnight → midnight)
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const tomorrowStr = tomorrowStart.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Find active leads due tomorrow with at least one active assignee
    const leads = await Lead.find({
      dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      isDeleted: { $ne: true },
      leadStatus: { $nin: ["Deleted", "Completed", "Closed", "Approved"] },
      "assignedTo.0": { $exists: true },
    }).lean();

    for (const lead of leads) {
      const notificationId = `due-soon-${lead._id}-${tomorrowStr}`;

      // Skip if already sent today
      const exists = await Notification.exists({ notificationId });
      if (exists) continue;

      // Active assignees only
      const activeAssignees = (lead.assignedTo || []).filter(
        (a) => a && a.status !== "declined" && a.username
      );
      if (!activeAssignees.length) continue;

      const assignedToPayload = activeAssignees.map((a) => ({
        username: a.username,
        role:     a.role || "Investigator",
        status:   "pending",
        unread:   true,
      }));

      await Notification.create({
        notificationId,
        assignedBy:  "System",
        assignedTo:  assignedToPayload,
        caseId:      lead.caseId   || null,
        leadId:      lead._id,
        action1:     "due date reminder: lead",
        post1:       `${lead.leadNo}: ${lead.description || ""}`,
        action2:     "is due tomorrow",
        post2:       tomorrowStr,
        leadNo:      String(lead.leadNo),
        leadName:    lead.description || "",
        caseNo:      lead.caseNo   || "",
        caseName:    lead.caseName || "",
        caseStatus:  "Open",
        type:        "Lead",
      });

      console.log(`[DueDateNotifier] Sent due-soon notification for lead ${lead.leadNo} (case ${lead.caseNo})`);
    }
  } catch (err) {
    console.error("[DueDateNotifier] Error:", err.message);
  }
}

/**
 * Starts the due-date notifier. Runs once immediately, then every hour.
 */
function startDueDateNotifier() {
  checkDueDates();
  setInterval(checkDueDates, 60 * 60 * 1000); // every hour
}

module.exports = { startDueDateNotifier };
