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

/**
 * @route   POST /api/leadreturn-versions/:leadNo/snapshot
 * @desc    Manually create a snapshot for a lead return
 * @access  Private
 */
router.post("/:leadNo/snapshot", async (req, res) => {
    try {
        const { leadNo } = req.params;
        const { versionReason } = req.body;
        const username = req.user?.username || req.body.username || "System";

        const snapshot = await createSnapshot(
            parseInt(leadNo),
            username,
            versionReason || "Manual Snapshot"
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
 */
router.get("/:leadNo/current", async (req, res) => {
    try {
        const { leadNo } = req.params;
        const currentVersion = await getCurrentVersion(parseInt(leadNo));

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
 */
router.get("/:leadNo/version/:versionId", async (req, res) => {
    try {
        const { leadNo, versionId } = req.params;
        const version = await getVersion(parseInt(leadNo), parseInt(versionId));

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
 */
router.get("/:leadNo/compare/:fromVersion/:toVersion", async (req, res) => {
    try {
        const { leadNo, fromVersion, toVersion } = req.params;
        const comparison = await compareVersions(
            parseInt(leadNo),
            parseInt(fromVersion),
            parseInt(toVersion)
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
 */
router.post("/:leadNo/restore/:versionId", async (req, res) => {
    try {
        const { leadNo, versionId } = req.params;
        const username = req.user?.username || req.body.username || "System";

        const restoredSnapshot = await restoreVersion(
            parseInt(leadNo),
            parseInt(versionId),
            username
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
 */
router.get("/:leadNo/activity/:fromVersion/:toVersion", async (req, res) => {
    try {
        const { leadNo, fromVersion, toVersion } = req.params;

        const [fromVersionData, toVersionData] = await Promise.all([
            getVersion(parseInt(leadNo), parseInt(fromVersion)),
            getVersion(parseInt(leadNo), parseInt(toVersion))
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
 */
router.get("/:leadNo/history", async (req, res) => {
    try {
        const { leadNo } = req.params;
        const versions = await getAllVersions(parseInt(leadNo));

        const history = versions.map(v => ({
            versionId: v.versionId,
            versionReason: v.versionReason,
            versionCreatedBy: v.versionCreatedBy,
            versionCreatedAt: v.versionCreatedAt,
            isCurrentVersion: v.isCurrentVersion,
            status: v.assignedTo?.lRStatus,
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
