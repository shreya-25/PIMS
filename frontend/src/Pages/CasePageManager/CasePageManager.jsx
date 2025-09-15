import React, { useContext, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Searchbar from '../../components/Searchbar/Searchbar';
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import Button from '../../components/Button/Button';
import {SideBar } from "../../components/Sidebar/Sidebar";
import './CasePageManager.css'; // Custom CSS file for styling
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import Pagination from "../../components/Pagination/Pagination";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";
import api, { BASE_URL } from "../../api";
import usePresence from "../../hooks/usePresence";




export const CasePageManager = () => {

  
    const navigate = useNavigate();
    const location = useLocation();
    const { caseDetails } = location.state || {};
    const [sortField, setSortField] = useState(""); // Sorting field
    const [filterText, setFilterText] = useState(""); // Filter text
    const [filterPopupVisible, setFilterPopupVisible] = useState(false);
    const [filterSortPopupVisible, setFilterSortPopupVisible] = useState(false); // State for popup visibility
    const [selectedPriority, setSelectedPriority] = useState(""); // State for priority filter
    const [sortOrder, setSortOrder] = useState(""); // State for sort order
    const [remainingDaysFilter, setRemainingDaysFilter] = useState("");
    const [flagsFilter, setFlagsFilter] = useState("");
    const [assignedOfficersFilter, setAssignedOfficersFilter] = useState("");
    const [leadLogCount, setLeadLogCount] = useState(0);
    const [investigatorsDropdownOpen, setInvestigatorsDropdownOpen] = useState(false);
    const [caseManagersDropdownOpen, setCaseManagersDropdownOpen] = useState(false);
    const [detectiveSupervisorDropdownOpen, setDetectiveSupervisorDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
     const [alertOpen, setAlertOpen] = useState(false);
      const [alertMessage, setAlertMessage] = useState("");
      const [confirmOfficersOpen, setConfirmOfficersOpen] = useState(false);
      const RIGHT_ALIGN_COL = "Lead No.";

    const [showFilter, setShowFilter] = useState(false);
    const [showSort, setShowSort] = useState(false);
    const [pendingRoute, setPendingRoute]   = useState(null);

    const [summary, setSummary] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const saveTimer = useRef(null);
    const isFirstLoad = useRef(true);

    const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);
    const isSupervisor = selectedCase.role === "Detective Supervisor";

    const [allUsers, setAllUsers] = useState([]);
    const [selectedInvestigators, setSelectedInvestigators] = useState([]);
    const [selectedCaseManagers,    setSelectedCaseManagers]    = useState([]);
    const [selectedDetectiveSupervisor, setSelectedDetectiveSupervisor] = useState("");
    const [caseStatus, setCaseStatus] = useState("");
const [caseUpdatedAt, setCaseUpdatedAt] = useState(null);

     const dsRef = useRef(null);
const cmRef = useRef(null);
const invRef = useRef(null);
const [isCaseSummaryOpen, setIsCaseSummaryOpen] = useState(true);
const [isCaseTeamOpen, setIsCaseTeamOpen] = useState(false);


  useEffect(() => {
  function handleClickOutside(e) {
    if (dsRef.current && !dsRef.current.contains(e.target)) {
      setDetectiveSupervisorDropdownOpen(false);
    }
    if (cmRef.current && !cmRef.current.contains(e.target)) {
      setCaseManagersDropdownOpen(false);
    }
    if (invRef.current && !invRef.current.contains(e.target)) {
      setInvestigatorsDropdownOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);




    const [activeTab, setActiveTab] = useState("allLeads"); // Default to All Leads tab
    const handleViewAssignedLead = (lead) => {
    };
    const handleCaseClick = (caseDetails) => {
      navigate("/CasePageManager", { state: { caseDetails } }); // Pass case details via state
    };
    const [team, setTeam] = useState({
      detectiveSupervisor: [],
      caseManagers: [],
      investigators: []
    });

    const openConfirmOfficers = () => {
  // 4) if no case managers, block
  if (selectedCaseManagers.length === 0) {
    setAlertMessage("You must assign at least one Case Manager.");
    setAlertOpen(true);
    return;
  }
  setConfirmOfficersOpen(true);
};
const closeConfirmOfficers = () => setConfirmOfficersOpen(false);
const handleConfirmOfficers = () => {
  saveInvestigators();
  closeConfirmOfficers();
};
    useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/users/usernames", {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Assume data.users is an array of { username, firstName, lastName, role, … }
        setAllUsers(data.users || []);
      } catch (err) {
        console.error("Could not load user list for investigators:", err);
      }
    }
      fetchUsers();
    }, []);

    useEffect(() => {
      if (!selectedCase?.caseNo) return;
      api.get(`/api/cases/${selectedCase.caseNo}/team`)
        .then(({ data }) => setTeam(data))
        .catch(console.error);
    }, [selectedCase.caseNo]);


    useEffect(() => {
        if (team.investigators && Array.isArray(team.investigators)) {
          setSelectedInvestigators(team.investigators);
        }
        if (team.caseManagers && Array.isArray(team.caseManagers)) {
          setSelectedCaseManagers(team.caseManagers);
        }
         if (team.detectiveSupervisor) {
          setSelectedDetectiveSupervisor(team.detectiveSupervisor);
        }
    }, [team.investigators , team.caseManagers , team.detectiveSupervisor]);

    console.log("selectedLead", selectedLead);
  
    const handleNavigation = (route) => {
      navigate(route); // Navigate to respective page
    };

    const [showSelectModal, setShowSelectModal] = useState(false);

    const handleNavigateToLeadReturn = () => {
      // if (!leads.pendingLeadReturns.length) {
      //   alert("No lead returns available to continue.");
      //   return;
      // }
      setShowSelectModal(true);
    };

    const handleSelectLead = (lead) => {
      setSelectedLead({
        leadNo: lead.leadNo,
        leadName: lead.description,
        caseName: lead.caseName,
        caseNo: lead.caseNo,
      });

      setShowSelectModal(false);
      navigate(pendingRoute, {
        state: {
          caseDetails: selectedCase,
          leadDetails: lead
        }
      });
      
      setPendingRoute(null);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const totalPages = 10; // Change based on your data
    const totalEntries = 100;

    const signedInOfficer = localStorage.getItem("loggedInUser");

     const [confirmConfig, setConfirmConfig] = useState({
        isOpen:    false,
        lead:    null,
      });
      const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title:  "",
        message:"",
      });

      const handleConfirmAccept = () => {
    acceptLead(confirmConfig.lead.id, confirmConfig.lead.description);
    closeConfirm();
  };

    const openConfirm  = (lead) => setConfirmConfig({ isOpen: true, lead });
  const closeConfirm = ()      => setConfirmConfig({ isOpen: false, lead: null });


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
          summary: lead.summary
      });
    
      // Navigate to Lead Review Page
      navigate("/LRInstruction", { state: { leadDetails: lead, caseDetails: selectedCase } });
    };

    const PRESENCE_BASE = "/api/presence";


  const [presenceOthers, setPresenceOthers] = useState([]);
const beatTimerRef = useRef(null);

// prove it’s mounted & which baseURL we use
useEffect(() => {
  console.log("[presence] mounted; baseURL=", api?.defaults?.baseURL, "PRESENCE_BASE=", PRESENCE_BASE);
}, []);

useEffect(() => {
  const caseNo   = selectedCase?.caseNo ?? caseDetails?.caseNo;
  const caseName = selectedCase?.caseName ?? caseDetails?.caseName;
  if (!caseNo || !caseName) {
    console.log("[presence] skipped – missing caseNo/caseName", { caseNo, caseName });
    return;
  }

  const payload = { caseNo: String(caseNo), caseName, page: "CasePageManager" };
  let cancelled = false;

  const beat = async () => {
    try {
      const { data } = await api.post(`${PRESENCE_BASE}/heartbeat`, payload);
      if (!cancelled) setPresenceOthers(Array.isArray(data?.others) ? data.others : []);
      console.log("[presence] heartbeat ok:", data);
    } catch (e) {
      console.warn("[presence] heartbeat failed:", e?.response?.status, e?.response?.data);
      setPresenceOthers([]);
    }
  };

  beat();                          // immediate
  beatTimerRef.current = setInterval(beat, 10000);

  return () => {
    cancelled = true;
    clearInterval(beatTimerRef.current);
    api.post(`${PRESENCE_BASE}/leave`, payload).catch(() => {});
  };
}, [
  selectedCase?.caseNo, selectedCase?.caseName,
  caseDetails?.caseNo,  caseDetails?.caseName
]);

    
    // Handler to accept the assigned lead
    const handleAcceptAssignedLead = (lead) => {
      const confirmAccept = window.confirm(
        `Are you sure you want to accept this lead?`
      );
      if (confirmAccept) {
        // Remove lead from assignedLeads and add it to pendingLeads
        setLeads((prevLeads) => {
          const updatedAssignedLeads = prevLeads.assignedLeads.filter(
            (l) => l.leadNo !== lead.leadNo
          );
          const updatedPendingLeads = [...prevLeads.pendingLeads, lead];
          return {
            ...prevLeads,
            assignedLeads: updatedAssignedLeads,
            pendingLeads: updatedPendingLeads,
          };
        });
      }
    };
    console.log("SelectedCase", selectedCase);
  

  const acceptLead = async (leadNo, description) => {
    console.log("Accept button clicked for lead:", leadNo);
  
    try {
      const token = localStorage.getItem("token");
      const url = `/api/lead/${leadNo}/${encodeURIComponent(description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`;
      console.log("PUT request URL:", url);
  
      // Call the database update endpoint via a PUT request.
      const response = await api.put(
        url,
        {}, // No payload; the backend sets the status to "Pending" automatically.
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("PUT request succeeded. Response data:", response.data);
  
      // Build a new pending lead object from the function parameters and default values.
      const newPendingLead = {
        id: leadNo,
        leadNo: leadNo,
        description: description,
        leadStatus: "Accepted",
        dueDate: "NA",          // Default due date (adjust if needed)
        priority: "NA",         // Default priority (adjust if needed)
        flags: [],              // Defaults to empty array
        assignedOfficers: ["Unassigned"], // Default assigned officer
      };
  
      // Update your local state: remove the accepted lead from assignedLeads and add it to pendingLeads.
      setLeads((prevLeads) => {
        const updatedAssignedLeads = prevLeads.assignedLeads.filter(
          (lead) => Number(lead.id) !== Number(leadNo)
        );
        const updatedPendingLeads = [...prevLeads.pendingLeads, newPendingLead];
        console.log(
          "Updating leads state. New assignedLeads length:",
          updatedAssignedLeads.length,
          "New pendingLeads length:",
          updatedPendingLeads.length
        );
        return {
          ...prevLeads,
          assignedLeads: updatedAssignedLeads,
          pendingLeads: updatedPendingLeads,
        };
      });
      // await fetchLeadsForCase();
    } catch (error) {
      console.error("Error updating lead status:", error.response?.data || error);
      // alert("Failed to accept lead.");
      setAlertMessage("Failed to accept lead.");
      setAlertOpen(true);
    }
  };
  
    
    
      
    const [leads, setLeads] = useState({
      assignedLeads: [],
      pendingLeads: [],
      pendingLeadReturns: [],
      allLeads: [],
 } );

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
      summary: lead.summary
  });
  setLeadStatus(lead.leadStatus);  

  // Navigate to Lead Review Page
  navigate("/leadReview", { state: { leadDetails: lead, caseDetails: selectedCase } });
};

  const token = localStorage.getItem('token') || '';

  
  useEffect(() => {
    const fetchLeadsForCase = async () => {
      if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
  
      try {
        const token = localStorage.getItem("token");
        const response = await api.get(
          `/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        const data = response.data;
        console.log("✅ Fetched Leads Data:", data);
  
        const leadsArray = Array.isArray(data) ? data : [];
  
        const filteredLeadsArray = leadsArray.filter((lead) => {

           if (isSupervisor) {
    return true;
  }

          if (
            lead.accessLevel === "Only Case Manager and Assignees" &&
            !lead.assignedTo?.includes(signedInOfficer) &&
            lead.assignedBy !== signedInOfficer
          ) {
            return false;
          }
          return true;
        });
  
              const filtered = filteredLeadsArray.filter(
  lead => lead.assignedTo?.some(o => o.username === signedInOfficer)
);

    //     const mapLead = (lead) => ({
    //        id: Number(lead.leadNo), 
    //       description: lead.description,
    //       summary: lead.summary,
    //       dueDate: lead.dueDate
    //         ? new Date(lead.dueDate).toISOString().split("T")[0]
    //         : "N/A",
    //       priority: lead.priority || "Medium",
    //       flags: Array.isArray(lead.associatedFlags)
    //         ? lead.associatedFlags
    //         : [],
    //       assignedOfficers: Array.isArray(lead.assignedTo)
    // ? lead.assignedTo.map(a => a.username)
    // : [],
    //       leadStatus: lead.leadStatus,
    //       caseName: lead.caseName,
    //       caseNo: String(lead.caseNo),
    //     });

    const mapLead = (lead) => {
  const activeAssignees = Array.isArray(lead.assignedTo)
    ? lead.assignedTo
        .filter(a => a && a.status !== "declined")
        .map(a => a.username)
    : [];

  return {
    id: Number(lead.leadNo),
    description: lead.description,
    summary: lead.summary,
    dueDate: lead.dueDate
      ? new Date(lead.dueDate).toISOString().split("T")[0]
      : "",
    priority: lead.priority || "Medium",
    flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [],
    assignedOfficers: activeAssignees,
    leadStatus: lead.leadStatus,
    caseName: lead.caseName,
    caseNo: String(lead.caseNo),
  };
};

  
        const assignedLeads = filteredLeadsArray
          .filter((lead) => lead.leadStatus === "Assigned")
          .map(mapLead);
  
        // const pendingLeads = filteredLeadsArray
        //   .filter((lead) => lead.leadStatus === "Accepted")
        //   .map(mapLead);
        const pendingLeadsRaw = filteredLeadsArray
  .filter((lead) => lead.leadStatus === "To Reassign" || lead.leadStatus === "Rejected")
  .map(mapLead);

  //       const pendingLeads = filteredLeadsArray
  // .filter((lead) => lead.leadStatus === "To Reassign" || lead.leadStatus === "Rejected")
  // .map(mapLead);
  const pendingLeads = pendingLeadsRaw.sort((a, b) => {
  const aNone = (a.assignedOfficers?.length ?? 0) === 0 ? 0 : 1;
  const bNone = (b.assignedOfficers?.length ?? 0) === 0 ? 0 : 1;
  if (aNone !== bNone) return aNone - bNone;      // “None” on top
  return Number(b.id) - Number(a.id);             // then newest first
});

  
        const LRInReview = filteredLeadsArray
          .filter((lead) => lead.leadStatus === "In Review")
          .map(mapLead);

        const allLeads = filteredLeadsArray
          .map(mapLead)
          .sort((a, b) => Number(b.id) - Number(a.id));
  
        console.log("✅ Assigned Leads:", assignedLeads);
        console.log("✅ Pending Leads:", pendingLeads);
        console.log("✅ Lead Returns In Review:", LRInReview);
  
        setLeads((prev) => ({
          ...prev,
          allLeads,
          assignedLeads,
          pendingLeads,
          pendingLeadReturns: LRInReview,
        }));
      } catch (error) {
        console.error("❌ Error fetching leads:", error.message);
      }
    };
  
    fetchLeadsForCase();

    const intervalId = setInterval(fetchLeadsForCase, 15_000);

  // 4) cleanup on unmount / deps change
  return () => clearInterval(intervalId);
}, [
  selectedCase?.caseNo,
  selectedCase?.caseName,
  signedInOfficer
]);
  
  

    const handleTabClick = (tab) => {
          setActiveTab(tab);
  };

    const handleGenerateLead = () => {
        navigate('/createlead', { state: { caseDetails } }); // Pass caseDetails as state
    };

  const addPendingLead = (newLead) => {
    setLeads((prevLeads) => ({
      ...prevLeads,
      pendingLeads: [
        ...prevLeads.pendingLeads,
        {
          ...newLead,
          dueDate: newLead.dueDate || "12/31/2024", // Default due date
          priority: newLead.priority || "Medium", // Default priority
          flags: newLead.flags || [],
          assignedOfficers: newLead.assignedOfficers || ["Unassigned"], // Default officer
        },
      ],
    }));
  };

 

// const saveInvestigators = async (overrideInvestigators) => {
//   try {
//     setLoading(true);
//     setError("");

//     const token = localStorage.getItem("token");
//      // 1) Figure out who’s being removed
//     const prevSupervisor    = team.detectiveSupervisor;
//     const prevManagers      = team.caseManagers    || [];
//     const prevInvestigators = team.investigators   || [];

//     const investigatorsToSave = overrideInvestigators || selectedInvestigators;
//      const cmToSave = overrideInvestigators || selectedInvestigators;


//     const removed = [
//       // Supervisor
//       ...(prevSupervisor && prevSupervisor !== selectedDetectiveSupervisor
//         ? [{ username: prevSupervisor, role: "Detective Supervisor" }]
//         : []),
//       // Case Managers
//       ...prevManagers
//         .filter(u => !selectedCaseManagers.includes(u))
//         .map(u => ({ username: u, role: "Case Manager" })),
//       // Investigators
//       ...prevInvestigators
//         .filter(u => !selectedInvestigators.includes(u))
//         .map(u => ({ username: u, role: "Investigator" })),
//     ];

//     // 2) Gather all incomplete leads (assigned or accepted)
//     const incompleteLeads = [
//       ...leads.assignedLeads,
//       ...leads.pendingLeads
//     ];

//     // 3) Block any removal-candidate who still appears on an incomplete lead
//     const blocked = removed.filter(o =>
//       incompleteLeads.some(lead =>
//         (lead.assignedOfficers || []).includes(o.username)
//       )
//     );

//     if (blocked.length) {
//       setAlertMessage(
//         "Cannot remove " +
//         blocked.map(b => `${b.role} ${b.username}`).join(", ") +
//         " because they have open leads."
//       );
//       setAlertOpen(true);
//       return;
//     }

//     // 1) Build the full officers array for the CASE
//     const officers = [
//       { name: selectedDetectiveSupervisor, role: "Detective Supervisor", status: "accepted" },
//        ...selectedCaseManagers.map(username=>({
//         name: username,
//         role: "Case Manager",
//         status: "accepted"
//       })),
//       ...investigatorsToSave
//       .map(username => ({
//         name: username,
//         role: "Investigator",
//         status: "pending"
//       }))
//     ];

//     // 2) Determine who’s brand-new

//     const newlyAddedSupervisor   = (selectedDetectiveSupervisor && selectedDetectiveSupervisor !== prevSupervisor)
//       ? [selectedDetectiveSupervisor]
//       : [];

//     const newlyAddedManagers = selectedCaseManagers
//       .filter(u => !prevManagers.includes(u));

//     const newlyAddedInvestigators = selectedInvestigators
//       .filter(u => !prevInvestigators.includes(u));

//     const newlyAdded = [
//       // Supervisor
//       ...(selectedDetectiveSupervisor && selectedDetectiveSupervisor !== team.detectiveSupervisor
//         ? [{ username: selectedDetectiveSupervisor, role: "Detective Supervisor" }]
//         : []),

//       // Case Managers
//       ...selectedCaseManagers
//         .filter(u => !team.caseManagers.includes(u))
//         .map(u => ({ username: u, role: "Case Manager" })),

//       // Investigators
//       ...selectedInvestigators
//         .filter(u => !team.investigators.includes(u))
//         .map(u => ({ username: u, role: "Investigator" }))
//     ];

//     // 3) PUT to the case‐officers endpoint
//     await api.put(
//       `/api/cases/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/officers`,
//       { officers },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     // 4) Update local UI state
//       setTeam(t => ({
//        ...t,
//       detectiveSupervisor: selectedDetectiveSupervisor,
//       caseManagers:    [...selectedCaseManagers],
//       investigators:   [...investigatorsToSave]
//      }));

//     // 5) Notify only the newly added
//     if (newlyAdded.length) {
//       const payload = {
//         notificationId: Date.now().toString(),
//         assignedBy:     signedInOfficer,
//         assignedTo:     newlyAdded.map(person => ({
//           username: person.username,
//           role:     person.role,
//           status:   "pending",
//           unread:   true
//         })),
//         action1:        "assigned you to a new case",
//         post1:          `${selectedCase.caseNo}: ${selectedCase.caseName}`,
//         caseNo:         selectedCase.caseNo,
//         caseName:       selectedCase.caseName,
//         caseStatus:     selectedCase.caseStatus || "Open",
//         type:           "Case"
//       };

//       try {
//         await api.post(
//           "/api/notifications",
//           payload,
//           {
//             headers: {
//               "Content-Type":  "application/json",
//               Authorization:   `Bearer ${token}`
//             }
//           }
//         );
//         console.log("✅ Notified:", newlyAdded);
//       } catch (notifErr) {
//         console.error("❌ Notification error:", notifErr.response?.data || notifErr);
//       }
//     }

//     // alert("Officers updated on this case successfully!");
//     setAlertMessage("Officers updated on this case successfully!");
//     setAlertOpen(true);
//   } catch (err) {
//     console.error("Save failed:", err);
//     setError("Failed to save changes.");
//   } finally {
//     setLoading(false);
//   }
// };

const saveInvestigators = async (
  overrideInvestigators = selectedInvestigators,
  overrideManagers = selectedCaseManagers,
  overrideSupervisor = selectedDetectiveSupervisor
) => {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    // 1) Previous team data
    const prevSupervisor = team.detectiveSupervisor;
    const prevManagers = team.caseManagers || [];
    const prevInvestigators = team.investigators || [];

    // 2) Removal check (only remove if no open leads)
    const removed = [
      ...(prevSupervisor && prevSupervisor !== overrideSupervisor
        ? [{ username: prevSupervisor, role: "Detective Supervisor" }]
        : []),
      ...prevManagers
        .filter(u => !overrideManagers.includes(u))
        .map(u => ({ username: u, role: "Case Manager" })),
      ...prevInvestigators
        .filter(u => !overrideInvestigators.includes(u))
        .map(u => ({ username: u, role: "Investigator" })),
    ];

    const incompleteLeads = [...leads.assignedLeads, ...leads.pendingLeads];
    const blocked = removed.filter(o =>
      incompleteLeads.some(lead =>
        (lead.assignedOfficers || []).includes(o.username)
      )
    );

    if (blocked.length) {
      setAlertMessage(
        "Cannot remove " +
        blocked.map(b => `${b.role} ${b.username}`).join(", ") +
        " because they have open leads."
      );
      setAlertOpen(true);
      return;
    }

    // 3) Build full officers list
    const officers = [
      { name: overrideSupervisor, role: "Detective Supervisor", status: "accepted" },
      ...overrideManagers.map(username => ({
        name: username,
        role: "Case Manager",
        status: "accepted"
      })),
      ...overrideInvestigators.map(username => ({
        name: username,
        role: "Investigator",
        status: "pending"
      })),
    ];

    // 4) Identify newly added
    const newlyAdded = [
      ...(overrideSupervisor && overrideSupervisor !== prevSupervisor
        ? [{ username: overrideSupervisor, role: "Detective Supervisor" }]
        : []),
      ...overrideManagers
        .filter(u => !prevManagers.includes(u))
        .map(u => ({ username: u, role: "Case Manager" })),
      ...overrideInvestigators
        .filter(u => !prevInvestigators.includes(u))
        .map(u => ({ username: u, role: "Investigator" })),
    ];

    // 5) API update
    await api.put(
      `/api/cases/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/officers`,
      { officers },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 6) Update local UI state instantly
    setTeam({
      detectiveSupervisor: overrideSupervisor,
      caseManagers: [...overrideManagers],
      investigators: [...overrideInvestigators],
    });

    // 7) Send notifications for new adds
    if (newlyAdded.length) {
      await api.post(
        "/api/notifications",
        {
          notificationId: Date.now().toString(),
          assignedBy: signedInOfficer,
          assignedTo: newlyAdded.map(p => ({
            username: p.username,
            role: p.role,
            status: "pending",
            unread: true,
          })),
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
    setError("Failed to save changes.");
  } finally {
    setLoading(false);
  }
};

// put this near your other helpers
const fullNameFor = useCallback(
  (uname) => {
    const u = allUsers.find(x => x.username === uname);
    return u ? `${u.firstName} ${u.lastName}` : uname; // fallback to username
  },
  [allUsers]
);

// (optional) precompute once per render
const presenceNames = useMemo(
  () => presenceOthers.map(o =>
    o.fullName || o.name || fullNameFor(o.username)
  ),
  [presenceOthers, fullNameFor]
);

const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
const [leadDropdownOpen1, setLeadDropdownOpen1] = useState(true);


useEffect(() => {
    async function load() {
      if (!selectedCase?.caseNo) return;
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get(
          `/api/cases/case-summary/${selectedCase.caseNo}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSummary(data.caseSummary);
      } catch (err) {
        console.error('Failed to load summary', err);
      }
    }
    load();
  }, [selectedCase.caseNo]);

useEffect(() => {
    // skip the very first render (when we just loaded from server)
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    // clear any pending save
    clearTimeout(saveTimer.current);

    // if summary is empty or no case selected, don’t bother
    if (!selectedCase?.caseNo) return;

    // schedule a save
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        await api.put(
          '/api/cases/case-summary',
          {
            caseNo: selectedCase.caseNo,
            caseName: selectedCase.caseName,
            caseSummary: summary,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Save failed', err);
        setError('Save failed. Try again.');
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    // cleanup on unmount or before next change
    return () => clearTimeout(saveTimer.current);
  }, [summary, selectedCase.caseNo, selectedCase.caseName]);

  

  // Calculate remaining days from the due date
  const calculateRemainingDays = (dueDate) => {
     if (!dueDate) return "";
    const currentDate = new Date();
    const targetDate = new Date(dueDate);
    const timeDifference = targetDate - currentDate;
    return Math.max(0, Math.ceil(timeDifference / (1000 * 60 * 60 * 24))); // Return 0 if negative
  };
  
  const getUserByUsername = useCallback(
  (uname) => allUsers.find(u => u.username === uname),
  [allUsers]
);

// display "First Last (username)" if we have the user, else just the raw value
const displayName = (uname) => {
  const u = getUserByUsername(uname);
  return u ? `${u.firstName} ${u.lastName} (${u.username})` : (uname || "—");
};

// join multiple usernames as full names
const displayNames = (usernames = []) =>
  usernames.map(displayName).join(", ");

  // Sort leads
  const handleSort = (field, order) => {
    setSortField(`${field}-${order}`);
    setLeads((prevLeads) => ({
      ...prevLeads,
      pendingLeads: [...prevLeads.pendingLeads].sort((a, b) => {
        let comparison = 0;
  
        if (field === "remainingDays") {
          const remainingDaysA = Math.max(0, calculateRemainingDays(a.dueDate));
          const remainingDaysB = Math.max(0, calculateRemainingDays(b.dueDate));
          comparison = remainingDaysA - remainingDaysB;
        } else if (field === "priority") {
          const priorities = { High: 3, Medium: 2, Low: 1 };
          comparison = priorities[a[field]] - priorities[b[field]];
        } else {
          comparison = a[field]?.localeCompare(b[field]);
        }
  
        return order === "asc" ? comparison : -comparison;
      }),
    }));
  };

  const caseTeamStyles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "8px"
  },
  td: {
    padding: "8px",
    verticalAlign: "center",
  },
};

  
    // Continue a pending lead return
    const continueLead = (leadId) => {
        const leadToContinue = leads.pendingLeadReturns.find(
          (lead) => lead.id === leadId
        );
        if (!leadToContinue) return;
        setLeads((prevLeads) => ({
          ...prevLeads,
          pendingLeadReturns: prevLeads.pendingLeadReturns.filter(
            (lead) => lead.id !== leadId
          ),
          pendingLeads: [...prevLeads.pendingLeads, leadToContinue],
        }));
      };

      // Filter leads
  const handleFilter = (e) => {
    setFilterText(e.target.value);
  };

   // Define a constant with some predefined notes
  //  const [caseSummary, setCaseSummary] = useState(caseDetails?.caseSummary || defaultCaseSummary);
  
    const [caseSummary, setCaseSummary] = useState('');

   const [isEditing, setIsEditing] = useState(false); // Controls whether the textarea is editable
   useEffect(() => {
    const fetchCaseSummary = async () => {
      try {
        if (selectedCase && selectedCase.caseNo) {
          const token = localStorage.getItem("token");
          const response = await api.get(`/api/cases/summary/${selectedCase.caseNo}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Update case summary if data is received
          console.log("Response data:", response.data);
          if (response.data) {
            setCaseSummary(response.data.summary );
          }
        }
      } catch (error) {
        console.error("Error fetching case summary:", error);
      }
    };

    fetchCaseSummary();
  }, [selectedCase]);

  




   const handleCaseSummaryChange = (e) => {
       setCaseSummary(e.target.value);
   };

   // Toggle edit mode
   const handleEditClick = () => {
    setIsEditing(true);
   };

    // Save the edited text and disable editing
    const handleSaveClick = () => {
        setIsEditing(false);
        // You can add logic here to update the backend with the new summary if needed
    };
      const filtersConfig = [
        {
          name: "leadNumber",
          label: "Lead Number",
          options: ["45", "23", "14"],
        },
        {
          name: "leadName",
          label: "Lead Name",
          options: [
            "Collect Audio from Dispatcher",
            "Interview Mr. John",
            "Collect evidence from 63 Mudray Street",
          ],
        },
        {
          name: "dueDate",
          label: "Due Date",
          options: ["Officer 1", "Officer 2", "Officer 3"],
        },
        {
          name: "Priority",
          label: "Priority",
          options: ["High", "Medium", "Low"],
        },
        {
          name: "Flag",
          label: "Flag",
          options: ["Important"],
        },
        {
          name: "assignedOfficers",
          label: "Assigned Officers",
          options: ["Officer 1", "Officer 2", "Officer 3"],
        },
        {
          name: "daysLeft",
          label: "Days Left",
          options: ["1", "2", "3"],
        },
      ];
  
      const onShowCaseSelector = (route) => {
        navigate(route, { state: { caseDetails } });
    };

    useEffect(() => {
      // Scroll to the top when the component mounts
      window.scrollTo(0, 0);
    }, []); // Empty dependency array ensures it runs only once on mount



const handleFilterAllClick = col => {
  setOpenAllFilter(prev => prev===col ? null : col);
};

// Filter and sort for assigned leads- 
// ─── Assigned Leads filter/sort setup ──────────────────────────────────────
// columns + mapping
const assignedColumns   = ["Lead No.","Lead Name","Due Date","Priority","Days Left","Assigned Officers"];
const assignedColKey    = {
  "Lead No.":          "id",
  "Lead Name":         "description",
  "Due Date":          "dueDate",
  "Priority":          "priority",
  "Days Left":         "remainingDays",
  "Assigned Officers": "assignedOfficers",
};
const assignedColWidths = {
  "Lead No.":           "9%",
  "Lead Name":          "22%",
  // "Due Date":           "10%",
  "Priority":           "10%",
  // "Days Left":          "10%",
  "Assigned Officers":  "20%",
};

// refs + state
const popupAssignedRefs    = useRef({});
const [openAssignedFilter,    setOpenAssignedFilter]    = useState(null);
const [assignedFilterConfig,  setAssignedFilterConfig]  = useState({
  id:[], description:[], dueDate:[], priority:[], remainingDays:[], flags:[], assignedOfficers:[]
});
const [tempAssignedSelections,setTempAssignedSelections]= useState({});
const [assignedFilterSearch,  setAssignedFilterSearch]  = useState({});
const [assignedSortConfig,    setAssignedSortConfig]    = useState({ key:null, direction:'asc' });

// helpers
const handleAssignedFilterSearch = (dk, txt) =>
  setAssignedFilterSearch(fs => ({ ...fs, [dk]: txt }));

const assignedAllChecked = dk => {
  const sel = tempAssignedSelections[dk]||[];
  return sel.length === (distinctAssigned[dk]||[]).length;
};

const toggleAssignedSelectAll = dk => {
  const all = distinctAssigned[dk]||[];
  setTempAssignedSelections(ts => ({
    ...ts,
    [dk]: ts[dk]?.length===all.length ? [] : [...all]
  }));
};

const handleAssignedCheckboxToggle = (dk, v) =>
  setTempAssignedSelections(ts => {
    const sel = ts[dk]||[];
    return { ...ts,
      [dk]: sel.includes(v) ? sel.filter(x=>x!==v) : [...sel, v]
    };
  });

const applyAssignedFilter = dk =>
  setAssignedFilterConfig(fc => ({
    ...fc,
    [dk]: tempAssignedSelections[dk]||[]
  }));

// compute distinct values for each column
const distinctAssigned = useMemo(() => {
  const map = {
    id: new Set(), description: new Set(), dueDate: new Set(),
    priority: new Set(), remainingDays: new Set(),
    flags: new Set(), assignedOfficers: new Set()
  };
  leads.assignedLeads.forEach(lead => {
    map.id.add(String(lead.id));
    map.description.add(lead.description);
    map.dueDate.add(lead.dueDate);
    map.priority.add(lead.priority);
    map.remainingDays.add(String(calculateRemainingDays(lead.dueDate)));
    lead.flags.forEach(f => map.flags.add(f));
    lead.assignedOfficers.forEach(o => map.assignedOfficers.add(o));
  });
  return Object.fromEntries(
    Object.entries(map).map(([k,s])=>[k,Array.from(s)])
  );
}, [leads.assignedLeads]);

// apply filters then sort
const sortedAssignedLeads = useMemo(() => {
  let data = leads.assignedLeads.filter(lead =>
    Object.entries(assignedFilterConfig).every(([key,sel]) => {
      if (!sel.length) return true;
      let cell = lead[key];
      if (key==="remainingDays") cell = calculateRemainingDays(lead.dueDate);
      if (Array.isArray(cell)) return cell.some(v=>sel.includes(v));
      return sel.includes(String(cell));
    })
  );
  const { key, direction } = assignedSortConfig;
  if (key) {
    data = data.slice().sort((a,b) => {
      let aV = key==="remainingDays"
        ? calculateRemainingDays(a.dueDate)
        : Array.isArray(a[key]) ? a[key][0] : a[key];
      let bV = key==="remainingDays"
        ? calculateRemainingDays(b.dueDate)
        : Array.isArray(b[key]) ? b[key][0] : b[key];
      return direction==='asc'
        ? String(aV).localeCompare(String(bV))
        : String(bV).localeCompare(String(aV));
    });
  }
  return data;
}, [leads.assignedLeads, assignedFilterConfig, assignedSortConfig]);

//  Pending / Accepted Leads 

// ─── Pending Leads filter/sort setup ──────────────────────────────────────

// Columns + mapping
const pendingColumns   = [
  "Lead No.",
  "Lead Name",
  // "Due Date",
  "Priority",
  // "Days Left",
  "Assigned Officers"
];
const pendingColKey    = {
  "Lead No.":          "id",
  "Lead Name":         "description",
  "Due Date":          "dueDate",
  "Priority":          "priority",
  "Days Left":         "remainingDays",
  "Assigned Officers": "assignedOfficers",
};
const pendingColWidths = {
  "Lead No.":           "8%",
  "Lead Name":          "32%",
  // "Due Date":           "10%",
  "Priority":           "8%",
  // "Days Left":          "10%",
  "Assigned Officers":  "18%",
};

// Refs + state
const popupPendingRefs     = useRef({});
const [openPendingFilter,     setOpenPendingFilter]    = useState(null);
const [pendingFilterConfig,   setPendingFilterConfig]  = useState({
  id: [], description: [], dueDate: [], priority: [], remainingDays: [], flags: [], assignedOfficers: []
});
const [tempPendingSelections, setTempPendingSelections]= useState({});
const [pendingFilterSearch,   setPendingFilterSearch]  = useState({});
const [pendingSortConfig,     setPendingSortConfig]    = useState({ key:null, direction:'asc' });

// Helper functions
const handlePendingFilterSearch = (dataKey, text) =>
  setPendingFilterSearch(fs => ({ ...fs, [dataKey]: text }));

const pendingAllChecked = dataKey => {
  const sel = tempPendingSelections[dataKey] || [];
  return sel.length === (distinctPending[dataKey] || []).length;
};

const togglePendingSelectAll = dataKey => {
  const all = distinctPending[dataKey] || [];
  setTempPendingSelections(ts => ({
    ...ts,
    [dataKey]: ts[dataKey]?.length === all.length ? [] : [...all]
  }));
};

const handlePendingCheckboxToggle = (dataKey, v) =>
  setTempPendingSelections(ts => {
    const sel = ts[dataKey] || [];
    return {
      ...ts,
      [dataKey]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v]
    };
  });

  const handleSortPending = (columnKey) =>
  setPendingSortConfig(prev => ({
    key: columnKey,
    direction: prev.key === columnKey && prev.direction === "asc" ? "desc" : "asc",
  }));


const applyPendingFilter = dataKey =>
  setPendingFilterConfig(fc => ({
    ...fc,
    [dataKey]: tempPendingSelections[dataKey] || []
  }));

// Compute distinct values
const distinctPending = useMemo(() => {
  const map = {
    id: new Set(), description: new Set(), dueDate: new Set(),
    priority: new Set(), remainingDays: new Set(),
    flags: new Set(), assignedOfficers: new Set()
  };
  leads.pendingLeads.forEach(lead => {
    map.id.add(String(lead.id));
    map.description.add(lead.description);
    map.dueDate.add(lead.dueDate);
    map.priority.add(lead.priority);
    map.remainingDays.add(String(calculateRemainingDays(lead.dueDate)));
    lead.flags.forEach(f => map.flags.add(f));
    lead.assignedOfficers.forEach(o => map.assignedOfficers.add(o));
  });
  return Object.fromEntries(
    Object.entries(map).map(([k,s])=>[k,Array.from(s)])
  );
}, [leads.pendingLeads]);

// Apply filters + sort
const sortedPendingLeads = useMemo(() => {
  let data = leads.pendingLeads.filter(lead =>
    Object.entries(pendingFilterConfig).every(([key, sel]) => {
      if (!sel.length) return true;
      let cell = key === "remainingDays"
        ? calculateRemainingDays(lead.dueDate)
        : lead[key];
      if (Array.isArray(cell)) return cell.some(v => sel.includes(v));
      return sel.includes(String(cell));
    })
  );
  const { key, direction } = pendingSortConfig;
  if (key) {
    data = data.slice().sort((a,b) => {
      let aV = key==="remainingDays"
        ? calculateRemainingDays(a.dueDate)
        : Array.isArray(a[key]) ? a[key][0] : a[key];
      let bV = key==="remainingDays"
        ? calculateRemainingDays(b.dueDate)
        : Array.isArray(b[key]) ? b[key][0] : b[key];
      return direction==='asc'
        ? String(aV).localeCompare(String(bV))
        : String(bV).localeCompare(String(aV));
    });
  }
  return data;
}, [leads.pendingLeads, pendingFilterConfig, pendingSortConfig]);
 
// ─── Pending Lead Returns filter/sort setup ───────────────────────────────

// Columns + mapping
const pendingLRColumns   = ["Lead No.", "Lead Name", "Case Name"];
const pendingLRColKey    = {
  "Lead No.":  "id",
  "Lead Name": "description",
  "Case Name": "caseName",
};
const pendingLRColWidths = {
  "Lead No.":  "15%",
  "Lead Name": "40%",
  "Case Name": "35%",
};

// Refs + state
const popupPendingLRRefs      = useRef({});
const [openPendingLRFilter,    setOpenPendingLRFilter]     = useState(null);
const [pendingLRFilterConfig,  setPendingLRFilterConfig]   = useState({
  id: [], description: [], caseName: []
});
const [tempPendingLRSelections, setTempPendingLRSelections]= useState({});
const [pendingLRFilterSearch,  setPendingLRFilterSearch]   = useState({});
const [pendingLRSortConfig,    setPendingLRSortConfig]     = useState({ key: null, direction: 'asc' });

// Helper functions
const handlePendingLRFilterSearch = (dataKey, text) =>
  setPendingLRFilterSearch(fs => ({ ...fs, [dataKey]: text }));

const pendingLRAllChecked = dataKey => {
  const sel = tempPendingLRSelections[dataKey] || [];
  return sel.length === (distinctPendingLR[dataKey]?.length ?? 0);
};

const togglePendingLRSelectAll = dataKey => {
  const all = distinctPendingLR[dataKey] || [];
  setTempPendingLRSelections(ts => ({
    ...ts,
    [dataKey]: ts[dataKey]?.length === all.length ? [] : [...all]
  }));
};

const handlePendingLRCheckboxToggle = (dataKey, v) =>
  setTempPendingLRSelections(ts => {
    const sel = ts[dataKey] || [];
    return {
      ...ts,
      [dataKey]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v]
    };
  });

const applyPendingLRFilter = dataKey =>
  setPendingLRFilterConfig(fc => ({
    ...fc,
    [dataKey]: tempPendingLRSelections[dataKey] || []
  }));

// Distinct values for each column
const distinctPendingLR = useMemo(() => {
  const map = {
    id: new Set(),
    description: new Set(),
    caseName: new Set()
  };
  leads.pendingLeadReturns.forEach(lead => {
    map.id.add(String(lead.id));
    map.description.add(lead.description);
    map.caseName.add(lead.caseName);
  });
  return Object.fromEntries(
    Object.entries(map).map(([k,s]) => [k, Array.from(s)])
  );
}, [leads.pendingLeadReturns]);

// Filter + sort the pending lead returns
const sortedPendingLRs = useMemo(() => {
  let data = leads.pendingLeadReturns.filter(lead =>
    Object.entries(pendingLRFilterConfig).every(([key, sel]) => {
      if (!sel.length) return true;
      const cell = String(lead[key]);
      return sel.includes(cell);
    })
  );
  const { key, direction } = pendingLRSortConfig;
  if (key) {
    data = data.slice().sort((a,b) => {
      const aV = String(a[key]), bV = String(b[key]);
      return direction === 'asc'
        ? aV.localeCompare(bV)
        : bV.localeCompare(aV);
    });
  }
  return data;
}, [leads.pendingLeadReturns, pendingLRFilterConfig, pendingLRSortConfig]);

// ─── All Leads filter/sort setup ──────────────────────────────────────────

// Columns + mapping
const allColumns   = [
  "Lead No.",
  "Lead Log Summary",
  "Lead Status",
  "Assigned Officers"
];
const allColKey    = {
  "Lead No.":           "id",
  "Lead Log Summary":   "description",
  "Lead Status":        "leadStatus",
  "Assigned Officers":  "assignedOfficers"
};
const allColWidths = {
  "Lead No.":           "9%",
  "Lead Log Summary":   "35%",
  "Lead Status":        "11%",
  "Assigned Officers":  "22%"
};

// Refs & state
const filterButtonRefs = useRef({});

const popupAllRefs     = useRef({});
const [openAllFilter,   setOpenAllFilter]   = useState(null);
const [allFilterConfig, setAllFilterConfig] = useState({
  id:'', description:'', leadStatus:'', assignedOfficers:''
});
const [allFilterSearch, setAllFilterSearch] = useState({});
const [tempAllSelections, setTempAllSelections] = useState({});
const [allSortConfig,   setAllSortConfig]   = useState({ key:null, direction:'asc' });

// Build distinct values for each column
const distinctAll = useMemo(() => {
  const map = {
    id: new Set(),
    description: new Set(),
    leadStatus: new Set(),
    assignedOfficers: new Set(),
  };
  leads.allLeads.forEach(lead => {
    map.id.add(String(lead.id));
    map.description.add(lead.description);
    map.leadStatus.add(lead.leadStatus);
    (lead.assignedOfficers || []).forEach(o => map.assignedOfficers.add(o));
  });
  return Object.fromEntries(
    Object.entries(map).map(([k, set]) => [k, Array.from(set)])
  );
}, [leads.allLeads]);


const handleAllFilterSearch = (key, txt) =>
  setAllFilterSearch(fs => ({ ...fs, [key]: txt }));

const allAllChecked = key =>
  (tempAllSelections[key] || []).length === (distinctAll[key] || []).length;

const toggleAllSelectAll = key => {
  const all = distinctAll[key] || [];
  setTempAllSelections(ts => ({
    ...ts,
    [key]: ts[key]?.length === all.length ? [] : [...all]
  }));
};

const handleAllCheckboxToggle = (key, v) =>
  setTempAllSelections(ts => {
    const sel = ts[key] || [];
    return {
      ...ts,
      [key]: sel.includes(v)
        ? sel.filter(x => x !== v)
        : [...sel, v]
    };
  });

const applyAllFilter = key =>
  setAllFilterConfig(cfg => ({
    ...cfg,
    [key]: tempAllSelections[key] || []
  }));


// Apply filters + sort
const sortedAllLeads = useMemo(() => {
  const { id: fId, description: fDesc, leadStatus: fStatus, assignedOfficers: fOffs } = allFilterConfig;

  // 1) Filter
  let data = leads.allLeads.filter(lead => {
    // id filter
    if (fId.length && !fId.includes(String(lead.id))) return false;

    // description filter
    if (fDesc.length && !fDesc.includes(lead.description)) return false;

    // leadStatus filter
    if (fStatus.length && !fStatus.includes(lead.leadStatus)) return false;

    // assignedOfficers filter (lead.assignedOfficers is an array)
    if (
      fOffs.length &&
      !lead.assignedOfficers.some(off => fOffs.includes(off))
    ) {
      return false;
    }

    return true;
  });

  // 2) Sort
  const { key, direction } = allSortConfig;
  if (key) {
    data = data.slice().sort((a, b) => {
      // if the field is an array, grab the first element for sorting
      const aV = Array.isArray(a[key]) ? a[key][0] : String(a[key]);
      const bV = Array.isArray(b[key]) ? b[key][0] : String(b[key]);
      return direction === "asc"
        ? aV.localeCompare(bV)
        : bV.localeCompare(aV);
    });
  }

  return data;
}, [leads.allLeads, allFilterConfig, allSortConfig]);


const handleSortAll = columnKey => {
  setAllSortConfig(prev => ({
    key: prev.key === columnKey && prev.direction === "asc"
      ? columnKey     // still sort by the same column, but flip direction
      : columnKey,
    direction: prev.key === columnKey && prev.direction === "asc"
      ? "desc"
      : "asc"
  }));
};

const toTitleCase = (s = "") =>
  s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());





    return (
        <div className="case-page-manager">
            {/* Navbar */}
            <Navbar />
              <AlertModal
                isOpen={confirmOfficersOpen}
                title="Confirm Update"
                message="Are you sure you want to update your case officers?"
                onClose={closeConfirmOfficers}
                onConfirm={handleConfirmOfficers}
              />
              <AlertModal
              isOpen={confirmConfig.isOpen}
              title="Confirm Accept"
              message={`Are you sure you want to accept Lead #${confirmConfig.lead?.id} -  ${confirmConfig.lead?.description} ?`}
              onClose={closeConfirm}
              onConfirm={handleConfirmAccept}
            > </AlertModal>

             <AlertModal
                    isOpen={alertOpen}
                    title="Notification"
                    message={alertMessage}
                    onConfirm={() => setAlertOpen(false)}
                    onClose={()   => setAlertOpen(false)}
                  />

            {presenceOthers.length > 0 && (
  <div style={{
    background: "#FFF7E6",
    border: "1px solid #FFC069",
    color: "#874d00",
    padding: "8px 12px",
    borderRadius: 8,
    margin: "8px 16px"
  }}>
   {/* {presenceOthers.map(o => o.username).join(", ")}{" "}
    {presenceOthers.length === 1 ? "is" : "are"} also viewing this case page now. */}
      {presenceNames.join(", ")}{" "}
    {presenceNames.length === 1 ? "is" : "are"} also viewing this case page now.
  </div>
)}


            {/* Main Container */}
            <div className="main-container">

              <SideBar
                activePage="CasePageManager"
                leads={leads}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />

              <div className="left-content">

                {/* <div className = "side-titleLeft">
                  <p> PIMS &gt; Cases
                 </p>
                </div> */}
                 {/* <div className="caseandleadinfo-cl">
          <h5 className = "side-title-cl"> 
               <p> PIMS &gt; Cases </p>
             </h5>
          <h5 className="side-title-cl">
  {selectedCase?.role ?`Your Role: ${selectedCase.role || ""}` : ` ${leadStatus}`}
</h5>

          </div> */}
                {/* Display Case Number and Name */}
                <div className="case-header-cp">
                  <div className="cp-head">
                {
                    <h2>{selectedCase?.caseName ? toTitleCase(selectedCase.caseName) : "Unknown Case"}</h2>

                }
                </div>
                   <div  className="add-lead-section">
                {/* <div className="add-lead-section-content"><h2>Click here to add a new lead</h2></div> */}
                <div className = "add-lead-btn1">
                <button className="cp-add-lead-btn"  onClick={() => navigate('/createlead', { state: { caseDetails: selectedCase } })}
                style={{ cursor: 'pointer', width: '100%' }} >
                   <i className="fa-solid fa-plus"></i> Add Lead
                </button>
                </div>
                </div>
                </div>

                {/* <div className="cp-case-status">
                 
      <div className="pill">{selectedCase.role || ""}</div>
      <div className="pill">Ongoing</div>
      <div className="muted">Last updated 2h ago</div>
                </div> */}

{/* <div className="summary-box">
      <div className="case-summary">
        <div className="cp-summ-head">
  <label className="cp-label" htmlFor="case-summary">Case Summary</label>

  {(selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor") && (
    <button
      type="button"
      className="icon-button"
      onClick={handleEditClick}
      aria-label="Edit case summary"
      title="Edit"
    >
      <img
        src={`${process.env.PUBLIC_URL || ""}/Materials/edit.png`}  // or just "/Materials/edit.png"
        className="icon-image"
        alt=""
      />
    </button>
  )}
</div>
      <textarea
        className='cp-textarea'
        rows={6}
        style={{ width: '100%', fontSize: 20 }}
        value={summary}
        onChange={e => setSummary(e.target.value)}
      />
                </div>
                </div> */}

                
{/* <div className="summary-box">
  <div className="case-summary" style={{ fontSize: 20, whiteSpace: "pre-wrap" }}>
    Case Summary: 
     <textarea
    value={summary}
        onChange={e => setSummary(e.target.value)}
    />
  </div>
</div> */}

{/* <div className="summary-box">
  <div className="" style={{ fontSize: 20 }}>
    <textarea
      value={`Case Summary: ${summary ?? ""}`}
      onChange={e => {
        const raw = e.target.value;
        const next = raw.replace(/^Case Summary:\s?/, "");
        setSummary(next);
      }}
      rows={6}
      style={{ width: "100%", font: "inherit", whiteSpace: "pre-wrap" }}
    />
  </div>
</div> */}

<section className="collapsible-section">
  <button
    type="button"
    className="collapse-header"
    onClick={() => setIsCaseSummaryOpen(o => !o)}
    aria-expanded={isCaseSummaryOpen}
  >
    <span className="collapse-title">Case Summary</span>
    <span className=""> 
      <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
      className="icon-image"
       /></span>
  </button>

  {isCaseSummaryOpen && (
      <div style={{ fontSize: 20 }}>
        <textarea
  value={summary ?? ""}
  onChange={e => {
    const raw = e.target.value;
    const next = raw.replace(/^Case Summary:\s?/, "");
    setSummary(next);
  }}
  rows={6}
  style={{
    width: "100%",
    font: "inherit",
    whiteSpace: "pre-wrap",
    border: "none",
    outline: "none",
    resize: "none",
    textAlign: "left",   // ensure alignment to the left
    paddingLeft: "20px"          // remove default left padding
  }}
/>
     
    </div>
  )}
</section>

<section className="collapsible-section">
  <button
    type="button"
    className="collapse-header"
    onClick={() => setIsCaseTeamOpen(o => !o)}
    aria-expanded={isCaseTeamOpen}
  >
    <span className="collapse-title">Case Team</span>
    <span className="">
      <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
      className="icon-image"
       />
    </span>
  </button>
                
                {isCaseTeamOpen && (

                <div className="case-team">
                <table className="leads-table" style={caseTeamStyles.table}>
                <thead>
                <tr>
                <th style={{...caseTeamStyles.th, width: "20%" }}>Role</th>
                <th style={caseTeamStyles.th}>Name(s)</th></tr>
                </thead>
                <tbody>
                  <tr>
                  <td style={caseTeamStyles.td}>Detective Supervisor</td>
                  <td className="name-cell" style={caseTeamStyles.td}>
                    {(selectedCase.role === "Detective Supervisor") ? (
                      <div  ref={dsRef}
                      className="custom-dropdown">
                        <div
                          className="dropdown-header1"
                          onClick={() => setDetectiveSupervisorDropdownOpen(prev => !prev)}
                        >
                          {/* {selectedDetectiveSupervisor
                            ? (() => {
                                const usr = allUsers.find(x => x.username === selectedDetectiveSupervisor);
                                return usr ? `${usr.username}` : selectedDetectiveSupervisor;
                              })()
                            : "Select Detective Supervisor"} */}
                            {selectedDetectiveSupervisor
  ? displayName(selectedDetectiveSupervisor)
  : "Select Detective Supervisor"}
                          <span className="dropdown-icon">
                            {detectiveSupervisorDropdownOpen ? "▲" : "▼"}
                          </span>
                        </div>
                        {detectiveSupervisorDropdownOpen && (
                          <div className="dropdown-options">
                            {allUsers.map(user => (
                              <div key={user.username} className="dropdown-item">
                                <input
                                  type="radio"
                                  name="detectiveSupervisor"
                                  id={`ds-${user.username}`}
                                  value={user.username}
                                  checked={selectedDetectiveSupervisor === user.username}
                                  // onChange={() => 
                                  // {
                                  //   setSelectedDetectiveSupervisor(user.username);
                                  //   setTimeout(() => saveInvestigators(), 0);
                                  // }

                                  // }
                                  onChange={() => {
                                    const selected = user.username;
                                    setSelectedDetectiveSupervisor(selected);
                                    saveInvestigators(selectedInvestigators, selectedCaseManagers, selected);
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
                      team.detectiveSupervisor || "—"
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={caseTeamStyles.td}>Case Manager{team.caseManagers.length>1 ? "s" : ""}</td>
                  <td className="name-cell" style={caseTeamStyles.td}>
                    {(selectedCase.role==="Case Manager" || selectedCase.role==="Detective Supervisor") ? (
                      <div ref={cmRef}
                      className="custom-dropdown">
                        <div
                          className="dropdown-header1"
                          onClick={() => setCaseManagersDropdownOpen(prev => !prev)}
                        >          
                        {/* {selectedCaseManagers.length>0
                            ? selectedCaseManagers
                                .map(u=>{
                                  const usr=allUsers.find(x=>x.username===u);
                                  return usr
                                    ? `${usr.username}`
                                    : u;
                                })
                                .join(", ")
                            : "Select Case Manager(s)"} */}
                            {selectedCaseManagers.length > 0
  ? displayNames(selectedCaseManagers)
  : "Select Case Manager(s)"}
                          <span className="dropdown-icon">
                            {caseManagersDropdownOpen ? "▲" : "▼"}
                          </span>
                        </div>
                        {caseManagersDropdownOpen && (
                          <div className="dropdown-options">
                            {allUsers
                              // .filter(u=>u.role==="Case Manager")
                              .map(user=>(
                                <div key={user.username} className="dropdown-item">
                                  <input
                                    type="checkbox"
                                    id={`cm-${user.username}`}
                                    value={user.username}
                                    checked={selectedCaseManagers.includes(user.username)}
                                  // onChange={(e) => {
                                  //     const next = e.target.checked
                                  //       ? [...selectedCaseManagers, user.username]
                                  //       : selectedCaseManagers.filter(u => u !== user.username);

                                  //     setSelectedCaseManagers(next);
                                  //     // setTimeout(() => saveInvestigators(), 0);
                                  //     saveInvestigators(next);
                                  //   }}
                                  onChange={(e) => {
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
                      (team.caseManagers||[]).join(", ") || "—"
                    )}
                  </td>
                </tr>

                <tr>
                        <td className="name-cell" style={caseTeamStyles.td}>
                          Investigator{team.investigators.length > 1 ? "s" : ""}
                        </td>
                        <td style={caseTeamStyles.td}>
                        
                          {(selectedCase.role === "Case Manager" ||
                            selectedCase.role === "Detective Supervisor") ? (
                            <div ref={invRef}
                            className="custom-dropdown">
                              <div
                                className="dropdown-header1"
                                onClick={() =>
                                  setInvestigatorsDropdownOpen(!investigatorsDropdownOpen)
                                }
                              >
                                {/* {selectedInvestigators.length > 0
                                  ? selectedInvestigators
                                      .map((username) => {
                                        const u = allUsers.find(
                                          (x) => x.username === username
                                        );
                                        return u
                                          ? `${u.username}`
                                          : username;
                                      })
                                      .join(", ")
                                  : "Select Investigators"} */}
                                  {selectedInvestigators.length > 0
  ? displayNames(selectedInvestigators)
  : "Select Investigators"}

                                <span className="dropdown-icon">
                                  {investigatorsDropdownOpen ? "▲" : "▼"}
                                </span>
                              </div>

                              {/* 2) Options: only visible when dropdown is open */}
                              {investigatorsDropdownOpen && (
                                <div className="dropdown-options">
                                  {allUsers.map((user) => (
                                    <div key={user.username} className="dropdown-item">
                                      <input
                                        type="checkbox"
                                        id={`inv-${user.username}`}
                                        value={user.username}
                                        checked={selectedInvestigators.includes(user.username)}
                                      //  onChange={(e) => {
                                      //     const next = e.target.checked
                                      //       ? [...selectedInvestigators, user.username]
                                      //       : selectedInvestigators.filter(u => u !== user.username);

                                      //     setSelectedInvestigators(next);
                                      //     setTimeout(() => saveInvestigators(), 0); // Auto-save
                                      //   }}
                                  //  onChange={(e) => {
                                  //         const next = e.target.checked
                                  //           ? [...selectedInvestigators, user.username]
                                  //           : selectedInvestigators.filter(u => u !== user.username);

                                  //         setSelectedInvestigators(next);
                                  //         saveInvestigators(next); // Pass updated investigators directly
                                  //       }}
                                  onChange={(e) => {
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
                            // If not editable, just show comma‐separated list
                            <div>
                              {team.investigators.length
                                ? team.investigators.join(", ")
                                : "None assigned"}
                            </div>
                          )}
                        </td>
                      </tr>
                </tbody>
                </table>
                </div>
                 )}
</section>



                {/* <div className="update-lead-btn">
                  <button className="save-btn1" onClick={openConfirmOfficers}>
                    Save
                  </button>
                  {error && <div className="error">{error}</div>}
                </div> */}

             
                <div className="stats-bar">
                          <span
                            className={`hoverable ${activeTab === "allLeads" ? "active" : ""}`}
                            onClick={() => handleTabClick("allLeads")}
                        >
                            All Leads: {leads.allLeads.length}
                        </span>
                        {/* <span
                            className={`hoverable ${activeTab === "assignedLeads" ? "active" : ""}`}
                            onClick={() => handleTabClick("assignedLeads")}
                        >
                            Assigned Leads: {leads.assignedLeads.length}
                        </span>
                        <span
                            className={`hoverable ${activeTab === "pendingLeads" ? "active" : ""}`}
                            onClick={() => handleTabClick("pendingLeads")}
                          >
                            Accepted Leads: {leads.pendingLeads.length}
                          </span> */}
                           <span
                            className={`hoverable ${activeTab === "pendingLeads" ? "active" : ""}`}
                            onClick={() => handleTabClick("pendingLeads")}
                          >
                            Leads To Reassign: {leads.pendingLeads.length}
                          </span>
                        <span
                            className={`hoverable ${activeTab === "pendingLeadReturns" ? "active" : ""}`}
                            onClick={() => handleTabClick("pendingLeadReturns")}
                        >
                            Lead Returns for Review: {leads.pendingLeadReturns.length}
                        </span>
                    
                </div>

                <div className="content-section">
                    {activeTab === "assignedLeads" && (

<div className="table-scroll-container">
    <table className="leads-table" style={{ minWidth: "1000px" }}>
      <thead>
        <tr>
            {assignedColumns.map(col => {
                      const dataKey = assignedColKey[col];
                      return (
                        <th
                          key={col}
                          className="column-header1"
                          style={{ width: assignedColWidths[col] }}
                        >
                          <div className="header-title">
                            {col}
                            <span ref={el => (popupAssignedRefs.current[dataKey] = el)}>
                              {/* Filter button */}
                              <button
                                onClick={() =>
                                  setOpenAssignedFilter(prev =>
                                    prev === dataKey ? null : dataKey
                                  )
                                }
                              >
                                <img
                                  src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
                                  className="icon-image"
                                />
                              </button>
                              <Filter
                                dataKey={dataKey}
                                distinctValues={distinctAssigned}
                                open={openAssignedFilter === dataKey}
                                anchorRef={{ current: popupAssignedRefs.current[dataKey] }}
                                searchValue={assignedFilterSearch[dataKey] || ""}
                                selections={tempAssignedSelections[dataKey] || []}
                                onSearch={handleAssignedFilterSearch}
                                allChecked={assignedAllChecked}
                                onToggleAll={toggleAssignedSelectAll}
                                onToggleOne={handleAssignedCheckboxToggle}
                                onApply={() => {
                                  applyAssignedFilter(dataKey);
                                  setOpenAssignedFilter(null);
                                }}
                                onCancel={() => setOpenAssignedFilter(null)}
                              />
                            </span>
                          </div>
                        </th>
                      );
                    })}
                    {/* extra column for “View” button */}
                    <th style={{ width: "10%", textAlign:"center" }}> Actions</th>
                  </tr>
                </thead>
                <tbody>
      {sortedAssignedLeads.length > 0 ? (
        sortedAssignedLeads
          .filter(
            (lead) =>
              lead.description
                .toLowerCase()
                .includes(filterText.toLowerCase()) &&
              (!selectedPriority || lead.priority === selectedPriority)
          )
          .sort((a, b) => {
            if (!sortField || !sortOrder) return 0;
            if (sortField === "remainingDays") {
              return sortOrder === "asc"
                ? calculateRemainingDays(a.dueDate) -
                    calculateRemainingDays(b.dueDate)
                : calculateRemainingDays(b.dueDate) -
                    calculateRemainingDays(a.dueDate);
            }
            const fieldA = (a[sortField] || "").toString().toLowerCase();
            const fieldB = (b[sortField] || "").toString().toLowerCase();
            return sortOrder === "asc"
              ? fieldA.localeCompare(fieldB)
              : fieldB.localeCompare(fieldA);
          })
          .map((lead) => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td>{lead.dueDate || ""}</td>
              <td>{lead.priority || ""}</td>
              <td>{calculateRemainingDays(lead.dueDate) }</td>
            

                {/* <td style={{ wordBreak:"break-word" }}>
                {lead.assignedOfficers && lead.assignedOfficers.length > 0
    ? lead.assignedOfficers.map((officer, idx) => (
        <div key={idx}>{officer}</div>
      ))
    : <em>None</em>
  }
              </td> */}
              <td style={{ wordBreak: "break-word" }}>
  {lead.assignedOfficers && lead.assignedOfficers.length > 0
    ? lead.assignedOfficers.join(", ")
    : "None"}
</td>

              <td style={{ width: "9%", textAlign: "center" }}>
                <button
                  className="view-btn1"
                  onClick={()=>handleLeadClick(lead)}
                  // onClick={() => navigate("/leadReview", { state: { caseDetails, leadId: lead.id, leadDescription: lead.summary} } )}
                >
                  Manage
                </button>
                {lead.assignedOfficers?.includes(signedInOfficer) && (
  <button
    className="accept-btn"
    onClick={() => openConfirm(lead)}
    // onClick={() => {
    //   if (window.confirm(`Do you want to accept this lead?`)) {
    //     acceptLead(lead.id, lead.description);
    //   }
    // }}
  >
    Accept
  </button>
)}

              </td>
            </tr>
            
           ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '8px' }}>
                No Assigned Leads Available
              </td>
            </tr>
          )}
      </tbody>
    </table>
    </div>

)}

          
{activeTab === "pendingLeads" && (

<div className="table-scroll-container">
<table className="leads-table" style={{ minWidth: "1000px" }}>
      <thead>
        <tr>
                 {pendingColumns.map(col => {
                   const dataKey = pendingColKey[col];
                   return (
                     <th
                       key={col}
                       className="column-header1"
                       style={{ width: pendingColWidths[col], position: 'relative' }}
                     >
                       <div className="header-title">
                         {col}
                         <span ref={el => (popupPendingRefs.current[dataKey] = el)}>
                           {/* FILTER */}
                           <button onClick={() =>
                             setOpenPendingFilter(prev =>
                               prev === dataKey ? null : dataKey
                             )
                           }>
                             <img
                               src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
                               className="icon-image"
                             />
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
                 {/* extra column for “View” */}
                 <th style={{ width: "11%", textAlign: "center" }}> Actions</th>
               </tr>
             </thead>
             <tbody>
      {sortedPendingLeads.length > 0 ? (
        sortedPendingLeads
          .filter(
            (lead) =>
              lead.description
                .toLowerCase()
                .includes(filterText.toLowerCase()) &&
              (!selectedPriority || lead.priority === selectedPriority)
          )
          .sort((a, b) => {
            if (!sortField || !sortOrder) return 0;
            if (sortField === "remainingDays") {
              return sortOrder === "asc"
                ? calculateRemainingDays(a.dueDate) -
                    calculateRemainingDays(b.dueDate)
                : calculateRemainingDays(b.dueDate) -
                    calculateRemainingDays(a.dueDate);
            }
            const fieldA = (a[sortField] || "").toString().toLowerCase();
            const fieldB = (b[sortField] || "").toString().toLowerCase();
            return sortOrder === "asc"
              ? fieldA.localeCompare(fieldB)
              : fieldB.localeCompare(fieldA);
          })
          .map((lead) => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              {/* <td>{lead.dueDate}</td> */}
              <td>{lead.priority}</td>
              {/* <td>{calculateRemainingDays(lead.dueDate)}</td> */}
              {/* <td>{lead.assignedOfficers.join(", ")}</td> */}
              {/* <td style={{ width: "14%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
            
                {lead.assignedOfficers.map((officer, index) => (
                  <span key={index} style={{ display: "block", marginBottom: "4px", padding: "8px 0px 0px 8px" }}>{officer}</span>
                ))}
                </td> */}
                {/* <td style={{ wordBreak:"break-word" }}>
                 {lead.assignedOfficers && lead.assignedOfficers.length > 0
    ? lead.assignedOfficers.map((officer, idx) => (
        <div key={idx}>{officer}</div>
      ))
    : <em>None</em>
  }
              </td> */}
              <td style={{ wordBreak: "break-word" }}>
  {lead.assignedOfficers && lead.assignedOfficers.length > 0
    ? lead.assignedOfficers.join(", ")
    : "None"}
</td>

              <td style={{ width: "9%", textAlign: "center" }}>
                <button
                  className="view-btn1"
                  onClick={() => navigate("/leadReview", { state: { caseDetails, leadId: lead.id, leadDescription: lead.summary} } )}
                >
                  Manage
                </button>
              </td>
            </tr>
             ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: "8px" }}>
                  No Accepted Leads Available
                </td>
              </tr>
            )}
      </tbody>
    </table>
    </div>
)}


{activeTab === "pendingLeadReturns" && (
<div className="table-scroll-container">
<table className="leads-table" style={{ minWidth: "1000px" }}>

    <colgroup>
      <col style={{ width: "6%" }} />     {/* Lead No. */}
      <col style={{ width: "45%" }} />   {/* Lead Name */}
      <col style={{ width: "30%" }} />   {/* Case Name */}
      <col style={{ width: "9%" }} />     {/* Actions */}
    </colgroup>
               <thead>
                      <tr>
                        {pendingLRColumns.map(col => {
                          const dataKey = pendingLRColKey[col];
                          return (
                            <th
                              key={col}
                              className="column-header1"
                              style={{ width: pendingLRColWidths[col] , position: 'relative'}}
                            >
                              <div className="header-title">
                                {col}
                                <span ref={el => (popupPendingLRRefs.current[dataKey] = el)}>
                                  {/* FILTER */}
                                  <button onClick={() =>
                                    setOpenPendingLRFilter(prev =>
                                      prev === dataKey ? null : dataKey
                                    )
                                  }>
                                    <img
                                      src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
                                      className="icon-image"
                                    />
                                  </button>
                                  <Filter
                                    dataKey={dataKey}
                                    distinctValues={distinctPendingLR}
                                    open={openPendingLRFilter === dataKey}
                                    anchorRef={{ current: popupPendingLRRefs.current[dataKey] }}
                                    searchValue={pendingLRFilterSearch[dataKey] || ''}
                                    selections={tempPendingLRSelections[dataKey] || []}
                                    onSearch={handlePendingLRFilterSearch}
                                    allChecked={pendingLRAllChecked}
                                    onToggleAll={togglePendingLRSelectAll}
                                    onToggleOne={handlePendingLRCheckboxToggle}
                                    onApply={() => {
                                      applyPendingLRFilter(dataKey);
                                      setOpenPendingLRFilter(null);
                                    }}
                                    onCancel={() => setOpenPendingLRFilter(null)}
                                  />
                                </span>
                              </div>
                            </th>
                          );
                        })}
                        {/* extra column for “Continue” */}
                        <th style={{ width: '11%', textAlign: "center" }}> Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                {leads.pendingLeadReturns.length > 0 ? (
                leads.pendingLeadReturns.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.id}</td>
                      <td>{lead.description}</td>
                       <td>{lead.caseName}</td>
                      <td style={{ width: "9%", textAlign: "center" }}>
                        <button
                              className="continue-btn"
                              onClick={() => {
                                handleLRClick(lead)
                              }}
                            >
                              Continue
                            </button>
                      </td>
                    </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '8px' }}>
                          No Pending Lead Returns Available
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
            </div>
)}  
{activeTab === "allLeads" && (
  <div className="all-leads">
    <div className="table-scroll-container">
      <table className="leads-table" style={{ minWidth: "1000px" }}>
        <thead>
               <tr>
                 {allColumns.map(col => {
                   const dataKey = allColKey[col];
                   return (
                     <th
                       key={col}
                       className="column-header1"
                       style={{ width: allColWidths[col], position: 'relative' , textAlign: col === RIGHT_ALIGN_COL ? "right" : undefined }}
                     >
                       <div className="header-title"
                          //  style={col === "Lead No." ? { justifyContent: "flex-end" } : undefined}
>
                         {col}
                         <span ref={el => (popupAllRefs.current[dataKey] = el)}>
                           {/* FILTER button */}
                           <button
                             onClick={() =>
                               setOpenAllFilter(prev =>
                                 prev === dataKey ? null : dataKey
                               )
                             }
                           >
                             <img
                               src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
                               className="icon-image"
                             />
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
                             onApply={() => {
                               applyAllFilter(dataKey);
                               setOpenAllFilter(null);
                             }}
                             onCancel={() => setOpenAllFilter(null)}
                           />
                         </span>
                       </div>
                     </th>
                   );
                 })}
                 {/* extra column for “View” */}
                 <th style={{ width: "9%", textAlign: "center" }}>Actions</th>
               </tr>
             </thead>
             <tbody>
          {sortedAllLeads.length>0 ? sortedAllLeads.map(lead=>(
            <tr key={lead.id}>
              <td style={{ }}>{lead.id}</td>
              <td>{lead.description}</td>
              <td style={{ 
  color:
    ["Assigned", "Accepted", "Approved", "Returned", "Completed"].includes(lead.leadStatus)
      ? "green"
      : lead.leadStatus === "In Review"
      ? "red"
      : "black"
}}>
   {lead.leadStatus === "In Review" ? "To review" : lead.leadStatus}
</td>


             
              {/* <td style={{ wordBreak:"break-word" }}>
                 {lead.assignedOfficers && lead.assignedOfficers.length > 0
    ? lead.assignedOfficers.map((officer, idx) => (
        <div key={idx}>{officer}</div>
      ))
    : <em>None</em>
  }
              </td> */}
              <td style={{ wordBreak: "break-word" }}>
  {lead.assignedOfficers && lead.assignedOfficers.length > 0
    ? lead.assignedOfficers.join(", ")
    : "None"}
</td>

              <td style={{ width: "9%", textAlign: "center" }}>
                <button className="view-btn1" onClick={()=>handleLeadClick(lead)}>
                  Manage
                </button>
                
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} style={{ textAlign:"center", padding:"8px" }}>
                No Leads Available
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
  totalEntries={totalEntries}  // Automatically calculate total entries
  onPageChange={setCurrentPage} // Update current page state
  pageSize={pageSize}
  onPageSizeChange={setPageSize} // Update page size state
/>
                </div> 
              </div>
            </div>
        </div>
    );
};