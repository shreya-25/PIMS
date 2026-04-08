/**
 * LRVehicle.jsx
 *
 * Manages vehicle records associated with a lead return.
 * Supports create, edit, delete, and access-level control.
 * Persists in-progress form state to sessionStorage per session.
 * Role-aware: Case Managers see all records; Investigators see only permitted ones.
 */

import { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styles from './LRVehicle.module.css';
import { LRTopMenu } from '../LRTopMenu';
import Navbar from '../../../components/Navbar/Navbar';
import VehicleModal from '../../../components/VehicleModal/VehicleModal';
import { CaseContext } from '../../CaseContext';
import api from '../../../api';
import { SideBar } from '../../../components/Sidebar/Sidebar';
import { AlertModal } from '../../../components/AlertModal/AlertModal';
import { useLeadStatus } from '../../../hooks/useLeadStatus';

// ─── Module-level constants ──────────────────────────────────────────────────

const FORM_KEY = 'LRVehicle:form';
const LIST_KEY = 'LRVehicle:list';

const READONLY_STATUSES = ['Completed', 'Closed'];

const REQUIRED_FIELDS = [
  { key: 'leadReturnId', label: 'Narrative Id' },
  { key: 'enteredDate',  label: 'Entered Date' },
];

const EMPTY_VEHICLE_FORM = {
  year: '', make: '', model: '', plate: '',
  category: '', type: '', vin: '',
  primaryColor: '', secondaryColor: '', state: '',
  leadReturnId: '', information: '',
  enteredDate: new Date().toISOString().slice(0, 10),
};

/** Section tab definitions used to render the section navigation bar. */
const SECTION_TABS = [
  { label: 'Instructions', route: '/LRInstruction' },
  { label: 'Narrative',    route: '/LRReturn' },
  { label: 'Person',       route: '/LRPerson' },
  { label: 'Vehicles',     route: '/LRVehicle', active: true },
  { label: 'Enclosures',   route: '/LREnclosures' },
  { label: 'Evidence',     route: '/LREvidence' },
  { label: 'Pictures',     route: '/LRPictures' },
  { label: 'Audio',        route: '/LRAudio' },
  { label: 'Videos',       route: '/LRVideo' },
  { label: 'Notes',        route: '/LRScratchpad' },
  { label: 'Timeline',     route: '/LRTimeline' },
];

// ─── Module-level utilities ──────────────────────────────────────────────────

/** Formats an ISO date string to MM/DD/YYYY. Returns "" for invalid input. */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
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

/** Returns labels of any required fields that are empty. */
const findMissingFields = (vehicleData) => {
  const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '');
  return REQUIRED_FIELDS
    .filter(({ key }) => isEmpty(vehicleData[key]))
    .map(({ label }) => label);
};

/** Maps a raw API vehicle record to a display row object. */
const mapVehicleToDisplayRow = (v, i) => ({
  rawIndex:    i,
  returnId:    v.leadReturnId,
  dateEntered: formatDate(v.enteredDate),
  year:        v.year,
  make:        v.make,
  model:       v.model,
  type:        v.type,
  color:       v.primaryColor,
  vin:         v.vin,
  plate:       v.plate,
  state:       v.state,
  accessLevel: v.accessLevel ?? 'Everyone',
  enteredBy:        v.enteredBy,
  enteredByUserId:  v.enteredByUserId ? String(v.enteredByUserId) : null,
});

/**
 * Filters display records by the current user's access level.
 * Case Managers see all records; investigators see only "Everyone" or lead-assigned ones.
 */
const filterByAccessLevel = (records, isCaseManager, leadData) => {
  if (isCaseManager) return records;
  const currentUserId = localStorage.getItem('userId');
  const currentUser   = localStorage.getItem('loggedInUser')?.trim();
  const leadAssigneeUserIds = (leadData?.assignedTo || [])
    .map(a => (typeof a === 'object' && a !== null ? String(a.userId || '') : ''))
    .filter(Boolean);
  const leadAssigneeUsernames = (leadData?.assignedTo || [])
    .map(a => (typeof a === 'object' && a !== null ? (a.username || '') : String(a ?? '')).trim());
  return records.filter((r) => {
    if (r.accessLevel === 'Everyone') return true;
    if (r.accessLevel === 'Case Manager and Assignees') {
      return currentUserId
        ? leadAssigneeUserIds.includes(currentUserId)
        : leadAssigneeUsernames.some(a => a === currentUser);
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

export const LRVehicle = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Context & route state ─────────────────────────────────────────────────
  const { selectedCase, selectedLead, leadStatus } = useContext(CaseContext);
  const { leadDetails, caseDetails } = location.state || {};

  // Fall back to route state if context values are not yet populated
  const effectiveCase = selectedCase?.caseNo ? selectedCase : caseDetails;
  const effectiveLead = selectedLead?.leadNo ? selectedLead : leadDetails;

  const isCaseManager =
    selectedCase?.role === 'Case Manager' ||
    selectedCase?.role === 'Detective Supervisor';

  // Today's date in YYYY-MM-DD, stable across renders
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ── State ─────────────────────────────────────────────────────────────────

  // Form state — hydrated from sessionStorage on first render
  const [vehicleData, setVehicleData] = useState(() => {
    const saved = sessionStorage.getItem(FORM_KEY);
    return saved ? JSON.parse(saved) : { ...EMPTY_VEHICLE_FORM, enteredDate: todayISO };
  });

  // Raw API records and their filtered display list
  const [rawVehicles, setRawVehicles] = useState(() => {
    const saved = sessionStorage.getItem(LIST_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [vehicles, setVehicles] = useState([]);

  // Editing, lookup data, and fetch state
  const [editIndex, setEditIndex] = useState(null);
  const [leadData, setLeadData] = useState({});
  const [narrativeIds, setNarrativeIds] = useState([]);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Vehicle detail modal
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleModalData, setVehicleModalData] = useState({
    leadNo: '', leadName: '', caseNo: '', caseName: '', leadReturnId: '',
  });

  // Confirm-deletion modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

  // Alert/notification modal
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [auditLogRefresh, setAuditLogRefresh] = useState(0);

  // ── Lead status hook ──────────────────────────────────────────────────────
  const { status, isReadOnly } = useLeadStatus({
    caseId:   selectedCase?._id || selectedCase?.id,
    leadNo:   selectedLead?.leadNo,
    leadName: selectedLead?.leadName,
    initialStatus: selectedLead?.leadStatus,
  });

  // Derived permissions
  const signedInOfficer   = localStorage.getItem('loggedInUser');
  const signedInUserId    = localStorage.getItem('userId');
  const primaryInvestigatorUserId = leadData?.primaryInvestigatorUserId || '';
  const primaryUsername   = leadData?.primaryInvestigator || leadData?.primaryOfficer || '';
  const isPrimaryInvestigator =
    selectedCase?.role === 'Investigator' &&
    !!signedInUserId &&
    (primaryInvestigatorUserId
      ? signedInUserId === String(primaryInvestigatorUserId)
      : signedInOfficer === primaryUsername);

  // True when the lead is locked and no edits should be allowed
  const isLeadReadOnly = READONLY_STATUSES.includes(selectedLead?.leadStatus) || isReadOnly;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showAlert = useCallback((msg) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  }, []);

  const closeAlert = useCallback(() => setAlertOpen(false), []);

  /** Rebuilds the visible (access-filtered) display list from a raw list. */
  const buildVisibleList = useCallback(
    (rawList) =>
      filterByAccessLevel(rawList.map(mapVehicleToDisplayRow), isCaseManager, leadData),
    [isCaseManager, leadData]
  );

  /** Resets the vehicle form back to empty and clears edit mode. */
  const resetForm = useCallback(() => {
    setEditIndex(null);
    setVehicleData({ ...EMPTY_VEHICLE_FORM, enteredDate: todayISO });
  }, [todayISO]);

  // ── sessionStorage sync ───────────────────────────────────────────────────

  useEffect(() => {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(vehicleData));
  }, [vehicleData]);

  useEffect(() => {
    sessionStorage.setItem(LIST_KEY, JSON.stringify(rawVehicles));
  }, [rawVehicles]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  /**
   * Fetches lead metadata (assignees, status) for access-level filtering.
   * Re-runs whenever the selected lead or case changes.
   */
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
      .catch((err) => console.error('Failed to fetch lead data:', err));
  }, [selectedLead, selectedCase]);

  /**
   * Fetches available narrative IDs and auto-selects the latest one
   * when creating a new vehicle record.
   */
  useEffect(() => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (
      !selectedLead?.leadNo || !selectedLead?.leadName || !caseId
    ) return;

    const ac = new AbortController();
    const token = localStorage.getItem('token');

    (async () => {
      try {
        const { data } = await api.get(
          `/api/leadReturnResult/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${caseId}`,
          { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
        );

        const ids = [...new Set((data || []).map((r) => r?.leadReturnId).filter(Boolean))];
        ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
        setNarrativeIds(ids);

        // Auto-select the latest narrative ID only for new (non-edit) records
        setVehicleData((prev) =>
          editIndex === null && !prev.leadReturnId
            ? { ...prev, leadReturnId: ids.at(-1) || '', enteredDate: prev.enteredDate || todayISO }
            : prev
        );
      } catch (e) {
        if (!ac.signal.aborted) console.error('Failed to fetch narrative IDs:', e);
      }
    })();

    return () => ac.abort();
  }, [
    selectedLead?.leadNo, selectedLead?.leadName,
    selectedCase?._id, selectedCase?.id,
    editIndex, todayISO,
  ]);

  /** Fetches vehicle records whenever the selected lead or case changes. */
  useEffect(() => {
    if (selectedLead?.leadNo && (selectedCase?._id || selectedCase?.id)) {
      fetchVehicles();
    }
  }, [selectedLead, selectedCase]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVehicles = async () => {
    const caseId = selectedCase?._id || selectedCase?.id;
    const token = localStorage.getItem('token');
    try {
      const { data } = await api.get(
        `/api/lrvehicle/lrvehicle/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${caseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRawVehicles(data);
      setVehicles(filterByAccessLevel(data.map(mapVehicleToDisplayRow), isCaseManager, leadData));
      setError('');
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to fetch vehicles.');
    }
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleChange = useCallback((field, value) => {
    setVehicleData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /** Populates the form with an existing vehicle record for editing. */
  const handleEditVehicle = useCallback(
    (visibleIdx) => {
      const vis = vehicles[visibleIdx];
      const rawIdx =
        vis?.rawIndex ??
        rawVehicles.findIndex(
          (r) => r.leadReturnId === vis.returnId && r.vin === vis.vin
        );
      if (rawIdx < 0) { console.error('Could not resolve vehicle'); return; }

      const v = rawVehicles[rawIdx];
      setEditIndex(rawIdx);
      setVehicleData({
        leadReturnId:   v.leadReturnId,
        enteredDate:    v.enteredDate.slice(0, 10),
        vin:            v.vin,
        year:           v.year,
        make:           v.make,
        model:          v.model,
        plate:          v.plate,
        state:          v.state,
        primaryColor:   v.primaryColor,
        secondaryColor: v.secondaryColor,
        category:       v.category,
        type:           v.type,
        information:    v.information,
      });
    },
    [vehicles, rawVehicles]
  );

  /** Creates or updates a vehicle record via the API. */
  const handleSaveVehicle = async () => {
    // Validate required fields
    const missing = findMissingFields(vehicleData);
    if (missing.length) {
      showAlert(`Please fill the required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`);
      return;
    }

    // Ensure at least one vehicle field is populated
    const hasAtLeastOneField = [
      vehicleData.year, vehicleData.make, vehicleData.model, vehicleData.plate,
      vehicleData.category, vehicleData.type, vehicleData.vin,
      vehicleData.primaryColor, vehicleData.secondaryColor, vehicleData.state,
      vehicleData.information,
    ].some((v) => v != null && String(v).trim() !== '');

    if (!hasAtLeastOneField) {
      showAlert('Please fill in at least one vehicle field before saving.');
      return;
    }

    const token    = localStorage.getItem('token');
    const username = localStorage.getItem('loggedInUser');
    const payload  = {
      leadNo:          selectedLead.leadNo,
      description:     selectedLead.leadName,
      caseNo:          selectedCase.caseNo,
      caseName:        selectedCase.caseName,
      enteredBy:       username,
      enteredByUserId: localStorage.getItem('userId'),
      enteredDate: vehicleData.enteredDate || new Date().toISOString(),
      accessLevel: vehicleData.accessLevel || 'Everyone',
      ...vehicleData,
    };

    try {
      let res;
      if (editIndex !== null) {
        // UPDATE: encode VIN in URL; use sentinel for empty VINs
        const old      = rawVehicles[editIndex];
        const vinParam = old.vin ? encodeURIComponent(old.vin) : encodeURIComponent('-EMPTY-');
        res = await api.put(
          `/api/lrvehicle/${selectedLead.leadNo}/${selectedCase._id || selectedCase.id}` +
          `/${encodeURIComponent(old.leadReturnId)}/${vinParam}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // CREATE
        res = await api.post('/api/lrvehicle/lrvehicle', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const updatedRaw = editIndex !== null
        ? rawVehicles.map((r, i) => (i === editIndex ? res.data : r))
        : [res.data, ...rawVehicles];

      setRawVehicles(updatedRaw);
      setVehicles(buildVisibleList(updatedRaw));
      resetForm();
      setAuditLogRefresh((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      showAlert('Save failed: ' + (err.response?.data?.message || err.message));
    }
  };

  /** Opens the confirmation modal for a pending deletion. */
  const requestDeleteVehicle = useCallback((idx) => {
    setPendingDeleteIndex(idx);
    setConfirmOpen(true);
  }, []);

  /** Executes the confirmed vehicle deletion against the API. */
  const performDeleteVehicle = async () => {
    if (pendingDeleteIndex == null) return;

    const vis    = vehicles[pendingDeleteIndex];
    const rawIdx = rawVehicles.findIndex(
      (r) => r.leadReturnId === vis.returnId && r.vin === vis.vin
    );
    if (rawIdx < 0) { showAlert('Could not resolve vehicle. Please refresh.'); return; }

    const r        = rawVehicles[rawIdx];
    const vinParam = r.vin ? encodeURIComponent(r.vin) : encodeURIComponent('-EMPTY-');
    const token    = localStorage.getItem('token');

    try {
      await api.delete(
        `/api/lrvehicle/${encodeURIComponent(String(selectedLead.leadNo))}` +
        `/${encodeURIComponent(String(selectedCase._id || selectedCase.id))}` +
        `/${encodeURIComponent(String(r.leadReturnId))}/${vinParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newRaw = rawVehicles.filter((_, i) => i !== rawIdx);
      setRawVehicles(newRaw);
      setVehicles(buildVisibleList(newRaw));
      setAuditLogRefresh((prev) => prev + 1);
    } catch {
      showAlert('Failed to delete vehicle.');
    } finally {
      setConfirmOpen(false);
      setPendingDeleteIndex(null);
    }
  };

  /** Updates the access level of a single vehicle record via the API. */
  const handleAccessChange = async (visibleIdx, newAccess) => {
    const vis    = vehicles[visibleIdx];
    const rawIdx =
      vis?.rawIndex ??
      rawVehicles.findIndex((r) => r.leadReturnId === vis.returnId && r.vin === vis.vin);

    if (rawIdx < 0) { showAlert('Could not find vehicle. Please refresh.'); return; }

    const v        = rawVehicles[rawIdx];
    const vinParam = v.vin ? encodeURIComponent(v.vin) : encodeURIComponent('-EMPTY-');
    const token    = localStorage.getItem('token');

    try {
      const { data: updated } = await api.put(
        `/api/lrvehicle/${selectedLead.leadNo}/${selectedCase._id || selectedCase.id}` +
        `/${encodeURIComponent(v.leadReturnId)}/${vinParam}`,
        { accessLevel: newAccess },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newRaw = rawVehicles.map((r, i) => (i === rawIdx ? updated : r));
      setRawVehicles(newRaw);
      setVehicles(buildVisibleList(newRaw));
    } catch {
      showAlert('Could not change access level. Please try again.');
    }
  };

  // ── Vehicle detail modal handlers ─────────────────────────────────────────

  const openVehicleModal = useCallback(
    (leadNo, leadName, caseNo, caseName, leadReturnId) => {
      setVehicleModalData({ leadNo, leadName, caseNo, caseName, leadReturnId });
      setShowVehicleModal(true);
    },
    []
  );

  const closeVehicleModal = useCallback(() => {
    setVehicleModalData({ leadNo: '', leadName: '', caseNo: '', caseName: '', leadReturnId: '' });
    setShowVehicleModal(false);
  }, []);

  // ── Report generation ─────────────────────────────────────────────────────

  /**
   * Fetches all lead return data sections, generates a full PDF report blob,
   * and navigates to the DocumentReview page.
   */
  const handleViewLeadReturn = async () => {
    const lead   = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase   = selectedCase?._id || selectedCase?.id ? selectedCase : location.state?.caseDetails;
    const kaseId = kase?._id || kase?.id;

    if (!lead?.leadNo || !(lead.leadName || lead.description) || !kaseId) {
      showAlert('Please select a case and lead first.');
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    const token    = localStorage.getItem('token');
    const headers  = { headers: { Authorization: `Bearer ${token}` } };
    const { leadNo } = lead;
    const leadName   = lead.leadName || lead.description;
    const encLead    = encodeURIComponent(leadName);
    const base       = `${leadNo}/${encLead}/${kaseId}`;

    try {
      // Fetch all lead return sections in parallel
      const [
        instrRes, returnsRes, personsRes, vehiclesRes, enclosuresRes,
        evidenceRes, picturesRes, audioRes, videosRes, scratchpadRes, timelineRes,
      ] = await Promise.all([
        api.get(`/api/lead/lead/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/leadReturnResult/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrperson/lrperson/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvehicle/lrvehicle/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrenclosure/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrevidence/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrpicture/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lraudio/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvideo/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/scratchpad/${base}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/timeline/${base}`, headers).catch(() => ({ data: [] })),
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
        user:             localStorage.getItem('loggedInUser') || '',
        reportTimestamp:  new Date().toISOString(),
        leadInstruction:  leadInstructions,
        leadReturn:       leadReturns,
        leadPersons:      personsRes.data || [],
        leadVehicles:     vehiclesRes.data || [],
        leadEnclosures:   enclosuresWithFiles,
        leadEvidence:     evidenceWithFiles,
        leadPictures:     picturesWithFiles,
        leadAudio:        audioWithFiles,
        leadVideos:       videosWithFiles,
        leadScratchpad:   scratchpadRes.data || [],
        leadTimeline:     timelineRes.data || [],
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



  // ── Guard ─────────────────────────────────────────────────────────────────

  if (!selectedCase && !caseDetails) {
    return <div>Loading case/lead…</div>;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      key={`${effectiveCase?.caseNo}-${effectiveLead?.leadNo}`}
      className={styles.personPage}
    >
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
        onConfirm={performDeleteVehicle}
        onClose={() => { setConfirmOpen(false); setPendingDeleteIndex(null); }}
      />

      {/* Vehicle detail modal */}
      <VehicleModal
        isOpen={showVehicleModal}
        onClose={closeVehicleModal}
        leadNo={vehicleModalData.leadNo}
        leadName={vehicleModalData.leadName}
        caseNo={vehicleModalData.caseNo}
        caseName={vehicleModalData.caseName}
        leadReturnId={vehicleModalData.leadReturnId}
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
                  onClick={() => navigate(route, { state: { caseDetails: selectedCase, leadDetails: selectedLead } })}
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
                <Link
                  to="/LeadReview"
                  state={{ leadDetails: selectedLead }}
                  className={styles.crumb}
                >
                  Lead: {selectedLead?.leadNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <span className={styles.crumbCurrent} aria-current="page">Lead Vehicles</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status:  ${status}` : leadStatus}
            </h5>
          </div>

          {/* ── Page heading ── */}
          <div className={styles.caseHeader}>
            <h2>VEHICLE INFORMATION</h2>
          </div>

          {/* ── Main scrollable content ── */}
          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* Vehicle Entry Form */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Vehicle Entry</div>
                <div className={styles.LREnteringContentBox}>

                  {/* Row 1: Narrative ID, Entered Date, Model */}
                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>Narrative Id*</label>
                      <select
                        value={vehicleData.leadReturnId}
                        onChange={(e) => handleChange('leadReturnId', e.target.value)}
                      >
                        <option value="">Select Id</option>
                        {narrativeIds.map((id) => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formRow4}>
                      <label>Entered Date*</label>
                      <input
                        type="date"
                        value={vehicleData.enteredDate || todayISO}
                        onChange={(e) => handleChange('enteredDate', e.target.value)}
                      />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Model</label>
                      <input
                        type="text"
                        value={vehicleData.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 2: Plate, Category, Type */}
                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>Plate</label>
                      <input type="text" value={vehicleData.plate} onChange={(e) => handleChange('plate', e.target.value)} />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Category</label>
                      <input type="text" value={vehicleData.category} onChange={(e) => handleChange('category', e.target.value)} />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Type</label>
                      <input type="text" value={vehicleData.type} onChange={(e) => handleChange('type', e.target.value)} />
                    </div>
                  </div>

                  {/* Row 3: VIN, Year, Make */}
                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>VIN</label>
                      <input type="text" value={vehicleData.vin} onChange={(e) => handleChange('vin', e.target.value)} />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Year</label>
                      <input type="text" value={vehicleData.year} onChange={(e) => handleChange('year', e.target.value)} />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Make</label>
                      <input type="text" value={vehicleData.make} onChange={(e) => handleChange('make', e.target.value)} />
                    </div>
                  </div>

                  {/* Row 4: State, Primary Color, Secondary Color */}
                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>State</label>
                      <input type="text" value={vehicleData.state} onChange={(e) => handleChange('state', e.target.value)} />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Primary Color</label>
                      <input type="text" value={vehicleData.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Secondary Color</label>
                      <input type="text" value={vehicleData.secondaryColor} onChange={(e) => handleChange('secondaryColor', e.target.value)} />
                    </div>
                  </div>

                  {/* Information textarea */}
                  <h4 className={styles.returnFormH4}>Information</h4>
                  <div className={styles.returnForm}>
                    <textarea
                      value={vehicleData.information}
                      onChange={(e) => handleChange('information', e.target.value)}
                      placeholder="Enter vehicle information"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className={styles.formButtonsReturn}>
                    <button
                      className={styles.saveBtn1}
                      disabled={isLeadReadOnly}
                      onClick={handleSaveVehicle}
                    >
                      {editIndex !== null ? 'Update' : 'Add Vehicle'}
                    </button>
                    {editIndex !== null && (
                      <button className={styles.cancelBtn} onClick={resetForm}>
                        Cancel
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* Fetch error message */}
              {error && <div className={styles.errorMessage}>{error}</div>}

              {/* Vehicle Records Table */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Vehicle Records</div>
                <table className={styles.leadsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '4%'  }}>Id</th>
                      <th style={{ width: '11%' }}>Date</th>
                      <th style={{ width: '15%' }}>Entered By</th>
                      <th style={{ width: '10%' }}>Type</th>
                      <th style={{ width: '10%' }}>Model</th>
                      <th style={{ width: '12%' }}>Color</th>
                      <th style={{ width: '8%'  }}>More</th>
                      <th style={{ width: '12%' }}>Actions</th>
                      {isCaseManager && <th style={{ width: '15%', fontSize: '20px' }}>Access</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length > 0 ? (
                      vehicles.map((vehicle, index) => {
                        // Only the record's author can edit/delete it
                        const canModify      = isCaseManager || (vehicle.enteredByUserId && signedInUserId
                          ? vehicle.enteredByUserId === signedInUserId
                          : vehicle.enteredBy?.trim() === signedInOfficer?.trim());
                        const disableActions = isLeadReadOnly || !canModify;

                        return (
                          <tr key={index}>
                            <td>{vehicle.returnId}</td>
                            <td>{vehicle.dateEntered}</td>
                            <td>{vehicle.enteredBy}</td>
                            <td>{vehicle.type}</td>
                            <td>{vehicle.model}</td>
                            <td>
                              {/* Color label + visual swatch */}
                              <div className={styles.colorCell}>
                                <span className={styles.colorLabel}>{vehicle.color}</span>
                                <div
                                  className={styles.colorSwatch}
                                  style={{ backgroundColor: vehicle.color }}
                                />
                              </div>
                            </td>
                            <td>
                              <button
                                className={styles.viewPersonBtn}
                                onClick={() => openVehicleModal(
                                  selectedLead.leadNo,
                                  selectedLead.leadName,
                                  selectedCase.caseNo,
                                  selectedCase.caseName,
                                  vehicle.returnId
                                )}
                              >
                                View
                              </button>
                            </td>
                            <td>
                              <div className={styles.lrTableBtn}>
                                <button
                                  disabled={disableActions}
                                  onClick={() => handleEditVehicle(index)}
                                >
                                  <img
                                    src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                    alt="Edit"
                                    className={styles.editIcon}
                                  />
                                </button>
                                <button
                                  disabled={disableActions}
                                  onClick={() => requestDeleteVehicle(index)}
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
                                  value={vehicle.accessLevel}
                                  onChange={(e) => handleAccessChange(index, e.target.value)}
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
                        <td colSpan={isCaseManager ? 9 : 8} style={{ textAlign: 'center' }}>
                          No Vehicle Data Available
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
