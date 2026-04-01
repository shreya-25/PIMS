import React, { useState, useEffect, useMemo } from "react";
import styles from "./AdminCM.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import api from "../../api";

const STATUS_LABELS = {
  ONGOING:   "Ongoing",
  COMPLETED: "Completed",
  ARCHIVED:  "Archived",
};

const displayNames = (users) => {
  if (!users || users.length === 0) return "—";
  return users
    .map((u) => u?.displayName || u?.firstName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : u?.username || "—")
    .join(", ");
};

const displayName = (u) => {
  if (!u) return "—";
  const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return full || u.username || "—";
};

export const AdminCM = () => {
  const [showAddCase, setShowAddCase] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCases(Array.isArray(data) ? data : []);
      } catch {
        setError("Failed to load cases.");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.caseNo?.toLowerCase().includes(q) ||
        c.caseName?.toLowerCase().includes(q) ||
        c.characterOfCase?.toLowerCase().includes(q)
      );
    });
  }, [cases, statusFilter, search]);

  const counts = useMemo(() => ({
    ALL:       cases.length,
    ONGOING:   cases.filter((c) => c.status === "ONGOING").length,
    COMPLETED: cases.filter((c) => c.status === "COMPLETED").length,
    ARCHIVED:  cases.filter((c) => c.status === "ARCHIVED").length,
  }), [cases]);

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

        <div className={styles["content"]}>
          <div className={styles["card"]}>
            <div className={styles["card-header"]}>
              <h2>Case Management</h2>
              <span className={styles["chip"]}>All Cases</span>
            </div>

            {/* ── Toolbar ───────────────────────────────────────────────── */}
            <div className={styles["toolbar"]}>
              <div className={styles["filter-tabs"]}>
                {["ALL", "ONGOING", "COMPLETED", "ARCHIVED"].map((s) => (
                  <button
                    key={s}
                    className={`${styles["filter-tab"]} ${statusFilter === s ? styles["filter-tab-active"] : ""}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === "ALL" ? "All" : STATUS_LABELS[s]}
                    <span className={styles["tab-count"]}>{counts[s]}</span>
                  </button>
                ))}
              </div>
              <input
                className={styles["search-input"]}
                type="text"
                placeholder="Search case no, name, character…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading && <p className={styles["state-msg"]}>Loading...</p>}
            {error   && <p className={styles["error-msg"]}>{error}</p>}

            {!loading && !error && (
              <div className={styles["table-wrapper"]}>
                <table className={styles["case-table"]}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Case No</th>
                      <th>Case Name</th>
                      <th>Status</th>
                      <th>Character</th>
                      <th>Case Manager(s)</th>
                      <th>Detective Supervisor</th>
                      <th>Investigators</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className={styles["empty-row"]}>
                          No cases found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((c, i) => (
                        <tr key={c._id}>
                          <td>{i + 1}</td>
                          <td className={styles["case-no"]}>{c.caseNo}</td>
                          <td>{c.caseName}</td>
                          <td>
                            <span className={`${styles["status-badge"]} ${styles[`status-${c.status}`]}`}>
                              {STATUS_LABELS[c.status] || c.status}
                            </span>
                          </td>
                          <td>{c.characterOfCase || "—"}</td>
                          <td>{displayNames(c.caseManagerUserIds)}</td>
                          <td>{displayName(c.detectiveSupervisorUserId)}</td>
                          <td>{displayNames(c.investigatorUserIds)}</td>
                          <td className={styles["date-cell"]}>
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric", year: "numeric",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
