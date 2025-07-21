import React, { useContext, useState, useEffect, useRef, useMemo, useCallback} from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Searchbar from '../../components/Searchbar/Searchbar';
import Button from '../../components/Button/Button';
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import './Investigator.css'; // Custom CSS file for styling
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";
import Pagination from "../../components/Pagination/Pagination";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import api from "../../api";
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";
import { AlertModal } from "../../components/AlertModal/AlertModal"
import {SideBar } from "../../components/Sidebar/Sidebar";



export const Investigator = () => {
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
  const { setSelectedCase, selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);
   const [showSelectModal, setShowSelectModal] = useState(false);
    const [pendingRoute, setPendingRoute]   = useState(null);
    const [showAlert, setShowAlert] = useState(false);
       const [caseSummary, setCaseSummary] = useState('');
       const [isEditing, setIsEditing] = useState(false);
         const [summary, setSummary] = useState('');
         const [isSaving, setIsSaving] = useState(false);
         const [error, setError] = useState('');
         const saveTimer = useRef(null);
         const isFirstLoad = useRef(true);

         const isNavDisabled = lead => lead.leadStatus === 'Assigned';
const disabledStyle = { opacity: 0.5, cursor: 'not-allowed' };


  console.log("case context", selectedCase);
  const handleSaveClick = () => {
    setIsEditing(false);
    // You can add logic here to update the backend with the new summary if needed
};
const [team, setTeam] = useState({
  detectiveSupervisor: "",
  caseManagers: [],
  investigators: []
});

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
  if (!selectedCase?.caseNo) return;
  api.get(`/api/cases/${selectedCase.caseNo}/team`)
    .then(({ data }) => setTeam(data))
    .catch(console.error);
}, [selectedCase.caseNo]);


  // modal state
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen:    false,
    lead:    null,
  });
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title:  "",
    message:"",
  });

  const openConfirm  = (lead) => setConfirmConfig({ isOpen: true, lead });
  const closeConfirm = ()      => setConfirmConfig({ isOpen: false, lead: null });

  const handleConfirmAccept = () => {
    acceptLead(confirmConfig.lead.id, confirmConfig.lead.description);
    closeConfirm();
  };

  const [leads, setLeads] = useState({
    assignedLeads: [
      // { id: 1, description: "Collect Audio Records from Dispatcher",dueDate: "12/25/2024",
      //   priority: "High",
      //   flags: ["Important"],
      //   assignedOfficers: ["Officer 1", "Officer 3"], },
      // { id: 2, description: "Interview Mr. John",dueDate: "12/31/2024",
      //   priority: "Medium",
      //   flags: [],
      //   assignedOfficers: ["Officer 2"] },
      // { id: 3, description: "Collect Evidence from 63 Mudray Street",dueDate: "12/29/2024",
      //   priority: "Low",
      //   flags: [],
      //   assignedOfficers: ["Officer 4"] },
    ],
    pendingLeads: [
      // {
      //   id: 4,
      //   description: "Interview Witness",
      //   dueDate: "12/26/2024",
      //   priority: "High",
      //   flags: ["Important"],
      //   assignedOfficers: ["Officer 1", "Officer 3"],
      // },
      // {
      //   id: 6,
      //   description: "Interview Neighbours",
      //   dueDate: "12/23/2024",
      //   priority: "Medium",
      //   flags: [],
      //   assignedOfficers: ["Officer 2"],
      // },
      // {
      //   id: 7,
      //   description: "Collect Evidence",
      //   dueDate: "12/22/2024",
      //   priority: "Low",
      //   flags: [],
      //   assignedOfficers: ["Officer 4"],
      // },
    ],
    pendingLeadReturns: [
        // { id: 5, description: "Submit Crime Scene Photos" },
        // { id: 8, description: "Collect Evidence", dueDate: "12/30/2024" },
        // { id: 9, description: "Interview Witness", dueDate: "12/31/2024" },
    ],
    allLeads: [
        // { id: 1, description: "Collect Audio Records from Dispatcher", status: "Assigned" },
        // { id: 2, description: "Interview Mr. John", status: "Assigned" },
        // { id: 3, description: "Collect Evidence from 63 Mudray Street", status: "Completed" },
        // { id: 4, description: "Interview Witness", status: "Pending" },
        // { id: 5, description: "Submit Crime Scene Photos", status: "Completed" },
    ],
});

const handleLeadClick = (lead) => {
  setSelectedLead({
    leadNo: lead.leadNo || lead.id,
    incidentNo: lead.incidentNo,
    leadName: lead.description,
    dueDate: lead.dueDate || "N/A",
    priority: lead.priority || "Medium",
    flags: lead.flags || [],
    assignedOfficers: lead.assignedOfficers || [],
    leadStatus: lead.leadStatus,
    caseName: lead.caseName,
    caseNo: lead.caseNo
});

  // Navigate to Lead Review Page
  navigate("/leadReview", { state: { leadDetails: lead, caseDetails: selectedCase } });
};

    const [activeTab, setActiveTab] = useState("allLeads"); // Default to All Leads tab
    const handleViewAssignedLead = (lead) => {
    };
    const handleCaseClick = (caseDetails) => {
      navigate("/CasePageManager", { state: { caseDetails } }); // Pass case details via state
    };
  const handleLRClick = (lead) => {
  // 1. Build caseDetails and leadDetails
  const caseDetails = {
    caseNo:   lead.caseNo,
    caseName: lead.caseName,
    role: "Investigator"
  };
  const leadDetails = {
    leadNo:   lead.id,
    leadName: lead.description
  };

  // 2. Update context
  setSelectedCase(caseDetails);
  setSelectedLead(leadDetails);

  // 3. Persist role if needed (e.g. "Case Manager")
  localStorage.setItem("role", "Investigator");

  // 4. Navigate to LRInstruction, passing both objects via state
  navigate("/LRInstruction", {
    state: {
      caseDetails,
      leadDetails
    }
  });
};


    const handleNavigation = (route) => {
      navigate(route); // Navigate to respective page
    };

    const signedInOfficer = localStorage.getItem("loggedInUser");
    const token = localStorage.getItem("token");

       const [currentPage, setCurrentPage] = useState(1);
      const [pageSize, setPageSize] = useState(50);
      const totalPages = 10; // Change based on your data
      const totalEntries = 100;
    



  useEffect(() => {
  // 1) define your async fetch:
  const fetchLeads = async () => {
    if (!selectedCase?.caseNo || !selectedCase?.caseName) return;

    try {
      const token = localStorage.getItem("token");
      const response = await api.get(
        `/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = Array.isArray(response.data) ? response.data : [];


      const filtered = data.filter(
  lead => lead.assignedTo?.some(o => o.username === signedInOfficer)
);


      const mapLead = lead => ({
        id: lead.leadNo,
        description: lead.description,
        dueDate: lead.dueDate
          ? new Date(lead.dueDate).toISOString().slice(0,10)
          : "N/A",
        priority: lead.priority || "Medium",
        flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [],
         assignedOfficers: Array.isArray(lead.assignedTo)
    ? lead.assignedTo.map(a => a.username)
    : [],

        leadStatus: lead.leadStatus,
        caseName: lead.caseName,
        caseNo: String(lead.caseNo),
      });

      const allLeads = filtered.map(mapLead);
      console.log("🔍 mapped leads:", allLeads);
      const assignedLeads = filtered.filter(l => l.leadStatus === "Assigned").map(mapLead);
      const pendingLeads  = filtered.filter(l => l.leadStatus === "Accepted" ).map(mapLead);
      const inReview      = filtered.filter(l => l.leadStatus === "In Review").map(mapLead);

      setLeads({
        allLeads,
        assignedLeads,
        pendingLeads,
        pendingLeadReturns: inReview,
      });
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  // 2) fire once now...
  fetchLeads();

  // 3) ...then every 15s
  const intervalId = setInterval(fetchLeads, 15_000);

  // 4) cleanup on unmount / deps change
  return () => clearInterval(intervalId);
}, [
  selectedCase?.caseNo,
  selectedCase?.caseName,
  signedInOfficer
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
            (l) => l.id !== lead.id
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
      } catch (error) {
        console.error("Error updating lead status:", error.response?.data || error);
        alert("Failed to accept lead.");
      }
    };
    

const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
const [leadDropdownOpen1, setLeadDropdownOpen1] = useState(true);

   const [showFilter, setShowFilter] = useState(false);
    const [showSort, setShowSort] = useState(false);

  
      useEffect(() => {
        // Scroll to the top when the component mounts
        window.scrollTo(0, 0);
      }, []); // Empty dependency array ensures it runs only once on mount
        
  
  
  

    const handleTabClick = (tab) => {
        setActiveTab(tab);
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
          dueDate: newLead.dueDate, // Default due date
          priority: newLead.priority, // Default priority
          flags: newLead.flags || [],
          assignedOfficers: newLead.assignedOfficers, // Default officer
        },
      ],
    }));
  };
  

  // Calculate remaining days from the due date
  const calculateRemainingDays = (dueDate) => {
    const currentDate = new Date();
    const targetDate = new Date(dueDate);
    const timeDifference = targetDate - currentDate;
    return Math.max(0, Math.ceil(timeDifference / (1000 * 60 * 60 * 24))); // Return 0 if negative
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



  
   
    const onShowCaseSelector = (route) => {
      navigate(route, { state: { caseDetails } });
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
   "Lead No.":           "12%",
  "Lead Name":          "20%",
  "Due Date":           "13%",
  "Priority":           "10%",
  "Days Left":          "13%",
  "Assigned Officers":  "21%",
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
  "Due Date",
  "Priority",
  "Days Left",
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
   "Lead No.":           "12%",
  "Lead Name":          "20%",
  "Due Date":           "13%",
  "Priority":           "10%",
  "Days Left":          "13%",
  "Assigned Officers":  "21%",
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
  "Lead Name": "50%",
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
  "Lead No.":           "13%",
  "Lead Log Summary":   "40%",
  "Lead Status":        "17%",
  "Assigned Officers":  "22%"
};

// Refs & state
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
  let data = leads.allLeads.filter(lead =>
    (!allFilterConfig.id           || String(lead.id)            === allFilterConfig.id)           &&
    (!allFilterConfig.description  || lead.description           === allFilterConfig.description)  &&
    (!allFilterConfig.leadStatus   || lead.leadStatus            === allFilterConfig.leadStatus)   &&
    (!allFilterConfig.assignedOfficers ||
       (lead.assignedOfficers || []).includes(allFilterConfig.assignedOfficers))
  );
  const { key, direction } = allSortConfig;
  if (key) {
    data = data.slice().sort((a, b) => {
      const aV = Array.isArray(a[key]) ? a[key][0] : String(a[key]);
      const bV = Array.isArray(b[key]) ? b[key][0] : String(b[key]);
      return direction === 'asc'
        ? aV.localeCompare(bV)
        : bV.localeCompare(aV);
    });
  }
  return data;
}, [leads.allLeads, allFilterConfig, allSortConfig]);


    return (
        <div className="case-page-manager">
            {/* Navbar */}
            <Navbar />

            {/* Main Container */}
            <div className="main-container">
        

                {/* <div className="sideitem">
                
                    <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

                    <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
                    <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>   
                                 <li className="sidebar-item active" onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Case Page {leadDropdownOpen ?  "▼" : "▲"}
        </li>
        {leadDropdownOpen && (
          <ul className="dropdown-list1">
            {["assignedLeads", "pendingLeads", "pendingLeadReturns", "allLeads"].map((tab) => (
  <li
    key={tab}
    className={`sidebar-item ${activeTab === tab ? "active" : ""}`}
    onClick={() => handleTabClick(tab)}
  >
    <div className="sidebar-content">
            <span className="sidebar-text">
              {tab === "assignedLeads" && "My Assigned Leads"}
              {tab === "pendingLeads" && "My Pending Leads"}
              {tab === "pendingLeadReturns" && "My Pending Lead Returns"}
              {tab === "allLeads" && "All Leads"}
            </span>
            <span className="sidebar-number">
              {tab === "assignedLeads" && leads.assignedLeads.length}
              {tab === "pendingLeads" && leads.pendingLeads.length}
              {tab === "pendingLeadReturns" && leads.pendingLeadReturns.length}
              {tab === "allLeads" && leads.allLeads.length}
            </span>
          </div>
  </li>
))}          </ul>
        )} 

{selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item"
             onClick={() => onShowCaseSelector("/SearchLead")}
          >Search Lead</li>
            <li className="sidebar-item"    
            onClick={() => {
              setPendingRoute("/lrInstruction");
              setShowSelectModal(true);
            }} >View Lead Return</li>

            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
       
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
      
             <li className="sidebar-item"    
            onClick={() => navigate("/FlaggedLead")}>
              View Flagged Leads
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>
            View Timeline Entries
            </li>
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}
            
            </ul>)}
            
            <li className="sidebar-item"  style={{ fontWeight: 'bold' }}onClick={() => setLeadDropdownOpen1(!leadDropdownOpen1)}>
          Lead Related Tabs {leadDropdownOpen1 ?  "▲": "▼"}
          </li>
        {leadDropdownOpen1 && (
          <ul>
            <li className="sidebar-item" 
             onClick={() => {
              setPendingRoute("/leadReview");
              setShowSelectModal(true);
            }}>Lead Information</li>
            {selectedCase.role !== "Investigator" && (
              <li className="sidebar-item"
                onClick={() => {
                  setPendingRoute("/ChainOfCustody");
                  setShowSelectModal(true);
                }}

          
              >View Lead Chain of Custody</li>
              )}

                    
                    {showSelectModal && (
      <SelectLeadModal
        leads={leads.allLeads}
        onSelect={handleSelectLead}
        onClose={() => setShowSelectModal(false)}
      />
    )}
    </ul>)}
                </div> */}
              

                    <SideBar
                  activePage="Investigator"
                  leads={leads}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
               
                <div className="left-content">

          <h5 className = "side-titleLeft">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>

                   {/* Display Case Number and Name */}
                <div className="case-header">
                        <h1>
                            CASE: {selectedCase.caseNo} |  {selectedCase.caseName.toUpperCase()}
                        </h1>
                </div>

             <div className="case-summary">
      <label className="input-label">Case Summary</label>
      <textarea
        id="case-summary"
        rows={6}
        style={{ width: '100%', fontSize: 20, padding: 8 }}
        value={summary}
        // onChange={e => setSummary(e.target.value)}
          readOnly
      />
      <div style={{ marginTop: 8, fontSize: 20, minHeight: '1em' }}>
        {isSaving
          ? <span style={{ color: '#888' }}>Saving…</span>
          : error
            ? <span style={{ color: 'red' }}>{error}</span>
            : <span>&nbsp;</span>
        }
      </div>
    </div>

            <div className="case-team">
        <table className="leads-table">
          <thead>
            <tr><th style={{ width: "20%" }}>Role</th><th>Name(s)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Detective Supervisor</td>
              <td>{team.detectiveSupervisor || "—"}</td>
              </tr>
            <tr>
              <td>Case Manager</td>
              <td>{(team.caseManagers||[]).join(", ") || "—"}</td>
            </tr>
            <tr>
              <td>Investigator{team.investigators.length > 1 ? "s" : ""}</td>
              <td>
                {team.investigators.length
                  ? team.investigators.join(", ")
                  : "None assigned"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
                {/* Content Area */}
                <div className="content">
              
                    <div className="stats-bar">
                       <span
                            className={`hoverable ${activeTab === "allLeads" ? "active" : ""}`}
                            onClick={() => handleTabClick("allLeads")}
                        >
                            My Leads: {leads.allLeads.length}
                        </span>
                        
                        <span
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
                          </span>
                        <span
                            className={`hoverable ${activeTab === "pendingLeadReturns" ? "active" : ""}`}
                            onClick={() => handleTabClick("pendingLeadReturns")}
                        >
                            Lead Returns In Review: {leads.pendingLeadReturns.length}
                        </span>
                       
                    </div>

                       {/* Tab Content */}
                       <div className="content-section">
                         {activeTab === "assignedLeads" && (
  <div className="table-scroll-container">
    <table className="leads-table">
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
                  <span ref={el => (popupAssignedRefs.current[col] = el)}>
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
          <th style={{ width: "11%" }}></th>
        </tr>
      </thead>
      <tbody>
        {sortedAssignedLeads.length > 0 ? (
          sortedAssignedLeads.map(lead => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td>{lead.dueDate}</td>
              <td>{lead.priority}</td>
              <td>{calculateRemainingDays(lead.dueDate)}</td>
              <td>{(lead.assignedOfficers || []).join(", ")}</td>
              <td>
                <button
                  className="view-btn1"
                  onClick={() => handleLeadClick(lead)}
                >
                  View
                </button>
                <button
                  className="accept-btn"
                  onClick={() => openConfirm(lead)}
                >
                  Accept
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={assignedColumns.length + 2}
              style={{ textAlign: "center" }}
            >
              No assigned leads available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}

<AlertModal
  isOpen={confirmConfig.isOpen}
  title="Confirm Acceptance"
  message={`Are you sure you want to accept Lead #${confirmConfig.lead?.id} – ${confirmConfig.lead?.description}?`}
  onClose={closeConfirm}
  onConfirm={handleConfirmAccept}
>
  <div className="alert-footer">
    <button className="alert-button" onClick={handleConfirmAccept}>
      Yes
    </button>
    <button className="alert-button" onClick={closeConfirm}>
      No
    </button>
  </div>
</AlertModal>

{activeTab === "pendingLeads" && (
  <div className="table-scroll-container">
    <table className="leads-table">
      <thead>
        <tr>
          {pendingColumns.map(col => {
            const dataKey = pendingColKey[col];
            return (
              <th
                key={col}
                className="column-header1"
                style={{ width: pendingColWidths[col] }}
              >
                <div className="header-title">
                  {col}
                  <span ref={el => (popupPendingRefs.current[col] = el)}>
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
                      searchValue={pendingFilterSearch[dataKey] || ""}
                      selections={tempPendingSelections[dataKey] || []}
                      onSearch={handlePendingFilterSearch}
                      allChecked={pendingAllChecked}
                      onToggleAll={togglePendingSelectAll}
                      onToggleOne={handlePendingCheckboxToggle}
                      onApply={() => {
                        applyPendingFilter(dataKey);
                        setOpenPendingFilter(null);
                      }}
                      onCancel={() => setOpenPendingFilter(null)}
                    />
                   
                  </span>
                </div>
              </th>
            );
          })}
          {/* extra column for “View” */}
          <th style={{ width: "10%" }}></th>
        </tr>
      </thead>
      <tbody>
        {sortedPendingLeads.length > 0 ? (
          sortedPendingLeads.map(lead => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td>{lead.dueDate}</td>
              <td>{lead.priority}</td>
              <td>{calculateRemainingDays(lead.dueDate)}</td>
              <td>{(lead.assignedOfficers || []).join(", ")}</td>
              <td>
                <button
                  className="view-btn1"
                  onClick={() => handleLeadClick(lead)}
                >
                  View
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={pendingColumns.length + 1}
              style={{ textAlign: "center" }}
            >
              No accepted leads available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}

{activeTab === "pendingLeadReturns" && (
  <div className="table-scroll-container">
    <table className="leads-table">
      <thead>
        <tr>
          {pendingLRColumns.map(col => {
            const dataKey = pendingLRColKey[col];
            return (
              <th
                key={col}
                className="column-header1"
                style={{ width: pendingLRColWidths[col] }}
              >
                <div className="header-title">
                  {col}
                  <span ref={el => (popupPendingLRRefs.current[col] = el)}>
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
          <th style={{ width: '10%' }}></th>
        </tr>
      </thead>
      <tbody>
        {sortedPendingLRs.length > 0 ? (
          sortedPendingLRs.map(lead => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td>{lead.caseName}</td>
              <td>
                <button
                  className="continue-btn"
                  onClick={() => handleLRClick(lead)}
                >
                  Continue
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={pendingLRColumns.length + 1}
              style={{ textAlign: 'center' }}
            >
              No Pending Lead Returns Available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}

{/* <td style={{ width: "14%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>        
{lead.assignedOfficers.map((officer, index) => (
 <span key={index} style={{ display: "block", marginBottom: "4px", padding: "8px 0px 0px 8px" }}>{officer}</span>
))}
</td> */}
{activeTab === "allLeads" && (
  <div className="table-scroll-container">
    <table className="leads-table">
      <thead>
        <tr>
          {allColumns.map(col => {
            const dataKey = allColKey[col];
            return (
              <th
                key={col}
                className="column-header1"
                style={{ width: allColWidths[col], position: 'relative'  }}
              >
                <div className="header-title">
                  {col}
                  <span ref={el => (popupAllRefs.current[col] = el)}>
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
                      searchValue={allFilterSearch[dataKey] || ''}
                      selections={tempAllSelections[dataKey] || []}
                      onSearch={handleAllFilterSearch}
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
          <th style={{ width: '11%' }}></th>
        </tr>
      </thead>
      <tbody>
        {sortedAllLeads.length > 0 ? (
          sortedAllLeads.map(lead => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td
                style={{
                  color: ['Assigned','Accepted','Returned'].includes(
                    lead.leadStatus
                  )
                    ? 'red'
                    : ['In Review','Approved','Completed'].includes(
                        lead.leadStatus
                      )
                    ? 'green'
                    : 'black'
                }}
              >
                {lead.leadStatus === 'In Review'
                  ? 'Under review'
                  : lead.leadStatus}
              </td>
              <td>{(lead.assignedOfficers || []).join(', ') || <em>None</em>}</td>
              <td>
                <button
                  className="view-btn1"
                  onClick={() => handleLeadClick(lead)}
                >
                  View
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={allColumns.length + 1}
              style={{ textAlign: 'center' }}
            >
              No Leads Available
            </td>
          </tr>
        )}
      </tbody>
    </table>
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
        </div>
    );
};
