import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './LeadLog.css';

export const LeadLog = () => {
  const location = useLocation();
  const newLead = location.state?.newLead || null; // Retrieve new lead data passed from CreateLead
  const { updateLeadLogCount } = location.state || {}; // Callback function to update lead count in the sidebar
  const [leadLogData, setLeadLogData] = useState([]);

  const navigate = useNavigate(); // Initialize the navigate function

  const handleBackClick = () => {
    navigate("/casepagemanager"); // Navigate to the Case Page Manager
  };

  const handleLeadClick = (lead) => {
    navigate("#", { state: { lead } }); // Navigate to lead details page with lead data
  };

  const defaultEntries = [
    {
      leadNumber: "1",
      leadSummary: "Investigate missing person case on 5th Avenue",
      assignedDate: "12/15/24",
      status: "Pending",
      assignedOfficer: ["Officer 1", "Officer 5"], // Assigned officers
      dateReturned: "",
    },
    {
      leadNumber: "2",
      leadSummary: "Check surveillance footage for recent robbery",
      assignedDate: "12/10/24",
      status: "Completed",
      assignedOfficer: ["Officer 2"], // Assigned officers
      dateReturned: "12/18/24",
    },
    {
      leadNumber: "3",
      leadSummary: "Interview witnesses for car accident on Main Street",
      assignedDate: "12/12/24",
      status: "Pending",
      assignedOfficer: ["Officer 4", "Officer 8"], // Assigned officers
      dateReturned: "",
    },
  ];

  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [filterCategory, setFilterCategory] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [filteredEntries, setFilteredEntries] = useState(defaultEntries);

  useEffect(() => {
    if (newLead && newLead.leadNumber) {
      setLeadEntries((prevEntries) => [...prevEntries, newLead]);
    }
  }, [newLead]);

  const handleApplyFilter = () => {
    let filtered = leadEntries;

    if (filterCategory === "status" && filterValue) {
      filtered = filtered.filter((entry) => entry.status === filterValue);
    } else if (filterCategory === "assignedOfficer" && filterValue) {
      filtered = filtered.filter((entry) => entry.assignedOfficer.includes(filterValue));
    } else if (filterCategory === "leadNumber" && filterValue) {
      filtered = filtered.filter((entry) => entry.leadNumber === filterValue);
    } else if (filterCategory === "assignedDate" && dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(
        (entry) =>
          new Date(entry.assignedDate) >= new Date(dateRange.startDate) &&
          new Date(entry.assignedDate) <= new Date(dateRange.endDate)
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
      return (new Date(a.assignedDate) - new Date(b.assignedDate)) * compareValue;
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

  return (
    <div className="lead-log-page">
      <Navbar />

      <div className="main-content">
        <div className="left-section">
          <img
            src="/Materials/newpolicelogo.png"
            alt="Police Department Logo"
            className="police-logo"
          />
        </div>

        <div className="center-section">
          <h2 className="title">LEAD LOG</h2>
        </div>
      </div>

      <div className="filters-section">
        <table className="filter-table">
          <thead>
            <tr>
              <th>Filter By:</th>
              <th>Filter Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <select
                  className="dropdown"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  <option value="status">Status</option>
                  <option value="assignedOfficer">Assigned Officer</option>
                  <option value="leadNumber">Lead Number</option>
                  <option value="assignedDate">Assigned Date</option>
                </select>
              </td>
              <td>
              {filterCategory === "status" ? (
                  <select
                    className="dropdown"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : filterCategory === "assignedOfficer" ? (
                  <select
                    className="dropdown"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    <option value="">Select Officer</option>
                    <option value="Officer 1">Officer 1</option>
                    <option value="Officer 2">Officer 2</option>
                    <option value="Officer 4">Officer 4</option>
                    <option value="Officer 5">Officer 5</option>
                    <option value="Officer 8">Officer 8</option>
                  </select>
                ) : filterCategory === "assignedDate" ? (
                  <div>
                    <input
                      type="date"
                      className="input-field"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      className="input-field"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      placeholder="End Date"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    className="input-field"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Enter Value"
                  />
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="filter-buttons">
          <button className="apply-filter-btn" onClick={handleApplyFilter}>
            Apply
          </button>
          <button className="reset-filter-btn" onClick={resetFilters}>
            Reset
          </button>
        </div>
        <div className="sort-by">
      <label>Sort By: </label>
      <select
        className="dropdown"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
      >
        <option value="date">Date</option>
        <option value="status">Status</option>
        <option value="assigned to">Assigned</option>
        <option value="lead number">Lead Number</option>
      </select>

      {/* Sort order (asc/desc) selection */}
      <label>Order: </label>
      <select
        className="dropdown"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
      <div className="sort-buttons">
        {/* <button className="apply-sort-btn" onClick={handleApplySort}>
          Apply
        </button> */}
        <button className="reset-sort-btn" onClick={handleResetSort}>
          Reset
        </button>
      </div>
    </div>
      </div>

      <div className="table-section">
        <table className="leadlog-table">
          <thead>
            <tr>
              <th>LEAD #</th>
              <th>LEAD SUMMARY</th>
              <th>DATE SUBMITTED</th>
              <th>STATUS</th>
              <th>ASSIGNED TO</th>
              <th>DATE RETURNED</th>
            </tr>
          </thead>
          <tbody>
          {sortedEntries.length > 0 ? (
              sortedEntries.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.leadNumber}</td>
                  <td className="timeline-lead-horizontal"
                    onClick={() => handleLeadClick(entry)}
                  >
                    {entry.leadSummary}
                 </td>
                  <td>{entry.assignedDate}</td>
                  <td>{entry.status || 'Pending'}</td>
                  <td>{(entry.assignedOfficer || []).join(", ")}</td> {/* Assigned Officers */}
                  <td>{entry.dateReturned || ''}</td>
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
      </div>

      <div className="report-section">
        <label>Select Report Type: </label>
        <select className="dropdown">
          <option value="summary">Summary</option>
          <option value="detailed">Detailed</option>
        </select>
      </div>

      <div className="action-buttons">
      <button className="download-pdf-btn1" onClick={handleBackClick}>Back</button>
        <button className="download-pdf-btn1">Download PDF</button>
        <button className="print-pdf-btn1">Print PDF</button>
      </div>
    </div>
  );
};
