import { useMemo, useContext, useState, useEffect, useRef, memo } from "react";
import { createPortal } from "react-dom";
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

const CLOSE_REASON_CHIPS = [
  "Investigation completed - all leads exhausted",
  "Insufficient evidence to proceed",
  "Case resolved through other means",
  "Duplicate of another lead",
  "No longer relevant to case objectives",
];

// Close Reason Modal Component
const CloseReasonModal = memo(function CloseReasonModal({ open, onCancel, onSubmit }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  if (!open) return null;

  const canSubmit = (text || "").trim().length >= 5;

  const body = (
    <div className={s.clModalBackdrop} onClick={onCancel}>
      <div className={s.clModalBox} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={s.clModalHeader}>
          <h3 className={s.clModalTitle}>Close Lead</h3>
          <button onClick={onCancel} aria-label="Close" className={s.clModalClose}>✕</button>
        </div>

        {/* Body */}
        <div className={s.clModalBody}>
          <div className={s.clModalSubtitle}>Please provide a reason for closing</div>

          {/* Preset chips */}
          <div className={s.clChipGroup}>
            {CLOSE_REASON_CHIPS.map((chip) => {
              const active = text === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setText(active ? "" : chip)}
                  className={`${s.clChip}${active ? ` ${s.clChipActive}` : ""}`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* Free-text */}
          <textarea
            className={s.clModalTextarea}
            placeholder="Type a brief reason for closing this lead (required)…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* Actions */}
          <div className={s.clModalActions}>
            <button onClick={onCancel} className={s.clModalCancelBtn}>Cancel</button>
            <button
              onClick={() => { const reason = text.trim(); if (reason.length < 5) return; onSubmit(reason); }}
              disabled={!canSubmit}
              className={`${s.clModalSubmitBtn}${!canSubmit ? ` ${s.clModalSubmitBtnDisabled}` : ""}`}
            >
              Close Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const root = document.getElementById("modal-root") || document.body;
  return createPortal(body, root);
});

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
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const currentUser = localStorage.getItem("loggedInUser");
  const [leadData, setLeadData] = useState({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);
  
  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage";
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };
          
  const { status, isReadOnly, setLocalStatus } = useLeadStatus({
    caseId: selectedCase._id || selectedCase.id,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
    initialStatus: selectedLead?.leadStatus,
  });

  const styles = useMemo(() => ({ zoomLabel: { minWidth: 56, textAlign: "center" } }), []);
  const confirmActionRef = useRef(null);

  const LOCKED_STATUSES = new Set(["completed", "closed", "returned"]);
  const isCommentsLocked = LOCKED_STATUSES.has(String(status || "").toLowerCase());

  const normStatus = String(status || "").toLowerCase();
  const isReturned = normStatus === "returned";
  const isCompleted = normStatus === "completed";
  const isClosed = normStatus === "closed";

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

  const handleConfirmClose = async (reason) => {
    if (!reason || !reason.trim()) {
      setAlertMessage("Please provide a reason before closing the lead.");
      setNotifyOpen(true);
      return;
    }

    setClosing(true);
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/api/lead/lead/status/close`,
        {
          leadNo: selectedLead.leadNo,
          description: selectedLead.leadName,
          caseId: selectedCase._id || selectedCase.id,
          reason: reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLeadStatus("Closed");
      setSelectedLead(prev => ({ ...prev, leadStatus: "Closed" }));
      setShowCloseModal(false);
      setLocalStatus("Closed");
      setAlertMessage("Lead closed successfully.");
      await sendLeadNotification("closed the lead");
      setNotifyOpen(true);
      navigate(getCasePageRoute(), { replace: true });
    } catch (err) {
      console.error("Error closing lead:", err);
      setAlertMessage("Error closing lead. See console for details.");
      setNotifyOpen(true);
    } finally {
      setClosing(false);
    }
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
      } catch (e) {
        console.warn("lead meta fetch skipped:", e);
      }
    };
    loadLeadMeta();
  }, [selectedCase?._id, selectedCase?.id, selectedLead?.leadNo]);

  const buildRecipients = () => {
    const current = localStorage.getItem("loggedInUser");
    const uniq = new Map();

    const push = (u, role) => {
      if (!u) return;
      if (u === current) return;
      if (!uniq.has(u)) uniq.set(u, { username: u, role, status: "pending", unread: true });
    };

    (leadData?.assignedTo || []).forEach(a => push(a?.username, "Investigator"));

    if (leadData?.assignedBy)
      push(leadData.assignedBy, "Case Manager");

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
                to={selectedCase?.role === "Investigator" ? "/Investigator" : "/CasePageManager"}
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
          {(isCompleted || isClosed) ? (
            <button className={s.approveBtnLr} onClick={handleReopen}>Reopen</button>
          ) : isReturned ? (
            <div className={s.btnSecDr}>
              <button className={s.approveBtnLr} onClick={handleApprove}>Approve</button>
              <button className={s.closeBtnLr} onClick={() => setShowCloseModal(true)}>Close</button>
            </div>
          ) : (
            <div className={s.btnSecDr}>
              <button className={s.approveBtnLr} onClick={handleApprove}>Approve</button>
              <button className={s.returnBtnLr} onClick={handleReturn}>Return</button>
              <button className={s.closeBtnLr} onClick={() => setShowCloseModal(true)}>Close</button>
            </div>
          )}
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

      <CloseReasonModal
        open={showCloseModal}
        onCancel={() => setShowCloseModal(false)}
        onSubmit={async (reason) => {
          await handleConfirmClose(reason);
          setShowCloseModal(false);
        }}
      />
    </div>
  );
}

export default DocumentReview;