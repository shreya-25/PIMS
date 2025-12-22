# Audit Log Implementation for LRReturn (Lead Narrative)

## Overview

This document describes the comprehensive audit logging system implemented for the LRReturn page in PIMS. The system tracks all CREATE, UPDATE, and DELETE operations on Lead Return Results (narratives), providing full accountability and traceability.

## Features Implemented

### 1. Database Schema
- **AuditLog Model** (`backend/src/models/AuditLog.js`)
  - Tracks who did what, when, where, and why
  - Stores before/after snapshots of data
  - Indexed for fast querying by case, lead, entity type, action, and timestamp
  - Supports multiple entity types (LeadReturnResult, LRPerson, LRVehicle, etc.)

### 2. Soft Delete
- **Modified LeadReturnResult Model** (`backend/src/models/leadReturnResult.js`)
  - Added fields: `isDeleted`, `deletedAt`, `deletedBy`
  - Records are marked as deleted instead of being permanently removed
  - Allows for potential restoration and maintains audit trail

### 3. Backend Services
- **Audit Service** (`backend/src/services/auditService.js`)
  - `createAuditLog()` - Create new audit log entries
  - `getAuditLogs()` - Retrieve audit logs with filtering
  - `getEntityAuditHistory()` - Get history for specific entity
  - `getUserActivity()` - Get recent activity for a user
  - `sanitizeForAudit()` - Clean sensitive data before logging

### 4. Backend Controller Updates
- **Updated leadReturnResultController** (`backend/src/controller/leadReturnResultController.js`)
  - CREATE operations log the new record
  - UPDATE operations log before/after states
  - DELETE operations perform soft delete and log the deleted record
  - GET operations exclude soft-deleted records

### 5. API Endpoints
- **Audit Log Routes** (`backend/src/routes/auditLogRoutes.js`)
  ```
  GET /api/audit/logs?caseNo=XXX&leadNo=YYY&entityType=...&action=...
  GET /api/audit/entity/:entityType/:entityId
  GET /api/audit/my-activity?limit=50
  GET /api/audit/stats?caseNo=XXX&leadNo=YYY
  ```

### 6. Frontend Component
- **ActivityLog Component** (`frontend/src/components/ActivityLog/`)
  - **Professional, user-friendly display** of audit entries
  - **Clean summary format**: "Officer Name + Action + Narrative ID + Timestamp"
  - **No raw database records shown** - only relevant information
  - Filtering by action type and entity type
  - Expandable details showing:
    - Officer information (name, role)
    - Action description in plain English
    - Date & time with full precision
    - **For UPDATES**: Field-by-field before/after changes
    - **For CREATES**: Preview of new narrative content
    - **For DELETES**: Preview of deleted narrative content
  - Color-coded action badges (Create=Green, Update=Blue, Delete=Red)
  - Smart field filtering (hides technical/internal fields)
  - Text truncation for readability
  - Responsive design with modern, clean UI
  - Real-time refresh capability

### 7. Integration
- **LRReturn Page** (`frontend/src/Pages/InvestgatorLR/LRReturn/LRReturn.jsx`)
  - ActivityLog component integrated below the narrative table
  - Auto-refreshes after create/update/delete operations
  - Shows only "LeadReturnResult" entity type logs

## What Gets Logged

### For CREATE Operations
```javascript
{
  action: "CREATE",
  entityType: "LeadReturnResult",
  entityId: "A", "B", "C", etc.
  performedBy: { username, role },
  oldValue: null,
  newValue: { ...entire new record },
  metadata: { ip, userAgent },
  timestamp: new Date()
}
```

### For UPDATE Operations
```javascript
{
  action: "UPDATE",
  entityType: "LeadReturnResult",
  entityId: "A",
  performedBy: { username, role },
  oldValue: { ...record before changes },
  newValue: { ...record after changes },
  metadata: { ip, userAgent, changedFields: "leadReturnResult, accessLevel" },
  timestamp: new Date()
}
```

### For DELETE Operations (Soft Delete)
```javascript
{
  action: "DELETE",
  entityType: "LeadReturnResult",
  entityId: "A",
  performedBy: { username, role },
  oldValue: { ...deleted record },
  newValue: null,
  metadata: { ip, userAgent, notes: "Soft delete - record marked as deleted" },
  timestamp: new Date()
}
```

## Key Design Decisions

### Why Soft Delete?
1. **Accountability**: Maintains complete history
2. **Recovery**: Can restore accidentally deleted records
3. **Legal**: Meets chain-of-custody requirements for police work
4. **Audit Trail**: Deleted records still visible in audit logs

### Why Store Full Snapshots?
1. **Complete History**: Can reconstruct state at any point in time
2. **Change Detection**: Easy to see what changed between versions
3. **Debugging**: Helps identify issues with data corruption
4. **Compliance**: Full audit trail for regulatory requirements

### Why Server-Side Logging?
1. **Security**: Can't be bypassed by malicious users
2. **Reliability**: Guaranteed to capture all changes
3. **Accuracy**: Uses actual database state, not client state
4. **Centralized**: Single source of truth

## Security Considerations

### Data Sanitization
- Passwords and sensitive fields are removed before logging
- Large binary data (files) is not stored in audit logs
- PII (Personally Identifiable Information) is handled carefully

### Access Control
- All audit endpoints require authentication (`verifyToken` middleware)
- Role-based filtering respects access levels
- IP addresses and user agents are logged for security

### Immutability
- Audit logs cannot be edited or deleted
- Only creation is allowed
- MongoDB timestamps provide additional verification

## Performance Optimization

### Database Indexes
```javascript
// Compound indexes for common queries
{ caseNo: 1, leadNo: 1, timestamp: -1 }
{ entityType: 1, entityId: 1, timestamp: -1 }
{ "performedBy.username": 1, timestamp: -1 }
```

### Query Limits
- Default limit: 100 records
- Configurable via API parameters
- Pagination support with skip/limit

## UI Features

### Activity Log Component Features
1. **Filtering**
   - By action type (CREATE, UPDATE, DELETE, RESTORE)
   - By entity type (LeadReturnResult, LRPerson, etc.)
   - By time range (Last 25, 50, 100, 200)

2. **Visual Indicators**
   - Color-coded badges for different actions
   - Icons for quick recognition
   - Expandable detail views

3. **Change Details**
   - Shows field-by-field differences
   - Old value → New value display
   - Highlights what changed

4. **Metadata Display**
   - Timestamp (formatted for readability)
   - User who performed the action
   - User role
   - IP address (if available)
   - Additional notes

## Testing Checklist

### Backend Testing
- [ ] Create a new narrative → Check audit log created
- [ ] Update a narrative → Check audit log shows before/after
- [ ] Delete a narrative → Check soft delete + audit log
- [ ] Query audit logs by case/lead → Verify filtering works
- [ ] Check that deleted records don't appear in GET requests
- [ ] Verify only authenticated users can access audit logs

### Frontend Testing
- [ ] ActivityLog component renders on LRReturn page
- [ ] Filter by action type works
- [ ] Filter by entity type works
- [ ] Expand/collapse details works
- [ ] Refresh button updates logs
- [ ] Auto-refresh after create/update/delete
- [ ] Change summary displays correctly
- [ ] Timestamps format correctly
- [ ] Responsive design on mobile

### Security Testing
- [ ] Unauthenticated requests are rejected
- [ ] Sensitive data is sanitized in logs
- [ ] Audit logs cannot be modified
- [ ] Role-based access is enforced
- [ ] IP addresses are captured

## Future Enhancements

### Potential Improvements
1. **Restore Functionality**
   - Add UI button to restore soft-deleted records
   - Implement RESTORE action logging

2. **Advanced Filtering**
   - Date range picker
   - User filter
   - Full-text search in changes

3. **Export Functionality**
   - Export audit logs to CSV/PDF
   - Generate compliance reports

4. **Real-time Notifications**
   - WebSocket updates for new audit entries
   - Alert Case Managers of critical changes

5. **Data Retention Policies**
   - Archive old audit logs
   - Compress historical data
   - Automatic cleanup after N years

6. **Analytics Dashboard**
   - Activity heatmaps
   - User activity statistics
   - Change frequency analysis

## Extending to Other Entities

To add audit logging to other entity types (LRPerson, LRVehicle, etc.):

1. **Update Controller**: Import `createAuditLog` and `sanitizeForAudit`
2. **Add Soft Delete**: Add `isDeleted`, `deletedAt`, `deletedBy` fields
3. **Log Operations**: Call `createAuditLog()` in CREATE/UPDATE/DELETE handlers
4. **Update GET**: Add `isDeleted: { $ne: true }` filter
5. **Add to UI**: Include ActivityLog component with appropriate `entityType`

### Example for LRPerson:
```javascript
// In LRPersonController.js
const { createAuditLog, sanitizeForAudit } = require("../services/auditService");

// In create handler
await createAuditLog({
  caseNo, caseName, leadNo, leadName,
  entityType: "LRPerson",
  entityId: newPerson.personId,
  action: "CREATE",
  performedBy: { username: req.user?.name, role: req.user?.role },
  oldValue: null,
  newValue: sanitizeForAudit(newPerson.toObject()),
  metadata: { ip: req.ip, userAgent: req.get('user-agent') }
});
```

## Files Created/Modified

### New Files
- `backend/src/models/AuditLog.js`
- `backend/src/services/auditService.js`
- `backend/src/controller/auditLogController.js`
- `backend/src/routes/auditLogRoutes.js`
- `frontend/src/components/ActivityLog/ActivityLog.jsx`
- `frontend/src/components/ActivityLog/ActivityLog.css`

### Modified Files
- `backend/src/models/leadReturnResult.js` (added soft delete fields)
- `backend/src/controller/leadReturnResultController.js` (added audit logging)
- `backend/src/server.js` (registered audit routes)
- `frontend/src/Pages/InvestgatorLR/LRReturn/LRReturn.jsx` (integrated ActivityLog)

## API Usage Examples

### Get audit logs for a specific case/lead
```javascript
const response = await api.get('/api/audit/logs', {
  params: {
    caseNo: '2024-001',
    leadNo: 123,
    entityType: 'LeadReturnResult',
    action: 'UPDATE',
    limit: 50
  },
  headers: { Authorization: `Bearer ${token}` }
});
```

### Get history for a specific entity
```javascript
const response = await api.get('/api/audit/entity/LeadReturnResult/A', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Get current user's activity
```javascript
const response = await api.get('/api/audit/my-activity?limit=25', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Get activity statistics
```javascript
const response = await api.get('/api/audit/stats', {
  params: {
    caseNo: '2024-001',
    leadNo: 123
  },
  headers: { Authorization: `Bearer ${token}` }
});
```

## Troubleshooting

### Common Issues

1. **Audit logs not appearing**
   - Check backend console for errors
   - Verify MongoDB connection
   - Ensure audit routes are registered in server.js
   - Check authentication token is valid

2. **Soft-deleted records still showing**
   - Verify GET query includes `isDeleted: { $ne: true }`
   - Check database to confirm isDeleted flag is set
   - Clear frontend cache

3. **Changes not showing in detail view**
   - Verify oldValue and newValue are being saved
   - Check sanitizeForAudit isn't removing needed fields
   - Inspect network response in browser DevTools

4. **Performance issues with large audit logs**
   - Reduce default limit
   - Add pagination
   - Create additional indexes
   - Consider archiving old logs

## Conclusion

This comprehensive audit logging system provides full accountability and traceability for all operations on Lead Return Results. It follows best practices for security, performance, and user experience, and can be easily extended to other entity types in the PIMS system.

For questions or issues, refer to the troubleshooting section or contact the development team.
