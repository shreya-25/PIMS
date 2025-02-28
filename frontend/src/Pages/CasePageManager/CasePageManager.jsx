import React, { useState, useEffect} from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Searchbar from '../../components/Searchbar/Searchbar';
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import Button from '../../components/Button/Button';
import './CasePageManager.css'; // Custom CSS file for styling
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";

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

    const [activeTab, setActiveTab] = useState("allLeads"); // Default to All Leads tab
    const handleViewAssignedLead = (lead) => {
    };
    const handleCaseClick = (caseDetails) => {
      navigate("/CasePageManager", { state: { caseDetails } }); // Pass case details via state
    };
    const handleLRClick = (lead) => {
      navigate("/LRInstruction", { state: { leadDetails: lead } });
    };
    const handleNavigation = (route) => {
      navigate(route); // Navigate to respective page
    };

    const signedInOfficer = localStorage.getItem("loggedInUser");


    
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
        dueDate: leadToAccept.dueDate || "12/31/2024", // Default due date
        priority: leadToAccept.priority || "Medium", // Default priority
        flags: leadToAccept.flags || [],
        assignedOfficers: leadToAccept.assignedOfficers || ["Unassigned"],
      };
    
      setLeads((prevLeads) => ({
        ...prevLeads,
        assignedLeads: prevLeads.assignedLeads.filter((lead) => lead.id !== leadId),
        pendingLeads: [...prevLeads.pendingLeads, newPendingLead],
      }));
    };
    
    const isMainStreetThreat = caseDetails?.title === "Main Street Murder";
    
      
    const [leads, setLeads] = useState(isMainStreetThreat ? {
      assignedLeads: [],
      pendingLeads: [],
      pendingLeadReturns: [],
      allLeads: [],
  } : {
      assignedLeads: [
          // { id: 1, description: "Some details about the theft incident ", dueDate: "12/25/2024",
          //   priority: "High", flags: ["Important"], assignedOfficers: ["Officer 1", "Officer 3"] },
          // { id: 2, description: "Collect Audio Recording from Dispatcher", dueDate: "12/31/2024",
          //   priority: "Medium", flags: [], assignedOfficers: ["Officer 2"] },
          // { id: 3, description: "Interview John", dueDate: "12/29/2024",
          //   priority: "Low", flags: [], assignedOfficers: ["Officer 4"] },
      ],
      pendingLeads: [
          // { id: 4, description: "Interview Witness", dueDate: "12/26/2024",
          //   priority: "High", flags: ["Important"], assignedOfficers: ["Officer 1", "Officer 3"] },
          // { id: 6, description: "Interview Neighbours", dueDate: "12/23/2024",
          //   priority: "Medium", flags: [], assignedOfficers: ["Officer 2"] },
          // { id: 7, description: "Collect Evidence", dueDate: "12/22/2024",
          //   priority: "Low", flags: [], assignedOfficers: ["Officer 4"] },
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
    if (caseDetails?.id && caseDetails?.title) {
      fetch(`http://localhost:5000/api/lead/case/${caseDetails.id}/${caseDetails.title}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("✅ Fetched Leads Data:", data); // 🔍 Debug API response
  
          // Ensure `data` is an array, or default to an empty array
          const leadsArray = Array.isArray(data) ? data : [];
  
          // ✅ Filter and map assigned and pending leads
          const assignedLeads = leadsArray
            .filter(lead => lead.leadStatus === "Assigned")
            .map(lead => ({
              id: lead.leadNo,
              description: lead.description,
              dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
              priority: lead.priority || "Medium",
              flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [], // Ensure array
              assignedOfficers: Array.isArray(lead.assignedTo) ? lead.assignedTo : [], // Ensure array
              leadStatus: lead.leadStatus,
              caseName: lead.caseName,
              caseNo: String(lead.caseNo) // Ensure string format
            }));
  
          const pendingLeads = leadsArray
            .filter(lead => lead.leadStatus === "Pending")
            .map(lead => ({
              id: lead.leadNo,
              description: lead.description,
              dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
              priority: lead.priority || "Medium",
              flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [], // Ensure array
              assignedOfficers: Array.isArray(lead.assignedTo) ? lead.assignedTo : [], // Ensure array
              leadStatus: lead.leadStatus,
              caseName: lead.caseName,
              caseNo: String(lead.caseNo) // Ensure string format
            }));
  
          console.log("✅ Assigned Leads:", assignedLeads);
          console.log("✅ Pending Leads:", pendingLeads);
  
          setLeads((prev) => ({
            ...prev,
            allLeads: leadsArray,
            assignedLeads: assignedLeads,
            pendingLeads: pendingLeads
          }));
        })
        .catch((error) => {
          console.error("❌ Error fetching leads:", error.message);
        });
    }
  }, [caseDetails, token]);
  

    const handleTabClick = (tab) => {
      if (!isMainStreetThreat) {
          setActiveTab(tab);
      }
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


  useEffect(() => {
    const fetchPendingLeadReturns = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("❌ No token found. User is not authenticated.");
                return;
            }

            if (!caseDetails?.id || !caseDetails?.title) {
                console.error("⚠️ No valid case details provided.");
                return;
            }

            console.log("🔍 Fetching pending lead returns for exact case:", caseDetails);

            // ✅ Fetch all lead returns assigned to or assigned by the officer
            const leadsResponse = await axios.get("http://localhost:5000/api/leadreturn/officer-leads", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            // ✅ Filter pending lead returns that match the exact case details (caseNo & caseName)
            const pendingLeadReturns = leadsResponse.data.filter(lead => 
                lead.assignedBy.lRStatus === "Pending"
                &&
                lead.caseNo === caseDetails.id &&   // Match exact case number
                lead.caseName === caseDetails.title // Match exact case name
            ).map(lead => ({
                id: lead.leadNo,
                description: lead.description,
                caseName: lead.caseName,
                caseNo: lead.caseNo,
            }));

            // ✅ Update state with filtered pending lead returns
            setLeads(prevLeads => ({
                ...prevLeads,
                pendingLeadReturns: pendingLeadReturns
            }));

        } catch (error) {
            console.error("Error fetching pending lead returns:", error.response?.data || error);
        }
    };

    fetchPendingLeadReturns();
}, [signedInOfficer, caseDetails]);


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
        if (caseDetails && caseDetails.id) {
          const token = localStorage.getItem("token");
          const response = await axios.get(`http://localhost:5000/api/cases/summary/${caseDetails.id}`, {
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
  }, [caseDetails]);

  




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
      

    return (
        <div className="case-page-manager">
            {/* Navbar */}
            <Navbar />

            {/* Main Container */}
            <div className="main-container">
                {/* Sidebar */}
                <div className="sideitem">
                    <ul className="sidebar-list">
                    <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>

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
              {tab === "allLeads" && "Total Generated Leads"}
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

                        {/* <li className="sidebar-item" onClick={() => handleTabClick("assignedLeads")}>My Assigned Leads {leads.assignedLeads.length}</li>
                        <li className="sidebar-item" onClick={() => handleTabClick("pendingLeads")}>My Pending Leads {leads.pendingLeads.length}</li>
                        <li className="sidebar-item"onClick={() => handleTabClick("pendingLeadReturns")}>My Pending Lead Returns {leads.pendingLeadReturns.length}</li>
                        <li className="sidebar-item" onClick={() => handleTabClick("allLeads")}>Total Generated Leads {leads.allLeads.length}</li> */}
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
                        <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>

                        <li className="sidebar-item"onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>View Lead Chain of Custody</li>
                    </ul>
                </div>
                <div className="left-content">

                   {/* Display Case Number and Name */}
                <div className="case-header">
                    {caseDetails ? (
                        <h1>
                          Case: {caseDetails?.id || "N/A"} | {caseDetails?.title || "Unknown Case"}
                        </h1>
                    ) : (
                        <h1>Case: 12345 | Main Street Murder </h1>
                    )}
                </div>
                <div className = "case-summary">
                <label className="input-label">Case Summary</label>
                        <textarea
                            className="textarea-field"
                            value={caseSummary}
                            onChange={handleCaseSummaryChange}
                            readOnly={!isEditing} // Read-only when not in edit mode
                        ></textarea>

                         <button className="save-btn1" onClick={handleSaveClick}>Save</button>
                 {/* Buttons: Show "Edit" when not editing, "Save" when editing */}
                 {/* {!isEditing ? (
                            <button className="edit-btn1" onClick={handleEditClick}>Edit</button>
                        ) : (
                            <button className="save-btn1" onClick={handleSaveClick}>Save</button>
                        )} */}
                </div>
                {/* Content Area */}
                <div className="content">
                  <div className='searchContainer'>
                    <Searchbar placeholder="Search Lead" />
                    </div>
                    <Button
                        label="Generate Lead"
                        className="generate-lead-btn1"
                        onClick={handleGenerateLead}
                    />
                   
                    {/* Tab Navigation */}

                    <div className="stats-bar">
                        <span
                            className={`hoverable ${activeTab === "assignedLeads" ? "active" : ""}`}
                            onClick={() => handleTabClick("assignedLeads")}
                        >
                            Assigned Leads: {isMainStreetThreat ? 0 : leads.assignedLeads.length}
                        </span>
                        <span
                            className={`hoverable ${activeTab === "pendingLeads" ? "active" : ""}`}
                            onClick={() => handleTabClick("pendingLeads")}
                          >
                            Pending Leads: {isMainStreetThreat ? 0 : leads.pendingLeads.length}
                          </span>
                        <span
                            className={`hoverable ${activeTab === "pendingLeadReturns" ? "active" : ""}`}
                            onClick={() => handleTabClick("pendingLeadReturns")}
                        >
                            Pending Lead Returns: {isMainStreetThreat ? 0 : leads.pendingLeadReturns.length}
                        </span>
                        <span
                            className={`hoverable ${activeTab === "allLeads" ? "active" : ""}`}
                            onClick={() => handleTabClick("allLeads")}
                        >
                            All Leads: {isMainStreetThreat ? 0 : leads.allLeads.length}
                        </span>
                    </div>
                  

                    {/* Tab Content */}
                    {!isMainStreetThreat ? (
                    <div className="content-section">
                    {activeTab === "assignedLeads" && (
  <div className="assigned-leads">
    {/* <button
      onClick={() => setFilterSortPopupVisible(true)}
      className="filter-sort-button"
    >
      Open Filter & Sort
    </button> */}

<Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
<Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} />


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


    <table className="leads-table">
      <thead>
        <tr>
          <th>Lead No.</th>
          <th>Lead Description</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Days Left</th>
          <th>Flags</th>
          <th>Assigned Officers</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {leads.assignedLeads
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
              <td>{lead.assignedOfficers?.join(", ") || "Unassigned"}</td>
              <td>
                <button
                  className="view-btn1"
                  // onClick={() =>
                  // }
                >
                  View
                </button>
                <button
                  className="accept-btn"
                  onClick={() => {
                    if (
                      window.confirm(`Do you want to accept this lead?`)
                    ) {
                      acceptLead(lead.id);
                    }
                  }}
                >
                  Accept
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)}

          
{activeTab === "pendingLeads" && (
  <div className="pending-leads">

<Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
<Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} />
    {/* <button
      onClick={() => setFilterSortPopupVisible(true)}
      className="filter-sort-button"
    >
      Open Filter & Sort
    </button> */}


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


    <table className="leads-table">
      <thead>
        <tr>
          <th>Lead No.</th>
          <th>Lead Description</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Days Left</th>
          <th>Flags</th>
          <th>Assigned Officers</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {leads.pendingLeads
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
              <td>{lead.assignedOfficers.join(", ")}</td>
              <td>
                <button
                  className="view-btn1"
                  onClick={() => alert(`Viewing lead: ${lead.description}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)}


{activeTab === "pendingLeadReturns" && (
  <div className="pending-lead-returns">
    <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
    <Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} />
    <table className="leads-table">
              <thead>
                <tr>
                  <th>Lead No.</th>
                  <th>Lead Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leads.pendingLeadReturns.map((lead) => (
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
                  ))}
              </tbody>
            </table>
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
    <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
    <Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} />
    <table className="leads-table">
      <thead>
        <tr>
          <th>Lead No.</th>
          <th>Lead Description</th>
          <th>Lead Status</th>
          <th></th> {/* Empty header for buttons column */}
        </tr>
      </thead>
      <tbody>
        {leads.allLeads.map((lead) => (
          <tr key={lead.id}>
            <td>{lead.leadNo} </td>
            <td>{lead.description}</td>
            <td>{lead.leadStatus}</td>
            <td>
              <button
                className= "view-btn1"
                onClick={() => handleNavigation("/LeadInfo")}
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

                    </div> ): (
                        <div className="no-leads-message">
                        </div>
                    )}
                </div>
                <div className="gotomainpagebtn">
                   <button className="mainpagebtn"onClick={() => handleNavigation("/HomePage")}>Go to Home Page</button>
                </div>
                </div>
            </div>
        </div>
    );
};
