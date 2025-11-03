// src/Pages/ClosedCase/ClosedCase.jsx
import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./ClosedCase.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import Filter from "../../components/Filter/Filter";
import api from "../../api";
import { CaseContext } from "../CaseContext";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d)) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

export const ClosedCase = () => {
  const navigate = useNavigate();
  const { setSelectedCase } = useContext(CaseContext);
  const signedInOfficer = localStorage.getItem("loggedInUser");

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ── Fetch Closed cases (polling like HomePage) ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchClosed = async () => {
      try {
        setLoading(true);
        setErr("");
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const { data } = await api.get("/api/cases", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: { officerName: signedInOfficer },
        });

        if (cancelled) return;

        const rows = (data || [])
          .filter(
            (c) =>
              c.caseStatus === "Completed" &&
              Array.isArray(c.assignedOfficers) &&
              c.assignedOfficers.some((o) => o?.name === signedInOfficer)
          )
          .map((c) => {
            const closedAt = c.closedAt || c.updatedAt || c.createdAt;
            const officer = c.assignedOfficers.find(
              (o) => o?.name === signedInOfficer
            );
            return {
              id: c.caseNo,
              title: c.caseName,
              role: officer?.role || "Unknown",
              closedAt, // raw date string
            };
          });

        setCases(rows);
      } catch (e) {
        console.error("❌ Error fetching closed cases:", e);
        setErr("Failed to load closed cases.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchClosed();
    const id = setInterval(fetchClosed, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [signedInOfficer]);

  // ── Filter + Sort (mirrors HomePage pattern) ────────────────────────────────
  const columnWidths = {
    "Case No.": "8%",
    "Case Name": "20%",
    "Closed At": "8%",
    "Role": "9%",
  };

  const colKey = {
    "Case No.": "id",
    "Case Name": "title",
    "Closed At": "closedAt",
    "Role": "role",
  };

  const filterButtonRefs = useRef({});
  const [openFilter, setOpenFilter] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "closedAt",
    direction: "desc",
  });

  const [filterConfig, setFilterConfig] = useState({
    id: [],
    title: [],
    closedAt: [],
    role: [],
  });

  const [filterSearch, setFilterSearch] = useState({});
  const [tempFilterSelections, setTempFilterSelections] = useState({});

  const handleFilterSearch = (dataKey, txt) =>
    setFilterSearch((fs) => ({ ...fs, [dataKey]: txt }));

  const distinctValues = useMemo(() => {
    const map = {
      id: new Set(),
      title: new Set(),
      closedAt: new Set(),
      role: new Set(),
    };

    cases.forEach((c) => {
      map.id.add(String(c.id));
      map.title.add(c.title);
      map.closedAt.add(formatDate(c.closedAt));
      map.role.add(c.role);
    });

    return Object.fromEntries(
      Object.entries(map).map(([key, set]) => [key, [...set]])
    );
  }, [cases]);

  const toggleSelectAll = (dataKey) => {
    const all = distinctValues[dataKey] || [];
    setTempFilterSelections((ts) => ({
      ...ts,
      [dataKey]: ts[dataKey]?.length === all.length ? [] : [...all],
    }));
  };

  const allChecked = (dataKey) => {
    const sel = tempFilterSelections[dataKey] || [];
    return sel.length === (distinctValues[dataKey] || []).length;
  };

  const handleCheckboxToggle = (dataKey, v) => {
    setTempFilterSelections((ts) => {
      const sel = ts[dataKey] || [];
      return {
        ...ts,
        [dataKey]: sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v],
      };
    });
  };

  const applyFilter = (dataKey) => {
    setFilterConfig((fc) => ({
      ...fc,
      [dataKey]: tempFilterSelections[dataKey] || [],
    }));
    setOpenFilter(null);
  };

  const cancelFilter = () => {
    setTempFilterSelections({});
    setFilterSearch({});
    setOpenFilter(null);
  };

  const sortColumn = (dataKey, direction) => {
    setSortConfig({ key: dataKey, direction });
  };

  const sortedCases = useMemo(() => {
    // 1) apply filters
    const filtered = cases.filter((c) => {
      return Object.entries(filterConfig).every(([field, selected]) => {
        if (!selected || selected.length === 0) return true;

        const cell =
          field === "closedAt" ? formatDate(c.closedAt) : String(c[field]);

        return selected.includes(cell);
      });
    });

    // 2) apply sort
    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      const { key, direction } = sortConfig;

      // Date-aware sort for closedAt
      if (key === "closedAt") {
        const aTime = new Date(a.closedAt || 0).getTime();
        const bTime = new Date(b.closedAt || 0).getTime();
        if (aTime < bTime) return direction === "asc" ? -1 : 1;
        if (aTime > bTime) return direction === "asc" ? 1 : -1;
        return 0;
      }

      const aV = String(a[key] ?? "");
      const bV = String(b[key] ?? "");
      if (aV < bV) return direction === "asc" ? -1 : 1;
      if (aV > bV) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [cases, filterConfig, sortConfig]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleView = (c) => {
    setSelectedCase({ caseNo: c.id, caseName: c.title, role: c.role });
    localStorage.setItem(
      "selectedCase",
      JSON.stringify({ caseNo: c.id, caseName: c.title, role: c.role })
    );
    navigate("/CasePageManager", {
      state: { caseDetails: { caseNo: c.id, caseName: c.title, role: c.role } },
    });
  };

  return (
    <div className="case-page-manager">
      <Navbar />
      <div className="main-container">
        <SideBar
          activePage="ClosedCase"
          activeTab="closed"
          setActiveTab={() => {}}
          onShowCaseSelector={() => {}}
        />

        <div className="left-content">
          <div className="main-page-abovepart">
            <div className="case-header">
              <h2>ARCHIVED CASES</h2>
            </div>
          </div>

          <div className="main-page-belowpart">
            <div className="content-section">
            <div className="table-scroll-container">
              <table className="leads-table">
                <colgroup>
    <col style={{ width: columnWidths["Case No."] }} />
    <col style={{ width: columnWidths["Case Name"] }} />
    <col style={{ width: columnWidths["Closed At"] }} />
    <col style={{ width: columnWidths["Role"] }} />
    <col style={{ width: "5%" }} /> {/* Actions */}
  </colgroup>

                <thead>
                  <tr>
                    {["Case No.", "Case Name", "Closed At", "Role"].map((col) => {
                      const dataKey = colKey[col];
                      return (
                        <th
                          key={col}
                          className="column-header1"
                          style={{ width: columnWidths[col], position: "relative" }}
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
                                aria-label={`Filter ${col}`}
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
                                anchorRef={{ current: filterButtonRefs.current[dataKey] }}
                                searchValue={filterSearch[dataKey] || ""}
                                selections={tempFilterSelections[dataKey] || []}
                                onSort={sortColumn} // provides A→Z / Z→A from popover
                                onSearch={handleFilterSearch}
                                allChecked={allChecked}
                                onToggleAll={toggleSelectAll}
                                onToggleOne={handleCheckboxToggle}
                                onApply={applyFilter}
                                onCancel={cancelFilter}
                              />
                            </span>
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ width: "8%", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 12 }}>
                        Loading…
                      </td>
                    </tr>
                  ) : err ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 12 }}>
                        {err}
                      </td>
                    </tr>
                  ) : sortedCases.length ? (
                    sortedCases.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.title}</td>
                        <td>{formatDate(c.closedAt)}</td>
                        <td>{c.role}</td>
                        <td style={{ textAlign: "center" }}>
                          <button className="view-btn1" onClick={() => handleView(c)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 12 }}>
                        No closed cases found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </div>
        {/* /left-content */}
      </div>
    </div>
  );
};

export default ClosedCase;
