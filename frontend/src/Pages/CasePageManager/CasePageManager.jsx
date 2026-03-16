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
  const { selectedCase, setSelectedLead, setLeadStatus } = useContext(CaseContext);
  const isSupervisor = selectedCase.role === "Detective Supervisor";
  const signedInOfficer = localStorage.getItem("loggedInUser");

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
  const [team, setTeam] = useState({ detectiveSupervisor: [], caseManagers: [], investigators: [] });
  const [allUsers, setAllUsers] = useState([]);
  const [selectedInvestigators, setSelectedInvestigators] = useState([]);
  const [selectedCaseManagers, setSelectedCaseManagers] = useState([]);
  const [selectedDetectiveSupervisor, setSelectedDetectiveSupervisor] = useState("");

  // ─── Team dropdown open/search state ──────────────────────────────────────
  const [investigatorsDropdownOpen, setInvestigatorsDropdownOpen] = useState(false);
  const [caseManagersDropdownOpen, setCaseManagersDropdownOpen] = useState(false);
  const [detectiveSupervisorDropdownOpen, setDetectiveSupervisorDropdownOpen] = useState(false);
  const [dsSearch, setDsSearch] = useState("");
  const [cmSearch, setCmSearch] = useState("");
  const [invSearch, setInvSearch] = useState("");

  // Refs for click-outside detection on team dropdowns
  const dsRef = useRef(null);
  const cmRef = useRef(null);
  const invRef = useRef(null);

  // ─── Collapsible section state ────────────────────────────────────────────
  const [isCaseSummaryOpen, setIsCaseSummaryOpen] = useState(true);
  const [isCaseTeamOpen, setIsCaseTeamOpen] = useState(true);

  // ─── Case summary state ───────────────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const saveTimer = useRef(null);
  const isFirstLoad = useRef(true);

  // ─── UI / pagination state ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("allLeads");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ─── Alert / confirm modal state ──────────────────────────────────────────
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmOfficersOpen, setConfirmOfficersOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, lead: null });

  // ─── Presence state ───────────────────────────────────────────────────────
  const [presenceOthers, setPresenceOthers] = useState([]);
  const beatTimerRef = useRef(null);

  // ─── Helpers: user display name ───────────────────────────────────────────
  const fullNameFor = useCallback((uname) => {
    const u = allUsers.find(x => x.username === uname);
    return u ? `${u.firstName} ${u.lastName}` : uname;
  }, [allUsers]);

  const formatUser = useCallback((username) => {
    if (!username) return "—";
    const u = allUsers.find(x => x.username === username);
    return u ? `${u.firstName} ${u.lastName} (${u.username})` : username;
  }, [allUsers]);

  /** Display "First Last (username)" for a single username */
  const displayName = (uname) => {
    const u = allUsers.find(u => u.username === uname);
    return u ? `${u.firstName} ${u.lastName} (${u.username})` : (uname || "—");
  };

  /** Join multiple usernames as full display names */
  const displayNames = (usernames = []) => usernames.map(displayName).join(", ");

  const toTitleCase = (s = "") =>
    s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());

  // ─── Helper: remaining days from a due date ───────────────────────────────
  const calculateRemainingDays = (dueDate) => {
    if (!dueDate) return "";
    const timeDifference = new Date(dueDate) - new Date();
    return Math.max(0, Math.ceil(timeDifference / (1000 * 60 * 60 * 24)));
  };

  /** Returns true when a lead status indicates it has been deleted */
  const isDeletedStatus = (s) => String(s || "").toLowerCase() === "deleted";

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

  // ─── Effect: fetch current case team ─────────────────────────────────────
  useEffect(() => {
    if (!selectedCase?.caseNo) return;
    api.get(`/api/cases/${selectedCase.caseNo}/team`)
      .then(({ data }) => setTeam(data))
      .catch(console.error);
  }, [selectedCase.caseNo]);

  // ─── Effect: sync fetched team into selection state ───────────────────────
  useEffect(() => {
    if (Array.isArray(team.investigators)) {
      setSelectedInvestigators([...new Set(team.investigators)]);
    }
    if (Array.isArray(team.caseManagers)) {
      setSelectedCaseManagers(team.caseManagers);
    }
    if (team.detectiveSupervisor) {
      setSelectedDetectiveSupervisor(team.detectiveSupervisor);
    }
  }, [team.investigators, team.caseManagers, team.detectiveSupervisor]);

  // ─── Effect: presence heartbeat ──────────────────────────────────────────
  useEffect(() => {
    const caseNo = selectedCase?.caseNo ?? caseDetails?.caseNo;
    const caseName = selectedCase?.caseName ?? caseDetails?.caseName;
    if (!caseNo || !caseName) return;

    const payload = { caseNo: String(caseNo), caseName, page: "CasePageManager" };
    let cancelled = false;

    const beat = async () => {
      try {
        const { data } = await api.post(`${PRESENCE_BASE}/heartbeat`, payload);
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
      api.post(`${PRESENCE_BASE}/leave`, payload).catch(() => {});
    };
  }, [selectedCase?.caseNo, selectedCase?.caseName, caseDetails?.caseNo, caseDetails?.caseName]);

  // ─── Effect: load case summary ────────────────────────────────────────────
  useEffect(() => {
    setSummary(null);
    isFirstLoad.current = true;
    async function load() {
      if (!selectedCase?.caseNo) return;
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get(
          `/api/cases/case-summary/${selectedCase.caseNo}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSummary(data.caseSummary ?? '');
      } catch (err) {
        console.error('Failed to load case summary', err);
        setSummary('');
      }
    }
    load();
  }, [selectedCase.caseNo]);

  // ─── Effect: auto-save case summary with 2s debounce ─────────────────────
  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    clearTimeout(saveTimer.current);
    if (summary === null || !selectedCase?.caseNo) return;

    saveTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        await api.put(
          '/api/cases/case-summary',
          { caseNo: selectedCase.caseNo, caseName: selectedCase.caseName, caseSummary: summary },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Case summary save failed', err);
      }
    }, 2000);

    return () => clearTimeout(saveTimer.current);
  }, [summary, selectedCase.caseNo, selectedCase.caseName]);

  // ─── Effect: fetch leads (polled every 15s) ───────────────────────────────
  useEffect(() => {
    const fetchLeadsForCase = async () => {
      if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
      try {
        const token = localStorage.getItem("token");
        const response = await api.get(
          `/api/lead/case/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const leadsArray = Array.isArray(response.data) ? response.data : [];

        // Apply access-level filter; supervisors see all leads
        const filteredLeadsArray = leadsArray.filter((lead) => {
          if (isSupervisor) return true;
          if (
            lead.accessLevel === "Only Case Manager and Assignees" &&
            !lead.assignedTo?.some(a => a.username === signedInOfficer) &&
            lead.assignedBy !== signedInOfficer
          ) return false;
          return true;
        });

        /** Map a raw API lead object to the UI lead shape */
        const mapLead = (lead) => {
          const activeAssignees = Array.isArray(lead.assignedTo)
            ? lead.assignedTo.filter(a => a && a.status !== "declined").map(a => a.username)
            : [];
          return {
            id: Number(lead.leadNo),
            description: lead.description,
            summary: lead.summary,
            dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "",
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
  }, [selectedCase?.caseNo, selectedCase?.caseName, signedInOfficer]);

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
      const url = `/api/lead/${leadNo}/${encodeURIComponent(description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`;
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
    overrideSupervisor = selectedDetectiveSupervisor
  ) => {
    try {
      const token = localStorage.getItem("token");

      const prevSupervisor = team.detectiveSupervisor;
      const prevManagers = team.caseManagers || [];
      const prevInvestigators = team.investigators || [];

      // Block removal of officers who still have open leads
      const removed = [
        ...(prevSupervisor && prevSupervisor !== overrideSupervisor ? [{ username: prevSupervisor, role: "Detective Supervisor" }] : []),
        ...prevManagers.filter(u => !overrideManagers.includes(u)).map(u => ({ username: u, role: "Case Manager" })),
        ...prevInvestigators.filter(u => !overrideInvestigators.includes(u)).map(u => ({ username: u, role: "Investigator" })),
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
        { name: overrideSupervisor, role: "Detective Supervisor", status: "accepted" },
        ...overrideManagers.map(u => ({ name: u, role: "Case Manager", status: "accepted" })),
        ...overrideInvestigators.map(u => ({ name: u, role: "Investigator", status: "pending" })),
      ];

      const newlyAdded = [
        ...(overrideSupervisor && overrideSupervisor !== prevSupervisor ? [{ username: overrideSupervisor, role: "Detective Supervisor" }] : []),
        ...overrideManagers.filter(u => !prevManagers.includes(u)).map(u => ({ username: u, role: "Case Manager" })),
        ...overrideInvestigators.filter(u => !prevInvestigators.includes(u)).map(u => ({ username: u, role: "Investigator" })),
      ];

      await api.put(
        `/api/cases/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/officers`,
        { officers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTeam({
        detectiveSupervisor: overrideSupervisor,
        caseManagers: [...overrideManagers],
        investigators: [...overrideInvestigators],
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
    "Lead No.": "16%", "Lead Name": "22%", "Priority": "10%", "Assigned Officers": "20%",
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
      map.id.add(String(lead.id)); map.description.add(lead.description); map.dueDate.add(lead.dueDate);
      map.priority.add(lead.priority); map.remainingDays.add(String(calculateRemainingDays(lead.dueDate)));
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
  const pendingColWidths = { "Lead No.": "12%", "Lead Name": "32%", "Priority": "8%", "Assigned Officers": "18%" };

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
      map.id.add(String(lead.id)); map.description.add(lead.description); map.dueDate.add(lead.dueDate);
      map.priority.add(lead.priority); map.remainingDays.add(String(calculateRemainingDays(lead.dueDate)));
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
  const allColumns = ["Lead No.", "Lead Log Summary", "Lead Status", "Assigned Officers"];
  const allColKey = {
    "Lead No.": "id", "Lead Log Summary": "description",
    "Lead Status": "leadStatus", "Assigned Officers": "assignedOfficers",
  };
  const allColWidths = { "Lead No.": "8%", "Lead Log Summary": "32%", "Lead Status": "14%", "Assigned Officers": "22%" };

  const popupAllRefs = useRef({});
  const [openAllFilter, setOpenAllFilter] = useState(null);
  const [allFilterConfig, setAllFilterConfig] = useState({ id: [], description: [], leadStatus: [], assignedOfficers: [] });
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
    const map = { id: new Set(), description: new Set(), leadStatus: new Set(), assignedOfficers: new Set() };
    leads.allLeads.forEach(lead => {
      map.id.add(String(lead.id)); map.description.add(lead.description); map.leadStatus.add(lead.leadStatus);
      (lead.assignedOfficers || []).forEach(o => map.assignedOfficers.add(o));
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s)]));
  }, [leads.allLeads]);

  const sortedAllLeads = useMemo(() => {
    const { id: fId, description: fDesc, leadStatus: fStatus, assignedOfficers: fOffs } = allFilterConfig;
    let data = leads.allLeads.filter(lead => {
      if (fId.length && !fId.includes(String(lead.id))) return false;
      if (fDesc.length && !fDesc.includes(lead.description)) return false;
      if (fStatus.length && !fStatus.includes(lead.leadStatus)) return false;
      if (fOffs.length && !lead.assignedOfficers.some(off => fOffs.includes(off))) return false;
      return true;
    });
    const { key, direction } = allSortConfig;
    if (key) {
      data = data.slice().sort((a, b) => {
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
                  rows={6}
                />
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

                    {/* Detective Supervisor */}
                    <tr>
                      <td className={styles['case-team-td']}>Detective Supervisor</td>
                      <td className={`${styles['name-cell']} ${styles['case-team-td']}`}>
                        {selectedCase.role === "Detective Supervisor" ? (
                          <div ref={dsRef} className={styles['custom-dropdown']}>
                            <div
                              className={styles['dropdown-head']}
                              onClick={() => setDetectiveSupervisorDropdownOpen(prev => !prev)}
                            >
                              <span className={styles['dh-text']}>
                                {selectedDetectiveSupervisor ? displayName(selectedDetectiveSupervisor) : "Select Detective Supervisor"}
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
                                  .filter(user => !dsSearch || `${user.firstName} ${user.lastName} ${user.username}`.toLowerCase().includes(dsSearch.toLowerCase()))
                                  .map(user => (
                                    <div key={user.username} className={styles['dropdown-item']}>
                                      <input
                                        type="radio"
                                        name="detectiveSupervisor"
                                        id={`ds-${user.username}`}
                                        value={user.username}
                                        checked={selectedDetectiveSupervisor === user.username}
                                        onChange={() => {
                                          setSelectedDetectiveSupervisor(user.username);
                                          saveInvestigators(selectedInvestigators, selectedCaseManagers, user.username);
                                        }}
                                      />
                                      <label htmlFor={`ds-${user.username}`}>
                                        {user.firstName} {user.lastName} ({user.username})
                                      </label>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          formatUser(team.detectiveSupervisor) || "—"
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
                                {selectedCaseManagers.length > 0 ? displayNames(selectedCaseManagers) : "Select Case Manager(s)"}
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
                                  .filter(user => !cmSearch || `${user.firstName} ${user.lastName} ${user.username}`.toLowerCase().includes(cmSearch.toLowerCase()))
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
                                          saveInvestigators(selectedInvestigators, next, selectedDetectiveSupervisor);
                                        }}
                                      />
                                      <label htmlFor={`cm-${user.username}`}>
                                        {user.firstName} {user.lastName} ({user.username})
                                      </label>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          (team.caseManagers || []).map(formatUser).join(", ") || "—"
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
                                {selectedInvestigators.length ? displayNames(selectedInvestigators) : "Select Investigators"}
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
                                  .filter(user => !invSearch || `${user.firstName} ${user.lastName} ${user.username}`.toLowerCase().includes(invSearch.toLowerCase()))
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
                                          saveInvestigators(next, selectedCaseManagers, selectedDetectiveSupervisor);
                                        }}
                                      />
                                      <label htmlFor={`inv-${user.username}`}>
                                        {user.firstName} {user.lastName} ({user.username})
                                      </label>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {team.investigators.length ? team.investigators.map(formatUser).join(", ") : "None assigned"}
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
                        <td>{lead.dueDate || ""}</td>
                        <td>{lead.priority || ""}</td>
                        <td>{calculateRemainingDays(lead.dueDate)}</td>
                        <td style={{ wordBreak: "break-word" }}>
                          {lead.assignedOfficers?.length > 0 ? lead.assignedOfficers.join(", ") : "None"}
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
                          {lead.assignedOfficers?.length > 0 ? lead.assignedOfficers.join(", ") : "None"}
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
                      {paginatedLeads.length > 0 ? paginatedLeads.map(lead => (
                        <tr key={lead.id} style={{ backgroundColor: "#fff" }}>
                          <td>{lead.id}</td>
                          <td>{lead.description}</td>
                          <td style={{
                            color: ["Assigned", "Accepted", "Approved", "Returned", "Completed", "Reopened"].includes(lead.leadStatus)
                              ? "green"
                              : lead.leadStatus === "In Review" ? "red" : "black"
                          }}>
                            {lead.leadStatus === "In Review" ? "To review" : lead.leadStatus}
                          </td>
                          <td style={{ wordBreak: "break-word" }}>
                            {lead.assignedOfficers?.length > 0 ? lead.assignedOfficers.join(", ") : "None"}
                          </td>
                          <td style={{ width: "9%", textAlign: "center" }}>
                            <button
                              className={styles['view-btn1']}
                              onClick={() => !isDeletedStatus(lead.leadStatus) && handleLeadClick(lead)}
                              disabled={isDeletedStatus(lead.leadStatus)}
                              style={{
                                opacity: isDeletedStatus(lead.leadStatus) ? 0.5 : 1,
                                cursor: isDeletedStatus(lead.leadStatus) ? "not-allowed" : "pointer",
                              }}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "8px" }}>No Leads Available</td>
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
