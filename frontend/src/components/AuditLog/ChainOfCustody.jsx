import React, { useState, useEffect } from 'react';
import api from '../../api';
import './ChainOfCustody.css';

export const ChainOfCustody = ({ leadNo }) => {
  const [custodyChain, setCustodyChain] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (leadNo && !isNaN(leadNo)) {
      fetchChainOfCustody();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadNo]);

  const fetchChainOfCustody = async () => {
    if (!leadNo || isNaN(leadNo)) return;

    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const { data } = await api.get(
        `/api/audit-logs/${leadNo}/chain-of-custody`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (data.success) {
        setCustodyChain(data.data);
      }
    } catch (err) {
      console.error('Error fetching chain of custody:', err);
      setError(err.response?.data?.message || 'Failed to load chain of custody');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (action) => {
    switch (action) {
      case 'LEAD_CREATED':
        return '#28a745';
      case 'LEAD_ASSIGNED':
        return '#007bff';
      case 'LEAD_SUBMITTED':
        return '#17a2b8';
      case 'LEAD_APPROVED':
        return '#28a745';
      case 'LEAD_RETURNED':
        return '#ffc107';
      case 'LEAD_REOPENED':
        return '#fd7e14';
      case 'LEAD_COMPLETED':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getActionLabel = (action) => {
    return action.replace('LEAD_', '').replace(/_/g, ' ');
  };

  if (!leadNo) {
    return (
      <div className="chain-of-custody">
        <p className="no-lead-message">Please select a lead to view chain of custody.</p>
      </div>
    );
  }

  return (
    <div className="chain-of-custody">
      <div className="custody-header">
        <h3>Chain of Custody Timeline</h3>
        <button className="btn-refresh" onClick={fetchChainOfCustody}>
          Refresh
        </button>
      </div>

      {loading && <div className="loading-spinner">Loading chain of custody...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="custody-timeline">
        {custodyChain.length === 0 && !loading && (
          <p className="no-custody">No custody records found.</p>
        )}

        {custodyChain.map((record, index) => (
          <div key={record._id || index} className="custody-item">
            <div className="custody-dot" style={{ background: getStatusColor(record.action) }}></div>
            <div className="custody-line"></div>
            <div className="custody-content">
              <div className="custody-status" style={{ color: getStatusColor(record.action) }}>
                {getActionLabel(record.action)}
              </div>
              <div className="custody-description">{record.description}</div>
              <div className="custody-metadata">
                <span className="custody-user">
                  <strong>Officer:</strong> {record.performedBy.username}
                  {record.performedBy.badge && ` (Badge: ${record.performedBy.badge})`}
                </span>
                <span className="custody-time">{formatTimestamp(record.timestamp)}</span>
              </div>

              {record.chainOfCustody && (
                <div className="custody-transfer">
                  {record.chainOfCustody.transferredFrom && (
                    <div>
                      <strong>From:</strong> {record.chainOfCustody.transferredFrom}
                    </div>
                  )}
                  {record.chainOfCustody.transferredTo && (
                    <div>
                      <strong>To:</strong> {record.chainOfCustody.transferredTo}
                    </div>
                  )}
                  {record.chainOfCustody.transferReason && (
                    <div>
                      <strong>Reason:</strong> {record.chainOfCustody.transferReason}
                    </div>
                  )}
                </div>
              )}

              {record.metadata?.ipAddress && (
                <div className="custody-ip">
                  <strong>IP Address:</strong> {record.metadata.ipAddress}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="custody-footer">
        <p>Total Custody Events: {custodyChain.length}</p>
        <p>Lead: {leadNo}</p>
      </div>
    </div>
  );
};
