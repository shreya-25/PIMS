import React, { useContext, useState, useEffect} from 'react';

import Navbar from '../../components/Navbar/Navbar';
import Searchbar from '../../components/Searchbar/Searchbar';
import Button from '../../components/Button/Button';
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import './LeadReview.css';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";
import api from "../../api"; // adjust the path as needed
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";
import {SideBar } from "../../components/Sidebar/Sidebar";
import { AlertModal } from "../../components/AlertModal/AlertModal";




export const LeadReview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Grab case details from location.state
  const { caseDetails } = location.state || {};
  const { leadId, leadDescription } = location.state || {};
  const leadEntries = location.state?.leadEntries || [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingRoute, setPendingRoute]   = useState(null);
  const [caseTeam, setCaseTeam] = useState({ detectiveSupervisor: "", caseManagers: [], investigators: [] });
  const [originalAssigned, setOriginalAssigned] = useState([]);
  const signedInOfficer = localStorage.getItem("loggedInUser");
  const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [leads, setLeads] = useState({
            assignedLeads: [],
            pendingLeads: [],
            pendingLeadReturns: [],
            allLeads: [],
       } );

  const { selectedCase, setSelectedLead , selectedLead, leadStatus, setLeadStatus} = useContext(CaseContext);
  const statuses = [
    "Lead Created",
    "Lead Assigned",
    "Lead Accepted",
    "Lead Return Submitted",
    "Lead Approved",
    "Lead Returned",
    "Lead Completed",
  ];

  const statusToIndex = {
    Assigned:               1,  // maps to "Lead Assigned"
    Accepted:                2,  // maps to "Lead Accepted"
    "In Review":            3,  // if you also use "In Review"
    Submitted:              3,  // or map your own submission status here
    Approved:               4,  // "Lead Approved"
    Returned:               5,  // "Lead Returned"
    Completed:              6,  // "Lead Completed"
  };

  useEffect(() => {
    if (!selectedCase?.caseNo) return;
    const token = localStorage.getItem("token");
    api.get(`/api/cases/${selectedCase.caseNo}/team`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(resp => {
      setCaseTeam({
        detectiveSupervisor: resp.data.detectiveSupervisor,
        caseManagers:         resp.data.caseManagers,
        investigators:       resp.data.investigators
      });
    }).catch(console.error);
  }, [selectedCase.caseNo]);

console.log ("case team ====", caseTeam);

const handleSave = async () => {
  try {
    const token = localStorage.getItem("token");
    setLoading(true);

    // 1) Normalize parentLeadNo exactly as before
    const normalizedParent = typeof leadData.parentLeadNo === "string"
      ? leadData.parentLeadNo
          .split(",")
          .map((item) => Number(item.trim()))
          .filter((num) => !isNaN(num))
      : leadData.parentLeadNo;

    const previousUsernames = originalAssigned;

    console.log("leadData.assignedTo (raw):", leadData.assignedTo);
    console.log("previousUsernames:", originalAssigned);
    console.log("assignedOfficers:", assignedOfficers);

    // 2) Build `assignedTo` from your array of usernames (`assignedOfficers`)
    const processedAssignedTo = assignedOfficers.map(username => {
    const existing = Array.isArray(leadData.assignedTo)
      ? leadData.assignedTo.find(item => {
          const name = typeof item === 'string' ? item : item.username;
          return name === username;
        })
      : null;

      console.log("existing", existing);
      return {
        username,
        status: existing?.status || "pending"
      };
    });

    // const newlyAdded = assignedOfficers.filter((u) => !previousUsernames.includes(u));
    const newlyAdded = assignedOfficers.filter(u => !originalAssigned.includes(u));

     if (newlyAdded.length) {
       // build full investigators list (old caseTeam + new)
       const updatedInvestigators = Array.from(new Set([
        ...caseTeam.investigators,
        ...newlyAdded
      ]));

       // assemble your officers array exactly as in CreateLead
       const officers = [
         ...(caseTeam.detectiveSupervisor
            ? [{ name: caseTeam.detectiveSupervisor,
                 role: "Detective Supervisor",
                 status: "accepted" }]
            : []),
          ...caseTeam.caseManagers.map(name => ({
          name,
          role:   "Case Manager",
          status: "accepted"
         })),
         ...updatedInvestigators.map(name => ({
           name,
           role:   "Investigator",
           status: "pending"
         }))
       ];
       // push them into the case in one PUT
       await api.put(
         `/api/cases/${encodeURIComponent(selectedCase.caseNo)}/${encodeURIComponent(selectedCase.caseName)}/officers`,
         { officers },
         { headers: { Authorization: `Bearer ${token}` } }
       );
       // refresh your local caseTeam so the sidebar stays up-to-date
       const teamResp = await api.get(
         `/api/cases/${selectedCase.caseNo}/team`,
         { headers: { Authorization: `Bearer ${token}` } }
       );
       setCaseTeam({
         detectiveSupervisor: teamResp.data.detectiveSupervisor,
         caseManagers:         teamResp.data.caseManagers,
         investigators:       teamResp.data.investigators
       });
     }

    // 5) For each newly added officer, send a notification
    for (let username of newlyAdded) {
      await api.post(
        "/api/notifications",
        {
          notificationId: Date.now().toString(),
          assignedBy: signedInOfficer,         // the current user assigning the lead
          assignedTo: [{
            username,
            role:     "Investigator",           
            status:   "pending",
            unread:   true
          }],
          action1: "assigned you to a new lead",
          post1:   `${leadData.leadNo}: ${leadData.description}`,
          caseNo:   leadData.caseNo,
          caseName: leadData.caseName,
          leadNo: leadData.leadNo,
          leadName: leadData.description,
          caseStatus: selectedCase.caseStatus || "Open",
          type: "Lead"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    // 3) Merge everything into one payload
    const processedLeadData = {
      ...leadData,
      parentLeadNo: normalizedParent,
      assignedTo: processedAssignedTo
    };

    // 4) Fire the PUT exactly as before, but with `assignedTo` added
    await api.put(
      `/api/lead/update/${leadData.leadNo}/${encodeURIComponent(leadData.description)}/${leadData.caseNo}/${encodeURIComponent(leadData.caseName)}`,
      processedLeadData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // alert("Lead updated successfully!");
    setAlertMessage("Lead updated successfully!");
       setAlertOpen(true);
      } catch (err) {
        console.error("Save failed:", err);
        setError("Failed to save changes.");
      } finally {
        setLoading(false);
      }
};


const acceptLead = async (leadNo, description) => {
  console.log("Accept button clicked for lead:", leadNo);

  try {
    const token = localStorage.getItem("token");
    const url = `/api/lead/${leadNo}/${encodeURIComponent(description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`;
    console.log("PUT request URL:", url);

    const response = await api.put(
      url,
      {}, // backend handles default payload
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    //  await api.post(
    //   "/api/notifications",
    //   {
    //     notificationId: Date.now().toString(),
    //     assignedBy: signedInOfficer,
    //     assignedTo: [{
    //         username: leadData.assignedBy,
    //         role:     "Case Manager",           
    //         status:   "pending",
    //         unread:   true
    //       }],
    //     action1: "accepted the lead",
    //     post1:   `${leadNo}: ${description}`,
    //     caseNo:   selectedCase.caseNo,
    //     caseName: selectedCase.caseName,
    //     leadNo: leadNo,
    //     leadName: description,
    //     caseStatus: selectedCase.caseStatus || "Open",
    //     type: "Lead"
    //   },
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );

    console.log("PUT request succeeded. Response data:", response.data);

    // Update UI immediately
    setLeadData(prev => ({
      ...prev,
      leadStatus: "Accepted",
    }));

    // alert("✅ Lead accepted successfully!");
    setAlertMessage("Lead accepted successfully!");
       setAlertOpen(true);
  } catch (error) {
    console.error("Error updating lead status:", error.response?.data || error);
    // alert("❌ Failed to accept lead.");
    setAlertMessage("Failed to accept lead.");
       setAlertOpen(true);
  }
};


 const declineLead = async (leadNo, description) => {
  const token = localStorage.getItem("token");
  try {

    // 2) Remove *this* officer from the assignedTo array
    await api.put(
      `/api/lead/${leadNo}/${encodeURIComponent(description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/removeAssigned/${signedInOfficer}`,

      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 3) Optimistically update local UI
    setLeadData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.filter(u => u.username !== signedInOfficer)
    }));

    // 4) Notify the Case Manager
    // await api.post(
    //   "/api/notifications",
    //   {
    //     notificationId: Date.now().toString(),
    //     assignedBy: signedInOfficer,          // you
    //     assignedTo: [{
    //         username: leadData.assignedBy,
    //         role:     "Case Manager",           
    //         status:   "pending",
    //         unread:   true
    //       }],
    //     action1: "declined the lead",
    //     post1:   `${leadNo}: ${description}`,
    //     caseNo:   selectedCase.caseNo,
    //     caseName: selectedCase.caseName,
    //      leadNo: leadNo,
    //     leadName: description,
    //     caseStatus: selectedCase.caseStatus || "Open",
    //     type: "Lead"
    //   },
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );

    // alert("❌ You’ve declined the lead, been removed from assigned list, and the Case Manager has been notified.");
    setAlertMessage("Lead is successfully declined");
       setAlertOpen(true);
    navigate('/Investigator', { replace: true });
  } catch (err) {
    console.error("Error declining lead:", err);
    // alert("❌ Failed to decline lead.");
    setAlertMessage("Failed to decline lead.");
       setAlertOpen(true);
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return ""; // Handle empty dates
    const date = new Date(dateString);
    if (isNaN(date)) return ""; // Handle invalid dates
  
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-4
    ); // Get last two digits of the year
  
    return `${month}/${day}/${year}`;
  };


  // Default case summary if no data is passed
  const defaultCaseSummary = "";
  // For demonstration, we store lead-related data
  const [leadData, setLeadData] = useState({
    leadNumber: '',
    parentLeadNo: '',
    incidentNo: '',
    subNumber: '',
    associatedSubNumbers: [],
    assignedDate: '',
    dueDate: '',
    summary: '',
    assignedBy: '',
    description: '',
    assignedTo: [],
    caseNo: '',
    caseName: "",
    leadStatus: '', 
    assignedTo: [],
    
  });

  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};

const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
const [leadDropdownOpen1, setLeadDropdownOpen1] = useState(true);

const onShowCaseSelector = (route) => {
  navigate(route, { state: { caseDetails } });
};

console.log("SL, SC", selectedLead, selectedCase);
  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
      const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

      if (lead?.leadNo && lead?.leadName && kase?.caseNo && kase?.caseName) {
        const token = localStorage.getItem("token");

        const response = await api.get(
          `/api/lead/lead/${lead.leadNo}/${encodeURIComponent(lead.leadName)}/${kase.caseNo}/${encodeURIComponent(kase.caseName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
          console.log("Fetched Lead Data1:", response.data);

          // if (response.data.length > 0) {
          //   setLeadData(response.data[0]); // Assuming one lead is returned
          // } else {
          //   setError("No lead data found.");
          // }

          if (response.data.length > 0) {
            setLeadData({
              ...response.data[0], 
              assignedOfficer: response.data[0].assignedOfficer || [],
              assignedTo: response.data[0].assignedTo || [],
              leadStatus: response.data[0].leadStatus || ''
            });
          }

          if (Array.isArray(response.data[0].assignedTo)) {
            setOriginalAssigned(
              response.data[0].assignedTo.map(item =>
                typeof item === "string" ? item : item.username
              )
            );
          // and initialize your “assignedOfficers” checkboxes to match:
            setAssignedOfficers(
              response.data[0].assignedTo.map(item =>
                typeof item === "string" ? item : item.username
              )
            );
          }
          
        }
      } catch (err) {
        console.error("Error fetching lead data:", err);
        setError("Failed to fetch lead data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [selectedLead, selectedCase]);

  // useEffect(() => {
  //           // whenever leadData.assignedTo changes, snapshot its original usernames
  //           if (Array.isArray(leadData.assignedTo)) {
  //             setOriginalAssigned(
  //               leadData.assignedTo.map(item =>
  //                 typeof item === "string" ? item : item.username
  //               )
  //             );
  //           }
  //         }, [leadData.assignedTo]);

    // fall back to 0 (“Lead Created”) if you get an unexpected value
const currentStatusIndex = statusToIndex[leadData.leadStatus] ?? 0;


  // For subnumbers
  const [availableSubNumbers] = useState([
    "SUB-000001", "SUB-000002", "SUB-000003", "SUB-000004", "SUB-000005"
  ]);
  const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]);
      const [assignedOfficers, setAssignedOfficers] = useState([]);
  
      const handleSelectLead = (lead) => {
        setSelectedLead({
          leadNo: lead.leadNo,
          leadName: lead.description,
          caseName: lead.caseName,
          caseNo: lead.caseNo,
        });
      
        setShowSelectModal(false);
        navigate(pendingRoute, {
          state: {
            caseDetails: selectedCase,
            leadDetails: lead
          }
        });
        
        setPendingRoute(null);
      };

useEffect(() => {
  if (Array.isArray(leadData.assignedTo)) {
    const usernames = leadData.assignedTo.map(item =>
      typeof item === "string" ? item : item.username
    );
    setAssignedOfficers(usernames);
  }
}, [leadData.assignedTo]);
  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  // Navigation and tab states
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Input change handler
  const handleInputChange = (field, value) => {
    // Example: Only allow digits for 'leadNumber'
    if (field === 'leadNumber' && !/^\d*$/.test(value)) {
      // alert("Lead Number must be numeric.");
       setAlertMessage("Lead Number must be numeric.");
       setAlertOpen(true);
      return;
    }
    setLeadData({ ...leadData, [field]: value });
  };

  // Reusable navigation
  const handleNavigation = (route) => {
    navigate(route);
  };

  const [caseSummary, setCaseSummary] = useState('' ||  defaultCaseSummary);

  const [isEditing, setIsEditing] = useState(false); // Controls whether the textarea is editable
  useEffect(() => {
   const fetchCaseSummary = async () => {
     try {
       if (selectedCase && selectedCase.caseNo) {
         const token = localStorage.getItem("token");
         const response = await api.get(`/api/cases/summary/${selectedCase.caseNo}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         // Update case summary if data is received
         console.log("Response data:", response.data);
         if (response.data) {
           setCaseSummary(response.data.summary );
         }
       }
     } catch (error) {
       console.error("Error fetching case summary:", error);
     }
   };

   fetchCaseSummary();
 }, [selectedCase]);

 // somewhere at the top of your component
const dueDateISO = leadData?.dueDate
? new Date(leadData.dueDate).toISOString().split("T")[0]
: "";

const isInvestigator = selectedCase?.role === "Investigator";
const [allUsers, setAllUsers] = useState([]);

useEffect(() => {
  const fetchUsers = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/api/users/usernames", {
          // headers: { Authorization: `Bearer ${token}` }
        });
        setAllUsers(data.users || []);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      setError("Could not load user list");
    } finally {
      setLoading(false);
    }
  };

  fetchUsers();
}, []);

const isEditableByCaseManager = field => {
  const editableFields = [
    "parentLeadNo",        // Lead Origin
    "assignedTo",          // Assigned Officers
    "dueDate",             // Due Date
    "subNumber",           // Subnumber
    "associatedSubNumbers" // Associated Subnumbers
  ];
  return selectedCase?.role === "Case Manager" && editableFields.includes(field);
};



  return (
    <div className="lead-review-page">
      {/* Navbar */}
      <Navbar />
       <AlertModal
              isOpen={alertOpen}
              title="Notification"
              message={alertMessage}
              onConfirm={() => setAlertOpen(false)}
              onClose={()   => setAlertOpen(false)}
            />

      {/* Main Container */}
      <div className="lead-review-container1">

       <SideBar  activePage="CasePageManager" />
     
        {/* Content Area */}
        <div className="lead-main-content">
          {/* Page Header */}

           {(leadData.leadStatus !== "Assigned" || selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") && (
                   <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item active" > Lead Information</span>
          <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LRInstruction", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                    // alert("Please select a case and lead first.");
                     setAlertMessage("Please select a case and lead first.");
                     setAlertOpen(true);
                  }
                }}>Add/View Lead Return</span>
          <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/ChainOfCustody", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                    // alert("Please select a case and lead first.");
                     setAlertMessage("Please select a case and lead first.");
                     setAlertOpen(true);
                  }
                }}>Lead Chain of Custody</span>
          
        </div>
      </div>
                  )}


          <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>

          <h5 className="side-titleRight">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${leadData.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${leadData?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>

          </div>

          <div className="case-header">
            <h1> {selectedLead?.leadNo ? `LEAD: ${selectedLead.leadNo} | ${selectedLead.leadName?.toUpperCase()}` : "LEAD DETAILS"} </h1>
          </div>

               
 {leadData.leadStatus === "Assigned" && selectedCase.role !== "Case Manager" &&  selectedCase.role !== "Detective Supervisor" && (
  <div
    className="accept-reject-section"
    style={{
      marginTop: "30px",
      padding: "20px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9",
    }}
  >
    <h3 style={{ marginBottom: "15px" }}>
      Do you want to Accept / Reject this lead?
    </h3>
    <div style={{ display: "flex", gap: "20px" }}>
      <button
        className="save-btn1"
        onClick={() => acceptLead(leadData.leadNo, leadData.description)}
      >
        Accept
      </button>

      <button
        className="decline-btnNC"
        // style={{ backgroundColor: "#ffdddd", color: "#a00" }}
        onClick={() => declineLead(leadData.leadNo, leadData.description)}
          
      >
        Reject
      </button>
    </div>
  </div>
)}



          {/* Additional Lead Details (Bottom Table) */}
          <div className="form_and_tracker">
          <div className="form-section">
            <table className="details-table">
              <tbody>
                <tr>
                  <td className="info-label">Case Number</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.caseNo}
                      onChange={(e) => handleInputChange('caseNo', e.target.value)}
                      // readOnly={isInvestigator}
                       readOnly={true}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="info-label">Case Name</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.caseName}
                      onChange={(e) => handleInputChange('caseName', e.target.value)}
                      // readOnly={isInvestigator}
                       readOnly={true}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="info-label">Assigned Date</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={formatDate(leadData.assignedDate)}
                      onChange={(e) => handleInputChange('assignedDate', e.target.value)}
                      placeholder="MM/DD/YY"
                       readOnly={true}
                    />
                  </td>
                </tr>

                <tr>
                  <td className="info-label">Lead Log Summary</td>
                  <td>
                    <textarea
                      className="input-field"
                      value={leadData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder=""
                      // readOnly={isInvestigator}
                       readOnly={true}
                    ></textarea>
                  </td>
                </tr>
                <tr>
                  <td className="info-label">Lead Instruction</td>
                  <td>
                    <textarea
                      className="input-field"
                      value={leadData.summary}
                      onChange={(e) => handleInputChange('summary', e.target.value)}
                      placeholder=""
                      // readOnly={isInvestigator}
                       readOnly={true}
                    ></textarea>
                  </td>
                </tr>

                <tr>
                  <td className="info-label">Lead Origin</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.parentLeadNo}
                      onChange={(e) => handleInputChange('parentLeadNo', e.target.value)}
                      placeholder="NA"
                      readOnly={!isEditableByCaseManager("parentLeadNo")}
                    />
                  </td>
                </tr>

<tr>
  <td className="info-label">Assigned Officers</td>
  <td>
    {isInvestigator ? (
      <div className="dropdown-header">
        {assignedOfficers.join(", ")}
      </div>
    ) : (
      <div className="custom-dropdown">
        <div
          className="dropdown-header"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {assignedOfficers.length >0
            ? assignedOfficers
                .map(u => {
                  const usr = allUsers.find(x => x.username === u);
                  return usr
                    ? `${usr.username}`
                    : u;
                })
                .join(", ")
            : "Select Officers"}
          <span className="dropdown-icon">
            {dropdownOpen ? "▲" : "▼"}
          </span>
        </div>
        {dropdownOpen && (
          <div className="dropdown-options">
            {allUsers.map(user => (
              <div key={user.username} className="dropdown-item">
                <input
                  type="checkbox"
                  id={user.username}
                  value={user.username}
                  checked={assignedOfficers.includes(user.username)}
                  onChange={e => {
                    const next = e.target.checked
                      ? [...assignedOfficers, user.username]
                      : assignedOfficers.filter(u => u !== user.username);
                    setAssignedOfficers(next);
                    setLeadData(prev => ({
                      ...prev,
                      assignedTo: next
                    }));
                  }}
                />
                <label htmlFor={user.username}>
                  {user.firstName} {user.lastName} ({user.username})
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </td>
</tr>




                <tr>
                  <td className="info-label">Assigned By</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.assignedBy}
                      onChange={(e) => handleInputChange('assignedBy', e.target.value)}
                      placeholder=""
                      readOnly={true}
                    />
                  </td>
                </tr>

                {/* Another example date field */}
                <tr>
                  <td className="info-label">Due Date</td>
                  <td>
                    <input
                          type="date"
                          className="input-field"
                          value={dueDateISO}
                          onChange={e => {
                            // e.target.value is “YYYY-MM-DD”
                            const newIso = new Date(e.target.value).toISOString();
                            // now update your leadData however you persist it:
                            setLeadData({ ...leadData, dueDate: newIso });
                          }}
                          readOnly={!isEditableByCaseManager("dueDate")}
                        />
                  </td>
                </tr>
                <tr>
                  <td className="info-label">Subnumber</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.subNumber}
                    placeholder=""
                     onChange={(e) => handleInputChange('subNumber', e.target.value)}
  readOnly={!isEditableByCaseManager("subNumber")}
                    />
                  </td>
                </tr>

                <tr>
  <td className="info-label" style={{ width: "25%" }}>Associated Subnumbers</td>
  <td>
    {!isEditableByCaseManager("associatedSubNumbers") ? (
      <div className="dropdown-header"   style={{
          padding: "8px 10px",
          minHeight: "25px",
          border: "1px solid #ccc",
          borderRadius: "4px",
         
        }}>
        {associatedSubNumbers.length > 0
          ? associatedSubNumbers.join(", ")
          : ""}
      </div>
    ) : (
      <div className="custom-dropdown">
        <div
          className="dropdown-header"
          onClick={() => setSubDropdownOpen(!subDropdownOpen)}
        >
          {associatedSubNumbers.length > 0
            ? associatedSubNumbers.join(", ")
            : "Select Subnumbers"}
          <span className="dropdown-icon">{subDropdownOpen ? "▲" : "▼"}</span>
        </div>
        {subDropdownOpen && (
          <div className="dropdown-options">
            {availableSubNumbers.map((subNum) => (
              <div key={subNum} className="dropdown-item">
                <input
                  type="checkbox"
                  id={subNum}
                  value={subNum}
                  checked={associatedSubNumbers.includes(subNum)}
                  onChange={(e) => {
                    const updatedSubs = e.target.checked
                      ? [...associatedSubNumbers, e.target.value]
                      : associatedSubNumbers.filter((num) => num !== e.target.value);

                    setAssociatedSubNumbers(updatedSubs);
                    setLeadData((prevData) => ({
                      ...prevData,
                      associatedSubNumbers: updatedSubs,
                    }));
                  }}
                />
                <label htmlFor={subNum}>{subNum}</label>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </td>
</tr>

              </tbody>
            </table>
             {!isInvestigator && (
  <div className="update-lead-btn">
    <button className="save-btn1" onClick={handleSave}>
      Save Changes
    </button>
    {error && <div className="error">{error}</div>}
  </div>
)}
          </div>


            {(leadData.leadStatus !== "Assigned" || selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") && (
            <div className="lead-tracker-container">
              {statuses.map((status, idx) => (
                <div
                  key={idx}
                  className="lead-tracker-row"
                  onClick={() => {
                    if (status === "Lead Return Submitted") handleNavigation("/LRInstruction");
                  }}
                  style={{ cursor: status === "Lead Return Submitted" ? "pointer" : "default" }}
                >
                 {/* Always render the circle and its number; add “active” class only if idx <= current */}
      <div className={`status-circle ${idx <= currentStatusIndex ? "active" : ""}`}>
        <span className="status-number">{idx + 1}</span>
      </div>

                  {idx < statuses.length && (
                    <div className={`status-line ${idx < currentStatusIndex ? "active" : ""}`}>
                    </div>
                  )}
                  <div className={`status-text-box ${idx === currentStatusIndex ? "highlighted" : ""}`}>
                    {status}
                  </div>
                </div>
              ))}
            </div>
            )}
                </div>

        </div>
      </div>
    </div>
  );
};
