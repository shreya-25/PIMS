# Testing the Lead Return Versioning System

## Quick Test Scenario

Here's a step-by-step test to verify the versioning system works:

### 1. Create a New Lead Return

**Request:**
```http
POST http://localhost:7002/api/leadReturn/create
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "leadNo": 1001,
  "description": "Test Investigation Lead",
  "caseName": "Test Case",
  "caseNo": "TEST-001",
  "assignedTo": {
    "assignees": ["John Smith"],
    "lRStatus": "Assigned"
  },
  "assignedBy": {
    "assignee": "Jane Manager",
    "lRStatus": "Assigned"
  },
  "accessLevel": "Everyone"
}
```

**Expected:**
- Lead return created
- Console log: `Initial snapshot created for lead 1001`
- Version 1 created automatically

### 2. Add Some Data to the Lead

Add a person, vehicle, timeline, etc. to lead 1001 using your existing APIs.

### 3. Check Version History

**Request:**
```http
GET http://localhost:7002/api/leadreturn-versions/1001/history
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "versionId": 1,
      "versionReason": "Created",
      "versionCreatedBy": "Jane Manager",
      "versionCreatedAt": "2025-12-26T...",
      "isCurrentVersion": true,
      "status": "Assigned",
      "itemCounts": {
        "results": 0,
        "audios": 0,
        "videos": 0,
        "pictures": 0,
        "enclosures": 0,
        "evidences": 0,
        "persons": 1,
        "vehicles": 1,
        "timelines": 1,
        "scratchpads": 0
      }
    }
  ]
}
```

### 4. Create a Manual Snapshot

**Request:**
```http
POST http://localhost:7002/api/leadreturn-versions/1001/snapshot
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "username": "john.doe",
  "versionReason": "Before major changes"
}
```

**Expected:**
- Version 2 created
- `isCurrentVersion: true` for v2
- `isCurrentVersion: false` for v1

### 5. Update Status to Pending (Simulating Reopened)

First, manually update the lead status to "Returned" in the database, then:

**Request:**
```http
PUT http://localhost:7002/api/leadReturn/set-lrstatus-pending
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "leadNo": 1001,
  "description": "Test Investigation Lead",
  "caseName": "Test Case",
  "caseNo": "TEST-001"
}
```

**Expected:**
- Status changed to "Pending"
- Console log: `Snapshot created for lead 1001 - Reopened from Returned to Pending`
- New version created with reason "Reopened"

### 6. View All Versions

**Request:**
```http
GET http://localhost:7002/api/leadreturn-versions/1001/all
Authorization: Bearer YOUR_TOKEN
```

**Expected:**
- All versions returned
- Can see complete history

### 7. Compare Versions

**Request:**
```http
GET http://localhost:7002/api/leadreturn-versions/1001/compare/1/3
Authorization: Bearer YOUR_TOKEN
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "fromVersion": {
      "versionId": 1,
      "versionReason": "Created",
      ...
    },
    "toVersion": {
      "versionId": 3,
      "versionReason": "Reopened",
      ...
    },
    "changes": {
      "audios": { "added": 2, "fromCount": 0, "toCount": 2 },
      "persons": { "added": 3, "fromCount": 1, "toCount": 4 },
      ...
    }
  }
}
```

### 8. Get Specific Version

**Request:**
```http
GET http://localhost:7002/api/leadreturn-versions/1001/version/1
Authorization: Bearer YOUR_TOKEN
```

**Expected:**
- Complete snapshot data for version 1
- All related data as it was at that point in time

## Verification Checklist

- [ ] Lead return creation triggers snapshot with reason "Created"
- [ ] Manual snapshot creation works
- [ ] Version history shows all versions
- [ ] Each version captures all related data
- [ ] Comparing versions shows differences
- [ ] Can retrieve specific versions
- [ ] Status update from Returned/Completed to Pending creates "Reopened" snapshot
- [ ] Only one version has `isCurrentVersion: true` at a time
- [ ] Version IDs are sequential (1, 2, 3...)

## Using Postman/Thunder Client

If using Postman or Thunder Client in VS Code:

1. **Set up environment variables:**
   - `BASE_URL`: `http://localhost:7002`
   - `TOKEN`: Your authentication token

2. **Create a collection** with the above requests

3. **Run them in order** to test the full flow

## MongoDB Verification

Check the database directly:

```javascript
// In MongoDB shell or Compass

// Check CompleteleadReturns collection
db.CompleteleadReturns.find({ leadNo: 1001 }).pretty()

// Should see all versions with:
// - versionId: 1, 2, 3...
// - isCurrentVersion: true only for latest
// - All related data embedded in arrays

// Check lead return has reference
db.LeadReturns.find({ leadNo: 1001 }).pretty()

// Should see:
// - completeLeadReturnId: ObjectId(...)
// - currentVersionId: 3 (or latest version number)
```

## Success Criteria

✅ **System is working if:**
1. Snapshots are created automatically on lead creation
2. Version history can be retrieved
3. All related data is captured in snapshots
4. Can compare different versions
5. Manual snapshots can be created
6. Reopening a lead creates a new snapshot

---

**Need Help?** Check the logs in your terminal for any error messages during snapshot creation.
