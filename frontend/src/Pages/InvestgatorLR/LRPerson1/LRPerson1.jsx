/**
 * LRPerson1 – Add / Edit Person Record for a Lead Return
 *
 * Allows investigators to create or update a person record associated with a
 * specific Lead Return. Supports photo upload, miscellaneous key-value data,
 * and session-persisted form state so in-page navigation doesn't lose data.
 */
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Navbar from '../../../components/Navbar/Navbar';
import styles from './LRPerson1.module.css';
import { CaseContext } from '../../CaseContext';
import api from '../../../api';
import { SideBar } from '../../../components/Sidebar/Sidebar';
import { AlertModal } from '../../../components/AlertModal/AlertModal';

// ─── Session-storage keys for form persistence across in-page navigation ─────
const FORM_KEY = 'LRPerson1:form';
const MISC_KEY = 'LRPerson1:misc';

// ─── Converts letter-based IDs (A, B, …, AA, AB) to a sort number ────────────
const alphabetToNumber = (str) => {
  if (!str) return 0;
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * 26 + (str.charCodeAt(i) - 64); // 'A' = 65
  }
  return result;
};

/**
 * Fetches and attaches file arrays to each item in a list.
 * Used when building the full lead-return PDF report.
 */
const attachFiles = async (items, idFieldName, filesEndpoint) => {
  const token = localStorage.getItem('token');
  return Promise.all(
    (items || []).map(async (item) => {
      const id = item[idFieldName];
      if (!id) return { ...item, files: [] };
      try {
        const { data } = await api.get(`${filesEndpoint}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return { ...item, files: data };
      } catch (err) {
        console.error(`Error fetching files for ${filesEndpoint}/${id}:`, err);
        return { ...item, files: [] };
      }
    })
  );
};

/** Returns a blank form state with today as the default entry date. */
const buildEmptyForm = (todayISO) => ({
  dateEntered: todayISO,
  leadReturnId: '',
  lastName: '', firstName: '', mi: '', suffix: '',
  cellNumber: '', alias: '', businessName: '',
  street1: '', street2: '', building: '', apartment: '',
  city: '', state: '', zipCode: '',
  age: '', ssn: '', occupation: '', email: '',
  personType: '', condition: '', cautionType: '',
  sex: '', race: '', ethnicity: '', skinTone: '',
  eyeColor: '', glasses: '', hairColor: '',
  tattoo: '', scar: '', mark: '',
  heightFt: '', heightIn: '', weight: '',
});

/** Returns a form state pre-filled from an existing person record (edit mode). */
const buildFormFromPerson = (person) => ({
  dateEntered:  person?.enteredDate?.slice(0, 10) || '',
  leadReturnId: person?.leadReturnId              || '',
  lastName:     person?.lastName                  || '',
  firstName:    person?.firstName                 || '',
  mi:           person?.middleInitial             || '',
  suffix:       person?.suffix                    || '',
  cellNumber:   person?.cellNumber                || '',
  alias:        person?.alias                     || '',
  businessName: person?.businessName              || '',
  street1:      person?.address?.street1          || '',
  street2:      person?.address?.street2          || '',
  building:     person?.address?.building         || '',
  apartment:    person?.address?.apartment        || '',
  city:         person?.address?.city             || '',
  state:        person?.address?.state            || '',
  zipCode:      person?.address?.zipCode          || '',
  age:          person?.age                       || '',
  ssn:          person?.ssn                       || '',
  occupation:   person?.occupation                || '',
  email:        person?.email                     || '',
  personType:   person?.personType                || '',
  condition:    person?.condition                 || '',
  cautionType:  person?.cautionType               || '',
  sex:          person?.sex                       || '',
  race:         person?.race                      || '',
  ethnicity:    person?.ethnicity                 || '',
  skinTone:     person?.skinTone                  || '',
  eyeColor:     person?.eyeColor                  || '',
  glasses:      person?.glasses                   || '',
  hairColor:    person?.hairColor                 || '',
  tattoo:       person?.tattoo                    || '',
  scar:         person?.scar                      || '',
  mark:         person?.mark                      || '',
  heightFt:     person?.height?.feet    != null ? String(person.height.feet)   : '',
  heightIn:     person?.height?.inches  != null ? String(person.height.inches) : '',
  weight:       person?.weight          != null ? String(person.weight)         : '',
});

/**
 * Returns true if the form has at least one meaningful field filled in,
 * preventing empty records from being saved.
 */
const isPersonRecordValid = (data) => {
  const fields = [
    'firstName', 'lastName', 'alias', 'businessName', 'personType',
    'street1', 'street2', 'building', 'apartment', 'city', 'state', 'zipCode',
    'sex', 'race', 'ethnicity', 'skinTone', 'eyeColor', 'glasses', 'hairColor',
    'tattoo', 'scar', 'mark', 'cellNumber', 'email',
  ];
  return fields.some((field) => data[field]?.trim());
};

// ─── Sub-component: Photo upload / preview widget ─────────────────────────────
const PhotoUpload = ({ preview, onFileChange, onRemove }) =>
  preview ? (
    <div className={styles.photoPreviewWrapper}>
      <img src={preview} alt="Person preview" className={styles.photoPreviewImg} />
      <button
        type="button"
        className={styles.photoRemoveBtn}
        onClick={onRemove}
        title="Remove photo"
      >
        &times;
      </button>
    </div>
  ) : (
    <input
      type="file"
      accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
      onChange={onFileChange}
    />
  );

// ─── Sub-component: Miscellaneous key-value additional data table ─────────────
const MiscDetailsTable = ({ rows, onRowChange, onAddRow }) => (
  <tr>
    <td colSpan="4">
      <h4>Miscellaneous Information</h4>
      <table className={styles.miscTable}>
        <thead>
          <tr>
            <th>Category</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>
                <input
                  type="text"
                  placeholder="Category"
                  value={row.category}
                  onChange={(e) => onRowChange(i, 'category', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  placeholder="Value"
                  value={row.value}
                  onChange={(e) => onRowChange(i, 'value', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className={styles.saveBtn} onClick={onAddRow}>
        + Add Category / Value
      </button>
    </td>
  </tr>
);

// ─── Section tab definitions for the LR sub-navigation bar ──────────────────
const SECTION_TABS_BEFORE = [
  { label: 'Instructions', route: '/LRInstruction' },
  { label: 'Narrative',    route: '/LRReturn' },
  { label: 'Person',       route: '/LRPerson' },
];
const SECTION_TABS_AFTER = [
  { label: 'Vehicles',   route: '/LRVehicle' },
  { label: 'Enclosures', route: '/LREnclosures' },
  { label: 'Evidence',   route: '/LREvidence' },
  { label: 'Pictures',   route: '/LRPictures' },
  { label: 'Audio',      route: '/LRAudio' },
  { label: 'Videos',     route: '/LRVideo' },
  { label: 'Notes',      route: '/LRScratchpad' },
  { label: 'Timeline',   route: '/LRTimeline' },
];

// ═════════════════════════════════════════════════════════════════════════════
// LRPerson1 – main component
// ═════════════════════════════════════════════════════════════════════════════
export const LRPerson1 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCase, selectedLead, leadReturns } = useContext(CaseContext);

  // Person record passed via navigation state when editing an existing entry
  const { caseDetails, person } = location.state || {};

  // ── Stable ISO date string for today (memoised — never changes) ──────────
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ── Form state – lazily initialised from sessionStorage or person prop ───
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem(FORM_KEY);
    if (saved) return JSON.parse(saved);
    return person ? buildFormFromPerson(person) : buildEmptyForm(todayISO);
  });

  // ── Miscellaneous additional data rows ───────────────────────────────────
  const [miscDetails, setMiscDetails] = useState(() => {
    const saved = sessionStorage.getItem(MISC_KEY);
    return saved ? JSON.parse(saved) : (person?.additionalData || []);
  });

  // ── Photo state ──────────────────────────────────────────────────────────
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(person?.photoUrl || null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  // ── UI / async state ─────────────────────────────────────────────────────
  const [narrativeIds, setNarrativeIds] = useState([]);
  const [leadData, setLeadData]         = useState({});
  const [username, setUsername]         = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [alertOpen, setAlertOpen]       = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ── Read logged-in username once on mount ────────────────────────────────
  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) setUsername(loggedInUser);
  }, []);

  // ── Persist form data to sessionStorage on every change ─────────────────
  useEffect(() => {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem(MISC_KEY, JSON.stringify(miscDetails));
  }, [miscDetails]);

  // ── Pre-fill defaults for new records once narrative IDs have loaded ─────
  useEffect(() => {
    if (person) return; // editing mode — don't overwrite existing values
    if (!formData.leadReturnId && narrativeIds.length) {
      setFormData((fd) => ({ ...fd, leadReturnId: narrativeIds.at(-1) }));
    }
    if (!formData.dateEntered) {
      setFormData((fd) => ({ ...fd, dateEntered: todayISO }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, narrativeIds, todayISO]);

  /**
   * Fetches available Narrative (Lead Return) IDs for the selected lead.
   * Falls back to an API call if the context doesn't already have them.
   */
  useEffect(() => {
    const { leadNo, leadName } = selectedLead || {};
    const { caseNo, caseName } = selectedCase || {};
    if (!leadNo || !leadName || !caseNo || !caseName) return;

    // Derive IDs from context data when already available
    if (Array.isArray(leadReturns) && leadReturns.length) {
      const ids = [...new Set(leadReturns.map((r) => r?.leadReturnId).filter(Boolean))];
      ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
      setNarrativeIds(ids);
      return;
    }

    // Otherwise fetch from the API
    const controller = new AbortController();
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get(
          `/api/leadReturnResult/${leadNo}/${encodeURIComponent(leadName)}/${caseNo}/${encodeURIComponent(caseName)}`,
          { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } }
        );
        const ids = [...new Set((data ?? []).map((r) => r?.leadReturnId).filter(Boolean))];
        ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
        setNarrativeIds(ids);
      } catch (e) {
        if (!controller.signal.aborted) console.error('Failed to load narrative IDs', e);
      }
    })();

    return () => controller.abort();
  }, [selectedLead?.leadNo, selectedLead?.leadName, selectedCase?.caseNo, selectedCase?.caseName, leadReturns]);

  /**
   * Fetches the lead record to determine who the primary investigator is,
   * which controls whether the current user sees Submit vs Review buttons.
   */
  useEffect(() => {
    const { leadNo, leadName } = selectedLead || {};
    const { caseNo, caseName } = selectedCase || {};
    if (!leadNo || !leadName || !caseNo || !caseName) return;

    const fetchLeadData = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get(
          `/api/lead/lead/${leadNo}/${encodeURIComponent(leadName)}/${caseNo}/${encodeURIComponent(caseName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.length > 0) {
          setLeadData({
            ...data[0],
            assignedTo: data[0].assignedTo || [],
            leadStatus: data[0].leadStatus || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch lead data:', error);
      }
    };

    fetchLeadData();
  }, [selectedLead, selectedCase]);

  // ── Derived: primary investigator check ──────────────────────────────────
  const signedInOfficer   = localStorage.getItem('loggedInUser');
  const primaryUsername   = leadData?.primaryInvestigator || leadData?.primaryOfficer || '';
  const isPrimaryInvestigator =
    selectedCase?.role === 'Investigator' && !!signedInOfficer && signedInOfficer === primaryUsername;

  // ── Form field change handler ─────────────────────────────────────────────
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── Photo handlers ────────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoRemoved(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoRemoved(true);
  };

  // ── Misc table handlers ───────────────────────────────────────────────────
  const handleMiscRowChange = useCallback((index, field, value) => {
    setMiscDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleAddMiscRow = useCallback(() => {
    setMiscDetails((prev) => [...prev, { category: '', value: '' }]);
  }, []);

  // ── Alert helper ──────────────────────────────────────────────────────────
  const showAlert = (message) => {
    setAlertMessage(message);
    setAlertOpen(true);
  };

  // ── Navigation helpers ────────────────────────────────────────────────────
  const handleNavigation = (route) => navigate(route);

  /** Returns the active lead and case, preferring context over location state. */
  const resolveLeadAndCase = () => ({
    lead: selectedLead?.leadNo ? selectedLead : location.state?.leadDetails,
    kase: selectedCase?.caseNo ? selectedCase : location.state?.caseDetails,
  });

  const goToLeadInformation = () => {
    const { lead, kase } = resolveLeadAndCase();
    if (lead && kase) navigate('/LeadReview', { state: { caseDetails: kase, leadDetails: lead } });
  };

  const goToChainOfCustody = () => {
    const { lead, kase } = resolveLeadAndCase();
    if (lead && kase) navigate('/ChainOfCustody', { state: { caseDetails: kase, leadDetails: lead } });
    else showAlert('Please select a case and lead first.');
  };

  const goToViewLR = () => {
    const { lead, kase } = resolveLeadAndCase();
    if (!lead?.leadNo || !lead?.leadName || !kase?.caseNo || !kase?.caseName) {
      showAlert('Please select a case and lead first.');
      return;
    }
    navigate('/viewLR', { state: { caseDetails: kase, leadDetails: lead } });
  };

  /**
   * Generates a full PDF report for the selected lead by fetching all sections
   * in parallel and posting the assembled payload to the report generation endpoint.
   * On success, navigates to the DocumentReview page with the PDF blob.
   */
  const handleViewLeadReturn = async () => {
    const { lead, kase } = resolveLeadAndCase();
    if (!lead?.leadNo || !(lead.leadName || lead.description) || !kase?.caseNo || !kase?.caseName) {
      showAlert('Please select a case and lead first.');
      return;
    }
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      const token = localStorage.getItem('token');
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      const { leadNo } = lead;
      const leadName = lead.leadName || lead.description;
      const { caseNo, caseName } = kase;
      const encLead = encodeURIComponent(leadName);
      const encCase = encodeURIComponent(caseName);

      // Fetch all report sections in parallel
      const [
        instrRes, returnsRes, personsRes, vehiclesRes, enclosuresRes,
        evidenceRes, picturesRes, audioRes, videosRes, scratchpadRes, timelineRes,
      ] = await Promise.all([
        api.get(`/api/lead/lead/${leadNo}/${encLead}/${caseNo}/${encCase}`,               headers).catch(() => ({ data: [] })),
        api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`,         headers).catch(() => ({ data: [] })),
        api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${caseNo}/${encCase}`,       headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${caseNo}/${encCase}`,     headers).catch(() => ({ data: [] })),
        api.get(`/api/lrenclosure/${leadNo}/${encLead}/${caseNo}/${encCase}`,             headers).catch(() => ({ data: [] })),
        api.get(`/api/lrevidence/${leadNo}/${encLead}/${caseNo}/${encCase}`,              headers).catch(() => ({ data: [] })),
        api.get(`/api/lrpicture/${leadNo}/${encLead}/${caseNo}/${encCase}`,               headers).catch(() => ({ data: [] })),
        api.get(`/api/lraudio/${leadNo}/${encLead}/${caseNo}/${encCase}`,                 headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvideo/${leadNo}/${encLead}/${caseNo}/${encCase}`,                 headers).catch(() => ({ data: [] })),
        api.get(`/api/scratchpad/${leadNo}/${encLead}/${caseNo}/${encCase}`,              headers).catch(() => ({ data: [] })),
        api.get(`/api/timeline/${leadNo}/${encLead}/${caseNo}/${encCase}`,                headers).catch(() => ({ data: [] })),
      ]);

      // Attach associated files to media/enclosure sections
      const [enclosuresWithFiles, evidenceWithFiles, picturesWithFiles, audioWithFiles, videosWithFiles] =
        await Promise.all([
          attachFiles(enclosuresRes.data, '_id',       '/api/lrenclosures/files'),
          attachFiles(evidenceRes.data,   '_id',       '/api/lrevidences/files'),
          attachFiles(picturesRes.data,   'pictureId', '/api/lrpictures/files'),
          attachFiles(audioRes.data,      'audioId',   '/api/lraudio/files'),
          attachFiles(videosRes.data,     'videoId',   '/api/lrvideo/files'),
        ]);

      const leadInstructions = instrRes.data?.[0] || {};
      const leadReturnsData  = returnsRes.data    || [];

      const selectedReports = {
        FullReport: true, leadInstruction: true, leadReturn: true, leadPersons: true,
        leadVehicles: true, leadEnclosures: true, leadEvidence: true, leadPictures: true,
        leadAudio: true, leadVideos: true, leadScratchpad: true, leadTimeline: true,
      };

      const body = {
        user:            localStorage.getItem('loggedInUser') || '',
        reportTimestamp: new Date().toISOString(),
        leadInstruction: leadInstructions,
        leadReturn:      leadReturnsData,
        leadPersons:     personsRes.data    || [],
        leadVehicles:    vehiclesRes.data   || [],
        leadEnclosures:  enclosuresWithFiles,
        leadEvidence:    evidenceWithFiles,
        leadPictures:    picturesWithFiles,
        leadAudio:       audioWithFiles,
        leadVideos:      videosWithFiles,
        leadScratchpad:  scratchpadRes.data || [],
        leadTimeline:    timelineRes.data   || [],
        // Backend expects both the alias keys below
        selectedReports,
        leadInstructions,
        leadReturns: leadReturnsData,
      };

      const resp = await api.post('/api/report/generate', body, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });

      const pdfBlob = new Blob([resp.data], { type: 'application/pdf' });
      navigate('/DocumentReview', {
        state: { pdfBlob, filename: `Lead_${leadNo || 'report'}.pdf` },
      });
    } catch (err) {
      const message = err?.response?.data instanceof Blob
        ? await err.response.data.text()
        : (err.message || 'Unknown error');
      console.error('Report error:', err);
      showAlert('Error generating PDF:\n' + message);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Creates a new person record or updates an existing one (determined by whether
   * `person` was passed in location state). Also handles photo upload / deletion
   * after the main record is saved. Clears session storage on success.
   */
  const handleSave = async () => {
    if (!isPersonRecordValid(formData)) {
      showAlert(
        'Cannot save an empty record. Please fill in at least one field (name, alias, business name, person type, address, physical descriptor, or contact info).'
      );
      return;
    }

    const token = localStorage.getItem('token');

    const payload = {
      leadNo:        selectedLead?.leadNo,
      description:   selectedLead?.leadName,
      caseNo:        selectedCase?.caseNo,
      caseName:      selectedCase?.caseName,
      enteredBy:     username,
      enteredDate:   formData.dateEntered,
      leadReturnId:  formData.leadReturnId,
      lastName:      formData.lastName,
      firstName:     formData.firstName,
      middleInitial: formData.mi,
      suffix:        formData.suffix,
      cellNumber:    formData.cellNumber,
      alias:         formData.alias,
      businessName:  formData.businessName,
      address: {
        street1:   formData.street1,
        street2:   formData.street2,
        building:  formData.building,
        apartment: formData.apartment,
        city:      formData.city,
        state:     formData.state,
        zipCode:   formData.zipCode,
      },
      age:          formData.age,
      ssn:          formData.ssn,
      occupation:   formData.occupation,
      email:        formData.email,
      personType:   formData.personType,
      condition:    formData.condition,
      cautionType:  formData.cautionType,
      sex:          formData.sex,
      race:         formData.race,
      ethnicity:    formData.ethnicity,
      skinTone:     formData.skinTone,
      eyeColor:     formData.eyeColor,
      glasses:      formData.glasses,
      hairColor:    formData.hairColor,
      tattoo:       formData.tattoo,
      scar:         formData.scar,
      mark:         formData.mark,
      height: {
        feet:   formData.heightFt !== '' ? Number(formData.heightFt)  : undefined,
        inches: formData.heightIn !== '' ? Number(formData.heightIn)  : undefined,
      },
      weight: formData.weight !== '' ? Number(formData.weight) : undefined,
      additionalData: miscDetails,
    };

    try {
      let response;
      if (person) {
        // Update existing record
        response = await api.put(
          `/api/lrperson/id/${person._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new record
        response = await api.post('/api/lrperson/lrperson', payload, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
      }

      // Handle photo upload or deletion after person record is saved
      const personId = person?._id || response.data?._id;
      if (personId) {
        if (photoFile) {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);
          try {
            await api.post(`/api/lrperson/photo/${personId}`, photoFormData, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (photoErr) {
            console.error('Photo upload failed:', photoErr);
          }
        } else if (photoRemoved && person?.photoS3Key) {
          try {
            await api.delete(`/api/lrperson/photo/${personId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (photoErr) {
            console.error('Photo delete failed:', photoErr);
          }
        }
      }

      // Clear persisted form state after a successful save
      sessionStorage.removeItem(FORM_KEY);
      sessionStorage.removeItem(MISC_KEY);

      showAlert(person ? 'Updated successfully!' : 'Created successfully!');
      navigate(-1);
    } catch (err) {
      console.error('Save failed:', err.response || err);
      showAlert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Guard: render placeholder while context is loading ───────────────────
  if (!selectedCase && !caseDetails) {
    return <div>Loading case/lead…</div>;
  }

  const isCaseManager = ['Case Manager', 'Detective Supervisor'].includes(selectedCase?.role);
  const isInvestigator = selectedCase?.role === 'Investigator';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.personPage}>
      <Navbar />

      <AlertModal
        isOpen={alertOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={() => setAlertOpen(false)}
      />

      <div className={styles.pageContent}>
        <SideBar activePage="LeadReview" />

        <div className={styles.mainColumn}>

          {/* ── Top bar: page-level navigation actions ── */}
          <nav className={styles.topMenuNav}>
            <div className={styles.menuItems}>
              <span className={styles.menuItem} onClick={goToLeadInformation}>
                Lead Information
              </span>

              <span className={`${styles.menuItem} ${styles.menuItemActive}`}>
                Add Lead Return
              </span>

              {/* Case managers can generate / manage the full lead return report */}
              {isCaseManager && (
                <span
                  className={`${styles.menuItem} ${isGenerating ? styles.menuItemDisabled : ''}`}
                  onClick={handleViewLeadReturn}
                  title={isGenerating ? 'Preparing report…' : 'View Lead Return'}
                >
                  Manage Lead Return
                </span>
              )}

              {/* Primary investigator submits; other investigators only review */}
              {isInvestigator && (
                <span className={styles.menuItem} onClick={goToViewLR}>
                  {isPrimaryInvestigator ? 'Submit Lead Return' : 'Review Lead Return'}
                </span>
              )}

              <span className={styles.menuItem} onClick={goToChainOfCustody}>
                Lead Chain of Custody
              </span>
            </div>
          </nav>

          {/* ── Section tabs: LR form sub-sections ── */}
          <nav className={styles.topMenuSections}>
            <div className={`${styles.menuItems} ${styles.sectionMenuItems}`}>
              {SECTION_TABS_BEFORE.map(({ label, route }) => (
                <span key={route} className={`${styles.menuItem} ${styles.menuItemInactive}`} onClick={() => handleNavigation(route)}>
                  {label}
                </span>
              ))}

              {/* Active tab — current page */}
              <span className={`${styles.menuItem} ${styles.menuItemActive}`}>
                Add Person
              </span>

              {SECTION_TABS_AFTER.map(({ label, route }) => (
                <span key={route} className={`${styles.menuItem} ${styles.menuItemInactive}`} onClick={() => handleNavigation(route)}>
                  {label}
                </span>
              ))}
            </div>
          </nav>

          {/* ── Scrollable form area ── */}
          <div className={styles.scrollableContent}>
            <div className={styles.formCard}>
              <table className={styles.personTable}>
                <tbody>

                  {/* ── Date & Narrative ID ── */}
                  <tr>
                    <td>Date Entered *</td>
                    <td>
                      <input
                        type="date"
                        className={styles.inputLarge}
                        value={formData.dateEntered}
                        onChange={(e) => handleChange('dateEntered', e.target.value)}
                      />
                    </td>
                    <td>Narrative Id *</td>
                    <td>
                      <select
                        className={styles.inputLarge}
                        value={formData.leadReturnId}
                        onChange={(e) => handleChange('leadReturnId', e.target.value)}
                      >
                        <option value="">Select Id</option>
                        {narrativeIds.map((id) => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                      </select>
                    </td>
                  </tr>

                  {/* ── Name fields ── */}
                  <tr>
                    <td>Last Name</td>
                    <td>
                      <input type="text" value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)} />
                    </td>
                    <td>First Name</td>
                    <td>
                      <input type="text" value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>MI</td>
                    <td>
                      <input type="text" value={formData.mi}
                        onChange={(e) => handleChange('mi', e.target.value)} />
                    </td>
                    <td>Suffix</td>
                    <td>
                      <input type="text" value={formData.suffix}
                        onChange={(e) => handleChange('suffix', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>Cell Number</td>
                    <td>
                      <input type="text" value={formData.cellNumber}
                        onChange={(e) => handleChange('cellNumber', e.target.value)} />
                    </td>
                    <td>Alias</td>
                    <td>
                      <input type="text" value={formData.alias}
                        onChange={(e) => handleChange('alias', e.target.value)} />
                    </td>
                  </tr>

                  {/* ── Address fields ── */}
                  <tr>
                    <td>Street 1</td>
                    <td colSpan="3">
                      <input type="text" value={formData.street1}
                        onChange={(e) => handleChange('street1', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>Street 2</td>
                    <td colSpan="3">
                      <input type="text" value={formData.street2}
                        onChange={(e) => handleChange('street2', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>Business Name</td>
                    <td>
                      <input type="text" value={formData.businessName}
                        onChange={(e) => handleChange('businessName', e.target.value)} />
                    </td>
                    <td>Apartment</td>
                    <td>
                      <input type="text" value={formData.apartment}
                        onChange={(e) => handleChange('apartment', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>City</td>
                    <td>
                      <input type="text" value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)} />
                    </td>
                    <td>State</td>
                    <td>
                      <input type="text" value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>Zip Code</td>
                    <td>
                      <input type="text" value={formData.zipCode}
                        onChange={(e) => handleChange('zipCode', e.target.value)} />
                    </td>
                    <td>Age</td>
                    {/* Age not yet wired to formData in the original */}
                    <td><input type="text" /></td>
                  </tr>

                  {/* ── Identity / contact ── */}
                  <tr>
                    {/* SSN and Occupation not yet wired to formData in the original */}
                    <td>SSN</td>
                    <td><input type="text" /></td>
                    <td>Occupation</td>
                    <td><input type="text" /></td>
                  </tr>
                  <tr>
                    {/* Email not yet wired to formData in the original */}
                    <td>Email</td>
                    <td colSpan="3"><input type="email" /></td>
                  </tr>

                  {/* ── Classification dropdowns ── */}
                  <tr>
                    <td>Person Type</td>
                    <td>
                      <select value={formData.personType}
                        onChange={(e) => handleChange('personType', e.target.value)}>
                        <option value="">Select Type</option>
                        <option value="Suspect">Suspect</option>
                        <option value="Victim">Victim</option>
                        <option value="Witness">Witness</option>
                        <option value="Officer">Officer</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Condition</td>
                    <td>
                      <select value={formData.condition}
                        onChange={(e) => handleChange('condition', e.target.value)}>
                        <option value="">Select Condition</option>
                        <option value="Cooperative">Cooperative</option>
                        <option value="Uncooperative">Uncooperative</option>
                        <option value="Injured">Injured</option>
                        <option value="Deceased">Deceased</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>Caution Type</td>
                    <td>
                      <select value={formData.cautionType}
                        onChange={(e) => handleChange('cautionType', e.target.value)}>
                        <option value="">Select Type</option>
                        <option value="Armed">Armed</option>
                        <option value="Unarmed">Unarmed</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Sex</td>
                    <td>
                      <select value={formData.sex}
                        onChange={(e) => handleChange('sex', e.target.value)}>
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>

                  {/* ── Physical descriptors ── */}
                  <tr>
                    <td>Race</td>
                    <td>
                      <select value={formData.race}
                        onChange={(e) => handleChange('race', e.target.value)}>
                        <option value="">Select Race</option>
                        <option value="White">White</option>
                        <option value="Black">Black or African American</option>
                        <option value="Asian">Asian</option>
                        <option value="Native American">Native American</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Ethnicity</td>
                    <td>
                      <select value={formData.ethnicity}
                        onChange={(e) => handleChange('ethnicity', e.target.value)}>
                        <option value="">Select Ethnicity</option>
                        <option value="Hispanic">Hispanic or Latino</option>
                        <option value="Non-Hispanic">Not Hispanic or Latino</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>Skin Tone</td>
                    <td>
                      <select value={formData.skinTone}
                        onChange={(e) => handleChange('skinTone', e.target.value)}>
                        <option value="">Select Skin Tone</option>
                        <option value="Light">Light</option>
                        <option value="Medium">Medium</option>
                        <option value="Dark">Dark</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Eye Color</td>
                    <td>
                      <select value={formData.eyeColor}
                        onChange={(e) => handleChange('eyeColor', e.target.value)}>
                        <option value="">Select Eye Color</option>
                        <option value="Brown">Brown</option>
                        <option value="Blue">Blue</option>
                        <option value="Green">Green</option>
                        <option value="Hazel">Hazel</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>Glasses</td>
                    <td>
                      <select value={formData.glasses}
                        onChange={(e) => handleChange('glasses', e.target.value)}>
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td>Hair Color</td>
                    <td>
                      <select value={formData.hairColor}
                        onChange={(e) => handleChange('hairColor', e.target.value)}>
                        <option value="">Select Hair Color</option>
                        <option value="Black">Black</option>
                        <option value="Brown">Brown</option>
                        <option value="Blonde">Blonde</option>
                        <option value="Red">Red</option>
                        <option value="Gray">Gray</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>

                  {/* Height / Weight */}
                  <tr>
                    <td>Height</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="number" min="0" placeholder="ft"
                          value={formData.heightFt}
                          onChange={(e) => handleChange('heightFt', e.target.value)}
                          style={{ width: '60px' }} />
                        <span style={{ color: '#888' }}>ft</span>
                        <input type="number" min="0" max="11" placeholder="in"
                          value={formData.heightIn}
                          onChange={(e) => handleChange('heightIn', e.target.value)}
                          style={{ width: '60px' }} />
                        <span style={{ color: '#888' }}>in</span>
                      </div>
                    </td>
                    <td>Weight</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="number" min="0" placeholder="lbs"
                          value={formData.weight}
                          onChange={(e) => handleChange('weight', e.target.value)} />
                        <span style={{ color: '#888', whiteSpace: 'nowrap' }}>lbs</span>
                      </div>
                    </td>
                  </tr>

                  {/* ── Distinguishing marks ── */}
                  <tr>
                    <td>Tattoo</td>
                    <td>
                      <input type="text" value={formData.tattoo}
                        onChange={(e) => handleChange('tattoo', e.target.value)} />
                    </td>
                    <td>Scar</td>
                    <td>
                      <input type="text" value={formData.scar}
                        onChange={(e) => handleChange('scar', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>Mark</td>
                    <td>
                      <input type="text" value={formData.mark}
                        onChange={(e) => handleChange('mark', e.target.value)} />
                    </td>
                  </tr>

                  {/* ── Photo upload ── */}
                  <tr>
                    <td>Person Photo</td>
                    <td colSpan="3">
                      <PhotoUpload
                        preview={photoPreview}
                        onFileChange={handlePhotoChange}
                        onRemove={handleRemovePhoto}
                      />
                    </td>
                  </tr>

                  {/* ── Miscellaneous additional data ── */}
                  <MiscDetailsTable
                    rows={miscDetails}
                    onRowChange={handleMiscRowChange}
                    onAddRow={handleAddMiscRow}
                  />

                </tbody>
              </table>

              <div className={styles.formButtons}>
                <button className={styles.saveBtn} onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
