/**
 * Migrates leads from old schema to new schema:
 * - Adds assignedByUserId from assignedBy username
 * - Adds userId to each assignedTo entry
 * - Adds primaryInvestigatorUserId from primaryInvestigator
 * - Adds submittedByUserId from submittedBy
 * - Ensures caseId is a proper ObjectId
 *
 * Usage:  node backend/src/scripts/migrateLeadSchema.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI not set"); process.exit(1); }

async function migrate() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db();

        // Build username → _id lookup (case-insensitive)
        const users = await db.collection("users").find({}).project({ username: 1 }).toArray();
        const userMap = {};
        for (const u of users) {
            userMap[u.username.toLowerCase()] = u._id;
        }
        console.log(`Loaded ${users.length} users.\n`);

        const leads = await db.collection("leads").find({}).toArray();
        console.log(`Found ${leads.length} leads to migrate.\n`);

        let migrated = 0, skipped = 0;

        for (const lead of leads) {
            // Skip if already migrated
            if (lead.assignedByUserId) {
                skipped++;
                continue;
            }

            const updates = {};

            // assignedByUserId from assignedBy username
            if (lead.assignedBy) {
                const uid = userMap[lead.assignedBy.toLowerCase()];
                if (uid) updates.assignedByUserId = uid;
            }

            // primaryInvestigatorUserId from primaryInvestigator username
            if (lead.primaryInvestigator) {
                const uid = userMap[lead.primaryInvestigator.toLowerCase()];
                if (uid) updates.primaryInvestigatorUserId = uid;
            }

            // submittedByUserId from submittedBy username
            if (lead.submittedBy) {
                const uid = userMap[lead.submittedBy.toLowerCase()];
                if (uid) updates.submittedByUserId = uid;
            }

            // Ensure caseId is an ObjectId
            if (lead.caseId && typeof lead.caseId === "string") {
                try {
                    updates.caseId = new ObjectId(lead.caseId);
                } catch (e) { /* keep as-is if not valid */ }
            }

            // Add userId to each assignedTo entry
            if (Array.isArray(lead.assignedTo)) {
                const updatedAssignees = lead.assignedTo.map(a => {
                    if (a.userId) return a; // already has it
                    const uid = a.username ? userMap[a.username.toLowerCase()] : null;
                    return { ...a, userId: uid || null };
                });
                updates.assignedTo = updatedAssignees;
            }

            // Add userId refs to events
            if (Array.isArray(lead.events)) {
                const updatedEvents = lead.events.map(ev => {
                    const updated = { ...ev };
                    if (ev.by && !ev.byUserId) {
                        updated.byUserId = userMap[ev.by.toLowerCase()] || null;
                    }
                    if (ev.primaryInvestigator && !ev.primaryInvestigatorUserId) {
                        updated.primaryInvestigatorUserId = userMap[ev.primaryInvestigator.toLowerCase()] || null;
                    }
                    if (Array.isArray(ev.to) && !ev.toUserIds) {
                        updated.toUserIds = ev.to.map(u => userMap[u.toLowerCase()] || null).filter(Boolean);
                    }
                    return updated;
                });
                updates.events = updatedEvents;
            }

            if (Object.keys(updates).length === 0) {
                skipped++;
                continue;
            }

            await db.collection("leads").updateOne({ _id: lead._id }, { $set: updates });
            console.log(`  [OK] Lead ${lead.leadNo} (case ${lead.caseNo})`);
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
