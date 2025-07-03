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

  const signedInOfficer = localStorage.getItem("loggedInUser");

    useEffect(() => {
    // as soon as we land on this screen, jump to top
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
// const leadFromState = location.state?.lead || null;

// const selectedLead = leadFromState || null;
  const statuses = [
    "Lead Created",
    "Lead Assigned",
    "Lead Accepted",
    "Lead Return Submitted",
    "Lead Approved",
    "Lead Returned",
    "Lead Completed",
  ];
  
  // Change this index to highlight the current status dynamically
  // const currentStatusIndex = 1;

  const statusToIndex = {
    Assigned:               1,  // maps to "Lead Assigned"
    Accepted:                2,  // maps to "Lead Accepted"
    "In Review":            3,  // if you also use "In Review"
    Submitted:              3,  // or map your own submission status here
    Approved:               4,  // "Lead Approved"
    Returned:               5,  // "Lead Returned"
    Completed:              6,  // "Lead Completed"
  };

  // pull in supervisor / manager / investigators for this case
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

  // inside LeadReview()
// const handleSave = async () => {
//   try {
//     const token = localStorage.getItem("token");
//     setLoading(true);
// const processedLeadData = {
//   ...leadData,
//   parentLeadNo: typeof leadData.parentLeadNo === "string"
//     ? leadData.parentLeadNo
//         .split(",")
//         .map((item) => Number(item.trim()))
//         .filter((num) => !isNaN(num))
//     : leadData.parentLeadNo
// };

// await api.put(
//   `/api/lead/update/${leadData.leadNo}/${encodeURIComponent(leadData.description)}/${leadData.caseNo}/${encodeURIComponent(leadData.caseName)}`,
//   processedLeadData,
//   { headers: { Authorization: `Bearer ${token}` } }
// );

//     alert("Lead updated successfully!");
//   } catch (err) {
//     console.error("Save failed:", err);
//     setError("Failed to save changes.");
//   } finally {
//     setLoading(false);
//   }
// };

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

       const previousUsernames = Array.isArray(leadData.assignedTo)
      ? leadData.assignedTo.map((item) => item.username)
      : [];

    // 2) Build `assignedTo` from your array of usernames (`assignedOfficers`)
    const processedAssignedTo = assignedOfficers.map((username) => {
      // Preserve existing status if this user was already on leadData.assignedTo
      const existing = Array.isArray(leadData.assignedTo)
        ? leadData.assignedTo.find((item) => item.username === username)
        : null;

      return {
        username,
        status: existing?.status || "pending"
      };
    });

    const newlyAdded = assignedOfficers.filter((u) => !previousUsernames.includes(u));
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

    alert("Lead updated successfully!");
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

     await api.post(
      "/api/notifications",
      {
        notificationId: Date.now().toString(),
        assignedBy: signedInOfficer,
        assignedTo: [{
            username: leadData.assignedBy,
            role:     "Case Manager",           
            status:   "pending",
            unread:   true
          }],
        action1: "accepted the lead",
        post1:   `${leadNo}: ${description}`,
        caseNo:   selectedCase.caseNo,
        caseName: selectedCase.caseName,
        leadNo: leadNo,
        leadName: description,
        caseStatus: selectedCase.caseStatus || "Open",
        type: "Lead"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("PUT request succeeded. Response data:", response.data);

    // Update UI immediately
    setLeadData(prev => ({
      ...prev,
      leadStatus: "Accepted",
    }));

    alert("✅ Lead accepted successfully!");
  } catch (error) {
    console.error("Error updating lead status:", error.response?.data || error);
    alert("❌ Failed to accept lead.");
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
    await api.post(
      "/api/notifications",
      {
        notificationId: Date.now().toString(),
        assignedBy: signedInOfficer,          // you
        assignedTo: [{
            username: leadData.assignedBy,
            role:     "Case Manager",           
            status:   "pending",
            unread:   true
          }],
        action1: "declined the lead",
        post1:   `${leadNo}: ${description}`,
        caseNo:   selectedCase.caseNo,
        caseName: selectedCase.caseName,
         leadNo: leadNo,
        leadName: description,
        caseStatus: selectedCase.caseStatus || "Open",
        type: "Lead"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("❌ You’ve declined the lead, been removed from assigned list, and the Case Manager has been notified.");
    navigate('/Investigator', { replace: true });
  } catch (err) {
    console.error("Error declining lead:", err);
    alert("❌ Failed to decline lead.");
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

    // fall back to 0 (“Lead Created”) if you get an unexpected value
const currentStatusIndex = statusToIndex[leadData.leadStatus] ?? 0;

  // useEffect(() => {
  //   const fetchAllLeads = async () => {
  //     if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
  
  //     try {
  //       const token = localStorage.getItem("token");
  //       const resp = await api.get(
  //         `/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  
  //       // assume resp.data is an array
  //       let leadsArray = Array.isArray(resp.data) ? resp.data : [];
  
  //       // if user is _not_ a Case Manager, strip out CM-only leads:
  //       if (selectedCase.role !== "Case Manager") {
  //         leadsArray = leadsArray.filter(
  //           (l) => l.accessLevel !== "Only Case Manager and Assignees"
  //         );
  //       }
  
  //       setLeads((prev) => ({
  //         ...prev,
  //         allLeads: leadsArray.map((lead) => ({
  //           leadNo: lead.leadNo,
  //           description: lead.description,
  //           leadStatus: lead.leadStatus,
  //           // any other fields you need...
  //         })),
  //       }));
  //     } catch (err) {
  //       console.error("Error fetching all leads:", err);
  //     }
  //   };
  
  //   fetchAllLeads();
  // }, [selectedCase])


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


  // useEffect(() => {
  //   if (leadData.assignedTo) {
  //     setAssignedOfficers(leadData.assignedTo.map(o => o.username));
  //   }
  // }, [leadData]);
  

  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  // Navigation and tab states
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Input change handler
  const handleInputChange = (field, value) => {
    // Example: Only allow digits for 'leadNumber'
    if (field === 'leadNumber' && !/^\d*$/.test(value)) {
      alert("Lead Number must be numeric.");
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


      {/* Main Container */}
      <div className="lead-review-container1">

      {/* <div className="sideitem">

      <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

      <li className="sidebar-item"   style={{ fontWeight: 'bold' }} onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li
                className="sidebar-item"
                onClick={() =>
                  selectedCase.role === "Investigator"
                    ? navigate("/Investigator")
                    : navigate("/CasePageManager")
                }
              >
              Case Page
              </li>              
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
             <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li
                className="sidebar-item"
                onClick={() => {
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
                    alert("Please select a case and lead first.");
                  }
                }}
              >
                View Lead Return
              </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
     
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
         
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}

            </ul>
            )}
            <li className="sidebar-item active" onClick={() => setLeadDropdownOpen1(!leadDropdownOpen1)}>
          Lead Related Tabs {leadDropdownOpen1 ?  "▲": "▼"}
</li>
        {leadDropdownOpen1 && (
          <ul>
                        <li className="sidebar-item active" onClick={() => navigate('/leadReview')}>Lead Information</li>


            {selectedCase.role !== "Investigator" && (
             <li
             className="sidebar-item"
             onClick={() => {
               setPendingRoute("/ChainOfCustody", { state: { caseDetails } });
               setShowSelectModal(true);
             }}
            >    View Lead Chain of Custody
              </li>
)}
       
  
            {showSelectModal && (
               <SelectLeadModal
                 leads={leads.allLeads}
                 onSelect={handleSelectLead}
                 onClose={() => setShowSelectModal(false)}
               />
             )}
             </ul>
            )}
        </div> */}

       <SideBar  activePage="CasePageManager" />
     
        {/* Content Area */}
        <div className="lead-main-content">
          {/* Page Header */}


          <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>

          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${leadData.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${leadData?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>

          </div>

                    <div className="case-header">
            <h1>
  {selectedLead?.leadNo ? `LEAD: ${selectedLead.leadNo} | ${selectedLead.leadName?.toUpperCase()}` : "LEAD DETAILS"}
</h1>

          </div>

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
                    alert("Please select a case and lead first.");
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
                    alert("Please select a case and lead first.");
                  }
                }}>Lead Chain of Custody</span>
          
        </div>
      </div>
                  )}

          {/* Case Summary Textarea */}
          {/* <div className="form-section">
            <label className="input-label">Case Summary</label>
            <textarea
              className="case-summary-textarea"
              value={caseSummary}
              onChange={(e) => setCaseSummary(e.target.value)}
            />
          </div> */}

{/* { caseDetails?.role === "Investigator" && (
  <div className="lead-return-div">
    <h2>Click here to start a lead return</h2>
    <button
      className="save-btn1"
      onClick={() => navigate('/LRInstruction')}
    >
      Add Return
    </button>
  </div>
) } */}

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
                {/* <tr>
                  <td className="info-label">Case Name:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.caseName}
                      onChange={(e) => handleInputChange('caseName', e.target.value)}
                    />
                  </td>
                </tr> */}
                {/* <tr>
                  <td className="info-label">Case Summary:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field read-only"
                      value={leadData.caseSummary}
                      readOnly
                    />
                  </td>
                </tr> */}
                {/* <tr>
                  <td className="info-label">Lead Number:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field read-only"
                      value={leadData.leadNumber}
                      readOnly
                    />
                  </td>
                </tr> */}
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

                {/* <tr>
  <td className="info-label">Assigned Officers</td>
  <td>
    {isInvestigator ? (
      <div className="dropdown-header" >
        {assignedOfficers.length > 0
          ? assignedOfficers.join(", ")
          : ""}
      </div>
    ) : (
      <div className="custom-dropdown">
        <div
          className="dropdown-header"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {assignedOfficers.length > 0
            ? assignedOfficers.join(", ")
            : "Select Officers"}
          <span className="dropdown-icon">{dropdownOpen ? "▲" : "▼"}</span>
        </div>
        {dropdownOpen && (
          <div className="dropdown-options">
            {allUsers.map((officer) => (
              <div key={officer.username} className="dropdown-item">
                <input
                  type="checkbox"
                  id={officer.username}
                  value={officer.username}
                  checked={assignedOfficers.includes(officer.username)}
                  onChange={(e) => {
                    const updatedOfficers = e.target.checked
                      ? [...assignedOfficers, e.target.value]
                      : assignedOfficers.filter((o) => o !== e.target.value);

                    setAssignedOfficers(updatedOfficers);
                    setLeadData((prevData) => ({
                      ...prevData,
                      assignedTo: updatedOfficers,
                    }));
                  }}
                />
                <label htmlFor={officer.username}> {officer.firstName} {officer.lastName} ({officer.username})</label>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </td>
</tr> */}

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
                    {/* <input
                      type="text"
                      className="input-field"
                      // value={leadData.dueDate}
                      value={formatDate(leadData.dueDate)}
                      placeholder="MM/DD/YY"
                      // onChange={e => setDueDate(e.target.value)}
                    /> */}
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
         

          {/* <div className="lead-tracker-container">
                  {statuses.map((status, index) => (
                       <div key={index} className="lead-tracker-row" onClick={() => {
                        if (status === "Lead Return Submitted") {
                          handleNavigation("/CMInstruction");
                        }
                      }}
                      style={{ cursor: status === "Lead Return Submitted" ? "pointer" : "default" }}
                    >
                     
                          <div
                            className={`status-circle ${index <= currentStatusIndex ? "active" : ""}`}
                          >
                            {index <= currentStatusIndex && <span className="status-number">{index + 1}</span>}
                         </div>

                      
                            {index < statuses.length && (
                              <div className={`status-line ${index < currentStatusIndex ? "active" : ""}`}></div>
                            )}

                          
                            <div
                              className={`status-text-box ${index === currentStatusIndex ? "highlighted" : ""}`}
                            >
                              {status}
                            </div>
                        </div>
                      ))}
                </div> */}


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
