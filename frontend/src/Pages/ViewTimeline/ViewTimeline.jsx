import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../../components/Navbar/Navbar";
import "./ViewTimeline.css";
import axios from "axios";
import { CaseContext } from "../CaseContext";

export const ViewTimeline = () => {
  const navigate = useNavigate();
   const location = useLocation();
     const { caseDetails } = location.state || {};
       const { selectedCase, setSelectedLead } = useContext(CaseContext);

    // Function to format date as "Month Day, Year"
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { month: "short", day: "numeric", year: "numeric" };
        return date.toLocaleDateString("en-US", options);
      };

  // Timeline entries
  const [originalEntries] = useState([
    {
      leadNo: "Lead1",
      date: "01/01/2024",
      timeRange: "10:30 AM - 12:00 PM",
      location: "123 Main St, NY",
      flag: "Important",
      description: "Suspect spotted leaving crime scene",
    },
    {
      leadNo: "Lead2",
      date: "01/05/2024",
      timeRange: "2:00 PM - 3:30 PM",
      location: "456 Elm St, CA",
      flag: "",
      description: "Suspect was seen heading to the airport",
    },
    {
      leadNo: "Lead3",
      date: "01/10/2024",
      timeRange: "9:00 AM - 10:00 AM",
      location: "789 Pine St, TX",
      flag: "",
      description: "Interview with witness about robbery",
    },
    {
        leadNo: "Lead4",
        date: "02/14/2024",
        timeRange: "12:00 AM - 12:40 AM",
        location: "7 Rosewood St, TX",
        flag: "",
        description: "Suspect was in the bank",
      },
      
  ]);
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]); // To hold selected locations
  const [timelineEntries, setTimelineEntries] = useState([]);

  
  const handleViewDetails = (leadNo) => {
    navigate(`/lead/${leadNo}`); // Navigate to the detailed view of the lead
  };

  const formatTimeRange = (startTime, endTime) => {
    const options = { hour: "2-digit", minute: "2-digit", hour12: false };
    const start = new Date(startTime).toLocaleTimeString([], options);
    const end = new Date(endTime).toLocaleTimeString([], options);
    return `${start} to ${end}`;
  };
  
  const [filters, setFilters] = useState({
    flag: "",
    location: [],
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  const [sortOption, setSortOption] = useState(""); // Sort option
  const [sortOrder, setSortOrder] = useState("asc"); // Sort order: 'asc' or 'desc'
  const [showFlagDropdown, setShowFlagDropdown] = useState(false);
const [showLocationDropdown, setShowLocationDropdown] = useState(false);


  const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

  const onShowCaseSelector = (route) => {
    navigate(route, { state: { caseDetails } });
};
const [filteredEntries, setFilteredEntries] = useState([]);
   // Fetch timeline entries when component mounts or when case details change.
   useEffect(() => {
    // Determine case details from either the context or location state.
    const caseNo = (caseDetails && caseDetails.caseNo) || (selectedCase && selectedCase.caseNo);
    const caseName = (caseDetails && caseDetails.caseName) || (selectedCase && selectedCase.caseName);

    if (!caseNo || !caseName) return;

    // Construct the URL, encoding the case name for URL safety.
    const endpoint = `http://localhost:5000/api/timeline/case/${caseNo}/${encodeURIComponent(caseName)}`;

    const token = localStorage.getItem("token");
  console.log("Token:", token);

    axios.get(endpoint, {
      headers: {
          Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      console.log("Fetched timeline entries:", response.data);
      // Assume response.data is an array of timeline entries
      // Sort them in ascending order by combining date and eventStartTime.
      const sortedEntries = response.data.sort((a, b) => {
        return new Date(a.date + "T" + a.eventStartTime) - new Date(b.date + "T" + b.eventStartTime);
      });
      setTimelineEntries(sortedEntries);
      setFilteredEntries(sortedEntries); 
    })
    .catch((error) => {
      console.error("Error fetching timeline entries:", error);
    });
  }, [caseDetails, selectedCase]);

  // Extract unique locations from the fetched timeline entries (if needed for filtering)
  useEffect(() => {
    const uniqueLocations = [...new Set(timelineEntries.map((entry) => entry.location))];
    setLocations(uniqueLocations);
  }, [timelineEntries]);

  // Function to handle location checkbox changes
  const handleLocationChange = (location) => {
    setFilters((prev) => {
      const locArr = prev.location.includes(location)
        ? prev.location.filter((loc) => loc !== location)
        : [...prev.location, location];
      return { ...prev, location: locArr };
    });
  };

  // This function handles the filtering of timeline entries (unchanged)
  const handleFilter = () => {
    let filtered = [...timelineEntries];

    // Filter by flag
    if (filters.flag === "Flagged") {
      filtered = filtered.filter((entry) => entry.flag);
    } else if (filters.flag === "None") {
      filtered = filtered.filter((entry) => !entry.flag);
    } else if (filters.flag && filters.flag !== "All Entries") {
      filtered = filtered.filter((entry) => entry.flag === filters.flag);
    }

    // Filter by selected locations
    if (filters.location.length > 0) {
      filtered = filtered.filter((entry) => filters.location.includes(entry.location));
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.date);
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;
        if (startDate && endDate) {
          return entryDate >= startDate && entryDate <= endDate;
        } else if (startDate) {
          return entryDate >= startDate;
        } else if (endDate) {
          return entryDate <= endDate;
        }
        return true;
      });
    }

    // Filter by time range
    if (filters.startTime && filters.endTime) {
      filtered = filtered.filter((entry) => {
        const [entryStart, entryEnd] = entry.timeRange.split(" - ");
        return entryStart >= filters.startTime && entryEnd <= filters.endTime;
      });
    }

    setFilteredEntries(filtered);
  };

  // Sort the timeline entries by date and event start time
  const handleSort = () => {
    const sorted = [...filteredEntries].sort((a, b) => {
      const dateA = new Date(a.date + "T" + a.eventStartTime);
      const dateB = new Date(b.date + "T" + b.eventStartTime);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    setFilteredEntries(sorted);
  };


  return (
    <div className="timeline-container">
      <Navbar />
      {/* <h2 className="title">CRIME INVESTIGATION TIMELINE</h2> */}
      
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
                            <li className="sidebar-item" onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Management {leadDropdownOpen ?  "▼" : "▲"}
        </li>
        {leadDropdownOpen && (
          <ul className="dropdown-list1">
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>
              New Lead
            </li>
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              View Lead Chain of Custody
            </li>
          </ul>
        )} 
                            {/* Case Information Dropdown */}
        <li className="sidebar-item" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Management {caseDropdownOpen ? "▼" : "▲" }
        </li>
        {caseDropdownOpen && (
          <ul className="dropdown-list1">
              <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
              <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>
              View Lead Log
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li>
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Case Scratchpad
            </li>
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
              View Lead Hierarchy
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              Generate Report
            </li> */}
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>
              View Flagged Leads
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>
              View Timeline Entries
            </li>
            {/* <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li> */}

            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

         
          </ul>
        )}

                    </ul>
                </div>
        {/* <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
            alt="Police Department Logo"
            className="police-logo-cl"
          />
        </div> */}

        <div className="left-content">

        <div className="case-header">
          <h2 className="">CRIME INVESTIGATION TIMELINE</h2>
        </div>

      <div className="timeline-section">
        <div className="timeline-horizontal">
          <div className="timeline-line"></div>
          {filteredEntries.map((entry, index) => (
            <div key={index} className="timeline-entry-horizontal">
              <div className="timeline-marker-horizontal"></div>
              <div className="timeline-content-horizontal">
                <div className="timeline-datetime">
                  <p className="timeline-date">{formatDate(entry.eventStartDate)} - {formatDate(entry.eventEndDate)}</p>
                  <p className="timeline-time">{formatTimeRange(entry.eventStartTime, entry.eventEndTime)}</p>
                </div>
                <h3
                  className="timeline-lead-horizontal"
                  onClick={() => handleViewDetails(entry.leadNo)}
                >
                  Lead {entry.leadNo}
                </h3>
                <p className="timeline-location">{entry.eventLocation}</p>
                {entry.timelineFlag && entry.timelineFlag.length > 0 && (
                  <p className="timeline-flag">
                    <span className="red-flag">🚩</span> {entry.timelineFlag.join(', ')}
                  </p>
                )}

                <p className="timeline-description">{entry.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    
      {/* Filter and Sort Section */}
      <div className="filter-sort-container">
        {/* Filter by Flag */}
<div className="filter-container">
  <label className="filterFlag" htmlFor="filterFlag">Filter by Flag:</label>
  <div className="timeline-filter-dropdown">
    <button
      className="timeline-filter-dropdown-btn"
      id="filterFlag"
      onClick={() => setShowFlagDropdown(!showFlagDropdown)}
    >
      {filters.flag || "Select Flag"}
    </button>
    {showFlagDropdown && (
      <div className="timeline-filter-dropdown-content">
        {["All Entries", "Flagged", "No Flags", "Important", "Urgent"].map(
          (flag, index) => (
            <div key={index}>
              <input
                type="radio"
                name="flagFilter"
                id={`flag-${index}`}
                value={flag}
                checked={filters.flag === flag}
                onChange={() => setFilters({ ...filters, flag })}
              />
              <label htmlFor={`flag-${index}`}>{flag}</label>
            </div>
          )
        )}
      </div>
    )}
  </div>
</div>

{/* Filter by Locations with Dropdown and Checkboxes */}
<div className="filter-container">
  <label htmlFor="filterLocation">Filter by Location:</label>
  <div className="timeline-filter-dropdown">
    <button
      className="timeline-filter-dropdown-btn"
      id="filterLocation"
      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
    >
      {filters.location.length > 0
        ? `Selected (${filters.location.length})`
        : "Select Locations"}
    </button>
    {/* {showLocationDropdown && (
      <div className="timeline-filter-dropdown-content">
        {locations.map((location, index) => (
          <div key={index}>
            <input
              type="checkbox"
              id={`location-${index}`}
              value={location}
              checked={filters.location.includes(location)}
              onChange={() => handleLocationChange(location)}
            />
            <label htmlFor={`location-${index}`}>{location}</label>
          </div>
        ))}
      </div>
    )} */}
  </div>
</div>



         {/* Filter by Date Range */}
         <div className="filter-container">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

         {/* Filter by Time Range */}
         <div className="filter-container">
          <label htmlFor="startTime">Start Time:</label>
          <input
            type="time"
            id="startTime"
            value={filters.startTime}
            onChange={(e) =>
              setFilters({ ...filters, startTime: e.target.value })
            }
          />
          <label htmlFor="endTime">End Time:</label>
          <input
            type="time"
            id="endTime"
            value={filters.endTime}
            onChange={(e) =>
              setFilters({ ...filters, endTime: e.target.value })
            }
          />
        </div>
        <button className="timeline-filter-btn" onClick={handleFilter}>Apply Filter</button>

      </div>

       {/* Sort Section */}
       <div className="sort-container">
        <label htmlFor="sortOrder">Sort by Date & Time:</label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <button className="timeline-filter-btn" onClick={handleSort}>Apply Sort</button>
      </div>
    </div>
    </div>
            </div>
  );
};
