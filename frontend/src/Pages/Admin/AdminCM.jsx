import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import styles from "./AdminCM.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import Filter from "../../components/Filter/Filter";
import Pagination from "../../components/Pagination/Pagination";
import { useNavigate } from "react-router-dom";
import { CaseContext } from "../CaseContext";
import api from "../../api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
};

const getDisplayName = (u) => {
  if (!u) return null;
  const last  = (u.lastName  || "").trim();
  const first = (u.firstName || "").trim();
  const name  = last && first ? `${last}, ${first}` : last || first || "";
  const username = u.username ? ` (${u.username})` : "";
  return name ? `${name}${username}` : u.username || null;
};

const mapCase = (c) => {
  const caseManagerNames = (c.caseManagerUserIds || []).map(getDisplayName).filter(Boolean);
  return {
    _id:             c._id,
    caseNo:          c.caseNo  || "—",
    caseName:        c.caseName || "—",
    createdAt:       c.createdAt,
    createdAtFmt:    formatDate(c.createdAt),
    closedAt:        c.archivedAt || c.updatedAt || null,
    closedAtFmt:     formatDate(c.archivedAt || c.updatedAt || null),
    caseManagers:    caseManagerNames.join(", ") || "—",
    caseManagerNames,
    status:          c.status,
  };
};

// ─── Per-tab column config ─────────────────────────────────────────────────────

const ONGOING_COLS   = ["Case No.", "Case Name", "Created At", "Case Managers"];
const ONGOING_KEY    = { "Case No.": "caseNo", "Case Name": "caseName", "Created At": "createdAtFmt", "Case Managers": "caseManagers" };
const ONGOING_WIDTHS = { "Case No.": "10%", "Case Name": "35%", "Created At": "12%", "Case Managers": "25%" };

const ARCHIVED_COLS   = ["Case No.", "Case Name", "Closed At", "Case Managers"];
const ARCHIVED_KEY    = { "Case No.": "caseNo", "Case Name": "caseName", "Closed At": "closedAtFmt", "Case Managers": "caseManagers" };
const ARCHIVED_WIDTHS = { "Case No.": "10%", "Case Name": "35%", "Closed At": "12%", "Case Managers": "25%" };

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminCM = () => {
  const navigate = useNavigate();
  const { setSelectedCase } = useContext(CaseContext);

  const systemRole = localStorage.getItem("role");
  const isAdminOrDS = systemRole === "Admin" || systemRole === "Detective Supervisor";

  const [showAddCase, setShowAddCase]   = useState(false);
  const [rawCases, setRawCases]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [statusFilter, setStatusFilter] = useState("ONGOING");

  // ─── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(50);

  // ─── Filter / sort state ────────────────────────────────────────────────────
  const emptyFilter = () => ({ caseNo: [], caseName: [], createdAtFmt: [], closedAtFmt: [], caseManagers: [] });
  const [sortConfig, setSortConfig]                     = useState({ key: null, direction: "asc" });
  const [filterConfig, setFilterConfig]                 = useState(emptyFilter());
  const [openFilter, setOpenFilter]                     = useState(null);
  const [filterSearch, setFilterSearch]                 = useState({});
  const [tempFilterSelections, setTempFilterSelections] = useState({});
  const filterButtonRefs = useRef({});

  // ─── Fetch all cases ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRawCases(Array.isArray(data) ? data : []);
      } catch {
        setError("Failed to load cases.");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Reset filters + page when switching tabs
  useEffect(() => {
    setFilterConfig(emptyFilter());
    setSortConfig({ key: null, direction: "asc" });
    setTempFilterSelections({});
    setFilterSearch({});
    setOpenFilter(null);
    setCurrentPage(1);
  }, [statusFilter]);

  // Reset to page 1 on filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterConfig, sortConfig]);

  // ─── Active column config ────────────────────────────────────────────────────
  const isArchived  = statusFilter === "ARCHIVED";
  const COLUMNS     = isArchived ? ARCHIVED_COLS   : ONGOING_COLS;
  const COL_KEY     = isArchived ? ARCHIVED_KEY    : ONGOING_KEY;
  const COL_WIDTHS  = isArchived ? ARCHIVED_WIDTHS : ONGOING_WIDTHS;

  // ─── Cases for active tab ────────────────────────────────────────────────────
  // Ongoing  → status === "ONGOING"
  // Archived → status === "COMPLETED"  (mirrors ClosedCase page)
  const cases = useMemo(
    () => rawCases
      .filter((c) => isArchived ? c.status === "COMPLETED" : c.status === "ONGOING")
      .map(mapCase),
    [rawCases, isArchived]
  );

  const counts = useMemo(() => ({
    ONGOING:  rawCases.filter((c) => c.status === "ONGOING").length,
    ARCHIVED: rawCases.filter((c) => c.status === "COMPLETED").length,
  }), [rawCases]);

  // ─── Distinct values for filter checkboxes ───────────────────────────────────
  const distinctValues = useMemo(() => {
    const map = {
      caseNo:       new Set(),
      caseName:     new Set(),
      createdAtFmt: new Set(),
      closedAtFmt:  new Set(),
      caseManagers: new Set(),
    };
    cases.forEach((c) => {
      map.caseNo.add(c.caseNo);
      map.caseName.add(c.caseName);
      map.createdAtFmt.add(c.createdAtFmt);
      map.closedAtFmt.add(c.closedAtFmt);
      c.caseManagerNames.forEach((n) => map.caseManagers.add(n));
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, [...s]]));
  }, [cases]);

  // ─── Filtered + sorted rows ──────────────────────────────────────────────────
  const sortedCases = useMemo(() => {
    const filtered = cases.filter((c) =>
      Object.entries(filterConfig).every(([field, sel]) => {
        if (!sel.length) return true;
        if (field === "caseManagers") return sel.some((s) => c.caseManagerNames.includes(s));
        return sel.includes(String(c[field]));
      })
    );

    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      const { key, direction } = sortConfig;

      // Date-aware sort for closedAt (mirrors ClosedCase)
      if (key === "closedAtFmt") {
        const aT = new Date(a.closedAt || 0).getTime();
        const bT = new Date(b.closedAt || 0).getTime();
        return direction === "asc" ? aT - bT : bT - aT;
      }

      const aV = String(a[key] ?? "");
      const bV = String(b[key] ?? "");
      const cmp = aV.localeCompare(bV);
      return direction === "asc" ? cmp : -cmp;
    });
  }, [cases, filterConfig, sortConfig]);

  // ─── Paginated slice ─────────────────────────────────────────────────────────
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCases.slice(start, start + pageSize);
  }, [sortedCases, currentPage, pageSize]);

  // ─── Filter handlers ─────────────────────────────────────────────────────────
  const sortColumn         = (key, dir) => { setSortConfig({ key, direction: dir }); setCurrentPage(1); };
  const handleFilterSearch = (key, txt) => setFilterSearch((fs) => ({ ...fs, [key]: txt }));
  const allChecked         = (key) => (tempFilterSelections[key] || []).length === (distinctValues[key] || []).length;
  const toggleSelectAll    = (key) => {
    const all = distinctValues[key] || [];
    setTempFilterSelections((ts) => ({
      ...ts,
      [key]: ts[key]?.length === all.length ? [] : [...all],
    }));
  };
  const handleCheckboxToggle = (key, v) =>
    setTempFilterSelections((ts) => {
      const sel = ts[key] || [];
      return { ...ts, [key]: sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v] };
    });
  const applyFilter  = (key) => {
    setFilterConfig((fc) => ({ ...fc, [key]: tempFilterSelections[key] || [] }));
    setCurrentPage(1);
    setOpenFilter(null);
  };
  const cancelFilter = () => {
    setTempFilterSelections({});
    setFilterSearch({});
    setOpenFilter(null);
  };

  // ─── Navigate into case (mirrors ClosedCase handleView) ──────────────────────
  const handleManage = (c) => {
    const caseObj = { _id: c._id, caseNo: c.caseNo, caseName: c.caseName, role: "Case Manager" };
    setSelectedCase(caseObj);
    localStorage.setItem("selectedCase", JSON.stringify(caseObj));
    navigate("/CasePageManager", { state: { caseDetails: caseObj } });
  };

  const tabs = [
    { key: "ONGOING",  label: "Ongoing Cases" },
    { key: "ARCHIVED", label: "Archived Cases" },
  ];

  return (
    <div className={styles["page-wrapper"]}>
      <Navbar />

      <div className={styles["main-container"]}>
        <SideBar variant="admin" onShowCaseSelector={setShowAddCase} />

        {showAddCase && (
          <SlideBar
            isOpen={showAddCase}
            hideTrigger
            onClose={() => setShowAddCase(false)}
            onAddCase={() => setShowAddCase(false)}
          />
        )}

        <div className={styles["left-content"]}>
          <div className={styles["main-page-belowpart"]}>

            {/* ── Stats bar ── */}
            <div className={styles["stats-bar"]}>
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  className={`${styles["hoverable"]} ${statusFilter === key ? styles["active"] : ""}`}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}: {counts[key]}
                </button>
              ))}
              {isAdminOrDS && (
                <button
                  className={styles["hoverable"]}
                  onClick={() => navigate("/AdminTeam")}
                >
                  AdminTeam
                </button>
              )}
            </div>

            {/* ── Table + Pagination ── */}
            <div className={styles["content-section"]}>
              {loading && <p className={styles["state-msg"]}>Loading...</p>}
              {error   && <p className={styles["error-msg"]}>{error}</p>}

              {!loading && !error && (
                <>
                  <div className={styles["table-scroll-container"]}>
                    <table className={styles["leads-table"]}>
                      <thead>
                        <tr>
                          {COLUMNS.map((col) => {
                            const dataKey = COL_KEY[col];
                            return (
                              <th
                                key={col}
                                className={styles["column-header1"]}
                                style={{ width: COL_WIDTHS[col], position: "relative" }}
                              >
                                <div className={styles["header-title"]}>
                                  {col}
                                  <span>
                                    <button
                                      ref={(el) => (filterButtonRefs.current[dataKey] = el)}
                                      onClick={() =>
                                        setOpenFilter((prev) => (prev === dataKey ? null : dataKey))
                                      }
                                      aria-label={`Filter ${col}`}
                                    >
                                      <img
                                        src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
                                        className={styles["icon-image"]}
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
                          <th style={{ width: "18%", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCases.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "8px" }}>
                              No cases found.
                            </td>
                          </tr>
                        ) : (
                          paginatedCases.map((c) => (
                            <tr key={c._id}>
                              <td>{c.caseNo}</td>
                              <td>{c.caseName}</td>
                              <td>{isArchived ? c.closedAtFmt : c.createdAtFmt}</td>
                              <td>
                                {c.caseManagerNames.length > 0
                                  ? c.caseManagerNames.map((m, i) => <div key={i}>{m}</div>)
                                  : "—"}
                              </td>
                              <td style={{ textAlign: "left" }}>
                                <div className={styles["btn-sec"]}>
                                  <button
                                    className={styles["manage-btn"]}
                                    onClick={() => handleManage(c)}
                                  >
                                    Manage
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
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
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
