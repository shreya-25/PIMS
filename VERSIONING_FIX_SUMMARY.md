# Lead Return Versioning - "Updated" Records Fix

## Problem Summary

The version comparison system was **not detecting "updated" records** correctly. When narratives (or other entities) were edited between versions, they were being shown as "created" + "deleted" instead of "updated".

### Example of the Bug:
```
Version 1: Narrative A with content "Initial investigation"
↓ (Officer edits Narrative A)
Version 2: Narrative A with content "Updated investigation findings"

❌ OLD BEHAVIOR:
- ➕ Created Narrative A: "Updated investigation findings"
- 🗑️ Deleted Narrative A: "Initial investigation"

✅ NEW BEHAVIOR:
- ✏️ Updated Narrative A
  - Old: "Initial investigation"
  - New: "Updated investigation findings"
```

---

## Root Cause

The comparison algorithm was using **MongoDB ObjectId (`resultId`)** to match narratives between versions, instead of using the stable **narrative identifier (`leadReturnId`)** like "A", "B", "C".

### Why This Caused the Issue:

1. **MongoDB ObjectId can change** between snapshots if:
   - Document is deleted and recreated
   - Data migration occurs
   - Soft delete/restore operations happen

2. **When the `_id` changes**, the comparison algorithm thinks:
   - Old narrative (with old `_id`) was "deleted"
   - New narrative (with new `_id`) was "created"
   - Even though they have the same `leadReturnId` (e.g., both are "Narrative A")

3. **Result**: No "updated" records are generated, only "created" + "deleted"

---

## Changes Made

### 1. Fixed Narrative Comparison Identifier
**File**: `backend/src/utils/versionDiffTracker.js`

**Line 153-158 - BEFORE:**
```javascript
const changes = compareArrays(
  fromVersion.leadReturnResults,
  toVersion.leadReturnResults,
  'resultId',  // ❌ MongoDB ObjectId - can change
  'leadReturnResult'
);
```

**Line 173-178 - AFTER:**
```javascript
const changes = compareArrays(
  fromVersion.leadReturnResults,
  toVersion.leadReturnResults,
  'leadReturnId',  // ✅ Stable identifier like "A", "B", "C"
  'leadReturnResult'
);
```

### 2. Enhanced Field Filtering
**File**: `backend/src/utils/versionDiffTracker.js`

**Line 70-71 - BEFORE:**
```javascript
// Skip these fields from comparison
const skipFields = ['_id', 'createdAt', 'updatedAt', '__v', 'completeLeadReturnId'];
```

**Line 70-93 - AFTER:**
```javascript
// Skip these fields from comparison - these are metadata that shouldn't trigger "updated" logs
const skipFields = [
  '_id',
  'createdAt',
  'updatedAt',
  '__v',
  'completeLeadReturnId',
  'resultId', // MongoDB ObjectId for narratives
  'personId', // MongoDB ObjectId for persons
  'vehicleId', // MongoDB ObjectId for vehicles
  'timelineId', // MongoDB ObjectId for timelines
  'evidenceId', // MongoDB ObjectId for evidences
  'pictureId', // MongoDB ObjectId for pictures
  'audioId', // MongoDB ObjectId for audios
  'videoId', // MongoDB ObjectId for videos
  'enclosureId', // MongoDB ObjectId for enclosures
  'scratchpadId', // MongoDB ObjectId for scratchpads
  'enteredDate', // When record was created
  'enteredBy', // Who created the record
  'lastModifiedDate', // Timestamp metadata
  'lastModifiedBy', // User metadata
  'deletedAt', // Soft delete metadata
  'deletedBy' // Soft delete metadata
];
```

**Why This Matters:**
- Prevents false "updated" records triggered by metadata-only changes
- Focuses on actual content changes (narrative text, person info, vehicle details, etc.)

### 3. Improved Update Detection Logic
**File**: `backend/src/utils/versionDiffTracker.js`

**Enhanced logic to:**
- Detect content changes (primary focus)
- Also detect significant field changes like `accessLevel`
- Ignore pure metadata changes (timestamps, user tracking)
- Provide better console logging for debugging

### 4. Added Debug Logging
**File**: `backend/src/utils/leadReturnVersioning.js`

Added logging to show which narratives are being snapshotted with their IDs:
```javascript
console.log('📝 Narratives being snapshotted:', leadReturnResults.map(r => ({
  _id: r._id.toString(),
  leadReturnId: r.leadReturnId,
  content: r.leadReturnResult?.substring(0, 50) + '...',
  isDeleted: r.isDeleted
})));
```

This helps debug mismatches between versions.

---

## How to Test the Fix

### Test Scenario 1: Update Existing Narrative

1. **Create a lead** with one narrative:
   - Narrative A: "Suspect was seen at 123 Main St"
   - This creates **Version 1**

2. **Edit Narrative A**:
   - Change to: "Suspect was seen at 123 Main St with an accomplice"
   - Continue working...

3. **Submit/Return the lead** (triggers Version 2)

4. **View version history** and compare V1 → V2

**Expected Result:**
```
✏️ Updated Narrative A
  Previous: "Suspect was seen at 123 Main St"
  Updated: "Suspect was seen at 123 Main St with an accomplice"
```

### Test Scenario 2: Mix of Changes

1. **Version 1**: Narratives A, B, C
2. **Edit Phase**:
   - Update Narrative A content
   - Delete Narrative B (soft delete)
   - Add Narrative D
   - Leave Narrative C unchanged
3. **Submit/Return** → Version 2

**Expected Activity Log:**
```
✏️ Updated Narrative A (content changed)
🗑️ Deleted Narrative B
➕ Created Narrative D
(Narrative C should not appear - no changes)
```

### Test Scenario 3: Metadata-Only Changes

1. **Version 1**: Narrative A with accessLevel "Everyone"
2. **Change only accessLevel** to "Case Manager"
3. **Submit/Return** → Version 2

**Expected Result:**
```
✏️ Updated Narrative A - accessLevel
  Old: Everyone
  New: Case Manager
```

---

## Debugging Console Logs

When comparing versions, check the browser console for these logs:

```
🔍 Comparing narratives...
📊 From version narratives: 3
📊 To version narratives: 4
📋 From version narrative IDs: [
  { leadReturnId: 'A', resultId: '507f1f77', content: 'Suspect was seen at...' },
  { leadReturnId: 'B', resultId: '507f191e', content: 'Interview with...' },
  { leadReturnId: 'C', resultId: '507f2a3c', content: 'Evidence collected...' }
]
📋 To version narrative IDs: [
  { leadReturnId: 'A', resultId: '507f1f77', content: 'Suspect was seen with...' },
  { leadReturnId: 'C', resultId: '507f2a3c', content: 'Evidence collected...' },
  { leadReturnId: 'D', resultId: '507f3d4e', content: 'Follow-up investigation...' }
]
✅ Narrative changes found: { added: 1, deleted: 1, updated: 1 }
📝 Processing updated narrative: { narrativeId: 'A', allChanges: ['leadReturnResult'], hasLeadReturnResultChange: true }
✅ Found leadReturnResult change for narrative A
```

**Key Points:**
- `leadReturnId` values should match for the same narrative across versions
- `resultId` (MongoDB ObjectId) may differ - this is OK now!
- `updated` count should be > 0 when narratives are edited

---

## Impact on Other Entity Types

The same fix applies to all entity types:
- ✅ **Narratives** - Use `leadReturnId` instead of `resultId`
- ✅ **Persons** - Already using `personId` (should verify it's stable)
- ✅ **Vehicles** - Already using `vehicleId` (should verify it's stable)
- ✅ **Timelines** - Already using `timelineId` (should verify it's stable)
- ✅ **Evidence** - Already using `evidenceId` (should verify it's stable)
- ✅ **Pictures** - Already using `pictureId` (should verify it's stable)
- ✅ **Audio** - Already using `audioId` (should verify it's stable)
- ✅ **Video** - Already using `videoId` (should verify it's stable)
- ✅ **Enclosures** - Already using `enclosureId` (should verify it's stable)
- ✅ **Scratchpads** - Already using `scratchpadId` (should verify it's stable)

**Note**: If any of these ID fields are actually MongoDB ObjectIds that can change, they may need similar fixes.

---

## Files Modified

1. **`backend/src/utils/versionDiffTracker.js`**
   - Changed narrative comparison to use `leadReturnId` instead of `resultId`
   - Enhanced skip fields list to ignore metadata
   - Improved update detection logic
   - Added comprehensive debug logging

2. **`backend/src/utils/leadReturnVersioning.js`**
   - Added debug logging for snapshot creation
   - Logs narrative IDs and content for troubleshooting

---

## Verification Checklist

After deploying this fix, verify:

- [ ] Updated narratives show as "✏️ Updated" instead of "➕ Created" + "🗑️ Deleted"
- [ ] Activity log shows old and new values correctly
- [ ] Narrative ID (A, B, C, etc.) is displayed correctly
- [ ] Metadata-only changes don't create spurious "updated" logs
- [ ] Console logs show correct matching between versions
- [ ] Persons, vehicles, and other entities still work correctly
- [ ] No errors in backend or frontend console

---

## Known Limitations

1. **Snapshots only created on status changes** - Intermediate edits between versions are not tracked
2. **Manual snapshot button is disabled** - Officers cannot manually create snapshots during work
3. **No undo/restore functionality** - Versions are read-only for comparison

## Future Enhancements

1. Enable manual snapshot creation for officers
2. Add automatic snapshot on significant edits (e.g., every N changes)
3. Implement version restore functionality
4. Add diff highlighting in UI (show exact text changes)
5. Add export version comparison to PDF/report
