/**
 * leadWriteAccess.js
 *
 * Shared helper that enforces lead-status-based write access for all LR* controllers.
 *
 * Rules:
 *  - leadStatus "Completed" or "Closed"  → nobody can write (403)
 *  - leadStatus "In Review"              → Case Managers and Detective Supervisors can write;
 *                                          Investigators are blocked (403)
 *  - Any other status (Open, Assigned…)  → everyone with access can write (null)
 *
 * Usage:
 *   const err = await checkLeadWriteAccess(req, caseNo, leadNo);
 *   if (err) return res.status(err.status).json({ message: err.message });
 */

const Lead = require("../models/lead");
const Case = require("../models/case");
const mongoose = require("mongoose");

const BLOCKED_STATUSES = ["Completed", "Closed"];
const RESTRICTED_STATUS = "In Review";

async function checkLeadWriteAccess(req, caseNo, leadNo) {
  try {
    // 1. Fetch the lead to get its current status
    const lead = await Lead.findOne({
      caseNo,
      leadNo: Number(leadNo),
      isDeleted: { $ne: true },
    }).select("leadStatus").lean();

    if (!lead) return null; // lead not found — let the controller handle 404

    const status = lead.leadStatus;

    // 2. Fully blocked statuses — nobody can write
    if (BLOCKED_STATUSES.includes(status)) {
      return {
        status: 403,
        message: `Lead is ${status}. No modifications are allowed.`,
      };
    }

    // 3. "In Review" — only Case Managers and Detective Supervisors can write
    if (status === RESTRICTED_STATUS) {
      const userId = req.user?.userId;
      if (!userId) {
        return { status: 403, message: "Access denied." };
      }

      const caseDoc = await Case.findOne({ caseNo })
        .select("caseManagerUserIds detectiveSupervisorUserId")
        .lean();

      if (!caseDoc) return null; // case not found — let the controller handle it

      const userObjId = new mongoose.Types.ObjectId(userId);

      const isCM = (caseDoc.caseManagerUserIds || []).some(
        (id) => id.equals(userObjId)
      );
      const isDS =
        caseDoc.detectiveSupervisorUserId &&
        caseDoc.detectiveSupervisorUserId.equals(userObjId);

      if (!isCM && !isDS) {
        return {
          status: 403,
          message: "Lead is In Review. Only Case Managers and Detective Supervisors can make changes.",
        };
      }
    }

    return null; // access granted
  } catch (err) {
    console.error("checkLeadWriteAccess error:", err);
    return null; // fail open — don't block on unexpected errors
  }
}

module.exports = { checkLeadWriteAccess };
