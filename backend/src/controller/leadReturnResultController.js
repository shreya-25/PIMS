const LeadReturnResult = require("../models/leadReturnResult");
const LeadReturn = require("../models/leadreturn");
const LRPerson = require("../models/LRPerson");
const Lead = require("../models/lead");
const { createAuditLog, sanitizeForAudit } = require("../services/auditService");
const { createSnapshot } = require("../utils/leadReturnVersioning");
const { resolveLeadReturnRefs } = require("../utils/resolveRefs");

// Helpers to convert between A...Z strings and numbers
function alphabetToNumber(str) {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * 26 + (str.charCodeAt(i) - 64);
  }
  return result;
}
function numberToAlphabet(num) {
  let s = "";
  while (num > 0) {
    const rem = (num - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

// Create a new Lead Return Result entry
const createLeadReturnResult = async (req, res) => {
  try {
    const {
      leadNo,
      description,
      enteredDate,
      enteredBy,
      caseName,
      caseNo,
      leadReturnResult,
      accessLevel,
    } = req.body;

    // Resolve ObjectId refs
    const refs = await resolveLeadReturnRefs({
      caseNo,
      caseName,
      leadNo,
      enteredBy,
    });

    // Fetch existing returns for this exact lead+case
    const existing = await LeadReturnResult.find({
      leadNo,
      description,
      caseNo,
      caseName,
    }).select("leadReturnId");

    // Compute highest numeric ID so far
    const maxNum = existing.reduce((max, doc) => {
      const val = doc.leadReturnId ? alphabetToNumber(doc.leadReturnId) : 0;
      return Math.max(max, val);
    }, 0);

    const newId = numberToAlphabet(maxNum + 1);

    const newLeadReturnResult = new LeadReturnResult({
      leadNo,
      description,
      enteredDate,
      enteredBy,
      caseName,
      caseNo,
      leadReturnId: newId,
      leadReturnResult,
      accessLevel,
      // ObjectId refs
      caseId: refs.caseId,
      leadId: refs.leadId,
      leadReturnObjectId: refs.leadReturnObjectId,
      enteredByUserId: refs.enteredByUserId,
    });

    await newLeadReturnResult.save();

    // Log the creation in audit log
    await createAuditLog({
      caseNo,
      caseName,
      leadNo,
      leadName: description,
      entityType: "LeadReturnResult",
      entityId: newId,
      action: "CREATE",
      performedBy: {
        username: enteredBy,
        role: req.user?.role || "Unknown"
      },
      oldValue: null,
      newValue: sanitizeForAudit(newLeadReturnResult.toObject()),
      metadata: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent')
      },
      accessLevel: accessLevel || "Everyone"
    });

    // Create a snapshot after creating the narrative
    try {
      await createSnapshot(
        leadNo,
        enteredBy || "Unknown",
        "Manual Snapshot",
        caseNo,
        caseName
      );
      console.log(`Snapshot created after creating narrative ${newId} for lead ${leadNo} in case ${caseNo}`);
    } catch (snapshotErr) {
      console.error("Error creating snapshot after narrative creation:", snapshotErr.message);
    }

    return res.status(201).json(newLeadReturnResult);
  } catch (err) {
    console.error("Error creating lead return result:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Get all lead return results assigned to or assigned by an officer
const getLeadReturnResultsByOfficer = async (req, res) => {
    try {
        const officerName = req.user.username;

        // Query through LeadReturn to find leads assigned to/by this officer,
        // then get the results for those leads
        const leadReturns = await LeadReturn.find({
            $or: [
                { "assignedTo.assignees": officerName },
                { "assignedBy.assignee": officerName }
            ]
        }).select("leadNo caseNo").lean();

        if (leadReturns.length === 0) {
            return res.status(200).json([]);
        }

        // Build query conditions for each lead return
        const conditions = leadReturns.map(lr => ({
            leadNo: lr.leadNo,
            caseNo: lr.caseNo
        }));

        const leadReturnResults = await LeadReturnResult.find({
            $or: conditions,
            isDeleted: { $ne: true }
        }).lean();

        res.status(200).json(leadReturnResults);
    } catch (err) {
        console.error("Error fetching lead return results by officer:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLeadReturnResultByLeadNoandLeadName = async (req, res) => {
    try {
        const { leadNo, leadName, caseId } = req.params;

        const query = {
            leadNo: Number(leadNo),
            description: leadName,
            caseId,
            isDeleted: { $ne: true }
        };

        const leadReturns = await LeadReturnResult.find(query).lean();
        res.status(200).json(leadReturns);
    } catch (err) {
        console.error("Error fetching lead return results by case and lead:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// Update a specific lead return result entry
const updateLeadReturnResult = async (req, res) => {
    try {
        const { leadNo, caseNo, leadReturnId } = req.params;
        const updateData = req.body;

        // Validate accessLevel if it's being updated
        if (updateData.accessLevel) {
            const validAccessLevels = ["Everyone", "Case Manager and Assignees", "Case Manager Only"];
            if (!validAccessLevels.includes(updateData.accessLevel)) {
                return res.status(400).json({
                    message: `Invalid accessLevel. Must be one of: ${validAccessLevels.join(', ')}`
                });
            }
        }

        // First, get the old value before updating
        const oldResult = await LeadReturnResult.findOne({
            leadNo: Number(leadNo),
            caseNo,
            leadReturnId
        });

        if (!oldResult) {
            return res.status(404).json({ message: "Lead return result not found." });
        }

        const updatedResult = await LeadReturnResult.findOneAndUpdate(
            { leadNo: Number(leadNo), caseNo, leadReturnId },
            {
                ...updateData,
                lastModifiedDate: new Date(),
                lastModifiedBy: req.user?.username || "Unknown"
            },
            { new: true, runValidators: true }
        );

        // Log the update in audit log
        await createAuditLog({
            caseNo,
            caseName: updatedResult.caseName,
            leadNo: Number(leadNo),
            leadName: updatedResult.description,
            entityType: "LeadReturnResult",
            entityId: leadReturnId,
            action: "UPDATE",
            performedBy: {
                username: req.user?.username || "Unknown",
                role: req.user?.role || "Unknown"
            },
            oldValue: sanitizeForAudit(oldResult.toObject()),
            newValue: sanitizeForAudit(updatedResult.toObject()),
            metadata: {
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('user-agent'),
                changedFields: Object.keys(updateData)
            },
            accessLevel: updatedResult.accessLevel || "Everyone"
        });

        // Create a snapshot after updating the narrative
        try {
            const snapshot = await createSnapshot(
                Number(leadNo),
                req.user?.username || "Unknown",
                "Manual Snapshot",
                caseNo,
                oldResult.caseName
            );
            console.log(`Snapshot ${snapshot.versionId} created after updating narrative ${leadReturnId} for lead ${leadNo} in case ${caseNo}`);
        } catch (snapshotErr) {
            console.error("Error creating snapshot after narrative update:", snapshotErr.message);
        }

        res.status(200).json(updatedResult);
    } catch (err) {
        console.error("Error updating lead return result:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// Delete a specific lead return result entry (SOFT DELETE)
const deleteLeadReturnResult = async (req, res) => {
    try {
        const { leadNo, caseNo, leadReturnId } = req.params;

        const existingResult = await LeadReturnResult.findOne({
            leadNo: Number(leadNo),
            caseNo,
            leadReturnId
        });

        if (!existingResult) {
            return res.status(404).json({ message: "Lead return result not found." });
        }

        // Perform soft delete
        const deletedResult = await LeadReturnResult.findOneAndUpdate(
            { leadNo: Number(leadNo), caseNo, leadReturnId },
            {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: req.user?.username || "Unknown"
            },
            { new: true }
        );

        // Log the deletion in audit log
        await createAuditLog({
            caseNo,
            caseName: existingResult.caseName,
            leadNo: Number(leadNo),
            leadName: existingResult.description,
            entityType: "LeadReturnResult",
            entityId: leadReturnId,
            action: "DELETE",
            performedBy: {
                username: req.user?.username || "Unknown",
                role: req.user?.role || "Unknown"
            },
            oldValue: sanitizeForAudit(existingResult.toObject()),
            newValue: null,
            metadata: {
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('user-agent'),
                notes: "Soft delete - record marked as deleted"
            },
            accessLevel: existingResult.accessLevel || "Everyone"
        });

        // Create a snapshot after deleting the narrative
        try {
            await createSnapshot(
                Number(leadNo),
                req.user?.username || "Unknown",
                "Manual Snapshot",
                caseNo,
                existingResult.caseName
            );
            console.log(`Snapshot created after deleting narrative ${leadReturnId} for lead ${leadNo} in case ${caseNo}`);
        } catch (snapshotErr) {
            console.error("Error creating snapshot after narrative deletion:", snapshotErr.message);
        }

        res.status(200).json({ message: "Lead return result deleted successfully.", data: deletedResult });
    } catch (err) {
        console.error("Error deleting lead return result:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

// GET /api/leadReturnResult?keyword=...&officerName=...
const searchCasesAndLeadsByKeyword = async (req, res) => {
  try {
    const { keyword, officerName } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const regex = new RegExp(keyword, "i");

    // Base text search condition
    const textMatch = {
      $or: [
        { description: regex },
        { leadReturnResult: regex },
        { caseName: regex },
        { caseNo: regex },
      ],
    };

    let leadReturnQuery = textMatch;
    let leadReturnResultQuery = textMatch;

    if (officerName) {
      const officerCondition = {
        $or: [
          { "assignedTo.assignees": officerName },
          { "assignedBy.assignee": officerName },
        ],
      };

      leadReturnQuery = { $and: [textMatch, officerCondition] };
      leadReturnResultQuery = textMatch; // LeadReturnResult no longer has assignedTo/By
    }

    // LeadReturn documents
    const leadReturns = await LeadReturn.find(leadReturnQuery).lean();

    // LeadReturnResult documents
    const leadReturnResults = await LeadReturnResult.find(leadReturnResultQuery).lean();

    // Search LRPerson by firstName or lastName
    const personTextMatch = {
      $or: [
        { firstName: regex },
        { lastName: regex },
        { alias: regex },
      ],
    };
    const lrPersons = await LRPerson.find(personTextMatch).lean();

    // Build a FLAT list of unified lead entries
    const flatResults = [];

    for (const lr of leadReturns) {
      flatResults.push({
        caseNo: lr.caseNo,
        caseName: lr.caseName,
        leadNo: lr.leadNo,
        description: lr.description,
        source: "LeadReturn",
        fullLeadReturn: lr,
      });
    }

    for (const lrr of leadReturnResults) {
      flatResults.push({
        caseNo: lrr.caseNo,
        caseName: lrr.caseName,
        leadNo: lrr.leadNo,
        description: lrr.description,
        source: "LeadReturnResult",
        fullLeadReturn: lrr,
      });
    }

    for (const person of lrPersons) {
      flatResults.push({
        caseNo: person.caseNo,
        caseName: person.caseName,
        leadNo: person.leadNo,
        description: person.description,
        source: "LRPerson",
        matchedPerson: `${person.firstName || ""} ${person.lastName || ""}`.trim(),
        fullLeadReturn: person,
      });
    }

    // De-duplicate by caseNo + leadNo + description
    const dedupMap = new Map();
    for (const item of flatResults) {
      const key = `${item.caseNo || ""}::${item.leadNo || ""}::${item.description || ""}`;
      if (!dedupMap.has(key)) {
        dedupMap.set(key, item);
      }
    }

    const deduped = Array.from(dedupMap.values());

    // Bulk-fetch Lead documents to get assignedTo for every result
    const leadConditions = deduped.map((item) => ({
      caseNo: item.caseNo,
      leadNo: Number(item.leadNo),
      isDeleted: { $ne: true },
    }));
    const leads = leadConditions.length
      ? await Lead.find({ $or: leadConditions }).select("caseNo leadNo assignedTo").lean()
      : [];
    const leadMap = new Map();
    leads.forEach((l) => leadMap.set(`${l.caseNo}::${l.leadNo}`, l));

    const enriched = deduped.map((item) => {
      const lead = leadMap.get(`${item.caseNo}::${item.leadNo}`);
      const assignedOfficers = lead
        ? (lead.assignedTo || []).map((a) => a.username).filter(Boolean)
        : [];
      return { ...item, assignedTo: lead?.assignedTo || [], assignedOfficers };
    });

    return res.status(200).json(enriched);
  } catch (err) {
    console.error("Error searching cases and leads by keyword:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { createLeadReturnResult, getLeadReturnResultsByOfficer, getLeadReturnResultByLeadNoandLeadName, updateLeadReturnResult,
    deleteLeadReturnResult, searchCasesAndLeadsByKeyword };
