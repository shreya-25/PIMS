/**
 * LREnclosures.jsx
 *
 * Manages enclosure records (documents, links, business records, etc.)
 * associated with a lead return. Supports create, edit, delete, and
 * access-level control. Persists draft form state to sessionStorage,
 * keyed per case+lead so switching contexts restores the correct draft.
 * Role-aware: Case Managers see all records; Investigators see only permitted ones.
 */

import { useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styles from './LREnclosures.module.css';
import { LRTopMenu } from '../LRTopMenu';
import Navbar from '../../../components/Navbar/Navbar';
import { CaseContext } from '../../CaseContext';
import api from '../../../api';
import { SideBar } from '../../../components/Sidebar/Sidebar';
import { AlertModal } from '../../../components/AlertModal/AlertModal';
import { useLeadStatus } from '../../../hooks/useLeadStatus';

// ─── Module-level constants ──────────────────────────────────────────────────

const READONLY_STATUSES = ['Completed', 'Closed'];

const DEFAULT_FORM = {
  returnId:     '',
  type:         '',
  enclosure:    '',
  isLink:       false,
  link:         '',
  originalName: '',
  filename:     '',
  accessLevel:  'Everyone',
};

/** Section tab definitions used to render the section navigation bar. */
const SECTION_TABS = [
  { label: 'Instructions', route: '/LRInstruction' },
  { label: 'Narrative',    route: '/LRReturn' },
  { label: 'Person',       route: '/LRPerson' },
  { label: 'Vehicles',     route: '/LRVehicle' },
  { label: 'Enclosures',   route: '/LREnclosures', active: true },
  { label: 'Evidence',     route: '/LREvidence' },
  { label: 'Pictures',     route: '/LRPictures' },
  { label: 'Audio',        route: '/LRAudio' },
  { label: 'Videos',       route: '/LRVideo' },
  { label: 'Notes',        route: '/LRScratchpad' },
  { label: 'Timeline',     route: '/LRTimeline' },
];

// ─── Module-level utilities ──────────────────────────────────────────────────

/** Formats an ISO date string to MM/DD/YY. Returns "" for invalid input. */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const dd   = String(date.getDate()).padStart(2, '0');
  const yy   = date.getFullYear().toString().slice(-2);
  return `${mm}/${dd}/${yy}`;
};

/**
 * Converts an alphabetic string (e.g. narrative ID) to a number for sorting.
 * "A" → 1, "B" → 2, "AA" → 27, etc.
 */
const alphabetToNumber = (str) => {
  if (!str) return 0;
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    n = n * 26 + (str.charCodeAt(i) - 64); // 'A' = 65
  }
  return n;
};

/**
 * Validates an enclosure form and returns labels of missing required fields.
 * File is required on create unless uploading a link; on edit, replacing is optional.
 */
const getMissingFields = ({ enclosureData, file, editIndex }) => {
  const missing = [];
  if (!enclosureData.returnId?.trim()) missing.push('Narrative Id');
  if (!enclosureData.enclosure?.trim()) missing.push('Enclosure Description');
  if (enclosureData.isLink) {
    if (!enclosureData.link?.trim()) missing.push('Link');
  } else if (editIndex === null && !file) {
    missing.push('File');
  }
  return missing;
};

/**
 * Filters display records by the current user's access level.
 * Case Managers see all records; investigators see only "Everyone" or lead-assigned ones.
 */
const filterByAccessLevel = (records, isCaseManager, leadData) => {
  if (isCaseManager) return records;
  const currentUser    = localStorage.getItem('loggedInUser')?.trim();
  const leadAssignees  = (leadData?.assignedTo || []).map((a) => a?.trim());
  return records.filter((enc) => {
    if (enc.accessLevel === 'Everyone') return true;
    if (enc.accessLevel === 'Case Manager and Assignees') {
      return leadAssignees.some((a) => a === currentUser);
    }
    return false;
  });
};

/**
 * Fetches files for a list of items by their ID field and attaches them.
 * Used when building full-report PDF payloads.
 */
const attachFiles = async (items, idFieldName, filesEndpoint) => {
  return Promise.all(
    (items || []).map(async (item) => {
      const realId = item[idFieldName];
      if (!realId) return { ...item, files: [] };
      try {
        const { data } = await api.get(`${filesEndpoint}/${realId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        return { ...item, files: data };
      } catch {
        return { ...item, files: [] };
      }
    })
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const LREnclosures = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const fileInputRef = useRef();

  // ── Context & route state ─────────────────────────────────────────────────
  const { selectedCase, selectedLead, leadStatus } = useContext(CaseContext);

  const isCaseManager =
    selectedCase?.role === 'Case Manager' ||
    selectedCase?.role === 'Detective Supervisor';

  // ── Session storage keys (per case+lead to avoid stale drafts on context switch) ──
  const { formKey, listKey } = useMemo(() => {
    const cn   = selectedCase?.caseNo   ?? 'NA';
    const cNam = encodeURIComponent(selectedCase?.caseName ?? 'NA');
    const ln   = selectedLead?.leadNo   ?? 'NA';
    const lNam = encodeURIComponent(selectedLead?.leadName ?? 'NA');
    return {
      formKey: `LREnclosures:form:${cn}:${cNam}:${ln}:${lNam}`,
      listKey: `LREnclosures:list:${cn}:${cNam}:${ln}:${lNam}`,
    };
  }, [selectedCase?.caseNo, selectedCase?.caseName, selectedLead?.leadNo, selectedLead?.leadName]);

  // ── State ─────────────────────────────────────────────────────────────────

  // Form state — hydrated from sessionStorage keyed by case+lead
  const [enclosureData, setEnclosureData] = useState(DEFAULT_FORM);
  const [enclosures, setEnclosures]       = useState([]);

  // File attachment
  const [file,      setFile]      = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  // Lead-level metadata for access filtering
  const [leadData,      setLeadData]     = useState({});
  const [narrativeIds,  setNarrativeIds] = useState([]);
  const [uploading,     setUploading]    = useState(false);
  const [isGenerating,  setIsGenerating] = useState(false);

  // Confirm-deletion modal
  const [confirmOpen,        setConfirmOpen]        = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex]  = useState(null);

  // Expand/collapse for description cells
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Alert/notification modal
  const [alertOpen,    setAlertOpen]    = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ── Lead status hook ──────────────────────────────────────────────────────
  const { status, isReadOnly } = useLeadStatus({
    caseNo:   selectedCase?.caseNo,
    caseName: selectedCase?.caseName,
    leadNo:   selectedLead?.leadNo,
    leadName: selectedLead?.leadName,
  });

  // Derived permissions
  const signedInOfficer  = localStorage.getItem('loggedInUser');
  const primaryUsername  = leadData?.primaryInvestigator || leadData?.primaryOfficer || '';
  const isPrimaryInvestigator =
    selectedCase?.role === 'Investigator' &&
    !!signedInOfficer &&
    signedInOfficer === primaryUsername;

  const isLeadReadOnly = READONLY_STATUSES.includes(selectedLead?.leadStatus) || isReadOnly;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showAlert = useCallback((msg) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  }, []);

  const closeAlert = useCallback(() => setAlertOpen(false), []);

  const toggleRowExpand = useCallback((idx) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setEditIndex(null);
    setEnclosureData(DEFAULT_FORM);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── sessionStorage sync ───────────────────────────────────────────────────

  // On case/lead context switch, restore the correct draft and list
  useEffect(() => {
    const savedForm = sessionStorage.getItem(formKey);
    setEnclosureData(savedForm ? { ...DEFAULT_FORM, ...JSON.parse(savedForm) } : DEFAULT_FORM);

    const savedList = sessionStorage.getItem(listKey);
    setEnclosures(savedList ? JSON.parse(savedList) : []);

    // Reset edit state when switching contexts
    setEditIndex(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [formKey, listKey]);

  // Clear legacy non-keyed storage on first mount
  useEffect(() => {
    sessionStorage.removeItem('LREnclosures:form');
    sessionStorage.removeItem('LREnclosures:list');
  }, []);

  useEffect(() => {
    sessionStorage.setItem(formKey, JSON.stringify(enclosureData));
  }, [formKey, enclosureData]);

  useEffect(() => {
    sessionStorage.setItem(listKey, JSON.stringify(enclosures));
  }, [listKey, enclosures]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  /**
   * Fetches lead metadata (assignees, status) for access-level filtering.
   * Re-runs whenever the selected lead or case changes.
   */
  useEffect(() => {
    if (!selectedLead?.leadNo || !selectedCase?.caseNo) return;
    const token = localStorage.getItem('token');

    api
      .get(
        `/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}` +
        `/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
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
      .catch((err) => console.error('Failed to fetch lead data:', err));
  }, [selectedLead, selectedCase]);

  /**
   * Fetches available narrative IDs and auto-selects the latest one
   * when creating a new enclosure record.
   */
  useEffect(() => {
    if (
      !selectedLead?.leadNo || !selectedLead?.leadName ||
      !selectedCase?.caseNo  || !selectedCase?.caseName
    ) return;

    const ac    = new AbortController();
    const token = localStorage.getItem('token');

    (async () => {
      try {
        const { data } = await api.get(
          `/api/leadReturnResult/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}` +
          `/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
        );

        const ids = [...new Set((data || []).map((r) => r?.leadReturnId).filter(Boolean))];
        ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
        setNarrativeIds(ids);

        // Auto-select the latest narrative ID only for new (non-edit) records
        setEnclosureData((prev) =>
          editIndex === null && !prev.returnId
            ? { ...prev, returnId: ids.at(-1) || '' }
            : prev
        );
      } catch (e) {
        if (!ac.signal.aborted) console.error('Failed to fetch narrative IDs:', e);
      }
    })();

    return () => ac.abort();
  }, [
    selectedLead?.leadNo, selectedLead?.leadName,
    selectedCase?.caseNo, selectedCase?.caseName,
    editIndex,
  ]);

  /** Fetches enclosure records whenever the selected lead or case changes. */
  useEffect(() => {
    if (selectedLead?.leadNo && selectedCase?.caseNo) {
      fetchEnclosures();
    }
  }, [selectedLead, selectedCase]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEnclosures = async () => {
    const token    = localStorage.getItem('token');
    const leadNo   = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
    const caseNo   = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);

    try {
      const { data } = await api.get(
        `/api/lrenclosure/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mapped = data.map((enc) => ({
        dateEntered:  formatDate(enc.enteredDate),
        type:         enc.type,
        enclosure:    enc.enclosureDescription,
        returnId:     enc.leadReturnId,
        originalName: enc.originalName,
        filename:     enc.filename,
        link:         enc.link || '',
        signedUrl:    enc.signedUrl || '',
        accessLevel:  enc.accessLevel ?? 'Everyone',
        enteredBy:    enc.enteredBy,
      }));

      setEnclosures(filterByAccessLevel(mapped, isCaseManager, leadData));
    } catch (err) {
      console.error('Error fetching enclosures:', err);
    }
  };

  // ── Form handlers ─────────────────────────────────────────────────────────

  const handleInputChange = useCallback((field, value) => {
    setEnclosureData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  /** Creates or updates an enclosure record via the API. */
  const handleSave = async () => {
    const missing = getMissingFields({ enclosureData, file, editIndex });
    if (missing.length) {
      showAlert(`Please fill the required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`);
      return;
    }

    setUploading(true);

    // Build multipart form data
    const fd = new FormData();
    if (!enclosureData.isLink && file) {
      fd.append('file', file);
    }
    fd.append('isLink',              String(!!enclosureData.isLink));
    if (enclosureData.isLink && enclosureData.link?.trim()) {
      fd.append('link',              enclosureData.link.trim());
    }
    fd.append('leadNo',              selectedLead.leadNo);
    fd.append('description',         selectedLead.leadName);
    fd.append('enteredBy',           localStorage.getItem('loggedInUser'));
    fd.append('caseName',            selectedCase.caseName);
    fd.append('caseNo',              selectedCase.caseNo);
    fd.append('leadReturnId',        enclosureData.returnId);
    fd.append('enteredDate',         new Date().toISOString());
    fd.append('type',                enclosureData.type);
    fd.append('enclosureDescription', enclosureData.enclosure);
    fd.append('accessLevel',         enclosureData.accessLevel || 'Everyone');

    const token = localStorage.getItem('token');
    // Strip Content-Type so the browser sets the correct multipart boundary
    const multipartConfig = {
      headers: { Authorization: `Bearer ${token}` },
      transformRequest: [(data, headers) => { delete headers['Content-Type']; return data; }],
    };

    try {
      if (editIndex === null) {
        // CREATE — post new enclosure
        await api.post('/api/lrenclosure/upload', fd, multipartConfig);

        // Optimistically add the new record to the table
        setEnclosures((prev) => [
          ...prev,
          {
            dateEntered:  formatDate(new Date().toISOString()),
            type:         enclosureData.type,
            enclosure:    enclosureData.enclosure,
            returnId:     enclosureData.returnId,
            originalName: file?.name || '',
            link:         enclosureData.isLink ? (enclosureData.link || '') : '',
            filename:     '',
            signedUrl:    '',
            accessLevel:  enclosureData.accessLevel || 'Everyone',
            enteredBy:    localStorage.getItem('loggedInUser'),
          },
        ]);
      } else {
        // UPDATE — put to existing enclosure URL
        const url =
          `/api/lrenclosure/${selectedLead.leadNo}/` +
          `${encodeURIComponent(selectedLead.leadName)}/` +
          `${selectedCase.caseNo}/` +
          `${encodeURIComponent(selectedCase.caseName)}/` +
          `${enclosureData.returnId}/`;

        await api.put(url, fd, multipartConfig);

        // Optimistically update the edited row
        setEnclosures((prev) =>
          prev.map((enc, i) =>
            i === editIndex
              ? {
                  ...enc,
                  type:         enclosureData.type,
                  enclosure:    enclosureData.enclosure,
                  returnId:     enclosureData.returnId,
                  originalName: file ? file.name : enc.originalName,
                  link:         enclosureData.isLink ? (enclosureData.link || '') : enc.link,
                  accessLevel:  enclosureData.accessLevel || enc.accessLevel,
                }
              : enc
          )
        );
      }

      // Background refresh to reconcile signed URLs with server state
      fetchEnclosures().catch(() => {});
      resetForm();
    } catch (err) {
      console.error('Save error:', err.response || err);
      showAlert('Save failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  /** Populates the form with an existing enclosure record for editing. */
  const handleEdit = useCallback(
    (idx) => {
      const enc = enclosures[idx];
      setEditIndex(idx);
      setEnclosureData({
        returnId:     enc.returnId,
        type:         enc.type,
        enclosure:    enc.enclosure,
        isLink:       !!enc.link,
        link:         enc.link || '',
        originalName: enc.originalName,
        filename:     enc.filename,
        accessLevel:  enc.accessLevel || 'Everyone',
      });
      // Clear file input so user can optionally choose a replacement
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [enclosures]
  );

  /** Opens the confirmation modal for a pending deletion. */
  const requestDeleteEnclosure = useCallback((idx) => {
    setPendingDeleteIndex(idx);
    setConfirmOpen(true);
  }, []);

  /** Executes the confirmed enclosure deletion against the API. */
  const performDeleteEnclosure = async () => {
    const idx = pendingDeleteIndex;
    if (idx == null) return;

    const enc   = enclosures[idx];
    const token = localStorage.getItem('token');

    try {
      const url =
        `/api/lrenclosure/${selectedLead.leadNo}/` +
        `${encodeURIComponent(selectedLead.leadName)}/` +
        `${selectedCase.caseNo}/` +
        `${encodeURIComponent(selectedCase.caseName)}/` +
        `${enc.returnId}/`;

      await api.delete(url, { headers: { Authorization: `Bearer ${token}` } });

      setEnclosures((list) => list.filter((_, i) => i !== idx));
    } catch (err) {
      console.error(err);
      showAlert('Failed to delete enclosure.');
    } finally {
      setConfirmOpen(false);
      setPendingDeleteIndex(null);
    }
  };

  /** Updates the access level of a single enclosure record via the API. */
  const handleAccessChange = async (idx, newAccess) => {
    const enc   = enclosures[idx];
    const token = localStorage.getItem('token');

    try {
      const url =
        `/api/lrenclosure/${selectedLead.leadNo}/` +
        `${encodeURIComponent(selectedLead.leadName)}/` +
        `${selectedCase.caseNo}/` +
        `${encodeURIComponent(selectedCase.caseName)}/` +
        `${enc.returnId}/`;

      await api.put(url, { accessLevel: newAccess }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Optimistically update local state
      setEnclosures((prev) => {
        const copy  = [...prev];
        copy[idx]   = { ...copy[idx], accessLevel: newAccess };
        return copy;
      });
    } catch {
      showAlert('Could not change access level. Please try again.');
    }
  };

  // ── Report generation ─────────────────────────────────────────────────────

  /**
   * Fetches all lead return data sections, generates a full PDF report blob,
   * and navigates to the DocumentReview page.
   */
  const handleViewLeadReturn = async () => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

    if (!lead?.leadNo || !(lead.leadName || lead.description) || !kase?.caseNo || !kase?.caseName) {
      showAlert('Please select a case and lead first.');
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    const token    = localStorage.getItem('token');
    const headers  = { headers: { Authorization: `Bearer ${token}` } };
    const { leadNo } = lead;
    const leadName   = lead.leadName || lead.description;
    const { caseNo, caseName } = kase;
    const encLead  = encodeURIComponent(leadName);
    const encCase  = encodeURIComponent(caseName);

    try {
      // Fetch all lead return sections in parallel
      const [
        instrRes, returnsRes, personsRes, vehiclesRes, enclosuresRes,
        evidenceRes, picturesRes, audioRes, videosRes, scratchpadRes, timelineRes,
      ] = await Promise.all([
        api.get(`/api/lead/lead/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrenclosure/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrevidence/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrpicture/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lraudio/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvideo/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/scratchpad/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/timeline/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      ]);

      // Attach associated files to each media section
      const [enclosuresWithFiles, evidenceWithFiles, picturesWithFiles, audioWithFiles, videosWithFiles] =
        await Promise.all([
          attachFiles(enclosuresRes.data, '_id',       '/api/lrenclosures/files'),
          attachFiles(evidenceRes.data,   '_id',       '/api/lrevidences/files'),
          attachFiles(picturesRes.data,   'pictureId', '/api/lrpictures/files'),
          attachFiles(audioRes.data,      'audioId',   '/api/lraudio/files'),
          attachFiles(videosRes.data,     'videoId',   '/api/lrvideo/files'),
        ]);

      const leadInstructions = instrRes.data?.[0] || {};
      const leadReturns      = returnsRes.data || [];

      const selectedReports = {
        FullReport: true, leadInstruction: true, leadReturn: true,
        leadPersons: true, leadVehicles: true, leadEnclosures: true,
        leadEvidence: true, leadPictures: true, leadAudio: true,
        leadVideos: true, leadScratchpad: true, leadTimeline: true,
      };

      const body = {
        user:            localStorage.getItem('loggedInUser') || '',
        reportTimestamp: new Date().toISOString(),
        leadInstruction: leadInstructions,
        leadReturn:      leadReturns,
        leadPersons:     personsRes.data || [],
        leadVehicles:    vehiclesRes.data || [],
        leadEnclosures:  enclosuresWithFiles,
        leadEvidence:    evidenceWithFiles,
        leadPictures:    picturesWithFiles,
        leadAudio:       audioWithFiles,
        leadVideos:      videosWithFiles,
        leadScratchpad:  scratchpadRes.data || [],
        leadTimeline:    timelineRes.data || [],
        selectedReports,
        leadInstructions,
        leadReturns,
      };

      const resp = await api.post('/api/report/generate', body, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate('/DocumentReview', {
        state: {
          pdfBlob:  new Blob([resp.data], { type: 'application/pdf' }),
          filename: `Lead_${leadNo || 'report'}.pdf`,
        },
      });
    } catch (err) {
      const msg = err?.response?.data instanceof Blob
        ? await err.response.data.text()
        : err.message || 'Unknown error';
      showAlert('Error generating PDF:\n' + msg);
    } finally {
      setIsGenerating(false);
    }
  };



  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.personPage}>
      <Navbar />

      {/* Notification alert modal */}
      <AlertModal
        isOpen={alertOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={closeAlert}
        onClose={closeAlert}
      />

      {/* Deletion confirmation modal */}
      <AlertModal
        isOpen={confirmOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record?"
        onConfirm={performDeleteEnclosure}
        onClose={() => { setConfirmOpen(false); setPendingDeleteIndex(null); }}
      />

      <div className={styles.LRIContent}>
        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          {/* ── Page-level navigation menu ── */}
          <LRTopMenu
            activePage="addLeadReturn"
            selectedCase={selectedCase}
            selectedLead={selectedLead}
            isPrimaryInvestigator={isPrimaryInvestigator}
            isGenerating={isGenerating}
            onManageLeadReturn={handleViewLeadReturn}
            styles={styles}
          />

          {/* ── Section tabs ── */}
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

          {/* ── Breadcrumb & lead status bar ── */}
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
                  Case: {selectedCase?.caseNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <Link to="/LeadReview" state={{ leadDetails: selectedLead }} className={styles.crumb}>
                  Lead: {selectedLead?.leadNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <span className={styles.crumbCurrent} aria-current="page">Lead Enclosures</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status:  ${status}` : leadStatus}
            </h5>
          </div>

          {/* ── Page heading ── */}
          <div className={styles.caseHeader}>
            <h2>ENCLOSURES INFORMATION</h2>
          </div>

          {/* ── Main scrollable content ── */}
          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* Enclosure Entry Form */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Enclosure Entry</div>
                <div className={styles.LREnteringContentBox}>
                  <div className={styles.enclosureForm}>

                    {/* Row 1: Narrative ID + Enclosure Type */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>Narrative Id *</label>
                        <select
                          value={enclosureData.returnId}
                          onChange={(e) => handleInputChange('returnId', e.target.value)}
                        >
                          <option value="">Select Id</option>
                          {narrativeIds.map((id) => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formRowEvidence}>
                        <label>Enclosure Type</label>
                        <select
                          value={enclosureData.type}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                        >
                          <option value="">Select Type</option>
                          <option value="Document">Document</option>
                          <option value="Business Records">Business Records</option>
                          <option value="Cellular Phone Records">Cellular Phone Records</option>
                          <option value="Deposition">Deposition</option>
                          <option value="Statement">Statement</option>
                        </select>
                      </div>
                    </div>

                    {/* Enclosure Description */}
                    <div className={styles.formRowEvidence}>
                      <label>Enclosure Description *</label>
                      <textarea
                        value={enclosureData.enclosure}
                        onChange={(e) => handleInputChange('enclosure', e.target.value)}
                      />
                    </div>

                    {/* Upload Type + File/Link selector */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>Upload Type</label>
                        <select
                          value={enclosureData.isLink ? 'link' : 'file'}
                          onChange={(e) =>
                            setEnclosureData((prev) => ({
                              ...prev,
                              isLink: e.target.value === 'link',
                              link: '',
                            }))
                          }
                        >
                          <option value="file">File</option>
                          <option value="link">Link</option>
                        </select>
                      </div>

                      {!enclosureData.isLink ? (
                        <div className={styles.formRowEvidence}>
                          <div className={styles.uploadLabelRow}>
                            <label>Upload File</label>
                            {!file && editIndex !== null && enclosureData.originalName && (
                              <span className={styles.currentFilenameInline}>{enclosureData.originalName}</span>
                            )}
                          </div>
                          <input
                            type="file"
                            name="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                        </div>
                      ) : (
                        <div className={styles.formRowEvidence}>
                          <label>Paste Link:</label>
                          <input
                            type="text"
                            placeholder="Enter URL (https://...)"
                            value={enclosureData.link || ''}
                            onChange={(e) =>
                              setEnclosureData((prev) => ({ ...prev, link: e.target.value }))
                            }
                          />
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Action buttons */}
                  <div className={styles.formButtonsReturn}>
                    <button
                      className={styles.saveBtn1}
                      disabled={uploading || isLeadReadOnly}
                      onClick={handleSave}
                    >
                      {uploading ? 'Saving...' : editIndex === null ? 'Add Enclosure' : 'Update'}
                    </button>
                    {editIndex !== null && (
                      <button className={styles.cancelBtn} onClick={resetForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Enclosure History Table */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Enclosure History</div>
                <table className={styles.leadsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%'  }}>Id</th>
                      <th style={{ width: '8%'  }}>Date</th>
                      <th style={{ width: '12%' }}>Entered By</th>
                      <th style={{ width: '10%' }}>Type</th>
                      <th style={{ width: '23%' }}>Description</th>
                      <th style={{ width: '18%' }}>File Link</th>
                      <th style={{ width: '10%' }}>Actions</th>
                      {isCaseManager && <th style={{ width: '15%' }}>Access</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {enclosures.length > 0 ? (
                      enclosures.map((enclosure, index) => {
                        const canModify = isCaseManager || enclosure.enteredBy?.trim() === signedInOfficer?.trim();
                        return (
                        <tr key={index}>
                          <td>{enclosure.returnId}</td>
                          <td>{enclosure.dateEntered}</td>
                          <td>{enclosure.enteredBy}</td>
                          <td>{enclosure.type}</td>
                          <td className={styles.descriptionCell}>
                            <div
                              className={
                                expandedRows.has(index)
                                  ? styles.narrativeContentExpanded
                                  : styles.narrativeContentCollapsed
                              }
                            >
                              {enclosure.enclosure}
                            </div>
                            {enclosure.enclosure && (
                              <button
                                className={styles.viewToggleBtn}
                                onClick={() => toggleRowExpand(index)}
                              >
                                {expandedRows.has(index) ? 'View Less ▲' : 'View ▶'}
                              </button>
                            )}
                          </td>
                          <td>
                            {/* Render a hyperlink for link-type or file-type enclosures */}
                            {enclosure.link?.trim() ? (
                              <a
                                href={enclosure.link.startsWith('http') ? enclosure.link : `https://${enclosure.link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.linkButton}
                              >
                                {enclosure.link}
                              </a>
                            ) : enclosure.originalName ? (
                              <a
                                href={enclosure.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.linkButton}
                              >
                                {enclosure.originalName}
                              </a>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.lrTableBtn}>
                              <button
                                disabled={isLeadReadOnly || !canModify}
                                onClick={() => handleEdit(index)}
                              >
                                <img
                                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                  alt="Edit"
                                  className={styles.editIcon}
                                />
                              </button>
                              <button
                                disabled={isLeadReadOnly || !canModify}
                                onClick={() => requestDeleteEnclosure(index)}
                              >
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
                                value={enclosure.accessLevel}
                                onChange={(e) => handleAccessChange(index, e.target.value)}
                              >
                                <option value="Everyone">All</option>
                                <option value="Case Manager">Case Manager</option>
                                <option value="Case Manager and Assignees">Assignees</option>
                              </select>
                            </td>
                          )}
                        </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isCaseManager ? 8 : 7} style={{ textAlign: 'center' }}>
                          No Enclosures Available
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
