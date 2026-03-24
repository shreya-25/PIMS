/**
 * LRTimeline.jsx
 *
 * Manages the timeline sub-section of the Lead Return workflow.
 * Allows investigators to add, edit, and delete chronological event entries
 * linked to a specific narrative ID (lead return).
 *
 * Features:
 *  - Add / edit / delete timeline entries (date, time range, location,
 *    description, optional flag)
 *  - Custom flags can be created on the fly
 *  - Access-level control for Case Managers
 *  - Session storage persistence scoped per case + lead
 *  - Chronological validation (start must be before end)
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
import localStyles from './LRTimeline.module.css';
import { LRTopMenu } from '../LRTopMenu';

const styles = { ...lrStyles, ...localStyles };

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FLAGS = ['High Priority', 'Investigation', 'Evidence Collected'];

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
  { label: 'Notes',        route: '/LRScratchpad' },
  { label: 'Timeline',     route: '/LRTimeline', active: true },
];

/** Returns a fresh default timeline entry for the form. */
const getDefaultEntry = () => ({
  date:           new Date().toISOString().split('T')[0],
  leadReturnId:   '',
  eventStartDate: '',
  eventEndDate:   '',
  startTime:      '',
  endTime:        '',
  location:       '',
  description:    '',
  flag:           '',
  accessLevel:    'Everyone',
});

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

/**
 * Combines a date string (YYYY-MM-DD) and time string (HH:MM) into a UTC ISO
 * timestamp. Used to construct event time payloads sent to the API.
 */
const combineDateTime = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}`);

/**
 * Combines date + time strings into a UTC ISO string for chronological
 * validation (avoids local timezone surprises during comparison).
 */
const combineDateTimeISO = (dateStr, timeStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [H, MM]   = timeStr.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, H, MM)).toISOString();
};

/**
 * Validates event chronology: start time must be before end time, and event
 * start date must be on or before event end date.
 * Returns an error string, or an empty string if valid.
 */
function assertChronology(entry) {
  if (entry.date && entry.startTime && entry.endTime) {
    const start = new Date(combineDateTimeISO(entry.date, entry.startTime));
    const end   = new Date(combineDateTimeISO(entry.date, entry.endTime));
    if (start > end) return 'Start Time must be before End Time.';
  }
  if (entry.eventStartDate && entry.eventEndDate) {
    if (new Date(entry.eventStartDate) > new Date(entry.eventEndDate)) {
      return 'Event Start Date must be on/before Event End Date.';
    }
  }
  return '';
}

/** Returns a list of required field labels that are empty or invalid. */
function getMissingFields(entry) {
  const missing = [];
  if (!String(entry.leadReturnId ?? '').trim()) missing.push('Narrative Id');
  if (!String(entry.description  ?? '').trim()) missing.push('Description');
  return missing;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LRTimeline = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedCase, selectedLead, leadStatus } = useContext(CaseContext);

  // ── State ──────────────────────────────────────────────────────────────────

  const [timelineEntries, setTimelineEntries]       = useState([]);
  const [newEntry, setNewEntry]                     = useState(getDefaultEntry);
  const [narrativeIds, setNarrativeIds]             = useState([]);
  const [leadData, setLeadData]                     = useState({});
  const [timelineFlags, setTimelineFlags]           = useState(DEFAULT_FLAGS);
  const [newFlag, setNewFlag]                       = useState('');
  const [editingIndex, setEditingIndex]             = useState(null);
  const [alertOpen, setAlertOpen]                   = useState(false);
  const [alertMessage, setAlertMessage]             = useState('');
  const [confirmOpen, setConfirmOpen]               = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const [selectedEntry, setSelectedEntry]           = useState(null);
  const [showEntryModal, setShowEntryModal]         = useState(false);

  const isEditing = editingIndex !== null;

  // ── Role / permission checks ───────────────────────────────────────────────

  const isCaseManager =
    selectedCase?.role === 'Case Manager' || selectedCase?.role === 'Detective Supervisor';

  const signedInOfficer = localStorage.getItem('loggedInUser');
  const primaryUsername = leadData?.primaryInvestigator || leadData?.primaryOfficer || '';
  const isPrimaryInvestigator =
    selectedCase?.role === 'Investigator' &&
    !!signedInOfficer &&
    signedInOfficer === primaryUsername;

  // ── Lead status and read-only guard ───────────────────────────────────────

  const { status, isReadOnly } = useLeadStatus({
    caseId:        selectedCase._id || selectedCase.id,
    leadNo:        selectedLead.leadNo,
    leadName:      selectedLead.leadName,
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
      formKey: `LRTimeline:form:${cn}:${cNam}:${ln}:${lNam}`,
      listKey: `LRTimeline:list:${cn}:${cNam}:${ln}:${lNam}`,
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

  // ── Session storage: restore form + list when the active case/lead changes ──

  useEffect(() => {
    const savedForm = sessionStorage.getItem(formKey);
    setNewEntry(savedForm ? { ...getDefaultEntry(), ...JSON.parse(savedForm) } : getDefaultEntry());
    const savedList = sessionStorage.getItem(listKey);
    setTimelineEntries(savedList ? JSON.parse(savedList) : []);
    setEditingIndex(null);
  }, [formKey, listKey]);

  // Persist state on every change so navigation doesn't lose data
  useEffect(() => { sessionStorage.setItem(formKey, JSON.stringify(newEntry)); },          [formKey, newEntry]);
  useEffect(() => { sessionStorage.setItem(listKey, JSON.stringify(timelineEntries)); },   [listKey, timelineEntries]);

  // ── Fetch lead metadata (assignees, primary officer) ──────────────────────

  useEffect(() => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (!selectedLead?.leadNo || !caseId) return;
    const token = localStorage.getItem('token');
    api
      .get(
        `/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${caseId}`,
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
        const encLead = encodeURIComponent(selectedLead.leadName);

        const { data } = await api.get(
          `/api/leadReturnResult/${selectedLead.leadNo}/${encLead}/${caseId}`,
          { headers: { Authorization: `Bearer ${token}` }, signal: ac.signal }
        );

        // Deduplicate, normalise, and sort in alphabetical (A→Z→AA→AB…) order
        const ids = [...new Set((data || []).map(r => normalizeId(r?.leadReturnId)).filter(Boolean))];
        ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
        setNarrativeIds(ids);

        // Pre-select the latest ID when the user is adding a new record
        setNewEntry(prev =>
          !isEditing && !prev.leadReturnId
            ? { ...prev, leadReturnId: ids.at(-1) || '' }
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

  // ── Format a start/end time pair for table display (New York timezone) ────

  const formatTimeRangeNY = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const opts  = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' };
    const start = new Date(startTime);
    const end   = new Date(endTime);
    if (isNaN(start) || isNaN(end)) return '';
    return `${start.toLocaleTimeString('en-US', opts)} - ${end.toLocaleTimeString('en-US', opts)}`;
  };

  // ── Fetch timeline entries from the API, applying access-level filtering ───

  // ── Map a raw API entry to display format ─────────────────────────────────

  const mapEntry = useCallback((e) => ({
    id:               e._id,
    rawEventDate:     e.eventDate,
    rawStartDate:     e.eventStartDate,
    rawEndDate:       e.eventEndDate,
    rawStartTime:     e.eventStartTime,
    rawEndTime:       e.eventEndTime,
    leadReturnId:     e.leadReturnId,
    eventLocation:    e.eventLocation,
    eventDescription: e.eventDescription,
    flags:            e.timelineFlag || [],
    accessLevel:      e.accessLevel || 'Everyone',
    enteredBy:        e.enteredBy,
    dateEntered:      formatDate(e.enteredDate),
    date:             formatDate(e.eventDate),
    eventStartDate:   formatDate(e.eventStartDate),
    eventEndDate:     formatDate(e.eventEndDate),
    timeRange:        formatTimeRangeNY(e.eventStartTime, e.eventEndTime),
    location:         e.eventLocation,
    description:      e.eventDescription,
  }), [formatTimeRangeNY]);

  const fetchTimelineEntries = useCallback(async () => {
    const caseId  = selectedCase?._id || selectedCase?.id;
    const token   = localStorage.getItem('token');
    const encLead = encodeURIComponent(selectedLead.leadName);

    try {
      const { data } = await api.get(
        `/api/timeline/${selectedLead.leadNo}/${encLead}/${caseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mapped = data.map(mapEntry);

      // Non-case-managers only see records they are permitted to view
      const currentUser   = localStorage.getItem('loggedInUser')?.trim();
      const leadAssignees = (leadData?.assignedTo || []).map(a => a?.trim());

      const visible = isCaseManager
        ? mapped
        : mapped.filter(entry => {
            if (entry.accessLevel === 'Everyone') return true;
            if (entry.accessLevel === 'Case Manager and Assignees') {
              return leadAssignees.some(a => a === currentUser);
            }
            return false;
          });

      setTimelineEntries(visible);
    } catch (err) {
      console.error('Error fetching timeline entries:', err);
    }
  }, [selectedLead, selectedCase, isCaseManager, leadData, mapEntry]);

  useEffect(() => {
    if (selectedLead?.leadNo && selectedLead?.leadName && (selectedCase?._id || selectedCase?.id)) {
      fetchTimelineEntries();
    }
  }, [selectedLead, selectedCase]);

  // ── Fetch custom timeline flags for this case from the DB ─────────────────

  useEffect(() => {
    if (!selectedCase?.caseNo) return;
    const token = localStorage.getItem('token');
    api
      .get(`/api/cases/${selectedCase.caseNo}/timeline-flags`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        const custom = data.timelineFlags || [];
        setTimelineFlags(Array.from(new Set([...DEFAULT_FLAGS, ...custom])));
      })
      .catch(err => console.error('Failed to fetch timeline flags:', err));
  }, [selectedCase?.caseNo]);

  // ── Form handlers ──────────────────────────────────────────────────────────

  const handleInputChange = (field, value) => {
    setNewEntry(prev => ({ ...prev, [field]: value }));
  };

  /** Resets the form and clears edit context. */
  const resetForm = () => {
    setEditingIndex(null);
    setNewEntry(getDefaultEntry());
    sessionStorage.removeItem(formKey);
  };

  /** Adds a custom flag to the dropdown and persists it to the database. */
  const handleAddFlag = async () => {
    const trimmed = newFlag.trim();
    if (!trimmed || timelineFlags.includes(trimmed)) return;

    // Optimistic update
    setTimelineFlags(prev => [...prev, trimmed]);
    setNewFlag('');

    try {
      const token = localStorage.getItem('token');
      await api.patch(
        `/api/cases/${selectedCase.caseNo}/timeline-flags`,
        { flag: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Failed to save timeline flag:', err);
      // Roll back optimistic update on failure
      setTimelineFlags(prev => prev.filter(f => f !== trimmed));
    }
  };

  // ── Add / update timeline entry ────────────────────────────────────────────

  const handleSubmit = async () => {
    // Validate required fields
    const missing = getMissingFields(newEntry);
    if (missing.length) {
      setAlertMessage(
        `Please fill the required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`
      );
      setAlertOpen(true);
      return;
    }

    // Validate chronology (start before end)
    const chronoErr = assertChronology(newEntry);
    if (chronoErr) {
      setAlertMessage(chronoErr);
      setAlertOpen(true);
      return;
    }

    const {
      date, leadReturnId, eventStartDate, eventEndDate,
      startTime, endTime, location, description, flag,
    } = newEntry;

    // Use eventStartDate as the canonical event date; fall back to the date field or today
    const finalDate = eventStartDate?.trim() || date?.trim() || new Date().toISOString().split('T')[0];
    const token     = localStorage.getItem('token');

    const payload = {
      leadNo:           selectedLead.leadNo,
      description:      selectedLead.leadName,
      assignedTo:       selectedLead.assignedTo || {},
      assignedBy:       selectedLead.assignedBy || {},
      enteredBy:        localStorage.getItem('loggedInUser'),
      caseName:         selectedCase.caseName,
      caseNo:           selectedCase.caseNo,
      leadReturnId,
      enteredDate:      new Date().toISOString(),
      eventDate:        finalDate,
      eventDescription: description,
      timelineFlag:     flag ? [flag] : [],
      accessLevel:      newEntry.accessLevel || 'Everyone',
    };

    // Only include optional fields when they have values
    if (eventStartDate)             payload.eventStartDate = eventStartDate;
    if (eventEndDate)               payload.eventEndDate   = eventEndDate;
    if (finalDate && startTime)     payload.eventStartTime = combineDateTime(finalDate, startTime);
    if (finalDate && endTime)       payload.eventEndTime   = combineDateTime(finalDate, endTime);
    if (location)                   payload.eventLocation  = location;

    try {
      if (!isEditing) {
        // CREATE: use the response to update state immediately, no second round-trip
        const { data } = await api.post('/api/timeline/create', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTimelineEntries(prev => [...prev, mapEntry(data.timeline)]);
      } else {
        // UPDATE: use the response to update the row in place immediately
        const entry = timelineEntries[editingIndex];
        const { data } = await api.put(`/api/timeline/${entry.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTimelineEntries(prev =>
          prev.map((e, i) => (i === editingIndex ? mapEntry(data.timeline) : e))
        );
      }
      resetForm();
    } catch (err) {
      console.error('Timeline submit error:', err);
      setAlertMessage(
        `Failed to ${!isEditing ? 'add' : 'update'} entry: ${err.response?.data?.message || err.message}`
      );
      setAlertOpen(true);
    }
  };

  // ── Prefill form for editing ───────────────────────────────────────────────

  const handleEdit = (idx) => {
    const e = timelineEntries[idx];
    setEditingIndex(idx);
    const toDateStr = (val) => { const d = new Date(val); return isNaN(d) ? '' : d.toISOString().slice(0, 10); };
    const toTimeStr = (val) => { const d = new Date(val); return isNaN(d) ? '' : d.toISOString().slice(11, 16); };
    setNewEntry({
      date:           toDateStr(e.rawEventDate),
      leadReturnId:   e.leadReturnId,
      eventStartDate: toDateStr(e.rawStartDate),
      eventEndDate:   toDateStr(e.rawEndDate),
      startTime:      toTimeStr(e.rawStartTime),
      endTime:        toTimeStr(e.rawEndTime),
      location:       e.eventLocation,
      description:    e.eventDescription,
      flag:           e.flags[0] || '',
      accessLevel:    e.accessLevel || 'Everyone',
    });
  };

  // ── Delete timeline entry (guarded by a confirmation modal) ───────────────

  const requestDelete = (idx) => { setPendingDeleteIndex(idx); setConfirmOpen(true); };

  const performDelete = async () => {
    const idx = pendingDeleteIndex;
    if (idx == null) return;

    try {
      await api.delete(`/api/timeline/${timelineEntries[idx].id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTimelineEntries(prev => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error('Delete failed:', err);
      setAlertMessage('Failed to delete entry.');
      setAlertOpen(true);
    } finally {
      setConfirmOpen(false);
      setPendingDeleteIndex(null);
    }
  };

  // ── Access-level change (Case Manager only) ────────────────────────────────

  const handleAccessChange = async (idx, newAccess) => {
    const entry = timelineEntries[idx];

    try {
      await api.put(
        `/api/timeline/${entry.id}`,
        { accessLevel: newAccess },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setTimelineEntries(prev => {
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

  const openEntryModal  = (entry) => { setSelectedEntry(entry); setShowEntryModal(true); };
  const closeEntryModal = ()      => { setShowEntryModal(false); setSelectedEntry(null); };

  // ── Render ─────────────────────────────────────────────────────────────────

  const casePageRoute = selectedCase?.role === 'Investigator' ? '/Investigator' : '/CasePageManager';

  return (
    <div className={styles.timelinePage}>
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
        message="Are you sure you want to delete this record?"
        onConfirm={performDelete}
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
                  onClick={() => navigate(route)}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Breadcrumb + lead status bar ── */}
          <div className={styles.caseandleadinfo}>
            <h5 className={styles.sideTitle}>
              <div className={styles.ldHead}>
                <Link to="/HomePage" className={styles.crumb}>PIMS Home</Link>
                <span className={styles.sep}>{' >> '}</span>
                <Link to={casePageRoute} state={{ caseDetails: selectedCase }} className={styles.crumb}>
                  Case: {selectedCase.caseNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <Link to="/LeadReview" state={{ leadDetails: selectedLead }} className={styles.crumb}>
                  Lead: {selectedLead.leadNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <span className={styles.crumbCurrent} aria-current="page">Lead Timeline</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status: ${status}` : leadStatus}
            </h5>
          </div>

          {/* ── Page heading ── */}
          <div className={styles.caseHeader}>
            <h2>TIMELINE INFORMATION</h2>
          </div>

          {/* ── Main scrollable content area ── */}
          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* ── Timeline entry form ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>
                  {isEditing ? 'Edit Entry' : 'Add Entry'}
                </div>

                <div className={styles.LREnteringContentBox}>
                  <div className={styles.timelineForm}>

                    {/* Row 1: Narrative ID + Location */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRow}>
                        <label>Narrative Id *</label>
                        <select
                          value={newEntry.leadReturnId}
                          onChange={e => handleInputChange('leadReturnId', e.target.value)}
                        >
                          <option value="">Select Id</option>
                          {/* Keep current value visible even if absent from the latest API list */}
                          {newEntry.leadReturnId &&
                            !narrativeIds.includes(normalizeId(newEntry.leadReturnId)) && (
                              <option value={newEntry.leadReturnId}>{newEntry.leadReturnId}</option>
                            )}
                          {narrativeIds.map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formRow}>
                        <label>Location</label>
                        <input
                          type="text"
                          value={newEntry.location}
                          onChange={e => handleInputChange('location', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 2: Event Start Date + Event End Date */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRow}>
                        <label>Event Start Date</label>
                        <input
                          type="date"
                          value={newEntry.eventStartDate}
                          onChange={e => handleInputChange('eventStartDate', e.target.value)}
                        />
                      </div>
                      <div className={styles.formRow}>
                        <label>Event End Date</label>
                        <input
                          type="date"
                          value={newEntry.eventEndDate}
                          onChange={e => handleInputChange('eventEndDate', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 3: Start Time + End Time */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRow}>
                        <label>Start Time</label>
                        <input
                          type="time"
                          value={newEntry.startTime}
                          onChange={e => handleInputChange('startTime', e.target.value)}
                        />
                      </div>
                      <div className={styles.formRow}>
                        <label>End Time</label>
                        <input
                          type="time"
                          value={newEntry.endTime}
                          onChange={e => handleInputChange('endTime', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 4: Description */}
                    <div className={styles.formRow}>
                      <label>Description *</label>
                      <textarea
                        rows="3"
                        value={newEntry.description}
                        onChange={e => handleInputChange('description', e.target.value)}
                      />
                    </div>
                        <div className={styles.formRow}>
                        <label>Create New Flag</label>
                        <div className={styles.addFlag}>
                          <input
                            type="text"
                            placeholder="Enter new flag name"
                            value={newFlag}
                            onChange={e => setNewFlag(e.target.value)}
                          />
                          <button className={styles.saveBtn1} onClick={handleAddFlag}>Add</button>
                        </div>
                      </div>

                    {/* Row 5: Assign Flag + Create New Flag */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRow}>
                        <label>Assign Flag</label>
                        <select
                          value={newEntry.flag}
                          onChange={e => handleInputChange('flag', e.target.value)}
                        >
                          <option value="">Select Flag</option>
                          {timelineFlags.map((flag, i) => (
                            <option key={i} value={flag}>{flag}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                  </div>

                  {/* Form action buttons */}
                  <div className={styles.formButtonsReturn}>
                    <button
                      disabled={isFormDisabled}
                      className={styles.saveBtn1}
                      onClick={handleSubmit}
                    >
                      {isEditing ? 'Update' : 'Add Entry'}
                    </button>

                    {isEditing && (
                      <button className={styles.cancelBtn} onClick={resetForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Timeline history table ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Timeline History</div>
                <table className={styles.leadsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>Id</th>
                      <th style={{ width: '8%' }}>Date</th>
                      <th style={{ width: '12%' }}>Entered By</th>
                      <th style={{ width: '12%' }}>Event Start</th>
                      <th style={{ width: '12%' }}>Event End</th>
                      <th style={{ width: '12%' }}>Location</th>
                      <th style={{ width: '7%' }}>More</th>
                      <th style={{ width: '10%' }}>Actions</th>
                      {isCaseManager && <th style={{ width: '15%' }}>Access</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {timelineEntries.length > 0 ? timelineEntries.map((entry, idx) => {
                      const canModify = isCaseManager || entry.enteredBy?.trim() === signedInOfficer?.trim();
                      return (
                      <tr key={entry.id || idx}>
                        <td>{entry.leadReturnId}</td>
                        <td>{entry.dateEntered}</td>
                        <td>{entry.enteredBy}</td>
                        <td>{entry.eventStartDate}</td>
                        <td>{entry.eventEndDate}</td>
                        <td>{entry.location}</td>
                        <td>
                          <button className={styles.viewEntryBtn} onClick={() => openEntryModal(entry)}>
                            View
                          </button>
                        </td>
                        <td>
                          <div className={styles.lrTableBtn}>
                            <button disabled={isFormDisabled || !canModify} onClick={() => handleEdit(idx)}>
                              <img
                                src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                alt="Edit"
                                className={styles.editIcon}
                              />
                            </button>
                            <button disabled={isFormDisabled || !canModify} onClick={() => requestDelete(idx)}>
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
                              value={entry.accessLevel || 'Everyone'}
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
                        <td colSpan={isCaseManager ? 9 : 8} style={{ textAlign: 'center' }}>
                          No Timeline Entry Available
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

      {/* ── Timeline entry detail modal ── */}
      {showEntryModal && selectedEntry && (
        <div className={styles.entryModalOverlay} onClick={closeEntryModal}>
          <div className={styles.entryModal} onClick={e => e.stopPropagation()}>
            <button className={styles.entryModalClose} onClick={closeEntryModal}>&times;</button>
            <h2 className={styles.entryModalTitle}>Timeline Entry Details</h2>

            {/* Row 1: Narrative Id | Date Entered | Entered By */}
            <table className={styles.entryGroupTable}>
              <thead>
                <tr>
                  <th>Narrative Id</th>
                  <th>Date Entered</th>
                  <th>Entered By</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedEntry.leadReturnId || ''}</td>
                  <td>{selectedEntry.dateEntered || ''}</td>
                  <td>{selectedEntry.enteredBy || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* Row 2: Event Start Date | Event End Date | Location */}
            <table className={styles.entryGroupTable}>
              <thead>
                <tr>
                  <th>Event Start Date</th>
                  <th>Event End Date</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedEntry.eventStartDate || ''}</td>
                  <td>{selectedEntry.eventEndDate || ''}</td>
                  <td>{selectedEntry.location || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* Row 3: Time Range */}
            <table className={styles.entryGroupTable}>
              <thead>
                <tr><th>Time Range</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedEntry.timeRange || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* Row 3: Description */}
            <table className={styles.entryGroupTable}>
              <thead>
                <tr><th>Description</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.wrapCell}>{selectedEntry.description || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* Row 4: Flag (only if present) */}
            {selectedEntry.flags?.length > 0 && (
              <table className={styles.entryGroupTable}>
                <thead>
                  <tr><th>Flag</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{selectedEntry.flags.join(', ')}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
