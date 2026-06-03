#!/usr/bin/env node
/**
 * purge-case.js
 * Permanently deletes every database record for a given case across all collections.
 *
 * Usage:
 *   node scripts/purge-case.js --caseNo "CASE-001" --caseName "Operation Blue"
 *
 * Flags:
 *   --caseNo   <value>   (required) The case number to purge
 *   --caseName <value>   (required) The case name to purge
 *   --confirm            Skip the interactive confirmation prompt
 *   --dry-run            Only print record counts; do not delete anything
 *
 * Examples:
 *   # See what would be deleted (safe, no changes):
 *   node scripts/purge-case.js --caseNo "CASE-001" --caseName "Operation Blue" --dry-run
 *
 *   # Interactive — will ask "Are you sure?" before deleting:
 *   node scripts/purge-case.js --caseNo "CASE-001" --caseName "Operation Blue"
 *
 *   # Non-interactive (CI / automation):
 *   node scripts/purge-case.js --caseNo "CASE-001" --caseName "Operation Blue" --confirm
 */

"use strict";

const path     = require("path");
const readline = require("readline");

// ── Load .env from the backend root ──────────────────────────────────────────
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");

// ─── Parse CLI args ───────────────────────────────────────────────────────────
function parseArgs() {
  const args  = process.argv.slice(2);
  const out   = { caseNo: null, caseName: null, confirm: false, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--confirm")  { out.confirm = true; continue; }
    if (a === "--dry-run")  { out.dryRun  = true; continue; }
    if ((a === "--caseNo"   || a === "--caseno")   && args[i + 1]) { out.caseNo   = args[++i]; continue; }
    if ((a === "--caseName" || a === "--casename") && args[i + 1]) { out.caseName = args[++i]; continue; }
  }
  return out;
}

// ─── Confirmation prompt ──────────────────────────────────────────────────────
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ─── Coloured console helpers ─────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  grey:   "\x1b[90m",
};
const bold   = (s) => `${C.bold}${s}${C.reset}`;
const red    = (s) => `${C.red}${s}${C.reset}`;
const green  = (s) => `${C.green}${s}${C.reset}`;
const yellow = (s) => `${C.yellow}${s}${C.reset}`;
const cyan   = (s) => `${C.cyan}${s}${C.reset}`;
const grey   = (s) => `${C.grey}${s}${C.reset}`;

// ─── Collection registry ──────────────────────────────────────────────────────
// Each entry: { label, collectionName, query(caseNo, caseName) }
// query() returns the Mongoose filter to match records for this case.
// Collections that use caseId as String (GeneratedReport) also match via caseNo.
// Collection names are taken directly from the third argument of mongoose.model()
// where an explicit name was provided, otherwise Mongoose lowercases + pluralises
// the model name automatically.
//
//   Case                 → "cases"               (auto)
//   Lead                 → "leads"               (explicit: "leads")
//   LeadReturn           → "LeadReturns"         (explicit)
//   LeadReturnResult     → "LeadReturnResults"   (explicit)
//   CompleteleadReturn   → "CompleteleadReturns" (explicit)
//   Notification         → "notifications"       (auto)
//   Comment              → "Comments"            (explicit)
//   AuditLog             → "auditlogs"           (auto)
//   LeadReturnAuditLog   → "leadreturnauditlogs" (auto)
//   LRAudio              → "LRAudios"            (explicit)
//   LRPerson             → "LRPersons"           (explicit)
//   LRVehicle            → "LRVehicles"          (explicit)
//   LREvidence           → "LREvidences"         (explicit)
//   LRTimeline           → "LRTimelines"         (explicit)
//   LREnclosure          → "LREnclosures"        (explicit)
//   LRScratchpad         → "LRScratchpads"       (explicit)
//   LRPicture            → "LRPictures"          (explicit)
//   LRVideo              → "LRVideos"            (explicit)
//   GeneratedReport      → "generatedreports"    (auto)

// query(caseNo, caseName) — every collection is filtered by BOTH fields.
// Exception: LeadReturnAuditLog has no caseName field, so it is filtered by caseNo only.
const COLLECTIONS = [
  { label: "Cases",                collectionName: "cases",                query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "Leads",                collectionName: "leads",                query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LeadReturns",          collectionName: "LeadReturns",          query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LeadReturnResults",    collectionName: "LeadReturnResults",    query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "CompleteLeadReturns",  collectionName: "CompleteleadReturns",  query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "Notifications",        collectionName: "notifications",        query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "Comments",             collectionName: "Comments",             query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "AuditLogs",            collectionName: "auditlogs",            query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LeadReturnAuditLogs",  collectionName: "leadreturnauditlogs",  query: (n      ) => ({ caseNo: String(n)                         }) }, // no caseName field
  { label: "LR — Audio",           collectionName: "LRAudios",             query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LR — Persons",         collectionName: "LRPersons",            query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LR — Vehicles",        collectionName: "LRVehicles",           query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LR — Evidence",        collectionName: "LREvidences",          query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LR — Timelines",       collectionName: "LRTimelines",          query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LR — Enclosures",      collectionName: "LREnclosures",         query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LR — Scratchpads",     collectionName: "LRScratchpads",        query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LR — Pictures",        collectionName: "LRPictures",           query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "LR — Videos",          collectionName: "LRVideos",             query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
  { label: "GeneratedReports",     collectionName: "generatedreports",     query: (n, name) => ({ caseNo: String(n), caseName: String(name) }) },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { caseNo, caseName, confirm, dryRun } = parseArgs();

  // ── Validate inputs ──────────────────────────────────────────────────────
  if (!caseNo || !caseName) {
    console.error(red("\n  ERROR: Both --caseNo and --caseName are required.\n"));
    console.error(`  Usage: node scripts/purge-case.js --caseNo "CASE-001" --caseName "Operation Blue"\n`);
    process.exit(1);
  }

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error(red("\n  ERROR: MONGO_URI is not set in backend/.env\n"));
    process.exit(1);
  }

  // ── Header ───────────────────────────────────────────────────────────────
  console.log("");
  console.log(bold("═══════════════════════════════════════════════════"));
  console.log(bold("       PIMS — Case Purge Script"));
  console.log(bold("═══════════════════════════════════════════════════"));
  console.log(`  Case No  : ${cyan(caseNo)}`);
  console.log(`  Case Name: ${cyan(caseName)}`);
  console.log(`  Mode     : ${dryRun ? yellow("DRY RUN (no changes)") : red("LIVE DELETE")}`);
  console.log(bold("═══════════════════════════════════════════════════\n"));

  // ── Connect ──────────────────────────────────────────────────────────────
  console.log(grey("  Connecting to MongoDB…"));
  await mongoose.connect(MONGO_URI);
  console.log(green("  Connected.\n"));

  const db = mongoose.connection.db;

  // ── Count phase: show how many records exist per collection ──────────────
  console.log(bold("  Record counts for this case:\n"));

  const rows = [];
  let grandTotal = 0;

  for (const col of COLLECTIONS) {
    const filter = col.query(caseNo, caseName);
    const count  = await db.collection(col.collectionName).countDocuments(filter);
    grandTotal  += count;
    rows.push({ label: col.label, count });
  }

  const maxLabelLen = Math.max(...rows.map(r => r.label.length));
  for (const { label, count } of rows) {
    const pad     = " ".repeat(maxLabelLen - label.length + 2);
    const countStr = count === 0 ? grey(String(count).padStart(4)) : yellow(String(count).padStart(4));
    console.log(`    ${label}${pad}${countStr}  records`);
  }

  console.log("");
  console.log(bold(`  Total: ${grandTotal === 0 ? grey(grandTotal) : red(grandTotal)} record(s) found\n`));

  if (grandTotal === 0) {
    console.log(green("  Nothing to delete. Exiting.\n"));
    await mongoose.disconnect();
    return;
  }

  // ── Exit early for dry-run ────────────────────────────────────────────────
  if (dryRun) {
    console.log(yellow("  DRY RUN complete — no data was modified.\n"));
    await mongoose.disconnect();
    return;
  }

  // ── Confirmation ─────────────────────────────────────────────────────────
  if (!confirm) {
    console.log(red(bold("  ⚠  WARNING: This action is IRREVERSIBLE.")));
    console.log(`  All ${bold(grandTotal)} records for case ${cyan(caseNo)} ("${cyan(caseName)}")`);
    console.log("  will be permanently deleted from the database.\n");

    const answer = await askConfirmation(
      `  Type ${bold("yes")} to proceed, anything else to cancel: `
    );

    if (answer !== "yes") {
      console.log("\n  Cancelled. No data was deleted.\n");
      await mongoose.disconnect();
      return;
    }
    console.log("");
  }

  // ── Delete phase ──────────────────────────────────────────────────────────
  console.log(bold("  Deleting…\n"));

  let totalDeleted = 0;
  const summary    = [];

  for (const col of COLLECTIONS) {
    const filter  = col.query(caseNo, caseName);
    const result  = await db.collection(col.collectionName).deleteMany(filter);
    const deleted = result.deletedCount;
    totalDeleted += deleted;

    const pad     = " ".repeat(maxLabelLen - col.label.length + 2);
    const delStr  = deleted === 0
      ? grey(`${String(deleted).padStart(4)}  deleted`)
      : green(`${String(deleted).padStart(4)}  deleted`);

    console.log(`    ${col.label}${pad}${delStr}`);
    summary.push({ label: col.label, deleted });
  }

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log("");
  console.log(bold("═══════════════════════════════════════════════════"));
  console.log(green(bold(`  ✔  Done. ${totalDeleted} record(s) permanently deleted.`)));
  console.log(`     Case No  : ${cyan(caseNo)}`);
  console.log(`     Case Name: ${cyan(caseName)}`);
  console.log(bold("═══════════════════════════════════════════════════\n"));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(red(`\n  FATAL: ${err.message}\n`));
  mongoose.disconnect().finally(() => process.exit(1));
});
