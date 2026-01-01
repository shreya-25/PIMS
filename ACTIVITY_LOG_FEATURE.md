# Detailed Activity Log for Version Comparison

## ✅ What's Been Added

I've implemented a comprehensive activity tracking system that shows **exactly what changed** between any two versions of a lead return, similar to your existing Activity Log component.

## Features

### 1. **Detailed Change Tracking**

When comparing two versions, you now get a detailed activity log showing:

- ✅ **Created Items** - New narratives, persons, vehicles, etc. added
- ✅ **Updated Items** - Field-level changes with old → new values
- ✅ **Deleted Items** - Items that were removed, with full content preview

### 2. **Entity Types Tracked**

The system tracks changes across all entity types:
- Narrative (Lead Return Results)
- Person
- Vehicle
- Timeline Events
- Evidence
- Pictures
- Audio
- Video
- Enclosures
- Notes (Scratchpad)

### 3. **Field-Level Change Detection**

For updated items, it shows:
- **Field name** that changed
- **Old value** (in red/pink background)
- **New value** (in green background)
- Visual arrow (→) showing the transition

## How It Works

### Backend

**New File Created:**
- `backend/src/utils/versionDiffTracker.js` - Core comparison logic

**New API Endpoint:**
```
GET /api/leadreturn-versions/:leadNo/activity/:fromVersion/:toVersion
```

**Returns:**
```json
{
  "success": true,
  "fromVersion": {
    "versionId": 1,
    "versionCreatedAt": "2025-12-26T...",
    "versionCreatedBy": "Officer001",
    "versionReason": "Created"
  },
  "toVersion": {
    "versionId": 2,
    "versionCreatedAt": "2025-12-26T...",
    "versionCreatedBy": "Officer002",
    "versionReason": "Reopened"
  },
  "activities": [
    {
      "action": "created",
      "entityType": "Narrative",
      "entityId": "507f1f77bcf86cd799439011",
      "description": "Created narrative: this is another return...",
      "details": { /* full object data */ }
    },
    {
      "action": "deleted",
      "entityType": "Narrative",
      "entityId": "507f1f77bcf86cd799439012",
      "description": "Deleted narrative: this is another return 2...",
      "details": { /* full deleted object data */ }
    },
    {
      "action": "updated",
      "entityType": "Person",
      "entityId": "507f1f77bcf86cd799439013",
      "field": "firstName",
      "description": "Updated person John Doe - firstName",
      "oldValue": "John",
      "newValue": "Jonathan"
    }
  ],
  "totalChanges": 15
}
```

### Frontend

**Files Modified:**
- `frontend/src/Pages/LeadVersionHistory/LeadVersionHistory.jsx` - Added activity log display
- `frontend/src/Pages/LeadVersionHistory/LeadVersionHistory.css` - Added styling

## User Interface

### Activity Log Display

When you compare two versions, below the changes table you'll see:

```
┌─────────────────────────────────────────────────────┐
│ Detailed Activity Log (15 changes)                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─ ➕ Created  Narrative ──────────────────────┐  │
│ │ Created narrative: this is another return...  │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ ┌─ 🗑️ Deleted  Narrative ──────────────────────┐  │
│ │ Deleted narrative: this is another return 2...│  │
│ │ ▶ View deleted content                        │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ ┌─ ✏️ Updated  Person ──────────────────────────┐  │
│ │ Updated person John Doe - firstName           │  │
│ │ Field: firstName                              │  │
│ │ ┌──────────┐    →    ┌──────────┐           │  │
│ │ │ Old:     │         │ New:     │           │  │
│ │ │ John     │    →    │ Jonathan │           │  │
│ │ └──────────┘         └──────────┘           │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Visual Features

- **Color-coded badges:**
  - 🟢 Green for created items
  - 🟡 Orange for updated items
  - 🔴 Red for deleted items

- **Background colors:**
  - Light green background for created items
  - Light yellow background for updated items
  - Light red background for deleted items

- **Value comparison:**
  - Old values in red/pink box
  - New values in green box
  - Arrow showing the transition

- **Expandable details:**
  - Click "View deleted content" to see full object JSON

## How to Use

### Step 1: Navigate to Version History

```
Go to: /LeadVersionHistory
```

Or click the **Version History** button on the LRReturn page.

### Step 2: Compare Versions

1. Click "Compare Versions" button
2. Select "From Version" (e.g., Version 1)
3. Select "To Version" (e.g., Version 2)
4. Click "Compare"

### Step 3: View Activity Log

Scroll down below the changes table to see the **Detailed Activity Log**.

You'll see:
- Total number of changes
- Each change listed chronologically
- Full details of what was added, updated, or deleted

### Example Scenario

**Version 1 → Version 2:**

**Created:**
- ➕ Created narrative #D: "this is another return 2 after return"

**Deleted:**
- 🗑️ Deleted narrative #D: "this is another return 2 after return"

**Updated:**
- ✏️ Updated person John Smith - cellNumber
  - Old: "555-1234"
  - New: "555-5678"

- ✏️ Updated timeline event - eventDescription
  - Old: "Interview conducted"
  - New: "Interview conducted with witness"

## What Gets Tracked

### For All Entity Types
- ✅ Created (new items added)
- ✅ Deleted (items removed)

### For These Entity Types (with field-level tracking)
- ✅ **Narrative** - All field changes
- ✅ **Person** - Name, address, phone, SSN, etc.
- ✅ **Vehicle** - Make, model, VIN, plate, etc.
- ✅ **Timeline Event** - Date, description, location, etc.
- ✅ **Notes** - Text content changes

### For Media Types (creation/deletion only)
- Pictures
- Audio
- Video
- Enclosures
- Evidence

## Technical Details

### Comparison Logic

The system uses deep comparison to detect:

1. **Array-level changes:**
   - Items present in old version but not in new = Deleted
   - Items present in new version but not in old = Created

2. **Object-level changes:**
   - For matching items (same ID), compares all fields
   - Nested objects compared recursively
   - Arrays compared by content

3. **Field-level changes:**
   - Primitive values (string, number, boolean)
   - Nested objects (e.g., address.street1)
   - Arrays (shown as JSON if changed)

### Skipped Fields

These fields are ignored in comparisons:
- `_id` (MongoDB ID)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `__v` (version key)
- `completeLeadReturnId` (reference field)

## Benefits

### 1. **Complete Audit Trail**
See exactly what changed between any two versions, just like your existing Activity Log.

### 2. **Transparency**
Track who changed what and when for accountability.

### 3. **Debugging**
Quickly identify when and how data was modified.

### 4. **Compliance**
Maintain detailed records for legal/regulatory requirements.

### 5. **Data Recovery**
See deleted content to help restore if needed.

## API Usage Examples

### Get Activity Log

```javascript
const token = localStorage.getItem("token");

const response = await fetch(
  '/api/leadreturn-versions/1001/activity/1/2',
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

const data = await response.json();

console.log(`Total changes: ${data.totalChanges}`);
data.activities.forEach(activity => {
  console.log(`${activity.action}: ${activity.description}`);
});
```

### Filter by Action Type

```javascript
const createdItems = data.activities.filter(a => a.action === 'created');
const updatedItems = data.activities.filter(a => a.action === 'updated');
const deletedItems = data.activities.filter(a => a.action === 'deleted');

console.log(`Created: ${createdItems.length}`);
console.log(`Updated: ${updatedItems.length}`);
console.log(`Deleted: ${deletedItems.length}`);
```

### Filter by Entity Type

```javascript
const narrativeChanges = data.activities.filter(
  a => a.entityType === 'Narrative'
);

const personChanges = data.activities.filter(
  a => a.entityType === 'Person'
);

console.log(`Narrative changes: ${narrativeChanges.length}`);
console.log(`Person changes: ${personChanges.length}`);
```

## Customization

### Change Colors

Edit `LeadVersionHistory.css`:

```css
/* Change created item color */
.activity-item.activity-created {
  border-left-color: #YOUR_COLOR;
  background: #YOUR_BG_COLOR;
}

/* Change updated item color */
.activity-item.activity-updated {
  border-left-color: #YOUR_COLOR;
  background: #YOUR_BG_COLOR;
}

/* Change deleted item color */
.activity-item.activity-deleted {
  border-left-color: #YOUR_COLOR;
  background: #YOUR_BG_COLOR;
}
```

### Add More Tracked Fields

Edit `backend/src/utils/versionDiffTracker.js` to add more entity types or customize comparison logic.

## Future Enhancements

Possible additions:
- Export activity log to PDF/Excel
- Filter activity log by action type or entity type
- Timeline visualization of changes
- Email notifications for specific changes
- Undo/redo functionality based on activity log

---

**All set!** The detailed activity log feature is now live and working. 🎉

Compare any two versions to see exactly what changed, just like your Activity Log shows for current operations!
