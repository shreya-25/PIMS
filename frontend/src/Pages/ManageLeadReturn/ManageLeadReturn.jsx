import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import CommentBar from "../../components/CommentBar/CommentBar";
import { CaseContext } from "../CaseContext";
import api from "../../api";
import { safeEncode } from "../../utils/encode";
import styles from "../ViewLR/ViewLR.module.css";
import s from "./ManageLeadReturn.module.css";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import { useLeadStatus } from "../../hooks/useLeadStatus";
import PersonModal from "../../components/PersonModal/PersonModel";
import VehicleModal from "../../components/VehicleModal/VehicleModal";

// ── helpers ──────────────────────────────────────────────────────────────────
const formatAddress = (addr) => {
  if (!addr || typeof addr !== "object") return addr ?? "—";
  const line1 = [addr.street1, addr.street2].filter(Boolean).join(" ");
  const cityStZip = [addr.city, addr.state].filter(Boolean).join(", ");
  const zip = addr.zipCode || addr.zip;
  return [line1, [cityStZip, zip].filter(Boolean).join(" ")].filter(Boolean).join(" • ");
};

const toText = (v) => {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(toText).join(", ");
  if (v.street1 || v.city || v.state || v.zipCode || v.zip) return formatAddress(v);
  try { return JSON.stringify(v); } catch { return "—"; }
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d)) return "—";
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
};

// ── Main component ────────────────────────────────────────────────────────────
export const ManageLeadReturn = () => {
  const navigate   = useNavigate();
  const location   = useLocation();

  // ── data state ──
  const [instructions, setInstructions] = useState({});
  const [returns,      setReturns]      = useState([]);
  const [persons,      setPersons]      = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [enclosures,   setEnclosures]   = useState([]);
  const [evidence,     setEvidence]     = useState([]);
  const [pictures,     setPictures]     = useState([]);
  const [audio,        setAudio]        = useState([]);
  const [videos,       setVideos]       = useState([]);
  const [notes,        setNotes]        = useState([]);
  const [timeline,     setTimeline]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [leadData,     setLeadData]     = useState({});
  const [dsSupervisors, setDsSupervisors] = useState([]);
  const [allUsers,     setAllUsers]     = useState([]);

  // ── modal state ──
  const [openPerson,        setOpenPerson]        = useState(null);
  const [openVehicle,       setOpenVehicle]       = useState(null);
  const [showComments,      setShowComments]      = useState(true);
  const [selectedTimeline,  setSelectedTimeline]  = useState(null);
  const [selectedDetail,    setSelectedDetail]    = useState(null);
  const [alertOpen, setAlertOpen]      = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [notifyConfig, setNotifyConfig] = useState({ open: false, title: "Notification", message: "" });
  const [confirmConfig, setConfirmConfig] = useState({ open: false, title: "", message: "", onConfirm: () => {} });

  const currentUser = localStorage.getItem("loggedInUser");
  const { selectedCase, selectedLead, setSelectedLead, setLeadStatus } = useContext(CaseContext);

  // ── PDF generation state ──
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfProgress,  setPdfProgress]  = useState(0);
  const pdfAbortRef = React.useRef(null);
  const pdfIntervalRef = React.useRef(null);

  const handleViewAsPdf = async () => {
    const controller = new AbortController();
    pdfAbortRef.current = controller;

    setShowPdfModal(true);
    setPdfProgress(0);

    pdfIntervalRef.current = setInterval(() => {
      setPdfProgress((prev) => {
        if (prev >= 90) { clearInterval(pdfIntervalRef.current); return prev; }
        return prev + (90 - prev) * 0.07;
      });
    }, 200);

    try {
      const token = localStorage.getItem("token");

      // Data fetched in useEffect already has signedUrl attached by the backend,
      // so no secondary /files/:id fetch is needed.
      const reportBody = {
        user:            localStorage.getItem("loggedInUser") || "",
        reportTimestamp: new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
        selectedReports: {
          FullReport: true, leadInstruction: true, leadReturn: true,
          leadPersons: true, leadVehicles: true, leadEnclosures: true,
          leadEvidence: true, leadPictures: true, leadAudio: true,
          leadVideos: true, leadScratchpad: true, leadTimeline: true,
        },
        leadInstruction:  instructions,
        leadInstructions: instructions,
        leadReturn:       returns,
        leadReturns:      returns,
        leadPersons:      persons,
        leadVehicles:     vehicles,
        leadEnclosures:   enclosures,
        leadEvidence:     evidence,
        leadPictures:     pictures,
        leadAudio:        audio,
        leadVideos:       videos,
        leadScratchpad:   notes,
        leadTimeline:     timeline,
        timezone:         "America/New_York",
      };

      const resp = await api.post("/api/report/generate", reportBody, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearInterval(pdfIntervalRef.current);
      setPdfProgress(100);

      setTimeout(() => {
        setShowPdfModal(false);
        navigate("/DocumentReview", {
          state: {
            pdfBlob: new Blob([resp.data], { type: "application/pdf" }),
            filename: `Lead_${leadNo || "report"}.pdf`,
          },
        });
      }, 350);
    } catch (err) {
      clearInterval(pdfIntervalRef.current);
      setShowPdfModal(false);
      setPdfProgress(0);
      if (err?.name === "CanceledError" || err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      let msg = "Error generating PDF: ";
      if (err?.response?.data instanceof Blob) {
        msg += await err.response.data.text();
      } else {
        msg += err.message || "Unknown error";
      }
      setAlertMessage(msg);
      setAlertOpen(true);
    }
  };

  const handleCancelPdf = () => {
    pdfAbortRef.current?.abort();
    clearInterval(pdfIntervalRef.current);
    setShowPdfModal(false);
    setPdfProgress(0);
  };

  // ── lead status hook ──
  const { status, setLocalStatus } = useLeadStatus({
    caseId: selectedCase._id || selectedCase.id,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
    initialStatus: selectedLead?.leadStatus,
  });

  // ── derived ids / labels ──
  const caseNo   = selectedCase?.caseNo   || location.state?.caseDetails?.caseNo;
  const caseName = selectedCase?.caseName || location.state?.caseDetails?.caseName;
  const leadNo   = selectedLead?.leadNo   || location.state?.leadDetails?.leadNo;
  const leadName = selectedLead?.leadName || location.state?.leadDetails?.leadName;

  // ── role flags ──
  const isReadOnly = selectedCase?.role === "Read Only";

  // ── role / status flags ──
  const isPrivileged = ["Case Manager", "Detective Supervisor", "Admin"].includes(selectedCase?.role);

  const normStatus          = String(status || "").toLowerCase();
  const isInReview          = normStatus === "in review";
  const isReturned          = normStatus === "returned";
  const isCompleted         = normStatus === "completed";
  const isClosed            = normStatus === "closed";
  const isApprovedOrBeyond  = isCompleted || isClosed || normStatus === "approved";

  // ── button enable / disable ──
  const canApprove = isPrivileged && isInReview;
  const approveDisabledReason = !isPrivileged
    ? "Only Case Managers, Detective Supervisors, or Admins can approve"
    : !isInReview
    ? "Lead must be In Review to approve"
    : "";

  const canReturn = isPrivileged && isInReview;
  const returnDisabledReason = !isPrivileged
    ? "Only Case Managers, Detective Supervisors, or Admins can return"
    : !isInReview
    ? "Lead must be In Review to return for changes"
    : "";

  const canReopen = isPrivileged && isApprovedOrBeyond;
  const reopenDisabledReason = !isPrivileged
    ? "Only Case Managers, Detective Supervisors, or Admins can reopen"
    : !isApprovedOrBeyond
    ? "Lead must be Approved or Closed to reopen"
    : "";

  // ── read-only link helper — renders a plain span instead of navigating ──
  const SectionLink = ({ className, to, state: linkState, children }) =>
    isReadOnly
      ? <span className={className} style={{ cursor: "default" }}>{children}</span>
      : <Link className={className} to={to} state={linkState}>{children}</Link>;

  // ── helpers ──
  const getCasePageRoute = () => {
    if (!selectedCase?.role) return "/HomePage";
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };

  const toggleComments = useCallback(() => setShowComments((s) => !s), []);

  // ── fetch all users (for display names) ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    api.get("/api/users/usernames", { headers: { Authorization: `Bearer ${token}` }, suppressGlobalError: true })
      .then((res) => setAllUsers(Array.isArray(res.data?.users) ? res.data.users : []))
      .catch(() => {});
  }, []);

  const displayUser = (username) => {
    if (!username) return "Unknown";
    const u = allUsers.find((u) => u.username === username);
    if (!u) return username;
    const last  = (u.lastName  || "").trim();
    const first = (u.firstName || "").trim();
    const name  = last && first ? `${last}, ${first}` : last || first || "";
    return name ? `${name} (${username})` : username;
  };

  // ── fetch all section data ──
  useEffect(() => {
    let caseId = selectedCase?._id || selectedCase?.id || location.state?.caseDetails?._id;
    const effectiveCaseNo = selectedCase?.caseNo || location.state?.caseDetails?.caseNo;
    if (!leadNo || !leadName) return;

    async function resolveAndLoad() {
      if (!caseId && effectiveCaseNo) {
        try {
          const token = localStorage.getItem("token");
          const { data: caseDoc } = await api.get(`/api/cases/caseNo/${effectiveCaseNo}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          caseId = caseDoc?._id;
        } catch (e) {
          console.error("Failed to resolve caseId:", e);
        }
      }
      if (!caseId) return;

      const encLead = safeEncode(leadName);
      const token   = localStorage.getItem("token");
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      setLoading(true);
      try {
        const [
          instrRes, returnsRes, personsRes, vehiclesRes,
          enclosuresRes, evidenceRes, picturesRes, audioRes,
          videosRes, notesRes, timelineRes,
        ] = await Promise.all([
          api.get(`/api/lead/lead/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/lrenclosure/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/lrevidence/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/lrpicture/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/lraudio/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/lrvideo/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/scratchpad/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
          api.get(`/api/timeline/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
        ]);

        const leadDoc = instrRes.data?.[0] || {};
        setInstructions(leadDoc);
        setLeadData(leadDoc);

        // fetch DS list (non-blocking)
        if (effectiveCaseNo) {
          api.get(`/api/cases/${effectiveCaseNo}/team`, { ...headers, suppressGlobalError: true })
            .then((r) => setDsSupervisors(
              (r.data?.detectiveSupervisors || [])
                .map((ds) => (typeof ds === "string" ? ds : ds?.username || ds?.name || ""))
                .filter(Boolean)
            ))
            .catch(() => {});
        }

        setReturns(returnsRes.data     || []);
        setPersons(personsRes.data     || []);
        setVehicles(vehiclesRes.data   || []);
        setEnclosures(enclosuresRes.data || []);
        setEvidence(evidenceRes.data   || []);
        setPictures(picturesRes.data   || []);
        setAudio(audioRes.data         || []);
        setVideos(videosRes.data       || []);
        setNotes(notesRes.data         || []);
        setTimeline(timelineRes.data   || []);
      } finally {
        setLoading(false);
      }
    }
    resolveAndLoad();
  }, [selectedCase?._id, selectedCase?.id, selectedCase?.caseNo, leadNo, leadName]);

  // ── group sections by return id ──
  const keyFor = (obj) => obj.narrativeId || obj.returnId || obj.lrId || obj.leadReturnId || obj._id;

  const sectionsByReturn = useMemo(() => {
    const map = new Map();
    const touch = (k) => {
      if (!map.has(k)) map.set(k, { persons: [], vehicles: [], enclosures: [], evidence: [], pictures: [], audio: [], videos: [], notes: [], timeline: [], });
      return map.get(k);
    };
    persons.forEach((x)    => touch(keyFor(x)).persons.push(x));
    vehicles.forEach((x)   => touch(keyFor(x)).vehicles.push(x));
    enclosures.forEach((x) => touch(keyFor(x)).enclosures.push(x));
    evidence.forEach((x)   => touch(keyFor(x)).evidence.push(x));
    pictures.forEach((x)   => touch(keyFor(x)).pictures.push(x));
    audio.forEach((x)      => touch(keyFor(x)).audio.push(x));
    videos.forEach((x)     => touch(keyFor(x)).videos.push(x));
    notes.filter(n => n.type === 'Lead').forEach((x) => touch(keyFor(x)).notes.push(x));
    timeline.forEach((x) => touch(keyFor(x)).timeline.push(x));
    return map;
  }, [persons, vehicles, enclosures, evidence, pictures, audio, videos, notes, timeline]);

  // ── notification helpers ──
  const normalizeAssignees = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((a) => (typeof a === "string" ? a.trim() : a?.username || a?.assignee || a?.name || ""))
      .filter(Boolean);
  };

  const buildRecipients = () => {
    const currentUserId = localStorage.getItem("userId");
    const uniq = new Map();
    const push = (username, role, userId) => {
      if (!username) return;
      if (currentUserId && userId ? String(userId) === currentUserId : username === currentUser) return;
      if (dsSupervisors.includes(username)) return;
      if (!uniq.has(username)) uniq.set(username, { username, userId: userId || undefined, role, status: "pending", unread: true });
    };
    (leadData?.assignedTo || []).forEach((a) => push(a?.username, "Investigator", a?.userId));
    if (leadData?.assignedBy) push(leadData.assignedBy, "Case Manager", leadData?.assignedByUserId);
    return Array.from(uniq.values());
  };

  const sendLeadNotification = async (actionText) => {
    try {
      const token = localStorage.getItem("token");
      const assignedTo = buildRecipients();
      if (!assignedTo.length) return;
      await api.post("/api/notifications", {
        notificationId: Date.now().toString(),
        assignedBy: currentUser,
        assignedTo,
        action1: actionText,
        post1: `${selectedLead.leadNo}: ${selectedLead.leadName}`,
        action2: "related to the case",
        post2: `${selectedCase.caseNo}: ${selectedCase.caseName}`,
        caseId:   selectedCase._id || selectedCase.id,
        caseNo:   selectedCase.caseNo,
        caseName: selectedCase.caseName,
        leadId:   selectedLead._id || selectedLead.id,
        leadNo:   selectedLead.leadNo,
        leadName: selectedLead.leadName || selectedLead.description,
        type: "Lead",
      }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    } catch (e) {
      console.warn("Notification send failed (non-blocking):", e);
    }
  };

  const humanizeStatus = (uiStatus) =>
    uiStatus === "Completed" ? "approved the lead" :
    uiStatus === "Returned"  ? "returned the lead for changes" :
    uiStatus === "Reopened"  ? "reopened the lead" :
    uiStatus === "Closed"    ? "closed the lead" :
    "updated the lead";

  const getTimelineSortValue = (value) => {
  if (!value) return Number.MAX_SAFE_INTEGER;

  const d = new Date(value);
  if (!isNaN(d)) return d.getTime();

  return Number.MAX_SAFE_INTEGER;
};

const sortTimelineEntries = (entries = []) => {
  return [...entries].sort((a, b) => {
    const aStartDate = getTimelineSortValue(a.eventStartDate || a.eventDate);
    const bStartDate = getTimelineSortValue(b.eventStartDate || b.eventDate);
    if (aStartDate !== bStartDate) return aStartDate - bStartDate;

    const aStartTime = getTimelineSortValue(a.eventStartTime);
    const bStartTime = getTimelineSortValue(b.eventStartTime);
    if (aStartTime !== bStartTime) return aStartTime - bStartTime;

    const aEndTime = getTimelineSortValue(a.eventEndTime);
    const bEndTime = getTimelineSortValue(b.eventEndTime);
    return aEndTime - bEndTime;
  });
};

  // ── core action ──
  const submitReturnAndUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const apiStatus =
        newStatus === "complete" ? "Completed" :
        newStatus === "returned" ? "Returned" :
        newStatus === "reopened" ? "Reopened" :
        newStatus === "close"    ? "Closed"   : "Accepted";

      const res = await api.put(
        `/api/lead/status/${newStatus}`,
        {
          leadNo:      selectedLead.leadNo,
          description: selectedLead.leadName,
          caseId:      selectedCase._id || selectedCase.id,
          ...(newStatus === "complete" && { approvedDate: new Date().toISOString() }),
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (res.status === 200) {
        await sendLeadNotification(humanizeStatus(apiStatus));
        setSelectedLead((prev) => ({ ...prev, leadStatus: apiStatus }));
        setLeadStatus(apiStatus);
        setLocalStatus(apiStatus);

        if (apiStatus === "Completed" || apiStatus === "Closed" || apiStatus === "Returned") {
          navigate(getCasePageRoute());
        } else {
          setNotifyConfig({ open: true, title: "Success", message: `Lead ${apiStatus.toLowerCase()} successfully.` });
        }
      } else {
        setNotifyConfig({ open: true, title: "Warning", message: "Status update may not have saved. Please refresh." });
      }
    } catch (err) {
      console.error(err);
      setNotifyConfig({ open: true, title: "Error", message: "Something went wrong. Please try again." });
    }
  };

  // ── button handlers ──
  const handleApprove = () => {
    setConfirmConfig({
      open: true,
      title: "Confirm Approve",
      message: "Are you sure you want to APPROVE this lead return? The lead will be marked as Completed.",
      onConfirm: () => submitReturnAndUpdate("complete"),
    });
  };

  const handleReturn = () => {
    setConfirmConfig({
      open: true,
      title: "Confirm Return",
      message: "Are you sure you want to RETURN this lead for changes? The investigator will be notified.",
      onConfirm: () => submitReturnAndUpdate("returned"),
    });
  };

  const handleReopen = () => {
    setConfirmConfig({
      open: true,
      title: "Confirm Reopen",
      message: "Are you sure you want to REOPEN this lead?",
      onConfirm: () => submitReturnAndUpdate("reopened"),
    });
  };

  // ── guard ──
  if (!(selectedCase?._id || selectedCase?.id) || !leadNo) {
    return <div style={{ padding: 16 }}>Please select a case &amp; lead.</div>;
  }

  const threadKey      = `${caseNo}:${caseName}::${leadNo}:${leadName}`;
  const managerUsername = typeof leadData?.assignedBy === "string"
    ? leadData.assignedBy
    : (leadData?.assignedBy?.username || leadData?.assignedBy?.assignee || "");

  return (
    <div className={styles.lrfinishContainer}>
      <Navbar />

      {/* Confirm modal */}
      <AlertModal
        isOpen={confirmConfig.open}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          setConfirmConfig((c) => ({ ...c, open: false }));
          confirmConfig.onConfirm();
        }}
        onClose={() => setConfirmConfig((c) => ({ ...c, open: false }))}
      />

      {/* Notification modal */}
      <AlertModal
        isOpen={notifyConfig.open}
        title={notifyConfig.title}
        message={notifyConfig.message}
        onConfirm={() => setNotifyConfig((n) => ({ ...n, open: false }))}
        onClose={() => setNotifyConfig((n) => ({ ...n, open: false }))}
      />

      <div className={styles.LRI_Content9}>
        <div className={styles.leftContent9}>
          {loading ? (
            <div className={styles.loading}>Loading…</div>
          ) : (
            <>
              <div className={styles.cont}>
                <div className={`${styles.lrsec} ${styles.singleCol} ${!showComments ? styles.lrsecFull : ""}`}>

                  {/* ── Top menu ── */}
                  <div className={styles.topMenuBar}>
                    <div className={styles.menuItems}>
                      <span
                        className={styles.menuItem}
                        onClick={() => {
                          const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                          const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                          if (lead && kase) navigate("/LeadReview", { state: { caseDetails: kase, leadDetails: lead } });
                        }}
                      >
                        Lead Information
                      </span>

                      {!isReadOnly && (
                        <span
                          className={styles.menuItem}
                          onClick={() => {
                            const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                            const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                            if (lead && kase) navigate("/ViewLR", { state: { caseDetails: kase, leadDetails: lead } });
                          }}
                        >
                          Add Lead Return
                        </span>
                      )}

                      <span className={`${styles.menuItem} ${styles.menuItemActive}`}>
                        {isReadOnly ? "View Lead Return" : "Manage Lead Return"}
                      </span>

                      <span
                        className={styles.menuItem}
                        onClick={() => {
                          const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                          const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                          if (lead && kase) navigate("/ChainOfCustody", { state: { caseDetails: kase, leadDetails: lead } });
                        }}
                      >
                        Lead Chain of Custody
                      </span>
                    </div>
                  </div>

                  {/* ── PDF generation progress modal ── */}
                  {showPdfModal && (
                    <div className={s.pdfModalOverlay}>
                      <div className={s.pdfModalBox}>
                        <div className={s.pdfModalHeader}>
                          Generating PDF
                          <button className={s.pdfModalCloseBtn} onClick={handleCancelPdf} aria-label="Close">✕</button>
                        </div>
                        <div className={s.pdfModalBody}>
                          <p className={s.pdfModalMessage}>
                            Please wait while the lead return report is being generated.
                          </p>
                          <div className={s.pdfModalProgressWrap}>
                            <div className={s.pdfModalProgressBar}>
                              <div
                                className={s.pdfModalProgressFill}
                                style={{ width: `${pdfProgress}%` }}
                              />
                            </div>
                            <span className={s.pdfModalPercent}>{Math.round(pdfProgress)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Instructions block ── */}
                  <section className={styles.block}>
                    <header className={styles.drToolbar}>
                      <div className={styles.drTitle}>
                        Manage Lead Return
                        <button
                          className={s.viewPdfBtn}
                          onClick={handleViewAsPdf}
                          title="Generate and view the full lead return as a PDF"
                        >
                          View as PDF
                        </button>
                      </div>

                      {/* ── Action buttons ── */}
                      <div className={s.btnGroup}>
                        <button
                          className={s.approveBtn}
                          disabled={!canApprove}
                          title={!canApprove ? approveDisabledReason : "Approve this lead return"}
                          onClick={canApprove ? handleApprove : undefined}
                        >
                          Approve
                        </button>
                        <button
                          className={s.returnBtn}
                          disabled={!canReturn}
                          title={!canReturn ? returnDisabledReason : "Return lead for changes"}
                          onClick={canReturn ? handleReturn : undefined}
                        >
                          Return
                        </button>
                        <button
                          className={s.reopenBtn}
                          disabled={!canReopen}
                          title={!canReopen ? reopenDisabledReason : "Reopen this lead"}
                          onClick={canReopen ? handleReopen : undefined}
                        >
                          Reopen
                        </button>
                      </div>
                    </header>

                  </section>

                  {/* ── Lead Returns ── */}
                  <div className={styles.scrollOnly}>

                    <section className={styles.block}>
                      <div className={styles.lrRow}>
                        <div className={styles.rowLabel}>Lead Log Summary</div>
                        <div className={styles.rowContent}>
                          <div className={styles.textBox}>
                            {instructions.description ? toText(instructions.description) : "—"}
                          </div>
                        </div>
                      </div>

                      <div className={styles.lrRow}>
                        <SectionLink
                          className={styles.rowLabel}
                          to="/LRInstruction"
                          state={{ caseDetails: selectedCase, leadDetails: selectedLead }}
                        >
                          Lead Instructions
                        </SectionLink>
                        <div className={styles.rowContent}>
                          <div className={styles.textBox}>
                            {instructions.summary ? toText(instructions.summary) : "—"}
                          </div>
                        </div>
                      </div>
                    </section>
                    <section className={styles.block}>
                      <div className={styles.returnHead}>
                        <h3>Lead Returns</h3>
                        <button
                          className={styles.cmntBtn}
                          onClick={toggleComments}
                          title={showComments ? "Hide comments" : "Show comments"}
                        >
                          {showComments ? "Hide Comments" : "Show Comments"}
                        </button>
                      </div>

                      {returns.length === 0 && (
                        <div className={styles.empty}>No lead returns recorded.</div>
                      )}

                      {returns.map((ret) => {
                        const k = keyFor(ret);
                        const grouped = sectionsByReturn.get(k) || {
                          persons: [], vehicles: [], enclosures: [], evidence: [], pictures: [], audio: [], videos: [], notes: [],  timeline: [],
                        };

                        return (
                          <div key={ret._id || k} className={styles.lrCard}>
                            <div className={styles.lrMeta}>
                              <div className={styles.metaRow}>
                                <div className={styles.metaItem}>
                                  <span className={styles.metaLabel}>Lead Return ID:</span>
                                  <span className={styles.badge}>{toText(k) || "—"}</span>
                                </div>
                                <div className={styles.metaItem}>
                                  <span className={styles.metaLabel}>Entered By:</span>
                                  <span className={styles.metaValue}>{displayUser(ret.enteredBy)}</span>
                                </div>
                                <div className={styles.metaItem}>
                                  <span className={styles.metaLabel}>Date:</span>
                                  <span className={styles.metaValue}>
                                    {formatDate(ret.enteredDate)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Narrative */}
                            <div className={styles.lrRow}>
                              <SectionLink
                                className={styles.rowLabel}
                                to="/LRReturn"
                                state={{ caseDetails: selectedCase, leadDetails: selectedLead }}
                              >
                                Narrative
                              </SectionLink>
                              <div className={styles.rowContent}>
                                {ret.narrative || ret.comment || ret.leadReturnResult ? (
                                  <div className={styles.textBox}>
                                    {toText(ret.narrative || ret.comment || ret.leadReturnResult)}
                                  </div>
                                ) : (
                                  <div className={styles.textBoxMuted}>(no text)</div>
                                )}
                              </div>
                            </div>

                            {/* Dynamic detail sections */}
                            {(() => {
                              const sections = [];

                              if (grouped.persons.length) sections.push(
                                <div key="persons" className={styles.tableBlock}>
                                  <SectionLink className={styles.tableHeader} to="/LRPerson" state={{ caseDetails: selectedCase, leadDetails: selectedLead }}>Person Details</SectionLink>
                                  <table className={styles.simpleTable}>
                                    <thead><tr><th>Date</th><th>Name</th><th>Phone</th><th>Address</th><th style={{ width: "8%" }}>Actions</th></tr></thead>
                                    <tbody>
                                      {grouped.persons.map((p) => (
                                        <tr key={p._id}>
                                          <td>{formatDate(p.enteredDate)}</td>
                                          <td>{[p.firstName, p.middleInitial, p.lastName].filter(Boolean).join(" ") || "—"}</td>
                                          <td>{toText(p.cellNumber)}</td>
                                          <td>{p.address?.street1 ? [p.address.street1, p.address.street2, p.address.building, p.address.apartment].filter(Boolean).join(" • ") + (p.address.city || p.address.state || p.address.zipCode ? ` • ${[p.address.city, p.address.state, p.address.zipCode].filter(Boolean).join(", ")}` : "") : "—"}</td>
                                          <td><button className={styles.moreBtn} onClick={() => setOpenPerson(p)}>More</button></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );

                              if (grouped.vehicles.length) sections.push(
                                <div key="vehicles" className={styles.tableBlock}>
                                  <SectionLink className={styles.tableHeader} to="/LRVehicle" state={{ caseDetails: selectedCase, leadDetails: selectedLead }}>Vehicle Details</SectionLink>
                                  <table className={styles.simpleTable}>
                                    <thead><tr><th>Plate</th><th>State</th><th>Make/Model</th><th>VIN</th><th>Color</th><th style={{ width: "8%" }}>Actions</th></tr></thead>
                                    <tbody>
                                      {grouped.vehicles.map((v) => (
                                        <tr key={v._id}>
                                          <td>{toText(v.plate)}</td>
                                          <td>{toText(v.state)}</td>
                                          <td>{v.make || v.model ? `${v.make || ""} ${v.model || ""}`.trim() : "—"}</td>
                                          <td>{toText(v.vin)}</td>
                                          <td>{toText(v.primaryColor)}</td>
                                          <td><button className={styles.moreBtn} onClick={() => setOpenVehicle(v)}>More</button></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );

                              if (grouped.enclosures.length) sections.push(
                                <div key="enclosures" className={styles.tableBlock}>
                                  <SectionLink className={styles.tableHeader} to="/LREnclosures" state={{ caseDetails: selectedCase, leadDetails: selectedLead }}>Enclosure Details</SectionLink>
                                  <table className={styles.simpleTable}>
                                    <thead><tr><th>Type</th><th>File / Link</th><th style={{ width: "8%" }}>More</th></tr></thead>
                                    <tbody>
                                      {grouped.enclosures.map((e) => {
                                        const href = e?.isLink && e?.link ? e.link : e?.signedUrl || "";
                                        const label = e?.isLink ? (e?.originalName || e?.link || "") : (e?.originalName || e?.filename || "");
                                        return (
                                          <tr key={e._id}>
                                            <td>{toText(e.type)}</td>
                                            <td>{href ? <a href={href} target="_blank" rel="noreferrer">{label || "View file"}</a> : (label || "—")}</td>
                                            <td><button className={styles.moreBtn} onClick={() => setSelectedDetail({ title: 'Enclosure Details', fields: [
                                              { label: 'Type', value: toText(e.type) },
                                              { label: 'Date Entered', value: formatDate(e.enteredDate) },
                                              { label: 'Entered By', value: toText(e.enteredBy) },
                                              { label: 'Description', value: toText(e.enclosureDescription || e.description) },
                                              { label: 'File', href: href || '', linkText: label || '' },
                                            ]})}>More</button></td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );

                              if (grouped.evidence.length) sections.push(
                                <div key="evidence" className={styles.tableBlock}>
                                  <SectionLink className={styles.tableHeader} to="/LREvidences" state={{ caseDetails: selectedCase, leadDetails: selectedLead }}>Evidence Details</SectionLink>
                                  <table className={styles.simpleTable}>
                                    <thead><tr><th>Type</th><th>Collected</th><th>File</th><th style={{ width: "8%" }}>More</th></tr></thead>
                                    <tbody>
                                      {grouped.evidence.map((e) => {
                                        const href = e?.isLink && e?.link ? e.link : e?.signedUrl || "";
                                        const label = e?.isLink ? (e?.originalName || e?.link || "") : (e?.originalName || e?.filename || "");
                                        return (
                                          <tr key={e._id}>
                                            <td>{toText(e.type)}</td>
                                            <td>{formatDate(e.collectionDate)}</td>
                                            <td>{href ? <a href={href} target="_blank" rel="noreferrer">{label || "File"}</a> : (label || "—")}</td>
                                            <td><button className={styles.moreBtn} onClick={() => setSelectedDetail({ title: 'Evidence Details', fields: [
                                              { label: 'Type', value: toText(e.type) },
                                              { label: 'Collected', value: formatDate(e.collectionDate) },
                                              { label: 'Disposed', value: formatDate(e.disposedDate) },
                                              { label: 'Entered By', value: toText(e.enteredBy) },
                                              { label: 'Date Entered', value: formatDate(e.enteredDate) },
                                              { label: 'Description', value: toText(e.evidenceDescription) },
                                              { label: 'File', href: href || '', linkText: label || '' },
                                            ]})}>More</button></td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );

                              if (grouped.pictures.length) sections.push(
                                <div key="pictures" className={styles.tableBlock}>
                                  <SectionLink className={styles.tableHeader} to="/LRPictures" state={{ caseDetails: selectedCase, leadDetails: selectedLead }}>Picture Details</SectionLink>
                                  <table className={styles.simpleTable}>
                                    <thead><tr><th>Taken On</th><th>Description</th><th>File / Link</th><th style={{ width: "8%" }}>More</th></tr></thead>
                                    <tbody>
                                      {grouped.pictures.map((p) => {
                                        const href = p?.isLink && p?.link ? p.link : p?.signedUrl || "";
                                        const label = p?.isLink ? (p?.originalName || p?.link || "") : (p?.originalName || p?.filename || "");
                                        return (
                                          <tr key={p._id}>
                                            <td>{formatDate(p.datePictureTaken)}</td>
                                            <td>{toText(p.pictureDescription || p.description)}</td>
                                            <td>{href ? <a href={href} target="_blank" rel="noreferrer">{label || "View file"}</a> : (label || "—")}</td>
                                            <td><button className={styles.moreBtn} onClick={() => setSelectedDetail({ title: 'Picture Details', fields: [
                                              { label: 'Date Taken', value: formatDate(p.datePictureTaken) },
                                              { label: 'Entered By', value: toText(p.enteredBy) },
                                              { label: 'Date Entered', value: formatDate(p.enteredDate) },
                                              { label: 'Description', value: toText(p.pictureDescription || p.description) },
                                              { label: 'File', href: href || '', linkText: label || '' },
                                            ]})}>More</button></td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );

                              if (grouped.audio.length) sections.push(
                                <div key="audio" className={styles.tableBlock}>
                                  <SectionLink className={styles.tableHeader} to="/LRAudio" state={{ caseDetails: selectedCase, leadDetails: selectedLead }}>Audio Details</SectionLink>
                                  <table className={styles.simpleTable}>
                                    <thead><tr><th>Recorded On</th><th>Description</th><th>File / Link</th><th style={{ width: "8%" }}>More</th></tr></thead>
                                    <tbody>
                                      {grouped.audio.map((a) => {
                                        const href = a?.isLink && a?.link ? a.link : a?.signedUrl || "";
                                        const label = a?.isLink ? (a?.originalName || a?.link || "") : (a?.originalName || a?.filename || "");
                                        return (
                                          <tr key={a._id}>
                                            <td>{formatDate(a.dateAudioRecorded)}</td>
                                            <td>{toText(a.audioDescription)}</td>
                                            <td>{href ? <a href={href} target="_blank" rel="noreferrer">{label || "View file"}</a> : (label || "—")}</td>
                                            <td><button className={styles.moreBtn} onClick={() => setSelectedDetail({ title: 'Audio Details', fields: [
                                              { label: 'Recorded On', value: formatDate(a.dateAudioRecorded) },
                                              { label: 'Entered By', value: toText(a.enteredBy) },
                                              { label: 'Date Entered', value: formatDate(a.enteredDate) },
                                              { label: 'Description', value: toText(a.audioDescription) },
                                              { label: 'File', href: href || '', linkText: label || '' },
                                            ]})}>More</button></td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );

                              if (grouped.videos.length) sections.push(
                                <div key="videos" className={styles.tableBlock}>
                                  <SectionLink className={styles.tableHeader} to="/LRVideo" state={{ caseDetails: selectedCase, leadDetails: selectedLead }}>Video Details</SectionLink>
                                  <table className={styles.simpleTable}>
                                    <thead><tr><th>Recorded On</th><th>Description</th><th>File / Link</th><th style={{ width: "8%" }}>More</th></tr></thead>
                                    <tbody>
                                      {grouped.videos.map((v) => {
                                        const href = v?.isLink && v?.link ? v.link : v?.signedUrl || "";
                                        const label = v?.isLink ? (v?.originalName || v?.link || "") : (v?.originalName || v?.filename || "");
                                        return (
                                          <tr key={v._id}>
                                            <td>{formatDate(v.dateVideoRecorded)}</td>
                                            <td>{toText(v.videoDescription)}</td>
                                            <td>{href ? <a href={href} target="_blank" rel="noreferrer">{label || "View file"}</a> : (label || "—")}</td>
                                            <td><button className={styles.moreBtn} onClick={() => setSelectedDetail({ title: 'Video Details', fields: [
                                              { label: 'Recorded On', value: formatDate(v.dateVideoRecorded) },
                                              { label: 'Entered By', value: toText(v.enteredBy) },
                                              { label: 'Date Entered', value: formatDate(v.enteredDate) },
                                              { label: 'Description', value: toText(v.videoDescription) },
                                              { label: 'File', href: href || '', linkText: label || '' },
                                            ]})}>More</button></td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );

                              if (grouped.notes.length) sections.push(
                                <div key="notes" className={styles.tableBlock}>
                                  <SectionLink className={styles.tableHeader} to="/LRScratchpad" state={{ caseDetails: selectedCase, leadDetails: selectedLead }}>Notes</SectionLink>
                                  <table className={styles.simpleTable}>
                                    <thead><tr><th style={{ width: '13%' }}>Date</th><th style={{ width: '17%' }}>Entered By</th><th>Note</th><th style={{ width: '8%' }}>More</th></tr></thead>
                                    <tbody>
                                      {grouped.notes.map((n) => (
                                        <tr key={n._id}>
                                          <td>{formatDate(n.enteredDate)}</td>
                                          <td>{toText(n.enteredBy)}</td>
                                          <td className={styles.truncCell}>{toText(n.text)}</td>
                                          <td><button className={styles.moreBtn} onClick={() => setSelectedDetail({ title: 'Note Details', fields: [
                                            { label: 'Date', value: formatDate(n.enteredDate) },
                                            { label: 'Entered By', value: toText(n.enteredBy) },
                                            { label: 'Note', value: toText(n.text) },
                                          ]})}>More</button></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );

                              // if (timeline.length) sections.push(
                              //   <div key="timeline" className={styles.tableBlock}>
                              //     <SectionLink className={styles.tableHeader} to="/LRTimeline" state={{ caseDetails: selectedCase, leadDetails: selectedLead }}>Timeline Details</SectionLink>
                              //     <table className={styles.simpleTable}>
                              //       <thead>
                              //         <tr>
                              //           <th style={{ width: '12%' }}>Start Date</th>
                              //           <th style={{ width: '12%' }}>End Date</th>
                              //           <th style={{ width: '20%' }}>Start Time</th>
                              //           <th style={{ width: '18%' }}>Location</th>
                              //           <th style={{ width: '30%' }}>Description</th>
                              //           <th style={{ width: '8%' }}>More</th>
                              //         </tr>
                              //       </thead>
                              //       <tbody>
                              //         {timeline.map((t) => (
                              //           <tr key={t._id}>
                              //             <td className={styles.truncCell}>{formatDate(t.eventStartDate || t.eventDate)}</td>
                              //             <td className={styles.truncCell}>{formatDate(t.eventEndDate)}</td>
                              //             <td className={styles.truncCell}>{t.eventStartTime ? new Date(t.eventStartTime).toLocaleTimeString() : "—"}</td>
                              //             <td className={styles.truncCell}>{toText(t.eventLocation)}</td>
                              //             <td className={styles.truncCell}>{toText(t.eventDescription)}</td>
                              //             <td><button className={styles.moreBtn} onClick={() => setSelectedTimeline(t)}>More</button></td>
                              //           </tr>
                              //         ))}
                              //       </tbody>
                              //     </table>
                              //   </div>
                              // );

                              const sortedTimeline = sortTimelineEntries(grouped.timeline);

                              if (sortedTimeline.length) sections.push(
                                <div key="timeline" className={styles.tableBlock}>
                                  <SectionLink
                                    className={styles.tableHeader}
                                    to="/LRTimeline"
                                    state={{ caseDetails: selectedCase, leadDetails: selectedLead }}
                                  >
                                    Timeline Details
                                  </SectionLink>

                                  <table className={styles.simpleTable}>
                                    <thead>
                                      <tr>
                                        <th style={{ width: "22%" }}>Event Date</th>
                                        <th style={{ width: "18%" }}>Time Range</th>
                                        <th style={{ width: "18%" }}>Location</th>
                                        <th style={{ width: "34%" }}>Description</th>
                                        <th style={{ width: "8%" }}>More</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {sortedTimeline.map((t) => (
                                        <tr key={t._id}>
                                          <td className={styles.truncCell}>
                                            {(() => {
                                              const start = formatDate(t.eventStartDate || t.eventDate);
                                              const end   = formatDate(t.eventEndDate);
                                              return end !== '—' && end !== start ? `${start} – ${end}` : start;
                                            })()}
                                          </td>
                                          <td className={styles.truncCell}>
                                            {t.eventStartTime
                                              ? `${new Date(t.eventStartTime).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" })}${t.eventEndTime
                                                  ? ` – ${new Date(t.eventEndTime).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" })}`
                                                  : ""}`
                                              : "—"}
                                          </td>
                                          <td className={styles.truncCell}>{toText(t.eventLocation)}</td>
                                          <td className={styles.truncCell}>{toText(t.eventDescription)}</td>
                                          <td>
                                            <button
                                              className={styles.moreBtn}
                                              onClick={() => setSelectedTimeline(t)}
                                            >
                                              More
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );

                              if (sections.length === 0) return null;
                              const mid = Math.ceil(sections.length / 2);
                              return (
                                <div className={styles.gridTwo}>
                                  <div className={styles.gridCol}>{sections.slice(0, mid)}</div>
                                  <div className={styles.gridCol}>{sections.slice(mid)}</div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </section>
                  </div>
                </div>

                {/* Comments panel */}
                {showComments && (
                  <aside className={styles.commentSec} style={{ "--cbar-list-height": "calc(100vh - 40vh)" }}>
                    <CommentBar
                      combined
                      status={status}
                      leadNo={leadNo}
                      leadName={leadName}
                      includePrivateFrom={[currentUser, managerUsername].filter(Boolean)}
                      autoFocus={false}
                    />
                  </aside>
                )}
              </div>

              <PersonModal
                isOpen={!!openPerson}
                onClose={() => setOpenPerson(null)}
                personData={openPerson}
                caseName={caseName}
                leadNo={leadNo}
              />
              <VehicleModal
                isOpen={!!openVehicle}
                onClose={() => setOpenVehicle(null)}
                vehicleData={openVehicle}
                caseName={caseName}
                caseNo={caseNo}
                leadNo={leadNo}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Generic detail modal ── */}
      {selectedDetail && (
        <div className={styles.tlModalOverlay} onClick={() => setSelectedDetail(null)}>
          <div className={styles.tlModal} onClick={e => e.stopPropagation()}>
            <button className={styles.tlModalClose} onClick={() => setSelectedDetail(null)}>&times;</button>
            <h2 className={styles.tlModalTitle}>{selectedDetail.title}</h2>
            <table className={styles.tlGroupTable}>
              <tbody>
                {selectedDetail.fields.map(({ label, value, href, linkText }) => (
                  <tr key={label}>
                    <th style={{ width: '35%', textAlign: 'left', paddingRight: 8 }}>{label}</th>
                    <td style={{ wordBreak: 'break-word' }}>
                      {href
                        ? <a href={href} target="_blank" rel="noreferrer">{linkText || 'File'}</a>
                        : (value || '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Timeline entry detail modal ── */}
      {selectedTimeline && (
        <div className={styles.tlModalOverlay} onClick={() => setSelectedTimeline(null)}>
          <div className={styles.tlModal} onClick={e => e.stopPropagation()}>
            <button className={styles.tlModalClose} onClick={() => setSelectedTimeline(null)}>&times;</button>
            <h2 className={styles.tlModalTitle}>Timeline Entry Details</h2>

            <table className={styles.tlGroupTable}>
              <thead><tr><th>Start Date</th><th>End Date</th></tr></thead>
              <tbody><tr>
                <td>{formatDate(selectedTimeline.eventStartDate || selectedTimeline.eventDate)}</td>
                <td>{formatDate(selectedTimeline.eventEndDate)}</td>
              </tr></tbody>
            </table>

            <table className={styles.tlGroupTable}>
              <thead><tr><th>Location</th></tr></thead>
              <tbody><tr>
                <td>{toText(selectedTimeline.eventLocation)}</td>
              </tr></tbody>
            </table>

            <table className={styles.tlGroupTable}>
              <thead><tr><th>Start Time</th><th>End Time</th></tr></thead>
              <tbody><tr>
                <td>{selectedTimeline.eventStartTime ? new Date(selectedTimeline.eventStartTime).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" }) : '—'}</td>
                <td>{selectedTimeline.eventEndTime ? new Date(selectedTimeline.eventEndTime).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" }) : '—'}</td>
              </tr></tbody>
            </table>

            <table className={styles.tlGroupTable}>
              <thead><tr><th>Description</th></tr></thead>
              <tbody><tr>
                <td className={styles.tlWrapCell}>{toText(selectedTimeline.eventDescription)}</td>
              </tr></tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLeadReturn;
