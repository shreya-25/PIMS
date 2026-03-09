const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const {
    createSnapshot,
    getCurrentVersion,
    getAllVersions,
    getVersion,
    getVersionPopulated,
    compareVersions,
    restoreVersion
} = require("../utils/leadReturnVersioning");
const { generateActivityLog } = require("../utils/versionDiffTracker");
const { getProxyUrl } = require("../s3");
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

        const signedUrl = getProxyUrl(record.s3Key, record.caseNo);

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
            getVersionPopulated(parseInt(leadNo), parseInt(fromVersion), caseNo, caseName),
            getVersionPopulated(parseInt(leadNo), parseInt(toVersion), caseNo, caseName)
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
                results: v.leadReturnResultIds?.length || 0,
                audios: v.audioIds?.length || 0,
                videos: v.videoIds?.length || 0,
                pictures: v.pictureIds?.length || 0,
                enclosures: v.enclosureIds?.length || 0,
                evidences: v.evidenceIds?.length || 0,
                persons: v.personIds?.length || 0,
                vehicles: v.vehicleIds?.length || 0,
                scratchpads: v.scratchpadIds?.length || 0,
                timelines: v.timelineIds?.length || 0
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

/**
 * Helper function to format date for PDF
 */
const formatDateForPdf = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
};

const formatDateTimePdf = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
};

// Colors for the PDF
const PDF_COLORS = {
    primary: "#003366",      // Dark blue
    created: "#28a745",      // Green
    deleted: "#dc3545",      // Red
    updated: "#fd7e14",      // Orange
    headerBg: "#003366",
    sectionBg: "#f8f9fa",
    border: "#dee2e6",
    text: "#212529",
    muted: "#6c757d",
    lightGreen: "#d4edda",
    lightRed: "#f8d7da",
    lightOrange: "#fff3cd"
};

/**
 * Draw the header with logo and dark blue banner
 */
function drawVersionHeader(doc, leadNo, versionId, caseNo, caseName, leadName) {
    const pageW = doc.page.width;
    const padX = 16;
    const padY = 10;

    const logoW = 70, logoH = 70;
    const logoX = padX;
    const logoPath = path.join(__dirname, "../../../frontend/public/Materials/newpolicelogo.png");

    const textX = logoX + logoW + 16;
    const textW = pageW - textX - padX;

    const caseLine = `Case: ${caseNo || 'N/A'} | ${caseName || 'N/A'}`;
    const leadLine = `Lead: ${leadNo} | ${leadName || 'Version History Report'}`;

    doc.font("Helvetica-Bold").fontSize(14);
    const caseH = doc.heightOfString(caseLine, { width: textW });
    doc.fontSize(12);
    const leadH = doc.heightOfString(leadLine, { width: textW });
    const textBlockH = caseH + 5 + leadH + 5 + 20;

    const headerH = Math.max(logoH, textBlockH) + 2 * padY;

    doc.rect(0, 0, pageW, headerH).fill(PDF_COLORS.headerBg);

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, logoX, padY, { width: logoW, height: logoH });
    }

    let y = padY + (headerH - 2 * padY - textBlockH) / 2;
    doc.fillColor("white").font("Helvetica-Bold").fontSize(14)
       .text(caseLine, textX, y, { width: textW, align: "center" });
    y = doc.y + 5;
    doc.fontSize(12)
       .text(leadLine, textX, y, { width: textW, align: "center" });
    y = doc.y + 8;
    doc.fontSize(11).font("Helvetica")
       .text(`VERSION ${versionId} - CHANGE REPORT`, textX, y, { width: textW, align: "center" });

    doc.fillColor("black");
    return headerH;
}

/**
 * Draw section header with colored background
 */
function drawSectionHeader(doc, title, currentY, leftMargin = 50, pageWidth = 512) {
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (currentY + 60 > bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
    }

    // Section background
    doc.rect(leftMargin, currentY, pageWidth, 22).fill(PDF_COLORS.sectionBg);
    doc.rect(leftMargin, currentY, pageWidth, 22).stroke(PDF_COLORS.border);

    doc.font("Helvetica-Bold").fontSize(10).fillColor(PDF_COLORS.primary)
       .text(title, leftMargin + 10, currentY + 6);
    doc.font("Helvetica").fillColor("black");
    return currentY + 28;
}

/**
 * Draw a change badge (CREATED, UPDATED, DELETED)
 */
function drawChangeBadge(doc, action, x, y) {
    const badges = {
        created: { bg: PDF_COLORS.created, text: "CREATED", symbol: "+" },
        updated: { bg: PDF_COLORS.updated, text: "UPDATED", symbol: "~" },
        deleted: { bg: PDF_COLORS.deleted, text: "DELETED", symbol: "-" }
    };

    const badge = badges[action] || badges.updated;
    const badgeWidth = 70;
    const badgeHeight = 16;

    doc.roundedRect(x, y, badgeWidth, badgeHeight, 3).fill(badge.bg);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("white")
       .text(`${badge.symbol} ${badge.text}`, x + 5, y + 4, { width: badgeWidth - 10, align: "center" });
    doc.fillColor("black").font("Helvetica");

    return badgeWidth;
}

/**
 * Draw side-by-side comparison box for updated content
 */
function drawComparisonBox(doc, x, y, width, originalContent, updatedContent, fieldName) {
    const padding = 8;
    const halfWidth = (width - 15) / 2;
    const bottomY = doc.page.height - doc.page.margins.bottom;
    const topY = doc.page.margins.top;

    // Measure content heights
    doc.font("Helvetica").fontSize(8);
    const origHeight = doc.heightOfString(originalContent || "(empty)", { width: halfWidth - 2 * padding });
    const updHeight = doc.heightOfString(updatedContent || "(empty)", { width: halfWidth - 2 * padding });
    const contentHeight = Math.max(origHeight, updHeight, 20);
    const boxHeight = contentHeight + 35; // header + padding

    // Page break if needed
    if (y + boxHeight > bottomY) {
        doc.addPage();
        y = topY;
    }

    // Field name label
    if (fieldName) {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.muted)
           .text(fieldName.toUpperCase(), x, y);
        y += 12;
    }

    // Original box (left) - light red background
    doc.rect(x, y, halfWidth, boxHeight).fillAndStroke(PDF_COLORS.lightRed, PDF_COLORS.border);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(PDF_COLORS.deleted)
       .text("ORIGINAL", x + padding, y + 5);
    doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text)
       .text(originalContent || "(empty)", x + padding, y + 18, { width: halfWidth - 2 * padding });

    // Arrow between boxes
    const arrowX = x + halfWidth + 3;
    doc.font("Helvetica-Bold").fontSize(12).fillColor(PDF_COLORS.muted)
       .text("→", arrowX, y + boxHeight / 2 - 6);

    // Updated box (right) - light green background
    const rightX = x + halfWidth + 15;
    doc.rect(rightX, y, halfWidth, boxHeight).fillAndStroke(PDF_COLORS.lightGreen, PDF_COLORS.border);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(PDF_COLORS.created)
       .text("UPDATED", rightX + padding, y + 5);
    doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text)
       .text(updatedContent || "(empty)", rightX + padding, y + 18, { width: halfWidth - 2 * padding });

    return y + boxHeight + 8;
}

/**
 * Draw a single content box (for created or deleted items)
 */
function drawContentBox(doc, x, y, width, content, action, entityType) {
    const padding = 8;
    const bottomY = doc.page.height - doc.page.margins.bottom;
    const topY = doc.page.margins.top;

    doc.font("Helvetica").fontSize(8);
    const contentHeight = doc.heightOfString(content || "(empty)", { width: width - 2 * padding });
    const boxHeight = Math.max(contentHeight + 25, 40);

    if (y + boxHeight > bottomY) {
        doc.addPage();
        y = topY;
    }

    const bgColor = action === "created" ? PDF_COLORS.lightGreen : PDF_COLORS.lightRed;
    const borderColor = action === "created" ? PDF_COLORS.created : PDF_COLORS.deleted;

    // Draw box with colored left border
    doc.rect(x, y, width, boxHeight).fillAndStroke(bgColor, PDF_COLORS.border);
    doc.rect(x, y, 4, boxHeight).fill(borderColor);

    // Entity type label
    doc.font("Helvetica-Bold").fontSize(8).fillColor(borderColor)
       .text(entityType.toUpperCase(), x + padding + 4, y + 6);

    // Content
    doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text)
       .text(content || "(empty)", x + padding + 4, y + 18, { width: width - 2 * padding - 4 });

    return y + boxHeight + 6;
}

/**
 * Draw version info block
 */
function drawVersionInfoBlock(doc, x, y, width, version) {
    const height = 60;
    const colWidth = width / 4;

    // Background
    doc.rect(x, y, width, height).fillAndStroke("#f8f9fa", PDF_COLORS.border);

    // Labels and values
    const items = [
        { label: "Created", value: formatDateTimePdf(version.versionCreatedAt) },
        { label: "Created By", value: version.versionCreatedBy || "N/A" },
        { label: "Status", value: version.assignedTo?.lRStatus || "N/A" },
        { label: "Reason", value: version.versionReason || "N/A" }
    ];

    items.forEach((item, i) => {
        const itemX = x + (i * colWidth) + 10;
        doc.font("Helvetica-Bold").fontSize(7).fillColor(PDF_COLORS.muted)
           .text(item.label.toUpperCase(), itemX, y + 10, { width: colWidth - 20 });
        doc.font("Helvetica").fontSize(9).fillColor(PDF_COLORS.text)
           .text(item.value, itemX, y + 25, { width: colWidth - 20 });
    });

    return y + height + 15;
}

/**
 * Draw snapshot summary (not as table)
 */
function drawSnapshotSummary(doc, x, y, width, version) {
    const items = [
        { label: "Results", count: version.leadReturnResultIds?.length || 0 },
        { label: "Persons", count: version.personIds?.length || 0 },
        { label: "Vehicles", count: version.vehicleIds?.length || 0 },
        { label: "Audios", count: version.audioIds?.length || 0 },
        { label: "Videos", count: version.videoIds?.length || 0 },
        { label: "Pictures", count: version.pictureIds?.length || 0 },
        { label: "Enclosures", count: version.enclosureIds?.length || 0 },
        { label: "Evidences", count: version.evidenceIds?.length || 0 },
        { label: "Scratchpads", count: version.scratchpadIds?.length || 0 },
        { label: "Timelines", count: version.timelineIds?.length || 0 }
    ];

    const itemWidth = 55;
    const itemHeight = 35;
    const cols = Math.floor(width / itemWidth);

    let currentX = x;
    let currentY = y;

    items.forEach((item, i) => {
        if (i > 0 && i % cols === 0) {
            currentX = x;
            currentY += itemHeight + 5;
        }

        // Small card for each count
        const hasItems = item.count > 0;
        doc.rect(currentX, currentY, itemWidth - 5, itemHeight)
           .fillAndStroke(hasItems ? "#e3f2fd" : "#f5f5f5", PDF_COLORS.border);

        doc.font("Helvetica-Bold").fontSize(14)
           .fillColor(hasItems ? PDF_COLORS.primary : PDF_COLORS.muted)
           .text(item.count.toString(), currentX + 5, currentY + 5, { width: itemWidth - 15, align: "center" });

        doc.font("Helvetica").fontSize(7).fillColor(PDF_COLORS.muted)
           .text(item.label, currentX + 5, currentY + 22, { width: itemWidth - 15, align: "center" });

        currentX += itemWidth;
    });

    const rows = Math.ceil(items.length / cols);
    return currentY + itemHeight + 10;
}

/**
 * @route   GET /api/leadreturn-versions/:leadNo/version/:versionId/pdf
 * @desc    Generate and download PDF for a specific version using PDFKit
 * @access  Private
 * @query   caseNo - Optional case number for filtering
 * @query   caseName - Optional case name for filtering
 */
router.get("/:leadNo/version/:versionId/pdf", async (req, res) => {
    try {
        const { leadNo, versionId } = req.params;
        const { caseNo, caseName, leadName } = req.query;

        console.log('📄 PDF Generation Request:', { leadNo, versionId, caseNo, caseName });

        // Get the version data (populated for PDF rendering)
        const version = await getVersionPopulated(parseInt(leadNo), parseInt(versionId), caseNo, caseName);

        if (!version) {
            return res.status(404).json({
                success: false,
                message: "Version not found"
            });
        }

        // Get all versions to find previous version for activity log
        const allVersions = await getAllVersions(parseInt(leadNo), caseNo, caseName);
        const currentIndex = allVersions.findIndex(v => v.versionId === parseInt(versionId));

        let activityLog = [];
        let previousVersionData = null;
        if (currentIndex >= 0 && currentIndex < allVersions.length - 1) {
            const previousVersion = allVersions[currentIndex + 1];
            previousVersionData = await getVersionPopulated(parseInt(leadNo), previousVersion.versionId, caseNo, caseName);
            if (previousVersionData) {
                const versionPopulated = await getVersionPopulated(parseInt(leadNo), parseInt(versionId), caseNo, caseName);
                activityLog = generateActivityLog(previousVersionData, versionPopulated || version);
            }
        }

        // Create PDF document
        const doc = new PDFDocument({
            margin: 50,
            size: 'LETTER',
            bufferPages: true
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Lead_${leadNo}_Version_${versionId}.pdf"`);

        // Pipe PDF to response
        doc.pipe(res);

        const leftMargin = 50;
        const pageWidth = 512;

        // Draw header with logo
        const headerHeight = drawVersionHeader(doc, leadNo, versionId, caseNo || version.caseNo, caseName || version.caseName, leadName);
        let currentY = headerHeight + 20;

        // Version Info Block (not a table)
        currentY = drawVersionInfoBlock(doc, leftMargin, currentY, pageWidth, version);

        // Snapshot Summary (card-based, not a table)
        currentY = drawSectionHeader(doc, "SNAPSHOT SUMMARY", currentY, leftMargin, pageWidth);
        currentY = drawSnapshotSummary(doc, leftMargin, currentY, pageWidth, version);

        // ============ CHANGES SECTION ============
        if (activityLog && activityLog.length > 0) {
            // Group activities by action type
            const createdItems = activityLog.filter(a => a.action === 'created');
            const updatedItems = activityLog.filter(a => a.action === 'updated');
            const deletedItems = activityLog.filter(a => a.action === 'deleted');

            currentY = drawSectionHeader(doc, `CHANGES IN THIS VERSION (${activityLog.length} total)`, currentY, leftMargin, pageWidth);

            // Legend
            const legendY = currentY;
            drawChangeBadge(doc, "created", leftMargin, legendY);
            drawChangeBadge(doc, "updated", leftMargin + 80, legendY);
            drawChangeBadge(doc, "deleted", leftMargin + 160, legendY);
            currentY = legendY + 25;

            // === CREATED ITEMS ===
            if (createdItems.length > 0) {
                currentY = drawSectionHeader(doc, `CREATED (${createdItems.length})`, currentY, leftMargin, pageWidth);

                for (const activity of createdItems) {
                    const content = activity.description || `New ${activity.entityType} added`;
                    currentY = drawContentBox(doc, leftMargin, currentY, pageWidth, content, "created", activity.entityType);
                }
            }

            // === UPDATED ITEMS (Side by side comparison) ===
            if (updatedItems.length > 0) {
                currentY = drawSectionHeader(doc, `UPDATED (${updatedItems.length})`, currentY, leftMargin, pageWidth);

                for (const activity of updatedItems) {
                    if (activity.field && (activity.oldValue !== undefined || activity.newValue !== undefined)) {
                        // Show side-by-side comparison
                        currentY = drawComparisonBox(
                            doc,
                            leftMargin,
                            currentY,
                            pageWidth,
                            activity.oldValue || "(empty)",
                            activity.newValue || "(empty)",
                            `${activity.entityType} - ${activity.field}`
                        );
                    } else {
                        // Just show the description
                        const bottomY = doc.page.height - doc.page.margins.bottom;
                        if (currentY + 50 > bottomY) {
                            doc.addPage();
                            currentY = doc.page.margins.top;
                        }

                        doc.rect(leftMargin, currentY, pageWidth, 35)
                           .fillAndStroke(PDF_COLORS.lightOrange, PDF_COLORS.border);
                        doc.rect(leftMargin, currentY, 4, 35).fill(PDF_COLORS.updated);

                        doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.updated)
                           .text(activity.entityType.toUpperCase(), leftMargin + 12, currentY + 6);
                        doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text)
                           .text(activity.description, leftMargin + 12, currentY + 18, { width: pageWidth - 24 });

                        currentY += 42;
                    }
                }
            }

            // === DELETED ITEMS ===
            if (deletedItems.length > 0) {
                currentY = drawSectionHeader(doc, `DELETED (${deletedItems.length})`, currentY, leftMargin, pageWidth);

                for (const activity of deletedItems) {
                    const content = activity.description || `${activity.entityType} removed`;
                    currentY = drawContentBox(doc, leftMargin, currentY, pageWidth, content, "deleted", activity.entityType);
                }
            }
        } else {
            // No changes - this is the first version or no comparison available
            currentY = drawSectionHeader(doc, "VERSION CHANGES", currentY, leftMargin, pageWidth);

            const bottomY = doc.page.height - doc.page.margins.bottom;
            if (currentY + 40 > bottomY) {
                doc.addPage();
                currentY = doc.page.margins.top;
            }

            doc.rect(leftMargin, currentY, pageWidth, 35).fillAndStroke("#f0f0f0", PDF_COLORS.border);
            doc.font("Helvetica").fontSize(9).fillColor(PDF_COLORS.muted)
               .text(previousVersionData ? "No changes detected from previous version" : "This is the first version - no previous version to compare",
                     leftMargin + 10, currentY + 12, { width: pageWidth - 20, align: "center" });
            currentY += 45;
        }

        // ============ CURRENT CONTENT SECTION ============
        // Only show this section if there's content to display
        const hasContent = (version.leadReturnResultIds?.length > 0) ||
                          (version.personIds?.length > 0) ||
                          (version.vehicleIds?.length > 0) ||
                          (version.timelineIds?.length > 0);

        if (hasContent) {
            currentY = drawSectionHeader(doc, "CURRENT VERSION CONTENT", currentY, leftMargin, pageWidth);
        }

        // Narratives
        if (version.leadReturnResultIds && version.leadReturnResultIds.length > 0) {
            const bottomY = doc.page.height - doc.page.margins.bottom;
            if (currentY + 30 > bottomY) {
                doc.addPage();
                currentY = doc.page.margins.top;
            }

            doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.primary)
               .text(`Narratives (${version.leadReturnResultIds.length})`, leftMargin, currentY);
            currentY += 15;

            version.leadReturnResultIds.forEach((result, idx) => {
                if (currentY + 60 > bottomY) {
                    doc.addPage();
                    currentY = doc.page.margins.top;
                }

                // Narrative box
                const narrativeText = result.leadReturnResult || 'N/A';
                doc.font("Helvetica").fontSize(8);
                const textHeight = doc.heightOfString(narrativeText, { width: pageWidth - 20 });
                const boxHeight = Math.max(textHeight + 30, 50);

                doc.rect(leftMargin, currentY, pageWidth, boxHeight).stroke(PDF_COLORS.border);

                // Header row
                doc.rect(leftMargin, currentY, pageWidth, 18).fill("#f8f9fa");
                doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.primary)
                   .text(`#${result.leadReturnId || idx + 1}`, leftMargin + 8, currentY + 5);
                doc.font("Helvetica").fontSize(7).fillColor(PDF_COLORS.muted)
                   .text(`${formatDateForPdf(result.enteredDate)} | ${result.enteredBy || 'N/A'}`, leftMargin + 60, currentY + 5);

                // Content
                doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text)
                   .text(narrativeText, leftMargin + 8, currentY + 22, { width: pageWidth - 16 });

                currentY += boxHeight + 8;
            });
        }

        // Persons summary
        if (version.personIds && version.personIds.length > 0) {
            const bottomY = doc.page.height - doc.page.margins.bottom;
            if (currentY + 30 > bottomY) {
                doc.addPage();
                currentY = doc.page.margins.top;
            }

            doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.primary)
               .text(`Persons (${version.personIds.length})`, leftMargin, currentY);
            currentY += 15;

            version.personIds.forEach((person, idx) => {
                if (currentY + 25 > bottomY) {
                    doc.addPage();
                    currentY = doc.page.margins.top;
                }
                doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text)
                   .text(`• ${person.firstName || ''} ${person.lastName || ''} ${person.cellNumber ? '| ' + person.cellNumber : ''} ${person.personType ? '| ' + person.personType : ''}`, leftMargin + 5, currentY);
                currentY += 14;
            });
            currentY += 10;
        }

        // Vehicles summary
        if (version.vehicleIds && version.vehicleIds.length > 0) {
            const bottomY = doc.page.height - doc.page.margins.bottom;
            if (currentY + 30 > bottomY) {
                doc.addPage();
                currentY = doc.page.margins.top;
            }

            doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.primary)
               .text(`Vehicles (${version.vehicleIds.length})`, leftMargin, currentY);
            currentY += 15;

            version.vehicleIds.forEach((vehicle, idx) => {
                if (currentY + 25 > bottomY) {
                    doc.addPage();
                    currentY = doc.page.margins.top;
                }
                doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text)
                   .text(`• ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.plate ? '| Plate: ' + vehicle.plate : ''} ${vehicle.vin ? '| VIN: ' + vehicle.vin : ''}`, leftMargin + 5, currentY);
                currentY += 14;
            });
            currentY += 10;
        }

        // Timeline summary
        if (version.timelineIds && version.timelineIds.length > 0) {
            const bottomY = doc.page.height - doc.page.margins.bottom;
            if (currentY + 30 > bottomY) {
                doc.addPage();
                currentY = doc.page.margins.top;
            }

            doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.primary)
               .text(`Timeline Events (${version.timelineIds.length})`, leftMargin, currentY);
            currentY += 15;

            version.timelineIds.forEach((event, idx) => {
                if (currentY + 25 > bottomY) {
                    doc.addPage();
                    currentY = doc.page.margins.top;
                }
                doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.muted)
                   .text(formatDateForPdf(event.eventDate), leftMargin + 5, currentY, { continued: true, width: 60 });
                doc.fillColor(PDF_COLORS.text)
                   .text(` ${event.eventDescription || 'N/A'}`, { width: pageWidth - 70 });
                currentY += 14;
            });
            currentY += 10;
        }

        // Footer on each page
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);

            // Footer line
            doc.strokeColor('#999999').lineWidth(0.5)
               .moveTo(leftMargin, 730).lineTo(leftMargin + pageWidth, 730).stroke();

            // Footer text - use explicit coordinates for each to avoid page creation
            doc.fontSize(8).fillColor('#666666');
            doc.text(`Generated: ${new Date().toLocaleString()}`, leftMargin, 740, { lineBreak: false });
            doc.text(`Page ${i + 1} of ${pages.count}`, leftMargin + pageWidth - 80, 740, { lineBreak: false });
            doc.text('PIMS - Lead Version History', leftMargin + 180, 740, { lineBreak: false });
        }

        // Finalize PDF
        doc.end();

        console.log('✅ PDF generated successfully');

    } catch (error) {
        console.error("❌ Error generating PDF:", error.message);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate PDF"
        });
    }
});

module.exports = router;
