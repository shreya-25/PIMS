import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import CommentBar from "../../components/CommentBar/CommentBar";
import { CaseContext } from "../CaseContext";
import api from "../../api";
import styles from "./ViewLR.module.css"; 

/* ---------- person details sheet (non-blocking) ---------- */
function PersonSheet({ person, onClose }) {
  // Close with Esc
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!person) return null;

  // flatten useful pairs to render
  const fields = Object.entries(person)
    .filter(([k]) => !["_id", "__v", "files"].includes(k));

  return (
    <>
      {/* transparent backdrop: lets clicks fall through to page/comment bar */}
      <div className={styles.nbBackdrop} />

      {/* floating sheet: catches only its own clicks */}
      <aside className={styles.personSheet} role="dialog" aria-modal="false" aria-label="Person details">
        <div className={styles.sheetHeader}>
          <h4 className={styles.sheetTitle}>Person Details</h4>
          <button className={styles.iconBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.sheetBody}>
          <div className={styles.kvGrid}>
            {fields.map(([key, val]) => (
              <div key={key} className={styles.kvRow}>
                <div className={styles.kvKey}>{key}</div>
                <div className={styles.kvVal}>{toText(val)}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

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
  const { selectedCase, selectedLead } = useContext(CaseContext);

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
  const [notes, setNotes] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPerson, setOpenPerson] = useState(null);
  const [showComments, setShowComments] = useState(true);
const toggleComments = useCallback(() => setShowComments(s => !s), []);
const closeComments  = useCallback(() => setShowComments(false), []);

  const caseNo   = selectedCase?.caseNo   || location.state?.caseDetails?.caseNo;
  const caseName = selectedCase?.caseName || location.state?.caseDetails?.caseName;
  const leadNo   = selectedLead?.leadNo   || location.state?.leadDetails?.leadNo;
  const leadName = selectedLead?.leadName || location.state?.leadDetails?.leadName;




  // -------- fetch all sections (same endpoints you already use) --------
  useEffect(() => {
    if (!caseNo || !caseName || !leadNo || !leadName) return;
    const encLead = encodeURIComponent(leadName);
    const encCase = encodeURIComponent(caseName);
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
          notesRes,
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

        setInstructions(instrRes.data?.[0] || {});
        setReturns(returnsRes.data || []);
        setPersons(personsRes.data || []);
        setVehicles(vehiclesRes.data || []);
        setEnclosures(enclosuresRes.data || []);
        setEvidence(evidenceRes.data || []);
        setPictures(picturesRes.data || []);
        setAudio(audioRes.data || []);
        setVideos(videosRes.data || []);
        setNotes(notesRes.data || []);
        setTimeline(timelineRes.data || []);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [caseNo, caseName, leadNo, leadName]);

  // Group helpers — we’ll try common keys: narrativeId, returnId, lrId, or fall back to _id
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

  if (!caseNo || !leadNo) {
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


  return (
    <div className="lrfinish-container">
      <Navbar />
      {/* <div className="styles.lrcontent"> */}

        {/* Main content */}
        {/* <div className={styles.lrcontent}> */}
          {/* Top menu (same pattern as LRFinish) */}
          {/* <div className="top-menu" style={{ marginTop: 2, background: "#3333330e" }}>
            <div className="menu-items" style={{ fontSize: 19 }}>
              <span className="menu-item" onClick={() => go("/LRInstruction")}>Instructions</span>
              <span className="menu-item" onClick={() => go("/LRReturn")}>Narrative</span>
              <span className="menu-item" onClick={() => go("/LRPerson")}>Person</span>
              <span className="menu-item" onClick={() => go("/LRVehicle")}>Vehicles</span>
              <span className="menu-item" onClick={() => go("/LREnclosures")}>Enclosures</span>
              <span className="menu-item" onClick={() => go("/LREvidence")}>Evidence</span>
              <span className="menu-item" onClick={() => go("/LRPictures")}>Pictures</span>
              <span className="menu-item" onClick={() => go("/LRAudio")}>Audio</span>
              <span className="menu-item" onClick={() => go("/LRVideo")}>Videos</span>
              <span className="menu-item" onClick={() => go("/LRScratchpad")}>Notes</span>
              <span className="menu-item" onClick={() => go("/LRTimeline")}>Timeline</span>
              <span className="menu-item active" onClick={() => go("/ViewLR")}>View All</span>
            </div>
          </div> */}
          <div className="top-menu">
        <div className="menu-items">
                <span className="menu-item " onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LeadReview", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } }} > Lead Information</span>

           <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LRInstruction", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                    // alert("Please select a case and lead first.");
                    //  setAlertMessage("Please select a case and lead first.");
                    //  setAlertOpen(true);
                  }
                }}>Add Lead Return</span>
          <span className="menu-item active">View Lead Return</span>
          <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/ChainOfCustody", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                    // alert("Please select a case and lead first.");
                    //  setAlertMessage("Please select a case and lead first.");
                    //  setAlertOpen(true);
                  }
                }}>Lead Chain of Custody</span>
          
        </div>
      </div>

            <div className="LRI_Content9">
                    {/* <SideBar  activePage="CasePageManager" /> */}

          <div className="left-content9">
            {loading ? (
              <div className="loading">Loading…</div>
            ) : (
              <>
              
          <div className="caseandleadinfo">
            <h5 className="side-title">
              PIMS &gt; Cases &gt; Lead #{leadNo} &gt; View All
            </h5>
            <h5 className="side-title">
              Case: {caseName} &nbsp;|&nbsp; Lead: {leadName}
            </h5>
          </div>

       <div className={styles.cont}>
                  <div className={`${styles.lrsec} ${styles.singleCol} ${!showComments ? styles.lrsecFull : ""}`}>

                  {/* Instructions */}
                  <section className={styles.block}>
                        <div className={styles.lrRow}>
                            <div className={styles.rowLabel}>Lead Log Summary</div>
                            <div className={styles.rowContent}>
                                <div className={styles.textBox}>
                                   {leadLogSummary ? toText(leadLogSummary) : "—"}
                                </div>
                            </div>
                        </div>

                        <div className={styles.lrRow}>
                            <div className={styles.rowLabel}>Lead Instructions</div>
                            <div className={styles.rowContent}>
                                <div className={styles.textBox}>
                                   {leadInstructionText ? toText(leadInstructionText) : "—"}
                                </div>
                            </div>
                        </div>

                  </section>

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
                                <span className={styles.metaValue}>{toText(ret.enteredBy) || "Unknown"}</span>
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
                            <div className={styles.rowLabel}>Narrative</div>
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
                                <div className={styles.tableHeader}>Person Details</div>
                                <table className={styles.simpleTable}>
                                <thead>
                                    <tr>
                                    <th>Date </th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grouped.persons.map((p) => (
                                    <tr
                                        key={p._id}
                                        className={styles.clickRow}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openPersonSheet(p)}
                                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPersonSheet(p)}
                                        title="Click to view full person details"
                                    >
                                        <td>{p.enteredDate ? new Date(p.enteredDate).toLocaleDateString() : "—"}</td>
                                        <td>{toText(p.firstName)}</td>
                                        <td>{toText(p.cellNumber)}</td>
                                        <td>{toText(p.address)}</td>
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
                                <div className={styles.tableHeader}>Vehicles</div>
                                <table className={styles.simpleTable}>
                                <thead>
                                    <tr>
                                    <th>Plate</th>
                                    <th>State</th>
                                    <th>Make/Model</th>
                                    <th>VIN</th>
                                    <th>Color</th>
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
                            <div className={styles.tableHeader}>Enclosures</div>
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
                                    const fileCell = e.isLink
                                    ? (e.link ? <a href={e.link} target="_blank" rel="noreferrer">Open link</a> : "—")
                                    : (e.originalName || e.filename || e.filePath || "—");

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
                            <div className={styles.tableHeader}>Timeline Entries</div>
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
                            <div className={styles.tableHeader}>Evidence</div>
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
                                    // decide what to show as the “file” cell
                                    const fileCell = e.isLink
                                    ? (e.link ? <a href={e.link} target="_blank" rel="noreferrer">Open link</a> : "—")
                                    : (e.originalName || e.filename || e.filePath || "—");

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
                            <div className={styles.tableHeader}>Pictures</div>
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
                                    const fileCell = p.isLink
                                    ? (p.link ? <a href={p.link} target="_blank" rel="noreferrer">Open link</a> : "—")
                                    : (p.originalName || p.filename || p.filePath || "—");

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
                            <div className={styles.tableHeader}>Audio</div>
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
                                    a?.filePath ? a.filePath : "";          // keep generic; prefix if your API serves static files
                                    const fileLabel = a?.originalName || a?.filename || (a?.isLink ? "Open link" : "View");

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
                                            {toText(fileLabel)}
                                            </a>
                                        ) : (
                                            "—"
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
                                    v?.filePath ? v.filePath : "";
                                    const fileLabel = v?.originalName || v?.filename || (v?.isLink ? "Open link" : "View");

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
                                            {toText(fileLabel)}
                                            </a>
                                        ) : (
                                            "—"
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

                {/* Right rail: comments stays active even when the sheet is open */}
                {/* <div className={styles.commentSec}>
                  <CommentBar tag="ViewLR" threadKey={threadKey} autoFocus={false} />
                </div> */}

               {showComments && (
  <aside className={styles.commentSec}>
    <div
      className={styles.commentHeader}
      onClick={closeComments}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && closeComments()}
    >
      {/* <span>Comments</span> */}
      {/* <button className={styles.commentCloseBtn} aria-label="Hide comments">×</button> */}
    </div>

    {/* If CommentBar supports these callbacks, include them; otherwise omit. */}
    <CommentBar
      tag="ViewLR"
      threadKey={threadKey}
      autoFocus={false}
      onClose={closeComments}
      onSubmitted={closeComments}
    />
  </aside>
)}



                
              </div>

              {/* Non-blocking person detail sheet */}
              <PersonSheet person={openPerson} onClose={closePersonSheet} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
