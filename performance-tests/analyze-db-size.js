/**
 * PIMS Database Size Analysis Script
 * Analyzes MongoDB database size, collections, and growth patterns
 *
 * Usage: node analyze-db-size.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.COSMOS_URI;

if (!MONGO_URI) {
    console.error('Error: MONGO_URI or COSMOS_URI not found in environment variables');
    process.exit(1);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Print table
 */
function printTable(headers, rows) {
    const colWidths = headers.map((h, i) => {
        const maxRowWidth = Math.max(...rows.map(r => String(r[i]).length));
        return Math.max(h.length, maxRowWidth) + 2;
    });

    // Print header
    const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join('│');
    const separator = colWidths.map(w => '─'.repeat(w)).join('┼');

    console.log('┌' + separator.replace(/┼/g, '┬') + '┐');
    console.log('│' + headerLine + '│');
    console.log('├' + separator + '┤');

    // Print rows
    rows.forEach(row => {
        const rowLine = row.map((cell, i) => String(cell).padEnd(colWidths[i])).join('│');
        console.log('│' + rowLine + '│');
    });

    console.log('└' + separator.replace(/┼/g, '┴') + '┘');
}

/**
 * Analyze database
 */
async function analyzeDatabase() {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('  PIMS DATABASE SIZE ANALYSIS');
        console.log('='.repeat(70));
        console.log(`  Connecting to: ${MONGO_URI.replace(/\/\/(.+):(.+)@/, '//*****:*****@')}\n`);

        // Connect to database
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('  ✓ Connected to database\n');

        const db = mongoose.connection.db;
        const dbName = db.databaseName;

        // Get database stats
        const dbStats = await db.stats();

        console.log('─'.repeat(70));
        console.log('  DATABASE OVERVIEW');
        console.log('─'.repeat(70));
        console.log(`  Database Name:    ${dbName}`);
        console.log(`  Total Size:       ${formatBytes(dbStats.dataSize)}`);
        console.log(`  Storage Size:     ${formatBytes(dbStats.storageSize)}`);
        console.log(`  Index Size:       ${formatBytes(dbStats.indexSize)}`);
        console.log(`  Collections:      ${dbStats.collections}`);
        console.log(`  Indexes:          ${dbStats.indexes}`);
        console.log(`  Average Obj Size: ${formatBytes(dbStats.avgObjSize)}`);
        console.log('─'.repeat(70));

        // Get collection names
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log('\n  COLLECTIONS DETAIL\n');

        const tableData = [];
        let totalDocs = 0;
        let totalSize = 0;
        let totalIndexSize = 0;

        for (const collName of collectionNames) {
            try {
                const stats = await db.collection(collName).stats();

                const docCount = stats.count || 0;
                const size = stats.size || 0;
                const indexSize = stats.totalIndexSize || 0;
                const avgDocSize = docCount > 0 ? size / docCount : 0;

                totalDocs += docCount;
                totalSize += size;
                totalIndexSize += indexSize;

                tableData.push([
                    collName,
                    docCount.toLocaleString(),
                    formatBytes(size),
                    formatBytes(avgDocSize),
                    formatBytes(indexSize)
                ]);
            } catch (error) {
                // Skip system collections or collections with errors
                if (!collName.startsWith('system.')) {
                    console.log(`  ⚠️  Could not get stats for ${collName}: ${error.message}`);
                }
            }
        }

        // Sort by size (descending)
        tableData.sort((a, b) => {
            const sizeA = parseFloat(a[2]);
            const sizeB = parseFloat(b[2]);
            return sizeB - sizeA;
        });

        printTable(
            ['Collection', 'Documents', 'Size', 'Avg Doc Size', 'Index Size'],
            tableData
        );

        console.log('\n─'.repeat(70));
        console.log('  TOTALS');
        console.log('─'.repeat(70));
        console.log(`  Total Documents:  ${totalDocs.toLocaleString()}`);
        console.log(`  Total Data Size:  ${formatBytes(totalSize)}`);
        console.log(`  Total Index Size: ${formatBytes(totalIndexSize)}`);
        console.log(`  Combined Size:    ${formatBytes(totalSize + totalIndexSize)}`);
        console.log('─'.repeat(70));

        // Case analysis
        const casesCollection = db.collection('cases');
        const leadsCollection = db.collection('leads');
        const lrCollection = db.collection('completeleadreturns');

        const casesCount = await casesCollection.countDocuments();
        const leadsCount = await leadsCollection.countDocuments();
        const versionsCount = await lrCollection.countDocuments();

        console.log('\n─'.repeat(70));
        console.log('  CASE STATISTICS');
        console.log('─'.repeat(70));
        console.log(`  Total Cases:      ${casesCount.toLocaleString()}`);
        console.log(`  Total Leads:      ${leadsCount.toLocaleString()}`);
        console.log(`  Lead Versions:    ${versionsCount.toLocaleString()}`);

        if (casesCount > 0) {
            const leadsPerCase = (leadsCount / casesCount).toFixed(1);
            const versionsPerLead = leadsCount > 0 ? (versionsCount / leadsCount).toFixed(1) : 0;
            const sizePerCase = (totalSize / casesCount);

            console.log(`  Leads per Case:   ${leadsPerCase} (average)`);
            console.log(`  Versions per Lead: ${versionsPerLead} (average)`);
            console.log(`  Size per Case:    ${formatBytes(sizePerCase)} (average)`);

            console.log('─'.repeat(70));

            // Projections
            console.log('\n─'.repeat(70));
            console.log('  GROWTH PROJECTIONS');
            console.log('─'.repeat(70));

            const projections = [1000, 5000, 10000, 25000, 50000];
            const currentCases = casesCount;

            projections.forEach(targetCases => {
                if (targetCases > currentCases) {
                    const additionalCases = targetCases - currentCases;
                    const projectedSize = (additionalCases * sizePerCase);

                    console.log(`  +${additionalCases.toLocaleString()} cases (${targetCases.toLocaleString()} total):`);
                    console.log(`    Additional: ${formatBytes(projectedSize)}`);
                    console.log(`    Total DB:   ${formatBytes(totalSize + projectedSize)}`);
                }
            });

            console.log('─'.repeat(70));
        }

        // Storage recommendations
        console.log('\n─'.repeat(70));
        console.log('  STORAGE RECOMMENDATIONS');
        console.log('─'.repeat(70));

        const currentUsage = totalSize + totalIndexSize;
        const small = currentUsage * 2;
        const medium = currentUsage * 5;
        const large = currentUsage * 10;

        console.log(`  Current Usage:    ${formatBytes(currentUsage)}`);
        console.log(`  Small Deployment:  ${formatBytes(small)} (2x current, ~${(casesCount * 2).toLocaleString()} cases)`);
        console.log(`  Medium Deployment: ${formatBytes(medium)} (5x current, ~${(casesCount * 5).toLocaleString()} cases)`);
        console.log(`  Large Deployment:  ${formatBytes(large)} (10x current, ~${(casesCount * 10).toLocaleString()} cases)`);
        console.log('─'.repeat(70));

        // Index analysis
        console.log('\n─'.repeat(70));
        console.log('  INDEX OVERHEAD');
        console.log('─'.repeat(70));
        const indexOverheadPercent = ((totalIndexSize / totalSize) * 100).toFixed(1);
        console.log(`  Data Size:        ${formatBytes(totalSize)}`);
        console.log(`  Index Size:       ${formatBytes(totalIndexSize)} (${indexOverheadPercent}% overhead)`);
        console.log('─'.repeat(70));

        console.log('\n' + '='.repeat(70));
        console.log('  Analysis Complete');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n  ❌ Error analyzing database:', error.message);
        console.error('─'.repeat(70) + '\n');
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

// Run analysis
analyzeDatabase();
