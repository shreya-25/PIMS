#!/usr/bin/env node
/**
 * purge-user.js
 * Permanently removes a user from the system and cleans up all references.
 *
 * Usage:
 *   node scripts/purge-user.js --email "user@example.com"
 *
 * Flags:
 *   --email <value>   (required) Email address of the user to remove
 *   --dry-run         Only show what would be changed; make no modifications
 *   --confirm         Skip the interactive confirmation prompt
 *
 * Examples:
 *   # Preview what will be changed (safe):
 *   node scripts/purge-user.js --email "alice@example.com" --dry-run
 *
 *   # Interactive (will ask "Are you sure?"):
 *   node scripts/purge-user.js --email "alice@example.com"
 *
 *   # Non-interactive (CI / automation):
 *   node scripts/purge-user.js --email "alice@example.com" --confirm
 */

"use strict";

const path     = require("path");
const readline = require("readline");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const User         = require("../src/models/userModel");
const Case         = require("../src/models/case");
const Notification = require("../src/models/notification");
const Lead         = require("../src/models/lead");
const LeadReturn   = require("../src/models/leadreturn");
const LeadReturnResult = require("../src/models/leadReturnResult");
const LRPerson     = require("../src/models/LRPerson");
const LRVehicle    = require("../src/models/LRVehicle");
const LRTimeline   = require("../src/models/LRTimeline");
const LREvidence   = require("../src/models/LREvidence");
const LRPicture    = require("../src/models/LRPicture");
const LRAudio      = require("../src/models/LRAudio");
const LRVideo      = require("../src/models/LRVideo");
const LREnclosure  = require("../src/models/LREnclosure");
const LRScratchpad = require("../src/models/LRScratchpad");
const CompleteleadReturn = require("../src/models/CompleteleadReturn");

// ── Colours ───────────────────────────────────────────────────────────────────
const C = { reset:"\x1b[0m", bold:"\x1b[1m", red:"\x1b[31m", green:"\x1b[32m", yellow:"\x1b[33m", cyan:"\x1b[36m", grey:"\x1b[90m" };
const bold   = s => `${C.bold}${s}${C.reset}`;
const red    = s => `${C.red}${s}${C.reset}`;
const green  = s => `${C.green}${s}${C.reset}`;
const yellow = s => `${C.yellow}${s}${C.reset}`;
const cyan   = s => `${C.cyan}${s}${C.reset}`;
const grey   = s => `${C.grey}${s}${C.reset}`;

// ── CLI args ──────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const out  = { email: null, confirm: false, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--confirm") { out.confirm = true; continue; }
    if (args[i] === "--dry-run") { out.dryRun  = true; continue; }
    if (args[i] === "--email" && args[i + 1]) { out.email = args[++i]; continue; }
  }
  return out;
}

function askConfirmation(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => { rl.close(); resolve(answer.trim().toLowerCase()); });
  });
}

// ── Count helper ──────────────────────────────────────────────────────────────
async function count(Model, filter) {
  try { return await Model.countDocuments(filter); }
  catch { return 0; }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const { email, confirm, dryRun } = parseArgs();

  if (!email) {
    console.error(red("\n  ERROR: --email is required.\n"));
    console.error("  Usage: node scripts/purge-user.js --email \"user@example.com\"\n");
    process.exit(1);
  }

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error(red("\n  ERROR: MONGO_URI not set in backend/.env\n"));
    process.exit(1);
  }

  console.log("");
  console.log(bold("═══════════════════════════════════════════════════════════"));
  console.log(bold("         PIMS — User Purge Script"));
  console.log(bold("═══════════════════════════════════════════════════════════"));
  console.log(`  Email : ${cyan(email)}`);
  console.log(`  Mode  : ${dryRun ? yellow("DRY RUN (no changes)") : red("LIVE DELETE")}`);
  console.log(bold("═══════════════════════════════════════════════════════════\n"));

  console.log(grey("  Connecting to MongoDB…"));
  await mongoose.connect(MONGO_URI);
  console.log(green("  Connected.\n"));

  // ── Look up the user ──────────────────────────────────────────────────────
  const user = await User.findOne({ email: email.trim().toLowerCase() }).lean();
  if (!user) {
    console.error(red(`  ERROR: No user found with email "${email}"\n`));
    await mongoose.disconnect();
    process.exit(1);
  }

  const uid      = user._id;
  const username = user.username;
  const oidStr   = uid.toString();

  console.log(bold("  User found:"));
  console.log(`    Username    : ${cyan(username)}`);
  console.log(`    Display Name: ${cyan(user.displayName || "(none)")}`);
  console.log(`    Role        : ${cyan(user.role)}`);
  console.log(`    Active      : ${cyan(String(user.isActive))}`);
  console.log(`    MongoDB _id : ${grey(oidStr)}\n`);

  // ── Count phase ───────────────────────────────────────────────────────────
  console.log(bold("  Records referencing this user:\n"));

  const caseRoleFilter = {
    $or: [
      { caseManagerUserIds:           uid },
      { detectiveSupervisorUserId:    uid },
      { detectiveSupervisorUserIds:   uid },
      { investigatorUserIds:          uid },
      { officerUserIds:               uid },
      { readOnlyUserIds:              uid },
      { blockedUserIds:               uid },
      { assignedCaseManagerUserId:    uid },
      { createdByUserId:              uid },
    ],
  };

  const notifAssignedFilter = {
    $or: [
      { "assignedTo.userId":   uid },
      { "assignedTo.username": username },
    ],
  };

  const leadFilter = {
    $or: [
      { primaryInvestigatorUserId: uid },
      { assignedByUserId:          uid },
      { submittedByUserId:         uid },
      { deletedByUserId:           uid },
      { "assignedTo.userId":       uid },
      { "assignedTo.username":     username },
    ],
  };

  const lrFilter = {
    $or: [
      { assignedByUserId:    uid },
      { assignedToUserIds:   uid },
      { deletedByUserId:     uid },
      { "assignedTo.assignees": username },
    ],
  };

  const lrResultFilter = {
    $or: [
      { enteredByUserId:  uid },
      { deletedByUserId:  uid },
    ],
  };

  const lrSubFilter = lrResultFilter; // same shape for all LR* models

  const rows = [
    { label: "User account",               value: 1                                                               },
    { label: "Cases (in role arrays)",     value: await count(Case,         caseRoleFilter)                      },
    { label: "Notifications (assigned to)",value: await count(Notification, notifAssignedFilter)                 },
    { label: "Leads (referenced)",         value: await count(Lead,         leadFilter)                          },
    { label: "Lead Returns",               value: await count(LeadReturn,   lrFilter)                            },
    { label: "Lead Return Results",        value: await count(LeadReturnResult, lrResultFilter)                  },
    { label: "LR — Persons",               value: await count(LRPerson,     lrSubFilter)                         },
    { label: "LR — Vehicles",              value: await count(LRVehicle,    lrSubFilter)                         },
    { label: "LR — Timelines",             value: await count(LRTimeline,   lrSubFilter)                         },
    { label: "LR — Evidence",              value: await count(LREvidence,   lrSubFilter)                         },
    { label: "LR — Pictures",              value: await count(LRPicture,    lrSubFilter)                         },
    { label: "LR — Audio",                 value: await count(LRAudio,      lrSubFilter)                         },
    { label: "LR — Video",                 value: await count(LRVideo,      lrSubFilter)                         },
    { label: "LR — Enclosures",            value: await count(LREnclosure,  lrSubFilter)                         },
    { label: "LR — Scratchpads",           value: await count(LRScratchpad, lrSubFilter)                         },
  ];

  const maxLen = Math.max(...rows.map(r => r.label.length));
  for (const { label, value } of rows) {
    const pad = " ".repeat(maxLen - label.length + 2);
    const val = value === 0 ? grey(String(value).padStart(4)) : yellow(String(value).padStart(4));
    console.log(`    ${label}${pad}${val}`);
  }

  // Warn if user is the ONLY manager or DS on any case
  const soloManagerCases = await Case.find({
    caseManagerUserIds: uid,
    $expr: { $eq: [{ $size: "$caseManagerUserIds" }, 1] },
  }, "caseNo caseName").lean();
  const soloDSCases = await Case.find({
    detectiveSupervisorUserIds: uid,
    $expr: { $eq: [{ $size: "$detectiveSupervisorUserIds" }, 1] },
  }, "caseNo caseName").lean();

  if (soloManagerCases.length > 0) {
    console.log("");
    console.log(yellow("  ⚠  Warning: this user is the SOLE Case Manager on:"));
    soloManagerCases.forEach(c => console.log(`       ${cyan(c.caseNo)} — ${c.caseName}`));
    console.log(yellow("     These cases will have no Case Manager after removal."));
  }

  if (dryRun) {
    console.log(yellow("\n  DRY RUN complete — no data was modified.\n"));
    await mongoose.disconnect();
    return;
  }

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (!confirm) {
    console.log("");
    console.log(red(bold("  ⚠  WARNING: This action is IRREVERSIBLE.")));
    console.log(`  User ${cyan(username)} (${cyan(email)}) will be permanently deleted.`);
    console.log("  All role assignments and notification entries will be removed.\n");

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

  // ── Delete / clean-up phase ───────────────────────────────────────────────
  console.log(bold("  Processing…\n"));

  const summary = [];

  function log(label, n) {
    const pad = " ".repeat(Math.max(1, maxLen - label.length + 2));
    const val = n === 0
      ? grey(`${String(n).padStart(4)}  records`)
      : green(`${String(n).padStart(4)}  records`);
    console.log(`    ${label}${pad}${val}`);
    summary.push({ label, n });
  }

  // 1. Delete the user document
  await User.deleteOne({ _id: uid });
  log("User account deleted", 1);

  // 2. Remove user from all case role arrays + clear assignedCaseManager
  const caseRes = await Case.updateMany(
    { $or: [
      { caseManagerUserIds:           uid },
      { detectiveSupervisorUserId:    uid },
      { detectiveSupervisorUserIds:   uid },
      { investigatorUserIds:          uid },
      { officerUserIds:               uid },
      { readOnlyUserIds:              uid },
      { blockedUserIds:               uid },
      { assignedCaseManagerUserId:    uid },
    ]},
    {
      $pull: {
        caseManagerUserIds:         uid,
        detectiveSupervisorUserIds: uid,
        investigatorUserIds:        uid,
        officerUserIds:             uid,
        readOnlyUserIds:            uid,
        blockedUserIds:             uid,
      },
      $unset: {
        // Only clear these scalar refs if they point at this user
        // (Mongoose $unset always runs; we re-set below for non-matching docs)
      },
    }
  );
  // Clear scalar refs on matching docs
  await Case.updateMany(
    { detectiveSupervisorUserId:  uid }, { $unset: { detectiveSupervisorUserId: "" } }
  );
  await Case.updateMany(
    { assignedCaseManagerUserId:  uid }, { $unset: { assignedCaseManagerUserId: "" } }
  );
  log("Cases (role arrays cleaned)", caseRes.modifiedCount);

  // 3. Notifications — pull the user's entry from assignedTo
  //    Then delete any notification whose assignedTo is now empty
  const notifPull = await Notification.updateMany(
    { $or: [
      { "assignedTo.userId":   uid },
      { "assignedTo.username": username },
    ]},
    {
      $pull: {
        assignedTo: {
          $or: [
            { userId: uid },
            { username },
          ],
        },
      },
    }
  );
  const notifEmpty = await Notification.deleteMany({ assignedTo: { $size: 0 } });
  log("Notifications (entry removed)", notifPull.modifiedCount);
  if (notifEmpty.deletedCount > 0) {
    log("Notifications (deleted — no recipients left)", notifEmpty.deletedCount);
  }

  // 4. Leads — null out ObjectId refs; pull from assignedTo array
  const leadPull = await Lead.updateMany(
    { "assignedTo.userId": uid },
    { $pull: { assignedTo: { userId: uid } } }
  );
  await Lead.updateMany({ "assignedTo.username": username }, {
    $pull: { assignedTo: { username } }
  });
  await Lead.updateMany({ primaryInvestigatorUserId: uid }, {
    $unset: { primaryInvestigatorUserId: "" }
  });
  await Lead.updateMany({ assignedByUserId: uid }, {
    $unset: { assignedByUserId: "" }
  });
  await Lead.updateMany({ submittedByUserId: uid }, {
    $unset: { submittedByUserId: "" }
  });
  await Lead.updateMany({ deletedByUserId: uid }, {
    $unset: { deletedByUserId: "" }
  });
  log("Leads (references cleared)", leadPull.modifiedCount);

  // 5. Lead Returns
  const lrPull = await LeadReturn.updateMany(
    { assignedToUserIds: uid },
    { $pull: { assignedToUserIds: uid } }
  );
  await LeadReturn.updateMany({ assignedByUserId: uid }, {
    $unset: { assignedByUserId: "" }
  });
  await LeadReturn.updateMany({ deletedByUserId: uid }, {
    $unset: { deletedByUserId: "" }
  });
  log("Lead Returns (references cleared)", lrPull.modifiedCount);

  // 6. Lead Return Results
  const lrrRes = await LeadReturnResult.updateMany(
    { $or: [{ enteredByUserId: uid }, { deletedByUserId: uid }] },
    { $unset: { enteredByUserId: "", deletedByUserId: "" } }
  );
  log("Lead Return Results (references cleared)", lrrRes.modifiedCount);

  // 7. All LR* sub-document models — null out enteredByUserId / deletedByUserId
  const lrModels = [
    ["LR — Persons",     LRPerson],
    ["LR — Vehicles",    LRVehicle],
    ["LR — Timelines",   LRTimeline],
    ["LR — Evidence",    LREvidence],
    ["LR — Pictures",    LRPicture],
    ["LR — Audio",       LRAudio],
    ["LR — Video",       LRVideo],
    ["LR — Enclosures",  LREnclosure],
    ["LR — Scratchpads", LRScratchpad],
  ];
  for (const [label, Model] of lrModels) {
    const r = await Model.updateMany(
      { $or: [{ enteredByUserId: uid }, { deletedByUserId: uid }] },
      { $unset: { enteredByUserId: "", deletedByUserId: "" } }
    );
    if (r.modifiedCount > 0) log(label + " (references cleared)", r.modifiedCount);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("");
  console.log(bold("═══════════════════════════════════════════════════════════"));
  console.log(green(bold(`  ✔  Done. User "${username}" permanently removed.`)));
  console.log(`     Email : ${cyan(email)}`);
  console.log(`     _id   : ${grey(oidStr)}`);
  console.log(bold("═══════════════════════════════════════════════════════════\n"));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(red(`\n  FATAL: ${err.message}\n`));
  console.error(err.stack);
  mongoose.disconnect().finally(() => process.exit(1));
});
