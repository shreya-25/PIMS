/**
 * Script to fix case information mismatch in lead version snapshots
 * This updates all snapshots for a lead to match the lead's current case info
 *
 * Usage: node src/scripts/fixCaseMismatch.js <leadNo>
 */

const mongoose = require('mongoose');
require('dotenv').config();
const LeadReturn = require('../models/leadreturn');
const CompleteleadReturn = require('../models/CompleteleadReturn');

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const fixCaseMismatch = async (leadNo) => {
    try {
        const parsedLeadNo = parseInt(leadNo);
        if (isNaN(parsedLeadNo)) {
            throw new Error('Invalid lead number');
        }

        console.log(`\n🔍 Checking Lead ${parsedLeadNo}...`);

        // Get the current lead return
        const leadReturn = await LeadReturn.findOne({ leadNo: parsedLeadNo });
        if (!leadReturn) {
            throw new Error(`Lead ${parsedLeadNo} not found`);
        }

        console.log('Current lead info:', {
            leadNo: leadReturn.leadNo,
            caseNo: leadReturn.caseNo,
            caseName: leadReturn.caseName
        });

        // Get all snapshots for this lead (without case filter)
        const snapshots = await CompleteleadReturn.find({ leadNo: parsedLeadNo });
        console.log(`\nFound ${snapshots.length} snapshots for this lead`);

        if (snapshots.length === 0) {
            console.log('✅ No snapshots to fix');
            return;
        }

        // Check for mismatches
        const mismatched = snapshots.filter(s =>
            s.caseNo !== leadReturn.caseNo || s.caseName !== leadReturn.caseName
        );

        console.log(`\n⚠️ Found ${mismatched.length} snapshots with mismatched case info:`);
        mismatched.forEach(s => {
            console.log(`  - Version ${s.versionId}: ${s.caseNo} - ${s.caseName}`);
        });

        if (mismatched.length === 0) {
            console.log('✅ All snapshots already have correct case info');
            return;
        }

        // Ask for confirmation (in actual use, you might want to add a CLI prompt)
        console.log(`\n❓ Do you want to update all ${mismatched.length} snapshots to match the current lead's case info?`);
        console.log(`   Current case: ${leadReturn.caseNo} - ${leadReturn.caseName}`);
        console.log('   Run with --confirm flag to proceed\n');

        if (!process.argv.includes('--confirm')) {
            console.log('⚠️ Dry run mode. Add --confirm flag to actually update the snapshots.');
            return;
        }

        // Update all snapshots
        console.log('\n📝 Updating snapshots...');
        const result = await CompleteleadReturn.updateMany(
            { leadNo: parsedLeadNo },
            {
                $set: {
                    caseNo: leadReturn.caseNo,
                    caseName: leadReturn.caseName
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} snapshots`);
        console.log('\n✅ All snapshots now have correct case information!');

        return result;
    } catch (error) {
        console.error('❌ Error fixing case mismatch:', error);
        throw error;
    }
};

// Main execution
(async () => {
    const leadNo = process.argv[2];

    if (!leadNo) {
        console.error('❌ Usage: node fixCaseMismatch.js <leadNo> [--confirm]');
        console.error('   Example: node src/scripts/fixCaseMismatch.js 2');
        console.error('   Example: node src/scripts/fixCaseMismatch.js 2 --confirm (to actually update)');
        process.exit(1);
    }

    await connectDB();
    await fixCaseMismatch(leadNo);
    await mongoose.connection.close();
    console.log('\n✅ Done. Database connection closed.');
    process.exit(0);
})();
