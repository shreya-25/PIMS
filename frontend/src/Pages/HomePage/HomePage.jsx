import React, { useState, useRef, useMemo, useEffect } from "react";
import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./HomePage.module.css";
import { CaseContext } from "../CaseContext";
import Navbar from "../../components/Navbar/Navbar";
import NotificationCard from "../../components/NotificationCard/NotificationCard1";
import Filter from "../../components/Filter/Filter";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import Pagination from "../../components/Pagination/Pagination";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import api from "../../api";
import { ROLES, isDetectiveSupervisor } from "../../constants/roles";

export const HomePage = () => {
  const location = useLocation();
  const systemRoleInit = localStorage.getItem("role");
  const isReadOnlyUser = systemRoleInit === "Read Only";
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || (isReadOnlyUser ? "cases" : "notifications"));
  const isCaseMgmt = activeTab !== "notifications";

  // Refs for filter button anchor positioning
  const filterButtonRefs = useRef({});
  const assignedFilterButtonRefs = useRef({});
  const pendingFilterButtonRefs = useRef({});
  const popupPendingRefs = useRef({});

  // Close case confirmation modal
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [caseToClose, setCaseToClose] = useState({ caseNo: null, caseName: "" });

  // Controls Add Case slide-bar visibility
  const [showAddCase, setShowAddCase] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeMap, setPageSizeMap] = useState({ cases: 50, assignedLeads: 10, pendingLeadReturns: 10 });
  const pageSize = pageSizeMap[activeTab] ?? 10;
  const setPageSize = (size) => setPageSizeMap((prev) => ({ ...prev, [activeTab]: size }));

  const { setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const signedInOfficer = localStorage.getItem("loggedInUser");
  const signedInUserId  = localStorage.getItem("userId");
  const systemRole      = localStorage.getItem("role");
  const isAdmin         = systemRole === ROLES.ADMIN;
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [treatAsDS, setTreatAsDS] = useState(false);
  const [leads, setLeads] = useState({
    assignedLeads: [],
    pendingLeads: [],
    pendingLeadReturns: [],
  });
  const [userMap, setUserMap] = useState({});  // username → user object

  // Format a date string as MM/DD/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    return `${month}/${day}/${year}`;
  };

  // Fetch all users once for name/title lookups
  useEffect(() => {
    api.get("/api/users/usernames")
      .then(({ data }) => {
        const map = {};
        (data.users || []).forEach((u) => { if (u.username) map[u.username] = u; });
        setUserMap(map);
      })
      .catch(() => {});
  }, []);

  const formatUserDisplay = (username, map) => {
    const u = map[username];
    if (!u) return username;
    const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    const title = u.title ? ` (${u.title})` : "";
    const uname = ` (${u.username})`;
    return full ? `${full}${title}${uname}` : u.username;
  };

  // Map a raw API case to the shape used in UI, resolving the officer's role
  const mapCaseForOfficer = (c, officerName, officerUserId, sysRole) => {
    const name = officerName?.toLowerCase?.() ?? "";
    const uid  = officerUserId ?? "";
    const matchUser = (u) =>
      u &&
      (uid
        ? String(u._id || u.id || "") === uid
        : u.username?.toLowerCase() === name || u.displayName?.toLowerCase() === name);

    let role = "";
    if (
      (c.detectiveSupervisorUserId && matchUser(c.detectiveSupervisorUserId)) ||
      (Array.isArray(c.detectiveSupervisorUserIds) && c.detectiveSupervisorUserIds.some(matchUser))
    ) {
      role = "Detective Supervisor";
    } else if (Array.isArray(c.caseManagerUserIds) && c.caseManagerUserIds.some(matchUser)) {
      role = "Case Manager";
    } else if (Array.isArray(c.investigatorUserIds) && c.investigatorUserIds.some(matchUser)) {
      role = "Investigator";
    } else if (Array.isArray(c.readOnlyUserIds) && c.readOnlyUserIds.some(matchUser)) {
      role = "Read Only";
    } else if (sysRole === ROLES.ADMIN) {
      role = "Case Manager";
    } else if (isDetectiveSupervisor(sysRole)) {
      // DS viewing a case they aren't directly assigned to — treat as DS for navigation
      role = "Detective Supervisor";
    }

    const getDisplayName = (u) => {
      if (!u) return "";
      const last  = (u.lastName  || "").trim();
      const first = (u.firstName || "").trim();
      const name  = last && first ? `${last}, ${first}` : last || first || u.displayName || u.name || "";
      const uname = u.username ? ` (${u.username})` : "";
      return name ? `${name}${uname}` : u.username || "";
    };

    const detectiveSupervisor = c.detectiveSupervisorUserId
      ? getDisplayName(c.detectiveSupervisorUserId)
      : "—";

    const caseManagerNames = Array.isArray(c.caseManagerUserIds)
      ? c.caseManagerUserIds.map(getDisplayName).filter(Boolean)
      : [];
    const caseManagers = caseManagerNames.length > 0 ? caseManagerNames.join(", ") : "—";

    const investigators = Array.isArray(c.investigatorUserIds) && c.investigatorUserIds.length > 0
      ? c.investigatorUserIds.map(getDisplayName).filter(Boolean).join(", ") || "—"
      : "—";

    return {
      _id: c._id,
      id: c.caseNo,
      title: c.caseName,
      status: c.status,
      role,
      createdAt: c.createdAt,
      detectiveSupervisor,
      caseManagers,
      caseManagerNames,
      investigators,
    };
  };

  // Detect DS status on mount — runs regardless of active tab so the sidebar shows correctly
  useEffect(() => {
    const detectDS = async () => {
      try {
        if (isDetectiveSupervisor(systemRole)) { setTreatAsDS(true); return; }
        const token = localStorage.getItem("token");
        if (!token) return;
        const { data } = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const name = signedInOfficer?.toLowerCase?.() ?? "";
        const uid  = signedInUserId ?? "";
        const matchUser = (u) =>
          u && (uid ? String(u._id || u.id || "") === uid
            : u.username?.toLowerCase() === name || u.displayName?.toLowerCase() === name);
        const isCaseLevelDS = (data || []).some(
          (c) =>
            (c.detectiveSupervisorUserId && matchUser(c.detectiveSupervisorUserId)) ||
            (Array.isArray(c.detectiveSupervisorUserIds) && c.detectiveSupervisorUserIds.some(matchUser))
        );
        setTreatAsDS(isCaseLevelDS);
      } catch { /* silent */ }
    };
    detectDS();
  }, [signedInOfficer]);

  // Fetch ongoing cases assigned to the signed-in officer; polls every 5s
  useEffect(() => {
    if (!isCaseMgmt) return;
    let cancelled = false;

    const fetchCases = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. User is not authenticated.");
          return;
        }

        const response = await api.get("/api/cases", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (cancelled) return;

        const name = signedInOfficer?.toLowerCase?.() ?? "";
        const uid  = signedInUserId ?? "";
        const matchUser = (u) =>
          u &&
          (uid
            ? String(u._id || u.id || "") === uid
            : u.username?.toLowerCase() === name || u.displayName?.toLowerCase() === name);

        // Treat user as DS if their system role is DS OR they are the DS in any ongoing case
        const isCaseLevelDS = response.data.some(
          (c) =>
            (c.detectiveSupervisorUserId && matchUser(c.detectiveSupervisorUserId)) ||
            (Array.isArray(c.detectiveSupervisorUserIds) && c.detectiveSupervisorUserIds.some(matchUser))
        );
        const treatAsDSLocal = isDetectiveSupervisor(systemRole) || isCaseLevelDS;
        setTreatAsDS(treatAsDSLocal);

        const assignedCases = response.data
          .filter((c) => {
            if (c.status !== "ONGOING") return false;
            // Admin and Detective Supervisors see all ongoing cases
            if (isAdmin || treatAsDSLocal) return true;
            // Case Managers and Investigators only see cases they are assigned to
            const isCM = Array.isArray(c.caseManagerUserIds) && c.caseManagerUserIds.some(matchUser);
            const isInv = Array.isArray(c.investigatorUserIds) && c.investigatorUserIds.some(matchUser);
            const isRO = Array.isArray(c.readOnlyUserIds) && c.readOnlyUserIds.some(matchUser);
            return isCM || isInv || isRO;
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((c) => mapCaseForOfficer(c, signedInOfficer, signedInUserId, isAdmin ? ROLES.ADMIN : treatAsDSLocal ? ROLES.DETECTIVE_SUPERVISOR : systemRole));

        setCases(assignedCases);
      } catch (error) {
        console.error("Error fetching cases:", error.response?.data || error);
      }
    };

    fetchCases();
    const intervalId = setInterval(fetchCases, 5_000);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [isCaseMgmt, signedInOfficer]);

  // Fetch pending lead returns for the signed-in officer
  useEffect(() => {
    const fetchPendingLeadReturns = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. User is not authenticated.");
          return;
        }

        const leadsResponse = await api.get("/api/leadreturn/officer-leads", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        const casesResponse = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        const ongoingCases = casesResponse.data
          .filter((c) => c.status === "ONGOING")
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((c) => ({ caseNo: c.caseNo, caseName: c.caseName }));

        const pendingLeadReturns = [];
        leadsResponse.data.forEach((lead) => {
          let officerStatus = null;
          if (lead.assignedTo.assignees.includes(signedInOfficer)) {
            officerStatus = lead.assignedTo.lRStatus;
          }
          if (lead.assignedBy.assignee === signedInOfficer) {
            officerStatus = lead.assignedBy.lRStatus;
          }
          if (
            officerStatus === "Pending" &&
            ongoingCases.some((c) => c.caseNo === lead.caseNo && c.caseName === lead.caseName)
          ) {
            pendingLeadReturns.push({
              id: lead.leadNo,
              description: lead.description,
              caseName: lead.caseName,
              caseNo: lead.caseNo,
            });
          }
        });

        setLeads((prev) => ({ ...prev, pendingLeadReturns }));
      } catch (error) {
        console.error("Error fetching pending lead returns:", error.response?.data || error);
      }
    };

    fetchPendingLeadReturns();
  }, [signedInOfficer]);

  // Fetch all leads assigned to the signed-in officer
  useEffect(() => {
    const fetchPendingLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. User is not authenticated.");
          return;
        }

        const leadsResponse = await api.get("/api/lead/assignedTo-leads", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        const casesResponse = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        const ongoingCases = casesResponse.data
          .filter((c) => c.status === "ONGOING")
          .map((c) => ({ caseNo: c.caseNo, caseName: c.caseName }));

        const allOfficerLeads = leadsResponse.data
          .filter(
            (lead) =>
              Array.isArray(lead.assignedTo) &&
              lead.assignedTo.some((o) =>
                signedInUserId && o.userId
                  ? String(o.userId) === signedInUserId
                  : o.username === signedInOfficer
              ) &&
              ongoingCases.some((c) => c.caseNo === lead.caseNo)
          )
          .map((lead) => ({
            id: lead.leadNo,
            description: lead.description,
            dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
            priority: lead.priority || "Medium",
            flags: lead.associatedFlags || [],
            assignedOfficers: (lead.assignedTo || []).map((o) => o.username),
            leadStatus: lead.leadStatus,
            caseName: lead.caseName,
            caseNo: lead.caseNo,
          }));

        const pendingLeads = allOfficerLeads.filter((lead) => lead.leadStatus === "Pending");
        // Only update pendingLeads here; assignedLeads is managed by fetchAssignedLeads
        setLeads((prev) => ({ ...prev, pendingLeads }));
      } catch (error) {
        console.error("Error fetching assigned leads:", error.response?.data || error);
      }
    };

    fetchPendingLeads();
  }, [signedInOfficer]);

  // Fetch lead returns that are "In Review" (for CM to review); polls every 15s
  useEffect(() => {
    const fetchLeadReturnsForReview = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. User is not authenticated.");
          return;
        }

        const { data: serverLeadReturns } = await api.get("/api/lead/lead-returnforreview", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        const { data: allCases } = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        const ongoingSet = new Set(
          allCases.filter((c) => c.status === "ONGOING").map((c) => `${c.caseNo}||${c.caseName}`)
        );

        const mappedForReview = serverLeadReturns
          .filter((lead) => ongoingSet.has(`${lead.caseNo}||${lead.caseName}`))
          .map((lead) => ({
            id: lead.leadNo,
            description: lead.description,
            caseName: lead.caseName,
            caseNo: lead.caseNo,
          }));

        setLeads((prev) => ({ ...prev, pendingLeadReturns: mappedForReview }));
      } catch (err) {
        console.error("Error fetching lead returns for review:", err.response?.data || err);
      }
    };

    fetchLeadReturnsForReview();
    const intervalId = setInterval(fetchLeadReturnsForReview, 15000);
    return () => clearInterval(intervalId);
  }, [signedInOfficer]);

  // Fetch leads with status "Assigned" for the signed-in officer; polls every 15s
  useEffect(() => {
    const fetchAssignedLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. User is not authenticated.");
          return;
        }

        const { data: serverLeads } = await api.get("/api/lead/assigned-only", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        const { data: allCases } = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        const ongoingSet = new Set(
          allCases.filter((c) => c.status === "ONGOING").map((c) => `${c.caseNo}||${c.caseName}`)
        );

        const mappedAssignedLeads = serverLeads
          .filter((lead) => ongoingSet.has(`${lead.caseNo}||${lead.caseName}`))
          .map((lead) => ({
            id: lead.leadNo,
            description: lead.description,
            caseName: lead.caseName,
            caseNo: lead.caseNo,
            assignedOfficers: lead.assignedTo.map((o) => o.username),
            dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
            priority: lead.priority || "Medium",
            flags: lead.associatedFlags || [],
            leadStatus: lead.leadStatus,
          }));

        setLeads((prev) => ({ ...prev, assignedLeads: mappedAssignedLeads }));
      } catch (err) {
        console.error("Error fetching assigned-only leads:", err.response?.data || err);
      }
    };

    fetchAssignedLeads();
    const intervalId = setInterval(fetchAssignedLeads, 15000);
    return () => clearInterval(intervalId);
  }, [signedInOfficer]);

  // Navigate to lead review page with role resolved from API
  const handleViewAssignedLead = async (lead) => {
    let role = "Investigator";
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const caseRes = await api.get(`/api/cases/${lead.caseNo}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (caseRes.data.caseManager === signedInOfficer) {
        role = "Case Manager";
      } else if (
        Array.isArray(caseRes.data.investigators) &&
        caseRes.data.investigators.includes(signedInOfficer)
      ) {
        role = "Investigator";
      }
    } catch (err) {
      console.error("Failed to fetch case role:", err);
    }

    // Look up _id from the cases already in state so LeadReview can build its API URL
    const matchedCase = cases.find((c) => c.id === lead.caseNo);
    const caseDetails = { _id: matchedCase?._id, caseNo: lead.caseNo, caseName: lead.caseName, role };
    setSelectedCase(caseDetails);
    setSelectedLead({ leadNo: lead.id, leadName: lead.description });
    localStorage.setItem("role", role);
    localStorage.setItem("selectedCase", JSON.stringify(caseDetails));
    navigate("/LeadReview", {
      state: { caseDetails, leadId: lead.id, leadDescription: lead.description },
    });
  };

  // Navigate to case management page based on user role
  const handleCaseClick = (caseDetails) => {
    const caseObj = {
      _id: caseDetails._id,
      caseNo: caseDetails.id,
      caseName: caseDetails.title,
      role: caseDetails.role,
    };
    setSelectedCase(caseObj);

    if (caseDetails.role === "Investigator" || caseDetails.role === "Read Only") {
      localStorage.setItem("role", caseDetails.role);
      navigate("/Investigator", { state: { caseDetails } });
    } else if (
      caseDetails.role === "Case Manager" ||
      caseDetails.role === "Detective Supervisor"
    ) {
      localStorage.setItem("role", "Case Manager");
      navigate("/CasePageManager", { state: { caseDetails } });
    }
  };

  // Navigate to lead return instruction page with role resolved from API
  const handleLRClick = async (lead) => {
    let role = localStorage.getItem("role") || "";

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const { data } = await api.get(`/api/cases/${lead.caseNo}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const matchByIdOrName = (u) =>
        u && (signedInUserId && (u._id || u.id || u.userId)
          ? String(u._id || u.id || u.userId) === signedInUserId
          : (u.username === signedInOfficer || u === signedInOfficer));

      const isSupervisor = matchByIdOrName(data.detectiveSupervisor) ||
        data.detectiveSupervisor === signedInOfficer;
      const isCM =
        Array.isArray(data.caseManagers) && data.caseManagers.some(matchByIdOrName);
      const isInv =
        Array.isArray(data.investigators) && data.investigators.some(matchByIdOrName);

      if (isSupervisor) role = "Detective Supervisor";
      else if (isCM) role = "Case Manager";
      else if (isInv) role = "Investigator";
    } catch (err) {
      console.error("Failed to fetch case role:", err);
    }

    const matchedCase = cases.find((c) => c.id === lead.caseNo);
    const caseDetails = { _id: matchedCase?._id, caseNo: lead.caseNo, caseName: lead.caseName, role };
    const leadDetails = { leadNo: lead.id, leadName: lead.description };
    setSelectedCase(caseDetails);
    setSelectedLead(leadDetails);
    localStorage.setItem("role", role);
    localStorage.setItem("selectedCase", JSON.stringify(caseDetails));
    navigate("/LRInstruction", { state: { caseDetails, leadDetails } });
  };

  // Close a case via API and remove it from local state
  const handleCloseCase = async (caseNo) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/api/cases/${encodeURIComponent(caseNo)}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await api.put(
        `/api/notifications/close/${encodeURIComponent(caseNo)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCases((prev) => prev.filter((c) => c.id !== caseNo));
    } catch (err) {
      console.error("Failed to close case:", err);
      alert("Error closing case. See console for details.");
    }
  };

  // Accept an assigned lead (moves it to pendingLeads)
  const acceptLead = (leadId) => {
    const leadToAccept = leads.assignedLeads.find((lead) => lead.id === leadId);
    if (!leadToAccept) return;

    const newPendingLead = {
      ...leadToAccept,
      flags: leadToAccept.flags || [],
      assignedOfficers: leadToAccept.assignedOfficers || ["Unassigned"],
    };

    setLeads((prev) => ({
      ...prev,
      assignedLeads: prev.assignedLeads.filter((lead) => lead.id !== leadId),
      pendingLeads: [...prev.pendingLeads, newPendingLead],
    }));
  };

  // Add a newly created case to local state (avoids duplicates)
  const addCase = (serverCase) => {
    if (serverCase.status !== "ONGOING") return;
    // Admins and Detective Supervisors see all cases
    if (isAdmin || treatAsDS) {
      const roleForMap = isAdmin ? ROLES.ADMIN : ROLES.DETECTIVE_SUPERVISOR;
      const mapped = mapCaseForOfficer(serverCase, signedInOfficer, signedInUserId, roleForMap);
      setCases((prev) => [mapped, ...prev.filter((c) => c.id !== mapped.id)]);
      return;
    }
    // Other roles only see cases they are assigned to
    const name = signedInOfficer?.toLowerCase?.() ?? "";
    const uid  = signedInUserId ?? "";
    const matchUser = (u) =>
      u &&
      (uid
        ? String(u._id || u.id || "") === uid
        : u.username?.toLowerCase() === name || u.displayName?.toLowerCase() === name);
    const isAssigned =
      (serverCase.detectiveSupervisorUserId && matchUser(serverCase.detectiveSupervisorUserId)) ||
      (Array.isArray(serverCase.caseManagerUserIds) && serverCase.caseManagerUserIds.some(matchUser)) ||
      (Array.isArray(serverCase.investigatorUserIds) && serverCase.investigatorUserIds.some(matchUser));
    if (!isAssigned) return;
    const mapped = mapCaseForOfficer(serverCase, signedInOfficer, signedInUserId);
    setCases((prev) => [mapped, ...prev.filter((c) => c.id !== mapped.id)]);
  };

  // ─── Cases table: columns, filter/sort ───────────────────────────────────

  const columnWidths = { "Case No.": "6%", "Case Name": "17%", "Created At": "6%", "Case Managers": "13%" };
  const colKey = { "Case No.": "id", "Case Name": "title", "Created At": "createdAt", "Case Managers": "caseManagers" };

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filterConfig, setFilterConfig] = useState({ id: [], title: [], createdAt: [], role: [], caseManagers: [] });
  const [openFilter, setOpenFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState({});
  const [tempFilterSelections, setTempFilterSelections] = useState({});

  const distinctValues = useMemo(() => {
    const map = { id: new Set(), title: new Set(), createdAt: new Set(), role: new Set(), caseManagers: new Set() };
    cases.forEach((c) => {
      map.id.add(String(c.id));
      map.title.add(c.title);
      map.createdAt.add(formatDate(c.createdAt));
      map.role.add(c.role);
      if (Array.isArray(c.caseManagerNames)) {
        c.caseManagerNames.forEach((name) => { if (name) map.caseManagers.add(name); });
      }
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, [...s]]));
  }, [cases]);

  const sortedCases = useMemo(() => {
    const filtered = cases.filter((c) =>
      Object.entries(filterConfig).every(([field, sel]) => {
        if (!sel.length) return true;
        if (field === "caseManagers") {
          return sel.some((s) => (c.caseManagerNames || []).includes(s));
        }
        const cell = field === "createdAt" ? formatDate(c.createdAt) : String(c[field]);
        return sel.includes(cell);
      })
    );
    if (!sortConfig.key) return filtered;
    const PRIORITY_ORDER = { Low: 1, Medium: 2, High: 3 };
    return [...filtered].sort((a, b) => {
      let aV = a[sortConfig.key], bV = b[sortConfig.key];
      if (sortConfig.key === "priority") { aV = PRIORITY_ORDER[aV] || 0; bV = PRIORITY_ORDER[bV] || 0; }
      if (sortConfig.key === "id") { return sortConfig.direction === "asc" ? Number(aV) - Number(bV) : Number(bV) - Number(aV); }
      if (aV < bV) return sortConfig.direction === "asc" ? -1 : 1;
      if (aV > bV) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [cases, filterConfig, sortConfig]);

  const sortColumn = (dataKey, direction) => setSortConfig({ key: dataKey, direction });
  const handleFilterSearch = (dataKey, txt) => setFilterSearch((fs) => ({ ...fs, [dataKey]: txt }));
  const toggleSelectAll = (dataKey) => {
    const all = distinctValues[dataKey];
    setTempFilterSelections((ts) => ({
      ...ts,
      [dataKey]: ts[dataKey]?.length === all.length ? [] : [...all],
    }));
  };
  const allChecked = (dataKey) => {
    const sel = tempFilterSelections[dataKey] || [];
    return sel.length === (distinctValues[dataKey] || []).length;
  };
  const handleCheckboxToggle = (dataKey, v) =>
    setTempFilterSelections((ts) => {
      const sel = ts[dataKey] || [];
      return { ...ts, [dataKey]: sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v] };
    });
  const applyFilter = (dataKey) => {
    setFilterConfig((fc) => ({ ...fc, [dataKey]: tempFilterSelections[dataKey] || [] }));
    setOpenFilter(null);
  };

  // ─── Assigned leads table: columns, filter/sort ───────────────────────────

  const assignedColumns = ["Lead No.", "Lead Name", "Case Name", "Assigned Officers"];
  const assignedColKey = {
    "Lead No.": "id",
    "Lead Name": "description",
    "Case Name": "caseName",
    "Assigned Officers": "assignedOfficers",
  };
  const assignedColWidths = {
    "Lead No.": "6%",
    "Lead Name": "18%",
    "Case Name": "14%",
    "Assigned Officers": "12%",
  };

  const [assignedFilterConfig, setAssignedFilterConfig] = useState({
    id: [], description: [], caseName: [], assignedOfficers: [],
  });
  const [assignedSortConfig, setAssignedSortConfig] = useState({ key: null, direction: "asc" });
  const [openAssignedFilter, setOpenAssignedFilter] = useState(null);
  const [tempAssignedSelections, setTempAssignedSelections] = useState({});
  const [assignedFilterSearch, setAssignedFilterSearch] = useState({});

  const distinctAssigned = useMemo(() => {
    const map = { id: new Set(), description: new Set(), caseName: new Set(), assignedOfficers: new Set() };
    leads.assignedLeads.forEach((lead) => {
      map.id.add(String(lead.id));
      map.description.add(lead.description);
      map.caseName.add(lead.caseName);
      lead.assignedOfficers.forEach((o) => map.assignedOfficers.add(o));
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s)]));
  }, [leads.assignedLeads]);

  const sortedAssignedLeads = useMemo(() => {
    return leads.assignedLeads
      .filter((lead) =>
        Object.entries(assignedFilterConfig).every(([field, val]) => {
          if (!val.length) return true;
          const cell = lead[field];
          if (Array.isArray(cell)) return val.some((v) => cell.includes(v));
          return val.includes(String(cell));
        })
      )
      .sort((a, b) => {
        const { key, direction } = assignedSortConfig;
        if (!key) return 0;
        if (key === 'id') {
          const aNum = Number(a[key] ?? 0), bNum = Number(b[key] ?? 0);
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const aVal = Array.isArray(a[key]) ? a[key][0] : a[key];
        const bVal = Array.isArray(b[key]) ? b[key][0] : b[key];
        return direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
  }, [leads.assignedLeads, assignedFilterConfig, assignedSortConfig]);

  const handleAssignedFilterSearch = (dataKey, txt) =>
    setAssignedFilterSearch((fs) => ({ ...fs, [dataKey]: txt }));
  const assignedAllChecked = (dataKey) => {
    const sel = tempAssignedSelections[dataKey] || [];
    return sel.length === (distinctAssigned[dataKey] || []).length;
  };
  const toggleAssignedSelectAll = (dataKey) => {
    const all = distinctAssigned[dataKey] || [];
    setTempAssignedSelections((ts) => ({
      ...ts,
      [dataKey]: ts[dataKey]?.length === all.length ? [] : [...all],
    }));
  };
  const handleAssignedCheckboxToggle = (dataKey, v) =>
    setTempAssignedSelections((ts) => {
      const sel = ts[dataKey] || [];
      return { ...ts, [dataKey]: sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v] };
    });
  const applyAssignedFilter = (dataKey) =>
    setAssignedFilterConfig((fc) => ({ ...fc, [dataKey]: tempAssignedSelections[dataKey] || [] }));
  const sortAssignedColumn = (dataKey, direction) =>
    setAssignedSortConfig({ key: dataKey, direction });

  // ─── Pending lead returns table: filter/sort ──────────────────────────────

  const [pendingFilterConfig, setPendingFilterConfig] = useState({ id: [], description: [], caseName: [] });
  const [pendingSortConfig] = useState({ key: null, direction: "asc" });
  const [openPendingFilter, setOpenPendingFilter] = useState(null);
  const [tempPendingSelections, setTempPendingSelections] = useState({});
  const [pendingFilterSearch, setPendingFilterSearch] = useState({});

  const handlePendingFilterSearch = (dk, txt) =>
    setPendingFilterSearch((ps) => ({ ...ps, [dk]: txt }));

  const distinctPending = useMemo(() => {
    const map = { id: new Set(), description: new Set(), caseName: new Set() };
    leads.pendingLeadReturns.forEach((l) => {
      map.id.add(String(l.id));
      map.description.add(l.description);
      map.caseName.add(l.caseName);
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, [...s]]));
  }, [leads.pendingLeadReturns]);

  const sortedPendingReturns = useMemo(() => {
    let data = leads.pendingLeadReturns.filter((l) =>
      Object.entries(pendingFilterConfig).every(([key, sel]) => {
        if (!sel.length) return true;
        const cell = key === "id" ? String(l[key]) : l[key];
        if (Array.isArray(cell)) return cell.some((v) => sel.includes(v));
        return sel.includes(cell);
      })
    );
    const { key, direction } = pendingSortConfig;
    if (key) {
      data = data.slice().sort((a, b) => {
        if (key === 'id') {
          const aNum = Number(a[key] ?? 0), bNum = Number(b[key] ?? 0);
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const aV = Array.isArray(a[key]) ? a[key][0] : a[key];
        const bV = Array.isArray(b[key]) ? b[key][0] : b[key];
        return direction === "asc"
          ? String(aV).localeCompare(String(bV))
          : String(bV).localeCompare(String(aV));
      });
    }
    return data;
  }, [leads.pendingLeadReturns, pendingFilterConfig, pendingSortConfig]);

  // ─── Pagination ───────────────────────────────────────────────────────────

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCases.slice(start, start + pageSize);
  }, [sortedCases, currentPage, pageSize]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAssignedLeads.slice(start, start + pageSize);
  }, [sortedAssignedLeads, currentPage, pageSize]);

  const paginatedPendingReturns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPendingReturns.slice(start, start + pageSize);
  }, [sortedPendingReturns, currentPage, pageSize]);

  const totalEntries = useMemo(() => {
    if (activeTab === "cases") return sortedCases.length;
    if (activeTab === "assignedLeads") return sortedAssignedLeads.length;
    if (activeTab === "pendingLeadReturns") return sortedPendingReturns.length;
    return 0;
  }, [activeTab, sortedCases.length, sortedAssignedLeads.length, sortedPendingReturns.length]);

  // Reset to page 1 when filters, sort, or active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [assignedFilterConfig, assignedSortConfig, activeTab, filterConfig, sortConfig, pendingFilterConfig, pendingSortConfig]);

  return (
    <div className={styles["case-page-manager"]}>
      <Navbar />

      {/* Close case confirmation modal */}
      <AlertModal
        isOpen={closeConfirmOpen}
        title="Confirm Close"
        message={`Are you sure you want to close the case ${caseToClose.caseNo}: ${caseToClose.caseName}?`}
        onConfirm={() => {
          setCloseConfirmOpen(false);
          handleCloseCase(caseToClose.caseNo, caseToClose.caseName);
        }}
        onClose={() => setCloseConfirmOpen(false)}
      />

      <div className={styles["main-container"]}>
        <SideBar
          variant="home"
          activePage="HomePage"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onShowCaseSelector={setShowAddCase}
          isDS={treatAsDS}
        />

        {/* Add case slide-bar (shown when triggered from sidebar) */}
        {showAddCase && (
          <SlideBar
            isOpen={true}
            hideTrigger={true}
            onClose={() => setShowAddCase(false)}
            onAddCase={(newCase) => {
              addCase(newCase);
              setActiveTab("cases");
              setShowAddCase(false);
            }}
            buttonClass="custom-add-case-btn1"
          />
        )}

        <div className={styles["left-content"]}>
          <div className={styles["main-page-abovepart"]}>
            {/* Notifications view */}
            {!isCaseMgmt && (
              <NotificationCard acceptLead={acceptLead} signedInOfficer={signedInOfficer} />
            )}
          </div>

          {/* Case management tabs and tables */}
          {isCaseMgmt && (
            <>
              <div className={styles["main-page-belowpart"]}>
                {/* Tab navigation bar */}
                <div className={styles["stats-bar"]}>
                  <span
                    className={`${styles.hoverable} ${activeTab === "cases" ? styles.active : ""}`}
                    onClick={() => setActiveTab("cases")}
                  >
                    {isAdmin ? `All Ongoing Cases: ${cases.length}` : treatAsDS ? `All Ongoing Cases: ${cases.length}` : `My Ongoing Cases: ${cases.length}`}
                  </span>
                  {!isReadOnlyUser && (
                    <span
                      className={`${styles.hoverable} ${activeTab === "assignedLeads" ? styles.active : ""}`}
                      onClick={() => setActiveTab("assignedLeads")}
                    >
                      Assigned Leads: {leads.assignedLeads.length}
                    </span>
                  )}
                  {!isReadOnlyUser && (
                    <span
                      className={`${styles.hoverable} ${activeTab === "pendingLeadReturns" ? styles.active : ""}`}
                      onClick={() => setActiveTab("pendingLeadReturns")}
                    >
                      Lead Returns for Review: {leads.pendingLeadReturns.length}
                    </span>
                  )}
                </div>

                <div className={styles["content-section"]}>
                  {/* Ongoing cases table */}
                  {activeTab === "cases" && (
                    <div className={styles["table-scroll-container"]}>
                      <table className={styles["leads-table"]}>
                        <thead>
                          <tr>
                            {["Case No.", "Case Name", "Created At", "Case Managers"].map((col) => {
                              const dataKey = colKey[col];
                              return (
                                <th
                                  key={col}
                                  className={styles["column-header1"]}
                                  style={{ width: columnWidths[col], position: "relative" }}
                                >
                                  <div className={styles["header-title"]}>
                                    {col}
                                    <span>
                                      <button
                                        ref={(el) => (filterButtonRefs.current[dataKey] = el)}
                                        onClick={() =>
                                          setOpenFilter((prev) => (prev === dataKey ? null : dataKey))
                                        }
                                      >
                                        <img src="/Materials/fs.png" className={styles["icon-image"]} />
                                      </button>
                                      <Filter
                                        dataKey={dataKey}
                                        distinctValues={distinctValues}
                                        open={openFilter === dataKey}
                                        anchorRef={{ current: filterButtonRefs.current[dataKey] }}
                                        searchValue={filterSearch[dataKey] || ""}
                                        selections={tempFilterSelections[dataKey] || []}
                                        onSort={sortColumn}
                                        onSearch={handleFilterSearch}
                                        allChecked={allChecked}
                                        onToggleAll={toggleSelectAll}
                                        onToggleOne={handleCheckboxToggle}
                                        onApply={applyFilter}
                                        onCancel={() => setOpenFilter(null)}
                                      />
                                    </span>
                                  </div>
                                </th>
                              );
                            })}
                            <th style={{ width: "5%", textAlign: "left" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedCases.length > 0 ? (
                            paginatedCases.map((c) => (
                              <tr key={c.id}>
                                <td>{c.id}</td>
                                <td>{c.title}</td>
                                <td>{formatDate(c.createdAt)}</td>
                                <td>
                                  {c.caseManagers !== "—"
                                    ? c.caseManagers.split(", ").map((m, i) => (
                                        <div key={i}>{m}</div>
                                      ))
                                    : "—"}
                                </td>
                                <td style={{ width: "5%", textAlign: "left" }}>
                                  <div className={styles["btn-sec-HP"]}>
                                    <button
                                      className={styles["manage-btn"]}
                                      onClick={() => handleCaseClick(c)}
                                    >
                                      Manage
                                    </button>
                                    {/* {isAdmin && (
                                      <button
                                        className={styles["case-close-btn"]}
                                        onClick={() => {
                                          setCaseToClose({ caseNo: c.id, caseName: c.title });
                                          setCloseConfirmOpen(true);
                                        }}
                                      >
                                        Close
                                      </button>
                                    )} */}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} style={{ textAlign: "center", padding: "8px" }}>
                                No cases found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Assigned leads table */}
                  {activeTab === "assignedLeads" && (
                    <div className={styles["assigned-leads"]}>
                      <div className={styles["table-scroll-container"]}>
                        <table className={styles["leads-table"]}>
                          <thead>
                            <tr>
                              {assignedColumns.map((col) => {
                                const dataKey = assignedColKey[col];
                                return (
                                  <th key={col} style={{ width: assignedColWidths[col] }}>
                                    <div className={styles["header-title"]}>
                                      {col}
                                      <span>
                                        <button
                                          ref={(el) => (assignedFilterButtonRefs.current[dataKey] = el)}
                                          onClick={() =>
                                            setOpenAssignedFilter((prev) =>
                                              prev === dataKey ? null : dataKey
                                            )
                                          }
                                        >
                                          <img
                                            src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
                                            className={styles["icon-image"]}
                                          />
                                        </button>
                                        <Filter
                                          dataKey={dataKey}
                                          distinctValues={distinctAssigned}
                                          open={openAssignedFilter === dataKey}
                                          anchorRef={{ current: assignedFilterButtonRefs.current[dataKey] }}
                                          searchValue={assignedFilterSearch[dataKey] || ""}
                                          selections={tempAssignedSelections[dataKey] || []}
                                          onSort={sortAssignedColumn}
                                          onSearch={handleAssignedFilterSearch}
                                          allChecked={assignedAllChecked}
                                          onToggleAll={toggleAssignedSelectAll}
                                          onToggleOne={handleAssignedCheckboxToggle}
                                          onApply={() => {
                                            applyAssignedFilter(dataKey);
                                            setOpenAssignedFilter(null);
                                          }}
                                          onCancel={() => setOpenAssignedFilter(null)}
                                          numeric={dataKey === "id"}
                                        />
                                      </span>
                                    </div>
                                  </th>
                                );
                              })}
                              <th style={{ width: "6%", textAlign: "center" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedLeads.length > 0 ? (
                              paginatedLeads.map((lead) => (
                                <tr key={lead.id}>
                                  <td>{lead.id}</td>
                                  <td>{lead.description}</td>
                                  <td>{lead.caseName}</td>
                                  <td>{lead.assignedOfficers.map((u) => formatUserDisplay(u, userMap)).join(", ")}</td>
                                  <td style={{ textAlign: "center" }}>
                                    <button
                                      className={styles["view-btn1"]}
                                      onClick={() => handleViewAssignedLead(lead)}
                                    >
                                      Manage
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={assignedColumns.length + 1}
                                  style={{ textAlign: "center", padding: "8px" }}
                                >
                                  No Assigned Leads Available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Lead returns for review table */}
                  {activeTab === "pendingLeadReturns" && (
                    <div className={styles["pending-lead-returns"]}>
                      <div className={styles["table-scroll-container"]}>
                        <table className={styles["leads-table"]} style={{ minWidth: "1000px" }}>
                          <colgroup>
                            <col style={{ width: "6%" }} />
                            <col style={{ width: "28%" }} />
                            <col style={{ width: "24%" }} />
                            <col style={{ width: "8%" }} />
                          </colgroup>
                          <thead>
                            <tr>
                              {["Lead No.", "Lead Name", "Case Name"].map((col) => {
                                const keyMap = {
                                  "Lead No.": "id",
                                  "Lead Name": "description",
                                  "Case Name": "caseName",
                                };
                                const dataKey = keyMap[col];
                                return (
                                  <th key={col} className={styles["column-header1"]}>
                                    <div className={styles["header-title"]}>
                                      {col}
                                      <span ref={(el) => (popupPendingRefs.current[col] = el)}>
                                        <button
                                          ref={(el) => (pendingFilterButtonRefs.current[dataKey] = el)}
                                          onClick={() =>
                                            setOpenPendingFilter((prev) =>
                                              prev === dataKey ? null : dataKey
                                            )
                                          }
                                        >
                                          <img
                                            src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
                                            className={styles["icon-image"]}
                                          />
                                        </button>
                                        <Filter
                                          dataKey={dataKey}
                                          distinctValues={distinctPending}
                                          open={openPendingFilter === dataKey}
                                          anchorRef={{ current: pendingFilterButtonRefs.current[dataKey] }}
                                          searchValue={pendingFilterSearch[dataKey] || ""}
                                          selections={tempPendingSelections[dataKey] || []}
                                          onSearch={handlePendingFilterSearch}
                                          allChecked={(arr) =>
                                            (tempPendingSelections[arr] || []).length ===
                                            (distinctPending[arr] || []).length
                                          }
                                          onToggleAll={(dk) => {
                                            const all = distinctPending[dk] || [];
                                            setTempPendingSelections((ts) => ({
                                              ...ts,
                                              [dk]: ts[dk]?.length === all.length ? [] : [...all],
                                            }));
                                          }}
                                          onToggleOne={(dk, v) => {
                                            setTempPendingSelections((ts) => {
                                              const sel = ts[dk] || [];
                                              return {
                                                ...ts,
                                                [dk]: sel.includes(v)
                                                  ? sel.filter((x) => x !== v)
                                                  : [...sel, v],
                                              };
                                            });
                                          }}
                                          onApply={(dk) => {
                                            setPendingFilterConfig((fc) => ({
                                              ...fc,
                                              [dk]: tempPendingSelections[dk] || [],
                                            }));
                                            setOpenPendingFilter(null);
                                          }}
                                          onCancel={() => setOpenPendingFilter(null)}
                                          numeric={dataKey === "id"}
                                        />
                                      </span>
                                    </div>
                                  </th>
                                );
                              })}
                              <th style={{ width: "6%", textAlign: "center" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedPendingReturns.length > 0 ? (
                              paginatedPendingReturns.map((lead) => (
                                <tr key={lead.id}>
                                  <td>{lead.id}</td>
                                  <td>{lead.description}</td>
                                  <td>{lead.caseName}</td>
                                  <td style={{ textAlign: "center" }}>
                                    <button
                                      className={styles["continue-btn"]}
                                      onClick={() => handleLRClick(lead)}
                                    >
                                      Continue
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" style={{ textAlign: "center", padding: "8px" }}>
                                  No Pending Lead Returns Available
                                </td>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
