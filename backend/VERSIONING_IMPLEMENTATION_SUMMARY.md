# Lead Return Versioning System - Implementation Summary

## What Was Implemented

A complete versioning and snapshot system for lead returns that automatically creates and stores historical versions when leads are returned or reopened.

## Files Created

### 1. Models
- **[CompleteleadReturn.js](src/models/CompleteleadReturn.js)** - Main versioning model
  - Stores complete snapshots of lead returns with all related data
  - Includes version tracking (versionId, parentVersionId, isCurrentVersion)
  - Contains embedded arrays for all related entities

### 2. Utilities
- **[leadReturnVersioning.js](src/utils/leadReturnVersioning.js)** - Core versioning functions
  - `createSnapshot()` - Creates a new version snapshot
  - `getCurrentVersion()` - Gets the latest version
  - `getAllVersions()` - Gets all versions for a lead
  - `getVersion()` - Gets a specific version
  - `compareVersions()` - Compares two versions
  - `restoreVersion()` - Restores from a previous version

### 3. Middleware
- **[leadReturnVersioningMiddleware.js](src/middleware/leadReturnVersioningMiddleware.js)** - Automatic snapshot creation
  - `createSnapshotIfNeeded()` - Helper for route handlers
  - `shouldCreateSnapshot()` - Determines if snapshot is needed
  - Automatically triggers on status changes (Returned, Reopened, Completed, Approved)

### 4. Routes
- **[leadReturnVersionRoutes.js](src/routes/leadReturnVersionRoutes.js)** - REST API endpoints
  - POST `/api/leadreturn-versions/:leadNo/snapshot` - Create manual snapshot
  - GET `/api/leadreturn-versions/:leadNo/current` - Get current version
  - GET `/api/leadreturn-versions/:leadNo/all` - Get all versions
  - GET `/api/leadreturn-versions/:leadNo/version/:versionId` - Get specific version
  - GET `/api/leadreturn-versions/:leadNo/compare/:from/:to` - Compare versions
  - POST `/api/leadreturn-versions/:leadNo/restore/:versionId` - Restore version
  - GET `/api/leadreturn-versions/:leadNo/history` - Get version history

### 5. Scripts
- **[migrateLeadReturnVersioning.js](src/scripts/migrateLeadReturnVersioning.js)** - Migration tool
  - `--dry-run` - Preview what will be migrated
  - `--migrate` - Run the actual migration for existing data

### 6. Documentation
- **[LEAD_RETURN_VERSIONING.md](src/docs/LEAD_RETURN_VERSIONING.md)** - Complete system documentation

## Models Updated

All the following models now have `completeLeadReturnId` reference field:

1. ✅ [leadreturn.js](src/models/leadreturn.js) - Added `completeLeadReturnId` and `currentVersionId`
2. ✅ [leadReturnResult.js](src/models/leadReturnResult.js) - Added `completeLeadReturnId`
3. ✅ [LRAudio.js](src/models/LRAudio.js) - Added `completeLeadReturnId`
4. ✅ [LRVideo.js](src/models/LRVideo.js) - Added `completeLeadReturnId`
5. ✅ [LRPicture.js](src/models/LRPicture.js) - Added `completeLeadReturnId`
6. ✅ [LREnclosure.js](src/models/LREnclosure.js) - Added `completeLeadReturnId`
7. ✅ [LREvidence.js](src/models/LREvidence.js) - Added `completeLeadReturnId`
8. ✅ [LRPerson.js](src/models/LRPerson.js) - Added `completeLeadReturnId`
9. ✅ [LRVehicle.js](src/models/LRVehicle.js) - Added `completeLeadReturnId`
10. ✅ [LRScratchpad.js](src/models/LRScratchpad.js) - Added `completeLeadReturnId`
11. ✅ [LRTimeline.js](src/models/LRTimeline.js) - Added `completeLeadReturnId`

## How It Works

### Automatic Snapshot Creation

When a lead return's status changes to any of these states, a snapshot is automatically created:

1. **Returned** - Captures complete state when lead is returned
2. **Reopened** - Captures state when a returned/completed lead is reopened
3. **Completed** - Captures state when lead is marked complete
4. **Approved** - Captures state when lead is approved

### Version Tracking

Each snapshot includes:
- Sequential version ID (1, 2, 3...)
- Reference to parent version (version history chain)
- Timestamp and username of who created it
- Reason for creation (Returned, Reopened, etc.)
- Complete copy of all related data at that point in time

### Data Captured in Each Snapshot

Every snapshot stores:
- Lead return main data (description, status, dates, etc.)
- All lead return results
- All audio files
- All video files
- All pictures
- All enclosures
- All evidence items
- All persons
- All vehicles
- All scratchpad entries
- All timeline events

## Next Steps to Integrate

### 1. Run Migration (Required First)

```bash
cd backend

# Preview what will be migrated
node src/scripts/migrateLeadReturnVersioning.js --dry-run

# Run migration to create initial snapshots
node src/scripts/migrateLeadReturnVersioning.js --migrate
```

### 2. Add Routes to Your Express App

In your main app file (e.g., `backend/src/app.js` or `server.js`):

```javascript
// Add this import
const leadReturnVersionRoutes = require('./routes/leadReturnVersionRoutes');

// Add this route
app.use('/api/leadreturn-versions', leadReturnVersionRoutes);
```

### 3. Integrate Middleware in Update Routes

Find your lead return update route and add snapshot creation:

```javascript
// At the top of your route file
const { createSnapshotIfNeeded } = require('../middleware/leadReturnVersioningMiddleware');

// In your update route
router.put('/leadreturn/:id', async (req, res) => {
  try {
    const leadReturn = await LeadReturn.findById(req.params.id);
    const oldStatus = leadReturn.assignedTo?.lRStatus;

    // Your existing update logic
    Object.assign(leadReturn, req.body);
    await leadReturn.save();

    // Add this: Create snapshot if status changed appropriately
    await createSnapshotIfNeeded(
      leadReturn.leadNo,
      oldStatus,
      leadReturn.assignedTo?.lRStatus,
      req.user.username || 'System'
    );

    res.json(leadReturn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4. (Optional) Add Frontend UI

You can now build UI components to:
- Display version history
- Compare different versions
- Restore previous versions
- View snapshots of returned leads

## Example Use Cases

### View Version History
```bash
GET /api/leadreturn-versions/12345/history
```

### Compare Two Versions
```bash
GET /api/leadreturn-versions/12345/compare/1/3
```

### Create Manual Snapshot
```bash
POST /api/leadreturn-versions/12345/snapshot
Body: { "username": "john.doe", "versionReason": "Manual Snapshot" }
```

### Get Current Version
```bash
GET /api/leadreturn-versions/12345/current
```

## Benefits

✅ **Complete History** - Every returned/reopened lead has full historical data
✅ **Audit Trail** - Know exactly what data was present at each point
✅ **Recovery** - Can review or restore previous states
✅ **Compliance** - Maintain records of all changes
✅ **Transparency** - Track who made changes and when
✅ **Comparison** - See what changed between versions

## Monitoring

Check these after migration:

1. **Database Size** - Each snapshot stores full copies, monitor disk usage
2. **Query Performance** - Indexes are in place, but monitor query times
3. **Error Logs** - Watch for snapshot creation failures (non-blocking)

## Support

For detailed documentation, see: [LEAD_RETURN_VERSIONING.md](src/docs/LEAD_RETURN_VERSIONING.md)

---

**System Status**: ✅ Ready for Integration
**Migration Required**: Yes (run migration script before use)
**Breaking Changes**: None (all changes are additive)
