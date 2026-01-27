/**
 * Diagnostic script to check lead and snapshot data
 * Usage: node src/scripts/debugLead.js <leadNo>
 */

const mongoose = require('mongoose');
require('dotenv').config();
const LeadReturn = require('../models/leadreturn');
const CompleteleadReturn = require('../models/CompleteleadReturn');

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const debugLead = async (leadNo) => {
    try {
        const parsedLeadNo = parseInt(leadNo);
        if (isNaN(parsedLeadNo)) {
            throw new Error('Invalid lead number');
        }

        console.log(`🔍 DEBUGGING LEAD ${parsedLeadNo}\n`);
        console.log('=' .repeat(60));

        // Check the lead return record
        console.log('\n1️⃣ LEAD RETURN RECORD:');
        console.log('-'.repeat(60));
        const leadReturn = await LeadReturn.findOne({ leadNo: parsedLeadNo });

        if (!leadReturn) {
            console.log('❌ Lead return NOT FOUND in database!');
            return;
        }

        console.log('✅ Lead return found:');
        console.log('   leadNo:', leadReturn.leadNo);
        console.log('   caseNo:', leadReturn.caseNo);
        console.log('   caseName:', leadReturn.caseName);
        console.log('   description:', leadReturn.description);
        console.log('   status:', leadReturn.assignedTo?.lRStatus);

        // Check all snapshots (without filter)
        console.log('\n2️⃣ ALL SNAPSHOTS FOR THIS LEAD (NO FILTER):');
        console.log('-'.repeat(60));
        const allSnapshots = await CompleteleadReturn.find({ leadNo: parsedLeadNo })
            .sort({ versionId: -1 })
            .select('versionId caseNo caseName versionReason versionCreatedAt isCurrentVersion');

        if (allSnapshots.length === 0) {
            console.log('❌ NO SNAPSHOTS found for this lead!');
        } else {
            console.log(`✅ Found ${allSnapshots.length} snapshots:`);
            allSnapshots.forEach((s, idx) => {
                console.log(`\n   Snapshot ${idx + 1}:`);
                console.log(`     versionId: ${s.versionId}`);
                console.log(`     caseNo: "${s.caseNo}"`);
                console.log(`     caseName: "${s.caseName}"`);
                console.log(`     reason: ${s.versionReason}`);
                console.log(`     current: ${s.isCurrentVersion}`);
                console.log(`     created: ${s.versionCreatedAt}`);
            });
        }

        // Check snapshots WITH case filter (matching lead return)
        console.log('\n3️⃣ SNAPSHOTS MATCHING LEAD\'S CASE INFO:');
        console.log('-'.repeat(60));
        const matchingSnapshots = await CompleteleadReturn.find({
            leadNo: parsedLeadNo,
            caseNo: leadReturn.caseNo,
            caseName: leadReturn.caseName
        }).sort({ versionId: -1 });

        if (matchingSnapshots.length === 0) {
            console.log('❌ NO MATCHING snapshots found!');
            console.log('\n⚠️ ISSUE DETECTED: Case info mismatch!');
            console.log('   Lead has:', { caseNo: leadReturn.caseNo, caseName: leadReturn.caseName });
            if (allSnapshots.length > 0) {
                console.log('   Snapshots have:', {
                    caseNo: allSnapshots[0].caseNo,
                    caseName: allSnapshots[0].caseName
                });
            }
        } else {
            console.log(`✅ Found ${matchingSnapshots.length} matching snapshots`);
            console.log('   Version IDs:', matchingSnapshots.map(s => s.versionId).join(', '));
        }

        // Character-by-character comparison if mismatch
        if (matchingSnapshots.length === 0 && allSnapshots.length > 0) {
            console.log('\n4️⃣ DETAILED CHARACTER COMPARISON:');
            console.log('-'.repeat(60));

            const leadCaseNo = leadReturn.caseNo || '';
            const leadCaseName = leadReturn.caseName || '';
            const snapCaseNo = allSnapshots[0].caseNo || '';
            const snapCaseName = allSnapshots[0].caseName || '';

            console.log('\ncaseNo comparison:');
            console.log(`  Lead:     "${leadCaseNo}" (length: ${leadCaseNo.length})`);
            console.log(`  Snapshot: "${snapCaseNo}" (length: ${snapCaseNo.length})`);
            console.log(`  Match: ${leadCaseNo === snapCaseNo ? '✅' : '❌'}`);

            console.log('\ncaseName comparison:');
            console.log(`  Lead:     "${leadCaseName}" (length: ${leadCaseName.length})`);
            console.log(`  Snapshot: "${snapCaseName}" (length: ${snapCaseName.length})`);
            console.log(`  Match: ${leadCaseName === snapCaseName ? '✅' : '❌'}`);

            // Show character-by-character diff
            if (leadCaseName !== snapCaseName) {
                console.log('\nCharacter-by-character caseName diff:');
                const maxLen = Math.max(leadCaseName.length, snapCaseName.length);
                for (let i = 0; i < maxLen; i++) {
                    const leadChar = leadCaseName[i] || '(end)';
                    const snapChar = snapCaseName[i] || '(end)';
                    const match = leadChar === snapChar ? '✓' : '✗';
                    console.log(`    [${i}] ${match} "${leadChar}" vs "${snapChar}"`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ Diagnosis complete!\n');

    } catch (error) {
        console.error('❌ Error during diagnosis:', error);
        throw error;
    }
};

// Main execution
(async () => {
    const leadNo = process.argv[2];

    if (!leadNo) {
        console.error('❌ Usage: node debugLead.js <leadNo>');
        console.error('   Example: node src/scripts/debugLead.js 2');
        process.exit(1);
    }

    await connectDB();
    await debugLead(leadNo);
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
})();
