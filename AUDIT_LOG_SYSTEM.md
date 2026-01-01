# Comprehensive Audit Logging & Chain of Custody System

## Overview

A complete audit logging and chain of custody tracking system for lead returns that records **every action** performed on a lead return, providing full transparency and accountability.

## Features

### 1. **Complete Audit Trail**
- Tracks all actions performed on lead returns
- Records who performed each action
- Captures IP address and user agent for security
- Maintains timestamps for all activities
- Stores before/after states for updates

### 2. **Chain of Custody Tracking**
- Chronological timeline of lead ownership
- Tracks all transfers and assignments
- Records transfer reasons
- Visual timeline display

### 3. **Detailed Change Tracking**
- Field-level change detection
- Old value → New value comparisons
- Tracks changes across all entity types:
  - Narratives (Lead Return Results)
  - Persons
  - Vehicles
  - Timeline Events
  - Evidence
  - Pictures, Audio, Video
  - Enclosures
  - Notes (Scratchpad)

### 4. **Advanced Filtering**
- Filter by action type
- Filter by user
- Filter by date range
- Filter by entity type
- Export audit logs to JSON

## Architecture

### Backend Components

#### 1. **Audit Log Model** (`backend/src/models/LeadReturnAuditLog.js`)

Stores all audit log entries with:
- Lead and case identification
- Action type (enumerated list of all possible actions)
- Entity information (type and ID)
- User information (username, role, badge)
- Change details (before/after states, field-level changes)
- Metadata (IP address, user agent, session ID)
- Chain of custody information

**Key Fields:**
```javascript
{
  leadNo: Number,
  caseNo: String,
  action: String, // LEAD_CREATED, NARRATIVE_UPDATED, etc.
  entityType: String,
  entityId: String,
  performedBy: {
    username: String,
    role: String,
    badge: String
  },
  changes: {
    before: Mixed,
    after: Mixed
  },
  fieldChanges: [{
    field: String,
    oldValue: Mixed,
    newValue: Mixed
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    reasonForChange: String
  },
  chainOfCustody: {
    transferredFrom: String,
    transferredTo: String,
    transferReason: String
  },
  timestamp: Date
}
```

#### 2. **Audit Logger Utility** (`backend/src/utils/auditLogger.js`)

Provides helper functions for logging actions:

**Core Functions:**
- `logLeadCreation()` - Log new lead creation
- `logLeadAssignment()` - Log lead assignment/transfer
- `logStatusChange()` - Log status changes
- `logEntityCreation()` - Log entity additions
- `logEntityUpdate()` - Log entity modifications
- `logEntityDeletion()` - Log entity removals
- `logSnapshotCreation()` - Log version snapshots
- `logVersionRestore()` - Log version restorations
- `logLeadAccess()` - Log lead views

**Helper Functions:**
- `extractUserInfo()` - Extract user info from request
- `extractMetadata()` - Extract IP, user agent, etc.
- `compareObjects()` - Deep comparison for change detection
- `getEntityLabel()` - Generate human-readable labels

#### 3. **API Routes** (`backend/src/routes/auditLogRoutes.js`)

**Endpoints:**

```
GET /api/audit-logs/:leadNo
```
Get complete audit trail for a lead with optional filters:
- `action` - Filter by action type
- `performedBy` - Filter by username
- `entityType` - Filter by entity type
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `limit` - Limit results (default: 100)
- `skip` - Skip records for pagination

```
GET /api/audit-logs/:leadNo/chain-of-custody
```
Get chain of custody timeline for a lead (only custody-related actions)

```
GET /api/audit-logs/:leadNo/summary
```
Get audit log summary with statistics:
- Total actions
- Actions by type
- Actions by user
- Entity changes
- Recent timeline

```
GET /api/audit-logs/user/:username
```
Get all actions performed by a specific user

```
GET /api/audit-logs/:leadNo/entity/:entityType/:entityId
```
Get audit trail for a specific entity

```
GET /api/audit-logs/:leadNo/export
```
Export audit trail to JSON file

```
DELETE /api/audit-logs/:leadNo
```
Delete all audit logs for a lead (Admin only - use with caution)

### Frontend Components

#### 1. **AuditLogViewer** (`frontend/src/components/AuditLog/AuditLogViewer.jsx`)

Full-featured audit log viewer with:
- **Filtering**: Action type, entity type, user, date range
- **Color-coding**: Different colors for create/update/delete actions
- **Icons**: Visual indicators for each action type
- **Expandable details**: View field-level changes
- **Export**: Download audit log as JSON
- **Metadata display**: Shows user, IP address, entity type

**Usage:**
```jsx
<AuditLogViewer
  leadNo={leadNo}
  caseNo={caseNo}
/>
```

#### 2. **ChainOfCustody** (`frontend/src/components/AuditLog/ChainOfCustody.jsx`)

Visual timeline of custody events:
- **Timeline view**: Chronological custody chain
- **Color-coded statuses**: Different colors for each status
- **Transfer information**: Shows from/to and reason
- **Metadata**: IP address, timestamps

**Usage:**
```jsx
<ChainOfCustody
  leadNo={leadNo}
/>
```

#### 3. **Integration in LRReturn Page**

Tabbed interface showing:
1. **Recent Activity** - Existing activity log (entity-specific)
2. **Audit Trail** - Complete audit log with filters
3. **Chain of Custody** - Custody timeline

## Action Types

### Lead Return Actions
- `LEAD_CREATED` - New lead return created
- `LEAD_ASSIGNED` - Lead assigned/transferred
- `LEAD_SUBMITTED` - Lead submitted for review
- `LEAD_APPROVED` - Lead approved by supervisor
- `LEAD_RETURNED` - Lead returned for corrections
- `LEAD_REOPENED` - Lead reopened after completion
- `LEAD_COMPLETED` - Lead marked as completed
- `LEAD_DELETED` - Lead deleted
- `LEAD_UPDATED` - Lead information updated

### Entity Actions
- `NARRATIVE_CREATED/UPDATED/DELETED` - Narrative changes
- `PERSON_ADDED/UPDATED/DELETED` - Person changes
- `VEHICLE_ADDED/UPDATED/DELETED` - Vehicle changes
- `TIMELINE_ADDED/UPDATED/DELETED` - Timeline changes
- `EVIDENCE_ADDED/UPDATED/DELETED` - Evidence changes
- `PICTURE/AUDIO/VIDEO/ENCLOSURE_UPLOADED/DELETED` - Media changes
- `NOTE_CREATED/UPDATED/DELETED` - Note changes

### Version Actions
- `SNAPSHOT_CREATED` - Version snapshot created
- `VERSION_RESTORED` - Version restored
- `VERSION_COMPARED` - Versions compared

### Access Actions
- `LEAD_VIEWED` - Lead accessed/viewed
- `LEAD_EXPORTED` - Lead exported
- `LEAD_PRINTED` - Lead printed

## How It Works

### Automatic Logging

The system automatically logs actions when they occur:

1. **Lead Creation** - Logged in `leadReturnController.js`:
```javascript
await logLeadCreation(leadNo, caseNo, performedBy, metadata);
```

2. **Status Changes** - Logged in `leadReturnController.js`:
```javascript
await logStatusChange(leadNo, caseNo, oldStatus, newStatus, performedBy, reason, metadata);
```

3. **Snapshot Creation** - Logged in `leadReturnVersioning.js`:
```javascript
await logSnapshotCreation(leadNo, caseNo, versionId, reason, performedBy, metadata);
```

### Manual Logging

For entity operations (create/update/delete), you can manually log:

```javascript
const { logEntityCreation, extractUserInfo, extractMetadata } = require('../utils/auditLogger');

// In your controller
const performedBy = extractUserInfo(req);
const metadata = extractMetadata(req);

await logEntityCreation(
  leadNo,
  caseNo,
  'Narrative', // entity type
  narrativeId, // entity ID
  narrativeData, // full entity data
  performedBy,
  metadata
);
```

## Use Cases

### 1. **Compliance & Legal Requirements**
- Maintain detailed records for legal proceedings
- Prove chain of custody for evidence
- Demonstrate proper handling of cases

### 2. **Accountability**
- Track who made what changes and when
- Identify responsibility for errors or issues
- Monitor user activity

### 3. **Debugging & Troubleshooting**
- Understand what happened to a lead
- Track down when data was changed
- Identify source of problems

### 4. **Security & Auditing**
- Detect unauthorized access
- Monitor suspicious activity
- Track IP addresses for security

### 5. **Performance Review**
- Track officer productivity
- Measure response times
- Identify bottlenecks

## Example Scenarios

### Scenario 1: Lead Creation
**Action:** Officer creates a new lead return

**Logged:**
```json
{
  "action": "LEAD_CREATED",
  "description": "Lead return 1001 created for case CASE-2025-001",
  "performedBy": {
    "username": "Officer001",
    "badge": "12345"
  },
  "metadata": {
    "ipAddress": "192.168.1.100"
  },
  "chainOfCustody": {
    "transferredTo": "Officer001",
    "transferReason": "Lead created and assigned"
  }
}
```

### Scenario 2: Narrative Updated
**Action:** Officer updates narrative content

**Logged:**
```json
{
  "action": "NARRATIVE_UPDATED",
  "entityType": "Narrative",
  "entityId": "abc123",
  "description": "Updated narrative: Interview conducted...",
  "performedBy": {
    "username": "Officer002"
  },
  "fieldChanges": [
    {
      "field": "leadReturnResult",
      "oldValue": "Interview conducted",
      "newValue": "Interview conducted with witness"
    }
  ]
}
```

### Scenario 3: Lead Returned
**Action:** Supervisor returns lead for corrections

**Logged:**
```json
{
  "action": "LEAD_RETURNED",
  "description": "Lead 1001 status changed from Pending to Returned",
  "performedBy": {
    "username": "Supervisor001",
    "role": "Case Manager"
  },
  "fieldChanges": [
    {
      "field": "status",
      "oldValue": "Pending",
      "newValue": "Returned"
    }
  ],
  "metadata": {
    "reasonForChange": "Missing vehicle information"
  }
}
```

## Querying Audit Logs

### Get All Logs for a Lead
```javascript
const response = await api.get(`/api/audit-logs/${leadNo}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Filter by Date Range
```javascript
const response = await api.get(
  `/api/audit-logs/${leadNo}?startDate=2025-01-01&endDate=2025-12-31`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Filter by User
```javascript
const response = await api.get(
  `/api/audit-logs/${leadNo}?performedBy=Officer001`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Get Chain of Custody
```javascript
const response = await api.get(
  `/api/audit-logs/${leadNo}/chain-of-custody`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Export to JSON
```javascript
const response = await api.get(
  `/api/audit-logs/${leadNo}/export`,
  {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  }
);
```

## Data Retention

**Recommendations:**
- Keep audit logs indefinitely for legal compliance
- Implement archival strategy for old logs (>5 years)
- Regular backups of audit log database
- Consider separate database for audit logs

## Security Considerations

1. **Immutability**: Audit logs should never be modified, only created
2. **Access Control**: Restrict who can view/export audit logs
3. **Encryption**: Consider encrypting sensitive data in logs
4. **Retention Policy**: Define how long to keep logs
5. **Deletion**: Deleting audit logs should require admin approval

## Performance

**Optimization Tips:**
- Indexes on `leadNo`, `timestamp`, `performedBy.username`
- Compound indexes for common queries
- Consider archiving old logs to separate collection
- Use pagination for large result sets

**Current Indexes:**
```javascript
{ leadNo: 1, timestamp: -1 }
{ 'performedBy.username': 1, timestamp: -1 }
{ action: 1, timestamp: -1 }
{ entityType: 1, entityId: 1 }
{ timestamp: -1 }
```

## Troubleshooting

### Issue: Audit logs not appearing
**Solution:**
1. Check if audit logging is enabled
2. Verify API routes are registered in `server.js`
3. Check browser console for errors
4. Verify token authorization

### Issue: Missing field changes
**Solution:**
1. Ensure `compareObjects()` is being called
2. Check that old data is being passed correctly
3. Verify field names match between old and new data

### Issue: Slow performance
**Solution:**
1. Add pagination to queries
2. Use date filters to limit results
3. Check database indexes
4. Consider archiving old logs

## Future Enhancements

Possible additions:
- **Email notifications** for critical actions
- **Dashboard** with audit log analytics
- **Alerts** for suspicious activity
- **Advanced search** with full-text search
- **CSV export** in addition to JSON
- **Undo functionality** based on audit log
- **Compliance reports** generation
- **Real-time updates** using WebSockets

---

## Summary

The Audit Logging & Chain of Custody system provides:
- ✅ Complete transparency of all actions
- ✅ Full accountability with user tracking
- ✅ Detailed change history
- ✅ Chain of custody timeline
- ✅ Advanced filtering and search
- ✅ Export capabilities
- ✅ Visual timeline display
- ✅ Security metadata (IP, user agent)

**All actions are now tracked, logged, and auditable!** 🎉
