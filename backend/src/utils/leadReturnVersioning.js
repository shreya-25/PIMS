const CompleteleadReturn = require("../models/CompleteleadReturn");
const LeadReturn = require("../models/leadreturn");
const LeadReturnResult = require("../models/leadReturnResult");
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

/**
 * Create a complete snapshot of a lead return and all its related data
 * @param {Number} leadNo - The lead number to snapshot
 * @param {String} versionCreatedBy - Username of person creating the version
 * @param {String} versionReason - Reason for creating version (Created, Returned, Reopened, Manual Snapshot)
 * @returns {Object} The created snapshot document
 */
async function createSnapshot(leadNo, versionCreatedBy, versionReason = "Manual Snapshot") {
    try {
        // Get the main lead return record
        const leadReturn = await LeadReturn.findOne({ leadNo });
        if (!leadReturn) {
            throw new Error(`Lead return with leadNo ${leadNo} not found`);
        }

        // Get all related records
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
            LeadReturnResult.find({ leadNo, isDeleted: { $ne: true } }).lean(),
            LRAudio.find({ leadNo }).lean(),
            LRVideo.find({ leadNo }).lean(),
            LRPicture.find({ leadNo }).lean(),
            LREnclosure.find({ leadNo }).lean(),
            LREvidence.find({ leadNo }).lean(),
            LRPerson.find({ leadNo }).lean(),
            LRVehicle.find({ leadNo }).lean(),
            LRScratchpad.find({ leadNo, type: "Lead" }).lean(),
            LRTimeline.find({ leadNo }).lean()
        ]);

        // Get the current highest version for this lead
        const lastVersion = await CompleteleadReturn.findOne({ leadNo })
            .sort({ versionId: -1 })
            .select("versionId _id");

        const newVersionId = lastVersion ? lastVersion.versionId + 1 : 1;
        const parentVersionId = lastVersion ? lastVersion._id : null;

        // Mark all previous versions as not current
        if (lastVersion) {
            await CompleteleadReturn.updateMany(
                { leadNo, isCurrentVersion: true },
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

            // Core lead return data
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
                leadReturnId: result.leadReturnId, // The actual narrative ID
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
            { leadNo },
            {
                completeLeadReturnId: snapshot._id,
                currentVersionId: newVersionId
            }
        );

        // Update all related records with the snapshot reference
        await Promise.all([
            LeadReturnResult.updateMany(
                { leadNo },
                { completeLeadReturnId: snapshot._id }
            ),
            LRAudio.updateMany(
                { leadNo },
                { completeLeadReturnId: snapshot._id }
            ),
            LRVideo.updateMany(
                { leadNo },
                { completeLeadReturnId: snapshot._id }
            ),
            LRPicture.updateMany(
                { leadNo },
                { completeLeadReturnId: snapshot._id }
            ),
            LREnclosure.updateMany(
                { leadNo },
                { completeLeadReturnId: snapshot._id }
            ),
            LREvidence.updateMany(
                { leadNo },
                { completeLeadReturnId: snapshot._id }
            ),
            LRPerson.updateMany(
                { leadNo },
                { completeLeadReturnId: snapshot._id }
            ),
            LRVehicle.updateMany(
                { leadNo },
                { completeLeadReturnId: snapshot._id }
            ),
            LRScratchpad.updateMany(
                { leadNo, type: "Lead" },
                { completeLeadReturnId: snapshot._id }
            ),
            LRTimeline.updateMany(
                { leadNo },
                { completeLeadReturnId: snapshot._id }
            )
        ]);

        return snapshot;
    } catch (error) {
        console.error("Error creating snapshot:", error);
        throw error;
    }
}

/**
 * Get the current version of a lead return
 * @param {Number} leadNo - The lead number
 * @returns {Object} The current version snapshot
 */
async function getCurrentVersion(leadNo) {
    return await CompleteleadReturn.getCurrentVersion(leadNo);
}

/**
 * Get all versions of a lead return
 * @param {Number} leadNo - The lead number
 * @returns {Array} All version snapshots
 */
async function getAllVersions(leadNo) {
    return await CompleteleadReturn.getAllVersions(leadNo);
}

/**
 * Get a specific version of a lead return
 * @param {Number} leadNo - The lead number
 * @param {Number} versionId - The version ID
 * @returns {Object} The specific version snapshot
 */
async function getVersion(leadNo, versionId) {
    return await CompleteleadReturn.getVersion(leadNo, versionId);
}

/**
 * Compare two versions of a lead return
 * @param {Number} leadNo - The lead number
 * @param {Number} fromVersionId - The starting version ID
 * @param {Number} toVersionId - The ending version ID
 * @returns {Object} Comparison details
 */
async function compareVersions(leadNo, fromVersionId, toVersionId) {
    const [fromVersion, toVersion] = await Promise.all([
        CompleteleadReturn.getVersion(leadNo, fromVersionId),
        CompleteleadReturn.getVersion(leadNo, toVersionId)
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

/**
 * Restore a specific version (creates a new version based on an old one)
 * @param {Number} leadNo - The lead number
 * @param {Number} versionId - The version ID to restore from
 * @param {String} restoredBy - Username of person restoring the version
 * @returns {Object} The new snapshot created from the restored version
 */
async function restoreVersion(leadNo, versionId, restoredBy) {
    const versionToRestore = await CompleteleadReturn.getVersion(leadNo, versionId);

    if (!versionToRestore) {
        throw new Error(`Version ${versionId} not found for lead ${leadNo}`);
    }

    // This would require additional logic to actually restore the data to the individual tables
    // For now, we just create a new snapshot marking it as a restoration
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
