import React, { useState, useEffect } from "react";
import { CaseContext } from "../../Pages/CaseContext";
import { useContext } from "react";
import "./Slidebar.css";

export const SlideBar = ({ onAddCase, buttonClass = "add-case-button" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [caseDetails, setCaseDetails] = useState({
    title: "",
    number: "",
    managerName: "",
    investigators: [], // Store selected investigators
    summary: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  
    const { setSelectedCase, setToken, withAutoRefresh } = useContext(CaseContext);


  const [dropdownOpen, setDropdownOpen] = useState(false);

  const caseManagers = ["Officer 1", "Officer 2", "Officer 3", "Officer 916"];
  const investigators = [
    { name: "Officer 1", assignedLeads: 2, totalAssignedLeads: 1, assignedDays: 5, unavailableDays: 4 },
    { name: "Officer 2", assignedLeads: 3, totalAssignedLeads: 3, assignedDays: 3, unavailableDays: 3 },
    { name: "Officer 3", assignedLeads: 3, totalAssignedLeads: 3, assignedDays: 2, unavailableDays: 1 },
    { name: "Officer 4", assignedLeads: 4, totalAssignedLeads: 2, assignedDays: 6, unavailableDays: 2 },
  ];
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCaseDetails({ ...caseDetails, [name]: value });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("http://localhost:5000/api/users/usernames", {
          // headers: {
          //   Authorization: `Bearer ${token}`,
          // },
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch users");
        }
  
        setAllUsers(data.usernames); // assuming your API returns a list of user objects
      } catch (error) {
        console.error("❌ Error fetching users:", error);
      }
    };
  
    fetchUsers();
  }, []);

  // const toggleDropdown = () => {
  //   setDropdownOpen(!dropdownOpen);
  // };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };
  

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
    if (!caseDetails.title || !caseDetails.number || !caseDetails.managerName) {
      alert("❌ Please fill all required fields: Case Title, Number, Manager");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    // const newCase = {
    //   caseNo: caseDetails.number,
    //   caseName: caseDetails.title,
    //   caseSummary: caseDetails.summary,
    //   username: caseDetails.managerName,
    //   selectedOfficers: caseDetails.investigators.map((name) => ({ name })),
    // };

    const newCase = {
      id: caseDetails.number,            // Added id property
      title: caseDetails.title,            // Added title property
      status: "Ongoing",                   // Added status property
      caseNo: caseDetails.number,
      caseName: caseDetails.title,
      role: "Case Manager",
      caseSummary: caseDetails.summary,
      username: caseDetails.managerName,
      selectedOfficers: caseDetails.investigators.map((name) => ({ name })),
    };
  
    // Retrieve token from localStorage or context
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch("http://localhost:5000/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Add Authorization Header
        },
        body: JSON.stringify(newCase),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        if (data.message === "Username is required to assign Case Manager") {
          alert("Please enter a valid username");
        } 
        else if (data.error && data.error.includes("dup key") && data.error.includes("caseName")) {
          alert("A case with this name already exists. Please choose a unique case name.");
        } 
        else if (data.error && data.error.includes("dup key") && data.error.includes("caseName")) {
          alert("A case with this name already exists. Please choose a unique case name.");
        }else if (data.message === "Unauthorized: User details not found") {
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
  
      onAddCase(newCase); // Update UI
      setCaseDetails({
        title: "",
        number: "",
        managerName: "",
        investigators: [],
        summary: "",
        status: "Ongoing"
      });
  
      setIsSidebarOpen(false);

      // Now send a notification to all assigned officers
    // Build a notification object using case details:
    const notificationPayload = {
      notificationId: Date.now().toString(), // using timestamp as a unique id; customize as needed
      assignedBy: caseDetails.managerName,
      assignedTo: caseDetails.investigators, // list of usernames (officers)
      action1: "assigned a new case",
      post1: caseDetails.title,
      leadNo: "",
      leadName: "",
      caseNo: caseDetails.number,
      caseName: caseDetails.title,
      caseStatus: "Open",
      unread: true,
      accepted: false,
      time: new Date().toISOString(),
    };

    // Send notification (assumes your server is running on port 5000)
    const notifResponse = await fetch("http://localhost:5000/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(notificationPayload),
    });
    
    const notifData = await notifResponse.json();
    
    if (!notifResponse.ok) {
      console.error("Notification error:", notifData);
      // Optionally, notify the user that notification sending failed
    } else {
      console.log("Notification sent successfully:", notifData);
    }


    } catch (err) {
      setError(err.message);
      console.error("❌ Error creating case:", err);
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
            <label>Case Title:</label>
            <input
              type="text"
              name="title"
              value={caseDetails.title}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label>Case Manager Name:</label>
            <select
              name="managerName"
              value={caseDetails.managerName}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="">Select Case Manager</option>
              {allUsers.map((manager, index) => (
                <option key={index} value={manager}>
                  {manager}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Investigators Assigned:</label>
            <div className="custom-dropdown">
              <div className="input-field" onClick={toggleDropdown}>
                {caseDetails.investigators.length > 0 ? caseDetails.investigators.join(", ") : "Select Officers"}
                <span className="dropdown-icon"></span>
              </div>
              {dropdownOpen && (
                <div className="dropdown-options">
                  {/* {allUsers.map((officer) => {
                    const isAvailable =
                      officer.unavailableDays === 0
                        ? "Available"
                        : `Unavailable for ${officer.unavailableDays} days`;

                    return (
                      <div key={officer.name} className="dropdown-item">
                        <input
                          type="checkbox"
                          id={officer.name}
                          value={officer.name}
                          checked={caseDetails.investigators.includes(officer.name)}
                          onChange={handleCheckboxChange}
                        />
                        <label htmlFor={officer.name}>
                          {officer.name} [{officer.assignedLeads}] [{officer.totalAssignedLeads}] 
                          <em style={{ fontSize: "20px", color: "gray" }}>({isAvailable})</em>
                        </label>
                      </div>
                    );
                  })} */}

                  {allUsers.map((officerName, index) => (
                            <div key={index} className="dropdown-item">
                              <input
                                type="checkbox"
                                id={officerName}
                                value={officerName}
                                checked={caseDetails.investigators.includes(officerName)}
                                onChange={handleCheckboxChange}
                              />
                              <label htmlFor={officerName}>{officerName}</label>
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
