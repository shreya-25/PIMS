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
    } = req.body;

    // --- validate required fields ---
    if (!caseNo || !caseName) {
      return res.status(400).json({ message: "caseNo and caseName are required" });
    }
    if (!Array.isArray(managers) || managers.length === 0) {
      return res.status(400).json({ message: "At least one Case Manager is required." });
    }
    if (!detectiveSupervisor) {
      return res.status(400).json({ message: "Detective Supervisor is required" });
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

    const dsUsername = typeof detectiveSupervisor === "string"
      ? detectiveSupervisor
      : detectiveSupervisor.name || detectiveSupervisor.username;
    const dsUser = await findUserByUsername(dsUsername);
    if (!dsUser) {
      return res.status(400).json({ message: `Detective Supervisor '${dsUsername}' not found.` });
    }

    const investigatorUsernames = selectedOfficers.map(o => o.username || o.name || o);
    const investigatorUsers = await User.find({
      username: { $in: investigatorUsernames.map(u => u.toLowerCase().trim()) },
    });

    const newCase = new Case({
      caseNo,
      caseName,
      status: "ONGOING",
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

    const cases = await Case.find({
      isDeleted: { $ne: true },
      status: "ONGOING",
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

    // Format response to include the officer's role per case
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
      { status: "COMPLETED" },
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
    res.status(200).json({ summary: "" });
  } catch (error) {
    console.error("Error fetching case summary:", error);
    res.status(500).json({ message: "Error fetching case summary", error: error.message });
  }
};

exports.updateExecutiveCaseSummary = async (req, res) => {
  return res.status(200).json({ message: "Executive case summary field removed from schema" });
};

exports.updateCaseSummary = async (req, res) => {
  return res.status(200).json({ message: "Case summary field removed from schema" });
};

exports.getExecutiveCaseSummary = async (req, res) => {
  try {
    const { caseNo } = req.params;
    if (!caseNo) return res.status(400).json({ message: "caseNo is required" });
    const caseDoc = await Case.findOne({ caseNo }).lean();
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });
    return res.status(200).json({ caseNo: caseDoc.caseNo, executiveCaseSummary: "" });
  } catch (err) {
    console.error("Error fetching executive summary:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getCaseSummary = async (req, res) => {
  try {
    const { caseNo } = req.params;
    if (!caseNo) return res.status(400).json({ message: "caseNo is required" });
    const caseDoc = await Case.findOne({ caseNo }).lean();
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });
    return res.status(200).json({ caseNo: caseDoc.caseNo, caseSummary: "" });
  } catch (err) {
    console.error("Error fetching case summary:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
