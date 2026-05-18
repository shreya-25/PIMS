const { fetchCaseLeadsData } = require("../utils/caseDataFetcher");
const Case = require("../models/case");

// Model state: null = not started, Promise = loading, function = ready
let summarizerReady = null;
let summarizerFn    = null;

// Kick off model load in the background — doesn't block anything
function warmupSummarizer() {
  if (summarizerReady) return; // already loading or loaded
  summarizerReady = import("@xenova/transformers")
    .then(({ pipeline }) => pipeline("summarization", "Xenova/distilbart-cnn-12-6"))
    .then((fn) => { summarizerFn = fn; console.log("[Summary] AI model ready."); })
    .catch((err) => { console.warn("[Summary] AI model failed to load:", err.message); summarizerReady = null; });
}

// Start downloading the model immediately when the server starts
warmupSummarizer();

function fmt(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function buildNarrativeText(leadsData) {
  const chunks = [];
  for (const lead of leadsData) {
    if (lead.description?.trim()) chunks.push(lead.description.trim());
    if (lead.summary?.trim())     chunks.push(lead.summary.trim());
    for (const lr of lead.leadReturns || []) {
      if (lr.leadReturnResult?.trim()) chunks.push(lr.leadReturnResult.trim());
    }
  }
  return chunks.join(" ").replace(/\s+/g, " ").trim().slice(0, 3500);
}

async function generateCaseSummary(req, res) {
  try {
    const { caseId } = req.body;
    if (!caseId) return res.status(400).json({ error: "caseId is required" });

    const caseDoc = await Case.findById(caseId).lean();
    if (!caseDoc) return res.status(404).json({ error: "Case not found" });

    const leadsData = await fetchCaseLeadsData(caseId);

    // ── Stats ────────────────────────────────────────────────────────────────
    let totalPersons = 0, totalVehicles = 0, totalEvidence = 0,
        totalEnclosures = 0, totalAudio = 0, totalVideos = 0;
    const statusCounts = {};
    const investigatorSet = new Set();
    const dates = [];

    for (const lead of leadsData) {
      const status = lead.status || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const assigned = Array.isArray(lead.assignedTo) ? lead.assignedTo : [lead.assignedTo].filter(Boolean);
      assigned.forEach(a => { const u = typeof a === "string" ? a : a?.username; if (u) investigatorSet.add(u); });

      if (lead.enteredDate)      dates.push(new Date(lead.enteredDate));
      if (lead.lastModifiedDate) dates.push(new Date(lead.lastModifiedDate));

      for (const lr of lead.leadReturns || []) {
        totalPersons    += (lr.persons    || []).length;
        totalVehicles   += (lr.vehicles   || []).length;
        totalEvidence   += (lr.evidence   || []).length;
        totalEnclosures += (lr.enclosures || []).length;
        totalAudio      += (lr.audio      || []).length;
        totalVideos     += (lr.videos     || []).length;
        if (lr.enteredBy)   investigatorSet.add(lr.enteredBy);
        if (lr.enteredDate) dates.push(new Date(lr.enteredDate));
      }
    }

    const totalLeads     = leadsData.length;
    const openLeads      = (statusCounts["Open"] || 0) + (statusCounts["Assigned"] || 0);
    const closedLeads    = statusCounts["Closed"]    || 0;
    const submittedLeads = statusCounts["Submitted"] || 0;
    const totalReturns   = leadsData.reduce((s, l) => s + (l.leadReturns || []).length, 0);
    const investigators  = investigatorSet.size;

    const validDates = dates.filter(d => !isNaN(d)).sort((a, b) => a - b);
    const firstDate  = validDates.length ? fmt(validDates[0]) : null;
    const latestDate = validDates.length ? fmt(validDates[validDates.length - 1]) : null;

    const caseNo     = caseDoc.caseNo            || leadsData[0]?.caseNo   || "";
    const caseName   = caseDoc.caseName          || leadsData[0]?.caseName || "";
    const charOfCase = caseDoc.characterOfCase   || "";

    // ── AI summarization — only if model is already loaded ───────────────────
    warmupSummarizer();

    let aiParagraph = "";
    const narrativeText = buildNarrativeText(leadsData);

    console.log("[Summary] summarizerFn ready:", !!summarizerFn);
    console.log("[Summary] narrativeText length:", narrativeText.length);
    console.log("[Summary] narrativeText preview:", narrativeText.slice(0, 200));

    if (summarizerFn && narrativeText.length > 20) {
      try {
        console.log("[Summary] Running inference...");
        const [result] = await summarizerFn(narrativeText, {
          max_length: 120,
          min_length: 10,
          do_sample: false,
        });
        aiParagraph = result.summary_text?.trim() || "";
        console.log("[Summary] AI result:", aiParagraph);
      } catch (aiErr) {
        console.warn("[Summary] Inference failed:", aiErr.message);
      }
    }

    // ── Build output ─────────────────────────────────────────────────────────
    const lines = [];

    lines.push(`Case ${caseNo}${caseName ? ` – ${caseName}` : ""}${charOfCase ? ` (${charOfCase})` : ""}.`);
    lines.push("");

    if (firstDate && latestDate && firstDate !== latestDate) {
      lines.push(`Investigation activity spans from ${firstDate} to ${latestDate}.`);
    } else if (firstDate) {
      lines.push(`Investigation activity began on ${firstDate}.`);
    }

    lines.push(`This case contains ${plural(totalLeads, "lead")}${totalReturns ? `, with ${plural(totalReturns, "lead return")} filed` : ""}.`);

    const statusParts = [];
    if (openLeads)      statusParts.push(`${openLeads} open`);
    if (submittedLeads) statusParts.push(`${submittedLeads} pending review`);
    if (closedLeads)    statusParts.push(`${closedLeads} closed`);
    Object.entries(statusCounts)
      .filter(([s]) => !["Open", "Assigned", "Submitted", "Closed"].includes(s))
      .forEach(([s, n]) => statusParts.push(`${n} ${s.toLowerCase()}`));
    if (statusParts.length) lines.push(`Lead status breakdown: ${statusParts.join(", ")}.`);

    const entityParts = [];
    if (totalPersons)    entityParts.push(plural(totalPersons,    "person"));
    if (totalVehicles)   entityParts.push(plural(totalVehicles,   "vehicle"));
    if (totalEvidence)   entityParts.push(plural(totalEvidence,   "evidence item"));
    if (totalEnclosures) entityParts.push(plural(totalEnclosures, "enclosure"));
    if (totalAudio)      entityParts.push(plural(totalAudio,      "audio recording"));
    if (totalVideos)     entityParts.push(plural(totalVideos,     "video"));
    if (entityParts.length) lines.push(`Across all leads, investigators documented ${entityParts.join(", ")}.`);

    if (investigators) lines.push(`${plural(investigators, "investigator")} contributed to this case.`);

    if (aiParagraph) {
      lines.push("");
      lines.push("Narrative summary:");
      lines.push(aiParagraph);
    }

    lines.push("");
    lines.push("[Add any additional context, key findings, or conclusions here.]");

    return res.json({ summary: lines.join("\n") });

  } catch (err) {
    console.error("generateCaseSummary error:", err);
    return res.status(500).json({ error: "Failed to generate summary" });
  }
}

module.exports = { generateCaseSummary };
