/**
 * LRInstruction.jsx
 *
 * Displays the read-only lead instruction detail page for a selected lead.
 * Responsibilities:
 *  - Fetch and display lead instruction data from the API.
 *  - Provide page-level navigation (Lead Information, Lead Return, Chain of Custody).
 *  - Provide section-level tab navigation (Instructions, Narrative, Person, etc.).
 *  - Conditionally render action buttons based on the user's case role.
 *  - Generate a full-lead PDF report and route to the document viewer.
 *  - Sync case/lead context from URL query params when arriving via direct link.
 */

import { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { pickHigherStatus } from '../../../utils/status';
import Navbar from '../../../components/Navbar/Navbar';
import styles from './LRInstruction.module.css';
import { LRTopMenu } from '../LRTopMenu';
import { CaseContext } from '../../CaseContext';
import api from '../../../api';
import { SideBar } from '../../../components/Sidebar/Sidebar';
import { AlertModal } from '../../../components/AlertModal/AlertModal';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Section tabs rendered in the sub-navigation bar. */
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
  { label: 'Timeline',     route: '/LRTimeline' },
];

/** Default shape for lead instruction data returned by the API. */
const EMPTY_LEAD_DATA = {
  leadNumber: '',
  parentLeadNo: '',
  incidentNo: '',
  subCategory: '',
  associatedSubCategories: [],
  assignedDate: '',
  dueDate: '',
  summary: '',
  assignedBy: '',
  leadDescription: '',
  assignedTo: [],
  assignedOfficer: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats an ISO date string to MM/DD/YY.
 * Returns an empty string for null/invalid input.
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
};

/**
 * Fetches uploaded files for each item in a collection and attaches them
 * as a `files` array on the item.
 *
 * @param {object[]} items        - Array of section items.
 * @param {string}   idField      - Name of the ID property on each item.
 * @param {string}   endpoint     - API base path for file retrieval.
 * @returns {Promise<object[]>}   - Items enriched with a `files` property.
 */
const attachFilesToItems = async (items, idField, endpoint) =>
  Promise.all(
    (items || []).map(async (item) => {
      const id = item[idField];
      if (!id) return { ...item, files: [] };
      try {
        const { data: files } = await api.get(`${endpoint}/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        return { ...item, files };
      } catch (err) {
        console.error(`Failed to fetch files from ${endpoint}/${id}:`, err);
        return { ...item, files: [] };
      }
    })
  );

/**
 * Resolves the active lead and case objects, preferring context values over
 * router state.
 */
const resolveLeadAndCase = (selectedLead, selectedCase, locationState) => ({
  lead: selectedLead?.leadNo ? selectedLead : locationState?.leadDetails,
  kase: selectedCase?.caseNo ? selectedCase : locationState?.caseDetails,
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * TopNavBar – page-level navigation tabs (Lead Information, Lead Return, etc.).
 * Renders role-conditional action items.
 */

/**
 * SectionTabBar – sub-navigation tabs for lead return sections
 * (Instructions, Narrative, Person, etc.).
 */
const SectionTabBar = ({ activeRoute, onNavigate }) => (
  <div className={styles.topMenuSections}>
    <div className={styles.menuItems} style={{ fontSize: '18px' }}>
      {SECTION_TABS.map(({ label, route }) => (
        <span
          key={route}
          className={`${styles.menuItem} ${activeRoute === route ? styles.menuItemActive : ''}`}
          onClick={() => onNavigate(route)}
        >
          {label}
        </span>
      ))}
    </div>
  </div>
);

/**
 * BreadcrumbBar – displays the hierarchical navigation path
 * and the current lead status.
 */
const BreadcrumbBar = ({ selectedCase, selectedLead, leadStatus }) => {
  const caseRoute = selectedCase?.role === 'Investigator' ? '/Investigator' : '/CasePageManager';

  return (
    <div className={styles.caseandleadinfo}>
      <h5 className={styles.sideTitle}>
        <div className={styles.ldHead}>
          <Link to="/HomePage" className={styles.crumb}>PIMS Home</Link>
          <span className={styles.sep}>{' >> '}</span>
          <Link to={caseRoute} state={{ caseDetails: selectedCase }} className={styles.crumb}>
            Case: {selectedCase?.caseNo || ''}
          </Link>
          <span className={styles.sep}>{' >> '}</span>
          <Link to="/LeadReview" state={{ leadDetails: selectedLead }} className={styles.crumb}>
            Lead: {selectedLead?.leadNo || ''}
          </Link>
          <span className={styles.sep}>{' >> '}</span>
          <span className={styles.crumbCurrent} aria-current="page">Lead Instructions</span>
        </div>
      </h5>
      <h5 className={styles.sideTitle}>
        {selectedLead?.leadNo ? `Lead Status: ${leadStatus}` : leadStatus}
      </h5>
    </div>
  );
};

/**
 * LeadSummaryTable – compact header table showing lead number, case number,
 * assigned-by, and assigned date.
 */
const LeadSummaryTable = ({ leadNo, caseNo, assignedBy, assignedDate }) => (
  <table className={styles.leadsTable}>
    <thead>
      <tr>
        <th style={{ width: '10%' }}>Lead No.</th>
        <th style={{ width: '10%' }}>Case No.</th>
        <th style={{ width: '10%' }}>Assigned By</th>
        <th style={{ width: '8%'  }}>Assigned Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{leadNo}</td>
        <td>{caseNo}</td>
        <td>{assignedBy}</td>
        <td>{formatDate(assignedDate)}</td>
      </tr>
    </tbody>
  </table>
);

/**
 * LeadDetailTable – read-only field grid showing the full instruction details
 * for the selected lead.
 */
const LeadDetailTable = ({ leadData }) => {
  /** Extracts a display-safe username string from an officer entry. */
  const formatOfficers = (officers) => {
    if (!Array.isArray(officers) || officers.length === 0) return '—';
    return (
      officers
        .map((o) => (typeof o === 'string' ? o : o.username))
        .filter(Boolean)
        .join(', ') || '—'
    );
  };

  const rows = [
    { label: 'Case Name',                value: leadData.caseName || '—' },
    { label: 'Lead Log Summary',         value: leadData.description || '—' },
    {
      label: 'Lead Instruction',
      value: leadData.summary || '—',
      className: styles.leadInstructionText,
    },
    { label: 'Assigned Officers',        value: formatOfficers(leadData.assignedTo) },
    { label: 'Lead Origin',              value: leadData.parentLeadNo || '—' },
    {
      label: 'Subcategory',
      value: Array.isArray(leadData.subCategory)
        ? leadData.subCategory.join(', ') || '—'
        : leadData.subCategory || '—',
    },
    {
      label: 'Associated Subcategories',
      value: Array.isArray(leadData.associatedSubCategories)
        ? leadData.associatedSubCategories.join(', ') || '—'
        : '—',
    },
  ];

  return (
    <div className={styles.bottomContentLRI}>
      <table className={styles.detailsTable}>
        <tbody>
          {rows.map(({ label, value, className }) => (
            <tr key={label}>
              <td className={styles.infoLabel}>{label}:</td>
              <td>
                <div className={className || styles.inputField}>{value}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const LRInstruction = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Router state – passed from the previous page
  const { caseDetails, leadDetails } = location.state || {};

  // Alert modal state
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOpen,    setAlertOpen]    = useState(false);

  // PDF generation in-progress guard
  const [isGenerating, setIsGenerating] = useState(false);

  // Lead instruction data returned from the API
  const [leadData, setLeadData] = useState(EMPTY_LEAD_DATA);

  // ---------------------------------------------------------------------------
  // Context & resolved identifiers
  // ---------------------------------------------------------------------------

  const {
    selectedCase, selectedLead,
    setSelectedCase, setSelectedLead,
    leadStatus, setLeadStatus,
    setLeadInstructions,
  } = useContext(CaseContext);

  // Fall back to query-string params when arriving via a direct URL (e.g. email link)
  const params       = new URLSearchParams(location.search);
  const qpCaseNo     = params.get('caseNo')   || undefined;
  const qpCaseName   = params.get('caseName') || undefined;
  const qpLeadNo     = params.get('leadNo')   ? Number(params.get('leadNo')) : undefined;
  const qpLeadName   = params.get('leadName') || undefined;

  // Resolution priority: context → router state → query params
  const stateCase        = (location.state || {}).caseDetails;
  const stateLead        = (location.state || {}).leadDetails;
  const resolvedCaseNo   = selectedCase?.caseNo   ?? stateCase?.caseNo   ?? qpCaseNo;
  const resolvedCaseName = selectedCase?.caseName ?? stateCase?.caseName ?? qpCaseName;
  const resolvedLeadNo   = selectedLead?.leadNo   ?? stateLead?.leadNo   ?? qpLeadNo;
  const resolvedLeadName = selectedLead?.leadName ?? stateLead?.leadName ?? qpLeadName;

  // ---------------------------------------------------------------------------
  // Role / permission derivations
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Alert helper
  // ---------------------------------------------------------------------------

  const showAlert = useCallback((message) => {
    setAlertMessage(message);
    setAlertOpen(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  /** Navigate to a section tab, preserving the current case/lead state. */
  const handleTabNavigation = useCallback(
    (route) => navigate(route, { state: { caseDetails, leadDetails } }),
    [navigate, caseDetails, leadDetails]
  );

  /** Navigate to the Lead Information page. */
  const handleNavigateToLeadInfo = useCallback(() => {
    const { lead, kase } = resolveLeadAndCase(selectedLead, selectedCase, location.state);
    if (lead && kase) navigate('/LeadReview', { state: { caseDetails: kase, leadDetails: lead } });
  }, [navigate, selectedLead, selectedCase, location.state]);

  /** Navigate to Chain of Custody, guarding against missing selection. */
  const handleNavigateToChainOfCustody = useCallback(() => {
    const { lead, kase } = resolveLeadAndCase(selectedLead, selectedCase, location.state);
    if (lead && kase) {
      navigate('/ChainOfCustody', { state: { caseDetails: kase, leadDetails: lead } });
    } else {
      showAlert('Please select a case and lead first.');
    }
  }, [navigate, selectedLead, selectedCase, location.state, showAlert]);

  // ---------------------------------------------------------------------------
  // PDF generation
  // ---------------------------------------------------------------------------

  /**
   * Fetches all lead return data in parallel, attaches uploaded files where
   * required, then POST-generates a PDF and routes to DocumentReview.
   */
  const handleViewLeadReturn = useCallback(async () => {
    const { lead, kase } = resolveLeadAndCase(selectedLead, selectedCase, location.state);

    const kaseId = kase?._id || kase?.id;
    if (!lead?.leadNo || !(lead.leadName || lead.description) || !kaseId) {
      showAlert('Please select a case and lead first.');
      return;
    }
    if (isGenerating) return;

    try {
      setIsGenerating(true);

      const token   = localStorage.getItem('token');
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      const { leadNo } = lead;
      const leadName   = lead.leadName || lead.description;
      const encLead    = encodeURIComponent(leadName);
      const base       = `${leadNo}/${encLead}/${kaseId}`;

      // Fetch all lead sections in parallel for performance
      const [
        instrRes, returnsRes, personsRes, vehiclesRes,
        enclosuresRes, evidenceRes, picturesRes,
        audioRes, videosRes, scratchpadRes, timelineRes,
      ] = await Promise.all([
        api.get(`/api/lead/lead/${base}`,            headers).catch(() => ({ data: [] })),
        api.get(`/api/leadReturnResult/${base}`,     headers).catch(() => ({ data: [] })),
        api.get(`/api/lrperson/lrperson/${base}`,   headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvehicle/lrvehicle/${base}`,  headers).catch(() => ({ data: [] })),
        api.get(`/api/lrenclosure/${base}`,          headers).catch(() => ({ data: [] })),
        api.get(`/api/lrevidence/${base}`,           headers).catch(() => ({ data: [] })),
        api.get(`/api/lrpicture/${base}`,            headers).catch(() => ({ data: [] })),
        api.get(`/api/lraudio/${base}`,              headers).catch(() => ({ data: [] })),
        api.get(`/api/lrvideo/${base}`,              headers).catch(() => ({ data: [] })),
        api.get(`/api/scratchpad/${base}`,           headers).catch(() => ({ data: [] })),
        api.get(`/api/timeline/${base}`,             headers).catch(() => ({ data: [] })),
      ]);

      // Attach uploaded file metadata to media sections
      const [enclosuresWithFiles, evidenceWithFiles, picturesWithFiles, audioWithFiles, videosWithFiles] =
        await Promise.all([
          attachFilesToItems(enclosuresRes.data, '_id',       '/api/lrenclosures/files'),
          attachFilesToItems(evidenceRes.data,   '_id',       '/api/lrevidences/files'),
          attachFilesToItems(picturesRes.data,   'pictureId', '/api/lrpictures/files'),
          attachFilesToItems(audioRes.data,      'audioId',   '/api/lraudio/files'),
          attachFilesToItems(videosRes.data,     'videoId',   '/api/lrvideo/files'),
        ]);

      const leadInstructions = instrRes.data?.[0] || {};

      // Build the report payload – selectedReports flags all sections active
      const reportBody = {
        user:            localStorage.getItem('loggedInUser') || '',
        reportTimestamp: new Date().toISOString(),
        leadInstruction: leadInstructions,
        leadReturn:      returnsRes.data   || [],
        leadPersons:     personsRes.data   || [],
        leadVehicles:    vehiclesRes.data  || [],
        leadEnclosures:  enclosuresWithFiles,
        leadEvidence:    evidenceWithFiles,
        leadPictures:    picturesWithFiles,
        leadAudio:       audioWithFiles,
        leadVideos:      videosWithFiles,
        leadScratchpad:  scratchpadRes.data || [],
        leadTimeline:    timelineRes.data   || [],
        selectedReports: {
          FullReport: true, leadInstruction: true, leadReturn: true,
          leadPersons: true, leadVehicles: true, leadEnclosures: true,
          leadEvidence: true, leadPictures: true, leadAudio: true,
          leadVideos: true, leadScratchpad: true, leadTimeline: true,
        },
        // Kept for backward-compatibility with the report generator
        leadInstructions,
        leadReturns: returnsRes.data || [],
      };

      const pdfResponse = await api.post('/api/report/generate', reportBody, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });

      const pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });

      navigate('/DocumentReview', {
        state: { pdfBlob, filename: `Lead_${leadNo || 'report'}.pdf` },
      });
    } catch (err) {
      // Blob error responses need to be read as text before displaying
      const errorText =
        err?.response?.data instanceof Blob
          ? await err.response.data.text()
          : err.message || 'Unknown error';
      showAlert(`Error generating PDF:\n${errorText}`);
    } finally {
      setIsGenerating(false);
    }
  }, [navigate, selectedLead, selectedCase, location.state, isGenerating, showAlert]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /** Sync context from router state (covers fresh-session and tab navigation). */
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

  /**
   * Hydrate context when the page is reached via a direct URL containing
   * query-string parameters instead of router state.
   */
  useEffect(() => {
    if (resolvedCaseNo && resolvedCaseName && !selectedCase?.caseNo) {
      setSelectedCase?.((prev) => ({ ...(prev || {}), caseNo: resolvedCaseNo, caseName: resolvedCaseName }));
    }
    if (resolvedLeadNo && resolvedLeadName && !selectedLead?.leadNo) {
      setSelectedLead?.({
        leadNo:   resolvedLeadNo,
        leadName: resolvedLeadName,
        caseNo:   resolvedCaseNo,
        caseName: resolvedCaseName,
      });
    }
  }, [
    resolvedCaseNo, resolvedCaseName, resolvedLeadNo, resolvedLeadName,
    selectedCase?.caseNo, selectedLead?.leadNo, setSelectedCase, setSelectedLead,
  ]);

  /** Fetch lead instruction data and populate local state + context. */
  useEffect(() => {
    const fetchLeadInstructionData = async () => {
      const lead   = selectedLead?.leadNo ? selectedLead : leadDetails;
      // Prefer whichever object actually carries a MongoDB _id
      const kase   =
        selectedCase?._id || selectedCase?.id ? selectedCase :
        caseDetails?._id  || caseDetails?.id  ? caseDetails  :
        selectedCase;
      const kaseId = kase?._id || kase?.id;

      if (!lead?.leadNo || !kaseId) return;

      try {
        const token    = localStorage.getItem('token');
        const response = await api.get(
          `/api/lead/lead/${lead.leadNo}/${kaseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.length > 0) {
          const instruction = response.data[0];
          setLeadData({ ...instruction, assignedOfficer: instruction.assignedOfficer || [] });
          setLeadInstructions(instruction);
        }
      } catch (err) {
        console.error('Failed to fetch lead instruction data:', err);
      }
    };

    fetchLeadInstructionData();
  }, [selectedLead, selectedCase, setLeadInstructions]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Merge the fetched lead status upward using priority ranking. */
  useEffect(() => {
    if (!leadData?.leadStatus) return;
    setLeadStatus((prev) =>
      prev ? pickHigherStatus(prev, leadData.leadStatus) : leadData.leadStatus
    );
  }, [leadData?.leadStatus, setLeadStatus]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={styles.personPage}>
      <Navbar />

      <AlertModal
        isOpen={alertOpen}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />

      <div className={styles.LRIContent}>
        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          {/* Page-level navigation bar */}
          <LRTopMenu
            activePage="addLeadReturn"
            selectedCase={selectedCase}
            selectedLead={selectedLead}
            isPrimaryInvestigator={isPrimaryInvestigator}
            isGenerating={isGenerating}
            onManageLeadReturn={handleViewLeadReturn}
            styles={styles}
          />

          {/* Section tab navigation */}
          <SectionTabBar activeRoute="/LRInstruction" onNavigate={handleTabNavigation} />

          {/* Breadcrumb + lead status */}
          <BreadcrumbBar
            selectedCase={selectedCase}
            selectedLead={selectedLead}
            leadStatus={leadStatus}
          />

          {/* Page heading */}
          <div className={styles.caseHeader}>
            <h2>LEAD INSTRUCTIONS</h2>
          </div>

          {/* Main content */}
          <div className={styles.lriContentSection}>
            <LeadSummaryTable
              leadNo={selectedLead?.leadNo}
              caseNo={leadData.caseNo}
              assignedBy={leadData.assignedBy}
              assignedDate={leadData.assignedDate}
            />
            <LeadDetailTable leadData={leadData} />
          </div>

        </div>
      </div>
    </div>
  );
};
