import { useMemo, useContext, useState, useEffect, useRef } from "react";
import Navbar from '../../components/Navbar/Navbar';
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import CommentBar from "../../components/CommentBar/CommentBar";
import { CaseContext } from "../CaseContext";
import s from "./DocumentReview.module.css";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import api, { BASE_URL } from "../../api";
import { useLeadStatus } from '../../hooks/useLeadStatus';

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;


export function DocumentReview({ pdfUrl = "/test1.pdf" }) {
  const { state } = useLocation();

  const pdfBlob = state?.pdfBlob instanceof Blob ? state.pdfBlob : null;
  const urlFromState = typeof state?.pdfUrl === "string" ? state.pdfUrl : null;
  const filename = typeof state?.filename === "string" ? state.filename : null;

  const effectiveFile = pdfBlob || urlFromState || pdfUrl;
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.8);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const currentUser = localStorage.getItem("loggedInUser");
  const [leadData, setLeadData] = useState({});
  const [dsSupervisors, setDsSupervisors] = useState([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);
  
  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage";
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };
          
  const { status, setLocalStatus } = useLeadStatus({
    caseId: selectedCase._id || selectedCase.id,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
    initialStatus: selectedLead?.leadStatus,
  });

  const styles = useMemo(() => ({ zoomLabel: { minWidth: 56, textAlign: "center" } }), []);
  const confirmActionRef = useRef(null);

  const LOCKED_STATUSES = new Set(["completed", "closed", "returned"]);
  const isCommentsLocked = LOCKED_STATUSES.has(String(status || "").toLowerCase());

  const isPrivileged = ["Case Manager", "Detective Supervisor", "Admin"].includes(selectedCase?.role);

  const normStatus         = String(status || "").toLowerCase();
  const isInReview         = normStatus === "in review";
  const isCompleted        = normStatus === "completed";
  const isClosed           = normStatus === "closed";
  const isApprovedOrBeyond = isCompleted || isClosed || normStatus === "approved";

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

  const handleApprove = () => {
    confirmActionRef.current = () => submitReturnAndUpdate('complete');
    setConfirmConfig({
      open: true,
      title: 'Confirm Approve',
      message: 'Are you sure you want to APPROVE this lead return?',
      onConfirm: () => submitReturnAndUpdate('complete')
    });
  };

  const handleReturn = () => {
    confirmActionRef.current = () => submitReturnAndUpdate('returned');
    setConfirmConfig({
      open: true,
      title: 'Confirm Return',
      message: 'Are you sure you want to RETURN this lead for changes?',
      onConfirm: () => submitReturnAndUpdate('returned')
    });
  };

  const handleReopen = () => {
    confirmActionRef.current = () => submitReturnAndUpdate('reopened');
    setConfirmConfig({
      open: true,
      title: 'Confirm Reopen',
      message: 'Are you sure you want to REOPEN this lead?',
      onConfirm: () => submitReturnAndUpdate('reopened')
    });
  };


  const handleDownload = () => {
    try {
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (filename && filename.endsWith(".pdf")) ? filename : (filename || "document.pdf");
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        const a = document.createElement("a");
        a.href = urlFromState || pdfUrl;
        const inferred = filename || (a.href.split("/").pop() || "document.pdf");
        a.download = inferred.endsWith(".pdf") ? inferred : "document.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  useEffect(() => {
    const loadLeadMeta = async () => {
      try {
        if (!selectedCase?._id && !selectedCase?.id || !selectedLead?.leadNo) return;
        const token = localStorage.getItem("token");
        const caseId = selectedCase._id || selectedCase.id;
        const { data = [] } = await api.get(
          `/api/lead/lead/${selectedLead.leadNo}/${caseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (Array.isArray(data) && data[0]) setLeadData(data[0]);

        // Fetch DS list to exclude from notifications
        const caseNo = selectedCase?.caseNo;
        if (caseNo) {
          const teamRes = await api.get(`/api/cases/${caseNo}/team`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} }));
          setDsSupervisors((teamRes.data?.detectiveSupervisors || []).map(ds => (typeof ds === 'string' ? ds : ds?.username || ds?.name || '')).filter(Boolean));
        }
      } catch (e) {
        console.warn("lead meta fetch skipped:", e);
      }
    };
    loadLeadMeta();
  }, [selectedCase?._id, selectedCase?.id, selectedLead?.leadNo]);

  const buildRecipients = () => {
    const current = localStorage.getItem("loggedInUser");
    const currentUserId = localStorage.getItem("userId");
    const uniq = new Map();

    const push = (username, role, userId) => {
      if (!username) return;
      // Skip the current user (they're the sender)
      if (currentUserId && userId ? String(userId) === currentUserId : username === current) return;
      // Skip Detective Supervisors
      if (dsSupervisors.includes(username)) return;
      if (!uniq.has(username)) uniq.set(username, { username, userId: userId || undefined, role, status: "pending", unread: true });
    };

    (leadData?.assignedTo || []).forEach(a => push(a?.username, "Investigator", a?.userId));

    if (leadData?.assignedBy)
      push(leadData.assignedBy, "Case Manager", leadData?.assignedByUserId);

    return Array.from(uniq.values());
  };

  const sendLeadNotification = async (actionText) => {
    try {
      const token = localStorage.getItem("token");
      const assignedTo = buildRecipients();
      if (!assignedTo.length) return;

      const payload = {
        notificationId: Date.now().toString(),
        assignedBy: localStorage.getItem("loggedInUser"),
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
      };

      await api.post("/api/notifications", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.warn("Notification send failed (non-blocking):", e);
    }
  };

  const humanizeStatus = (uiStatus) =>
    uiStatus === "Completed" ? "approved the lead" :
    uiStatus === "Returned" ? "returned the lead" :
    uiStatus === "Reopened" ? "reopened the lead" :
    uiStatus === "Closed" ? "closed the lead" :
    "updated the lead";

  const submitReturnAndUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const apiStatus =
        newStatus === "complete" ? "Completed" :
        newStatus === "returned" ? "Returned" :
        newStatus === "reopened" ? "Reopened" :
        newStatus === "close" ? "Closed" :
        "Accepted";

      const uiStatus = apiStatus;

      const statusRes = await api.put(
        `/api/lead/status/${newStatus}`,
        {
          leadNo: selectedLead.leadNo,
          description: selectedLead.leadName,
          caseId: selectedCase._id || selectedCase.id,
          ...(newStatus === "complete" && { approvedDate: new Date().toISOString() })
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }}
      );

      if (statusRes.status === 200) {
        await sendLeadNotification(humanizeStatus(uiStatus));
        if (uiStatus === "Completed" || uiStatus === "Closed" || uiStatus === "Returned") {
          navigate(getCasePageRoute());
        }
        setAlertMessage("Lead Return submitted");
        setAlertOpen(true);

        setSelectedLead((prev) => ({
          ...prev,
          leadStatus: uiStatus,
        }));

        setLeadStatus(uiStatus);
        setLocalStatus(uiStatus);

        navigate(getCasePageRoute());
      } else {
        setAlertMessage("Lead Return submitted but status update failed");
        setAlertOpen(true);
      }
    } catch (err) {
      console.error(err);
      setAlertMessage("Something went wrong");
      setAlertOpen(true);
    }
  };

  const caseNo = selectedCase?.caseNo;
  const caseName = selectedCase?.caseName;
  const leadNo = selectedLead?.leadNo;
  const leadName = selectedLead?.leadName;

  const publicThreadKey = `${caseNo}:${caseName}::${leadNo}:${leadName}`;
  const activeTag = "ViewLR";
  const activeThreadKey = publicThreadKey;
  const isPublicPhase = true;

  return (
    <div className={s.drShell}>
      <section className={s.drLeft}>
        <header className={s.drToolbar}>
          <div className={s.drTitle}>
            <div className="ld-head">
              <Link to="/HomePage" className="crumb">PIMS Home</Link>
              <span className="sep">{" >> "}</span>
              <Link
                to={["Admin", "Case Manager", "Detective Supervisor"].includes(selectedCase?.role) ? "/CasePageManager" : "/Investigator"}
                state={{ caseDetails: selectedCase }}
                className="crumb"
              >
                Case
              </Link>
              <span className="sep">{" >> "}</span>
              <Link
                to={"/LeadReview"}
                state={{ leadDetails: selectedLead }}
                className="crumb"
              >
                Lead
              </Link>
              <span className="sep">{" >> "}</span>
              <span className="crumb-current" aria-current="page">Document Review</span>
            </div>
          </div>
          <div className={s.drZoom}>
            <button className={s.drDownload} onClick={handleDownload}>Download PDF</button>
            <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}>−</button>
            <div aria-live="polite" style={styles.zoomLabel}>{(scale * 100).toFixed(0)}%</div>
            <button onClick={() => setScale((s) => Math.min(2, +(s + 0.1).toFixed(2)))}>+</button>
          </div>
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

        <div className={s.drPdfArea}>
          {!!errorMsg && (
            <div style={{ color: "#b91c1c", marginBottom: 12 }}>
              Failed to load PDF: {errorMsg}{" "}
              {!pdfBlob && (urlFromState || pdfUrl) && (
                <>• Try opening <a href={urlFromState || pdfUrl} target="_blank" rel="noreferrer">this link</a>.</>
              )}
            </div>
          )}

          <Document
            file={effectiveFile}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(err) => {
              console.error("PDF load error:", err);
              setErrorMsg(err?.message || String(err));
            }}
          >
            {Array.from({ length: numPages || 0 }, (_, i) => (
              <Page
                key={i}
                pageNumber={i + 1}
                scale={scale}
                className={s.drPage}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </Document>
        </div>
      </section>

      <aside className={s.drRight} aria-label="Comments">
        <div className={s.drCommentsBody}>
          <CommentBar
            tag={activeTag}
            threadKey={activeThreadKey}
            visibility="public"
            disabled={isCommentsLocked}
            lockReason={status}
            owner={currentUser}
          />
        </div>
      </aside>

      <AlertModal
        isOpen={confirmConfig.open}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          setConfirmConfig(c => ({ ...c, open: false }));
          confirmConfig.onConfirm();
        }}
        onClose={() => setConfirmConfig(c => ({ ...c, open: false }))}
      />

      <AlertModal
        isOpen={notifyOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={() => setNotifyOpen(false)}
        onClose={() => setNotifyOpen(false)}
      />

    </div>
  );
}

export default DocumentReview;