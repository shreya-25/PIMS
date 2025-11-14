
import { useMemo, useContext, useState, useEffect, useRef } from "react";
import Navbar from '../../components/Navbar/Navbar';

import { useLocation, useNavigate, Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import CommentBar from "../../components/CommentBar/CommentBar";
import { CaseContext } from "../CaseContext";

import "./DocumentReview.css";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import api, { BASE_URL } from "../../api";
import { useLeadStatus } from '../../hooks/useLeadStatus';


// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.mjs?ver=5.3.93',
//   import.meta.url
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

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
  const confirmActionRef = useRef(null);

  const LOCKED_STATUSES = new Set(["completed", "closed", "returned"]);
const isCommentsLocked = LOCKED_STATUSES.has(String(status || "").toLowerCase());

const normStatus  = String(status || "").toLowerCase();
const isReturned  = normStatus === "returned";
const isCompleted = normStatus === "completed";
const isClosed    = normStatus === "closed";


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

      setLeadStatus("Closed");
      setSelectedLead(prev => ({ ...prev, leadStatus: "Closed" }));
      setShowCloseModal(false);
      setLocalStatus("Closed"); 
      setCloseReason("");
      // await promotePrivateComments();
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

  // ADD: fetch lead meta to know who to notify
useEffect(() => {
  const loadLeadMeta = async () => {
    try {
      if (!selectedCase?.caseNo || !selectedCase?.caseName || !selectedLead?.leadNo) return;
      const token = localStorage.getItem("token");
      const { data = [] } = await api.get(
        `/api/lead/lead/${selectedLead.leadNo}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (Array.isArray(data) && data[0]) setLeadData(data[0]);
    } catch (e) {
      console.warn("lead meta fetch skipped:", e);
    }
  };
  loadLeadMeta();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedCase?.caseNo, selectedCase?.caseName, selectedLead?.leadNo]);


  // ADD: build recipients list (investigators + manager fallback)
const buildRecipients = () => {
  const current = localStorage.getItem("loggedInUser");
  const uniq = new Map();

  const push = (u, role) => {
    if (!u) return;
    if (u === current) return; // ✅ exclude signed-in officer from notifications
    if (!uniq.has(u)) uniq.set(u, { username: u, role, status: "pending", unread: true });
  };

  (leadData?.assignedTo || []).forEach(a => push(a?.username, "Investigator"));

  if (leadData?.assignedBy)
    push(leadData.assignedBy, "Case Manager");

  return Array.from(uniq.values());
};


// ADD: send notification
const sendLeadNotification = async (actionText) => {
  try {
    const token = localStorage.getItem("token");
    const assignedTo = buildRecipients();
    if (!assignedTo.length) return;

    const payload = {
      notificationId: Date.now().toString(),
      assignedBy:     localStorage.getItem("loggedInUser"),
      assignedTo, // [{ username, role, status, unread }]
      action1:        actionText, // "approved the lead", etc.
      post1:          `${selectedLead.leadNo}: ${selectedLead.leadName}`,
      action2:        "related to the case",
      post2:          `${selectedCase.caseNo}: ${selectedCase.caseName}`,
      caseNo:         selectedCase.caseNo,
      caseName:       selectedCase.caseName,
      leadNo:         selectedLead.leadNo,
      leadName:       selectedLead.leadName,
      type:           "Lead",
    };

    await api.post("/api/notifications", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (e) {
    console.warn("Notification send failed (non-blocking):", e);
  }
};

// ADD: map UI status to human-readable action
const humanizeStatus = (uiStatus) =>
  uiStatus === "Completed" ? "approved the lead"  :
  uiStatus === "Returned"  ? "returned the lead"  :
  uiStatus === "Reopened"  ? "reopened the lead"  :
  uiStatus === "Closed"    ? "closed the lead"    :
                             "updated the lead";


   const submitReturnAndUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
       const apiStatus =
       newStatus === "complete"  ? "Completed" :
       newStatus === "returned"  ? "Returned"  :
       newStatus === "reopened"  ? "Reopened"  :
       newStatus === "close"     ? "Closed"    :
       "Accepted"; // fallback

        const uiStatus = apiStatus;
  
      // --- 2) Update the leadStatus to either Complete or Pending ---
      
      const statusRes = await api.put(
        `/api/lead/status/${newStatus}`,
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
        await sendLeadNotification(humanizeStatus(uiStatus));
        if (uiStatus === "Completed" || uiStatus === "Closed" || uiStatus === "Returned") {
        // await promotePrivateComments();
         navigate(getCasePageRoute());
        }
         setAlertMessage("Lead Return submitted");
        setAlertOpen(true);

    const human =
        uiStatus === "Completed" ? "approved the lead"  :
       uiStatus === "Returned"  ? "returned the lead"  :
        uiStatus === "Reopened"  ? "reopened the lead"  :   "updated the lead";


        setSelectedLead((prev) => ({
          ...prev,
          // leadStatus: newStatus === "complete" ? "Completed" : "Accepted",
          leadStatus: uiStatus,
        }));

        // setLeadStatus(newStatus === "complete" ? "Completed" : "Accepted");
        // setLocalStatus(newStatus === "complete" ? "Completed" : "Accepted"); 
       setLeadStatus(uiStatus);
       setLocalStatus(uiStatus);
        const investigators = (leadData.assignedTo || []).map(a => a.username);
        const managerName    = leadData.assignedBy;
      // if (investigators.length) {
      //   const payload = {
      //     notificationId: Date.now().toString(),
      //     assignedBy:     localStorage.getItem("loggedInUser"),
      //     assignedTo:     investigators.map(u => ({
      //      username: u,
      //      role:     "Investigator",
      //      status:   "pending",
      //      unread:   true
      //    })),
      //     action1:        human,
      //     post1:          `${selectedLead.leadNo}: ${selectedLead.leadName}`,
      //     action2:        "related to the case",
      //     post2:          `${selectedCase.caseNo}: ${selectedCase.caseName}`,
      //     caseNo:         selectedCase.caseNo,
      //     caseName:       selectedCase.caseName,
      //     leadNo:         selectedLead.leadNo,
      //     leadName:       selectedLead.leadName,
      //     type:           "Lead"
      //   };
      //   await api.post("/api/notifications", payload, {
      //     headers: { Authorization: `Bearer ${token}` }
      //   });
      // }

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

//   const caseNo   = selectedCase?.caseNo;
//   const caseName = selectedCase?.caseName;
//   const leadNo   = selectedLead?.leadNo;
//   const leadName = selectedLead?.leadName;

//   const publicThreadKey  = `${caseNo}:${caseName}::${leadNo}:${leadName}`;
//   const privateThreadKey = `${publicThreadKey}::${currentUser}`;

//  const PUBLIC_PHASE_STATUSES = new Set(["Returned", "Reopened", "Completed", "Closed"]);

//   const isPublicPhase =
//     PUBLIC_PHASE_STATUSES.has(status) || String(status).toLowerCase() === "pending";

//   const activeTag       = isPublicPhase ? "ViewLR" : "DocumentReview";
//   const activeThreadKey = isPublicPhase ? publicThreadKey : privateThreadKey;

const caseNo   = selectedCase?.caseNo;
const caseName = selectedCase?.caseName;
const leadNo   = selectedLead?.leadNo;
const leadName = selectedLead?.leadName;

// Single shared thread for everyone
const publicThreadKey = `${caseNo}:${caseName}::${leadNo}:${leadName}`;

// Always use the public thread + ViewLR tag so it’s shared across pages
const activeTag       = "ViewLR";
const activeThreadKey = publicThreadKey;

// Everything is effectively "public phase" now
const isPublicPhase = true;

  // ---- promote private → public when decision happens ----
  // const promotePrivateComments = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     await api.post(
  //       "/api/comments/promote",
  //       {
  //         fromTag: "DocumentReview",
  //         fromKey: privateThreadKey,
  //         toTag: "ViewLR",
  //         toKey: publicThreadKey,
  //         author: currentUser, 
  //       },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //   } catch (e) {
  //     console.warn("Comment promotion skipped/failed (non-blocking):", e);
  //   }
  // };


  return (
    <div className="dr-shell">
      {/* <Navbar/> */}
      <section className="dr-left">
        <header className="dr-toolbar">
          <div className="dr-title"><div className="ld-head">
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
                         </div></div>
          <div className="dr-zoom">
            <button className="dr-download" onClick={handleDownload}>Download PDF</button>
            <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}>−</button>
            <div aria-live="polite" style={styles.zoomLabel}>{(scale * 100).toFixed(0)}%</div>
            <button onClick={() => setScale((s) => Math.min(2, +(s + 0.1).toFixed(2)))}>+</button>
          </div>
          {(isCompleted || isClosed) ? (
  // Completed/Closed → only Reopen
  <button className="approve-btn-lr" onClick={handleReopen}>Reopen</button>
) : isReturned ? (
  // Returned → only Approve and Close
  <div className="btn-sec-dr">
    <button className="approve-btn-lr" onClick={handleApprove}>Approve</button>
    <button className="close-btn-lr"   onClick={() => setShowCloseModal(true)}>Close</button>
  </div>
) : (
  // Default → Approve, Return, Close
  <div className="btn-sec-dr">
    <button className="approve-btn-lr" onClick={handleApprove}>Approve</button>
    <button className="return-btn-lr"  onClick={handleReturn}>Return</button>
    <button className="close-btn-lr"   onClick={() => setShowCloseModal(true)}>Close</button>
  </div>
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
        // visibility={isPublicPhase ? "public" : "private"}
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

  {showCloseModal && (
  <div className="close-modal-backdrop">
    <div className="close-modal">
      <h3>Reason for Closing Lead</h3>
      <textarea
        rows={4}
        value={closeReason}
        onChange={(e) => setCloseReason(e.target.value)}
      />
      <div className="modal-buttons">
        <button
          className="save-btn1"
          onClick={handleConfirmClose}
          disabled={closing}
        >
          {closing ? "Closing…" : "Confirm"}
        </button>
        <button
          className="save-btn1"
          onClick={() => setShowCloseModal(false)}
          disabled={closing}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default DocumentReview;
