/**
 * LRScratchpad.jsx
 *
 * Manages the notes (scratchpad) sub-section of the Lead Return workflow.
 * Allows investigators to add, edit, and delete free-text notes tied to
 * a specific narrative ID (lead return).
 *
 * Features:
 *  - Add / edit / delete note records
 *  - Access-level control for Case Managers
 *  - Session storage persistence scoped per case + lead
 *  - Read-only enforcement based on lead status
 */

import { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../../components/Navbar/Navbar';
import { SideBar } from '../../../components/Sidebar/Sidebar';
import { AlertModal } from '../../../components/AlertModal/AlertModal';
import { CaseContext } from '../../CaseContext';
import api from '../../../api';
import { useLeadStatus } from '../../../hooks/useLeadStatus';
import { useLeadReport } from '../useLeadReport';
import { formatDate, normalizeId, alphabetToNumber } from '../lrUtils';

// Merge shared LR stylesheet with component-specific overrides
import lrStyles    from '../LR.module.css';
import localStyles from './LRScratchpad.module.css';
import { LRTopMenu } from '../LRTopMenu';
import { safeEncode } from '../../../utils/encode';

const styles = { ...lrStyles, ...localStyles };

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_NOTE = { text: '', returnId: '', accessLevel: 'Everyone' };

// Section tabs shared across all LR sub-pages
const SECTION_TABS = [
  { label: 'Instructions', route: '/LRInstruction' },
  { label: 'Narrative',    route: '/LRReturn' },
  { label: 'Person',       route: '/LRPerson' },
  { label: 'Vehicles',     route: '/LRVehicle' },
  { label: 'Enclosures',   route: '/LREnclosures' },
  { label: 'Evidence',     route: '/LREvidence' },
  { label: 'Pictures',     route: '/LRPictures' },
  { label: 'Audio',        route: '/LRAudio' },
  { label: 'Videos',       route: '/LRVideo' },
  { label: 'Notes',        route: '/LRScratchpad', active: true },
  { label: 'Timeline',     route: '/LRTimeline' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const LRScratchpad = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedCase, selectedLead, leadStatus, setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const { caseDetails, leadDetails } = location.state || {};

  // ── State ──────────────────────────────────────────────────────────────────

  const [notes, setNotes]                           = useState([]);
  const [noteData, setNoteData]                     = useState(DEFAULT_NOTE);
  const [narrativeIds, setNarrativeIds]             = useState([]);
  const [leadData, setLeadData]                     = useState({});
  const [editingIndex, setEditingIndex]             = useState(null);
  const [alertOpen, setAlertOpen]                   = useState(false);
  const [alertMessage, setAlertMessage]             = useState('');
  const [confirmOpen, setConfirmOpen]               = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const [expandedRows, setExpandedRows]             = useState(new Set());

  const isEditing = editingIndex !== null;

  // ── Role / permission checks ───────────────────────────────────────────────

  const isCaseManager =
    selectedCase?.role === 'Case Manager' || selectedCase?.role === 'Detective Supervisor';

  const signedInOfficer = localStorage.getItem('loggedInUser');
  const signedInUserId  = localStorage.getItem('userId');
  const primaryInvestigatorUserId = leadData?.primaryInvestigatorUserId || '';
  const primaryUsername = leadData?.primaryInvestigator || leadData?.primaryOfficer || '';
  const isPrimaryInvestigator =
    selectedCase?.role === 'Investigator' &&
    !!signedInUserId &&
    (primaryInvestigatorUserId
      ? signedInUserId === String(primaryInvestigatorUserId)
      : signedInOfficer === primaryUsername);

  // ── Lead status and read-only guard ───────────────────────────────────────

  const { status, isReadOnly } = useLeadStatus({
    caseId:   selectedCase._id || selectedCase.id,
    leadNo:   selectedLead.leadNo,
    leadName: selectedLead.leadName,
    initialStatus: selectedLead?.leadStatus,
  });

  // Consolidated disable flag for all form controls
  const isFormDisabled =
    selectedLead?.leadStatus === 'Completed' ||
    isReadOnly;

  // ── Session-storage keys (scoped to the active case + lead) ───────────────

  const { formKey, listKey } = useMemo(() => {
    const cn   = selectedCase?.caseNo   ?? 'NA';
    const cNam = encodeURIComponent(selectedCase?.caseName ?? 'NA');
    const ln   = selectedLead?.leadNo   ?? 'NA';
    const lNam = encodeURIComponent(selectedLead?.leadName ?? 'NA');
    return {
      formKey: `LRScratchpad:form:${cn}:${cNam}:${ln}:${lNam}`,
      listKey: `LRScratchpad:list:${cn}:${cNam}:${ln}:${lNam}`,
    };
  }, [selectedCase?.caseNo, selectedCase?.caseName, selectedLead?.leadNo, selectedLead?.leadName]);

  // ── Shared report generation hook (Case Manager "Manage Lead Return" button) ──

  const { isGenerating, handleViewLeadReturn } = useLeadReport({
    selectedLead,
    selectedCase,
    location,
    setAlertMessage,
    setAlertOpen,
  });

  // ── Sync context from router state (covers fresh-session tab navigation) ──
  useEffect(() => {
    if (caseDetails && leadDetails) {
      setSelectedCase(caseDetails);
      setSelectedLead(leadDetails);
    }
  }, [caseDetails, leadDetails]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session storage: restore form + list when the active case/lead changes ──

  useEffect(() => {
    const savedForm = sessionStorage.getItem(formKey);
    setNoteData(savedForm ? JSON.parse(savedForm) : DEFAULT_NOTE);
    const savedList = sessionStorage.getItem(listKey);
    setNotes(savedList ? JSON.parse(savedList) : []);
    setEditingIndex(null);
  }, [formKey, listKey]);

  // Persist state on every change so navigation doesn't lose data
  useEffect(() => { sessionStorage.setItem(formKey, JSON.stringify(noteData)); }, [formKey, noteData]);
  useEffect(() => { sessionStorage.setItem(listKey, JSON.stringify(notes)); },   [listKey, notes]);

  // ── Fetch lead metadata (assignees, primary officer) ──────────────────────

  useEffect(() => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (!selectedLead?.leadNo || !caseId) return;
    const token = localStorage.getItem('token');
    api
      .get(
        `/api/lead/lead/${selectedLead.leadNo}/${safeEncode(selectedLead.leadName)}/${caseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(({ data }) => {
        if (data.length > 0) {
          setLeadData({
            ...data[0],
            assignedTo: data[0].assignedTo || [],
            leadStatus: data[0].leadStatus || '',
          });
        }
      })
      .catch(err => console.error('Failed to fetch lead data:', err));
  }, [selectedLead, selectedCase]);

  // ── Fetch narrative IDs for the return-ID dropdown ────────────────────────

  useEffect(() => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (!selectedLead?.leadNo || !caseId) return;
    const ac = new AbortController();

    (async () => {
      try {
        const token   = localStorage.getItem('token');
        const encLead = safeEncode(selectedLead.leadName);

        const { data } = await api.get(
          `/api/leadReturnResult/${selectedLead.leadNo}/${encLead}/${caseId}`,
          { headers: { Authorization: `Bearer ${token}` }, signal: ac.signal }
        );

        // Deduplicate, normalise, and sort in alphabetical (A→Z→AA→AB…) order
        const ids = [...new Set((data || []).map(r => normalizeId(r?.leadReturnId)).filter(Boolean))];
        ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
        setNarrativeIds(ids);

        // Pre-select the latest ID when the user is adding a new record
        setNoteData(prev =>
          !isEditing && !prev.returnId
            ? { ...prev, returnId: ids.at(-1) || '' }
            : prev
        );
      } catch (err) {
        if (!ac.signal.aborted) console.error('Failed to fetch narrative IDs:', err);
      }
    })();

    return () => ac.abort();
  }, [
    selectedLead?.leadNo,
    selectedLead?.leadName,
    selectedCase?._id,
    selectedCase?.id,
    isEditing,
  ]);

  // ── Fetch notes from the API, applying access-level filtering ─────────────

  const fetchNotes = async () => {
    const caseId  = selectedCase?._id || selectedCase?.id;
    const token   = localStorage.getItem('token');
    const encLead = safeEncode(selectedLead?.leadName);

    try {
      const { data } = await api.get(
        `/api/scratchpad/${selectedLead.leadNo}/${encLead}/${caseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter to Lead-type notes only, then map to display shape
      const formatted = data
        .filter(note => note.type === 'Lead')
        .map(note => ({
          ...note,
          dateEntered:     formatDate(note.enteredDate),
          returnId:        note.leadReturnId || '',
          accessLevel:     note.accessLevel ?? 'Everyone',
          enteredByUserId: note.enteredByUserId ? String(note.enteredByUserId) : null,
        }));

      // Non-case-managers only see records they are permitted to view
      const currentUserId = localStorage.getItem('userId');
      const currentUser   = localStorage.getItem('loggedInUser')?.trim();
      const leadAssigneeUserIds = (leadData?.assignedTo || [])
        .map(a => (typeof a === 'object' && a !== null ? String(a.userId || '') : ''))
        .filter(Boolean);
      const leadAssigneeUsernames = (leadData?.assignedTo || [])
        .map(a => (typeof a === 'object' && a !== null ? (a.username || '') : String(a ?? '')).trim());

      const visible = isCaseManager
        ? formatted
        : formatted.filter(note => {
            if (note.accessLevel === 'Everyone') return true;
            if (note.accessLevel === 'Case Manager and Assignees') {
              return currentUserId
                ? leadAssigneeUserIds.includes(currentUserId)
                : leadAssigneeUsernames.some(a => a === currentUser);
            }
            return false;
          });

      setNotes(visible);
    } catch (err) {
      console.error('Error fetching scratchpad notes:', err);
    }
  };

  useEffect(() => {
    if (selectedLead?.leadNo && selectedLead?.leadName && (selectedCase?._id || selectedCase?.id)) {
      fetchNotes();
    }
  }, [selectedLead, selectedCase]);

  // ── Form handlers ──────────────────────────────────────────────────────────

  const handleInputChange = (field, value) => {
    setNoteData(prev => ({ ...prev, [field]: value }));
  };

  /** Resets the form and clears edit context. */
  const resetForm = () => {
    setEditingIndex(null);
    setNoteData(DEFAULT_NOTE);
    sessionStorage.removeItem(formKey);
  };

  // ── Add note ───────────────────────────────────────────────────────────────

  const handleAddNote = async () => {
    if (!noteData.text) {
      setAlertMessage('Please enter a note.');
      setAlertOpen(true);
      return;
    }

    const payload = {
      leadNo:       selectedLead?.leadNo,
      description:  selectedLead?.leadName,
      assignedTo:   {},
      assignedBy:   {},
      enteredBy:        localStorage.getItem('loggedInUser'),
      enteredByUserId:  localStorage.getItem('userId'),
      caseName:         selectedCase?.caseName,
      caseNo:       selectedCase?.caseNo,
      leadReturnId: noteData.returnId,
      enteredDate:  new Date().toISOString(),
      text:         noteData.text,
      type:         'Lead',
      accessLevel:  noteData.accessLevel || 'Everyone',
    };

    try {
      const { data } = await api.post('/api/scratchpad/create', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setNotes(prev => [
        ...prev,
        {
          ...data,
          dateEntered: formatDate(data.enteredDate),
          returnId:    data.leadReturnId,
          accessLevel: data.accessLevel || 'Everyone',
        },
      ]);
      resetForm();
    } catch (err) {
      console.error('Error saving scratchpad note:', err);
      setAlertMessage('Failed to save note.');
      setAlertOpen(true);
    }
  };

  // ── Edit / update existing note ────────────────────────────────────────────

  const handleEditClick = (idx) => {
    const n = notes[idx];
    setEditingIndex(idx);
    setNoteData({
      text:        n.text,
      returnId:    n.leadReturnId || '',
      accessLevel: n.accessLevel || 'Everyone',
    });
  };

  const handleUpdateNote = async () => {
    if (editingIndex === null) return;
    const note = notes[editingIndex];

    try {
      await api.put(
        `/api/scratchpad/${note._id}`,
        {
          leadReturnId: noteData.returnId,
          text:         noteData.text,
          type:         'Lead',
          accessLevel:  noteData.accessLevel || 'Everyone',
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      await fetchNotes();
      resetForm();
    } catch (err) {
      console.error('Update failed:', err);
      setAlertMessage('Failed to update note.');
      setAlertOpen(true);
    }
  };

  // ── Delete note (guarded by a confirmation modal) ─────────────────────────

  const requestDeleteNote = (idx) => { setPendingDeleteIndex(idx); setConfirmOpen(true); };

  const performDeleteNote = async () => {
    const idx = pendingDeleteIndex;
    if (idx == null) return;

    try {
      await api.delete(`/api/scratchpad/${notes[idx]._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotes(prev => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error('Delete failed:', err);
      setAlertMessage('Failed to delete note.');
      setAlertOpen(true);
    } finally {
      setConfirmOpen(false);
      setPendingDeleteIndex(null);
    }
  };

  // ── Access-level change (Case Manager only) ────────────────────────────────

  const handleAccessChange = async (idx, newAccess) => {
    const note = notes[idx];

    try {
      await api.put(
        `/api/scratchpad/${note._id}`,
        { accessLevel: newAccess },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNotes(prev => {
        const copy = [...prev];
        copy[idx]  = { ...copy[idx], accessLevel: newAccess };
        return copy;
      });
    } catch (err) {
      console.error('Failed to update accessLevel:', err);
      setAlertMessage('Could not change access level. Please try again.');
      setAlertOpen(true);
    }
  };

  const toggleRowExpand = useCallback((idx) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const casePageRoute = selectedCase?.role === 'Investigator' ? '/Investigator' : '/CasePageManager';

  return (
    <div className={styles.scratchpadPage}>
      <Navbar />

      {/* Notification alert */}
      <AlertModal
        isOpen={alertOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={() => setAlertOpen(false)}
      />

      {/* Delete confirmation dialog */}
      <AlertModal
        isOpen={confirmOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this note?"
        onConfirm={performDeleteNote}
        onClose={() => { setConfirmOpen(false); setPendingDeleteIndex(null); }}
      />

      <div className={styles.LRIContent}>
        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          {/* ── Top navigation bar (page-level) ── */}
          <LRTopMenu
            activePage="addLeadReturn"
            selectedCase={selectedCase}
            selectedLead={selectedLead}
            isPrimaryInvestigator={isPrimaryInvestigator}
            isGenerating={isGenerating}
            onManageLeadReturn={handleViewLeadReturn}
            styles={styles}
          />

          {/* ── Section tabs (sub-page navigation) ── */}
          <div className={styles.topMenuSections}>
            <div className={styles.menuItems} style={{ fontSize: '19px' }}>
              {SECTION_TABS.map(({ label, route, active }) => (
                <span
                  key={route}
                  className={`${styles.menuItem}${active ? ` ${styles.menuItemActive}` : ''}`}
                  style={{ fontWeight: active ? '600' : '400' }}
                  onClick={() => navigate(route, { state: { caseDetails: selectedCase, leadDetails: selectedLead } })}
                >
                  {label}
                </span>
              ))}
              <span
                className={styles.menuItem}
                onClick={() => navigate('/viewLR', { state: { caseDetails: selectedCase, leadDetails: selectedLead } })}
                >
                  Review
                </span>
            </div>
          </div>

          {/* ── Breadcrumb + lead status bar ── */}
          <div className={styles.caseandleadinfo}>
            <h5 className={styles.sideTitle}>
              <div className={styles.ldHead}>
                <span className={styles.crumb} style={{ cursor: "pointer" }} onClick={() => (localStorage.getItem("systemRole") || localStorage.getItem("role")) === "Admin" ? navigate("/AdminTeam") : navigate("/HomePage")}>PIMS Home</span>
                <span className={styles.sep}>{' >> '}</span>
                <Link to={casePageRoute} state={{ caseDetails: selectedCase }} className={styles.crumb}>
                  Case: {selectedCase.caseNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <Link to="/LeadReview" state={{ leadDetails: selectedLead }} className={styles.crumb}>
                  Lead: {selectedLead.leadNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <span className={styles.crumbCurrent} aria-current="page">Lead Notes</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status: ${status}` : leadStatus}
            </h5>
          </div>

          {/* ── Page heading ── */}
          <div className={styles.caseHeader}>
            <h2>NOTES</h2>
          </div>

          {/* ── Main scrollable content area ── */}
          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* ── Note entry form ── */}
              <div className={styles.timelineFormSec}>
                <div className={styles.formRowEvidence}>
                  <label>Narrative Id*</label>
                  <select
                    value={noteData.returnId}
                    onChange={e => handleInputChange('returnId', e.target.value)}
                  >
                    <option value="">Select Id</option>
                    {/* Keep the current value visible even if absent from the latest API list (edit/legacy) */}
                    {noteData.returnId && !narrativeIds.includes(normalizeId(noteData.returnId)) && (
                      <option value={noteData.returnId}>{noteData.returnId}</option>
                    )}
                    {narrativeIds.map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </div>

                <h4 className={styles.evidenceFormH4}>
                  {isEditing ? 'Edit Note' : 'Add New Note*'}
                </h4>

                <div className={styles.formRowEvidence}>
                  <textarea
                    value={noteData.text}
                    onChange={e => handleInputChange('text', e.target.value)}
                    placeholder="Write your note here"
                  />
                </div>

                {/* Form action buttons */}
                <div className={styles.formButtonsReturn}>
                  {isEditing ? (
                    <>
                      <button
                        disabled={isFormDisabled}
                        onClick={handleUpdateNote}
                        className={styles.saveBtn1}
                      >
                        Update Note
                      </button>
                      <button
                        disabled={isFormDisabled}
                        onClick={resetForm}
                        className={styles.cancelBtn}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={isFormDisabled}
                      onClick={handleAddNote}
                      className={styles.saveBtn1}
                    >
                      Add Note
                    </button>
                  )}
                </div>
              </div>

              {/* ── Notes history table ── */}
              <table className={styles.leadsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>Id</th>
                    <th style={{ width: '8%' }}>Date</th>
                    <th style={{ width: '12%' }}>Entered By</th>
                    <th>Notes</th>
                    <th style={{ width: '10%' }}>Actions</th>
                    {isCaseManager && <th style={{ width: '15%' }}>Access</th>}
                  </tr>
                </thead>
                <tbody>
                  {notes.length > 0 ? notes.map((note, idx) => {
                    const canModify  = isCaseManager || (note.enteredByUserId && signedInUserId
                      ? note.enteredByUserId === signedInUserId
                      : note.enteredBy?.trim() === signedInOfficer?.trim());
                    const isExpanded = expandedRows.has(idx);
                    return (
                    <tr key={note._id || idx}>
                      <td>{note.returnId || ''}</td>
                      <td>{note.dateEntered}</td>
                      <td>{note.enteredBy}</td>
                      <td className={styles.descriptionCell}>
                        <div className={isExpanded ? styles.narrativeContentExpanded : styles.narrativeContentCollapsed}>
                          {note.text}
                        </div>
                        {note.text && (
                          <button className={styles.viewToggleBtn} onClick={() => toggleRowExpand(idx)}>
                            {isExpanded ? 'View Less ▲' : 'View ▶'}
                          </button>
                        )}
                      </td>
                      <td>
                        <div className={styles.lrTableBtn}>
                          <button disabled={isFormDisabled || !canModify} onClick={() => handleEditClick(idx)}>
                            <img
                              src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                              alt="Edit"
                              className={styles.editIcon}
                            />
                          </button>
                          <button disabled={isFormDisabled || !canModify} onClick={() => requestDeleteNote(idx)}>
                            <img
                              src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                              alt="Delete"
                              className={styles.editIcon}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Access level dropdown — visible to Case Managers only */}
                      {isCaseManager && (
                        <td>
                          <select
                            value={note.accessLevel}
                            onChange={e => handleAccessChange(idx, e.target.value)}
                            className={styles.accessDropdown}
                          >
                            <option value="Everyone">All</option>
                            <option value="Case Manager Only">Case Manager</option>
                            <option value="Case Manager and Assignees">Assignees</option>
                          </select>
                        </td>
                      )}
                    </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign: 'center' }}>
                        No Notes Added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
