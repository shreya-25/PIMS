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
    

  //  useEffect(() => {
  //    if (selectedCase?.caseNo && selectedCase?.caseName) {
  //      fetch(`http://localhost:5000/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`, {
  //        headers: {
  //          Authorization: `Bearer ${token}`,
  //          'Content-Type': 'application/json'
  //        },
  //      })
  //        .then((response) => {
  //          if (!response.ok) {
  //            throw new Error(`HTTP error! status: ${response.status}`);
  //          }
  //          return response.json();
  //        })
  //        .then((data) => {
  //          console.log("✅ Fetched Leads Data:", data); // 🔍 Debug API response
   
  //          // Ensure `data` is an array, or default to an empty array
  //          const leadsArray = Array.isArray(data) ? data : [];

  //          const filteredLeadsArray = leadsArray.filter((lead) => {
  //           if (
  //             lead.accessLevel === "Only Case Manager and Assignees" &&
  //             !lead.assignedTo?.includes(signedInOfficer) &&
  //             lead.assignedBy !== signedInOfficer
  //           ) {
  //             return false;
  //           }
  //           return true;
  //         });
   
  //          // ✅ Filter and map assigned and pending leads
  //          const assignedLeads = filteredLeadsArray
  //            .filter(lead => lead.leadStatus === "Assigned")
  //            .map(lead => ({
  //              id: lead.leadNo,
  //              description: lead.description,
  //              dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
  //              priority: lead.priority || "Medium",
  //              flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [], // Ensure array
  //              assignedOfficers: Array.isArray(lead.assignedTo) ? lead.assignedTo : [], // Ensure array
  //              leadStatus: lead.leadStatus,
  //              caseName: lead.caseName,
  //              caseNo: String(lead.caseNo) // Ensure string format
  //            }));
   
  //          const pendingLeads = filteredLeadsArray
  //            .filter(lead => lead.leadStatus === "Pending")
  //            .map(lead => ({
  //              id: lead.leadNo,
  //              description: lead.description,
  //              dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
  //              priority: lead.priority || "Medium",
  //              flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [], // Ensure array
  //              assignedOfficers: Array.isArray(lead.assignedTo) ? lead.assignedTo : [], // Ensure array
  //              leadStatus: lead.leadStatus,
  //              caseName: lead.caseName,
  //              caseNo: String(lead.caseNo) // Ensure string format
  //            }));

  //            const LRInReview = filteredLeadsArray
  //            .filter(lead => lead.leadStatus === "In Review")
  //            .map(lead => ({
  //              id: lead.leadNo,
  //              description: lead.description,
  //              dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
  //              priority: lead.priority || "Medium",
  //              flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [], // Ensure array
  //              assignedOfficers: Array.isArray(lead.assignedTo) ? lead.assignedTo : [], // Ensure array
  //              leadStatus: lead.leadStatus,
  //              caseName: lead.caseName,
  //              caseNo: String(lead.caseNo) // Ensure string format
  //            }));
   
   
  //          console.log("✅ Assigned Leads:", assignedLeads);
  //          console.log("✅ Pending Leads:", pendingLeads);
   
  //          setLeads((prev) => ({
  //            ...prev,
  //            allLeads: filteredLeadsArray,
  //            assignedLeads: assignedLeads,
  //            pendingLeads: pendingLeads,
  //            pendingLeadReturns: LRInReview
  //          }));
  //        })
  //        .catch((error) => {
  //          console.error("❌ Error fetching leads:", error.message);
  //        });
  //    }
  //  }, [selectedCase, token]);


  // useEffect(() => {
  //   const fetchLeads = useCallback(async () => {
  //     if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
  
  //     try {
  //       const token = localStorage.getItem("token");
  
  //       const response = await api.get(
  //         `/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );
  
  //       const data = response.data;
  //       console.log("✅ Fetched Leads Data:", data);
  
  //       const leadsArray = Array.isArray(data) ? data : [];
  
  //       const filteredLeadsArray = leadsArray.filter((lead) => {
  //         if (
  //           lead.accessLevel === "Only Case Manager and Assignees" &&
  //           !lead.assignedTo?.includes(signedInOfficer) &&
  //           lead.assignedBy !== signedInOfficer
  //         ) {
  //           return false;
  //         }
  //         return true;
  //       });
  
  //       const mapLead = (lead) => ({
  //         id: lead.leadNo,
  //         description: lead.description,
  //         dueDate: lead.dueDate
  //           ? new Date(lead.dueDate).toISOString().split("T")[0]
  //           : "N/A",
  //         priority: lead.priority || "Medium",
  //         flags: Array.isArray(lead.associatedFlags)
  //           ? lead.associatedFlags
  //           : [],
  //         assignedOfficers: Array.isArray(lead.assignedTo)
  //           ? lead.assignedTo
  //           : [],
  //         leadStatus: lead.leadStatus,
  //         caseName: lead.caseName,
  //         caseNo: String(lead.caseNo),
  //       });
  
  //       const assignedLeads = filteredLeadsArray
  //         .filter((lead) => lead.leadStatus === "Assigned")
  //         .map(mapLead);
  
  //       const pendingLeads = filteredLeadsArray
  //         .filter((lead) => lead.leadStatus === "Pending")
  //         .map(mapLead);
  
  //       const LRInReview = filteredLeadsArray
  //         .filter((lead) => lead.leadStatus === "In Review")
  //         .map(mapLead);

  //          const allLeads = filteredLeadsArray
  //         .map(mapLead);
  
  //       console.log("✅ Assigned Leads:", assignedLeads);
  //       console.log("✅ Pending Leads:", pendingLeads);
  
  //       setLeads((prev) => ({
  //         ...prev,
  //         allLeads,
  //         assignedLeads,
  //         pendingLeads,
  //         pendingLeadReturns: LRInReview,
  //       }));
  //     } catch (error) {
  //       console.error("❌ Error fetching leads:", error.message);
  //     }
  //   };
  
  //   fetchLeads();
  // }, [selectedCase, token, signedInOfficer]);

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

      // your existing filter/map logic…
      // const filtered = data.filter(lead => {
      //   return !(
      //     lead.accessLevel === "Only Case Manager and Assignees" &&
      //     !lead.assignedTo?.some(o => o.username === signedInOfficer) &&
      //     lead.assignedBy !== signedInOfficer
      //   );
      // });

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
    
    // const acceptLead = (leadId) => {
    //   const leadToAccept = leads.assignedLeads.find((lead) => lead.id === leadId);
    //   if (!leadToAccept) return;
    
    //   // Add lead to pending leads with default fields if not present
    //   const newPendingLead = {
    //     ...leadToAccept,
    //     dueDate: leadToAccept.dueDate || "12/31/2024", // Default due date
    //     priority: leadToAccept.priority || "Medium", // Default priority
    //     flags: leadToAccept.flags || [],
    //     assignedOfficers: leadToAccept.assignedOfficers || ["Unassigned"],
    //   };
    
    //   setLeads((prevLeads) => ({
    //     ...prevLeads,
    //     assignedLeads: prevLeads.assignedLeads.filter((lead) => lead.id !== leadId),
    //     pendingLeads: [...prevLeads.pendingLeads, newPendingLead],
    //   }));
    // };
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
    

  //   useEffect(() => {
  //     const fetchPendingLeadReturns = async () => {
  //         try {
  //             const token = localStorage.getItem("token");
  //             if (!token) {
  //                 console.error("❌ No token found. User is not authenticated.");
  //                 return;
  //             }
  
  //             if (!selectedCase?.caseNo || !selectedCase?.caseName) {
  //                 console.error("⚠️ No valid case details provided.");
  //                 return;
  //             }
  
  //             console.log("🔍 Fetching pending lead returns for exact case:", selectedCase);
  
  //             // ✅ Fetch all lead returns assigned to or assigned by the officer
  //             const leadsResponse = await axios.get("http://localhost:5000/api/leadreturn/officer-leads", {
  //                 headers: {
  //                     Authorization: `Bearer ${token}`,
  //                     "Content-Type": "application/json",
  //                 }
  //             });
  
  //             // ✅ Filter pending lead returns that match the exact case details (caseNo & caseName)
  //             const pendingLeadReturns = leadsResponse.data.filter(lead => 
  //                 lead.assignedBy.lRStatus === "Pending"
  //                 &&
  //                 lead.caseNo === selectedCase.caseNo &&   // Match exact case number
  //                 lead.caseName === selectedCase.caseName // Match exact case name
  //             ).map(lead => ({
  //                 id: lead.leadNo,
  //                 description: lead.description,
  //                 caseName: lead.caseName,
  //                 caseNo: lead.caseNo,
  //             }));
  
  //             // ✅ Update state with filtered pending lead returns
  //             setLeads(prevLeads => ({
  //                 ...prevLeads,
  //                 pendingLeadReturns: pendingLeadReturns
  //             }));
  
  //         } catch (error) {
  //             console.error("Error fetching pending lead returns:", error.response?.data || error);
  //         }
  //     };
  
  //     fetchPendingLeadReturns();
  // }, [signedInOfficer, selectedCase]);

const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
const [leadDropdownOpen1, setLeadDropdownOpen1] = useState(true);

   const [showFilter, setShowFilter] = useState(false);
    const [showSort, setShowSort] = useState(false);

  
      useEffect(() => {
        // Scroll to the top when the component mounts
        window.scrollTo(0, 0);
      }, []); // Empty dependency array ensures it runs only once on mount
        
  
  
  // useEffect(() => {
  //   const fetchPendingLeads = async () => {
  //       try {
  //           const token = localStorage.getItem("token");
  //           if (!token) {
  //               console.error("❌ No token found. User is not authenticated.");
  //               return;
  //           }
  
  //           // ✅ Fetch all assigned leads
  //           const leadsResponse = await axios.get("http://localhost:5000/api/lead/assigned-leads", {
  //               headers: {
  //                   Authorization: `Bearer ${token}`,
  //                   "Content-Type": "application/json",
  //               }
  //           });
  
  //           console.log("✅ API Response (Assigned Leads):", leadsResponse.data); // Debugging log
  
  //           // ✅ Check if `caseDetails` is defined before proceeding
  //           if (!caseDetails?.id || !caseDetails?.title) {
  //               console.warn("⚠️ caseDetails not provided, skipping lead filtering.");
  //               return;
  //           }
  
  //           console.log("✅ Using caseDetails:", caseDetails);
  
  //           // ✅ Filter leads where the signed-in officer is assigned and the case matches exactly
  //           const assignedLeads = leadsResponse.data
  //           .filter(lead =>
  //             String(lead.caseNo) === String(caseDetails.id) && 
  //             lead.caseName === caseDetails.title
  //         )
          
  //               .map(lead => ({
  //                   id: lead.leadNo,
  //                   description: lead.description,
  //                   dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
  //                   priority: lead.priority || "Medium",
  //                   flags: lead.associatedFlags || [],
  //                   assignedOfficers: lead.assignedTo, // Keep all assigned officers
  //                   leadStatus: lead.leadStatus, // Capture status
  //                   caseName: lead.caseName,
  //                   caseNo: lead.caseNo
  //               }));
  
  //           // ✅ Filter leads where status is "Pending"
  //           const pendingLeads = assignedLeads.filter(lead => lead.leadStatus === "Pending");
  
  //           console.log("✅ Filtered Assigned Leads:", assignedLeads);
  //           console.log("✅ Filtered Pending Leads:", pendingLeads);
  
  //           // ✅ Update state with filtered leads
  //           setLeads(prevLeads => ({
  //               ...prevLeads,
  //               assignedLeads: assignedLeads,
  //               pendingLeads: pendingLeads
  //           }));
  
  //       } catch (error) {
  //           console.error("❌ Error fetching assigned leads:", error.response?.data || error);
  //       }
  //   };
  
  //   fetchPendingLeads();
  // }, [signedInOfficer, caseDetails]);
  
  

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

  // Filter leads
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
  
    const filtersConfigPLR = [
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
        name: "Priority",
        label: "Priority",
        options: ["High", "Medium", "Low"],
      },
      {
        name: "Flag",
        label: "Flag",
        options: ["Important"],
      },
    ];
  
    const filtersConfigOC = [
      {
        name: "CaseNumber",
        label: "Case Number",
        options: ["12345", "45637", "23789"],
      },
      {
        name: "CaseName",
        label: "Case Name",
        options: [
          "Main Street Murder",
          "Cook Streat School Threat",
          "216 Endicott Suicide",
        ],
      },
      {
        name: "Role",
        label: "Role",
        options: ["Case Manager", "Investigator"],
      },
    ];
  
    const handleFilterApply = (filters) => {
      console.log("Applied Filters:", filters);
      // Perform filtering logic here (e.g., API call, state update)
    };
  
    const [sortedData, setSortedData] = useState([]);
    const data = [
      { category: "Electronics", price: 100 },
      { category: "Clothing", price: 50 },
      { category: "Electronics", price: 200 },
      { category: "Home", price: 150 },
    ];
    const onShowCaseSelector = (route) => {
      navigate(route, { state: { caseDetails } });
  };

  const [allFilterConfig, setAllFilterConfig] = useState({
  id: "",                 // Lead No.
  description: "",        // Lead Log Summary
  leadStatus: "",         // Lead Status
  dueDate: "",            // Due Date
  priority: "",           // Priority
  remainingDays: "",      // Days Left
  assignedOfficers: ""    // Assigned Officers (we'll treat each officer name)
});
const [allSortConfig, setAllSortConfig]   = useState({ key: null, direction: "asc" });
const [openAllFilter, setOpenAllFilter]   = useState(null);
const allPopupRefs = useRef({});

const distinctAll = useMemo(() => {
  const map = {
    id: new Set(), description: new Set(), leadStatus: new Set(),
    dueDate: new Set(), priority: new Set(),
    remainingDays: new Set(), assignedOfficers: new Set()
  };
  leads.allLeads.forEach(lead => {
    map.id.add(String(lead.id));
    map.description.add(lead.description);
    map.leadStatus.add(lead.leadStatus);
    map.dueDate.add(lead.dueDate);
    map.priority.add(lead.priority);
    map.remainingDays.add(String(calculateRemainingDays(lead.dueDate)));
    (lead.assignedOfficers || []).forEach(o => map.assignedOfficers.add(o));
  });
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, Array.from(v)]));
}, [leads.allLeads]);

const sortedAllLeads = useMemo(() => {
  // 1) apply filters
  const filtered = leads.allLeads.filter(lead => {
    return (
      (!allFilterConfig.id           || String(lead.id)            === allFilterConfig.id)           &&
      (!allFilterConfig.description  || lead.description            === allFilterConfig.description)  &&
      (!allFilterConfig.leadStatus   || lead.leadStatus             === allFilterConfig.leadStatus)   &&
      (!allFilterConfig.dueDate      || lead.dueDate                === allFilterConfig.dueDate)      &&
      (!allFilterConfig.priority     || lead.priority               === allFilterConfig.priority)     &&
      (!allFilterConfig.remainingDays|| String(calculateRemainingDays(lead.dueDate)) === allFilterConfig.remainingDays) &&
      (!allFilterConfig.assignedOfficers ||
         (lead.assignedOfficers || []).includes(allFilterConfig.assignedOfficers))
    );
  });
  // 2) apply sort
  if (!allSortConfig.key) return filtered;
  return [...filtered].sort((a, b) => {
    let aV = allSortConfig.key==="remainingDays"
      ? calculateRemainingDays(a.dueDate)
      : (allSortConfig.key==="assignedOfficers"
         ? (a.assignedOfficers||[])[0]   // first officer for simplicity
         : a[allSortConfig.key]);
    let bV = allSortConfig.key==="remainingDays"
      ? calculateRemainingDays(b.dueDate)
      : (allSortConfig.key==="assignedOfficers"
         ? (b.assignedOfficers||[])[0]
         : b[allSortConfig.key]);
    if (aV < bV) return allSortConfig.direction==="asc" ? -1 : 1;
    if (aV > bV) return allSortConfig.direction==="asc" ?  1 : -1;
    return 0;
  });
}, [leads.allLeads, allFilterConfig, allSortConfig]);

const handleFilterAllClick = col => {
  setOpenAllFilter(prev => prev===col ? null : col);
};
const handleSortAll = colKey => {
  setAllSortConfig(prev => ({
    key: prev.key===colKey && prev.direction==="asc" ? null : colKey,
    direction: prev.key===colKey && prev.direction==="asc" ? "desc" : "asc"
  }));
};




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

          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>

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
                            Lead Returns Under Review: {leads.pendingLeadReturns.length}
                        </span>
                       
                    </div>

                       {/* Tab Content */}
                       <div className="content-section">
                    {activeTab === "assignedLeads" && (
  <div className="assigned-leads">
    {/* <button
      onClick={() => setFilterSortPopupVisible(true)}
      className="filter-sort-button"
    >
      Open Filter & Sort
    </button> */}

{/* <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
<Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} /> */}
<div className="filter-sort-icons">
                    <button onClick={() => setShowFilter(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/filter.png`}
                        alt="Filter Icon"
                        className="icon-image"
                      />
                    </button>
                    <button onClick={() => setShowSort(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/sort1.png`}
                        alt="Sort Icon"
                        className="icon-image"
                      />
                    </button>
                  </div>

                  {/* Conditionally render the Filter component */}
      {showFilter && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-popup-btn" onClick={() => setShowFilter(false)}>
              &times;
            </button>
            <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
            </div>
        </div>
      )}

      {/* Conditionally render the Sort component */}
      {showSort && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-popup-btn" onClick={() => setShowSort(false)}>
              &times;
            </button>
            <Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} />
            </div>
          </div>
      )}



    {filterSortPopupVisible && (
      <div className="popup-overlay">
        <div className="popup-content">
          <button
            className="close-popup-btn"
            onClick={() => setFilterSortPopupVisible(false)}
          >
            &times;
          </button>
          <h3>Filter & Sort Leads</h3>
          <div className="filter-sort-section">
            <div className="filters">
              <h4 className="filter-label">Filters</h4>
              <div className="filter-item">
                <input
                  type="text"
                  placeholder="Filter by Lead Name"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="filter-input"
                />
                <button
                  onClick={() => setFilterText("")}
                  className="clear-button"
                >
                  Clear Name Filter
                </button>
              </div>
              <div className="filter-item">
                <label className="filter-label">Priority:</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="filter-dropdown"
                >
                  <option value="">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  onClick={() => setSelectedPriority("")}
                  className="clear-button"
                >
                  Clear Priority Filter
                </button>
              </div>
              <div className="filter-item">
                <label className="filter-label">Remaining Days:</label>
                <input
                  type="number"
                  placeholder="Enter Remaining Days"
                  value={remainingDaysFilter}
                  onChange={(e) => setRemainingDaysFilter(e.target.value)}
                  className="filter-input"
                />
                <button
                  onClick={() => setRemainingDaysFilter("")}
                  className="clear-button"
                >
                  Clear Days Filter
                </button>
              </div>
              <div className="filter-item">
                <label className="filter-label">Flags:</label>
                <input
                  type="text"
                  placeholder="Filter by Flags"
                  value={flagsFilter}
                  onChange={(e) => setFlagsFilter(e.target.value)}
                  className="filter-input"
                />
                <button
                  onClick={() => setFlagsFilter("")}
                  className="clear-button"
                >
                  Clear Flags Filter
                </button>
              </div>
              <div className="filter-item">
                <label className="filter-label">Assigned Officers:</label>
                <input
                  type="text"
                  placeholder="Filter by Assigned Officers"
                  value={assignedOfficersFilter}
                  onChange={(e) =>
                    setAssignedOfficersFilter(e.target.value)
                  }
                  className="filter-input"
                />
                <button
                  onClick={() => setAssignedOfficersFilter("")}
                  className="clear-button"
                >
                  Clear Officers Filter
                </button>
              </div>
            </div>


            <div className="sorting">
              <h4 className="filter-label">Sorting</h4>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortField(field);
                  setSortOrder(order);
                }}
                className="sort-dropdown"
              >
                <option value="">Sort by...</option>
                <option value="description-asc">Name (A-Z)</option>
                <option value="description-desc">Name (Z-A)</option>
                <option value="dueDate-asc">Due Date (Oldest First)</option>
                <option value="dueDate-desc">Due Date (Newest First)</option>
                <option value="priority-asc">Priority (Low-High)</option>
                <option value="priority-desc">Priority (High-Low)</option>
              </select>
              <button
                onClick={() => {
                  setSortField("");
                  setSortOrder("");
                }}
                className="clear-button"
              >
                Clear Sorting
              </button>
            </div>
          </div>
          <button
            onClick={() => setFilterSortPopupVisible(false)}
            className="apply-button"
          >
            Apply Filters & Sorting
          </button>
        </div>
      </div>
    )}


<div className="table-scroll-container">
<table className="leads-table" style={{ minWidth: "1000px" }}>
      <thead>
        <tr>
          <th style={{ width: "10%" }}>Lead No.</th>
          <th>Lead Log Summary</th>
          <th style={{ width: "10%" }}>Due Date</th>
          <th style={{ width: "8%" }}>Priority</th>
          <th style={{ width: "8%" }}>Days Left</th>
          <th style={{ width: "6%" }}>Flags</th>
          <th style={{ width: "14%" }}>Assigned Officers</th>
          <th style={{ width: "12%" }}></th>
        </tr>
      </thead>
      <tbody>
        {leads.assignedLeads.length > 0 ? (
        leads.assignedLeads
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
              <td>{lead.dueDate}</td>
              <td>{lead.priority}</td>
              <td>{calculateRemainingDays(lead.dueDate)}</td>
              <td>{lead.flags.join(", ") || "None"}</td>
              {/* <td>{lead.assignedOfficers.join(", ")}</td> */}
              <td style={{ width: "14%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
                {/* {lead.assignedOfficers.join(", ")} */}
                 {(lead.assignedOfficers || []).length
    ? lead.assignedOfficers.map((officer, idx) => (
        <div key={idx}>{officer}</div>
      ))
    : <span style={{ color: "#888" }}>None</span>
  }
                </td>
              <td>
                <button
                  className="view-btn1"
                  onClick={() => handleLeadClick(lead)}
                  // }
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
              <td colSpan="8" style={{ textAlign: 'center' }}>
                No Assigned Leads Available
              </td>
            </tr>
          )}
      </tbody>
    </table>
    </div>

    
    <AlertModal
  isOpen={confirmConfig.isOpen}
  title="Confirm Accept"
  message={`Are you sure you want to accept Lead #${confirmConfig.lead?.id} -  ${confirmConfig.lead?.description} ?`}
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
    {/* <Pagination
  currentPage={currentPage}
  totalEntries={totalEntries}  
  onPageChange={setCurrentPage} 
  pageSize={pageSize}
  onPageSizeChange={setPageSize} 
/> */}
  </div>
)}

          
{activeTab === "pendingLeads" && (
  <div className="pending-leads">
    {/* <button
      onClick={() => setFilterSortPopupVisible(true)}
      className="filter-sort-button"
    >
      Open Filter & Sort
    </button> */}

{/* <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
<Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} /> */}

<div className="filter-sort-icons">
                    <button onClick={() => setShowFilter(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/filter.png`}
                        alt="Filter Icon"
                        className="icon-image"
                      />
                    </button>
                    <button onClick={() => setShowSort(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/sort1.png`}
                        alt="Sort Icon"
                        className="icon-image"
                      />
                    </button>
                  </div>
                

    {filterSortPopupVisible && (
      <div className="popup-overlay">
        <div className="popup-content">
        <button
        className="close-popup-btn"
        onClick={() => setFilterSortPopupVisible(false)}
      >
        &times; {/* Close icon */}
      </button>
          <h3>Filter & Sort Leads</h3>
          <div className="filter-sort-section">
            <div className="filters">
              <h4>Filters</h4>
              <div className="filter-item">
                <input
                  type="text"
                  placeholder="Filter by Lead Name"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="filter-input"
                />
                <button
                  onClick={() => setFilterText("")}
                  className="clear-button"
                >
                  Clear Name Filter
                </button>
              </div>
              <div className="filter-item">
                <label>Priority:</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="filter-dropdown"
                >
                  <option value="">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  onClick={() => setSelectedPriority("")}
                  className="clear-button"
                >
                  Clear Priority Filter
                </button>
              </div>


            {/* Filter by Remaining Days */}
        <div className="filter-item">
          <label>Remaining Days:</label>
          <input
            type="number"
            placeholder="Enter Remaining Days"
            onChange={(e) => setRemainingDaysFilter(e.target.value)}
            className="filter-input"
          />
          <button
            onClick={() => setRemainingDaysFilter("")}
            className="clear-button"
          >
            Clear Days Filter
          </button>
        </div>


        {/* Filter by Flags */}
        <div className="filter-item">
          <label>Flags:</label>
          <input
            type="text"
            placeholder="Filter by Flags"
            onChange={(e) => setFlagsFilter(e.target.value)}
            className="filter-input"
          />
          <button onClick={() => setFlagsFilter("")} className="clear-button">
            Clear Flags Filter
          </button>
        </div>


        {/* Filter by Assigned Officers */}
        <div className="filter-item">
          <label>Assigned Officers:</label>
          <input
            type="text"
            placeholder="Filter by Assigned Officers"
            onChange={(e) => setAssignedOfficersFilter(e.target.value)}
            className="filter-input"
          />
          <button
            onClick={() => setAssignedOfficersFilter("")}
            className="clear-button"
          >
            Clear Officers Filter
          </button>
        </div>
        </div>


            <div className="sorting">
              <h4>Sorting</h4>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortField(field);
                  setSortOrder(order);
                }}
                className="sort-dropdown"
              >
                <option value="">Sort by...</option>
                <option value="description-asc">Name (A-Z)</option>
                <option value="description-desc">Name (Z-A)</option>
                <option value="dueDate-asc">Due Date (Oldest First)</option>
                <option value="dueDate-desc">Due Date (Newest First)</option>
                <option value="priority-asc">Priority (Low-High)</option>
                <option value="priority-desc">Priority (High-Low)</option>
              </select>
              <button
                onClick={() => {
                  setSortField("");
                  setSortOrder("");
                }}
                className="clear-button"
              >
                Clear Sorting
              </button>
            </div>
          </div>
          <button
            onClick={() => setFilterSortPopupVisible(false)}
            className="apply-button"
          >
            Apply Filters & Sorting
          </button>
        </div>
      </div>
    )}


<div className="table-scroll-container">
<table className="leads-table" style={{ minWidth: "1000px" }}>
      <thead>
        <tr>
        <th style={{ width: "10%" }}>Lead No.</th>
          <th>Lead Log Summary</th>
          <th style={{ width: "10%" }}>Due Date</th>
          <th style={{ width: "8%" }}>Priority</th>
          <th style={{ width: "8%" }}>Days Left</th>
          <th style={{ width: "6%" }}>Flags</th>
          <th style={{ width: "14%" }}>Assigned Officers</th>
          <th style={{ width: "12%" }}></th>
        </tr>
      </thead>
      <tbody>
           {leads.pendingLeads.length > 0 ? (
        leads.pendingLeads
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
              <td>{lead.dueDate}</td>
              <td>{lead.priority}</td>
              <td>{calculateRemainingDays(lead.dueDate)}</td>
              <td>{lead.flags.join(", ") || "None"}</td>
              {/* <td>{lead.assignedOfficers.join(", ")}</td> */}
              <td style={{ width: "14%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
                {/* {lead.assignedOfficers.join(", ")} */}
                {lead.assignedOfficers.map((officer, index) => (
                  <span key={index} style={{ display: "block", marginBottom: "4px", padding: "8px 0px 0px 8px" }}>{officer}</span>
                ))}
                </td>
              <td>
                <button
                  className="view-btn1"
                  onClick={() => handleLeadClick(lead)}>
                  View
                </button>
              </td>
            </tr>
          ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>
                  No Accepted Leads Available
                </td>
              </tr>
            )}
      </tbody>

    </table>
    </div>
    {/* <Pagination
  currentPage={currentPage}
  totalEntries={totalEntries}  
  onPageChange={setCurrentPage} 
  pageSize={pageSize}
  onPageSizeChange={setPageSize} 
/> */}
  </div>
)}
{activeTab === "pendingLeadReturns" && (
  <div className="pending-lead-returns">
     {/* <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
     <Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} />
     */}

<div className="filter-sort-icons">
                    <button onClick={() => setShowFilter(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/filter.png`}
                        alt="Filter Icon"
                        className="icon-image"
                      />
                    </button>
                    <button onClick={() => setShowSort(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/sort1.png`}
                        alt="Sort Icon"
                        className="icon-image"
                      />
                    </button>
                  </div>
    
                  <div className="table-scroll-container">
                  <table className="leads-table" style={{ minWidth: "1000px" }}>
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Lead No.</th>
                  <th>Lead Log Summary</th>
                  <th style={{ width: "12%" }}></th>
                </tr>
              </thead>
              <tbody>
                {leads.pendingLeadReturns.length > 0 ? (
                leads.pendingLeadReturns.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.id }</td>
                      <td>{lead.description}</td>
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
                        <td colSpan="3" style={{ textAlign: 'center' }}>
                          No Pending Lead Returns Available
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
            </div>
            {/* <Pagination
  currentPage={currentPage}
  totalEntries={totalEntries}  
  onPageChange={setCurrentPage} 
  pageSize={pageSize}
  onPageSizeChange={setPageSize} 
/> */}
  </div>
)}  

             {/* {activeTab === "allLeads" && (
                            <div className="lead-list" onClick={() => handleNavigation("/LeadInfo")}>
                                {leads.allLeads.map((lead) => (
                                    <div key={lead.id} className="lead-item">
                                        <span>{lead.description}</span>
                                        <button className={`status-button ${lead.status.toLowerCase()}`}>
                                            {lead.status}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )} */}

{/* {activeTab === "allLeads" && (
  <div className="all-leads">
   

<div className="table-scroll-container">
                  <table className="leads-table" style={{ minWidth: "1000px" }}>
      <thead>
        <tr>
         <th style={{ width: "10%" }}>Lead No.</th>
          <th>Lead Log Summary</th>
          <th style={{ width: "10%" }}>Lead Status</th>
          <th style={{ width: "10%" }}>Due Date</th>
          <th style={{ width: "8%" }}>Priority</th>
          <th style={{ width: "8%" }}>Days Left</th>
          <th style={{ width: "15%" }}>Assigned Officers</th>
          <th style={{ width: "12%" }}></th> 
        </tr>
      </thead>
      <tbody>
        {leads.allLeads.length > 0 ? (
       leads.allLeads.map((lead) => (
          <tr key={lead.id}>
           <td>{lead.id} </td>
            <td>{lead.description}</td>
            <td>{lead.leadStatus}</td>
             <td>{lead.dueDate}</td>
              <td>{lead.priority}</td>
              <td>{calculateRemainingDays(lead.dueDate)}</td>
            
             
              <td style={{ width: "14%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
             
                {lead.assignedOfficers.map((officer, index) => (
                  <span key={index} style={{ display: "block", marginBottom: "4px", padding: "8px 0px 0px 8px" }}>{officer}</span>
                ))}
                </td>
            <td>
              <button
                className= "view-btn1"
                onClick={() => handleLeadClick(lead)}
              >
                View
              </button>
            </td>
          </tr>
        ))  ) : (
          <tr>
            <td colSpan="8" style={{ textAlign: 'center' }}>
              No Leads Available
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </div>
  </div>
)} */}
{activeTab === "allLeads" && (
  <div className="all-leads">
    <div className="table-scroll-container">
      <table className="leads-table" style={{ minWidth: "1000px" }}>
        <thead>
          <tr>
            {[
              { label:"Lead No.",         key:"id",               width:"10%" },
              { label:"Lead Log Summary", key:"description", width:"24%" },
              { label:"Lead Status",      key:"leadStatus", width:"10%" },
              { label:"Assigned Officers",key:"assignedOfficers", width:"15%" }
            ].map(col => (
           <th key={col.key} style={{ width: col.width }}>
   <div className="header-title">{col.label}</div>
  <div className="header-controls" ref={el => allPopupRefs.current[col.key] = el}>
    <button onClick={() => handleFilterAllClick(col.key)}>
      <img src={`${process.env.PUBLIC_URL}/Materials/filter.png`} className="icon-image"/>
    </button>
    {openAllFilter === col.key && (
  <div className="filter-popup">
    <select
      value={allFilterConfig[col.key]}
      onChange={e =>
        setAllFilterConfig(cfg => ({ ...cfg, [col.key]: e.target.value }))
      }
    >
      <option value="">All</option>
      {distinctAll[col.key].map(v => (
        <option key={v} value={v}>{v}</option>
      ))}
    </select>
    <div className="filter-popup-buttons">
      <button onClick={() => setOpenAllFilter(null)}>Apply</button>
      <button onClick={() => {
        setAllFilterConfig(cfg => ({ ...cfg, [col.key]: "" }));
        setOpenAllFilter(null);
      }}>Clear</button>
    </div>
  </div>
)}

    <button onClick={() => handleSortAll(col.key)}>
      <img src={`${process.env.PUBLIC_URL}/Materials/sort1.png`} className="icon-image"/>
    </button>
  </div>
</th>


            ))}
            <th style={{ width:"12%" }}></th>
          </tr>
        </thead>
        <tbody>
          {sortedAllLeads.length>0 ? sortedAllLeads.map(lead=>(
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td style={{
  color:
    ["Assigned", "Accepted", "Returned"].includes(lead.leadStatus)
      ? "red"
      : ["In Review", "Approved", "Completed"].includes(lead.leadStatus)
      ? "green"
      : "black"
}}>
   {lead.leadStatus === "In Review" ? "Under review" : lead.leadStatus}
</td>
             
              {/* <td style={{ wordBreak:"break-word" }}>
                 {(lead.assignedOfficers || []).length
    ? lead.assignedOfficers.map((officer, idx) => (
        <div key={idx}>{officer}</div>
      ))
    : <span style={{ color: "#888" }}>None</span>
  }
              </td> */}
              <td style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
              {lead.assignedOfficers.length
    ? lead.assignedOfficers.join(", ")
    : <em>None</em>}
  
</td>

              <td>
                <button className="view-btn1" onClick={()=>handleLeadClick(lead)}>
                  View
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} style={{ textAlign:"center" }}>
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
        </div>
    );
};
