/**
 * Script to manually create a snapshot for a lead with correct case information
 * Usage: node src/scripts/createManualSnapshot.js <leadNo>
 */

const mongoose = require('mongoose');
require('dotenv').config();
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

const createManualSnapshotForLead = async (leadNo) => {
    try {
        const parsedLeadNo = parseInt(leadNo);
        if (isNaN(parsedLeadNo)) {
            throw new Error('Invalid lead number');
        }

        console.log(`\n📸 Creating manual snapshot for Lead ${parsedLeadNo}...`);

        const snapshot = await createSnapshot(
            parsedLeadNo,
            'System',
            'Manual Snapshot'
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

    if (!leadNo) {
        console.error('❌ Usage: node createManualSnapshot.js <leadNo>');
        console.error('   Example: node src/scripts/createManualSnapshot.js 2');
        process.exit(1);
    }

    await connectDB();
    await createManualSnapshotForLead(leadNo);
    await mongoose.connection.close();
    console.log('\n✅ Done. Database connection closed.');
    process.exit(0);
})();
