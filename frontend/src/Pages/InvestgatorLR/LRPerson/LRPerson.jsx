/**
 * LRPerson.jsx
 *
 * Lead Persons Details page — displays all person records associated with
 * a specific lead. Investigators can view, edit, and delete entries they
 * own. Case managers additionally control access levels per record and
 * can generate a full lead report as a PDF.
 */
import { useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CaseContext } from '../../CaseContext';
import PersonModal from '../../../components/PersonModal/PersonModel';
import Navbar from '../../../components/Navbar/Navbar';
import styles from './LRPerson.module.css';
import api from '../../../api';
import { SideBar } from '../../../components/Sidebar/Sidebar';
import { AlertModal } from '../../../components/AlertModal/AlertModal';
import { useLeadStatus } from '../../../hooks/useLeadStatus';

// ─── Module-level utilities ───────────────────────────────────────────────────

/**
 * Fetches attached files for each item in a collection and merges them
 * into the item as a `files` array. Used when assembling the full report payload.
 *
 * @param {object[]} items         - Array of records to enrich
 * @param {string}   idFieldName   - Field on each item that holds its file-lookup ID
 * @param {string}   filesEndpoint - API base path for fetching files
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

/**
 * Maps a raw LRPerson API document to the flat display shape used by the table.
 * Formatting (dates, full name, fallback values) is handled here so the
 * component's render stays clean.
 */
const mapPersonToRow = (person) => ({
  _id:          person._id,
  returnId:     person.leadReturnId,
  dateEntered:  new Date(person.enteredDate).toLocaleDateString(),
  name:         `${person.firstName} ${person.lastName}`,
  phoneNo:      person.cellNumber || 'N/A',
  address:      person.address?.street1
    ? `${person.address.street1}, ${person.address.city || ''}, ${person.address.state || ''}`
    : '',
  leadReturnId: person.leadReturnId,
  accessLevel:  person.accessLevel || 'Everyone',
  enteredBy:    person.enteredBy,
  photoUrl:     person.photoUrl || null,
});

/** Section-tab definitions; used to render the second menu bar declaratively. */
const SECTION_TABS = [
  { label: 'Instructions', route: '/LRInstruction' },
  { label: 'Narrative',    route: '/LRReturn' },
  { label: 'Person',       route: '/LRPerson',     active: true },
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

export const LRPerson = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Context & router state ─────────────────────────────────────────────────
  const { leadDetails, caseDetails } = location.state || {};
  const {
    selectedCase,
    selectedLead,
    setSelectedCase,
    setSelectedLead,
    setLeadPersons,
  } = useContext(CaseContext);

  // ─── Derived values ─────────────────────────────────────────────────────────
  const isCaseManager =
    selectedCase?.role === 'Case Manager' || selectedCase?.role === 'Detective Supervisor';

  const signedInOfficer = localStorage.getItem('loggedInUser');

  // ─── Lead status / read-only hook ───────────────────────────────────────────
  const { status, isReadOnly } = useLeadStatus({
    caseNo:   selectedCase?.caseNo,
    caseName: selectedCase?.caseName,
    leadNo:   selectedLead?.leadNo,
    leadName: selectedLead?.leadName,
  });

  // ─── Local state ────────────────────────────────────────────────────────────
  const [persons,     setPersons]     = useState([]);
  const [rawPersons,  setRawPersons]  = useState([]);
  const [leadData,    setLeadData]    = useState({});
  const [selectedRow, setSelectedRow] = useState(null);

  // Person detail modal
  const [showPersonModal,  setShowPersonModal]  = useState(false);
  const [personModalData,  setPersonModalData]  = useState({
    leadNo: '', description: '', caseNo: '', caseName: '', leadReturnId: '',
  });

  // Alert and confirmation modals
  const [alertOpen,          setAlertOpen]          = useState(false);
  const [alertMessage,       setAlertMessage]        = useState('');
  const [confirmOpen,        setConfirmOpen]          = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex]   = useState(null);

  // Report generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // ─── Derived investigator-role values ───────────────────────────────────────
  const primaryUsername = leadData?.primaryInvestigator || leadData?.primaryOfficer || '';
  const isPrimaryInvestigator =
    selectedCase?.role === 'Investigator' && !!signedInOfficer && signedInOfficer === primaryUsername;

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Show a notification alert modal. */
  const showAlert = useCallback((msg) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  }, []);

  /**
   * Filters a mapped persons array based on the current user's role and
   * each record's access level. Case managers see all records.
   */
  const applyAccessFilter = useCallback(
    (mapped) => {
      if (isCaseManager) return mapped;
      const currentUser   = localStorage.getItem('loggedInUser')?.trim();
      const leadAssignees = (leadData?.assignedTo || []).map((a) => a?.trim());

      return mapped.filter((p) => {
        if (p.accessLevel === 'Everyone') return true;
        if (p.accessLevel === 'Case Manager and Assignees') {
          return leadAssignees.some((a) => a === currentUser);
        }
        return false; // 'Case Manager' only — hidden from investigators
      });
    },
    [isCaseManager, leadData?.assignedTo]
  );

  // ─── Effects ─────────────────────────────────────────────────────────────────

  // Sync context if the page was reached via deep-link with router state
  useEffect(() => {
    if (caseDetails && leadDetails) {
      setSelectedCase(caseDetails);
      setSelectedLead(leadDetails);
    }
  }, [caseDetails, leadDetails]);

  /**
   * Fetch lead metadata (assignees, primary investigator, current status).
   * Used to derive access-filtering and role-based UI visibility.
   */
  useEffect(() => {
    if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;

    const fetchLeadData = async () => {
      const token = localStorage.getItem('token');
      try {
        const { data } = await api.get(
          `/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.length > 0) {
          setLeadData({ ...data[0], assignedTo: data[0].assignedTo || [], leadStatus: data[0].leadStatus || '' });
        }
      } catch (err) {
        console.error('Failed to fetch lead data:', err);
      }
    };

    fetchLeadData();
  }, [selectedLead, selectedCase]);

  /**
   * Fetch all person records for the current lead from the API.
   * Maps raw API documents to the display shape and applies access filtering.
   * Wrapped in useCallback so it can be safely listed in the fetch trigger effect's deps.
   */
  const fetchPersons = useCallback(async () => {
    if (!selectedCase?.caseNo || !selectedCase?.caseName || !selectedLead?.leadNo || !selectedLead?.leadName) return;

    const token   = localStorage.getItem('token');
    const encLead = encodeURIComponent(selectedLead.leadName);
    const encCase = encodeURIComponent(selectedCase.caseName);

    try {
      const { data } = await api.get(
        `/api/lrperson/lrperson/${selectedLead.leadNo}/${encLead}/${selectedCase.caseNo}/${encCase}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRawPersons(data);
      setPersons(applyAccessFilter(data.map(mapPersonToRow)));
      setLeadPersons(data);
    } catch (err) {
      console.error('Error fetching person records:', err);
    }
  }, [selectedCase, selectedLead, applyAccessFilter, setLeadPersons]);

  // Trigger person fetch when case/lead selection changes
  useEffect(() => {
    if (selectedCase?.caseNo && selectedCase?.caseName && selectedLead?.leadNo && selectedLead?.leadName) {
      fetchPersons();
    }
  }, [selectedCase, selectedLead, fetchPersons]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  /** Open the person detail modal for the selected row. */
  const openPersonModal = (leadNo, description, caseNo, caseName, leadReturnId) => {
    setPersonModalData({ leadNo, description, caseNo, caseName, leadReturnId });
    setShowPersonModal(true);
  };

  const closePersonModal = () => setShowPersonModal(false);

  /** Navigate to the edit form (LRPerson1) for the selected person. */
  const handleEditPerson = (idx) => {
    const vis    = persons[idx];
    const person = rawPersons.find((r) => r._id === vis._id);
    if (!person) {
      showAlert('Could not find person record to edit.');
      return;
    }
    const lead = selectedLead?.leadNo ? selectedLead : leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : caseDetails;
    navigate('/LRPerson1', { state: { caseDetails: kase, leadDetails: lead, person } });
  };

  /** Open the deletion confirmation modal. */
  const requestDeletePerson = (idx) => {
    setPendingDeleteIndex(idx);
    setConfirmOpen(true);
  };

  /**
   * Confirmed deletion: remove the person from the API then update local state,
   * re-mapping from the raw list to keep display and raw lists in sync.
   */
  const performDeletePerson = async () => {
    if (pendingDeleteIndex == null) return;
    try {
      const vis      = persons[pendingDeleteIndex];
      const rawIndex = rawPersons.findIndex((r) => r._id === vis._id);
      if (rawIndex < 0) throw new Error("Couldn't resolve the selected person in the raw list.");

      const token = localStorage.getItem('token');
      await api.delete(`/api/lrperson/id/${rawPersons[rawIndex]._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newRaw = rawPersons.filter((_, i) => i !== rawIndex);
      setRawPersons(newRaw);
      setPersons(applyAccessFilter(newRaw.map(mapPersonToRow)));
    } catch (err) {
      console.error('Delete failed:', err);
      showAlert('Failed to delete person.');
    } finally {
      setConfirmOpen(false);
      setPendingDeleteIndex(null);
    }
  };

  /**
   * Persist an updated access level for a person entry (case managers only).
   * Swaps the updated document into both rawPersons and the visible persons list.
   */
  const handleAccessChange = async (idx, newAccess) => {
    const vis      = persons[idx];
    const rawIndex = rawPersons.findIndex((r) => r._id === vis._id);
    if (rawIndex < 0) { showAlert('Could not find person record.'); return; }

    const p     = rawPersons[rawIndex];
    const token = localStorage.getItem('token');

    try {
      const { data: updatedDoc } = await api.put(
        `/api/lrperson/${selectedLead.leadNo}/${selectedCase.caseNo}/${p.leadReturnId}/${p.firstName}`,
        { accessLevel: newAccess },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newRaw = rawPersons.map((r, i) => (i === rawIndex ? updatedDoc : r));
      setRawPersons(newRaw);
      setPersons(applyAccessFilter(newRaw.map(mapPersonToRow)));
    } catch (err) {
      console.error('Failed to update access level:', err);
      showAlert('Could not change access level. Please try again.');
    }
  };

  /**
   * Navigate to either Submit or Review Lead Return (ViewLR).
   * Primary investigators submit; all others review.
   */
  const goToViewLR = () => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
    if (!lead?.leadNo || !lead?.leadName || !kase?.caseNo || !kase?.caseName) {
      showAlert('Please select a case and lead first.');
      return;
    }
    navigate('/viewLR', { state: { caseDetails: kase, leadDetails: lead } });
  };

  /**
   * Generate a full lead report as a PDF blob and navigate to the document viewer.
   * All lead data sections are fetched in parallel; media sections also have their
   * attached files fetched before the report payload is assembled.
   */
  const handleViewLeadReturn = async () => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

    if (!lead?.leadNo || !(lead.leadName || lead.description) || !kase?.caseNo || !kase?.caseName) {
      showAlert('Please select a case and lead first.');
      return;
    }
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      const token   = localStorage.getItem('token');
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      const { leadNo }             = lead;
      const leadName               = lead.leadName || lead.description;
      const { caseNo, caseName }   = kase;
      const encLead = encodeURIComponent(leadName);
      const encCase = encodeURIComponent(caseName);

      // Fetch all lead data sections in parallel
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
        user:            localStorage.getItem('loggedInUser') || '',
        reportTimestamp: new Date().toISOString(),
        leadInstruction: leadInstructions,
        leadReturn:      leadReturns,
        leadPersons:     personsRes.data   || [],
        leadVehicles:    vehiclesRes.data  || [],
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

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.personPage}>
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
        onConfirm={performDeletePerson}
        onClose={() => { setConfirmOpen(false); setPendingDeleteIndex(null); }}
      />

      <div className={styles.LRIContent}>
        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          {/* ── Page-level navigation bar ──────────────────────────────────── */}
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

              {/* Case Manager / Supervisor: generate full report */}
              {isCaseManager && (
                <span
                  className={`${styles.menuItem} ${isGenerating ? styles.menuItemDisabled : ''}`}
                  onClick={handleViewLeadReturn}
                  title={isGenerating ? 'Preparing report…' : 'View Lead Return'}
                >
                  Manage Lead Return
                </span>
              )}

              {/* Primary investigator: can submit */}
              {selectedCase?.role === 'Investigator' && isPrimaryInvestigator && (
                <span className={styles.menuItem} onClick={goToViewLR}>
                  Submit Lead Return
                </span>
              )}

              {/* Secondary investigator: review only */}
              {selectedCase?.role === 'Investigator' && !isPrimaryInvestigator && (
                <span className={styles.menuItem} onClick={goToViewLR}>
                  Review Lead Return
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

          {/* ── Section tabs navigation ─────────────────────────────────────── */}
          <div className={styles.topMenuSections}>
            <div className={`${styles.menuItems} ${styles.sectionMenuItems}`}>
              {SECTION_TABS.map(({ label, route, active }) => (
                <span
                  key={route}
                  className={`${styles.menuItem} ${active ? styles.menuItemActive : styles.menuItemInactive}`}
                  onClick={() => navigate(route)}
                >
                  {label}
                </span>
              ))}
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
                  Case: {selectedCase?.caseNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <Link to="/LeadReview" state={{ leadDetails: selectedLead }} className={styles.crumb}>
                  Lead: {selectedLead?.leadNo || ''}
                </Link>
                <span className={styles.sep}>{' >> '}</span>
                <span className={styles.crumbCurrent} aria-current="page">Lead Persons</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status: ${status}` : status}
            </h5>
          </div>

          {/* ── Page heading ───────────────────────────────────────────────── */}
          <div className={styles.caseHeader}>
            <h2>LEAD PERSONS DETAILS</h2>
          </div>

          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* ── Persons table ─────────────────────────────────────────── */}
              <table className={styles.leadsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '9%' }}>Date</th>
                    <th style={{ width: '9%' }}>Id</th>
                    <th style={{ width: '12%' }}>Name</th>
                    <th style={{ width: '12%' }}>Phone No</th>
                    <th style={{ width: '9%' }}>More</th>
                    <th style={{ width: '9%' }}>Actions</th>
                    {isCaseManager && <th style={{ width: '15%', fontSize: '20px' }}>Access</th>}
                  </tr>
                </thead>
                <tbody>
                  {persons.length > 0 ? (
                    persons.map((person, index) => {
                      const canModify = person.enteredBy?.trim() === signedInOfficer?.trim();
                      const disableActions =
                        selectedLead?.leadStatus === 'In Review' ||
                        selectedLead?.leadStatus === 'Completed' ||
                        selectedLead?.leadStatus === 'Closed' ||
                        isReadOnly ||
                        !canModify;

                      return (
                        <tr
                          key={person._id || index}
                          className={selectedRow === index ? styles.selectedRow : ''}
                          onClick={() => setSelectedRow(index)}
                        >
                          <td>{person.dateEntered}</td>
                          <td>{person.returnId}</td>
                          <td>{person.name}</td>
                          <td>{person.phoneNo}</td>
                          <td>
                            <button
                              className={styles.viewPersonBtn}
                              onClick={() =>
                                openPersonModal(
                                  selectedLead.leadNo,
                                  selectedLead.leadName,
                                  selectedCase.caseNo,
                                  selectedCase.caseName,
                                  person.leadReturnId
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                          <td>
                            <div className={styles.lrTableBtn}>
                              <button onClick={() => handleEditPerson(index)} disabled={disableActions}>
                                <img
                                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                  alt="Edit"
                                  className={styles.editIcon}
                                />
                              </button>
                              <button onClick={() => requestDeletePerson(index)} disabled={disableActions}>
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
                                value={person.accessLevel}
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
                      <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign: 'center' }}>
                        No Details Available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Person detail modal */}
              <PersonModal
                isOpen={showPersonModal}
                onClose={closePersonModal}
                leadNo={personModalData.leadNo}
                description={personModalData.description}
                caseNo={personModalData.caseNo}
                caseName={personModalData.caseName}
                leadReturnId={personModalData.leadReturnId}
              />

              {/* Add person button */}
              <div className={styles.bottomButtons}>
                <button
                  className={styles.saveBtn1}
                  disabled={
                    selectedLead?.leadStatus === 'In Review' ||
                    selectedLead?.leadStatus === 'Completed' ||
                    selectedLead?.leadStatus === 'Closed' ||
                    isReadOnly
                  }
                  onClick={() => navigate('/LRPerson1')}
                >
                  Add Person
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
