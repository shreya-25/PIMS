import React, { useContext, useState, useEffect} from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './LeadLog.css';
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";



export const LeadLog = () => {
  const location = useLocation();
  const newLead = location.state?.newLead || null; // Retrieve new lead data passed from CreateLead
  const { updateLeadLogCount } = location.state || {}; // Callback function to update lead count in the sidebar
  const [leadLogData, setLeadLogData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { caseDetails } = location.state || {};
    const { selectedCase, setSelectedLead } = useContext(CaseContext);

       const [showFilter, setShowFilter] = useState(false);
      const [showSort, setShowSort] = useState(false);
  


  const navigate = useNavigate(); // Initialize the navigate function

  const loggedInOfficer =  localStorage.getItem("loggedInUser");
  const token = localStorage.getItem('token') || '';

  const getFormattedDate = () => {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  const generateIncidentNumber = () => {
    const numbers = leadEntries
      .map((entry) => Number(entry.leadNo))
      .filter((num) => !isNaN(num));
    const maxNumber = numbers.length ? Math.max(...numbers) : 0;
    return (maxNumber + 1).toString();
  };


  useEffect(() => {
      if (caseDetails?.id && caseDetails?.title) {
        fetch(`http://localhost:5000/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`, {
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
    
            setLeadLogData(leadsArray);
          })
          .catch((error) => {
            console.error("❌ Error fetching leads:", error.message);
          });
      }
    }, [selectedCase, token]);
    
  


  const handleBackClick = () => {
    navigate("/casepagemanager"); // Navigate to the Case Page Manager
  };


  const handleLeadClick = (lead) => {
    navigate("/LeadInfo", { state: { lead } }); // Navigate to lead details page with lead data
  };


  const defaultEntries = [
    {
      leadNumber: "7",
      leadSummary: "Investigate Mr.John",
      dateCreated: "12/15/24",
      status: "Created",
      assignedOfficer: [], // Assigned officers
      dateSubmitted: "",
      dateApproved: "",
    },
    {
      leadNumber: "1",
      leadSummary: "Investigate missing person case on 5th Avenue",
      dateCreated: "12/15/24",
      status: "Pending",
      assignedOfficer: ["Officer 1", "Officer 5"], // Assigned officers
      dateSubmitted: "",
      dateApproved: "",
    },
    {
      leadNumber: "3",
      leadSummary: "Interview witnesses for car accident on Main Street",
      dateCreated: "12/12/24",
      status: "Submitted",
      assignedOfficer: ["Officer 4", "Officer 8"], // Assigned officers
      dateSubmitted: "12/14/24",
      dateApproved: "",
    },
    {
      leadNumber: "9",
      leadSummary: "Interview witnesses for theft on Scubert Street",
      dateCreated: "12/12/24",
      status: "Returned",
      assignedOfficer: ["Officer 4", "Officer 8"], // Assigned officers
      dateSubmitted: "12/14/24",
      dateApproved: "",
    },
    {
      leadNumber: "2",
      leadSummary: "Check surveillance footage for recent robbery",
      dateCreated: "12/10/24",
      status: "Completed",
      assignedOfficer: ["Officer 2"], // Assigned officers
      dateSubmitted: "12/16/24",
      dateApproved: "12/18/24",
    },
  ];


  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [filterCategory, setFilterCategory] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [filteredEntries, setFilteredEntries] = useState(defaultEntries);


  // useEffect(() => {
  //   if (newLead && newLead.leadNumber) {
  //     setLeadEntries((prevEntries) => [...prevEntries, newLead]);
  //   }
  // }, [newLead]);


  const handleApplyFilter = () => {
    let filtered = leadEntries;


    if (filterCategory === "status" && filterValue) {
      filtered = filtered.filter((entry) => entry.status === filterValue);
    } else if (filterCategory === "assignedOfficer" && filterValue) {
      filtered = filtered.filter((entry) => entry.assignedOfficer.includes(filterValue));
    } else if (filterCategory === "leadNumber" && filterValue) {
      filtered = filtered.filter((entry) => entry.leadNumber === filterValue);
    } else if (filterCategory === "dateCreated" && dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(
        (entry) =>
          new Date(entry.dateCreated) >= new Date(dateRange.startDate) &&
          new Date(entry.dateCreated) <= new Date(dateRange.endDate)
      );
    }


    setFilteredEntries(filtered);
  };


  const resetFilters = () => {
    setFilteredEntries(leadEntries);
    setFilterCategory("");
    setFilterValue([]);
    setDateRange({ startDate: "", endDate: "" });
  };




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
    if (updateLeadLogCount) {
      updateLeadLogCount(leadEntries.length); // Update the lead count in the sidebar
    }
  }, [leadEntries, updateLeadLogCount]);

  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order is ascending
  const [appliedSortOption, setAppliedSortOption] = useState(""); // Applied sort option
const [appliedSortOrder, setAppliedSortOrder] = useState("asc"); // Applied sort order


// Apply sort functionality
const handleApplySort = () => {
  setAppliedSortOption(sortOption);
  setAppliedSortOrder(sortOrder);
};


// Reset sort functionality
const handleResetSort = () => {
  setSortOption("");
  setSortOrder("asc");
  setAppliedSortOption("");
  setAppliedSortOrder("asc");
};


  // Sort entries based on selected option and order
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const compareValue = sortOrder === "asc" ? 1 : -1; // Determine sort direction
 
    if (sortOption === "date") {
      return (new Date(a.dateCreated) - new Date(b.dateCreated)) * compareValue;
    }
    if (sortOption === "status") {
      return a.status.localeCompare(b.status) * compareValue;
    }
    if (sortOption === "assigned to") {
      return (a.assignedTo || "").localeCompare(b.assignedTo || "") * compareValue;
    }
    if (sortOption === "lead number") {
      return (parseInt(a.leadNumber) - parseInt(b.leadNumber)) * compareValue;
    }
    return 0;
  });

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
      name: "DateCreated",
      label: "Date Created",
      options: ["01/06/25", "08/20/25", "02/06/25"],
    },
    {
      name: "Status",
      label: "Status",
      options: ["Assigned", "Pending", "Submitted", "Rejected", "Completed"],
    },
    {
      name: "assignedOfficers",
      label: "Assigned Officers",
      options: ["Officer 1", "Officer 2", "Officer 3"],
    },
    {
      name: "DateSubmitted",
      label: "Date Submitted",
      options: ["01/06/25", "08/20/25", "02/06/25"],
    },
    {
      name: "DateApproved",
      label: "Date Approved",
      options: ["01/06/25", "08/20/25", "02/06/25"],
    },
  ];

  const handleFilterApply = (filters) => {
    console.log("Applied Filters:", filters);
    // Perform filtering logic here (e.g., API call, state update)
  };

    const [sortField, setSortField] = useState(""); // Sorting field
  

   // Sort leads
   const handleSort = (field, order) => {
   
  };


  return (
    <div className="lead-log-page">
      <Navbar />


      <div className="main-content">
        <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
            alt="Police Department Logo"
            className="police-logo-cl"
          />
        </div>


        <div className="center-sectionll">
          <h2 className="title">LEAD LOG</h2>
        </div>
      </div>

      <div className="filters-section1">
      {/* <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} /> */}
      {/* <Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} /> */}

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
      </div>


      <div className="table-section">
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "6%" }}>LEAD #</th>
              <th>LEAD LOG SUMMARY</th>
              <th style={{ width: "12%" }}>DATE CREATED</th>
              <th style={{ width: "6%" }}>STATUS</th>
              <th style={{ width: "12%" }}>ASSIGNED TO</th>
              <th style={{ width: "12%" }}>DATE SUBMITTED</th>
              <th style={{ width: "12%" }}>DATE APPROVED</th>
            </tr>
          </thead>
          <tbody>
          {leadLogData.length > 0 ? (
              leadLogData.map((entry, index) => (
                <tr key={index} onClick={() => handleLeadClick(entry)}>
                  <td>{entry.leadNo}</td>
                  <td 
          className="clickable-description" 
          onClick={() => handleLeadClick(entry)}
          style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
        >
          {entry.description}
        </td>
                  <td>{entry.assignedDate}</td>
                  <td>{entry.leadStatus }</td>
                  <td>{entry.assignedTo?.join(", ")}</td>
                  <td>{entry.dateSubmitted || ''}</td>
                  <td>{entry.dateApproved || ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>
                  No Leads Available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      <div className="report-section">
        <label>Select Report Type: </label>
        <select className="dropdown">
          <option value="summary">Summary</option>
          <option value="detailed">Detailed</option>
        </select>
      </div>


      <div className="btn-sec-cl">
      <button className="next-btncl" onClick={handleBackClick}>Back</button>
        <button className="next-btncl">Download</button>
        <button className="next-btncl">Print</button>
      </div>
    </div>
  );
};



