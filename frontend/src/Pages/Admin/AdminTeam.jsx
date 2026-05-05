import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import styles from "./AdminTeam.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { AddCaseInline } from "../HomePage/AddCaseInline";
import Filter from "../../components/Filter/Filter";
import Pagination from "../../components/Pagination/Pagination";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import { useNavigate } from "react-router-dom";
import { CaseContext } from "../CaseContext";
import api from "../../api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${dt.getFullYear()}`;
};

const fmtUser = (u) => {
  if (!u) return "";
  const last  = (u.lastName  || "").trim();
  const first = (u.firstName || "").trim();
  const name  = last && first ? `${last}, ${first}` : last || first || "";
  const uname = u.username ? ` (${u.username})` : "";
  const title = u.title    ? ` (${u.title})`    : "";
  return name ? `${name}${uname}${title}` : u.username || "";
};

const fmtUserDisplay = (u) => {
  if (!u) return "";
  const last  = (u.lastName  || "").trim();
  const first = (u.firstName || "").trim();
  const name  = last && first ? `${last}, ${first}` : last || first || "";
  const uname = u.username ? ` (${u.username})` : "";
  return name ? `${name}${uname}` : u.username || "";
};

const ROLE_LABELS = {
  detectiveSupervisors: "Detective Supervisors",
  caseManagers:         "Case Managers",
  investigators:        "Investigators",
  officers:             "Officers",
  readOnly:             "Read Only",
};

const ROLE_KEYS = ["detectiveSupervisors", "caseManagers", "investigators", "officers", "readOnly"];

const ROLE_API = {
  detectiveSupervisors: "Detective Supervisor",
  caseManagers:         "Case Manager",
  investigators:        "Investigator",
  officers:             "Officer",
  readOnly:             "Read Only",
};

const USER_ROLE_FILTER = {
  detectiveSupervisors: (u) => u.role === "Detective Supervisor",
  caseManagers:         (u) => u.role === "Detective" || u.role === "Case Specific",
  investigators:        (u) => u.role === "Detective" || u.role === "Case Specific",
  officers:             (u) => u.role === "Detective" || u.role === "Case Specific",
  readOnly:             (u) => u.role !== "Admin",
};

// Roles the admin cannot add new members to (but CAN remove existing members)
const NO_ADD_ROLES = new Set(["detectiveSupervisors", "caseManagers", "investigators", "officers"]);

// ─── Team Management Modal ─────────────────────────────────────────────────────

export const TeamModal = ({ caseData, allUsers, onClose, onSaved }) => {
  const [team, setTeam]             = useState({ detectiveSupervisors: [], caseManagers: [], investigators: [], officers: [], readOnly: [] });
  const [initialReadOnly, setInitialReadOnly] = useState([]);
  const [blocked, setBlocked]       = useState(new Set()); // usernames whose access is revoked
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState({ detectiveSupervisors: "", caseManagers: "", investigators: "", officers: "", readOnly: "" });
  const [dropOpen, setDropOpen]     = useState({ detectiveSupervisors: false, caseManagers: false, investigators: false, officers: false, readOnly: false });
  const [alertMsg, setAlertMsg]     = useState("");
  const [assignedCaseManager, setAssignedCaseManager] = useState("");
  const [atDropOpen, setAtDropOpen] = useState(false);
  const [atSearch, setAtSearch]     = useState("");
  const atDropRef = useRef(null);
  const dropRefs = useRef({});

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get(`/api/cases/${caseData.caseNo}/team`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ro = data.readOnly || [];
        setTeam({
          detectiveSupervisors: data.detectiveSupervisors || [],
          caseManagers:         data.caseManagers || [],
          investigators:        data.investigators || [],
          officers:             data.officers || [],
          readOnly:             ro,
        });
        setInitialReadOnly(ro);
        setBlocked(new Set(data.blocked || []));
        setAssignedCaseManager(data.assignedCaseManager || "");
      } catch {
        setAlertMsg("Failed to load team data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [caseData.caseNo]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      ROLE_KEYS.forEach((rk) => {
        if (dropRefs.current[rk] && !dropRefs.current[rk].contains(e.target)) {
          setDropOpen((prev) => ({ ...prev, [rk]: false }));
        }
      });
      if (atDropRef.current && !atDropRef.current.contains(e.target)) {
        setAtDropOpen(false);
        setAtSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Toggle block: officer stays in team but access is revoked / restored
  const toggleBlock = (username) => {
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const add = (roleKey, username) => {
    const conflictKey = roleKey === "officers" ? "readOnly" : roleKey === "readOnly" ? "officers" : null;

    setTeam((prev) => {
      if (prev[roleKey].includes(username)) return prev;
      const next = { ...prev, [roleKey]: [...prev[roleKey], username] };
      // Move user out of the conflicting role if they were in it
      if (conflictKey && next[conflictKey].includes(username)) {
        next[conflictKey] = next[conflictKey].filter((u) => u !== username);
      }
      return next;
    });

    // Always clear block when actively adding to a role
    setBlocked((prev) => { const next = new Set(prev); next.delete(username); return next; });
    setDropOpen((prev) => ({ ...prev, [roleKey]: false }));
    setSearch((prev) => ({ ...prev, [roleKey]: "" }));
  };

  const save = async () => {
    if (!assignedCaseManager) {
      setAlertMsg("Assigned To is required. Please select a case manager.");
      return;
    }
    setSaving(true);
    try {
      const token        = localStorage.getItem("token");
      const adminUsername = localStorage.getItem("loggedInUser") || "Admin";

      const officers = [
        ...team.detectiveSupervisors.map((u) => ({ name: u, role: "Detective Supervisor" })),
        ...team.caseManagers.map((u)          => ({ name: u, role: "Case Manager"        })),
        ...team.investigators.map((u)          => ({ name: u, role: "Investigator"        })),
        ...team.officers.map((u)               => ({ name: u, role: "Officer"             })),
        ...team.readOnly.map((u)               => ({ name: u, role: "Read Only"           })),
      ];

      await api.put(
        `/api/cases/${caseData.caseNo}/${encodeURIComponent(caseData.caseName)}/officers`,
        { officers, blockedUsernames: [...blocked], assignedCaseManagerUsername: assignedCaseManager },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Send a notification to every Read Only user that was just added
      const newReadOnly = team.readOnly.filter((u) => !initialReadOnly.includes(u));
      await Promise.allSettled(
        newReadOnly.map((username) =>
          api.post(
            "/api/notifications",
            {
              notificationId: `${Date.now()}-${username}`,
              assignedBy:     adminUsername,
              assignedTo:     [{ username, role: "Read Only", status: "pending", unread: true }],
              action1:        "has granted you Read Only access to the case",
              post1:          `${caseData.caseNo}: ${caseData.caseName}`,
              caseId:         caseData._id || undefined,
              caseNo:         caseData.caseNo,
              caseName:       caseData.caseName,
              caseStatus:     "Open",
              unread:         true,
              type:           "Case",
              time:           new Date().toISOString(),
            },
            { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
          )
        )
      );

      onSaved(caseData.caseNo, team);
      onClose();
    } catch {
      setAlertMsg("Failed to save team changes.");
    } finally {
      setSaving(false);
    }
  };

  const resolveDisplay = (username) => {
    const u = allUsers.find((x) => x.username === username);
    return u ? fmtUserDisplay(u) : username;
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <AlertModal
          isOpen={!!alertMsg}
          title="Notice"
          message={alertMsg}
          onConfirm={() => setAlertMsg("")}
          onClose={() => setAlertMsg("")}
        />

        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>Manage Team</div>
            <div className={styles.modalSub}>Case #{caseData.caseNo}: {caseData.caseName}</div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className={styles.modalLoading}>Loading team…</div>
        ) : (
          <>
            <div className={styles.modalBody}>
              {ROLE_KEYS.map((roleKey) => {
                const canAdd = !NO_ADD_ROLES.has(roleKey);
                const occupiedByOtherRole = new Set(
                  roleKey === "officers"
                    ? [...team.detectiveSupervisors, ...team.caseManagers, ...team.investigators, ...team.readOnly].filter(u => !blocked.has(u))
                    : roleKey === "readOnly"
                    ? [...team.detectiveSupervisors, ...team.caseManagers, ...team.investigators, ...team.officers].filter(u => !blocked.has(u))
                    : []
                );
                const eligible = allUsers.filter(
                  (u) => USER_ROLE_FILTER[roleKey](u) && !occupiedByOtherRole.has(u.username)
                );
                const filtered = eligible.filter((u) => {
                  const q = search[roleKey].toLowerCase();
                  return !q || `${u.firstName} ${u.lastName} ${u.username}`.toLowerCase().includes(q);
                });
                const members = team[roleKey];

                return (
                  <div key={roleKey} className={styles.roleSection}>
                    <div className={styles.roleLabel}>
                      {ROLE_LABELS[roleKey]}
                      {!canAdd && (
                        <span className={styles.viewOnlyBadge}>remove only</span>
                      )}
                    </div>

                    {/* Current members — click ✕ to revoke access, click ↺ to restore */}
                    <div className={styles.memberList}>
                      {members.length === 0 ? (
                        <span className={styles.noMembers}>None assigned</span>
                      ) : (
                        members.map((uname) => {
                          const isBlocked = blocked.has(uname);
                          return (
                            <div
                              key={uname}
                              className={`${styles.memberChip} ${isBlocked ? styles.memberChipBlocked : ""}`}
                              title={isBlocked ? "Access revoked — click ↺ to restore" : ""}
                            >
                              <span>{resolveDisplay(uname)}</span>
                              <button
                                className={isBlocked ? styles.restoreBtn : styles.revokeBtn}
                                onClick={() => toggleBlock(uname)}
                                title={isBlocked ? "Restore access" : "Revoke access"}
                              >
                                {isBlocked ? "↺" : "✕"}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add member dropdown — only for investigators and readOnly */}
                    {canAdd && (
                      <div
                        className={styles.addDropWrap}
                        ref={(el) => (dropRefs.current[roleKey] = el)}
                      >
                        <button
                          className={styles.addBtn}
                          onClick={() => setDropOpen((prev) => ({ ...prev, [roleKey]: !prev[roleKey] }))}
                        >
                          + Add {ROLE_LABELS[roleKey].replace(/s$/, "")}
                        </button>
                        {dropOpen[roleKey] && (
                          <div className={styles.addDropdown}>
                            <input
                              autoFocus
                              type="text"
                              className={styles.addSearch}
                              placeholder="Search officer…"
                              value={search[roleKey]}
                              onChange={(e) => setSearch((prev) => ({ ...prev, [roleKey]: e.target.value }))}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className={styles.addList}>
                              {filtered.length === 0 ? (
                                <div className={styles.addEmpty}>No matches</div>
                              ) : (
                                filtered.map((u) => (
                                  <div
                                    key={u.username}
                                    className={`${styles.addItem} ${members.includes(u.username) ? styles.addItemActive : ""}`}
                                    onClick={() => add(roleKey, u.username)}
                                  >
                                    {fmtUser(u)}
                                    {members.includes(u.username) && <span className={styles.checkMark}>✓</span>}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Assigned To — single-select from current case managers */}
              <div className={styles.roleSection}>
                <div className={styles.roleLabel}>Assigned To</div>
                <div
                  className={styles.addDropWrap}
                  ref={atDropRef}
                >
                  <button
                    className={styles.addBtn}
                    style={{ fontWeight: "normal" }}
                    onClick={() => { setAtDropOpen((o) => !o); setAtSearch(""); }}
                  >
                    {assignedCaseManager ? resolveDisplay(assignedCaseManager) : "— None —"}
                  </button>
                  {atDropOpen && (
                    <div className={styles.addDropdown}>
                      <input
                        autoFocus
                        type="text"
                        className={styles.addSearch}
                        placeholder="Search case managers…"
                        value={atSearch}
                        onChange={(e) => setAtSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={styles.addList}>
                        <div
                          className={`${styles.addItem} ${!assignedCaseManager ? styles.addItemActive : ""}`}
                          onClick={() => { setAssignedCaseManager(""); setAtDropOpen(false); }}
                        >
                          — None —
                          {!assignedCaseManager && <span className={styles.checkMark}>✓</span>}
                        </div>
                        {team.caseManagers
                          .filter((uname) => !atSearch || resolveDisplay(uname).toLowerCase().includes(atSearch.toLowerCase()))
                          .map((uname) => (
                            <div
                              key={uname}
                              className={`${styles.addItem} ${assignedCaseManager === uname ? styles.addItemActive : ""}`}
                              onClick={() => { setAssignedCaseManager(uname); setAtDropOpen(false); }}
                            >
                              {resolveDisplay(uname)}
                              {assignedCaseManager === uname && <span className={styles.checkMark}>✓</span>}
                            </div>
                          ))}
                        {team.caseManagers.length === 0 && (
                          <div className={styles.addEmpty}>No case managers assigned</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.saveBtn} onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const statusDisplayLabel = (raw) => {
  if (raw === "SUBMITTED") return "Submitted";
  if (raw === "COMPLETED") return "Closed";
  return "Open";
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const AdminTeam = () => {
  const navigate = useNavigate();
  const { setSelectedCase } = useContext(CaseContext);

  const [showAddCase, setShowAddCase]   = useState(false);
  const [rawCases, setRawCases]         = useState([]);
  const [allUsers, setAllUsers]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [statusFilter, setStatusFilter] = useState("ONGOING");
  const [managingCase, setManagingCase] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(50);

  const emptyFilter = () => ({ caseNo: [], caseName: [], createdAtFmt: [], closedAtFmt: [], statusLabel: [], assignedTo: [] });
  const [sortConfig, setSortConfig]                     = useState({ key: null, direction: "asc" });
  const [filterConfig, setFilterConfig]                 = useState(emptyFilter());
  const [openFilter, setOpenFilter]                     = useState(null);
  const [filterSearch, setFilterSearch]                 = useState({});
  const [tempFilterSelections, setTempFilterSelections] = useState({});
  const filterButtonRefs = useRef({});

  // ─── Fetch cases ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem("token");
        const [casesRes, usersRes] = await Promise.all([
          api.get("/api/cases", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/api/users/usernames", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setRawCases(Array.isArray(casesRes.data) ? casesRes.data : []);
        setAllUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  useEffect(() => {
    setFilterConfig(emptyFilter());
    setSortConfig({ key: null, direction: "asc" });
    setTempFilterSelections({});
    setFilterSearch({});
    setOpenFilter(null);
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [filterConfig, sortConfig]);

  useEffect(() => {
    if (showAddCase) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [showAddCase]);

  // ─── Map cases ───────────────────────────────────────────────────────────────
  const lookupUser = (u) => {
    if (!u) return null;
    if (typeof u === "string") {
      const found = allUsers.find((x) => x.username === u);
      return found ? fmtUserDisplay(found) : u;
    }
    return fmtUserDisplay(u);
  };

  const isArchived = statusFilter === "ARCHIVED";

  const cases = useMemo(() => {
    return rawCases
      .filter((c) => isArchived ? c.status === "COMPLETED" : (c.status === "ONGOING" || c.status === "SUBMITTED"))
      .map((c) => {
        const cmNames = (c.caseManagerUserIds || []).map(lookupUser).filter(Boolean);
        return {
          _id:          c._id,
          caseNo:       c.caseNo  || "—",
          caseName:     c.caseName || "—",
          createdAt:    c.createdAt,
          createdAtFmt: formatDate(c.createdAt),
          closedAt:     c.archivedAt || c.updatedAt || null,
          closedAtFmt:  formatDate(c.archivedAt || c.updatedAt || null),
          status:       c.status || "—",
          statusLabel:  statusDisplayLabel(c.status),
          assignedTo:   lookupUser(c.assignedCaseManagerUserId) || "—",
          caseManagerNames: cmNames,
        };
      });
  }, [rawCases, isArchived, allUsers]);

  const counts = useMemo(() => ({
    ONGOING:  rawCases.filter((c) => c.status === "ONGOING" || c.status === "SUBMITTED").length,
    ARCHIVED: rawCases.filter((c) => c.status === "COMPLETED").length,
  }), [rawCases]);

  // ─── Distinct filter values ───────────────────────────────────────────────────
  const distinctValues = useMemo(() => {
    const map = { caseNo: new Set(), caseName: new Set(), createdAtFmt: new Set(), closedAtFmt: new Set(), assignedTo: new Set() };
    cases.forEach((c) => {
      map.caseNo.add(c.caseNo);
      map.caseName.add(c.caseName);
      map.createdAtFmt.add(c.createdAtFmt);
      map.closedAtFmt.add(c.closedAtFmt);
      if (c.assignedTo && c.assignedTo !== "—") map.assignedTo.add(c.assignedTo);
    });
    const result = Object.fromEntries(Object.entries(map).map(([k, s]) => [k, [...s]]));
    result.statusLabel = isArchived ? ["Closed"] : ["Open", "Submitted"];
    return result;
  }, [cases, isArchived]);

  // ─── Filter + sort ────────────────────────────────────────────────────────────
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
      const aV = String(a[sortConfig.key] ?? "");
      const bV = String(b[sortConfig.key] ?? "");
      const cmp = aV.localeCompare(bV);
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [cases, filterConfig, sortConfig]);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCases.slice(start, start + pageSize);
  }, [sortedCases, currentPage, pageSize]);

  // ─── Filter handlers ─────────────────────────────────────────────────────────
  const sortColumn      = (key, dir) => { setSortConfig({ key, direction: dir }); setCurrentPage(1); };
  const handleFilterSearch = (key, txt) => setFilterSearch((fs) => ({ ...fs, [key]: txt }));
  const allChecked      = (key) => (tempFilterSelections[key] || []).length === (distinctValues[key] || []).length;
  const toggleSelectAll = (key) => {
    const all = distinctValues[key] || [];
    setTempFilterSelections((ts) => ({ ...ts, [key]: ts[key]?.length === all.length ? [] : [...all] }));
  };
  const handleCheckboxToggle = (key, v) =>
    setTempFilterSelections((ts) => {
      const sel = ts[key] || [];
      return { ...ts, [key]: sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v] };
    });
  const applyFilter  = (key) => { setFilterConfig((fc) => ({ ...fc, [key]: tempFilterSelections[key] || [] })); setCurrentPage(1); setOpenFilter(null); };
  const cancelFilter = () => { setTempFilterSelections({}); setFilterSearch({}); setOpenFilter(null); };

  // ─── After save: refresh team display ────────────────────────────────────────
  const handleTeamSaved = (caseNo, newTeam) => {
    const token = localStorage.getItem("token");
    api.get("/api/cases", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setRawCases(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  // ─── Open case in CasePageManager ────────────────────────────────────────────
  const handleOpenCase = (c) => {
    const caseObj = { _id: c._id, caseNo: c.caseNo, caseName: c.caseName, role: "Case Manager" };
    setSelectedCase(caseObj);
    localStorage.setItem("selectedCase", JSON.stringify(caseObj));
    navigate("/CasePageManager", { state: { caseDetails: caseObj } });
  };

  const COLUMNS = isArchived
    ? ["Case No.", "Case Name", "Closed At", "Assigned To", "Status"]
    : ["Case No.", "Case Name", "Created At", "Assigned To", "Status"];

  const COL_KEY = {
    "Case No.":   "caseNo",
    "Case Name":  "caseName",
    "Created At": "createdAtFmt",
    "Closed At":  "closedAtFmt",
    "Assigned To": "assignedTo",
    "Status":     "statusLabel",
  };

  const COL_WIDTHS = {
    "Case No.":    "9%",
    "Case Name":   "25%",
    "Created At":  "13%",
    "Closed At":   "13%",
    "Assigned To": "23%",
    "Status":      "10%",
  };

  const tabs = [
    { key: "ONGOING",  label: "Open Cases"  },
    { key: "ARCHIVED", label: "Closed Cases" },
  ];

  return (
    <div className={styles["page-wrapper"]}>
      <Navbar />
      <div className={styles["main-container"]}>
        <SideBar variant="admin" onShowCaseSelector={setShowAddCase} showAddCase={showAddCase} />

        {managingCase && (
          <TeamModal
            caseData={managingCase}
            allUsers={allUsers}
            onClose={() => setManagingCase(null)}
            onSaved={handleTeamSaved}
          />
        )}

        <div className={styles["left-content"]}>
          {showAddCase ? (
            <AddCaseInline
              allUsers={allUsers}
              onAddCase={(newCase) => {
                if (newCase) setRawCases((prev) => [newCase, ...prev]);
                setShowAddCase(false);
              }}
            />
          ) : (
          <div className={styles["main-page-belowpart"]}>

            {/* Stats / tab bar */}
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
            </div>

            <div className={styles["content-section"]}>
              {loading && <p className={styles["state-msg"]}>Loading…</p>}
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
                              <th key={col} className={styles["column-header1"]} style={{ width: COL_WIDTHS[col], position: "relative", textAlign: col === "Status" ? "center" : "left" }}>
                                <div className={styles["header-title"]} style={col === "Status" ? { justifyContent: "center" } : {}}>
                                  {col}
                                  <span>
                                    <button
                                      ref={(el) => (filterButtonRefs.current[dataKey] = el)}
                                      onClick={() => setOpenFilter((prev) => (prev === dataKey ? null : dataKey))}
                                      aria-label={`Filter ${col}`}
                                    >
                                      <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles["icon-image"]} alt="filter" />
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
                          <th style={{ width: "20%", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCases.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "8px" }}>No cases found.</td>
                          </tr>
                        ) : (
                          paginatedCases.map((c) => (
                            <tr key={c._id}>
                              <td>{c.caseNo}</td>
                              <td>{c.caseName}</td>
                              <td>{isArchived ? c.closedAtFmt : c.createdAtFmt}</td>
                              <td>{c.assignedTo}</td>
                              <td style={{ textAlign: "center" }}>
                                <span className={`${styles["status-badge"]} ${c.statusLabel === "Submitted" ? styles["status-submitted"] : c.statusLabel === "Closed" ? styles["status-closed"] : styles["status-ongoing"]}`}>
                                  {c.statusLabel}
                                </span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <div className={styles["action-btns"]}>
                                  <button
                                    className={styles["manage-btn"]}
                                    onClick={() => setManagingCase({ _id: c._id, caseNo: c.caseNo, caseName: c.caseName })}
                                  >
                                    Manage Team
                                  </button>
                                  <button
                                    className={styles["open-case-btn"]}
                                    onClick={() => handleOpenCase(c)}
                                  >
                                    Open Case
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
          )}
        </div>
      </div>
    </div>
  );
};
