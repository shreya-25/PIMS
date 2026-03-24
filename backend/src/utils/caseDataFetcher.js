const Lead = require("../models/lead");
const LeadReturnResult = require("../models/leadReturnResult");
const LRPerson = require("../models/LRPerson");
const LRVehicle = require("../models/LRVehicle");
const LREnclosure = require("../models/LREnclosure");
const LREvidence = require("../models/LREvidence");
const LRPicture = require("../models/LRPicture");
const LRAudio = require("../models/LRAudio");
const LRVideo = require("../models/LRVideo");
const LRScratchpad = require("../models/LRScratchpad");
const LRTimeline = require("../models/LRTimeline");

/**
 * Fetch all leads + nested sub-collection data for a case, server-side.
 * Makes 11 batch queries total (1 leads + 10 sub-collections), then
 * groups results in memory to build the shape the PDF code expects.
 *
 * @param {string} caseId   MongoDB ObjectId of the case
 * @param {object} [options]
 * @param {string} [options.reportScope]       "all" | "selected"
 * @param {{ start: number, end: number }} [options.subsetRange]
 * @param {number[]} [options.leadNos]         cherry-picked lead numbers
 * @returns {Promise<object[]>} leadsData shaped for PDF generation
 */
async function fetchCaseLeadsData(caseId, options = {}) {
    // Build lead filter
    const leadFilter = { caseId, isDeleted: { $ne: true } };

    if (Array.isArray(options.leadNos) && options.leadNos.length > 0) {
        leadFilter.leadNo = { $in: options.leadNos.map(Number) };
    } else if (options.subsetRange) {
        const start = Number(options.subsetRange.start);
        const end = Number(options.subsetRange.end);
        if (Number.isFinite(start) && Number.isFinite(end)) {
            leadFilter.leadNo = { $gte: start, $lte: end };
        }
    }

    const leads = await Lead.find(leadFilter).sort({ leadNo: 1 }).lean();
    if (leads.length === 0) return [];

    const leadNos = leads.map(l => l.leadNo);

    // Shared filter for sub-collections
    const subFilter = { caseId, leadNo: { $in: leadNos }, isDeleted: { $ne: true } };

    // 10 batch queries in parallel
    const [results, persons, vehicles, enclosures, evidence, pictures, audio, videos, scratchpads, timelines] =
        await Promise.all([
            LeadReturnResult.find(subFilter).sort({ leadNo: 1, leadReturnId: 1 }).lean(),
            LRPerson.find(subFilter).lean(),
            LRVehicle.find(subFilter).lean(),
            LREnclosure.find(subFilter).lean(),
            LREvidence.find(subFilter).lean(),
            LRPicture.find(subFilter).lean(),
            LRAudio.find(subFilter).lean(),
            LRVideo.find(subFilter).lean(),
            LRScratchpad.find({ ...subFilter, type: "Lead" }).lean(),
            LRTimeline.find(subFilter).lean(),
        ]);

    // Group sub-collections by "leadNo|leadReturnId"
    function groupByKey(arr) {
        const map = new Map();
        for (const item of arr) {
            const key = `${item.leadNo}|${item.leadReturnId || ""}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(item);
        }
        return map;
    }

    const personsByKey = groupByKey(persons);
    const vehiclesByKey = groupByKey(vehicles);
    const enclosuresByKey = groupByKey(enclosures);
    const evidenceByKey = groupByKey(evidence);
    const picturesByKey = groupByKey(pictures);
    const audioByKey = groupByKey(audio);
    const videosByKey = groupByKey(videos);
    const scratchpadsByKey = groupByKey(scratchpads);
    const timelinesByKey = groupByKey(timelines);

    // Group results by leadNo
    const resultsByLead = new Map();
    for (const r of results) {
        const key = String(r.leadNo);
        if (!resultsByLead.has(key)) resultsByLead.set(key, []);
        resultsByLead.get(key).push(r);
    }

    // Assemble the leadsData shape expected by PDF generation code
    return leads.map(lead => {
        const lrResults = resultsByLead.get(String(lead.leadNo)) || [];

        const leadReturns = lrResults.map(lrr => {
            const key = `${lead.leadNo}|${lrr.leadReturnId}`;
            return {
                ...lrr,
                persons: personsByKey.get(key) || [],
                vehicles: vehiclesByKey.get(key) || [],
                enclosures: enclosuresByKey.get(key) || [],
                evidence: evidenceByKey.get(key) || [],
                pictures: picturesByKey.get(key) || [],
                audio: audioByKey.get(key) || [],
                videos: videosByKey.get(key) || [],
                scratchpad: scratchpadsByKey.get(key) || [],
                timeline: timelinesByKey.get(key) || [],
            };
        });

        return { ...lead, leadReturns };
    });
}

module.exports = { fetchCaseLeadsData };
