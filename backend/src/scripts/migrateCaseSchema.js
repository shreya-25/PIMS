/**
 * Migrates cases from old schema (assignedOfficers with usernames)
 * to new schema (ObjectId references: caseManagerUserId, etc.)
 *
 * Usage:  node backend/src/scripts/migrateCaseSchema.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI not set"); process.exit(1); }

// Extract username from formats like "Shreya Agarwal (shreya123)" or plain "shreya123"
function extractUsername(name) {
    if (!name) return null;
    const match = name.match(/\(([^)]+)\)/);
    return (match ? match[1] : name).trim().toLowerCase();
}

function mapStatus(oldStatus) {
    if (!oldStatus) return "ONGOING";
    const s = oldStatus.toLowerCase();
    if (s === "ongoing") return "ONGOING";
    if (s === "completed" || s === "closed") return "COMPLETED";
    if (s === "archived") return "ARCHIVED";
    return "ONGOING";
}

async function migrate() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db();

        // Build username → _id lookup
        const users = await db.collection("users").find({}).project({ username: 1 }).toArray();
        const userMap = {};
        for (const u of users) {
            userMap[u.username.toLowerCase()] = u._id;
        }
        console.log(`Loaded ${users.length} users.\n`);

        const cases = await db.collection("cases").find({}).toArray();
        console.log(`Found ${cases.length} cases to migrate.\n`);

        let migrated = 0, skipped = 0;

        for (const c of cases) {
            // Skip if already migrated (has caseManagerUserId)
            if (c.caseManagerUserId) {
                console.log(`  [SKIP] ${c.caseNo} "${c.caseName}" — already has new schema fields`);
                skipped++;
                continue;
            }

            const officers = c.assignedOfficers || [];

            // Find Case Manager, Detective Supervisor, and Investigators
            let caseManagerId = null;
            let dsId = null;
            const investigatorIds = [];

            for (const off of officers) {
                const username = extractUsername(off.name);
                if (!username) continue;
                const userId = userMap[username];
                if (!userId) {
                    console.warn(`    [WARN] User "${off.name}" (${username}) not found in users collection`);
                    continue;
                }

                if (off.role === "Case Manager" && !caseManagerId) {
                    caseManagerId = userId;
                } else if (off.role === "Detective Supervisor" && !dsId) {
                    dsId = userId;
                } else if (off.role === "Investigator") {
                    investigatorIds.push(userId);
                }
            }

            // Fallback: if no Case Manager found, use first officer or first user in DB
            if (!caseManagerId) {
                const firstOfficer = officers[0];
                if (firstOfficer) {
                    const username = extractUsername(firstOfficer.name);
                    caseManagerId = username ? userMap[username] : null;
                }
                if (!caseManagerId) {
                    caseManagerId = users[0]._id;
                    console.warn(`    [WARN] ${c.caseNo} — no Case Manager found, defaulting to ${users[0].username}`);
                }
            }

            // createdByUserId: use case manager as fallback
            const createdByUserId = caseManagerId;

            const update = {
                $set: {
                    caseManagerUserId: caseManagerId,
                    detectiveSupervisorUserId: dsId,
                    investigatorUserIds: investigatorIds,
                    createdByUserId: createdByUserId,
                    status: mapStatus(c.caseStatus),
                    isDeleted: c.isDeleted || false,
                },
                $unset: {
                    assignedOfficers: "",
                    caseStatus: "",
                    caseSummary: "",
                    executiveCaseSummary: "",
                }
            };

            await db.collection("cases").updateOne({ _id: c._id }, update);
            console.log(`  [OK]   ${c.caseNo} "${c.caseName}" — CM: ${caseManagerId}, DS: ${dsId}, investigators: ${investigatorIds.length}`);
            migrated++;
        }

        console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        await client.close();
    }
}

migrate();
