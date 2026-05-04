import { useState, useEffect, useRef, useMemo } from "react";
import api from "../../api";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import styles from "./AddCaseInline.module.css";

export const AddCaseInline = ({ allUsers, onAddCase }) => {
  const signedInOfficer = localStorage.getItem("loggedInUser");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [caseDetails, setCaseDetails] = useState({
    title: "",
    number: "",
    managers: [],
    detectiveSupervisors: [],
    investigators: [],
    officers: [],
    summary: "",
    executiveCaseSummary: "",
    characterOfCase: "",
    assignedCaseManager: "",
    managerName: signedInOfficer || "",
  });

  const [managersOpen, setManagersOpen] = useState(false);
  const [investigatorsOpen, setInvestigatorsOpen] = useState(false);
  const [supervisorOpen, setSupervisorOpen] = useState(false);
  const [assignedToOpen, setAssignedToOpen] = useState(false);

  const [managersQuery, setManagersQuery] = useState("");
  const [investigatorsQuery, setInvestigatorsQuery] = useState("");
  const [supervisorQuery, setSupervisorQuery] = useState("");
  const [assignedToQuery, setAssignedToQuery] = useState("");

  const managersRef = useRef(null);
  const investigatorsRef = useRef(null);
  const supervisorRef = useRef(null);
  const assignedToRef = useRef(null);
  const managersSearchRef = useRef(null);
  const investigatorsSearchRef = useRef(null);
  const supervisorSearchRef = useRef(null);
  const assignedToSearchRef = useRef(null);

  const [rawCases, setRawCases] = useState([]);
  const [officerSearch, setOfficerSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    api
      .get("/api/cases", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setRawCases(data || []))
      .catch(() => {});
  }, []);

  const toDisplay = (u) => {
    const last = (u.lastName || "").trim();
    const first = (u.firstName || "").trim();
    const name = last && first ? `${last}, ${first}` : last || first || "";
    const uname = u.username ? ` (${u.username})` : "";
    const title = u.title ? ` (${u.title})` : "";
    return name ? `${name}${uname}${title}` : u.username || "";
  };

const matches = (u, q) =>
    !q || toDisplay(u).toLowerCase().includes(q.toLowerCase());

  const sortByName = (a, b) => toDisplay(a).localeCompare(toDisplay(b));

  const formatMultiSelect = (arr, placeholder) => {
    if (!arr.length) return placeholder;
    if (arr.length <= 2) return arr.join(", ");
    return `${arr.slice(0, 2).join(", ")} +${arr.length - 2}`;
  };

  const filteredManagers = allUsers
    .filter((u) => u.role === "Detective" || u.role === "Case Specific")
    .filter((u) => matches(u, managersQuery))
    .sort(sortByName);

  const filteredInvestigators = allUsers
    .filter((u) => u.role === "Detective" || u.role === "Case Specific")
    .filter((u) => matches(u, investigatorsQuery))
    .sort(sortByName);

  const filteredSupervisors = allUsers
    .filter((u) => u.role === "Detective Supervisor")
    .filter((u) => matches(u, supervisorQuery))
    .sort(sortByName);

  const officerWorkload = useMemo(() => {
    const counts = {};

    allUsers.forEach((u) => {
      if (
        u.role === "Detective" ||
        u.role === "Case Specific" ||
        u.role === "Detective Supervisor"
      ) {
        counts[u.username] = {
          user: u,
          assignedTo: 0,
          caseManager: 0,
          investigator: 0,
          other: 0,
        };
      }
    });

    rawCases.forEach((c) => {
      if (c.status !== "ONGOING") return;

      const assignedUname = c.assignedCaseManagerUserId?.username;
      if (assignedUname && counts[assignedUname]) counts[assignedUname].assignedTo++;

      (c.caseManagerUserIds || []).forEach((u) => {
        const uname = u?.username;
        if (uname && counts[uname]) counts[uname].caseManager++;
      });

      (c.investigatorUserIds || []).forEach((u) => {
        const uname = u?.username;
        if (uname && counts[uname]) counts[uname].investigator++;
      });

      (c.officerUserIds || []).forEach((u) => {
        const uname = u?.username;
        if (uname && counts[uname]) counts[uname].other++;
      });

      const supervisors = [
        ...(Array.isArray(c.detectiveSupervisorUserIds)
          ? c.detectiveSupervisorUserIds
          : []),
        ...(c.detectiveSupervisorUserId ? [c.detectiveSupervisorUserId] : []),
      ];

      supervisors.forEach((u) => {
        const uname = u?.username;
        if (uname && counts[uname]) counts[uname].other++;
      });
    });

    return Object.values(counts).sort((a, b) => {
      if (b.assignedTo !== a.assignedTo) return b.assignedTo - a.assignedTo;
      return toDisplay(a.user).localeCompare(toDisplay(b.user));
    });
  }, [allUsers, rawCases]);

  const filteredOfficerWorkload = useMemo(() => {
    if (!officerSearch.trim()) return officerWorkload;

    const q = officerSearch.toLowerCase();

    return officerWorkload.filter((o) => {
      const u = o.user;
      return `${u.firstName || ""} ${u.lastName || ""} ${u.username || ""} ${
        u.title || ""
      }`
        .toLowerCase()
        .includes(q);
    });
  }, [officerWorkload, officerSearch]);

  useEffect(() => {
    const { managers, assignedCaseManager } = caseDetails;

    if (managers.length === 0) {
      if (assignedCaseManager) {
        setCaseDetails((cd) => ({ ...cd, assignedCaseManager: "" }));
      }
    } else if (!assignedCaseManager || !managers.includes(assignedCaseManager)) {
      setCaseDetails((cd) => ({ ...cd, assignedCaseManager: managers[0] }));
    }
  }, [caseDetails.managers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        managersOpen &&
        managersRef.current &&
        !managersRef.current.contains(e.target)
      ) {
        setManagersOpen(false);
        setManagersQuery("");
      }

      if (
        investigatorsOpen &&
        investigatorsRef.current &&
        !investigatorsRef.current.contains(e.target)
      ) {
        setInvestigatorsOpen(false);
        setInvestigatorsQuery("");
      }

      if (
        supervisorOpen &&
        supervisorRef.current &&
        !supervisorRef.current.contains(e.target)
      ) {
        setSupervisorOpen(false);
        setSupervisorQuery("");
      }

      if (
        assignedToOpen &&
        assignedToRef.current &&
        !assignedToRef.current.contains(e.target)
      ) {
        setAssignedToOpen(false);
        setAssignedToQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [managersOpen, investigatorsOpen, supervisorOpen, assignedToOpen]);

  useEffect(() => {
    if (managersOpen) {
      setManagersQuery("");
      setTimeout(() => managersSearchRef.current?.focus(), 0);
    }
  }, [managersOpen]);

  useEffect(() => {
    if (investigatorsOpen) {
      setInvestigatorsQuery("");
      setTimeout(() => investigatorsSearchRef.current?.focus(), 0);
    }
  }, [investigatorsOpen]);

  useEffect(() => {
    if (supervisorOpen) {
      setSupervisorQuery("");
      setTimeout(() => supervisorSearchRef.current?.focus(), 0);
    }
  }, [supervisorOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCaseDetails((cd) => ({ ...cd, [name]: value }));
  };

  const handleDone = async () => {
    const {
      title,
      number,
      managers,
      detectiveSupervisors,
      assignedCaseManager,
    } = caseDetails;

    if (
      !title ||
      !number ||
      !managers.length ||
      !detectiveSupervisors.length ||
      !assignedCaseManager
    ) {
      setAlertMessage(
        "Please fill all required fields: Case Number, Name, Managers, Detective Supervisor, and Assigned To"
      );
      setAlertOpen(true);
      return;
    }

    if (!/^[A-Za-z0-9-]+$/.test(number)) {
      setAlertMessage(
        "Case number can only contain letters, digits, and hyphens (-). No spaces or other special characters allowed."
      );
      setAlertOpen(true);
      return;
    }

    const newCase = {
      id: caseDetails.number.trim(),
      title: caseDetails.title.trim(),
      status: "Ongoing",
      caseNo: caseDetails.number.trim(),
      caseName: caseDetails.title.trim(),
      role: "",
      caseSummary: caseDetails.summary,
      executiveCaseSummary: caseDetails.executiveCaseSummary,
      characterOfCase: caseDetails.characterOfCase,
      managers: caseDetails.managers.map((username) => ({ username })),
      detectiveSupervisors: caseDetails.detectiveSupervisors,
      selectedOfficers: caseDetails.investigators.map((name) => ({ name })),
      officers: caseDetails.officers.map((name) => ({ username: name })),
      assignedCaseManager: caseDetails.assignedCaseManager,
    };

    const token = localStorage.getItem("token");

    try {
      const response = await api.post("/api/cases", newCase, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status !== 201) {
        const data = response.data;
        let msg = data.message || "Failed to create case";

        if (data.error?.includes("dup key") && data.error?.includes("caseName")) {
          msg =
            "A case with this name already exists. Please choose a unique case name.";
        }

        setAlertMessage(msg);
        setAlertOpen(true);
        return;
      }

      const createdCase = response.data;

      setAlertMessage("Case Created Successfully!");
      setAlertOpen(true);
      onAddCase?.(createdCase);

      const creator = signedInOfficer;

      const everyone = [
        ...caseDetails.detectiveSupervisors.map((u) => ({
          username: u,
          role: "Detective Supervisor",
        })),
        ...caseDetails.managers.map((u) => ({
          username: u,
          role: "Case Manager",
        })),
        ...caseDetails.investigators.map((u) => ({
          username: u,
          role: "Investigator",
        })),
        ...caseDetails.officers.map((u) => ({
          username: u,
          role: "Officer",
        })),
      ];

      const notificationRecipients = everyone.filter(
        (p) => p.username !== creator
      );

      if (notificationRecipients.length > 0) {
        const notificationPayload = {
          notificationId: Date.now().toString(),
          assignedBy: caseDetails.managerName,
          assignedTo: notificationRecipients.map((p) => ({
            username: p.username,
            role: p.role,
            status: "pending",
            unread: true,
          })),
          action1: "assigned you to a new case",
          post1: `${caseDetails.number}: ${caseDetails.title}`,
          caseId: createdCase._id || createdCase.id,
          caseNo: caseDetails.number,
          caseName: caseDetails.title,
          caseStatus: "Open",
          type: "Case",
        };

        try {
          await api.post("/api/notifications", notificationPayload, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (notifErr) {
          console.error("Notification error:", notifErr);
        }
      }
    } catch (err) {
      const serverData = err.response?.data;
      const msg =
        serverData?.message ||
        (typeof serverData === "string"
          ? serverData
          : JSON.stringify(serverData, null, 2)) ||
        err.message ||
        "Unknown error";

      setAlertMessage(`Error creating case: ${msg}`);
      setAlertOpen(true);
    }
  };

  return (
    <div className={styles.wrapper}>
      <AlertModal
        isOpen={alertOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={() => setAlertOpen(false)}
      />

      <div className={styles.body}>
        {/* ── Left: Form ── */}
        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Add a New Case</h2>
            <div className={styles.headerBtns}>
              <button className={styles.doneBtn} onClick={handleDone}>Add Case</button>
            </div>
          </div>

          {/* Row 1: Case Number | Case Name */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Case Number <span className={styles.required}>*</span></label>
              <input type="text" name="number" value={caseDetails.number} onChange={handleInputChange} className={styles.input} placeholder="e.g. CASE-001" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Case Name <span className={styles.required}>*</span></label>
              <input type="text" name="title" value={caseDetails.title} onChange={handleInputChange} className={styles.input} />
            </div>
          </div>

          {/* Row 2: Character of Case | Detective Supervisor */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Character of Case</label>
              <input type="text" name="characterOfCase" value={caseDetails.characterOfCase} onChange={handleInputChange} className={styles.input} />
            </div>
            <div className={styles.dropdownGroup} ref={supervisorRef}>
            <label className={styles.label}>
              Detective Supervisor <span className={styles.required}>*</span>
            </label>
            <div className={styles.dropdown}>
              <button
                type="button"
                className={styles.dropdownTrigger}
                onClick={() => setSupervisorOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={supervisorOpen}
              >
                <span className={styles.triggerText}>
                  {caseDetails.detectiveSupervisors.length
                    ? caseDetails.detectiveSupervisors.join(", ")
                    : "Select Supervisors"}
                </span>
                <span className={styles.caret} />
              </button>

              {supervisorOpen && (
                <div
                  className={styles.dropdownMenu}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <input
                    ref={supervisorSearchRef}
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Filter supervisors…"
                    value={supervisorQuery}
                    onChange={(e) => setSupervisorQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />

                  <div className={styles.dropdownList}>
                    {filteredSupervisors.length ? (
                      filteredSupervisors.map((u) => (
                        <label key={u.username} className={styles.dropdownItem}>
                          <input
                            type="checkbox"
                            checked={caseDetails.detectiveSupervisors.includes(
                              u.username
                            )}
                            onChange={(e) => {
                              const checked = e.target.checked;

                              setCaseDetails((cd) => ({
                                ...cd,
                                detectiveSupervisors: checked
                                  ? [...cd.detectiveSupervisors, u.username]
                                  : cd.detectiveSupervisors.filter(
                                      (x) => x !== u.username
                                    ),
                              }));
                            }}
                          />
                          <span>{toDisplay(u)}</span>
                        </label>
                      ))
                    ) : (
                      <div className={styles.noMatches}>No matches</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>{/* close DS dropdownGroup */}
          </div>{/* close Row 2 formRow */}

          {/* Row 3: Case Managers | Assigned To */}
          <div className={styles.formRow}>
            <div className={styles.dropdownGroup} ref={managersRef}>
              <label className={styles.label}>Case Managers <span className={styles.required}>*</span></label>
              <div className={styles.dropdown}>
                <button type="button" className={styles.dropdownTrigger} onClick={() => setManagersOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={managersOpen}>
                  <span className={styles.triggerText}>{formatMultiSelect(caseDetails.managers, "Select Case Managers")}</span>
                  <span className={styles.caret} />
                </button>
                {managersOpen && (
                  <div className={styles.dropdownMenu} onMouseDown={(e) => e.stopPropagation()}>
                    <input ref={managersSearchRef} type="text" className={styles.dropdownSearch} placeholder="Filter officers…" value={managersQuery} onChange={(e) => setManagersQuery(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
                    <div className={styles.dropdownList}>
                      {filteredManagers.length ? filteredManagers.map((u) => (
                        <label key={u.username} className={styles.dropdownItem}>
                          <input type="checkbox" checked={caseDetails.managers.includes(u.username)} onChange={(e) => { const checked = e.target.checked; setCaseDetails((cd) => ({ ...cd, managers: checked ? [...cd.managers, u.username] : cd.managers.filter((x) => x !== u.username) })); }} />
                          <span>{toDisplay(u)}</span>
                        </label>
                      )) : <div className={styles.noMatches}>No matches</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.dropdownGroup} ref={assignedToRef}>
              <label className={styles.label}>Assigned To <span className={styles.required}>*</span></label>
              <div className={styles.dropdown}>
                <button type="button" className={styles.dropdownTrigger} onClick={() => { setAssignedToOpen((o) => !o); setAssignedToQuery(""); }} aria-haspopup="listbox" aria-expanded={assignedToOpen}>
                  <span className={styles.triggerText}>
                    {caseDetails.assignedCaseManager || "Select Assigned To"}
                  </span>
                  <span className={styles.caret} />
                </button>
                {assignedToOpen && (
                  <div className={styles.dropdownMenu} onMouseDown={(e) => e.stopPropagation()}>
                    <input ref={assignedToSearchRef} type="text" className={styles.dropdownSearch} placeholder="Filter…" value={assignedToQuery} onChange={(e) => setAssignedToQuery(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
                    <div className={styles.dropdownList}>
                      {caseDetails.managers.filter((uname) => { const u = allUsers.find((x) => x.username === uname); return !assignedToQuery || (u ? toDisplay(u) : uname).toLowerCase().includes(assignedToQuery.toLowerCase()); }).map((uname) => {
                        const u = allUsers.find((x) => x.username === uname);
                        return (
                          <div key={uname} className={styles.dropdownItem} onClick={() => { setCaseDetails((cd) => ({ ...cd, assignedCaseManager: uname })); setAssignedToOpen(false); }}>
                            <span>{u ? toDisplay(u) : uname}</span>
                            {caseDetails.assignedCaseManager === uname && <span style={{ marginLeft: "auto" }}>✓</span>}
                          </div>
                        );
                      })}
                      {caseDetails.managers.length === 0 && <div className={styles.noMatches}>Add Case Managers first</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>{/* close Row 3 formRow */}

          {/* Row 4: Investigators Assigned (full width) */}
          <div className={styles.dropdownGroup} ref={investigatorsRef}>
              <label className={styles.label}>Investigators Assigned</label>
              <div className={styles.dropdown}>
                <button type="button" className={styles.dropdownTrigger} onClick={() => setInvestigatorsOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={investigatorsOpen}>
                  <span className={styles.triggerText}>{formatMultiSelect(caseDetails.investigators, "Select Investigators")}</span>
                  <span className={styles.caret} />
                </button>
                {investigatorsOpen && (
                  <div className={styles.dropdownMenu} onMouseDown={(e) => e.stopPropagation()}>
                    <input ref={investigatorsSearchRef} type="text" className={styles.dropdownSearch} placeholder="Filter officers…" value={investigatorsQuery} onChange={(e) => setInvestigatorsQuery(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
                    <div className={styles.dropdownList}>
                      {filteredInvestigators.length ? filteredInvestigators.map((u) => (
                        <label key={u.username} className={styles.dropdownItem}>
                          <input type="checkbox" checked={caseDetails.investigators.includes(u.username)} onChange={(e) => { const checked = e.target.checked; setCaseDetails((cd) => ({ ...cd, investigators: checked ? [...cd.investigators, u.username] : cd.investigators.filter((x) => x !== u.username) })); }} />
                          <span>{toDisplay(u)}</span>
                        </label>
                      )) : <div className={styles.noMatches}>No matches</div>}
                    </div>
                  </div>
                )}
              </div>
          </div>

          {/* Row 5: Summary (full width, grows to fill remaining height) */}
          <div className={styles.formGroup} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <label className={styles.label}>Summary</label>
            <textarea name="summary" value={caseDetails.summary} onChange={handleInputChange} className={styles.textarea} style={{ flex: 1, height: "auto", minHeight: 80 }} />
          </div>
        </div>{/* close formPanel */}

        {/* ── Right: Officer Workload ── */}
        <div className={styles.officerPanel}>
          <h3 className={styles.panelTitle}>Officers & Workload</h3>
          <input type="text" className={styles.officerSearch} placeholder="Search officers" value={officerSearch} onChange={(e) => setOfficerSearch(e.target.value)} />
          <div className={styles.officerList}>
            {filteredOfficerWorkload.length ? filteredOfficerWorkload.map((o) => (
              <div key={o.user.username} className={styles.officerCard}>
                <div className={styles.officerName}>{toDisplay(o.user)}</div>
                <div className={styles.officerSystemRole}>{o.user.role}</div>
                <div className={styles.assignedCount}>Assigned To: {o.assignedTo} {o.assignedTo === 1 ? "case" : "cases"}</div>
                <div className={styles.officerCounts}>
                  <span className={`${styles.countBadge} ${styles.cmBadge}`}>Case Manager: {o.caseManager}</span>
                  <span className={`${styles.countBadge} ${styles.invBadge}`}>Investigator: {o.investigator}</span>
                  <span className={`${styles.countBadge} ${styles.otherBadge}`}>Other: {o.other}</span>
                </div>
              </div>
            )) : <div className={styles.noOfficers}>No officers found</div>}
          </div>
        </div>
      </div>
    </div>
  );
};