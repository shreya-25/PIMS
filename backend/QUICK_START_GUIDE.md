# Lead Return Versioning - Quick Start Guide

## ✅ What's Already Done

1. **Models Updated** - All 11 related models now have versioning references
2. **Routes Added** - Versioning API endpoints are registered in [server.js](src/server.js:23)
3. **Auto-Snapshots** - Snapshots automatically created when:
   - New lead return is created ("Created")
   - Lead status changes to "Pending" from "Returned" or "Completed" ("Reopened")

## 🚀 You're Ready to Use It!

Since you have no existing database records, you can start using the system immediately. No migration needed!

### How It Works Automatically

**When you create a new lead return:**
```javascript
POST /api/leadReturn/create
{
  "leadNo": 1001,
  "description": "Investigation lead",
  "caseName": "Case ABC",
  "caseNo": "2025-001",
  "assignedTo": { "assignees": ["Officer Smith"], "lRStatus": "Assigned" },
  "assignedBy": { "assignee": "Manager Jones", "lRStatus": "Assigned" }
}
```
→ **Snapshot v1 is automatically created** with reason "Created"

**When you update status to Pending after it was Returned:**
```javascript
PUT /api/leadReturn/set-lrstatus-pending
{
  "leadNo": 1001,
  "description": "Investigation lead",
  "caseName": "Case ABC",
  "caseNo": "2025-001"
}
```
→ **Snapshot v2 is automatically created** with reason "Reopened"

### Manual Snapshot Creation

You can also create snapshots manually:

```javascript
POST /api/leadreturn-versions/1001/snapshot
{
  "username": "john.doe",
  "versionReason": "Manual Snapshot"
}
```

### View Version History

**Get all versions:**
```javascript
GET /api/leadreturn-versions/1001/all
```

**Get current version:**
```javascript
GET /api/leadreturn-versions/1001/current
```

**Get version history summary:**
```javascript
GET /api/leadreturn-versions/1001/history
```

Response shows all versions with item counts:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "versionId": 2,
      "versionReason": "Reopened",
      "versionCreatedBy": "john.doe",
      "versionCreatedAt": "2025-12-26T10:30:00Z",
      "isCurrentVersion": true,
      "status": "Pending",
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
    },
    {
      "versionId": 1,
      "versionReason": "Created",
      "versionCreatedBy": "Manager Jones",
      "versionCreatedAt": "2025-12-20T09:00:00Z",
      "isCurrentVersion": false,
      "status": "Assigned",
      "itemCounts": {
        "results": 0,
        "audios": 0,
        "videos": 0,
        "pictures": 0,
        "evidences": 0,
        "persons": 0,
        "vehicles": 0,
        "timelines": 0
      }
    }
  ]
}
```

**Compare two versions:**
```javascript
GET /api/leadreturn-versions/1001/compare/1/2
```

Shows what changed between version 1 and version 2.

## 🎯 Next Steps (When You Need Them)

### To Add Snapshots for More Status Changes

Currently snapshots are created for:
- ✅ Created (new lead)
- ✅ Reopened (Returned/Completed → Pending)

**To also snapshot when lead is Returned, Completed, or Approved:**

You'll need to add similar logic wherever you update the lead status to these states. Use this pattern:

```javascript
// Import at the top of your controller
const { createSnapshot } = require("../utils/leadReturnVersioning");

// In your update function
const oldStatus = existingLeadReturn.assignedTo?.lRStatus;
const newStatus = "Returned"; // or "Completed", "Approved"

// Update the lead...

// Create snapshot if needed
if (newStatus === "Returned" || newStatus === "Completed" || newStatus === "Approved") {
  try {
    const username = req.user?.name || "System";
    await createSnapshot(leadNo, username, newStatus);
    console.log(`Snapshot created for lead ${leadNo} - ${newStatus}`);
  } catch (err) {
    console.error("Snapshot creation failed:", err.message);
    // Don't fail the request
  }
}
```

## 📚 Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leadreturn-versions/:leadNo/snapshot` | Create manual snapshot |
| GET | `/api/leadreturn-versions/:leadNo/current` | Get current version |
| GET | `/api/leadreturn-versions/:leadNo/all` | Get all versions |
| GET | `/api/leadreturn-versions/:leadNo/version/:versionId` | Get specific version |
| GET | `/api/leadreturn-versions/:leadNo/compare/:from/:to` | Compare versions |
| POST | `/api/leadreturn-versions/:leadNo/restore/:versionId` | Restore version |
| GET | `/api/leadreturn-versions/:leadNo/history` | Get version summary |

## 🔍 What Gets Captured in Each Snapshot?

Every snapshot includes:
- ✅ Lead return main data (leadNo, description, status, dates, etc.)
- ✅ All lead return results
- ✅ All audio files
- ✅ All video files
- ✅ All pictures
- ✅ All enclosures
- ✅ All evidence items
- ✅ All persons
- ✅ All vehicles
- ✅ All scratchpad entries (type "Lead")
- ✅ All timeline events

## 📖 Full Documentation

For detailed information, see:
- **[LEAD_RETURN_VERSIONING.md](src/docs/LEAD_RETURN_VERSIONING.md)** - Complete system documentation
- **[VERSIONING_IMPLEMENTATION_SUMMARY.md](VERSIONING_IMPLEMENTATION_SUMMARY.md)** - Implementation details

## 🐛 Troubleshooting

**Snapshots not being created?**
1. Check console logs for error messages
2. Verify MongoDB is connected
3. Ensure lead has a valid `leadNo`
4. Check that all related models can be queried

**Need to view snapshot data?**
Use the API endpoints to retrieve version history and specific versions.

---

**You're all set!** The versioning system will automatically track your lead returns as you create and update them. 🎉
