const mongoose = require("mongoose");
const { createSnapshot } = require("../utils/leadReturnVersioning");
const LeadReturn = require("../models/leadreturn");
require("dotenv").config();

/**
 * Migration script to create initial snapshots for all existing lead returns
 * This should be run once to initialize the versioning system for existing data
 */
async function migrateExistingLeadReturns() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/pims";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Get all unique lead numbers
        const leadReturns = await LeadReturn.find({}).select("leadNo assignedBy");
        console.log(`Found ${leadReturns.length} lead returns to migrate`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process each lead return
        for (const leadReturn of leadReturns) {
            try {
                console.log(`Processing leadNo: ${leadReturn.leadNo}...`);

                // Create initial snapshot
                // Use the assignedBy.assignee as the version creator for initial migration
                const versionCreatedBy = leadReturn.assignedBy?.assignee || "System Migration";

                await createSnapshot(
                    leadReturn.leadNo,
                    versionCreatedBy,
                    "Created" // Initial version reason
                );

                successCount++;
                console.log(`✓ Successfully created snapshot for leadNo: ${leadReturn.leadNo}`);
            } catch (error) {
                errorCount++;
                const errorMsg = `Error processing leadNo ${leadReturn.leadNo}: ${error.message}`;
                console.error(`✗ ${errorMsg}`);
                errors.push({ leadNo: leadReturn.leadNo, error: error.message });
            }
        }

        // Print summary
        console.log("\n" + "=".repeat(60));
        console.log("Migration Summary");
        console.log("=".repeat(60));
        console.log(`Total lead returns: ${leadReturns.length}`);
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Failed: ${errorCount}`);

        if (errors.length > 0) {
            console.log("\nErrors:");
            errors.forEach(err => {
                console.log(`  - Lead ${err.leadNo}: ${err.error}`);
            });
        }

        console.log("=".repeat(60));

    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log("Database connection closed");
    }
}

/**
 * Dry run - show what would be migrated without actually doing it
 */
async function dryRun() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/pims";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB (DRY RUN MODE)");

        const leadReturns = await LeadReturn.find({}).select("leadNo caseName caseNo assignedBy");
        console.log(`\nDRY RUN: Would migrate ${leadReturns.length} lead returns:\n`);

        leadReturns.forEach((lr, index) => {
            console.log(`${index + 1}. Lead #${lr.leadNo} - ${lr.caseName} (Case: ${lr.caseNo})`);
            console.log(`   Assigned by: ${lr.assignedBy?.assignee || "Unknown"}`);
        });

        console.log(`\nTotal: ${leadReturns.length} lead returns`);

    } catch (error) {
        console.error("Dry run failed:", error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log("\nDatabase connection closed");
    }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === "--dry-run") {
    console.log("Running in DRY RUN mode...\n");
    dryRun()
        .then(() => {
            console.log("\nDry run completed successfully");
            process.exit(0);
        })
        .catch(error => {
            console.error("\nDry run failed:", error);
            process.exit(1);
        });
} else if (command === "--migrate" || command === "--run") {
    console.log("Starting migration...\n");
    migrateExistingLeadReturns()
        .then(() => {
            console.log("\nMigration completed successfully");
            process.exit(0);
        })
        .catch(error => {
            console.error("\nMigration failed:", error);
            process.exit(1);
        });
} else {
    console.log("Lead Return Versioning Migration Script");
    console.log("========================================\n");
    console.log("Usage:");
    console.log("  node migrateLeadReturnVersioning.js --dry-run    # See what would be migrated");
    console.log("  node migrateLeadReturnVersioning.js --migrate    # Run the actual migration");
    console.log("  node migrateLeadReturnVersioning.js --run        # Alias for --migrate\n");
    process.exit(0);
}
