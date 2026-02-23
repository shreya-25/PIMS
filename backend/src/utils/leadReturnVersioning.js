const CompleteleadReturn = require("../models/CompleteleadReturn");
const LeadReturn = require("../models/leadreturn");
const LeadReturnResult = require("../models/leadReturnResult");
const Lead = require("../models/lead");
const LRAudio = require("../models/LRAudio");
const LRVideo = require("../models/LRVideo");
const LRPicture = require("../models/LRPicture");
const LREnclosure = require("../models/LREnclosure");
const LREvidence = require("../models/LREvidence");
const LRPerson = require("../models/LRPerson");
const LRVehicle = require("../models/LRVehicle");
const LRScratchpad = require("../models/LRScratchpad");
const LRTimeline = require("../models/LRTimeline");
const { logSnapshotCreation } = require("./auditLogger");
const { resolveLeadReturnRefs } = require("./resolveRefs");

/**
 * Create a complete snapshot of a lead return and all its related data.
 * If no LeadReturn header exists yet, auto-creates one from the Lead record.
 *
 * Instead of embedding full copies of related records, the snapshot stores
 * only their ObjectId arrays. Use `.populate()` or `getVersionPopulated()`
 * to hydrate when needed.
 */
async function createSnapshot(leadNo, versionCreatedBy, versionReason = "Manual Snapshot", caseNo = null, caseName = null) {
    try {
        // Get the main lead return record
        const query = { leadNo: Number(leadNo) };
        if (caseNo) query.caseNo = caseNo;
        if (caseName) query.caseName = caseName;

        let leadReturn = await LeadReturn.findOne(query);
        if (!leadReturn) {
            // Auto-create LeadReturn header from Lead data
            const leadQuery = { leadNo: Number(leadNo) };
            if (caseNo) leadQuery.caseNo = caseNo;
            const lead = await Lead.findOne(leadQuery).lean();
            if (!lead) return null; // No Lead record at all – nothing to snapshot

            const refs = await resolveLeadReturnRefs({
                caseNo: caseNo || lead.caseNo,
                caseName: caseName || lead.caseName,
                leadNo,
                assignedByUsername: lead.assignedBy,
                assignedToUsernames: (lead.assignedTo || []).map(a => a.username).filter(Boolean),
            });

            leadReturn = new LeadReturn({
                leadNo: Number(leadNo),
                returnNo: 1,
                description: lead.description || "",
                caseName: caseName || lead.caseName,
                caseNo: caseNo || lead.caseNo,
                assignedTo: {
                    assignees: (lead.assignedTo || []).map(a => a.username).filter(Boolean),
                    lRStatus: "Assigned"
                },
                assignedBy: {
                    assignee: lead.assignedBy || versionCreatedBy || "Unknown",
                    lRStatus: "Assigned"
                },
                accessLevel: "Everyone",
                caseId: refs.caseId,
                leadId: refs.leadId,
                assignedByUserId: refs.assignedByUserId,
                assignedToUserIds: refs.assignedToUserIds,
            });
            await leadReturn.save();
            console.log(`Auto-created LeadReturn for lead ${leadNo} in case ${caseNo}`);
        }

        // Build query filter for related records
        const relatedRecordQuery = { leadNo };
        if (caseNo) relatedRecordQuery.caseNo = caseNo;
        if (caseName) relatedRecordQuery.caseName = caseName;

        // Get ObjectIds of all related records (only _id, lightweight)
        const [
            leadReturnResultIds,
            audioIds,
            videoIds,
            pictureIds,
            enclosureIds,
            evidenceIds,
            personIds,
            vehicleIds,
            scratchpadIds,
            timelineIds
        ] = await Promise.all([
            LeadReturnResult.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).select("_id").lean(),
            LRAudio.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).select("_id").lean(),
            LRVideo.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).select("_id").lean(),
            LRPicture.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).select("_id").lean(),
            LREnclosure.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).select("_id").lean(),
            LREvidence.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).select("_id").lean(),
            LRPerson.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).select("_id").lean(),
            LRVehicle.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).select("_id").lean(),
            LRScratchpad.find({ ...relatedRecordQuery, type: "Lead", isDeleted: { $ne: true } }).select("_id").lean(),
            LRTimeline.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).select("_id").lean()
        ]);

        // Get the current highest version for this lead + case combination
        const lastVersion = await CompleteleadReturn.findOne({
            leadNo,
            caseNo: leadReturn.caseNo,
            caseName: leadReturn.caseName
        })
            .sort({ versionId: -1 })
            .select("versionId _id");

        const newVersionId = lastVersion ? lastVersion.versionId + 1 : 1;
        const parentVersionId = lastVersion ? lastVersion._id : null;

        // Mark all previous versions as not current for this lead + case
        if (lastVersion) {
            await CompleteleadReturn.updateMany(
                {
                    leadNo,
                    caseNo: leadReturn.caseNo,
                    caseName: leadReturn.caseName,
                    isCurrentVersion: true
                },
                { isCurrentVersion: false }
            );
        }

        // Create the snapshot document (stores ObjectId refs, not embedded copies)
        const snapshot = new CompleteleadReturn({
            versionId: newVersionId,
            isCurrentVersion: true,
            parentVersionId,
            versionCreatedBy,
            versionReason,

            // ObjectId refs from the lead return header
            leadReturnId: leadReturn._id,
            caseId: leadReturn.caseId,
            leadId: leadReturn.leadId,

            // Core lead return data (snapshots)
            leadNo: leadReturn.leadNo,
            returnNo: leadReturn.returnNo,
            assignedTo: leadReturn.assignedTo,
            assignedBy: leadReturn.assignedBy,
            description: leadReturn.description,
            submittedDate: leadReturn.submittedDate,
            approvedDate: leadReturn.approvedDate,
            returnedDate: leadReturn.returnedDate,
            caseName: leadReturn.caseName,
            caseNo: leadReturn.caseNo,
            accessLevel: leadReturn.accessLevel,

            // Related-record ObjectId arrays
            leadReturnResultIds: leadReturnResultIds.map(r => r._id),
            audioIds:            audioIds.map(r => r._id),
            videoIds:            videoIds.map(r => r._id),
            pictureIds:          pictureIds.map(r => r._id),
            enclosureIds:        enclosureIds.map(r => r._id),
            evidenceIds:         evidenceIds.map(r => r._id),
            personIds:           personIds.map(r => r._id),
            vehicleIds:          vehicleIds.map(r => r._id),
            scratchpadIds:       scratchpadIds.map(r => r._id),
            timelineIds:         timelineIds.map(r => r._id),
        });

        // Save the snapshot
        await snapshot.save();

        // Log snapshot creation in audit log
        try {
            await logSnapshotCreation(
                leadNo,
                leadReturn.caseNo,
                newVersionId,
                versionReason,
                { username: versionCreatedBy },
                {}
            );
        } catch (auditErr) {
            console.error("Error logging snapshot creation:", auditErr.message);
        }

        // Update the main lead return record with the snapshot reference
        await LeadReturn.findOneAndUpdate(
            query,
            {
                completeLeadReturnId: snapshot._id,
                currentVersionId: newVersionId
            }
        );

        // Update all related records with the snapshot reference
        await Promise.all([
            LeadReturnResult.updateMany(relatedRecordQuery, { completeLeadReturnId: snapshot._id }),
            LRAudio.updateMany(relatedRecordQuery, { completeLeadReturnId: snapshot._id }),
            LRVideo.updateMany(relatedRecordQuery, { completeLeadReturnId: snapshot._id }),
            LRPicture.updateMany(relatedRecordQuery, { completeLeadReturnId: snapshot._id }),
            LREnclosure.updateMany(relatedRecordQuery, { completeLeadReturnId: snapshot._id }),
            LREvidence.updateMany(relatedRecordQuery, { completeLeadReturnId: snapshot._id }),
            LRPerson.updateMany(relatedRecordQuery, { completeLeadReturnId: snapshot._id }),
            LRVehicle.updateMany(relatedRecordQuery, { completeLeadReturnId: snapshot._id }),
            LRScratchpad.updateMany({ ...relatedRecordQuery, type: "Lead" }, { completeLeadReturnId: snapshot._id }),
            LRTimeline.updateMany(relatedRecordQuery, { completeLeadReturnId: snapshot._id })
        ]);

        return snapshot;
    } catch (error) {
        console.error("Error creating snapshot:", error);
        throw error;
    }
}

async function getCurrentVersion(leadNo, caseNo = null, caseName = null) {
    return await CompleteleadReturn.getCurrentVersion(leadNo, caseNo, caseName);
}

async function getAllVersions(leadNo, caseNo = null, caseName = null) {
    return await CompleteleadReturn.getAllVersions(leadNo, caseNo, caseName);
}

async function getVersion(leadNo, versionId, caseNo = null, caseName = null) {
    return await CompleteleadReturn.getVersion(leadNo, versionId, caseNo, caseName);
}

async function getVersionPopulated(leadNo, versionId, caseNo = null, caseName = null) {
    return await CompleteleadReturn.getVersionPopulated(leadNo, versionId, caseNo, caseName);
}

async function compareVersions(leadNo, fromVersionId, toVersionId, caseNo = null, caseName = null) {
    const [fromVersion, toVersion] = await Promise.all([
        CompleteleadReturn.getVersion(leadNo, fromVersionId, caseNo, caseName),
        CompleteleadReturn.getVersion(leadNo, toVersionId, caseNo, caseName)
    ]);

    if (!fromVersion || !toVersion) {
        throw new Error("One or both versions not found");
    }

    return {
        fromVersion: {
            versionId: fromVersion.versionId,
            versionCreatedAt: fromVersion.versionCreatedAt,
            versionCreatedBy: fromVersion.versionCreatedBy,
            versionReason: fromVersion.versionReason
        },
        toVersion: {
            versionId: toVersion.versionId,
            versionCreatedAt: toVersion.versionCreatedAt,
            versionCreatedBy: toVersion.versionCreatedBy,
            versionReason: toVersion.versionReason
        },
        changes: {
            leadReturnResults: {
                added: toVersion.leadReturnResultIds.length - fromVersion.leadReturnResultIds.length,
                fromCount: fromVersion.leadReturnResultIds.length,
                toCount: toVersion.leadReturnResultIds.length
            },
            audios: {
                added: toVersion.audioIds.length - fromVersion.audioIds.length,
                fromCount: fromVersion.audioIds.length,
                toCount: toVersion.audioIds.length
            },
            videos: {
                added: toVersion.videoIds.length - fromVersion.videoIds.length,
                fromCount: fromVersion.videoIds.length,
                toCount: toVersion.videoIds.length
            },
            pictures: {
                added: toVersion.pictureIds.length - fromVersion.pictureIds.length,
                fromCount: fromVersion.pictureIds.length,
                toCount: toVersion.pictureIds.length
            },
            enclosures: {
                added: toVersion.enclosureIds.length - fromVersion.enclosureIds.length,
                fromCount: fromVersion.enclosureIds.length,
                toCount: toVersion.enclosureIds.length
            },
            evidences: {
                added: toVersion.evidenceIds.length - fromVersion.evidenceIds.length,
                fromCount: fromVersion.evidenceIds.length,
                toCount: toVersion.evidenceIds.length
            },
            persons: {
                added: toVersion.personIds.length - fromVersion.personIds.length,
                fromCount: fromVersion.personIds.length,
                toCount: toVersion.personIds.length
            },
            vehicles: {
                added: toVersion.vehicleIds.length - fromVersion.vehicleIds.length,
                fromCount: fromVersion.vehicleIds.length,
                toCount: toVersion.vehicleIds.length
            },
            scratchpads: {
                added: toVersion.scratchpadIds.length - fromVersion.scratchpadIds.length,
                fromCount: fromVersion.scratchpadIds.length,
                toCount: toVersion.scratchpadIds.length
            },
            timelines: {
                added: toVersion.timelineIds.length - fromVersion.timelineIds.length,
                fromCount: fromVersion.timelineIds.length,
                toCount: toVersion.timelineIds.length
            }
        },
        fromData: fromVersion,
        toData: toVersion
    };
}

async function restoreVersion(leadNo, versionId, restoredBy, caseNo = null, caseName = null) {
    const versionToRestore = await CompleteleadReturn.getVersion(leadNo, versionId, caseNo, caseName);

    if (!versionToRestore) {
        throw new Error(`Version ${versionId} not found for lead ${leadNo}`);
    }

    return await createSnapshot(leadNo, restoredBy, "Reopened", caseNo, caseName);
}

module.exports = {
    createSnapshot,
    getCurrentVersion,
    getAllVersions,
    getVersion,
    getVersionPopulated,
    compareVersions,
    restoreVersion
};
