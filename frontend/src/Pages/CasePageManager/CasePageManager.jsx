import React, { useContext, useState, useEffect} from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Searchbar from '../../components/Searchbar/Searchbar';
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import Button from '../../components/Button/Button';
import './CasePageManager.css'; // Custom CSS file for styling
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";
import Pagination from "../../components/Pagination/Pagination";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";
import api, { BASE_URL } from "../../api";



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

    const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [pendingRoute, setPendingRoute]   = useState(null);
  

  const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);


    const [activeTab, setActiveTab] = useState("allLeads"); // Default to All Leads tab
    const handleViewAssignedLead = (lead) => {
    };
    const handleCaseClick = (caseDetails) => {
      navigate("/CasePageManager", { state: { caseDetails } }); // Pass case details via state
    };
  
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


    const handleLRClick = (lead) => {
      setSelectedLead({
          leadNo: lead.id,
          incidentNo: lead.incidentNo,
          leadName: lead.description,
          dueDate: lead.dueDate || "N/A",
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
  //   const acceptLead = async (leadNo) => {
  //     const leadToAccept = leads.assignedLeads.find((lead) => lead.leadNo === leadNo);
  //     if (!leadToAccept) return;

  //     try {
  //       const token = localStorage.getItem("token");
    
  //       // Update the lead status in the database to "Pending"
  //       await api.patch(
  //         `/api/lead/${leadToAccept.leadNo}/${leadToAccept.caseNo}/${encodeURIComponent(leadToAccept.caseName)}/status`,
  //         { status: "Pending" },
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );
    
  //     // Add lead to pending leads with default fields if not present
  //     const newPendingLead = {
  //       ...leadToAccept,
  //       leadStatus: "Pending",
  //       dueDate: leadToAccept.dueDate || "12/31/2024", // Default due date
  //       priority: leadToAccept.priority || "Medium", // Default priority
  //       flags: leadToAccept.flags || [],
  //       assignedOfficers: leadToAccept.assignedOfficers || ["Unassigned"],
  //     };
    
  //     setLeads((prevLeads) => ({
  //       ...prevLeads,
  //       assignedLeads: prevLeads.assignedLeads.filter((lead) => lead.leadNo !== leadNo),
  //       pendingLeads: [...prevLeads.pendingLeads, newPendingLead],
  //     }));
  //   } catch (error) {
  //     console.error("Error updating lead status:", error.response?.data || error);
  //     alert("Failed to accept lead.");
  //   }
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
        leadStatus: "Pending",
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
      alert("Failed to accept lead.");
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
      leadNo: lead.leadNo,
      incidentNo: lead.incidentNo,
      leadName: lead.description,
      dueDate: lead.dueDate || "N/A",
      priority: lead.priority || "Medium",
      flags: lead.flags || [],
      assignedOfficers: lead.assignedOfficers || [],
      leadStatus: lead.leadStatus,
      caseName: lead.caseName,
      caseNo: lead.caseNo,
      summary: lead.summary
  });

  // Navigate to Lead Review Page
  navigate("/leadReview", { state: { leadDetails: lead, caseDetails: selectedCase } });
};

  const token = localStorage.getItem('token') || '';

  // 2) useEffect to fetch leads once the component mounts or caseDetails changes
  // useEffect(() => {
  //   if (caseDetails?.id && caseDetails?.title) {
  //     fetch(`http://localhost:5000/api/lead/case/${caseDetails.id}/${caseDetails.title}`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //     })
  //       .then((response) => {
  //         if (!response.ok) {
  //           throw new Error(`HTTP error! status: ${response.status}`);
  //         }
  //         return response.json();
  //       })
  //       .then((data) => {
  //         const assignedLeads = data.filter(lead => lead.leadStatus === "Assigned");
  //         const pendingLeads = data.filter(lead => lead.leadStatus === "Pending");

  //         setLeads((prev) => ({
  //           ...prev,
  //           allLeads: data,
  //           assignedLeads: assignedLeads,
  //           pendingLeads: pendingLeads
  //         }));
  //       })
  //       .catch((error) => {
  //         console.error("Error fetching leads:", error.message);
  //       });
  //   }
  // }, [caseDetails, token]);
  
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
          if (
            lead.accessLevel === "Only Case Manager and Assignees" &&
            !lead.assignedTo?.includes(signedInOfficer) &&
            lead.assignedBy !== signedInOfficer
          ) {
            return false;
          }
          return true;
        });
  
        const mapLead = (lead) => ({
          id: lead.leadNo,
          description: lead.description,
          summary: lead.summary,
          dueDate: lead.dueDate
            ? new Date(lead.dueDate).toISOString().split("T")[0]
            : "N/A",
          priority: lead.priority || "Medium",
          flags: Array.isArray(lead.associatedFlags)
            ? lead.associatedFlags
            : [],
          assignedOfficers: Array.isArray(lead.assignedTo)
            ? lead.assignedTo
            : [],
          leadStatus: lead.leadStatus,
          caseName: lead.caseName,
          caseNo: String(lead.caseNo),
        });
  
        const assignedLeads = filteredLeadsArray
          .filter((lead) => lead.leadStatus === "Assigned")
          .map(mapLead);
  
        const pendingLeads = filteredLeadsArray
          .filter((lead) => lead.leadStatus === "Pending")
          .map(mapLead);
  
        const LRInReview = filteredLeadsArray
          .filter((lead) => lead.leadStatus === "In Review")
          .map(mapLead);
  
        console.log("✅ Assigned Leads:", assignedLeads);
        console.log("✅ Pending Leads:", pendingLeads);
        console.log("✅ Lead Returns In Review:", LRInReview);
  
        setLeads((prev) => ({
          ...prev,
          allLeads: filteredLeadsArray,
          assignedLeads,
          pendingLeads,
          pendingLeadReturns: LRInReview,
        }));
      } catch (error) {
        console.error("❌ Error fetching leads:", error.message);
      }
    };
  
    fetchLeadsForCase();
  }, [selectedCase, signedInOfficer]);
  
  

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

//             console.log("🔍 Fetching pending lead returns for exact case:", caseDetails);

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
//               .filter(lead =>
//                   lead.caseNo === caseDetails.id && 
//                   lead.caseName === caseDetails.title // Ensure exact case match
//               )
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

const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

  

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

   // Define a constant with some predefined notes
   const defaultCaseSummary = "Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.";

  //  const [caseSummary, setCaseSummary] = useState(caseDetails?.caseSummary || defaultCaseSummary);
  
    const [caseSummary, setCaseSummary] = useState('' ||  defaultCaseSummary);

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
        alert("Report Saved!");
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

    useEffect(() => {
      // Scroll to the top when the component mounts
      window.scrollTo(0, 0);
    }, []); // Empty dependency array ensures it runs only once on mount
      

    return (
        <div className="case-page-manager">
            {/* Navbar */}
            <Navbar />

            {/* Main Container */}
            <div className="main-container">
                {/* Sidebar */}
                <div className="sideitem">
                    <ul className="sidebar-list">
                    {/* <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
                        <li className="sidebar-item" onClick={() => navigate('/createlead')}>Create Lead</li>
                        <li className="sidebar-item" onClick={() => navigate("/leadlog", { state: { caseDetails } } )} >View Lead Log</li>
                        <li className="sidebar-item" onClick={() => navigate('/OfficerManagement')}>Officer Management</li>
                        <li className="sidebar-item"onClick={() => navigate('/casescratchpad')}>Case Scratchpad</li>
                        <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
                        <li className="sidebar-item"onClick={() => navigate('/LeadHierarchy1')}>View Lead Hierarchy</li>
                        <li className="sidebar-item">Generate Report</li>
                        <li className="sidebar-item"onClick={() => navigate('/FlaggedLead')}>View Flagged Leads</li>
                        <li className="sidebar-item"onClick={() => navigate('/ViewTimeline')}>View Timeline Entries</li>
                        <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li>

                        <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li> */}

       
                                 {/* Lead Management Dropdown */}

                                 <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
                                 <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
                                 <li className="sidebar-item active" onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Case Page {leadDropdownOpen ?  "▲": "▼"}
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
              {tab === "assignedLeads" && "Assigned Leads"}
              {tab === "pendingLeads" && "Accepted Leads"}
              {tab === "pendingLeadReturns" && "Lead Returns for Review"}
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
))}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              View Lead Chain of Custody
            </li> */}
          </ul>
        )} 

<li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>
              New Lead
            </li>
            <li className="sidebar-item" 
             onClick={() => {
              setPendingRoute("/leadReview");
              setShowSelectModal(true);
            }}>Lead Information</li>
            <li className="sidebar-item"
             onClick={() => onShowCaseSelector("/SearchLead")}
          >Search Lead</li>
            <li className="sidebar-item"    
            onClick={() => {
              setPendingRoute("/LRInstruction");
              setShowSelectModal(true);
            }} >View Lead Return</li>


<li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>
              View Lead Log
            </li>

{/* <li
              className="sidebar-item"
              onClick={() => {
                setPendingRoute("/LeadLog");
                setShowSelectModal(true);
              }}
            >
              View Lead Log
            </li> */}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li> */}
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
              View Lead Hierarchy
            </li> */}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              Generate Report
            </li> */}
            <li className="sidebar-item"    
            onClick={() => navigate("/FlaggedLead")}>
              View Flagged Leads
            </li>
            {/* <li className="sidebar-item"  onClick={() => {
              setPendingRoute("/ViewTimeline");
              setShowSelectModal(true);
            }}>
              View Timeline Entries
            </li> */}

            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>
            View Timeline Entries
            </li>

            {/* <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li> */}

            <li className="sidebar-item" 
            // onClick={() => {
            //   setPendingRoute("/LeadsDesk");
            //   setShowSelectModal(true);
            // }}
            onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )}
             >View Leads Desk</li>

            <li className="sidebar-item" 
            //  onClick={() => {
            //   setPendingRoute("/LeadsDeskTestExecSummary");
            //   setShowSelectModal(true);
            // }}
            
            onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )}
            
            >Generate Report</li>

            <li className="sidebar-item"

              onClick={() => {
                setPendingRoute("/ChainOfCustody");
                setShowSelectModal(true);
              }}
            
            // onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}
            >View Lead Chain of Custody</li>

                    </ul>

                    {showSelectModal && (
      <SelectLeadModal
        leads={leads.allLeads}
        onSelect={handleSelectLead}
        onClose={() => setShowSelectModal(false)}
      />
    )}
    
                </div>
                <div className="left-content">

                  <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"}</h5>

                   {/* Display Case Number and Name */}
                <div className="case-header">
                    {
                        <h1>
                          CASE:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName.toUpperCase() || "Unknown Case"}
                        </h1>
                    }
                </div>
                {/* <div className = "case-summary">
                <label className="input-label">Case Summary</label>
                        <textarea
                            className="textarea-field"
                            value={caseSummary}
                            onChange={handleCaseSummaryChange}
                            readOnly={!isEditing} // Read-only when not in edit mode
                        ></textarea>

                         <button className="save-btn1" onClick={handleSaveClick}>Save</button>
               
                </div> */}
                {/* Content Area */}
                {/* <div className="table-section1"> */}
                  {/* <div className='searchContainer'>
                    <Searchbar placeholder="Search Lead" />
                    </div> */}
                    {/* <Button
                        label="Generate Lead"
                        className="generate-lead-btn1"
                        onClick={handleGenerateLead}
                    /> */}
                   
                    {/* Tab Navigation */}

                    <div className="stats-bar">
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
                            Lead Returns for Review: {leads.pendingLeadReturns.length}
                        </span>
                        <span
                            className={`hoverable ${activeTab === "allLeads" ? "active" : ""}`}
                            onClick={() => handleTabClick("allLeads")}
                        >
                            All Leads: {leads.allLeads.length}
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
          {/* <button
            onClick={() => setFilterSortPopupVisible(false)}
            className="apply-button"
          >
            Apply Filters & Sorting
          </button> */}
        </div>
      </div>
    )}

<div className="table-scroll-container">
    <table className="leads-table" style={{ minWidth: "1000px" }}>
      <thead>
        <tr>

          <th style={{ width: "10%" }}>Lead No.</th>
          <th style={{ width: "15%" }}>Lead Log Summary</th>
          <th style={{ width: "10%" }}>Due Date</th>
          <th style={{ width: "8%" }}>Priority</th>
          <th style={{ width: "8%" }}>Days Left</th>
          <th style={{ width: "6%" }}>Flags</th>
          <th style={{ width: "15%" }}>Assigned Officers</th>
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
              <td>{lead.dueDate || "N/A"}</td>
              <td>{lead.priority || "N/A"}</td>
              <td>{calculateRemainingDays(lead.dueDate) }</td>
              <td>{lead.flags?.join(", ") || "None"}</td>
              <td style={{ width: "14%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
                {/* {lead.assignedOfficers.join(", ")} */}
                {lead.assignedOfficers.map((officer, index) => (
                  <span key={index} style={{ display: "block", marginBottom: "4px", padding: "8px 0px 0px 8px" }}>{officer}</span>
                ))}
                </td>
              <td>
                <button
                  className="view-btn1"
                  onClick={() => navigate("/leadReview", { state: { caseDetails, leadId: lead.id, leadDescription: lead.summary} } )}

                  // }
                >
                  View
                </button>
                {lead.assignedOfficers?.includes(signedInOfficer) && (
  <button
    className="accept-btn"
    onClick={() => {
      if (window.confirm(`Do you want to accept this lead?`)) {
        acceptLead(lead.id, lead.description);
      }
    }}
  >
    Accept
  </button>
)}

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
          <th style={{ width: "15%" }}>Lead Log Summary</th>
          <th style={{ width: "10%" }}>Due Date</th>
          <th style={{ width: "8%" }}>Priority</th>
          <th style={{ width: "8%" }}>Days Left</th>
          <th style={{ width: "6%" }}>Flags</th>
          <th style={{ width: "15%" }}>Assigned Officers</th>
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
                  onClick={() => navigate("/leadReview", { state: { caseDetails, leadId: lead.id, leadDescription: lead.summary} } )}
                >
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
  </div>
)}


{activeTab === "pendingLeadReturns" && (
  <div className="pending-lead-returns">
   
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
                      <td>{lead.id}</td>
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

{activeTab === "allLeads" && (
  <div className="all-leads">
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

<div className="table-scroll-container">
<table className="leads-table" style={{ minWidth: "1000px" }}>
      <thead>
        <tr>
          <th style={{ width: "10%" }}>Lead No.</th>
          <th>Lead Log Summary</th>
          <th style={{ width: "10%" }}>Lead Status</th>
          <th style={{ width: "12%" }}></th> {/* Empty header for buttons column */}
        </tr>
      </thead>
      <tbody>
      {leads.allLeads.length > 0 ? (
       leads.allLeads.map((lead) => (
          <tr key={lead.id}>
            <td>{lead.leadNo} </td>
            <td>{lead.description}</td>
            <td>{lead.leadStatus}</td>
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
            <td colSpan="4" style={{ textAlign: 'center' }}>
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
                {/* </div> */}
                {/* <div className="gotomainpagebtn">
                   <button className="mainpagebtn"onClick={() => handleNavigation("/HomePage")}>Go to Home Page</button>
                </div> */}
                </div>
            </div>
        </div>
    );
};
