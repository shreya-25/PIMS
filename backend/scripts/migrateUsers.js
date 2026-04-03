/**
 * migrateUsers.js
 * Patches all existing user documents to add fields introduced in the new schema.
 * Safe to run multiple times — only sets fields that are missing (uses $exists: false).
 *
 * Run from the backend directory:
 *   node scripts/migrateUsers.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not found in .env");
  process.exit(1);
}

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const users = db.collection("users");

  const all = await users.find({}).toArray();
  console.log(`Found ${all.length} user(s) to process`);

  let updated = 0;

  for (const user of all) {
    const patch = {};

    // accountSetupComplete — most critical: missing = can't log in
    if (user.accountSetupComplete === undefined) {
      patch.accountSetupComplete = true;
    }

    // isActive
    if (user.isActive === undefined) {
      patch.isActive = true;
    }

    // mfaMethod
    if (!user.mfaMethod) {
      patch.mfaMethod = "email";
    }

    // totpEnabled
    if (user.totpEnabled === undefined) {
      patch.totpEnabled = false;
    }

    // emailDomain — derive from email
    if (!user.emailDomain && user.email && user.email.includes("@")) {
      patch.emailDomain = user.email.split("@")[1].toLowerCase();
    }

    // badgeId
    if (user.badgeId === undefined) {
      patch.badgeId = "";
    }

    // agency
    if (user.agency === undefined) {
      patch.agency = "";
    }

    // ori
    if (user.ori === undefined) {
      patch.ori = "";
    }

    // displayName — derive from firstName + lastName
    if (!user.displayName) {
      const fn = (user.firstName || "").trim();
      const ln = (user.lastName || "").trim();
      patch.displayName = `${fn} ${ln}`.trim() || user.username;
    }

    if (Object.keys(patch).length === 0) {
      console.log(`  ✓ ${user.username} — already up to date`);
      continue;
    }

    await users.updateOne({ _id: user._id }, { $set: patch });
    console.log(`  ✓ ${user.username} — patched: ${Object.keys(patch).join(", ")}`);
    updated++;
  }

  console.log(`\nDone. ${updated} user(s) updated.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
