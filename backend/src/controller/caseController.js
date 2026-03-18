const mongoose = require("mongoose");
const Case = require("../models/case");
const User = require("../models/userModel");
const Lead = require("../models/lead");
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

// Helper: look up a single user by username, return the doc or null
async function findUserByUsername(username) {
  if (!username) return null;
  const name = typeof username === "string" ? username : username.username || username.name;
  return User.findOne({ username: name.trim() });
}

// Create a new case
exports.createCase = async (req, res) => {
  try {
    const {
      caseNo,
      caseName,
      selectedOfficers = [],
      managers = [],
      detectiveSupervisor,
      characterOfCase = "",
    } = req.body;

    if (!caseNo || !caseName) {
      return res.status(400).json({ message: "caseNo and caseName are required" });
    }

    if (!/^[A-Za-z0-9-]+$/.test(caseNo)) {
      return res.status(400).json({ message: "Case number can only contain letters, digits, and hyphens (-)." });
    }
    if (!Array.isArray(managers) || managers.length === 0) {
      return res.status(400).json({ message: "At least one Case Manager is required." });
    }
    if (!detectiveSupervisor) {
      return res.status(400).json({ message: "Detective Supervisor is required" });
    }

    const existingCase = await Case.findOne({ caseNo });
    if (existingCase) {
      return res.status(400).json({ message: "Case number already exists. Please use a unique caseNo." });
    }

    const duplicateName = await Case.findOne({ caseName: caseName.trim() });
    if (duplicateName) {
      return res.status(409).json({ message: "Case name already exists. Please choose a different name." });
    }

    const managerUsers = [];
    for (const m of managers) {
      const uname = m.username || m.name || m;
      const u = await findUserByUsername(uname);
      if (!u) return res.status(400).json({ message: `Case Manager '${uname}' not found.` });
      managerUsers.push(u);
    }

    const dsUsername = typeof detectiveSupervisor === "string"
      ? detectiveSupervisor
      : detectiveSupervisor.name || detectiveSupervisor.username;
    const dsUser = await findUserByUsername(dsUsername);
    if (!dsUser) {
      return res.status(400).json({ message: `Detective Supervisor '${dsUsername}' not found.` });
    }

    const investigatorUsernames = selectedOfficers.map(o => o.username || o.name || o).map(u => u.trim());
    const investigatorUsers = await User.find({ username: { $in: investigatorUsernames } });

    const newCase = new Case({
      caseNo,
      caseName,
      status: "ONGOING",
      characterOfCase,
      caseManagerUserIds: managerUsers.map(u => u._id),
      detectiveSupervisorUserId: dsUser._id,
      investigatorUserIds: investigatorUsers.map(u => u._id),
      createdByUserId: req.user.userId,
    });

    await newCase.save();
    res.status(201).json({ message: "Case created successfully", data: newCase });
  } catch (err) {
    console.error("Error creating case:", err);
    res.status(500).json({ message: "Error creating case", error: err.message });
  }
};

// Get all cases
exports.getAllCases = async (req, res) => {
  try {
    const cases = await Case.find({ isDeleted: { $ne: true } })
      .populate("caseManagerUserIds", "username firstName lastName displayName")
      .populate("detectiveSupervisorUserId", "username firstName lastName displayName")
      .populate("investigatorUserIds", "username firstName lastName displayName")
      .populate("createdByUserId", "username firstName lastName displayName")
      .lean();

    res.status(200).json(cases || []);
  } catch (err) {
    console.error("Error fetching cases:", err);
    res.status(500).json({ message: "Error fetching cases", error: err.message });
  }
};

// Get a single case by ID
exports.getCaseById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }

    const caseData = await Case.findById(req.params.id)
      .populate("caseManagerUserIds", "username firstName lastName displayName")
      .populate("detectiveSupervisorUserId", "username firstName lastName displayName")
      .populate("investigatorUserIds", "username firstName lastName displayName")
      .lean();

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }
    res.status(200).json(caseData);
  } catch (err) {
    console.error("Error fetching case:", err);
    res.status(500).json({ message: "Error fetching case", error: err.message });
  }
};

// Get cases assigned to a specific officer (by username query param)
exports.getCasesByOfficer = async (req, res) => {
  try {
    const officerName = req.query.officerName;
    if (!officerName) {
      return res.status(400).json({ message: "officerName query is required" });
    }

    const user = await findUserByUsername(officerName);
    if (!user) {
      return res.status(404).json({ message: "Officer not found" });
    }

    const statusFilter = req.query.status || "ONGOING";
    const cases = await Case.find({
      isDeleted: { $ne: true },
      status: statusFilter,
      $or: [
        { caseManagerUserIds: user._id },
        { detectiveSupervisorUserId: user._id },
        { investigatorUserIds: user._id },
      ],
    })
      .populate("caseManagerUserIds", "username firstName lastName displayName role")
      .populate("detectiveSupervisorUserId", "username firstName lastName displayName role")
      .populate("investigatorUserIds", "username firstName lastName displayName role")
      .lean();

    if (!cases || cases.length === 0) {
      return res.status(404).json({ message: "No cases assigned to this officer" });
    }

    const formattedCases = cases.map((c) => {
      let role = "Unknown";
      if ((c.caseManagerUserIds || []).some(cm => cm._id.equals(user._id))) {
        role = "Case Manager";
      } else if (c.detectiveSupervisorUserId && c.detectiveSupervisorUserId._id.equals(user._id)) {
        role = "Detective Supervisor";
      } else if (c.investigatorUserIds.some(inv => inv._id.equals(user._id))) {
        role = "Investigator";
      }

      return {
        _id: c._id,
        caseNo: c.caseNo,
        caseName: c.caseName,
        caseStatus: c.status,
        role,
      };
    });

    res.status(200).json(formattedCases);
  } catch (err) {
    console.error("Error fetching cases for officer:", err);
    res.status(500).json({ message: "Error fetching cases", error: err.message });
  }
};

// Update case details
exports.updateCase = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Update data cannot be empty" });
    }

    const updatedCase = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }
    res.status(200).json({ message: "Case updated successfully", data: updatedCase });
  } catch (err) {
    console.error("Error updating case:", err);
    res.status(500).json({ message: "Error updating case", error: err.message });
  }
};

// Delete a case (soft delete — cascades to leads, lead returns, lead return results, and LR* tables)
exports.deleteCase = async (req, res) => {
  try {
    const caseId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc || caseDoc.isDeleted) {
      return res.status(404).json({ message: "Case not found" });
    }

    const now = new Date();
    const deletedByUserId = req.user?.userId || null;

    await Case.findByIdAndUpdate(caseId, {
      isDeleted: true,
      deletedAt: now,
      deletedByUserId,
    });

    const childFilter = {
      $or: [{ caseId }, { caseNo: caseDoc.caseNo }],
      isDeleted: { $ne: true },
    };
    const deleteFields = {
      isDeleted: true,
      deletedAt: now,
      deletedByUserId,
      deletedBy: req.user?.username || "system",
    };

    await Lead.updateMany(childFilter, {
      ...deleteFields,
      deletedReason: "Parent case deleted",
      leadStatus: "Deleted",
    });

    await LeadReturn.updateMany(childFilter, deleteFields);
    await LeadReturnResult.updateMany(childFilter, deleteFields);

    const lrModels = [
      LRPerson, LRVehicle, LRTimeline, LREvidence,
      LRPicture, LRAudio, LRVideo, LREnclosure, LRScratchpad,
    ];
    await Promise.all(lrModels.map((Model) => Model.updateMany(childFilter, deleteFields)));

    res.status(200).json({ message: "Case and all related records soft-deleted successfully" });
  } catch (err) {
    console.error("Error deleting case:", err);
    res.status(500).json({ message: "Error deleting case", error: err.message });
  }
};

// PUT /api/cases/:id/close
exports.closeCase = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }

    const updated = await Case.findByIdAndUpdate(id, { status: "COMPLETED" }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Case not found" });
    }

    return res.status(200).json({ message: "Case closed successfully", data: updated });
  } catch (err) {
    console.error("Error closing case:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Reject a case by reassigning Case Manager to Admin
exports.rejectCase = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }

    const existingCase = await Case.findById(id);
    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      return res.status(500).json({ message: "Admin user not found in system" });
    }

    existingCase.caseManagerUserIds = [adminUser._id];
    const updatedCase = await existingCase.save();

    return res.status(200).json({ message: "Case rejected.", data: updatedCase });
  } catch (error) {
    console.error("Error rejecting case:", error);
    return res.status(500).json({ message: "Error rejecting case", error: error.message });
  }
};

// GET case team by case ID
exports.getCaseTeam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }

    const c = await Case.findById(id)
      .populate("caseManagerUserIds", "username firstName lastName displayName")
      .populate("detectiveSupervisorUserId", "username firstName lastName displayName")
      .populate("investigatorUserIds", "username firstName lastName displayName")
      .lean();

    if (!c) {
      return res.status(404).json({ message: "Case not found" });
    }

    const detectiveSupervisor = c.detectiveSupervisorUserId?.username || "";
    const caseManagers = (c.caseManagerUserIds || []).map(u => u.username);
    const investigators = [...new Set((c.investigatorUserIds || []).map(u => u.username))];

    return res.json({ detectiveSupervisor, caseManagers, investigators });
  } catch (err) {
    console.error("Error in getCaseTeam:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update case officers (replace the full team by role)
exports.updateCaseOfficers = async (req, res) => {
  try {
    const { id } = req.params;
    const { officers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }
    if (!Array.isArray(officers)) {
      return res.status(400).json({ message: "An array of officers is required" });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    const caseManagerIds = [];
    let detectiveSupervisorId = caseDoc.detectiveSupervisorUserId;
    const investigatorIds = [];

    for (const off of officers) {
      const name = off.name || off.username || off;
      if (typeof name !== "string") continue;
      const user = await findUserByUsername(name);
      if (!user) continue;

      if (off.role === "Case Manager") {
        caseManagerIds.push(user._id);
      } else if (off.role === "Detective Supervisor") {
        detectiveSupervisorId = user._id;
      } else if (off.role === "Investigator") {
        investigatorIds.push(user._id);
      }
    }

    caseDoc.caseManagerUserIds = [...new Map(caseManagerIds.map(id => [id.toString(), id])).values()];
    caseDoc.detectiveSupervisorUserId = detectiveSupervisorId;
    caseDoc.investigatorUserIds = [...new Map(investigatorIds.map(id => [id.toString(), id])).values()];
    await caseDoc.save();

    return res.status(200).json({ message: "Assigned officers updated successfully", data: caseDoc });
  } catch (err) {
    console.error("Error updating case officers:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET case summary by case ID
exports.getCaseSummary = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }
    const caseDoc = await Case.findById(id).lean();
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });
    return res.status(200).json({ caseSummary: caseDoc.caseSummary ?? "" });
  } catch (err) {
    console.error("Error fetching case summary:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/cases/:id/case-summary
exports.updateCaseSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { caseSummary } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }
    const updated = await Case.findByIdAndUpdate(id, { caseSummary }, { new: true });
    if (!updated) return res.status(404).json({ message: "Case not found" });
    return res.status(200).json({ message: "Case summary updated", caseSummary: updated.caseSummary });
  } catch (err) {
    console.error("Error updating case summary:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET executive case summary by case ID
exports.getExecutiveCaseSummary = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }
    const caseDoc = await Case.findById(id).lean();
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });
    return res.status(200).json({ executiveCaseSummary: caseDoc.executiveCaseSummary ?? "" });
  } catch (err) {
    console.error("Error fetching executive summary:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/cases/:id/executive-summary
exports.updateExecutiveCaseSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { executiveCaseSummary } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }
    const updated = await Case.findByIdAndUpdate(
      id,
      { executiveCaseSummary: executiveCaseSummary ?? "" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Case not found" });
    return res.status(200).json({ message: "Executive summary updated", executiveCaseSummary: updated.executiveCaseSummary });
  } catch (err) {
    console.error("Error updating executive case summary:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/cases/:id/character
exports.updateCharacterOfCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { characterOfCase } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }
    if (characterOfCase === undefined) {
      return res.status(400).json({ message: "characterOfCase is required" });
    }

    const updated = await Case.findByIdAndUpdate(id, { characterOfCase }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Case not found" });
    }

    return res.status(200).json({ message: "Character of case updated", data: updated });
  } catch (err) {
    console.error("Error updating character of case:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/cases/:id/timeline-flags
exports.getTimelineFlags = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }
    const caseDoc = await Case.findById(id).select("timelineFlags");
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });
    return res.json({ timelineFlags: caseDoc.timelineFlags || [] });
  } catch (err) {
    console.error("Error fetching timeline flags:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/cases/:id/timeline-flags
exports.addTimelineFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { flag } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }
    if (!flag || !flag.trim()) return res.status(400).json({ message: "flag is required" });

    const caseDoc = await Case.findByIdAndUpdate(
      id,
      { $addToSet: { timelineFlags: flag.trim() } },
      { new: true }
    ).select("timelineFlags");

    if (!caseDoc) return res.status(404).json({ message: "Case not found" });
    return res.json({ timelineFlags: caseDoc.timelineFlags });
  } catch (err) {
    console.error("Error adding timeline flag:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
