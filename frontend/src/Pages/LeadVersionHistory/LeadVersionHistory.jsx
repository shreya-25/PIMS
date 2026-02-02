import React, { useContext, useEffect, useRef, useState } from "react";
import api from "../../api";
import { CaseContext } from "../CaseContext";
import "./LeadVersionHistory.css";

export const LeadVersionHistory = () => {
  const { selectedLead, selectedCase } = useContext(CaseContext);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionDetails, setVersionDetails] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareFrom, setCompareFrom] = useState(null);
  const [compareTo, setCompareTo] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [versionActivityLogs, setVersionActivityLogs] = useState({});

  useEffect(() => {
    if (selectedLead?.leadNo) {
      fetchVersionHistory();
    }
  }, [selectedLead]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      // Build params object with case filters
      // Use selectedLead case info first, fallback to selectedCase if not available
      const params = {};
      const caseNo = selectedLead.caseNo || selectedCase?.caseNo;
      const caseName = selectedLead.caseName || selectedCase?.caseName;

      // IMPORTANT: Include case filters to ensure version history is specific to this lead+case
      if (caseNo) {
        params.caseNo = caseNo;
      }
      if (caseName) {
        params.caseName = caseName;
      }

      console.log('🔍 DEBUG: selectedLead object:', selectedLead);
      console.log('🔍 DEBUG: selectedCase object:', selectedCase);
      console.log('📋 Fetching version history with params:', {
        leadNo: selectedLead.leadNo,
        caseNo: caseNo,
        caseName: caseName,
        params: params
      });

      // Fetch version history filtered by leadNo, caseNo, and caseName
      // This ensures we only show logs for the specific case/lead combination
      const { data } = await api.get(
        `/api/leadreturn-versions/${selectedLead.leadNo}/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );

      console.log('📥 Received version history:', {
        success: data.success,
        count: data.count
      });

      if (data.success) {
        setVersions(data.data || []);

        // Fetch activity logs for all versions (compare each with previous)
        const activityLogs = {};
        for (let i = 0; i < data.data.length; i++) {
          const currentVersion = data.data[i];
          if (i < data.data.length - 1) {
            // Compare with previous version (versions are sorted newest first)
            const previousVersion = data.data[i + 1];
            try {
              const { data: activityData } = await api.get(
                `/api/leadreturn-versions/${selectedLead.leadNo}/activity/${previousVersion.versionId}/${currentVersion.versionId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  params
                }
              );

              if (activityData.success) {
                activityLogs[currentVersion.versionId] = activityData.activities;
                console.log(`Activity log for version ${currentVersion.versionId}:`, activityData.activities);
              }
            } catch (activityErr) {
              console.error(`Error fetching activity log for version ${currentVersion.versionId}:`, activityErr);
              activityLogs[currentVersion.versionId] = [];
            }
          } else {
            // First version - fetch full version details to show all items as "created"
            try {
              const { data: versionData } = await api.get(
                `/api/leadreturn-versions/${selectedLead.leadNo}/version/${currentVersion.versionId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  params
                }
              );

              if (versionData.success) {
                const initialActivities = [];

                // Show all narratives as created
                if (versionData.data.leadReturnResults?.length > 0) {
                  versionData.data.leadReturnResults.forEach(result => {
                    initialActivities.push({
                      action: 'created',
                      entityType: 'Narrative',
                      entityId: result.resultId,
                      description: `Created narrative: ${result.leadReturnResult?.substring(0, 50) || 'N/A'}`,
                      details: {
                        leadReturnId: result.leadReturnId,
                        leadReturnResult: result.leadReturnResult
                      }
                    });
                  });
                }

                // Show all persons as created
                if (versionData.data.persons?.length > 0) {
                  versionData.data.persons.forEach(person => {
                    initialActivities.push({
                      action: 'created',
                      entityType: 'Person',
                      entityId: person.personId,
                      description: `Added person: ${person.firstName} ${person.lastName}`,
                      details: person
                    });
                  });
                }

                // Show all vehicles as created
                if (versionData.data.vehicles?.length > 0) {
                  versionData.data.vehicles.forEach(vehicle => {
                    initialActivities.push({
                      action: 'created',
                      entityType: 'Vehicle',
                      entityId: vehicle.vehicleId,
                      description: `Added vehicle: ${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`,
                      details: vehicle
                    });
                  });
                }

                // Show all timeline events as created
                if (versionData.data.timelines?.length > 0) {
                  versionData.data.timelines.forEach(timeline => {
                    initialActivities.push({
                      action: 'created',
                      entityType: 'Timeline Event',
                      entityId: timeline.timelineId,
                      description: `Added timeline event: ${timeline.eventDescription?.substring(0, 50) || 'N/A'}`,
                      details: timeline
                    });
                  });
                }

                // Show all other entities as created
                ['audios', 'videos', 'pictures', 'enclosures', 'evidences', 'scratchpads'].forEach(entityType => {
                  if (versionData.data[entityType]?.length > 0) {
                    versionData.data[entityType].forEach(item => {
                      const entityName = entityType.slice(0, -1); // Remove 's' from end
                      initialActivities.push({
                        action: 'created',
                        entityType: entityName.charAt(0).toUpperCase() + entityName.slice(1),
                        entityId: item[`${entityName}Id`],
                        description: `Added ${entityName}`,
                        details: item
                      });
                    });
                  }
                });

                activityLogs[currentVersion.versionId] = initialActivities;
                console.log(`Initial version ${currentVersion.versionId} activities:`, initialActivities);
              }
            } catch (err) {
              console.error(`Error fetching initial version data for version ${currentVersion.versionId}:`, err);
              activityLogs[currentVersion.versionId] = [];
            }
          }
        }
        console.log('All activity logs:', activityLogs);
        setVersionActivityLogs(activityLogs);
      }
    } catch (err) {
      console.error("Error fetching version history:", err);
      setError(err.response?.data?.message || "Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const viewVersionDetails = async (versionId) => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      // Build params with case filters
      const params = {};
      const caseNo = selectedLead.caseNo || selectedCase?.caseNo;
      const caseName = selectedLead.caseName || selectedCase?.caseName;
      if (caseNo) params.caseNo = caseNo;
      if (caseName) params.caseName = caseName;

      const { data } = await api.get(
        `/api/leadreturn-versions/${selectedLead.leadNo}/version/${versionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );

      if (data.success) {
        setSelectedVersion(versionId);
        setVersionDetails(data.data);

        // Fetch activity log for this version (compare with previous version)
        const currentVersionIndex = versions.findIndex(v => v.versionId === versionId);
        if (currentVersionIndex > 0) {
          const previousVersion = versions[currentVersionIndex - 1];
          try {
            const { data: activityData } = await api.get(
              `/api/leadreturn-versions/${selectedLead.leadNo}/activity/${previousVersion.versionId}/${versionId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                params
              }
            );

            if (activityData.success) {
              setActivityLog(activityData.activities);
            }
          } catch (activityErr) {
            console.error("Error fetching activity log:", activityErr);
            setActivityLog([]);
          }
        } else {
          setActivityLog([]); // First version has no previous version to compare
        }
      }
    } catch (err) {
      console.error("Error fetching version details:", err);
      alert(err.response?.data?.message || "Failed to load version details");
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = async () => {
    if (!compareFrom || !compareTo) {
      alert("Please select two versions to compare");
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      // Build params with case filters
      const params = {};
      const caseNo = selectedLead.caseNo || selectedCase?.caseNo;
      const caseName = selectedLead.caseName || selectedCase?.caseName;
      if (caseNo) params.caseNo = caseNo;
      if (caseName) params.caseName = caseName;

      // Get comparison data
      const { data } = await api.get(
        `/api/leadreturn-versions/${selectedLead.leadNo}/compare/${compareFrom}/${compareTo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );

      if (data.success) {
        setComparisonResult(data.data);
      }

      // Get detailed activity log
      const { data: activityData } = await api.get(
        `/api/leadreturn-versions/${selectedLead.leadNo}/activity/${compareFrom}/${compareTo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );

      if (activityData.success) {
        setActivityLog(activityData.activities);
      }
    } catch (err) {
      console.error("Error comparing versions:", err);
      alert(err.response?.data?.message || "Failed to compare versions");
    } finally {
      setLoading(false);
    }
  };

  const createManualSnapshot = async () => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "User";
    const caseNo = selectedLead.caseNo || selectedCase?.caseNo;
    const caseName = selectedLead.caseName || selectedCase?.caseName;

    try {
      const { data } = await api.post(
        `/api/leadreturn-versions/${selectedLead.leadNo}/snapshot`,
        {
          username: username,
          versionReason: "Manual Snapshot",
          caseNo: caseNo,
          caseName: caseName,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        alert("Snapshot created successfully!");
        fetchVersionHistory();
      }
    } catch (err) {
      console.error("Error creating snapshot:", err);
      alert(err.response?.data?.message || "Failed to create snapshot");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getEntityId = (details, entityType) => {
    if (!details) return null;
    const idFieldMap = {
      'Enclosure': 'enclosureId',
      'Picture': 'pictureId',
      'Audio': 'audioId',
      'Video': 'videoId',
      'Evidence': 'evidenceId'
    };
    return details[idFieldMap[entityType]] || null;
  };

  const viewFile = async (entityType, entityId) => {
    if (!entityType || !entityId) return;
    const token = localStorage.getItem("token");
    try {
      const { data } = await api.get(`/api/leadreturn-versions/file-url`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { entityType, entityId }
      });
      if (data.success && data.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (err) {
      console.error("Error getting file URL:", err);
      alert("Failed to open file");
    }
  };

  const FILE_ENTITY_TYPES = ['Enclosure', 'Picture', 'Audio', 'Video', 'Evidence'];

  const versionCardRefs = useRef({});

  const printVersionCard = (versionId) => {
    const cardEl = versionCardRefs.current[versionId];
    if (!cardEl) return;

    const printWindow = window.open('', '_blank');
    const caseNo = selectedLead.caseNo || selectedCase?.caseNo || 'N/A';
    const caseName = selectedLead.caseName || selectedCase?.caseName || 'N/A';

    printWindow.document.write(`
      <html>
        <head>
          <title>Version ${versionId} - Lead ${selectedLead.leadNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 20px; color: #333; }
            h2 { margin: 0 0 4px 0; }
            .print-header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .print-header p { margin: 2px 0; color: #555; }
            .file-link { color: inherit; text-decoration: none; cursor: default; pointer-events: none; }
            .btn-view, .btn-print { display: none !important; }
            .version-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
            .activity-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
            .activity-badge.created { background: #d4edda; color: #155724; }
            .activity-badge.updated { background: #fff3cd; color: #856404; }
            .activity-badge.deleted { background: #f8d7da; color: #721c24; }
            .status-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .reason-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .current-badge { background: #007bff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px; }
            .count-item { display: inline-block; background: #f0f0f0; padding: 4px 12px; margin: 3px; border-radius: 4px; }
            .count-label { color: #555; }
            .count-value { font-weight: 600; color: #4a6cf7; margin-left: 6px; }
            .info-row { margin: 4px 0; }
            .info-row .label { font-weight: 600; margin-right: 6px; }
            .activity-item { padding: 8px; margin: 6px 0; border-left: 3px solid #ddd; background: #fafafa; }
            .activity-item.activity-created { border-left-color: #28a745; }
            .activity-item.activity-updated { border-left-color: #ffc107; }
            .activity-item.activity-deleted { border-left-color: #dc3545; }
            .activity-description { margin: 4px 0; }
            .activity-field-change { margin: 4px 0; padding: 4px 8px; background: #f5f5f5; border-radius: 4px; font-size: 13px; }
            .field-name { font-weight: 600; }
            .value-change { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
            .old-value, .new-value { padding: 2px 6px; border-radius: 3px; }
            .old-value { background: #f8d7da; }
            .new-value { background: #d4edda; }
            .entity-field-row { margin: 2px 0; }
            .field-label { font-weight: 600; margin-right: 4px; }
            .narrative-text { white-space: pre-wrap; }
            .details-section { margin: 10px 0; }
            .details-section h6 { margin: 8px 0 4px; }
            .narrative-item { margin: 6px 0; padding: 6px; background: #f9f9f9; border-radius: 4px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>Lead ${selectedLead.leadNo}: ${selectedLead.leadName?.toUpperCase() || ''}</h2>
            <p>Case: ${caseNo} - ${caseName}</p>
            <p>Version ${versionId} Snapshot</p>
          </div>
          ${cardEl.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Assigned":
        return "status-badge status-assigned";
      case "Pending":
        return "status-badge status-pending";
      case "Approved":
        return "status-badge status-approved";
      case "Returned":
        return "status-badge status-returned";
      case "Completed":
        return "status-badge status-completed";
      default:
        return "status-badge";
    }
  };

  const getVersionReasonBadgeClass = (reason) => {
    switch (reason) {
      case "Created":
        return "reason-badge reason-created";
      case "Returned":
        return "reason-badge reason-returned";
      case "Reopened":
        return "reason-badge reason-reopened";
      case "Approved":
        return "reason-badge reason-approved";
      case "Completed":
        return "reason-badge reason-completed";
      default:
        return "reason-badge";
    }
  };

  const formatValue = (value, fieldName = '') => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === '') return '(empty)';
    if (typeof value === 'object') {
      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) return '(none)';
        // Handle array of strings
        if (value.every(v => typeof v === 'string')) {
          return value.join(', ');
        }
        // Special handling for narrative results array - show only the narrative content
        if (fieldName === 'leadReturnResults' || fieldName === '_parentArray') {
          const narratives = value.map((item) => {
            if (typeof item === 'object' && item.leadReturnResult) {
              return typeof item.leadReturnResult === 'string'
                ? item.leadReturnResult
                : JSON.stringify(item.leadReturnResult);
            }
            return null;
          }).filter(Boolean);
          return narratives.join('\n\n');
        }
        // Handle array of objects - extract just leadReturnResult if present
        return value.map((v) => {
          if (typeof v === 'object') {
            // For narrative objects, extract just the content
            if (v.leadReturnResult) {
              return typeof v.leadReturnResult === 'string' ? v.leadReturnResult : JSON.stringify(v.leadReturnResult);
            }
            // For other objects, show minimal info
            const objStr = Object.entries(v)
              .filter(([k]) => !k.startsWith('_') && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt' && k !== 'enteredDate' && k !== 'enteredBy' && k !== 'description')
              .slice(0, 3)
              .map(([k, val]) => `${k}: ${val}`)
              .join(', ');
            return objStr || JSON.stringify(v);
          }
          return v;
        }).join('\n\n');
      }
      // Handle objects with common patterns
      if (value.assignee) return value.assignee;
      if (value.assignees) return Array.isArray(value.assignees) ? value.assignees.join(', ') : String(value.assignees);
      if (value.username) return value.username;

      // Handle address objects
      if (value.street1 || value.city || value.state || value.zipCode) {
        const addressParts = [
          value.street1,
          value.street2,
          value.building,
          value.apartment,
          value.city,
          value.state,
          value.zipCode
        ].filter(Boolean);
        return addressParts.length > 0 ? addressParts.join(', ') : '(no address)';
      }

      // For other objects, show key fields only (exclude internal fields)
      const keys = Object.keys(value).filter(k => !k.startsWith('_') && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt');
      if (keys.length === 0) return '(empty object)';
      return keys.slice(0, 5).map(k => {
        const val = value[k];
        if (typeof val === 'object' && val !== null) {
          return `${k}: [object]`;
        }
        return `${k}: ${val}`;
      }).join(', ');
    }
    return String(value);
  };

  const formatEntityDetails = (details, entityType) => {
    if (!details || typeof details !== 'object') return null;

    const renderableFields = [];

    // Entity-specific formatting
    switch (entityType) {
      case 'Narrative':
      case 'LeadReturnResult':
        // Show resultId and narrative content only
        // Show leadReturnId (narrative ID) and narrative content only
        if (details.leadReturnId) {
          renderableFields.push({ label: 'Narrative ID', value: details.leadReturnId });
        }
        if (details.leadReturnResult) {
          // Handle if leadReturnResult is a string
          if (typeof details.leadReturnResult === 'string') {
            renderableFields.push({ label: 'Narrative', value: details.leadReturnResult });
          }
          // Handle if leadReturnResult is an object (shouldn't be, but just in case)
          else if (typeof details.leadReturnResult === 'object') {
            renderableFields.push({ label: 'Narrative', value: JSON.stringify(details.leadReturnResult) });
          }
        }
        break;

      case 'Person':
        const personName = [details.firstName, details.middleInitial, details.lastName, details.suffix]
          .filter(Boolean).join(' ');
        if (personName) renderableFields.push({ label: 'Name', value: personName });
        if (details.alias) renderableFields.push({ label: 'Alias', value: details.alias });
        if (details.cellNumber) renderableFields.push({ label: 'Phone', value: details.cellNumber });
        if (details.address) {
          // Format address object
          const formattedAddress = formatValue(details.address, 'address');
          renderableFields.push({ label: 'Address', value: formattedAddress });
        }
        if (details.personType) renderableFields.push({ label: 'Type', value: details.personType });
        break;

      case 'Vehicle':
        const vehicleDesc = [details.year, details.make, details.model].filter(Boolean).join(' ');
        if (vehicleDesc) renderableFields.push({ label: 'Vehicle', value: vehicleDesc });
        if (details.vin) renderableFields.push({ label: 'VIN', value: details.vin });
        if (details.plate) renderableFields.push({ label: 'Plate', value: details.plate });
        if (details.primaryColor) renderableFields.push({ label: 'Color', value: details.primaryColor });
        break;

      case 'Timeline':
        if (details.eventDate) renderableFields.push({ label: 'Date', value: formatDate(details.eventDate) });
        if (details.eventDescription) renderableFields.push({ label: 'Event', value: details.eventDescription });
        if (details.location) renderableFields.push({ label: 'Location', value: details.location });
        break;

      case 'Evidence':
        if (details.evidenceType) renderableFields.push({ label: 'Type', value: details.evidenceType });
        if (details.description) renderableFields.push({ label: 'Description', value: details.description });
        if (details.collectedBy) renderableFields.push({ label: 'Collected By', value: details.collectedBy });
        if (details.originalName) renderableFields.push({ label: 'File', value: details.originalName, entityType, entityId: getEntityId(details, entityType) });
        break;

      case 'Enclosure':
      case 'Picture':
      case 'Audio':
      case 'Video':
        if (details.originalName) renderableFields.push({ label: 'File', value: details.originalName, entityType, entityId: getEntityId(details, entityType) });
        if (details.enclosureDescription) renderableFields.push({ label: 'Description', value: details.enclosureDescription });
        break;

      case 'Note':
      case 'Scratchpad':
        if (details.noteContent) renderableFields.push({ label: 'Note', value: details.noteContent });
        if (details.createdBy) renderableFields.push({ label: 'By', value: details.createdBy });
        break;

      default:
        // Generic handling
        const commonFields = ['id', 'name', 'title', 'description', 'type', 'status'];
        commonFields.forEach(field => {
          if (details[field]) {
            renderableFields.push({
              label: field.charAt(0).toUpperCase() + field.slice(1),
              value: details[field]
            });
          }
        });
    }

    return renderableFields.length > 0 ? renderableFields : null;
  };

  if (!selectedLead?.leadNo) {
    return (
      <div className="version-history-container">
        <p className="no-lead-message">Please select a lead to view version history.</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Debug: selectedLead = {JSON.stringify(selectedLead)}
        </p>
      </div>
    );
  }

  return (
    <div className="version-history-container">
      <div className="version-history-header">
        <h3>Lead Return Version History</h3>
        <h3 className="lead-info">
          LEAD {selectedLead.leadNo}: {selectedLead.leadName?.toUpperCase()}
        </h3>
        {/* Debug info */}
        <div style={{ fontSize: '18px', color: '#666', marginTop: '5px' }}>
          Case: {selectedLead.caseNo || selectedCase?.caseNo || 'N/A'} - {selectedLead.caseName || selectedCase?.caseName || 'N/A'}
        </div>
        {/* <div className="header-actions">
          <button className="btn-primary" onClick={createManualSnapshot}>
            Create Manual Snapshot
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareFrom(null);
              setCompareTo(null);
              setComparisonResult(null);
              setActivityLog([]);
            }}
          >
            {compareMode ? "Cancel Compare" : "Compare Versions"}
          </button>
        </div> */}
      </div>

      {loading && <div className="loading-spinner">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      {compareMode && (
        <div className="compare-panel">
          <h3>Compare Versions</h3>
          <div className="compare-selectors">
            <div className="compare-select-group">
              <label>From Version:</label>
              <select
                value={compareFrom || ""}
                onChange={(e) => setCompareFrom(e.target.value)}
              >
                <option value="">Select version...</option>
                {versions.map((v) => (
                  <option key={v.versionId} value={v.versionId}>
                    Version {v.versionId} - {v.versionReason}
                  </option>
                ))}
              </select>
            </div>
            <div className="compare-select-group">
              <label>To Version:</label>
              <select
                value={compareTo || ""}
                onChange={(e) => setCompareTo(e.target.value)}
              >
                <option value="">Select version...</option>
                {versions.map((v) => (
                  <option key={v.versionId} value={v.versionId}>
                    Version {v.versionId} - {v.versionReason}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn-primary" onClick={compareVersions}>
              Compare
            </button>
          </div>

          {comparisonResult && (
            <div className="comparison-result">
              <h4>Comparison Results</h4>
              <div className="comparison-info">
                <div className="comparison-side">
                  <h5>Version {comparisonResult.fromVersion.versionId}</h5>
                  <p>Created: {formatDate(comparisonResult.fromVersion.versionCreatedAt)}</p>
                  <p>By: {comparisonResult.fromVersion.versionCreatedBy}</p>
                  <p>Reason: {comparisonResult.fromVersion.versionReason}</p>
                </div>
                <div className="comparison-arrow">→</div>
                <div className="comparison-side">
                  <h5>Version {comparisonResult.toVersion.versionId}</h5>
                  <p>Created: {formatDate(comparisonResult.toVersion.versionCreatedAt)}</p>
                  <p>By: {comparisonResult.toVersion.versionCreatedBy}</p>
                  <p>Reason: {comparisonResult.toVersion.versionReason}</p>
                </div>
              </div>
              <div className="changes-table">
                <h5>Changes Summary</h5>
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(comparisonResult.changes).map(([key, value]) => (
                      <tr key={key}>
                        <td className="category-name">{key}</td>
                        <td>{value.fromCount}</td>
                        <td>{value.toCount}</td>
                        <td className={value.added >= 0 ? "positive-change" : "negative-change"}>
                          {value.added >= 0 ? "+" : ""}{value.added}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Activity Log Section */}
              {activityLog.length > 0 && (
                <div className="activity-log-section">
                  <h5>Detailed Activity Log ({activityLog.length} changes)</h5>
                  <div className="activity-log-container">
                    {activityLog.map((activity, idx) => (
                      <div key={idx} className={`activity-item activity-${activity.action}`}>
                        <div className="activity-header">
                          <span className={`activity-badge ${activity.action}`}>
                            {activity.action === 'created' && '➕ Created'}
                            {activity.action === 'updated' && '✏️ Updated'}
                            {activity.action === 'deleted' && '🗑️ Deleted'}
                          </span>
                          <span className="activity-entity">{activity.entityType}</span>
                        </div>
                        <div className="activity-description">
                        {activity.description}
                        {FILE_ENTITY_TYPES.includes(activity.entityType) && getEntityId(activity.details, activity.entityType) && (
                          <span
                            className="file-link"
                            onClick={() => viewFile(activity.entityType, getEntityId(activity.details, activity.entityType))}
                            title="Click to view file"
                            style={{ marginLeft: '8px' }}
                          >
                            {activity.details.originalName || 'View File'}
                          </span>
                        )}
                      </div>
                        {activity.field && (
                          <div className="activity-field-change">
                            <span className="field-name">Field: {activity.field}</span>
                            <div className="value-change">
                              <div className="old-value">
                                <span className="label">Old:</span>
                                <span className="value">{formatValue(activity.oldValue, activity.field)}</span>
                              </div>
                              <span className="arrow">→</span>
                              <div className="new-value">
                                <span className="label">New:</span>
                                <span className="value">{formatValue(activity.newValue, activity.field)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {activity.details && (
                          <div className="activity-entity-details">
                            {(() => {
                              const formattedFields = formatEntityDetails(activity.details, activity.entityType);
                              if (!formattedFields) return null;
                              return (
                                <div className="entity-fields">
                                  {formattedFields.map((field, fieldIdx) => (
                                    <div key={fieldIdx} className="entity-field-row">
                                      <span className="field-label">{field.label}:</span>
                                      {field.entityId ? (
                                        <span
                                          className="field-value file-link"
                                          onClick={() => viewFile(field.entityType, field.entityId)}
                                          title="Click to view file"
                                        >
                                          {field.value}
                                        </span>
                                      ) : (
                                        <span className="field-value">{field.value}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="versions-list">
        <h3>All Versions ({versions.length})</h3>
        {versions.length === 0 && !loading && (
          <div className="no-versions">
            <p>No versions found for this lead.</p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
              This could mean:
              <ul style={{ textAlign: 'left', marginTop: '5px' }}>
                <li>No snapshots have been created for this lead yet</li>
                <li>The case/lead filter is too restrictive (check console logs)</li>
                <li>There was an error fetching the data (check console)</li>
              </ul>
            </p>
          </div>
        )}

        {versions.map((version) => (
          <div
            key={version.versionId}
            ref={(el) => { versionCardRefs.current[version.versionId] = el; }}
            className={`version-card ${
              version.isCurrentVersion ? "current-version" : ""
            } ${selectedVersion === version.versionId ? "selected" : ""}`}
          >
            <div className="version-header">
              <div className="version-title">
                <h4>
                  Version {version.versionId}
                  {version.isCurrentVersion && (
                    <span className="current-badge">Current</span>
                  )}
                </h4>
                <span className={getVersionReasonBadgeClass(version.versionReason)}>
                  {version.versionReason}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-view"
                  onClick={() => viewVersionDetails(version.versionId)}
                >
                  {selectedVersion === version.versionId ? "Hide Details" : "View Details"}
                </button>
                <button
                  className="btn-print"
                  onClick={() => printVersionCard(version.versionId)}
                >
                  Print
                </button>
              </div>
            </div>

            <div className="version-info">
              <div className="info-row">
                <span className="label">Created:</span>
                <span>{formatDate(version.versionCreatedAt)}</span>
              </div>
              <div className="info-row">
                <span className="label">By:</span>
                <span>{version.versionCreatedBy}</span>
              </div>
              <div className="info-row">
                <span className="label">Status:</span>
                <span className={getStatusBadgeClass(version.status)}>
                  {version.status || "N/A"}
                </span>
              </div>
            </div>

            <div className="item-counts">
              <h5>Snapshot Contents:</h5>
              <div className="counts-grid">
                {Object.entries(version.itemCounts).map(([key, count]) => (
                  <div key={key} className="count-item">
                    <span className="count-label">{key}:</span>
                    <span className="count-value">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Log Section - Show what changed in this version */}
            {(() => {
              console.log(`Version ${version.versionId} activity check:`, {
                hasLogs: !!versionActivityLogs[version.versionId],
                logsLength: versionActivityLogs[version.versionId]?.length,
                logs: versionActivityLogs[version.versionId]
              });
              return null;
            })()}
            {versionActivityLogs[version.versionId] && versionActivityLogs[version.versionId].length > 0 && (
              <div className="activity-log-section">
                <h5>Changes in This Version ({versionActivityLogs[version.versionId].length} changes)</h5>
                <div className="activity-log-container1">
                  {versionActivityLogs[version.versionId].map((activity, idx) => (
                    <div key={idx} className={`activity-item activity-${activity.action}`}>
                      <div className="activity-header">
                        <span className={`activity-badge ${activity.action}`}>
                          {activity.action === 'created' && '➕ Created'}
                          {activity.action === 'updated' && '✏️ Updated'}
                          {activity.action === 'deleted' && '🗑️ Deleted'}
                        </span>
                        <span className="activity-entity">{activity.entityType}</span>
                      </div>
                      <div className="activity-description">
                        {activity.description}
                        {FILE_ENTITY_TYPES.includes(activity.entityType) && getEntityId(activity.details, activity.entityType) && (
                          <span
                            className="file-link"
                            onClick={() => viewFile(activity.entityType, getEntityId(activity.details, activity.entityType))}
                            title="Click to view file"
                            style={{ marginLeft: '8px' }}
                          >
                            {activity.details.originalName || 'View File'}
                          </span>
                        )}
                      </div>
                      {/* Show field changes for updated narratives */}
                      {activity.field && activity.entityType === 'Narrative' && activity.action === 'updated' && (
                        <div className="activity-field-change">
                          <div className="value-change">
                            <div className="old-value">
                              <span className="label">Previous Narrative:</span>
                              <span className="value narrative-text">{formatValue(activity.oldValue, activity.field)}</span>
                            </div>
                            <span className="arrow">→</span>
                            <div className="new-value">
                              <span className="label">Updated Narrative:</span>
                              <span className="value narrative-text">{formatValue(activity.newValue, activity.field)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Show field changes for non-Narrative entities */}
                      {activity.field && activity.entityType !== 'Narrative' && (
                        <div className="activity-field-change">
                          <span className="field-name">Field: {activity.field}</span>
                          <div className="value-change">
                            <div className="old-value">
                              <span className="label">Old:</span>
                              <span className="value">{formatValue(activity.oldValue, activity.field)}</span>
                            </div>
                            <span className="arrow">→</span>
                            <div className="new-value">
                              <span className="label">New:</span>
                              <span className="value">{formatValue(activity.newValue, activity.field)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Show entity details for all entities */}
                      {activity.details && (
                        <div className="activity-entity-details">
                          {(() => {
                            const formattedFields = formatEntityDetails(activity.details, activity.entityType);
                            if (!formattedFields) return null;
                            return (
                              <div className="entity-fields">
                                {formattedFields.map((field, fieldIdx) => (
                                  <div key={fieldIdx} className="entity-field-row">
                                    <span className="field-label">{field.label}:</span>
                                    <span className="field-value">{field.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVersion === version.versionId && versionDetails && (
              // <div className="version-details"
              <div>
                {/* Activity Log Section - Show what changed in this version */}
                {activityLog.length > 0 && (
                  <div className="activity-log-section">
                    <h5>Changes in This Version ({activityLog.length} changes)</h5>
                    <div className="activity-log-container1">
                      {activityLog.map((activity, idx) => (
                        <div key={idx} className={`activity-item activity-${activity.action}`}>
                          <div className="activity-header">
                            <span className={`activity-badge ${activity.action}`}>
                              {activity.action === 'created' && '➕ Created'}
                              {activity.action === 'updated' && '✏️ Updated'}
                              {activity.action === 'deleted' && '🗑️ Deleted'}
                            </span>
                            <span className="activity-entity">{activity.entityType}</span>
                          </div>
                          <div className="activity-description">
                        {activity.description}
                        {FILE_ENTITY_TYPES.includes(activity.entityType) && getEntityId(activity.details, activity.entityType) && (
                          <span
                            className="file-link"
                            onClick={() => viewFile(activity.entityType, getEntityId(activity.details, activity.entityType))}
                            title="Click to view file"
                            style={{ marginLeft: '8px' }}
                          >
                            {activity.details.originalName || 'View File'}
                          </span>
                        )}
                      </div>
                          {/* Show field changes for updated narratives */}
                          {activity.field && activity.entityType === 'Narrative' && activity.action === 'updated' && (
                            <div className="activity-field-change">
                              <div className="value-change">
                                <div className="old-value">
                                  <span className="label">Previous Narrative:</span>
                                  <span className="value narrative-text">{formatValue(activity.oldValue, activity.field)}</span>
                                </div>
                                <span className="arrow">→</span>
                                <div className="new-value">
                                  <span className="label">Updated Narrative:</span>
                                  <span className="value narrative-text">{formatValue(activity.newValue, activity.field)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Show field changes for non-Narrative entities */}
                          {activity.field && activity.entityType !== 'Narrative' && (
                            <div className="activity-field-change">
                              <span className="field-name">Field: {activity.field}</span>
                              <div className="value-change">
                                <div className="old-value">
                                  <span className="label">Old:</span>
                                  <span className="value">{formatValue(activity.oldValue, activity.field)}</span>
                                </div>
                                <span className="arrow">→</span>
                                <div className="new-value">
                                  <span className="label">New:</span>
                                  <span className="value">{formatValue(activity.newValue, activity.field)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Show entity details for all entities */}
                          {activity.details && (
                            <div className="activity-entity-details">
                              {(() => {
                                const formattedFields = formatEntityDetails(activity.details, activity.entityType);
                                if (!formattedFields) return null;
                                return (
                                  <div className="entity-fields">
                                    {formattedFields.map((field, fieldIdx) => (
                                      <div key={fieldIdx} className="entity-field-row">
                                        <span className="field-label">{field.label}:</span>
                                        <span className="field-value">{field.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h5>Full Details</h5>

                {/* Activity Log - Show what changed in this version */}
                {versionActivityLogs[version.versionId] !== undefined && (
                  <div className="details-section">
                    <h6>Activity Log ({versionActivityLogs[version.versionId]?.length || 0} changes)</h6>
                    <div className="version-info-bar" style={{
                      background: '#f5f5f5',
                      padding: '10px',
                      marginBottom: '15px',
                      borderRadius: '5px',
                      display: 'flex',
                      gap: '20px',
                      flexWrap: 'wrap'
                    }}>
                      <span><strong>Officer:</strong> {version.versionCreatedBy}</span>
                      <span><strong>Time:</strong> {formatDate(version.versionCreatedAt)}</span>
                      <span><strong>Reason:</strong> {version.versionReason}</span>
                    </div>
                    <div className="activity-log-detailed">
                      {versionActivityLogs[version.versionId]?.length > 0 ? (
                        versionActivityLogs[version.versionId].map((activity, idx) => (
                        <div key={idx} className={`activity-detail-item activity-${activity.action}`}>
                          <div className="activity-summary">
                            <span className={`activity-badge ${activity.action}`}>
                              {activity.action === 'created' && '➕ Created'}
                              {activity.action === 'updated' && '✏️ Updated'}
                              {activity.action === 'deleted' && '🗑️ Deleted'}
                            </span>
                            <span className="activity-entity-type">{activity.entityType}</span>
                            {activity.details?.leadReturnId && (
                              <span className="narrative-id">Narrative {activity.details.leadReturnId}</span>
                            )}
                          </div>

                          {/* Show created narrative details */}
                          {activity.action === 'created' && activity.entityType === 'Narrative' && activity.details && (
                            <div className="activity-content">
                              <div className="narrative-content">
                                <strong>Content:</strong> {activity.details.leadReturnResult}
                              </div>
                              <div className="activity-metadata" style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                <span>Created by {version.versionCreatedBy} on {formatDate(version.versionCreatedAt)}</span>
                              </div>
                            </div>
                          )}

                          {/* Show updated narrative with before/after comparison */}
                          {activity.action === 'updated' && activity.entityType === 'Narrative' && (
                            <div className="activity-content">
                              <div className="narrative-comparison">
                                <div className="previous-narrative">
                                  <strong>Previous Content:</strong>
                                  <div className="narrative-text">{activity.oldValue}</div>
                                </div>
                                <div className="arrow-separator">→</div>
                                <div className="updated-narrative">
                                  <strong>Updated Content:</strong>
                                  <div className="narrative-text">{activity.newValue}</div>
                                </div>
                              </div>
                              <div className="activity-metadata" style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                <span>Updated by {version.versionCreatedBy} on {formatDate(version.versionCreatedAt)}</span>
                              </div>
                            </div>
                          )}

                          {/* Show deleted narrative details */}
                          {activity.action === 'deleted' && activity.entityType === 'Narrative' && activity.details && (
                            <div className="activity-content">
                              <div className="narrative-content deleted">
                                <strong>Deleted Content:</strong> {activity.details.leadReturnResult}
                              </div>
                              <div className="activity-metadata" style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                <span>Deleted by {version.versionCreatedBy} on {formatDate(version.versionCreatedAt)}</span>
                              </div>
                            </div>
                          )}

                          {/* Show person changes */}
                          {activity.entityType === 'Person' && (
                            <div className="activity-content">
                              {activity.action === 'created' && (
                                <div><strong>Added:</strong> {activity.details?.firstName} {activity.details?.lastName}</div>
                              )}
                              {activity.action === 'deleted' && (
                                <div><strong>Removed:</strong> {activity.details?.firstName} {activity.details?.lastName}</div>
                              )}
                              {activity.action === 'updated' && (
                                <div>
                                  <strong>Updated Field:</strong> {activity.field}
                                  <div className="field-change">
                                    <span className="old-val">From: {String(activity.oldValue)}</span>
                                    <span> → </span>
                                    <span className="new-val">To: {String(activity.newValue)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Show vehicle changes */}
                          {activity.entityType === 'Vehicle' && (
                            <div className="activity-content">
                              {activity.action === 'created' && (
                                <div><strong>Added:</strong> {activity.details?.year} {activity.details?.make} {activity.details?.model}</div>
                              )}
                              {activity.action === 'deleted' && (
                                <div><strong>Removed:</strong> {activity.details?.year} {activity.details?.make} {activity.details?.model}</div>
                              )}
                              {activity.action === 'updated' && (
                                <div>
                                  <strong>Updated Field:</strong> {activity.field}
                                  <div className="field-change">
                                    <span className="old-val">From: {String(activity.oldValue)}</span>
                                    <span> → </span>
                                    <span className="new-val">To: {String(activity.newValue)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Show other entity types */}
                          {!['Narrative', 'Person', 'Vehicle'].includes(activity.entityType) && (
                            <div className="activity-content">
                              <div>{activity.description}</div>
                              {FILE_ENTITY_TYPES.includes(activity.entityType) && getEntityId(activity.details, activity.entityType) && (
                                <div style={{ marginTop: '4px' }}>
                                  <span
                                    className="file-link"
                                    onClick={() => viewFile(activity.entityType, getEntityId(activity.details, activity.entityType))}
                                    title="Click to view file"
                                  >
                                    {activity.details.originalName || 'View File'}
                                  </span>
                                </div>
                              )}
                              {activity.field && (
                                <div className="field-change">
                                  <strong>Field:</strong> {activity.field}
                                  <div>
                                    <span className="old-val">From: {String(activity.oldValue)}</span>
                                    <span> → </span>
                                    <span className="new-val">To: {String(activity.newValue)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                      ) : (
                        <div className="no-activities" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          No changes in this version
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Show Narratives in format: Narrative ID: Content */}
                {versionDetails.leadReturnResults?.length > 0 && (
                  <div className="details-section">
                    <h6>Narratives ({versionDetails.leadReturnResults.length})</h6>
                    <div className="narratives-list">
                      {versionDetails.leadReturnResults.map((result, idx) => (
                        <div key={idx} className="narrative-item">
                          <strong>Narrative {result.leadReturnId}:</strong> {result.leadReturnResult}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {versionDetails.persons?.length > 0 && (
                  <div className="details-section">
                    <h6>Persons ({versionDetails.persons.length})</h6>
                    <ul>
                      {versionDetails.persons.map((person, idx) => (
                        <li key={idx}>
                          {person.firstName} {person.lastName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {versionDetails.vehicles?.length > 0 && (
                  <div className="details-section">
                    <h6>Vehicles ({versionDetails.vehicles.length})</h6>
                    <ul>
                      {versionDetails.vehicles.map((vehicle, idx) => (
                        <li key={idx}>
                          {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.vin}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {versionDetails.timelines?.length > 0 && (
                  <div className="details-section">
                    <h6>Timeline Events ({versionDetails.timelines.length})</h6>
                    <ul>
                      {versionDetails.timelines.map((event, idx) => (
                        <li key={idx}>
                          {formatDate(event.eventDate)} - {event.eventDescription}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
