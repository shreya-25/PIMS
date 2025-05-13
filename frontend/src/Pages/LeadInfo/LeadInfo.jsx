// src/pages/LeadInfo/LeadInfo.jsx
import React, { useState, useMemo } from "react";
import "./LeadInfo.css";
import Navbar from '../../components/Navbar/Navbar';

export const LeadInfo = () => {


  const dummyLeads = [
    { id: 101, description: "Collect Audio Records", dueDate: "2025-06-01", priority: "High" },
    { id: 102, description: "Interview Witness",   dueDate: "2025-06-03", priority: "Medium" },
    { id: 103, description: "Process Evidence",    dueDate: "2025-06-05", priority: "Low" },
     { id: 98, description: "Appl",    dueDate: "2025-06-05", priority: "Low" },
  ];

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const colKey = {
    "Lead No.":     "id",
    "Description":  "description",
    "Due Date":     "dueDate",
    "Priority":     "priority",
  };
  const PRIORITY_ORDER = { Low: 1, Medium: 2, High: 3 };

  
  // Memoize the sorted data
  const sortedLeads = useMemo(() => {
    if (!sortConfig.key) return dummyLeads;
    const sorted = [...dummyLeads].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      // for dates, compare as strings in ISO format, works naturally
      if (typeof aVal === 'string' && sortConfig.key === 'priority') {
        // you can also use a priority map if you want custom order
        aVal = PRIORITY_ORDER[aVal] || 0;
      bVal = PRIORITY_ORDER[bVal] || 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [dummyLeads, sortConfig]);

    // Toggle sort direction / set new key
  const handleSort = col => {
    const key = colKey[col];
    setSortConfig(prev => {
      if (prev.key === key) {
        // same column: flip direction
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        // new column: default to ascending
        return { key, direction: 'asc' };
      }
    });
  };

  return (
    <div className="leads-container1">
      <Navbar />

   <div className="checktable">
      <table className="leads-table">
        <thead>
          <tr>
            {["Lead No.", "Description", "Due Date", "Priority"].map(col => (
              <th key={col} className="column-header1">
                {col}
                <span className="column-controls1">
                  <button
                    className="icon-button"
               
                    aria-label={`Filter ${col}`}
                  >
                    <img src={`${process.env.PUBLIC_URL}/Materials/filter.png`} alt="Filter" />
                  </button>
                 <button
                      className="icon-button"
                      onClick={() => handleSort(col)}
                      aria-label={`Sort ${col}`}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      {/* You could swap icons based on direction & active column */}
                      {sortConfig.key === colKey[col]
                        ? sortConfig.direction === 'asc' 
                          ? '🔼'
                          : '🔽'
                        : '↕️'}
                    </button>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedLeads.map(lead => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td>{lead.dueDate}</td>
              <td>{lead.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};
