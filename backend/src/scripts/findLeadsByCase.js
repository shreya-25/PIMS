/**
 * Script to find all leads in a specific case
 * Usage: node src/scripts/findLeadsByCase.js "Case Name"
 */

const mongoose = require('mongoose');
require('dotenv').config();
const LeadReturn = require('../models/leadreturn');

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

const findLeadsByCase = async (searchTerm) => {
    try {
        console.log(`🔍 SEARCHING FOR LEADS IN CASE: "${searchTerm}"\n`);
        console.log('='.repeat(60));

        // Search for leads matching the case name (case-insensitive partial match)
        const leads = await LeadReturn.find({
            $or: [
                { caseName: { $regex: searchTerm, $options: 'i' } },
                { caseNo: { $regex: searchTerm, $options: 'i' } }
            ]
        }).sort({ leadNo: 1 });

        if (leads.length === 0) {
            console.log(`\n❌ No leads found matching: "${searchTerm}"`);
            console.log('\nTrying to show all cases with leads...\n');

            // Show all unique cases
            const allLeads = await LeadReturn.find({}).select('caseNo caseName').lean();
            const uniqueCases = [...new Map(allLeads.map(l => [`${l.caseNo}|${l.caseName}`, l])).values()];

            console.log(`Found ${uniqueCases.length} unique cases:\n`);
            uniqueCases.forEach((c, idx) => {
                console.log(`${idx + 1}. ${c.caseNo} - ${c.caseName}`);
            });
        } else {
            console.log(`\n✅ Found ${leads.length} lead(s):\n`);

            leads.forEach((lead, idx) => {
                console.log(`Lead ${idx + 1}:`);
                console.log(`  leadNo: ${lead.leadNo}`);
                console.log(`  caseNo: ${lead.caseNo}`);
                console.log(`  caseName: ${lead.caseName}`);
                console.log(`  description: ${lead.description}`);
                console.log(`  status: ${lead.assignedTo?.lRStatus || 'N/A'}`);
                console.log(`  assigned to: ${lead.assignedTo?.assignees?.join(', ') || 'N/A'}`);
                console.log();
            });
        }

        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error searching leads:', error);
        throw error;
    }
};

// Main execution
(async () => {
    const searchTerm = process.argv[2];

    if (!searchTerm) {
        console.error('❌ Usage: node findLeadsByCase.js "Case Name or Case Number"');
        console.error('   Example: node src/scripts/findLeadsByCase.js "School Burgulary"');
        console.error('   Example: node src/scripts/findLeadsByCase.js "INC-2025008"');
        process.exit(1);
    }

    await connectDB();
    await findLeadsByCase(searchTerm);
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
})();
