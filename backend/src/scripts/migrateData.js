/**
 * Migration script: copies all collections from the old MongoDB to the new one.
 *
 * Usage:
 *   node backend/src/scripts/migrateData.js           (skip existing)
 *   node backend/src/scripts/migrateData.js --force    (drop & re-copy)
 *
 * It reads OLD_MONGO_URI and MONGO_URI from backend/.env
 * - OLD_MONGO_URI = source (the commented-out connection)
 * - MONGO_URI     = destination (your current connection)
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { MongoClient } = require("mongodb");

const OLD_MONGO_URI = process.env.OLD_MONGO_URI;
const NEW_MONGO_URI = process.env.MONGO_URI;
const FORCE = process.argv.includes("--force");

if (!OLD_MONGO_URI || !NEW_MONGO_URI) {
    console.error("ERROR: Set both OLD_MONGO_URI and MONGO_URI in backend/.env");
    process.exit(1);
}

async function migrate() {
    const oldClient = new MongoClient(OLD_MONGO_URI);
    const newClient = new MongoClient(NEW_MONGO_URI);

    try {
        await oldClient.connect();
        await newClient.connect();
        console.log("Connected to both databases.\n");

        const oldDb = oldClient.db();          // uses DB name from URI
        const newDb = newClient.db();

        console.log(`Source DB : ${oldDb.databaseName}`);
        console.log(`Target DB : ${newDb.databaseName}\n`);

        const collections = await oldDb.listCollections().toArray();
        console.log(`Found ${collections.length} collections to migrate.\n`);

        for (const colInfo of collections) {
            const name = colInfo.name;

            // Skip system collections
            if (name.startsWith("system.")) continue;

            const oldCol = oldDb.collection(name);
            const newCol = newDb.collection(name);

            const count = await oldCol.countDocuments();
            if (count === 0) {
                console.log(`  [SKIP] ${name} — 0 documents`);
                continue;
            }

            // Check if target already has data
            const existingCount = await newCol.countDocuments();
            if (existingCount > 0) {
                if (!FORCE) {
                    console.log(`  [WARN] ${name} — target already has ${existingCount} docs, skipping (use --force to overwrite)`);
                    continue;
                }
                console.log(`  [DROP] ${name} — dropping ${existingCount} existing docs (--force)`);
                await newCol.drop();
            }

            // Batch insert in chunks of 500
            const BATCH = 500;
            let inserted = 0;
            const cursor = oldCol.find();

            let batch = [];
            while (await cursor.hasNext()) {
                const doc = await cursor.next();
                batch.push(doc);
                if (batch.length >= BATCH) {
                    await newCol.insertMany(batch, { ordered: false });
                    inserted += batch.length;
                    batch = [];
                }
            }
            if (batch.length > 0) {
                await newCol.insertMany(batch, { ordered: false });
                inserted += batch.length;
            }

            console.log(`  [OK]   ${name} — ${inserted} documents copied`);
        }

        // Copy indexes
        console.log("\nCopying indexes...");
        for (const colInfo of collections) {
            const name = colInfo.name;
            if (name.startsWith("system.")) continue;

            const oldCol = oldDb.collection(name);
            const newCol = newDb.collection(name);

            const indexes = await oldCol.indexes();
            for (const idx of indexes) {
                if (idx.name === "_id_") continue; // default index, always exists
                try {
                    const { key, ...opts } = idx;
                    delete opts.v;
                    delete opts.ns;
                    await newCol.createIndex(key, opts);
                } catch (err) {
                    // Index may already exist or conflict — not fatal
                    if (!err.message.includes("already exists")) {
                        console.warn(`    [WARN] ${name}.${idx.name}: ${err.message}`);
                    }
                }
            }
        }

        console.log("\nMigration complete!");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        await oldClient.close();
        await newClient.close();
    }
}

migrate();
