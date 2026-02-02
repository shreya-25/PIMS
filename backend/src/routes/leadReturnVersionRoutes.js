const express = require("express");
const router = express.Router();
const {
    createSnapshot,
    getCurrentVersion,
    getAllVersions,
    getVersion,
    compareVersions,
    restoreVersion
} = require("../utils/leadReturnVersioning");
const { generateActivityLog } = require("../utils/versionDiffTracker");
const { getFileFromS3 } = require("../s3");
const LREnclosure = require("../models/LREnclosure");
const LRPicture = require("../models/LRPicture");
const LRAudio = require("../models/LRAudio");
const LRVideo = require("../models/LRVideo");
const LREvidence = require("../models/LREvidence");

const entityModelMap = {
    'Enclosure': LREnclosure,
    'Picture': LRPicture,
    'Audio': LRAudio,
    'Video': LRVideo,
    'Evidence': LREvidence
};

/**
 * @route   GET /api/leadreturn-versions/file-url
 * @desc    Get a presigned URL for a file by looking up the current record
 * @access  Private
 * @query   entityType - The type of entity (Enclosure, Picture, Audio, Video, Evidence)
 * @query   entityId - The MongoDB _id of the entity
 */
router.get("/file-url", async (req, res) => {
    try {
        const { entityType, entityId } = req.query;

        if (!entityType || !entityId) {
            return res.status(400).json({
                success: false,
                message: "entityType and entityId query parameters are required"
            });
        }

        const Model = entityModelMap[entityType];
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: `Unknown entity type: ${entityType}`
            });
        }

        const record = await Model.findById(entityId);
        if (!record || !record.s3Key) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const signedUrl = await getFileFromS3(record.s3Key);

        res.json({
            success: true,
            signedUrl
        });
    } catch (error) {
        console.error("Error generating file URL:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate file URL"
        });
    }
});

/**
 * @route   POST /api/leadreturn-versions/:leadNo/snapshot
 * @desc    Manually create a snapshot for a lead return
 * @access  Private
 * @body    caseNo - Optional case number for filtering
 * @body    caseName - Optional case name for filtering
 */
router.post("/:leadNo/snapshot", async (req, res) => {
    try {
        const { leadNo } = req.params;
        const { versionReason, caseNo, caseName } = req.body;
        const username = req.user?.username || req.body.username || "System";

        const snapshot = await createSnapshot(
            parseInt(leadNo),
            username,
            versionReason || "Manual Snapshot",
            caseNo,
            caseName
        );

        res.status(201).json({
            success: true,
            message: "Snapshot created successfully",
            data: snapshot
        });
    } catch (error) {
        console.error("Error creating snapshot:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/leadreturn-versions/:leadNo/current
 * @desc    Get the current version of a lead return
 * @access  Private
 * @query   caseNo - Optional case number for filtering
 * @query   caseName - Optional case name for filtering
 */
router.get("/:leadNo/current", async (req, res) => {
    try {
        const { leadNo } = req.params;
        const { caseNo, caseName } = req.query;

        const currentVersion = await getCurrentVersion(parseInt(leadNo), caseNo, caseName);

        if (!currentVersion) {
            return res.status(404).json({
                success: false,
                message: "No version found for this lead return"
            });
        }

        res.json({
            success: true,
            data: currentVersion
        });
    } catch (error) {
        console.error("Error getting current version:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/leadreturn-versions/:leadNo/all
 * @desc    Get all versions of a lead return
 * @access  Private
 */
router.get("/:leadNo/all", async (req, res) => {
    try {
        const { leadNo } = req.params;
        const versions = await getAllVersions(parseInt(leadNo));

        res.json({
            success: true,
            count: versions.length,
            data: versions
        });
    } catch (error) {
        console.error("Error getting all versions:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/leadreturn-versions/:leadNo/version/:versionId
 * @desc    Get a specific version of a lead return
 * @access  Private
 * @query   caseNo - Optional case number for filtering
 * @query   caseName - Optional case name for filtering
 */
router.get("/:leadNo/version/:versionId", async (req, res) => {
    try {
        const { leadNo, versionId } = req.params;
        const { caseNo, caseName } = req.query;

        const version = await getVersion(parseInt(leadNo), parseInt(versionId), caseNo, caseName);

        if (!version) {
            return res.status(404).json({
                success: false,
                message: "Version not found"
            });
        }

        res.json({
            success: true,
            data: version
        });
    } catch (error) {
        console.error("Error getting version:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/leadreturn-versions/:leadNo/compare/:fromVersion/:toVersion
 * @desc    Compare two versions of a lead return
 * @access  Private
 * @query   caseNo - Optional case number for filtering
 * @query   caseName - Optional case name for filtering
 */
router.get("/:leadNo/compare/:fromVersion/:toVersion", async (req, res) => {
    try {
        const { leadNo, fromVersion, toVersion } = req.params;
        const { caseNo, caseName } = req.query;

        const comparison = await compareVersions(
            parseInt(leadNo),
            parseInt(fromVersion),
            parseInt(toVersion),
            caseNo,
            caseName
        );

        res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        console.error("Error comparing versions:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/leadreturn-versions/:leadNo/restore/:versionId
 * @desc    Restore a specific version (creates a new version based on the old one)
 * @access  Private
 * @query   caseNo - Optional case number for filtering
 * @query   caseName - Optional case name for filtering
 */
router.post("/:leadNo/restore/:versionId", async (req, res) => {
    try {
        const { leadNo, versionId } = req.params;
        const { caseNo, caseName } = req.query;
        const username = req.user?.username || req.body.username || "System";

        const restoredSnapshot = await restoreVersion(
            parseInt(leadNo),
            parseInt(versionId),
            username,
            caseNo,
            caseName
        );

        res.status(201).json({
            success: true,
            message: `Successfully restored version ${versionId}`,
            data: restoredSnapshot
        });
    } catch (error) {
        console.error("Error restoring version:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/leadreturn-versions/:leadNo/activity/:fromVersion/:toVersion
 * @desc    Get detailed activity log between two versions
 * @access  Private
 * @query   caseNo - Optional case number for filtering
 * @query   caseName - Optional case name for filtering
 */
router.get("/:leadNo/activity/:fromVersion/:toVersion", async (req, res) => {
    try {
        const { leadNo, fromVersion, toVersion } = req.params;
        const { caseNo, caseName } = req.query;

        const [fromVersionData, toVersionData] = await Promise.all([
            getVersion(parseInt(leadNo), parseInt(fromVersion), caseNo, caseName),
            getVersion(parseInt(leadNo), parseInt(toVersion), caseNo, caseName)
        ]);

        if (!fromVersionData || !toVersionData) {
            return res.status(404).json({
                success: false,
                message: "One or both versions not found"
            });
        }

        const activityLog = generateActivityLog(fromVersionData, toVersionData);

        res.json({
            success: true,
            fromVersion: {
                versionId: fromVersionData.versionId,
                versionCreatedAt: fromVersionData.versionCreatedAt,
                versionCreatedBy: fromVersionData.versionCreatedBy,
                versionReason: fromVersionData.versionReason
            },
            toVersion: {
                versionId: toVersionData.versionId,
                versionCreatedAt: toVersionData.versionCreatedAt,
                versionCreatedBy: toVersionData.versionCreatedBy,
                versionReason: toVersionData.versionReason
            },
            activities: activityLog,
            totalChanges: activityLog.length
        });
    } catch (error) {
        console.error("Error generating activity log:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/leadreturn-versions/:leadNo/history
 * @desc    Get version history summary for a lead return
 * @access  Private
 * @query   caseNo - Filter by case number
 * @query   caseName - Filter by case name
 */
router.get("/:leadNo/history", async (req, res) => {
    try {
        const { leadNo } = req.params;
        const { caseNo, caseName } = req.query;

        console.log('📋 Version History Request:', {
            leadNo,
            caseNo,
            caseName,
            hasFilters: !!(caseNo || caseName)
        });

        // Get all versions for this lead number filtered by case
        // This ensures version history is specific to the lead within a case
        const versions = await getAllVersions(parseInt(leadNo), caseNo, caseName);
        console.log(`📊 Found ${versions.length} versions for leadNo ${leadNo}, caseNo: ${caseNo}, caseName: ${caseName}`);

        // Debug: Show what we found
        if (versions.length > 0) {
            console.log('✅ Sample version data:', {
                versionId: versions[0].versionId,
                caseNo: versions[0].caseNo,
                caseName: versions[0].caseName,
                leadNo: versions[0].leadNo,
                reason: versions[0].versionReason
            });
        } else {
            console.log('⚠️ No versions found. Checking for any versions without case filter...');
            const allVersionsForLead = await getAllVersions(parseInt(leadNo));
            console.log(`Found ${allVersionsForLead.length} versions without case filter`);
            if (allVersionsForLead.length > 0) {
                console.log('❌ Case mismatch! Version has:', {
                    caseNo: allVersionsForLead[0].caseNo,
                    caseName: allVersionsForLead[0].caseName
                });
                console.log('But query requested:', { caseNo, caseName });
            }
        }

        const history = versions.map(v => ({
            versionId: v.versionId,
            versionReason: v.versionReason,
            versionCreatedBy: v.versionCreatedBy,
            versionCreatedAt: v.versionCreatedAt,
            isCurrentVersion: v.isCurrentVersion,
            status: v.assignedTo?.lRStatus,
            caseNo: v.caseNo,
            caseName: v.caseName,
            itemCounts: {
                results: v.leadReturnResults?.length || 0,
                audios: v.audios?.length || 0,
                videos: v.videos?.length || 0,
                pictures: v.pictures?.length || 0,
                enclosures: v.enclosures?.length || 0,
                evidences: v.evidences?.length || 0,
                persons: v.persons?.length || 0,
                vehicles: v.vehicles?.length || 0,
                scratchpads: v.scratchpads?.length || 0,
                timelines: v.timelines?.length || 0
            }
        }));

        res.json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        console.error("Error getting version history:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
