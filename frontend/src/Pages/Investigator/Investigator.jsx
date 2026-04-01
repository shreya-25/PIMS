import { useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { CaseContext } from '../CaseContext';
import Navbar from '../../components/Navbar/Navbar';
import Pagination from '../../components/Pagination/Pagination';
import { AlertModal } from '../../components/AlertModal/AlertModal';
import { SideBar } from '../../components/Sidebar/Sidebar';
import api from '../../api';

import { useLeads } from './hooks/useLeads';
import { useTableFilter } from './hooks/useTableFilter';
import { CollapsibleSection } from './components/CollapsibleSection';
import { LeadsTable } from './components/LeadsTable';
import { toTitleCase, isDeletedStatus, isClosedStatus, statusColor } from './utils';

import styles from './Investigator.module.css';

// ─── Table column definitions (module-level constants for stable memoization) ──

const ASSIGNED_COLUMNS   = ['Lead No.', 'Lead Name', 'Due Date', 'Priority', 'Days Left', 'Assigned Officers'];
const ASSIGNED_COL_KEY   = { 'Lead No.': 'id', 'Lead Name': 'description', 'Due Date': 'dueDate', 'Priority': 'priority', 'Days Left': 'remainingDays', 'Assigned Officers': 'assignedOfficers' };
const ASSIGNED_COL_WIDTHS = { 'Lead No.': '12%', 'Lead Name': '20%', 'Due Date': '13%', 'Priority': '10%', 'Days Left': '13%', 'Assigned Officers': '21%' };

const PENDING_COLUMNS    = ['Lead No.', 'Lead Name', 'Due Date', 'Priority', 'Days Left', 'Assigned Officers'];
const PENDING_COL_KEY    = { 'Lead No.': 'id', 'Lead Name': 'description', 'Due Date': 'dueDate', 'Priority': 'priority', 'Days Left': 'remainingDays', 'Assigned Officers': 'assignedOfficers' };
const PENDING_COL_WIDTHS = { 'Lead No.': '12%', 'Lead Name': '20%', 'Due Date': '13%', 'Priority': '10%', 'Days Left': '11%', 'Assigned Officers': '21%' };

const PENDING_LR_COLUMNS    = ['Lead No.', 'Lead Name', 'Case Name'];
const PENDING_LR_COL_KEY    = { 'Lead No.': 'id', 'Lead Name': 'description', 'Case Name': 'caseName' };
const PENDING_LR_COL_WIDTHS = { 'Lead No.': '15%', 'Lead Name': '35%', 'Case Name': '30%' };

const ALL_COLUMNS    = ['Lead No.', 'Lead Log Summary', 'Lead Status', 'Assigned Officers', 'Due Status'];
const ALL_COL_KEY    = { 'Lead No.': 'id', 'Lead Log Summary': 'description', 'Lead Status': 'leadStatus', 'Assigned Officers': 'assignedOfficers', 'Due Status': 'dueStatus' };
const ALL_COL_WIDTHS = { 'Lead No.': '10%', 'Lead Log Summary': '32%', 'Lead Status': '13%', 'Assigned Officers': '15%', 'Due Status': '12%' };

// Filter key arrays — kept at module level so useTableFilter deps stay stable
const LEAD_FILTER_KEYS    = ['id', 'description', 'dueDate', 'priority', 'remainingDays', 'flags', 'assignedOfficers'];
const PENDING_LR_FILTER_KEYS = ['id', 'description', 'caseName'];
const ALL_FILTER_KEYS     = ['id', 'description', 'leadStatus', 'assignedOfficers', 'dueStatus'];

// ─── Component ──────────────────────────────────────────────────────────────

export const Investigator = () => {
  const navigate = useNavigate();
  const { setSelectedCase, selectedCase, setSelectedLead, setLeadStatus } = useContext(CaseContext);

  const signedInOfficer = localStorage.getItem('loggedInUser');

  // ─── UI state ────────────────────────────────────────────────────────────
  const [activeTab,          setActiveTab]          = useState('allLeads');
  const [currentPage,        setCurrentPage]        = useState(1);
  const [pageSize,           setPageSize]           = useState(50);
  const [isCaseSummaryOpen,  setIsCaseSummaryOpen]  = useState(true);
  const [isCaseTeamOpen,     setIsCaseTeamOpen]     = useState(true);
  // Confirm-accept modal state
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, lead: null });

  // ─── Case info state ─────────────────────────────────────────────────────
  const [summary,  setSummary]  = useState('');
  const [team,     setTeam]     = useState({ detectiveSupervisor: '', caseManagers: [], investigators: [] });
  const [allUsers, setAllUsers] = useState([]);

  // ─── Data hooks ───────────────────────────────────────────────────────────
  const { leads, acceptLead } = useLeads(selectedCase?._id || selectedCase?.id, signedInOfficer);

  // ─── One-time setup ───────────────────────────────────────────────────────
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Fetch the full user list once for the formatUser helper
  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get('/api/users/usernames', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllUsers(data.users || []);
      } catch (err) {
        console.error('Could not load user list:', err);
      }
    }
    fetchUsers();
  }, []);

  // Fetch case summary whenever the active case changes
  useEffect(() => {
    if (!selectedCase?.caseNo) return;
    async function fetchSummary() {
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get(`/api/cases/case-summary/${selectedCase.caseNo}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(data.caseSummary);
      } catch (err) {
        console.error('Failed to load summary:', err);
      }
    }
    fetchSummary();
  }, [selectedCase?.caseNo]);

  // Fetch case team composition whenever the active case changes
  useEffect(() => {
    if (!selectedCase?.caseNo) return;
    api.get(`/api/cases/${selectedCase.caseNo}/team`)
      .then(({ data }) => setTeam(data))
      .catch(console.error);
  }, [selectedCase?.caseNo]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** Formats a username as "First Last (username)", falling back to the raw username. */
  const formatUser = username => {
    if (!username) return '—';
    const u = allUsers.find(x => x.username === username);
    return u ? `${u.firstName} ${u.lastName} (${u.username})` : username;
  };

  // ─── Navigation handlers ─────────────────────────────────────────────────

  /** Opens lead review page with full lead context loaded into the store. */
  const handleLeadClick = lead => {
    setSelectedLead({
      leadNo:           lead.leadNo || lead.id,
      incidentNo:       lead.incidentNo,
      leadName:         lead.description,
      dueDate:          lead.dueDate || 'N/A',
      priority:         lead.priority || 'Medium',
      flags:            lead.flags || [],
      assignedOfficers: lead.assignedOfficers || [],
      leadStatus:       lead.leadStatus,
      caseName:         lead.caseName,
      caseNo:           lead.caseNo,
    });
    setLeadStatus(lead.leadStatus);
    navigate('/leadReview', { state: { leadDetails: lead, caseDetails: selectedCase } });
  };

  /** Opens the Lead Return instruction page for an in-review lead. */
  const handleLRClick = lead => {
    const caseDetails = { _id: lead.caseId || lead.caseNo, caseNo: lead.caseNo, caseName: lead.caseName, role: 'Investigator' };
    const leadDetails = { leadNo: lead.id, leadName: lead.description };
    setSelectedCase(caseDetails);
    setSelectedLead(leadDetails);
    localStorage.setItem('role', 'Investigator');
    navigate('/LRInstruction', { state: { caseDetails, leadDetails } });
  };

  // ─── Accept-lead modal ────────────────────────────────────────────────────
  const openConfirm  = lead => setConfirmConfig({ isOpen: true, lead });
  const closeConfirm = ()   => setConfirmConfig({ isOpen: false, lead: null });

  const handleConfirmAccept = () => {
    acceptLead(confirmConfig.lead.id, confirmConfig.lead.description);
    closeConfirm();
  };

  // ─── Filter / sort state — one instance per table ─────────────────────────
  const assignedFilter  = useTableFilter(leads.assignedLeads,      LEAD_FILTER_KEYS);
  const pendingFilter   = useTableFilter(leads.pendingLeads,       LEAD_FILTER_KEYS);
  const pendingLRFilter = useTableFilter(leads.pendingLeadReturns, PENDING_LR_FILTER_KEYS);
  const allFilter       = useTableFilter(leads.allLeads,           ALL_FILTER_KEYS);

  // ─── Pagination ───────────────────────────────────────────────────────────

  /** Slices a sorted array to the current page window. */
  const paginate = data => data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalEntries = useMemo(() => ({
    assignedLeads:      assignedFilter.sortedData.length,
    pendingLeads:       pendingFilter.sortedData.length,
    pendingLeadReturns: pendingLRFilter.sortedData.length,
    allLeads:           allFilter.sortedData.length,
  }[activeTab] ?? 0), [activeTab, assignedFilter.sortedData, pendingFilter.sortedData, pendingLRFilter.sortedData, allFilter.sortedData]);

  // Reset to page 1 whenever the tab or any filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, assignedFilter.sortedData, pendingFilter.sortedData, pendingLRFilter.sortedData, allFilter.sortedData]);

  // ─── Row renderers ────────────────────────────────────────────────────────

  const renderAssignedRow = lead => (
    <tr key={lead.id}>
      <td>{lead.id}</td>
      <td>{lead.description}</td>
      <td>{lead.leadStatus === 'Completed' ? '' : lead.dueDate}</td>
      <td>{lead.priority}</td>
      <td>{lead.leadStatus === 'Completed' ? '' : lead.remainingDays}</td>
      <td>{(lead.assignedOfficers || []).join(', ')}</td>
      <td style={{ textAlign: 'center' }}>
        <button className={styles['view-btn1']}  onClick={() => handleLeadClick(lead)}>Manage</button>
        <button className={styles['accept-btn']} onClick={() => openConfirm(lead)}>Accept</button>
      </td>
    </tr>
  );

  const renderPendingRow = lead => (
    <tr key={lead.id}>
      <td>{lead.id}</td>
      <td>{lead.description}</td>
      <td>{lead.leadStatus === 'Completed' ? '' : lead.dueDate}</td>
      <td>{lead.priority}</td>
      <td>{lead.leadStatus === 'Completed' ? '' : lead.remainingDays}</td>
      <td>{(lead.assignedOfficers || []).join(', ')}</td>
      <td style={{ textAlign: 'center' }}>
        <button className={styles['view-btn1']} onClick={() => handleLeadClick(lead)}>Manage</button>
      </td>
    </tr>
  );

  const renderPendingLRRow = lead => (
    <tr key={lead.id}>
      <td>{lead.id}</td>
      <td>{lead.description}</td>
      <td>{lead.caseName}</td>
      <td style={{ textAlign: 'center' }}>
        <button className={styles['continue-btn']} onClick={() => handleLRClick(lead)}>Continue</button>
      </td>
    </tr>
  );

  const renderAllRow = lead => {
    const isDeleted = isDeletedStatus(lead.leadStatus);
    const isClosed  = isClosedStatus(lead.leadStatus);

    // Row-level styling: uniform colour across all cells for terminated leads
    // Deleted  → deep maroon (#7f1d1d) on a faint rose background; strikethrough text
    // Closed   → formal crimson (#9b1c1c) on a very pale pink background; no strikethrough
    const rowStyle = (isDeleted || isClosed)
      ? { color: '#9b1c1c', backgroundColor: '#fff5f5' }
      : {};

    const getDueStatus = (dueDate) => {
      if (!dueDate || dueDate === 'N/A') return { label: '—', sub: '', color: 'inherit' };
      const dateStr = dueDate.slice(0, 10);
      const [y, m, d] = dateStr.split('-').map(Number);
      const now = new Date();
      const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const dueUTC = Date.UTC(y, m - 1, d);
      const diff = Math.round((dueUTC - nowUTC) / (1000 * 60 * 60 * 24));
      const formatted = `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${String(y).slice(2)}`;
      if (diff < 0) return { label: formatted, sub: `${Math.abs(diff)}d overdue`, color: '#dc2626' };
      if (diff === 0) return { label: formatted, sub: 'Due today', color: '#d97706' };
      return { label: formatted, sub: `${diff}d left`, color: '#16a34a' };
    };

    // Terminated leads show no due-date details
    const { label, sub, color } = (isDeleted || isClosed || lead.leadStatus === 'Completed')
      ? { label: '—', sub: '', color: 'inherit' }
      : getDueStatus(lead.dueDate);

    const isNonNavigable = isDeleted || isClosed;

    return (
      <tr key={lead.id} style={rowStyle}>
        <td>{lead.id}</td>
        <td>{lead.description}</td>
        <td style={{ color: isNonNavigable ? 'inherit' : statusColor(lead.leadStatus), fontWeight: 600 }}>
          {lead.leadStatus === 'In Review' ? 'Under Review' : lead.leadStatus}
        </td>
        <td>{(lead.assignedOfficers || []).join(', ') || <em>None</em>}</td>
        <td>
          <div style={{ color: isNonNavigable ? 'inherit' : color, fontWeight: 500, lineHeight: 1.4 }}>
            <div style={{ fontSize: 18 }}>{label}</div>
            {sub && <div style={{ fontSize: 18 }}>{sub}</div>}
          </div>
        </td>
        <td style={{ textAlign: 'center' }}>
          <button
            className={isNonNavigable ? styles['manage-btn-terminated'] : styles['view-btn1']}
            onClick={() => !isNonNavigable && handleLeadClick(lead)}
            disabled={isNonNavigable}
          >
            Manage
          </button>
        </td>
      </tr>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles['case-page-manager']}>
      <Navbar />

      <div className={styles['main-container']}>
        {/* Sidebar with tab navigation and lead counts */}
        <SideBar
          activePage="Investigator"
          leads={leads}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className={styles['left-content']}>
          {/* Case title */}
          <div className={styles['case-header-cp']}>
            <div className={styles['cp-head']}>
              <h2>Case: {selectedCase?.caseName ? toTitleCase(selectedCase.caseName) : 'Unknown Case'}</h2>
            </div>
          </div>

          {/* Collapsible case summary */}
          <CollapsibleSection
            title="Case Summary"
            isOpen={isCaseSummaryOpen}
            onToggle={() => setIsCaseSummaryOpen(o => !o)}
          >
            <div className={styles['case-summary-content']}>
              {summary?.trim() ? summary : 'No summary available'}
            </div>
          </CollapsibleSection>

          {/* Collapsible case team roster */}
          <CollapsibleSection
            title="Case Team"
            isOpen={isCaseTeamOpen}
            onToggle={() => setIsCaseTeamOpen(o => !o)}
          >
            <div className={styles['case-team']}>
              <table className={styles['leads-table']}>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Role</th>
                    <th>Name(s)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Detective Supervisor</td>
                    <td>{formatUser(team.detectiveSupervisor)}</td>
                  </tr>
                  <tr>
                    <td>Case Manager</td>
                    <td>{(team.caseManagers || []).map(formatUser).join(', ') || '—'}</td>
                  </tr>
                  <tr>
                    <td>Investigator{team.investigators.length > 1 ? 's' : ''}</td>
                    <td>
                      {team.investigators.length
                        ? team.investigators.map(formatUser).join(', ')
                        : 'None assigned'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          {/* Tab bar showing lead counts per category */}
          <div className={styles['stats-bar']}>
            {[
              { tab: 'allLeads',           label: 'My Leads',               count: leads.allLeads.length },
              { tab: 'assignedLeads',      label: 'Assigned Leads',         count: leads.assignedLeads.length },
              { tab: 'pendingLeads',       label: 'Accepted Leads',         count: leads.pendingLeads.length },
              { tab: 'pendingLeadReturns', label: 'Lead Returns In Review', count: leads.pendingLeadReturns.length },
            ].map(({ tab, label, count }) => (
              <span
                key={tab}
                className={`${styles.hoverable} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {label}: {count}
              </span>
            ))}
          </div>

          {/* Table area — renders only the active tab's table */}
          <div className={styles['content-section']}>
            {activeTab === 'assignedLeads' && (
              <LeadsTable
                columns={ASSIGNED_COLUMNS}
                colKey={ASSIGNED_COL_KEY}
                colWidths={ASSIGNED_COL_WIDTHS}
                rows={paginate(assignedFilter.sortedData)}
                filter={assignedFilter}
                renderRow={renderAssignedRow}
                emptyMessage="No assigned leads available"
              />
            )}

            {activeTab === 'pendingLeads' && (
              <LeadsTable
                columns={PENDING_COLUMNS}
                colKey={PENDING_COL_KEY}
                colWidths={PENDING_COL_WIDTHS}
                rows={paginate(pendingFilter.sortedData)}
                filter={pendingFilter}
                renderRow={renderPendingRow}
                emptyMessage="No accepted leads available"
              />
            )}

            {activeTab === 'pendingLeadReturns' && (
              <LeadsTable
                columns={PENDING_LR_COLUMNS}
                colKey={PENDING_LR_COL_KEY}
                colWidths={PENDING_LR_COL_WIDTHS}
                rows={paginate(pendingLRFilter.sortedData)}
                filter={pendingLRFilter}
                renderRow={renderPendingLRRow}
                emptyMessage="No pending lead returns available"
              />
            )}

            {activeTab === 'allLeads' && (
              <LeadsTable
                columns={ALL_COLUMNS}
                colKey={ALL_COL_KEY}
                colWidths={ALL_COL_WIDTHS}
                rows={paginate(allFilter.sortedData)}
                filter={allFilter}
                renderRow={renderAllRow}
                emptyMessage="No leads available"
              />
            )}

            {/* Confirm-accept modal */}
            <AlertModal
              isOpen={confirmConfig.isOpen}
              title="Confirm Acceptance"
              message={`Are you sure you want to accept Lead #${confirmConfig.lead?.id} – ${confirmConfig.lead?.description}?`}
              onClose={closeConfirm}
              onConfirm={handleConfirmAccept}
            >
              <div className="alert-footer">
                <button className="alert-button" onClick={handleConfirmAccept}>Yes</button>
                <button className="alert-button" onClick={closeConfirm}>No</button>
              </div>
            </AlertModal>

            <Pagination
              currentPage={currentPage}
              totalEntries={totalEntries}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
