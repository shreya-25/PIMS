/**
 * reportSaveController.js
 *
 * Handles the "save to Azure, fetch on click" report workflow:
 *
 *   POST /api/report/triggerSave
 *     – Checks whether a ready report already exists for the given caseId.
 *       If yes  → returns { status: "ready",     reportId }
 *       If none → starts async generation, returns { status: "generating", reportId }
 *
 *   GET  /api/report/status/:reportId
 *     – Returns { status, reportId } for polling.
 *
 *   GET  /api/report/url/:reportId
 *     – Returns a short-lived signed Azure URL for the saved PDF.
 *
 *   DELETE /api/report/savedReport/:caseId
 *     – Invalidates the cached report so the next trigger forces regeneration.
 */

const GeneratedReport      = require("../models/GeneratedReport");
const { buildCaseReportBufferPerLead } = require("./leadreportCaseController .js");
const { fetchCaseLeadsData }           = require("../utils/caseDataFetcher");
const { uploadBufferToS3, getFileFromS3, deleteFromS3 } = require("../s3");
const Case = require("../models/case");
const User = require("../models/userModel");
const LRPicture = require("../models/LRPicture");

// ─────────────────────────────────────────────────────────────────────────────
// Internal: fetch all data and build + upload the PDF for a GeneratedReport doc
// ─────────────────────────────────────────────────────────────────────────────
async function runReportGeneration(reportDoc, {
  caseId, leadNos, summaryMode, caseSummary, user, reportTimestamp,
}) {
  try {
    // Fetch lead data from DB (server-side, fresh)
    const leadsData = await fetchCaseLeadsData(caseId, {
      leadNos: Array.isArray(leadNos) && leadNos.length ? leadNos.map(Number) : undefined,
    });

    if (!leadsData || leadsData.length === 0) {
      reportDoc.status = "failed";
      reportDoc.error  = "No leads found for this case";
      await reportDoc.save();
      return;
    }

    const caseNo   = leadsData[0]?.caseNo   || "";
    const caseName = leadsData[0]?.caseName || "";

    // Fetch characterOfCase
    const caseDoc = await Case.findById(caseId).select("characterOfCase").lean();
    const characterOfCase = caseDoc?.characterOfCase || "";

    // Build userMap
    const allUsernames = [
      ...new Set([
        ...leadsData.flatMap((l) =>
          (l.assignedTo || []).map((a) => (typeof a === "string" ? a : a?.username))
        ).filter(Boolean),
        ...leadsData.flatMap((l) =>
          (l.leadReturns || []).map((r) => r?.enteredBy).filter(Boolean)
        ),
      ]),
    ];
    const usersFound = await User.find({ username: { $in: allUsernames } })
      .select("username firstName lastName title")
      .lean();
    const userMap = Object.fromEntries(usersFound.map((u) => [u.username, u]));

    // Re-fetch pictures from DB so s3Keys are current
    const allLeadNos = leadsData.map((l) => Number(l.leadNo)).filter(Number.isFinite);
    const dbPictures = await LRPicture.find({
      caseId,
      leadNo: { $in: allLeadNos },
      isDeleted: { $ne: true },
    }).lean();
    const picMap = new Map();
    for (const pic of dbPictures) {
      const key = `${pic.leadNo}|${pic.leadReturnId}`;
      if (!picMap.has(key)) picMap.set(key, []);
      picMap.get(key).push(pic);
    }
    for (const lead of leadsData) {
      for (const lr of lead.leadReturns || []) {
        const key = `${Number(lead.leadNo)}|${lr.leadReturnId}`;
        const fresh = picMap.get(key);
        if (fresh !== undefined) lr.pictures = fresh;
      }
    }

    // Generate the PDF (per-lead structure)
    const pdfBuffer = await buildCaseReportBufferPerLead({
      leadsData,
      user:            user || "System",
      reportTimestamp: reportTimestamp || new Date().toLocaleString("en-US"),
      caseSummary:     caseSummary || "",
      summaryMode:     summaryMode || "none",
      caseNo,
      caseName,
      characterOfCase,
      userMap,
      includeAll: true,
    });

    // Upload to Azure Blob Storage
    const { key: s3Key } = await uploadBufferToS3({
      buffer:  pdfBuffer,
      prefix:  `reports/${caseId}`,
      mimetype: "application/pdf",
    });

    // Mark report as ready
    reportDoc.s3Key       = s3Key;
    reportDoc.status      = "ready";
    reportDoc.caseNo      = caseNo;
    reportDoc.caseName    = caseName;
    reportDoc.generatedAt = new Date();
    await reportDoc.save();
  } catch (err) {
    console.error("Background report generation failed:", err);
    reportDoc.status = "failed";
    reportDoc.error  = err?.message || "Unknown error";
    await reportDoc.save();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/report/triggerSave
// ─────────────────────────────────────────────────────────────────────────────
async function triggerSaveReport(req, res) {
  try {
    const {
      caseId,
      leadNos,
      summaryMode   = "none",
      caseSummary   = "",
      reportTimestamp,
    } = req.body;

    if (!caseId) {
      return res.status(400).json({ error: "caseId is required" });
    }

    const user = req.user?.username || req.body.user || "Unknown";

    // Check for an existing ready or in-progress report
    const existing = await GeneratedReport.findOne({
      caseId,
      reportType: "full",
      status: { $in: ["ready", "generating"] },
    }).sort({ createdAt: -1 }).lean();

    if (existing) {
      return res.json({ status: existing.status, reportId: existing._id });
    }

    // Create a new GeneratedReport record
    const reportDoc = new GeneratedReport({
      caseId,
      reportType:  "full",
      status:      "generating",
      summaryMode: summaryMode || "none",
      generatedBy: user,
      leadNos:     Array.isArray(leadNos) ? leadNos.map(Number) : [],
    });
    await reportDoc.save();

    // Respond immediately — generation runs in the background
    res.json({ status: "generating", reportId: reportDoc._id });

    // Fire-and-forget background generation
    runReportGeneration(reportDoc, {
      caseId,
      leadNos,
      summaryMode,
      caseSummary,
      user,
      reportTimestamp: reportTimestamp || new Date().toLocaleString("en-US"),
    }).catch((err) => {
      console.error("Uncaught error in runReportGeneration:", err);
    });
  } catch (err) {
    console.error("triggerSaveReport error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to start report generation" });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/report/status/:reportId
// ─────────────────────────────────────────────────────────────────────────────
async function getSavedReportStatus(req, res) {
  try {
    const { reportId } = req.params;
    const report = await GeneratedReport.findById(reportId).lean();
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json({
      status:     report.status,
      reportId:   report._id,
      generatedAt: report.generatedAt,
      error:      report.error || null,
    });
  } catch (err) {
    console.error("getSavedReportStatus error:", err);
    res.status(500).json({ error: "Failed to get report status" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/report/url/:reportId
// Returns a short-lived signed Azure URL for the saved PDF.
// ─────────────────────────────────────────────────────────────────────────────
async function getSavedReportUrl(req, res) {
  try {
    const { reportId } = req.params;
    const report = await GeneratedReport.findById(reportId).lean();

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    if (report.status !== "ready" || !report.s3Key) {
      return res.status(400).json({ error: "Report is not ready yet", status: report.status });
    }

    const url = await getFileFromS3(report.s3Key);
    res.json({ url, reportId: report._id, generatedAt: report.generatedAt });
  } catch (err) {
    console.error("getSavedReportUrl error:", err);
    res.status(500).json({ error: "Failed to get report URL" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/report/savedReport/:caseId
// Invalidates cached reports for the case (forces next trigger to regenerate).
// ─────────────────────────────────────────────────────────────────────────────
async function deleteSavedReport(req, res) {
  try {
    const { caseId } = req.params;
    if (!caseId) {
      return res.status(400).json({ error: "caseId is required" });
    }

    const reports = await GeneratedReport.find({ caseId, reportType: "full" }).lean();

    // Delete blobs from Azure then remove DB records
    for (const r of reports) {
      if (r.s3Key) {
        try { await deleteFromS3(r.s3Key); } catch (_) {}
      }
    }
    await GeneratedReport.deleteMany({ caseId, reportType: "full" });

    res.json({ message: "Saved reports cleared. Next generation will create a fresh report." });
  } catch (err) {
    console.error("deleteSavedReport error:", err);
    res.status(500).json({ error: "Failed to delete saved report" });
  }
}

module.exports = {
  triggerSaveReport,
  getSavedReportStatus,
  getSavedReportUrl,
  deleteSavedReport,
};
