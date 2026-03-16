const Lead = require("../models/lead");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const { createSnapshot } = require("../utils/leadReturnVersioning");
const LeadReturn = require("../models/leadreturn");
const LeadReturnResult = require("../models/leadReturnResult");
const LRPerson = require("../models/LRPerson");
const LRVehicle = require("../models/LRVehicle");
const LRTimeline = require("../models/LRTimeline");
const LREvidence = require("../models/LREvidence");
const LRPicture = require("../models/LRPicture");
const LRAudio = require("../models/LRAudio");
const LRVideo = require("../models/LRVideo");
const LREnclosure = require("../models/LREnclosure");
const LRScratchpad = require("../models/LRScratchpad");

// Helper: resolve a username string to a User ObjectId
async function resolveUserId(username) {
  if (!username) return null;
  const user = await User.findOne({ username: username.toLowerCase().trim() });
  return user ? user._id : null;
}

// Helper: resolve an array of usernames to ObjectIds
async function resolveUserIds(usernames) {
  if (!usernames || !usernames.length) return [];
  const users = await User.find({ username: { $in: usernames.map(u => u.toLowerCase().trim()) } });
  const map = {};
  users.forEach(u => { map[u.username] = u._id; });
  return usernames.map(u => map[u.toLowerCase().trim()] || null).filter(Boolean);
}

const computeAggregateStatus = (assignedTo = []) => {
  const list = (assignedTo || []).map(a => a?.status || "pending");
  if (!list.length) return "Assigned";
  const allAccepted = list.every(s => s === "accepted");
  const allDeclined = list.every(s => s === "declined");
  if (allAccepted) return "Accepted";
  if (allDeclined) return "Rejected";
  if (list.includes("declined")) return "To Reassign";
  return "Assigned";
};


const createLead = async (req, res) => {
  try {
    const {
      caseId,
      parentLeadNo = [],
      incidentNo,
      subCategory = [],
      associatedSubCategories = [],
      assignedDate,
      completedDate,
      assignedTo: assignedToInput = [],
      assignedBy,
      summary,
      description,
      leadStatus,
      dueDate,
      priority,
      caseName,
      caseNo,
      accessLevel,
      submittedDate,
      approvedDate,
      returnedDate,
      primaryInvestigator,
    } = req.body;

    const missing = [];
    if (!caseId)      missing.push('Case ID');
    if (!caseName)    missing.push('Case Name');
    if (!caseNo)      missing.push('Case Number');
    if (!summary)     missing.push('Lead Log Summary');
    if (!description) missing.push('Lead Description');

    if (missing.length) {
      return res.status(400).json({
        message: `${missing.length > 1 ? 's' : ''} ${missing.join(', ')} field missing`
      });
    }

    const actor = req.user?.username || assignedBy;
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : await resolveUserId(actor);

    // Build assignedTo with userId lookups
    const assignedToUsernames = assignedToInput.map(item =>
      typeof item === 'string' ? item : item.username
    ).filter(Boolean);

    const usernameToIdMap = {};
    if (assignedToUsernames.length) {
      const users = await User.find({ username: { $in: assignedToUsernames.map(u => u.toLowerCase().trim()) } });
      users.forEach(u => { usernameToIdMap[u.username] = u._id; });
    }

    const assignedTo = assignedToInput.map(item => {
      const username = typeof item === 'string' ? item : item.username;
      return {
        username,
        userId: usernameToIdMap[username?.toLowerCase?.()?.trim()] || null,
        status: (typeof item === 'object' ? item.status : null) || 'pending',
      };
    });

    // Resolve primaryInvestigator userId
    const primaryInvestigatorUserId = primaryInvestigator
      ? (usernameToIdMap[primaryInvestigator.toLowerCase().trim()] || await resolveUserId(primaryInvestigator))
      : null;

    // Resolve toUserIds for event
    const toUserIds = assignedTo.map(a => a.userId).filter(Boolean);

    let savedLead = null;
    while (!savedLead) {
      const last = await Lead.findOne({ caseNo, caseName }).sort({ leadNo: -1 }).limit(1);
      const nextLeadNo = last ? last.leadNo + 1 : 1;

      try {
        const initialEvent = {
          type: "assigned",
          by: actor,
          byUserId: actorUserId,
          to: assignedTo.map(x => x.username),
          toUserIds,
          primaryInvestigator: primaryInvestigator || null,
          primaryInvestigatorUserId: primaryInvestigatorUserId || null,
          statusAfter: "Assigned",
          at: assignedDate ? new Date(assignedDate) : new Date()
        };

        savedLead = await new Lead({
          caseId,
          leadNo: nextLeadNo,
          parentLeadNo,
          incidentNo,
          subCategory,
          associatedSubCategories,
          assignedDate,
          completedDate,
          assignedTo,
          assignedBy: actor,
          assignedByUserId: actorUserId,
          summary,
          description,
          leadStatus: leadStatus || "Assigned",
          dueDate,
          priority,
          caseName,
          caseNo,
          accessLevel,
          submittedDate,
          approvedDate,
          returnedDate,
          primaryInvestigator,
          primaryInvestigatorUserId,
          events: [initialEvent]
        }).save();

        return res.status(201).json(savedLead);
      } catch (err) {
        if (err.code === 11000) continue;
        throw err;
      }
    }
  } catch (err) {
    console.error("Error creating lead:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


const getLeadsByOfficer = async (req, res) => {
    try {
        const officerName = req.user.username;
        const leads = await Lead.find({ assignedBy: officerName }).select("-events").lean();
        res.status(200).json(leads);
    } catch (err) {
        console.error("Error fetching leads:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLeadsForAssignedToOfficer = async (req, res) => {
  try {
    const officerName = req.user.username;
    const leads = await Lead.find({
      'assignedTo.username': officerName
    }).select("-events").lean();
    res.status(200).json(leads);
  } catch (err) {
    console.error("Error fetching leads for officer:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const getAssignedLeadsForOfficer = async (req, res) => {
  try {
    const officerName = req.user.username;
    const leads = await Lead.find({
      "assignedTo.username": officerName,
      leadStatus: "Assigned"
    }).select("-events").lean();
    return res.status(200).json(leads);
  } catch (err) {
    console.error("Error fetching only-assigned leads:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getLRForCM = async (req, res) => {
  try {
    const officerName = req.user.username;
    const leads = await Lead.find({
      "assignedBy": officerName,
      leadStatus: "In Review"
    }).select("-events").lean();
    return res.status(200).json(leads);
  } catch (err) {
    console.error("Error fetching lead returns for review:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};



const getLeadsByCase = async (req, res) => {
    try {
      const { caseNo, caseName } = req.params;
      const leads = await Lead.find({ caseNo, caseName }).select("-events").lean();
      res.status(200).json(leads);
    } catch (err) {
      console.error("Error fetching leads by case:", err.message);
      res.status(500).json({ message: "Something went wrong" });
    }
  };

  const getLeadsByLeadNoandLeadName = async (req, res) => {
    try {
        const { leadNo, leadName, caseNo, caseName } = req.params;
        const query = {
            leadNo: leadNo,
            description: leadName,
            caseNo: caseNo,
            caseName: caseName
        };
        const leads = await Lead.find(query).lean();
        res.status(200).json(leads);
    } catch (err) {
        console.error("Error fetching leads by case:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLeadsforHierarchy = async (req, res) => {
  try {
      const { leadNo, caseNo, caseName } = req.params;
      const query = {
          leadNo: leadNo,
          caseNo: caseNo,
          caseName: caseName
      };
      const leads = await Lead.find(query).select("-events").lean();
      res.status(200).json(leads);
  } catch (err) {
      console.error("Error fetching leads by case:", err.message);
      res.status(500).json({ message: "Something went wrong" });
  }
};

const getAssociatedSubCategories = async (req, res) => {
  try {
    const { caseNo, caseName } = req.params;
    const leads = await Lead.find({ caseNo, caseName }).select("subCategory").lean();
    const uniqueSubCategories = [...new Set(leads.flatMap(lead => lead.subCategory || []))];
    res.status(200).json({ associatedSubCategories: uniqueSubCategories });
  } catch (err) {
    console.error("Error fetching subcategories:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};



const updateLeadStatus = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;

    const lead = await Lead.findOne({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.leadStatus = "Accepted";
    await lead.save();

    res.status(200).json({ message: "Status updated successfully", lead });
  } catch (err) {
    console.error("Error updating lead status:", err.message);
    res.status(500).json({ message: "Server error while updating lead status" });
  }
};


exports.updateLeadLRStatus = async (req, res) => {
  const { leadNo, leadName, caseNo, caseName, lRStatus } = req.body;

  try {
    const lead = await Lead.findOne({
      leadNo,
      leadName,
      caseNo,
      caseName,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.assignedBy.lRStatus = lRStatus;

    await lead.save();

    return res.status(200).json({ message: "Lead status updated successfully" });
  } catch (error) {
    console.error("Error updating lead status:", error);
    return res.status(500).json({ message: "Server error updating lead status" });
  }
};

const updateLRStatusToPending = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo } = req.body;

    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const updatedDoc = await LeadReturn.findOneAndUpdate(
      {
        leadNo,
        description,
        caseName,
        caseNo,
      },
      {
        $set: {
          "assignedTo.lRStatus": "Accepted",
        },
      },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "Lead return not found." });
    }

    res.status(200).json(updatedDoc);
  } catch (err) {
    console.error("Error updating lead return status:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const searchLeadsByKeyword = async (req, res) => {
  try {
    const { caseNo, caseName, keyword, field } = req.query;

    if (!caseNo || !caseName) {
      return res.status(400).json({ message: "caseNo and caseName are required." });
    }

    const searchKeyword = keyword || "";

    const baseQuery = {
      caseNo,
      caseName: { $regex: new RegExp(`^${caseName}$`, "i") }
    };

    let query;
    if (field) {
      switch (field) {
        case "Lead Number":
          query = { ...baseQuery, leadNo: searchKeyword };
          break;
        case "Priority":
          query = { ...baseQuery, priority: { $regex: new RegExp(searchKeyword, "i") } };
          break;
        case "Due Date":
          query = { ...baseQuery, dueDate: { $regex: new RegExp(searchKeyword, "i") } };
          break;
        case "Remaining Days":
          const numericKeyword = Number(searchKeyword);
          if (isNaN(numericKeyword)) {
            return res.status(400).json({ message: "Invalid value for Remaining Days." });
          }
          query = { ...baseQuery, remainingDays: numericKeyword };
          break;
        default:
          query = {
            ...baseQuery,
            $or: [
              { description: { $regex: new RegExp(searchKeyword, "i") } },
              { summary: { $regex: new RegExp(searchKeyword, "i") } }
            ]
          };
      }
    } else {
      if (searchKeyword.match(/^Lead\d+$/i)) {
        query = { ...baseQuery, leadNo: searchKeyword };
      } else {
        query = {
          ...baseQuery,
          $or: [
            { description: { $regex: new RegExp(searchKeyword, "i") } },
            { summary: { $regex: new RegExp(searchKeyword, "i") } }
          ]
        };
      }
    }

    const leads = await Lead.find(query).select("-events").lean();
    res.status(200).json(leads);
  } catch (err) {
    console.error("Error searching leads:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const HarddeleteLead = async (req, res) => {
  const { leadNo, leadName, caseNo, caseName } = req.params;

  try {
    const role = req.user?.role || "";
    const allowed = /^(case\s*manager|detective\s*supervisor)$/i.test(role);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only Case Managers or Detective Supervisors can delete a lead." });
    }

    const filter = {
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
    };

    const existing = await Lead.findOne(filter);
    if (!existing) {
      return res.status(404).json({ message: "Lead not found." });
    }

    await Lead.deleteOne({ _id: existing._id });

    return res.status(200).json({ message: "Lead deleted successfully." });
  } catch (err) {
    console.error("Error deleting lead:", err);
    return res.status(500).json({ message: "Server error while deleting lead." });
  }
};

const deleteLead = async (req, res) => {
  const { leadNo, leadName, caseNo, caseName } = req.params;
  const { reason } = req.body;

  try {
    const role = req.user?.role || "";
    const allowed = /^(case\s*manager|detective\s*supervisor)$/i.test(role);
    if (!allowed) {
      return res.status(403).json({ message: "Unauthorized: Only Case Managers or Detective Supervisors can delete a lead." });
    }
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ message: "Reason is required." });
    }

    const lead = await Lead.findOne({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo, caseName
    });
    if (!lead) return res.status(404).json({ message: "Lead not found." });

    const actor = req.user?.username || "unknown";
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    lead.isDeleted     = true;
    lead.deletedAt     = new Date();
    lead.deletedBy     = actor;
    lead.deletedByUserId = actorUserId;
    lead.deletedReason = reason;

    lead.comment = [lead.comment, `[DELETED ${new Date().toLocaleString()} by ${actor}] Reason: ${reason}`]
      .filter(Boolean).join("\n\n");

    lead.leadStatus = "Deleted";
    lead.events.push({
      type: "cm-deleted",
      by: actor,
      byUserId: actorUserId,
      to: (lead.assignedTo || []).map(a => a.username),
      toUserIds: (lead.assignedTo || []).map(a => a.userId).filter(Boolean),
      reason,
      primaryInvestigator: lead.primaryInvestigator || null,
      primaryInvestigatorUserId: lead.primaryInvestigatorUserId || null,
      statusAfter: "Deleted",
      at: new Date()
    });

    await lead.save();

    // Cascade soft delete to all child records
    const now = new Date();
    const deleteFields = {
      isDeleted: true,
      deletedAt: now,
      deletedByUserId: actorUserId,
      deletedBy: actor,
    };
    // Match by leadId OR by leadNo+caseNo (for older records missing leadId)
    const childFilter = {
      $or: [
        { leadId: lead._id },
        { leadNo: lead.leadNo, caseNo: lead.caseNo },
      ],
      isDeleted: { $ne: true },
    };

    // Soft delete lead returns
    await LeadReturn.updateMany(childFilter, deleteFields);

    // Soft delete lead return results
    await LeadReturnResult.updateMany(childFilter, deleteFields);

    // Soft delete all LR* tables
    await Promise.all(
      [LRPerson, LRVehicle, LRTimeline, LREvidence, LRPicture, LRAudio, LRVideo, LREnclosure, LRScratchpad]
        .map((Model) => Model.updateMany(childFilter, deleteFields))
    );

    return res.status(200).json({ message: "Lead marked as deleted.", lead });
  } catch (err) {
    console.error("Error soft-deleting lead:", err);
    return res.status(500).json({ message: "Server error while deleting lead." });
  }
};



const setLeadStatusToInReview = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo, submittedDate } = req.body;
    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const lead = await Lead.findOne({ leadNo, description, caseName, caseNo });
    if (!lead) return res.status(404).json({ message: "Lead not found." });

    const actor = req.user?.username || "unknown";
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    lead.leadStatus   = "In Review";
    lead.submittedDate = submittedDate ? new Date(submittedDate) : new Date();
    lead.submittedBy   = actor;
    lead.submittedByUserId = actorUserId;

    lead.events.push({
      type: "pi-submitted",
      by: actor,
      byUserId: actorUserId,
      to: [],
      toUserIds: [],
      primaryInvestigator: lead.primaryInvestigator || null,
      primaryInvestigatorUserId: lead.primaryInvestigatorUserId || null,
      statusAfter: "In Review",
      at: new Date()
    });

    await lead.save();

    try {
      await createSnapshot(leadNo, actor, "Submitted", lead.caseNo, lead.caseName);
    } catch (snapshotErr) {
      console.error("Error creating snapshot:", snapshotErr.message);
    }

    return res.status(200).json({ message: "Lead status set to 'In Review'.", lead });
  } catch (err) {
    console.error("Error updating lead status to 'In Review':", err.message);
    return res.status(500).json({ message: "Something went wrong while updating status." });
  }
};


const setLeadStatusToComplete = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo, approvedDate } = req.body;
    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const lead = await Lead.findOne({ leadNo, description, caseName, caseNo });
    if (!lead) return res.status(404).json({ message: "Lead not found." });

    const actor = req.user?.username || "unknown";
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    lead.leadStatus   = "Completed";
    lead.approvedDate = approvedDate ? new Date(approvedDate) : new Date();

    lead.events.push({
      type: "cm-approved",
      by: actor,
      byUserId: actorUserId,
      to: (lead.assignedTo || []).map(a => a.username),
      toUserIds: (lead.assignedTo || []).map(a => a.userId).filter(Boolean),
      primaryInvestigator: lead.primaryInvestigator || null,
      primaryInvestigatorUserId: lead.primaryInvestigatorUserId || null,
      statusAfter: "Completed",
      at: new Date()
    });

    await lead.save();

    try {
      await createSnapshot(leadNo, actor, "Approved", caseNo, caseName);
    } catch (snapshotErr) {
      console.error("Error creating snapshot:", snapshotErr.message);
    }

    return res.status(200).json({ message: "Lead status set to 'Completed'.", lead });
  } catch (err) {
    console.error("Error updating lead status to 'Completed':", err.message);
    return res.status(500).json({ message: "Something went wrong while updating status." });
  }
};

const setLeadStatusToPending = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo } = req.body;

    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const lead = await Lead.findOne({
      leadNo,
      description,
      caseName,
      caseNo,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    lead.leadStatus = "Accepted";
    await lead.save();

    return res.status(200).json({ message: "Lead status set to 'Accepted'.", lead });
  } catch (err) {
    console.error("Error updating lead status:", err.message);
    return res.status(500).json({ message: "Something went wrong while updating status." });
  }
};

const setLeadStatusToReturned = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo, reason } = req.body;
    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const lead = await Lead.findOne({ leadNo, description, caseName, caseNo });
    if (!lead) return res.status(404).json({ message: "Lead not found." });

    const actor = req.user?.username || "unknown";
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    lead.leadStatus   = "Returned";
    lead.returnedDate = new Date();

    lead.events.push({
      type: "cm-returned",
      by: actor,
      byUserId: actorUserId,
      to: (lead.assignedTo || []).map(a => a.username),
      toUserIds: (lead.assignedTo || []).map(a => a.userId).filter(Boolean),
      reason: reason || "",
      primaryInvestigator: lead.primaryInvestigator || null,
      primaryInvestigatorUserId: lead.primaryInvestigatorUserId || null,
      statusAfter: "Returned",
      at: new Date()
    });

    await lead.save();

    try {
      await createSnapshot(leadNo, actor, "Returned", caseNo, caseName);
    } catch (snapshotErr) {
      console.error("Error creating snapshot:", snapshotErr.message);
    }

    return res.status(200).json({ message: "Lead status set to 'Returned'.", lead });
  } catch (err) {
    console.error("Error updating lead status to 'Returned':", err.message);
    return res.status(500).json({ message: "Something went wrong while updating status." });
  }
};


const setLeadStatusToReopened = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo } = req.body;
    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const lead = await Lead.findOne({ leadNo, description, caseName, caseNo });
    if (!lead) return res.status(404).json({ message: "Lead not found." });

    const actor = req.user?.username || "unknown";
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    lead.leadStatus   = "Reopened";
    lead.reopenedDate = new Date();

    lead.events.push({
      type: "cm-reopened",
      by: actor,
      byUserId: actorUserId,
      to: (lead.assignedTo || []).map(a => a.username),
      toUserIds: (lead.assignedTo || []).map(a => a.userId).filter(Boolean),
      primaryInvestigator: lead.primaryInvestigator || null,
      primaryInvestigatorUserId: lead.primaryInvestigatorUserId || null,
      statusAfter: "Reopened",
      at: new Date()
    });

    await lead.save();

    try {
      await createSnapshot(leadNo, actor, "Reopened", caseNo, caseName);
    } catch (snapshotErr) {
      console.error("Error creating snapshot:", snapshotErr.message);
    }

    return res.status(200).json({ message: "Lead status set to 'Reopened'.", lead });
  } catch (err) {
    console.error("Error updating lead status to 'Reopened':", err.message);
    return res.status(500).json({ message: "Something went wrong while updating status." });
  }
};


const updateLead = async (req, res) => {
  try {
    const { leadNo, description, caseNo, caseName } = req.params;
    const incoming = req.body;

    const prev = await Lead.findOne({ leadNo: Number(leadNo), description, caseNo, caseName });
    if (!prev) return res.status(404).json({ message: "Lead not found" });

    const { events: _ignoreEvents, ...incomingNoEvents } = incoming;

    // normalize assignedTo with userId lookup
    const normalizeAssignedTo = async (arr) => {
      const items = (Array.isArray(arr) ? arr : []).map(x =>
        typeof x === "string"
          ? { username: x, status: "pending" }
          : { username: x?.username, userId: x?.userId, status: x?.status || "pending" }
      ).filter(a => a.username);

      // Resolve missing userIds
      const needLookup = items.filter(a => !a.userId).map(a => a.username);
      if (needLookup.length) {
        const users = await User.find({ username: { $in: needLookup.map(u => u.toLowerCase().trim()) } });
        const map = {};
        users.forEach(u => { map[u.username] = u._id; });
        items.forEach(a => {
          if (!a.userId) a.userId = map[a.username?.toLowerCase?.()?.trim()] || null;
        });
      }
      return items;
    };

    const nextAssignedTo = await normalizeAssignedTo(incomingNoEvents.assignedTo ?? prev.assignedTo);

    const prevSet = new Set((prev.assignedTo || []).map(a => a.username));
    const nextSet = new Set(nextAssignedTo.map(a => a.username));
    const added   = [...nextSet].filter(u => !prevSet.has(u));
    const removed = [...prevSet].filter(u => !nextSet.has(u));

    const actor = req.user?.username || incomingNoEvents.assignedBy || prev.assignedBy;
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    const statusAfter = computeAggregateStatus(nextAssignedTo);

    // Build userId map for events
    const userIdMap = {};
    nextAssignedTo.forEach(a => { if (a.userId) userIdMap[a.username] = a.userId; });
    (prev.assignedTo || []).forEach(a => { if (a.userId) userIdMap[a.username] = a.userId; });

    const eventsToPush = [
      ...added.map(u => ({
        type: "reassigned-added",
        by: actor,
        byUserId: actorUserId,
        to: [u],
        toUserIds: userIdMap[u] ? [userIdMap[u]] : [],
        primaryInvestigator: incomingNoEvents.primaryInvestigator ?? prev.primaryInvestigator ?? null,
        primaryInvestigatorUserId: prev.primaryInvestigatorUserId || null,
        statusAfter,
        at: new Date()
      })),
      ...removed.map(u => ({
        type: "reassigned-removed",
        by: actor,
        byUserId: actorUserId,
        to: [u],
        toUserIds: userIdMap[u] ? [userIdMap[u]] : [],
        primaryInvestigator: incomingNoEvents.primaryInvestigator ?? prev.primaryInvestigator ?? null,
        primaryInvestigatorUserId: prev.primaryInvestigatorUserId || null,
        statusAfter,
        at: new Date()
      }))
    ];

    const candidatePI = incomingNoEvents.primaryInvestigator ?? prev.primaryInvestigator ?? null;
    const nextPI = candidatePI && nextSet.has(candidatePI) ? candidatePI : null;
    const nextPIUserId = nextPI ? (userIdMap[nextPI] || null) : null;

    const updateDoc = {
      $set: {
        ...incomingNoEvents,
        assignedTo: nextAssignedTo,
        leadStatus: incomingNoEvents.leadStatus || statusAfter,
        primaryInvestigator: nextPI,
        primaryInvestigatorUserId: nextPIUserId,
      }
    };
    if (eventsToPush.length) {
      updateDoc.$push = { events: { $each: eventsToPush } };
    }

    const lead = await Lead.findOneAndUpdate(
      { leadNo: Number(leadNo), description, caseNo, caseName },
      updateDoc,
      { new: true }
    );

    return res.status(200).json(lead);
  } catch (err) {
    console.error("Error updating lead:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const updateAssignedToStatus = async (req, res) => {
  try {
    const { leadNo, description, caseNo, caseName } = req.params;
    const { officerUsername, status, reason } = req.body;

    if (!officerUsername || !status) {
      return res.status(400).json({ message: "Need officerUsername and status" });
    }

    const lead = await Lead.findOneAndUpdate(
      {
        leadNo: Number(leadNo),
        description,
        caseNo,
        caseName,
        'assignedTo.username': officerUsername
      },
      { $set: { 'assignedTo.$.status': status } },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead or officer not found" });

    const statusAfter = computeAggregateStatus(lead.assignedTo);

    const actor = req.user?.username || officerUsername;
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    lead.events.push({
      type: status === "accepted" ? "accepted" : "declined",
      by: actor,
      byUserId: actorUserId,
      to: [officerUsername],
      toUserIds: actorUserId ? [actorUserId] : [],
      reason: status === "declined" ? (reason || "") : undefined,
      primaryInvestigator: lead.primaryInvestigator || null,
      primaryInvestigatorUserId: lead.primaryInvestigatorUserId || null,
      statusAfter,
      at: new Date()
    });
    lead.leadStatus = statusAfter;
    await lead.save();

    return res.status(200).json({ message: "Officer status updated", lead });
  } catch (err) {
    console.error("Error updating officer status:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const removeAssignedOfficer = async (req, res) => {
  try {
    const { leadNo, description, caseNo, caseName, username } = req.params;

    const lead = await Lead.findOneAndUpdate(
      { leadNo: Number(leadNo), description, caseNo, caseName },
      { $pull: { assignedTo: { username } } },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    const statusAfter = computeAggregateStatus(lead.assignedTo);

    const actor = req.user?.username || lead.assignedBy;
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    lead.events.push({
      type: "reassigned-removed",
      by: actor,
      byUserId: actorUserId,
      to: [username],
      toUserIds: await resolveUserIds([username]),
      primaryInvestigator: lead.primaryInvestigator || null,
      primaryInvestigatorUserId: lead.primaryInvestigatorUserId || null,
      statusAfter,
      at: new Date()
    });
    lead.leadStatus = statusAfter;
    await lead.save();

    res.status(200).json({
      message: `Officer '${username}' removed from assignedTo`,
      lead
    });
  } catch (err) {
    console.error("Error removing assigned officer:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const getLeadStatus = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;

    const lead = await Lead.findOne({
      leadNo:   Number(leadNo),
      description: leadName,
      caseNo,
      caseName
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ leadStatus: lead.leadStatus });
  } catch (err) {
    console.error("Error fetching lead status:", err);
    res.status(500).json({ message: "Server error while fetching lead status" });
  }
};

const setLeadStatusToClosed = async (req, res) => {
  try {
    const { leadNo, description, caseNo, caseName, reason } = req.body;
    if (!leadNo || !description || !caseNo || !caseName || !reason) {
      return res.status(400).json({ message: "All fields (including reason) are required." });
    }

    const lead = await Lead.findOne({ leadNo: Number(leadNo), description, caseNo, caseName });
    if (!lead) return res.status(404).json({ message: "Lead not found." });

    const actor = req.user?.username || "unknown";
    const actorUserId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    lead.leadStatus = "Closed";
    lead.closedDate = new Date();
    lead.comment    = reason;

    lead.events.push({
      type: "cm-closed",
      by: actor,
      byUserId: actorUserId,
      to: (lead.assignedTo || []).map(a => a.username),
      toUserIds: (lead.assignedTo || []).map(a => a.userId).filter(Boolean),
      reason,
      primaryInvestigator: lead.primaryInvestigator || null,
      primaryInvestigatorUserId: lead.primaryInvestigatorUserId || null,
      statusAfter: "Closed",
      at: new Date()
    });

    await lead.save();
    return res.status(200).json({ message: "Lead closed successfully.", lead });
  } catch (err) {
    console.error("Error closing lead:", err);
    return res.status(500).json({ message: "Server error while closing lead." });
  }
};



const updateLeadFlags = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;
    const { associatedFlags } = req.body;

    if (!Array.isArray(associatedFlags)) {
      return res.status(400).json({ message: "associatedFlags must be an array" });
    }

    const lead = await Lead.findOneAndUpdate(
      { leadNo: Number(leadNo), description: leadName, caseNo, caseName },
      { $set: { associatedFlags } },
      { new: true }
    );

    if (!lead) return res.status(404).json({ message: "Lead not found" });
    return res.status(200).json(lead);
  } catch (err) {
    console.error("Error updating lead flags:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getCaseFlaggedLeads = async (req, res) => {
  try {
    const { caseNo, caseName } = req.params;
    const leads = await Lead.find({
      caseNo, caseName,
      isDeleted: { $ne: true },
      "associatedFlags.0": { $exists: true }
    }).select("leadNo description associatedFlags accessLevel leadStatus").lean();
    res.status(200).json(leads);
  } catch (err) {
    console.error("Error fetching flagged leads:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getCaseAllLeadsWithFlags = async (req, res) => {
  try {
    const { caseNo, caseName } = req.params;
    const leads = await Lead.find({ caseNo, caseName, isDeleted: { $ne: true } })
      .select("leadNo description associatedFlags accessLevel leadStatus")
      .lean();
    res.status(200).json(leads);
  } catch (err) {
    console.error("Error fetching leads with flags:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createLead, getLeadsByOfficer, getLeadsByCase, getLeadsForAssignedToOfficer, getLeadsByLeadNoandLeadName , getLeadsforHierarchy, updateLeadStatus, getAssociatedSubCategories, updateLRStatusToPending, searchLeadsByKeyword , setLeadStatusToInReview,
  setLeadStatusToComplete, setLeadStatusToPending, updateLead, updateAssignedToStatus, removeAssignedOfficer, getAssignedLeadsForOfficer, getLRForCM, getLeadStatus, setLeadStatusToClosed,  deleteLead, setLeadStatusToReturned, setLeadStatusToReopened,
  updateLeadFlags, getCaseFlaggedLeads, getCaseAllLeadsWithFlags
};
