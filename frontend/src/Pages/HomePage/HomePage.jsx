import React, { createContext, useState,useRef, useMemo, useEffect } from "react";
import axios from "axios";
import "./HomePage.css";
import { CaseContext } from "../CaseContext";
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import NotificationCard from "../../components/NotificationCard/NotificationCard1";
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
// import { FaFilter, FaSort } from "react-icons/fa";
import Pagination from "../../components/Pagination/Pagination";
import api from "../../api";


export const HomePage = () => {

  const [activeTab, setActiveTab] = useState("cases"); // Default tab
 
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const totalPages = 10;
    const totalEntries = 100;
  
const notificationRef = useRef(); // create a ref

// pass a method to call the refresh method in NotificationCard
const refreshNotifications = () => {
  if (notificationRef.current) {
    notificationRef.current.refresh();
  }
};

const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [navigateTo, setNavigateTo] = useState(""); 

  const { setSelectedCase, setToken, withAutoRefresh } = useContext(CaseContext);

  // Function to close CaseSelector
  const handleCloseCaseSelector = () => {
    setShowCaseSelector(false);
    setNavigateTo(""); // Reset navigation target
  };


  const handleAssignRole = (caseId) => {
    const role = prompt("Assign role (Investigator/Case Manager):");
    if (role) {
      setCases((prevCases) =>
        prevCases.map((c) =>
          c.id === caseId ? { ...c, role: role } : c
        )
      );
    }
  };


  const signedInOfficer = localStorage.getItem("loggedInUser");

  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem("token"); // Get JWT token

        if (!token) {
          console.error("❌ No token found. User is not authenticated.");
          return;
        }

        const response = await api.get("/api/cases", {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ Pass token in Authorization header
            "Content-Type": "application/json",
          },
          params: { officerName: signedInOfficer }, // ✅ Send officerName as query param
        });

        console.log("✅ API Response:", response.data); // Debugging log

        // ✅ Filter cases where the signed-in officer is assigned
        const assignedCases = response.data
          .filter(c => c.assignedOfficers.some(o => o.name === signedInOfficer)) // ✅ Remove cases where officer is not assigned
          .map((c) => {
            const officerInfo = c.assignedOfficers.find(o => o.name === signedInOfficer);
            return {
              id: c.caseNo,
              title: c.caseName,
              status: c.caseStatus,
              role: officerInfo ? officerInfo.role : "Unknown", // ✅ Ensure correct role is displayed
            };
          });

        setCases(assignedCases); // ✅ Set filtered cases in state
      } catch (error) {
        console.error("❌ Error fetching cases:", error.response?.data || error);
      }
    };

    fetchCases();
  }, [signedInOfficer]);

  // Handler to view the assigned lead details (can be updated to show a modal or navigate)
const handleViewAssignedLead = (lead) => {
};

const handleCaseClick = (caseDetails) => {
 

  // Save case details in context
  setSelectedCase({
    caseNo: caseDetails.id,
    caseName: caseDetails.title,
    role: caseDetails.role
  });

  // Navigate to the appropriate page based on role
  if (caseDetails.role === "Investigator") {
    localStorage.setItem("role", "Investigator");
    setSelectedCase({
      caseNo: caseDetails.id,
      caseName: caseDetails.title,
      role: caseDetails.role
    });
    navigate("/Investigator", { state: { caseDetails } });
  } else if (caseDetails.role === "Case Manager") {
    localStorage.setItem("role", "Case Manager");
    setSelectedCase({
      caseNo: caseDetails.id,
      caseName: caseDetails.title,
      role: caseDetails.role
    });
    navigate("/CasePageManager", { state: { caseDetails } });
  }
};

console.log(localStorage);


const handleLRClick = (lead) => {
  navigate("/LRInstruction", { state: { leadDetails: lead } });
};
const handleAssignInvestigator = (caseId) => {
  const investigator = prompt("Enter investigator name:");
  if (investigator) {
    setCases((prevCases) =>
      prevCases.map((c) =>
        c.id === caseId ? { ...c, assignedInvestigator: investigator } : c
      )
    );
  }
};


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


const acceptLead = (leadId) => {
  const leadToAccept = leads.assignedLeads.find((lead) => lead.id === leadId);
  if (!leadToAccept) return;


  // Add lead to pending leads with default fields if not present
  const newPendingLead = {
    ...leadToAccept,
    dueDate: leadToAccept.dueDate , // Default due date
    priority: leadToAccept.priority, // Default priority
    flags: leadToAccept.flags || [],
    assignedOfficers: leadToAccept.assignedOfficers || ["Unassigned"],
  };


  setLeads((prevLeads) => ({
    ...prevLeads,
    assignedLeads: prevLeads.assignedLeads.filter((lead) => lead.id !== leadId),
    pendingLeads: [...prevLeads.pendingLeads, newPendingLead],
  }));
};

const [leads, setLeads] = useState({
  assignedLeads: [
    // { id: 45, description: "Collect Audio Records from Dispatcher",dueDate: "12/28/2024",
    //   priority: "High",
    //   flags: ["Important"],
    //   assignedOfficers: ["Officer 1", "Officer 3"], },
    // { id: 20, description: "Interview Mr. John",dueDate: "12/31/2024",
    //   priority: "Medium",
    //   flags: [],
    //   assignedOfficers: ["Officer 2"] },
    // { id: 84, description: "Collect Evidence from 63 Mudray Street",dueDate: "12/20/2024",
    //   priority: "Low",
    //   flags: [],
    //   assignedOfficers: ["Officer 4"] },
  ],
  pendingLeads: [
    // {
    //   id: 21,
    //   description: "Interview Witness",
    //   dueDate: "12/28/2024",
    //   priority: "High",
    //   flags: ["Important"],
    //   assignedOfficers: ["Officer 1", "Officer 3", "Officer 8"],
    // },
    // {
    //   id: 30,
    //   description: "Interview Neighbours",
    //   dueDate: "12/30/2024",
    //   priority: "Medium",
    //   flags: [],
    //   assignedOfficers: ["Officer 2"],
    // },
    // {
    //   id: 32,
    //   description: "Collect Evidence",
    //   dueDate: "12/31/2024",
    //   priority: "Low",
    //   flags: [],
    //   assignedOfficers: ["Officer 4"],
    // },
  ],
  pendingLeadReturns: [
    // { id: 33, description: "Submit Crime Scene Photos" },
    // { id: 32, description: "Collect Evidence", dueDate: "12/25/2024" },
    // { id: 21, description: "Interview Witness", dueDate: "12/24/2024" },
  ],
});


  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingLeadReturns = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("❌ No token found. User is not authenticated.");
                return;
            }

            // ✅ Fetch all lead returns assigned to or assigned by the officer
            const leadsResponse = await api.get("/api/leadreturn/officer-leads", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            console.log("✅ API Response (Lead Returns):", leadsResponse.data); // Debugging log

            // ✅ Fetch all cases with their statuses
            const casesResponse = await api.get("/api/cases", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            console.log("✅ API Response (Cases):", casesResponse.data); // Debugging log

            // ✅ Extract only ongoing cases (caseStatus = "Ongoing")
            const ongoingCases = casesResponse.data
                .filter(c => c.caseStatus === "Ongoing")
                .map(c => ({ caseNo: c.caseNo, caseName: c.caseName })); // Extract relevant fields

            console.log("✅ Ongoing Cases:", ongoingCases);

            // ✅ Filter pending lead returns for the signed-in officer and ongoing cases
            const pendingLeadReturns = [];

            leadsResponse.data.forEach(lead => {
                let officerStatus = null;

                // Check if the signed-in officer is in assignedTo
                if (lead.assignedTo.assignees.includes(signedInOfficer)) {
                    officerStatus = lead.assignedTo.lRStatus;
                }

                // Check if the signed-in officer is in assignedBy
                if (lead.assignedBy.assignee === signedInOfficer) {
                    officerStatus = lead.assignedBy.lRStatus;
                }

                // ✅ If officerStatus is Pending and the case is ongoing, add to pendingLeadReturns
                if (officerStatus === "Pending" &&
                    ongoingCases.some(c => c.caseNo === lead.caseNo && c.caseName === lead.caseName)) {
                    pendingLeadReturns.push({
                        id: lead.leadNo,
                        description: lead.description,
                        caseName: lead.caseName,
                        caseNo: lead.caseNo,
                    });
                }
            });

            console.log("✅ Filtered Pending Lead Returns:", pendingLeadReturns);

            // ✅ Update state with filtered lead returns
            setLeads(prevLeads => ({
                ...prevLeads,
                pendingLeadReturns: pendingLeadReturns
            }));

        } catch (error) {
            console.error("❌ Error fetching pending lead returns:", error.response?.data || error);
        }
    };

    fetchPendingLeadReturns();
}, [signedInOfficer]);



useEffect(() => {
  const fetchPendingLeads = async () => {
      try {
          const token = localStorage.getItem("token");
          if (!token) {
              console.error("❌ No token found. User is not authenticated.");
              return;
          }

          // ✅ Fetch all assigned leads
          const leadsResponse = await api.get("/api/lead/assignedTo-leads", {
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
              }
          });

          console.log("✅ API Response (Assigned Leads):", leadsResponse.data); // Debugging log

          // ✅ Fetch all cases with their statuses
          const casesResponse = await api.get("/api/cases", {
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
              }
          });

          console.log("✅ API Response (Cases):", casesResponse.data); // Debugging log

          // ✅ Extract only ongoing cases (caseStatus = "Ongoing")
          const ongoingCases = casesResponse.data
              .filter(c => c.caseStatus === "Ongoing")
              .map(c => ({ caseNo: c.caseNo, caseName: c.caseName })); // Extract relevant fields

          console.log("✅ Ongoing Cases:", ongoingCases);

          // ✅ Filter leads where the signed-in officer is assigned and the case is ongoing
          const assignedLeads = leadsResponse.data
              .filter(lead =>
                  lead.assignedTo.includes(signedInOfficer) && 
                  ongoingCases.some(c => c.caseNo === lead.caseNo && c.caseName === lead.caseName) // Match ongoing cases
              )
              .map(lead => ({
                  id: lead.leadNo,
                  description: lead.description,
                  dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
                  priority: lead.priority || "Medium",
                  flags: lead.associatedFlags || [],
                  assignedOfficers: lead.assignedTo, // Keep all assigned officers
                  leadStatus: lead.leadStatus, // Capture status
                  caseName: lead.caseName,
                  caseNo: lead.caseNo
              }));

          // ✅ Filter leads where status is "Pending"
          const pendingLeads = assignedLeads.filter(lead => lead.leadStatus === "Pending");

          console.log("✅ Filtered Assigned Leads:", assignedLeads);
          console.log("✅ Filtered Pending Leads:", pendingLeads);

          // ✅ Update state with filtered leads
          setLeads(prevLeads => ({
              ...prevLeads,
              assignedLeads: assignedLeads,
              pendingLeads: pendingLeads
          }));

      } catch (error) {
          console.error("❌ Error fetching assigned leads:", error.response?.data || error);
      }
  };

  fetchPendingLeads();
}, [signedInOfficer]);

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
 


  // Calculate remaining days from the due date
  const calculateRemainingDays = (dueDate) => {
    const currentDate = new Date();
    const targetDate = new Date(dueDate);
    const timeDifference = targetDate - currentDate;
    return Math.max(0, Math.ceil(timeDifference / (1000 * 60 * 60 * 24))); // Return 0 if negative
  };
  


  // Adding a case to the list
 // Adding a case to the list
const addCase = (newCase) => {
  if (!newCase.id || !newCase.title || !newCase.status) {
    // alert("Case must have an ID, title, and status.");
    return;
  }
    setCases((prevCases) => [...prevCases, newCase]);
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


  const columnWidths = {
  "Case No.":   "13%",
  "Role":      "11%"
};

// Columns + mapping to your data fields
const assignedCols = [
  "Lead No.",
  "Lead Name",
  "Due Date",
  "Priority",
  "Days Left",
  "Flags",
  "Assigned Officers",
];


  // Filter and Sort Function

const [sortConfig,   setSortConfig]   = useState({ key: null, direction: 'asc' });
  const [filterConfig,setFilterConfig] = useState({ id: "", description: "", dueDate: "", priority: "", title: "", role: "" });
  const [openFilter,  setOpenFilter]   = useState(null);


  const colKey = {
    "Case No.":  "id",
    "Case Name": "title",
    "Role":      "role"
  };

  // 1) Precompute distinct values for each field
    const distinctValues = useMemo(() => {
      const map = { id: new Set(), description: new Set(), dueDate: new Set(), priority: new Set(), title: new Set(), role: new Set()  };
      cases.forEach(lead => {
        Object.entries(map).forEach(([field, set]) => {
          set.add(String(lead[field]));
        });
      });
      return Object.fromEntries(
        Object.entries(map).map(([k, set]) => [k, Array.from(set)])
      );
    }, [cases]);
  
    // 2) Filter + sort
    const sortedCases  = useMemo(() => {
      // apply filters
      const filtered = cases.filter(lead =>
        Object.entries(filterConfig).every(([field, val]) => {
          return !val || String(lead[field]) === val;
        })
      );
      // apply sort
      if (!sortConfig.key) return filtered;
      const PRIORITY_ORDER = { Low:1, Medium:2, High:3 };
      return [...filtered].sort((a,b) => {
        let aV = a[sortConfig.key], bV = b[sortConfig.key];
        if (sortConfig.key==="priority") {
          aV = PRIORITY_ORDER[aV]||0; bV = PRIORITY_ORDER[bV]||0;
        }
        if (aV < bV) return sortConfig.direction==='asc' ? -1 : 1;
        if (aV > bV) return sortConfig.direction==='asc' ?  1 : -1;
        return 0;
      });
    }, [cases, sortConfig, filterConfig]);
  
    // 3) Handlers
    const handleSort = col => {
      const key = colKey[col];
      setSortConfig(prev => ({
        key,
        direction: prev.key===key && prev.direction==='asc' ? 'desc' : 'asc'
      }));
    };
    const handleFilterClick = col => {
      setOpenFilter(prev => prev===col ? null : col);
    };
  

 


    // close popups when clicking outside
    const popupRefs = useRef({});
    useEffect(() => {
      const onClick = e => {
        if (!Object.values(popupRefs.current).some(el => el?.contains(e.target))) {
          setOpenFilter(null);
        }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }, []);


  //
  // ─── 1) ASSIGNED LEADS SETUP ───────────────────────────────────────────────
  //
  const assignedColumns = [
    "Lead No.",
    "Lead Name",
    "Case Name",
    "Assigned Officers"
  ];
  const assignedColKey = {
    "Lead No.":          "id",
    "Lead Name":   "description",
    "Case Name":         "caseName",
    "Assigned Officers":"assignedOfficers"
  };
  const assignedColWidths = {
    "Lead No.":           "15%",
    "Lead Name":         "30%",
    "Case Name":          "30%",
    "Assigned Officers": "18%"
  };

  // filter + sort state
  const [assignedFilterConfig, setAssignedFilterConfig] = useState({
    id: "", description: "", caseName: "", assignedOfficers: ""
  });
  const [assignedSortConfig, setAssignedSortConfig] = useState({ key: null, direction: "asc" });
  const [openAssignedFilter, setOpenAssignedFilter] = useState(null);
  const popupAssignedRefs = useRef({});

  // handle toggles
  const handleFilterAssignedClick = col => {
    setOpenAssignedFilter(prev => prev === col ? null : col);
  };
  const handleSortAssigned = col => {
    const key = assignedColKey[col];
    setAssignedSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // distinct values for each filter dropdown
  const distinctAssigned = useMemo(() => {
  const map = Object.fromEntries(assignedColumns.map(c => [c, new Set()]));
  leads.assignedLeads.forEach(lead => {
    assignedColumns.forEach(col => {
      const key = assignedColKey[col];
      const val = lead[key];
      if (Array.isArray(val)) val.forEach(v => map[col].add(v));
      else map[col].add(String(val));
    });
  });
  return Object.fromEntries(
    Object.entries(map).map(([c, set]) => [c, Array.from(set)])
  );
}, [leads.assignedLeads]);


  // sorted + filtered data
  const sortedAssignedLeads = useMemo(() => {
  return leads.assignedLeads
    // 1. Filter
    .filter(lead =>
      Object.entries(assignedFilterConfig).every(([field, val]) => {
        if (!val) return true;
        const cell = lead[field];
        if (Array.isArray(cell)) return cell.includes(val);
        return String(cell) === val;
      })
    )
    // 2. Sort
    .sort((a, b) => {
      const { key, direction } = assignedSortConfig;
      if (!key) return 0;
      let aVal = a[key];
      let bVal = b[key];
      if (Array.isArray(aVal)) aVal = aVal[0];
      if (Array.isArray(bVal)) bVal = bVal[0];
      return direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
}, [leads.assignedLeads, assignedFilterConfig, assignedSortConfig]);


  // close filter popups on outside click
  useEffect(() => {
    const handler = e => {
      if (!Object.values(popupAssignedRefs.current).some(r => r?.contains(e.target))) {
        setOpenAssignedFilter(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  

  return (
    <div className = "main-page-bodyhp">
    <Navbar />
    {/* <div className="main-container"> */}
        {/* Pass down props for leads, cases, and modal visibility */}
        {/* <SideBar
          leads={leads} // Pass leads if needed
          cases={cases}
          setActiveTab={setActiveTab}
          onShowCaseSelector={handleShowCaseSelector} // Pass handler
        /> */}
         {/* <div className="above-sec-MP"> */}
        {/* <div className="logo-sec">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} 
            alt="Police Department Logo"
            className="police-logo-main-page"
          />
          <h1 className="main-page-heading"> PIMS</h1>
        </div> */}
        {/* </div> */}
        {/* <div className="top-controlsMP"> */}
            {/* <div className="search-container">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search Cases"
                    />
              </div> */}
              {/* <div className="slidebartopcontrolMP">
              <SlideBar
              onAddCase={(newCase) => addCase(newCase)}
              buttonClass="custom-add-case-btn1"
            />
            </div> */}
          {/* </div> */}
        {/* <div className="content-container"> */}
          {/* {showCaseSelector && (
            <CaseSelector
              cases={cases}
              navigateTo={navigateTo}
              onClose={handleCloseCaseSelector} // Pass close functionality
            />
          )} */}
           <div className="main-page-contenthp">
           <div className="main-page-abovepart">

           {/* <NotificationCard acceptLead={acceptLead} signedInOfficer={signedInOfficer} /> */}
           <NotificationCard ref={notificationRef} acceptLead={acceptLead} signedInOfficer={signedInOfficer} />


<div className= "add-case-section">
    <h2> Click here to add a new case</h2>
    {/* <div className="slidebartopcontrolMP"> */}
        <SlideBar
        onAddCase={(newCase) => addCase(newCase)}
        buttonClass="custom-add-case-btn1"
        refreshNotifications={refreshNotifications}
      />
      {/* </div> */}
  </div>
  </div>
      <div className="left-content">
      <div className="stats-bar">
        
          <span
            className={`hoverable ${activeTab === "cases" ? "active" : ""}`}
            onClick={() => setActiveTab("cases")}
          >
            My Ongoing Cases: {cases.length}
          </span>

            <span
            className={`hoverable ${activeTab === "assignedLeads" ? "active" : ""}`}
            onClick={() => setActiveTab("assignedLeads")}
          >
            Assigned Leads: {leads.assignedLeads.length}
          </span>

          {/* <span
            className={`hoverable ${activeTab === "pendingLeads" ? "active" : ""}`}
            onClick={() => setActiveTab("pendingLeads")}
          >
            Pending Leads: {leads?.pendingLeads?.length || 0}
          </span> */}
          <span
            className={`hoverable ${activeTab === "pendingLeadReturns" ? "active" : ""}`}
            onClick={() => setActiveTab("pendingLeadReturns")}
          >
            Lead Returns for Review: {leads.pendingLeadReturns.length}
          </span>
        </div>

        <div className="content-section">

{activeTab === "cases" && (
          <div className="table-scroll-container">
            <table className="leads-table">
              <thead>
                <tr>
                  {["Case No.","Case Name","Role"].map(col => {
                    const key = colKey[col];
                    return (
                      <th key={col} className="column-header1" style={{ width: columnWidths[col] }}>
                          <div className="header-title">{col}</div>
                       <div className="header-controls"  ref={el => (popupRefs.current[col] = el)}>
    <button onClick={() => handleFilterClick(col)}>
      <img src={`${process.env.PUBLIC_URL}/Materials/filter.png`} className="icon-image"/>
    </button>
     {openFilter === col && (
                            <div className="filter-popup">
                              <select
                                value={filterConfig[key]}
                                onChange={e =>
                                  setFilterConfig(cfg => ({
                                    ...cfg,
                                    [key]: e.target.value
                                  }))
                                }
                              >
                                <option value="">All</option>
                                {distinctValues[key].map(v => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </select>
                              <div className="filter-popup-buttons">
                                <button onClick={() => setOpenFilter(null)}>Apply</button>
                                <button onClick={() => {
                                  setFilterConfig(cfg => ({ ...cfg, [key]: "" }));
                                  setOpenFilter(null);
                                }}>Clear</button>
                              </div>
                            </div>
                          )}

     <button onClick={() => handleSort(col)} >
                            {sortConfig.key === key
                              ? (sortConfig.direction === "asc" ?  <img 
                                src={`${process.env.PUBLIC_URL}/Materials/sort1.png`}
                                alt="Sort Icon"
                                className="icon-image"
                              /> :  <img 
                              src={`${process.env.PUBLIC_URL}/Materials/sort1.png`}
                              alt="Sort Icon"
                              className="icon-image"
                            />)
                              :  <img 
                              src={`${process.env.PUBLIC_URL}/Materials/sort1.png`}
                              alt="Sort Icon"
                              className="icon-image"
                            />}
                          </button>
  </div>
                      </th>
                    );
                  })}
                  <th style={{ width: "10%" }} ></th>{/* extra column for “View” button */}
                </tr>
              </thead>
              <tbody>
                {sortedCases.length > 0 ? (
                  sortedCases.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.title}</td>
                      <td>{c.role}</td>
                      <td>
                        <button
                          className="view-btn1"
                          onClick={() => handleCaseClick(c)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      No cases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
             </div>
                    
           )}
    
         
     





  {activeTab === "assignedLeads" && (
        <div className="assigned-leads">
          <div className="table-scroll-container">
            <table className="leads-table">
              <thead>
                <tr>
                  {assignedColumns.map(col => (
                    <th
                      key={col}
                      className="column-header1"
                      style={{ width: assignedColWidths[col] }}
                    >
                      {col}
                      <span
                        className="column-controls1"
                        ref={el => (popupAssignedRefs.current[col] = el)}
                      >
                        <button onClick={() => handleFilterAssignedClick(col)}>
                          <img
                            src={`${process.env.PUBLIC_URL}/Materials/filter.png`}
                            alt="Filter"
                            className="icon-image"
                          />
                        </button>
                        {openAssignedFilter === col && (
                          <div className="filter-popup">
                            <select
                              value={assignedFilterConfig[assignedColKey[col]]}
                              onChange={e =>
                                setAssignedFilterConfig(cfg => ({
                                  ...cfg,
                                  [assignedColKey[col]]: e.target.value
                                }))
                              }
                            >
                              <option value="">All</option>
                              {distinctAssigned[col].map(v => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                            <div className="filter-popup-buttons">
                              <button onClick={() => setOpenAssignedFilter(null)}>
                                Apply
                              </button>
                              <button onClick={() => {
                                setAssignedFilterConfig(cfg => ({
                                  ...cfg,
                                  [assignedColKey[col]]: ""
                                }));
                                setOpenAssignedFilter(null);
                              }}>
                                Clear
                              </button>
                            </div>
                          </div>
                        )}
                        <button onClick={() => handleSortAssigned(col)}>
                          <img
                            src={`${process.env.PUBLIC_URL}/Materials/sort1.png`}
                            alt="Sort"
                            className="icon-image"
                          />
                        </button>
                      </span>
                    </th>
                  ))}
                  <th style={{ width: "10%" }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedAssignedLeads.length > 0 ? (
                  sortedAssignedLeads.map(lead => (
                    <tr key={lead.id}>
                      <td>{lead.id}</td>
                      <td>{lead.description}</td>
                      <td>{lead.caseName}</td>
                      <td>{lead.assignedOfficers.join(", ")}</td>
                      <td>
                        <button className="view-btn1" onClick={() => handleCaseClick(lead)}>
                          View
                        </button>
                      
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={assignedColumns.length + 1} style={{ textAlign: "center" }}>
                      No Assigned Leads Available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalEntries={totalEntries}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}





         
{activeTab === "pendingLeads" && (
  <div className="pending-leads">


<div className="table-scroll-container">
<table className="leads-table" style={{ minWidth: "1000px" }}>
      <thead>
        <tr>
          <th style={{ width: "10%" }}>Lead No.</th>
          <th>Lead Name</th>
          <th>Assigned Officers</th>
          <th>Case Name</th>
          <th style={{ width: "10%" }}>Due Date</th>
          <th style={{ width: "10%" }}></th>
        </tr>
      </thead>
      <tbody>
        {leads.length > 0 ? (
          leads.pendingLeads
          .map((lead) => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td style={{ width: "14%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
                {lead.assignedOfficers.map((officer, index) => (
                  <span key={index} style={{ display: "block", marginBottom: "4px", padding: "8px 0px 0px 8px" }}>{officer}</span>
                ))}
                </td>
              <td>{lead.caseName }</td>
              <td>{lead.dueDate}</td>
              <td>
                <button
                  className="view-btn1"
                >
                  View
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center' }}>
              No Pending Leads Available
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </div>

  </div>
)}

{activeTab === "pendingLeadReturns" && (
  <div className="pending-lead-returns">
<div className="table-scroll-container">
<table className="leads-table" style={{ minWidth: "1000px" }}>
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Lead No.</th>
                  <th>Lead Name</th>
                  <th style={{ width: "20%" }}>Case Name</th>
                  <th style={{ width: "10%" }}></th>
                </tr>
              </thead>
              <tbody>
                {leads.pendingLeadReturns.length > 0 ? (
                leads.pendingLeadReturns.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.id}</td>
                      <td>{lead.description}</td>
                      <td>{lead.caseName}</td>
                      <td>
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
                    <td colSpan="4" style={{ textAlign: 'center' }}>
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
    </div>
   </div>
  );
};

