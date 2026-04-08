/**
 * LRVideo.jsx
 *
 * Manages the video sub-section of the Lead Return workflow.
 * Allows investigators to upload video files or provide video links
 * associated with a specific lead narrative (return ID).
 *
 * Features:
 *  - Add / edit / delete video records
 *  - File upload or URL link modes
 *  - Access-level control for Case Managers
 *  - Session storage persistence between navigations
 *  - Read-only enforcement based on lead status
 */

import { useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../../components/Navbar/Navbar';
import { SideBar } from '../../../components/Sidebar/Sidebar';
import { AlertModal } from '../../../components/AlertModal/AlertModal';
import { CaseContext } from '../../CaseContext';
import api from '../../../api';
import { useLeadStatus } from '../../../hooks/useLeadStatus';
import { useLeadReport } from '../useLeadReport';
import { formatDate, normalizeId, alphabetToNumber, isHttpUrl } from '../lrUtils';

// All visual styles are shared — import from the single LR stylesheet
import styles from '../LR.module.css';
import { LRTopMenu } from '../LRTopMenu';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_VIDEO = {
  dateVideoRecorded: '',
  leadReturnId: '',
  description: '',
  isLink: false,
  link: '',
  videoSrc: '',
  filename: '',
  accessLevel: 'Everyone',
};

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
  { label: 'Videos',       route: '/LRVideo',      active: true },
  { label: 'Notes',        route: '/LRScratchpad' },
  { label: 'Timeline',     route: '/LRTimeline' },
];

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns a list of required field labels that are empty or invalid.
 * Used to build a user-facing validation message before submission.
 */
function getMissingVideoFields({ videoData, file, isEditing }) {
  const missing = [];
  if (!videoData.leadReturnId?.trim())      missing.push('Narrative Id');
  if (!videoData.dateVideoRecorded?.trim()) missing.push('Date Video Recorded');
  if (!videoData.description?.trim())       missing.push('Description');
  if (videoData.isLink) {
    if (!isHttpUrl(videoData.link)) missing.push('Link (valid URL)');
  } else if (!isEditing && !file) {
    missing.push('Video File');
  }
  return missing;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LRVideo = () => {
  const navigate     = useNavigate();
  const location     = useLocation();
  const fileInputRef = useRef(null);

  const { selectedCase, selectedLead, leadStatus, setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const { caseDetails, leadDetails } = location.state || {};

  // ── State ──────────────────────────────────────────────────────────────────

  const [videos, setVideos]                         = useState([]);
  const [videoData, setVideoData]                   = useState(DEFAULT_VIDEO);
  const [file, setFile]                             = useState(null);
  const [editingIndex, setEditingIndex]             = useState(null);
  const [narrativeIds, setNarrativeIds]             = useState([]);
  const [leadData, setLeadData]                     = useState({});
  const [isSubmitting, setIsSubmitting]             = useState(false);
  const [alertOpen, setAlertOpen]                   = useState(false);
  const [alertMessage, setAlertMessage]             = useState('');
  const [deleteOpen, setDeleteOpen]                 = useState(false);
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
    const cn   = selectedCase?.caseNo    ?? 'NA';
    const cNam = encodeURIComponent(selectedCase?.caseName  ?? 'NA');
    const ln   = selectedLead?.leadNo    ?? 'NA';
    const lNam = encodeURIComponent(selectedLead?.leadName  ?? 'NA');
    return {
      formKey: `LRVideo:form:${cn}:${cNam}:${ln}:${lNam}`,
      listKey: `LRVideo:list:${cn}:${cNam}:${ln}:${lNam}`,
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
    setVideoData(savedForm ? JSON.parse(savedForm) : DEFAULT_VIDEO);
    const savedList = sessionStorage.getItem(listKey);
    setVideos(savedList ? JSON.parse(savedList) : []);
    setEditingIndex(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [formKey, listKey]);

  // Persist form state on every change so navigation doesn't lose data
  useEffect(() => { sessionStorage.setItem(formKey, JSON.stringify(videoData)); }, [formKey, videoData]);
  useEffect(() => { sessionStorage.setItem(listKey, JSON.stringify(videos)); },   [listKey, videos]);

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
        setVideoData(prev =>
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

  // ── Fetch videos from the API, applying access-level filtering ─────────────

  const fetchVideos = useCallback(async () => {
    const caseId  = selectedCase?._id || selectedCase?.id;
    const encLead = encodeURIComponent(selectedLead?.leadName);

    try {
      const { data } = await api.get(
        `/api/lrvideo/${selectedLead.leadNo}/${encLead}/${caseId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const mapped = data.map(v => ({
        id:                   v._id,
        dateEntered:          formatDate(v.enteredDate),
        returnId:             v.leadReturnId,
        dateVideoRecorded:    formatDate(v.dateVideoRecorded),
        rawDateVideoRecorded: v.dateVideoRecorded,
        description:          v.videoDescription,
        filename:             v.filename,
        originalName:         v.originalName || '',
        videoSrc:             v.isLink ? v.link : v.signedUrl,
        signedUrl:            v.signedUrl || '',
        link:                 v.link || '',
        isLink:               v.isLink,
        accessLevel:          v.accessLevel || 'Everyone',
        enteredBy:            v.enteredBy,
        enteredByUserId:      v.enteredByUserId ? String(v.enteredByUserId) : null,
      }));

      let visible = mapped;
      if (!isCaseManager) {
        const currentUserId = signedInUserId;
        const currentUser   = signedInOfficer?.trim();
        const leadAssigneeUserIds = (leadData?.assignedTo || [])
          .map(a => (typeof a === 'object' && a !== null ? String(a.userId || '') : ''))
          .filter(Boolean);
        const leadAssigneeUsernames = (leadData?.assignedTo || [])
          .map(a => (typeof a === 'object' && a !== null ? (a.username || '') : String(a ?? '')).trim());
        visible = mapped.filter(v => {
          if (v.accessLevel === 'Everyone') return true;
          if (v.accessLevel === 'Case Manager and Assignees') {
            return currentUserId
              ? leadAssigneeUserIds.includes(currentUserId)
              : leadAssigneeUsernames.includes(currentUser);
          }
          return false;
        });
      }

      setVideos(visible);
    } catch (err) {
      console.error('Error fetching videos:', err);
    }
  }, [selectedLead, selectedCase, isCaseManager, signedInOfficer, leadData?.assignedTo]);

  useEffect(() => {
    if (selectedLead?.leadNo && selectedLead?.leadName && (selectedCase?._id || selectedCase?.id)) {
      fetchVideos();
    }
  }, [selectedLead, selectedCase, fetchVideos]);

  // ── Form field handler ─────────────────────────────────────────────────────

  const handleInputChange = useCallback((field, value) => {
    setVideoData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setVideoData(prev => ({
        ...prev,
        videoSrc: URL.createObjectURL(selected),
        filename: selected.name,
      }));
    }
  };

  /** Resets the entry form to its default state and clears any edit context. */
  const resetForm = () => {
    setEditingIndex(null);
    setVideoData(DEFAULT_VIDEO);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Add new video ──────────────────────────────────────────────────────────

  const handleAddVideo = async () => {
    if (isSubmitting) return;

    const missing = getMissingVideoFields({ videoData, file, isEditing: false });
    if (missing.length) {
      setAlertMessage(
        `Please fill the required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`
      );
      setAlertOpen(true);
      return;
    }

    const fd = new FormData();
    fd.append('leadNo',           selectedLead.leadNo);
    fd.append('description',      selectedLead.leadName);
    fd.append('enteredBy',        localStorage.getItem('loggedInUser'));
    fd.append('enteredByUserId',  localStorage.getItem('userId'));
    fd.append('caseName',         selectedCase.caseName);
    fd.append('caseNo',           selectedCase.caseNo);
    fd.append('leadReturnId',     videoData.leadReturnId);
    fd.append('enteredDate',      new Date().toISOString());
    fd.append('dateVideoRecorded', videoData.dateVideoRecorded);
    fd.append('videoDescription', videoData.description);
    fd.append('accessLevel',      'Everyone');
    fd.append('isLink',           videoData.isLink);

    if (videoData.isLink) {
      fd.append('link', videoData.link.trim());
    } else if (file) {
      fd.append('file', file);
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/lrvideo/upload', fd, {
        headers: { Authorization: `Bearer ${token}` },
        // Remove Content-Type so the browser sets the correct multipart boundary
        transformRequest: [(data, headers) => { delete headers['Content-Type']; return data; }],
      });
      await fetchVideos();
      sessionStorage.removeItem(formKey);
      resetForm();
    } catch (err) {
      setAlertMessage(err?.response?.data?.message || err?.message || 'Failed to upload video.');
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit / update existing video ───────────────────────────────────────────

  const handleEditVideo = (idx) => {
    const v = videos[idx];
    setEditingIndex(idx);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFile(null);
    setVideoData({
      dateVideoRecorded: new Date(v.rawDateVideoRecorded).toISOString().slice(0, 10),
      leadReturnId:      v.returnId,
      description:       v.description,
      isLink:            v.isLink,
      link:              v.isLink ? v.link : '',
      videoSrc:          v.isLink ? '' : v.videoSrc,
      filename:          v.isLink ? '' : v.originalName,
    });
  };

  const handleUpdateVideo = async () => {
    if (isSubmitting || editingIndex === null) return;

    if (videoData.isLink && !videoData.link.trim()) {
      setAlertMessage('Please enter a valid link.');
      setAlertOpen(true);
      return;
    }

    const v  = videos[editingIndex];
    const fd = new FormData();
    fd.append('leadReturnId',      videoData.leadReturnId);
    fd.append('dateVideoRecorded', videoData.dateVideoRecorded);
    fd.append('videoDescription',  videoData.description);
    fd.append('accessLevel',       'Everyone');
    fd.append('isLink',            videoData.isLink);

    if (videoData.isLink) {
      fd.append('link', videoData.link.trim());
    } else if (file) {
      fd.append('file', file);
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await api.put(`/api/lrvideo/${v.id}`, fd, {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: [(data, headers) => { delete headers['Content-Type']; return data; }],
      });
      await fetchVideos();
      sessionStorage.removeItem(formKey);
      resetForm();
    } catch (err) {
      console.error('Error updating video:', err);
      setAlertMessage('Failed to update video: ' + (err.response?.data?.message || err.message));
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete video (guarded by a confirmation modal) ─────────────────────────

  const requestDeleteVideo = (idx) => { setPendingDeleteIndex(idx); setDeleteOpen(true); };
  const cancelDeleteVideo  = ()    => { setDeleteOpen(false); setPendingDeleteIndex(null); };

  const confirmDeleteVideo = async () => {
    const idx = pendingDeleteIndex;
    setDeleteOpen(false);
    setPendingDeleteIndex(null);
    if (idx == null) return;

    try {
      await api.delete(`/api/lrvideo/${videos[idx].id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setVideos(prev => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error('Error deleting video:', err);
      setAlertMessage('Failed to delete video: ' + (err.response?.data?.message || err.message));
      setAlertOpen(true);
    }
  };

  // ── Access-level change (Case Manager only) ────────────────────────────────

  const handleAccessChange = async (idx, newAccessLevel) => {
    const video = videos[idx];
    const fd    = new FormData();
    fd.append('accessLevel', newAccessLevel);

    try {
      await api.put(`/api/lrvideo/${video.id}`, fd, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        transformRequest: [(data, headers) => { delete headers['Content-Type']; return data; }],
      });
      setVideos(prev => {
        const copy = [...prev];
        copy[idx]  = { ...copy[idx], accessLevel: newAccessLevel };
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
    <div className={styles.evidencePage}>
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
        isOpen={deleteOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this video? This action cannot be undone."
        onConfirm={confirmDeleteVideo}
        onClose={cancelDeleteVideo}
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
                <span className={styles.crumbCurrent} aria-current="page">Lead Videos</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status: ${status}` : leadStatus}
            </h5>
          </div>

          {/* ── Page heading ── */}
          <div className={styles.caseHeader}>
            <h2>VIDEO INFORMATION</h2>
          </div>

          {/* ── Main scrollable content area ── */}
          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* ── Video entry form ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Video Entry</div>
                <div className={styles.LREnteringContentBox}>
                  <div className={styles.evidenceForm}>

                    {/* Row 1: Narrative ID + Date Video Recorded */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>Narrative Id*</label>
                        <select
                          value={videoData.leadReturnId}
                          onChange={e => handleInputChange('leadReturnId', e.target.value)}
                        >
                          <option value="">Select Id</option>
                          {/* Keep the current value visible even if absent from the latest API list (edit/legacy) */}
                          {videoData.leadReturnId &&
                            !narrativeIds.includes(normalizeId(videoData.leadReturnId)) && (
                              <option value={videoData.leadReturnId}>{videoData.leadReturnId}</option>
                            )}
                          {narrativeIds.map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formRowEvidence}>
                        <label>Date Video Recorded*</label>
                        <input
                          type="date"
                          value={videoData.dateVideoRecorded}
                          onChange={e => handleInputChange('dateVideoRecorded', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 2: Description */}
                    <div className={styles.formRowEvidence}>
                      <label>Description*</label>
                      <textarea
                        value={videoData.description}
                        onChange={e => handleInputChange('description', e.target.value)}
                      />
                    </div>

                    {/* Row 3: File type toggle + file upload or URL link input */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>File Type</label>
                        <select
                          value={videoData.isLink ? 'link' : 'file'}
                          onChange={e =>
                            setVideoData(prev => ({
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

                      <div className={styles.formRowEvidence}>
                        {videoData.isLink ? (
                          <>
                            <label>Paste Link*</label>
                            <input
                              type="text"
                              placeholder="https://..."
                              value={videoData.link}
                              onChange={e => setVideoData(prev => ({ ...prev, link: e.target.value }))}
                            />
                          </>
                        ) : (
                          <>
                            <div className={styles.uploadLabelRow}>
                              <label>Upload Video</label>
                              {isEditing && videoData.filename && (
                                <span className={styles.currentFilenameInline}>{videoData.filename}</span>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="video/*"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                            />
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Form action buttons */}
                  <div className={styles.formButtonsReturn}>
                    <button
                      disabled={isFormDisabled || isSubmitting}
                      className={styles.saveBtn1}
                      onClick={isEditing ? handleUpdateVideo : handleAddVideo}
                    >
                      {isSubmitting
                        ? (isEditing ? 'Updating...' : 'Adding...')
                        : (isEditing ? 'Update' : 'Add Video')}
                    </button>

                    {isEditing && (
                      <button
                        className={styles.cancelBtn}
                        disabled={isSubmitting}
                        onClick={resetForm}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Video history table ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Video History</div>
                <table className={styles.leadsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>Id</th>
                      <th style={{ width: '8%' }}>Date</th>
                      <th style={{ width: '12%' }}>Entered By</th>
                      <th style={{ width: '23%' }}>Description</th>
                      <th style={{ width: '18%' }}>File Link</th>
                      <th style={{ width: '10%' }}>Actions</th>
                      {isCaseManager && <th style={{ width: '15%' }}>Access</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {videos.length > 0 ? videos.map((video, idx) => {
                      const canModify  = isCaseManager || (video.enteredByUserId && signedInUserId
                        ? video.enteredByUserId === signedInUserId
                        : video.enteredBy?.trim() === signedInOfficer?.trim());
                      const isExpanded = expandedRows.has(idx);
                      return (
                      <tr key={video.id || idx}>
                        <td>{video.returnId}</td>
                        <td>{video.dateEntered}</td>
                        <td>{video.enteredBy}</td>
                        <td className={styles.descriptionCell}>
                          <div className={isExpanded ? styles.narrativeContentExpanded : styles.narrativeContentCollapsed}>
                            {video.description}
                          </div>
                          {video.description && (
                            <button className={styles.viewToggleBtn} onClick={() => toggleRowExpand(idx)}>
                              {isExpanded ? 'View Less ▲' : 'View ▶'}
                            </button>
                          )}
                        </td>
                        <td>
                          {/* Render either a direct URL link or a signed S3 URL */}
                          {video.isLink ? (
                            <a
                              href={video.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.linkButton}
                            >
                              {video.link}
                            </a>
                          ) : video.signedUrl ? (
                            <a
                              href={video.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.linkButton}
                            >
                              {video.originalName || video.filename || ''}
                            </a>
                          ) : (
                            <span className={styles.noFile}>No file</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.lrTableBtn}>
                            <button
                              disabled={isFormDisabled || !canModify}
                              onClick={() => handleEditVideo(idx)}
                            >
                              <img
                                src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                alt="Edit"
                                className={styles.editIcon}
                              />
                            </button>
                            <button
                              disabled={isFormDisabled || !canModify}
                              onClick={() => requestDeleteVideo(idx)}
                            >
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
                              value={video.accessLevel}
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
                        <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign: 'center' }}>
                          No Video Data Available
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
