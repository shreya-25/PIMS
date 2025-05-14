
import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../../components/Navbar/Navbar";
import "./ViewTimeline.css";
import axios from "axios";
import { CaseContext } from "../CaseContext";
import api from "../../api"; // adjust the path as needed
import {SideBar } from "../../components/Sidebar/Sidebar";


// Helper function to convert 12-hour format (with AM/PM) to 24-hour format.
// If the passed-in string is already in 24-hour format, it returns it unchanged.
const convert12To24 = (time12h) => {
  if (!time12h) return time12h;
  const upperTime = time12h.toUpperCase();
  if (!upperTime.includes('AM') && !upperTime.includes('PM')) {
    // Already 24-hour format (e.g., "08:40")
    return time12h;
  }
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (modifier === 'AM') {
    if (hours === 12) hours = 0;
  } else if (modifier === 'PM') {
    if (hours !== 12) hours += 12;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

export const ViewTimeline = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { caseDetails } = location.state || {};
  const { selectedCase, setSelectedLead } = useContext(CaseContext);

  // Format a date as "Mon DD, YYYY"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  // Dummy timeline entries for testing (if needed)
  const [originalEntries] = useState([
    {
      leadNo: "Lead1",
      date: "01/01/2024",
      timeRange: "10:30 AM - 12:00 PM",
      eventLocation: "123 Main St, NY",
      flag: "Important",
      description: "Suspect spotted leaving crime scene",
      eventStartDate: "2024-01-01",
      eventEndDate: "2024-01-01",
      eventStartTime: "10:30 AM",
      eventEndTime: "12:00 PM",
      timelineFlag: ["Important"]
    },
    {
      leadNo: "Lead2",
      date: "01/05/2024",
      timeRange: "2:00 PM - 3:30 PM",
      eventLocation: "456 Elm St, CA",
      flag: "",
      description: "Suspect was seen heading to the airport",
      eventStartDate: "2024-01-05",
      eventEndDate: "2024-01-05",
      eventStartTime: "2:00 PM",
      eventEndTime: "3:30 PM",
      timelineFlag: []
    },
    {
      leadNo: "Lead3",
      date: "01/10/2024",
      timeRange: "9:00 AM - 10:00 AM",
      eventLocation: "789 Pine St, TX",
      flag: "",
      description: "Interview with witness about robbery",
      eventStartDate: "2024-01-10",
      eventEndDate: "2024-01-10",
      eventStartTime: "9:00 AM",
      eventEndTime: "10:00 AM",
      timelineFlag: []
    },
    {
      leadNo: "Lead4",
      date: "02/14/2024",
      timeRange: "12:00 AM - 12:40 AM",
      eventLocation: "7 Rosewood St, TX",
      flag: "",
      description: "Suspect was in the bank",
      eventStartDate: "2024-02-14",
      eventEndDate: "2024-02-14",
      eventStartTime: "12:00 AM",
      eventEndTime: "12:40 AM",
      timelineFlag: []
    },
  ]);

  // Component state for timeline entries, filtered entries and unique locations
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filters state: for flag, location, date range, and time range
  const [filters, setFilters] = useState({
    flag: "",
    location: [],
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  // Sort order state for ascending/descending
  const [sortOrder, setSortOrder] = useState("asc");

  // Dropdown toggles for flag and location filters
  const [showFlagDropdown, setShowFlagDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Dropdown toggles for the sidebar
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

  const onShowCaseSelector = (route) => {
    navigate(route, { state: { caseDetails } });
  };

  // Fetch timeline entries when the component mounts or when case details change.
  useEffect(() => {
    const caseNo = (caseDetails && caseDetails.caseNo) || (selectedCase && selectedCase.caseNo);
    const caseName = (caseDetails && caseDetails.caseName) || (selectedCase && selectedCase.caseName);
    if (!caseNo || !caseName) return;

    // Construct URL and get token
    const endpoint = `/api/timeline/case/${caseNo}/${encodeURIComponent(caseName)}`;
    const token = localStorage.getItem("token");

    api.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        console.log("Fetched timeline entries:", response.data);
        // Sort entries using eventStartDate and eventStartTime
        const sortedEntries = response.data.sort((a, b) => {
          const dateA = new Date(a.eventStartDate + "T" + convert12To24(a.eventStartTime));
          const dateB = new Date(b.eventStartDate + "T" + convert12To24(b.eventStartTime));
          return dateA - dateB;
        });
        setTimelineEntries(sortedEntries);
        setFilteredEntries(sortedEntries);
      })
      .catch((error) => {
        console.error("Error fetching timeline entries:", error);
      });
  }, [caseDetails, selectedCase]);

  // Extract unique locations from the timeline entries (using eventLocation consistently)
  useEffect(() => {
    const uniqueLocations = [...new Set(timelineEntries.map((entry) => entry.eventLocation))];
    setLocations(uniqueLocations);
  }, [timelineEntries]);

  // Handle location filter checkbox change
  const handleLocationChange = (locationValue) => {
    setFilters((prev) => {
      const updatedLocations = prev.location.includes(locationValue)
        ? prev.location.filter((loc) => loc !== locationValue)
        : [...prev.location, locationValue];
      return { ...prev, location: updatedLocations };
    });
  };

    const formatTimeRange = (startTime, endTime) => {
    const options = { hour: "2-digit", minute: "2-digit", hour12: false };
    const start = new Date(startTime).toLocaleTimeString([], options);
    const end = new Date(endTime).toLocaleTimeString([], options);
    return `${start} to ${end}`;
  };

  // Handle filtering of timeline entries
  const handleFilter = () => {
    let filtered = [...timelineEntries];

    // Filter by flag if a flag is selected.
    // Here we check the timelineFlag property (you can adjust this if your API uses a different property).
    if (filters.flag === "Flagged") {
      filtered = filtered.filter((entry) => entry.timelineFlag && entry.timelineFlag.length > 0);
    } else if (filters.flag === "None") {
      filtered = filtered.filter((entry) => !entry.timelineFlag || entry.timelineFlag.length === 0);
    } else if (filters.flag && filters.flag !== "All Entries") {
      filtered = filtered.filter((entry) =>
        entry.timelineFlag && entry.timelineFlag.includes(filters.flag)
      );
    }

    // Filter by selected locations
    if (filters.location.length > 0) {
      filtered = filtered.filter((entry) => filters.location.includes(entry.eventLocation));
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.eventStartDate);
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
      // Convert filter times to 24-hour format first.
      const filterStart24 = convert12To24(filters.startTime);
      const filterEnd24 = convert12To24(filters.endTime);

      filtered = filtered.filter((entry) => {
        if (!entry.eventStartTime || !entry.eventEndTime) return false;
        const entryStart24 = convert12To24(entry.eventStartTime);
        const entryEnd24 = convert12To24(entry.eventEndTime);
        const entryStart = new Date(`1970-01-01T${entryStart24}`);
        const entryEnd   = new Date(`1970-01-01T${entryEnd24}`);
        const filterStart = new Date(`1970-01-01T${filterStart24}`);
        const filterEnd   = new Date(`1970-01-01T${filterEnd24}`);
        // Include entry if it overlaps the filter window:
        return entryStart < filterEnd && entryEnd > filterStart;
      });
    }

    setFilteredEntries(filtered);
  };

  // Handle sorting by event date and start time.
  const handleSort = () => {
    const sorted = [...filteredEntries].sort((a, b) => {
      const dateA = new Date(a.eventStartDate + "T" + convert12To24(a.eventStartTime));
      const dateB = new Date(b.eventStartDate + "T" + convert12To24(b.eventStartTime));
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    setFilteredEntries(sorted);
  };

  // Navigate to detailed view for a specific lead.
  const handleViewDetails = (leadNo) => {
    navigate(`/lead/${leadNo}`);
  };

  return (
    <div className="timeline-container">
      <Navbar />
      <div className="main-container">
        {/* Sidebar */}
        {/* <div className="sideitem">
          <ul className="sidebar-list">
          <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li>            
            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
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
            {selectedCase.role !== "Investigator" && (
  <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
    View Lead Chain of Custody
  </li>
)}

          </ul>
        </div> */}
          <SideBar  activePage="LeadsDesk" />
        {/* Main Content */}
        <div className="left-content">
        <div className="caseandleadinfo">
        <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>


          {/* <h5 className = "side-title"> 
          {selectedLead?.leadNo ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName}` : "LEAD DETAILS"}

          </h5> */}
          </div>

          <div className="case-header">
            <h2>CRIME INVESTIGATION TIMELINE</h2>
          </div>

             <div className="top-menu">
        <div className="menu-items">
           <span className="menu-item " onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )}>
            Leads Desk
          </span>
        <span className="menu-item " onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )}>
            Generate Report
          </span>
          <span className="menu-item" onClick={() => navigate("/CaseScratchpad", { state: { caseDetails } } )}>
            Add/View Case Notes
          </span>
          <span className="menu-item" onClick={() => navigate('/SearchLead', { state: { caseDetails } } )} >
            Search Leads
          </span>
          <span className="menu-item active" onClick={() => navigate("/ViewTimeline", { state: { caseDetails } } )}>
          View Timelines
          </span>
          <span className="menu-item" onClick={() => navigate("/FlaggedLead", { state: { caseDetails } } )}>
          View Flagged Leads
          </span>
         </div>
       </div>

          {/* Timeline Section */}
          <div className="timeline-section">
            <div className="timeline-horizontal">
              <div className="timeline-line"></div>
              {filteredEntries.map((entry, index) => (
                <div key={index} className="timeline-entry-horizontal">
                  <div className="timeline-marker-horizontal"></div>
                  <div className="timeline-content-horizontal">
                    <div className="timeline-datetime">
                      <p className="timeline-date">
                        {formatDate(entry.eventStartDate)} - {formatDate(entry.eventEndDate)}
                      </p>
                      <p className="timeline-time">
                        {formatTimeRange(convert12To24(entry.eventStartTime), convert12To24(entry.eventEndTime))}
                      </p>
                    </div>
                    <h3 className="timeline-lead-horizontal" onClick={() => handleViewDetails(entry.leadNo)}>
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

          {/* Filter & Sort Section */}
          <div className="filter-sort-container">
            {/* Flag Filter */}
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
                    {["All Entries", "Flagged", "None", "Important", "Urgent"].map((flagOption, index) => (
                      <div key={index}>
                        <input
                          type="radio"
                          name="flagFilter"
                          id={`flag-${index}`}
                          value={flagOption}
                          checked={filters.flag === flagOption}
                          onChange={(e) => setFilters({ ...filters, flag: e.target.value })}
                        />
                        <label htmlFor={`flag-${index}`}>{flagOption}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location Filter */}
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
                {showLocationDropdown && (
                  <div className="timeline-filter-dropdown-content">
                    {locations.map((loc, index) => (
                      <div key={index}>
                        <input
                          type="checkbox"
                          id={`location-${index}`}
                          value={loc}
                          checked={filters.location.includes(loc)}
                          onChange={() => handleLocationChange(loc)}
                        />
                        <label htmlFor={`location-${index}`}>{loc}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Filter */}
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

            {/* Time Range Filter */}
            <div className="filter-container">
              <label htmlFor="startTime">Start Time:</label>
              <input
                type="time"
                id="startTime"
                value={filters.startTime}
                onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
              />
              <label htmlFor="endTime">End Time:</label>
              <input
                type="time"
                id="endTime"
                value={filters.endTime}
                onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
              />
            </div>
            <button className="save-btn1" onClick={handleFilter}>Apply Filter</button>
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
            <button className="save-btn1" onClick={handleSort}>Apply Sort</button>
          </div>
        </div>
      </div>
    </div>
  );
};
