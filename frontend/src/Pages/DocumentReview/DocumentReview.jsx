
import { useMemo, useContext, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import CommentBar from "../../components/CommentBar/CommentBar";
import { CaseContext } from "../CaseContext";

import "./DocumentReview.css";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import api, { BASE_URL } from "../../api";
import { useLeadStatus } from '../../hooks/useLeadStatus';


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs?ver=5.3.93',
  import.meta.url
).toString();

export function DocumentReview({ pdfUrl = "/test1.pdf" }) {
  const { state } = useLocation();

  // Prefer a Blob from LRFinish; otherwise allow a plain URL string; else default to /public path
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
      const [closeReason, setCloseReason]       = useState("");
      const [closing, setClosing]               = useState(false);
      const currentUser = localStorage.getItem("loggedInUser");
        const [leadData, setLeadData] = useState({});
         const [alertOpen, setAlertOpen] = useState(false);
          const [alertMessage, setAlertMessage] = useState("");
          const [notifyOpen, setNotifyOpen] = useState(false);
            const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus} = useContext(CaseContext);
          const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};  
          
      const { status, isReadOnly, setLocalStatus } = useLeadStatus({
        caseNo: selectedCase.caseNo,
        caseName: selectedCase.caseName,
        leadNo: selectedLead.leadNo,
        leadName: selectedLead.leadName,
      });

  const styles = useMemo(() => ({ zoomLabel: { minWidth: 56, textAlign: "center" } }), []);

  const handleApprove = () => {
  setConfirmConfig({
    open: true,
    title: 'Confirm Approve',
    message: 'Are you sure you want to APPROVE this lead return?',
    onConfirm: () => submitReturnAndUpdate('complete')
  });
};
const handleReturn = () => {
  setConfirmConfig({
    open: true,
    title: 'Confirm Return',
    message: 'Are you sure you want to RETURN this lead for changes?',
    onConfirm: () => submitReturnAndUpdate('pending')
  });
};
const handleReopen = () => {
  setConfirmConfig({
    open: true,
    title: 'Confirm Reopen',
    message: 'Are you sure you want to REOPEN this lead?',
    onConfirm: () => submitReturnAndUpdate('pending')
  });
};

  const handleConfirmClose = async () => {
    if (!closeReason.trim()) {
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
          leadNo:      selectedLead.leadNo,
          description: selectedLead.leadName,
          caseNo:      selectedCase.caseNo,
          caseName:    selectedCase.caseName,
          reason:      closeReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // update local state
      setLeadStatus("Closed");
      setSelectedLead(prev => ({ ...prev, leadStatus: "Closed" }));
      setShowCloseModal(false);
      setCloseReason("");
      await promotePrivateComments();
      setAlertMessage("Lead closed successfully.");
      setNotifyOpen(true);

    } catch (err) {
      console.error("Error closing lead:", err);
      setAlertMessage("Error closing lead. See console for details.");
      setNotifyOpen(true);
    } finally {
      setClosing(false);
    }
  };

const handleClose = () => {
  setConfirmConfig({
    open: true,
    title: 'Confirm Close',
    message: 'Are you sure you want to close this lead?',
    onConfirm: handleConfirmClose
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

   const submitReturnAndUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
  
      // --- 2) Update the leadStatus to either Complete or Pending ---
      const statusRes = await api.put(
        `/api/lead/status/${newStatus}`,           // "/status/complete" or "/status/pending"
        {
          leadNo:     selectedLead.leadNo,
          description: selectedLead.leadName,
          caseNo:     selectedCase.caseNo,
          caseName:   selectedCase.caseName,
           ...(newStatus === "complete" && { approvedDate: new Date().toISOString() })
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }}
      );
  
      if (statusRes.status === 200) {
        await promotePrivateComments();
         setAlertMessage("Lead Return submitted");
        setAlertOpen(true);

      const human =
        newStatus === "complete" ? "approved the lead" :
        newStatus === "Accepted" ? "returned the lead" : "reopened the lead";


        setSelectedLead((prev) => ({
          ...prev,
          leadStatus: newStatus === "complete" ? "Completed" : "Accepted",
        }));

        setLeadStatus(newStatus === "complete" ? "Completed" : "Accepted");
        const investigators = (leadData.assignedTo || []).map(a => a.username);
        const managerName    = leadData.assignedBy;
      if (investigators.length) {
        const payload = {
          notificationId: Date.now().toString(),
          assignedBy:     localStorage.getItem("loggedInUser"),
          assignedTo:     investigators.map(u => ({
           username: u,
           role:     "Investigator",
           status:   "pending",
           unread:   true
         })),
          action1:        human,
          post1:          `${selectedLead.leadNo}: ${selectedLead.leadName}`,
          action2:        "related to the case",
          post2:          `${selectedCase.caseNo}: ${selectedCase.caseName}`,
          caseNo:         selectedCase.caseNo,
          caseName:       selectedCase.caseName,
          leadNo:         selectedLead.leadNo,
          leadName:       selectedLead.leadName,
          type:           "Lead"
        };
        await api.post("/api/notifications", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // alert(`${assignedBy} ${human} and all investigators notified.`);
      navigate(getCasePageRoute());

      } else {
          setAlertMessage("Lead Return submitted but status update failed");
        setAlertOpen(true);
      }
  
    } catch (err) {
      console.error(err);
      // alert("Something went wrong");
      setAlertMessage("Something went wrong");
        setAlertOpen(true);
    }
  };

  const caseNo   = selectedCase?.caseNo;
  const caseName = selectedCase?.caseName;
  const leadNo   = selectedLead?.leadNo;
  const leadName = selectedLead?.leadName;

  // Thread keys
  const publicThreadKey  = `${caseNo}:${caseName}::${leadNo}:${leadName}`;
  const privateThreadKey = `${publicThreadKey}::${currentUser}`;

  // When these statuses hit, comments become public
  const PUBLIC_PHASE_STATUSES = new Set(["Returned", "Completed", "Closed"]);
  // Your app uses "pending" internally on Return; also map that to Returned for safety
  const isPublicPhase =
    PUBLIC_PHASE_STATUSES.has(status) || String(status).toLowerCase() === "pending";

  // Pick where the comment goes / is read from
  const activeTag       = isPublicPhase ? "ViewLR" : "DocumentReview";
  const activeThreadKey = isPublicPhase ? publicThreadKey : privateThreadKey;

  // ---- promote private → public when decision happens ----
  const promotePrivateComments = async () => {
    try {
      const token = localStorage.getItem("token");
      // Minimal backend you can add:
      // POST /api/comments/promote { fromTag, fromKey, toTag, toKey, author }
      // If you already have a different endpoint, swap this call.
      await api.post(
        "/api/comments/promote",
        {
          fromTag: "DocumentReview",
          fromKey: privateThreadKey,
          toTag: "ViewLR",
          toKey: publicThreadKey,
          author: currentUser, // guardrail on server
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      // Non-blocking: UI shouldn’t fail if promotion isn't wired yet
      console.warn("Comment promotion skipped/failed (non-blocking):", e);
    }
  };


  return (
    <div className="dr-shell">
      <section className="dr-left">
        <header className="dr-toolbar">
          <div className="dr-title">Document Review</div>
          <div className="dr-zoom">
            <button className="dr-download" onClick={handleDownload}>Download PDF</button>
            <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}>−</button>
            <div aria-live="polite" style={styles.zoomLabel}>{(scale * 100).toFixed(0)}%</div>
            <button onClick={() => setScale((s) => Math.min(2, +(s + 0.1).toFixed(2)))}>+</button>
          </div>
  {status === "Completed" ? (
    <button className="approve-btn-lr" onClick={handleReopen}>Reopen</button>
  ) : (
    <>
     <div className="btn-sec-dr">
      <button className="approve-btn-lr" onClick={handleApprove}>Approve</button>
      <button className="return-btn-lr" onClick={handleReturn}>Return</button>
      <button className="close-btn-lr" onClick={() => setShowCloseModal(true)}>Close</button>
      </div>
    </>
  )}

        </header>

        <div className="dr-pdfArea">
          {!!errorMsg && (
            <div style={{ color: "#b91c1c", marginBottom: 12 }}>
              Failed to load PDF: {errorMsg}{" "}
              {!pdfBlob && (urlFromState || pdfUrl) && (
                <>• Try opening <a href={urlFromState || pdfUrl} target="_blank" rel="noreferrer">this link</a>.</>
              )}
            </div>
          )}

          <Document
            file={effectiveFile}      // ✅ Blob, or URL string, or /public fallback
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
   className="dr-page"
   renderTextLayer={false}
    renderAnnotationLayer={false}
  />
            ))}
          </Document>
        </div>
      </section>

        <aside className="dr-right" aria-label="Comments">
    <div className="dr-commentsBody">
      <CommentBar
        tag={activeTag}
        threadKey={activeThreadKey}
        // Optional extra metadata (safe to ignore if CommentBar doesn’t read them)
        visibility={isPublicPhase ? "public" : "private"}
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
    </div>
  );
}

export default DocumentReview;
