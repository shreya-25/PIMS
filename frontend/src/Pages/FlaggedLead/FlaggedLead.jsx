import React, { useContext, useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './FlaggedLead.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { CaseContext } from "../CaseContext";
import api from "../../api";
import { SideBar } from "../../components/Sidebar/Sidebar";

const DEFAULT_FLAGS = ['Critical', 'Moderate', 'Low', 'Urgent', 'Follow Up'];

const FLAG_COLORS = {
  Critical: '#dc3545',
  Urgent: '#fd7e14',
  Moderate: '#ffc107',
  'Follow Up': '#0d6efd',
  Low: '#6c757d',
};

function getFlagColor(flag) {
  return FLAG_COLORS[flag] || '#495057';
}

export const FlaggedLead = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { caseDetails } = location.state || {};
  const { selectedCase } = useContext(CaseContext);

  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Flag types for this case (stored in localStorage per case)
  const [caseFlags, setCaseFlags] = useState([]);

  // Manage flags modal
  const [flagModalLead, setFlagModalLead] = useState(null);
  const [tempFlags, setTempFlags] = useState([]);
  const [inlineNewFlag, setInlineNewFlag] = useState('');
  const [inlineNewFlagError, setInlineNewFlagError] = useState('');

  // Create new flag modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlagInput, setNewFlagInput] = useState('');
  const [createError, setCreateError] = useState('');

  // Search
  const [search, setSearch] = useState('');

  const isInvestigator = selectedCase?.role === 'Investigator';
  const caseKey = `caseFlags_${selectedCase?.caseNo}`;

  // Load case flags from localStorage and merge with flags from leads
  const buildCaseFlags = (leads, stored) => {
    const fromLeads = leads.flatMap(l => l.associatedFlags || []);
    const merged = Array.from(new Set([...DEFAULT_FLAGS, ...stored, ...fromLeads]));
    return merged;
  };

  useEffect(() => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (!caseId) return;

    const fetchLeads = async () => {
      setLoading(true);
      try {
        const resp = await api.get(
          `/api/lead/all-with-flags/${caseId}`
        );
        let leads = Array.isArray(resp.data) ? resp.data : [];

        // Non-case-managers can't see CM-only leads
        if (selectedCase.role !== 'Case Manager') {
          leads = leads.filter(l => l.accessLevel !== 'Only Case Manager and Assignees');
        }

        setAllLeads(leads);

        const stored = JSON.parse(localStorage.getItem(caseKey) || '[]');
        setCaseFlags(buildCaseFlags(leads, stored));
      } catch (err) {
        console.error(err);
        setError('Failed to load leads.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [selectedCase]);

  // Persist custom flags to localStorage whenever caseFlags changes
  // (only the non-default ones go to localStorage)
  const saveCustomFlags = (flags) => {
    const custom = flags.filter(f => !DEFAULT_FLAGS.includes(f));
    localStorage.setItem(caseKey, JSON.stringify(custom));
  };

  // Create a new flag type
  const handleCreateFlag = () => {
    const trimmed = newFlagInput.trim();
    if (!trimmed) { setCreateError('Flag name cannot be empty.'); return; }
    if (caseFlags.map(f => f.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCreateError('This flag already exists.');
      return;
    }
    const updated = [...caseFlags, trimmed];
    setCaseFlags(updated);
    saveCustomFlags(updated);
    setNewFlagInput('');
    setCreateError('');
    setShowCreateModal(false);
  };

  // Open flag management modal for a lead
  const openFlagModal = (lead) => {
    setFlagModalLead(lead);
    setTempFlags([...(lead.associatedFlags || [])]);
    setInlineNewFlag('');
    setInlineNewFlagError('');
  };

  const handleInlineCreateFlag = () => {
    const trimmed = inlineNewFlag.trim();
    if (!trimmed) { setInlineNewFlagError('Flag name cannot be empty.'); return; }
    if (caseFlags.map(f => f.toLowerCase()).includes(trimmed.toLowerCase())) {
      setInlineNewFlagError('This flag already exists.');
      return;
    }
    const updated = [...caseFlags, trimmed];
    setCaseFlags(updated);
    saveCustomFlags(updated);
    setTempFlags(prev => [...prev, trimmed]);
    setInlineNewFlag('');
    setInlineNewFlagError('');
  };

  const toggleFlag = (flag) => {
    setTempFlags(prev =>
      prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
    );
  };

  // Save flags for lead
  const saveFlagsForLead = async () => {
    if (!flagModalLead) return;
    try {
      await api.patch(
        `/api/lead/flags/${flagModalLead.leadNo}/${encodeURIComponent(flagModalLead.description)}/${selectedCase._id || selectedCase.id}`,
        { associatedFlags: tempFlags }
      );
      setAllLeads(prev =>
        prev.map(l =>
          l.leadNo === flagModalLead.leadNo && l.description === flagModalLead.description
            ? { ...l, associatedFlags: tempFlags }
            : l
        )
      );
      // Update caseFlags to include any new flags from tempFlags
      const stored = JSON.parse(localStorage.getItem(caseKey) || '[]');
      const updated = buildCaseFlags(
        allLeads.map(l =>
          l.leadNo === flagModalLead.leadNo ? { ...l, associatedFlags: tempFlags } : l
        ),
        stored
      );
      setCaseFlags(updated);
      saveCustomFlags(updated);
      setFlagModalLead(null);
    } catch (err) {
      console.error('Failed to save flags:', err);
    }
  };

  // Leads with at least one flag
  const flaggedLeads = allLeads.filter(l => (l.associatedFlags || []).length > 0);

  // All unique flags currently applied to leads in this case
  const usedFlags = Array.from(new Set(allLeads.flatMap(l => l.associatedFlags || [])));

  const filteredLeads = allLeads.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(l.leadNo).includes(s) ||
      (l.description || '').toLowerCase().includes(s) ||
      (l.associatedFlags || []).some(f => f.toLowerCase().includes(s))
    );
  });

  return (
    <div className="lead-log-page">
      <Navbar />
      <div className="main-container">
        <SideBar activePage="FlaggedLead" />

        <div className="left-content">
          {/* Top menu */}
          <div className="top-menu">
            <div className="menu-items">
              <span className="menu-item" onClick={() => navigate('/LeadsDesk', { state: { caseDetails } })}>
                Leads Desk
              </span>
              <span className="menu-item" onClick={() => navigate('/LeadsDeskTestExecSummary', { state: { caseDetails } })}>
                Generate Report
              </span>
              <span className="menu-item" onClick={() => navigate('/CaseScratchpad', { state: { caseDetails } })}>
                Add/View Case Notes
              </span>
              <span className="menu-item" onClick={() => navigate('/SearchLead', { state: { caseDetails } })}>
                Search Leads
              </span>
              <span className="menu-item" onClick={() => navigate('/ViewTimeline', { state: { caseDetails } })}>
                View Timelines
              </span>
              <span className="menu-item active" onClick={() => navigate('/FlaggedLead', { state: { caseDetails } })}>
                View Flagged Leads
              </span>
            </div>
          </div>

          <div className="flags-page-body">

            {/* ── Case Flags Section ── */}
            <div className="flags-section">
              <div className="flags-section-header">
                <h3 className="flags-section-title">
                  Case Flags
                  <span className="flags-count-badge">{caseFlags.length}</span>
                </h3>
                {!isInvestigator && (
                  <button className="create-flag-btn" onClick={() => { setShowCreateModal(true); setCreateError(''); setNewFlagInput(''); }}>
                    + Create New Flag
                  </button>
                )}
              </div>

              <div className="flag-chips-row">
                {caseFlags.map(flag => (
                  <span
                    key={flag}
                    className="flag-chip"
                    style={{ backgroundColor: getFlagColor(flag) }}
                  >
                    {flag}
                    {usedFlags.includes(flag) && (
                      <span className="flag-chip-count">
                        {allLeads.filter(l => (l.associatedFlags || []).includes(flag)).length}
                      </span>
                    )}
                  </span>
                ))}
                {caseFlags.length === 0 && (
                  <span className="no-flags-msg">No flags created yet. Click "Create New Flag" to get started.</span>
                )}
              </div>

              {usedFlags.length > 0 && (
                <p className="flags-summary-text">
                  {flaggedLeads.length} lead{flaggedLeads.length !== 1 ? 's' : ''} flagged across {usedFlags.length} flag type{usedFlags.length !== 1 ? 's' : ''}.
                </p>
              )}
            </div>

            {/* ── Leads Table ── */}
            <div className="flags-table-section">
              <div className="flags-table-toolbar">
                <h3 className="flags-section-title">All Leads</h3>
                <div className="flags-search-wrap">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    type="text"
                    placeholder="Search by lead #, description, or flag..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flags-search-input"
                  />
                </div>
              </div>

              {loading && <p className="flags-loading">Loading leads...</p>}
              {error && <p className="flags-error">{error}</p>}

              {!loading && !error && (
                <table className="flags-table">
                  <thead>
                    <tr>
                      <th style={{ width: '8%' }}>Lead #</th>
                      <th>Description</th>
                      <th style={{ width: '32%' }}>Flags</th>
                      {!isInvestigator && <th style={{ width: '10%' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={isInvestigator ? 3 : 4} style={{ textAlign: 'center', padding: '20px' }}>
                          No leads found.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead, idx) => (
                        <tr key={idx} className={(lead.associatedFlags || []).length > 0 ? 'flagged-row' : ''}>
                          <td>{lead.leadNo}</td>
                          <td>{lead.description}</td>
                          <td>
                            <div className="flag-chips-cell">
                              {(lead.associatedFlags || []).length === 0 ? (
                                <span className="no-flag-text">—</span>
                              ) : (
                                (lead.associatedFlags || []).map(f => (
                                  <span
                                    key={f}
                                    className="flag-chip flag-chip-sm"
                                    style={{ backgroundColor: getFlagColor(f) }}
                                  >
                                    {f}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          {!isInvestigator && (
                            <td>
                              <button className="manage-flags-btn" onClick={() => openFlagModal(lead)}>
                                Manage
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Create New Flag Modal ── */}
      {showCreateModal && (
        <div className="flag-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="flag-modal" onClick={e => e.stopPropagation()}>
            <div className="flag-modal-header">
              <h4>Create New Flag</h4>
              <button className="flag-modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <div className="flag-modal-body">
              <label className="flag-modal-label">Flag Name</label>
              <input
                type="text"
                className="flag-modal-input"
                placeholder="e.g. Evidence Collected"
                value={newFlagInput}
                onChange={e => { setNewFlagInput(e.target.value); setCreateError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleCreateFlag()}
                autoFocus
              />
              {createError && <p className="flag-modal-error">{createError}</p>}
              <div className="flag-modal-preview">
                {newFlagInput.trim() && (
                  <span className="flag-chip" style={{ backgroundColor: getFlagColor(newFlagInput.trim()) }}>
                    {newFlagInput.trim()}
                  </span>
                )}
              </div>
            </div>
            <div className="flag-modal-footer">
              <button className="flag-btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="flag-btn-save" onClick={handleCreateFlag}>Create Flag</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Lead Flags Modal ── */}
      {flagModalLead && (
        <div className="flag-modal-overlay" onClick={() => setFlagModalLead(null)}>
          <div className="flag-modal flag-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="flag-modal-header">
              <h4>Manage Flags — Lead #{flagModalLead.leadNo}</h4>
              <button className="flag-modal-close" onClick={() => setFlagModalLead(null)}>&times;</button>
            </div>
            <div className="flag-modal-body">
              <p className="flag-modal-desc">{flagModalLead.description}</p>

              {/* Create New Flag — appears before Assign a Flag */}
              <div className="inline-create-flag-section">
                <p className="flag-modal-label">Create New Flag</p>
                <div className="inline-create-flag-row">
                  <input
                    type="text"
                    className="flag-modal-input inline-flag-input"
                    placeholder="e.g. Evidence Collected"
                    value={inlineNewFlag}
                    onChange={e => { setInlineNewFlag(e.target.value); setInlineNewFlagError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleInlineCreateFlag()}
                  />
                  <button className="create-flag-btn" onClick={handleInlineCreateFlag}>+ Add</button>
                </div>
                {inlineNewFlagError && <p className="flag-modal-error">{inlineNewFlagError}</p>}
              </div>

              <p className="flag-modal-label">Assign a Flag</p>
              <div className="flag-toggle-grid">
                {caseFlags.map(flag => {
                  const active = tempFlags.includes(flag);
                  return (
                    <button
                      key={flag}
                      className={`flag-toggle-btn ${active ? 'active' : ''}`}
                      style={active ? { backgroundColor: getFlagColor(flag), borderColor: getFlagColor(flag) } : {}}
                      onClick={() => toggleFlag(flag)}
                    >
                      {active && <span className="flag-check">✓ </span>}
                      {flag}
                    </button>
                  );
                })}
              </div>
              {tempFlags.length > 0 && (
                <div className="flag-modal-selected">
                  <span className="flag-modal-label">Selected: </span>
                  {tempFlags.map(f => (
                    <span key={f} className="flag-chip flag-chip-sm" style={{ backgroundColor: getFlagColor(f) }}>{f}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flag-modal-footer">
              <button className="flag-btn-cancel" onClick={() => setFlagModalLead(null)}>Cancel</button>
              <button className="flag-btn-save" onClick={saveFlagsForLead}>Save Flags</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
