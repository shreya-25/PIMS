import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { Link } from "react-router-dom";
import axios from "axios";
import { CaseContext } from "../CaseContext";
import PersonModal from "../../components/PersonModal/PersonModel";
import VehicleModal from "../../components/VehicleModal/VehicleModal";
import Pagination from "../../components/Pagination/Pagination";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import api from "../../api";
import { safeEncode } from "../../utils/encode";
import styles from "./GenerateReport.module.css";

// ===== DATE / TIME HELPERS =====

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

const convert12To24 = (time12h) => {
  if (!time12h) return time12h;
  const upper = String(time12h).toUpperCase();
  if (!upper.includes("AM") && !upper.includes("PM")) return time12h;
  const [time, modifier] = upper.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (modifier === "AM") { if (h === 12) h = 0; }
  else { if (h !== 12) h += 12; }
  return `${String(h).padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

// ===== DATA UTILITIES =====

const toArray = (val) => {
  if (Array.isArray(val)) return val.map(String);
  if (val == null) return [];
  if (typeof val === "number") return [String(val)];
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

const toNum = (v) => {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  return s ? Number.parseInt(s, 10) : NaN;
};

// Extract the return/narrative ID from a lead-return object
const lrKeyFor = (obj = {}) =>
  obj.narrativeId || obj.returnId || obj.lrId || obj.leadReturnId ||
  obj.lead_return_id || obj.lr_id || obj.leadReturnID || obj.lead_returnId || obj._id;

// Group section arrays (persons, vehicles, etc.) into a Map keyed by return ID
function groupSectionsByReturn({
  persons = [], vehicles = [], enclosures = [], evidence = [],
  pictures = [], audio = [], videos = [], scratchpad = [], timeline = []
}) {
  const map = new Map();
  const touch = (k) => {
    if (!map.has(k)) map.set(k, {
      persons: [], vehicles: [], enclosures: [], evidence: [],
      pictures: [], audio: [], videos: [], scratchpad: [], timeline: []
    });
    return map.get(k);
  };
  const add = (arr, field) => arr.forEach((x) => touch(lrKeyFor(x))[field].push(x));
  add(persons, "persons");
  add(vehicles, "vehicles");
  add(enclosures, "enclosures");
  add(evidence, "evidence");
  add(pictures, "pictures");
  add(audio, "audio");
  add(videos, "videos");
  add(scratchpad, "scratchpad");
  add(timeline, "timeline");
  return map;
}

// Display formatters
const fmt = (v) => (v == null || v === "" ? "N/A" : String(v));
const getFileName = (u = "") => {
  try { const p = new URL(u); return decodeURIComponent(p.pathname.split("/").pop() || u); }
  catch { return u?.split("/").pop() || u; }
};
const openInNewTab = (url) => window.open(url, "_blank", "noopener,noreferrer");

// Check if a lead's status is "deleted"
const isDeletedStatus = (s) => String(s ?? "").trim().toLowerCase() === "deleted";

// Build ordered list of unique leads from timeline entries (ascending)
const buildTimelineOrderedLeads = (entries, allLeads) => {
  const out = [];
  const seen = new Set();
  for (const e of entries) {
    const key = String(e.leadNo ?? "");
    if (!key || seen.has(key)) continue;
    const match = (allLeads || []).find(l => String(l.leadNo) === key);
    if (match) { seen.add(key); out.push(match); }
  }
  return out;
};

// ===== API FETCH HELPERS =====

// Fetch all sections for one lead (persons, vehicles, evidence, etc.) — mirrors ViewLR
async function fetchLeadAllSectionsLikeViewLR({ leadNo, leadName, caseId, token }) {
  const headers = { headers: { Authorization: `Bearer ${token}` } };
  const encLead = safeEncode(leadName || "");

  const [
    instrRes, returnsRes, personsRes, vehiclesRes, enclosuresRes,
    evidenceRes, picturesRes, audioRes, videosRes, notesRes, timelineRes,
    auditRes,
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
    api.get(`/api/audit/logs`, { ...headers, params: { leadNo } }).catch(() => ({ data: { logs: [] } })),
  ]);

  const leadDoc    = instrRes.data?.[0] || {};
  const returns    = Array.isArray(returnsRes.data)    ? returnsRes.data    : [];
  const persons    = Array.isArray(personsRes.data)    ? personsRes.data    : [];
  const vehicles   = Array.isArray(vehiclesRes.data)   ? vehiclesRes.data   : [];
  const enclosures = Array.isArray(enclosuresRes.data) ? enclosuresRes.data : [];
  const evidence   = Array.isArray(evidenceRes.data)   ? evidenceRes.data   : [];
  const pictures   = Array.isArray(picturesRes.data)   ? picturesRes.data   : [];
  const audio      = Array.isArray(audioRes.data)      ? audioRes.data      : [];
  const videos     = Array.isArray(videosRes.data)     ? videosRes.data     : [];
  const notes      = Array.isArray(notesRes.data)      ? notesRes.data      : [];
  const timeline   = Array.isArray(timelineRes.data)   ? timelineRes.data   : [];
  const auditLogs  = Array.isArray(auditRes.data?.logs) ? auditRes.data.logs : [];

  const buckets = groupSectionsByReturn({
    persons, vehicles, enclosures, evidence, pictures, audio, videos,
    scratchpad: notes, timeline,
  });

  const leadReturns = returns.map((ret) => {
    const k = lrKeyFor(ret);
    const g = buckets.get(k) || {
      persons: [], vehicles: [], enclosures: [], evidence: [],
      pictures: [], audio: [], videos: [], scratchpad: [], timeline: [],
    };
    return { ...ret, ...g };
  });

  // Identify returns that existed before the lead was reopened (pre-reopen snapshot).
  //
  // Two cases:
  //   1. leadStatus === "Reopened"  → lead just reopened, no new returns filed yet.
  //      ALL existing returns are pre-reopen; capture them immediately.
  //   2. reopenedDate set but status moved on (e.g. "In Review", "Approved") →
  //      lead was reopened and then worked again.  Filter by createdAt (immutable
  //      MongoDB timestamp) so that returns whose *content* was edited after the
  //      reopen are NOT mistakenly pulled in via lastModifiedDate.
  let preReopenReturns = [];
  if (leadDoc.leadStatus === "Reopened") {
    // Case 1: currently reopened — all current returns are the pre-reopen snapshot
    preReopenReturns = [...leadReturns];
  } else if (leadDoc.reopenedDate) {
    // Case 2: was reopened and has since progressed — filter by creation timestamp
    const reopenedAt = new Date(leadDoc.reopenedDate).getTime();
    preReopenReturns = leadReturns.filter((ret) => {
      // createdAt is set by MongoDB on document creation and never changes.
      // Fall back to enteredDate only if createdAt is absent.
      const retDate = new Date(ret.createdAt || ret.enteredDate || 0).getTime();
      return retDate < reopenedAt;
    });
  }

  return {
    ...leadDoc,
    leadNo: String(leadNo),
    description: leadDoc?.description ?? leadName,
    leadReturns,
    preReopenReturns,
    notes,
    timelineForLead: timeline,
    auditLogs,
  };
}

const cleanLeadRecord = (lead) => ({
  ...lead,
  leadNo: String(lead.leadNo ?? ""),
  parentLeadNo: toArray(lead.parentLeadNo),
});

// Deep fetch for one lead with all sections (ViewLR-style)
const fetchSingleLeadFullDetails = async (leadNo, leadName, caseId, token) => {
  try {
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    // Use the 2-param route (leadNo + caseId only) so hierarchy works even when leadName is unknown
    const { data: leadData = [] } = await api.get(
      `/api/lead/lead/${leadNo}/${caseId}`,
      headers
    );
    if (!Array.isArray(leadData) || leadData.length === 0) return null;
    const lead = cleanLeadRecord(leadData[0]);
    // Resolve actual name from the fetched doc so sub-section queries match
    const actualLeadName = lead.description || leadName || "";
    const full = await fetchLeadAllSectionsLikeViewLR({
      leadNo: lead.leadNo,
      leadName: actualLeadName,
      caseId,
      token,
    });
    return full ? { ...lead, ...full } : lead;
  } catch (error) {
    console.error(`Error fetching details for leadNo: ${leadNo}`, error);
    return null;
  }
};

// Recursively fetch entire parent chain for a lead (child → ancestors)
const fetchLeadHierarchyFullDetails = async (leadNo, leadName, caseId, token, chain = []) => {
  const currentLead = await fetchSingleLeadFullDetails(leadNo, leadName, caseId, token);
  if (!currentLead) return [chain];
  const updatedChain = [...chain, currentLead];
  if (!currentLead.parentLeadNo || currentLead.parentLeadNo.length === 0) return [updatedChain];
  let allChains = [];
  for (const parentNo of toArray(currentLead.parentLeadNo)) {
    const subChains = await fetchLeadHierarchyFullDetails(parentNo, currentLead.description || "", caseId, token, updatedChain);
    allChains.push(...subChains);
  }
  return allChains;
};

// ===== SUB-COMPONENTS =====

// Collapsible section wrapper with accessible keyboard support
function CollapsibleSection({ title, defaultOpen = true, rightSlot = null, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={styles.collapsible}>
      <header
        className={styles['collapsible__header']}
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setOpen(o => !o) : null)}
      >
        <div className={styles['collapsible__title']}>
          <span className={styles.chev}>{open ? "▾" : "▸"}</span> {title}
        </div>
        {rightSlot ? <div onClick={(e) => e.stopPropagation()}>{rightSlot}</div> : null}
      </header>
      {open && <div className={styles['collapsible__body']}>{children}</div>}
    </section>
  );
}

// Searchable flag picker with chip display and single / multi-select support
function FlagPicker({
  flags = [],
  selected = [],
  onChange,
  multiple = true,
  placeholder = "Choose flag(s)",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const filtered = flags.filter(f => f.toLowerCase().includes(query.toLowerCase()));
  const isSelected = (f) => selected.includes(f);

  const toggle = (f) => {
    if (!multiple) { onChange([f]); setOpen(false); return; }
    const set = new Set(selected);
    set.has(f) ? set.delete(f) : set.add(f);
    onChange([...set]);
  };
  const selectAll = () => onChange(filtered.length ? Array.from(new Set([...selected, ...filtered])) : selected);
  const clearAll  = () => onChange([]);

  // Close on outside click or Escape key
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current  && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onEsc = (e) => (e.key === "Escape" ? setOpen(false) : null);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className={styles['fp-root']}>
      <button
        type="button"
        ref={btnRef}
        className={`${styles['fp-btn']} ${disabled ? styles['fp-btn--disabled'] : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        title={selected.length ? selected.join(", ") : placeholder}
      >
        <div className={styles['fp-btn-content']}>
          {selected.length === 0 && <span className={styles['fp-placeholder']}>{placeholder}</span>}
          {selected.length > 0 && (
            <div className={styles['fp-chips']}>
              {selected.slice(0, 3).map(f => (
                <span key={f} className={styles['fp-chip']} onClick={(e) => e.stopPropagation()}>{f}</span>
              ))}
              {selected.length > 3 && (
                <span className={`${styles['fp-chip']} ${styles['fp-chip--more']}`}>+{selected.length - 3}</span>
              )}
            </div>
          )}
          <span className={styles['fp-caret']} aria-hidden>▾</span>
        </div>
      </button>

      {open && (
        <div className={styles['fp-panel']} ref={panelRef} role="listbox" aria-multiselectable={multiple}>
          <div className={styles['fp-toprow']}>
            <input
              className={styles['fp-search']}
              placeholder="Search flags…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div className={styles['fp-actions']}>
              {multiple && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles['btn-secondary']} ${styles['fp-small']}`}
                  onClick={selectAll}
                  disabled={!filtered.length}
                >
                  Select all
                </button>
              )}
              <button
                type="button"
                className={`${styles.btn} ${styles['btn-secondary']} ${styles['fp-small']}`}
                onClick={clearAll}
                disabled={!selected.length}
              >
                Clear
              </button>
            </div>
          </div>

          <div className={styles['fp-list']} tabIndex={-1}>
            {filtered.length ? filtered.map(f => (
              <label key={f} className={styles['fp-item']}>
                {multiple
                  ? <input type="checkbox" checked={isSelected(f)} onChange={() => toggle(f)} />
                  : <input type="radio" name="flagpicker-radio" checked={isSelected(f)} onChange={() => toggle(f)} />
                }
                <span className={styles['fp-item-text']}>{f}</span>
              </label>
            )) : (
              <div className={styles['fp-empty']}>No flags found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====

export const GenerateReport = () => {
  const pdfRef = useRef();
  const saveTimeout = useRef(null);
  const { selectedCase } = useContext(CaseContext);

  // ------------------ State ------------------

  // Lead data
  const [leadsData, setLeadsData] = useState([]);
  const [hierarchyLeadsData, setHierarchyLeadsData] = useState([]);
  const [hierarchyChains, setHierarchyChains] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    api.get("/api/users/usernames")
      .then(({ data }) => setAllUsers(data.users || []))
      .catch(() => {});
  }, []);

  const displayUser = (uname) => {
    const u = allUsers.find((x) => x.username === uname);
    if (!u) return uname;
    const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    const title = u.title ? ` (${u.title})` : "";
    return full ? `${full}${title} (${u.username})` : u.username;
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [leadSortOrder, setLeadSortOrder] = useState("asc");
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [subCategoryDropdownOpen, setSubCategoryDropdownOpen] = useState(false);
  const subCategoryDropdownRef = useRef(null);

  // Report targeting
  const [reportType, setReportType] = useState(null); // 'all'|'single'|'selected'|'hierarchy'|'timeline'|'flagged'
  const [reportScope, setReportScope] = useState("all");
  const [selectedSingleLeadNo, setSelectedSingleLeadNo] = useState("");
  const [selectStartLead1, setSelectStartLead1] = useState("");
  const [selectEndLead2, setSelectEndLead2] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Timeline & flags
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [timelineOrderedLeads, setTimelineOrderedLeads] = useState([]);
  const [availableFlags, setAvailableFlags] = useState([]);
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [isMultiFlag, setIsMultiFlag] = useState(true);

  // Executive summary
  const [summaryMode, setSummaryMode] = useState('none'); // 'none'|'type'|'file'
  const [typedSummary, setTypedSummary] = useState("");
  const [useWebpageSummary, setUseWebpageSummary] = useState(true);
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [execSummaryFile, setExecSummaryFile] = useState(null);

  // Alert modal
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const showAlert = (msg) => { setAlertMessage(msg); setAlertOpen(true); };

  // Modals
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [personModalData, setPersonModalData] = useState({ leadNo: "", description: "", caseNo: "", caseName: "", leadReturnId: "" });
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleModalData, setVehicleModalData] = useState({ leadNo: "", description: "", caseNo: "", caseName: "", leadReturnId: "", leadsDeskCode: "" });

  // Hierarchy UI
  const [hierarchyLeadInput, setHierarchyLeadInput] = useState("");
  const [visibleChainsCount, setVisibleChainsCount] = useState(2);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const totalEntries = 100;

  // ------------------ Effects ------------------

  // Fetch all leads for the case with deep section hydration (ViewLR-style)
  useEffect(() => {
    const fetchAllLeads = async () => {
      const caseId = selectedCase?._id || selectedCase?.id;
      if (!caseId) return;
      const token = localStorage.getItem("token");
      try {
        const { data: leads = [] } = await api.get(
          `/api/lead/case/${caseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const leadsWithDetails = await Promise.all(
          leads.map(async (lead) => {
            const full = await fetchSingleLeadFullDetails(lead.leadNo, lead.description || "", caseId, token);
            return full ? full : cleanLeadRecord(lead);
          })
        );
        setLeadsData(leadsWithDetails);
        setHierarchyChains([]);
        setHierarchyLeadsData([]);
      } catch (err) {
        console.error("Error fetching leads:", err);
        setLeadsData([]);
      }
    };
    fetchAllLeads();
  }, [selectedCase]);

  // Fetch all timeline entries and derive initial timeline-ordered lead list
  useEffect(() => {
    const fetchTimeline = async () => {
      const caseId = selectedCase?._id || selectedCase?.id;
      if (!caseId) return;
      const token = localStorage.getItem("token");
      try {
        const { data } = await api.get(
          `/api/timeline/case/${caseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const sorted = [...data].sort((a, b) => {
          const aDT = new Date(`${a.eventStartDate}T${convert12To24(a.eventStartTime)}`);
          const bDT = new Date(`${b.eventStartDate}T${convert12To24(b.eventStartTime)}`);
          return aDT - bDT;
        });
        setTimelineEntries(sorted);
        setTimelineOrderedLeads(buildTimelineOrderedLeads(sorted, leadsData));
      } catch (err) {
        console.error("Failed to fetch timeline entries:", err);
        setTimelineEntries([]);
        setTimelineOrderedLeads([]);
      }
    };
    fetchTimeline();
  }, [selectedCase?._id, selectedCase?.id]);

  // Recompute timeline-ordered leads when leadsData updates after timeline is loaded
  useEffect(() => {
    if (!timelineEntries.length || !leadsData?.length) return;
    setTimelineOrderedLeads(buildTimelineOrderedLeads(timelineEntries, leadsData));
  }, [timelineEntries, leadsData]);

  // Derive unique flags from timeline entries
  useEffect(() => {
    const uniq = new Set();
    for (const t of timelineEntries) {
      (Array.isArray(t.timelineFlag) ? t.timelineFlag : []).forEach(f => {
        const val = String(f || "").trim();
        if (val) uniq.add(val);
      });
    }
    setAvailableFlags([...uniq].sort((a, b) => a.localeCompare(b)));
  }, [timelineEntries]);

  // Close subcategory dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (subCategoryDropdownRef.current && !subCategoryDropdownRef.current.contains(e.target)) {
        setSubCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Sync summaryMode into useWebpageSummary / useFileUpload flags
  useEffect(() => {
    if (summaryMode === 'type') { setUseWebpageSummary(true);  setUseFileUpload(false); }
    else if (summaryMode === 'file') { setUseWebpageSummary(false); setUseFileUpload(true);  }
    else { setUseWebpageSummary(false); setUseFileUpload(false); }
  }, [summaryMode]);

  // Reset summary mode when switching away from "All leads"
  useEffect(() => {
    if (reportType !== 'all') { setSummaryMode('none'); setUseWebpageSummary(false); setUseFileUpload(false); }
  }, [reportType]);

  // Auto-save executive summary 2s after the last keystroke
  useEffect(() => {
    if (!useWebpageSummary) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveExecutiveSummary(), 2000);
    return () => clearTimeout(saveTimeout.current);
  }, [typedSummary, useWebpageSummary, selectedCase?._id, selectedCase?.id]);

  // Load saved executive summary when case changes
  useEffect(() => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (!caseId) return;
    const token = localStorage.getItem("token");
    api
      .get(`/api/cases/executive-summary/${caseId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { setTypedSummary(data.executiveCaseSummary); setUseWebpageSummary(true); })
      .catch((err) => console.error("Failed to load exec summary", err));
  }, [selectedCase?._id, selectedCase?.id]);

  // ------------------ Utility Helpers ------------------

  // Sort leads by their earliest timeline entry date; leads with no timeline go last
  const sortByTimeline = (leads) => {
    const firstDate = {};
    for (const t of timelineEntries) {
      const key = String(t.leadNo ?? "");
      if (!key) continue;
      const dt = new Date(`${t.eventStartDate}T${convert12To24(t.eventStartTime)}`);
      if (!firstDate[key] || dt < firstDate[key]) firstDate[key] = dt;
    }
    return [...leads].sort((a, b) => {
      const aD = firstDate[String(a.leadNo)] ?? new Date(8640000000000000);
      const bD = firstDate[String(b.leadNo)] ?? new Date(8640000000000000);
      return aD - bD;
    });
  };

  // Compute which leads to include in the report based on current scope
  const computeLeadsForReport = () => {
    const all     = Array.isArray(leadsData) ? leadsData : [];
    const visible = Array.isArray(hierarchyLeadsData) && hierarchyLeadsData.length ? hierarchyLeadsData : all;

    if (reportScope === "all")     return sortByTimeline(all);
    if (reportScope === "visible") return sortByTimeline(visible);

    if (reportScope === "single") {
      const target = toNum(selectedSingleLeadNo);
      if (!Number.isFinite(target)) return [];
      return visible.filter(l => toNum(l.leadNo) === target);
    }

    if (reportScope === "selected") {
      const min = toNum(selectStartLead1);
      const max = toNum(selectEndLead2);
      if (Number.isFinite(min) && Number.isFinite(max) && min <= max) {
        return sortByTimeline(all.filter(l => {
          const n = toNum(l.leadNo);
          return Number.isFinite(n) && n >= min && n <= max;
        }));
      }
      if (visible.length && visible !== all) return sortByTimeline(visible);
      return [];
    }

    return [];
  };

  // Return leads that have at least one of the selected timeline flags
  const getLeadsForSelectedFlags = () => {
    if (!selectedFlags.length) return [];
    const allowedNos = new Set(
      (timelineEntries || [])
        .filter(t => Array.isArray(t.timelineFlag) && t.timelineFlag.some(f => selectedFlags.includes(f)))
        .map(t => String(t.leadNo))
    );
    const out = [];
    const seen = new Set();
    for (const lead of leadsData || []) {
      const key = String(lead.leadNo);
      if (!seen.has(key) && allowedNos.has(key)) { seen.add(key); out.push(lead); }
    }
    return out;
  };

  // Return leads that have been reopened (have a reopenedDate or status "Reopened")
  const getReopenedLeads = () =>
    (leadsData || []).filter(l => l.reopenedDate || l.leadStatus === "Reopened");

  // Look up the single lead object for "single lead" report mode
  const getSingleLeadForReport = () => {
    const target = toNum(selectedSingleLeadNo);
    if (!Number.isFinite(target)) return null;
    const source = hierarchyLeadsData?.length ? hierarchyLeadsData : leadsData;
    if (!Array.isArray(source) || !source.length) return null;
    return source.find(l => toNum(l.leadNo) === target) || null;
  };

  // ------------------ API Handlers ------------------

  // Persist the executive summary text to the backend
  const saveExecutiveSummary = async () => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (!caseId) return;
    const token = localStorage.getItem("token");
    try {
      await api.put(
        "/api/cases/executive-summary",
        { caseId, executiveCaseSummary: typedSummary },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to save executive summary", err);
    }
  };

  // Open a generated PDF blob in a new browser tab
  const openPdfBlob = (blobData) => {
    const url = URL.createObjectURL(new Blob([blobData], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Build payload and call the backend report endpoint
  // Supports text summary, file summary, or no summary
  const handleRunReportWithSummary = async (explicitLeads = null) => {
    const token = localStorage.getItem("token");
    const computed       = computeLeadsForReport();
    const leadsForReport = Array.isArray(explicitLeads) && explicitLeads.length ? explicitLeads : computed;

    if (!leadsForReport || leadsForReport.length === 0) {
      showAlert("No leads selected to include.");
      return;
    }

    setIsGeneratingReport(true);

    const isAllReport   = String(reportType).toLowerCase() === "all";
    const hasWebSummary = Boolean(useWebpageSummary && typedSummary?.trim());
    const hasFileSummary = Boolean(useFileUpload && execSummaryFile);
    const includeExec   = isAllReport && (hasWebSummary || hasFileSummary);

    try {
      // Path 1: all-leads report with typed executive summary
      if (includeExec && hasWebSummary) {
        const payload = {
          user: localStorage.getItem("loggedInUser"),
          reportTimestamp: new Date().toLocaleString(),
          leadsData: leadsForReport,
          caseSummary: typedSummary,
          selectedReports: { FullReport: true },
          summaryMode: "web",
        };
        const response = await api.post("/api/report/generateCase", payload, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          responseType: "blob",
        });
        openPdfBlob(response.data);
        setIsGeneratingReport(false);
        return;
      }

      // Path 2: all-leads report with attached executive summary file
      if (includeExec && hasFileSummary) {
        const formData = new FormData();
        formData.append("user",             localStorage.getItem("loggedInUser") || "Officer 916");
        formData.append("reportTimestamp",  new Date().toLocaleString());
        formData.append("caseNo",           selectedCase.caseNo);
        formData.append("caseName",         selectedCase.caseName);
        formData.append("leadsData",        JSON.stringify(leadsForReport));
        formData.append("selectedReports",  JSON.stringify({ FullReport: true }));
        formData.append("execSummaryFile",  execSummaryFile);
        formData.append("summaryMode",      "file");
        const response = await axios.post(
          "http://localhost:5000/api/report/generateCaseExecSummary",
          formData,
          { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
        );
        openPdfBlob(response.data);
        setIsGeneratingReport(false);
        return;
      }

      // Path 3: report without executive summary
      const payload = {
        user: localStorage.getItem("loggedInUser"),
        reportTimestamp: new Date().toLocaleString(),
        leadsData: leadsForReport,
        caseSummary: "",
        selectedReports: { FullReport: true },
        summaryMode: "none",
      };
      const response = await api.post("/api/report/generateCase", payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        responseType: "blob",
      });
      openPdfBlob(response.data);
      setIsGeneratingReport(false);
    } catch (error) {
      console.error("Failed to generate report", error);
      showAlert("Error generating PDF");
      setIsGeneratingReport(false);
    }
  };

  // Search leads by keyword
  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/api/lead/search", {
        params: { caseId: selectedCase?._id || selectedCase?.id, keyword: searchTerm },
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeadsData(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  // ------------------ UI Action Handlers ------------------

  // Show only the matching lead card for "single lead" mode
  const handleShowSingleLead = () => {
    const n = toNum(selectStartLead1);
    if (!Number.isFinite(n)) { showAlert("Please enter a valid lead number."); return; }
    setHierarchyLeadsData(leadsData.filter(l => String(toNum(l.leadNo)) === String(n)));
    setHierarchyChains([]);
    setSelectedSingleLeadNo(String(n));
  };

  // Build and display the hierarchy chain for a given lead number
  const handleShowHierarchy = async () => {
    if (!hierarchyLeadInput) return;
    const token = localStorage.getItem("token");
    try {
      const caseId = selectedCase?._id || selectedCase?.id;
      const chainResults = await fetchLeadHierarchyFullDetails(
        hierarchyLeadInput, "", caseId, token, []
      );
      setHierarchyChains(chainResults);
      const uniqueLeads = [];
      const seen = new Set();
      for (const leadObj of chainResults.flat()) {
        if (!seen.has(leadObj.leadNo)) { uniqueLeads.push(leadObj); seen.add(leadObj.leadNo); }
      }
      uniqueLeads.sort((a, b) => Number(b.leadNo) - Number(a.leadNo));
      setHierarchyLeadsData(uniqueLeads);
    } catch (err) {
      console.error("Error fetching hierarchy:", err);
      setHierarchyChains([]);
      setHierarchyLeadsData([]);
    }
  };

  // Reset hierarchy / filter back to full lead list
  const handleShowAllLeads = () => {
    setHierarchyLeadInput("");
    setHierarchyChains([]);
    setHierarchyLeadsData([]);
  };

  // Filter visible leads to the entered range
  const handleShowLeadsInRange = () => {
    const min = parseInt(selectStartLead1, 10);
    const max = parseInt(selectEndLead2, 10);
    if (isNaN(min) || isNaN(max)) { showAlert("Please enter valid numeric lead numbers."); return; }
    setHierarchyLeadsData(leadsData.filter(lead => {
      const n = parseInt(lead.leadNo, 10);
      return n >= min && n <= max;
    }));
    setHierarchyChains([]);
  };

  // Capture the attached executive summary file
  const handleExecSummaryFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setExecSummaryFile(e.target.files[0]);
  };

  // Clicking a lead card selects it when in single-lead mode
  const handleLeadCardClick = (e, lead) => {
    if (reportType !== "single") return;
    const tag = e.target?.tagName?.toLowerCase();
    if (["button", "a", "input", "textarea", "select", "label"].includes(tag)) return;
    setSelectedSingleLeadNo(String(lead.leadNo));
    setReportScope("single");
  };

  // ------------------ Modal Handlers ------------------

  const openPersonModal = (leadNo, description, caseNo, caseName, leadReturnId) => {
    setPersonModalData({ leadNo, description, caseNo, caseName, leadReturnId });
    setShowPersonModal(true);
  };

  const openVehicleModal = (leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode) => {
    setVehicleModalData({ leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode });
    setShowVehicleModal(true);
  };


  // ------------------ Sub-component: Hierarchy Chain Display ------------------

  const HierarchyChain = ({ chain, chainIndex }) => {
    const [expanded, setExpanded] = useState(false);
    const leadNumbers = chain.map((l) => l.leadNo);
    const displayedNumbers = expanded ? leadNumbers : leadNumbers.slice(0, 2);
    return (
      <div
        style={{ marginBottom: "10px", cursor: "pointer", width: "100%", display: "flex", justifyContent: "flex-start", alignItems: "center" }}
        onClick={() => setExpanded(!expanded)}
      >
        <strong>Chain #{chainIndex + 1}:</strong>&nbsp;{displayedNumbers.join(", ")}{" "}
        {leadNumbers.length > 2 && (expanded ? "▲ Expand" : "▼")}
      </div>
    );
  };

  // ------------------ Render: Shared return-item renderer ------------------

  // Renders a single lead-return row (body text + all sub-tables).
  // Used by both renderLeads and renderReopenedLeads to avoid duplication.
  const renderReturnItem = (returnItem, ri, lead) => (
    <React.Fragment key={returnItem._id || returnItem.leadReturnId || ri}>

                    {/* Return body text */}
                    <tr>
                      <td style={{ textAlign: "center", fontSize: "18px" }}>{`Lead Return ID: ${returnItem.leadReturnId}`}</td>
                      <td>
                        <textarea
                          className={styles['lead-return-input']}
                          value={returnItem.leadReturnResult || ""}
                          readOnly
                          style={{ fontSize: "18px", padding: "10px", borderRadius: "6px", width: "100%", resize: "none", height: "auto", fontFamily: "Arial", whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                          rows={Math.max(((returnItem.leadReturnResult || "").length / 50) | 0, 2)}
                        />
                      </td>
                    </tr>

                    {/* Persons table */}
                    {Array.isArray(returnItem.persons) && returnItem.persons.length > 0 && (
                      <tr>
                        <td colSpan={2}>
                          <div className={styles['person-section']}>
                            <h3 className={styles['title-ld']}>Person Details</h3>
                            <table className={styles['lead-table2']} style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead>
                                <tr><th>Date Entered</th><th>Name</th><th>Phone No</th><th>Address</th><th>Additional Details</th></tr>
                              </thead>
                              <tbody>
                                {returnItem.persons.map((person, pi) => (
                                  <tr key={person._id || pi}>
                                    <td>{formatDate(person.enteredDate)}</td>
                                    <td>{person.firstName ? `${person.firstName}, ${person.lastName}` : "N/A"}</td>
                                    <td>{fmt(person.cellNumber)}</td>
                                    <td style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                                      {person.address
                                        ? `${person.address.street1 || ""}, ${person.address.city || ""}, ${person.address.state || ""}, ${person.address.zipCode || ""}`
                                        : "N/A"}
                                    </td>
                                    <td>
                                      <button
                                        className={styles['download-btn']}
                                        onClick={() => openPersonModal(lead.leadNo, lead.description, selectedCase.caseNo, selectedCase.caseName, returnItem.leadReturnId)}
                                      >
                                        View
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                        <PersonModal
                          isOpen={showPersonModal}
                          onClose={() => setShowPersonModal(false)}
                          leadNo={personModalData.leadNo}
                          description={personModalData.description}
                          caseNo={personModalData.caseNo}
                          caseName={personModalData.caseName}
                          leadReturnId={personModalData.leadReturnId}
                        />
                      </tr>
                    )}

                    {/* Vehicles table */}
                    {Array.isArray(returnItem.vehicles) && returnItem.vehicles.length > 0 && (
                      <tr>
                        <td colSpan={2}>
                          <div className={styles['person-section']}>
                            <h3 className={styles['title-ld']}>Vehicles Details</h3>
                            <table className={styles['lead-table2']} style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead>
                                <tr><th>Date Entered</th><th>Make</th><th>Model</th><th>Color</th><th>Plate</th><th>State</th><th>Additional Details</th></tr>
                              </thead>
                              <tbody>
                                {returnItem.vehicles.map((vehicle, vi) => (
                                  <tr key={vehicle._id || vi}>
                                    <td>{formatDate(vehicle.enteredDate)}</td>
                                    <td>{fmt(vehicle.make)}</td>
                                    <td>{fmt(vehicle.model)}</td>
                                    <td>
                                      <div style={{ display: "flex", alignItems: "center" }}>
                                        <span style={{ width: 60, display: "inline-block" }}>{fmt(vehicle.primaryColor)}</span>
                                        <div style={{ width: 18, height: 18, backgroundColor: vehicle.primaryColor, marginLeft: 15, border: "1px solid #000" }} />
                                      </div>
                                    </td>
                                    <td>{fmt(vehicle.plate)}</td>
                                    <td>{fmt(vehicle.state)}</td>
                                    <td>
                                      <button
                                        className={styles['download-btn']}
                                        onClick={() => openVehicleModal(lead.leadNo, lead.description, selectedCase.caseNo, selectedCase.caseName, returnItem.leadReturnId, returnItem.leadsDeskCode)}
                                      >
                                        View
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                        <VehicleModal
                          isOpen={showVehicleModal}
                          onClose={() => setShowVehicleModal(false)}
                          leadNo={vehicleModalData.leadNo}
                          leadName={vehicleModalData.description}
                          caseNo={vehicleModalData.caseNo}
                          caseName={vehicleModalData.caseName}
                          leadReturnId={vehicleModalData.leadReturnId}
                          leadsDeskCode={vehicleModalData.leadsDeskCode}
                        />
                      </tr>
                    )}

                    {/* Enclosures table */}
                    {Array.isArray(returnItem.enclosures) && returnItem.enclosures.length > 0 && (
                      <tr>
                        <td colSpan={2}>
                          <div className={styles['person-section']}>
                            <h3 className={styles['title-ld']}>Enclosures</h3>
                            <table className={styles['lead-table2']} style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead>
                                <tr><th>Date</th><th>Title</th><th>Kind</th><th>File / Link</th><th>Notes</th><th>Access</th><th>Action</th></tr>
                              </thead>
                              <tbody>
                                {returnItem.enclosures.map((enc, ei) => {
                                  const isLink = !!enc?.linkUrl && !enc?.fileUrl;
                                  const href   = enc?.fileUrl || enc?.linkUrl;
                                  return (
                                    <tr key={enc?._id || ei}>
                                      <td>{formatDate(enc?.enteredDate || enc?.createdAt)}</td>
                                      <td style={{ wordBreak: "break-word" }}>{fmt(enc?.title)}</td>
                                      <td>{isLink ? "Link" : "File"}</td>
                                      <td style={{ wordBreak: "break-word" }}>
                                        {href
                                          ? <a onClick={(e) => { e.preventDefault(); openInNewTab(href); }} href={href}>{getFileName(href)}</a>
                                          : "N/A"}
                                      </td>
                                      <td style={{ whiteSpace: "pre-wrap" }}>{fmt(enc?.notes || enc?.description)}</td>
                                      <td>{fmt(enc?.accessLevel || enc?.access)}</td>
                                      <td>{href && <button className={styles['download-btn']} onClick={() => openInNewTab(href)}>Open</button>}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Evidence table */}
                    {Array.isArray(returnItem.evidence) && returnItem.evidence.length > 0 && (
                      <tr>
                        <td colSpan={2}>
                          <div className={styles['person-section']}>
                            <h3 className={styles['title-ld']}>Evidence</h3>
                            <table className={styles['lead-table2']} style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead>
                                <tr><th>Date</th><th>Type</th><th>Description</th><th>Tag / ID</th><th>Status</th><th>Access</th></tr>
                              </thead>
                              <tbody>
                                {returnItem.evidence.map((ev, evi) => (
                                  <tr key={ev?._id || evi}>
                                    <td>{formatDate(ev?.enteredDate || ev?.createdAt)}</td>
                                    <td>{fmt(ev?.evidenceType || ev?.type)}</td>
                                    <td style={{ whiteSpace: "pre-wrap" }}>{fmt(ev?.description)}</td>
                                    <td>{fmt(ev?.tag || ev?.evidenceId)}</td>
                                    <td>{fmt(ev?.status)}</td>
                                    <td>{fmt(ev?.accessLevel || ev?.access)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Audio table */}
                    {Array.isArray(returnItem.audio) && returnItem.audio.length > 0 && (
                      <tr>
                        <td colSpan={2}>
                          <div className={styles['person-section']}>
                            <h3 className={styles['title-ld']}>Audio</h3>
                            <table className={styles['lead-table2']} style={{ width: "100%" }}>
                              <thead>
                                <tr><th>Date</th><th>Title</th><th>Player</th><th>Access</th></tr>
                              </thead>
                              <tbody>
                                {returnItem.audio.map((au, ai) => {
                                  const src = au?.url || au?.fileUrl;
                                  return (
                                    <tr key={au?._id || ai}>
                                      <td>{formatDate(au?.enteredDate || au?.createdAt)}</td>
                                      <td style={{ wordBreak: "break-word" }}>{fmt(au?.title || getFileName(src || ""))}</td>
                                      <td>{src ? <audio controls src={src} style={{ width: "100%" }} /> : "N/A"}</td>
                                      <td>{fmt(au?.accessLevel || au?.access)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Videos table */}
                    {Array.isArray(returnItem.videos) && returnItem.videos.length > 0 && (
                      <tr>
                        <td colSpan={2}>
                          <div className={styles['person-section']}>
                            <h3 className={styles['title-ld']}>Videos</h3>
                            <table className={styles['lead-table2']} style={{ width: "100%" }}>
                              <thead>
                                <tr><th>Date</th><th>Title</th><th>Player</th><th>Access</th></tr>
                              </thead>
                              <tbody>
                                {returnItem.videos.map((vd, vi) => {
                                  const src = vd?.url || vd?.fileUrl;
                                  return (
                                    <tr key={vd?._id || vi}>
                                      <td>{formatDate(vd?.enteredDate || vd?.createdAt)}</td>
                                      <td style={{ wordBreak: "break-word" }}>{fmt(vd?.title || getFileName(src || ""))}</td>
                                      <td>
                                        {src ? (
                                          <video controls style={{ width: "100%", maxWidth: 420 }}>
                                            <source src={src} type="video/mp4" />
                                            Your browser does not support the video tag.
                                          </video>
                                        ) : "N/A"}
                                      </td>
                                      <td>{fmt(vd?.accessLevel || vd?.access)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Notes / Scratchpad table */}
                    {Array.isArray(returnItem.scratchpad) && returnItem.scratchpad.length > 0 && (
                      <tr>
                        <td colSpan={2}>
                          <div className={styles['person-section']}>
                            <h3 className={styles['title-ld']}>Notes</h3>
                            <table className={styles['lead-table2']} style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead>
                                <tr><th>Date</th><th>Author</th><th>Note</th></tr>
                              </thead>
                              <tbody>
                                {returnItem.scratchpad.map((n, ni) => (
                                  <tr key={n?._id || ni}>
                                    <td>{formatDate(n?.enteredDate || n?.createdAt)}</td>
                                    <td>{fmt(n?.author || n?.enteredBy)}</td>
                                    <td style={{ whiteSpace: "pre-wrap" }}>{fmt(n?.note || n?.text || n?.content)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Timeline table for this lead return */}
                    {Array.isArray(returnItem.timeline) && returnItem.timeline.length > 0 && (
                      <tr>
                        <td colSpan={2}>
                          <div className={styles['person-section']}>
                            <h3 className={styles['title-ld']}>Timeline</h3>
                            <table className={styles['lead-table2']} style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead>
                                <tr><th>Start</th><th>End</th><th>Title</th><th>Flags</th><th>Description</th></tr>
                              </thead>
                              <tbody>
                                {returnItem.timeline
                                  .slice()
                                  .sort((a, b) => {
                                    const aDT = new Date(`${a.eventStartDate}T${convert12To24(a.eventStartTime)}`);
                                    const bDT = new Date(`${b.eventStartDate}T${convert12To24(b.eventStartTime)}`);
                                    return aDT - bDT;
                                  })
                                  .map((t, ti) => (
                                    <tr key={t?._id || ti}>
                                      <td>{formatDate(t?.eventStartDate)}</td>
                                      <td>{formatDate(t?.eventEndDate)}</td>
                                      <td style={{ wordBreak: "break-word" }}>{fmt(t?.eventTitle || t?.title)}</td>
                                      <td>{Array.isArray(t?.timelineFlag) ? t.timelineFlag.join(", ") : fmt(t?.timelineFlag)}</td>
                                      <td style={{ whiteSpace: "pre-wrap" }}>{fmt(t?.eventDescription || t?.description)}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                  </React.Fragment>
  );

  // ------------------ Render: Lead Cards ------------------

  const renderLeads = (leadsArray) => (leadsArray || []).map((lead, leadIndex) => {
    const isDeleted     = isDeletedStatus(lead?.leadStatus);
    const deletedReason = lead?.deletedReason || lead?.deletedReasonText || lead?.deleteReason || lead?.reason || "";
    return (
      <div
        key={leadIndex}
        className={`${styles['lead-section']} ${isDeleted ? styles['is-deleted'] : ''}`}
        onClick={(e) => handleLeadCardClick(e, lead)}
      >
        <div className={styles['leads-container']}>
          <table className={styles['lead-details-table']}>
            <colgroup>
              <col style={{ width: "15%" }} /><col style={{ width: "7%" }} />
              <col style={{ width: "10%" }} /><col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} /><col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} /><col style={{ width: "10%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td className={styles['label-cell']}>Lead Number</td>
                <td className={styles['input-cell']}><input type="text" value={lead.leadNo} readOnly /></td>
                <td className={styles['label-cell']}>Lead Origin</td>
                <td className={styles['input-cell']}>
                  <input type="text" value={Array.isArray(lead.parentLeadNo) ? lead.parentLeadNo.join(", ") : (lead.parentLeadNo || "")} readOnly />
                </td>
                <td className={styles['label-cell']}>Assigned Date</td>
                <td className={styles['input-cell']}><input type="text" value={formatDate(lead.assignedDate)} readOnly /></td>
                <td className={styles['label-cell']}>Completed Date</td>
                <td className={styles['input-cell']}><input type="text" value={formatDate(lead.completedDate)} readOnly /></td>
              </tr>
              <tr>
                <td className={styles['label-cell']}>Assigned Officers</td>
                <td className={styles['input-cell']} colSpan={7}>
                  <input type="text" value={Array.isArray(lead.assignedTo) && lead.assignedTo.length ? lead.assignedTo.map((a) => displayUser(a.username)).join(", ") : ""} readOnly />
                </td>
              </tr>
            </tbody>
          </table>
          <table className={styles['leads-table']}>
            <tbody>
              <tr className={styles['table-first-row']}>
                <td style={{ textAlign: "center", fontSize: "18px" }} className={styles['input-cell']}>Lead Instruction</td>
                <td><input type="text" value={lead.description || ""} className={styles['instruction-input']} readOnly /></td>
              </tr>
              {isDeleted && (
                <tr className={styles['deleted-row']}>
                  <td style={{ textAlign: "center", fontSize: "18px" }} className={styles['label-cell']}>Deleted Reason</td>
                  <td><input type="text" value={deletedReason || "N/A"} readOnly className={styles['instruction-input']} /></td>
                </tr>
              )}
              {Array.isArray(lead.leadReturns) && lead.leadReturns.length > 0 ? (
                lead.leadReturns.map((returnItem, ri) => renderReturnItem(returnItem, ri, lead))
              ) : (
                <tr><td colSpan={2} style={{ textAlign: "center" }}>No Lead Returns Available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  });

  // ------------------ Render: Reopened Lead Cards ------------------
  // Shows pre-reopen returns vs post-reopen returns side by side with reopen metadata.

  const renderReopenedLeads = (leadsArray) => (leadsArray || []).map((lead, leadIndex) => {
    const isDeleted     = isDeletedStatus(lead?.leadStatus);
    const deletedReason = lead?.deletedReason || lead?.deletedReasonText || lead?.deleteReason || lead?.reason || "";

    const preReopenKeys = new Set(
      (lead.preReopenReturns || []).map(r => String(lrKeyFor(r) || "")).filter(Boolean)
    );
    const preReopenReturns  = lead.preReopenReturns || [];
    const postReopenReturns = (lead.leadReturns || []).filter(r => {
      const k = String(lrKeyFor(r) || "");
      return k && !preReopenKeys.has(k);
    });

    return (
      <div
        key={leadIndex}
        className={`${styles['lead-section']} ${isDeleted ? styles['is-deleted'] : ''}`}
        onClick={(e) => handleLeadCardClick(e, lead)}
      >
        <div className={styles['leads-container']}>
          {/* Lead header */}
          <table className={styles['lead-details-table']}>
            <colgroup>
              <col style={{ width: "15%" }} /><col style={{ width: "7%" }} />
              <col style={{ width: "10%" }} /><col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} /><col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} /><col style={{ width: "10%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td className={styles['label-cell']}>Lead Number</td>
                <td className={styles['input-cell']}><input type="text" value={lead.leadNo} readOnly /></td>
                <td className={styles['label-cell']}>Lead Origin</td>
                <td className={styles['input-cell']}>
                  <input type="text" value={Array.isArray(lead.parentLeadNo) ? lead.parentLeadNo.join(", ") : (lead.parentLeadNo || "")} readOnly />
                </td>
                <td className={styles['label-cell']}>Assigned Date</td>
                <td className={styles['input-cell']}><input type="text" value={formatDate(lead.assignedDate)} readOnly /></td>
                <td className={styles['label-cell']}>Completed Date</td>
                <td className={styles['input-cell']}><input type="text" value={formatDate(lead.completedDate)} readOnly /></td>
              </tr>
              <tr>
                <td className={styles['label-cell']}>Assigned Officers</td>
                <td className={styles['input-cell']} colSpan={7}>
                  <input type="text" value={Array.isArray(lead.assignedTo) && lead.assignedTo.length ? lead.assignedTo.map((a) => displayUser(a.username)).join(", ") : ""} readOnly />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Lead instruction */}
          <table className={styles['leads-table']}>
            <tbody>
              <tr className={styles['table-first-row']}>
                <td style={{ textAlign: "center", fontSize: "18px" }} className={styles['input-cell']}>Lead Instruction</td>
                <td><input type="text" value={lead.description || ""} className={styles['instruction-input']} readOnly /></td>
              </tr>
              {isDeleted && (
                <tr className={styles['deleted-row']}>
                  <td style={{ textAlign: "center", fontSize: "18px" }} className={styles['label-cell']}>Deleted Reason</td>
                  <td><input type="text" value={deletedReason || "N/A"} readOnly className={styles['instruction-input']} /></td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Reopen metadata banner */}
          <div style={{ margin: "10px 0", padding: "10px 14px", background: "#fff7ed", border: "1px solid #fb923c", borderRadius: 6, fontSize: 15, display: "flex", gap: 24, flexWrap: "wrap" }}>
            <span><strong>Status:</strong> {lead.leadStatus || "N/A"}</span>
            <span><strong>Reopened Date:</strong> {formatDate(lead.reopenedDate) || "N/A"}</span>
            {lead.reopenedBy && <span><strong>Reopened By:</strong> {lead.reopenedBy}</span>}
            {lead.reopenReason && <span><strong>Reopen Reason:</strong> {lead.reopenReason}</span>}
          </div>

          {/* Chain of Custody */}
          {(() => {
            const EVENT_LABELS = {
              "assigned":           "Lead Assigned",
              "accepted":           "Assignment Accepted",
              "declined":           "Assignment Declined",
              "reassigned-added":   "Officer Added",
              "reassigned-removed": "Officer Removed",
              "pi-submitted":       "Submitted for Review",
              "cm-approved":        "Approved",
              "cm-returned":        "Returned to Investigator",
              "cm-closed":          "Closed",
              "cm-reopened":        "Reopened",
              "cm-deleted":         "Deleted",
            };
            const ENTITY_LABELS = {
              LeadReturnResult: "Narrative",
              LeadReturn:       "Lead Return",
              LRPerson:         "Person",
              LRVehicle:        "Vehicle",
              LREnclosure:      "Enclosure",
              LREvidence:       "Evidence",
              LRPicture:        "Picture",
              LRAudio:          "Audio",
              LRVideo:          "Video",
              LRScratchpad:     "Note",
              LRTimeline:       "Timeline Entry",
            };

            // Build unified timeline from lead.events + auditLogs
            const statusEvents = (lead.events || []).map(e => ({
              kind:      "status",
              timestamp: e.at ? new Date(e.at) : null,
              action:    EVENT_LABELS[e.type] || e.type,
              by:        e.by || "—",
              to:        Array.isArray(e.to) && e.to.length ? e.to.join(", ") : null,
              detail:    e.reason || null,
              statusAfter: e.statusAfter || null,
            }));

            const entityEvents = (lead.auditLogs || []).map(a => ({
              kind:      "entity",
              timestamp: a.timestamp ? new Date(a.timestamp) : null,
              action:    `${a.action} ${ENTITY_LABELS[a.entityType] || a.entityType}`,
              by:        a.performedBy?.username || "—",
              to:        null,
              detail:    a.metadata?.reason || a.metadata?.notes || null,
              statusAfter: null,
            }));

            const allEvents = [...statusEvents, ...entityEvents]
              .filter(e => e.timestamp)
              .sort((a, b) => a.timestamp - b.timestamp);

            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16, padding: "6px 10px", background: "#f3e8ff", borderLeft: "4px solid #7c3aed", marginBottom: 4 }}>
                  Chain of Custody — Actions Performed ({allEvents.length})
                </div>
                {allEvents.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#ede9fe" }}>
                        <th style={{ padding: "6px 8px", border: "1px solid #c4b5fd", width: "13%" }}>Date &amp; Time</th>
                        <th style={{ padding: "6px 8px", border: "1px solid #c4b5fd", width: "22%" }}>Action</th>
                        <th style={{ padding: "6px 8px", border: "1px solid #c4b5fd", width: "14%" }}>Performed By</th>
                        <th style={{ padding: "6px 8px", border: "1px solid #c4b5fd", width: "16%" }}>Assigned To</th>
                        <th style={{ padding: "6px 8px", border: "1px solid #c4b5fd", width: "14%" }}>Status After</th>
                        <th style={{ padding: "6px 8px", border: "1px solid #c4b5fd" }}>Notes / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allEvents.map((e, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9f5ff" }}>
                          <td style={{ padding: "5px 8px", border: "1px solid #ddd", whiteSpace: "nowrap" }}>
                            {e.timestamp.toLocaleDateString()} {e.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td style={{ padding: "5px 8px", border: "1px solid #ddd", fontWeight: e.kind === "status" ? 600 : 400 }}>
                            {e.action}
                          </td>
                          <td style={{ padding: "5px 8px", border: "1px solid #ddd" }}>{e.by}</td>
                          <td style={{ padding: "5px 8px", border: "1px solid #ddd", color: "#555" }}>{e.to || "—"}</td>
                          <td style={{ padding: "5px 8px", border: "1px solid #ddd", color: "#555" }}>{e.statusAfter || "—"}</td>
                          <td style={{ padding: "5px 8px", border: "1px solid #ddd", color: "#555", whiteSpace: "pre-wrap" }}>{e.detail || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: "8px 12px", color: "#888", fontSize: 14 }}>No actions recorded for this lead.</div>
                )}
              </div>
            );
          })()}

          {/* Pre-reopen returns */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16, padding: "6px 10px", background: "#e0f2fe", borderLeft: "4px solid #0284c7", marginBottom: 4 }}>
              Pre-Reopen Returns ({preReopenReturns.length})
              <span style={{ fontWeight: 400, fontSize: 13, marginLeft: 10, color: "#555" }}>— returns that existed before the lead was reopened</span>
            </div>
            <table className={styles['leads-table']}>
              <tbody>
                {preReopenReturns.length > 0 ? (
                  preReopenReturns.map((returnItem, ri) => renderReturnItem(returnItem, ri, lead))
                ) : (
                  <tr><td colSpan={2} style={{ textAlign: "center", color: "#888" }}>No returns before reopen</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Post-reopen returns */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, padding: "6px 10px", background: "#dcfce7", borderLeft: "4px solid #16a34a", marginBottom: 4 }}>
              Post-Reopen Returns ({postReopenReturns.length})
              <span style={{ fontWeight: 400, fontSize: 13, marginLeft: 10, color: "#555" }}>— new returns added after the lead was reopened</span>
            </div>
            <table className={styles['leads-table']}>
              <tbody>
                {postReopenReturns.length > 0 ? (
                  postReopenReturns.map((returnItem, ri) => renderReturnItem(returnItem, ri, lead))
                ) : (
                  <tr><td colSpan={2} style={{ textAlign: "center", color: "#888" }}>No new returns after reopen</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  });

  // ------------------ JSX ------------------

  return (
    <>
    <div ref={pdfRef} className={styles['lead-desk-page']}>
      <Navbar />

      <div className={styles['main-content-ld-ExecSummary']}>
        <div className={styles['right-sec']}>

          {/* Breadcrumb */}
          <div className={styles['ld-head']}>
            <Link to="/HomePage" className={styles.crumb}>PIMS Home</Link>
            <span className={styles.sep}>{" >> "}</span>
            <Link
              to={selectedCase?.role === "Investigator" ? "/Investigator" : "/CasePageManager"}
              state={{ caseDetails: selectedCase }}
              className={styles.crumb}
            >
              Case Page: {selectedCase.caseNo || ""}: {selectedCase.caseName || "Unknown Case"}
            </Link>
            <span className={styles.sep}>{" >> "}</span>
            <span className={styles['crumb-current']} aria-current="page">Generate Report</span>
          </div>

          <div className={styles['down-content']}>

            {/* Executive Summary side panel — only when "All leads" + "type" mode */}
            {reportType === 'all' && summaryMode === 'type' && (
              <div className={styles['exec-summary-sec']}>
                <h3 style={{ marginTop: 0 }}>Executive Summary</h3>
                <textarea
                  className={styles['summary-input']}
                  placeholder="Type your executive summary here… (auto-saved)"
                  value={typedSummary}
                  onChange={e => setTypedSummary(e.target.value)}
                />
              </div>
            )}

            <div className={styles['left-content-execSummary']}>
              <div className={styles['bottom-sec-ldExecSummary']} id="main-content">

                {/* ===== Generate Report Controls ===== */}
                <CollapsibleSection title="Generate Report" defaultOpen={true}>

                  {/* Report type selector */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                      { value: 'all',       label: 'All leads' },
                      { value: 'single',    label: 'Single lead' },
                      { value: 'selected',  label: 'Selected leads' },
                      { value: 'hierarchy', label: 'Lead hierarchy' },
                      { value: 'timeline',  label: 'Timeline leads' },
                      { value: 'flagged',   label: 'Flagged leads' },
                      { value: 'reopened',  label: 'Reopened leads' },
                    ].map(({ value, label }) => (
                      <label key={value} className={styles.summaryOption1}>
                        <input
                          type="checkbox"
                          checked={reportType === value}
                          onChange={() => setReportType(reportType === value ? null : value)}
                        />
                        <span className={styles.summaryOptionText1}>{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* All leads */}
                  {reportType === 'all' && (
                    <>
                      <div className={styles.summaryModeRow1}>
                        <label className={styles.summaryOption2}>
                          <input type="radio" name="summary-mode" value="type" checked={summaryMode === 'type'} onChange={() => setSummaryMode('type')} />
                          <span className={styles.summaryOptionText2}>Type summary manually</span>
                        </label>
                        <label className={styles.summaryOption2}>
                          <input type="radio" name="summary-mode" value="file" checked={summaryMode === 'file'} onChange={() => setSummaryMode('file')} />
                          <span className={styles.summaryOptionText2}>Attach executive report</span>
                        </label>
                      </div>

                      {summaryMode === 'file' && (
                        <div style={{ marginBottom: 16 }}>
                          <input type="file" accept=".doc,.docx,.pdf" onChange={handleExecSummaryFileChange} />
                        </div>
                      )}

                      <div style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles['btn-primary']}`}
                          disabled={isGeneratingReport}
                          onClick={() => { setReportScope('all'); handleRunReportWithSummary(); }}
                        >
                          Run report
                        </button>
                        {isGeneratingReport && <span style={{ fontSize: 14, color: '#555', fontStyle: 'italic' }}>Generating report...</span>}
                      </div>
                    </>
                  )}

                  {/* Single lead */}
                  {reportType === 'single' && (
                    <>
                      <div className={styles['range-filter']}>
                        <div className={styles['range-filter__label']}>Select Lead</div>
                        <div className={styles['range-filter__row']}>
                          <input
                            id="single-lead"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={styles['range-filter__input']}
                            placeholder="Lead #"
                            value={selectStartLead1}
                            onChange={(e) => setSelectStartLead1(e.target.value)}
                            aria-label="Lead number"
                          />
                          <div className={styles['range-filter__actions']}>
                            <button className={`${styles.btn} ${styles['btn-primary']}`} onClick={handleShowSingleLead}>Apply</button>
                            <button
                              className={`${styles.btn} ${styles['btn-secondary']}`}
                              onClick={() => { setSelectStartLead1(""); setHierarchyLeadsData([]); setHierarchyChains([]); setSelectedSingleLeadNo(""); }}
                            >
                              Clear
                            </button>
                          </div>
                          <span className={styles['range-filter__hint']}>
                            Type a lead number (e.g., 1234) and click Apply, or click a card below to select it.
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles['btn-primary']}`}
                          onClick={() => {
                            const lead = getSingleLeadForReport();
                            if (!lead) { showAlert("Selected lead not found."); return; }
                            handleRunReportWithSummary([lead]);
                          }}
                          disabled={!selectedSingleLeadNo || isGeneratingReport}
                        >
                          Run report
                        </button>
                        {isGeneratingReport && <span style={{ fontSize: 14, color: '#555', fontStyle: 'italic', marginLeft: 12 }}>Generating report...</span>}
                      </div>
                    </>
                  )}

                  {/* Flagged leads */}
                  {reportType === 'flagged' && (
                    <>
                      <div style={{ marginTop: 10, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>Choose flag(s)</span>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 18, color: '#1e293b' }}>
                          <input
                            type="checkbox"
                            style={{ transform: 'scale(1.3)', accentColor: '#2563eb', cursor: 'pointer' }}
                            checked={isMultiFlag}
                            onChange={(e) => {
                              const next = e.target.checked;
                              setIsMultiFlag(next);
                              if (!next && selectedFlags.length > 1) setSelectedFlags([selectedFlags[selectedFlags.length - 1]]);
                            }}
                          />
                          Allow multiple
                        </label>
                      </div>

                      <div className={styles['fp-row']}>
                        <FlagPicker
                          flags={availableFlags}
                          selected={selectedFlags}
                          onChange={setSelectedFlags}
                          multiple={isMultiFlag}
                          placeholder={availableFlags.length ? "Select timeline flags" : "No flags available"}
                          disabled={!availableFlags.length}
                        />
                        <button
                          type="button"
                          className={`${styles.btn} ${styles['btn-secondary']}`}
                          onClick={() => setSelectedFlags([])}
                          disabled={!selectedFlags.length}
                        >
                          Clear
                        </button>
                        <span className={styles['hierarchy-filter__hint']}>
                          Pick one or more flags. The report will include leads with at least one of the selected flags on a timeline entry.
                        </span>
                      </div>

                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles['btn-primary']}`}
                          onClick={() => {
                            const flaggedLeads = getLeadsForSelectedFlags();
                            if (!flaggedLeads.length) { showAlert("No leads found with the selected flag(s)."); return; }
                            handleRunReportWithSummary(flaggedLeads);
                          }}
                          disabled={!selectedFlags.length || isGeneratingReport}
                        >
                          Run report
                        </button>
                        {isGeneratingReport && <span style={{ fontSize: 14, color: '#555', fontStyle: 'italic' }}>Generating report...</span>}
                      </div>
                    </>
                  )}

                  {/* Timeline leads */}
                  {reportType === 'timeline' && (
                    <>
                      <p className={styles['hierarchy-filter__hint']} style={{ marginTop: 8 }}>
                        Generate report in hierarchical order of <strong>timeline</strong> (oldest to newest).
                      </p>

                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles['btn-primary']}`}
                            disabled={isGeneratingReport || !selectedCase?.caseNo}
                            onClick={async () => {
                              if (!selectedCase?.caseNo) return;
                              setIsGeneratingReport(true);
                              try {
                                const token = localStorage.getItem("token");
                                const response = await api.post(
                                  "/api/report/generateTimeline",
                                  { caseNo: selectedCase.caseNo, caseName: selectedCase.caseName, user: localStorage.getItem("loggedInUser") || "Unknown" },
                                  { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, responseType: "blob" }
                                );
                                openPdfBlob(response.data);
                              } catch (err) {
                                console.error("Timeline report error:", err);
                                showAlert("Failed to generate timeline report.");
                              } finally {
                                setIsGeneratingReport(false);
                              }
                            }}
                          >
                            Run timeline-only report
                          </button>

                          <button
                            type="button"
                            className={`${styles.btn} ${styles['btn-primary']}`}
                            disabled={!timelineOrderedLeads.length || isGeneratingReport}
                            onClick={() => { setReportScope('visible'); handleRunReportWithSummary(timelineOrderedLeads); }}
                          >
                            Run full report (ascending timeline order)
                          </button>

                        {isGeneratingReport && <span style={{ fontSize: 14, color: '#555', fontStyle: 'italic' }}>Generating report...</span>}
                        {!timelineOrderedLeads.length && (
                          <div style={{ fontSize: 13, opacity: 0.8 }}>No timeline-linked leads found yet for this case.</div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Lead hierarchy */}
                  {reportType === 'hierarchy' && (
                    <>
                      <div className={styles['hierarchy-filter']}>
                        <div className={styles['hierarchy-filter__label']}>Lead chain lookup</div>
                        <form
                          className={styles['hierarchy-filter__row']}
                          onSubmit={(e) => { e.preventDefault(); handleShowHierarchy(); }}
                        >
                          <input
                            id="hierarchy-lead"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={styles['hierarchy-filter__input']}
                            placeholder="Lead # (e.g., 1234)"
                            value={hierarchyLeadInput}
                            onChange={(e) => setHierarchyLeadInput(e.target.value)}
                            aria-label="Lead number"
                          />
                          <div className={styles['hierarchy-filter__actions']}>
                            <button type="submit" className={`${styles.btn} ${styles['btn-primary']}`}>Show Hierarchy</button>
                            <button type="button" className={`${styles.btn} ${styles['btn-secondary']}`} onClick={handleShowAllLeads}>Clear</button>
                            <span className={styles['hierarchy-filter__hint']}>
                              Enter a lead number to view its parent/child chain of custody.
                            </span>
                          </div>
                        </form>
                      </div>

                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles['btn-primary']}`}
                          disabled={isGeneratingReport}
                          onClick={() => { setReportScope('visible'); handleRunReportWithSummary(hierarchyLeadsData); }}
                        >
                          Run report
                        </button>
                        {isGeneratingReport && <span style={{ fontSize: 14, color: '#555', fontStyle: 'italic' }}>Generating report...</span>}
                      </div>
                    </>
                  )}

                  {/* Selected leads (range) */}
                  {reportType === 'selected' && (
                    <>
                      <div className={styles['range-filter']}>
                        <div className={styles['range-filter__label']}>Lead range</div>
                        <div className={styles['range-filter__row']}>
                          <input
                            id="lead-range-from"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={styles['range-filter__input']}
                            placeholder="From lead #"
                            value={selectStartLead1}
                            onChange={(e) => setSelectStartLead1(e.target.value)}
                            aria-label="From lead number"
                          />
                          <span className={styles['range-filter__sep']}>—</span>
                          <input
                            id="lead-range-to"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={styles['range-filter__input']}
                            placeholder="To lead #"
                            value={selectEndLead2}
                            onChange={(e) => setSelectEndLead2(e.target.value)}
                            aria-label="To lead number"
                          />
                          <div className={styles['range-filter__actions']}>
                            <button className={`${styles.btn} ${styles['btn-primary']}`} onClick={handleShowLeadsInRange}>Apply</button>
                            <button className={`${styles.btn} ${styles['btn-secondary']}`} onClick={handleShowAllLeads}>Clear</button>
                          </div>
                          <span className={styles['range-filter__hint']}>
                            Enter a lead number range (e.g., 1200 — 1250) and click Apply.
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles['btn-primary']}`}
                          disabled={isGeneratingReport}
                          onClick={() => { setReportScope('visible'); handleRunReportWithSummary(hierarchyLeadsData); }}
                        >
                          Run report
                        </button>
                        {isGeneratingReport && <span style={{ fontSize: 14, color: '#555', fontStyle: 'italic' }}>Generating report...</span>}
                      </div>
                    </>
                  )}

                  {/* Reopened leads */}
                  {reportType === 'reopened' && (() => {
                    const reopenedLeads = getReopenedLeads();
                    return (
                      <>
                        <p className={styles['hierarchy-filter__hint']} style={{ marginTop: 8 }}>
                          Generate a report that includes <strong>only reopened leads</strong>. Each lead shows returns that existed
                          before the reopen and any new returns added after the reopen.
                          {reopenedLeads.length > 0
                            ? <> <strong>{reopenedLeads.length}</strong> reopened lead{reopenedLeads.length !== 1 ? 's' : ''} found.</>
                            : <> No reopened leads found for this case.</>}
                        </p>
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles['btn-primary']}`}
                            disabled={isGeneratingReport || !reopenedLeads.length}
                            onClick={() => {
                              if (!reopenedLeads.length) { showAlert("No reopened leads found."); return; }
                              handleRunReportWithSummary(reopenedLeads);
                            }}
                          >
                            Run reopened leads report
                          </button>
                          {isGeneratingReport && <span style={{ fontSize: 14, color: '#555', fontStyle: 'italic' }}>Generating report...</span>}
                        </div>
                      </>
                    );
                  })()}

                </CollapsibleSection>

                {/* ===== Search bar ===== */}
                <div className={styles['search-lead-portion']}>
                  <div className={styles['search-lead-head']}>
                    <label className={styles['input-label1']}>Search Lead</label>
                  </div>
                  <div className={styles.search_and_hierarchy_container}>
                    <div className={styles['search-bar']}>
                      <div className={styles['search-container1']}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input
                          type="text"
                          className={styles['search-input1']}
                          placeholder="Search Lead"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== Pagination ===== */}
                <div className={styles['p-6']}>
                  <Pagination
                    currentPage={currentPage}
                    totalEntries={totalEntries}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                  />
                </div>

                {/* ===== Sort / Filter toolbar ===== */}
                {(() => {
                  const allSubCategories = [...new Set(leadsData.flatMap((l) => l.subCategory || []))].sort();
                  const baseLeads = reportType === 'reopened'
                    ? getReopenedLeads()
                    : (hierarchyLeadsData.length > 0 ? hierarchyLeadsData : leadsData);
                  const activeLeads = baseLeads;
                  const displayLeads = [...activeLeads]
                    .filter((lead) => {
                      if (selectedSubCategories.length === 0) return true;
                      const cats = lead.subCategory || [];
                      return selectedSubCategories.every((sc) => cats.includes(sc));
                    })
                    .sort((a, b) =>
                      leadSortOrder === "asc"
                        ? Number(a.leadNo) - Number(b.leadNo)
                        : Number(b.leadNo) - Number(a.leadNo)
                    );

                  return (
                    <>
                      <div className={styles["sort-bar"]}>
                        <span className={styles["sort-bar__label"]}>Sort by creation:</span>
                        <button
                          className={styles["sort-bar__btn"]}
                          onClick={() => setLeadSortOrder(leadSortOrder === "asc" ? "desc" : "asc")}
                        >
                          {leadSortOrder === "asc" ? "Oldest First ↑" : "Newest First ↓"}
                        </button>
                        <span className={styles["sort-bar__label"]}>Filter by subcategory:</span>
                        <div className={styles["subcat-dropdown"]} ref={subCategoryDropdownRef}>
                          <button
                            className={styles["subcat-dropdown__toggle"]}
                            onClick={() => setSubCategoryDropdownOpen((o) => !o)}
                          >
                            {selectedSubCategories.length === 0
                              ? "All subcategories"
                              : selectedSubCategories.join(", ")}
                            {" ▾"}
                          </button>
                          {subCategoryDropdownOpen && (
                            <div className={styles["subcat-dropdown__menu"]}>
                              {allSubCategories.length === 0 ? (
                                <div className={styles["subcat-dropdown__empty"]}>No subcategories</div>
                              ) : (
                                <>
                                  <label className={styles["subcat-dropdown__item"]}>
                                    <input
                                      type="checkbox"
                                      checked={selectedSubCategories.length === 0}
                                      onChange={() => setSelectedSubCategories([])}
                                    />
                                    All
                                  </label>
                                  {allSubCategories.map((sc) => (
                                    <label key={sc} className={styles["subcat-dropdown__item"]}>
                                      <input
                                        type="checkbox"
                                        checked={selectedSubCategories.includes(sc)}
                                        onChange={() =>
                                          setSelectedSubCategories((prev) =>
                                            prev.includes(sc)
                                              ? prev.filter((x) => x !== sc)
                                              : [...prev, sc]
                                          )
                                        }
                                      />
                                      {sc}
                                    </label>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {selectedSubCategories.length > 0 && (
                          <button
                            className={styles["subcat-clear-btn"]}
                            onClick={() => setSelectedSubCategories([])}
                          >
                            Clear filter
                          </button>
                        )}
                      </div>

                      {/* ===== Lead cards ===== */}
                      {hierarchyLeadsData.length > 0 ? (
                        <>
                          <div style={{ width: "100%", alignSelf: "flex-start", textAlign: "left" }}>
                            <h3 style={{ textAlign: "left" }}>Hierarchy for Lead {hierarchyLeadInput}:</h3>
                            {hierarchyChains.slice(0, visibleChainsCount).map((chain, idx) => (
                              <HierarchyChain key={idx} chain={chain} chainIndex={idx} />
                            ))}
                            <div style={{ marginTop: "10px", textAlign: "left" }}>
                              {visibleChainsCount < hierarchyChains.length && (
                                <button
                                  className={styles['show-more-chains-btn']}
                                  onClick={() => setVisibleChainsCount(prev => prev + 5)}
                                  style={{ marginLeft: "-20px", color: "grey", background: "none", border: "none", cursor: "pointer" }}
                                >
                                  Load More Chains
                                </button>
                              )}
                              {visibleChainsCount > 2 && (
                                <button
                                  className={styles['show-more-chains-btn']}
                                  onClick={() => setVisibleChainsCount(2)}
                                  style={{ marginLeft: "-20px", color: "grey", background: "none", border: "none", cursor: "pointer" }}
                                >
                                  Load Less Chains
                                </button>
                              )}
                            </div>
                          </div>
                          {reportType === 'reopened' ? renderReopenedLeads(displayLeads) : renderLeads(displayLeads)}
                        </>
                      ) : (
                        reportType === 'reopened' ? renderReopenedLeads(displayLeads) : renderLeads(displayLeads)
                      )}
                    </>
                  );
                })()}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AlertModal
      isOpen={alertOpen}
      title="Alert"
      message={alertMessage}
      onConfirm={() => setAlertOpen(false)}
      onClose={() => setAlertOpen(false)}
    />
    </>
  );
};

