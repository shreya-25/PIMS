const Case = require("../models/case");
const Lead = require("../models/lead");
const LeadReturn = require("../models/leadreturn");
const User = require("../models/userModel");
const mongoose = require("mongoose");

/**
 * If value is a valid ObjectId, look up the Case and return its caseNo string.
 * Otherwise treat value as already a caseNo and return it as-is.
 */
async function resolveCaseNo(value) {
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) {
    const caseDoc = await Case.findById(value).select("caseNo").lean();
    return caseDoc ? caseDoc.caseNo : null;
  }
  return value;
}

/**
 * Resolve ObjectId refs from string identifiers.
 * Returns { caseId, leadId, leadReturnObjectId, enteredByUserId, assignedByUserId, assignedToUserIds }
 * Any field that can't be resolved is set to null (won't block saves if schema allows it).
 */
async function resolveLeadReturnRefs({ caseNo, caseName, leadNo, leadReturnId, enteredBy, assignedByUsername, assignedToUsernames }) {
    const results = {
        caseId: null,
        leadId: null,
        leadReturnObjectId: null,
        enteredByUserId: null,
        assignedByUserId: null,
        assignedToUserIds: [],
    };

    try {
        // Resolve in parallel where possible
        const notDeleted = { isDeleted: { $ne: true } };
        const [caseDoc, leadDoc, leadReturnDoc, enteredByUser] = await Promise.all([
            caseNo ? Case.findOne({ caseNo, ...notDeleted }).select("_id").lean() : null,
            (caseNo && leadNo != null) ? Lead.findOne({ caseNo, leadNo: Number(leadNo), ...notDeleted }).select("_id").lean() : null,
            (caseNo && leadNo != null) ? LeadReturn.findOne({ caseNo, leadNo: Number(leadNo), ...notDeleted }).select("_id").lean() : null,
            enteredBy ? User.findOne({ username: enteredBy.toLowerCase() }).select("_id").lean() : null,
        ]);

        if (caseDoc) results.caseId = caseDoc._id;
        if (leadDoc) results.leadId = leadDoc._id;
        if (leadReturnDoc) results.leadReturnObjectId = leadReturnDoc._id;
        if (enteredByUser) results.enteredByUserId = enteredByUser._id;

        // Resolve assignedBy user
        if (assignedByUsername) {
            const assignedByUser = await User.findOne({ username: assignedByUsername.toLowerCase() }).select("_id").lean();
            if (assignedByUser) results.assignedByUserId = assignedByUser._id;
        }

        // Resolve assignedTo users
        if (assignedToUsernames && assignedToUsernames.length > 0) {
            const users = await User.find({ username: { $in: assignedToUsernames.map(u => u.toLowerCase()) } }).select("_id").lean();
            results.assignedToUserIds = users.map(u => u._id);
        }
    } catch (err) {
        console.error("Error resolving refs:", err.message);
    }

    return results;
}

module.exports = { resolveLeadReturnRefs, resolveCaseNo };
