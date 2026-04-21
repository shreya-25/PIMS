import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import CommentBar from "../../components/CommentBar/CommentBar";
import { CaseContext } from "../CaseContext";
import api from "../../api";
import { safeEncode } from "../../utils/encode";
import styles from "./ViewLR.module.css"; 
import { AlertModal } from "../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../hooks/useLeadStatus';
import PersonModal from "../../components/PersonModal/PersonModel";
import VehicleModal from "../../components/VehicleModal/VehicleModal";



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
  // common structured fields
  if (v.street1 || v.city || v.state || v.zipCode || v.zip) return formatAddress(v);
  // last resort
  try { return JSON.stringify(v); } catch { return "—"; }
};

export const ViewLR = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // -------- data --------
  const [instructions, setInstructions] = useState({});
  const [returns, setReturns] = useState([]); // [{_id, narrativeId?, narrative, ...}]
  const [persons, setPersons] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [pictures, setPictures] = useState([]);
  const [audio, setAudio] = useState([]);
  const [videos, setVideos] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPerson, setOpenPerson] = useState(null);
  const [openVehicle, setOpenVehicle] = useState(null);
  const [showComments, setShowComments] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const currentUser = localStorage.getItem("loggedInUser");
  const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus} = useContext(CaseContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    api.get("/api/users/usernames", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAllUsers(Array.isArray(res.data?.users) ? res.data.users : []))
      .catch(() => {});
  }, []);

  const displayUser = (username) => {
    if (!username) return "Unknown";
    const u = allUsers.find(u => u.username === username);
    if (!u) return username;
    const last  = (u.lastName  || "").trim();
    const first = (u.firstName || "").trim();
    const name  = last && first ? `${last}, ${first}` : last || first || "";
    return name ? `${name} (${username})` : username;
  };
   const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [leadData, setLeadData] = useState({});
    const [dsSupervisors, setDsSupervisors] = useState([]);
     const [confirmConfig, setConfirmConfig] = useState({
      open: false,
      title: '',
      message: '',
      onConfirm: () => {}
    });
      const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};
 const [notifyConfig, setNotifyConfig] = useState({
    open: false,
    title: 'Notification',
    message: ''
  });



const toggleComments = useCallback(() => setShowComments(s => !s), []);
const closeComments  = useCallback(() => setShowComments(false), []);

  const caseNo   = selectedCase?.caseNo   || location.state?.caseDetails?.caseNo;
  const caseName = selectedCase?.caseName || location.state?.caseDetails?.caseName;
  const leadNo   = selectedLead?.leadNo   || location.state?.leadDetails?.leadNo;
  const leadName = selectedLead?.leadName || location.state?.leadDetails?.leadName;

  const { status, isReadOnly, setLocalStatus } = useLeadStatus({
    caseId: selectedCase._id || selectedCase.id,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
    initialStatus: selectedLead?.leadStatus,
  });

  const isSubmittedInReview = status === "In Review";
const isClosedOrCompleted = status === "Closed" || status === "Completed";
const isCaseManager = selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";

const isInReview         = status === "In Review";
const isInvestigator     = !isCaseManager;

const canShowCMButtons   = isCaseManager && !isClosedOrCompleted;

const systemRole = localStorage.getItem("systemRole") || localStorage.getItem("role") || "";
const isAdmin = systemRole === "Admin";

const publicThreadKey = `${caseNo}:${caseName}::${leadNo}:${leadName}`;
const investigatorUsernames = (Array.isArray(leadData?.assignedTo)
  ? leadData.assignedTo
  : []
).map(a => (typeof a === "string" ? a : (a?.username || a?.assignee || ""))).filter(Boolean);


const primaryUsername =
   leadData?.primaryInvestigator ||
   leadData?.primaryOfficer || "";   // fallback if you stored it under primaryOfficer

 const isPrimaryInvestigator = !!currentUser && currentUser === primaryUsername;

const isAssignedAsInvestigator = investigatorUsernames.includes(currentUser);

// Admin, DS, Case Manager, or Primary Investigator may submit
const isAuthorizedToSubmit = isAdmin || isCaseManager || isPrimaryInvestigator;

const canShowSubmit = !isClosedOrCompleted && !isInReview && isAuthorizedToSubmit;

const submitDisabledReason = isClosedOrCompleted
  ? "This lead is closed or completed — submissions are no longer allowed"
  : isInReview
  ? "Lead return already submitted and is under review"
  : !isAuthorizedToSubmit
  ? "You are not authorized to submit this lead return"
  : "";


  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

  // -------- fetch all sections (same endpoints you already use) --------
  useEffect(() => {
    let caseId = selectedCase?._id || selectedCase?.id || location.state?.caseDetails?._id || location.state?.caseDetails?.id;
    const effectiveCaseNo = selectedCase?.caseNo || location.state?.caseDetails?.caseNo;

    if (!leadNo || !leadName) return;

    async function resolveAndLoad() {
      // Fallback: resolve _id from caseNo when _id is missing
      if (!caseId && effectiveCaseNo) {
        try {
          const token = localStorage.getItem("token");
          const { data: caseDoc } = await api.get(`/api/cases/caseNo/${effectiveCaseNo}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          caseId = caseDoc?._id;
        } catch (e) {
          console.error("Failed to resolve caseId from caseNo:", e);
        }
      }
      if (!caseId) return;
    const encLead = safeEncode(leadName);
    const token = localStorage.getItem("token");
    const headers = { headers: { Authorization: `Bearer ${token}` } };

    async function loadAll() {
      setLoading(true);
      try {
        const [
          instrRes,
          returnsRes,
          personsRes,
          vehiclesRes,
          enclosuresRes,
          evidenceRes,
          picturesRes,
          audioRes,
          videosRes,
          timelineRes,
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
          api.get(`/api/timeline/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
        ]);

        const leadDoc = instrRes.data?.[0] || {};
        setInstructions(leadDoc);
        setLeadData(leadDoc);

        // Fetch DS list to exclude from notifications
        try {
          const caseNo = selectedCase?.caseNo;
          if (caseNo) {
            const teamRes = await api.get(`/api/cases/${caseNo}/team`, headers).catch(() => ({ data: {} }));
            setDsSupervisors((teamRes.data?.detectiveSupervisors || []).map(ds => (typeof ds === 'string' ? ds : ds?.username || ds?.name || '')).filter(Boolean));
          }
        } catch (_) { /* non-blocking */ }
        setReturns(returnsRes.data || []);
        setPersons(personsRes.data || []);
        setVehicles(vehiclesRes.data || []);
        setEnclosures(enclosuresRes.data || []);
        setEvidence(evidenceRes.data || []);
        setPictures(picturesRes.data || []);
        setAudio(audioRes.data || []);
        setVideos(videosRes.data || []);
        setTimeline(timelineRes.data || []);
      } finally {
        setLoading(false);
      }
    }
      await loadAll();
    }
    resolveAndLoad();
  }, [selectedCase?._id, selectedCase?.id, selectedCase?.caseNo, leadNo, leadName]);

  // Group helpers — we'll try common keys: narrativeId, returnId, lrId, or fall back to _id
  const keyFor = (obj) =>
    obj.narrativeId || obj.returnId || obj.lrId || obj.leadReturnId || obj._id;

  const sectionsByReturn = useMemo(() => {
    const map = new Map();
    const touch = (k) => {
      if (!map.has(k)) map.set(k, { persons: [], vehicles: [], enclosures: [], evidence: [], pictures: [], audio: [], videos: [] });
      return map.get(k);
    };

    persons.forEach((x) => touch(keyFor(x)).persons.push(x));
    vehicles.forEach((x) => touch(keyFor(x)).vehicles.push(x));
    enclosures.forEach((x) => touch(keyFor(x)).enclosures.push(x));
    evidence.forEach((x) => touch(keyFor(x)).evidence.push(x));
    pictures.forEach((x) => touch(keyFor(x)).pictures.push(x));
    audio.forEach((x) => touch(keyFor(x)).audio.push(x));
    videos.forEach((x) => touch(keyFor(x)).videos.push(x));
    return map;
  }, [persons, vehicles, enclosures, evidence, pictures, audio, videos]);

  const go = (path) => navigate(path);

  if (!(selectedCase?._id || selectedCase?.id) || !leadNo) {
    return (
      <div style={{ padding: 16 }}>
        Please select a case & lead.
      </div>
    );
  }

  const commentTag = "ViewLR";
  const threadKey = `${caseNo}:${caseName}::${leadNo}:${leadName}`;

    const leadLogSummary =
    instructions.description;

  const leadInstructionText =
    instructions.summary;

  const openPersonSheet = (p) => setOpenPerson(p);
const closePersonSheet = () => setOpenPerson(null);

 const normalizeAssignees = (arr) => {
   if (!Array.isArray(arr)) return [];
   return arr
     .map(a => {
        if (typeof a === "string") return a.trim();
      if (a?.username) return a.username;
      if (a?.assignee) return a.assignee;   // some places you store this field name
      if (a?.name) return a.name;
       return String(a || "").trim();
     })
     .filter(Boolean);
 };
const actuallyDoSubmitReport = async () => {
  const now = new Date().toISOString();
  try {
    const token = localStorage.getItem("token");

    const me = localStorage.getItem("loggedInUser") || localStorage.getItem("officerName") || "Unknown Officer";
   const assignees = normalizeAssignees(leadData.assignedTo);
   const managerUser =
     typeof leadData.assignedBy === "string"
       ? leadData.assignedBy
       : (leadData.assignedBy?.username || leadData.assignedBy?.assignee || "");

      const body = {
        leadNo: selectedLead.leadNo,
        description: selectedLead.leadName,
        caseId: selectedCase._id || selectedCase.id,
        submittedDate: new Date(),
        assignedTo: { assignees: assignees.length ? assignees : [me], lRStatus: "Submitted" },
        assignedBy: { assignee: managerUser || me, lRStatus: "Pending" }
      };

      const response = await api.put("/api/leadReturn/set-lrstatus-submitted", body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 200 || response.status === 201) {
        const statusResponse = await api.put(
          "/api/lead/status/in-review",
          {
            leadNo: selectedLead.leadNo,
            description: selectedLead.leadName,
            caseId: selectedCase._id || selectedCase.id,
            submittedDate: now
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (statusResponse.status === 200) {
          setLeadStatus("In Review");
          setSelectedLead(prev => ({...prev,leadStatus: "In Review"}));
          setLocalStatus("In Review");
          console.log("status from hook", status);

          
          // alert("Lead Return submitted");
           setAlertMessage("Lead Return submitted!");
      setAlertOpen(true);
        const manager    = leadData.assignedBy;                  // string username
        const managerUserId = leadData.assignedByUserId || undefined;
        const investigators = normalizeAssignees(leadData.assignedTo);
        if (manager && !dsSupervisors.includes(manager)) {
          const payload = {
            notificationId: Date.now().toString(),
            assignedBy:     localStorage.getItem("loggedInUser"),
            assignedTo: [{
              username: manager,
              userId:   managerUserId,
              role:     "Case Manager",
              status:   "pending",
              unread:   true
            }],
            action1:        "submitted a lead return for review",
            post1:          `${selectedLead.leadNo}: ${selectedLead.leadName}`,
            caseId:         selectedCase._id || selectedCase.id,
            caseNo:         selectedCase.caseNo,
            caseName:       selectedCase.caseName,
            leadId:         selectedLead._id || selectedLead.id,
            leadNo:         selectedLead.leadNo,
            leadName:       selectedLead.leadName || selectedLead.description,
            type:           "Lead"
          };
          await api.post("/api/notifications", payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

       
         setAlertMessage("Lead Return submitted!");
      setAlertOpen(true);
        } else {
           setAlertMessage("Lead Return submitted but status update failed.");
      setAlertOpen(true);
        }
        navigate(getCasePageRoute());
      } else {
        setAlertMessage("Failed to submit Lead Return");
        setAlertOpen(true);
      }
    } catch (error) {
      console.error("Error during Lead Return submission or status update:", error);
      setAlertMessage("Something went wrong while submitting the report.");
        setAlertOpen(true);
    }
  };

    const userOf = (val) =>
  typeof val === "string"
    ? val.trim()
    : (val?.username || val?.assignee || val?.name || "").trim();

    const managerUsername = userOf(leadData?.assignedBy);
  

  const handleSubmitReport = () => {
  setConfirmConfig({
    open: true,
    title: 'Confirm Submission',
    message:
      `Once submitted, assigned investigators will no longer be able to edit this.\n\n`
      + ` Are you sure you want to submit the lead return for Case Manager approval?`,
    onConfirm: actuallyDoSubmitReport
  });
};



  return (
    <div className={styles.lrfinishContainer}>
      <Navbar />
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
      
      {/* notification modal (info only) */}
      <AlertModal
        isOpen={notifyConfig.open}
        title={notifyConfig.title}
        message={notifyConfig.message}
        onConfirm={() => setNotifyConfig(n => ({ ...n, open: false }))}
        onClose={() => setNotifyConfig(n => ({ ...n, open: false }))}
      />
    
      <div className={styles.LRI_Content9}>
        {/* <SideBar  activePage="CasePageManager" /> */}

          <div className={styles.leftContent9}>
            {loading ? (
              <div className={styles.loading}>Loading…</div>
            ) : (
              <>

       <div className={styles.cont}>
                  <div className={`${styles.lrsec} ${styles.singleCol} ${!showComments ? styles.lrsecFull : ""}`}>

                         {/* ── Top menu row ── */}
                     <div className={styles.topMenuBar}>
        <div className={styles.menuItems}>
          <span className={styles.menuItem} onClick={() => {
            const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
            const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
            if (lead && kase) navigate("/LeadReview", { state: { caseDetails: kase, leadDetails: lead } });
          }}>Lead Information</span>

          <span className={`${styles.menuItem} ${styles.menuItemActive}`}>Add Lead Return</span>

          {isCaseManager && (
            <span
              className={styles.menuItem}
              onClick={() => {
                const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                if (lead && kase) navigate("/ManageLeadReturn", { state: { caseDetails: kase, leadDetails: lead } });
              }}
              title="Manage Lead Return"
            >
              Manage Lead Return
            </span>
          )}

          <span className={styles.menuItem} onClick={() => {
            const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
            const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
            if (lead && kase) navigate("/ChainOfCustody", { state: { caseDetails: kase, leadDetails: lead } });
          }}>Lead Chain of Custody</span>
        </div>
      </div>

                     {/* ── Section tabs row ── */}
                     <div className={styles.sectionTabBar}>
        <div className={styles.menuItems} style={{ gap: '0' }}>
          {[
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
          ].map(({ label, route }) => (
            <span
              key={route}
              className={styles.sectionTabItem}
              onClick={() => {
                const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                if (lead && kase) navigate(route, { state: { caseDetails: kase, leadDetails: lead } });
              }}
            >
              {label}
            </span>
          ))}
          <span className={`${styles.sectionTabItem} ${styles.sectionTabItemActive}`}>Finish</span>
        </div>
      </div>

                  {/* Instructions */}
                  <section className={styles.block}>
                          <header className={styles.drToolbar}>
          <div className={styles.drTitle}>
            {/* <div className="ld-head">
                                     <Link to="/HomePage" className="crumb">PIMS Home</Link>
                                     <span className="sep">{" >> "}</span>
                                     <Link
                                       to={selectedCase?.role === "Investigator" ? "/Investigator" : "/CasePageManager"}
                                       state={{ caseDetails: selectedCase }}
                                       className="crumb"
                                     >
                                       Case: {selectedCase.caseNo || ""}
                                     </Link>
                                     <span className="sep">{" >> "}</span>
                                     <Link
                                       to={"/LeadReview"}
                                       state={{ leadDetails: selectedLead }}
                                       className="crumb"
                                     >
                                       Lead: {selectedLead.leadNo || ""}
                                     </Link>
                                     <span className="sep">{" >> "}</span>
                                     <span className="crumb-current" aria-current="page">Review Lead Return</span>
                                   </div> */}
                                     Review Lead Return
                                   </div>
          <div>
              <button
                className={styles.approveBtnLr}
                onClick={canShowSubmit ? handleSubmitReport : undefined}
                disabled={!canShowSubmit}
                title={!canShowSubmit ? submitDisabledReason : "Submit lead return for review"}
              >
                Submit
              </button>
      </div>
        </header>
                        <div className={styles.lrRow}>
                            <div className={styles.rowLabel}>Lead Log Summary</div>
                            <div className={styles.rowContent}>
                                <div className={styles.textBox}>
                                   {leadLogSummary ? toText(leadLogSummary) : "—"}
                                </div>
                            </div>
                        </div>

                        <div className={styles.lrRow}>
                            {/* <div className={styles.rowLabel}><a href ="." >Lead Instructions </a></div> */}
                            <Link
  className={styles.rowLabel}
  to="/LRInstruction"
  // optional: pass along context for that page
  state={{ caseDetails: selectedCase, leadDetails: selectedLead }}
>
  Lead Instructions
</Link>
                            <div className={styles.rowContent}>
                                <div className={styles.textBox}>
                                   {leadInstructionText ? toText(leadInstructionText) : "—"}
                                </div>
                            </div>
                        </div>

                  </section>

                  <div className={styles.scrollOnly}>

                  {/* Lead Returns */}
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
                    
                    {returns.length === 0 && <div className={styles.empty}>No lead returns recorded.</div>}

                    {returns.map((ret) => {
                      const k = keyFor(ret);
                      const grouped = sectionsByReturn.get(k) || {
                        persons: [], vehicles: [], enclosures: [], evidence: [], pictures: [], audio: [], videos: []
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
                                  {ret.enteredDate ? new Date(ret.enteredDate).toLocaleString() : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Narrative */}
                          <div className={styles.lrRow}>
                            {/* <div className={styles.rowLabel}>Narrative</div> */}
                             <Link
        className={styles.rowLabel}
        to="/LRReturn" 
        state={{
          caseDetails: selectedCase,
          leadDetails: selectedLead,
        }}
      >
        Narrative
      </Link>
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

                          {/* ================= Dynamic sections (only non-empty) + auto 2 columns ================= */}
                        {(() => {
                        const detailSections = [];

                        // Persons
                        if (grouped.persons.length) {
                            detailSections.push(
                            <div key="persons" className={styles.tableBlock}>
                                <Link
    className={styles.tableHeader}
    to="/LRPerson"                         // adjust if your route differs
    state={{
      caseDetails: selectedCase,
      leadDetails: selectedLead,
    }}
  >
    Person Details
  </Link>
                                <table className={styles.simpleTable}>
                                <thead>
                                    <tr>
                                    <th>Date</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                    <th style={{ width: "8%" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grouped.persons.map((p) => (
                                    <tr key={p._id}>
                                        <td>{p.enteredDate ? new Date(p.enteredDate).toLocaleDateString() : "—"}</td>
                                        <td>{[p.firstName, p.middleInitial, p.lastName].filter(Boolean).join(' ') || '—'}</td>
                                        <td>{toText(p.cellNumber)}</td>
                                        <td>{p.address?.street1 ? [p.address.street1, p.address.street2, p.address.building, p.address.apartment].filter(Boolean).join(' • ') + (p.address.city || p.address.state || p.address.zipCode ? ` • ${[p.address.city, p.address.state, p.address.zipCode].filter(Boolean).join(', ')}` : '') : '—'}</td>
                                        <td><button className={styles.moreBtn} onClick={() => setOpenPerson(p)}>More</button></td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            );
                        }

                        // Vehicles
                        if (grouped.vehicles.length) {
                            detailSections.push(
                            <div key="vehicles" className={styles.tableBlock}>
                                {/* <div className={styles.tableHeader}>Vehicles</div> */}
                                <Link
    className={styles.tableHeader}
    to="/LRVehicle"                         // adjust if your route differs
    state={{
      caseDetails: selectedCase,
      leadDetails: selectedLead,
    }}
  >
    Vehicle Details
  </Link>
                                <table className={styles.simpleTable}>
                                <thead>
                                    <tr>
                                    <th>Plate</th>
                                    <th>State</th>
                                    <th>Make/Model</th>
                                    <th>VIN</th>
                                    <th>Color</th>
                                    <th style={{ width: "8%" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grouped.vehicles.map((v) => (
                                    <tr key={v._id}>
                                        <td>{toText(v.plate)}</td>
                                        <td>{toText(v.state)}</td>
                                        <td>
                                        {v.make || v.model
                                            ? `${v.make || ""} ${v.model || ""}`.trim()
                                            : "—"}
                                        </td>
                                         <td>{toText(v.vin)}</td>
                                        <td>{toText(v.primaryColor)}</td>
                                        <td><button className={styles.moreBtn} onClick={() => setOpenVehicle(v)}>More</button></td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            );
                        }

                       // Enclosures
                        if (grouped.enclosures.length) {
                        detailSections.push(
                            <div key="enclosures" className={styles.tableBlock}>
                            {/* <div className={styles.tableHeader}>Enclosures</div> */}
                            <Link
    className={styles.tableHeader}
    to="/LREnclosures"                         // adjust if your route differs
    state={{
      caseDetails: selectedCase,
      leadDetails: selectedLead,
    }}
  >
    Enclosure Details
  </Link>
                            <table className={styles.simpleTable}>
                                <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>File / Link</th>
                                </tr>
                                </thead>
                                <tbody>
                                {grouped.enclosures.map((e) => {
                                    const href = e?.isLink && e?.link ? e.link : e?.signedUrl ? e.signedUrl : "";
                                    const fileLabel = e?.isLink ? (e?.originalName || e?.link || "") : (e?.originalName || e?.filename || "");
                                    const fileCell = href
                                      ? <a href={href} target="_blank" rel="noreferrer">{fileLabel || "View file"}</a>
                                      : (fileLabel || "—");

                                    return (
                                    <tr key={e._id}>
                                        <td>{toText(e.type)}</td>
                                        <td>{toText(e.enclosureDescription || e.description)}</td>
                                        <td>{fileCell}</td>
                                    </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            </div>
                        );
                        }


                       // Timeline
                        if (timeline.length) {
                        detailSections.push(
                            <div key="timeline" className={styles.tableBlock}>
                            {/* <div className={styles.tableHeader}>Timeline Entries</div> */}
                             <Link
    className={styles.tableHeader}
    to="/LRTimeline"                         // adjust if your route differs
    state={{
      caseDetails: selectedCase,
      leadDetails: selectedLead,
    }}
  >
    Timeline Details
  </Link>
                            <table className={styles.simpleTable}>
                                <thead>
                                <tr>
                                    <th>Event Date</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Location</th>
                                    <th>Description</th>
                                    {/* <th>Flags</th> */}
                                </tr>
                                </thead>
                                <tbody>
                                {timeline.map((t) => (
                                    <tr key={t._id}>
                                    <td>
                                        {t.eventDate
                                        ? new Date(t.eventDate).toLocaleDateString()
                                        : "—"}
                                    </td>
                                    <td>
                                        {t.eventStartTime
                                        ? new Date(t.eventStartTime).toLocaleTimeString()
                                        : "—"}
                                    </td>
                                    <td>
                                        {t.eventEndTime
                                        ? new Date(t.eventEndTime).toLocaleTimeString()
                                        : "—"}
                                    </td>
                                    <td>{toText(t.eventLocation)}</td>
                                    <td>{toText(t.eventDescription)}</td>
                                    {/* <td>
                                        {Array.isArray(t.timelineFlag) && t.timelineFlag.length
                                        ? t.timelineFlag.join(", ")
                                        : "—"}
                                    </td> */}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            </div>
                        );
                        }


                        // Evidence
                        if (grouped.evidence.length) {
                        detailSections.push(
                            <div key="evidence" className={styles.tableBlock}>
                            {/* <div className={styles.tableHeader}>Evidence</div> */}
                             <Link
    className={styles.tableHeader}
    to="/LREvidences"                         // adjust if your route differs
    state={{
      caseDetails: selectedCase,
      leadDetails: selectedLead,
    }}
  >
    Evidence Details
  </Link>
                            <table className={styles.simpleTable}>
                                <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Collected</th>
                                    <th>Disposed</th>
                                    <th>File / Link</th>
                                </tr>
                                </thead>
                                <tbody>
                                {grouped.evidence.map((e) => {
                                    const href = e?.isLink && e?.link ? e.link : e?.signedUrl ? e.signedUrl : "";
                                    const fileLabel = e?.isLink ? (e?.originalName || e?.link || "") : (e?.originalName || e?.filename || "");
                                    const fileCell = href
                                      ? <a href={href} target="_blank" rel="noreferrer">{fileLabel || "View file"}</a>
                                      : (fileLabel || "—");

                                    return (
                                    <tr key={e._id}>
                                        <td>{toText(e.type)}</td>
                                        <td>{toText(e.evidenceDescription)}</td>
                                        <td>{e.collectionDate ? new Date(e.collectionDate).toLocaleDateString() : "—"}</td>
                                        <td>{e.disposedDate ? new Date(e.disposedDate).toLocaleDateString() : "—"}</td>
                                        <td>{fileCell}</td>

                                    </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            </div>
                        );
                        }


                        // Pictures
                        if (grouped.pictures.length) {
                        detailSections.push(
                            <div key="pictures" className={styles.tableBlock}>
                            {/* <div className={styles.tableHeader}>Pictures</div> */}
                             <Link
    className={styles.tableHeader}
    to="/LRPictures"                         // adjust if your route differs
    state={{
      caseDetails: selectedCase,
      leadDetails: selectedLead,
    }}
  >
    Picture Details
  </Link>
                            <table className={styles.simpleTable}>
                                <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Taken On</th>
                                    <th>File / Link</th>
                                  
                                </tr>
                                </thead>
                                <tbody>
                                {grouped.pictures.map((p) => {
                                    const href = p?.isLink && p?.link ? p.link : p?.signedUrl ? p.signedUrl : "";
                                    const fileLabel = p?.isLink ? (p?.originalName || p?.link || "") : (p?.originalName || p?.filename || "");
                                    const fileCell = href
                                      ? <a href={href} target="_blank" rel="noreferrer">{fileLabel || "View file"}</a>
                                      : (fileLabel || "—");

                                    return (
                                    <tr key={p._id}>
                                        <td>{toText(p.pictureDescription || p.description)}</td>
                                        <td>{p.datePictureTaken ? new Date(p.datePictureTaken).toLocaleDateString() : "—"}</td>
                                        <td>{fileCell}</td>

                                    </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            </div>
                        );
                        }


                        // Audios (table view)
                        if (grouped.audio.length) {
                        detailSections.push(
                            <div key="audio" className={styles.tableBlock}>
                            {/* <div className={styles.tableHeader}>Audio</div> */}
                             <Link
    className={styles.tableHeader}
    to="/LRAudio"                         // adjust if your route differs
    state={{
      caseDetails: selectedCase,
      leadDetails: selectedLead,
    }}
  >
    Audio Details
  </Link>
                            <table className={styles.simpleTable}>
                                <thead>
                                <tr>
                                    <th>Recorded On</th>
                                    <th>Description</th>
                                    <th>File / Link</th>
                                </tr>
                                </thead>
                                <tbody>
                                {grouped.audio.map((a) => {
                                    const href =
                                    a?.isLink && a?.link ? a.link :
                                    a?.signedUrl ? a.signedUrl : "";
                                    const fileLabel = a?.isLink ? (a?.originalName || a?.link || "") : (a?.originalName || a?.filename || "");

                                    return (
                                    <tr key={a._id}>
                                        <td>
                                        {a.dateAudioRecorded
                                            ? new Date(a.dateAudioRecorded).toLocaleString()
                                            : "—"}
                                        </td>
                                        <td>{toText(a.audioDescription)}</td>
                                        <td>
                                        {href ? (
                                            <a href={href} target="_blank" rel="noreferrer">
                                            {toText(fileLabel) || "View file"}
                                            </a>
                                        ) : (
                                            toText(fileLabel) || "—"
                                        )}
                                        </td>
                                    </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            </div>
                        );
                        }


                        // Videos (table view)
                        if (grouped.videos.length) {
                        detailSections.push(
                            <div key="videos" className={styles.tableBlock}>
                            <div className={styles.tableHeader}>Videos</div>
                            <table className={styles.simpleTable}>
                                <thead>
                                <tr>
                                    <th>Recorded On</th>
                                    <th>Description</th>
                                    <th>File / Link</th>
                                </tr>
                                </thead>
                                <tbody>
                                {grouped.videos.map((v) => {
                                    const href =
                                    v?.isLink && v?.link ? v.link :
                                    v?.signedUrl ? v.signedUrl : "";
                                    const fileLabel = v?.isLink ? (v?.originalName || v?.link || "") : (v?.originalName || v?.filename || "");

                                    return (
                                    <tr key={v._id}>
                                        <td>
                                        {v.dateVideoRecorded
                                            ? new Date(v.dateVideoRecorded).toLocaleString()
                                            : "—"}
                                        </td>
                                        <td>{toText(v.videoDescription)}</td>
                                        <td>
                                        {href ? (
                                            <a href={href} target="_blank" rel="noreferrer">
                                            {toText(fileLabel) || "View file"}
                                            </a>
                                        ) : (
                                            toText(fileLabel) || "—"
                                        )}
                                        </td>
                                    </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            </div>
                        );
                        }


                        // If nothing to show, skip the grid entirely
                        if (detailSections.length === 0) return null;

                        // Split into 2 balanced columns
                        const mid = Math.ceil(detailSections.length / 2);
                        const leftSections = detailSections.slice(0, mid);
                        const rightSections = detailSections.slice(mid);

                        return (
                            <div className={styles.gridTwo}>
                            <div className={styles.gridCol}>{leftSections}</div>
                            <div className={styles.gridCol}>{rightSections}</div>
                            </div>
                        );
                        })()}

                        </div>
                      );
                    })}
                  </section>
                  </div>
                </div>

                {/* Right rail: comments stays active even when the sheet is open */}
                {/* <div className={styles.commentSec}>
                  <CommentBar tag="ViewLR" threadKey={threadKey} autoFocus={false} />
                </div> */}

             {showComments && (
  <aside className={styles.commentSec} 
  style={{ '--cbar-list-height': 'calc(100vh - 40vh)' }}>
    <CommentBar
      combined
      status={status}
      leadNo={leadNo}
      leadName={leadName}
      includePrivateFrom={[
        currentUser,          // me (investigator)
        managerUsername,      // case manager who returned it
        // optionally include other assignees if you want a shared private stream:
        // ...investigatorUsernames
      ].filter(Boolean)}
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
    </div>
  );
};
