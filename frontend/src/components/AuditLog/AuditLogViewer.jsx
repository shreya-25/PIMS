import React, { useState, useEffect } from 'react';
import api from '../../api';
import './AuditLogViewer.css';

export const AuditLogViewer = ({ leadNo, caseNo }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    performedBy: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (leadNo && !isNaN(leadNo)) {
      fetchAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadNo]);

  const fetchAuditLogs = async () => {
    if (!leadNo || isNaN(leadNo)) return;

    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.performedBy) params.append('performedBy', filters.performedBy);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = queryString ? `/api/audit-logs/${leadNo}?${queryString}` : `/api/audit-logs/${leadNo}`;

      const { data } = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLog = async () => {
    if (!leadNo || isNaN(leadNo)) {
      alert('No lead selected');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await api.get(
        `/api/audit-logs/${leadNo}/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-log-lead-${leadNo}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting audit log:', err);
      alert('Failed to export audit log');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action) => {
    if (action.includes('CREATED') || action.includes('ADDED') || action.includes('UPLOADED')) {
      return '➕';
    } else if (action.includes('UPDATED')) {
      return '✏️';
    } else if (action.includes('DELETED')) {
      return '🗑️';
    } else if (action.includes('VIEWED') || action.includes('COMPARED')) {
      return '👁️';
    } else if (action.includes('APPROVED')) {
      return '✅';
    } else if (action.includes('RETURNED')) {
      return '↩️';
    } else if (action.includes('SNAPSHOT')) {
      return '📸';
    }
    return '📝';
  };

  const getActionClass = (action) => {
    if (action.includes('CREATED') || action.includes('ADDED') || action.includes('UPLOADED')) {
      return 'action-created';
    } else if (action.includes('UPDATED')) {
      return 'action-updated';
    } else if (action.includes('DELETED')) {
      return 'action-deleted';
    } else if (action.includes('APPROVED')) {
      return 'action-approved';
    } else if (action.includes('RETURNED')) {
      return 'action-returned';
    }
    return 'action-default';
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchAuditLogs();
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      performedBy: '',
      entityType: '',
      startDate: '',
      endDate: ''
    });
    setTimeout(fetchAuditLogs, 100);
  };

  if (!leadNo) {
    return (
      <div className="audit-log-viewer">
        <p className="no-lead-message">Please select a lead to view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="audit-log-viewer">
      <div className="audit-log-header">
        <h3>Audit Trail & Chain of Custody</h3>
        <div className="audit-log-actions">
          <button
            className="btn-filter"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button className="btn-export" onClick={exportAuditLog}>
            Export Log
          </button>
          <button className="btn-refresh" onClick={fetchAuditLogs}>
            Refresh
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="audit-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Action Type:</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="LEAD_CREATED">Lead Created</option>
                <option value="LEAD_ASSIGNED">Lead Assigned</option>
                <option value="LEAD_SUBMITTED">Lead Submitted</option>
                <option value="LEAD_APPROVED">Lead Approved</option>
                <option value="LEAD_RETURNED">Lead Returned</option>
                <option value="LEAD_REOPENED">Lead Reopened</option>
                <option value="NARRATIVE_CREATED">Narrative Created</option>
                <option value="NARRATIVE_UPDATED">Narrative Updated</option>
                <option value="PERSON_ADDED">Person Added</option>
                <option value="VEHICLE_ADDED">Vehicle Added</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Entity Type:</label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="LeadReturn">Lead Return</option>
                <option value="Narrative">Narrative</option>
                <option value="Person">Person</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Timeline">Timeline</option>
                <option value="Evidence">Evidence</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Performed By:</label>
              <input
                type="text"
                value={filters.performedBy}
                onChange={(e) => handleFilterChange('performedBy', e.target.value)}
                placeholder="Username..."
              />
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Start Date:</label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>End Date:</label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="filter-actions">
              <button className="btn-apply" onClick={applyFilters}>
                Apply Filters
              </button>
              <button className="btn-clear" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="loading-spinner">Loading audit logs...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="audit-log-container">
        {auditLogs.length === 0 && !loading && (
          <p className="no-logs">No audit logs found.</p>
        )}

        {auditLogs.map((log, index) => (
          <div key={log._id || index} className={`audit-log-item ${getActionClass(log.action)}`}>
            <div className="log-header">
              <span className="log-icon">{getActionIcon(log.action)}</span>
              <span className="log-action">{log.action.replace(/_/g, ' ')}</span>
              <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
            </div>

            <div className="log-description">{log.description}</div>

            <div className="log-metadata">
              <span className="log-user">
                <strong>By:</strong> {log.performedBy.username}
                {log.performedBy.badge && ` (Badge: ${log.performedBy.badge})`}
              </span>
              {log.entityType && (
                <span className="log-entity">
                  <strong>Entity:</strong> {log.entityType}
                </span>
              )}
              {log.metadata?.ipAddress && (
                <span className="log-ip">
                  <strong>IP:</strong> {log.metadata.ipAddress}
                </span>
              )}
            </div>

            {log.fieldChanges && log.fieldChanges.length > 0 && (
              <details className="log-changes">
                <summary>View Changes ({log.fieldChanges.length} fields)</summary>
                <div className="changes-list">
                  {log.fieldChanges.map((change, idx) => (
                    <div key={idx} className="change-item">
                      <div className="change-field">{change.field}:</div>
                      <div className="change-values">
                        <span className="old-value">
                          {JSON.stringify(change.oldValue)}
                        </span>
                        <span className="arrow">→</span>
                        <span className="new-value">
                          {JSON.stringify(change.newValue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {log.chainOfCustody && (
              <div className="log-custody">
                <strong>Chain of Custody:</strong>
                {log.chainOfCustody.transferredFrom && (
                  <span> From: {log.chainOfCustody.transferredFrom}</span>
                )}
                {log.chainOfCustody.transferredTo && (
                  <span> To: {log.chainOfCustody.transferredTo}</span>
                )}
                {log.chainOfCustody.transferReason && (
                  <span> ({log.chainOfCustody.transferReason})</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="audit-log-footer">
        <p>Total Records: {auditLogs.length}</p>
        {caseNo && <p>Case: {caseNo}</p>}
        <p>Lead: {leadNo}</p>
      </div>
    </div>
  );
};
