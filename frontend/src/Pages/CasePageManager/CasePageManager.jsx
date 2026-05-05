import React, { useContext, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { SideBar } from "../../components/Sidebar/Sidebar";
import Filter from "../../components/Filter/Filter";
import styles from './CasePageManager.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { CaseContext } from "../CaseContext";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import Pagination from "../../components/Pagination/Pagination";
import api from "../../api";

export const CasePageManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { caseDetails } = location.state || {};

  // ─── Context ──────────────────────────────────────────────────────────────
  const { selectedCase, setSelectedCase, setSelectedLead, setLeadStatus } = useContext(CaseContext);

  // Reliable caseId: prefer live context but fall back to navigation state so
  // data is fetched on the very first render even if context hasn't updated yet.
  const activeCaseId = selectedCase?._id || selectedCase?.id || caseDetails?._id;

  // If context hasn't been updated yet (timing with notification navigation),
  // sync the navigation state into context so the page loads correctly.
  useEffect(() => {
    if (caseDetails && (!selectedCase || (caseDetails._id && selectedCase._id !== caseDetails._id))) {
      setSelectedCase(caseDetails);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isSupervisor = selectedCase?.role === "Detective Supervisor";
  const isAdmin = (localStorage.getItem("systemRole") || localStorage.getItem("role") || "") === "Admin";
  const signedInOfficer = localStorage.getItem("loggedInUser");
  const signedInUserId  = localStorage.getItem("userId");

  // ─── Constants ────────────────────────────────────────────────────────────
  const RIGHT_ALIGN_COL = "Lead No.";
  const PRESENCE_BASE = "/api/presence";
  const upIcon = "/Materials/drop_up.png";
  const downIcon = "/Materials/drop_down.png";

  // ─── Leads state ──────────────────────────────────────────────────────────
  const [leads, setLeads] = useState({
    assignedLeads: [],
    pendingLeads: [],
    pendingLeadReturns: [],
    allLeads: [],
  });

  // ─── Case team state ──────────────────────────────────────────────────────
  const [team, setTeam] = useState({ detectiveSupervisors: [], caseManagers: [], investigators: [], officers: [] });
  const [allUsers, setAllUsers] = useState([]);
  const [selectedInvestigators, setSelectedInvestigators] = useState([]);
  const [selectedCaseManagers, setSelectedCaseManagers] = useState([]);
  const [selectedDetectiveSupervisors, setSelectedDetectiveSupervisors] = useState([]);
  const [selectedOfficers, setSelectedOfficers] = useState([]);

  // ─── Team dropdown open/search state ──────────────────────────────────────
  const [investigatorsDropdownOpen, setInvestigatorsDropdownOpen] = useState(false);
  const [caseManagersDropdownOpen, setCaseManagersDropdownOpen] = useState(false);
  const [detectiveSupervisorDropdownOpen, setDetectiveSupervisorDropdownOpen] = useState(false);
  const [officersDropdownOpen, setOfficersDropdownOpen] = useState(false);
  const [atDropdownOpen, setAtDropdownOpen] = useState(false);
  const [dsSearch, setDsSearch] = useState("");
  const [cmSearch, setCmSearch] = useState("");
  const [invSearch, setInvSearch] = useState("");
  const [offSearch, setOffSearch] = useState("");
  const [atSearch, setAtSearch] = useState("");

  // Refs for click-outside detection on team dropdowns
  const dsRef = useRef(null);
  const cmRef = useRef(null);
  const invRef = useRef(null);
  const offRef = useRef(null);
  const atRef = useRef(null);

  // ─── Assigned case manager state ─────────────────────────────────────────
  const [assignedCaseManager, setAssignedCaseManager] = useState("");

  // ─── Case status / submit state ───────────────────────────────────────────
  const [caseStatus, setCaseStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ─── Collapsible section state ────────────────────────────────────────────
  const [isCaseSummaryOpen, setIsCaseSummaryOpen] = useState(true);
  const [isCaseTeamOpen, setIsCaseTeamOpen] = useState(true);

  // ─── Case summary state ───────────────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const isFirstLoad = useRef(true);

  // ─── UI / pagination state ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("allLeads");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // ─── Alert / confirm modal state ──────────────────────────────────────────
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [confirmOfficersOpen, setConfirmOfficersOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, lead: null });

  // ─── Presence state ───────────────────────────────────────────────────────
  const [presenceOthers, setPresenceOthers] = useState([]);
  const beatTimerRef = useRef(null);

  // ─── Helpers: user display name ───────────────────────────────────────────
  /** "Last, First" from a user object, or fallback to username */
  const fmtName = (u) => {
    if (!u) return "";
    const last  = (u.lastName  || "").trim();
    const first = (u.firstName || "").trim();
    const name  = last && first ? `${last}, ${first}` : last || first || "";
    const uname = u.username ? ` (${u.username})` : "";
    const title = u.title    ? ` (${u.title})`    : "";
    return name ? `${name}${uname}${title}` : u.username || "";
  };

  const fullNameFor = useCallback((uname) => {
    const u = allUsers.find(x => x.username === uname);
    if (!u) return uname;
    const last  = (u.lastName  || "").trim();
    const first = (u.firstName || "").trim();
    return last && first ? `${last}, ${first}` : last || first || uname;
  }, [allUsers]);

  const formatUser = useCallback((username) => {
    if (!username) return "—";
    const u = allUsers.find(x => x.username === username);
    return u ? fmtName(u) : username;
  }, [allUsers]);

  /** Display "Last, First (username) (title)" for a single username */
  const displayName = (uname) => {
    const u = allUsers.find(u => u.username === uname);
    return u ? fmtName(u) : (uname || "—");
  };

  /** Join multiple usernames as full display names */
  const displayNames = (usernames = []) => usernames.map(displayName).join(", ");

  /** "Last, First (username)" — no title — for on-screen DS display */
  const fmtNameNoTitle = (u) => {
    if (!u) return "";
    const last  = (u.lastName  || "").trim();
    const first = (u.firstName || "").trim();
    const name  = last && first ? `${last}, ${first}` : last || first || "";
    const uname = u.username ? ` (${u.username})` : "";
    return name ? `${name}${uname}` : u.username || "";
  };
  const displayNameNoTitle = (uname) => {
    const u = allUsers.find(x => x.username === uname);
    return u ? fmtNameNoTitle(u) : (uname || "—");
  };
  const displayNamesNoTitle = (usernames = []) => usernames.map(displayNameNoTitle).join(", ");

  const toTitleCase = (s = "") =>
    s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());

  // ─── Helper: remaining days from a due date ───────────────────────────────
  const calculateRemainingDays = (dueDate) => {
    if (!dueDate) return "";
    const timeDifference = new Date(dueDate) - new Date();
    return Math.max(0, Math.ceil(timeDifference / (1000 * 60 * 60 * 24)));
  };

  // ─── Helper: due status cell content and color ────────────────────────────
  const getDueStatus = (dueDate) => {
    if (!dueDate) return { label: "—", sub: "", color: "#6b7280" };
    // Parse date parts directly to avoid UTC→local timezone shift
    const dateStr = dueDate.slice(0, 10); // "YYYY-MM-DD"
    const [y, m, d] = dateStr.split("-").map(Number);
    const now = new Date();
    const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const dueUTC = Date.UTC(y, m - 1, d);
    const diffDays = Math.round((dueUTC - nowUTC) / (1000 * 60 * 60 * 24));
    const formatted = `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${String(y).slice(2)}`;
    if (diffDays < 0) {
      return { label: formatted, sub: `${Math.abs(diffDays)}d overdue`, color: "#dc2626" };
    }
    if (diffDays === 0) {
      return { label: formatted, sub: "Due today", color: "#d97706" };
    }
    return { label: formatted, sub: `${diffDays}d left`, color: "#16a34a" };
  };

  /** Returns true when a lead status indicates it has been deleted */
  const isDeletedStatus = (s) => String(s || "").toLowerCase() === "deleted";

  /** Returns true when a lead status indicates it has been closed */
  const isClosedStatus = (s) => String(s || "").toLowerCase() === "closed";

  // ─── Effect: close team dropdowns on outside click ────────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (dsRef.current && !dsRef.current.contains(e.target)) {
        setDetectiveSupervisorDropdownOpen(false);
        setDsSearch("");
      }
      if (cmRef.current && !cmRef.current.contains(e.target)) {
        setCaseManagersDropdownOpen(false);
        setCmSearch("");
      }
      if (invRef.current && !invRef.current.contains(e.target)) {
        setInvestigatorsDropdownOpen(false);
        setInvSearch("");
      }
      if (offRef.current && !offRef.current.contains(e.target)) {
        setOfficersDropdownOpen(false);
        setOffSearch("");
      }
      if (atRef.current && !atRef.current.contains(e.target)) {
        setAtDropdownOpen(false);
        setAtSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Effect: scroll to top on mount ──────────────────────────────────────
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ─── Effect: fetch all system users (for team dropdowns) ─────────────────
  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/users/usernames", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllUsers(data.users || []);
      } catch (err) {
        console.error("Could not load user list:", err);
      }
    }
    fetchUsers();
  }, []);

  // ─── Effect: fetch current case team + status ────────────────────────────
  useEffect(() => {
    if (!selectedCase?.caseNo) return;
    const token = localStorage.getItem("token");
    api.get(`/api/cases/${selectedCase.caseNo}/team`)
      .then(({ data }) => {
        setTeam(data);
        setAssignedCaseManager(data.assignedCaseManager || "");
      })
      .catch(console.error);
    api.get(`/api/cases/caseNo/${selectedCase.caseNo}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setCaseStatus(data.status || null))
      .catch(() => {});
  }, [selectedCase?.caseNo]);

  // ─── Effect: sync fetched team into selection state ───────────────────────
  useEffect(() => {
    if (Array.isArray(team.investigators)) setSelectedInvestigators([...new Set(team.investigators)]);
    if (Array.isArray(team.caseManagers))  setSelectedCaseManagers(team.caseManagers);
    if (Array.isArray(team.detectiveSupervisors)) setSelectedDetectiveSupervisors([...team.detectiveSupervisors]);
    if (Array.isArray(team.officers))      setSelectedOfficers([...team.officers]);
  }, [team.investigators, team.caseManagers, team.detectiveSupervisors, team.officers]);

  // ─── Effect: presence heartbeat ──────────────────────────────────────────
  useEffect(() => {
    const caseNo = selectedCase?.caseNo ?? caseDetails?.caseNo;
    const caseName = selectedCase?.caseName ?? caseDetails?.caseName;
    if (!caseNo || !caseName) return;

    const payload = { caseNo: String(caseNo), caseName, page: "CasePageManager" };
    let cancelled = false;

    const beat = async () => {
      try {
        const { data } = await api.post(`${PRESENCE_BASE}/heartbeat`, payload, { suppressGlobalError: true });
        if (!cancelled) setPresenceOthers(Array.isArray(data?.others) ? data.others : []);
      } catch {
        setPresenceOthers([]);
      }
    };

    beat();
    beatTimerRef.current = setInterval(beat, 10000);
    return () => {
      cancelled = true;
      clearInterval(beatTimerRef.current);
      api.post(`${PRESENCE_BASE}/leave`, payload, { suppressGlobalError: true }).catch(() => {});
    };
  }, [selectedCase?.caseNo, selectedCase?.caseName, caseDetails?.caseNo, caseDetails?.caseName]);

  // ─── Effect: load case summary ────────────────────────────────────────────
  useEffect(() => {
    setSummary(null);
    isFirstLoad.current = true;
    if (!activeCaseId) return;
    async function load() {
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get(
          `/api/cases/case-summary/${activeCaseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSummary(data.caseSummary ?? '');
      } catch (err) {
        console.error('Failed to load case summary', err);
        setSummary('');
      }
    }
    load();
  }, [activeCaseId]);

  // ─── Save case summary on demand ─────────────────────────────────────────
  const saveSummary = async () => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (summary === null || !caseId) return;
    try {
      const token = localStorage.getItem('token');
      await api.put(
        '/api/cases/case-summary',
        { caseId, caseSummary: summary },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlertMessage("Case summary saved successfully.");
      setAlertOpen(true);
    } catch (err) {
      console.error('Case summary save failed', err);
      setAlertMessage("Failed to save case summary. Please try again.");
      setAlertOpen(true);
    }
  };

  // ─── Close case (DS / Admin only, when SUBMITTED) ────────────────────────
  const confirmCloseCase = async () => {
    setConfirmCloseOpen(false);
    if (!selectedCase?.caseNo) return;
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/api/cases/${encodeURIComponent(selectedCase.caseNo)}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await api.put(
        `/api/notifications/close/${encodeURIComponent(selectedCase.caseNo)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCaseStatus("COMPLETED");
      setAlertMessage("Case has been closed and moved to Closed Cases.");
      setAlertOpen(true);
    } catch (err) {
      setAlertMessage(err?.response?.data?.message || "Failed to close case.");
      setAlertOpen(true);
    }
  };

  // ─── Submit case for DS review ───────────────────────────────────────────
  const confirmSubmitCase = async () => {
    setConfirmSubmitOpen(false);
    if (!selectedCase?.caseNo) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.put(
        `/api/cases/${encodeURIComponent(selectedCase.caseNo)}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCaseStatus("SUBMITTED");

      // Notify each DS on the case
      const dsUsers = data.detectiveSupervisors || [];
      await Promise.allSettled(
        dsUsers.map((ds) =>
          api.post(
            "/api/notifications",
            {
              notificationId: `${Date.now()}-${ds.username}`,
              assignedBy: signedInOfficer,
              assignedTo: [{ username: ds.username, role: "Detective Supervisor", status: "pending", unread: true }],
              action1: "has submitted the case for your review",
              post1: `${selectedCase.caseNo}: ${selectedCase.caseName}`,
              caseId: selectedCase._id,
              caseNo: selectedCase.caseNo,
              caseName: selectedCase.caseName,
              caseStatus: "SUBMITTED",
              type: "Case",
              time: new Date().toISOString(),
            },
            { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
          )
        )
      );

      setAlertMessage("Case submitted for Detective Supervisor review.");
      setAlertOpen(true);
    } catch (err) {
      setAlertMessage(err?.response?.data?.message || "Failed to submit case.");
      setAlertOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Effect: fetch leads (polled every 15s) ───────────────────────────────
  useEffect(() => {
    const fetchLeadsForCase = async () => {
      if (!activeCaseId) return;
      try {
        const token = localStorage.getItem("token");
        const response = await api.get(
          `/api/lead/case/${activeCaseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const leadsArray = Array.isArray(response.data) ? response.data : [];

        // Apply access-level filter; supervisors see all leads
        const filteredLeadsArray = leadsArray.filter((lead) => {
          if (isSupervisor) return true;
          if (lead.accessLevel === "Only Case Manager and Assignees") {
            const isAssignee = lead.assignedTo?.some(a =>
              signedInUserId && a.userId
                ? String(a.userId) === signedInUserId
                : a.username === signedInOfficer
            );
            if (!isAssignee && lead.assignedBy !== signedInOfficer) return false;
          }
          return true;
        });

        /** Map a raw API lead object to the UI lead shape */
        const mapLead = (lead) => {
          const activeAssignees = Array.isArray(lead.assignedTo)
            ? lead.assignedTo.filter(a => a && a.status !== "declined").map(a => a.username)
            : [];
          const dueDateStr = lead.dueDate ? lead.dueDate.slice(0, 10) : "";
          let dueStatus = "No Due Date";
          if (dueDateStr) {
            const [y, m, d] = dueDateStr.split("-").map(Number);
            const now = new Date();
            const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
            const dueUTC = Date.UTC(y, m - 1, d);
            const diff = Math.round((dueUTC - nowUTC) / (1000 * 60 * 60 * 24));
            dueStatus = diff < 0 ? "Overdue" : diff === 0 ? "Due Today" : "Pending";
          }
          return {
            id: Number(lead.leadNo),
            description: lead.description,
            summary: lead.summary,
            dueDate: dueDateStr,
            dueStatus,
            priority: lead.priority || "Medium",
            flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [],
            assignedOfficers: activeAssignees,
            leadStatus: lead.leadStatus,
            caseName: lead.caseName,
            caseNo: String(lead.caseNo),
          };
        };

        const assignedLeads = filteredLeadsArray
          .filter(lead => lead.leadStatus === "Assigned")
          .map(mapLead);

        // Sort: unassigned first, then newest by id
        const pendingLeads = filteredLeadsArray
          .filter(lead => lead.leadStatus === "To Reassign" || lead.leadStatus === "Rejected")
          .map(mapLead)
          .sort((a, b) => {
            const aNone = (a.assignedOfficers?.length ?? 0) === 0 ? 0 : 1;
            const bNone = (b.assignedOfficers?.length ?? 0) === 0 ? 0 : 1;
            if (aNone !== bNone) return aNone - bNone;
            return Number(b.id) - Number(a.id);
          });

        const LRInReview = filteredLeadsArray
          .filter(lead => lead.leadStatus === "In Review")
          .map(mapLead);

        const allLeads = filteredLeadsArray
          .map(mapLead)
          .filter(lead => lead.id != null && !isNaN(lead.id))
          .sort((a, b) => Number(b.id) - Number(a.id));

        setLeads({ allLeads, assignedLeads, pendingLeads, pendingLeadReturns: LRInReview });
      } catch (error) {
        console.error("Error fetching leads:", error.message);
      }
    };

    fetchLeadsForCase();
    const intervalId = setInterval(fetchLeadsForCase, 15_000);
    return () => clearInterval(intervalId);
  }, [activeCaseId, signedInOfficer]);

  // ─── Computed: presence display names ─────────────────────────────────────
  const presenceNames = useMemo(
    () => presenceOthers.map(o => o.fullName || o.name || fullNameFor(o.username)),
    [presenceOthers, fullNameFor]
  );

  // ─── Handlers: tab / lead navigation ─────────────────────────────────────
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleLeadClick = (lead) => {
    setSelectedLead({
      leadNo: lead.leadNo != null ? lead.leadNo : lead.id,
      incidentNo: lead.incidentNo,
      leadName: lead.description,
      dueDate: lead.dueDate || "",
      priority: lead.priority || "Medium",
      flags: lead.flags || [],
      assignedOfficers: lead.assignedOfficers || [],
      leadStatus: lead.leadStatus,
      caseName: lead.caseName,
      caseNo: lead.caseNo,
      summary: lead.summary,
    });
    setLeadStatus(lead.leadStatus);
    navigate("/leadReview", { state: { leadDetails: lead, caseDetails: selectedCase } });
  };

  /** Navigate to the Lead Return Instruction page */
  const handleLRClick = (lead) => {
    setSelectedLead({
      leadNo: lead.id,
      incidentNo: lead.incidentNo,
      leadName: lead.description,
      dueDate: lead.dueDate || "",
      priority: lead.priority || "Medium",
      flags: lead.flags || [],
      assignedOfficers: lead.assignedOfficers || [],
      leadStatus: lead.leadStatus,
      caseName: lead.caseName,
      caseNo: lead.caseNo,
      summary: lead.summary,
    });
    navigate("/LRInstruction", { state: { leadDetails: lead, caseDetails: selectedCase } });
  };

  // ─── Handlers: confirm / alert modals ────────────────────────────────────
  const openConfirm = (lead) => setConfirmConfig({ isOpen: true, lead });
  const closeConfirm = () => setConfirmConfig({ isOpen: false, lead: null });
  const handleConfirmAccept = () => { acceptLead(confirmConfig.lead.id, confirmConfig.lead.description); closeConfirm(); };

  const closeConfirmOfficers = () => setConfirmOfficersOpen(false);
  const handleConfirmOfficers = () => { saveInvestigators(); closeConfirmOfficers(); };

  // ─── Handler: accept a lead ───────────────────────────────────────────────
  const acceptLead = async (leadNo, description) => {
    try {
      const token = localStorage.getItem("token");
      const url = `/api/lead/${leadNo}/${encodeURIComponent(description)}/${selectedCase._id || selectedCase.id}`;
      await api.put(url, {}, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      const newPendingLead = {
        id: leadNo, leadNo, description, leadStatus: "Accepted",
        dueDate: "NA", priority: "NA", flags: [], assignedOfficers: ["Unassigned"],
      };
      setLeads(prev => ({
        ...prev,
        assignedLeads: prev.assignedLeads.filter(lead => Number(lead.id) !== Number(leadNo)),
        pendingLeads: [...prev.pendingLeads, newPendingLead],
      }));
    } catch (error) {
      console.error("Error updating lead status:", error.response?.data || error);
      setAlertMessage("Failed to accept lead.");
      setAlertOpen(true);
    }
  };

  // ─── Handler: save case team officers ────────────────────────────────────
  const saveInvestigators = async (
    overrideInvestigators = selectedInvestigators,
    overrideManagers = selectedCaseManagers,
    overrideSupervisors = selectedDetectiveSupervisors,
    overrideOfficers = selectedOfficers,
    overrideAssignedCM = assignedCaseManager
  ) => {
    try {
      const token = localStorage.getItem("token");

      const prevSupervisors  = team.detectiveSupervisors || [];
      const prevManagers     = team.caseManagers || [];
      const prevInvestigators = team.investigators || [];
      const prevOfficers     = team.officers || [];

      // Block removal of officers who still have open leads
      const removed = [
        ...prevSupervisors.filter(u => !overrideSupervisors.includes(u)).map(u => ({ username: u, role: "Detective Supervisor" })),
        ...prevManagers.filter(u => !overrideManagers.includes(u)).map(u => ({ username: u, role: "Case Manager" })),
        ...prevInvestigators.filter(u => !overrideInvestigators.includes(u)).map(u => ({ username: u, role: "Investigator" })),
        ...prevOfficers.filter(u => !overrideOfficers.includes(u)).map(u => ({ username: u, role: "Officer" })),
      ];
      const incompleteLeads = [...leads.assignedLeads, ...leads.pendingLeads];
      const blocked = removed.filter(o =>
        incompleteLeads.some(lead => (lead.assignedOfficers || []).includes(o.username))
      );
      if (blocked.length) {
        setAlertMessage("Cannot remove " + blocked.map(b => `${b.role} ${b.username}`).join(", ") + " because they have open leads.");
        setAlertOpen(true);
        return;
      }

      const officers = [
        ...overrideSupervisors.map(u => ({ name: u, role: "Detective Supervisor", status: "accepted" })),
        ...overrideManagers.map(u => ({ name: u, role: "Case Manager", status: "accepted" })),
        ...overrideInvestigators.map(u => ({ name: u, role: "Investigator", status: "pending" })),
        ...overrideOfficers.map(u => ({ name: u, role: "Officer", status: "pending" })),
      ];

      const newlyAdded = [
        ...overrideSupervisors.filter(u => !prevSupervisors.includes(u)).map(u => ({ username: u, role: "Detective Supervisor" })),
        ...overrideManagers.filter(u => !prevManagers.includes(u)).map(u => ({ username: u, role: "Case Manager" })),
        ...overrideInvestigators.filter(u => !prevInvestigators.includes(u)).map(u => ({ username: u, role: "Investigator" })),
        ...overrideOfficers.filter(u => !prevOfficers.includes(u)).map(u => ({ username: u, role: "Officer" })),
      ];

      await api.put(
        `/api/cases/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/officers`,
        { officers, assignedCaseManagerUsername: overrideAssignedCM },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTeam({
        detectiveSupervisors: [...overrideSupervisors],
        caseManagers:         [...overrideManagers],
        investigators:        [...overrideInvestigators],
        officers:             [...overrideOfficers],
      });

      // Notify newly added officers
      if (newlyAdded.length) {
        await api.post(
          "/api/notifications",
          {
            notificationId: Date.now().toString(),
            assignedBy: signedInOfficer,
            assignedTo: newlyAdded.map(p => ({ username: p.username, role: p.role, status: "pending", unread: true })),
            action1: "assigned you to a new case",
            post1: `${selectedCase.caseNo}: ${selectedCase.caseName}`,
            caseId: selectedCase._id || selectedCase.id || undefined,
            caseNo: selectedCase.caseNo,
            caseName: selectedCase.caseName,
            caseStatus: selectedCase.caseStatus || "Open",
            type: "Case",
          },
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );
      }

      setAlertMessage("Officers updated on this case successfully!");
      setAlertOpen(true);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  // ─── Filter/sort: Assigned Leads ──────────────────────────────────────────
  const assignedColumns = ["Lead No.", "Lead Name", "Due Date", "Priority", "Days Left", "Assigned Officers"];
  const assignedColKey = {
    "Lead No.": "id", "Lead Name": "description", "Due Date": "dueDate",
    "Priority": "priority", "Days Left": "remainingDays", "Assigned Officers": "assignedOfficers",
  };
  const assignedColWidths = {
    "Lead No.": "16%", "Lead Name": "16%", "Priority": "10%", "Assigned Officers": "26%",
  };

  const popupAssignedRefs = useRef({});
  const [openAssignedFilter, setOpenAssignedFilter] = useState(null);
  const [assignedFilterConfig, setAssignedFilterConfig] = useState({
    id: [], description: [], dueDate: [], priority: [], remainingDays: [], flags: [], assignedOfficers: [],
  });
  const [tempAssignedSelections, setTempAssignedSelections] = useState({});
  const [assignedFilterSearch, setAssignedFilterSearch] = useState({});
  const [assignedSortConfig, setAssignedSortConfig] = useState({ key: null, direction: 'asc' });

  const handleAssignedFilterSearch = (dk, txt) => setAssignedFilterSearch(fs => ({ ...fs, [dk]: txt }));
  const assignedAllChecked = dk => (tempAssignedSelections[dk] || []).length === (distinctAssigned[dk] || []).length;
  const toggleAssignedSelectAll = dk => {
    const all = distinctAssigned[dk] || [];
    setTempAssignedSelections(ts => ({ ...ts, [dk]: ts[dk]?.length === all.length ? [] : [...all] }));
  };
  const handleAssignedCheckboxToggle = (dk, v) =>
    setTempAssignedSelections(ts => { const sel = ts[dk] || []; return { ...ts, [dk]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyAssignedFilter = dk => setAssignedFilterConfig(fc => ({ ...fc, [dk]: tempAssignedSelections[dk] || [] }));
  const handleSortAssigned = (dk, dir) => setAssignedSortConfig({ key: dk, direction: dir });

  const distinctAssigned = useMemo(() => {
    const map = { id: new Set(), description: new Set(), dueDate: new Set(), priority: new Set(), remainingDays: new Set(), flags: new Set(), assignedOfficers: new Set() };
    leads.assignedLeads.forEach(lead => {
      map.id.add(String(lead.id)); map.description.add(lead.description);
      if (lead.leadStatus !== 'Completed') { map.dueDate.add(lead.dueDate); map.remainingDays.add(String(calculateRemainingDays(lead.dueDate))); }
      map.priority.add(lead.priority);
      lead.flags.forEach(f => map.flags.add(f)); lead.assignedOfficers.forEach(o => map.assignedOfficers.add(o));
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s)]));
  }, [leads.assignedLeads]);

  const sortedAssignedLeads = useMemo(() => {
    let data = leads.assignedLeads.filter(lead =>
      Object.entries(assignedFilterConfig).every(([key, sel]) => {
        if (!sel.length) return true;
        let cell = key === "remainingDays" ? calculateRemainingDays(lead.dueDate) : lead[key];
        if (Array.isArray(cell)) return cell.some(v => sel.includes(v));
        return sel.includes(String(cell));
      })
    );
    const { key, direction } = assignedSortConfig;
    if (key) {
      data = data.slice().sort((a, b) => {
        if (key === 'id') {
          const aNum = Number(a[key] ?? 0), bNum = Number(b[key] ?? 0);
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const aV = key === "remainingDays" ? calculateRemainingDays(a.dueDate) : Array.isArray(a[key]) ? a[key][0] : a[key];
        const bV = key === "remainingDays" ? calculateRemainingDays(b.dueDate) : Array.isArray(b[key]) ? b[key][0] : b[key];
        return direction === 'asc' ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV));
      });
    }
    return data;
  }, [leads.assignedLeads, assignedFilterConfig, assignedSortConfig]);

  // ─── Filter/sort: Pending (To Reassign) Leads ─────────────────────────────
  const pendingColumns = ["Lead No.", "Lead Name", "Priority", "Assigned Officers"];
  const pendingColKey = {
    "Lead No.": "id", "Lead Name": "description", "Due Date": "dueDate",
    "Priority": "priority", "Days Left": "remainingDays", "Assigned Officers": "assignedOfficers",
  };
  const pendingColWidths = { "Lead No.": "12%", "Lead Name": "22%", "Priority": "8%", "Assigned Officers": "28%" };

  const popupPendingRefs = useRef({});
  const [openPendingFilter, setOpenPendingFilter] = useState(null);
  const [pendingFilterConfig, setPendingFilterConfig] = useState({
    id: [], description: [], dueDate: [], priority: [], remainingDays: [], flags: [], assignedOfficers: [],
  });
  const [tempPendingSelections, setTempPendingSelections] = useState({});
  const [pendingFilterSearch, setPendingFilterSearch] = useState({});
  const [pendingSortConfig, setPendingSortConfig] = useState({ key: null, direction: 'asc' });

  const handlePendingFilterSearch = (dk, txt) => setPendingFilterSearch(fs => ({ ...fs, [dk]: txt }));
  const pendingAllChecked = dk => (tempPendingSelections[dk] || []).length === (distinctPending[dk] || []).length;
  const togglePendingSelectAll = dk => {
    const all = distinctPending[dk] || [];
    setTempPendingSelections(ts => ({ ...ts, [dk]: ts[dk]?.length === all.length ? [] : [...all] }));
  };
  const handlePendingCheckboxToggle = (dk, v) =>
    setTempPendingSelections(ts => { const sel = ts[dk] || []; return { ...ts, [dk]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyPendingFilter = dk => setPendingFilterConfig(fc => ({ ...fc, [dk]: tempPendingSelections[dk] || [] }));
  const handleSortPending = (columnKey) =>
    setPendingSortConfig(prev => ({ key: columnKey, direction: prev.key === columnKey && prev.direction === "asc" ? "desc" : "asc" }));

  const distinctPending = useMemo(() => {
    const map = { id: new Set(), description: new Set(), dueDate: new Set(), priority: new Set(), remainingDays: new Set(), flags: new Set(), assignedOfficers: new Set() };
    leads.pendingLeads.forEach(lead => {
      map.id.add(String(lead.id)); map.description.add(lead.description);
      if (lead.leadStatus !== 'Completed') { map.dueDate.add(lead.dueDate); map.remainingDays.add(String(calculateRemainingDays(lead.dueDate))); }
      map.priority.add(lead.priority);
      lead.flags.forEach(f => map.flags.add(f)); lead.assignedOfficers.forEach(o => map.assignedOfficers.add(o));
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s)]));
  }, [leads.pendingLeads]);

  const sortedPendingLeads = useMemo(() => {
    let data = leads.pendingLeads.filter(lead =>
      Object.entries(pendingFilterConfig).every(([key, sel]) => {
        if (!sel.length) return true;
        let cell = key === "remainingDays" ? calculateRemainingDays(lead.dueDate) : lead[key];
        if (Array.isArray(cell)) return cell.some(v => sel.includes(v));
        return sel.includes(String(cell));
      })
    );
    const { key, direction } = pendingSortConfig;
    if (key) {
      data = data.slice().sort((a, b) => {
        if (key === 'id') {
          const aNum = Number(a[key] ?? 0), bNum = Number(b[key] ?? 0);
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const aV = key === "remainingDays" ? calculateRemainingDays(a.dueDate) : Array.isArray(a[key]) ? a[key][0] : a[key];
        const bV = key === "remainingDays" ? calculateRemainingDays(b.dueDate) : Array.isArray(b[key]) ? b[key][0] : b[key];
        return direction === 'asc' ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV));
      });
    }
    return data;
  }, [leads.pendingLeads, pendingFilterConfig, pendingSortConfig]);

  const paginatedPendingLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPendingLeads.slice(start, start + pageSize);
  }, [sortedPendingLeads, currentPage, pageSize]);

  // ─── Filter/sort: Lead Returns (In Review) ────────────────────────────────
  const pendingLRColumns = ["Lead No.", "Lead Name", "Case Name"];
  const pendingLRColKey = { "Lead No.": "id", "Lead Name": "description", "Case Name": "caseName" };
  const pendingLRColWidths = { "Lead No.": "15%", "Lead Name": "40%", "Case Name": "35%" };

  const popupPendingLRRefs = useRef({});
  const [openPendingLRFilter, setOpenPendingLRFilter] = useState(null);
  const [pendingLRFilterConfig, setPendingLRFilterConfig] = useState({ id: [], description: [], caseName: [] });
  const [tempPendingLRSelections, setTempPendingLRSelections] = useState({});
  const [pendingLRFilterSearch, setPendingLRFilterSearch] = useState({});
  const [pendingLRSortConfig, setPendingLRSortConfig] = useState({ key: null, direction: 'asc' });

  const handlePendingLRFilterSearch = (dk, txt) => setPendingLRFilterSearch(fs => ({ ...fs, [dk]: txt }));
  const pendingLRAllChecked = dk => (tempPendingLRSelections[dk] || []).length === (distinctPendingLR[dk]?.length ?? 0);
  const togglePendingLRSelectAll = dk => {
    const all = distinctPendingLR[dk] || [];
    setTempPendingLRSelections(ts => ({ ...ts, [dk]: ts[dk]?.length === all.length ? [] : [...all] }));
  };
  const handlePendingLRCheckboxToggle = (dk, v) =>
    setTempPendingLRSelections(ts => { const sel = ts[dk] || []; return { ...ts, [dk]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyPendingLRFilter = dk => setPendingLRFilterConfig(fc => ({ ...fc, [dk]: tempPendingLRSelections[dk] || [] }));
  const handleSortPendingLR = (dk, dir) => setPendingLRSortConfig({ key: dk, direction: dir });

  const distinctPendingLR = useMemo(() => {
    const map = { id: new Set(), description: new Set(), caseName: new Set() };
    leads.pendingLeadReturns.forEach(lead => {
      map.id.add(String(lead.id)); map.description.add(lead.description); map.caseName.add(lead.caseName);
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s)]));
  }, [leads.pendingLeadReturns]);

  const sortedPendingLRs = useMemo(() => {
    let data = leads.pendingLeadReturns.filter(lead =>
      Object.entries(pendingLRFilterConfig).every(([key, sel]) => !sel.length || sel.includes(String(lead[key])))
    );
    const { key, direction } = pendingLRSortConfig;
    if (key) {
      data = data.slice().sort((a, b) => {
        if (key === 'id') {
          const aNum = Number(a[key] ?? 0), bNum = Number(b[key] ?? 0);
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const aV = String(a[key]), bV = String(b[key]);
        return direction === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
      });
    }
    return data;
  }, [leads.pendingLeadReturns, pendingLRFilterConfig, pendingLRSortConfig]);

  const paginatedPendingLRs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPendingLRs.slice(start, start + pageSize);
  }, [sortedPendingLRs, currentPage, pageSize]);

  // ─── Filter/sort: All Leads ───────────────────────────────────────────────
  const allColumns = ["Lead No.", "Lead Log Summary", "Lead Status", "Assigned Officers", "Due Status"];
  const allColKey = {
    "Lead No.": "id", "Lead Log Summary": "description",
    "Lead Status": "leadStatus", "Assigned Officers": "assignedOfficers", "Due Status": "dueStatus",
  };
  const allColWidths = { "Lead No.": "8%", "Lead Log Summary": "27%", "Lead Status": "11%", "Assigned Officers": "22%", "Due Status": "10%" };

  const popupAllRefs = useRef({});
  const [openAllFilter, setOpenAllFilter] = useState(null);
  const [allFilterConfig, setAllFilterConfig] = useState({ id: [], description: [], leadStatus: [], assignedOfficers: [], dueStatus: [] });
  const [allFilterSearch, setAllFilterSearch] = useState({});
  const [tempAllSelections, setTempAllSelections] = useState({});
  const [allSortConfig, setAllSortConfig] = useState({ key: null, direction: 'asc' });

  const handleAllFilterSearch = (key, txt) => setAllFilterSearch(fs => ({ ...fs, [key]: txt }));
  const allAllChecked = key => (tempAllSelections[key] || []).length === (distinctAll[key] || []).length;
  const toggleAllSelectAll = key => {
    const all = distinctAll[key] || [];
    setTempAllSelections(ts => ({ ...ts, [key]: ts[key]?.length === all.length ? [] : [...all] }));
  };
  const handleAllCheckboxToggle = (key, v) =>
    setTempAllSelections(ts => { const sel = ts[key] || []; return { ...ts, [key]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyAllFilter = key => setAllFilterConfig(cfg => ({ ...cfg, [key]: tempAllSelections[key] || [] }));
  const handleSortAll = columnKey =>
    setAllSortConfig(prev => ({ key: columnKey, direction: prev.key === columnKey && prev.direction === "asc" ? "desc" : "asc" }));

  const distinctAll = useMemo(() => {
    const map = { id: new Set(), description: new Set(), leadStatus: new Set(), assignedOfficers: new Set(), dueStatus: new Set() };
    leads.allLeads.forEach(lead => {
      map.id.add(String(lead.id)); map.description.add(lead.description); map.leadStatus.add(lead.leadStatus);
      (lead.assignedOfficers || []).forEach(o => map.assignedOfficers.add(o));
      if (lead.leadStatus !== 'Completed') map.dueStatus.add(lead.dueStatus);
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s)]));
  }, [leads.allLeads]);

  const sortedAllLeads = useMemo(() => {
    const { id: fId, description: fDesc, leadStatus: fStatus, assignedOfficers: fOffs, dueStatus: fDue } = allFilterConfig;
    let data = leads.allLeads.filter(lead => {
      if (fId.length && !fId.includes(String(lead.id))) return false;
      if (fDesc.length && !fDesc.includes(lead.description)) return false;
      if (fStatus.length && !fStatus.includes(lead.leadStatus)) return false;
      if (fOffs.length && !lead.assignedOfficers.some(off => fOffs.includes(off))) return false;
      if (fDue.length && !fDue.includes(lead.dueStatus)) return false;
      return true;
    });
    const { key, direction } = allSortConfig;
    if (key) {
      data = data.slice().sort((a, b) => {
        if (key === 'id') {
          const aNum = Number(a[key] ?? 0), bNum = Number(b[key] ?? 0);
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        if (key === 'dueStatus') {
          // Sort by actual due date so Overdue < Due Today < Pending < No Due Date
          const toMs = (d) => d ? new Date(d).getTime() : Infinity;
          const diff = toMs(a.dueDate) - toMs(b.dueDate);
          return direction === 'asc' ? diff : -diff;
        }
        const aV = Array.isArray(a[key]) ? a[key][0] : String(a[key]);
        const bV = Array.isArray(b[key]) ? b[key][0] : String(b[key]);
        return direction === "asc" ? aV.localeCompare(bV) : bV.localeCompare(aV);
      });
    }
    return data;
  }, [leads.allLeads, allFilterConfig, allSortConfig]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAllLeads.slice(start, start + pageSize);
  }, [sortedAllLeads, currentPage, pageSize]);

  // ─── Computed: total entries for current tab (drives pagination) ──────────
  const totalEntries = useMemo(() => {
    switch (activeTab) {
      case "pendingLeads": return sortedPendingLeads.length;
      case "pendingLeadReturns": return sortedPendingLRs.length;
      default: return sortedAllLeads.length;
    }
  }, [activeTab, sortedPendingLeads.length, sortedPendingLRs.length, sortedAllLeads.length]);

  // Reset to page 1 whenever any active filter or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [allFilterConfig, allSortConfig, pendingFilterConfig, pendingSortConfig, pendingLRFilterConfig, pendingLRSortConfig]);

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles['case-page-manager']}>
      <Navbar />

      {/* Confirm submit for review */}
      <AlertModal
        isOpen={confirmSubmitOpen}
        title="Submit Case for Review"
        message={`Are you sure you want to submit Case ${selectedCase?.caseNo}: ${selectedCase?.caseName} for Detective Supervisor review? The case status will change to Submitted.`}
        onClose={() => setConfirmSubmitOpen(false)}
        onConfirm={confirmSubmitCase}
      />

      {/* Confirm close case */}
      <AlertModal
        isOpen={confirmCloseOpen}
        title="Close Case"
        message={`Are you sure you want to close Case ${selectedCase?.caseNo}: ${selectedCase?.caseName}? This will archive the case.`}
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={confirmCloseCase}
      />

      {/* Confirm case officers update */}
      <AlertModal
        isOpen={confirmOfficersOpen}
        title="Confirm Update"
        message="Are you sure you want to update your case officers?"
        onClose={closeConfirmOfficers}
        onConfirm={handleConfirmOfficers}
      />

      {/* Confirm lead accept */}
      <AlertModal
        isOpen={confirmConfig.isOpen}
        title="Confirm Accept"
        message={`Are you sure you want to accept Lead #${confirmConfig.lead?.id} - ${confirmConfig.lead?.description}?`}
        onClose={closeConfirm}
        onConfirm={handleConfirmAccept}
      />

      {/* General notification alert */}
      <AlertModal
        isOpen={alertOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={() => setAlertOpen(false)}
      />

      {/* Banner: other users currently viewing this page */}
      {presenceOthers.length > 0 && (
        <div className={styles['presence-alert']}>
          {presenceNames.join(", ")} {presenceNames.length === 1 ? "is" : "are"} also viewing this case page now.
        </div>
      )}

      <div className={styles['main-container']}>
        <SideBar activePage="CasePageManager" leads={leads} activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className={styles['left-content']}>

          {/* Case header */}
          <div className={styles['case-header-cp']}>
            <div className={styles['cp-head']}>
              <h2>Case: {selectedCase?.caseName ? toTitleCase(selectedCase.caseName) : "Unknown Case"}</h2>
            </div>
            {/* Status + actions — visible to CM / DS / Admin only */}
            {(selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor" || isAdmin) && (
              <div className={styles['case-status-bar']}>
                {caseStatus === "ONGOING" && (
                  <button
                    className={styles['submit-case-btn']}
                    onClick={() => setConfirmSubmitOpen(true)}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Submit for Review"}
                  </button>
                )}
                {caseStatus === "SUBMITTED" && (selectedCase?.role === "Detective Supervisor" || isAdmin) && (
                  <button
                    className={styles['close-case-btn']}
                    onClick={() => setConfirmCloseOpen(true)}
                  >
                    Close Case
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Case Summary ────────────────────────────────────────────── */}
          <section className={styles['collapsible-section']}>
            <button
              type="button"
              className={styles['collapse-header']}
              onClick={() => setIsCaseSummaryOpen(o => !o)}
              aria-expanded={isCaseSummaryOpen}
            >
              <span className={styles['collapse-title']}>Case Summary</span>
              <span>
                <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
              </span>
            </button>
            {isCaseSummaryOpen && (
              <div className={styles['summary-body']}>
                <textarea
                  className={styles['summary-textarea']}
                  value={summary ?? ""}
                  onChange={e => setSummary(e.target.value.replace(/^Case Summary:\s?/, ""))}
                  rows={4}
                />
                <button
                  className={styles['save-summary-btn']}
                  onClick={saveSummary}
                >
                  Save Summary
                </button>
              </div>
            )}
          </section>

          {/* ── Case Team ───────────────────────────────────────────────── */}
          <section className={styles['collapsible-section']}>
            <button
              type="button"
              className={styles['collapse-header']}
              onClick={() => setIsCaseTeamOpen(o => !o)}
              aria-expanded={isCaseTeamOpen}
            >
              <span className={styles['collapse-title']}>Case Team</span>
              <span>
                <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
              </span>
            </button>

            {isCaseTeamOpen && (
              <div className={styles['case-team']}>
                <table className={styles['case-team-table']}>
                  <colgroup>
                    <col className={styles['case-team-col-role']} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={`${styles['case-team-th']} ${styles['case-team-th-role']}`}>Role</th>
                      <th className={styles['case-team-th']}>Name(s)</th>
                    </tr>
                  </thead>
                  <tbody>

                    {/* Detective Supervisor(s) */}
                    <tr>
                      <td className={styles['case-team-td']}>Detective Supervisor{team.detectiveSupervisors.length > 1 ? "s" : ""}</td>
                      <td className={`${styles['name-cell']} ${styles['case-team-td']}`}>
                        {(selectedCase.role === "Detective Supervisor" || isAdmin) ? (
                          <div ref={dsRef} className={styles['custom-dropdown']}>
                            <div
                              className={styles['dropdown-head']}
                              onClick={() => setDetectiveSupervisorDropdownOpen(prev => !prev)}
                            >
                              <span className={styles['dh-text']}>
                                {selectedDetectiveSupervisors.length > 0 ? displayNamesNoTitle(selectedDetectiveSupervisors) : "Select Detective Supervisor(s)"}
                              </span>
                              <span className={styles['dropdown-icon']} aria-hidden="true">
                                <img src={detectiveSupervisorDropdownOpen ? downIcon : upIcon} className={styles['caret-icon']} alt="" />
                              </span>
                            </div>
                            {detectiveSupervisorDropdownOpen && (
                              <div className={styles['dropdown-options']}>
                                <input
                                  type="text"
                                  className={styles['dropdown-search']}
                                  placeholder="Search officer..."
                                  value={dsSearch}
                                  onChange={e => setDsSearch(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  autoFocus
                                />
                                {allUsers
                                  .filter(user => user.role === "Detective Supervisor")
                                  .filter(user => !dsSearch || `${user.firstName} ${user.lastName} ${user.username}`.toLowerCase().includes(dsSearch.toLowerCase()))
                                  .sort((a, b) => { const la = (a.lastName || "").toLowerCase(), lb = (b.lastName || "").toLowerCase(); return la !== lb ? la.localeCompare(lb) : (a.firstName || "").toLowerCase().localeCompare((b.firstName || "").toLowerCase()); })
                                  .map(user => (
                                    <div key={user.username} className={styles['dropdown-item']}>
                                      <input
                                        type="checkbox"
                                        id={`ds-${user.username}`}
                                        value={user.username}
                                        checked={selectedDetectiveSupervisors.includes(user.username)}
                                        onChange={e => {
                                          const next = e.target.checked
                                            ? [...selectedDetectiveSupervisors, user.username]
                                            : selectedDetectiveSupervisors.filter(u => u !== user.username);
                                          setSelectedDetectiveSupervisors(next);
                                          saveInvestigators(selectedInvestigators, selectedCaseManagers, next);
                                        }}
                                      />
                                      <label htmlFor={`ds-${user.username}`}>
                                        {fmtName(user)}
                                      </label>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          displayNamesNoTitle(team.detectiveSupervisors) || "—"
                        )}
                      </td>
                    </tr>

                    {/* Case Manager(s) */}
                    <tr>
                      <td className={styles['case-team-td']}>Case Manager{team.caseManagers.length > 1 ? "s" : ""}</td>
                      <td className={`${styles['name-cell']} ${styles['case-team-td']}`}>
                        {(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") ? (
                          <div ref={cmRef} className={styles['custom-dropdown']}>
                            <div
                              className={styles['dropdown-head']}
                              onClick={() => setCaseManagersDropdownOpen(prev => !prev)}
                            >
                              <span className={styles['dh-text']}>
                                {selectedCaseManagers.length > 0 ? displayNamesNoTitle(selectedCaseManagers) : "Select Case Manager(s)"}
                              </span>
                              <span className={styles['dropdown-icon']} aria-hidden="true">
                                <img src={caseManagersDropdownOpen ? downIcon : upIcon} className={styles['caret-icon']} alt="" />
                              </span>
                            </div>
                            {caseManagersDropdownOpen && (
                              <div className={styles['dropdown-options']}>
                                <input
                                  type="text"
                                  className={styles['dropdown-search']}
                                  placeholder="Search officer..."
                                  value={cmSearch}
                                  onChange={e => setCmSearch(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  autoFocus
                                />
                                {allUsers
                                  .filter(user => user.role === "Detective" || user.role === "Case Specific")
                                  .filter(user => !cmSearch || `${user.firstName} ${user.lastName} ${user.username}`.toLowerCase().includes(cmSearch.toLowerCase()))
                                  .sort((a, b) => { const la = (a.lastName || "").toLowerCase(), lb = (b.lastName || "").toLowerCase(); return la !== lb ? la.localeCompare(lb) : (a.firstName || "").toLowerCase().localeCompare((b.firstName || "").toLowerCase()); })
                                  .map(user => (
                                    <div key={user.username} className={styles['dropdown-item']}>
                                      <input
                                        type="checkbox"
                                        id={`cm-${user.username}`}
                                        value={user.username}
                                        checked={selectedCaseManagers.includes(user.username)}
                                        onChange={e => {
                                          const next = e.target.checked
                                            ? [...selectedCaseManagers, user.username]
                                            : selectedCaseManagers.filter(u => u !== user.username);
                                          setSelectedCaseManagers(next);
                                          saveInvestigators(selectedInvestigators, next, selectedDetectiveSupervisors);
                                        }}
                                      />
                                      <label htmlFor={`cm-${user.username}`}>
                                        {fmtName(user)}
                                      </label>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          displayNamesNoTitle(team.caseManagers) || "—"
                        )}
                      </td>
                    </tr>

                    {/* Assigned To */}
                    <tr>
                      <td className={styles['case-team-td']}>Assigned To</td>
                      <td className={`${styles['name-cell']} ${styles['case-team-td']}`}>
                        {(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor" || isAdmin) ? (
                          <div ref={atRef} className={styles['custom-dropdown']}>
                            <div
                              className={styles['dropdown-head']}
                              onClick={() => setAtDropdownOpen(prev => !prev)}
                            >
                              <span className={styles['dh-text']}>
                                {assignedCaseManager ? displayNameNoTitle(assignedCaseManager) : "Select (required)"}
                              </span>
                              <span className={styles['dropdown-icon']} aria-hidden="true">
                                <img src={atDropdownOpen ? downIcon : upIcon} className={styles['caret-icon']} alt="" />
                              </span>
                            </div>
                            {atDropdownOpen && (
                              <div className={styles['dropdown-options']}>
                                <input
                                  type="text"
                                  className={styles['dropdown-search']}
                                  placeholder="Search case manager..."
                                  value={atSearch}
                                  onChange={e => setAtSearch(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  autoFocus
                                />
                                {selectedCaseManagers
                                  .filter(uname => !atSearch || `${uname} ${displayNameNoTitle(uname)}`.toLowerCase().includes(atSearch.toLowerCase()))
                                  .map(uname => (
                                    <div key={uname} className={styles['dropdown-item']}>
                                      <input
                                        type="radio"
                                        id={`at-${uname}`}
                                        name="assignedCaseManager"
                                        value={uname}
                                        checked={assignedCaseManager === uname}
                                        onChange={() => {
                                          setAssignedCaseManager(uname);
                                          setAtDropdownOpen(false);
                                          saveInvestigators(selectedInvestigators, selectedCaseManagers, selectedDetectiveSupervisors, selectedOfficers, uname);
                                        }}
                                      />
                                      <label htmlFor={`at-${uname}`}>
                                        {displayNameNoTitle(uname)}
                                      </label>
                                    </div>
                                  ))}
                                {selectedCaseManagers.length === 0 && (
                                  <div style={{padding:"6px 10px", color:"#999"}}>No case managers</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          displayNameNoTitle(assignedCaseManager) || "—"
                        )}
                      </td>
                    </tr>

                    {/* Investigator(s) */}
                    <tr>
                      <td className={`${styles['name-cell']} ${styles['case-team-td']}`}>
                        Investigator{team.investigators.length > 1 ? "s" : ""}
                      </td>
                      <td className={styles['case-team-td']}>
                        {(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") ? (
                          <div ref={invRef} className={styles['custom-dropdown']}>
                            <div
                              className={styles['dropdown-head']}
                              onClick={() => setInvestigatorsDropdownOpen(prev => !prev)}
                            >
                              <span className={styles['dh-text']}>
                                {selectedInvestigators.length ? displayNamesNoTitle(selectedInvestigators) : "Select Investigators"}
                              </span>
                              <span className={styles['dropdown-icon']} aria-hidden="true">
                                <img src={investigatorsDropdownOpen ? downIcon : upIcon} className={styles['caret-icon']} alt="" />
                              </span>
                            </div>
                            {investigatorsDropdownOpen && (
                              <div className={styles['dropdown-options']}>
                                <input
                                  type="text"
                                  className={styles['dropdown-search']}
                                  placeholder="Search officer..."
                                  value={invSearch}
                                  onChange={e => setInvSearch(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  autoFocus
                                />
                                {allUsers
                                  .filter(user => user.role === "Detective" || user.role === "Case Specific")
                                  .filter(user => !invSearch || `${user.firstName} ${user.lastName} ${user.username}`.toLowerCase().includes(invSearch.toLowerCase()))
                                  .sort((a, b) => { const la = (a.lastName || "").toLowerCase(), lb = (b.lastName || "").toLowerCase(); return la !== lb ? la.localeCompare(lb) : (a.firstName || "").toLowerCase().localeCompare((b.firstName || "").toLowerCase()); })
                                  .map(user => (
                                    <div key={user.username} className={styles['dropdown-item']}>
                                      <input
                                        type="checkbox"
                                        id={`inv-${user.username}`}
                                        value={user.username}
                                        checked={selectedInvestigators.includes(user.username)}
                                        onChange={e => {
                                          const next = e.target.checked
                                            ? [...selectedInvestigators, user.username]
                                            : selectedInvestigators.filter(u => u !== user.username);
                                          setSelectedInvestigators(next);
                                          saveInvestigators(next, selectedCaseManagers, selectedDetectiveSupervisors);
                                        }}
                                      />
                                      <label htmlFor={`inv-${user.username}`}>
                                        {fmtName(user)}
                                      </label>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {team.investigators.length ? displayNamesNoTitle(team.investigators) : "None assigned"}
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Officer(s) */}
                    <tr>
                      <td className={`${styles['name-cell']} ${styles['case-team-td']}`}>
                        Officer{(team.officers || []).length > 1 ? "s" : ""}
                      </td>
                      <td className={styles['case-team-td']}>
                        {(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") ? (
                          <div ref={offRef} className={styles['custom-dropdown']}>
                            <div
                              className={styles['dropdown-head']}
                              onClick={() => setOfficersDropdownOpen(prev => !prev)}
                            >
                              <span className={styles['dh-text']}>
                                {selectedOfficers.length > 0 ? displayNamesNoTitle(selectedOfficers) : "Select Officer(s)"}
                              </span>
                              <span className={styles['dropdown-icon']} aria-hidden="true">
                                <img src={officersDropdownOpen ? downIcon : upIcon} className={styles['caret-icon']} alt="" />
                              </span>
                            </div>
                            {officersDropdownOpen && (
                              <div className={styles['dropdown-options']}>
                                <input
                                  type="text"
                                  className={styles['dropdown-search']}
                                  placeholder="Search officer..."
                                  value={offSearch}
                                  onChange={e => setOffSearch(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  autoFocus
                                />
                                {allUsers
                                  .filter(user => user.role === "Detective" || user.role === "Case Specific")
                                  .filter(user => ![...selectedDetectiveSupervisors, ...selectedCaseManagers, ...selectedInvestigators].includes(user.username))
                                  .filter(user => !offSearch || `${user.firstName} ${user.lastName} ${user.username}`.toLowerCase().includes(offSearch.toLowerCase()))
                                  .sort((a, b) => { const la = (a.lastName || "").toLowerCase(), lb = (b.lastName || "").toLowerCase(); return la !== lb ? la.localeCompare(lb) : (a.firstName || "").toLowerCase().localeCompare((b.firstName || "").toLowerCase()); })
                                  .map(user => (
                                    <div key={user.username} className={styles['dropdown-item']}>
                                      <input
                                        type="checkbox"
                                        id={`off-${user.username}`}
                                        value={user.username}
                                        checked={selectedOfficers.includes(user.username)}
                                        onChange={e => {
                                          const next = e.target.checked
                                            ? [...selectedOfficers, user.username]
                                            : selectedOfficers.filter(u => u !== user.username);
                                          setSelectedOfficers(next);
                                          saveInvestigators(selectedInvestigators, selectedCaseManagers, selectedDetectiveSupervisors, next);
                                        }}
                                      />
                                      <label htmlFor={`off-${user.username}`}>
                                        {fmtName(user)}
                                      </label>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {(team.officers || []).length ? displayNamesNoTitle(team.officers) : "None assigned"}
                          </div>
                        )}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Tab navigation bar ──────────────────────────────────────── */}
          <div className={styles['stats-bar']}>
            <span
              className={`${styles.hoverable} ${activeTab === "allLeads" ? styles.active : ""}`}
              onClick={() => handleTabClick("allLeads")}
            >
              All Leads: {leads.allLeads.length}
            </span>
            <span
              className={`${styles.hoverable} ${activeTab === "pendingLeads" ? styles.active : ""}`}
              onClick={() => handleTabClick("pendingLeads")}
            >
              Leads To Reassign: {leads.pendingLeads.length}
            </span>
            <span
              className={`${styles.hoverable} ${activeTab === "pendingLeadReturns" ? styles.active : ""}`}
              onClick={() => handleTabClick("pendingLeadReturns")}
            >
              Lead Returns for Review: {leads.pendingLeadReturns.length}
            </span>
          </div>

          <div className={styles['content-section']}>

            {/* ── Assigned Leads tab ──────────────────────────────────── */}
            {activeTab === "assignedLeads" && (
              <div className={styles['table-scroll-container']}>
                <table className={styles['leads-table']} style={{ minWidth: "1000px" }}>
                  <thead>
                    <tr>
                      {assignedColumns.map(col => {
                        const dataKey = assignedColKey[col];
                        return (
                          <th key={col} className={styles['column-header1']} style={{ width: assignedColWidths[col] }}>
                            <div className={styles['header-title']}>
                              {col}
                              <span ref={el => (popupAssignedRefs.current[dataKey] = el)}>
                                <button onClick={() => setOpenAssignedFilter(prev => prev === dataKey ? null : dataKey)}>
                                  <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
                                </button>
                                <Filter
                                  dataKey={dataKey}
                                  distinctValues={distinctAssigned}
                                  open={openAssignedFilter === dataKey}
                                  anchorRef={{ current: popupAssignedRefs.current[dataKey] }}
                                  searchValue={assignedFilterSearch[dataKey] || ""}
                                  selections={tempAssignedSelections[dataKey] || []}
                                  onSearch={handleAssignedFilterSearch}
                                  onSort={handleSortAssigned}
                                  allChecked={assignedAllChecked}
                                  onToggleAll={toggleAssignedSelectAll}
                                  onToggleOne={handleAssignedCheckboxToggle}
                                  onApply={() => { applyAssignedFilter(dataKey); setOpenAssignedFilter(null); }}
                                  onCancel={() => setOpenAssignedFilter(null)}
                                  numeric={dataKey === "id"}
                                />
                              </span>
                            </div>
                          </th>
                        );
                      })}
                      <th style={{ width: "10%", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssignedLeads.length > 0 ? sortedAssignedLeads.map(lead => (
                      <tr key={lead.id}>
                        <td>{lead.id}</td>
                        <td>{lead.description}</td>
                        <td>{lead.leadStatus === 'Completed' ? '' : (lead.dueDate || "")}</td>
                        <td>{lead.priority || ""}</td>
                        <td>{lead.leadStatus === 'Completed' ? '' : calculateRemainingDays(lead.dueDate)}</td>
                        <td style={{ wordBreak: "break-word" }}>
                          {lead.assignedOfficers?.length > 0 ? displayNamesNoTitle(lead.assignedOfficers) : "None"}
                        </td>
                        <td style={{ width: "9%", textAlign: "center" }}>
                          <button className={styles['view-btn1']} onClick={() => handleLeadClick(lead)}>
                            Manage
                          </button>
                          {lead.assignedOfficers?.includes(signedInOfficer) && (
                            <button className={styles['accept-btn']} onClick={() => openConfirm(lead)}>
                              Accept
                            </button>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '8px' }}>No Assigned Leads Available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Pending (To Reassign) Leads tab ─────────────────────── */}
            {activeTab === "pendingLeads" && (
              <div className={styles['table-scroll-container']}>
                <table className={styles['leads-table']} style={{ minWidth: "1000px" }}>
                  <thead>
                    <tr>
                      {pendingColumns.map(col => {
                        const dataKey = pendingColKey[col];
                        return (
                          <th key={col} className={styles['column-header1']} style={{ width: pendingColWidths[col], position: 'relative' }}>
                            <div className={styles['header-title']}>
                              {col}
                              <span ref={el => (popupPendingRefs.current[dataKey] = el)}>
                                <button onClick={() => setOpenPendingFilter(prev => prev === dataKey ? null : dataKey)}>
                                  <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
                                </button>
                                <Filter
                                  dataKey={dataKey}
                                  distinctValues={distinctPending}
                                  open={openPendingFilter === dataKey}
                                  anchorRef={{ current: popupPendingRefs.current[dataKey] }}
                                  searchValue={pendingFilterSearch[dataKey] || ""}
                                  selections={tempPendingSelections[dataKey] || []}
                                  onSearch={handlePendingFilterSearch}
                                  allChecked={pendingAllChecked}
                                  onToggleAll={togglePendingSelectAll}
                                  onToggleOne={handlePendingCheckboxToggle}
                                  onApply={() => { applyPendingFilter(dataKey); setOpenPendingFilter(null); }}
                                  onCancel={() => setOpenPendingFilter(null)}
                                  onSort={() => handleSortPending(dataKey)}
                                  numeric={dataKey === "id"}
                                />
                              </span>
                            </div>
                          </th>
                        );
                      })}
                      <th style={{ width: "11%", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPendingLeads.length > 0 ? paginatedPendingLeads.map(lead => (
                      <tr key={lead.id}>
                        <td>{lead.id}</td>
                        <td>{lead.description}</td>
                        <td>{lead.priority}</td>
                        <td style={{ wordBreak: "break-word" }}>
                          {lead.assignedOfficers?.length > 0 ? displayNamesNoTitle(lead.assignedOfficers) : "None"}
                        </td>
                        <td style={{ width: "9%", textAlign: "center" }}>
                          <button
                            className={styles['view-btn1']}
                            onClick={() => navigate("/leadReview", { state: { caseDetails, leadId: lead.id, leadDescription: lead.summary } })}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: "8px" }}>No Leads Available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Lead Returns (In Review) tab ─────────────────────────── */}
            {activeTab === "pendingLeadReturns" && (
              <div className={styles['table-scroll-container']}>
                <table className={styles['leads-table']} style={{ minWidth: "1000px" }}>
                  <colgroup>
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      {pendingLRColumns.map(col => {
                        const dataKey = pendingLRColKey[col];
                        return (
                          <th key={col} className={styles['column-header1']} style={{ width: pendingLRColWidths[col], position: 'relative' }}>
                            <div className={styles['header-title']}>
                              {col}
                              <span ref={el => (popupPendingLRRefs.current[dataKey] = el)}>
                                <button onClick={() => setOpenPendingLRFilter(prev => prev === dataKey ? null : dataKey)}>
                                  <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
                                </button>
                                <Filter
                                  dataKey={dataKey}
                                  distinctValues={distinctPendingLR}
                                  open={openPendingLRFilter === dataKey}
                                  anchorRef={{ current: popupPendingLRRefs.current[dataKey] }}
                                  searchValue={pendingLRFilterSearch[dataKey] || ''}
                                  selections={tempPendingLRSelections[dataKey] || []}
                                  onSearch={handlePendingLRFilterSearch}
                                  onSort={handleSortPendingLR}
                                  allChecked={pendingLRAllChecked}
                                  onToggleAll={togglePendingLRSelectAll}
                                  onToggleOne={handlePendingLRCheckboxToggle}
                                  onApply={() => { applyPendingLRFilter(dataKey); setOpenPendingLRFilter(null); }}
                                  onCancel={() => setOpenPendingLRFilter(null)}
                                  numeric={dataKey === "id"}
                                />
                              </span>
                            </div>
                          </th>
                        );
                      })}
                      <th style={{ width: '11%', textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPendingLRs.length > 0 ? paginatedPendingLRs.map(lead => (
                      <tr key={lead.id}>
                        <td>{lead.id}</td>
                        <td>{lead.description}</td>
                        <td>{lead.caseName}</td>
                        <td style={{ width: "11%", textAlign: "center" }}>
                          <button className={styles['continue-btn']} onClick={() => handleLRClick(lead)}>
                            Continue
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '8px' }}>No Pending Lead Returns Available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── All Leads tab ────────────────────────────────────────── */}
            {activeTab === "allLeads" && (
              <div className={styles['all-leads']}>
                <div className={styles['table-scroll-container']}>
                  <table className={styles['leads-table']} style={{ minWidth: "1000px" }}>
                    <thead>
                      <tr>
                        {allColumns.map(col => {
                          const dataKey = allColKey[col];
                          return (
                            <th
                              key={col}
                              className={styles['column-header1']}
                              style={{ width: allColWidths[col], position: 'relative', textAlign: col === RIGHT_ALIGN_COL ? "right" : undefined }}
                            >
                              <div className={styles['header-title']}>
                                {col}
                                <span ref={el => (popupAllRefs.current[dataKey] = el)}>
                                  <button onClick={() => setOpenAllFilter(prev => prev === dataKey ? null : dataKey)}>
                                    <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
                                  </button>
                                  <Filter
                                    dataKey={dataKey}
                                    distinctValues={distinctAll}
                                    open={openAllFilter === dataKey}
                                    anchorRef={{ current: popupAllRefs.current[dataKey] }}
                                    searchValue={allFilterSearch[dataKey] || ''}
                                    selections={tempAllSelections[dataKey] || []}
                                    onSearch={handleAllFilterSearch}
                                    onSort={handleSortAll}
                                    allChecked={allAllChecked}
                                    onToggleAll={toggleAllSelectAll}
                                    onToggleOne={handleAllCheckboxToggle}
                                    onApply={() => { applyAllFilter(dataKey); setOpenAllFilter(null); }}
                                    onCancel={() => setOpenAllFilter(null)}
                                    numeric={dataKey === "id"}
                                  />
                                </span>
                              </div>
                            </th>
                          );
                        })}
                        <th style={{ width: "9%", textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeads.length > 0 ? paginatedLeads.map(lead => {
                        const isDeleted = isDeletedStatus(lead.leadStatus);
                        const isClosed  = isClosedStatus(lead.leadStatus);
                        const isNonNavigable = isDeleted || isClosed;

                        // Uniform row colour for terminated leads
                        const rowStyle = (isDeleted || isClosed)
                          ? { color: '#9b1c1c', backgroundColor: '#fff5f5' }
                          : { backgroundColor: '#fff' };

                        const { label, sub, color } = (isNonNavigable || lead.leadStatus === 'Completed')
                          ? { label: '—', sub: '', color: 'inherit' }
                          : getDueStatus(lead.dueDate);

                        return (
                        <tr key={lead.id} style={rowStyle}>
                          <td>{lead.id}</td>
                          <td>{lead.description}</td>
                          <td style={{
                            fontWeight: 600,
                            color: isNonNavigable ? 'inherit' : (
                              ["Assigned", "Accepted", "Approved", "Returned", "Completed", "Reopened"].includes(lead.leadStatus)
                                ? "green"
                                : lead.leadStatus === "In Review" ? "red" : "black"
                            )
                          }}>
                            {lead.leadStatus === "In Review" ? "Under Review" : lead.leadStatus}
                          </td>
                          <td style={{ wordBreak: "break-word" }}>
                            {lead.assignedOfficers?.length > 0 ? displayNamesNoTitle(lead.assignedOfficers) : "None"}
                          </td>
                          <td style={{ width: "13%" }}>
                            <div style={{ color: isNonNavigable ? 'inherit' : color, fontWeight: 500, lineHeight: 1.4 }}>
                              <div style={{ fontSize: 18 }}>{label}</div>
                              {sub && <div style={{ fontSize: 18 }}>{sub}</div>}
                            </div>
                          </td>
                          <td style={{ width: "9%", textAlign: "center" }}>
                            <button
                              className={isNonNavigable ? styles['manage-btn-terminated'] : styles['view-btn1']}
                              onClick={() => !isNonNavigable && handleLeadClick(lead)}
                              disabled={isNonNavigable}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "8px" }}>No Leads Available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalEntries={totalEntries}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
