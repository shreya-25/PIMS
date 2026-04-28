import { useState, useEffect, useRef } from "react";
import { AlertModal } from "../AlertModal/AlertModal";
import "./Slidebar.css";
import api from "../../api"

export const SlideBar = ({ onAddCase, onClose,  isOpen,             
  hideTrigger = false,  buttonClass = "add-case-button" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const managersRef = useRef(null);
  // const dropdownRef = useRef(null);
  const investigatorsRef = useRef(null);

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
    executiveCaseSummary:"",
    characterOfCase: "",
  });

  const [allUsers, setAllUsers] = useState([]);

  // keep internal state in sync with parent
  useEffect(() => {
    if (typeof isOpen === "boolean") setIsSidebarOpen(isOpen);
  }, [isOpen]);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => {
    setIsSidebarOpen(false);
    onClose?.();
  };
  
  const [managersOpen, setManagersOpen] = useState(false);
  const [investigatorsOpen, setInvestigatorsOpen] = useState(false);
  const signedInOfficer = localStorage.getItem("loggedInUser");

  const [managersQuery, setManagersQuery] = useState("");
const [investigatorsQuery, setInvestigatorsQuery] = useState("");
const [officersQuery, setOfficersQuery] = useState("");
const [supervisorQuery, setSupervisorQuery] = useState("");
const [supervisorOpen, setSupervisorOpen] = useState(false);
const [officersOpen, setOfficersOpen] = useState(false);
const supervisorRef = useRef(null);
const officersRef = useRef(null);
const managersSearchRef = useRef(null);
const investigatorsSearchRef = useRef(null);
const officersSearchRef = useRef(null);
const supervisorSearchRef = useRef(null);

const toDisplay = (u) => {
  const last  = (u.lastName  || "").trim();
  const first = (u.firstName || "").trim();
  const name  = last && first ? `${last}, ${first}` : last || first || "";
  const uname = u.username ? ` (${u.username})` : "";
  const title = u.title    ? ` (${u.title})`    : "";
  return name ? `${name}${uname}${title}` : u.username || "";
};

const matches = (u, q) =>
  !q ? true : toDisplay(u).toLowerCase().includes(q.toLowerCase());

const sortByName = (a, b) => toDisplay(a).localeCompare(toDisplay(b));

const filteredManagers = allUsers
  .filter((u) => u.role === "Detective" || u.role === "Case Specific")
  .filter((u) => matches(u, managersQuery))
  .sort(sortByName);

const filteredInvestigators = allUsers
  .filter((u) => u.role === "Detective" || u.role === "Case Specific")
  .filter((u) => matches(u, investigatorsQuery))
  .sort(sortByName);

const filteredOfficers = allUsers
  .filter((u) => u.role === "Detective" || u.role === "Case Specific")
  .filter((u) => matches(u, officersQuery))
  .sort(sortByName);

const filteredSupervisors = allUsers
  .filter((u) => u.role === "Detective Supervisor")
  .filter((u) => matches(u, supervisorQuery))
  .sort(sortByName);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCaseDetails({ ...caseDetails, [name]: value });
  };

    useEffect(() => {
    function handleClickOutside(e) {
      if (
        managersOpen &&
        managersRef.current &&
        !managersRef.current.contains(e.target)
      ) {
        setManagersOpen(false);
      }
      if (
        investigatorsOpen &&
        investigatorsRef.current &&
        !investigatorsRef.current.contains(e.target)
      ) {
        setInvestigatorsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [managersOpen, investigatorsOpen]);

  useEffect(() => {
    if (localStorage.getItem("loggedInUser")) {
      setCaseDetails(cd => ({
        ...cd,
        managerName: localStorage.getItem("loggedInUser"),
      }));
    }
  }, [localStorage.getItem("loggedInUser")]);

  const toggleInvestigators = () => setInvestigatorsOpen((o) => !o);


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/api/users/usernames");
        setAllUsers(data.users);
      } catch (err) {
        console.error("❌ Error fetching users:", err);
      }
    };
  
    fetchUsers();
  }, []);

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

useEffect(() => {
  if (officersOpen) {
    setOfficersQuery("");
    setTimeout(() => officersSearchRef.current?.focus(), 0);
  }
}, [officersOpen]);


useEffect(() => {
  function handleClickOutside(e) {
    if (managersOpen && managersRef.current && !managersRef.current.contains(e.target)) {
      setManagersOpen(false);
      setManagersQuery(""); // optional
    }
    if (investigatorsOpen && investigatorsRef.current && !investigatorsRef.current.contains(e.target)) {
      setInvestigatorsOpen(false);
      setInvestigatorsQuery(""); // optional
    }
    if (supervisorOpen && supervisorRef.current && !supervisorRef.current.contains(e.target)) {
      setSupervisorOpen(false);
      setSupervisorQuery("");
    }
    if (officersOpen && officersRef.current && !officersRef.current.contains(e.target)) {
      setOfficersOpen(false);
      setOfficersQuery("");
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [managersOpen, investigatorsOpen, supervisorOpen, officersOpen]);

  

  const handleDone = async () => {
    const { title, number, managers, detectiveSupervisors, investigators, officers } = caseDetails;

    if (!title || !number || !managers.length || !detectiveSupervisors.length) {
       setAlertMessage("Please fill all required fields: Case Number, Name, Managers, and at least one Detective Supervisor");
       setAlertOpen(true);
       return;
     }

    if (!/^[A-Za-z0-9-]+$/.test(number)) {
      setAlertMessage("Case number can only contain letters, digits, and hyphens (-). No spaces or other special characters allowed.");
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
      managers: caseDetails.managers.map(username => ({ username })),
      detectiveSupervisors,
      selectedOfficers: investigators.map(name => ({ name })),
      officers: officers.map(name => ({ username: name })),
    };
  
    const token = localStorage.getItem("token");
  
    try {
      // 1) Create the case
      const response = await api.post(
        "/api/cases",
        newCase,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data;
  
      if (response.status !== 201) {
        // replicate your original error checks
        if (data.message === "Username is required to assign Case Manager") {
          setAlertMessage("Please enter a valid username");
          setAlertOpen(true);
        } else if (
          data.error &&
          data.error.includes("dup key") &&
          data.error.includes("caseName")
        ) {
          // alert("A case with this name already exists. Please choose a unique case name.");
          setAlertMessage("A case with this name already exists. Please choose a unique case name.");
          setAlertOpen(true);
        } else if (data.message === "Unauthorized: User details not found") {
          // alert("User details not found. Please sign in again");
          setAlertMessage("User details not found. Please sign in again");
          setAlertOpen(true);
        } else if (data.message === "caseNo, caseName, and assignedOfficers are required") {
          // alert("Please fill in the case number, case name, and select at least one assigned officer");
          setAlertMessage("Please fill in the case number, case name, and select at least one assigned officer");
          setAlertOpen(true);
        } else if (data.message === "Case number already exists. Please use a unique caseNo.") {
          // alert("A case with this number already exists. Please use a unique case number.");
          setAlertMessage("A case with this number already exists. Please use a unique case number.");
          setAlertOpen(true);
        } else {
          // alert(`❌ Error: ${data.message}`);
          setAlertMessage(`Error: ${data.message}`);
          setAlertOpen(true);
        }
        throw new Error(data.message || "Failed to create case");
      }
  
      // setAlertMessage("Case Created Successfully!");
      // setAlertOpen(true);
      // onAddCase(newCase);
      // setCaseDetails({
      //   title: "",
      //   number: "",
      //   managers: [],
      //   investigators: [],
      //   summary: "",
      //   executiveCaseSummary: "",
      //   status: "Ongoing",
      // });
      // setIsSidebarOpen(false);
      setAlertMessage("Case Created Successfully!");
setAlertOpen(true);

// use the *real* created case from backend:
const createdCase = response.data;
onAddCase?.(createdCase);

setCaseDetails({
  title: "",
  number: "",
  managers: [],
  detectiveSupervisors: [],
  investigators: [],
  officers: [],
  summary: "",
  executiveCaseSummary: "",
  characterOfCase: "",
  status: "Ongoing",
});
setIsSidebarOpen(false);


      const creator = signedInOfficer;
      const everyone = [
       ...caseDetails.detectiveSupervisors.map(u => ({ username: u, role: "Detective Supervisor" })),
       ...caseDetails.managers.map(u => ({ username: u, role: "Case Manager" })),
       ...caseDetails.investigators.map(u => ({ username: u, role: "Investigator" })),
       ...caseDetails.officers.map(u => ({ username: u, role: "Officer" })),
      ];

      const notificationRecipients = everyone.filter(person => person.username !== creator);

      const assignedToPayload = notificationRecipients.map(person => ({
       username: person.username,
       role:     person.role,
       status:   "pending",
       unread:   true
     }));
  
      if (notificationRecipients.length > 0) {
        const notificationPayload = {
          notificationId: Date.now().toString(),
          assignedBy:     caseDetails.managerName,
          assignedTo:     assignedToPayload,
          action1:        "assigned you to a new case",
          post1:          `${caseDetails.number}: ${caseDetails.title}`,
          caseId:         createdCase._id || createdCase.id,
          caseNo:         caseDetails.number,
          caseName:       caseDetails.title,
          caseStatus:     "Open",
          type:           "Case",
        };

        try {
          const notifResponse = await api.post(
            "/api/notifications",
            notificationPayload,
            {
              headers: {
                "Content-Type":  "application/json",
                Authorization:   `Bearer ${token}`
              }
            }
          );
          console.log("✅ Notification sent:", notifResponse.data);
          // refreshNotifications();
          // triggerRefresh();
        } catch (notifErr) {
          console.error("❌ Notification error:", notifErr.response?.data || notifErr);
        }
      } else {
        console.log("ℹ️ No investigators selected to receive notification.");
      }

      } catch (err) {
  // Try to pull out a server‐side “message” field
  const serverData = err.response?.data;
  const msg =
    serverData?.message                                 // your API’s own .message
    || (typeof serverData === "string"                  // if it’s just a string
        ? serverData
        : JSON.stringify(serverData, null, 2))         // or stringify the object
    || err.message                                     // or the JS error
    || "Unknown error";

  setAlertMessage(`Error creating case: ${msg}`);
  setAlertOpen(true);
  }
  };
  
  

  return (
    <div>

      <AlertModal
        isOpen={alertOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={()   => setAlertOpen(false)}
      />

        {!hideTrigger && (
        <button className={buttonClass} onClick={openSidebar}>
          <i className="fa-solid fa-plus"></i> Add Case
        </button>
      )}

      {/* <button className={buttonClass} onClick={toggleSidebar}>
        <i className="fa-solid fa-plus"></i> Add Case
      </button> */}
      {isSidebarOpen && (
        <div className="slide-bar">
          <button className="close-btnAC" onClick={closeSidebar}>
            &times;
          </button>
          <h3>Add Case</h3>
          <div className="form-group">
            <label>Case Number</label>
            <input
              type="text"
              name="number"
              value={caseDetails.number}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label>Case Name</label>
            <input
              type="text"
              name="title"
              value={caseDetails.title}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
               <div className="form-group">
            <label>Character of Case</label>
            <input
              type="text"
              name="characterOfCase"
              value={caseDetails.characterOfCase}
              onChange={handleInputChange}
              className="input-field"
              placeholder=""
            />
          </div>
          <div className="inv-select-group" ref={supervisorRef}>
            <label htmlFor="ds-trigger">Detective Supervisor</label>

            <div className="inv-dropdown">
              <button
                id="ds-trigger"
                type="button"
                className="inv-input"
                onClick={() => setSupervisorOpen((o) => !o)}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && setSupervisorOpen((o) => !o)
                }
                aria-haspopup="listbox"
                aria-expanded={supervisorOpen}
                title={caseDetails.detectiveSupervisors.join(", ") || "Select Supervisors"}
              >
                <span className="inv-input-label">
                  {caseDetails.detectiveSupervisors.length
                    ? caseDetails.detectiveSupervisors.join(", ")
                    : "Select Supervisors"}
                </span>
                <span className="inv-caret" aria-hidden />
              </button>

              {supervisorOpen && (
                <div className="inv-options" role="listbox" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="inv-search-wrap">
                    <input
                      ref={supervisorSearchRef}
                      type="text"
                      className="inv-search"
                      placeholder="Type to filter supervisors…"
                      value={supervisorQuery}
                      onChange={(e) => setSupervisorQuery(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="inv-list">
                    {filteredSupervisors.length ? (
                      filteredSupervisors.map((u) => {
                        const checked = caseDetails.detectiveSupervisors.includes(u.username);
                        return (
                          <label key={u.username} className="inv-item">
                            <input
                              type="checkbox"
                              value={u.username}
                              checked={checked}
                              onChange={(e) => {
                                const { value, checked } = e.target;
                                setCaseDetails((cd) => ({
                                  ...cd,
                                  detectiveSupervisors: checked
                                    ? [...cd.detectiveSupervisors, value]
                                    : cd.detectiveSupervisors.filter((x) => x !== value),
                                }));
                              }}
                            />
                            <span className="inv-text">{toDisplay(u)}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="inv-empty">No matches</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
        {/* <div className="form-group" ref={managersRef}>
  <label>Case Managers:</label>
  <div className="custom-dropdown">
    <div
      className="input-field"
      onClick={() => {
        console.log("toggleManagers:", !managersOpen);
        setManagersOpen(o => !o);
      }}
    >
      {caseDetails.managers.length
        ? caseDetails.managers.join(", ")
        : "Select Case Managers"}
      <span className="dropdown-icon" />
    </div>

    {managersOpen && (
      <div className="dropdown-options">
        {allUsers
          .map(u => (
            <div key={u.username} className="dropdown-item">
              <label>
                <input
                  type="checkbox"
                  value={u.username}
                  checked={caseDetails.managers.includes(u.username)}
                  onChange={e => {
                    const { value, checked } = e.target;
                    setCaseDetails(cd => ({
                      ...cd,
                      managers: checked
                        ? [...cd.managers, value]
                        : cd.managers.filter(x => x !== value),
                    }));
                  }}
                />
                {u.firstName} {u.lastName} ({u.username})
              </label>
            </div>
          ))}
      </div>
    )}
  </div>
</div> */}

<div className="inv-select-group" ref={managersRef}>
  <label htmlFor="cm-trigger">Case Managers</label>

  <div className="inv-dropdown">
    {/* Trigger shows selected usernames (or placeholder) */}
    <button
      id="cm-trigger"
      type="button"
      className="inv-input"
      onClick={() => setManagersOpen((o) => !o)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setManagersOpen((o) => !o)}
      aria-haspopup="listbox"
      aria-expanded={managersOpen}
      title={
        caseDetails.managers.length
          ? caseDetails.managers.join(", ")
          : "Select Case Managers"
      }
    >
      <span className="inv-input-label">
        {caseDetails.managers.length
          ? caseDetails.managers.join(", ") // or map to display names, see note below
          : "Select Case Managers"}
      </span>
      <span className="inv-caret" aria-hidden />
    </button>

    {managersOpen && (
      <div className="inv-options" role="listbox" onMouseDown={(e) => e.stopPropagation()}>
        {/* Sticky search */}
        <div className="inv-search-wrap">
          <input
            ref={managersSearchRef}
            type="text"
            className="inv-search"
            placeholder="Type to filter officers…"
            value={managersQuery}
            onChange={(e) => setManagersQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* List */}
        <div className="inv-list">
          {filteredManagers.length ? (
            filteredManagers.map((u) => {
              const checked = caseDetails.managers.includes(u.username);
              return (
                <label key={u.username} className="inv-item">
                  <input
                    type="checkbox"
                    value={u.username}
                    checked={checked}
                    onChange={(e) => {
                      const { value, checked } = e.target;
                      setCaseDetails((cd) => ({
                        ...cd,
                        managers: checked
                          ? [...cd.managers, value]
                          : cd.managers.filter((x) => x !== value),
                      }));
                    }}
                  />
                  <span className="inv-text">{toDisplay(u)}</span>
                </label>
              );
            })
          ) : (
            <div className="inv-empty">No matches</div>
          )}
        </div>
      </div>
    )}
  </div>
</div>





          {/* ——— INVESTIGATORS ——— */}
          {/* <div className="form-group" ref={investigatorsRef}>
            <label>Investigators Assigned:</label>
            <div className="custom-dropdown">
              <div className="input-field" onClick={toggleInvestigators}>
                {caseDetails.investigators.length > 0
                  ? caseDetails.investigators.join(", ")
                  : "Select Officers"}
                <span className="dropdown-icon" />
              </div>
              {investigatorsOpen && (
                <div className="dropdown-options">
                  {allUsers.map((u) => (
                    <div key={u.username} className="dropdown-item">
                      <input
                        type="checkbox"
                        id={`inv-${u.username}`}
                        value={u.username}
                        checked={caseDetails.investigators.includes(u.username)}
                        onChange={(e) => {
                          const { value, checked } = e.target;
                          setCaseDetails((cd) => ({
                            ...cd,
                            investigators: checked
                              ? [...cd.investigators, value]
                              : cd.investigators.filter((x) => x !== value),
                          }));
                        }}
                      />
                      <label htmlFor={`inv-${u.username}`}>
                        {u.firstName} {u.lastName} ({u.username})
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> */}
<div className="inv-select-group" ref={investigatorsRef}>
  <label htmlFor="inv-trigger">Investigators Assigned</label>

  <div className="inv-dropdown" aria-live="polite">
    <button
      id="inv-trigger"
      type="button"
      className="inv-input"
      onClick={toggleInvestigators}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleInvestigators()}
      aria-haspopup="listbox"
      aria-expanded={investigatorsOpen}
      title={
        caseDetails.investigators.length
          ? caseDetails.investigators.join(", ")
          : "Select Officers"
      }
    >
      <span className="inv-input-label">
        {caseDetails.investigators.length
          ? caseDetails.investigators.join(", ")
          : "Select Investigators"}
      </span>
      <span className="inv-caret" aria-hidden />
    </button>

    {investigatorsOpen && (
      <div className="inv-options" role="listbox" onMouseDown={(e) => e.stopPropagation()}>
        <div className="inv-search-wrap">
          <input
            ref={investigatorsSearchRef}
            type="text"
            className="inv-search"
            placeholder="Type to filter officers…"
            value={investigatorsQuery}
            onChange={(e) => setInvestigatorsQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>

        <div className="inv-list">
          {filteredInvestigators.length ? (
            filteredInvestigators.map((u) => {
              const checked = caseDetails.investigators.includes(u.username);
              return (
                <label key={u.username} className="inv-item">
                  <input
                    type="checkbox"
                    value={u.username}
                    checked={checked}
                    onChange={(e) => {
                      const { value, checked } = e.target;
                      setCaseDetails((cd) => ({
                        ...cd,
                        investigators: checked
                          ? [...cd.investigators, value]
                          : cd.investigators.filter((x) => x !== value),
                      }));
                    }}
                  />
                  <span className="inv-text">{toDisplay(u)}</span>
                </label>
              );
            })
          ) : (
            <div className="inv-empty">No matches</div>
          )}
        </div>
      </div>
    )}
  </div>
</div>

          <div className="form-group">
            <label>Summary</label>
            <textarea
              name="summary"
              value={caseDetails.summary}
              onChange={handleInputChange}
              className="input-field textarea-field"
            />
          </div>
          {/* <div className="form-group">
            <h4>Upload any relevant document to the case</h4>
            <input type="file" className="input-field" />
          </div> */}
          <button className="done-button" onClick={handleDone}>
            Done
          </button>
        </div>
      )}
    </div>
  );
};
