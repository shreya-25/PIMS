// src/Pages/ClosedCase/ClosedCase.jsx
import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ClosedCase.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import Filter from "../../components/Filter/Filter";
import Pagination from "../../components/Pagination/Pagination";
import api from "../../api";
import { CaseContext } from "../CaseContext";
import { TeamModal } from "../Admin/AdminTeam";
import { isDetectiveSupervisor } from "../../constants/roles";

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

  const systemRole = localStorage.getItem("systemRole") || localStorage.getItem("role");
  const treatAsDS = isDetectiveSupervisor(systemRole) || systemRole === "Admin";

  const [cases, setCases] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [managingCase, setManagingCase] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    api.get("/api/users/usernames", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setAllUsers(data.users || []))
      .catch(() => {});
  }, []);

  // ── Fetch Closed cases ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchClosed = async () => {
      try {
        setErr("");
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        let rows;

        if (treatAsDS) {
          // DS / Admin: fetch all cases and filter by COMPLETED
          const { data } = await api.get("/api/cases", {
            headers: { Authorization: `Bearer ${token}` },
          });
          rows = (Array.isArray(data) ? data : [])
            .filter((c) => c.status === "COMPLETED")
            .map((c) => {
              const cmNames = (c.caseManagerUserIds || c.caseManagerNames || []).map((m) =>
                typeof m === "string" ? m : m.username || ""
              ).filter(Boolean);
              return {
                _id: c._id,
                id: c.caseNo,
                title: c.caseName,
                closedAt: c.archivedAt || c.updatedAt || null,
                caseManagers: cmNames.join(", ") || "—",
                caseManagerNames: cmNames,
              };
            });
        } else {
          // All others: only their assigned cases
          const { data } = await api.get("/api/cases/cases-by-officer", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            params: { officerName: signedInOfficer, status: "COMPLETED" },
            returnEmptyOn404: true,
            emptyData: [],
          });
          rows = (data || []).map((c) => ({
            _id: c._id,
            id: c.caseNo,
            title: c.caseName,
            closedAt: c.archivedAt || c.updatedAt || null,
            caseManagers: c.caseManagers || "—",
            caseManagerNames: c.caseManagerNames || [],
          }));
        }

        if (cancelled) return;
        setCases(rows);
      } catch (e) {
        console.error("❌ Error fetching closed cases:", e);
        setErr("Failed to load closed cases.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchClosed();
    return () => { cancelled = true; };
  }, [signedInOfficer, treatAsDS]);

  // Resolve a caseManagerNames entry (raw username OR "DisplayName (username)") to "Last, First (username)"
  const fmtManager = (nameOrUsername) => {
    // Try direct username match first
    let u = allUsers.find((x) => x.username === nameOrUsername);
    if (!u) {
      // Try extracting username from "DisplayName (username)" format
      const match = /\(([^)]+)\)$/.exec((nameOrUsername || "").trim());
      if (match) u = allUsers.find((x) => x.username === match[1]);
    }
    if (u) {
      const last  = (u.lastName  || "").trim();
      const first = (u.firstName || "").trim();
      const name  = last && first ? `${last}, ${first}` : last || first || "";
      return name ? `${name} (${u.username})` : u.username;
    }
    return nameOrUsername;
  };

  // ── Filter + Sort (mirrors HomePage pattern) ────────────────────────────────
  const columnWidths = {
    "Case No.": "11%",
    "Case Name": "21%",
    "Closed At": "9%",
    "Case Managers": treatAsDS ? "20%" : "13%",
  };

  const colKey = {
    "Case No.": "id",
    "Case Name": "title",
    "Closed At": "closedAt",
    "Case Managers": "caseManagers",
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
    caseManagers: [],
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
      caseManagers: new Set(),
    };

    cases.forEach((c) => {
      map.id.add(String(c.id));
      map.title.add(c.title);
      map.closedAt.add(formatDate(c.closedAt));
      (c.caseManagerNames || []).forEach((name) => { if (name) map.caseManagers.add(fmtManager(name)); });
    });

    return Object.fromEntries(
      Object.entries(map).map(([key, set]) => [key, [...set]])
    );
  }, [cases, allUsers]);

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
    setCurrentPage(1);
    setOpenFilter(null);
  };

  const cancelFilter = () => {
    setTempFilterSelections({});
    setFilterSearch({});
    setOpenFilter(null);
  };

  const sortColumn = (dataKey, direction) => {
    setSortConfig({ key: dataKey, direction });
    setCurrentPage(1);
  };

  const sortedCases = useMemo(() => {
    // 1) apply filters
    const filtered = cases.filter((c) => {
      return Object.entries(filterConfig).every(([field, selected]) => {
        if (!selected || selected.length === 0) return true;
        if (field === "caseManagers") {
          return selected.some((s) => (c.caseManagerNames || []).map(fmtManager).includes(s));
        }
        const cell = field === "closedAt" ? formatDate(c.closedAt) : String(c[field]);
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
  }, [cases, filterConfig, sortConfig, allUsers]);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCases.slice(start, start + pageSize);
  }, [sortedCases, currentPage, pageSize]);

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
      {managingCase && (
        <TeamModal
          caseData={managingCase}
          allUsers={allUsers}
          onClose={() => setManagingCase(null)}
          onSaved={() => setManagingCase(null)}
        />
      )}
      <div className={styles['main-container']}>
        <SideBar
          variant="home"
          activePage="ClosedCase"
          activeTab="archived"
          isDS={true}
          setActiveTab={(tab) => {
            if (tab === "notifications") navigate("/HomePage", { state: { activeTab: "notifications" } });
            else if (tab === "cases") navigate("/HomePage", { state: { activeTab: "cases" } });
          }}
          onShowCaseSelector={() => navigate("/HomePage", { state: { activeTab: "cases", openAddCase: true } })}
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
                    <col style={{ width: "6%" }} /> {/* Actions */}
                  </colgroup>

                  <thead>
                    <tr>
                      {["Case No.", "Case Name", "Closed At", "Case Managers"].map((col) => {
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
                      <th className={styles['actions-header']} style={{ width: "17%" }}>Actions</th>
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
                    ) : paginatedCases.length ? (
                      paginatedCases.map((c) => (
                        <tr key={c.id}>
                          <td>{c.id}</td>
                          <td>{c.title}</td>
                          <td>{formatDate(c.closedAt)}</td>
                          <td>
                            {(c.caseManagerNames || []).length > 0
                              ? c.caseManagerNames.map((m, i) => <div key={i}>{fmtManager(m)}</div>)
                              : "—"}
                          </td>
                          <td className={styles['center-cell']}>
                            {treatAsDS ? (
                              <div className={styles['btn-sec']}>
                                <button
                                  className={styles['ds-manage-btn']}
                                  onClick={() => setManagingCase({ _id: c._id, caseNo: c.id, caseName: c.title })}
                                >
                                  Manage Team
                                </button>
                                <button
                                  className={styles['ds-open-case-btn']}
                                  onClick={() => handleView(c)}
                                >
                                  Open Case
                                </button>
                              </div>
                            ) : (
                              <button className={styles['manage-btn']} onClick={() => handleView(c)}>
                                Manage
                              </button>
                            )}
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
              <Pagination
                currentPage={currentPage}
                totalEntries={sortedCases.length}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>
        {/* /left-content */}
      </div>
    </div>
  );
};

export default ClosedCase;
