/**
 * Script to manually create a snapshot for a lead in a specific case
 * Usage: node src/scripts/createSnapshotByCase.js <leadNo> <caseNo>
 */

const mongoose = require('mongoose');
require('dotenv').config();
const LeadReturn = require('../models/leadreturn');
const { createSnapshot } = require('../utils/leadReturnVersioning');

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

const createSnapshotForLeadInCase = async (leadNo, caseNo) => {
    try {
        const parsedLeadNo = parseInt(leadNo);
        if (isNaN(parsedLeadNo)) {
            throw new Error('Invalid lead number');
        }

        console.log(`\n🔍 Looking for Lead ${parsedLeadNo} in case ${caseNo}...`);

        // Find the SPECIFIC lead in the SPECIFIC case
        const leadReturn = await LeadReturn.findOne({
            leadNo: parsedLeadNo,
            caseNo: caseNo
        });

        if (!leadReturn) {
            throw new Error(`Lead ${parsedLeadNo} not found in case ${caseNo}`);
        }

        console.log('✅ Found lead:');
        console.log('   leadNo:', leadReturn.leadNo);
        console.log('   caseNo:', leadReturn.caseNo);
        console.log('   caseName:', leadReturn.caseName);
        console.log('   description:', leadReturn.description);

        console.log(`\n📸 Creating snapshot...`);

        // Pass caseNo and caseName to ensure correct lead is snapshotted
        const snapshot = await createSnapshot(
            parsedLeadNo,
            'System',
            'Manual Snapshot',
            caseNo,  // Pass the case number
            leadReturn.caseName  // Pass the case name from the lead we found
        );

        console.log('\n✅ Snapshot created successfully!');
        console.log('Snapshot details:', {
            versionId: snapshot.versionId,
            leadNo: snapshot.leadNo,
            caseNo: snapshot.caseNo,
            caseName: snapshot.caseName,
            versionReason: snapshot.versionReason,
            createdAt: snapshot.versionCreatedAt
        });

        return snapshot;
    } catch (error) {
        console.error('❌ Error creating snapshot:', error);
        throw error;
    }
};

// Main execution
(async () => {
    const leadNo = process.argv[2];
    const caseNo = process.argv[3];

    if (!leadNo || !caseNo) {
        console.error('❌ Usage: node createSnapshotByCase.js <leadNo> <caseNo>');
        console.error('   Example: node src/scripts/createSnapshotByCase.js 2 INC-2025008');
        console.error('   Example: node src/scripts/createSnapshotByCase.js 3 INC-2025008');
        process.exit(1);
    }

    await connectDB();
    await createSnapshotForLeadInCase(leadNo, caseNo);
    await mongoose.connection.close();
    console.log('\n✅ Done. Database connection closed.');
    process.exit(0);
})();
