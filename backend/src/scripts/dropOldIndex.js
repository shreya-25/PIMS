/**
 * Script to drop the old leadNo_versionId index that conflicts with new compound index
 * Usage: node src/scripts/dropOldIndex.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

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

const dropOldIndex = async () => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('CompleteleadReturns');

        console.log('\n📋 Listing current indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:');
        indexes.forEach(idx => {
            console.log('  -', idx.name, ':', JSON.stringify(idx.key));
        });

        // Check if the old index exists
        const hasOldIndex = indexes.some(idx => idx.name === 'leadNo_1_versionId_1');

        if (hasOldIndex) {
            console.log('\n🗑️ Dropping old index: leadNo_1_versionId_1');
            await collection.dropIndex('leadNo_1_versionId_1');
            console.log('✅ Old index dropped successfully!');
        } else {
            console.log('\n✅ Old index does not exist - nothing to drop');
        }

        console.log('\n📋 Final indexes:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach(idx => {
            console.log('  -', idx.name, ':', JSON.stringify(idx.key));
        });

    } catch (error) {
        console.error('❌ Error dropping index:', error);
        throw error;
    }
};

// Main execution
(async () => {
    await connectDB();
    await dropOldIndex();
    await mongoose.connection.close();
    console.log('\n✅ Done. Database connection closed.');
    process.exit(0);
})();
