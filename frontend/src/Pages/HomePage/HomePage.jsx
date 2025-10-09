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
import { AlertModal } from "../../components/AlertModal/AlertModal";
import api from "../../api";


export const HomePage = () => {

  const [activeTab, setActiveTab] = useState("notifications"); // Default tab
  const isCaseMgmt = activeTab !== "notifications";  
  const filterButtonRefs = useRef({});
  const assignedFilterButtonRefs = useRef({});
  const pendingFilterButtonRefs = useRef({});
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [caseToClose, setCaseToClose]       = useState({ caseNo: null, caseName: "" });
  // NEW: controls the Add Case modal/drawer
const [showAddCase, setShowAddCase] = useState(false);


 
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const totalPages = 10;
    const totalEntries = 100;
    const [showCaseSelector, setShowCaseSelector] = useState(false);
    const [navigateTo, setNavigateTo] = useState(""); 

    const { setSelectedCase, setToken, setSelectedLead } = useContext(CaseContext);
    const signedInOfficer = localStorage.getItem("loggedInUser");


    const [cases, setCases] = useState([]);

    const formatDate = (dateString) => {
        if (!dateString) return ""; // Handle empty dates
        const date = new Date(dateString);
        if (isNaN(date)) return ""; // Handle invalid dates
      
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const year = date.getFullYear().toString().slice(-4
        ); // Get last two digits of the year
      
        return `${month}/${day}/${year}`;
    };


    useEffect(() => {
      if (!isCaseMgmt) return;                
    let cancelled = false;
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

          if (cancelled) return;

          console.log("✅ API Response:", response.data); // Debugging log

          // ✅ Filter cases where the signed-in officer is assigned
          const assignedCases = response.data
            .filter(c =>
              c.caseStatus === "Ongoing" &&
              c.assignedOfficers.some(o => o.name === signedInOfficer)
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(c => {
              const officer = c.assignedOfficers.find(o => o.name === signedInOfficer);
              return {
                id: c.caseNo,
                title: c.caseName,
                status: c.caseStatus,
                role: officer?.role || "Unknown",
                createdAt: c.createdAt 
              };
            });

            setCases(assignedCases); // ✅ Set filtered cases in state
            } catch (error) {
               console.error("❌ Error fetching cases:", error.response?.data || error);
              }
              };
              fetchCases(); // Initial call
              const intervalId = setInterval(fetchCases, 15_000); // Poll every 15s

              // return () => clearInterval(intervalId);
              return () => { cancelled = true; clearInterval(intervalId); };
    }, [isCaseMgmt, signedInOfficer]);

  
    const handleViewAssignedLead = async (lead) => {
      let role = "Investigator"; // default
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");
        // fetch the case’s team info so we know if current user is CM or Investigator
        const caseRes = await api.get(
          `/api/cases/${lead.caseNo}/team`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (caseRes.data.caseManager === signedInOfficer) {
          role = "Case Manager";
        } else if (
          Array.isArray(caseRes.data.investigators) &&
          caseRes.data.investigators.includes(signedInOfficer)
        ) {
          role = "Investigator";
        }
      } catch (err) {
        console.error("❌ Failed to fetch case role:", err);
      }

      // 2) Build a single state object that matches what LeadReview.jsx expects
      const caseDetails = {
        caseNo: lead.caseNo,
        caseName: lead.caseName,
        role,
      };
      const leadId = lead.id;             // numeric leadNo
      const leadDescription = lead.description;

      // 3) Write into Context + localStorage
      setSelectedCase(caseDetails);
      setSelectedLead({ leadNo: leadId, leadName: leadDescription });
      localStorage.setItem("role", role);
      localStorage.setItem("selectedCase", JSON.stringify(caseDetails));

      // 4) Finally navigate to /LeadReview
      navigate("/LeadReview", {
        state: { caseDetails, leadId, leadDescription },
      });
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
  } else if (caseDetails.role === "Case Manager" || caseDetails.role === "Detective Supervisor") {
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

// const handleLRClick = (lead) => {
//   // 1. Build caseDetails and leadDetails
//   const caseDetails = {
//     caseNo:   lead.caseNo,
//     caseName: lead.caseName
//   };
//   const leadDetails = {
//     leadNo:   lead.id,
//     leadName: lead.description
//   };

//   // 2. Update context
//   setSelectedCase(caseDetails);
//   setSelectedLead(leadDetails);

//   // 3. Persist role if needed (e.g. "Case Manager")
//   localStorage.setItem("role", "Case Manager");

//   // 4. Navigate to LRInstruction, passing both objects via state
//   navigate("/LRInstruction", {
//     state: {
//       caseDetails,
//       leadDetails
//     }
//   });
// };

//  const handleLRClick = async (lead) => {
//    let role = "";
//    try {
//      const token = localStorage.getItem("token");
//      if (!token) throw new Error("No token");
//      // fetch the case’s team info
//      const caseRes = await api.get(
//        `/api/cases/${lead.caseNo}/team`,
//        { headers: { Authorization: `Bearer ${token}` } }
//      );
//      if (caseRes.data.detectiveSupervisor === signedInOfficer) {
//        role = "Detective Supervisor";
//      } 
//       else if (
//        Array.isArray(caseRes.data.investigators) &&
//        caseRes.data.caseManagers.includes(signedInOfficer)
//      ) {
//        role = "Case Manager";
//      }else if (
//        Array.isArray(caseRes.data.investigators) &&
//        caseRes.data.investigators.includes(signedInOfficer)
//      ) {
//        role = "Investigator";
//      }
//      console.log("role", role);
//    } 
   
//    catch (err) {
//      console.error("❌ Failed to fetch case role:", err);
//    }

//    const caseDetails = {
//      caseNo:   lead.caseNo,
//      caseName: lead.caseName,
//      role
//    };
//    const leadDetails = {
//      leadNo:   lead.id,
//      leadName: lead.description
//    };

//   setSelectedCase(caseDetails);
//    setSelectedLead(leadDetails);
//    localStorage.setItem("role", role);

//    navigate("/LRInstruction", {
//      state: { caseDetails, leadDetails }
//    });
//  };

const handleLRClick = async (lead) => {
  let role = localStorage.getItem("role") || ""; // fallback if API call fails

  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");

    const { data } = await api.get(`/api/cases/${lead.caseNo}/team`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const isSupervisor =
      data.detectiveSupervisor === signedInOfficer ||
      data.detectiveSupervisor?.username === signedInOfficer;

    const isCM = Array.isArray(data.caseManagers) &&
      (data.caseManagers.includes?.(signedInOfficer) ||
       data.caseManagers.some?.(u => u?.username === signedInOfficer));

    const isInv = Array.isArray(data.investigators) &&
      (data.investigators.includes?.(signedInOfficer) ||
       data.investigators.some?.(u => u?.username === signedInOfficer));

    if (isSupervisor)      role = "Detective Supervisor";
    else if (isCM)         role = "Case Manager";
    else if (isInv)        role = "Investigator";
  } catch (err) {
    console.error("❌ Failed to fetch case role:", err);
  }

  const caseDetails = { caseNo: lead.caseNo, caseName: lead.caseName, role };
  const leadDetails = { leadNo: lead.id, leadName: lead.description }; // assuming lead.id === leadNo

  setSelectedCase(caseDetails);
  setSelectedLead(leadDetails);
  localStorage.setItem("role", role);
  localStorage.setItem("selectedCase", JSON.stringify(caseDetails)); // optional but handy on refresh

  navigate("/LRInstruction", { state: { caseDetails, leadDetails } });
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

const handleCloseCase = async (caseNo, caseName) => {

  try {
    const token = localStorage.getItem("token");
    await api.put(
      `/api/cases/${encodeURIComponent(caseNo)}/close`,
      {}, // no body needed—the route reads caseNo from the URL
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    await api.put(
      `/api/notifications/close/${encodeURIComponent(caseNo)}`,
      {}, // no request body
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );


    // optimistically drop it from your "Ongoing" list
    setCases(prev => prev.filter(c => c.id !== caseNo));
  } catch (err) {
    console.error("Failed to close case:", err);
    alert("Error closing case. See console for details.");
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
  assignedLeads: [],
  pendingLeads: [],
  pendingLeadReturns: [],
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
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
              .filter(lead => Array.isArray(lead.assignedTo) && 
                  lead.assignedTo.some(o => o.username === signedInOfficer) &&
                  ongoingCases.some(c => c.caseNo === lead.caseNo) // Match ongoing cases
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

useEffect(() => {
  const fetchLeadReturnsForReview = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No token found. User is not authenticated.");
        return;
      }

      // 1) Call the new server route. It already filters by:
      //    assignedBy = signedInOfficer && leadStatus = "In Review"
      const { data: serverLeadReturns } = await api.get("/api/lead/lead-returnforreview", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      console.log("✅ API Response (Lead Returns For Review):", serverLeadReturns);

      // 2) (OPTIONAL) If you want to only show those whose case is still Ongoing,
      //    fetch all cases and build a Set of “ongoing” caseNo||caseName.
      const { data: allCases } = await api.get("/api/cases", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const ongoingSet = new Set(
        allCases
          .filter(c => c.caseStatus === "Ongoing")
          .map(c => `${c.caseNo}||${c.caseName}`)
      );

      // 3) Map serverLeadReturns → front-end shape, and optionally filter by ongoing cases
      const mappedForReview = serverLeadReturns
        .filter(lead =>
          // If you only want those whose case is still ongoing:
          ongoingSet.has(`${lead.caseNo}||${lead.caseName}`)
        )
        .map(lead => ({
          id:          lead.leadNo,       // numeric leadNo
          description: lead.description,  // leadName
          caseName:    lead.caseName,
          caseNo:      lead.caseNo,
          // (You can add any other fields you need here: dueDate, priority, etc.)
        }));

      console.log("✅ Filtered Lead Returns For Review:", mappedForReview);

      // 4) Save them into state. Here I’m choosing a new key: pendingLeadReturnsForCM.
      setLeads(prev => ({
        ...prev,
        pendingLeadReturns: mappedForReview
      }));
    } catch (err) {
      console.error(
        "❌ Error fetching Lead Returns for review:",
        err.response?.data || err
      );
    }
  };
console.log("pending LR",leads );
  // Run once immediately, then every 15 seconds
  fetchLeadReturnsForReview();
  const intervalId = setInterval(fetchLeadReturnsForReview, 15000);
  return () => clearInterval(intervalId);
}, [signedInOfficer]);

  // ─── Fetch only those leads where assignedTo.username === signedInOfficer AND leadStatus === "Assigned" ─────────
  useEffect(() => {
    const fetchAssignedLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("❌ No token found. User is not authenticated.");
          return;
        }

        // 1) Call the new server route. It already filters by leadStatus = "Assigned" and assignedTo.username.
        const { data: serverLeads } = await api.get("/api/lead/assigned-only", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        console.log("✅ API Response (Assigned-Only Leads):", serverLeads);

        // 2) OPTIONAL: If you still want to show only "Ongoing" cases, fetch /api/cases and filter:
        const { data: allCases } = await api.get("/api/cases", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const ongoingSet = new Set(
          allCases
            .filter(c => c.caseStatus === "Ongoing")
            .map(c => `${c.caseNo}||${c.caseName}`)
        );

        // 3) Map serverLeads → front-end shape, and optionally filter by ongoing cases:
        const mappedAssignedLeads = serverLeads
          .filter(lead => ongoingSet.has(`${lead.caseNo}||${lead.caseName}`))
          .map(lead => ({
            id: lead.leadNo,
            description: lead.description,
            caseName: lead.caseName,
            caseNo: lead.caseNo,
            // assignedTo is an array of { username, status }:
            assignedOfficers: lead.assignedTo.map(o => o.username),
            dueDate: lead.dueDate
              ? new Date(lead.dueDate).toISOString().split("T")[0]
              : "N/A",
            priority: lead.priority || "Medium",
            flags: lead.associatedFlags || [],
            leadStatus: lead.leadStatus
          }));

        console.log("✅ Filtered Assigned Leads (after ongoing filter):", mappedAssignedLeads);

        setLeads(prev => ({
          ...prev,
          assignedLeads: mappedAssignedLeads
        }));
      } catch (err) {
        console.error("❌ Error fetching assigned-only leads:", err.response?.data || err);
      }
    };

    fetchAssignedLeads();

    // If you want to poll every X seconds (e.g. 15s), you can uncomment:
    const intervalId = setInterval(fetchAssignedLeads, 15000);
    return () => clearInterval(intervalId);
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
    setCases((prevCases) => [newCase, ...prevCases]);
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
  "Case No.":   "7%",
  "Case Name":  "16%",         // you can tweak widths…
  "Created At": "7%",         // ← new
  "Role":       "8%",
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
const [filterConfig, setFilterConfig] = useState({
  id:    [],
  title: [],
  createdAt: [],
  role:  []
});

  const [openFilter,  setOpenFilter]   = useState(null);


  const colKey = {
    "Case No.":  "id",
    "Case Name": "title",
    "Created At": "createdAt",
    "Role":      "role"
  };

  // 1) Precompute distinct values for each field
    const distinctValues = useMemo(() => {
  const map = {
    id: new Set(),
    title: new Set(),
    createdAt: new Set(),
    role: new Set(),
  };

  cases.forEach(c => {
    map.id.add(String(c.id));
    map.title.add(c.title);
    map.createdAt.add(formatDate(c.createdAt));          // ← use your formatter
    map.role.add(c.role);
  });

  return Object.fromEntries(
    Object.entries(map).map(([key, set]) => [key, [...set]])
  );
}, [cases]);

const sortedCases = useMemo(() => {
  // 1) apply filters
  const filtered = cases.filter(c => {
    return Object.entries(filterConfig).every(([field, selectedValues]) => {
      if (!selectedValues || selectedValues.length === 0) return true;

      // get the cell value (format date for createdAt)
      const cell = field === "createdAt"
        ? formatDate(c.createdAt)
        : String(c[field]);

      return selectedValues.includes(cell);
    });
  });

  // 2) apply your existing sort logic (unchanged)
  if (!sortConfig.key) return filtered;
  const PRIORITY_ORDER = { Low:1, Medium:2, High:3 };
  return [...filtered].sort((a,b) => {
    let aV = a[sortConfig.key], bV = b[sortConfig.key];
    if (sortConfig.key === "priority") {
      aV = PRIORITY_ORDER[aV]||0;
      bV = PRIORITY_ORDER[bV]||0;
    }
    if (aV < bV) return sortConfig.direction === "asc" ? -1 : 1;
    if (aV > bV) return sortConfig.direction === "asc" ?  1 : -1;
    return 0;
  });
}, [cases, filterConfig, sortConfig]);

 


    // close popups when clicking outside
    // const popupRefs = useRef({});
    // useEffect(() => {
    //   const onClick = e => {
    //     if (!Object.values(popupRefs.current).some(el => el?.contains(e.target))) {
    //       setOpenFilter(null);
    //     }
    //   };
    //   document.addEventListener('mousedown', onClick);
    //   return () => document.removeEventListener('mousedown', onClick);
    // }, []);


  //
  // ─── 1) ASSIGNED LEADS SETUP ───────────────────────────────────────────────
  //
  const assignedColumns = [
    "Lead No.",
    "Lead Name",
    "Case Name",
    "Assigned Officers"
  ];
  const assignedFilterRefs   = useRef({});

  const assignedColKey = {
    "Lead No.":          "id",
    "Lead Name":   "description",
    "Case Name":         "caseName",
    "Assigned Officers":"assignedOfficers"
  };
  const assignedColWidths = {
    "Lead No.":           "8%",
    "Lead Name":         "22%",
    "Case Name":          "18%",
    "Assigned Officers": "15%"
  };

  // filter + sort state for Assigned Leads
const [assignedFilterConfig,   setAssignedFilterConfig]   = useState({ id: [], description: [], caseName: [], assignedOfficers: [] });
const [assignedSortConfig,     setAssignedSortConfig]     = useState({ key: null, direction: 'asc' });
const [openAssignedFilter,     setOpenAssignedFilter]     = useState(null);
const [tempAssignedSelections, setTempAssignedSelections] = useState({});
// const popupAssignedRefs = useRef({});

const distinctAssigned = useMemo(() => {
  const map = {
    id: new Set(),
    description: new Set(),
    caseName: new Set(),
    assignedOfficers: new Set(),
  };
  leads.assignedLeads.forEach(lead => {
    map.id.add(String(lead.id));
    map.description.add(lead.description);
    map.caseName.add(lead.caseName);
    lead.assignedOfficers.forEach(o => map.assignedOfficers.add(o));
  });
  return Object.fromEntries(
    Object.entries(map).map(([k, set]) => [k, Array.from(set)])
  );
}, [leads.assignedLeads]);

const filteredAssignedLeads = useMemo(() => {
  // 1) filter
  let data = leads.assignedLeads.filter(lead => {
    return Object.entries(assignedFilterConfig).every(([key, sel]) => {
      if (!sel.length) return true;
      let cell = lead[key];
      if (Array.isArray(cell)) {
        return cell.some(v => sel.includes(v));
      }
      return sel.includes(String(cell));
    });
  });
  // 2) sort
  const { key, direction } = assignedSortConfig;
  if (key) {
    data = data.slice().sort((a, b) => {
      let aV = a[key], bV = b[key];
      if (Array.isArray(aV)) aV = aV[0];
      if (Array.isArray(bV)) bV = bV[0];
      return direction === 'asc'
        ? String(aV).localeCompare(String(bV))
        : String(bV).localeCompare(String(aV));
    });
  }
  return data;
}, [leads.assignedLeads, assignedFilterConfig, assignedSortConfig]);

// 1) Track filter text per assigned-column
const [assignedFilterSearch, setAssignedFilterSearch] = useState({});
const handleAssignedFilterSearch = (dataKey, txt) =>
  setAssignedFilterSearch(fs => ({ ...fs, [dataKey]: txt }));

// 2) “Select all” checkbox logic
const assignedAllChecked = dataKey => {
  const sel = tempAssignedSelections[dataKey] || [];
  return sel.length === (distinctAssigned[dataKey] || []).length;
};
const toggleAssignedSelectAll = dataKey => {
  const all = distinctAssigned[dataKey] || [];
  setTempAssignedSelections(ts => ({
    ...ts,
    [dataKey]: ts[dataKey]?.length === all.length ? [] : [...all]
  }));
};

// 3) Individual checkbox toggle
const handleAssignedCheckboxToggle = (dataKey, v) =>
  setTempAssignedSelections(ts => {
    const sel = ts[dataKey] || [];
    return {
      ...ts,
      [dataKey]: sel.includes(v)
        ? sel.filter(x => x !== v)
        : [...sel, v]
    };
  });

// 4) Apply the pending selections into your filterConfig
const applyAssignedFilter = dataKey =>
  setAssignedFilterConfig(fc => ({
    ...fc,
    [dataKey]: tempAssignedSelections[dataKey] || []
  }));

// 5) A generic onSort helper that takes you into your assignedSortConfig
const sortAssignedColumn = (dataKey, direction) =>
  setAssignedSortConfig({ key: dataKey, direction });




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

  console.log("check assigned leads", leads.assignedLeads);

  // sorted + filtered data
  const sortedAssignedLeads = useMemo(() => {
  return leads.assignedLeads
    // 1. Filter
    .filter(lead =>
      Object.entries(assignedFilterConfig).every(([field, val]) => {
        if (!val || val.length === 0) return true; 
        const cell = lead[field];
        if (Array.isArray(cell)) {
         // keep the lead if ANY of the selectedValues is in the cell‐array
         return val.some(val => cell.includes(val));
       } else {
         // scalar cell: keep if it matches one of the selectedValues
         return val.includes(String(cell));
       }
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

console.log("Sorted Assigned Leads", sortedAssignedLeads);


  // close filter popups on outside click
  // useEffect(() => {
  //   const handler = e => {
  //     if (!Object.values(popupAssignedRefs.current).some(r => r?.contains(e.target))) {
  //       setOpenAssignedFilter(null);
  //     }
  //   };
  //   document.addEventListener("mousedown", handler);
  //   return () => document.removeEventListener("mousedown", handler);
  // }, []);

  const [filterSearch, setFilterSearch] = useState({})
const [tempFilterSelections, setTempFilterSelections] = useState({})

  // 3) Sort header A→Z / Z→A
const sortColumn = (dataKey, direction) => {
  setSortConfig({ key: dataKey, direction });
};

// track search by dataKey
const handleFilterSearch = (dataKey, txt) =>
  setFilterSearch(fs => ({ ...fs, [dataKey]: txt }));

// toggle all by dataKey
const toggleSelectAll = (dataKey) => {
  const all = distinctValues[dataKey];
  setTempFilterSelections(ts => ({ ...ts, [dataKey]: ts[dataKey]?.length === all.length ? [] : [...all] }));
};

// check “all” by dataKey
const allChecked = (dataKey) => {
  const sel = tempFilterSelections[dataKey] || [];
  return sel.length === (distinctValues[dataKey] || []).length;
};

// single‐value toggle
const handleCheckboxToggle = (dataKey, v) => {
  setTempFilterSelections(ts => {
    const sel = ts[dataKey] || [];
    return {
      ...ts,
      [dataKey]: sel.includes(v)
        ? sel.filter(x => x !== v)
        : [...sel, v]
    };
  });
};

// apply filter by dataKey
const applyFilter = (dataKey) => {
  setFilterConfig(fc => ({ ...fc, [dataKey]: tempFilterSelections[dataKey] || [] }));
  setOpenFilter(null);
};

// 9) Cancel → drop all temp selections
const cancelFilter = () => {
  setTempFilterSelections({})
  setFilterSearch({})
  setOpenFilter(null)
}

// Filter and Sort for pending lead returns 

// State for filters & sorts on the Pending Returns tab
const [pendingFilterConfig,   setPendingFilterConfig]   = useState({
  id: [], description: [], caseName: []
});
const [pendingSortConfig,     setPendingSortConfig]     = useState({
  key: null, direction: 'asc'
});
const [openPendingFilter,     setOpenPendingFilter]     = useState(null);
const [tempPendingSelections, setTempPendingSelections] = useState({});
const popupPendingRefs = useRef({});
// Track search text if your Filter needs it
const [pendingFilterSearch,   setPendingFilterSearch]   = useState({});
const handlePendingFilterSearch = (dk, txt) =>
  setPendingFilterSearch(ps => ({ ...ps, [dk]: txt }));

const distinctPending = useMemo(() => {
  const map = { id: new Set(), description: new Set(), caseName: new Set() };
  leads.pendingLeadReturns.forEach(l => {
    map.id.add(String(l.id));
    map.description.add(l.description);
    map.caseName.add(l.caseName);
  });
  return Object.fromEntries(
    Object.entries(map).map(([k, s]) => [k, [...s]])
  );
}, [leads.pendingLeadReturns]);

const sortedPendingReturns = useMemo(() => {
  let data = leads.pendingLeadReturns.filter(l =>
    Object.entries(pendingFilterConfig).every(([key, sel]) => {
      if (!sel.length) return true;
      const cell = key === 'id' ? String(l[key]) : l[key];
      if (Array.isArray(cell)) return cell.some(v => sel.includes(v));
      return sel.includes(cell);
    })
  );
  const { key, direction } = pendingSortConfig;
  if (key) {
    data = data.slice().sort((a, b) => {
      const aV = Array.isArray(a[key]) ? a[key][0] : a[key];
      const bV = Array.isArray(b[key]) ? b[key][0] : b[key];
      return direction === 'asc'
        ? String(aV).localeCompare(String(bV))
        : String(bV).localeCompare(String(aV));
    });
  }
  return data;
}, [leads.pendingLeadReturns, pendingFilterConfig, pendingSortConfig]);




  return (
    //  <div className="page-scale"> 
     <div className="case-page-manager">

         <Navbar />
    <AlertModal
      isOpen={closeConfirmOpen}
      title="Confirm Close"
      message={`Are you sure you want to close the case ${caseToClose.caseNo}: ${caseToClose.caseName}?`}
      onConfirm={() => {
        setCloseConfirmOpen(false);
        // reuse your existing function:
        handleCloseCase(caseToClose.caseNo, caseToClose.caseName);
      }}
      onClose={() => setCloseConfirmOpen(false)}
    />

    {showAddCase && (
  <div className="hp-modal-backdrop" onClick={() => setShowAddCase(false)}>
    <div className="hp-modal-panel" onClick={(e) => e.stopPropagation()}>
      <div className="hp-modal-header">
        <h3>Add Case</h3>
        <button className="hp-close" onClick={() => setShowAddCase(false)}>×</button>
      </div>

      <SlideBar
        onAddCase={(newCase) => {
          addCase(newCase);          // your existing addCase()
          setActiveTab('cases');     // ensure we’re still on case mgmt
          setShowAddCase(false);     // close the modal
        }}
        buttonClass="custom-add-case-btn1"
      />
    </div>
  </div>
)}


    <div className = "main-container">
       <SideBar
            variant="home"
            activePage="HomePage"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onShowCaseSelector={setShowAddCase}
          />


    {/* <div className="main-page-contenthp"> */}
            
           <div className="left-content">

      <div className="main-page-abovepart">
          {!isCaseMgmt && (
    <>
        <NotificationCard  acceptLead={acceptLead} signedInOfficer={signedInOfficer} 
        />
    </>
          )}

{/*         
          <div className= "add-case-section">
            <SlideBar
                  onAddCase={(newCase) => addCase(newCase)}
                  buttonClass="custom-add-case-btn1"
            />
        </div> */}



        {/* <div className="case-overview-sec">
        <div className="cp-head">
          <h2> Cases Overview</h2>
        </div>
    
        </div> */}
      </div>

            {isCaseMgmt && (
    <>
      <div className="main-page-belowpart">
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
                  {["Case No.","Case Name","Created At","Role"].map(col => {
                    const dataKey = colKey[col];
                    return (
                      <th key={col} className="column-header1" style={{ width: columnWidths[col] , position: 'relative' }}>
                          <div className="header-title">{col}
                           <span> 
                               <button
                                ref={el => (filterButtonRefs.current[dataKey] = el)}
                                onClick={() =>
                                  setOpenFilter(prev => prev === dataKey ? null : dataKey)
                                }
                              >
                                <img src="/Materials/fs.png" className="icon-image"  />
                              </button>
                               <Filter
                                dataKey={dataKey}
                                distinctValues={distinctValues}
                                open={openFilter === dataKey}
                                anchorRef={{ current: filterButtonRefs.current[dataKey] }}
                                searchValue={filterSearch[dataKey] || ''}
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
                  <th style={{ width: "8%", textAlign: "center" }} >Actions</th>{/* extra column for “View” button */}
                </tr>
              </thead>
              <tbody>
                {sortedCases.length > 0 ? (
                  sortedCases.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.title}</td>
                      <td>{formatDate(c.createdAt)}</td> 
                      <td>{c.role}</td>
                      <td style={{ width: "5%", textAlign: "center" }} >
                        <div className="btn-sec-HP">
                        <button
                          className="manage-btn"
                          onClick={() => handleCaseClick(c)}
                        >
                          Manage
                        </button>

                        { (c.role === "Detective Supervisor" || c.role === "Case Manager") && (
                          <button
                            className="case-close-btn"
                            onClick={() => {
                              setCaseToClose({ caseNo: c.id, caseName: c.title });
                              setCloseConfirmOpen(true);
                            }}
                          >
                            Close
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" , padding: "8px" }}>
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
                  {assignedColumns.map(col => {
  const dataKey = assignedColKey[col]; // e.g. "id", "description", etc.
  return (
    <th key={col} style={{ width: assignedColWidths[col] }}>
      <div className="header-title">
        {col}
        <span>
          <button 
           ref={el => (assignedFilterButtonRefs.current[dataKey] = el)}
          onClick={() => setOpenAssignedFilter(prev => prev === dataKey ? null : dataKey ) }>
                        <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className="icon-image"/>
                      </button>
          <Filter
                        dataKey={dataKey}
                        distinctValues={distinctAssigned}
                        open={openAssignedFilter === dataKey}
                        anchorRef={{ current: assignedFilterButtonRefs.current[dataKey] }}
                        searchValue={assignedFilterSearch[dataKey] || ''}
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
                      />
        </span>
      </div>
    </th>
  );
})}
                     
                  <th style={{ width: "8%", textAlign: "center" }}>Actions</th>
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
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="view-btn1"
                          onClick={() =>  handleViewAssignedLead(lead)}
                        >
                         Manage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={assignedColumns.length + 1} style={{ textAlign: "center" , padding: "8px" }}>
                      No Assigned Leads Available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

          {/* <Pagination
            currentPage={currentPage}
            totalEntries={totalEntries}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          /> */}
    





         
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
          <th style={{ width: "10%" , textAlign: "center" }}>Actions</th>
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
              <td style={{ width: "5%", textAlign: "center" }}
>
                <button
                  className="view-btn1"
                >
                 Manage
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center', padding: "8px" }}>
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

  <colgroup>
      <col style={{ width: "10%" }} />     {/* Lead No. */}
      <col style={{ width: "35%" }} />   {/* Lead Name */}
      <col style={{ width: "30%" }} />   {/* Case Name */}
      <col style={{ width: "6%" }} />     {/* Actions */}
    </colgroup>
              <thead>
                <tr>
    {["Lead No.","Lead Name","Case Name"].map(col => {
      // map human column to your dataKey
      const keyMap = { "Lead No.": "id", "Lead Name": "description", "Case Name":"caseName" };
      const dataKey = keyMap[col];
      return (
        <th key={col} className="column-header1">
          <div className="header-title">
            {col}
            <span ref={el => popupPendingRefs.current[col] = el}>
              <button
              ref={el => (pendingFilterButtonRefs.current[dataKey] = el)}
                onClick={() =>
                  setOpenPendingFilter(prev => prev === dataKey ? null : dataKey)
                }
              >
                <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className="icon-image" />
              </button>
              <Filter
                dataKey={dataKey}
                distinctValues={distinctPending}
                open={openPendingFilter === dataKey}
                anchorRef={{ current: pendingFilterButtonRefs.current[dataKey] }}
                searchValue={pendingFilterSearch[dataKey] || ''}
                selections={tempPendingSelections[dataKey] || []}
                onSearch={handlePendingFilterSearch}
                allChecked={arr => (tempPendingSelections[arr] || []).length === (distinctPending[arr]||[]).length}
                onToggleAll={dk => {
                  const all = distinctPending[dk] || [];
                  setTempPendingSelections(ts => ({
                    ...ts,
                    [dk]: ts[dk]?.length === all.length ? [] : [...all]
                  }));
                }}
                onToggleOne={(dk, v) => {
                  setTempPendingSelections(ts => {
                    const sel = ts[dk]||[];
                    return { ...ts, [dk]: sel.includes(v) ? sel.filter(x=>x!==v) : [...sel, v] };
                  });
                }}
                onApply={dk => {
                  setPendingFilterConfig(fc => ({
                    ...fc,
                    [dk]: tempPendingSelections[dk] || []
                  }));
                  setOpenPendingFilter(null);
                }}
                onCancel={() => setOpenPendingFilter(null)}
              />
            </span>
          </div>
        </th>
      );
    })}
                  <th style={{ width: "8%", textAlign:"center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.pendingLeadReturns.length > 0 ? (
                leads.pendingLeadReturns.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.id}</td>
                      <td>{lead.description}</td>
                      <td>{lead.caseName}</td>
                      <td style={{  textAlign: "center" }}>
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
                    <td colSpan="4" style={{ textAlign: 'center' , padding: "8px" }}>
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
  //  </div>
  );
};

