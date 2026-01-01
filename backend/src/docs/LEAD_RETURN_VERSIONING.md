# Lead Return Versioning System

## Overview

This versioning system creates complete snapshots of lead returns and all their related data whenever a lead is returned, reopened, or when specific status changes occur. Each snapshot is stored with a unique version ID, allowing you to track the complete history of a lead return over time.

## Architecture

### Core Components

1. **CompleteleadReturn Model** - Main versioning table that stores complete snapshots
2. **Versioning Utilities** - Helper functions for creating and managing snapshots
3. **Middleware** - Automatic snapshot creation on status changes
4. **API Routes** - REST endpoints for version management
5. **Migration Script** - Tool to create initial snapshots for existing data

## Database Schema

### CompleteleadReturn Model

Each snapshot contains:

- **Version Control Fields**
  - `versionId`: Sequential version number for the lead
  - `isCurrentVersion`: Boolean flag for the latest version
  - `parentVersionId`: Reference to the previous version
  - `versionCreatedAt`: Timestamp of snapshot creation
  - `versionCreatedBy`: Username who created the version
  - `versionReason`: Reason for creating the snapshot (Created, Returned, Reopened, etc.)

- **Lead Return Data** - All fields from the main leadreturn table

- **Related Data Snapshots**
  - `leadReturnResults[]`: Array of lead return results
  - `audios[]`: Array of audio files
  - `videos[]`: Array of video files
  - `pictures[]`: Array of pictures
  - `enclosures[]`: Array of enclosures
  - `evidences[]`: Array of evidence items
  - `persons[]`: Array of persons
  - `vehicles[]`: Array of vehicles
  - `scratchpads[]`: Array of scratchpad entries
  - `timelines[]`: Array of timeline events

### Updated Models

All related models now include:
- `completeLeadReturnId`: Reference to the current snapshot
- `currentVersionId`: Current version number (on leadreturn model only)

## Usage

### 1. Migration

Before using the versioning system, migrate existing data:

```bash
# Dry run to see what will be migrated
node src/scripts/migrateLeadReturnVersioning.js --dry-run

# Run the actual migration
node src/scripts/migrateLeadReturnVersioning.js --migrate
```

### 2. Automatic Snapshot Creation

Use the middleware in your lead return update routes:

```javascript
const { createSnapshotIfNeeded } = require('../middleware/leadReturnVersioningMiddleware');
const LeadReturn = require('../models/leadreturn');

router.put('/leadreturn/:id', async (req, res) => {
  try {
    const leadReturn = await LeadReturn.findById(req.params.id);
    const oldStatus = leadReturn.assignedTo?.lRStatus;

    // Update the lead return
    Object.assign(leadReturn, req.body);
    await leadReturn.save();

    // Create snapshot if needed (automatic for status changes)
    await createSnapshotIfNeeded(
      leadReturn.leadNo,
      oldStatus,
      leadReturn.assignedTo?.lRStatus,
      req.user.username
    );

    res.json(leadReturn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Manual Snapshot Creation

```javascript
const { createSnapshot } = require('../utils/leadReturnVersioning');

// Create a manual snapshot
const snapshot = await createSnapshot(
  leadNo,              // Lead number
  username,            // Who is creating the snapshot
  "Manual Snapshot"    // Reason
);
```

### 4. Retrieving Versions

```javascript
const {
  getCurrentVersion,
  getAllVersions,
  getVersion
} = require('../utils/leadReturnVersioning');

// Get current version
const current = await getCurrentVersion(leadNo);

// Get all versions
const allVersions = await getAllVersions(leadNo);

// Get specific version
const version3 = await getVersion(leadNo, 3);
```

### 5. Comparing Versions

```javascript
const { compareVersions } = require('../utils/leadReturnVersioning');

const comparison = await compareVersions(leadNo, 1, 3);
console.log(comparison.changes);
// Shows counts of added/removed items for each category
```

## API Endpoints

Add these routes to your Express app:

```javascript
const leadReturnVersionRoutes = require('./routes/leadReturnVersionRoutes');
app.use('/api/leadreturn-versions', leadReturnVersionRoutes);
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leadreturn-versions/:leadNo/snapshot` | Manually create a snapshot |
| GET | `/api/leadreturn-versions/:leadNo/current` | Get current version |
| GET | `/api/leadreturn-versions/:leadNo/all` | Get all versions |
| GET | `/api/leadreturn-versions/:leadNo/version/:versionId` | Get specific version |
| GET | `/api/leadreturn-versions/:leadNo/compare/:from/:to` | Compare two versions |
| POST | `/api/leadreturn-versions/:leadNo/restore/:versionId` | Restore a version |
| GET | `/api/leadreturn-versions/:leadNo/history` | Get version history summary |

### Example API Calls

**Create Manual Snapshot:**
```bash
POST /api/leadreturn-versions/12345/snapshot
Content-Type: application/json

{
  "username": "john.doe",
  "versionReason": "Manual Snapshot"
}
```

**Get All Versions:**
```bash
GET /api/leadreturn-versions/12345/all
```

**Compare Versions:**
```bash
GET /api/leadreturn-versions/12345/compare/1/3
```

**Get Version History:**
```bash
GET /api/leadreturn-versions/12345/history
```

Response:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "versionId": 3,
      "versionReason": "Returned",
      "versionCreatedBy": "john.doe",
      "versionCreatedAt": "2025-01-15T10:30:00Z",
      "isCurrentVersion": true,
      "status": "Returned",
      "itemCounts": {
        "results": 5,
        "audios": 2,
        "videos": 1,
        "pictures": 10,
        "evidences": 3,
        "persons": 4,
        "vehicles": 2,
        "timelines": 8
      }
    }
  ]
}
```

## Snapshot Triggers

Snapshots are automatically created when:

1. **Lead is Returned** - Status changes to "Returned"
2. **Lead is Completed** - Status changes to "Completed"
3. **Lead is Approved** - Status changes to "Approved"
4. **Lead is Reopened** - Status changes from "Returned" or "Completed" to "Assigned" or "Pending"

You can also create manual snapshots at any time.

## Version Reasons

- `Created` - Initial version when migrating existing data
- `Returned` - Snapshot created when lead is returned
- `Reopened` - Snapshot created when a returned/completed lead is reopened
- `Completed` - Snapshot created when lead is completed
- `Approved` - Snapshot created when lead is approved
- `Manual Snapshot` - Manually triggered snapshot
- `Restored from version X` - Created when restoring from an old version

## Performance Considerations

1. **Indexes** - The CompleteleadReturn model has indexes on:
   - `leadNo` + `versionId` (unique)
   - `leadNo` + `isCurrentVersion`
   - `parentVersionId`

2. **Data Size** - Each snapshot stores complete copies of all related data. Monitor database size and implement cleanup policies for old versions if needed.

3. **Async Processing** - For high-volume systems, consider making snapshot creation asynchronous using a job queue.

## Data Integrity

- Only one version can be marked as `isCurrentVersion: true` per lead
- Version IDs are sequential and unique per lead
- Parent-child relationships maintain version lineage
- Snapshots are immutable once created

## Troubleshooting

### Snapshot Creation Fails

1. Check that all required models are properly imported
2. Verify MongoDB connection
3. Check for validation errors in related data
4. Review error logs for specific failure reasons

### Missing Versions

1. Ensure migration script was run for existing data
2. Verify middleware is properly integrated in update routes
3. Check that status changes are triggering snapshots correctly

### Performance Issues

1. Add pagination to version history queries
2. Consider archiving very old versions
3. Use projection to exclude large embedded arrays when not needed
4. Monitor database indexes

## Future Enhancements

Possible improvements to consider:

1. **Differential Snapshots** - Store only changes between versions instead of full copies
2. **Snapshot Cleanup** - Automated archival or deletion of old versions
3. **Comparison UI** - Visual diff tool for comparing versions
4. **Version Comments** - Allow users to add notes to versions
5. **Rollback** - Fully restore all data to a previous version (not just snapshot)
6. **Change Tracking** - Detailed field-level change tracking between versions

## Support

For issues or questions about the versioning system, contact the development team or refer to the code comments in:

- `backend/src/models/CompleteleadReturn.js`
- `backend/src/utils/leadReturnVersioning.js`
- `backend/src/middleware/leadReturnVersioningMiddleware.js`
- `backend/src/routes/leadReturnVersionRoutes.js`
