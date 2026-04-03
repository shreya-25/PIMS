// src/Pages/ClosedCase/ClosedCase.jsx
import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ClosedCase.module.css";
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

        const { data } = await api.get("/api/cases/cases-by-officer", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: { officerName: signedInOfficer, status: "COMPLETED" },
          returnEmptyOn404: true,
          emptyData: [],
        });

        if (cancelled) return;

        const rows = (data || []).map((c) => ({
          _id: c._id,
          id: c.caseNo,
          title: c.caseName,
          role: c.role || "Unknown",
          closedAt: c.archivedAt || c.updatedAt || null,
        }));

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
    const caseObj = { _id: c._id, caseNo: c.id, caseName: c.title, role: c.role };
    setSelectedCase(caseObj);
    localStorage.setItem(
      "selectedCase",
      JSON.stringify(caseObj)
    );
    navigate("/CasePageManager", {
      state: { caseDetails: caseObj },
    });
  };

  return (
    <div className={styles['case-page-manager']}>
      <Navbar />
      <div className={styles['main-container']}>
        <SideBar
          activePage="ClosedCase"
          activeTab="closed"
          setActiveTab={() => {}}
          onShowCaseSelector={() => {}}
        />

        <div className={styles['left-content']}>
          <div className={styles['main-page-abovepart']}>
            <div className={styles['case-header']}>
              <h2>ARCHIVED CASES</h2>
            </div>
          </div>

          <div className={styles['main-page-belowpart']}>
            <div className={styles['content-section']}>
              <div className={styles['table-scroll-container']}>
                <table className={styles['leads-table']}>
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
                            className={styles['column-header1']}
                            style={{ width: columnWidths[col] }}
                          >
                            <div className={styles['header-title']}>
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
                                    className={styles['icon-image']}
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
                                  onSort={sortColumn}
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
                      <th className={styles['actions-header']}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className={styles['center-cell-pad']}>
                          Loading…
                        </td>
                      </tr>
                    ) : err ? (
                      <tr>
                        <td colSpan={5} className={styles['center-cell-pad']}>
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
                          <td className={styles['center-cell']}>
                            <button className={styles['view-btn1']} onClick={() => handleView(c)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className={styles['center-cell-pad']}>
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
