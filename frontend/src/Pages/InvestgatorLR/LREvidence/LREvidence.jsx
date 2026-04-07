/**
 * LREvidence.jsx
 *
 * Manages the Evidence section of a Lead Return. Allows investigators and case
 * managers to add, edit, and delete evidence items (file uploads or external
 * links) linked to specific narrative IDs within a case/lead context.
 *
 * Access control:
 *  - Case Managers / Detective Supervisors see all records and may change
 *    per-row access levels.
 *  - Investigators and assignees see only records matching their access tier.
 *  - Read-only mode is enforced when the lead status is "In Review" or
 *    "Completed", or when useLeadStatus returns isReadOnly.
 */

import { useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

import Navbar from "../../../components/Navbar/Navbar";
import { SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { CaseContext } from "../../CaseContext";
import { useLeadStatus } from "../../../hooks/useLeadStatus";
import api from "../../../api";
import styles from "../LR.module.css";
import { formatDate, alphabetToNumber, buildLeadCaseIdPath } from "../lrUtils";
import { useLeadReport } from "../useLeadReport";
import { LRTopMenu } from "../LRTopMenu";

// ─── Constants ────────────────────────────────────────────────────────────────

const EVIDENCE_TYPES = [
  "Document",
  "Business Records",
  "Cellular Phone Records",
  "Deposition",
  "Statement",
];

// Section tab definitions — label + route + whether this tab is active here
const SECTION_TABS = [
  { label: "Instructions", path: "/LRInstruction" },
  { label: "Narrative",    path: "/LRReturn"      },
  { label: "Person",       path: "/LRPerson"      },
  { label: "Vehicles",     path: "/LRVehicle"     },
  { label: "Enclosures",   path: "/LREnclosures"  },
  { label: "Evidence",     path: "/LREvidence",   active: true },
  { label: "Pictures",     path: "/LRPictures"    },
  { label: "Audio",        path: "/LRAudio"       },
  { label: "Videos",       path: "/LRVideo"       },
  { label: "Notes",        path: "/LRScratchpad"  },
  { label: "Timeline",     path: "/LRTimeline"    },
];

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

/** Returns a blank evidence form object. */
const defaultEvidence = () => ({
  leadReturnId:        "",
  evidenceDescription: "",
  collectionDate:      "",
  disposedDate:        "",
  type:                "",
  disposition:         "",
  isLink:              false,
  link:                "",
  originalName:        "",
  filename:            "",
  uploadMode:          "file",    // "file" | "link"
  accessLevel:         "Everyone",
});

/**
 * Validates the evidence form and returns an array of missing field names.
 *
 * @param {Object}     evidenceData - Current form state.
 * @param {File|null}  file         - Currently selected file (if any).
 * @param {number|null} editIndex   - null when creating, row index when editing.
 * @returns {string[]}
 */
const getMissingFields = ({ evidenceData, file, editIndex }) => {
  const missing = [];

  if (!evidenceData.leadReturnId?.trim())       missing.push("Narrative Id");
  if (!evidenceData.collectionDate?.trim())     missing.push("Collection Date");
  if (!evidenceData.evidenceDescription?.trim()) missing.push("Description");

  if (evidenceData.uploadMode === "link") {
    if (!evidenceData.link?.trim()) missing.push("Link");
  } else if (evidenceData.uploadMode === "file" && editIndex === null && !file) {
    missing.push("File");
  }

  return missing;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const LREvidence = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Context ─────────────────────────────────────────────────────────────────
  const { selectedCase, selectedLead, leadStatus, setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const { caseDetails, leadDetails } = location.state || {};

  // ── Permission flags ────────────────────────────────────────────────────────
  const isCaseManager =
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";
  const signedInOfficer = localStorage.getItem("loggedInUser");

  // ── Lead status hook (read-only gate) ───────────────────────────────────────
  const { status, isReadOnly } = useLeadStatus({
    caseId:        selectedCase?._id || selectedCase?.id,
    leadNo:        selectedLead?.leadNo,
    leadName:      selectedLead?.leadName,
    initialStatus: selectedLead?.leadStatus,
  });

  // ── Session-storage keys (memoized per case/lead) ───────────────────────────
  const { formKey, listKey } = useMemo(() => {
    const cn   = selectedCase?.caseNo  ?? "NA";
    const cNam = encodeURIComponent(selectedCase?.caseName ?? "NA");
    const ln   = selectedLead?.leadNo  ?? "NA";
    const lNam = encodeURIComponent(selectedLead?.leadName ?? "NA");
    return {
      formKey: `LREvidence:form:${cn}:${cNam}:${ln}:${lNam}`,
      listKey: `LREvidence:list:${cn}:${cNam}:${ln}:${lNam}`,
    };
  }, [selectedCase?.caseNo, selectedCase?.caseName, selectedLead?.leadNo, selectedLead?.leadName]);

  // ── Core state ──────────────────────────────────────────────────────────────
  const [evidenceData, setEvidenceData] = useState(() => {
    const saved = sessionStorage.getItem(formKey);
    return saved ? JSON.parse(saved) : defaultEvidence();
  });
  const [evidences, setEvidences] = useState(() => {
    const saved = sessionStorage.getItem(listKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [file,         setFile]         = useState(null);
  const [editIndex,    setEditIndex]    = useState(null);
  const [originalDesc, setOriginalDesc] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [narrativeIds, setNarrativeIds] = useState([]);
  const [leadData,     setLeadData]     = useState({});

  // ── Alert / confirm modals ──────────────────────────────────────────────────
  const [alertOpen,          setAlertOpen]          = useState(false);
  const [alertMessage,       setAlertMessage]       = useState("");
  const [deleteOpen,         setDeleteOpen]         = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

  const fileInputRef = useRef();

  // ── Report generation (shared hook) ────────────────────────────────────────
  const { isGenerating, handleViewLeadReturn } = useLeadReport({
    selectedLead,
    selectedCase,
    location,
    setAlertMessage,
    setAlertOpen,
  });

  // ── Primary investigator check ──────────────────────────────────────────────
  const primaryUsername = leadData?.primaryInvestigator || leadData?.primaryOfficer || "";
  const isPrimaryInvestigator =
    selectedCase?.role === "Investigator" &&
    !!signedInOfficer &&
    signedInOfficer === primaryUsername;

  // ── Derived: is the form / table locked from edits? ────────────────────────
  const isLeadLocked =
    selectedLead?.leadStatus === "Completed" ||
    isReadOnly;

  // ── Session storage sync ────────────────────────────────────────────────────

  // Reload form/list when the active case or lead changes
  useEffect(() => {
    const savedForm = sessionStorage.getItem(formKey);
    const savedList = sessionStorage.getItem(listKey);
    setEvidenceData(savedForm ? JSON.parse(savedForm) : defaultEvidence());
    setEvidences(savedList ? JSON.parse(savedList) : []);
    setEditIndex(null);
    setOriginalDesc("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [formKey, listKey]);

  // Persist form draft
  useEffect(() => {
    sessionStorage.setItem(formKey, JSON.stringify(evidenceData));
  }, [formKey, evidenceData]);

  // Persist evidence list
  useEffect(() => {
    sessionStorage.setItem(listKey, JSON.stringify(evidences));
  }, [listKey, evidences]);

  // ── Sync context from router state (covers fresh-session tab navigation) ────
  useEffect(() => {
    if (caseDetails && leadDetails) {
      setSelectedCase(caseDetails);
      setSelectedLead(leadDetails);
    }
  }, [caseDetails, leadDetails]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── API: Fetch narrative IDs for the dropdown ───────────────────────────────
  useEffect(() => {
    if (!selectedLead?.leadNo || !selectedLead?.leadName ||
        !selectedCase?._id && !selectedCase?.id) return;

    const controller = new AbortController();
    const token = localStorage.getItem("token");
    const path  = buildLeadCaseIdPath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase._id || selectedCase.id
    );

    (async () => {
      try {
        const resp = await api.get(`/api/leadReturnResult/${path}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal:  controller.signal,
        });

        const ids = [
          ...new Set((resp?.data || []).map(r => r?.leadReturnId).filter(Boolean)),
        ];
        ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
        setNarrativeIds(ids);

        // Pre-select the latest narrative ID when creating a new record
        setEvidenceData(prev =>
          editIndex === null && !prev.leadReturnId
            ? { ...prev, leadReturnId: ids.at(-1) || "" }
            : prev
        );
      } catch (e) {
        if (!controller.signal.aborted) console.error("Failed to fetch Narrative Ids:", e);
      }
    })();

    return () => controller.abort();
  }, [
    selectedLead?.leadNo, selectedLead?.leadName,
    selectedCase?._id, selectedCase?.id,
    editIndex,
  ]);

  // ── API: Fetch lead metadata (assignment info, primary investigator) ─────────
  useEffect(() => {
    if (!selectedLead?.leadNo || !selectedLead?.leadName ||
        !selectedCase?._id && !selectedCase?.id) return;

    const token = localStorage.getItem("token");
    const path  = buildLeadCaseIdPath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase._id || selectedCase.id
    );

    api
      .get(`/api/lead/lead/${path}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.length > 0) {
          setLeadData({
            ...res.data[0],
            assignedTo: res.data[0].assignedTo || [],
            leadStatus: res.data[0].leadStatus  || "",
          });
        }
      })
      .catch(err => console.error("Failed to fetch lead data:", err));
  }, [selectedLead, selectedCase]);

  // ── API: Fetch evidence list ────────────────────────────────────────────────
  /**
   * Fetches the evidence list from the server, maps to display shape, and
   * applies visibility filtering based on the current user's role and access level.
   */
  const fetchEvidences = useCallback(async () => {
    if (!selectedLead?.leadNo || !selectedCase?._id && !selectedCase?.id) return;

    const token = localStorage.getItem("token");
    const path  = buildLeadCaseIdPath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase._id || selectedCase.id
    );

    try {
      const res = await api.get(`/api/lrevidence/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = res.data.map(enc => ({
        dateEntered:         formatDate(enc.enteredDate),
        type:                enc.type,
        evidenceDescription: enc.evidenceDescription,
        returnId:            enc.leadReturnId,
        originalName:        enc.originalName,
        collectionDate:      formatDate(enc.collectionDate),
        disposedDate:        formatDate(enc.disposedDate),
        disposition:         enc.disposition,
        filename:            enc.filename,
        link:                enc.link      || "",
        signedUrl:           enc.signedUrl || "",
        accessLevel:         enc.accessLevel ?? "Everyone",
        enteredBy:           enc.enteredBy,
      }));

      // Non-case-managers see only records they are permitted to view
      const currentUser   = localStorage.getItem("loggedInUser")?.trim();
      const leadAssignees = (leadData?.assignedTo || []).map(a => a?.trim());

      const visible = isCaseManager
        ? mapped
        : mapped.filter(ev => {
            if (ev.accessLevel === "Everyone") return true;
            if (ev.accessLevel === "Case Manager and Assignees") {
              return leadAssignees.some(a => a === currentUser);
            }
            return false; // "Case Manager" only
          });

      setEvidences(visible);
    } catch (err) {
      console.error("Error fetching evidences:", err);
    }
  }, [selectedLead, selectedCase, isCaseManager, leadData?.assignedTo]);

  useEffect(() => {
    if (selectedLead?.leadNo && selectedLead?.leadName &&
        (selectedCase?._id || selectedCase?.id)) {
      fetchEvidences();
    }
  }, [selectedLead, selectedCase]);


  // ── Handlers: form ──────────────────────────────────────────────────────────

  const handleInputChange = (field, value) => {
    setEvidenceData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  /** Switches between "file" and "link" upload modes, clearing stale state. */
  const handleUploadModeChange = (mode) => {
    setEvidenceData(prev => ({
      ...prev,
      uploadMode: mode,
      isLink:     mode === "link",
      link:       mode === "link" ? prev.link : "",
    }));
    if (mode !== "file") {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleRowExpand = useCallback((idx) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  /** Resets the form and exits edit mode. */
  const resetForm = useCallback(() => {
    setEditIndex(null);
    setOriginalDesc("");
    setEvidenceData(defaultEvidence());
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /** Populates the form with an existing evidence record for editing. */
  const handleEdit = useCallback((idx) => {
    const ev = evidences[idx];
    const hasLink = !!ev.link;
    setEditIndex(idx);
    setOriginalDesc(ev.evidenceDescription);
    setEvidenceData({
      leadReturnId:        ev.returnId,
      collectionDate:      ev.collectionDate,
      disposedDate:        ev.disposedDate,
      type:                ev.type,
      evidenceDescription: ev.evidenceDescription,
      disposition:         ev.disposition,
      isLink:              hasLink,
      link:                ev.link || "",
      originalName:        ev.originalName,
      filename:            ev.filename,
      uploadMode:          hasLink ? "link" : "file",
      accessLevel:         ev.accessLevel || "Everyone",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [evidences]);

  // ── Handlers: CRUD ──────────────────────────────────────────────────────────

  /**
   * Validates the form, then creates (POST) or updates (PUT) an evidence record.
   * On success, refreshes the list and resets the form.
   */
  const handleSaveEvidence = async () => {
    const missing = getMissingFields({ evidenceData, file, editIndex });
    if (missing.length) {
      setAlertMessage(
        `Please fill the required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`
      );
      setAlertOpen(true);
      return;
    }

    const fd = new FormData();
    if (evidenceData.uploadMode === "file" && file) fd.append("file", file);

    fd.append("leadNo",              selectedLead.leadNo);
    fd.append("description",         selectedLead.leadName);
    fd.append("enteredBy",           localStorage.getItem("loggedInUser"));
    fd.append("caseName",            selectedCase.caseName);
    fd.append("caseNo",              selectedCase.caseNo);
    fd.append("leadReturnId",        evidenceData.leadReturnId);
    fd.append("enteredDate",         new Date().toISOString());
    fd.append("type",                evidenceData.type);
    fd.append("evidenceDescription", evidenceData.evidenceDescription);
    fd.append("collectionDate",      evidenceData.collectionDate);
    fd.append("disposedDate",        evidenceData.disposedDate);
    fd.append("disposition",         evidenceData.disposition);
    fd.append("accessLevel",         evidenceData.accessLevel || "Everyone");
    fd.append("isLink",              String(evidenceData.uploadMode === "link"));
    if (evidenceData.uploadMode === "link" && evidenceData.link?.trim()) {
      fd.append("link", evidenceData.link.trim());
    }

    // Let the browser set the correct multipart boundary by removing Content-Type
    const multipartConfig = {
      transformRequest: [(data, headers) => { delete headers["Content-Type"]; return data; }],
    };

    try {
      const token  = localStorage.getItem("token");
      const authHdr = { Authorization: `Bearer ${token}` };

      if (editIndex === null) {
        await api.post("/api/lrevidence/upload", fd, { headers: authHdr, ...multipartConfig });

        // Optimistically show the new entry immediately
        setEvidences(prev => [
          ...prev,
          {
            dateEntered:         formatDate(new Date().toISOString()),
            type:                evidenceData.type,
            evidenceDescription: evidenceData.evidenceDescription,
            returnId:            evidenceData.leadReturnId,
            originalName:        file?.name || "",
            collectionDate:      formatDate(evidenceData.collectionDate),
            disposedDate:        formatDate(evidenceData.disposedDate || ""),
            disposition:         evidenceData.disposition || "",
            filename:            "",
            link:                evidenceData.uploadMode === "link" ? evidenceData.link : "",
            signedUrl:           "",
            accessLevel:         evidenceData.accessLevel || "Everyone",
            enteredBy:           localStorage.getItem("loggedInUser"),
          },
        ]);
      } else {
        const ev   = evidences[editIndex];
        const path = buildLeadCaseIdPath(
          selectedLead.leadNo, selectedLead.leadName,
          selectedCase._id || selectedCase.id
        );
        await api.put(
          `/api/lrevidence/${path}/${ev.returnId}/${encodeURIComponent(originalDesc)}`,
          fd,
          { headers: authHdr, ...multipartConfig }
        );

        // Optimistically update the edited row
        setEvidences(prev => prev.map((e, i) =>
          i === editIndex
            ? {
                ...e,
                type:                evidenceData.type,
                evidenceDescription: evidenceData.evidenceDescription,
                returnId:            evidenceData.leadReturnId,
                collectionDate:      formatDate(evidenceData.collectionDate),
                disposedDate:        formatDate(evidenceData.disposedDate || ""),
                disposition:         evidenceData.disposition || "",
                originalName:        file ? file.name : e.originalName,
                link:                evidenceData.uploadMode === "link" ? evidenceData.link : e.link,
                accessLevel:         evidenceData.accessLevel || e.accessLevel,
              }
            : e
        ));
      }

      // Background refresh to get accurate signedUrls from server
      fetchEvidences().catch(() => {});
      sessionStorage.removeItem(formKey);
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      setAlertMessage("Failed to save evidence.");
      setAlertOpen(true);
    }
  };

  /** Opens the delete confirmation modal for the given row. */
  const requestDelete = (idx) => {
    setPendingDeleteIndex(idx);
    setDeleteOpen(true);
  };

  /** Executes the deletion after user confirmation. */
  const confirmDelete = async () => {
    const idx = pendingDeleteIndex;
    setDeleteOpen(false);
    setPendingDeleteIndex(null);
    if (idx == null) return;

    const ev    = evidences[idx];
    const token = localStorage.getItem("token");
    const path  = buildLeadCaseIdPath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase._id || selectedCase.id
    );

    try {
      await api.delete(
        `/api/lrevidence/${path}/${ev.returnId}/${encodeURIComponent(ev.evidenceDescription)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvidences(prev => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error(err);
      setAlertMessage("Failed to delete: " + (err.response?.data?.message || err.message));
      setAlertOpen(true);
    }
  };

  /**
   * Updates the access level of a single evidence row.
   * Sends a PATCH-style PUT to persist the change server-side, then
   * updates local state to avoid a full refetch.
   */
  const handleAccessChange = async (idx, newAccess) => {
    const ev    = evidences[idx];
    const token = localStorage.getItem("token");
    const path  = buildLeadCaseIdPath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase._id || selectedCase.id
    );

    try {
      await api.put(
        `/api/lrevidence/${path}/${ev.returnId}/${encodeURIComponent(ev.evidenceDescription)}`,
        { accessLevel: newAccess },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvidences(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], accessLevel: newAccess };
        return next;
      });
    } catch (err) {
      console.error("Failed to update accessLevel", err);
      setAlertMessage("Could not change access level. Please try again.");
      setAlertOpen(true);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.evidencePage}>
      <Navbar />

      {/* Notification modal */}
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
        message="Are you sure you want to delete this evidence? This action cannot be undone."
        onConfirm={confirmDelete}
        onClose={() => { setDeleteOpen(false); setPendingDeleteIndex(null); }}
      />

      <div className={styles.LRIContent}>
        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          {/* ── Page-level navigation bar ── */}
          <LRTopMenu
            activePage="addLeadReturn"
            selectedCase={selectedCase}
            selectedLead={selectedLead}
            isPrimaryInvestigator={isPrimaryInvestigator}
            isGenerating={isGenerating}
            onManageLeadReturn={handleViewLeadReturn}
            styles={styles}
          />

          {/* ── Section tab bar ── */}
          <div className={styles.topMenuSections}>
            <div className={styles.menuItems} style={{ fontSize: "19px" }}>
              {SECTION_TABS.map(({ label, path, active }) => (
                <span
                  key={path}
                  className={`${styles.menuItem}${active ? ` ${styles.menuItemActive}` : ""}`}
                  style={{ fontWeight: active ? "600" : "400" }}
                  onClick={() => navigate(path, { state: { caseDetails: selectedCase, leadDetails: selectedLead } })}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Breadcrumb + lead status ── */}
          <div className={styles.caseandleadinfo}>
            <h5 className={styles.sideTitle}>
              <div className={styles.ldHead}>
                <Link to="/HomePage" className={styles.crumb}>PIMS Home</Link>
                <span className={styles.sep}>{" >> "}</span>
                <Link
                  to={selectedCase?.role === "Investigator" ? "/Investigator" : "/CasePageManager"}
                  state={{ caseDetails: selectedCase }}
                  className={styles.crumb}
                >
                  Case: {selectedCase.caseNo || ""}
                </Link>
                <span className={styles.sep}>{" >> "}</span>
                <Link to="/LeadReview" state={{ leadDetails: selectedLead }} className={styles.crumb}>
                  Lead: {selectedLead.leadNo || ""}
                </Link>
                <span className={styles.sep}>{" >> "}</span>
                <span className={styles.crumbCurrent} aria-current="page">Lead Evidence</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status: ${status}` : leadStatus}
            </h5>
          </div>

          {/* ── Page heading ── */}
          <div className={styles.caseHeader}>
            <h2>EVIDENCE INFORMATION</h2>
          </div>

          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* ── Evidence entry form ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Evidence Entry</div>
                <div className={styles.LREnteringContentBox}>
                  <div className={styles.evidenceForm}>

                    {/* Row 1: Narrative Id + Type */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>Narrative Id*</label>
                        <select
                          value={evidenceData.leadReturnId}
                          onChange={e => handleInputChange("leadReturnId", e.target.value)}
                        >
                          <option value="">Select Id</option>
                          {narrativeIds.map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formRowEvidence}>
                        <label>Type</label>
                        <select
                          value={evidenceData.type}
                          onChange={e => handleInputChange("type", e.target.value)}
                        >
                          <option value="">Select Type</option>
                          {EVIDENCE_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Collection Date + Disposed Date */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>Collection Date*</label>
                        <input
                          type="date"
                          value={evidenceData.collectionDate}
                          onChange={e => handleInputChange("collectionDate", e.target.value)}
                        />
                      </div>
                      <div className={styles.formRowEvidence}>
                        <label>Disposed Date</label>
                        <input
                          type="date"
                          value={evidenceData.disposedDate}
                          onChange={e => handleInputChange("disposedDate", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 3: Description */}
                    <div className={styles.formRowEvidence}>
                      <label>Description*</label>
                      <textarea
                        value={evidenceData.evidenceDescription}
                        onChange={e => handleInputChange("evidenceDescription", e.target.value)}
                      />
                    </div>

                    {/* Row 4: Upload Type + File / Link input */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>Upload Type</label>
                        <select
                          value={evidenceData.uploadMode}
                          onChange={e => handleUploadModeChange(e.target.value)}
                        >
                          <option value="file">File</option>
                          <option value="link">Link</option>
                        </select>
                      </div>
                      <div className={styles.formRowEvidence}>
                        {evidenceData.uploadMode === "file" ? (
                          <>
                            <div className={styles.uploadLabelRow}>
                              <label>Upload File</label>
                              {!file && editIndex !== null && evidenceData.originalName && (
                                <span className={styles.currentFilenameInline}>{evidenceData.originalName}</span>
                              )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} />
                          </>
                        ) : (
                          <>
                            <label>Paste Link</label>
                            <input
                              type="text"
                              placeholder="https://..."
                              value={evidenceData.link}
                              onChange={e => handleInputChange("link", e.target.value)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form action buttons */}
                  <div className={styles.formButtonsReturn}>
                    <button
                      className={styles.saveBtn1}
                      disabled={isLeadLocked}
                      onClick={handleSaveEvidence}
                    >
                      {editIndex === null ? "Add Evidence" : "Update"}
                    </button>
                    {editIndex !== null && (
                      <button
                        className={styles.cancelBtn}
                        disabled={isLeadLocked}
                        onClick={resetForm}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Evidence history table ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Evidence History</div>
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
                      {isCaseManager && <th style={{ width: "15%" }}>Access</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {evidences.length > 0 ? (
                      evidences.map((item, index) => {
                        const canModify = isCaseManager || item.enteredBy?.trim() === signedInOfficer?.trim();
                        return (
                        <tr key={index}>
                          <td>{item.returnId}</td>
                          <td>{item.dateEntered}</td>
                          <td>{item.enteredBy}</td>
                          <td>{item.type}</td>
                          <td className={styles.descriptionCell}>
                            <div className={expandedRows.has(index) ? styles.narrativeContentExpanded : styles.narrativeContentCollapsed}>
                              {item.evidenceDescription}
                            </div>
                            {item.evidenceDescription && (
                              <button className={styles.viewToggleBtn} onClick={() => toggleRowExpand(index)}>
                                {expandedRows.has(index) ? 'View Less ▲' : 'View ▶'}
                              </button>
                            )}
                          </td>
                          <td>
                            {item.link ? (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                                {item.link}
                              </a>
                            ) : item.originalName ? (
                              <a href={item.signedUrl} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                                {item.originalName}
                              </a>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.lrTableBtn}>
                              <button disabled={isLeadLocked || !canModify} onClick={() => handleEdit(index)}>
                                <img
                                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                  alt="Edit"
                                  className={styles.editIcon}
                                />
                              </button>
                              <button disabled={isLeadLocked || !canModify} onClick={() => requestDelete(index)}>
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
                                value={item.accessLevel}
                                onChange={e => handleAccessChange(index, e.target.value)}
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
                      })
                    ) : (
                      <tr>
                        <td colSpan={isCaseManager ? 8 : 7} style={{ textAlign: "center" }}>
                          No Evidences Available
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
