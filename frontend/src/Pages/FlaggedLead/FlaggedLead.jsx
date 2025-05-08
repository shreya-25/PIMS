import React, { useContext, useState, useEffect} from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './FlaggedLead.css';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";
import Pagination from "../../components/Pagination/Pagination";
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import api from "../../api"; // adjust the path as needed
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";
import {SideBar } from "../../components/Sidebar/Sidebar";

export const FlaggedLead = () => {
  const location = useLocation();
  const newLead = location.state || null; 
   const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { caseDetails } = location.state || {};
      const { selectedCase, setSelectedLead } = useContext(CaseContext);
            const [showSelectModal, setShowSelectModal] = useState(false);
              const [pendingRoute, setPendingRoute]   = useState(null);
      
             const [showFilter, setShowFilter] = useState(false);
            const [showSort, setShowSort] = useState(false);
        
          const [currentPage, setCurrentPage] = useState(1);
          const [pageSize, setPageSize] = useState(50);
          const totalPages = 10; // Change based on your data
          const totalEntries = 100;
        
      
        const navigate = useNavigate(); // Initialize the navigate function

          const handleFilterApply = (filters) => {
            console.log("Applied Filters:", filters);
            // Perform filtering logic here (e.g., API call, state update)
          };
        
            const [sortField, setSortField] = useState(""); // Sorting field
          
        
           // Sort leads
           const handleSort = (field, order) => {
           
          };
      

  const defaultEntries = [
    {
      leadNumber: "1",
      leadSummary: "Investigate missing person case on 5th Avenue.",
      flag:"Critical"
    },
    {
      leadNumber: "2",
      leadSummary: "Check surveillance footage for recent robbery.",
      flag:"Moderate"
    },
    {
      leadNumber: "5",
      leadSummary: "Interview witnesses for car accident on Main Street.",
      flag:"Low"
    },
  ];

  const filtersConfig = [
    {
      name: "leadNumber",
      label: "Lead Number",
      options: ["45", "23", "14"],
    },
    {
      name: "leadSummary",
      label: "Lead Log Summary",
      options: [
        "Collect Audio from Dispatcher",
        "Interview Mr. John",
        "Collect evidence from 63 Mudray Street",
      ],
    },
    {
      name: "Flag",
      label: "Flag",
      options: ["Critical", "Moderate", "Low"],
    },
  ];


  // State to maintain a list of lead entries
  const [leadEntries, setLeadEntries] = useState(() => {
    // Retrieve from local storage if available
    const savedEntries = localStorage.getItem('leadEntries');
    const parsedEntries = savedEntries ? JSON.parse(savedEntries) : [];
    // Combine default entries with saved entries, ensuring no duplicates
    const combinedEntries = [
      ...defaultEntries,
      ...parsedEntries.filter(
        (entry) =>
          !defaultEntries.some((defaultEntry) => defaultEntry.leadNumber === entry.leadNumber)
      ),
    ];
    return combinedEntries;
  });

  const [filterStatus, setFilterStatus] = useState("all"); // State for status filter
  const [sortOption, setSortOption] = useState(""); // State for sort option


  // Effect to handle new lead data
  useEffect(() => {
    if (newLead && newLead.leadNumber) {
      // Append the new lead to the existing entries if not already present
      setLeadEntries((prevEntries) => {
        const isDuplicate = prevEntries.some(
          (entry) => entry.leadNumber === newLead.leadNumber
        );

        if (!isDuplicate) {
          const updatedEntries = [...prevEntries, { ...newLead, status: 'Pending' }];
          localStorage.setItem('leadEntries', JSON.stringify(updatedEntries)); // Save to local storage
          return updatedEntries;
        }

        return prevEntries;
      });
    }
  }, [newLead]);

   // Effect to save entries to local storage whenever they change
   useEffect(() => {
    localStorage.setItem("leadEntries", JSON.stringify(leadEntries));
  }, [leadEntries]);

  // Filter entries based on status
  const filteredEntries = leadEntries.filter((entry) => {
    if (filterStatus === "all") return true;
    return entry.status.toLowerCase() === filterStatus.toLowerCase();
  });

  // Sort entries based on selected option
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortOption === "leadNumber") {
      return new Date(a.assignedDate) - new Date(b.assignedDate);
    }
    if (sortOption === "flag") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  
  const handleLeadClick = (lead) => {
    navigate("/LeadReview", { state: { lead } }); // Navigate to lead details page with lead data
  };

    // Function to format dates as MM/DD/YY
const formatDate = (dateString) => {
  if (!dateString) return ""; // Handle empty dates
  const date = new Date(dateString);
  if (isNaN(date)) return ""; // Handle invalid dates

  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year

  return `${month}/${day}/${year}`;
};

   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  
    const onShowCaseSelector = (route) => {
      navigate(route, { state: { caseDetails } });
  };

  const [leads, setLeads] = useState({
    assignedLeads: [],
    pendingLeads: [],
    pendingLeadReturns: [],
    allLeads: [],
  } );
  useEffect(() => {
    const fetchAllLeads = async () => {
      if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
  
      try {
        const token = localStorage.getItem("token");
        const resp = await api.get(
          `/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        // assume resp.data is an array
        let leadsArray = Array.isArray(resp.data) ? resp.data : [];
  
        // if user is _not_ a Case Manager, strip out CM-only leads:
        if (selectedCase.role !== "Case Manager") {
          leadsArray = leadsArray.filter(
            (l) => l.accessLevel !== "Only Case Manager and Assignees"
          );
        }
  
        setLeads((prev) => ({
          ...prev,
          allLeads: leadsArray.map((lead) => ({
            leadNo: lead.leadNo,
            description: lead.description,
            leadStatus: lead.leadStatus,
            // any other fields you need...
          })),
        }));
      } catch (err) {
        console.error("Error fetching all leads:", err);
      }
    };
  
    fetchAllLeads();
  }, [selectedCase])

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

  return (
    <div className="lead-log-page">
      <Navbar />

      <div className="main-container">
            {/* Sidebar */}
            {/* <div className="sideitem">
                    <ul className="sidebar-list">
                    
                    <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
                    <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li>            
            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item "onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" 
             onClick={() => {
              selectedCase.role === "Investigator"
              ? setPendingRoute("/LRInstruction")
              : setPendingRoute("/CMInstruction")
              // setPendingRoute("/CMInstruction");
              setShowSelectModal(true);
            }}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
         
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
        
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item active" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}
           </ul>
        )}

<li className="sidebar-item" style={{ fontWeight: 'bold' }} onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Related Tabs {leadDropdownOpen ?  "▲": "▼"}
</li>
        {leadDropdownOpen && (
          <ul>
               <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
           
           {selectedCase.role !== "Investigator" && (
 <li
 className="sidebar-item"
 onClick={() => {
   setPendingRoute("/ChainOfCustody", { state: { caseDetails } });
   setShowSelectModal(true);
 }}
>    View Lead Chain of Custody
  </li> )}
  </ul>)}
       

                    </ul>

                    {showSelectModal && (
      <SelectLeadModal
        leads={leads.allLeads}
        onSelect={handleSelectLead}
        onClose={() => setShowSelectModal(false)}
      />
    )}
                </div> */}

                 <SideBar  activePage="LeadsDesk" />


        <div className="left-content">

        <div className="case-header">
          <h2 className="">WEBPAGE UNDER CONSTRUCTION</h2>
        </div>
        
      {/* {showFilter && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-popup-btn" onClick={() => setShowFilter(false)}>
              &times;
            </button>
            <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
            </div>
        </div>
      )} */}

{/*   
      {showSort && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-popup-btn" onClick={() => setShowSort(false)}>
              &times;
            </button>
            <Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} />
            </div>
          </div>
      )} */}

{/* <div className="table-section1">
      <div className="table-section">
      <div className="table-controls">
      <div className="search-bar">
      <div className="search-container1">
      <i className="fa-solid fa-magnifying-glass"></i>
      <input
        type="text"
        className="search-input1"
        placeholder="Search Lead"
      />
      </div>
      </div>
    <div className="empty-space"></div>
    <div className="control-buttons">
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
                    <button onClick={() => setShowSort(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/download.png`}
                        alt="Sort Icon"
                        className="icon-image"
                      />
                    </button>
                    <button onClick={() => setShowSort(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/printer.png`}
                        alt="Sort Icon"
                        className="icon-image"
                      />
                    </button>
    </div>
  </div>
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Lead #</th>
              <th>Lead Log Summary</th>
              <th style={{ width: "14%" }}>Flags</th>
            </tr>
          </thead>
          <tbody>
          {sortedEntries.length > 0 ? (
              sortedEntries.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.leadNumber}</td>
                  <td 
          className="clickable-description" 
          onClick={() => handleLeadClick(entry)}
          style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
        >{entry.leadSummary}</td>
                  <td>{entry.flag}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  No Leads Available
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
  currentPage={currentPage}
  totalEntries={totalEntries}  
  onPageChange={setCurrentPage} 
  pageSize={pageSize}
  onPageSizeChange={setPageSize} 
/>
      </div>
    </div> */}
    </div>
      </div>
    </div>
  );
};
