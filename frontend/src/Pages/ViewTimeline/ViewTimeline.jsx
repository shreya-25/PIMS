import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./ViewTimeline.css";

export const ViewTimeline = () => {
  const navigate = useNavigate();

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
  const [filteredEntries, setFilteredEntries] = useState(originalEntries);
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]); // To hold selected locations

  
  const handleViewDetails = (leadNo) => {
    navigate(`/lead/${leadNo}`); // Navigate to the detailed view of the lead
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


  useEffect(() => {
    // Extract unique locations for the checkboxes
    const uniqueLocations = [
      ...new Set(originalEntries.map((entry) => entry.location)),
    ];
    setLocations(uniqueLocations);
  }, [originalEntries]);

  const handleLocationChange = (location) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((loc) => loc !== location) // Remove if already selected
        : [...prev, location] // Add if not selected
    );
  };

  const handleFilter = () => {
    let filtered = [...originalEntries];

    // Filter by flag
    if (filters.flag === "Flagged") {
      filtered = filtered.filter((entry) => entry.flag);
    } else if (filters.flag === "None") {
      filtered = filtered.filter((entry) => !entry.flag);
    } else if (filters.flag && filters.flag !== "All") {
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

  const handleSort = () => {
    const sorted = [...filteredEntries].sort((a, b) => {
      const dateA = new Date(a.date + "T" + a.timeRange.split(" - ")[0]);
      const dateB = new Date(b.date + "T" + b.timeRange.split(" - ")[0]);

      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    setFilteredEntries(sorted);
  };


  return (
    <div className="timeline-container">
      <Navbar />
      {/* <h2 className="title">CRIME INVESTIGATION TIMELINE</h2> */}
      
      <div className="main-content-ll">
        <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
            alt="Police Department Logo"
            className="police-logo-cl"
          />
        </div>


        <div className="center-sectionll">
          <h2 className="title1">CRIME INVESTIGATION TIMELINE</h2>
        </div>
      </div>

      <div className="timeline-section">
        <div className="timeline-horizontal">
          <div className="timeline-line"></div>
          {filteredEntries.map((entry, index) => (
            <div key={index} className="timeline-entry-horizontal">
              <div className="timeline-marker-horizontal"></div>
              <div className="timeline-content-horizontal">
                <div className="timeline-datetime">
                  <p className="timeline-date">{formatDate(entry.date)}</p>
                  <p className="timeline-time">{entry.timeRange}</p>
                </div>
                <h3
                  className="timeline-lead-horizontal"
                  onClick={() => handleViewDetails(entry.leadNo)}
                >
                  {entry.leadNo}
                </h3>
                <p className="timeline-location">{entry.location}</p>
                {entry.flag && (
                    <p className="timeline-flag">
                        <span className="red-flag">🚩</span> {entry.flag}
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
  );
};
