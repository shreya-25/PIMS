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

        // Get all related records filtered by leadNo + case
        const [
            leadReturnResults,
            audios,
            videos,
            pictures,
            enclosures,
            evidences,
            persons,
            vehicles,
            scratchpads,
            timelines
        ] = await Promise.all([
            LeadReturnResult.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).lean(),
            LRAudio.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).lean(),
            LRVideo.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).lean(),
            LRPicture.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).lean(),
            LREnclosure.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).lean(),
            LREvidence.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).lean(),
            LRPerson.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).lean(),
            LRVehicle.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).lean(),
            LRScratchpad.find({ ...relatedRecordQuery, type: "Lead", isDeleted: { $ne: true } }).lean(),
            LRTimeline.find({ ...relatedRecordQuery, isDeleted: { $ne: true } }).lean()
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

        // Create the snapshot document
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
            assignedTo: leadReturn.assignedTo,
            assignedBy: leadReturn.assignedBy,
            description: leadReturn.description,
            submittedDate: leadReturn.submittedDate,
            approvedDate: leadReturn.approvedDate,
            returnedDate: leadReturn.returnedDate,
            caseName: leadReturn.caseName,
            caseNo: leadReturn.caseNo,
            accessLevel: leadReturn.accessLevel,

            // Snapshot of related data
            leadReturnResults: leadReturnResults.map(result => ({
                resultId: result._id,
                leadReturnId: result.leadReturnId,
                description: result.description,
                enteredDate: result.enteredDate,
                enteredBy: result.enteredBy,
                lastModifiedDate: result.lastModifiedDate,
                lastModifiedBy: result.lastModifiedBy,
                leadReturnResult: result.leadReturnResult,
                accessLevel: result.accessLevel,
                isDeleted: result.isDeleted,
                deletedAt: result.deletedAt,
                deletedBy: result.deletedBy
            })),

            audios: audios.map(audio => ({
                audioId: audio._id,
                description: audio.description,
                enteredBy: audio.enteredBy,
                enteredDate: audio.enteredDate,
                dateAudioRecorded: audio.dateAudioRecorded,
                audioDescription: audio.audioDescription,
                isLink: audio.isLink,
                link: audio.link,
                s3Key: audio.s3Key,
                originalName: audio.originalName,
                filename: audio.filename,
                filePath: audio.filePath,
                accessLevel: audio.accessLevel
            })),

            videos: videos.map(video => ({
                videoId: video._id,
                description: video.description,
                enteredBy: video.enteredBy,
                enteredDate: video.enteredDate,
                dateVideoRecorded: video.dateVideoRecorded,
                videoDescription: video.videoDescription,
                filePath: video.filePath,
                s3Key: video.s3Key,
                originalName: video.originalName,
                filename: video.filename,
                isLink: video.isLink,
                link: video.link,
                accessLevel: video.accessLevel
            })),

            pictures: pictures.map(picture => ({
                pictureId: picture._id,
                description: picture.description,
                enteredBy: picture.enteredBy,
                enteredDate: picture.enteredDate,
                datePictureTaken: picture.datePictureTaken,
                pictureDescription: picture.pictureDescription,
                s3Key: picture.s3Key,
                originalName: picture.originalName,
                filename: picture.filename,
                isLink: picture.isLink,
                link: picture.link,
                filePath: picture.filePath,
                accessLevel: picture.accessLevel
            })),

            enclosures: enclosures.map(enclosure => ({
                enclosureId: enclosure._id,
                description: enclosure.description,
                enteredBy: enclosure.enteredBy,
                enteredDate: enclosure.enteredDate,
                type: enclosure.type,
                enclosureDescription: enclosure.enclosureDescription,
                filePath: enclosure.filePath,
                s3Key: enclosure.s3Key,
                originalName: enclosure.originalName,
                filename: enclosure.filename,
                accessLevel: enclosure.accessLevel,
                isLink: enclosure.isLink,
                link: enclosure.link
            })),

            evidences: evidences.map(evidence => ({
                evidenceId: evidence._id,
                description: evidence.description,
                enteredBy: evidence.enteredBy,
                enteredDate: evidence.enteredDate,
                collectionDate: evidence.collectionDate,
                disposedDate: evidence.disposedDate,
                type: evidence.type,
                evidenceDescription: evidence.evidenceDescription,
                s3Key: evidence.s3Key,
                originalName: evidence.originalName,
                filename: evidence.filename,
                filePath: evidence.filePath,
                isLink: evidence.isLink,
                link: evidence.link,
                accessLevel: evidence.accessLevel
            })),

            persons: persons.map(person => ({
                personId: person._id,
                description: person.description,
                enteredBy: person.enteredBy,
                enteredDate: person.enteredDate,
                lastName: person.lastName,
                firstName: person.firstName,
                middleInitial: person.middleInitial,
                suffix: person.suffix,
                cellNumber: person.cellNumber,
                alias: person.alias,
                businessName: person.businessName,
                address: person.address,
                ssn: person.ssn,
                age: person.age,
                email: person.email,
                occupation: person.occupation,
                personType: person.personType,
                condition: person.condition,
                cautionType: person.cautionType,
                sex: person.sex,
                race: person.race,
                ethnicity: person.ethnicity,
                skinTone: person.skinTone,
                eyeColor: person.eyeColor,
                hairColor: person.hairColor,
                glasses: person.glasses,
                height: person.height,
                weight: person.weight,
                scar: person.scar,
                tattoo: person.tattoo,
                mark: person.mark,
                additionalData: person.additionalData,
                accessLevel: person.accessLevel
            })),

            vehicles: vehicles.map(vehicle => ({
                vehicleId: vehicle._id,
                description: vehicle.description,
                enteredBy: vehicle.enteredBy,
                enteredDate: vehicle.enteredDate,
                year: vehicle.year,
                make: vehicle.make,
                model: vehicle.model,
                plate: vehicle.plate,
                vin: vehicle.vin,
                state: vehicle.state,
                category: vehicle.category,
                type: vehicle.type,
                primaryColor: vehicle.primaryColor,
                secondaryColor: vehicle.secondaryColor,
                information: vehicle.information,
                additionalData: vehicle.additionalData,
                accessLevel: vehicle.accessLevel
            })),

            scratchpads: scratchpads.map(scratchpad => ({
                scratchpadId: scratchpad._id,
                description: scratchpad.description,
                enteredBy: scratchpad.enteredBy,
                enteredDate: scratchpad.enteredDate,
                text: scratchpad.text,
                type: scratchpad.type,
                accessLevel: scratchpad.accessLevel
            })),

            timelines: timelines.map(timeline => ({
                timelineId: timeline._id,
                description: timeline.description,
                enteredBy: timeline.enteredBy,
                enteredDate: timeline.enteredDate,
                eventDate: timeline.eventDate,
                eventStartDate: timeline.eventStartDate,
                eventEndDate: timeline.eventEndDate,
                eventStartTime: timeline.eventStartTime,
                eventEndTime: timeline.eventEndTime,
                eventLocation: timeline.eventLocation,
                eventDescription: timeline.eventDescription,
                timelineFlag: timeline.timelineFlag,
                accessLevel: timeline.accessLevel
            }))
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
                added: toVersion.leadReturnResults.length - fromVersion.leadReturnResults.length,
                fromCount: fromVersion.leadReturnResults.length,
                toCount: toVersion.leadReturnResults.length
            },
            audios: {
                added: toVersion.audios.length - fromVersion.audios.length,
                fromCount: fromVersion.audios.length,
                toCount: toVersion.audios.length
            },
            videos: {
                added: toVersion.videos.length - fromVersion.videos.length,
                fromCount: fromVersion.videos.length,
                toCount: toVersion.videos.length
            },
            pictures: {
                added: toVersion.pictures.length - fromVersion.pictures.length,
                fromCount: fromVersion.pictures.length,
                toCount: toVersion.pictures.length
            },
            enclosures: {
                added: toVersion.enclosures.length - fromVersion.enclosures.length,
                fromCount: fromVersion.enclosures.length,
                toCount: toVersion.enclosures.length
            },
            evidences: {
                added: toVersion.evidences.length - fromVersion.evidences.length,
                fromCount: fromVersion.evidences.length,
                toCount: toVersion.evidences.length
            },
            persons: {
                added: toVersion.persons.length - fromVersion.persons.length,
                fromCount: fromVersion.persons.length,
                toCount: toVersion.persons.length
            },
            vehicles: {
                added: toVersion.vehicles.length - fromVersion.vehicles.length,
                fromCount: fromVersion.vehicles.length,
                toCount: toVersion.vehicles.length
            },
            scratchpads: {
                added: toVersion.scratchpads.length - fromVersion.scratchpads.length,
                fromCount: fromVersion.scratchpads.length,
                toCount: toVersion.scratchpads.length
            },
            timelines: {
                added: toVersion.timelines.length - fromVersion.timelines.length,
                fromCount: fromVersion.timelines.length,
                toCount: toVersion.timelines.length
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

    return await createSnapshot(leadNo, restoredBy, `Restored from version ${versionId}`);
}

module.exports = {
    createSnapshot,
    getCurrentVersion,
    getAllVersions,
    getVersion,
    compareVersions,
    restoreVersion
};
