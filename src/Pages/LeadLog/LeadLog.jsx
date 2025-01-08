import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './LeadLog.css';

export const LeadLog = () => {
  const location = useLocation();
  const newLead = location.state || null; // Retrieve new lead data passed from CreateLead
  // const { leadNumber, leadSummary, assignedDate, assignedOfficer } = location.state || {};

  const defaultEntries = [
    {
      leadNumber: "1",
      leadSummary: "Investigate missing person case on 5th Avenue.",
      assignedDate: "12/15/24",
      status: "Pending",
      dateReturned: "",
    },
    {
      leadNumber: "2",
      leadSummary: "Check surveillance footage for recent robbery.",
      assignedDate: "12/10/24",
      status: "Completed",
      dateReturned: "12/18/24",
    },
    {
      leadNumber: "5",
      leadSummary: "Interview witnesses for car accident on Main Street.",
      assignedDate: "12/12/24",
      status: "Pending",
      dateReturned: "",
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
    if (sortOption === "date") {
      return new Date(a.assignedDate) - new Date(b.assignedDate);
    }
    if (sortOption === "status") {
      return a.status.localeCompare(b.status);
    }
    if (sortOption === "assigned to") {
      // Assuming we implement "assignedTo" later
      return (a.assignedTo || "").localeCompare(b.assignedTo || "");
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
        <div className="sort-by">
          <label>Sort By: </label>
          <select className="dropdown" value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}>
            <option value="date">Date</option>
            <option value="status">Status</option>
            <option value="assigned to">Assigned</option>
          </select>
        </div>
        <div className="status-filter">
          <label>
            <input type="radio" name="status" value="all" checked={filterStatus === "all"}
              onChange={() => setFilterStatus("all")}/>
            All
          </label>
          <label>
            <input type="radio" name="status" value="completed" checked={filterStatus === "completed"}
              onChange={() => setFilterStatus("completed")} />
            Completed
          </label>
          <label>
            <input type="radio" name="status" value="pending"  checked={filterStatus === "pending"}
              onChange={() => setFilterStatus("pending")} />
            Pending
          </label>
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
                  <td>{entry.leadSummary}</td>
                  <td>{entry.assignedDate}</td>
                  <td>{entry.status || 'Pending'}</td>
                  <td>{ ''}</td>
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

      {/* <div className="report-section">
        <label>Select Report Type: </label>
        <select className="dropdown">
          <option value="summary">Summary</option>
          <option value="detailed">Detailed</option>
        </select>
      </div> */}

      <div className="action-buttons">
        <button className="download-pdf-btn1">Download PDF</button>
        <button className="print-pdf-btn1">Print PDF</button>
      </div>
    </div>
  );
};
