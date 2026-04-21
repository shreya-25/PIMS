/**
 * LRResult.jsx
 *
 * Lead Narrative page — allows investigators to add, edit, and review
 * narrative (return) entries for a specific lead. Case managers also have
 * the ability to control per-entry access levels and generate a full
 * PDF lead report.
 */
import { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../../components/Navbar/Navbar';
import styles from './LRResult.module.css';
import { LRTopMenu } from '../LRTopMenu';
import { CaseContext } from '../../CaseContext';
import api from '../../../api';
import { SideBar } from '../../../components/Sidebar/Sidebar';
import { AlertModal } from '../../../components/AlertModal/AlertModal';
import { pickHigherStatus } from '../../../utils/status';
import { useLeadStatus } from '../../../hooks/useLeadStatus';
import { safeEncode } from '../../../utils/encode';

// ─── Module-level utilities ───────────────────────────────────────────────────

/**
 * Converts an alphabetic lead return ID (e.g. "A", "Z", "AA") to
 * its equivalent integer for ordering/incrementing purposes.
 */
const alphabetToNumber = (str) => {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * 26 + (str.charCodeAt(i) - 64);
  }
  return result;
};

/**
 * Converts an integer back to an alphabetic lead return ID
 * (inverse of alphabetToNumber). Used to compute the next available ID.
 */
const numberToAlphabet = (num) => {
  let result = '';
  while (num > 0) {
    const rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
};

/** Returns a blank narrative form pre-populated with today's date and the officer name. */
const buildDefaultForm = (officerName = '') => ({
  results: '',
  leadReturnId: '',
  enteredDate: new Date().toLocaleDateString(),
  enteredBy: officerName.trim(),
  accessLevel: 'Everyone',
});

/**
 * Fetches attached files for each item in a collection and merges them
 * into the item as a `files` array. Used when assembling the full report payload.
 *
 * @param {object[]} items         - Array of records to enrich
 * @param {string}   idFieldName   - Field on each item that holds its file-lookup ID
 * @param {string}   filesEndpoint - API base path for fetching files (e.g. "/api/lrpictures/files")
 */
const attachFiles = async (items, idFieldName, filesEndpoint) => {
  const token = localStorage.getItem('token');
  return Promise.all(
    (items || []).map(async (item) => {
      const id = item[idFieldName];
      if (!id) return { ...item, files: [] };
      try {
        const { data: files } = await api.get(`${filesEndpoint}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return { ...item, files };
      } catch (err) {
        console.error(`Failed to fetch files from ${filesEndpoint}/${id}:`, err);
        return { ...item, files: [] };
      }
    })
  );
};

/** Section-tab definitions; used to render the second menu bar declaratively. */
const SECTION_TABS = [
  { label: 'Instructions', route: '/LRInstruction' },
  { label: 'Narrative',    route: '/LRReturn',      active: true },
  { label: 'Person',       route: '/LRPerson' },
  { label: 'Vehicles',     route: '/LRVehicle' },
  { label: 'Enclosures',   route: '/LREnclosures' },
  { label: 'Evidence',     route: '/LREvidence' },
  { label: 'Pictures',     route: '/LRPictures' },
  { label: 'Audio',        route: '/LRAudio' },
  { label: 'Videos',       route: '/LRVideo' },
  { label: 'Notes',        route: '/LRScratchpad' },
  { label: 'Timeline',     route: '/LRTimeline' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const LRResult = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Context & router state ─────────────────────────────────────────────────
  const { leadDetails, caseDetails } = location.state || {};
  const {
    selectedCase,
    selectedLead,
    leadStatus,
    setLeadStatus,
    setLeadReturns,
    setSelectedCase,
    setSelectedLead,
  } = useContext(CaseContext);

  // Prefer live context values; fall back to values passed through router state
  const effectiveCase = selectedCase?.caseNo ? selectedCase : caseDetails;
  const effectiveLead = selectedLead?.leadNo ? selectedLead : leadDetails;

  // ─── Derived values ─────────────────────────────────────────────────────────
  const caseNo = effectiveCase?.caseNo ?? '';

  const isCaseManager =
    selectedCase?.role === 'Case Manager' || selectedCase?.role === 'Detective Supervisor';

  /**
   * Stable session-storage key prefix scoped to the current case/lead pair.
   * Prevents draft data from leaking between different leads.
   */
  const storagePrefix = useMemo(() => {
    const cn    = effectiveCase?.caseNo  ?? '';
    const cName = effectiveCase?.caseName ?? '';
    const ln    = effectiveLead?.leadNo   ?? '';
    const lName = effectiveLead?.leadName ?? '';
    return `LRResult:${cn}:${encodeURIComponent(cName)}:${ln}:${encodeURIComponent(lName)}`;
  }, [effectiveCase?.caseNo, effectiveCase?.caseName, effectiveLead?.leadNo, effectiveLead?.leadName]);

  const FORM_KEY = `${storagePrefix}:form`;
  const LIST_KEY = `${storagePrefix}:list`;

    // context
  const contextLeadStatus =
  selectedLead?.leadStatus ||
  effectiveLead?.leadStatus ||
  selectedCase?.leadStatus ||
  effectiveCase?.leadStatus ||
  '';

  // ─── Lead status / read-only hook ───────────────────────────────────────────
  // const { status, isReadOnly } = useLeadStatus({
  //   caseId:   effectiveCase?._id || effectiveCase?.id,
  //   leadNo:   effectiveLead?.leadNo,
  //   leadName: effectiveLead?.leadName,
  //   initialStatus: selectedLead?.leadStatus,
  // });
  const { status, isReadOnly } = useLeadStatus({
  caseId: effectiveCase?._id || effectiveCase?.id,
  leadNo: effectiveLead?.leadNo,
  leadName: effectiveLead?.leadName,
  initialStatus: contextLeadStatus,
});

useEffect(() => {
  if (!contextLeadStatus) return;

  setLeadStatus((prev) =>
    prev ? pickHigherStatus(prev, contextLeadStatus) : contextLeadStatus
  );
}, [contextLeadStatus, setLeadStatus]);

  // ─── Local state ────────────────────────────────────────────────────────────
  const [officerName, setOfficerName] = useState('');
  const [leadData,    setLeadData]    = useState({});

  // Narrative form state — restored from sessionStorage on mount
  const [returnData, setReturnData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(FORM_KEY);
      return saved ? JSON.parse(saved) : buildDefaultForm();
    } catch {
      return buildDefaultForm();
    }
  });

  // List of narrative entries visible to the current user
  const [returns, setReturns] = useState(() => {
    try {
      const saved = sessionStorage.getItem(LIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [editMode,      setEditMode]      = useState(false);
  const [editId,        setEditId]        = useState(null);
  const [expandedRows,  setExpandedRows]  = useState(new Set());
  const [maxReturnId,   setMaxReturnId]   = useState(0);
  const [error,         setError]         = useState('');
  const [alertOpen,     setAlertOpen]     = useState(false);
  const [alertMessage,  setAlertMessage]  = useState('');
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isGenerating,  setIsGenerating]  = useState(false);

  /**
   * Refs that suppress the first sessionStorage write that fires
   * immediately after the mount-time restore effect. Without these,
   * loading empty state would overwrite a valid stored draft.
   */
  const justLoadedFormRef = useRef(false);
  const justLoadedListRef = useRef(false);

  // ─── Derived investigator-role values ───────────────────────────────────────
  const signedInOfficer  = localStorage.getItem('loggedInUser');
  const signedInUserId   = localStorage.getItem('userId');
  const primaryInvestigatorUserId = leadData?.primaryInvestigatorUserId || '';
  const primaryUsername  = leadData?.primaryInvestigator || leadData?.primaryOfficer || '';
  const isPrimaryInvestigator =
    selectedCase?.role === 'Investigator' &&
    !!signedInUserId &&
    (primaryInvestigatorUserId
      ? signedInUserId === String(primaryInvestigatorUserId)
      : signedInOfficer === primaryUsername);

  const nextReturnId    = numberToAlphabet(maxReturnId + 1);
  const displayReturnId = editMode ? returnData.leadReturnId : nextReturnId;

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Show a notification alert modal. */
  const showAlert = useCallback((msg) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  }, []);

  /** Format an ISO date string as MM/DD/YY for table display. */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const yy = date.getFullYear().toString().slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  /**
   * Navigate to the Submit / Review Lead Return page (ViewLR).
   * Primary investigators submit; all others review.
   */
  // ─── Effects ─────────────────────────────────────────────────────────────────

  // Sync context from router state (covers fresh-session and tab navigation)
  useEffect(() => {
    if (caseDetails && leadDetails) {
      setSelectedCase(caseDetails);
      setSelectedLead({
        ...leadDetails,
        leadName: leadDetails.leadName || leadDetails.description,
        leadNo:   leadDetails.leadNo   ?? leadDetails.id,
      });
    }
  }, [caseDetails, leadDetails]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed officer name from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('loggedInUser');
    if (stored) {
      const name = stored.trim();
      setOfficerName(name);
      setReturnData((prev) => ({ ...prev, enteredBy: name }));
    }
  }, []);

  // Keep the form's enteredBy field in sync if officerName resolves after first render
  useEffect(() => {
    if (officerName) {
      setReturnData((prev) => ({ ...prev, enteredBy: officerName.trim() }));
    }
  }, [officerName]);

  // Propagate the live hook status into context
  useEffect(() => {
    if (status) setLeadStatus((prev) => (prev ? pickHigherStatus(prev, status) : status));
  }, [status, setLeadStatus]);

  // Propagate lead status from fetched metadata into context
  useEffect(() => {
    if (!leadData?.leadStatus) return;
    setLeadStatus((prev) =>
      prev ? pickHigherStatus(prev, leadData.leadStatus) : leadData.leadStatus
    );
  }, [leadData?.leadStatus, setLeadStatus]);

  /**
   * Fetch lead metadata (assignees, primary investigator, current status).
   * Used to derive access-filtering and role-based UI visibility.
   */
  useEffect(() => {
    const caseId = effectiveCase?._id || effectiveCase?.id;
    if (!effectiveLead?.leadNo || !caseId) return;
    const ac = new AbortController();

    (async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get(
          `/api/lead/lead/${effectiveLead.leadNo}/${caseId}`,
          { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
        );
        if (ac.signal.aborted || !data?.length) return;
        setLeadData({ ...data[0], assignedTo: data[0].assignedTo || [], leadStatus: data[0].leadStatus || '' });
      } catch (e) {
        if (!ac.signal.aborted) console.error('Failed to fetch lead data:', e);
      }
    })();

    return () => ac.abort();
  }, [effectiveLead?.leadNo, effectiveCase?._id, effectiveCase?.id]);

  /**
   * Fetch the lead's current status from the dedicated status endpoint.
   * Merges with any status already held in context (always keeps the highest rank).
   */
  // useEffect(() => {
  //   const caseId = effectiveCase?._id || effectiveCase?.id;
  //   if (!effectiveLead?.leadNo || !effectiveLead?.leadName || !caseId) return;
  //   const ac = new AbortController();

  //   (async () => {
  //     try {
  //       const token = localStorage.getItem('token');
  //       const { data } = await api.get(
  //         `/api/lead/status/${effectiveLead.leadNo}/${encodeURIComponent(effectiveLead.leadName)}/${caseId}`,
  //         { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       if (ac.signal.aborted) return;

  //       const incoming =
  //         (data && typeof data === 'object' && 'leadStatus' in data && data.leadStatus) ||
  //         (Array.isArray(data) && data[0]?.leadStatus) ||
  //         null;

  //       if (incoming) {
  //         setLeadStatus((prev) => (prev ? pickHigherStatus(prev, incoming) : incoming));
  //       } else {
  //         console.warn('No leadStatus returned from status endpoint');
  //         setLeadStatus('Unknown');
  //       }
  //     } catch (err) {
  //       if (!ac.signal.aborted) {
  //         console.error('Failed to fetch lead status:', err);
  //         setError('Could not load lead status');
  //       }
  //     }
  //   })();

  //   return () => ac.abort();
  // }, [
  //   effectiveLead?.leadNo,
  //   effectiveLead?.leadName,
  //   effectiveCase?._id,
  //   effectiveCase?.id,
  //   setLeadStatus,
  // ]);

  useEffect(() => {
  const caseId = effectiveCase?._id || effectiveCase?.id;
  if (!effectiveLead?.leadNo || !caseId) return;
  const ac = new AbortController();

  (async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.get(
        `/api/lead/status/${effectiveLead.leadNo}/${caseId}`,
        { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
      );
      if (ac.signal.aborted) return;

      const incoming =
        (data && typeof data === 'object' && data.leadStatus) ||
        (Array.isArray(data) && data[0]?.leadStatus) ||
        null;

      if (incoming) {
        setLeadStatus((prev) => (prev ? pickHigherStatus(prev, incoming) : incoming));
      } else {
        console.warn('No leadStatus returned from status endpoint');
        setLeadStatus((prev) =>
          prev ||
          leadData?.leadStatus ||
          contextLeadStatus ||
          'Unknown'
        );
      }
    } catch (err) {
      if (!ac.signal.aborted) {
        console.error('Failed to fetch lead status:', err);
        setLeadStatus((prev) =>
          prev ||
          leadData?.leadStatus ||
          contextLeadStatus ||
          'Unknown'
        );
      }
    }
  })();

  return () => ac.abort();
}, [
  effectiveLead?.leadNo,
  effectiveCase?._id,
  effectiveCase?.id,
  leadData?.leadStatus,
  contextLeadStatus,
  setLeadStatus,
]);
  // Restore form and list from sessionStorage on mount (once)
  useEffect(() => {
    try {
      const savedForm = sessionStorage.getItem(FORM_KEY);
      setReturnData(savedForm ? JSON.parse(savedForm) : buildDefaultForm(officerName));
      try { sessionStorage.removeItem(FORM_KEY); } catch { /* noop */ }
    } catch {
      setReturnData(buildDefaultForm(officerName));
    } finally {
      justLoadedFormRef.current = true;
    }

    try {
      const savedList = sessionStorage.getItem(LIST_KEY);
      setReturns(savedList ? JSON.parse(savedList) : []);
    } catch {
      setReturns([]);
    } finally {
      justLoadedListRef.current = true;
    }
  }, [FORM_KEY, LIST_KEY]);

  // Persist form draft on every change (skip the initial load write)
  useEffect(() => {
    if (justLoadedFormRef.current) { justLoadedFormRef.current = false; return; }
    try { sessionStorage.setItem(FORM_KEY, JSON.stringify(returnData)); } catch (e) {
      console.error('Failed to persist form draft:', e);
    }
  }, [FORM_KEY, returnData]);

  // Persist returns list on every change (skip the initial load write)
  useEffect(() => {
    if (justLoadedListRef.current) { justLoadedListRef.current = false; return; }
    try { sessionStorage.setItem(LIST_KEY, JSON.stringify(returns)); } catch (e) {
      console.error('Failed to persist returns list:', e);
    }
  }, [LIST_KEY, returns]);

  /**
   * Fetch all narrative return entries for this lead from the API.
   * Applies access-level filtering for non-manager users and computes
   * the highest existing alphabetic return ID for next-ID generation.
   */
  useEffect(() => {
    const caseId = effectiveCase?._id || effectiveCase?.id;
    if (!effectiveLead?.leadNo || !caseId) return;
    const ac = new AbortController();

    (async () => {
      try {
        setError('');
        const token = localStorage.getItem('token');
        const { data } = await api.get(
          `/api/leadReturnResult/${effectiveLead.leadNo}/${caseId}`,
          { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
        );
        if (ac.signal.aborted) return;

        const raw = Array.isArray(data) ? data : [];
        const withDefaults = raw.map((r) => ({ ...r, accessLevel: r.accessLevel || 'Everyone' }));

        // Track the highest existing return ID to generate the next one
        const maxNumericId = withDefaults.reduce((max, item) => {
          const numVal = item.leadReturnId ? alphabetToNumber(item.leadReturnId) : 0;
          return Math.max(max, numVal);
        }, 0);
        setMaxReturnId(maxNumericId);

        // Non-managers only see entries they are assigned to or that are open to all
        let visible = withDefaults;
        if (!isCaseManager) {
          const currentUserId = localStorage.getItem('userId');
          const currentUser   = localStorage.getItem('loggedInUser')?.trim();
          const leadAssigneeUserIds = (leadData?.assignedTo || [])
            .map(a => (typeof a === 'object' && a !== null ? String(a.userId || '') : ''))
            .filter(Boolean);
          const leadAssigneeUsernames = (leadData?.assignedTo || [])
            .map(a => (typeof a === 'object' && a !== null ? (a.username || '') : String(a ?? '')).trim());

          visible = withDefaults.filter((r) => {
            if (r.accessLevel === 'Everyone') return true;
            if (r.accessLevel === 'Case Manager and Assignees') {
              const returnAssignees = (r.assignedTo?.assignees || []).map((a) => a?.trim());
              const inLeadAssignees = currentUserId
                ? leadAssigneeUserIds.includes(currentUserId)
                : leadAssigneeUsernames.some(a => a === currentUser);
              return inLeadAssignees || returnAssignees.some(a => a === currentUser);
            }
            return false; // 'Case Manager' only — hidden from investigators
          });
        }

        setReturns(visible);
        setLeadReturns(visible);
      } catch (err) {
        if (!ac.signal.aborted) {
          console.error('Error fetching narrative returns:', err?.response?.status, err?.message);
          // Treat any server/auth error as empty data; only surface genuine network failures
          if (err?.response) {
            setReturns([]);
            setLeadReturns([]);
          } else {
            setError('Failed to fetch narrative data.');
          }
        }
      }
    })();

    return () => ac.abort();
  }, [
    effectiveLead?.leadNo,
    effectiveCase?._id,
    effectiveCase?.id,
    isCaseManager,
    leadData?.assignedTo,
    setLeadReturns,
  ]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleInputChange = (field, value) => {
    setReturnData((prev) => ({ ...prev, [field]: value }));
  };

  /** Resets the form back to empty and exits edit mode. */
  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setReturnData(buildDefaultForm(localStorage.getItem('loggedInUser') || ''));
  };

  /** Populate the form for editing an existing narrative entry. */
  const handleEditReturn = (ret) => {
    setReturnData({
      results:      ret.leadReturnResult,
      leadReturnId: ret.leadReturnId,
      enteredDate:  formatDate(ret.enteredDate),
      enteredBy:    ret.enteredBy,
    });
    setEditMode(true);
    setEditId(ret.leadReturnId);
  };

  /** Toggle expand/collapse on a narrative row in the history table. */
  const toggleRowExpand = (returnId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(returnId) ? next.delete(returnId) : next.add(returnId);
      return next;
    });
  };

  /** Open the confirmation modal before deleting a narrative entry. */
  const requestDeleteReturn = (leadReturnId) => {
    setPendingDeleteId(leadReturnId);
    setConfirmOpen(true);
  };

  /** Confirmed deletion: remove the entry from the API and local state. */
  const performDeleteReturn = async () => {
    if (!pendingDeleteId) return;
    const token = localStorage.getItem('token');
    try {
      await api.delete(
        `/api/leadReturnResult/delete/${effectiveLead.leadNo}/${effectiveCase._id || effectiveCase.id}/${pendingDeleteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = returns.filter((r) => r.leadReturnId !== pendingDeleteId);
      setReturns(updated);
      setLeadReturns(updated);
    } catch (err) {
      console.error('Error deleting narrative:', err);
      showAlert('Failed to delete narrative.');
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  /** Persist an updated access level for a single return entry (case managers only). */
  const handleAccessChange = async (idx, newAccess) => {
    const ret   = returns[idx];
    const token = localStorage.getItem('token');
    try {
      const { data: updated } = await api.patch(
        `/api/leadReturnResult/update/${ret.leadNo}/${effectiveCase._id || effectiveCase.id}/${ret.leadReturnId}`,
        { accessLevel: newAccess },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedList = returns.map((r, i) => (i === idx ? updated : r));
      setReturns(updatedList);
      setLeadReturns(updatedList);
    } catch (err) {
      console.error('Failed to update access level:', err);
      showAlert('Could not change access. Try again.');
    }
  };

  /**
   * Save a new narrative entry or apply edits to an existing one.
   * On create: posts to the API, updates local state, and resets the form.
   * On edit: patches the entry and exits edit mode.
   */
  const handleAddOrUpdateReturn = async () => {
    if (!returnData.results.trim()) {
      showAlert('Please enter narrative details!');
      return;
    }

    const officer = localStorage.getItem('loggedInUser')?.trim();
    if (!officer) {
      showAlert('Officer name not found. Please log in again.');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      if (editMode && editId) {
        // ── Update existing entry ────────────────────────────────────────────
        const { data: updated } = await api.patch(
          `/api/leadReturnResult/update/${selectedLead.leadNo}/${effectiveCase._id || effectiveCase.id}/${editId}`,
          { leadReturnResult: returnData.results },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReturns((rs) => rs.map((r) => (r.leadReturnId === editId ? updated : r)));
        setEditMode(false);
        setEditId(null);
        setReturnData(buildDefaultForm(officer));
        try { sessionStorage.removeItem(FORM_KEY); } catch { /* noop */ }
      } else {
        // ── Create new entry ─────────────────────────────────────────────────
        const payload = {
          leadNo:           selectedLead.leadNo,
          description:      selectedLead.leadName,
          caseNo,
          caseName:         selectedCase.caseName,
          enteredDate:      new Date(),
          enteredBy:        officer,
          enteredByUserId:  localStorage.getItem('userId'),
          assignedTo:       { assignees: [officer], lRStatus: 'Pending' },
          assignedBy:       { assignee: officer,    lRStatus: 'Pending' },
          leadReturnResult: returnData.results,
          accessLevel:      returnData.accessLevel,
        };

        const { data: newDoc } = await api.post('/api/leadReturnResult/create', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setReturns((rs) => [...rs, newDoc]);
        setLeadReturns((rs) => [...rs, newDoc]);
        setMaxReturnId((n) => Math.max(n, alphabetToNumber(newDoc.leadReturnId)));
        setReturnData(buildDefaultForm(officer));
        try { sessionStorage.removeItem(FORM_KEY); } catch { /* noop */ }
      }
    } catch (err) {
      console.error('Error saving narrative:', err);
      showAlert('Failed to save narrative. Please try again.');
    }
  };

  /**
   * Generate a full lead report as a PDF blob and navigate to the document viewer.
   * All lead data sections are fetched in parallel; media sections also have their
   * attached files fetched before the report payload is assembled.
   */
  const handleViewLeadReturn = async () => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

    const kaseId = kase?._id || kase?.id;
    if (!lead?.leadNo || !(lead.leadName || lead.description) || !kaseId) {
      showAlert('Please select a case and lead first.');
      return;
    }
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      const token    = localStorage.getItem('token');
      const headers  = { headers: { Authorization: `Bearer ${token}` } };
      const { leadNo } = lead;
      const leadName   = lead.leadName || lead.description;
      const encLead    = safeEncode(leadName);

      // Fetch all lead sections in parallel
      const [
        instrRes, returnsRes, personsRes, vehiclesRes, enclosuresRes,
        evidenceRes, picturesRes, audioRes, videosRes, scratchpadRes, timelineRes,
      ] = await Promise.all([
        api.get(`/api/lead/lead/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrenclosure/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrevidence/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrpicture/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lraudio/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvideo/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/scratchpad/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/timeline/${leadNo}/${encLead}/${kaseId}`, headers).catch(() => ({ data: [] })),
      ]);

      // Attach binary files to media/document sections in parallel
      const [enclosuresWithFiles, evidenceWithFiles, picturesWithFiles, audioWithFiles, videosWithFiles] =
        await Promise.all([
          attachFiles(enclosuresRes.data, '_id',       '/api/lrenclosures/files'),
          attachFiles(evidenceRes.data,   '_id',       '/api/lrevidences/files'),
          attachFiles(picturesRes.data,   'pictureId', '/api/lrpictures/files'),
          attachFiles(audioRes.data,      'audioId',   '/api/lraudio/files'),
          attachFiles(videosRes.data,     'videoId',   '/api/lrvideo/files'),
        ]);

      const leadInstructions = instrRes.data?.[0] || {};
      const leadReturns      = returnsRes.data     || [];

      // All sections enabled → full report
      const selectedReports = {
        FullReport: true, leadInstruction: true, leadReturn: true,
        leadPersons: true, leadVehicles: true, leadEnclosures: true,
        leadEvidence: true, leadPictures: true, leadAudio: true,
        leadVideos: true, leadScratchpad: true, leadTimeline: true,
      };

      const body = {
        user:             localStorage.getItem('loggedInUser') || '',
        reportTimestamp:  new Date().toISOString(),
        leadInstruction:  leadInstructions,
        leadReturn:       leadReturns,
        leadPersons:      personsRes.data   || [],
        leadVehicles:     vehiclesRes.data  || [],
        leadEnclosures:   enclosuresWithFiles,
        leadEvidence:     evidenceWithFiles,
        leadPictures:     picturesWithFiles,
        leadAudio:        audioWithFiles,
        leadVideos:       videosWithFiles,
        leadScratchpad:   scratchpadRes.data || [],
        leadTimeline:     timelineRes.data   || [],
        selectedReports,
        leadInstructions,
        leadReturns,
      };

      const { data: blobData } = await api.post('/api/report/generate', body, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate('/DocumentReview', {
        state: {
          pdfBlob:  new Blob([blobData], { type: 'application/pdf' }),
          filename: `Lead_${leadNo || 'report'}.pdf`,
        },
      });
    } catch (err) {
      const msg = err?.response?.data instanceof Blob
        ? await err.response.data.text()
        : err.message || 'Unknown error';
      console.error('Report generation error:', err);
      showAlert(`Error generating PDF:\n${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Guard ────────────────────────────────────────────────────────────────────
  if (!selectedCase && !caseDetails) {
    return <div>Loading case/lead…</div>;
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      key={`${effectiveCase?.caseNo}-${effectiveLead?.leadNo}`}
      className={styles.personPage}
    >
      <Navbar />

      {/* Notification alert */}
      <AlertModal
        isOpen={alertOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={() => setAlertOpen(false)}
      />

      {/* Deletion confirmation modal */}
      <AlertModal
        isOpen={confirmOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record?"
        onConfirm={performDeleteReturn}
        onClose={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
      />

      <div className={styles.LRIContent}>
        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          {/* ── Page-level navigation bar ──────────────────────────────────── */}
          <LRTopMenu
            activePage="addLeadReturn"
            selectedCase={selectedCase}
            selectedLead={selectedLead}
            isPrimaryInvestigator={isPrimaryInvestigator}
            isGenerating={isGenerating}
            onManageLeadReturn={handleViewLeadReturn}
            styles={styles}
          />

          {/* ── Section tabs navigation ─────────────────────────────────────── */}
          <div className={styles.topMenuSections}>
            <div className={`${styles.menuItems} ${styles.sectionMenuItems}`}>
              {SECTION_TABS.map(({ label, route, active }) => (
                <span
                  key={route}
                  className={`${styles.menuItem} ${active ? styles.menuItemActive : styles.menuItemInactive}`}
                  onClick={() => navigate(route, { state: { caseDetails: effectiveCase, leadDetails: effectiveLead } })}
                >
                  {label}
                </span>
              ))}
              <span
                className={styles.menuItem}
                onClick={() => navigate('/viewLR', { state: { caseDetails: effectiveCase, leadDetails: effectiveLead } })}
              >
                Finish
              </span>
            </div>
          </div>

          {/* ── Breadcrumb + lead status ────────────────────────────────────── */}
          <div className={styles.caseandleadinfo}>
            <h5 className={styles.sideTitle}>
              <div className={styles.ldHead}>
                <Link to="/HomePage" className={styles.crumb}>PIMS Home</Link>
                <span className={styles.sep}>{' >> '}</span>
                <Link
                  to={selectedCase?.role === 'Investigator' ? '/Investigator' : '/CasePageManager'}
                  state={{ caseDetails: selectedCase }}
                  className={styles.crumb}
                >
                  Case: {selectedCase.caseNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <Link to="/LeadReview" state={{ leadDetails: selectedLead }} className={styles.crumb}>
                  Lead: {selectedLead.leadNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <span className={styles.crumbCurrent} aria-current="page">Lead Narrative</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status: ${leadStatus}` : leadStatus}
            </h5>
          </div>

          {/* ── Page heading ───────────────────────────────────────────────── */}
          <div className={styles.caseHeader}>
            <h2>LEAD NARRATIVE</h2>
          </div>

          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* ── Narrative Entry form ──────────────────────────────────── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Narrative Entry</div>
                <div className={styles.LREnteringContentBox}>

                  {/* Read-only metadata row */}
                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>Narrative ID*</label>
                      <input readOnly value={displayReturnId} />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Date Entered*</label>
                      <input type="text" value={returnData.enteredDate} readOnly />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Entered By*</label>
                      <input type="text" value={returnData.enteredBy || officerName} readOnly />
                    </div>
                  </div>

                  <h4 className={styles.returnFormH4}>Narrative Description</h4>
                  <div className={styles.returnForm}>
                    <textarea
                      value={returnData.results}
                      onChange={(e) => handleInputChange('results', e.target.value)}
                      placeholder="Enter narrative"
                    />
                  </div>

                  <div className={styles.formButtonsReturn}>
                    <button
                      className={styles.saveBtn1}
                      disabled={
                        selectedLead?.leadStatus === 'Completed' ||
                        selectedLead?.leadStatus === 'Closed' ||
                        isReadOnly
                      }
                      onClick={handleAddOrUpdateReturn}
                    >
                      {editMode ? 'Update' : 'Add Narrative'}
                    </button>
                    {editMode && (
                      <button className={styles.cancelBtn} onClick={resetForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline error message */}
              {error && <div className={styles.errorMessage}>{error}</div>}

              {/* ── Narrative History table ───────────────────────────────── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Narrative History</div>
                <table className={styles.leadsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '8%' }}>Id</th>
                      <th style={{ width: '9%' }}>Date</th>
                      <th style={{ width: '12%' }}>Entered By</th>
                      <th className={styles.resultsCol}>Narrative</th>
                      <th style={{ width: '10%' }}>Actions</th>
                      {isCaseManager && <th style={{ width: '15%' }}>Access</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {returns.length > 0 ? (
                      returns.map((ret, idx) => {
                        const canModify    = isCaseManager || ret.enteredBy.trim() === officerName.trim();
                        const isExpanded   = expandedRows.has(ret.leadReturnId);
                        const shouldTruncate = (ret.leadReturnResult || '').length > 150;
                        const disableActions =
                          selectedLead?.leadStatus === 'Completed' ||
                          isReadOnly ||
                          !canModify;

                        return (
                          <tr key={ret.leadReturnId || idx}>
                            <td>{ret.leadReturnId}</td>
                            <td>{formatDate(ret.enteredDate)}</td>
                            <td>{ret.enteredBy}</td>
                            <td className={styles.narrativeCell}>
                              <div
                                className={
                                  isExpanded
                                    ? styles.narrativeContentExpanded
                                    : styles.narrativeContentCollapsed
                                }
                              >
                                {ret.leadReturnResult}
                              </div>
                              {shouldTruncate && (
                                <button
                                  className={styles.viewToggleBtn}
                                  onClick={() => toggleRowExpand(ret.leadReturnId)}
                                >
                                  {isExpanded ? 'View Less ▲' : 'View ▶'}
                                </button>
                              )}
                            </td>
                            <td>
                              <div className={styles.lrTableBtn}>
                                <button onClick={() => handleEditReturn(ret)} disabled={disableActions}>
                                  <img
                                    src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                    alt="Edit"
                                    className={styles.editIcon}
                                  />
                                </button>
                                <button onClick={() => requestDeleteReturn(ret.leadReturnId)} disabled={disableActions}>
                                  <img
                                    src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                                    alt="Delete"
                                    className={styles.editIcon}
                                  />
                                </button>
                              </div>
                            </td>
                            {isCaseManager && (
                              <td>
                                <select
                                  className={styles.accessDropdown}
                                  value={ret.accessLevel}
                                  onChange={(e) => handleAccessChange(idx, e.target.value)}
                                >
                                  <option value="Everyone">All</option>
                                  <option value="Case Manager Only">Case Manager</option>
                                  <option value="Case Manager and Assignees">Assignees</option>
                                </select>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign: 'center' }}>
                          No Narrative Available
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
    </div>
  );
};
