import { useState, useEffect, useRef } from "react";
import axios from "axios";
import api from "../../api";
import { convert12To24, toNum, toArray, buildTimelineOrderedLeads } from "./generateReportUtils";
import { fetchSingleLeadFullDetails, fetchLeadHierarchyFullDetails, cleanLeadRecord } from "./generateReportApi";

// How often to poll for report status (ms)
const POLL_INTERVAL_MS = 4000;

export function useGenerateReport(selectedCase) {
  const saveTimeout              = useRef(null);
  const progressIntervalRef      = useRef(null);
  const leadsProgressIntervalRef = useRef(null);
  const abortControllerRef       = useRef(null);
  const pollIntervalRef          = useRef(null);

  // Lead data
  const [leadsData,          setLeadsData]          = useState([]);
  const [hierarchyLeadsData, setHierarchyLeadsData] = useState([]);
  const [hierarchyChains,    setHierarchyChains]    = useState([]);
  const [allUsers,           setAllUsers]           = useState([]);
  const [leadsLoading,         setLeadsLoading]         = useState(false);
  const [leadsLoadingProgress, setLeadsLoadingProgress] = useState(0);

  // Search / sort / filter
  const [searchTerm,              setSearchTerm]              = useState("");
  const [leadSortOrder,           setLeadSortOrder]           = useState("asc");
  const [selectedSubCategories,   setSelectedSubCategories]   = useState([]);
  const [subCategoryDropdownOpen, setSubCategoryDropdownOpen] = useState(false);
  const subCategoryDropdownRef = useRef(null);

  // Report targeting
  const [reportType,           setReportType]           = useState(null);
  const [reportScope,          setReportScope]          = useState("all");
  const [selectedSingleLeadNo, setSelectedSingleLeadNo] = useState("");
  const [selectStartLead1,     setSelectStartLead1]     = useState("");
  const [selectEndLead2,       setSelectEndLead2]       = useState("");
  const [isGeneratingReport,   setIsGeneratingReport]   = useState(false);
  const [reportProgress,       setReportProgress]       = useState(0);

  // Timeline & flags
  const [timelineEntries,     setTimelineEntries]     = useState([]);
  const [timelineOrderedLeads,setTimelineOrderedLeads]= useState([]);
  const [availableFlags,      setAvailableFlags]      = useState([]);
  const [selectedFlags,       setSelectedFlags]       = useState([]);
  const [isMultiFlag,         setIsMultiFlag]         = useState(true);

  // Executive summary
  const [summaryMode,       setSummaryMode]       = useState("none");
  const [typedSummary,      setTypedSummary]      = useState("");
  const [useWebpageSummary, setUseWebpageSummary] = useState(true);
  const [useFileUpload,     setUseFileUpload]     = useState(false);
  const [execSummaryFile,   setExecSummaryFile]   = useState(null);

  // Alert modal
  const [alertOpen,    setAlertOpen]    = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const showAlert = (msg) => { setAlertMessage(msg); setAlertOpen(true); };

  // Hierarchy UI
  const [hierarchyLeadInput,  setHierarchyLeadInput]  = useState("");
  const [visibleChainsCount,  setVisibleChainsCount]  = useState(2);
  const [hierarchyOrder,      setHierarchyOrder]      = useState("asc"); // "asc" | "desc"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(50);
  const totalEntries = 100;

  // ===== Progress helpers =====

  const startProgress = () => {
    setReportProgress(0);
    clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setReportProgress((prev) => {
        if (prev >= 88) { clearInterval(progressIntervalRef.current); return prev; }
        return Math.min(88, prev + Math.random() * 7 + 2);
      });
    }, 350);
  };

  const completeProgress = () => {
    clearInterval(progressIntervalRef.current);
    setReportProgress(100);
    setTimeout(() => {
      setIsGeneratingReport(false);
      setReportProgress(0);
    }, 700);
  };

  const cancelReport = () => {
    abortControllerRef.current?.abort();
    clearInterval(progressIntervalRef.current);
    stopPolling();
    setIsGeneratingReport(false);
    setReportProgress(0);
  };

  // ===== Effects =====

  useEffect(() => {
    api.get("/api/users/usernames")
      .then(({ data }) => setAllUsers(data.users || []))
      .catch(() => {});
  }, []);

  // Simulate leads-loading progress bar
  useEffect(() => {
    if (leadsLoading) {
      setLeadsLoadingProgress(0);
      leadsProgressIntervalRef.current = setInterval(() => {
        setLeadsLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(leadsProgressIntervalRef.current);
            return prev;
          }
          return prev + (90 - prev) * 0.07;
        });
      }, 200);
    } else {
      clearInterval(leadsProgressIntervalRef.current);
      setLeadsLoadingProgress(100);
      const reset = setTimeout(() => setLeadsLoadingProgress(0), 400);
      return () => clearTimeout(reset);
    }
    return () => clearInterval(leadsProgressIntervalRef.current);
  }, [leadsLoading]);

  // Fetch all leads with deep section hydration
  useEffect(() => {
    const fetchAllLeads = async () => {
      const caseId = selectedCase?._id || selectedCase?.id;
      if (!caseId) return;
      const token = localStorage.getItem("token");
      setLeadsLoading(true);
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
      } finally {
        setLeadsLoading(false);
      }
    };
    fetchAllLeads();
  }, [selectedCase]);

  // Fetch all timeline entries
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
  }, [selectedCase?._id, selectedCase?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recompute timeline-ordered leads after leadsData loads
  useEffect(() => {
    if (!timelineEntries.length || !leadsData?.length) return;
    setTimelineOrderedLeads(buildTimelineOrderedLeads(timelineEntries, leadsData));
  }, [timelineEntries, leadsData]);

  // Derive unique flags from timeline entries
  useEffect(() => {
    const uniq = new Set();
    for (const t of timelineEntries) {
      (Array.isArray(t.timelineFlag) ? t.timelineFlag : []).forEach((f) => {
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

  // Sync summaryMode → flag states
  useEffect(() => {
    if (summaryMode === "type")      { setUseWebpageSummary(true);  setUseFileUpload(false); }
    else if (summaryMode === "file") { setUseWebpageSummary(false); setUseFileUpload(true);  }
    else                             { setUseWebpageSummary(false); setUseFileUpload(false); }
  }, [summaryMode]);

  // Reset summary mode when leaving "All leads"
  useEffect(() => {
    if (reportType !== "all") { setSummaryMode("none"); setUseWebpageSummary(false); setUseFileUpload(false); }
  }, [reportType]);

  // Auto-save executive summary 2 s after last keystroke
  useEffect(() => {
    if (!useWebpageSummary) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
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
    }, 2000);
    return () => clearTimeout(saveTimeout.current);
  }, [typedSummary, useWebpageSummary, selectedCase?._id, selectedCase?.id]);

  // Load saved executive summary on case change
  useEffect(() => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (!caseId) return;
    const token = localStorage.getItem("token");
    api
      .get(`/api/cases/executive-summary/${caseId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { setTypedSummary(data.executiveCaseSummary); setUseWebpageSummary(true); })
      .catch((err) => console.error("Failed to load exec summary", err));
  }, [selectedCase?._id, selectedCase?.id]);

  // ===== Derived helpers =====

  const displayUser = (uname) => {
    const u = allUsers.find((x) => x.username === uname);
    if (!u) return uname;
    const last  = (u.lastName  || "").trim();
    const first = (u.firstName || "").trim();
    const name  = last && first ? `${last}, ${first}` : last || first || "";
    return name ? `${name} (${u.username})` : u.username;
  };

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

  const computeLeadsForReport = () => {
    const all     = Array.isArray(leadsData) ? leadsData : [];
    const visible = Array.isArray(hierarchyLeadsData) && hierarchyLeadsData.length ? hierarchyLeadsData : all;

    if (reportScope === "all")     return sortByTimeline(all);
    if (reportScope === "visible") return sortByTimeline(visible);

    if (reportScope === "single") {
      const target = toNum(selectedSingleLeadNo);
      if (!Number.isFinite(target)) return [];
      return visible.filter((l) => toNum(l.leadNo) === target);
    }

    if (reportScope === "selected") {
      const min = toNum(selectStartLead1);
      const max = toNum(selectEndLead2);
      if (Number.isFinite(min) && Number.isFinite(max) && min <= max) {
        return sortByTimeline(all.filter((l) => {
          const n = toNum(l.leadNo);
          return Number.isFinite(n) && n >= min && n <= max;
        }));
      }
      if (visible.length && visible !== all) return sortByTimeline(visible);
      return [];
    }

    return [];
  };

  const getLeadsForSelectedFlags = () => {
    if (!selectedFlags.length) return [];
    const allowedNos = new Set(
      (timelineEntries || [])
        .filter((t) => Array.isArray(t.timelineFlag) && t.timelineFlag.some((f) => selectedFlags.includes(f)))
        .map((t) => String(t.leadNo))
    );
    const out  = [];
    const seen = new Set();
    for (const lead of leadsData || []) {
      const key = String(lead.leadNo);
      if (!seen.has(key) && allowedNos.has(key)) { seen.add(key); out.push(lead); }
    }
    return out;
  };

  const getReopenedLeads = () =>
    (leadsData || []).filter((l) => l.reopenedDate || l.leadStatus === "Reopened");

  const getSingleLeadForReport = () => {
    const target = toNum(selectedSingleLeadNo);
    if (!Number.isFinite(target)) return null;
    const source = hierarchyLeadsData?.length ? hierarchyLeadsData : leadsData;
    if (!Array.isArray(source) || !source.length) return null;
    return source.find((l) => toNum(l.leadNo) === target) || null;
  };

  // ===== API handlers =====

  // Open a PDF from a raw Blob (used by timeline report which still streams directly)
  const openPdfBlob = (blobData) => {
    const url = URL.createObjectURL(new Blob([blobData], { type: "application/pdf" }));
    const a   = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Open a PDF from a signed URL (Azure SAS)
  const openPdfUrl = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Stop any in-flight status poll
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Poll GET /api/report/status/:reportId until ready or failed
  const startPolling = (reportId) => {
    stopPolling();
    const token = localStorage.getItem("token");

    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data: statusData } = await api.get(
          `/api/report/status/${reportId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (statusData.status === "ready") {
          stopPolling();
          const { data: urlData } = await api.get(
            `/api/report/url/${reportId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          openPdfUrl(urlData.url);
          completeProgress();
        } else if (statusData.status === "failed") {
          stopPolling();
          showAlert("Report generation failed. Please try again.");
          completeProgress();
        }
        // "generating" → keep polling
      } catch (err) {
        console.error("Polling error:", err);
        stopPolling();
        showAlert("Lost connection while waiting for report. Please try again.");
        completeProgress();
      }
    }, POLL_INTERVAL_MS);
  };

  // Force-clear a cached report for this case then re-trigger
  const handleRegenerateReport = async () => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (!caseId) return;
    const token = localStorage.getItem("token");
    try {
      await api.delete(`/api/report/savedReport/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to clear saved report:", err);
    }
    handleRunReportWithSummary();
  };

  /**
   * Main "Generate Report" handler.
   *
   * "All leads" report type → Azure save/cache flow:
   *   1. POST /api/report/triggerSave  → { status, reportId }
   *   2a. status "ready"      → GET /api/report/url/:id  → open signed URL (instant)
   *   2b. status "generating" → poll GET /api/report/status/:id until ready
   *
   * All other report types (single, selected, flagged, hierarchy, reopened) →
   *   stream directly via POST /api/report/generateCase (old behaviour, always fresh).
   */
  const handleRunReportWithSummary = async (explicitLeads = null) => {
    if (leadsLoading) {
      showAlert("Please wait. Leads are still loading. Try again once loading is complete.");
      return;
    }

    const token = localStorage.getItem("token");
    const computed       = computeLeadsForReport();
    const leadsForReport = Array.isArray(explicitLeads) && explicitLeads.length
      ? explicitLeads
      : computed;

    if (!leadsForReport || leadsForReport.length === 0) {
      showAlert("No leads selected to include.");
      return;
    }

    const isAllReport    = String(reportType).toLowerCase() === "all";
    const hasWebSummary  = Boolean(useWebpageSummary && typedSummary?.trim());
    const hasFileSummary = Boolean(useFileUpload && execSummaryFile);
    const includeExec    = isAllReport && (hasWebSummary || hasFileSummary);

    setIsGeneratingReport(true);
    startProgress();

    // ── "All leads" → save to Azure and fetch on next click ─────────────────
    if (isAllReport) {
      const caseId = selectedCase?._id || selectedCase?.id;
      if (!caseId) { showAlert("No case selected."); completeProgress(); return; }

      const resolvedSummaryMode = includeExec && hasWebSummary  ? "web"
                                : includeExec && hasFileSummary ? "file"
                                : "none";
      const resolvedSummary = (includeExec && hasWebSummary) ? typedSummary : "";

      try {
        const { data } = await api.post(
          "/api/report/triggerSave",
          {
            caseId,
            summaryMode:     resolvedSummaryMode,
            caseSummary:     resolvedSummary,
            user:            localStorage.getItem("loggedInUser") || "Unknown",
            reportTimestamp: new Date().toLocaleString(),
          },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        if (data.status === "ready") {
          const { data: urlData } = await api.get(
            `/api/report/url/${data.reportId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          openPdfUrl(urlData.url);
          completeProgress();
        } else {
          startPolling(data.reportId);
        }
      } catch (error) {
        if (axios.isCancel(error) || error.name === "CanceledError" || error.name === "AbortError") return;
        console.error("Failed to trigger report generation", error);
        showAlert("Error starting report generation. Please try again.");
        completeProgress();
      }
      return;
    }

    // ── All other report types → stream directly (always fresh) ─────────────
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // File-upload exec summary path (only for "all" type, kept for safety)
      if (includeExec && hasFileSummary) {
        const formData = new FormData();
        formData.append("user",            localStorage.getItem("loggedInUser") || "Unknown");
        formData.append("reportTimestamp", new Date().toLocaleString());
        formData.append("caseNo",          selectedCase.caseNo);
        formData.append("caseName",        selectedCase.caseName);
        formData.append("leadsData",       JSON.stringify(leadsForReport));
        formData.append("selectedReports", JSON.stringify({ FullReport: true }));
        formData.append("execSummaryFile", execSummaryFile);
        formData.append("summaryMode",     "file");
        const response = await axios.post(
          `${api.defaults.baseURL || ""}/api/report/generateCaseExecSummary`,
          formData,
          { headers: { Authorization: `Bearer ${token}` }, responseType: "blob", signal: controller.signal }
        );
        openPdfBlob(response.data);
        completeProgress();
        return;
      }

      // Standard streaming path
      const payload = {
        user:            localStorage.getItem("loggedInUser") || "Unknown",
        reportTimestamp: new Date().toLocaleString(),
        leadsData:       leadsForReport,
        caseSummary:     "",
        selectedReports: { FullReport: true },
        summaryMode:     "none",
      };
      const response = await api.post("/api/report/generateCase", payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        responseType: "blob",
        signal: controller.signal,
      });
      openPdfBlob(response.data);
      completeProgress();
    } catch (error) {
      if (axios.isCancel(error) || error.name === "CanceledError" || error.name === "AbortError") return;
      console.error("Failed to generate report", error);
      showAlert("Error generating PDF. Please try again.");
      completeProgress();
    }
  };

  const handleRunTimelineOnlyReport = async () => {
    if (!selectedCase?.caseNo) return;
    if (leadsLoading) {
      showAlert("Please wait. Leads are still loading. Try again once loading is complete.");
      return;
    }
    if (!timelineEntries.length) {
      showAlert("No timeline entries found for this case. Add timeline entries to leads before generating a timeline report.");
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGeneratingReport(true);
    startProgress();
    try {
      const token    = localStorage.getItem("token");
      const response = await api.post(
        "/api/report/generateTimeline",
        { caseId: selectedCase._id || selectedCase.id, user: localStorage.getItem("loggedInUser") || "Unknown" },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, responseType: "blob", signal: controller.signal }
      );
      openPdfBlob(response.data);
      completeProgress();
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.name === "AbortError") return;
      console.error("Timeline report error:", err);
      showAlert("Failed to generate timeline report. Please try again.");
      completeProgress();
    }
  };

  const handleSearch = async () => {
    try {
      const token    = localStorage.getItem("token");
      const response = await api.get("/api/lead/search", {
        params:  { caseId: selectedCase?._id || selectedCase?.id, keyword: searchTerm },
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeadsData(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  // ===== UI action handlers =====

  const handleShowSingleLead = () => {
    const n = toNum(selectStartLead1);
    if (!Number.isFinite(n)) { showAlert("Please enter a valid lead number."); return; }
    setHierarchyLeadsData(leadsData.filter((l) => String(toNum(l.leadNo)) === String(n)));
    setHierarchyChains([]);
    setSelectedSingleLeadNo(String(n));
  };

  const handleShowHierarchy = async () => {
    if (!hierarchyLeadInput) return;
    const token = localStorage.getItem("token");
    try {
      const caseId       = selectedCase?._id || selectedCase?.id;
      const chainResults = await fetchLeadHierarchyFullDetails(hierarchyLeadInput, "", caseId, token, []);
      setHierarchyChains(chainResults);
      const uniqueLeads = [];
      const seen        = new Set();
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

  const handleShowAllLeads = () => {
    setHierarchyLeadInput("");
    setHierarchyChains([]);
    setHierarchyLeadsData([]);
  };

  const handleShowLeadsInRange = () => {
    const min = parseInt(selectStartLead1, 10);
    const max = parseInt(selectEndLead2,   10);
    if (isNaN(min) || isNaN(max)) { showAlert("Please enter valid numeric lead numbers."); return; }
    setHierarchyLeadsData(leadsData.filter((lead) => {
      const n = parseInt(lead.leadNo, 10);
      return n >= min && n <= max;
    }));
    setHierarchyChains([]);
  };

  const handleExecSummaryFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setExecSummaryFile(e.target.files[0]);
  };

  const handleLeadCardClick = (e, lead) => {
    if (reportType !== "single") return;
    const tag = e.target?.tagName?.toLowerCase();
    if (["button", "a", "input", "textarea", "select", "label"].includes(tag)) return;
    setSelectedSingleLeadNo(String(lead.leadNo));
    setReportScope("single");
  };

  // ===== Return =====

  return {
    // data
    leadsData, hierarchyLeadsData, hierarchyChains,
    leadsLoading, leadsLoadingProgress, displayUser,
    // search / sort / filter
    searchTerm, setSearchTerm,
    leadSortOrder, setLeadSortOrder,
    selectedSubCategories, setSelectedSubCategories,
    subCategoryDropdownOpen, setSubCategoryDropdownOpen, subCategoryDropdownRef,
    // report targeting
    reportType, setReportType,
    reportScope, setReportScope,
    selectedSingleLeadNo, setSelectedSingleLeadNo,
    selectStartLead1, setSelectStartLead1,
    selectEndLead2,   setSelectEndLead2,
    isGeneratingReport, reportProgress,
    // timeline & flags
    timelineEntries, timelineOrderedLeads,
    availableFlags, selectedFlags, setSelectedFlags,
    isMultiFlag, setIsMultiFlag,
    // executive summary
    summaryMode, setSummaryMode,
    typedSummary, setTypedSummary,
    useWebpageSummary, execSummaryFile,
    // alert
    alertOpen, setAlertOpen, alertMessage, showAlert,
    // hierarchy ui
    hierarchyLeadInput, setHierarchyLeadInput,
    visibleChainsCount, setVisibleChainsCount,
    hierarchyOrder, setHierarchyOrder,
    // pagination
    currentPage, setCurrentPage, pageSize, setPageSize, totalEntries,
    // derived
    getReopenedLeads, getSingleLeadForReport, getLeadsForSelectedFlags,
    // handlers
    handleRunReportWithSummary, handleRunTimelineOnlyReport,
    handleRegenerateReport,
    cancelReport,
    handleSearch, handleShowSingleLead, handleShowHierarchy,
    handleShowAllLeads, handleShowLeadsInRange,
    handleExecSummaryFileChange, handleLeadCardClick,
  };
}
