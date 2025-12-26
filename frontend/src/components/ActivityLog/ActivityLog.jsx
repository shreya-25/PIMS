import React, { useState, useEffect } from 'react';
import api from '../../api';
import './ActivityLog.css';

export const ActivityLog = ({ caseNo, leadNo, entityType = null, refreshTrigger = 0 }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    action: '',
    entityType: entityType || '',
    limit: 50
  });
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    fetchAuditLogs();
  }, [caseNo, leadNo, filter, refreshTrigger]);

  const fetchAuditLogs = async () => {
    if (!caseNo || !leadNo) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const params = {
        caseNo,
        leadNo,
        limit: filter.limit
      };

      if (filter.action) params.action = filter.action;
      if (filter.entityType) params.entityType = filter.entityType;

      const response = await api.get('/api/audit/logs', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      setLogs(response.data.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (logId) => {
    setShowDetails(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return '➕';
      case 'UPDATE':
        return '✏️';
      case 'DELETE':
        return '🗑️';
      case 'RESTORE':
        return '↩️';
      default:
        return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return '#4caf50';
      case 'UPDATE':
        return '#2196f3';
      case 'DELETE':
        return '#f44336';
      case 'RESTORE':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const getFieldLabel = (fieldName) => {
    const labels = {
      // Common fields
      leadReturnResult: 'Narrative Content',
      accessLevel: 'Access Level',
      enteredBy: 'Entered By',
      enteredDate: 'Date Entered',
      leadReturnId: 'Narrative ID',
      assignedTo: 'Assigned To',
      assignedBy: 'Assigned By',

      // Person fields
      firstName: 'First Name',
      lastName: 'Last Name',
      middleInitial: 'Middle Initial',
      suffix: 'Suffix',
      cellNumber: 'Cell Number',
      alias: 'Alias',
      businessName: 'Business Name',
      address: 'Address',
      ssn: 'SSN',
      age: 'Age',
      email: 'Email',
      occupation: 'Occupation',
      personType: 'Person Type',
      condition: 'Condition',
      cautionType: 'Caution Type',
      sex: 'Sex',
      race: 'Race',
      ethnicity: 'Ethnicity',
      skinTone: 'Skin Tone',
      eyeColor: 'Eye Color',
      hairColor: 'Hair Color',
      glasses: 'Glasses',
      height: 'Height',
      weight: 'Weight',
      scar: 'Scar',
      tattoo: 'Tattoo',
      mark: 'Mark',

      // Vehicle fields
      year: 'Year',
      make: 'Make',
      model: 'Model',
      plate: 'Plate',
      vin: 'VIN',
      state: 'State',
      category: 'Category',
      type: 'Type',
      primaryColor: 'Primary Color',
      secondaryColor: 'Secondary Color',
      information: 'Information',

      // Enclosure fields
      enclosureDescription: 'Description',
      originalName: 'Original File Name',
      filename: 'File Name',
      s3Key: 'File Key',
      isLink: 'Is Link',
      link: 'Link'
    };
    return labels[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (value.assignees) return value.assignees.join(', ');
      if (value.assignee) return value.assignee;
      return JSON.stringify(value);
    }
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  const renderChangeSummary = (log) => {
    if (!log.oldValue || !log.newValue) return null;

    const changes = [];
    const oldVal = log.oldValue;
    const newVal = log.newValue;

    // Skip internal/technical fields
    const skipFields = ['_id', '__v', 'createdAt', 'updatedAt',
                        'leadNo', 'description', 'caseNo', 'caseName',
                        'enteredDate', 'enteredBy',
                        'isDeleted', 'deletedAt', 'deletedBy', 'additionalData'];

    Object.keys(newVal).forEach(key => {
      // Skip internal fields
      if (skipFields.includes(key)) return;

      const oldValue = oldVal[key];
      const newValue = newVal[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          fieldLabel: getFieldLabel(key),
          from: formatFieldValue(oldValue),
          to: formatFieldValue(newValue)
        });
      }
    });

    if (changes.length === 0) return <span className="no-changes">No content changes detected</span>;

    return (
      <div className="changes-list">
        {changes.map((change, idx) => (
          <div key={idx} className="change-item">
            <strong>{change.fieldLabel}:</strong>
            <div className="change-values">
              <div className="value-container">
                <span className="value-label">Previous:</span>
                <span className="old-value">{change.from}</span>
              </div>
              <div className="value-container">
                <span className="value-label">Updated:</span>
                <span className="new-value">{change.to}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getActionDescription = (log) => {
    const entityLabels = {
      'LeadReturnResult': 'narrative',
      'LRPerson': 'person',
      'LRVehicle': 'vehicle',
      'LREnclosure': 'enclosure',
      'LREvidence': 'evidence',
      'LRPicture': 'picture',
      'LRAudio': 'audio',
      'LRVideo': 'video',
      'LRScratchpad': 'note',
      'LRTimeline': 'timeline entry'
    };

    const entityLabel = entityLabels[log.entityType] || 'record';

    switch (log.action) {
      case 'CREATE':
        return `created ${entityLabel} #${log.entityId}`;
      case 'UPDATE':
        return `updated ${entityLabel} #${log.entityId}`;
      case 'DELETE':
        return `deleted ${entityLabel} #${log.entityId}`;
      case 'RESTORE':
        return `restored ${entityLabel} #${log.entityId}`;
      default:
        return `performed action on ${entityLabel} #${log.entityId}`;
    }
  };

  if (loading) {
    return <div className="activity-log-loading">Loading activity logs...</div>;
  }

  if (error) {
    return <div className="activity-log-error">{error}</div>;
  }

  return (
    <div className="activity-log-container">
      <div className="activity-log-header">
        <h3>Activity Log</h3>
        <div className="activity-log-filters">
          <select
            value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          >
            <option value="">Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="RESTORE">Restore</option>
          </select>

          {!entityType && (
            <select
              value={filter.entityType}
              onChange={(e) => setFilter({ ...filter, entityType: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="LeadReturnResult">Narrative</option>
              <option value="LRPerson">Person</option>
              <option value="LRVehicle">Vehicle</option>
              <option value="LREnclosure">Enclosure</option>
              <option value="LREvidence">Evidence</option>
              <option value="LRPicture">Picture</option>
              <option value="LRAudio">Audio</option>
              <option value="LRVideo">Video</option>
              <option value="LRScratchpad">Notes</option>
              <option value="LRTimeline">Timeline</option>
            </select>
          )}

          <select
            value={filter.limit}
            onChange={(e) => setFilter({ ...filter, limit: Number(e.target.value) })}
          >
            <option value={25}>Last 25</option>
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={200}>Last 200</option>
          </select>

          <button onClick={fetchAuditLogs} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="no-activity">No activity recorded yet</div>
      ) : (
        <div className="activity-log-list">
          {logs.map((log) => (
            <div key={log._id} className="activity-log-item">
              <div className="log-header" onClick={() => toggleDetails(log._id)}>
                {/* <span
                  className="action-badge"
                  style={{ backgroundColor: getActionColor(log.action) }}
                >
                  {getActionIcon(log.action)} {log.action}
                </span> */}
                <span className="action-summary">
                  <strong>{log.performedBy?.username || log.performedBy || 'Unknown'}</strong> {getActionDescription(log)}
                </span>
                <span className="timestamp">{formatTimestamp(log.timestamp)}</span>
                <span className="expand-icon">{showDetails[log._id] ? '▼' : '▶'}</span>
              </div>

              {showDetails[log._id] && (
                <div className="log-details">
                  {/* <div className="detail-section">
                    <div className="detail-row">
                      <span className="detail-label">Officer:</span>
                      <span className="detail-value">{log.performedBy.username}</span>
                    </div>
                    {log.performedBy.role && (
                      <div className="detail-row">
                        <span className="detail-label">Role:</span>
                        <span className="detail-value">{log.performedBy.role}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Action:</span>
                      <span className="detail-value">{getActionDescription(log)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Date & Time:</span>
                      <span className="detail-value">{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div> */}

                  {log.action === 'UPDATE' && renderChangeSummary(log)}

                  {log.action === 'DELETE' && log.oldValue && (
                    <div className="deleted-info">
                      <div className="info-header">Deleted Details:</div>
                      <div className="info-content">
                        {log.oldValue.leadReturnId && (
                          <div className="detail-row">
                            <span className="detail-label">Narrative ID:</span>
                            <span className="detail-value">{log.oldValue.leadReturnId}</span>
                          </div>
                        )}
                        {log.oldValue.firstName && (
                          <div className="detail-row">
                            <span className="detail-label">Name:</span>
                            <span className="detail-value">
                              {log.oldValue.firstName} {log.oldValue.middleInitial || ''} {log.oldValue.lastName || ''}
                            </span>
                          </div>
                        )}
                        {log.oldValue.vin && (
                          <div className="detail-row">
                            <span className="detail-label">VIN:</span>
                            <span className="detail-value">{log.oldValue.vin}</span>
                          </div>
                        )}
                        {log.oldValue.make && (
                          <div className="detail-row">
                            <span className="detail-label">Vehicle:</span>
                            <span className="detail-value">
                              {log.oldValue.year || ''} {log.oldValue.make} {log.oldValue.model || ''}
                            </span>
                          </div>
                        )}
                        {log.oldValue.originalName && (
                          <div className="detail-row">
                            <span className="detail-label">File:</span>
                            <span className="detail-value">{log.oldValue.originalName}</span>
                          </div>
                        )}
                        {log.oldValue.leadReturnResult && (
                          <div className="detail-row">
                            <span className="detail-label">Content Preview:</span>
                            <span className="detail-value narrative-preview">
                              {log.oldValue.leadReturnResult.length > 200
                                ? log.oldValue.leadReturnResult.substring(0, 200) + '...'
                                : log.oldValue.leadReturnResult}
                            </span>
                          </div>
                        )}
                        {log.oldValue.accessLevel && (
                          <div className="detail-row">
                            <span className="detail-label">Access Level:</span>
                            <span className="detail-value">{log.oldValue.accessLevel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {log.action === 'CREATE' && log.newValue && (
                    <div className="created-info">
                      <div className="info-header">New Details:</div>
                      <div className="info-content">
                        {log.newValue.leadReturnId && (
                          <div className="detail-row">
                            <span className="detail-label">Narrative ID:</span>
                            <span className="detail-value">{log.newValue.leadReturnId}</span>
                          </div>
                        )}
                        {log.newValue.firstName && (
                          <div className="detail-row">
                            <span className="detail-label">Name:</span>
                            <span className="detail-value">
                              {log.newValue.firstName} {log.newValue.middleInitial || ''} {log.newValue.lastName || ''}
                            </span>
                          </div>
                        )}
                        {log.newValue.vin && (
                          <div className="detail-row">
                            <span className="detail-label">VIN:</span>
                            <span className="detail-value">{log.newValue.vin}</span>
                          </div>
                        )}
                        {log.newValue.make && (
                          <div className="detail-row">
                            <span className="detail-label">Vehicle:</span>
                            <span className="detail-value">
                              {log.newValue.year || ''} {log.newValue.make} {log.newValue.model || ''}
                            </span>
                          </div>
                        )}
                        {log.newValue.originalName && (
                          <div className="detail-row">
                            <span className="detail-label">File:</span>
                            <span className="detail-value">{log.newValue.originalName}</span>
                          </div>
                        )}
                        {log.newValue.leadReturnResult && (
                          <div className="detail-row">
                            <span className="detail-label">Content Preview:</span>
                            <span className="detail-value narrative-preview">
                              {log.newValue.leadReturnResult.length > 200
                                ? log.newValue.leadReturnResult.substring(0, 200) + '...'
                                : log.newValue.leadReturnResult}
                            </span>
                          </div>
                        )}
                        {log.newValue.accessLevel && (
                          <div className="detail-row">
                            <span className="detail-label">Access Level:</span>
                            <span className="detail-value">{log.newValue.accessLevel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {log.metadata && log.metadata.ip && (
                    <div className="metadata">
                      <div className="detail-row">
                        <span className="detail-label">IP Address:</span>
                        <span className="detail-value">{log.metadata.ip}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
