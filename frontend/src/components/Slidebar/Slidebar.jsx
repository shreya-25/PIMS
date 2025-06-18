import React, { useState, useEffect, useRef } from "react";
import { CaseContext } from "../../Pages/CaseContext";
import { useContext } from "react";
import "./Slidebar.css";
import api from "../../api"

export const SlideBar = ({ onAddCase, buttonClass = "add-case-button" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const managersRef = useRef(null);
  // const dropdownRef = useRef(null);
  const investigatorsRef = useRef(null);
   const [currentRole, setCurrentRole] = useState(""); 
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
  
  const { setSelectedCase, setToken } = useContext(CaseContext);
  const [managersOpen, setManagersOpen] = useState(false);
  const [investigatorsOpen, setInvestigatorsOpen] = useState(false);


  const [dropdownOpen, setDropdownOpen] = useState(false);

  const caseManagers = ["Officer 1", "Officer 2", "Officer 3", "Officer 916"];
  const investigators = [
    // { name: "Officer 1", assignedLeads: 2, totalAssignedLeads: 1, assignedDays: 5, unavailableDays: 4 },
    // { name: "Officer 2", assignedLeads: 3, totalAssignedLeads: 3, assignedDays: 3, unavailableDays: 3 },
    // { name: "Officer 3", assignedLeads: 3, totalAssignedLeads: 3, assignedDays: 2, unavailableDays: 1 },
    // { name: "Officer 4", assignedLeads: 4, totalAssignedLeads: 2, assignedDays: 6, unavailableDays: 2 },
  ];
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

  //   useEffect(() => {
  //   function handleClickOutside(e) {
  //     if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
  //       setDropdownOpen(false);
  //     }
  //   }
  //   if (dropdownOpen) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   } else {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   }
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [dropdownOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const toggleManagers   = () => setManagersOpen((o) => !o);
  const toggleInvestigators = () =>
    setInvestigatorsOpen((o) => !o);

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     const token = localStorage.getItem("token");
  //     try {
  //       const response = await api.get("/api/users/usernames", {
  //         // headers: {
  //         //   Authorization: `Bearer ${token}`,
  //         // },
  //       });
  
  //       const data = await response.json();
  
  //       if (!response.ok) {
  //         throw new Error(data.message || "Failed to fetch users");
  //       }
  
  //       setAllUsers(data.usernames); // assuming your API returns a list of user objects
  //     } catch (error) {
  //       console.error("❌ Error fetching users:", error);
  //     }
  //   };
  
  //   fetchUsers();
  // }, []);

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
  

  // const toggleDropdown = () => {
  //   setDropdownOpen(!dropdownOpen);
  // };

  // const toggleDropdown = () => {
  //   setDropdownOpen((prev) => !prev);
  // };
  

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setCaseDetails((prevDetails) => ({
      ...prevDetails,
      investigators: checked
        ? [...prevDetails.investigators, value]
        : prevDetails.investigators.filter((inv) => inv !== value),
    }));
  };


  

  // const handleDone = () => {
  //   if (caseDetails.title && caseDetails.number) {
  //     onAddCase({
  //       id: caseDetails.number,
  //       title: caseDetails.title,
  //       status: "ongoing",
  //       investigators: caseDetails.investigators,
  //     });
  //   }
  //   setCaseDetails({
  //     title: "",
  //     number: "",
  //     managerName: "",
  //     investigators: [],
  //     summary: "",
  //   });
  //   setIsSidebarOpen(false);
  // };
  
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
       alert("❌ Please fill all required fields: Case Title, Number, Manager");
       return;
     }
  
    setLoading(true);
    setError(null);
  
    const newCase = {
      id: caseDetails.number,
      title: caseDetails.title,
      status: "Ongoing",
      caseNo: caseDetails.number,
      caseName: caseDetails.title,
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
          alert("Please enter a valid username");
        } else if (
          data.error &&
          data.error.includes("dup key") &&
          data.error.includes("caseName")
        ) {
          alert("A case with this name already exists. Please choose a unique case name.");
        } else if (data.message === "Unauthorized: User details not found") {
          alert("User details not found. Please sign in again");
        } else if (data.message === "caseNo, caseName, and assignedOfficers are required") {
          alert("Please fill in the case number, case name, and select at least one assigned officer");
        } else if (data.message === "Case number already exists. Please use a unique caseNo.") {
          alert("A case with this number already exists. Please use a unique case number.");
        } else {
          alert(`❌ Error: ${data.message}`);
        }
        throw new Error(data.message || "Failed to create case");
      }
  
      alert("✅ Case Created Successfully!");
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

      const notificationRecipients = caseDetails.investigators.filter(
        (name) => name !== caseDetails.managerName
      );

      console.log("NotifRec", notificationRecipients);
  
if (notificationRecipients.length > 0) {
  const notificationPayload = {
    notificationId: Date.now().toString(),
    assignedBy:     caseDetails.managerName,
      assignedTo:     notificationRecipients.map(name => ({
    username: name,
    status: "pending"
  })),     // array of strings
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
  const msg = err.response?.data?.message;
  if (msg === "Case number already exists. Please use a unique caseNo.") {
    alert("A case with this number already exists. Please use a unique case number.");
  } else {
    alert(`❌ Error: ${msg || err.message}`);
  }
  setError(msg || err.message);
  console.error("❌ Error creating case:", err.response?.data || err.message);
} finally {
  setLoading(false);
}
  };
  
  

  return (
    <div>
      <button className={buttonClass} onClick={toggleSidebar}>
        <i className="fa-solid fa-plus"></i> Add Case
      </button>
      {isSidebarOpen && (
        <div className="slide-bar">
          <button className="close-btnAC" onClick={toggleSidebar}>
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
          
        <div className="form-group" ref={managersRef}>
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
</div>


          {/* ——— INVESTIGATORS ——— */}
          <div className="form-group" ref={investigatorsRef}>
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
