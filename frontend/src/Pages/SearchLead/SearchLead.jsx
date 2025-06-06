import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar/Navbar";
import "./SearchLead.css";
import Pagination from "../../components/Pagination/Pagination";
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";
import api from "../../api"; // adjust the path as needed
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";
import {SideBar } from "../../components/Sidebar/Sidebar";



const sampleLeads = [
  // {
  //   id: "Lead45",
  //   name: "Collect Audio Records from Dispatcher",
  //   dueDate: "12/25/2024",
  //   priority: "High",
  //   remainingDays: 0,
  //   flags: "Important",
  //   assignedOfficers: "Officer 1, Officer 3",
  // },
  // {
  //   id: "Lead20",
  //   name: "Interview Mr. John",
  //   dueDate: "12/31/2024",
  //   priority: "Medium",
  //   remainingDays: 0,
  //   flags: "None",
  //   assignedOfficers: "Officer 2",
  // },
  // {
  //   id: "Lead84",
  //   name: "Collect Evidence from 63 Mudray Street",
  //   dueDate: "12/29/2024",
  //   priority: "Low",
  //   remainingDays: 0,
  //   flags: "None",
  //   assignedOfficers: "Officer 4",
  // },
];

export const SearchLead = () => {
  const navigate = useNavigate();

  // Initial static rows (3 rows)
  const initialStaticRows = Array(1).fill({
    junction: "And",
    field: "",
    evaluator: "",
    value: "",
  });

  const [staticRows, setStaticRows] = useState(initialStaticRows);
  const [dynamicRows, setDynamicRows] = useState([]); // Dynamic rows managed separately
  const [matchingLeads, setMatchingLeads] = useState([]);
   const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
      const [pageSize, setPageSize] = useState(50);
      const totalPages = 10; // Change based on your data
      const totalEntries = 100;

        const { selectedCase, setSelectedLead } = useContext(CaseContext);

        const [leads, setLeads] = useState({
          assignedLeads: [],
          pendingLeads: [],
          pendingLeadReturns: [],
          allLeads: [],
        } );
        
        const [showSelectModal, setShowSelectModal] = useState(false);
        const [pendingRoute, setPendingRoute]   = useState(null);
      

  // Sample lead data for matching
 const [leadsData, setLeadsData] = useState([]);

 console.log(selectedCase);

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


  // Function to filter fetched leads using advanced search criteria
  const applyAdvancedFilters = (leads) => {
    // Combine static and dynamic rows; filter out any rows with an empty field or value
    const combinedRows = [...staticRows, ...dynamicRows].filter(
      (row) => row.field && row.value.trim() !== ""
    );
    // If no filter criteria is provided, return the full lead list.
    if (combinedRows.length === 0) return leads;

    // Filter leads by checking each row's criterion against each lead.
    return leads.filter((lead) => {
      // Initially assume the lead satisfies every filter
      let satisfiesAll = true;

      // Iterate over each filter row. Here we assume that all conditions must be met (logical AND)
      combinedRows.forEach((row) => {
        const filterValue = row.value.toLowerCase().trim();
        let leadValue = "";

        // Map the filter field to the corresponding lead property.
        switch (row.field) {
          case "Lead Number":
            leadValue = lead.leadNo ? lead.leadNo.toLowerCase() : "";
            break;
          case "Priority":
            leadValue = lead.priority ? lead.priority.toLowerCase() : "";
            break;
          case "Due Date":
            // Use the same display format as formatDate (or compare ISO strings if preferred)
            leadValue = lead.dueDate ? formatDate(lead.dueDate).toLowerCase() : "";
            break;
          case "Flag":
            // Assuming 'associatedFlags' holds flag information as a string
            leadValue = lead.associatedFlags ? lead.associatedFlags.toLowerCase() : "";
            break;
          case "Keyword":
          case "Lead Name":
            // Compare the description if using keyword or name
            leadValue = lead.description ? lead.description.toLowerCase() : "";
            break;
          case "Assigned To":
            // Join assigned officers into a single string for comparison
            leadValue = lead.assignedTo ? lead.assignedTo.join(" ").toLowerCase() : "";
            break;
          // Add additional cases as needed
          default:
            leadValue = "";
        }

        // Check the criterion using the evaluator ("equals" or "contains")
        if (row.evaluator === "equals") {
          if (leadValue !== filterValue) {
            satisfiesAll = false;
          }
        } else if (row.evaluator === "contains") {
          if (!leadValue.includes(filterValue)) {
            satisfiesAll = false;
          }
        }
      });

      return satisfiesAll;
    });
  };


// Updated handleSearch: first fetch from API, then apply advanced filters
const handleSearch = async () => {
  try {
    const token = localStorage.getItem("token");

    // Combine advanced rows from static and dynamic arrays
    const advancedRows = [
      ...staticRows,
      ...dynamicRows,
    ].filter((row) => row.field && row.value.trim() !== "");

    let fieldParam = "";
    let keywordParam = "";

    if (advancedRows.length > 0) {
      // For simplicity, use the first advanced row for backend filtering.
      fieldParam = advancedRows[0].field;
      keywordParam = advancedRows[0].value;
    } else {
      keywordParam = searchTerm.trim() ? searchTerm : "";
    }

    const response = await api.get("/api/lead/search", {
      params: {
        caseNo: selectedCase.caseNo,
        caseName: selectedCase.caseName,
        keyword: keywordParam,
        field: fieldParam,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Fetched leads:", response.data);
    setLeadsData(response.data);
  } catch (error) {
    console.error("Error fetching search results:", error);
  }
};


  // Handles input changes for static or dynamic rows
  const handleInputChange = (index, field, value, isDynamic = false) => {
    if (isDynamic) {
      const updatedRows = [...dynamicRows];
      updatedRows[index][field] = value;
      setDynamicRows(updatedRows);
    } else {
      const updatedRows = [...staticRows];
      updatedRows[index][field] = value;
      setStaticRows(updatedRows);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  // Clears static row content (does not remove it)
  const handleClearStaticRow = (index) => {
    const updatedRows = [...staticRows];
    updatedRows[index] = { junction: "And", field: "", evaluator: "", value: "" };
    setStaticRows(updatedRows);
  };

  // Removes dynamic rows entirely
  const handleRemoveDynamicRow = (index) => {
    const updatedRows = dynamicRows.filter((_, i) => i !== index);
    setDynamicRows(updatedRows);
  };

  // Adds a new dynamic row
  const handleAddRow = () => {
    setDynamicRows([
      ...dynamicRows,
      { junction: "And", field: "", evaluator: "", value: "" },
    ]);
  };

  // Search function to filter matching leads
  // const handleSearch = () => {
  //   const combinedRows = [...staticRows, ...dynamicRows];

  //   const filteredLeads = sampleLeads.filter((lead) => {
  //     return combinedRows.some((row) => {
  //       const value = row.value.toLowerCase();
  //       switch (row.field) {
  //         case "Lead Number":
  //           return lead.id.toLowerCase().includes(value);
  //         case "Keyword":
  //         case "Lead Name":
  //           return lead.name.toLowerCase().includes(value);
  //         case "Assigned To":
  //           return lead.assignedOfficers.toLowerCase().includes(value);
  //         default:
  //           return false;
  //       }
  //     });
  //   });

  //   setMatchingLeads(filteredLeads);
  // };

      const location = useLocation();
      const { caseDetails } = location.state || {};

        const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
        const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
        const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
      
        const onShowCaseSelector = (route) => {
          navigate(route, { state: { caseDetails } });
      };

      const handleLeadClick = (lead) => {
        setSelectedLead({
            leadNo: lead.leadNo,
            incidentNo: lead.incidentNo,
            leadName: lead.description,
            dueDate: lead.dueDate || "N/A",
            priority: lead.priority || "Medium",
            flags: lead.flags || [],
            assignedOfficers: lead.assignedOfficers || [],
            leadStatus: lead.leadStatus,
            caseName: lead.caseName,
            caseNo: lead.caseNo
        });
      
        // Navigate to Lead Review Page
        navigate("/leadReview", { state: { leadDetails: lead, caseDetails: selectedCase } });
      };
        

  return (
    <div className="searchlead-container">
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
            <li className="sidebar-item active"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" 
             onClick={() => {
              selectedCase.role === "Investigator"
              ? setPendingRoute("/LRInstruction")
              : setPendingRoute("/CMInstruction")
        
              setShowSelectModal(true);
            }}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
           
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
     
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
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

                <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"}</h5>

          {/* <h5 className = "side-title"> 
          {selectedLead?.leadNo ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName}` : "LEAD DETAILS"}

          </h5> */}
          </div>
{/* 
<div className="case-header">
  <h2 className="">SEARCH LEAD</h2>
</div> */}

   <div className="top-menu">
        <div className="menu-items">
           <span className="menu-item " onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )}>
            Leads Desk
          </span>
        <span className="menu-item " onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )}>
            Generate Report
          </span>
          {/* <span className="menu-item" onClick={() => navigate("/CaseScratchpad", { state: { caseDetails } } )}>
            Add/View Case Notes
          </span> */}
          <span className="menu-item active" onClick={() => navigate('/SearchLead', { state: { caseDetails } } )} >
            Search Leads
          </span>
          <span className="menu-item" onClick={() => navigate("/ViewTimeline", { state: { caseDetails } } )}>
          View Timelines
          </span>
          {/* <span className="menu-item" onClick={() => navigate("/FlaggedLead", { state: { caseDetails } } )}>
          View Flagged Leads
          </span> */}
         </div>
       </div>

      <div className="main-content-searchlead">


     
            <div className="search-page-bar">
              <div className="search-bar-page">
                <div className="search-container1">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input type="text" className="search-input1" placeholder="Search Lead" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      console.log("Enter pressed, calling handleSearch");
                      handleSearch();
                    }
                  }} />
                </div>
              </div>
              </div>

                {/* Advanced Search Toggle Button */}
            <div className="advanced-search-toggle">
              <button
                className="save-btn1"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                {showAdvancedSearch ? "Advanced Search" : "Advanced Search"}
              </button>
            </div>
          

       {/* Conditionally Render Advanced Search Section */}
       {showAdvancedSearch && (
              <>
        <table className="search-table">
          <thead>
            <tr>
              <th>Junction</th>
              <th>Field</th>
              <th>Evaluator</th>
              <th>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* Render Static Rows */}
            {staticRows.map((row, index) => (
              <tr key={`static-${index}`}>
                <td>
                  <select
                    value={row.junction}
                    onChange={(e) =>
                      handleInputChange(index, "junction", e.target.value)
                    }
                  >
                    <option value="And">And</option>
                    <option value="Or">Or</option>
                  </select>
                </td>
                <td>
                  <select
                    value={row.field}
                    onChange={(e) =>
                      handleInputChange(index, "field", e.target.value)
                    }
                  >
                    <option value="">Select Field</option>
                    <option value="Keyword">Keyword</option>
                    <option value="Assigned To">Assigned To</option>
                    <option value="Lead Number">Lead Number</option>
                    <option value="Remaining Days">Remaining Days</option>
                    <option value="Priority">Priority</option>
                    <option value="Due Date">Due Date</option>
                    <option value="Flag">Flag</option>
                  </select>
                </td>
                <td>
                  <select
                    value={row.evaluator}
                    onChange={(e) =>
                      handleInputChange(index, "evaluator", e.target.value)
                    }
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) =>
                      handleInputChange(index, "value", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button
                    className="clear-btn"
                    onClick={() => handleClearStaticRow(index)}
                  >
                    Clear row
                  </button>
                </td>
              </tr>
            ))}

            {/* Render Dynamic Rows */}
            {dynamicRows.map((row, index) => (
              <tr key={`dynamic-${index}`}>
                <td>
                  <select
                    value={row.junction}
                    onChange={(e) =>
                      handleInputChange(index, "junction", e.target.value, true)
                    }
                  >
                    <option value="And">And</option>
                    <option value="Or">Or</option>
                  </select>
                </td>
                <td>
                  <select
                    value={row.field}
                    onChange={(e) =>
                      handleInputChange(index, "field", e.target.value, true)
                    }
                  >
                    <option value="">Select Field</option>
                    <option value="Keyword">Keyword</option>
                    <option value="Assigned To">Assigned To</option>
                    <option value="Lead Number">Lead Number</option>
                    <option value="Remaining Days">Remaining Days</option>
                    <option value="Priority">Priority</option>
                    <option value="Due Date">Due Date</option>
                    <option value="Flag">Flag</option>
                  </select>
                </td>
                <td>
                  <select
                    value={row.evaluator}
                    onChange={(e) =>
                      handleInputChange(index, "evaluator", e.target.value, true)
                    }
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) =>
                      handleInputChange(index, "value", e.target.value, true)
                    }
                  />
                </td>
                <td>
                  <button
                    className="clear-btn"
                    onClick={() => handleRemoveDynamicRow(index)}
                  >
                    Remove row
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Button Section */}
        <div className="searchlead-btns-container">
          <button className="add-row-btn" onClick={handleAddRow}>
            + Add Row
          </button>
          <button className="add-row-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        </>
       )}

        <div className="results-section">
  <p className="results-title">Matching Leads</p>
  <div className="result-line"></div>
  <table className="results-table">
    <thead>
      <tr>
        <th style={{ width: "10%" }}>Lead No.</th>
        <th>Lead Name</th>
        <th style={{ width: "10%" }}>Due Date</th>
        <th style={{ width: "8%" }}>Priority</th>
        <th style={{ width: "10%" }}>Flags</th>
        <th style={{ width: "15%" }}>Assigned Officers</th>
        <th style={{ width: "12%" }}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {leadsData.length > 0 ? (
        leadsData.map((lead, index) => (
          <tr key={index}>
            <td>{lead.leadNo}</td>
            <td>{lead.description}</td>
            <td>{formatDate(lead.dueDate) || "NA"}</td>
            <td>{lead.priority || "NA"}</td>
            <td>{lead.associatedFlags || "NA"}</td>
            <td style={{ width: "14%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
              {/* {lead.assignedOfficers.join(", ")} */}
              {lead.assignedTo.map((officer, index) => (
                <span key={index} style={{ display: "block", marginBottom: "4px", padding: "8px 0px 0px 8px" }}>{officer}</span>
              ))}
              </td>
            <td>
              <button className="save-btn1" 
              //  onClick={() => navigate("/leadReview", { state: { caseDetails, leadId: lead.id, leadDescription: lead.description} } )}>
              onClick={() => handleLeadClick(lead)}>
              {/* onClick={() => navigate(`/lead/${lead.id}`)} */}
              View</button>
            </td>
          </tr>
        ))
      ) : (
        // Render empty rows if no data is available
        Array.from({ length: 1 }).map((_, index) => (
          <tr key={`empty-${index}`}>
            <td colSpan="7" style={{ textAlign: 'center', color: '#aaa' }}>
              No matching leads available
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
  <Pagination
  currentPage={currentPage}
  totalEntries={totalEntries}  // Automatically calculate total entries
  onPageChange={setCurrentPage} // Update current page state
  pageSize={pageSize}
  onPageSizeChange={setPageSize} // Update page size state
/>
</div>
      </div>
    </div>
    </div>
    </div>
  );
};
