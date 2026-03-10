/**
 * LRAudio – Lead Return Audio section
 *
 * Allows investigators and case managers to upload, edit, delete,
 * and manage access levels for audio files associated with a lead.
 */

import { useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

import Navbar from '../../../components/Navbar/Navbar';
import { SideBar } from '../../../components/Sidebar/Sidebar';
import { AlertModal } from '../../../components/AlertModal/AlertModal';
import { CaseContext } from '../../CaseContext';
import { useLeadStatus } from '../../../hooks/useLeadStatus';
import api from '../../../api';
import styles from './LRAudio.module.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_AUDIO = {
  dateAudioRecorded: '',
  description: '',
  audioSrc: '',
  leadReturnId: '',
  isLink: false,
  link: '',
  filename: '',
  accessLevel: 'Everyone',
};

/** Section tabs shown in the secondary navigation bar. */
const SECTION_TABS = [
  { label: 'Instructions', route: '/LRInstruction' },
  { label: 'Narrative',    route: '/LRReturn' },
  { label: 'Person',       route: '/LRPerson' },
  { label: 'Vehicles',     route: '/LRVehicle' },
  { label: 'Enclosures',   route: '/LREnclosures' },
  { label: 'Evidence',     route: '/LREvidence' },
  { label: 'Pictures',     route: '/LRPictures' },
  { label: 'Audio',        route: '/LRAudio', active: true },
  { label: 'Videos',       route: '/LRVideo' },
  { label: 'Notes',        route: '/LRScratchpad' },
  { label: 'Timeline',     route: '/LRTimeline' },
];

// ---------------------------------------------------------------------------
// Pure utility functions
// ---------------------------------------------------------------------------

/** Format an ISO date string to MM/DD/YY for display. */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  const year  = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

/** Normalise a narrative ID to an uppercase trimmed string. */
const normalizeId = (id) => String(id ?? '').trim().toUpperCase();

/** Convert an alphabetic string (A–Z, AA–AZ…) to a numeric sort key. */
const alphabetToNumber = (str = '') => {
  const s = normalizeId(str);
  let n = 0;
  for (let i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
  return n;
};

/** Basic HTTPS URL validation. */
const isHttpUrl = (s) => /^https?:\/\/\S+$/i.test((s || '').trim());

/**
 * Returns an array of missing required field names for the audio form.
 * Used to gate submission and display a single consolidated error message.
 */
const getMissingAudioFields = ({ audioData, file, isEditing }) => {
  const missing = [];

  if (!audioData.leadReturnId?.trim())      missing.push('Narrative Id');
  if (!audioData.dateAudioRecorded?.trim()) missing.push('Date Audio Recorded');
  if (!audioData.description?.trim())       missing.push('Description');

  if (audioData.isLink) {
    if (!isHttpUrl(audioData.link)) missing.push('Link (valid URL)');
  } else if (!isEditing && !file) {
    // File is required when creating; optional when editing (keeps existing file)
    missing.push('Audio File');
  }

  return missing;
};

/**
 * For each item, fetch associated files from `{filesEndpoint}/{item[idFieldName]}`
 * and attach them as `item.files`. Fails gracefully with an empty array.
 */
const attachFiles = async (items, idFieldName, filesEndpoint) => {
  return Promise.all(
    (items || []).map(async (item) => {
      const recordId = item[idFieldName];
      if (!recordId) return { ...item, files: [] };
      try {
        const { data } = await api.get(`${filesEndpoint}/${recordId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        return { ...item, files: data };
      } catch {
        return { ...item, files: [] };
      }
    }),
  );
};

// ---------------------------------------------------------------------------
// Sub-component: AudioTableRow
// ---------------------------------------------------------------------------

/**
 * A single row in the audio records table.
 * Extracted to keep the parent render function concise.
 */
const AudioTableRow = ({ audio, index, isCaseManager, isReadOnly, leadStatus, onEdit, onDelete, onAccessChange }) => {
  const isLocked = leadStatus === 'In Review' || leadStatus === 'Completed' || isReadOnly;

  return (
    <tr>
      <td>{audio.dateEntered}</td>
      <td>{audio.returnId}</td>

      {/* File name column: renders a link for files/URLs, or a placeholder */}
      <td>
        {audio.isLink ? (
          <a href={audio.link} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
            {audio.link}
          </a>
        ) : audio.signedUrl ? (
          <a href={audio.signedUrl} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
            {audio.originalName || 'Download'}
          </a>
        ) : (
          <span className={styles.noFile}>No File Available</span>
        )}
      </td>

      <td>{audio.description}</td>

      {/* Action buttons: edit and delete */}
      <td>
        <div className={styles.lrTableBtn}>
          <button disabled={isLocked} onClick={() => onEdit(index)} aria-label="Edit audio">
            <img
              src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
              alt="Edit"
              className={styles.editIcon}
            />
          </button>
          <button disabled={isLocked} onClick={() => onDelete(index)} aria-label="Delete audio">
            <img
              src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
              alt="Delete"
              className={styles.editIcon}
            />
          </button>
        </div>
      </td>

      {/* Access level dropdown: visible to case managers only */}
      {isCaseManager && (
        <td>
          <select
            className={styles.accessDropdown}
            value={audio.accessLevel}
            onChange={(e) => onAccessChange(index, e.target.value)}
          >
            <option value="Everyone">All</option>
            <option value="Case Manager Only">Case Manager</option>
            <option value="Case Manager and Assignees">Assignees</option>
          </select>
        </td>
      )}
    </tr>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const LRAudio = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Context ──────────────────────────────────────────────────────────────
  const { selectedCase, selectedLead } = useContext(CaseContext);

  // ── Session-storage cache keys (memoised by case/lead identifiers) ────────
  const { formKey, listKey } = useMemo(() => {
    const cn   = selectedCase?.caseNo  ?? 'NA';
    const cNam = encodeURIComponent(selectedCase?.caseName ?? 'NA');
    const ln   = selectedLead?.leadNo  ?? 'NA';
    const lNam = encodeURIComponent(selectedLead?.leadName ?? 'NA');
    return {
      formKey: `LRAudio:form:${cn}:${cNam}:${ln}:${lNam}`,
      listKey: `LRAudio:list:${cn}:${cNam}:${ln}:${lNam}`,
    };
  }, [selectedCase?.caseNo, selectedCase?.caseName, selectedLead?.leadNo, selectedLead?.leadName]);

  // ── Lead read-only status ─────────────────────────────────────────────────
  const { status: leadStatusLabel, isReadOnly } = useLeadStatus({
    caseNo:   selectedCase?.caseNo,
    caseName: selectedCase?.caseName,
    leadNo:   selectedLead?.leadNo,
    leadName: selectedLead?.leadName,
  });

  // ── Role helpers ──────────────────────────────────────────────────────────
  const isCaseManager   = ['Case Manager', 'Detective Supervisor'].includes(selectedCase?.role);
  const signedInOfficer = localStorage.getItem('loggedInUser');

  // ── Local state ───────────────────────────────────────────────────────────
  const [leadData, setLeadData]         = useState({});
  const [audioData, setAudioData]       = useState(DEFAULT_AUDIO);
  const [audioFiles, setAudioFiles]     = useState([]);
  const [narrativeIds, setNarrativeIds] = useState([]);
  const [file, setFile]                 = useState(null);
  const fileInputRef                    = useRef(null);

  const [editingId, setEditingId]       = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Alert modal
  const [alertOpen, setAlertOpen]       = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Delete-confirm modal
  const [deleteOpen, setDeleteOpen]               = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

  const isEditing = editingId !== null;

  // Derived: is the current user the primary investigator on this lead?
  const primaryUsername = leadData?.primaryInvestigator || leadData?.primaryOfficer || '';
  const isPrimaryInvestigator =
    selectedCase?.role === 'Investigator' && !!signedInOfficer && signedInOfficer === primaryUsername;

  // Derived: is the lead locked against edits?
  const isLeadLocked =
    selectedLead?.leadStatus === 'In Review' || selectedLead?.leadStatus === 'Completed';

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Display a message in the alert modal. */
  const showAlert = useCallback((message) => {
    setAlertMessage(message);
    setAlertOpen(true);
  }, []);

  /** Reset form fields, file selection, and editing state. */
  const resetForm = useCallback(() => {
    setAudioData(DEFAULT_AUDIO);
    setFile(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── Session-storage: restore cached data on context switch ────────────────
  useEffect(() => {
    const savedForm = sessionStorage.getItem(formKey);
    setAudioData(savedForm ? { ...DEFAULT_AUDIO, ...JSON.parse(savedForm) } : DEFAULT_AUDIO);

    const savedList = sessionStorage.getItem(listKey);
    setAudioFiles(savedList ? JSON.parse(savedList) : []);

    // Reset transient editing state when the lead/case context changes
    setEditingId(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [formKey, listKey]);

  /** Persist form draft to sessionStorage on every change. */
  useEffect(() => {
    sessionStorage.setItem(formKey, JSON.stringify(audioData));
  }, [formKey, audioData]);

  /** Persist audio list to sessionStorage on every change. */
  useEffect(() => {
    sessionStorage.setItem(listKey, JSON.stringify(audioFiles));
  }, [listKey, audioFiles]);

  // ── API: fetch lead metadata (assignees, primary investigator) ────────────
  useEffect(() => {
    if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;

    const encLead = encodeURIComponent(selectedLead.leadName);
    const encCase = encodeURIComponent(selectedCase.caseName);

    api
      .get(`/api/lead/lead/${selectedLead.leadNo}/${encLead}/${selectedCase.caseNo}/${encCase}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
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

  // ── API: fetch narrative IDs for the form select dropdown ─────────────────
  useEffect(() => {
    if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;

    const ac      = new AbortController();
    const encLead = encodeURIComponent(selectedLead.leadName);
    const encCase = encodeURIComponent(selectedCase.caseName);

    (async () => {
      try {
        const { data } = await api.get(
          `/api/leadReturnResult/${selectedLead.leadNo}/${encLead}/${selectedCase.caseNo}/${encCase}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, signal: ac.signal },
        );

        // Deduplicate, normalise, and sort IDs in alphabetical-numeric order (A, B…Z, AA, AB…)
        const ids = [...new Set((data || []).map((r) => normalizeId(r?.leadReturnId)).filter(Boolean))];
        ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
        setNarrativeIds(ids);

        // Pre-select the latest narrative ID when creating a new record
        setAudioData((prev) =>
          !isEditing && !prev.leadReturnId ? { ...prev, leadReturnId: ids.at(-1) || '' } : prev,
        );
      } catch (err) {
        if (!ac.signal.aborted) console.error('Failed to fetch Narrative Ids:', err);
      }
    })();

    return () => ac.abort();
  }, [selectedLead?.leadNo, selectedLead?.leadName, selectedCase?.caseNo, selectedCase?.caseName, isEditing]);

  // ── API: fetch audio records from the server ──────────────────────────────
  const fetchAudioFiles = useCallback(async () => {
    const encLead = encodeURIComponent(selectedLead.leadName);
    const encCase = encodeURIComponent(selectedCase.caseName);

    try {
      const { data } = await api.get(
        `/api/lraudio/${selectedLead.leadNo}/${encLead}/${selectedCase.caseNo}/${encCase}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );

      const mapped = data.map((a) => ({
        dateEntered:          formatDate(a.enteredDate),
        returnId:             a.leadReturnId,
        dateAudioRecorded:    formatDate(a.dateAudioRecorded),
        rawDateAudioRecorded: a.dateAudioRecorded,
        description:          a.audioDescription,
        id:                   a._id,
        originalName:         a.originalName || '',
        filename:             a.filename || '',
        accessLevel:          a.accessLevel ?? 'Everyone',
        isLink:               a.isLink,
        link:                 a.link || '',
        signedUrl:            a.signedUrl || '',
        audioSrc:             a.isLink ? a.link : (a.signedUrl || ''),
      }));

      // Non-managers only see records they have access to
      let visible = mapped;
      if (!isCaseManager) {
        const currentUser   = signedInOfficer?.trim();
        const leadAssignees = (leadData?.assignedTo || []).map((a) => a?.trim());

        visible = mapped.filter((audio) => {
          if (audio.accessLevel === 'Everyone') return true;
          if (audio.accessLevel === 'Case Manager and Assignees') return leadAssignees.includes(currentUser);
          return false; // 'Case Manager Only'
        });
      }

      setAudioFiles(visible);
    } catch (err) {
      console.error('Error fetching audios:', err);
    }
  }, [selectedLead, selectedCase, isCaseManager, signedInOfficer, leadData?.assignedTo]);

  useEffect(() => {
    if (selectedLead?.leadNo && selectedLead?.leadName && selectedCase?.caseNo && selectedCase?.caseName) {
      fetchAudioFiles();
    }
  }, [selectedLead, selectedCase, fetchAudioFiles]);

  // ── Form field handlers ───────────────────────────────────────────────────

  const handleInputChange = useCallback((field, value) => {
    setAudioData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setAudioData((prev) => ({
        ...prev,
        audioSrc: URL.createObjectURL(selected),
        filename: selected.name,
      }));
    }
  }, []);

  // ── CRUD: Add ─────────────────────────────────────────────────────────────

  /** POST: upload a new audio record. */
  const handleAddAudio = async () => {
    if (isSubmitting) return;

    const missing = getMissingAudioFields({ audioData, file, isEditing: false });
    if (missing.length) {
      showAlert(`Please fill the required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`);
      return;
    }

    setIsSubmitting(true);

    const fd = new FormData();
    if (!audioData.isLink && file) fd.append('file', file);
    fd.append('leadNo',            selectedLead.leadNo);
    fd.append('description',       selectedLead.leadName);
    fd.append('enteredBy',         localStorage.getItem('loggedInUser'));
    fd.append('caseName',          selectedCase.caseName);
    fd.append('caseNo',            selectedCase.caseNo);
    fd.append('leadReturnId',      audioData.leadReturnId);
    fd.append('enteredDate',       new Date().toISOString());
    fd.append('dateAudioRecorded', audioData.dateAudioRecorded);
    fd.append('audioDescription',  audioData.description);
    fd.append('accessLevel',       'Everyone');
    fd.append('isLink',            audioData.isLink);
    if (audioData.isLink) fd.append('link', audioData.link.trim());

    try {
      await api.post('/api/lraudio/upload', fd, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        // Let the browser set the correct multipart/form-data boundary
        transformRequest: [(data, headers) => { delete headers['Content-Type']; return data; }],
      });

      await fetchAudioFiles();
      sessionStorage.removeItem(formKey);
      resetForm();
      showAlert('Audio added successfully!');
    } catch (err) {
      showAlert('Failed to upload audio: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── CRUD: Update ──────────────────────────────────────────────────────────

  /** PUT: update metadata and optionally the file for an existing audio record. */
  const handleUpdateAudio = async () => {
    if (isSubmitting) return;

    const a  = audioFiles[editingId];
    const fd = new FormData();

    setIsSubmitting(true);

    fd.append('leadReturnId',      audioData.leadReturnId);
    fd.append('dateAudioRecorded', audioData.dateAudioRecorded);
    fd.append('audioDescription',  audioData.description);
    fd.append('accessLevel',       'Everyone');
    fd.append('isLink',            audioData.isLink);

    if (audioData.isLink) {
      fd.append('link', audioData.link.trim());
    } else if (file) {
      // Only replace the file when the user explicitly selects a new one
      fd.append('file', file);
    }

    try {
      await api.put(`/api/lraudio/${a.id}`, fd, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        transformRequest: [(data, headers) => { delete headers['Content-Type']; return data; }],
      });

      await fetchAudioFiles();
      sessionStorage.removeItem(formKey);
      resetForm();
      showAlert('Audio updated successfully!');
    } catch (err) {
      showAlert('Failed to update audio: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── CRUD: Edit (populate form) ────────────────────────────────────────────

  /** Populate form fields from a table row to begin editing. */
  const handleEditAudio = useCallback((idx) => {
    const a = audioFiles[idx];
    setEditingId(idx);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setAudioData({
      dateAudioRecorded: new Date(a.rawDateAudioRecorded).toISOString().slice(0, 10),
      leadReturnId:      a.returnId,
      description:       a.description,
      isLink:            a.isLink,
      link:              a.isLink ? a.link : '',
      audioSrc:          a.isLink ? '' : a.audioSrc,
      filename:          a.isLink ? '' : a.originalName,
    });
  }, [audioFiles]);

  // ── CRUD: Delete ──────────────────────────────────────────────────────────

  /** Open the delete-confirmation modal for a given row index. */
  const requestDeleteAudio = useCallback((idx) => {
    setPendingDeleteIndex(idx);
    setDeleteOpen(true);
  }, []);

  const cancelDeleteAudio = useCallback(() => {
    setDeleteOpen(false);
    setPendingDeleteIndex(null);
  }, []);

  /** DELETE: confirmed removal of an audio record. */
  const confirmDeleteAudio = async () => {
    const idx = pendingDeleteIndex;
    setDeleteOpen(false);
    setPendingDeleteIndex(null);
    if (idx == null) return;

    try {
      await api.delete(`/api/lraudio/${audioFiles[idx].id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAudioFiles((prev) => prev.filter((_, i) => i !== idx));
    } catch (err) {
      showAlert('Failed to delete audio: ' + (err.response?.data?.message || err.message));
    }
  };

  // ── CRUD: Access level ────────────────────────────────────────────────────

  /** PUT: update the access level of a single audio record inline. */
  const handleAccessChange = async (idx, newAccessLevel) => {
    const fd = new FormData();
    fd.append('accessLevel', newAccessLevel);

    try {
      await api.put(`/api/lraudio/${audioFiles[idx].id}`, fd, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        transformRequest: [(data, headers) => { delete headers['Content-Type']; return data; }],
      });

      setAudioFiles((prev) => {
        const updated = [...prev];
        updated[idx]  = { ...updated[idx], accessLevel: newAccessLevel };
        return updated;
      });
    } catch {
      showAlert('Could not change access level. Please try again.');
    }
  };

  // ── Report generation ─────────────────────────────────────────────────────

  /**
   * Collect data from all lead return sections, generate a full PDF report
   * via the backend, and navigate to the document viewer.
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

    try {
      const token   = localStorage.getItem('token');
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      const encLead = encodeURIComponent(lead.leadName || lead.description);
      const encCase = encodeURIComponent(kase.caseName);

      // Fetch all lead return sections in parallel; individual failures return empty arrays
      const [
        instrRes, returnsRes, personsRes, vehiclesRes,
        enclosuresRes, evidenceRes, picturesRes,
        audioRes, videosRes, scratchpadRes, timelineRes,
      ] = await Promise.all([
        api.get(`/api/lead/lead/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,            headers).catch(() => ({ data: [] })),
        api.get(`/api/leadReturnResult/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,     headers).catch(() => ({ data: [] })),
        api.get(`/api/lrperson/lrperson/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,   headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvehicle/lrvehicle/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
        api.get(`/api/lrenclosure/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,         headers).catch(() => ({ data: [] })),
        api.get(`/api/lrevidence/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,          headers).catch(() => ({ data: [] })),
        api.get(`/api/lrpicture/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,           headers).catch(() => ({ data: [] })),
        api.get(`/api/lraudio/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,             headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvideo/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,             headers).catch(() => ({ data: [] })),
        api.get(`/api/scratchpad/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,          headers).catch(() => ({ data: [] })),
        api.get(`/api/timeline/${lead.leadNo}/${encLead}/${kase.caseNo}/${encCase}`,            headers).catch(() => ({ data: [] })),
      ]);

      // Enrich media sections with their associated binary files
      const enclosuresWithFiles = await attachFiles(enclosuresRes.data, '_id',       '/api/lrenclosures/files');
      const evidenceWithFiles   = await attachFiles(evidenceRes.data,   '_id',       '/api/lrevidences/files');
      const picturesWithFiles   = await attachFiles(picturesRes.data,   'pictureId', '/api/lrpictures/files');
      const audioWithFiles      = await attachFiles(audioRes.data,      'audioId',   '/api/lraudio/files');
      const videosWithFiles     = await attachFiles(videosRes.data,     'videoId',   '/api/lrvideo/files');

      const leadInstructions = instrRes.data?.[0] || {};
      const leadReturns      = returnsRes.data    || [];

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
        leadPersons:     personsRes.data  || [],
        leadVehicles:    vehiclesRes.data || [],
        leadEnclosures:  enclosuresWithFiles,
        leadEvidence:    evidenceWithFiles,
        leadPictures:    picturesWithFiles,
        leadAudio:       audioWithFiles,
        leadVideos:      videosWithFiles,
        leadScratchpad:  scratchpadRes.data || [],
        leadTimeline:    timelineRes.data   || [],
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
          filename: `Lead_${lead.leadNo || 'report'}.pdf`,
        },
      });
    } catch (err) {
      if (err?.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        showAlert('Error generating PDF:\n' + text);
      } else {
        showAlert('Error generating PDF:\n' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /** Navigate to the interactive ViewLR page (submit/review lead return). */
  const goToViewLR = useCallback(() => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

    if (!lead?.leadNo || !lead?.leadName || !kase?.caseNo || !kase?.caseName) {
      showAlert('Please select a case and lead first.');
      return;
    }
    navigate('/viewLR', { state: { caseDetails: kase, leadDetails: lead } });
  }, [selectedLead, selectedCase, location.state, navigate, showAlert]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.personPage}>
      <Navbar />

      {/* General notification modal */}
      <AlertModal
        isOpen={alertOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={() => setAlertOpen(false)}
      />

      {/* Delete confirmation modal */}
      <AlertModal
        isOpen={deleteOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this audio? This action cannot be undone."
        onConfirm={confirmDeleteAudio}
        onClose={cancelDeleteAudio}
      />

      <div className={styles.LRIContent}>
        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          {/* ── Top navigation bar: page-level actions ── */}
          <div className={styles.topMenuNav}>
            <div className={styles.menuItems}>

              <span
                className={styles.menuItem}
                onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                  if (lead && kase) navigate('/LeadReview', { state: { caseDetails: kase, leadDetails: lead } });
                }}
              >
                Lead Information
              </span>

              <span className={`${styles.menuItem} ${styles.menuItemActive}`}>
                Add Lead Return
              </span>

              {isCaseManager && (
                <span
                  className={styles.menuItem}
                  onClick={handleViewLeadReturn}
                  title={isGenerating ? 'Preparing report…' : 'Manage Lead Return'}
                  style={{ opacity: isGenerating ? 0.6 : 1, pointerEvents: isGenerating ? 'none' : 'auto' }}
                >
                  Manage Lead Return
                </span>
              )}

              {selectedCase?.role === 'Investigator' && (
                <span className={styles.menuItem} onClick={goToViewLR}>
                  {isPrimaryInvestigator ? 'Submit Lead Return' : 'Review Lead Return'}
                </span>
              )}

              <span
                className={styles.menuItem}
                onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                  if (lead && kase) {
                    navigate('/ChainOfCustody', { state: { caseDetails: kase, leadDetails: lead } });
                  } else {
                    showAlert('Please select a case and lead first.');
                  }
                }}
              >
                Lead Chain of Custody
              </span>

            </div>
          </div>

          {/* ── Section tabs navigation ── */}
          <div className={styles.topMenuSections}>
            <div className={`${styles.menuItems} ${styles.menuItemsSecondary}`}>
              {SECTION_TABS.map(({ label, route, active }) => (
                <span
                  key={route}
                  className={`${styles.menuItem} ${active ? styles.menuItemActive : styles.menuItemSecondary}`}
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
                <span className={styles.crumbCurrent} aria-current="page">Lead Audio</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status: ${leadStatusLabel}` : ''}
            </h5>
          </div>

          <div className={styles.caseHeader}>
            <h2>AUDIO INFORMATION</h2>
          </div>

          {/* ── Scrollable content area ── */}
          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* ── Audio entry / edit form ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.enclosureForm}>

                  <div className={styles.formRowPair}>
                    {/* Narrative ID selector */}
                    <div className={styles.formRowEvidence}>
                      <label>Narrative Id*</label>
                      <select
                        value={audioData.leadReturnId}
                        onChange={(e) => handleInputChange('leadReturnId', e.target.value)}
                      >
                        <option value="">Select Id</option>
                        {/* Preserve a stale editing value not yet in the fetched list */}
                        {audioData.leadReturnId && !narrativeIds.includes(normalizeId(audioData.leadReturnId)) && (
                          <option value={audioData.leadReturnId}>{audioData.leadReturnId}</option>
                        )}
                        {narrativeIds.map((id) => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                      </select>
                    </div>

                    {/* Recording date */}
                    <div className={styles.formRowEvidence}>
                      <label>Date Audio Recorded*</label>
                      <input
                        type="date"
                        value={audioData.dateAudioRecorded}
                        onChange={(e) => handleInputChange('dateAudioRecorded', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className={styles.formRowEvidence}>
                    <label>Description*</label>
                    <textarea
                      value={audioData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </div>

                  <div className={styles.formRowPair}>
                    {/* Upload type toggle: file vs. external URL */}
                    <div className={styles.formRowEvidence}>
                      <label>Upload Type</label>
                      <select
                        value={audioData.isLink ? 'link' : 'file'}
                        onChange={(e) =>
                          setAudioData((prev) => ({ ...prev, isLink: e.target.value === 'link', link: '' }))
                        }
                      >
                        <option value="file">File</option>
                        <option value="link">Link</option>
                      </select>
                    </div>

                    {/* Conditional: file picker or URL input */}
                    {audioData.isLink ? (
                      <div className={styles.formRowEvidence}>
                        <label>Paste Link*</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={audioData.link}
                          onChange={(e) => setAudioData((prev) => ({ ...prev, link: e.target.value }))}
                        />
                      </div>
                    ) : (
                      <div className={styles.formRowEvidence}>
                        <label>{isEditing ? 'Replace Audio (optional)' : 'Upload Audio*'}</label>
                        <input
                          type="file"
                          accept="audio/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        {isEditing && audioData.filename && (
                          <div className={styles.currentFilename}>
                            Current File: {audioData.filename}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* ── Form action buttons ── */}
                <div className={styles.formButtonsReturn}>
                  <button
                    className={styles.saveBtn1}
                    disabled={isLeadLocked || isReadOnly || isSubmitting}
                    onClick={isEditing ? handleUpdateAudio : handleAddAudio}
                  >
                    {isSubmitting
                      ? isEditing ? 'Updating…' : 'Adding…'
                      : isEditing ? 'Update Audio' : 'Add Audio'}
                  </button>

                  {isEditing && (
                    <button className={styles.saveBtn1} disabled={isSubmitting} onClick={resetForm}>
                      Cancel
                    </button>
                  )}
                </div>

                {/* ── Inline audio preview gallery (shown only when playable sources exist) ── */}
                {audioFiles.some((a) => a.audioSrc) && (
                  <div className={styles.uploadedAudio}>
                    <div className={styles.audioGallery}>
                      {audioFiles
                        .filter((a) => a.audioSrc)
                        .map((audio, index) => (
                          <div key={index} className={styles.audioCard}>
                            <audio controls>
                              <source src={audio.audioSrc} type="audio/mp3" />
                              Your browser does not support the audio element.
                            </audio>
                            <p>{audio.description}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Audio records table ── */}
              <table className={styles.leadsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '14%' }}>Date Entered</th>
                    <th style={{ width: '12%' }}>Narrative Id</th>
                    <th>File Name</th>
                    <th>Description</th>
                    <th style={{ width: '13%' }}>Actions</th>
                    {isCaseManager && <th style={{ width: '15%' }}>Access</th>}
                  </tr>
                </thead>
                <tbody>
                  {audioFiles.length > 0 ? (
                    audioFiles.map((audio, index) => (
                      <AudioTableRow
                        key={audio.id || index}
                        audio={audio}
                        index={index}
                        isCaseManager={isCaseManager}
                        isReadOnly={isReadOnly}
                        leadStatus={selectedLead?.leadStatus}
                        onEdit={handleEditAudio}
                        onDelete={requestDeleteAudio}
                        onAccessChange={handleAccessChange}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isCaseManager ? 6 : 5} className={styles.emptyRow}>
                        No Audio Data Available
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
