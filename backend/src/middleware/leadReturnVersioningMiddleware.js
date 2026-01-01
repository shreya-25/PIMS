const { createSnapshot } = require("../utils/leadReturnVersioning");

/**
 * Middleware to automatically create snapshots when lead status changes
 * This should be used in your lead return update routes
 */
const autoSnapshotMiddleware = async (req, res, next) => {
    try {
        // Store the original status before update
        if (req.body.leadNo && req.body.assignedTo?.lRStatus) {
            req.preupdateStatus = {
                leadNo: req.body.leadNo,
                newStatus: req.body.assignedTo.lRStatus
            };
        }
        next();
    } catch (error) {
        console.error("Error in auto-snapshot middleware:", error);
        next(); // Continue even if middleware fails
    }
};

/**
 * Post-update middleware to create snapshot after successful update
 * This should be called after the update operation
 */
const postUpdateSnapshot = async (req, res, updatedLeadReturn, username) => {
    try {
        const status = updatedLeadReturn.assignedTo?.lRStatus;
        const leadNo = updatedLeadReturn.leadNo;

        // Create snapshot when:
        // 1. Lead is Returned
        // 2. Lead is Completed
        // 3. Lead is Approved
        const shouldSnapshot = ["Returned", "Completed", "Approved"].includes(status);

        if (shouldSnapshot && leadNo) {
            let versionReason = "Manual Snapshot";

            if (status === "Returned") {
                versionReason = "Returned";
            } else if (status === "Completed") {
                versionReason = "Completed";
            } else if (status === "Approved") {
                versionReason = "Approved";
            }

            console.log(`Creating snapshot for lead ${leadNo} - Reason: ${versionReason}`);

            await createSnapshot(leadNo, username, versionReason);

            console.log(`Snapshot created successfully for lead ${leadNo}`);
        }

        // Also create snapshot when lead is reopened (status changes from Returned/Completed to Assigned/Pending)
        if (["Assigned", "Pending"].includes(status) && req.previousStatus) {
            if (["Returned", "Completed"].includes(req.previousStatus)) {
                console.log(`Creating reopened snapshot for lead ${leadNo}`);
                await createSnapshot(leadNo, username, "Reopened");
                console.log(`Reopened snapshot created successfully for lead ${leadNo}`);
            }
        }
    } catch (error) {
        console.error("Error creating post-update snapshot:", error);
        // Don't throw error - snapshot failure shouldn't break the update
    }
};

/**
 * Helper function to check if snapshot should be created based on status change
 */
const shouldCreateSnapshot = (oldStatus, newStatus) => {
    const snapshotTriggers = {
        // From any status to these statuses should create snapshot
        toStatuses: ["Returned", "Completed", "Approved"],
        // From these statuses to Assigned/Pending means reopened
        fromStatuses: ["Returned", "Completed"]
    };

    const isCompletionSnapshot = snapshotTriggers.toStatuses.includes(newStatus);
    const isReopenedSnapshot =
        snapshotTriggers.fromStatuses.includes(oldStatus) &&
        ["Assigned", "Pending"].includes(newStatus);

    return isCompletionSnapshot || isReopenedSnapshot;
};

/**
 * Wrapper function to use in your route handlers
 *
 * Example usage in a route:
 *
 * router.put('/leadreturn/:id', async (req, res) => {
 *   try {
 *     const leadReturn = await LeadReturn.findById(req.params.id);
 *     const oldStatus = leadReturn.assignedTo?.lRStatus;
 *
 *     // Update the lead return
 *     Object.assign(leadReturn, req.body);
 *     await leadReturn.save();
 *
 *     // Create snapshot if needed
 *     await createSnapshotIfNeeded(
 *       leadReturn.leadNo,
 *       oldStatus,
 *       leadReturn.assignedTo?.lRStatus,
 *       req.user.username
 *     );
 *
 *     res.json(leadReturn);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 */
const createSnapshotIfNeeded = async (leadNo, oldStatus, newStatus, username) => {
    try {
        if (!shouldCreateSnapshot(oldStatus, newStatus)) {
            return null;
        }

        let versionReason = "Manual Snapshot";

        if (newStatus === "Returned") {
            versionReason = "Returned";
        } else if (newStatus === "Completed") {
            versionReason = "Completed";
        } else if (newStatus === "Approved") {
            versionReason = "Approved";
        } else if (["Assigned", "Pending"].includes(newStatus) &&
                   ["Returned", "Completed"].includes(oldStatus)) {
            versionReason = "Reopened";
        }

        console.log(`Creating snapshot for lead ${leadNo} - Reason: ${versionReason}`);
        const snapshot = await createSnapshot(leadNo, username, versionReason);
        console.log(`Snapshot created successfully for lead ${leadNo}, version ${snapshot.versionId}`);

        return snapshot;
    } catch (error) {
        console.error(`Error creating snapshot for lead ${leadNo}:`, error);
        // Don't throw - snapshot creation failure shouldn't break the main operation
        return null;
    }
};

module.exports = {
    autoSnapshotMiddleware,
    postUpdateSnapshot,
    shouldCreateSnapshot,
    createSnapshotIfNeeded
};
