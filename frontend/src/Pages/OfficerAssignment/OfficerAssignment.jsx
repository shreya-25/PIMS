// src/Pages/OfficerAssignment/OfficerAssignment.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./OfficerAssignment.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import api from "../../api";
import { ROLES, CASE_ROLES, isDetectiveSupervisor } from "../../constants/roles";

// Column widths for the officer table (mirrors HomePage's columnWidths pattern) — Actions
// gets enough room for the View More button and Case Manager (Cases) enough to keep its
// header on one line, with Officer/Total Assigned Leads/Pending Leads giving up the rest.
const columnWidths = {
  Officer: "34%",
  "Total Assigned Leads": "18%",
  "Pending Leads": "16%",
  "Case Manager (Cases)": "20%",
  Actions: "12%",
};

const toDisplay = (u) => {
  if (!u) return "";
  const last = (u.lastName || "").trim();
  const first = (u.firstName || "").trim();
  const name = last && first ? `${last}, ${first}` : last || first || "";
  const uname = u.username ? ` (${u.username})` : "";
  const title = u.title ? ` (${u.title})` : "";
  return name ? `${name}${uname}${title}` : u.username || "";
};

export const OfficerAssignment = () => {
  const navigate = useNavigate();
  const systemRole = localStorage.getItem("systemRole") || localStorage.getItem("role");
  const signedInOfficer = localStorage.getItem("loggedInUser");

  const [caseList, setCaseList] = useState([]);
  const [accessChecked, setAccessChecked] = useState(false);

  const [officers, setOfficers] = useState([]);
  const [ongoingCasesCount, setOngoingCasesCount] = useState(0);
  const [totalCasesCount, setTotalCasesCount] = useState(0);
  const [officerSearch, setOfficerSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Figure out whether this user is a Case Manager on any case (same call/pattern Sidebar.jsx
  // already uses to compute isUserDS) so we can gate the page for non-Admin/DS users.
  useEffect(() => {
    const token = localStorage.getItem("token");
    api
      .get("/api/cases/cases-by-officer", {
        headers: { Authorization: `Bearer ${token}` },
        params: { officerName: signedInOfficer },
        suppressGlobalError: true,
      })
      .then(({ data }) => setCaseList(data || []))
      .catch(() => setCaseList([]))
      .finally(() => setAccessChecked(true));
  }, [signedInOfficer]);

  const canAccess =
    systemRole === ROLES.ADMIN ||
    isDetectiveSupervisor(systemRole) ||
    caseList.some((c) => c.role === CASE_ROLES.CASE_MANAGER);

  useEffect(() => {
    if (!accessChecked) return;
    if (!canAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("token");
    api
      .get("/api/cases/officer-workload", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          from: fromDate || undefined,
          to: toDate || undefined,
        },
      })
      .then(({ data }) => {
        setOfficers(data.officers || []);
        setOngoingCasesCount(data.ongoingCasesCount || 0);
        setTotalCasesCount(data.totalCasesInRange || 0);
        setErr("");
      })
      .catch(() => setErr("Failed to load officer workload."))
      .finally(() => setLoading(false));
  }, [accessChecked, canAccess, fromDate, toDate]);

  const clearRange = () => {
    setFromDate("");
    setToDate("");
  };

  // Blocks are always shown in descending order of total assigned leads.
  const sortedOfficers = useMemo(() => {
    let list = officers;
    if (officerSearch.trim()) {
      const q = officerSearch.toLowerCase();
      list = list.filter((o) => toDisplay(o.user).toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (b.assignedLeads !== a.assignedLeads) return b.assignedLeads - a.assignedLeads;
      return toDisplay(a.user).localeCompare(toDisplay(b.user));
    });
  }, [officers, officerSearch]);

  // Keep the open popup's data in sync if the underlying list refetches (e.g. date range changed).
  useEffect(() => {
    if (!selectedOfficer) return;
    const uname = selectedOfficer.user.username;
    const fresh = officers.find((o) => o.user.username === uname);
    setSelectedOfficer(fresh || null);
  }, [officers]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles["officer-assignment-page"]}>
      <Navbar />
      <div className={styles["main-container"]}>
        <SideBar
          variant="home"
          activePage="OfficerAssignment"
          activeTab="officerAssignment"
          isDS={isDetectiveSupervisor(systemRole)}
          setActiveTab={(tab) => {
            if (tab === "notifications") navigate("/HomePage", { state: { activeTab: "notifications" } });
            else if (tab === "cases") navigate("/HomePage", { state: { activeTab: "cases" } });
          }}
          onShowCaseSelector={() => navigate("/HomePage", { state: { activeTab: "cases", openAddCase: true } })}
        />

        <div className={styles["left-content"]}>
          <div className={styles["page-header"]}>
            <h2>OFFICER ASSIGNMENT</h2>
          </div>

          {!accessChecked ? (
            <div className={styles.statusMessage}>Loading…</div>
          ) : !canAccess ? (
            <div className={styles.statusMessage}>
              You don't have access to this page. Only Admins, Detective Supervisors, and Case Managers can
              view officer workload.
            </div>
          ) : (
            <div className={styles.content}>
              <div className={styles.statsRow}>
                <div className={styles.ongoingCasesStat}>
                  <span className={styles.ongoingCasesNumber}>{totalCasesCount}</span>
                  <span className={styles.ongoingCasesLabel}>
                    Total Cases{(fromDate || toDate) ? " (in selected range)" : ""}
                  </span>
                </div>
                <div className={styles.ongoingCasesStat}>
                  <span className={styles.ongoingCasesNumber}>{ongoingCasesCount}</span>
                  <span className={styles.ongoingCasesLabel}>
                    Ongoing Cases{(fromDate || toDate) ? " (still open, in selected range)" : ""}
                  </span>
                </div>
              </div>

              <div className={styles.controlsRow}>
                <input
                  className={styles.officerSearch}
                  type="text"
                  placeholder="Search officers by name or username"
                  value={officerSearch}
                  onChange={(e) => setOfficerSearch(e.target.value)}
                />

                <div className={styles.dateRange}>
                  <label className={styles.dateField}>
                    From
                    <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} />
                  </label>
                  <label className={styles.dateField}>
                    To
                    <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
                  </label>
                  {(fromDate || toDate) && (
                    <button type="button" className={styles.clearRangeBtn} onClick={clearRange}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className={styles.statusMessage}>Loading officer workload…</div>
              ) : err ? (
                <div className={styles.statusMessage}>{err}</div>
              ) : sortedOfficers.length === 0 ? (
                <div className={styles.noOfficers}>No officers found</div>
              ) : (
                <div className={styles.officerTableWrap}>
                  <table className={styles.officerTable}>
                    <thead>
                      <tr>
                        <th style={{ width: columnWidths.Officer }}>Officer</th>
                        <th style={{ width: columnWidths["Total Assigned Leads"] }}>Total Assigned Leads</th>
                        <th style={{ width: columnWidths["Pending Leads"] }}>Pending Leads</th>
                        <th style={{ width: columnWidths["Case Manager (Cases)"] }}>Case Manager (Cases)</th>
                        <th style={{ width: columnWidths.Actions, textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOfficers.map((o) => (
                        <tr key={o.user.username}>
                          <td data-label="Officer" className={styles.officerNameCell}>{toDisplay(o.user)}</td>
                          <td data-label="Total Assigned Leads" className={styles.statCell}>{o.assignedLeads}</td>
                          <td data-label="Pending Leads" className={styles.statCell}>{o.pendingLeads}</td>
                          <td data-label="Case Manager (Cases)" className={styles.statCell}>{o.caseManagerCases}</td>
                          <td data-label="Actions" className={styles.viewMoreCell}>
                            <button
                              type="button"
                              className={styles.viewMoreBtn}
                              onClick={() => setSelectedOfficer(o)}
                            >
                              View More
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedOfficer && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOfficer(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.modalCloseBtn} onClick={() => setSelectedOfficer(null)} aria-label="Close">
              ×
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.modalOfficerName}>{toDisplay(selectedOfficer.user)}</div>
              <div className={styles.officerSystemRole}>{selectedOfficer.user.role}</div>
            </div>

            <div className={styles.modalSummaryRow}>
              <div className={styles.modalSummaryStat}>
                <span className={styles.modalSummaryNumber}>{selectedOfficer.assignedLeads}</span>
                <span className={styles.modalSummaryLabel}>Total Assigned Leads</span>
              </div>
              <div className={styles.modalSummaryStat}>
                <span className={styles.modalSummaryNumber}>{selectedOfficer.completedLeads}</span>
                <span className={styles.modalSummaryLabel}>Total Completed Leads</span>
              </div>
              <div className={styles.modalSummaryStat}>
                <span className={styles.modalSummaryNumber}>{selectedOfficer.caseManagerCases}</span>
                <span className={styles.modalSummaryLabel}>Case Manager (Cases)</span>
              </div>
            </div>

            <div className={styles.modalCasesWrap}>
              {selectedOfficer.cases.length === 0 ? (
                <div className={styles.noCasesDetail}>No cases in the selected range.</div>
              ) : (
                <table className={styles["cases-detail-table"]}>
                  <thead>
                    <tr>
                      <th>Case No.</th>
                      <th>Case Name</th>
                      <th>Officer Role</th>
                      <th>Total Leads</th>
                      <th>Leads Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOfficer.cases.map((c) => (
                      <tr key={c.caseId}>
                        <td>{c.caseNo}</td>
                        <td>{c.caseName}</td>
                        <td>{c.roles.join(", ")}</td>
                        <td className={styles.numCell}>{c.leadCount}</td>
                        <td className={styles.numCell}>{c.leadsPending}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
