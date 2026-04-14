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
const CompleteleadReturn = require("../models/CompleteleadReturn");

// Helper: look up a single user by username, return the doc or null
async function findUserByUsername(username) {
  if (!username) return null;
  const name = typeof username === "string" ? username : username.username || username.name;
  return User.findOne({ username: name.trim() });
}

/**
 * Merges the legacy detectiveSupervisorUserId (single) with the new
 * detectiveSupervisorUserIds (array) so old documents surface correctly.
 * Returns a deduplicated array of populated user objects (or ObjectIds).
 */
function mergeDetectiveSupervisors(doc) {
  const ids = new Map();
  // New array field first
  for (const u of (doc.detectiveSupervisorUserIds || [])) {
    if (u) ids.set(u._id ? u._id.toString() : u.toString(), u);
  }
  // Legacy single field — add only if not already present
  const legacy = doc.detectiveSupervisorUserId;
  if (legacy) {
    const key = legacy._id ? legacy._id.toString() : legacy.toString();
    if (!ids.has(key)) ids.set(key, legacy);
  }
  return [...ids.values()];
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
      detectiveSupervisors,
      characterOfCase = "",
      caseSummary = "",
    } = req.body;

    // --- validate required fields ---
    if (!caseNo || !caseName) {
      return res.status(400).json({ message: "caseNo and caseName are required" });
    }

    // --- validate caseNo format (letters, digits, and hyphens only) ---
    if (!/^[A-Za-z0-9-]+$/.test(caseNo)) {
      return res.status(400).json({ message: "Case number can only contain letters, digits, and hyphens (-)." });
    }
    if (!Array.isArray(managers) || managers.length === 0) {
      return res.status(400).json({ message: "At least one Case Manager is required." });
    }

    // Accept either detectiveSupervisors (array) or detectiveSupervisor (single, backward compat)
    const dsInputs = Array.isArray(detectiveSupervisors) && detectiveSupervisors.length > 0
      ? detectiveSupervisors
      : detectiveSupervisor
        ? [detectiveSupervisor]
        : [];
    if (dsInputs.length === 0) {
      return res.status(400).json({ message: "At least one Detective Supervisor is required." });
    }

    // --- ensure unique caseNo ---
    const existingCase = await Case.findOne({ caseNo });
    if (existingCase) {
      return res.status(400).json({ message: "Case number already exists. Please use a unique caseNo." });
    }

    const duplicateName = await Case.findOne({ caseName: caseName.trim() });
    if (duplicateName) {
      return res.status(409).json({ message: "Case name already exists. Please choose a different name." });
    }

    // --- resolve usernames to ObjectIds ---
    const managerUsers = [];
    for (const m of managers) {
      const uname = m.username || m.name || m;
      const u = await findUserByUsername(uname);
      if (!u) return res.status(400).json({ message: `Case Manager '${uname}' not found.` });
      managerUsers.push(u);
    }

    const dsUsers = [];
    for (const ds of dsInputs) {
      const dsUsername = typeof ds === "string" ? ds : ds.name || ds.username;
      const dsUser = await findUserByUsername(dsUsername);
      if (!dsUser) return res.status(400).json({ message: `Detective Supervisor '${dsUsername}' not found.` });
      dsUsers.push(dsUser);
    }

    const investigatorUsernames = selectedOfficers.map(o => o.username || o.name || o).map(u => u.trim());
    const investigatorUsers = await User.find({
      username: { $in: investigatorUsernames },
    });

    const newCase = new Case({
      caseNo,
      caseName,
      status: "ONGOING",
      characterOfCase,
      caseSummary,
      caseManagerUserIds: managerUsers.map(u => u._id),
      detectiveSupervisorUserIds: dsUsers.map(u => u._id),
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
// exports.getAllCases = async (req, res) => {
//   try {
//     const cases = await Case.find({ isDeleted: { $ne: true }, status: "ONGOING" })
//       .populate("caseManagerUserIds", "username firstName lastName displayName title")
//       .populate("detectiveSupervisorUserId", "username firstName lastName displayName title")
//       .populate("detectiveSupervisorUserIds", "username firstName lastName displayName title")
//       .populate("investigatorUserIds", "username firstName lastName displayName title")
//       .populate("createdByUserId", "username firstName lastName displayName")
//       .lean();

//     res.status(200).json(cases || []);
//   } catch (err) {
//     console.error("Error fetching cases:", err);
//     res.status(500).json({ message: "Error fetching cases", error: err.message });
//   }
// };
exports.getAllCases = async (req, res) => {
  try {
    const cases = await Case.find({ isDeleted: { $ne: true } })
      .populate("caseManagerUserIds", "username firstName lastName displayName title")
      .populate("detectiveSupervisorUserId", "username firstName lastName displayName title")
      .populate("detectiveSupervisorUserIds", "username firstName lastName displayName title")
      .populate("investigatorUserIds", "username firstName lastName displayName title")
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
      .populate("caseManagerUserIds", "username firstName lastName displayName title")
      .populate("detectiveSupervisorUserId", "username firstName lastName displayName title")
      .populate("detectiveSupervisorUserIds", "username firstName lastName displayName title")
      .populate("investigatorUserIds", "username firstName lastName displayName title")
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

exports.getCaseByNo = async (req, res) => {
  try {
    const { caseNo } = req.params;
    if (!caseNo) return res.status(400).json({ message: "caseNo is required" });

    const caseData = await Case.findOne({ caseNo })
      .populate("caseManagerUserIds", "username firstName lastName displayName title")
      .populate("detectiveSupervisorUserId", "username firstName lastName displayName title")
      .populate("detectiveSupervisorUserIds", "username firstName lastName displayName title")
      .populate("investigatorUserIds", "username firstName lastName displayName title")
      .lean();

    if (!caseData) return res.status(404).json({ message: "Case not found" });
    res.status(200).json(caseData);
  } catch (err) {
    console.error("Error fetching case by caseNo:", err);
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
        { detectiveSupervisorUserIds: user._id },
        { investigatorUserIds: user._id },
        { readOnlyUserIds: user._id },
      ],
    })
      .populate("caseManagerUserIds", "username firstName lastName displayName title role")
      .populate("detectiveSupervisorUserId", "username firstName lastName displayName title role")
      .populate("detectiveSupervisorUserIds", "username firstName lastName displayName title role")
      .populate("investigatorUserIds", "username firstName lastName displayName title role")
      .populate("readOnlyUserIds", "username firstName lastName displayName role")
      .lean();

    if (!cases || cases.length === 0) {
      return res.status(404).json({ message: "No cases assigned to this officer" });
    }

    // Format response to include the officer's role per case
    const formattedCases = cases.map((c) => {
      let role = "Unknown";
      if ((c.caseManagerUserIds || []).some(cm => cm._id.equals(user._id))) {
        role = "Case Manager";
      } else if (mergeDetectiveSupervisors(c).some(ds => (ds._id || ds).equals(user._id))) {
        role = "Detective Supervisor";
      } else if (c.investigatorUserIds.some(inv => inv._id.equals(user._id))) {
        role = "Investigator";
      } else if ((c.readOnlyUserIds || []).some(ro => ro._id.equals(user._id))) {
        role = "Read Only";
      }

      const getDisplayName = (u) => {
        if (!u) return "";
        const full = u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim();
        const uname = u.username || "";
        if (full && uname) return `${full} (${uname})`;
        return full || uname;
      };

      const caseManagerNames = (c.caseManagerUserIds || []).map(getDisplayName).filter(Boolean);

      return {
        _id: c._id,
        caseNo: c.caseNo,
        caseName: c.caseName,
        caseStatus: c.status,
        archivedAt: c.archivedAt || null,
        updatedAt: c.updatedAt || null,
        role,
        caseManagers: caseManagerNames.join(", ") || "—",
        caseManagerNames,
      };
    });

    res.status(200).json(formattedCases);
  } catch (err) {
    console.error("Error fetching cases for officer:", err);
    res.status(500).json({ message: "Error fetching cases", error: err.message });
  }
};

// Update case details — cascades caseNo/caseName changes to all related collections
exports.updateCase = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid case ID format" });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Update data cannot be empty" });
    }

    const existingCase = await Case.findById(req.params.id);
    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    const { caseNo: newCaseNo, caseName: newCaseName } = req.body;
    const oldCaseNo   = existingCase.caseNo;
    const oldCaseName = existingCase.caseName;

    // Validate new caseNo format and uniqueness
    if (newCaseNo && newCaseNo !== oldCaseNo) {
      if (!/^[A-Za-z0-9-]+$/.test(newCaseNo)) {
        return res.status(400).json({ message: "Case number can only contain letters, digits, and hyphens (-)." });
      }
      const conflict = await Case.findOne({ caseNo: newCaseNo, _id: { $ne: req.params.id } });
      if (conflict) {
        return res.status(409).json({ message: "Case number already exists." });
      }
    }

    // Validate new caseName uniqueness
    if (newCaseName && newCaseName.trim() !== oldCaseName) {
      const conflict = await Case.findOne({ caseName: newCaseName.trim(), _id: { $ne: req.params.id } });
      if (conflict) {
        return res.status(409).json({ message: "Case name already exists." });
      }
    }

    const updatedCase = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Cascade caseNo / caseName to all related collections
    const caseNoChanged   = newCaseNo   && newCaseNo !== oldCaseNo;
    const caseNameChanged = newCaseName && newCaseName.trim() !== oldCaseName;

    if (caseNoChanged || caseNameChanged) {
      const filter = { caseNo: oldCaseNo };
      const update = {};
      if (caseNoChanged)   update.caseNo   = newCaseNo;
      if (caseNameChanged) update.caseName = newCaseName.trim();

      const relatedModels = [
        Lead, LeadReturn, LeadReturnResult, CompleteleadReturn,
        LRPerson, LRVehicle, LRTimeline, LREvidence,
        LRPicture, LRAudio, LRVideo, LREnclosure, LRScratchpad,
      ];

      await Promise.all(relatedModels.map((Model) => Model.updateMany(filter, update)));
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

    // Step 1 — Soft delete the case
    await Case.findByIdAndUpdate(caseId, {
      isDeleted: true,
      deletedAt: now,
      deletedByUserId,
    });

    // Match by caseId OR caseNo (for older records missing caseId)
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

    // Step 2 — Soft delete all leads in this case
    await Lead.updateMany(childFilter, {
      ...deleteFields,
      deletedReason: "Parent case deleted",
      leadStatus: "Deleted",
    });

    // Step 3 — Soft delete all lead returns in this case
    await LeadReturn.updateMany(childFilter, deleteFields);

    // Step 4 — Soft delete lead return results in this case
    await LeadReturnResult.updateMany(childFilter, deleteFields);

    // Step 5 — Soft delete all LR* tables linked to this case
    const lrModels = [
      LRPerson, LRVehicle, LRTimeline, LREvidence,
      LRPicture, LRAudio, LRVideo, LREnclosure, LRScratchpad,
    ];
    await Promise.all(
      lrModels.map((Model) => Model.updateMany(childFilter, deleteFields))
    );

    res.status(200).json({ message: "Case and all related records soft-deleted successfully" });
  } catch (err) {
    console.error("Error deleting case:", err);
    res.status(500).json({ message: "Error deleting case", error: err.message });
  }
};

// PUT /api/cases/:caseNo/close
exports.closeCase = async (req, res) => {
  try {
    const { caseNo } = req.params;
    if (!caseNo) {
      return res.status(400).json({ message: "caseNo is required" });
    }

    const updated = await Case.findOneAndUpdate(
      { caseNo },
      { status: "COMPLETED", archivedAt: new Date() },
      { new: true }
    );

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

    const existingCase = await Case.findOne({ caseNo: id });
    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Find the admin user
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

// GET case team by caseNo
exports.getCaseTeam = async (req, res) => {
  try {
    const { caseNo } = req.params;
    if (!caseNo) {
      return res.status(400).json({ message: "caseNo is required" });
    }

    const c = await Case.findOne({ caseNo })
      .populate("caseManagerUserIds", "username firstName lastName displayName title")
      .populate("detectiveSupervisorUserId", "username firstName lastName displayName title")
      .populate("detectiveSupervisorUserIds", "username firstName lastName displayName title")
      .populate("investigatorUserIds", "username firstName lastName displayName title")
      .populate("readOnlyUserIds", "username firstName lastName displayName")
      .lean();

    if (!c) {
      return res.status(404).json({ message: "Case not found" });
    }

    const detectiveSupervisors = mergeDetectiveSupervisors(c).map(u => u.username).filter(Boolean);
    const caseManagers = (c.caseManagerUserIds || []).map(u => u.username);
    const investigators = [...new Set((c.investigatorUserIds || []).map(u => u.username))];
    const readOnly = (c.readOnlyUserIds || []).map(u => u.username);

    return res.json({ detectiveSupervisors, caseManagers, investigators, readOnly });
  } catch (err) {
    console.error("Error in getCaseTeam:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add an officer (investigator) to a case
exports.addOfficerToCase = async (req, res) => {
  try {
    const { caseNo, caseName } = req.params;
    const { officerName } = req.body;

    const caseDoc = await Case.findOne({ caseNo, caseName });
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });

    const user = await findUserByUsername(officerName);
    if (!user) return res.status(400).json({ message: `Officer '${officerName}' not found.` });

    // Don't add duplicate
    if (!caseDoc.investigatorUserIds.some(id => id.equals(user._id))) {
      caseDoc.investigatorUserIds.push(user._id);
      await caseDoc.save();
    }

    return res.status(200).json({ message: "Officer added (or already present)", data: caseDoc });
  } catch (err) {
    console.error("Error adding officer:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update case officers (replace the full team by role)
exports.updateCaseOfficers = async (req, res) => {
  try {
    const { caseNo } = req.params;
    const { officers } = req.body;

    if (!caseNo || !Array.isArray(officers)) {
      return res.status(400).json({ message: "caseNo and an array of officers are required" });
    }

    const caseDoc = await Case.findOne({ caseNo });
    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Resolve each officer to a userId, respecting their role
    const caseManagerIds = [];
    const detectiveSupervisorIds = [];
    const investigatorIds = [];
    const readOnlyIds = [];

    for (const off of officers) {
      const name = off.name || off.username || off;
      if (typeof name !== "string") continue;
      const user = await findUserByUsername(name);
      if (!user) continue;

      if (off.role === "Case Manager") {
        caseManagerIds.push(user._id);
      } else if (off.role === "Detective Supervisor") {
        detectiveSupervisorIds.push(user._id);
      } else if (off.role === "Investigator") {
        investigatorIds.push(user._id);
      } else if (off.role === "Read Only") {
        readOnlyIds.push(user._id);
      }
    }

    caseDoc.caseManagerUserIds = [...new Map(caseManagerIds.map(id => [id.toString(), id])).values()];
    if (detectiveSupervisorIds.length > 0) {
      caseDoc.detectiveSupervisorUserIds = [...new Map(detectiveSupervisorIds.map(id => [id.toString(), id])).values()];
      // Migrate: clear legacy single field once the array is populated
      caseDoc.detectiveSupervisorUserId = null;
    }
    caseDoc.investigatorUserIds = [...new Map(investigatorIds.map(id => [id.toString(), id])).values()];
    caseDoc.readOnlyUserIds = [...new Map(readOnlyIds.map(id => [id.toString(), id])).values()];
    await caseDoc.save();

    return res.status(200).json({ message: "Assigned officers updated successfully", data: caseDoc });
  } catch (err) {
    console.error("Error updating case officers:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update officer status - no longer applicable with new schema
// Keeping as a no-op for backward compatibility
exports.updateOfficerStatus = async (req, res) => {
  return res.status(200).json({ message: "Officer status concept removed in new schema" });
};

// Summary endpoints - these fields were removed from the Case schema.
// Return empty strings for backward compatibility.
exports.getCaseSummaryByCaseNo = async (req, res) => {
  try {
    const { caseNo } = req.params;
    if (!caseNo) return res.status(400).json({ message: "Case number is required" });
    const caseData = await Case.findOne({ caseNo }).lean();
    if (!caseData) return res.status(404).json({ message: "Case not found" });
    res.status(200).json({ summary: caseData.caseSummary ?? "" });
  } catch (error) {
    console.error("Error fetching case summary:", error);
    res.status(500).json({ message: "Error fetching case summary", error: error.message });
  }
};

exports.updateExecutiveCaseSummary = async (req, res) => {
  try {
    const { caseId, executiveCaseSummary } = req.body;
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId))
      return res.status(400).json({ message: "caseId is required" });
    const updated = await Case.findByIdAndUpdate(
      caseId,
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

exports.updateCaseSummary = async (req, res) => {
  try {
    const { caseId, caseSummary } = req.body;
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId))
      return res.status(400).json({ message: "caseId is required" });
    const updated = await Case.findByIdAndUpdate(
      caseId,
      { caseSummary },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Case not found" });
    return res.status(200).json({ message: "Case summary updated", caseSummary: updated.caseSummary });
  } catch (err) {
    console.error("Error updating case summary:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getExecutiveCaseSummary = async (req, res) => {
  try {
    const { caseId } = req.params;
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId))
      return res.status(400).json({ message: "caseId is required" });
    const caseDoc = await Case.findById(caseId).lean();
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });
    return res.status(200).json({ executiveCaseSummary: caseDoc.executiveCaseSummary ?? "" });
  } catch (err) {
    console.error("Error fetching executive summary:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getCaseSummary = async (req, res) => {
  try {
    const { caseId } = req.params;
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId))
      return res.status(400).json({ message: "caseId is required" });
    const caseDoc = await Case.findById(caseId).lean();
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });
    return res.status(200).json({ caseSummary: caseDoc.caseSummary ?? "" });
  } catch (err) {
    console.error("Error fetching case summary:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update characterOfCase for a case
exports.updateCharacterOfCase = async (req, res) => {
  try {
    const { caseNo } = req.params;
    const { characterOfCase } = req.body;

    if (characterOfCase === undefined) {
      return res.status(400).json({ message: "characterOfCase is required" });
    }

    const updated = await Case.findOneAndUpdate(
      { caseNo },
      { characterOfCase },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Case not found" });
    }

    return res.status(200).json({ message: "Character of case updated", data: updated });
  } catch (err) {
    console.error("Error updating character of case:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.getTimelineFlags = async (req, res) => {
  try {
    const { caseNo } = req.params;
    const caseDoc = await Case.findOne({ caseNo }).select('timelineFlags');
    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });
    return res.json({ timelineFlags: caseDoc.timelineFlags || [] });
  } catch (err) {
    console.error('Error fetching timeline flags:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.addTimelineFlag = async (req, res) => {
  try {
    const { caseNo } = req.params;
    const { flag } = req.body;
    if (!flag || !flag.trim()) return res.status(400).json({ message: 'flag is required' });

    const caseDoc = await Case.findOneAndUpdate(
      { caseNo },
      { $addToSet: { timelineFlags: flag.trim() } },
      { new: true }
    ).select('timelineFlags');

    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });
    return res.json({ timelineFlags: caseDoc.timelineFlags });
  } catch (err) {
    console.error('Error adding timeline flag:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
