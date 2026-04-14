import React, { useContext, useState, useEffect, useMemo } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { CaseContext } from "../CaseContext";
import api from "../../api"; // adjust if your api path differs
import { AlertModal } from "../../components/AlertModal/AlertModal";
import styles from './ChainOfCustody.module.css';
import { LRTopMenu } from '../InvestgatorLR/LRTopMenu';
import { VersionHistoryButton } from '../../components/VersionHistoryButton/VersionHistoryButton';
import { safeEncode } from '../../utils/encode';


export const ChainOfCustody = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { caseDetails } = location.state || {};
  const { selectedCase, selectedLead, leadStatus } = useContext(CaseContext);
  const [alertOpen, setAlertOpen] = useState(false);
  // local state
  const [leadData, setLeadData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
    const [alertMessage, setAlertMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

   const toTitleCase = (s = "") =>
  s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());

// helper to attach files for sections that have uploads
const attachFiles = async (items, idFieldName, filesEndpoint) => {
  return Promise.all(
    (items || []).map(async (item) => {
      const realId = item[idFieldName];
      if (!realId) return { ...item, files: [] };
      try {
        const { data: filesArray } = await api.get(
          `${filesEndpoint}/${realId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        return { ...item, files: filesArray };
      } catch (err) {
        console.error(`Error fetching files for ${filesEndpoint}/${realId}:`, err);
        return { ...item, files: [] };
      }
    })
  );
};

  const signedInOfficer = localStorage.getItem("loggedInUser");

const primaryUsername =
  leadData?.primaryInvestigator || leadData?.primaryOfficer || "";

// am I the primary investigator on this lead?
const isPrimaryInvestigator =
  selectedCase?.role === "Investigator" &&
  !!signedInOfficer &&
  signedInOfficer === primaryUsername;



  

  // --- fetch users for name resolution
  useEffect(() => {
    let mounted = true;
    api
      .get("/api/users/usernames")
      .then(({ data }) => mounted && setAllUsers(data?.users || []))
      .catch(() => mounted && setAllUsers([]));
    return () => {
      mounted = false;
    };
  }, []);

  // --- fetch lead (should include `events` and `leadStatus`)
  useEffect(() => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?._id || selectedCase?.id ? selectedCase : location.state?.caseDetails;
    const kaseId = kase?._id || kase?.id;
    if (!lead?.leadNo || !(lead.leadName || lead.description) || !kaseId) return;

    const token = localStorage.getItem("token");
    api
      .get(
        `/api/lead/lead/${lead.leadNo}/${safeEncode(
          lead.leadName || lead.description
        )}/${kaseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(({ data }) => {
        const item = data?.[0];
        if (item) setLeadData(item);
      })
      .catch(console.error);
  }, [selectedLead, selectedCase, location.state]);

  // --- helpers
  function fmtDT(d) {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? "" : dt.toLocaleString();
  }

  function nameOf(uname) {
    const u = allUsers.find((x) => x.username === uname);
    return u ? `${u.firstName} ${u.lastName} (${u.username})` : uname || "—";
  }

  function buildDecisionMaps(events = []) {
    const acceptedAt = new Map();
    const declinedAt = new Map();
    const declinedReason = new Map();
    events.forEach((ev) => {
      if (!Array.isArray(ev.to)) return;
      if (ev.type === "accepted") {
        ev.to.forEach((u) => {
          if (!acceptedAt.has(u)) acceptedAt.set(u, ev.at);
        });
      } else if (ev.type === "declined") {
        ev.to.forEach((u) => {
          if (!declinedAt.has(u)) declinedAt.set(u, ev.at);
          if (ev.reason) declinedReason.set(u, ev.reason);
        });
      }
    });
    return { acceptedAt, declinedAt, declinedReason };
  }

  const eventsSorted = useMemo(
    () => (leadData?.events ? [...leadData.events].sort((a, b) => new Date(a.at) - new Date(b.at)) : []),
    [leadData?.events]
  );

  // --- inner component: full-page Assignment Log
  // --- inner component: full-page Assignment Log (modernized) ---
const AssignmentLog = ({ events, status }) => {
  const evs = Array.isArray(events) ? events : [];

  const firstAssigned = evs.find(e => e.type === "assigned") || null;
  const adds    = evs.filter(e => e.type === "reassigned-added");
  const removes = evs.filter(e => e.type === "reassigned-removed");

  const { acceptedAt, declinedAt, declinedReason } = buildDecisionMaps(evs);

  // current assigned set (initial + adds − removes)
  const assignedSet = (() => {
    const s = new Set(firstAssigned?.to || []);
    [...adds, ...removes]
      .sort((a, b) => new Date(a.at) - new Date(b.at))
      .forEach((ev) => (ev.to || []).forEach((u) => {
        if (ev.type === "reassigned-added") s.add(u);
        if (ev.type === "reassigned-removed") s.delete(u);
      }));
    return s;
  })();

  const pending = [...assignedSet].filter(u => !acceptedAt.has(u) && !declinedAt.has(u));
  const stream  = [...evs].sort((a, b) => new Date(a.at) - new Date(b.at));

  const msg = (ev) => {
  const people = (ev.to || []).map(nameOf).join(", ") || "—";
  switch (ev.type) {
    case "assigned":
      return `Assigned to ${people}${ev.primaryInvestigator ? ` • Primary: ${nameOf(ev.primaryInvestigator)}` : ""}`;
    case "accepted":
      return `${people} accepted`;
    case "declined":
      return `${people} declined${ev.reason ? ` • Reason: ${ev.reason}` : ""}`;
    case "reassigned-added":
      return `Added ${people}${ev.primaryInvestigator ? ` • Primary: ${nameOf(ev.primaryInvestigator)}` : ""}`;
    case "reassigned-removed":
      return `Removed ${people}`;
    case "pi-submitted":
      return `Primary Investigator submitted lead return${ev.leadReturnId ? ` • Return ID: ${ev.leadReturnId}` : ""}`;
    case "cm-approved":
      return `Case Manager approved${ev.reason ? ` • Note: ${ev.reason}` : ""}`;
    case "cm-returned":
      return `Case Manager returned for changes${ev.reason ? ` • Reason: ${ev.reason}` : ""}`;
    case "cm-closed":
      return `Case Manager closed${ev.reason ? ` • Reason: ${ev.reason}` : ""}`;
    case "cm-reopened":
      return `Case Manager reopened${ev.reason ? ` • Note: ${ev.reason}` : ""}`;
    default:
      return ev.type || "—";
  }
};

const icon = (t) =>
  t === "accepted"           ? "✓" :
  t === "declined"           ? "✕" :
  t === "reassigned-added"   ? "+" :
  t === "reassigned-removed" ? "−" :
  t === "pi-submitted"       ? "⤴" :
  t === "cm-approved"        ? "✔" :
  t === "cm-returned"        ? "↺" :
  t === "cm-closed"          ? "⏹" :
  t === "cm-reopened"        ? "↻" :
                               "●";

const tone = (t) =>
  t === "accepted"           ? "ok" :
  t === "cm-approved"        ? "ok" :
  t === "declined"           ? "bad" :
  t === "cm-returned"        ? "info" :
  t === "cm-closed"          ? "muted" :
  t === "cm-reopened"        ? "info" :
  t === "reassigned-added"   ? "info" :
  t === "reassigned-removed" ? "muted" :
  t === "pi-submitted"       ? "base" :
                               "base";


  const statusClass = String(status || "").toLowerCase().replace(/\s+/g, "-");

//   const cmApproved = evs.filter(e => e.type === "cm-approved").length;
// const cmReturned = evs.filter(e => e.type === "cm-returned").length;
// const cmClosed   = evs.filter(e => e.type === "cm-closed").length;
// const cmReopened = evs.filter(e => e.type === "cm-reopened").length;
// const piSubmitted= evs.filter(e => e.type === "pi-submitted").length;

  return (
    <div className={`${styles.elog} ${styles.card}`}>
      <div className={styles['elog-header']}>
      <h3>
  {selectedLead?.leadNo
    ? `Lead #${selectedLead.leadNo}: ${toTitleCase(selectedLead?.leadName || "")}`
    : "LEAD DETAILS"}
</h3>

        <div className={`${styles.chip} ${styles['chip-status']} ${styles[statusClass] || ''}`}>{status || "—"}</div>
      </div>

      <div className={styles['elog-counters']}>
        <span className={`${styles.counter} ${styles.ok}`}>Accepted {acceptedAt.size}</span>
        <span className={`${styles.counter} ${styles.bad}`}>Declined {declinedAt.size}</span>
        <span className={`${styles.counter} ${styles.base}`}>Pending {pending.length}</span>
        <VersionHistoryButton leadNo={selectedLead?.leadNo} className="small" />
      </div>

      {/* <div className={`${styles['elog-counters']} ${styles.extra}`}>
  <span className={`${styles.counter} ${styles.base}`}>PI submitted {piSubmitted}</span>
  <span className={`${styles.counter} ${styles.ok}`}>CM approved {cmApproved}</span>
  <span className={`${styles.counter} ${styles.warn}`}>CM returned {cmReturned}</span>
  <span className={`${styles.counter} ${styles.muted}`}>CM closed {cmClosed}</span>
  <span className={`${styles.counter} ${styles.info}`}>CM reopened {cmReopened}</span>
</div> */}

 <div className={styles['elog-scroll']}>

      {stream.length === 0 ? (
        <div className={styles.muted}>No activity yet.</div>
      ) : (
        <ul className={styles['elog-list']}>
          {stream.map((ev, i) => (
            <li key={i} className={`${styles['elog-item']} ${styles[tone(ev.type)]}`}>
              <div className={styles.pin}>{icon(ev.type)}</div>
              <div className={styles.body}>
                <div className={styles.line}>{msg(ev)}</div>
                <div className={styles.meta}>
                  by <b>{nameOf(ev.by)}</b> • {fmtDT(ev.at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
};

  const handleViewLeadReturn = async () => {
  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

  if (!lead?.leadNo || !(lead.leadName || lead.description) || !kase?.caseNo || !kase?.caseName) {
    setAlertMessage("Please select a case and lead first.");
    setAlertOpen(true);
    return;
  }

  if (isGenerating) return;

  try {
    setIsGenerating(true);

    const token = localStorage.getItem("token");
    const headers = { headers: { Authorization: `Bearer ${token}` } };

    const { leadNo } = lead;
    const leadName = lead.leadName || lead.description;
    const caseId = kase._id || kase.id;
    const encLead = safeEncode(leadName);

    // fetch everything we need for the report (same endpoints you use on LRFinish)
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
      scratchpadRes,
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
      api.get(`/api/scratchpad/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/timeline/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
    ]);

    // add files where applicable (note the plural file endpoints)
    const enclosuresWithFiles = await attachFiles(enclosuresRes.data, "_id", "/api/lrenclosures/files");
    const evidenceWithFiles   = await attachFiles(evidenceRes.data,   "_id", "/api/lrevidences/files");
    const picturesWithFiles   = await attachFiles(picturesRes.data,   "pictureId", "/api/lrpictures/files");
    const audioWithFiles      = await attachFiles(audioRes.data,      "audioId",   "/api/lraudio/files");
    const videosWithFiles     = await attachFiles(videosRes.data,     "videoId",   "/api/lrvideo/files");

    const leadInstructions = instrRes.data?.[0] || {};
    const leadReturns      = returnsRes.data || [];
    const leadPersons      = personsRes.data || [];
    const leadVehicles     = vehiclesRes.data || [];
    const leadScratchpad   = scratchpadRes.data || [];
    const leadTimeline     = timelineRes.data || [];

    // make all sections true (Full Report)
    const selectedReports = {
      FullReport: true,
      leadInstruction: true,
      leadReturn: true,
      leadPersons: true,
      leadVehicles: true,
      leadEnclosures: true,
      leadEvidence: true,
      leadPictures: true,
      leadAudio: true,
      leadVideos: true,
      leadScratchpad: true,
      leadTimeline: true,
    };

    const body = {
      user: localStorage.getItem("loggedInUser") || "",
      reportTimestamp: new Date().toISOString(),

      // sections (values are the fetched arrays/objects)
      leadInstruction: leadInstructions,
      leadReturn:      leadReturns,
      leadPersons,
      leadVehicles,
      leadEnclosures:  enclosuresWithFiles,
      leadEvidence:    evidenceWithFiles,
      leadPictures:    picturesWithFiles,
      leadAudio:       audioWithFiles,
      leadVideos:      videosWithFiles,
      leadScratchpad,
      leadTimeline,

      // also send these two, since your backend expects them
      selectedReports,
      leadInstructions,
      leadReturns,
    };

    const resp = await api.post("/api/report/generate", body, {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` },
    });

    const file = new Blob([resp.data], { type: "application/pdf" });

    navigate("/DocumentReview", {
      state: {
        pdfBlob: file,
        filename: `Lead_${leadNo || "report"}.pdf`,
      },
    });
  } catch (err) {
    if (err?.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      console.error("Report error:", text);
      setAlertMessage("Error generating PDF:\n" + text);
    } else {
      console.error("Report error:", err);
      setAlertMessage("Error generating PDF:\n" + (err.message || "Unknown error"));
    }
    setAlertOpen(true);
  } finally {
    setIsGenerating(false);
  }
};

  return (
    <div className={styles.adminContainer}>
      <Navbar />

      <div className={styles.mainContainer}>
        <SideBar activePage="LeadReview" />

        <div className={styles.leftContent}>
          <LRTopMenu
            activePage="chainOfCustody"
            selectedCase={selectedCase}
            selectedLead={selectedLead}
            isPrimaryInvestigator={isPrimaryInvestigator}
            isGenerating={isGenerating}
            onManageLeadReturn={handleViewLeadReturn}
            styles={styles}
          />

          {/* FULL-PAGE ASSIGNMENT LOG */}
          <AssignmentLog
            events={eventsSorted}
            status={leadData?.leadStatus || leadStatus}
          />
        </div>
      </div>
    </div>
  );
};

        {/* <div className="table-container1">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Officer</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
            {logEntries.map((entry, index) => (
          <tr key={index}>
            <td>{new Date(entry.date).toLocaleString()}</td>
            <td>{entry.officer}</td>
            <td>{entry.action}</td>
          </tr>
        ))}
            </tbody>
          </table>
        </div> */}
   