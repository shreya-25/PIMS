// src/pages/LeadInfo/LeadInfo.jsx
import React, { useState, useMemo } from "react";
import "./LeadInfo.css";
import Navbar from '../../components/Navbar/Navbar';

export const LeadInfo = () => {
  const dummyLeads = [
    { id: 101, description: "Collect Audio Records", dueDate: "2025-06-01", priority: "High" },
    { id: 102, description: "Interview Witness",     dueDate: "2025-06-03", priority: "Medium" },
    { id: 103, description: "Process Evidence",      dueDate: "2025-06-05", priority: "Low" },
    { id:  98, description: "Appl",                  dueDate: "2025-06-05", priority: "Low" },
  ];

  // 1) State for sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  // 2) State for filtering
  const [filterConfig, setFilterConfig] = useState({
    id: "",
    description: "",
    dueDate: "",
    priority: ""
  });

  // map column header text → object key
  const colKey = {
    "Lead No.":     "id",
    "Description":  "description",
    "Due Date":     "dueDate",
    "Priority":     "priority",
  };

  // numerical order for priorities
  const PRIORITY_ORDER = { Low: 1, Medium: 2, High: 3 };

  // 3) Combined filter + sort
  const sortedLeads = useMemo(() => {
    // first: apply all filters
    const filtered = dummyLeads.filter(lead => {
      return Object.entries(filterConfig).every(([field, substr]) => {
        if (!substr) return true;
        return String(lead[field])
          .toLowerCase()
          .includes(substr.toLowerCase());
      });
    });

    // then: if no sort key chosen, return filtered
    if (!sortConfig.key) return filtered;

    // otherwise sort
    return [...filtered].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // special-case priority mapping
      if (sortConfig.key === 'priority') {
        aVal = PRIORITY_ORDER[aVal] || 0;
        bVal = PRIORITY_ORDER[bVal] || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [dummyLeads, sortConfig, filterConfig]);

  // 4) Handlers
  const handleSort = col => {
    const key = colKey[col];
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilter = col => {
    const key = colKey[col];
    const current = filterConfig[key];
    const value = prompt(`Filter by ${col}:`, current);
    if (value !== null) {
      setFilterConfig(cfg => ({ ...cfg, [key]: value }));
    }
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
                      onClick={() => handleFilter(col)}
                      aria-label={`Filter ${col}`}
                    >
                      🔍
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => handleSort(col)}
                      aria-label={`Sort ${col}`}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      {sortConfig.key === colKey[col]
                        ? (sortConfig.direction === 'asc' ? '🔼' : '🔽')
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
