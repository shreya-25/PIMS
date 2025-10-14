import React, { useState, useEffect, useRef } from "react";
import { CaseContext } from "../../Pages/CaseContext";
import { AlertModal } from "../AlertModal/AlertModal";
import { useContext } from "react";
import "./Slidebar.css";
import api from "../../api"

export const SlideBar = ({ onAddCase, onClose,  isOpen,             
  hideTrigger = false,  buttonClass = "add-case-button" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const managersRef = useRef(null);
  // const dropdownRef = useRef(null);
  const investigatorsRef = useRef(null);
  const [currentRole, setCurrentRole] = useState(""); 
   const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [caseDetails, setCaseDetails] = useState({
    title: "",
    number: "",
    managers: [],
    detectiveSupervisor: "",
    investigators: [], // Store selected investigators
    summary: "",
    executiveCaseSummary:"",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
const managersSearchRef = useRef(null);
const investigatorsSearchRef = useRef(null);

const toDisplay = (u) =>
  `${u.firstName || ""} ${u.lastName || ""} (${u.username})`
    .replace(/\s+/g, " ")
    .trim();

const matches = (u, q) =>
  !q ? true : toDisplay(u).toLowerCase().includes(q.toLowerCase());

const filteredManagers = allUsers.filter((u) => matches(u, managersQuery));

const filteredInvestigators = allUsers.filter((u) => matches(u, investigatorsQuery));

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
        detectiveSupervisor: localStorage.getItem("loggedInUser"),
        managerName: localStorage.getItem("loggedInUser"),
      }));
    }
  }, [localStorage.getItem("loggedInUser")]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const toggleManagers   = () => setManagersOpen((o) => !o);
  const toggleInvestigators = () =>
    setInvestigatorsOpen((o) => !o);


  useEffect(() => {
    const fetchUsers = async () => {
      setError(null);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/users/usernames", {
          // headers: { Authorization: `Bearer ${token}` }
        });
        setAllUsers(data.users);
         const loggedInUsername = localStorage.getItem("loggedInUser");
        const me = data.users.find(u => u.username === loggedInUsername);
        if (me) setCurrentRole(me.role);
      } catch (err) {
        console.error("❌ Error fetching users:", err);
        setError("Could not load user list");
      } finally {
        setLoading(false);
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
  function handleClickOutside(e) {
    if (managersOpen && managersRef.current && !managersRef.current.contains(e.target)) {
      setManagersOpen(false);
      setManagersQuery(""); // optional
    }
    if (investigatorsOpen && investigatorsRef.current && !investigatorsRef.current.contains(e.target)) {
      setInvestigatorsOpen(false);
      setInvestigatorsQuery(""); // optional
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [managersOpen, investigatorsOpen]);

  

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setCaseDetails((prevDetails) => ({
      ...prevDetails,
      investigators: checked
        ? [...prevDetails.investigators, value]
        : prevDetails.investigators.filter((inv) => inv !== value),
    }));
  };
  
  const handleDone = async () => {
    const {
      title,
      number,
      managers,
      detectiveSupervisor,
      investigators,
      summary,
      executiveCaseSummary
    } = caseDetails;

    if (!title || !number || !managers || !detectiveSupervisor) {
       setAlertMessage("Please fill all required fields: Case Number, Name, and Managers");
       setAlertOpen(true);
       return;
     }
  
    setLoading(true);
    setError(null);
  
    const newCase = {
      id: caseDetails.number.trim(),
      title: caseDetails.title.trim(),
      status: "Ongoing",
      caseNo: caseDetails.number.trim(),
      caseName: caseDetails.title.trim(),
      role: "Case Manager",
      caseSummary: caseDetails.summary,
      executiveCaseSummary: caseDetails.executiveCaseSummary,
      managers: caseDetails.managers.map(username => ({ username })),
      detectiveSupervisor, 
      selectedOfficers: investigators.map(name => ({ name })),
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
  
      setAlertMessage("Case Created Successfully!");
      setAlertOpen(true);
      onAddCase(newCase);
      setCaseDetails({
        title: "",
        number: "",
        managers: [],
        investigators: [],
        summary: "",
        executiveCaseSummary: "",
        status: "Ongoing",
      });
      setIsSidebarOpen(false);

      const creator = signedInOfficer;
      const everyone = [
       { username: caseDetails.detectiveSupervisor, role: "Detective Supervisor" },
       ...caseDetails.managers.map(u => ({ username: u, role: "Case Manager" })),
       ...caseDetails.investigators.map(u => ({ username: u, role: "Investigator" }))
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
          action2:        "",                          // optional
          post1:          `${caseDetails.number}: ${caseDetails.title}`,
          post2:          "",                          // optional
          leadNo:         "",                          // optional for cases
          leadName:       "",                          // optional for cases
          caseNo:         caseDetails.number,
          caseName:       caseDetails.title,
          caseStatus:     "Open",
          type:           "Case",                      // <— REQUIRED by your schema
          // unread & time will get their defaults from the schema
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

  setError(msg);
  setAlertMessage(`Error creating case: ${msg}`);
  setAlertOpen(true);
} finally {
  setLoading(false);
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
            <label>Case Number:</label>
            <input
              type="text"
              name="number"
              value={caseDetails.number}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label>Case Name:</label>
            <input
              type="text"
              name="title"
              value={caseDetails.title}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
            { (
           <div className="form-group">
            <label>Detective Supervisor:</label>
            <select
              name="detectiveSupervisor"
              value={caseDetails.detectiveSupervisor}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="">Select Supervisor</option>
              {allUsers
              .filter(u => u.role === "Detective Supervisor")
              .map((u) => (
                <option key={u.username} value={u.username}>
                  {u.firstName} {u.lastName} ({u.username})
                </option>
              ))}
            </select>
          </div>
          )}
          
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
  <label htmlFor="cm-trigger">Case Managers:</label>

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
  <label htmlFor="inv-trigger">Investigators Assigned:</label>

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
        {caseDetails.investigators.length
      ? caseDetails.investigators.join(", ")
      : <span className="inv-selected-none">None selected</span>}

      {/* <span className="inv-input-label">
        {caseDetails.investigators.length
          ? caseDetails.investigators.join(", ") 
          : "Select Officers"}
      </span>
      <span className="inv-caret" aria-hidden /> */}
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
            <label>Summary:</label>
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
