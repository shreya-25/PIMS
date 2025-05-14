// // src/pages/LeadInfo/LeadInfo.jsx
// import React, { useState, useMemo } from "react";
// import "./LeadInfo.css";
// import Navbar from '../../components/Navbar/Navbar';

// export const LeadInfo = () => {
//   const dummyLeads = [
//     { id: 101, description: "Collect Audio Records", dueDate: "2025-06-01", priority: "High" },
//     { id: 102, description: "Interview Witness",     dueDate: "2025-06-03", priority: "Medium" },
//     { id: 103, description: "Process Evidence",      dueDate: "2025-06-05", priority: "Low" },
//     { id:  98, description: "Appl",                  dueDate: "2025-06-05", priority: "Low" },
//   ];

//   // 1) State for sorting
//   const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
//   // 2) State for filtering
//   const [filterConfig, setFilterConfig] = useState({
//     id: "",
//     description: "",
//     dueDate: "",
//     priority: ""
//   });

//   // map column header text → object key
//   const colKey = {
//     "Lead No.":     "id",
//     "Description":  "description",
//     "Due Date":     "dueDate",
//     "Priority":     "priority",
//   };

//   // numerical order for priorities
//   const PRIORITY_ORDER = { Low: 1, Medium: 2, High: 3 };

//   // 3) Combined filter + sort
//   const sortedLeads = useMemo(() => {
//     // first: apply all filters
//     const filtered = dummyLeads.filter(lead => {
//       return Object.entries(filterConfig).every(([field, substr]) => {
//         if (!substr) return true;
//         return String(lead[field])
//           .toLowerCase()
//           .includes(substr.toLowerCase());
//       });
//     });

//     // then: if no sort key chosen, return filtered
//     if (!sortConfig.key) return filtered;

//     // otherwise sort
//     return [...filtered].sort((a, b) => {
//       let aVal = a[sortConfig.key];
//       let bVal = b[sortConfig.key];

//       // special-case priority mapping
//       if (sortConfig.key === 'priority') {
//         aVal = PRIORITY_ORDER[aVal] || 0;
//         bVal = PRIORITY_ORDER[bVal] || 0;
//       }

//       if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
//       if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
//       return 0;
//     });
//   }, [dummyLeads, sortConfig, filterConfig]);

//   // 4) Handlers
//   const handleSort = col => {
//     const key = colKey[col];
//     setSortConfig(prev => ({
//       key,
//       direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
//     }));
//   };

//   const handleFilter = col => {
//     const key = colKey[col];
//     const current = filterConfig[key];
//     const value = prompt(`Filter by ${col}:`, current);
//     if (value !== null) {
//       setFilterConfig(cfg => ({ ...cfg, [key]: value }));
//     }
//   };

//   return (
//     <div className="leads-container1">
//       <Navbar />

//       <div className="checktable">
//         <table className="leads-table">
//           <thead>
//             <tr>
//               {["Lead No.", "Description", "Due Date", "Priority"].map(col => (
//                 <th key={col} className="column-header1">
//                   {col}
//                   <span className="column-controls1">
//                     <button
//                       className="icon-button"
//                       onClick={() => handleFilter(col)}
//                       aria-label={`Filter ${col}`}
//                     >
//                       🔍
//                     </button>
//                     <button
//                       className="icon-button"
//                       onClick={() => handleSort(col)}
//                       aria-label={`Sort ${col}`}
//                       style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
//                     >
//                       {sortConfig.key === colKey[col]
//                         ? (sortConfig.direction === 'asc' ? '🔼' : '🔽')
//                         : '↕️'}
//                     </button>
//                   </span>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {sortedLeads.map(lead => (
//               <tr key={lead.id}>
//                 <td>{lead.id}</td>
//                 <td>{lead.description}</td>
//                 <td>{lead.dueDate}</td>
//                 <td>{lead.priority}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };


// src/pages/LeadInfo/LeadInfo.jsx
// import React, { useState, useMemo, useRef, useEffect } from "react";
// import "./LeadInfo.css";
// import Navbar from '../../components/Navbar/Navbar';

// export const LeadInfo = () => {
//   const dummyLeads = [
//     { id: 101, description: "Collect Audio Records", dueDate: "2025-06-01", priority: "High" },
//     { id: 102, description: "Interview Witness",     dueDate: "2025-06-03", priority: "Medium" },
//     { id: 103, description: "Process Evidence",      dueDate: "2025-06-05", priority: "Low" },
//     { id:  98, description: "Appl",                  dueDate: "2025-06-05", priority: "Low" },
//   ];

//   // 1) State for sorting
//   const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
//   // 2) State for filtering text per column
//   const [filterConfig, setFilterConfig] = useState({
//     id: "",
//     description: "",
//     dueDate: "",
//     priority: ""
//   });
//   // 3) Which column’s filter popup is open?
//   const [openFilter, setOpenFilter] = useState(null);

//   // map column header text → object key
//   const colKey = {
//     "Lead No.":     "id",
//     "Description":  "description",
//     "Due Date":     "dueDate",
//     "Priority":     "priority",
//   };

//   // numerical order for priorities
//   const PRIORITY_ORDER = { Low: 1, Medium: 2, High: 3 };

//   // Combined filter + sort
//   const sortedLeads = useMemo(() => {
//     // apply filters
//     const filtered = dummyLeads.filter(lead =>
//       Object.entries(filterConfig).every(([field, substr]) => {
//         if (!substr) return true;
//         return String(lead[field]).toLowerCase().includes(substr.toLowerCase());
//       })
//     );
//     // apply sort
//     if (!sortConfig.key) return filtered;
//     return [...filtered].sort((a,b) => {
//       let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
//       if (sortConfig.key === 'priority') {
//         aVal = PRIORITY_ORDER[aVal]||0;
//         bVal = PRIORITY_ORDER[bVal]||0;
//       }
//       if (aVal < bVal) return sortConfig.direction==='asc' ? -1 : 1;
//       if (aVal > bVal) return sortConfig.direction==='asc' ? 1 : -1;
//       return 0;
//     });
//   }, [dummyLeads, sortConfig, filterConfig]);

//   // sort handler
//   const handleSort = col => {
//     const key = colKey[col];
//     setSortConfig(prev => ({
//       key,
//       direction: prev.key===key && prev.direction==='asc' ? 'desc' : 'asc'
//     }));
//   };

//   // toggle filter popup
//   const handleFilterClick = col => {
//     setOpenFilter(prev => prev===col ? null : col);
//   };

//   // local ref to position popup
//   const popupRefs = useRef({});

//   // close popup on outside click
//   useEffect(() => {
//     const onClick = e => {
//       if (!Object.values(popupRefs.current).some(r => r?.contains(e.target))) {
//         setOpenFilter(null);
//       }
//     };
//     document.addEventListener('mousedown', onClick);
//     return () => document.removeEventListener('mousedown', onClick);
//   }, []);

//   return (
//     <div className="leads-container1">
//       <Navbar />

//       <div className="checktable">
//         <table className="leads-table">
//           <thead>
//             <tr>
//               {["Lead No.", "Description", "Due Date", "Priority"].map(col => {
//                 const key = colKey[col];
//                 return (
//                   <th key={col} className="column-header1">
//                     {col}
//                     <span
//                       className="column-controls1"
//                       ref={el => popupRefs.current[col] = el}
//                       style={{ position: 'relative' }}
//                     >
//                       <button
//                         className="icon-button"
//                         onClick={() => handleFilterClick(col)}
//                         aria-label={`Filter ${col}`}
//                       >
//                         🔍
//                       </button>
//                       {openFilter===col && (
//                         <div className="filter-popup">
//                           <input
//                             type="text"
//                             placeholder={`Filter ${col}`}
//                             value={filterConfig[key]}
//                             onChange={e => setFilterConfig(cfg => ({
//                               ...cfg,
//                               [key]: e.target.value
//                             }))}
//                           />
//                           <div className="filter-popup-buttons">
//                             <button onClick={() => setOpenFilter(null)}>Apply</button>
//                             <button onClick={() => {
//                               setFilterConfig(cfg => ({ ...cfg, [key]: "" }));
//                               setOpenFilter(null);
//                             }}>Clear</button>
//                           </div>
//                         </div>
//                       )}
//                       <button
//                         className="icon-button"
//                         onClick={() => handleSort(col)}
//                         aria-label={`Sort ${col}`}
//                         style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
//                       >
//                         {sortConfig.key === key
//                           ? (sortConfig.direction==='asc' ? '🔼' : '🔽')
//                           : '↕️'}
//                       </button>
//                     </span>
//                   </th>
//                 );
//               })}
//             </tr>
//           </thead>
//           <tbody>
//             {sortedLeads.map(lead => (
//               <tr key={lead.id}>
//                 <td>{lead.id}</td>
//                 <td>{lead.description}</td>
//                 <td>{lead.dueDate}</td>
//                 <td>{lead.priority}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// src/pages/LeadInfo/LeadInfo.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import "./LeadInfo.css";
import Navbar from '../../components/Navbar/Navbar';

export const LeadInfo = () => {
  const dummyLeads = [
    { id: 101, description: "Collect Audio Records", dueDate: "2025-06-01", priority: "High" },
    { id: 102, description: "Interview Witness",     dueDate: "2025-06-03", priority: "Medium" },
    { id: 103, description: "Process Evidence",      dueDate: "2025-06-05", priority: "Low" },
    { id:  98, description: "Appl",                  dueDate: "2025-06-05", priority: "Low" },
  ];

  // sort + filter state, plus which filter popup is open
  const [sortConfig,   setSortConfig]   = useState({ key: null, direction: 'asc' });
  const [filterConfig,setFilterConfig] = useState({ id: "", description: "", dueDate: "", priority: "" });
  const [openFilter,  setOpenFilter]   = useState(null);

  // map column header → object key
  const colKey = {
    "Lead No.":    "id",
    "Description": "description",
    "Due Date":    "dueDate",
    "Priority":    "priority",
  };

  // 1) Precompute distinct values for each field
  const distinctValues = useMemo(() => {
    const map = { id: new Set(), description: new Set(), dueDate: new Set(), priority: new Set() };
    dummyLeads.forEach(lead => {
      Object.entries(map).forEach(([field, set]) => {
        set.add(String(lead[field]));
      });
    });
    return Object.fromEntries(
      Object.entries(map).map(([k, set]) => [k, Array.from(set)])
    );
  }, [dummyLeads]);

  // 2) Filter + sort
  const sortedLeads = useMemo(() => {
    // apply filters
    const filtered = dummyLeads.filter(lead =>
      Object.entries(filterConfig).every(([field, val]) => {
        return !val || String(lead[field]) === val;
      })
    );
    // apply sort
    if (!sortConfig.key) return filtered;
    const PRIORITY_ORDER = { Low:1, Medium:2, High:3 };
    return [...filtered].sort((a,b) => {
      let aV = a[sortConfig.key], bV = b[sortConfig.key];
      if (sortConfig.key==="priority") {
        aV = PRIORITY_ORDER[aV]||0; bV = PRIORITY_ORDER[bV]||0;
      }
      if (aV < bV) return sortConfig.direction==='asc' ? -1 : 1;
      if (aV > bV) return sortConfig.direction==='asc' ?  1 : -1;
      return 0;
    });
  }, [dummyLeads, sortConfig, filterConfig]);

  // 3) Handlers
  const handleSort = col => {
    const key = colKey[col];
    setSortConfig(prev => ({
      key,
      direction: prev.key===key && prev.direction==='asc' ? 'desc' : 'asc'
    }));
  };
  const handleFilterClick = col => {
    setOpenFilter(prev => prev===col ? null : col);
  };

  // close popups when clicking outside
  const popupRefs = useRef({});
  useEffect(() => {
    const onClick = e => {
      if (!Object.values(popupRefs.current).some(el => el?.contains(e.target))) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="leads-container1">
      <Navbar />
      <div className="checktable">
        <table className="leads-table">
          <thead>
            <tr>
              {["Lead No.","Description","Due Date","Priority"].map(col => {
                const key = colKey[col];
                return (
                  <th key={col} className="column-header1">
                    {col}
                    <span
                      className="column-controls1"
                      ref={el => popupRefs.current[col] = el}
                      style={{ position: 'relative' }}
                    >
                      {/* Filter dropdown toggle */}
                      <button onClick={() => handleFilterClick(col)}>🔍</button>
                      {openFilter===col && (
                        <div className="filter-popup">
                          <select
                            value={filterConfig[key]}
                            onChange={e =>
                              setFilterConfig(cfg => ({
                                ...cfg,
                                [key]: e.target.value
                              }))
                            }
                          >
                            <option value="">All</option>
                            {distinctValues[key].map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                          <div className="filter-popup-buttons">
                            <button onClick={() => setOpenFilter(null)}>Apply</button>
                            <button onClick={() => {
                              setFilterConfig(cfg => ({ ...cfg, [key]: "" }));
                              setOpenFilter(null);
                            }}>Clear</button>
                          </div>
                        </div>
                      )}
                      {/* Sort toggle */}
                      <button onClick={() => handleSort(col)} style={{ marginLeft: 4 }}>
                        {sortConfig.key===key
                          ? (sortConfig.direction==='asc' ? '🔼':'🔽')
                          : '↕️'}
                      </button>
                    </span>
                  </th>
                );
              })}
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
