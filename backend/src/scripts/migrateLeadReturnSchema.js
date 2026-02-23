/**
 * Migrates LeadReturns from old schema to new schema:
 * - Adds caseId, leadId (ObjectId refs) from caseNo/leadNo lookups
 * - Adds assignedByUserId, assignedToUserIds from username fields
 * - Adds returnNo (defaults to 1 for existing records)
 *
 * Usage:  node backend/src/scripts/migrateLeadReturnSchema.js
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

        // Build lookups
        const users = await db.collection("users").find({}).project({ username: 1 }).toArray();
        const userMap = {};
        for (const u of users) {
            userMap[u.username.toLowerCase()] = u._id;
        }

        const cases = await db.collection("cases").find({}).project({ caseNo: 1 }).toArray();
        const caseMap = {};
        for (const c of cases) {
            caseMap[c.caseNo] = c._id;
        }

        const leads = await db.collection("leads").find({}).project({ leadNo: 1, caseNo: 1 }).toArray();
        // key: "caseNo|leadNo" → _id
        const leadMap = {};
        for (const l of leads) {
            leadMap[`${l.caseNo}|${l.leadNo}`] = l._id;
        }

        console.log(`Loaded ${users.length} users, ${cases.length} cases, ${leads.length} leads.\n`);

        const leadReturns = await db.collection("LeadReturns").find({}).toArray();
        console.log(`Found ${leadReturns.length} LeadReturns to migrate.\n`);

        let migrated = 0, skipped = 0;

        for (const lr of leadReturns) {
            // Skip if already migrated
            if (lr.caseId && lr.leadId && lr.assignedByUserId) {
                skipped++;
                continue;
            }

            const updates = {};

            // caseId from caseNo
            if (!lr.caseId && lr.caseNo) {
                const cid = caseMap[lr.caseNo];
                if (cid) updates.caseId = cid;
            }

            // leadId from caseNo + leadNo
            if (!lr.leadId && lr.caseNo && lr.leadNo != null) {
                const lid = leadMap[`${lr.caseNo}|${lr.leadNo}`];
                if (lid) updates.leadId = lid;
            }

            // assignedByUserId from assignedBy.assignee
            if (!lr.assignedByUserId && lr.assignedBy?.assignee) {
                const uid = userMap[lr.assignedBy.assignee.toLowerCase()];
                if (uid) updates.assignedByUserId = uid;
            }

            // assignedToUserIds from assignedTo.assignees
            if ((!lr.assignedToUserIds || lr.assignedToUserIds.length === 0) && lr.assignedTo?.assignees) {
                updates.assignedToUserIds = lr.assignedTo.assignees
                    .map(u => userMap[u.toLowerCase()])
                    .filter(Boolean);
            }

            // returnNo — default to 1 if missing
            if (lr.returnNo == null) {
                updates.returnNo = 1;
            }

            if (Object.keys(updates).length === 0) {
                skipped++;
                continue;
            }

            await db.collection("LeadReturns").updateOne({ _id: lr._id }, { $set: updates });
            console.log(`  [OK] LR leadNo=${lr.leadNo} case=${lr.caseNo}`);
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
