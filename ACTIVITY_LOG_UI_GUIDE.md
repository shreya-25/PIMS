# Professional Activity Log - User Interface Guide

## Overview
The Activity Log component displays a clean, professional view of all actions taken on Lead Return narratives, showing **who did what, when, and what changed** - without exposing raw database records.

## Visual Layout

### Main View (Collapsed)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ACTIVITY LOG                                      [Filters] [Refresh]  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─ CREATE ─┐  John Smith created narrative #A     12/22/24, 2:30 PM ▶ │
│  ├─ UPDATE ─┤  Jane Doe updated narrative #B       12/22/24, 1:15 PM ▶ │
│  ├─ DELETE ─┤  Mike Wilson deleted narrative #C    12/21/24, 4:45 PM ▶ │
│  └─ UPDATE ─┘  Sarah Jones updated narrative #A    12/21/24, 10:20 AM ▶│
└─────────────────────────────────────────────────────────────────────────┘
```

### Expanded View - CREATE Action
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─ CREATE ─┐  John Smith created narrative #A     12/22/24, 2:30 PM ▼ │
│  ├────────────────────────────────────────────────────────────────────┬─┤
│  │ Officer:        John Smith                                         │ │
│  │ Role:           Investigator                                       │ │
│  │ Action:         created narrative #A                               │ │
│  │ Date & Time:    12/22/24, 2:30:15 PM                              │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │ New Narrative Details:                                             │ │
│  │ ─────────────────────────────────────────────────────────────────  │ │
│  │   Narrative ID:      A                                             │ │
│  │   Content Preview:   Witness John Doe interviewed at scene.        │ │
│  │                      Stated he saw suspect fleeing northbound...   │ │
│  │   Access Level:      Everyone                                      │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │   IP Address:        192.168.1.100                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Expanded View - UPDATE Action
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─ UPDATE ─┐  Jane Doe updated narrative #B       12/22/24, 1:15 PM ▼ │
│  ├────────────────────────────────────────────────────────────────────┬─┤
│  │ Officer:        Jane Doe                                           │ │
│  │ Role:           Case Manager                                       │ │
│  │ Action:         updated narrative #B                               │ │
│  │ Date & Time:    12/22/24, 1:15:45 PM                              │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │ Changes Made:                                                      │ │
│  │ ─────────────────────────────────────────────────────────────────  │ │
│  │ Narrative Content:                                                 │ │
│  │   PREVIOUS: Interview conducted with witness...                    │ │
│  │   UPDATED:  Interview conducted with witness. Additional details   │ │
│  │             regarding suspect description added...                 │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │ Access Level:                                                      │ │
│  │   PREVIOUS: Everyone                                               │ │
│  │   UPDATED:  Only Case Manager                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Expanded View - DELETE Action
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─ DELETE ─┐  Mike Wilson deleted narrative #C    12/21/24, 4:45 PM ▼ │
│  ├────────────────────────────────────────────────────────────────────┬─┤
│  │ Officer:        Mike Wilson                                        │ │
│  │ Role:           Detective Supervisor                               │ │
│  │ Action:         deleted narrative #C                               │ │
│  │ Date & Time:    12/21/24, 4:45:30 PM                              │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │ Deleted Narrative Details:                                         │ │
│  │ ─────────────────────────────────────────────────────────────────  │ │
│  │   Narrative ID:      C                                             │ │
│  │   Content Preview:   Duplicate entry - information already         │ │
│  │                      recorded in narrative #A...                   │ │
│  │   Access Level:      Everyone                                      │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │   IP Address:        192.168.1.105                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Color-Coded Action Badges
- **CREATE** - Green badge (#4caf50) with ➕ icon
- **UPDATE** - Blue badge (#2196f3) with ✏️ icon
- **DELETE** - Red badge (#f44336) with 🗑️ icon
- **RESTORE** - Orange badge (#ff9800) with ↩️ icon

### 2. Clean Summary Line
Each entry shows:
- Action badge (color-coded)
- "{Officer Name} {action description} #ID" format
- Timestamp (MM/DD/YY, HH:MM AM/PM format)
- Expand/collapse arrow

### 3. Professional Detail View
When expanded, shows:

#### Basic Information (all actions)
- Officer name
- Role (Investigator, Case Manager, etc.)
- Action performed
- Full date & time (with seconds)

#### For CREATE Actions
- Narrative ID
- Content preview (first 200 characters)
- Access Level
- IP Address

#### For UPDATE Actions
- **Field-by-field changes** showing:
  - Narrative Content (if changed)
  - Access Level (if changed)
  - Assigned To (if changed)
- Each change shows "PREVIOUS" and "UPDATED" values
- Red background for old values
- Green background for new values

#### For DELETE Actions
- Narrative ID that was deleted
- Content preview of deleted narrative
- Access Level of deleted narrative
- IP Address

### 4. Smart Field Filtering
**Fields shown to users:**
- Narrative Content
- Access Level
- Assigned To
- Assigned By

**Fields hidden from users** (internal/technical):
- _id, __v (MongoDB fields)
- createdAt, updatedAt (timestamps)
- leadNo, caseNo, caseName (context info)
- enteredDate, enteredBy (redundant with audit info)
- isDeleted, deletedAt, deletedBy (internal flags)

### 5. Text Truncation
- Content previews: Limited to 200 characters
- Long text in changes: Truncated at 100 characters
- Hover/click to see full content

### 6. Filtering Options
Users can filter by:
- **Action Type**: All, Create, Update, Delete, Restore
- **Entity Type**: LeadReturnResult (Narrative) only on this page
- **Limit**: Last 25, 50, 100, or 200 entries

### 7. Professional Styling
- Clean, modern Bootstrap-inspired design
- Subtle shadows and borders
- Hover effects for interactivity
- Smooth animations for expand/collapse
- Responsive design for mobile devices

## Information Displayed

### What Users See
✅ **Officer who performed action**
✅ **Action type (create/update/delete)**
✅ **Date and time of action**
✅ **Which narrative was affected (ID)**
✅ **What content changed (before/after)**
✅ **Access level changes**
✅ **IP address for security**

### What Users DON'T See
❌ Raw MongoDB documents
❌ Database IDs (_id fields)
❌ Version numbers (__v)
❌ Internal timestamps (createdAt/updatedAt)
❌ Redundant case/lead context info
❌ Technical database fields

## Use Cases

### 1. Chain of Custody
Case Managers can see the complete history of who touched each narrative and when:
```
12/22/24 2:30 PM - John Smith created narrative #A
12/22/24 3:15 PM - Jane Doe updated narrative #A (changed access level)
12/23/24 9:00 AM - John Smith updated narrative #A (added details)
```

### 2. Tracking Changes
Investigators can see exactly what was changed:
```
UPDATE - Sarah Jones updated narrative #B
  Access Level: Everyone → Only Case Manager
  (Narrative made confidential due to ongoing investigation)
```

### 3. Accountability
Supervisors can verify all actions:
```
DELETE - Mike Wilson deleted narrative #C
  Content: "Duplicate entry - information already in narrative #A"
  Reason: Removed duplicate to maintain record integrity
```

### 4. Audit Trail
Legal/compliance teams have complete audit trail:
```
Full audit log showing:
- Every action taken
- Who performed it
- When it occurred
- What changed
- From which IP address
```

## User Experience Flow

1. **User opens LRReturn page**
   - Activity Log appears below narrative table
   - Shows last 50 actions by default
   - Most recent actions at top

2. **User sees summary**
   - Quick scan of recent activity
   - Color-coded badges for action types
   - Clear "who did what when" format

3. **User clicks to expand**
   - Smooth animation reveals details
   - Clean, organized information
   - Easy to read format

4. **User reviews changes**
   - See exactly what was modified
   - Before/after comparison
   - No technical jargon

5. **User can filter**
   - Focus on specific action types
   - Adjust number of entries shown
   - Refresh for latest data

## Benefits

### For Investigators
- See who modified their narratives
- Track collaboration on cases
- Understand change history

### For Case Managers
- Complete oversight of all actions
- Verify compliance with procedures
- Audit trail for reviews

### For Supervisors
- Monitor team activity
- Ensure accountability
- Identify training needs

### For Legal/Compliance
- Complete audit trail
- Chain of custody documentation
- Regulatory compliance support

## Technical Notes

- **Auto-refresh**: Activity log updates automatically after create/update/delete
- **Real-time**: Changes appear immediately
- **Performance**: Optimized with pagination and indexing
- **Security**: Authentication required, respects access levels
- **Responsive**: Works on desktop, tablet, and mobile devices

## Summary

The Professional Activity Log provides a **clean, user-friendly view** of all narrative activities, focusing on:
- **Who**: Officer name and role
- **What**: Clear action descriptions and change details
- **When**: Full timestamps
- **Where**: Narrative ID

Without exposing:
- Database internals
- Technical implementation details
- Redundant or confusing information

This creates a professional, police-appropriate audit trail that supports chain of custody requirements and operational transparency.
