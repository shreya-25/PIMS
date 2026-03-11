/**
 * LRPictures.jsx
 *
 * Manages the Pictures section of a Lead Return. Allows investigators and case
 * managers to add, edit, and delete picture records (image uploads or external
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
import { formatDate, alphabetToNumber, buildLeadCasePath, isHttpUrl } from "../lrUtils";
import { useLeadReport } from "../useLeadReport";

// ─── Constants ────────────────────────────────────────────────────────────────

// Section tab definitions — label + route + whether this tab is active here
const SECTION_TABS = [
  { label: "Instructions", path: "/LRInstruction" },
  { label: "Narrative",    path: "/LRReturn"      },
  { label: "Person",       path: "/LRPerson"      },
  { label: "Vehicles",     path: "/LRVehicle"     },
  { label: "Enclosures",   path: "/LREnclosures"  },
  { label: "Evidence",     path: "/LREvidence"    },
  { label: "Pictures",     path: "/LRPictures",   active: true },
  { label: "Audio",        path: "/LRAudio"       },
  { label: "Videos",       path: "/LRVideo"       },
  { label: "Notes",        path: "/LRScratchpad"  },
  { label: "Timeline",     path: "/LRTimeline"    },
];

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

/** Returns a blank picture form object. */
const defaultPicture = () => ({
  datePictureTaken: "",
  description:      "",
  image:            "",
  leadReturnId:     "",
  filename:         "",
  isLink:           false,
  link:             "",
});

/**
 * Validates the picture form and returns an array of missing field names.
 *
 * @param {Object}   pictureData - Current form state.
 * @param {File|null} file       - Currently selected file (if any).
 * @param {boolean}  isEditing   - true when updating an existing record.
 * @returns {string[]}
 */
const getMissingFields = ({ pictureData, file, isEditing }) => {
  const missing = [];

  if (!pictureData.leadReturnId?.trim())     missing.push("Narrative Id");
  if (!pictureData.datePictureTaken?.trim()) missing.push("Date Picture Taken");
  if (!pictureData.description?.trim())      missing.push("Description");

  if (pictureData.isLink) {
    if (!isHttpUrl(pictureData.link)) missing.push("Link (valid URL)");
  } else if (!isEditing && !file) {
    missing.push("Image File");
  }

  return missing;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const LRPictures = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Context ─────────────────────────────────────────────────────────────────
  const { selectedCase, selectedLead, leadStatus } = useContext(CaseContext);

  // ── Permission flags ────────────────────────────────────────────────────────
  const isCaseManager =
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";
  const signedInOfficer = localStorage.getItem("loggedInUser");

  // ── Lead status hook (read-only gate) ───────────────────────────────────────
  const { status, isReadOnly } = useLeadStatus({
    caseNo:   selectedCase.caseNo,
    caseName: selectedCase.caseName,
    leadNo:   selectedLead.leadNo,
    leadName: selectedLead.leadName,
  });

  // ── Session-storage keys (memoized per case/lead) ───────────────────────────
  const { formKey, listKey } = useMemo(() => {
    const cn = selectedCase?.caseNo  ?? "UNKC";
    const ln = selectedLead?.leadNo  ?? "UNKL";
    return {
      formKey: `LRPictures:${cn}:${ln}:form`,
      listKey: `LRPictures:${cn}:${ln}:list`,
    };
  }, [selectedCase?.caseNo, selectedLead?.leadNo]);

  // ── Core state ──────────────────────────────────────────────────────────────
  const [pictureData, setPictureData] = useState(() => {
    const saved = sessionStorage.getItem(formKey);
    return saved ? JSON.parse(saved) : defaultPicture();
  });
  const [pictures, setPictures] = useState(() => {
    const saved = sessionStorage.getItem(listKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [file,          setFile]          = useState(null);
  const [isEditing,     setIsEditing]     = useState(false);
  const [editingIndex,  setEditingIndex]  = useState(null);
  const [narrativeIds,  setNarrativeIds]  = useState([]);
  const [leadData,      setLeadData]      = useState({});

  // ── Alert / confirm modals ──────────────────────────────────────────────────
  const [alertOpen,          setAlertOpen]          = useState(false);
  const [alertMessage,       setAlertMessage]       = useState("");
  const [confirmOpen,        setConfirmOpen]        = useState(false);
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
    selectedLead?.leadStatus === "In Review" ||
    selectedLead?.leadStatus === "Completed"  ||
    isReadOnly;

  // ── Session storage sync ────────────────────────────────────────────────────

  // Reload form/list when the active case or lead changes
  useEffect(() => {
    const savedForm = sessionStorage.getItem(formKey);
    const savedList = sessionStorage.getItem(listKey);
    setPictureData(savedForm ? JSON.parse(savedForm) : defaultPicture());
    setPictures(savedList ? JSON.parse(savedList) : []);
    setIsEditing(false);
    setEditingIndex(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [formKey, listKey]);

  // Persist form draft
  useEffect(() => {
    sessionStorage.setItem(formKey, JSON.stringify(pictureData));
  }, [formKey, pictureData]);

  // Persist pictures list
  useEffect(() => {
    sessionStorage.setItem(listKey, JSON.stringify(pictures));
  }, [listKey, pictures]);

  // ── API: Fetch narrative IDs for the dropdown ───────────────────────────────
  useEffect(() => {
    if (!selectedLead?.leadNo || !selectedLead?.leadName ||
        !selectedCase?.caseNo || !selectedCase?.caseName) return;

    const controller = new AbortController();
    const token = localStorage.getItem("token");
    const path  = buildLeadCasePath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase.caseNo, selectedCase.caseName
    );

    (async () => {
      try {
        const resp = await api.get(`/api/leadReturnResult/${path}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal:  controller.signal,
        });

        const rawIds = (resp?.data || [])
          .map(r => String(r?.leadReturnId ?? "").trim().toUpperCase())
          .filter(Boolean);
        const ids = [...new Set(rawIds)];
        ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
        setNarrativeIds(ids);

        // Pre-select the latest narrative ID when creating a new record
        setPictureData(prev =>
          !isEditing && !prev.leadReturnId
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
    selectedCase?.caseNo, selectedCase?.caseName,
    isEditing,
  ]);

  // ── API: Fetch lead metadata (assignment info, primary investigator) ─────────
  useEffect(() => {
    if (!selectedLead?.leadNo || !selectedLead?.leadName ||
        !selectedCase?.caseNo || !selectedCase?.caseName) return;

    const token = localStorage.getItem("token");
    const path  = buildLeadCasePath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase.caseNo, selectedCase.caseName
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

  // ── API: Fetch pictures list ────────────────────────────────────────────────
  /**
   * Fetches the pictures list from the server and maps records to display shape.
   * Normalises signed URLs and links for use in the table.
   */
  const fetchPictures = useCallback(async () => {
    if (!selectedLead?.leadNo || !selectedCase?.caseNo) return;

    const token = localStorage.getItem("token");
    const path  = buildLeadCasePath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase.caseNo, selectedCase.caseName
    );

    try {
      const res = await api.get(`/api/lrpicture/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = res.data.map(pic => ({
        dateEntered:         formatDate(pic.enteredDate),
        rawEnteredDate:      pic.enteredDate,
        returnId:            pic.leadReturnId,
        datePictureTaken:    formatDate(pic.datePictureTaken),
        rawDatePictureTaken: pic.datePictureTaken,
        originalName:        pic.originalName,
        filename:            pic.filename,
        description:         pic.pictureDescription,
        image:               pic.signedUrl || pic.link || "",
        link:                pic.link      || "",
        accessLevel:         pic.accessLevel ?? "Everyone",
        pictureId:           pic._id,
      }));

      setPictures(mapped);
    } catch (err) {
      console.error("Error fetching pictures:", err);
    }
  }, [selectedLead, selectedCase]);

  useEffect(() => {
    if (selectedLead?.leadNo && selectedLead?.leadName &&
        selectedCase?.caseNo && selectedCase?.caseName) {
      fetchPictures();
    }
  }, [selectedLead, selectedCase]);

  // ── Handlers: navigation ────────────────────────────────────────────────────

  const navigateToLeadReview = () => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
    if (lead && kase) navigate("/LeadReview", { state: { caseDetails: kase, leadDetails: lead } });
  };

  const navigateToChainOfCustody = () => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
    if (lead && kase) {
      navigate("/ChainOfCustody", { state: { caseDetails: kase, leadDetails: lead } });
    } else {
      setAlertMessage("Please select a case and lead first.");
      setAlertOpen(true);
    }
  };

  const goToViewLR = useCallback(() => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
    if (!lead?.leadNo || !lead?.leadName || !kase?.caseNo || !kase?.caseName) {
      setAlertMessage("Please select a case and lead first.");
      setAlertOpen(true);
      return;
    }
    navigate("/viewLR", { state: { caseDetails: kase, leadDetails: lead } });
  }, [selectedLead, selectedCase, location.state, navigate]);

  // ── Handlers: form ──────────────────────────────────────────────────────────

  const handleInputChange = (field, value) => {
    setPictureData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handles image file selection. Revokes any existing blob preview URL to
   * prevent memory leaks before creating a new one.
   */
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (pictureData.image?.startsWith("blob:")) {
      try { URL.revokeObjectURL(pictureData.image); } catch {}
    }

    const preview = URL.createObjectURL(selected);
    setFile(selected);
    setPictureData(prev => ({
      ...prev,
      image:    preview,
      filename: selected.name,
      isLink:   false,
      link:     "",
    }));
  };

  /**
   * Switches between "file" and "link" upload modes.
   * Revokes any existing blob preview URL before clearing state.
   */
  const handleUploadTypeChange = (e) => {
    const nextIsLink = e.target.value === "link";

    setPictureData(prev => {
      if (prev.image?.startsWith("blob:")) {
        try { URL.revokeObjectURL(prev.image); } catch {}
      }
      return { ...prev, isLink: nextIsLink, link: "", image: "", filename: "" };
    });

    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Resets the form and exits edit mode. */
  const resetForm = useCallback(() => {
    setIsEditing(false);
    setEditingIndex(null);
    setPictureData(defaultPicture());
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /** Populates the form with an existing picture record for editing. */
  const handleEditPicture = useCallback((idx) => {
    const pic = pictures[idx];
    setPictureData({
      datePictureTaken: new Date(pic.rawDatePictureTaken).toISOString().slice(0, 10),
      leadReturnId:     pic.returnId,
      description:      pic.description,
      image:            pic.image,
      filename:         pic.filename,
      link:             pic.link || "",
      isLink:           !!pic.link,
      accessLevel:      pic.accessLevel || "Everyone",
    });
    setIsEditing(true);
    setEditingIndex(idx);
    setFile(null);
  }, [pictures]);

  // ── Handlers: CRUD ──────────────────────────────────────────────────────────

  /**
   * Validates the form, then POSTs a new picture record.
   * On success, refreshes the list and resets the form.
   */
  const handleAddPicture = async () => {
    const missing = getMissingFields({ pictureData, file, isEditing: false });
    if (missing.length) {
      setAlertMessage(
        `Please fill the required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`
      );
      setAlertOpen(true);
      return;
    }

    const fd = new FormData();
    if (!pictureData.isLink && file) fd.append("file", file);

    fd.append("leadNo",           selectedLead.leadNo);
    fd.append("description",      selectedLead.leadName);
    fd.append("enteredBy",        localStorage.getItem("loggedInUser"));
    fd.append("caseName",         selectedCase.caseName);
    fd.append("caseNo",           selectedCase.caseNo);
    fd.append("leadReturnId",     pictureData.leadReturnId || "");
    fd.append("enteredDate",      new Date().toISOString());
    fd.append("datePictureTaken", pictureData.datePictureTaken);
    fd.append("pictureDescription", pictureData.description);
    fd.append("accessLevel",      "Everyone");
    fd.append("isLink",           String(!!pictureData.isLink));
    if (pictureData.isLink && pictureData.link?.trim()) {
      fd.append("link", pictureData.link.trim());
    }

    // Let the browser set the correct multipart boundary
    const multipartConfig = {
      transformRequest: [(data, headers) => { delete headers["Content-Type"]; return data; }],
    };

    try {
      const token = localStorage.getItem("token");
      await api.post("/api/lrpicture/upload", fd, {
        headers: { Authorization: `Bearer ${token}` },
        ...multipartConfig,
      });

      await fetchPictures();
      sessionStorage.removeItem(formKey);
      resetForm();
    } catch (err) {
      console.error("Error uploading picture:", err);
      setAlertMessage("Failed to save picture. See console for details.");
      setAlertOpen(true);
    }
  };

  /**
   * Validates the form, then PUTs an updated picture record.
   * On success, refreshes the list and resets the form.
   */
  const handleUpdatePicture = async () => {
    if (!pictureData.description?.trim()) {
      setAlertMessage("Please enter a description.");
      setAlertOpen(true);
      return;
    }
    if (pictureData.isLink && !pictureData.link?.trim()) {
      setAlertMessage("Please enter a valid link.");
      setAlertOpen(true);
      return;
    }

    const pic = pictures[editingIndex];
    const fd  = new FormData();
    if (!pictureData.isLink && file) fd.append("file", file);

    fd.append("leadReturnId",     pictureData.leadReturnId);
    fd.append("datePictureTaken", pictureData.datePictureTaken);
    fd.append("pictureDescription", pictureData.description);
    fd.append("enteredBy",        localStorage.getItem("loggedInUser"));
    fd.append("accessLevel",      pictureData.accessLevel || pic.accessLevel || "Everyone");
    fd.append("isLink",           String(!!pictureData.isLink));
    if (pictureData.isLink) fd.append("link", pictureData.link.trim());

    const multipartConfig = {
      transformRequest: [(data, headers) => { delete headers["Content-Type"]; return data; }],
    };

    try {
      const token = localStorage.getItem("token");
      const path  = buildLeadCasePath(
        selectedLead.leadNo, selectedLead.leadName,
        selectedCase.caseNo, selectedCase.caseName
      );
      await api.put(
        `/api/lrpicture/${path}/${pic.returnId}/${encodeURIComponent(pic.description)}`,
        fd,
        { headers: { Authorization: `Bearer ${token}` }, ...multipartConfig }
      );

      await fetchPictures();
      resetForm();
    } catch (err) {
      console.error("Error updating picture:", err);
      setAlertMessage("Failed to update picture. See console for details.");
      setAlertOpen(true);
    }
  };

  /** Opens the delete confirmation modal for the given row. */
  const requestDeletePicture = (idx) => {
    setPendingDeleteIndex(idx);
    setConfirmOpen(true);
  };

  /** Executes the deletion after user confirmation. */
  const performDeletePicture = async () => {
    const idx = pendingDeleteIndex;
    if (idx == null) return;

    const pic   = pictures[idx];
    const token = localStorage.getItem("token");
    const path  = buildLeadCasePath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase.caseNo, selectedCase.caseName
    );

    try {
      await api.delete(
        `/api/lrpicture/${path}/${pic.returnId}/${encodeURIComponent(pic.description)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPictures(prev => prev.filter((_, i) => i !== idx));
    } catch (e) {
      console.error("Delete picture failed:", e);
      setAlertMessage("Failed to delete picture.");
      setAlertOpen(true);
    } finally {
      setConfirmOpen(false);
      setPendingDeleteIndex(null);
    }
  };

  /**
   * Updates the access level of a single picture row.
   * Sends a FormData PUT (matching the multer middleware), then updates local
   * state to avoid a full refetch.
   */
  const handleAccessChange = async (idx, newAccessLevel) => {
    const picture = pictures[idx];
    const token   = localStorage.getItem("token");
    const path    = buildLeadCasePath(
      selectedLead.leadNo, selectedLead.leadName,
      selectedCase.caseNo, selectedCase.caseName
    );

    const fd = new FormData();
    fd.append("leadReturnId",     picture.returnId);
    fd.append("datePictureTaken", picture.rawDatePictureTaken);
    fd.append("pictureDescription", picture.description);
    fd.append("enteredBy",        localStorage.getItem("loggedInUser"));
    fd.append("accessLevel",      newAccessLevel);

    try {
      await api.put(
        `/api/lrpicture/${path}/${picture.returnId}/${encodeURIComponent(picture.description)}`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
          transformRequest: [(data, headers) => { delete headers["Content-Type"]; return data; }],
        }
      );
      setPictures(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], accessLevel: newAccessLevel };
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
        isOpen={confirmOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record?"
        onConfirm={performDeletePicture}
        onClose={() => { setConfirmOpen(false); setPendingDeleteIndex(null); }}
      />

      <div className={styles.LRIContent}>
        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          {/* ── Page-level navigation bar ── */}
          <div className={styles.topMenuNav}>
            <div className={styles.menuItems}>
              <span className={styles.menuItem} onClick={navigateToLeadReview}>
                Lead Information
              </span>

              <span className={`${styles.menuItem} ${styles.menuItemActive}`}>
                Add Lead Return
              </span>

              {/* Case Manager / Detective Supervisor: generate full lead return report */}
              {["Case Manager", "Detective Supervisor"].includes(selectedCase?.role) && (
                <span
                  className={styles.menuItem}
                  onClick={handleViewLeadReturn}
                  title={isGenerating ? "Preparing report..." : "View Lead Return"}
                  style={{ opacity: isGenerating ? 0.6 : 1, pointerEvents: isGenerating ? "none" : "auto" }}
                >
                  Manage Lead Return
                </span>
              )}

              {/* Investigator: submit (primary) or review (non-primary) */}
              {selectedCase?.role === "Investigator" && (
                <span className={styles.menuItem} onClick={goToViewLR}>
                  {isPrimaryInvestigator ? "Submit Lead Return" : "Review Lead Return"}
                </span>
              )}

              <span className={styles.menuItem} onClick={navigateToChainOfCustody}>
                Lead Chain of Custody
              </span>
            </div>
          </div>

          {/* ── Section tab bar ── */}
          <div className={styles.topMenuSections}>
            <div className={styles.menuItems} style={{ fontSize: "19px" }}>
              {SECTION_TABS.map(({ label, path, active }) => (
                <span
                  key={path}
                  className={`${styles.menuItem}${active ? ` ${styles.menuItemActive}` : ""}`}
                  style={{ fontWeight: active ? "600" : "400" }}
                  onClick={() => navigate(path)}
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
                <span className={styles.crumbCurrent} aria-current="page">Lead Pictures</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? `Lead Status: ${status}` : leadStatus}
            </h5>
          </div>

          {/* ── Page heading ── */}
          <div className={styles.caseHeader}>
            <h2>PICTURES INFORMATION</h2>
          </div>

          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* ── Picture entry form ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Picture Entry</div>
                <div className={styles.LREnteringContentBox}>
                  <div className={styles.evidenceForm}>

                    {/* Row 1: Narrative Id + Date Picture Taken */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>Narrative Id*</label>
                        <select
                          value={pictureData.leadReturnId}
                          onChange={e => handleInputChange("leadReturnId", e.target.value)}
                        >
                          <option value="">Select Id</option>
                          {narrativeIds.map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formRowEvidence}>
                        <label>Date Picture Taken*</label>
                        <input
                          type="date"
                          value={pictureData.datePictureTaken}
                          onChange={e => handleInputChange("datePictureTaken", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 2: Description */}
                    <div className={styles.formRowEvidence}>
                      <label>Description*</label>
                      <textarea
                        value={pictureData.description}
                        onChange={e => handleInputChange("description", e.target.value)}
                      />
                    </div>

                    {/* Row 3: Upload Type + File / Link input */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>Upload Type</label>
                        <select
                          value={pictureData.isLink ? "link" : "file"}
                          onChange={handleUploadTypeChange}
                        >
                          <option value="file">File</option>
                          <option value="link">Link</option>
                        </select>
                      </div>
                      <div className={styles.formRowEvidence}>
                        {/* Editing a file-mode record that already has a file: show current name */}
                        {isEditing && !pictureData.isLink && pictureData.originalName ? (
                          <>
                            <label>Current File:</label>
                            <span className={styles.currentFilename}>{pictureData.originalName}</span>
                          </>
                        ) : !pictureData.isLink ? (
                          <>
                            <label>{isEditing ? "Replace Image (optional)" : "Upload Image"}</label>
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                            />
                          </>
                        ) : (
                          <>
                            <label>Paste Link</label>
                            <input
                              type="text"
                              placeholder="https://..."
                              value={pictureData.link}
                              onChange={e => handleInputChange("link", e.target.value)}
                            />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Row 4 (edit only): Replace-file row for records that already have a file */}
                    {isEditing && !pictureData.isLink && pictureData.originalName && (
                      <div className={styles.formRowEvidence}>
                        <label>Replace Image (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </div>
                    )}
                  </div>

                  {/* Form action buttons */}
                  <div className={styles.formButtonsReturn}>
                    <button
                      className={styles.saveBtn1}
                      disabled={isLeadLocked}
                      onClick={isEditing ? handleUpdatePicture : handleAddPicture}
                    >
                      {isEditing ? "Update Picture" : "Add Picture"}
                    </button>
                    {isEditing && (
                      <button
                        className={styles.saveBtn1}
                        disabled={isLeadLocked}
                        onClick={resetForm}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Pictures history table ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Pictures History</div>
                <table className={styles.leadsTable}>
                  <thead>
                    <tr>
                      <th>Date Entered</th>
                      <th>Narrative Id</th>
                      <th>File Name</th>
                      <th>Description</th>
                      <th>Actions</th>
                      {isCaseManager && <th style={{ width: "15%" }}>Access</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pictures.length > 0 ? (
                      pictures.map((picture, index) => (
                        <tr key={index}>
                          <td>{picture.dateEntered}</td>
                          <td>{picture.returnId}</td>
                          <td>
                            {picture.link ? (
                              <a href={picture.link} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                                {picture.link}
                              </a>
                            ) : (
                              <a href={picture.image} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                                {picture.originalName}
                              </a>
                            )}
                          </td>
                          <td>{picture.description}</td>
                          <td>
                            <div className={styles.lrTableBtn}>
                              <button
                                disabled={isLeadLocked}
                                onClick={() => handleEditPicture(index)}
                              >
                                <img
                                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                  alt="Edit"
                                  className={styles.editIcon}
                                />
                              </button>
                              <button
                                disabled={isLeadLocked}
                                onClick={() => requestDeletePicture(index)}
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
                                value={picture.accessLevel}
                                onChange={e => handleAccessChange(index, e.target.value)}
                                className={styles.accessDropdown}
                              >
                                <option value="Everyone">All</option>
                                <option value="Case Manager">Case Manager</option>
                                <option value="Case Manager and Assignees">Assignees</option>
                              </select>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign: "center" }}>
                          No Pictures Available
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
