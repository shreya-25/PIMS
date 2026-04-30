/**
 * Migration: assign assignedCaseManagerUserId to all existing cases that don't have one.
 * Sets it to the first entry in caseManagerUserIds.
 *
 * Run from the backend directory:
 *   node scripts/assignCaseManagerMigration.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌  MONGO_URI not found in .env");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    retryWrites: false,
  });
  console.log("✅  Connected to MongoDB");

  const Case = require("../src/models/case");

  // Find all cases that have no assigned case manager but do have at least one case manager
  const cases = await Case.find({
    assignedCaseManagerUserId: { $in: [null, undefined] },
    caseManagerUserIds: { $exists: true, $not: { $size: 0 } },
  }).lean();

  console.log(`Found ${cases.length} case(s) needing migration.`);

  let updated = 0;
  let skipped = 0;

  for (const c of cases) {
    const firstCM = c.caseManagerUserIds[0];
    if (!firstCM) { skipped++; continue; }

    await Case.updateOne(
      { _id: c._id },
      { $set: { assignedCaseManagerUserId: firstCM } }
    );
    console.log(`  ✔  Case ${c.caseNo} → assigned to manager ID ${firstCM}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped (no managers): ${skipped}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌  Migration failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
