import React, { useContext, useState, useEffect, useMemo } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { CaseContext } from "../CaseContext";
import api from "../../api"; // adjust if your api path differs
import { AlertModal } from "../../components/AlertModal/AlertModal";
import './ChainOfCustody.css';


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

// primary goes to the interactive ViewLR page
const goToViewLR = () => {
  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

  if (!lead?.leadNo || !lead?.leadName || !kase?.caseNo || !kase?.caseName) {
    setAlertMessage("Please select a case and lead first.");
    setAlertOpen(true);
    return;
  }

  navigate("/viewLR", {
    state: { caseDetails: kase, leadDetails: lead }
  });
};


  

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
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
    if (!lead?.leadNo || !(lead.leadName || lead.description) || !kase?.caseNo || !kase?.caseName) return;

    const token = localStorage.getItem("token");
    api
      .get(
        `/api/lead/lead/${lead.leadNo}/${encodeURIComponent(
          lead.leadName || lead.description
        )}/${kase.caseNo}/${encodeURIComponent(kase.caseName)}`,
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
    <div className="elog card">
      <div className="elog-header">
        <h3> 
          Lead #{selectedLead?.leadNo || leadData?.leadNo || "—"} —{" "}
    {(selectedLead?.leadName || leadData?.leadName || leadData?.description || "—")}
        </h3>
        <div className={`chip chip-status ${statusClass}`}>{status || "—"}</div>
      </div>

      <div className="elog-counters">
        <span className="counter ok">Accepted {acceptedAt.size}</span>
        <span className="counter bad">Declined {declinedAt.size}</span>
        <span className="counter base">Pending {pending.length}</span>
      </div>

      {/* <div className="elog-counters extra">
  <span className="counter base">PI submitted {piSubmitted}</span>
  <span className="counter ok">CM approved {cmApproved}</span>
  <span className="counter warn">CM returned {cmReturned}</span>
  <span className="counter muted">CM closed {cmClosed}</span>
  <span className="counter info">CM reopened {cmReopened}</span>
</div> */}

      {stream.length === 0 ? (
        <div className="muted">No activity yet.</div>
      ) : (
        <ul className="elog-list">
          {stream.map((ev, i) => (
            <li key={i} className={`elog-item ${tone(ev.type)}`}>
              <div className="pin">{icon(ev.type)}</div>
              <div className="body">
                <div className="line">{msg(ev)}</div>
                <div className="meta">
                  by <b>{nameOf(ev.by)}</b> • {fmtDT(ev.at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
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
    const { caseNo, caseName } = kase;
    const encLead = encodeURIComponent(leadName);
    const encCase = encodeURIComponent(caseName);

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
      api.get(`/api/lead/lead/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrenclosure/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrevidence/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrpicture/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lraudio/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrvideo/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/scratchpad/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/timeline/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
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
    <div className="admin-container">
      <Navbar />

      <div className="main-container">
        <SideBar activePage="CasePageManager" />

        <div className="left-content">
          <div className="top-menu1">
            <div className="menu-items">
              <span
                className="menu-item"
                onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                  if (lead && kase) {
                    navigate("/LeadReview", { state: { caseDetails: kase, leadDetails: lead } });
                  }
                }}
              >
                Lead Information
              </span>

              <span
                className="menu-item"
                onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                  if (lead && kase) {
                    navigate("/LRInstruction", { state: { caseDetails: kase, leadDetails: lead } });
                  } else {
                    alert("Please select a case and lead first.");
                  }
                }}
              >
                Add Lead Return
              </span>
               {(["Case Manager", "Detective Supervisor"].includes(selectedCase?.role)) && (
           <span
              className="menu-item"
              onClick={handleViewLeadReturn}
              title={isGenerating ? "Preparing report…" : "View Lead Return"}
              style={{ opacity: isGenerating ? 0.6 : 1, pointerEvents: isGenerating ? "none" : "auto" }}
            >
              Manage Lead Return
            </span>
              )}
             {selectedCase?.role === "Investigator" && isPrimaryInvestigator && (
  <span className="menu-item" onClick={goToViewLR}>
    Submit Lead Return
  </span>
)}

  {selectedCase?.role === "Investigator" && !isPrimaryInvestigator && (
  <span className="menu-item" onClick={goToViewLR}>
   Review Lead Return
  </span>
)}


              <span
                className="menu-item active"
                onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                  if (lead && kase) {
                    navigate("/ChainOfCustody", { state: { caseDetails: kase, leadDetails: lead } });
                  } else {
                    alert("Please select a case and lead first.");
                  }
                }}
              >
                Lead Chain of Custody
              </span>
            </div>
          </div>

            {/* <div className="caseandleadinfo">
          <h5 className = "side-title"> 
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Chain of Custody
                 </p>
             </h5>
          <h5 className="side-title">
{selectedLead?.leadNo
        ? `Your Role: ${selectedCase.role || ""}`
    : ``}
</h5>

          </div> */}


          {/* <div className="case-header">
            <h1>
              {selectedLead?.leadNo
                ? `LEAD: ${selectedLead.leadNo} | ${(selectedLead.leadName || "").toUpperCase()}`
                : "LEAD DETAILS"}
            </h1>
          </div> */}

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
   