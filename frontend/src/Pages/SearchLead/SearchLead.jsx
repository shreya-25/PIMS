import React, { useContext, useState, useEffect, useRef, useMemo, } from "react";
import Navbar from "../../components/Navbar/Navbar";
import "./SearchLead.css";
import Pagination from "../../components/Pagination/Pagination";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { CaseContext } from "../CaseContext";
import api from "../../api"; // adjust the path as needed
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";
import { SideBar } from "../../components/Sidebar/Sidebar";
import Filter from "../../components/Filter/Filter";

const sampleLeads = [];

export const SearchLead = () => {
  const navigate = useNavigate();

  // Initial static rows (1 row)
  const initialStaticRows = Array(1).fill({
    junction: "And",
    field: "",
    evaluator: "",
    value: "",
  });

  const [staticRows, setStaticRows] = useState(initialStaticRows);
  const [dynamicRows, setDynamicRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalEntries, setTotalEntries] = useState(0);
  const signedInOfficer = localStorage.getItem("loggedInUser");


    const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);

  const [leads, setLeads] = useState({
    assignedLeads: [],
    pendingLeads: [],
    pendingLeadReturns: [],
    allLeads: [],
  });

  const [showSelectModal, setShowSelectModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);

  // Now this will hold a FLAT array of leads:
  // [ { caseNo, caseName, leadNo, description, ... }, ... ]
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

        let leadsArray = Array.isArray(resp.data) ? resp.data : [];

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
          })),
        }));
      } catch (err) {
        console.error("Error fetching all leads:", err);
      }
    };

    fetchAllLeads();
  }, [selectedCase]);

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
        leadDetails: lead,
      },
    });

    setPendingRoute(null);
  };

  // Function kept for future use (not used in handleSearch now)
  const applyAdvancedFilters = (leads) => {
    const combinedRows = [...staticRows, ...dynamicRows].filter(
      (row) => row.field && row.value.trim() !== ""
    );
    if (combinedRows.length === 0) return leads;

    return leads.filter((lead) => {
      let satisfiesAll = true;

      combinedRows.forEach((row) => {
        const filterValue = row.value.toLowerCase().trim();
        let leadValue = "";

        switch (row.field) {
          case "Lead Number":
            leadValue = lead.leadNo ? String(lead.leadNo).toLowerCase() : "";
            break;
          case "Priority":
            leadValue = lead.priority ? lead.priority.toLowerCase() : "";
            break;
          case "Due Date":
            leadValue = lead.dueDate
              ? formatDate(lead.dueDate).toLowerCase()
              : "";
            break;
          case "Flag":
            leadValue = lead.associatedFlags
              ? lead.associatedFlags.toLowerCase()
              : "";
            break;
          case "Keyword":
          case "Lead Name":
            leadValue = lead.description
              ? lead.description.toLowerCase()
              : "";
            break;
          case "Assigned To":
            leadValue = Array.isArray(lead.assignedTo)
              ? lead.assignedTo.join(" ").toLowerCase()
              : "";
            break;
          default:
            leadValue = "";
        }

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

  // UPDATED handleSearch: fetch, combine, FLATTEN (no grouping)
const handleSearch = async () => {
  try {
    const token = localStorage.getItem("token");

    const advancedRows = [...staticRows, ...dynamicRows].filter(
      (row) => row.field && row.value.trim() !== ""
    );

    let fieldParam = "";
    let keywordParam = "";

    if (advancedRows.length > 0) {
      fieldParam = advancedRows[0].field;
      keywordParam = advancedRows[0].value.trim();
    } else {
      keywordParam = searchTerm.trim();
    }

    if (!keywordParam) {
      setLeadsData([]);
      setTotalEntries(0);
      return;
    }

    console.log("🔍 Searching for keyword:", keywordParam);

    // existing /api/lead/search for the selected case (optional)
    let leadSearchData = [];
    try {
      const leadResp = await api.get("/api/lead/search", {
        params: {
          caseNo: selectedCase.caseNo,
          caseName: selectedCase.caseName,
          keyword: keywordParam,
          field: fieldParam,
          officerName: signedInOfficer,   
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      leadSearchData = Array.isArray(leadResp.data) ? leadResp.data : [];
    } catch (err) {
      console.warn("Lead search failed (api/lead/search):", err?.response?.status);
    }

    let leadReturnResultsData = [];
    try {
      const lrrResp = await api.get("/api/leadReturnResult", {
        params: { keyword: keywordParam, officerName: signedInOfficer,  },
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ response from /api/leadReturnResult:", lrrResp.data);

      if (Array.isArray(lrrResp.data)) {
        // plain array from backend
        leadReturnResultsData = lrrResp.data;
      } else if (Array.isArray(lrrResp.data?.results)) {
        // wrapped: { results: [...] }
        leadReturnResultsData = lrrResp.data.results;
      } else {
        console.warn(
          "Unexpected response shape for /api/leadReturnResult:",
          lrrResp.data
        );
        leadReturnResultsData = [];
      }
    } catch (err) {
      console.warn(
        "Keyword search failed (api/leadReturnResult):",
        err?.response?.status,
        err?.response?.data
      );
    }

    // Combine & dedupe again on frontend (optional)
    const combinedMap = new Map();
    const addToMap = (item) => {
      const key = `${item.caseNo || ""}::${item.leadNo || ""}::${
        item.description || ""
      }`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, item);
      }
    };

    leadSearchData.forEach(addToMap);
    leadReturnResultsData.forEach(addToMap);

    const combinedResults = Array.from(combinedMap.values());
console.log("Flat combined search results:", combinedResults);

    const combinedWithOfficers = combinedResults.map(item => {
  let officers = [];

  // Case 1: from /api/lead/search – usually assignedTo is an array of { username, ... }
  if (Array.isArray(item.assignedTo)) {
    officers = item.assignedTo.map(o => o.username || o);
  }
  // Case 2: from LeadReturnResult / LeadReturn – often { assignedTo: { assignees: [...] } }
  else if (Array.isArray(item.assignedTo?.assignees)) {
    officers = item.assignedTo.assignees.slice();
  }
  // Case 3: buried inside fullLeadReturn (if you kept that)
  else if (Array.isArray(item.fullLeadReturn?.assignedTo?.assignees)) {
    officers = item.fullLeadReturn.assignedTo.assignees.slice();
  }

  return {
    ...item,
    assignedOfficers: officers,  // ✅ normalized field
  };
});

setLeadsData(combinedWithOfficers);
setTotalEntries(combinedWithOfficers.length);
setCurrentPage(1);
  } catch (error) {
    console.error("❌ Error in handleSearch:", error);
    setLeadsData([]);
    setTotalEntries(0);
  }
};


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

  const handleClearStaticRow = (index) => {
    const updatedRows = [...staticRows];
    updatedRows[index] = {
      junction: "And",
      field: "",
      evaluator: "",
      value: "",
    };
    setStaticRows(updatedRows);
  };

  const handleRemoveDynamicRow = (index) => {
    const updatedRows = dynamicRows.filter((_, i) => i !== index);
    setDynamicRows(updatedRows);
  };

  const handleAddRow = () => {
    setDynamicRows([
      ...dynamicRows,
      { junction: "And", field: "", evaluator: "", value: "" },
    ]);
  };

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
      leadNo: lead.leadNo != null ? lead.leadNo : lead.id,
      incidentNo: lead.incidentNo,
      leadName: lead.description,
      dueDate: lead.dueDate || "",
      priority: lead.priority || "Medium",
      flags: lead.flags || [],
      assignedOfficers: lead.assignedOfficers || [],
      leadStatus: lead.leadStatus,
      caseName: lead.caseName,
      caseNo: lead.caseNo,
      summary: lead.summary
  });
  setLeadStatus(lead.leadStatus);  

  // Navigate to Lead Review Page
  navigate("/leadReview", { state: { leadDetails: lead, caseDetails: selectedCase } });
};

   // ─────────────────────────────────────────────
  // FILTER + SORT (like HomePage tables)
  // ─────────────────────────────────────────────

  // map header label → data key
  const colKey = {
    "Case No.": "caseNo",
    "Case Name": "caseName",
    "Lead No.": "leadNo",
    "Lead Name": "description",
    "Assigned Officers": "assignedOfficers",
  };

  const columnWidths = {
    "Case No.": "10%",
    "Case Name": "18%",
    "Lead No.": "8%",
    "Lead Name": "20%",
    "Assigned Officers": "11%",
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const [filterConfig, setFilterConfig] = useState({
    caseNo: [],
    caseName: [],
    leadNo: [],
    description: [],
    assignedOfficers: [],
  });

  const [openFilter, setOpenFilter] = useState(null);
  const filterButtonRefs = useRef({});
  const [filterSearch, setFilterSearch] = useState({});
  const [tempFilterSelections, setTempFilterSelections] = useState({});

  // distinct values for each column
  const distinctValues = useMemo(() => {
  const map = {
    caseNo: new Set(),
    caseName: new Set(),
    leadNo: new Set(),
    description: new Set(),
    assignedOfficers: new Set(),
  };

  leadsData.forEach((lead) => {
    map.caseNo.add(String(lead.caseNo || "NA"));
    map.caseName.add(lead.caseName || "NA");
    map.leadNo.add(String(lead.leadNo || ""));
    map.description.add(lead.description || "");

    if (Array.isArray(lead.assignedOfficers)) {
      lead.assignedOfficers.forEach((officer) =>
        map.assignedOfficers.add(officer)
      );
    }
  });

  return Object.fromEntries(
    Object.entries(map).map(([key, set]) => [key, [...set]])
  );
}, [leadsData]);


  // sort helper
  const sortColumn = (dataKey, direction) => {
    setSortConfig({ key: dataKey, direction: (direction || "asc").toLowerCase(), });
  };

  // search within filter popup
  const handleFilterSearch = (dataKey, txt) =>
    setFilterSearch((fs) => ({ ...fs, [dataKey]: txt }));

  // toggle "select all"
  const toggleSelectAll = (dataKey) => {
    const all = distinctValues[dataKey] || [];
    setTempFilterSelections((ts) => ({
      ...ts,
      [dataKey]:
        ts[dataKey]?.length === all.length ? [] : [...all],
    }));
  };

  const allChecked = (dataKey) => {
    const sel = tempFilterSelections[dataKey] || [];
    return sel.length === (distinctValues[dataKey] || []).length;
  };

  // toggle individual value
  const handleCheckboxToggle = (dataKey, v) => {
    setTempFilterSelections((ts) => {
      const sel = ts[dataKey] || [];
      return {
        ...ts,
        [dataKey]: sel.includes(v)
          ? sel.filter((x) => x !== v)
          : [...sel, v],
      };
    });
  };

  // apply filter
  const applyFilter = (dataKey) => {
    setFilterConfig((fc) => ({
      ...fc,
      [dataKey]: tempFilterSelections[dataKey] || [],
    }));
    setOpenFilter(null);
  };

  // filtered + sorted leads
const sortedFilteredLeads = useMemo(() => {
  // 1) filter
  const filtered = leadsData.filter((lead) => {
    return Object.entries(filterConfig).every(([field, selected]) => {
      if (!selected || selected.length === 0) return true;

      // Special handling for assignedOfficers (array of names)
      if (field === "assignedOfficers") {
        const officers = Array.isArray(lead.assignedOfficers)
          ? lead.assignedOfficers
          : [];
        return officers.some((o) => selected.includes(o));
      } else {
        // All other scalar fields
        const value =
          field === "caseNo" || field === "leadNo"
            ? String(lead[field] ?? "")
            : String(lead[field] ?? "");

        return selected.includes(value);
      }
    });
  });

  // 2) sort
  if (!sortConfig.key) return filtered;

  const { key, direction } = sortConfig;
  const dir = (direction || "asc").toLowerCase(); // normalize

  return [...filtered].sort((a, b) => {
    let aStr;
    let bStr;

    if (key === "assignedOfficers") {
      // ✅ Join all officers into a string so it's sortable
      const aArr = Array.isArray(a.assignedOfficers)
        ? a.assignedOfficers
        : [];
      const bArr = Array.isArray(b.assignedOfficers)
        ? b.assignedOfficers
        : [];

      aStr = aArr.join(", "); // e.g. "Adams, Brown"
      bStr = bArr.join(", ");
    } else {
      const aV = a[key];
      const bV = b[key];
      aStr = String(aV ?? "");
      bStr = String(bV ?? "");
    }

    return dir === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });
}, [leadsData, filterConfig, sortConfig]);


  // optional: slice for pagination
  const pagedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedFilteredLeads.slice(start, end);
  }, [sortedFilteredLeads, currentPage, pageSize]);

  // Summary stats: unique cases & total leads for current search results
const { uniqueCasesCount, totalLeadsCount } = useMemo(() => {
  const caseSet = new Set();
  leadsData.forEach((lead) => {
    if (lead.caseNo != null) {
      caseSet.add(lead.caseNo);
    }
  });
  return {
    uniqueCasesCount: caseSet.size,
    totalLeadsCount: leadsData.length,
  };
}, [leadsData]);


  return (
    <div className="searchlead-container">
      <Navbar />
      <div className="main-container">
        <SideBar activePage="SearchLead" />
        <div className="left-content">
          <div className="main-content-searchlead">
            <div className="search-page-bar">
              <div className="search-bar-page">
                <div className="search-container1">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    type="text"
                    className="search-input1"
                    placeholder="Search Lead"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        console.log("Enter pressed, calling handleSearch");
                        handleSearch();
                      }
                    }}
                  />
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
                    {staticRows.map((row, index) => (
                      <tr key={`static-${index}`}>
                        <td>
                          <select
                            value={row.junction}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "junction",
                                e.target.value
                              )
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
                              handleInputChange(
                                index,
                                "field",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Select Field</option>
                            <option value="Keyword">Keyword</option>
                            <option value="Assigned To">Assigned To</option>
                            <option value="Lead Number">Lead Number</option>
                            <option value="Remaining Days">
                              Remaining Days
                            </option>
                            <option value="Priority">Priority</option>
                            <option value="Due Date">Due Date</option>
                            <option value="Flag">Flag</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={row.evaluator}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "evaluator",
                                e.target.value
                              )
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
                              handleInputChange(
                                index,
                                "value",
                                e.target.value
                              )
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

                    {dynamicRows.map((row, index) => (
                      <tr key={`dynamic-${index}`}>
                        <td>
                          <select
                            value={row.junction}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "junction",
                                e.target.value,
                                true
                              )
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
                              handleInputChange(
                                index,
                                "field",
                                e.target.value,
                                true
                              )
                            }
                          >
                            <option value="">Select Field</option>
                            <option value="Keyword">Keyword</option>
                            <option value="Assigned To">Assigned To</option>
                            <option value="Lead Number">Lead Number</option>
                            <option value="Remaining Days">
                              Remaining Days
                            </option>
                            <option value="Priority">Priority</option>
                            <option value="Due Date">Due Date</option>
                            <option value="Flag">Flag</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={row.evaluator}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "evaluator",
                                e.target.value,
                                true
                              )
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
                              handleInputChange(
                                index,
                                "value",
                                e.target.value,
                                true
                              )
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
              <p className="results-title">Matching Cases & Leads</p>
              <div className="result-line"></div>
                {/* {leadsData.length > 0 && (
    <div className="results-summary">
      <span>
        <strong>Cases matched:</strong> {uniqueCasesCount}
      </span>
      <span style={{ marginLeft: "24px" }}>
        <strong>Leads matched:</strong> {totalLeadsCount}
      </span>
    </div>
  )} */}
  {leadsData.length > 0 && (
  <div className="results-summary">
    <div className="results-circle">
      <div className="results-circle-count">{uniqueCasesCount}</div>
      <div className="results-circle-label">Cases</div>
    </div>

    <div className="results-circle">
      <div className="results-circle-count">{totalLeadsCount}</div>
      <div className="results-circle-label">Leads</div>
    </div>
  </div>
)}


              <table className="results-table">
                <thead>
                  <tr>
                    {[
                      "Case No.",
                      "Case Name",
                      "Lead No.",
                      "Lead Name",
                      "Assigned Officers",
                    ].map((col) => {
                      const dataKey = colKey[col];
                      return (
                        <th
                          key={col}
                          style={{ width: columnWidths[col] }}
                          className="column-header1"
                        >
                          <div className="header-title">
                            {col}
                            <span>
                              <button
                                ref={(el) =>
                                  (filterButtonRefs.current[dataKey] = el)
                                }
                                onClick={() =>
                                  setOpenFilter((prev) =>
                                    prev === dataKey ? null : dataKey
                                  )
                                }
                              >
                                <img
                                  src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
                                  className="icon-image"
                                  alt="filter"
                                />
                              </button>
                              <Filter
                                dataKey={dataKey}
                                distinctValues={distinctValues}
                                open={openFilter === dataKey}
                                anchorRef={{
                                  current: filterButtonRefs.current[dataKey],
                                }}
                                searchValue={filterSearch[dataKey] || ""}
                                selections={
                                  tempFilterSelections[dataKey] || []
                                }
                                onSort={sortColumn}
                                onSearch={handleFilterSearch}
                                allChecked={allChecked}
                                onToggleAll={toggleSelectAll}
                                onToggleOne={handleCheckboxToggle}
                                onApply={applyFilter}
                                onCancel={() => setOpenFilter(null)}
                              />
                            </span>
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ width: "10%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLeads.length > 0 ? (
                    pagedLeads.map((lead, index) => (
                      <tr key={index}>
                        <td>{lead.caseNo || "NA"}</td>
                        <td>{lead.caseName || "NA"}</td>
                        <td>{lead.leadNo}</td>
                        <td>{lead.description}</td>
                        <td
                          style={{
                            width: "14%",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {Array.isArray(lead.assignedOfficers) && lead.assignedOfficers.length > 0 ? (
                            lead.assignedOfficers.map((officer, idx) => (
                              <span
                                key={idx}
                                style={{
                                  display: "block",
                                  marginBottom: "4px",
                                  padding: "8px 0px 0px 8px",
                                }}
                              >
                                {officer}
                              </span>
                            ))
                          ) : (
                            <span>NA</span>
                          )}

                        </td>

                        <td>
                          <button
                            className="view-btn1"
                            onClick={() => handleLeadClick(lead)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ textAlign: "center", color: "#aaa" }}
                      >
                        No matching leads available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination
                currentPage={currentPage}
                totalEntries={totalEntries}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};