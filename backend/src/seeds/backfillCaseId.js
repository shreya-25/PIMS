/**
 * backfillCaseId.js
 *
 * One-time migration: for every LR document that has a caseNo string but
 * caseId is null/missing, look up the matching Case document and populate caseId.
 *
 * Usage (from the backend/ directory):
 *   node src/seeds/backfillCaseId.js
 *
 * Safe to re-run — it only touches documents where caseId is null.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { dbConnect } = require("../config/dbConnect");

const Case = require("../models/case");
const LeadReturnResult = require("../models/leadReturnResult");
const LeadReturn       = require("../models/leadreturn");
const LRAudio          = require("../models/LRAudio");
const LREnclosure      = require("../models/LREnclosure");
const LREvidence       = require("../models/LREvidence");
const LRPerson         = require("../models/LRPerson");
const LRPicture        = require("../models/LRPicture");
const LRScratchpad     = require("../models/LRScratchpad");
const LRTimeline       = require("../models/LRTimeline");
const LRVehicle        = require("../models/LRVehicle");
const LRVideo          = require("../models/LRVideo");

const MODELS = [
  { name: "LeadReturnResult", model: LeadReturnResult },
  { name: "LeadReturn",       model: LeadReturn },
  { name: "LRAudio",          model: LRAudio },
  { name: "LREnclosure",      model: LREnclosure },
  { name: "LREvidence",       model: LREvidence },
  { name: "LRPerson",         model: LRPerson },
  { name: "LRPicture",        model: LRPicture },
  { name: "LRScratchpad",     model: LRScratchpad },
  { name: "LRTimeline",       model: LRTimeline },
  { name: "LRVehicle",        model: LRVehicle },
  { name: "LRVideo",          model: LRVideo },
];

async function backfillModel({ name, model }) {
  // Find all docs that are missing caseId but have a caseNo to look up from
  const docs = await model
    .find({ caseId: null, caseNo: { $exists: true, $ne: null, $ne: "" } })
    .select("_id caseNo")
    .lean();

  if (docs.length === 0) {
    console.log(`  ${name}: nothing to backfill`);
    return;
  }

  // Build a set of unique caseNo values and fetch all matching Cases in one query
  const caseNos = [...new Set(docs.map((d) => d.caseNo).filter(Boolean))];
  const cases = await Case.find({ caseNo: { $in: caseNos } })
    .select("_id caseNo")
    .lean();

  const caseMap = new Map(cases.map((c) => [c.caseNo, c._id]));

  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const caseId = caseMap.get(doc.caseNo);
    if (!caseId) {
      console.warn(`  ${name} [${doc._id}]: no Case found for caseNo="${doc.caseNo}" — skipped`);
      skipped++;
      continue;
    }
    await model.updateOne({ _id: doc._id }, { $set: { caseId } });
    updated++;
  }

  console.log(`  ${name}: ${updated} updated, ${skipped} skipped (no matching Case)`);
}

async function run() {
  await dbConnect();
  console.log("Starting caseId backfill...\n");

  for (const entry of MODELS) {
    await backfillModel(entry);
  }

  console.log("\nBackfill complete.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
