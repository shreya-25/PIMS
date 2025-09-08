import React, { useContext, useState, useEffect, useRef} from 'react';

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
  const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]);
  const [caseSubNumbers, setCaseSubNumbers] = useState([]); 
  const [aoOpen, setAoOpen] = useState(false);
  const [aoQuery, setAoQuery] = useState("");

   const [showSelectModal, setShowSelectModal] = useState(false);
  const [leads, setLeads] = useState({
            assignedLeads: [],
            pendingLeads: [],
            pendingLeadReturns: [],
            allLeads: [],
       } );
  const toUsername = (x) => (typeof x === "string" ? x : (x?.username ?? x?.name ?? ""));


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
    Assigned:               1,
    "To Reassign": 1, 
    Accepted:                2,  // maps to "Lead Accepted"
    "In Review":            3,  // if you also use "In Review"
    Submitted:              3,  // or map your own submission status here
    Approved:               4,  // "Lead Approved"
    Returned:               5,  // "Lead Returned"
    Completed:              6,  // "Lead Completed"
  };

  const isInvestigator = selectedCase?.role === "Investigator";
const [allUsers, setAllUsers] = useState([]);
  const toTitleCase = (s = "") =>
  s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());

  // const assOff= useRef(null);
  //  useEffect(() => {
  //     function handleClickOutside(e) {
  //       if (assOff.current && !assOff
  //         .current.contains(e.target)) {
  //         setDropdownOpen(false);
  //       }
       
  //     }
    
  //     document.addEventListener("mousedown", handleClickOutside);
  //     return () => document.removeEventListener("mousedown", handleClickOutside);
  //   }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // display helper
const displayUserAO = (uname) => {
  const u = allUsers.find((x) => x.username === uname);
  return u ? `${u.firstName} ${u.lastName} (${u.username})` : uname;
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

// normalize assignedTo items into { username, status }
const normalizeAssignedTo = (arr) =>
  (Array.isArray(arr) ? arr : []).map(x =>
    typeof x === "string" ? { username: x, status: "pending" } : x
  );

// compute the aggregate lead status from per-officer statuses
const computeLeadStatus = (assigned) => {
  const list = normalizeAssignedTo(assigned);
  if (list.length === 0) return "Assigned";
  const statuses = list.map(a => a.status);
  const allAccepted = statuses.every(s => s === "accepted");
  const allDeclined = statuses.every(s => s === "declined");
  const anyDeclined = statuses.includes("declined");

  if (allAccepted) return "Accepted";
  if (allDeclined) return "Rejected";
  if (anyDeclined) return "To Reassign";
  return "Assigned";
};


// const handleSave = async (updatedOfficers = assignedOfficers, updatedLeadData = leadData) => {

//   if (!(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor")) {
//        setAlertMessage("Unauthorized: Only Case Managers or Detective Supervisors can make changes.");
//        setAlertOpen(true);
//     return;
//   }

//   try {
//     const token = localStorage.getItem("token");
//     setLoading(true);

//     const normalizedParent = typeof updatedLeadData.parentLeadNo === "string"
//       ? updatedLeadData.parentLeadNo
//           .split(",")
//           .map((item) => Number(item.trim()))
//           .filter((num) => !isNaN(num))
//       : updatedLeadData.parentLeadNo;

//     const previousUsernames = originalAssigned;

//     console.log("leadData.assignedTo (raw):", leadData.assignedTo);
//     console.log("previousUsernames:", originalAssigned);
//     console.log("assignedOfficers:", assignedOfficers);

//     const processedAssignedTo = updatedOfficers.map(username => {
//     const existing = Array.isArray(updatedLeadData
//       .assignedTo)
//       ? updatedLeadData
//       .assignedTo.find(item => {
//           const name = typeof item === 'string' ? item : item.username;
//           return name === username;
//         })
//       : null;

//       console.log("existing", existing);
//       return {
//         username,
//         status: existing?.status || "pending"
//       };
//     });

//     const effectivePrimary = updatedLeadData.primaryOfficer || (updatedOfficers.length > 0 ? updatedOfficers[0] : "");

//     const newlyAdded = updatedOfficers
//     .filter(u => !originalAssigned.includes(u));

//      if (newlyAdded.length) {
//        const updatedInvestigators = Array.from(new Set([
//         ...caseTeam.investigators,
//         ...newlyAdded
//       ]));

//        const officers = [
//          ...(caseTeam.detectiveSupervisor
//             ? [{ name: caseTeam.detectiveSupervisor,
//                  role: "Detective Supervisor",
//                  status: "accepted" }]
//             : []),
//           ...caseTeam.caseManagers.map(name => ({
//           name,
//           role:   "Case Manager",
//           status: "accepted"
//          })),
//          ...updatedInvestigators.map(name => ({
//            name,
//            role:   "Investigator",
//            status: "pending"
//          }))
//        ];
//        await api.put(
//          `/api/cases/${encodeURIComponent(selectedCase.caseNo)}/${encodeURIComponent(selectedCase.caseName)}/officers`,
//          { officers },
//          { headers: { Authorization: `Bearer ${token}` } }
//        );
//        // refresh your local caseTeam so the sidebar stays up-to-date
//        const teamResp = await api.get(
//          `/api/cases/${selectedCase.caseNo}/team`,
//          { headers: { Authorization: `Bearer ${token}` } }
//        );
//        setCaseTeam({
//          detectiveSupervisor: teamResp.data.detectiveSupervisor,
//          caseManagers:         teamResp.data.caseManagers,
//          investigators:       teamResp.data.investigators
//        });
//      }

//     for (let username of newlyAdded) {
//       await api.post(
//         "/api/notifications",
//         {
//           notificationId: Date.now().toString(),
//           assignedBy: signedInOfficer,        
//           assignedTo: [{
//             username,
//             role:     "Investigator",           
//             status:   "pending",
//             unread:   true
//           }],
//           action1: "assigned you to a new lead",
//           post1:   `${leadData.leadNo}: ${leadData.description}`,
//           action2:  "related to the case",
//           post2:   `${selectedCase.caseNo}: ${selectedCase.caseName}`,
//           caseNo:   leadData.caseNo,
//           caseName: leadData.caseName,
//           leadNo: leadData.leadNo,
//           leadName: leadData.description,
//           caseStatus: selectedCase.caseStatus || "Open",
//           type: "Lead"
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//     }

 
//     const processedLeadData = {
//       ...updatedLeadData,
//       parentLeadNo: normalizedParent,
//       assignedTo: processedAssignedTo,
//       assignedOfficer: processedAssignedTo.map(a => a.username),
//       primaryOfficer: effectivePrimary || null,
//       primaryInvestigator: effectivePrimary || null,
//       ...(updatedOfficers.length > 0 ? { leadStatus: "Assigned" } : {})
//     };

//     await api.put(
//       `/api/lead/update/${leadData.leadNo}/${encodeURIComponent(leadData.description)}/${leadData.caseNo}/${encodeURIComponent(leadData.caseName)}`,
//       processedLeadData,
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     setLeadData(prev => ({
//     ...prev,
//     ...processedLeadData,
//     assignedTo: processedAssignedTo,        // <— important
//     primaryOfficer: effectivePrimary || "",
//     }));
//     setOriginalAssigned(processedAssignedTo.map(x => x.username));

//     setAlertMessage("Lead updated successfully!");
//        setAlertOpen(true);
//       } catch (err) {
//         console.error("Save failed:", err);
//         setError("Failed to save changes.");
//       } finally {
//         setLoading(false);
//       }
// };


// const acceptLead = async (leadNo, description) => {
//   console.log("Accept button clicked for lead:", leadNo);

//   try {
//     const token = localStorage.getItem("token");
//     const url = `/api/lead/${leadNo}/${encodeURIComponent(description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`;
//     console.log("PUT request URL:", url);

//     const response = await api.put(
//       url,
//       {}, // backend handles default payload
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     //  await api.post(
//     //   "/api/notifications",
//     //   {
//     //     notificationId: Date.now().toString(),
//     //     assignedBy: signedInOfficer,
//     //     assignedTo: [{
//     //         username: leadData.assignedBy,
//     //         role:     "Case Manager",           
//     //         status:   "pending",
//     //         unread:   true
//     //       }],
//     //     action1: "accepted the lead",
//     //     post1:   `${leadNo}: ${description}`,
//     //     caseNo:   selectedCase.caseNo,
//     //     caseName: selectedCase.caseName,
//     //     leadNo: leadNo,
//     //     leadName: description,
//     //     caseStatus: selectedCase.caseStatus || "Open",
//     //     type: "Lead"
//     //   },
//     //   { headers: { Authorization: `Bearer ${token}` } }
//     // );

//     console.log("PUT request succeeded. Response data:", response.data);

//     // Update UI immediately
//     setLeadData(prev => ({
//       ...prev,
//       leadStatus: "Accepted",
//     }));

//     // alert("✅ Lead accepted successfully!");
//     setAlertMessage("Lead accepted successfully!");
//        setAlertOpen(true);
//   } catch (error) {
//     console.error("Error updating lead status:", error.response?.data || error);
//     // alert("❌ Failed to accept lead.");
//     setAlertMessage("Failed to accept lead.");
//        setAlertOpen(true);
//   }
// };

const handleSave = async (updatedOfficers = assignedOfficers, updatedLeadData = leadData) => {
  if (!(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor")) {
    setAlertMessage("Unauthorized: Only Case Managers or Detective Supervisors can make changes.");
    setAlertOpen(true);
    return;
  }

  try {
    const token = localStorage.getItem("token");
    setLoading(true);

    // 🔧 ALWAYS work with usernames (strings)
    const updatedUsernames = (Array.isArray(updatedOfficers) ? updatedOfficers : [])
  .map(toUsername)
  .filter(Boolean);

    // 1) Normalize parentLeadNo
    const normalizedParent = typeof updatedLeadData.parentLeadNo === "string"
      ? updatedLeadData.parentLeadNo.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n))
      : updatedLeadData.parentLeadNo;

    console.log("leadData.assignedTo (raw):", leadData.assignedTo);
    console.log("previousUsernames:", originalAssigned);
    console.log("updatedUsernames:", updatedUsernames);

    // 2) Build assignedTo for the LEAD: [{username, status}]
    const processedAssignedTo = updatedUsernames.map((username) => {
      const existing = Array.isArray(updatedLeadData.assignedTo)
        ? normalizeAssignedTo(updatedLeadData.assignedTo).find((it) => it.username === username)
        : null;
      return { username, status: existing?.status || "pending" };
    });

    const effectivePrimary =
      updatedLeadData.primaryOfficer || (updatedUsernames.length ? updatedUsernames[0] : "");

    // who is newly added (vs original load)
    const newlyAdded = updatedUsernames.filter((u) => !originalAssigned.includes(u));

    // --- CASE officers payload: { name, role, status } ----------------------
    if (newlyAdded.length) {
      const updatedInvestigators = Array.from(
        new Set([...(caseTeam.investigators || []).map(toUsername), ...newlyAdded])
      );

      const officers = [
        ...(caseTeam.detectiveSupervisor
          ? [{ name: toUsername(caseTeam.detectiveSupervisor), role: "Detective Supervisor", status: "accepted" }]
          : []),
        ...(caseTeam.caseManagers || []).map((n) => ({
          name: toUsername(n),
          role: "Case Manager",
          status: "accepted",
        })),
        ...updatedInvestigators.map((n) => ({
          name: toUsername(n),
          role: "Investigator",
          status: newlyAdded.includes(n) ? "pending" : "accepted",
        })),
      ];

      await api.put(
        `/api/cases/${encodeURIComponent(selectedCase.caseNo)}/${encodeURIComponent(selectedCase.caseName)}/officers`,
        { officers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const teamResp = await api.get(
        `/api/cases/${selectedCase.caseNo}/team`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCaseTeam({
        detectiveSupervisor: teamResp.data.detectiveSupervisor,
        caseManagers: teamResp.data.caseManagers,
        investigators: teamResp.data.investigators,
      });
    }

    // 3) Merge + persist LEAD
    const processedLeadData = {
      ...updatedLeadData,
      parentLeadNo: normalizedParent,
      assignedTo: processedAssignedTo,
      assignedOfficer: processedAssignedTo.map((a) => a.username),
      primaryOfficer: effectivePrimary || null,
      primaryInvestigator: effectivePrimary || null,
      ...(updatedUsernames.length > 0 ? { leadStatus: "Assigned" } : {}),
    };

    await api.put(
      `/api/lead/update/${leadData.leadNo}/${encodeURIComponent(leadData.description)}/${leadData.caseNo}/${encodeURIComponent(leadData.caseName)}`,
      processedLeadData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setLeadData((prev) => ({
      ...prev,
      ...processedLeadData,
      assignedTo: processedAssignedTo,
      primaryOfficer: effectivePrimary || "",
    }));

    setOriginalAssigned(processedAssignedTo.map((x) => x.username));

    setAlertMessage("Lead updated successfully!");
    setAlertOpen(true);
  } catch (err) {
    console.error("Save failed:", err);
    setError("Failed to save changes.");
  } finally {
    setLoading(false);
  }
};


// const acceptLead = async (leadNo, description) => {
//   try {
//     const token   = localStorage.getItem("token");
//     const headers = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };

//     await api.put(
//       `/api/lead/${leadNo}/${encodeURIComponent(description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
//       {},
//       headers
//     );

//     const updatedAssignedTo = normalizeAssignedTo(leadData.assignedTo).map(it =>
//       it.username === signedInOfficer ? { ...it, status: "accepted" } : it
//     );

//     const newStatus = computeLeadStatus(updatedAssignedTo);

//     await api.put(
//       `/api/lead/update/${leadData.leadNo}/${encodeURIComponent(leadData.description)}/${leadData.caseNo}/${encodeURIComponent(leadData.caseName)}`,
//       { ...leadData, assignedTo: updatedAssignedTo, leadStatus: newStatus },
//       headers
//     );

//     setLeadData(prev => ({ ...prev, assignedTo: updatedAssignedTo, leadStatus: newStatus }));
//     setLeadStatus?.(newStatus);

//     setAlertMessage(newStatus === "Accepted"
//       ? "All officers accepted. Lead status is 'Accepted'."
//       : "You accepted. Waiting on others — status stays 'Assigned'."
//     );
//     setAlertOpen(true);
//   } catch (error) {
//     console.error("Error updating lead status:", error.response?.data || error);
//     setAlertMessage("Failed to accept lead.");
//     setAlertOpen(true);
//   }
// };

// const declineLead = async (leadNo, description) => {
//   const token   = localStorage.getItem("token");
//   const headers = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };

//   try {
//     const updatedAssignedTo = normalizeAssignedTo(leadData.assignedTo).map(it =>
//       it.username === signedInOfficer ? { ...it, status: "declined" } : it
//     );

//     const newStatus = computeLeadStatus(updatedAssignedTo);

//     await api.put(
//       `/api/lead/update/${leadData.leadNo}/${encodeURIComponent(leadData.description)}/${leadData.caseNo}/${encodeURIComponent(leadData.caseName)}`,
//       {
//         ...leadData,
//         assignedTo: updatedAssignedTo,
//         leadStatus: newStatus,
//       },
//       headers
//     );

//     setLeadData(prev => ({ ...prev, assignedTo: updatedAssignedTo, leadStatus: newStatus }));
//     setLeadStatus?.(newStatus);

//     setAlertMessage(
//       newStatus === "Rejected"
//         ? "All officers declined. Lead status set to 'Rejected'."
//         : "You declined. Lead status set to 'To Reassign'."
//     );
//     setAlertOpen(true);
//   } catch (err) {
//     console.error("Error declining lead:", err);
//     setAlertMessage("Failed to decline lead. Please try again.");
//     setAlertOpen(true);
//   }
// };

// who’s still "active" = not declined (pending or accepted)
const nonDeclinedUsernames = (assigned) =>
  normalizeAssignedTo(assigned)
    .filter(a => a.status !== "declined")
    .map(a => a.username);

// persist primary safely (bypass handleSave's role guard)
const persistPrimary = async (leadObj, nextPrimary) => {
  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const payload = {
    ...leadObj,
    primaryInvestigator: nextPrimary || null,
    primaryOfficer:      nextPrimary || null,
  };

  // Persist to your existing update endpoint
  await api.put(
    `/api/lead/update/${leadObj.leadNo}/${encodeURIComponent(leadObj.description)}/${leadObj.caseNo}/${encodeURIComponent(leadObj.caseName)}`,
    payload,
    headers
  );

  // Keep UI in sync immediately
  setLeadData(prev => ({
    ...prev,
    primaryInvestigator: nextPrimary || "",
    primaryOfficer:      nextPrimary || "",
  }));
};

// if exactly one active officer remains, make them primary
const autoPromotePrimaryIfSingleActive = async (leadObj) => {
  const active = nonDeclinedUsernames(leadObj.assignedTo);
  const current = leadObj.primaryInvestigator || leadObj.primaryOfficer || "";

  // If exactly one active remains and it's not already primary → promote it.
  if (active.length === 1 && active[0] !== current) {
    try {
      await persistPrimary(leadObj, active[0]);
      setAlertMessage(`Primary Investigator set to ${active[0]} automatically.`);
      setAlertOpen(true);
    } catch (e) {
      // Don’t block the flow if the server denies — just log it.
      console.error("Auto-promote primary failed:", e);
    }
  }

  // Optional: if none left active, clear primary
  if (active.length === 0 && current) {
    try {
      await persistPrimary(leadObj, "");
    } catch (e) {
      console.error("Auto-clear primary failed:", e);
    }
  }
};



const acceptLead = async (leadNo, description) => {
  try {
    const token = localStorage.getItem("token");
    const { data } = await api.put(
      `/api/lead/lead/${leadNo}/${encodeURIComponent(description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/assignedTo`,
      { officerUsername: signedInOfficer, status: "accepted" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Server returns the updated lead (with events + recomputed leadStatus)
    const lead = data.lead;
    setLeadData(lead);
    setLeadStatus?.(lead.leadStatus);

     await autoPromotePrimaryIfSingleActive(lead);

    setAlertMessage(
      lead.leadStatus === "Accepted"
        ? "All officers accepted. Lead is 'Accepted'."
        : "You accepted. Waiting on others."
    );
    setAlertOpen(true);
  } catch (error) {
    console.error("Accept failed:", error.response?.data || error);
    setAlertMessage("Failed to accept lead.");
    setAlertOpen(true);
  }
};

const declineLead = async (leadNo, description, reason = "") => {
  try {
    const token = localStorage.getItem("token");
    const { data } = await api.put(
      `/api/lead/lead/${leadNo}/${encodeURIComponent(description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/assignedTo`,
      { officerUsername: signedInOfficer, status: "declined", reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const lead = data.lead;
    setLeadData(lead);
    setLeadStatus?.(lead.leadStatus);

        await autoPromotePrimaryIfSingleActive(lead);


    setAlertMessage(
      lead.leadStatus === "Rejected"
        ? "All officers declined. Lead is 'Rejected'."
        : "You declined. Status set to 'To Reassign'."
    );
    setAlertOpen(true);
  } catch (error) {
    console.error("Decline failed:", error.response?.data || error);
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
    primaryOfficer: '',  
    
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


    //       if (response.data.length > 0) {
    //         setLeadData({
    //           ...response.data[0], 
    //           assignedOfficer: response.data[0].assignedOfficer || [],
    //           assignedTo: response.data[0].assignedTo || [],
    //           leadStatus: response.data[0].leadStatus || '',
    //           primaryOfficer: response.data[0].primaryInvestigator || response.data[0].primaryOfficer || '',
    //         });
    //       }

    //       if (Array.isArray(response.data[0].assignedTo)) {
    //         setOriginalAssigned(
    //           response.data[0].assignedTo.map(item =>
    //             typeof item === "string" ? item : item.username
    //           )
    //         );
    //       // and initialize your “assignedOfficers” checkboxes to match:
    //         setAssignedOfficers(
    //           response.data[0].assignedTo.map(item =>
    //             typeof item === "string" ? item : item.username
    //           )
    //         );

    //         if (response.data[0].primaryInvestigator && !username.includes(response.data[0].primaryInvestigator)) {
    //   setLeadData(prev => ({ ...prev, primaryOfficer: '' }));
    // }

            
    //       }
          
    //     }

   if (response.data.length > 0) {
  const item = response.data[0];
  const assignedNorm = normalizeAssignedTo(item.assignedTo);

   const allUsernames    = assignedNorm.map(x => x.username);
  const activeUsernames = assignedNorm
    .filter(x => x.status !== "declined")
    .map(x => x.username);

  setLeadData({
    ...item,
    assignedOfficer: item.assignedOfficer || [],
    assignedTo: assignedNorm,
    leadStatus: item.leadStatus || computeLeadStatus(assignedNorm),
    primaryOfficer: item.primaryInvestigator || "",
  });

  // const assignedUsernames = assignedNorm.map(x => x.username);
  setOriginalAssigned(allUsernames);
  setAssignedOfficers(activeUsernames);

  if (item.primaryInvestigator && !activeUsernames.includes(item.primaryInvestigator)) {
    setLeadData(prev => ({ ...prev, primaryOfficer: "" }));
  }
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
const [assignedOfficers, setAssignedOfficers] = useState([]);

const [subnumsLoading, setSubnumsLoading] = useState(false);

useEffect(() => {
  const fetchCaseSubNumbers = async () => {
    if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
    try {
      setSubnumsLoading(true);
      const token = localStorage.getItem("token");
      // use the route your backend exposes; adjust if different
      const { data } = await api.get(
        `/api/cases/${selectedCase.caseNo}/subNumbers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // normalize + dedupe
      const subs = Array.from(new Set(data?.subNumbers || []));
      setCaseSubNumbers(subs);
    } catch (e) {
      console.error("Failed to fetch case subnumbers:", e);
      setCaseSubNumbers([]); // show "No subnumbers" in UI
    } finally {
      setSubnumsLoading(false);
    }
  };
  fetchCaseSubNumbers();
}, [selectedCase?.caseNo, selectedCase?.caseName]);

// keep UI selection in sync when lead loads
useEffect(() => {
  if (Array.isArray(leadData?.associatedSubNumbers)) {
    setAssociatedSubNumbers(leadData.associatedSubNumbers);
  }
}, [leadData?.associatedSubNumbers]);

// tiny helper to autosave field
const saveField = async (partial) => {
 const next = { ...leadData, ...partial };
  setLeadData(next);
  try {
   // Keep the current officer selection; only the changed fields are in `next`
    await handleSave(assignedOfficers, next);
  } catch (err) {
    console.error("Auto-save failed", err);
   setAlertMessage("Failed to save your changes. Please try again.");
   setAlertOpen(true);
  }
};

  
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

// useEffect(() => {
//   if (Array.isArray(leadData.assignedTo)) {
//     const usernames = leadData.assignedTo.map(item =>
//       typeof item === "string" ? item : item.username
//     );
//     setAssignedOfficers(usernames);
//   }
// }, [leadData.assignedTo]);

useEffect(() => {
  if (Array.isArray(leadData?.assignedTo)) {
    const usernames = normalizeAssignedTo(leadData.assignedTo)
      .filter(x => x.status !== "declined")
      .map(x => x.username);
    setAssignedOfficers(usernames);
  }
}, [leadData?.assignedTo]);

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



const myAssignment = normalizeAssignedTo(leadData.assignedTo).find(a => a.username === signedInOfficer);
const showDecisionBlock =
  myAssignment?.status === "pending" 
  // &&(selectedCase.role !== "Case Manager" && selectedCase.role !== "Detective Supervisor");
const isManager = ["Case Manager", "Detective Supervisor"].includes(selectedCase?.role);
const isAssigned = !!myAssignment;

const canWorkOnReturn = isAssigned ? (myAssignment.status === "accepted") : isManager;


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
    "associatedSubNumbers", // Associated Subnumbers
    "primaryOfficer",      
  ];
  return selectedCase?.role === "Case Manager" && editableFields.includes(field);
};

const declinedSet = new Set(
  normalizeAssignedTo(leadData.assignedTo)
    .filter(a => a.status === "declined")
    .map(a => a.username)
);

// filtered users (exclude declined)
const filteredUsersAO = React.useMemo(() => {
  const q = aoQuery.trim().toLowerCase();
  const pool = (allUsers || []).filter(u => !declinedSet.has(u.username));
  if (!q) return pool;
  return pool.filter(u => {
    const a = (u.username || "").toLowerCase();
    const b = (u.firstName || "").toLowerCase();
    const c = (u.lastName || "").toLowerCase();
    return a.includes(q) || b.includes(q) || c.includes(q) || `${b} ${c}`.includes(q);
  });
}, [allUsers, aoQuery, declinedSet]);

// close on outside click / Esc
useEffect(() => {
  const onDoc = (e) => {
    const el = document.getElementById("assigned-officers-wrap");
    if (el && !el.contains(e.target)) setAoOpen(false);
  };
  const onEsc = (e) => e.key === "Escape" && setAoOpen(false);
  document.addEventListener("mousedown", onDoc);
  document.addEventListener("keydown", onEsc);
  return () => {
    document.removeEventListener("mousedown", onDoc);
    document.removeEventListener("keydown", onEsc);
  };
}, []);

// show/hide the events modal
const [eventsModalOpen, setEventsModalOpen] = useState(false);

// sort once for stable timeline
const eventsSorted = React.useMemo(
  () => [...(leadData?.events || [])].sort((a,b) => new Date(a.at) - new Date(b.at)),
  [leadData?.events]
);

const fmtDT = (d) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString(); // or customize
};

const describeEvent = (ev) => {
  const to = (ev.to || []).join(", ");
  const pi = ev.primaryInvestigator ? ` (Primary: ${ev.primaryInvestigator})` : "";
  switch (ev.type) {
    case "assigned":            return `Assigned ${to}${pi}`;
    case "accepted":            return `${to} accepted`;
    case "declined":            return `${to} declined${ev.reason ? ` — Reason: ${ev.reason}` : ""}`;
    case "reassigned-added":    return `Added ${to}${pi}`;
    case "reassigned-removed":  return `Removed ${to}${pi}`;
    default:                    return ev.type;
  }
};
// === helpers (keep your fmtDT) ==============================================
const nameOf = (uname) => {
  const u = allUsers.find((x) => x.username === uname);
  return u ? `${u.firstName} ${u.lastName} (${u.username})` : uname || "—";
};

const plural = (arr, s, p) => (arr && arr.length === 1 ? s : p);

// Build quick lookups for first accept/decline timestamps and reasons
const buildDecisionMaps = (events = []) => {
  const acceptedAt = new Map();
  const declinedAt = new Map();
  const declinedReason = new Map();

  events.forEach(ev => {
    if (!Array.isArray(ev.to)) return;
    if (ev.type === "accepted") {
      ev.to.forEach(u => {
        if (!acceptedAt.has(u)) acceptedAt.set(u, ev.at);
      });
    } else if (ev.type === "declined") {
      ev.to.forEach(u => {
        if (!declinedAt.has(u)) declinedAt.set(u, ev.at);
        if (ev.reason) declinedReason.set(u, ev.reason);
      });
    }
  });
  return { acceptedAt, declinedAt, declinedReason };
};

const sectionTitle = (text) => (
  <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 6 }}>{text}</div>
);

// === replacement modal ======================================================
// Compact, professional assignment log
const LeadEventsModal = ({ open, onClose, events }) => {
  if (!open) return null;

  const evs = Array.isArray(events) ? events : [];
  const assigned   = evs.filter(e => e.type === "assigned");
  const accepted   = evs.filter(e => e.type === "accepted");
  const declined   = evs.filter(e => e.type === "declined");
  const added      = evs.filter(e => e.type === "reassigned-added");
  const removed    = evs.filter(e => e.type === "reassigned-removed");

  const firstAssigned = assigned[0] || null;
  const lastStatus = evs.length ? evs[evs.length - 1].statusAfter : undefined;

  // who accepted/declined (first timestamp per officer)
  const { acceptedAt, declinedAt, declinedReason } = buildDecisionMaps(evs);

  // compute the current assigned set (initial + adds − removes)
  const assignedSet = (() => {
    const s = new Set(firstAssigned?.to || []);
    // process chronologically
    [...added, ...removed]
      .sort((a, b) => new Date(a.at) - new Date(b.at))
      .forEach(ev => {
        (ev.to || []).forEach(u => {
          if (ev.type === "reassigned-added") s.add(u);
          if (ev.type === "reassigned-removed") s.delete(u);
        });
      });
    return s;
  })();

  const pending = [...assignedSet].filter(
    u => !acceptedAt.has(u) && !declinedAt.has(u)
  );

  // message per event (short & professional)
  const msg = (ev) => {
    const people = (ev.to || []).map(nameOf).join(", ") || "—";
    switch (ev.type) {
      case "assigned":
        return `Assigned to ${people}` +
          (ev.primaryInvestigator ? ` • Primary: ${nameOf(ev.primaryInvestigator)}` : "");
      case "accepted":
        return `${people} accepted`;
      case "declined":
        return `${people} declined` + (ev.reason ? ` • ${ev.reason}` : "");
      case "reassigned-added":
        return `Added ${people}` +
          (ev.primaryInvestigator ? ` • Primary: ${nameOf(ev.primaryInvestigator)}` : "");
      case "reassigned-removed":
        return `Removed ${people}`;
      default:
        return ev.type || "—";
    }
  };

  // icon + tone per event
  const iconFor = (t) =>
    t === "accepted" ? "✓" :
    t === "declined" ? "✕" :
    t === "reassigned-added" ? "+" :
    t === "reassigned-removed" ? "−" : "●";

  const toneFor = (t) =>
    t === "accepted" ? "ok" :
    t === "declined" ? "bad" :
    t === "reassigned-added" ? "info" :
    t === "reassigned-removed" ? "muted" : "base";

  // sorted stream for the timeline
  const stream = [...evs].sort((a,b) => new Date(a.at) - new Date(b.at));

  return (
    <div className="elog-backdrop" onClick={onClose}>
      <div className="elog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="elog-header">
          <h3>Assignment Log</h3>
          <div className="elog-chip">{lastStatus || "—"}</div>
          <button className="elog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* SUMMARY */}
        <section className="elog-block">

          <div className="elog-counters">
            <span className="elog-counter ok">Accepted {acceptedAt.size}</span>
            <span className="elog-counter bad">Declined {declinedAt.size}</span>
            <span className="elog-counter base">Pending {pending.length}</span>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="elog-block">
          <div className="elog-title"></div>
          {stream.length === 0 ? (
            <div className="elog-muted">No activity yet.</div>
          ) : (
            <ul className="elog-list">
              {stream.map((ev, i) => (
                <li key={i} className={`elog-item ${toneFor(ev.type)}`}>
                  <div className="elog-pin">{iconFor(ev.type)}</div>
                  <div className="elog-body">
                    <div className="elog-line">{msg(ev)}</div>
                    <div className="elog-meta">
                      by <b>{nameOf(ev.by)}</b> • {fmtDT(ev.at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};



// centralizes how we change assigned officers
const updateAssignedOfficers = async (nextUsernames) => {
  // keep current primary if still present, otherwise first selected
  const nextPrimary = nextUsernames.includes(leadData.primaryOfficer)
    ? leadData.primaryOfficer
    : (nextUsernames[0] || "");

  // update local UI immediately
  setAssignedOfficers(nextUsernames);
  setLeadData(prev => ({
    ...prev,
    // temporarily store usernames (handleSave will normalize to {username,status})
    assignedTo: nextUsernames,
    primaryOfficer: nextPrimary,
    leadStatus: nextUsernames.length > 0 ? "Assigned" : prev.leadStatus
  }));

  // persist
  try {
    await handleSave(
      nextUsernames,
      { ...leadData, primaryOfficer: nextPrimary, ...(nextUsernames.length ? { leadStatus: "Assigned" } : {}) }
    );
  } catch (err) {
    console.error("Error during auto-save:", err);
    setAlertMessage("An error occurred while updating assigned officers. Please try again.");
    setAlertOpen(true);
  }
};

// put near other useStates
const [isGenerating, setIsGenerating] = useState(false);

// helper to attach files for sections that have uploads
const attachFiles = async (items, idFieldName, filesEndpoint) => {
  return Promise.all(
    (items || []).map(async (item) => {
      const realId = item[idFieldName];
      if (!realId) return { ...item, files: [] };
      try {
        const { data: filesArray } = await api.get(
          `${filesEndpoint}/${realId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        return { ...item, files: filesArray };
      } catch (err) {
        console.error(`Error fetching files for ${filesEndpoint}/${realId}:`, err);
        return { ...item, files: [] };
      }
    })
  );
};

const handleViewLeadReturn = async () => {
  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

  if (!lead?.leadNo || !(lead.leadName || lead.description) || !kase?.caseNo || !kase?.caseName) {
    setAlertMessage("Please select a case and lead first.");
    setAlertOpen(true);
    return;
  }

  if (isGenerating) return;

  try {
    setIsGenerating(true);

    const token = localStorage.getItem("token");
    const headers = { headers: { Authorization: `Bearer ${token}` } };

    const { leadNo } = lead;
    const leadName = lead.leadName || lead.description;
    const { caseNo, caseName } = kase;
    const encLead = encodeURIComponent(leadName);
    const encCase = encodeURIComponent(caseName);

    // fetch everything we need for the report (same endpoints you use on LRFinish)
    const [
      instrRes,
      returnsRes,
      personsRes,
      vehiclesRes,
      enclosuresRes,
      evidenceRes,
      picturesRes,
      audioRes,
      videosRes,
      scratchpadRes,
      timelineRes,
    ] = await Promise.all([
      api.get(`/api/lead/lead/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrenclosure/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrevidence/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrpicture/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lraudio/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrvideo/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/scratchpad/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/timeline/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
    ]);

    // add files where applicable (note the plural file endpoints)
    const enclosuresWithFiles = await attachFiles(enclosuresRes.data, "_id", "/api/lrenclosures/files");
    const evidenceWithFiles   = await attachFiles(evidenceRes.data,   "_id", "/api/lrevidences/files");
    const picturesWithFiles   = await attachFiles(picturesRes.data,   "pictureId", "/api/lrpictures/files");
    const audioWithFiles      = await attachFiles(audioRes.data,      "audioId",   "/api/lraudio/files");
    const videosWithFiles     = await attachFiles(videosRes.data,     "videoId",   "/api/lrvideo/files");

    const leadInstructions = instrRes.data?.[0] || {};
    const leadReturns      = returnsRes.data || [];
    const leadPersons      = personsRes.data || [];
    const leadVehicles     = vehiclesRes.data || [];
    const leadScratchpad   = scratchpadRes.data || [];
    const leadTimeline     = timelineRes.data || [];

    // make all sections true (Full Report)
    const selectedReports = {
      FullReport: true,
      leadInstruction: true,
      leadReturn: true,
      leadPersons: true,
      leadVehicles: true,
      leadEnclosures: true,
      leadEvidence: true,
      leadPictures: true,
      leadAudio: true,
      leadVideos: true,
      leadScratchpad: true,
      leadTimeline: true,
    };

    const body = {
      user: localStorage.getItem("loggedInUser") || "",
      reportTimestamp: new Date().toISOString(),

      // sections (values are the fetched arrays/objects)
      leadInstruction: leadInstructions,
      leadReturn:      leadReturns,
      leadPersons,
      leadVehicles,
      leadEnclosures:  enclosuresWithFiles,
      leadEvidence:    evidenceWithFiles,
      leadPictures:    picturesWithFiles,
      leadAudio:       audioWithFiles,
      leadVideos:      videosWithFiles,
      leadScratchpad,
      leadTimeline,

      // also send these two, since your backend expects them
      selectedReports,
      leadInstructions,
      leadReturns,
    };

    const resp = await api.post("/api/report/generate", body, {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` },
    });

    const file = new Blob([resp.data], { type: "application/pdf" });

    navigate("/DocumentReview", {
      state: {
        pdfBlob: file,
        filename: `Lead_${leadNo || "report"}.pdf`,
      },
    });
  } catch (err) {
    if (err?.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      console.error("Report error:", text);
      setAlertMessage("Error generating PDF:\n" + text);
    } else {
      console.error("Report error:", err);
      setAlertMessage("Error generating PDF:\n" + (err.message || "Unknown error"));
    }
    setAlertOpen(true);
  } finally {
    setIsGenerating(false);
  }
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

          

           {canWorkOnReturn && (
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
                }}>Add Lead Return</span>

           {(["Case Manager", "Detective Supervisor"].includes(selectedCase?.role)) && (
           <span
              className="menu-item"
              onClick={handleViewLeadReturn}
              title={isGenerating ? "Preparing report…" : "View Lead Return"}
              style={{ opacity: isGenerating ? 0.6 : 1, pointerEvents: isGenerating ? "none" : "auto" }}
            >
              Manage Lead Return
            </span>
              )}
              {/* {(["Investigator"].includes(selectedCase?.role)) && (
            
            <span
              className="menu-item"
              onClick={handleViewLeadReturn}
              title={isGenerating ? "Preparing report…" : "View Lead Return"}
              style={{ opacity: isGenerating ? 0.6 : 1, pointerEvents: isGenerating ? "none" : "auto" }}
            >
              View Lead Return
            </span>
              )} */}

               {(["Investigator"].includes(selectedCase?.role)) && (
            
             <span
              className="menu-item"
              onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/viewLR", {
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
                }}
            >
              View Lead Return
            </span>
              )}


             
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
              
              

          {/* <div className="caseandleadinfo">
          <h5 className = "side-title">  Case: {selectedCase.caseName || "Unknown Case"} |  Your Role: {selectedCase.role || ""}</h5>

          <h5 className="side-titleRight">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${leadData.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${leadData?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>

          </div> */}

               <div className="caseandleadinfo">
          <h5 className = "side-title"> 
             {/* Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""} */}
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo}
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
        ? `Your Role: ${selectedCase.role || ""}`
    : ` ${leadStatus}`}
</h5>

          </div>

          <div className="main-leadreview-cont">

           {/* <div className = "side-titleLeft-lr">
                  <p> PIMS &gt; Cases &gt; Lead \ {selectedLead.leadNo} 
                 </p>
                </div> */}
        <div className="case-header-leadReview">
                  <div className="cp-head-leadReview">
                {
                  // <h2> {selectedLead?.leadNo ? `Lead: ${selectedLead.leadName?.toUpperCase()}` : "LEAD DETAILS"} </h2>
                  <h2>{selectedLead.leadName? toTitleCase(selectedLead.leadName) : "Unknown Case"}</h2>


                }
                </div>

                  {/* {(leadData.leadStatus !== "Accepted" || selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") && (
                   <div  className="add-lead-section-lr">
                <button className="cp-add-lead-btn"  
                onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/viewLR", {
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
                }}
                style={{ cursor: 'pointer', width: '100%' }} >
                    View Lead Return
                </button>
                </div>
                  )} */}
                </div>
               
{showDecisionBlock && (
    <div
    className="accept-reject-section"
    style={{
      marginTop: "8px",
      marginBottom: "8px",
      padding: "8px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9",
    }}
  >
    <h3>
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
        
        style={{ backgroundColor: "#e74c3c", color: "#fff", fontSize: "20px" }}
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
                  <td className="info-label" style={{ width: "500px" }}>Lead Log Summary</td>
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
                      // onChange={(e) => handleInputChange('parentLeadNo', e.target.value)}
                      placeholder="NA"
                      readOnly={!(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor")}
      onChange={async (e) => {
        const value = e.target.value;
        setLeadData((prev) => ({ ...prev, parentLeadNo: value }));

        // Auto-save if Case Manager or Detective Supervisor
        if (selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") {
          await handleSave(assignedOfficers, { ...leadData, parentLeadNo: value });
        }
      }}
                    />
                  </td>
                </tr>

{/* <tr>
  <td className="info-label">Assigned Officers</td>
  <td>
    {isInvestigator ? (
      <div className="dropdown-header">
        {assignedOfficers.join(", ")}
      </div>
    ) : (
      <div ref = {assOff}
      className="custom-dropdown1">
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
            
            {allUsers
            .filter(u => !declinedSet.has(u.username))
            .map(user => (
              <div key={user.username} className="dropdown-item">
                <input
                  type="checkbox"
                  id={user.username}
                  value={user.username}
                  checked={assignedOfficers.includes(user.username)}
                  disabled={!(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor")}

             
                  onChange={async e => {
                    if (!(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor")) return;

                    const next = e.target.checked
                      ? [...assignedOfficers, user.username]
                      : assignedOfficers.filter(u => u !== user.username);

                    const nextPrimary = next.includes(leadData.primaryOfficer) ? leadData.primaryOfficer : (next[0] || "");

                    setAssignedOfficers(next);
                    setLeadData(prev => ({
                      ...prev,
                      assignedTo: next,
                      primaryOfficer: nextPrimary,
                      leadStatus: next.length > 0 ? "Assigned" : prev.leadStatus
                    }));

                    try {
                      await handleSave(
                        next,
                        { ...leadData, primaryOfficer: nextPrimary, ...(next.length > 0 ? { leadStatus: "Assigned" } : {}) }
                      );
                    } catch (err) {
                      console.error("Error during auto-save:", err);
                      setAlertMessage("An error occurred while updating assigned officers. Please try again.");
                      setAlertOpen(true);
                    }
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
</tr> */}

<tr>
  <td className="info-label">Assigned Officers</td>
  <td>
    {isInvestigator ? (
      <div className="dropdown-header">
        {assignedOfficers.map(displayUserAO).join(", ")}
      </div>
    ) : (
      <div id="assigned-officers-wrap" className="inv-dropdown">
        <button
          type="button"
          className="inv-input"
          onClick={() => setAoOpen(o => !o)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setAoOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={aoOpen}
          disabled={!(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor")}
          title={
            assignedOfficers.length
              ? assignedOfficers.map(displayUserAO).join(", ")
              : "Select Officers"
          }
        >
          <span className="inv-input-label">
            {assignedOfficers.length
              ? assignedOfficers.map(displayUserAO).join(", ")
              : "Select Officers"}
          </span>
          <span className="inv-caret" aria-hidden />
        </button>

        {aoOpen && (
          <div className="inv-options" role="listbox" onMouseDown={(e) => e.stopPropagation()}>
            <div className="inv-search-wrap">
              <input
                type="text"
                className="inv-search"
                placeholder="Type to filter officers…"
                value={aoQuery}
                onChange={(e) => setAoQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>

            <div className="inv-list">
              {filteredUsersAO.length ? (
                filteredUsersAO.map((user) => {
                  const checked = assignedOfficers.includes(user.username);
                  return (
                    <label key={user.username} className="inv-item">
                      <input
                        type="checkbox"
                        value={user.username}
                        checked={checked}
                        disabled={!(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor")}
                       onChange={async (e) => {
  if (!(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor")) return;

  const { checked, value } = e.target;

  // next usernames
  const nextUsernames = checked
    ? [...assignedOfficers, value]
    : assignedOfficers.filter((u) => u !== value);

  // keep existing status if officer was already there
  const prevAssigned = normalizeAssignedTo(leadData.assignedTo);
  const nextAssignedTo = nextUsernames.map((u) => {
    const prev = prevAssigned.find((p) => p.username === u);
    return { username: u, status: prev?.status || "pending" };
  });

  // pick/repair primary
  const nextPrimary =
    nextUsernames.includes(leadData.primaryInvestigator || leadData.primaryOfficer)
      ? (leadData.primaryInvestigator || leadData.primaryOfficer)
      : (nextUsernames[0] || "");

  // update UI immediately
  setAssignedOfficers(nextUsernames);
  setLeadData((prev) => ({
    ...prev,
    assignedTo: nextAssignedTo,
    primaryOfficer: nextPrimary,
    primaryInvestigator: nextPrimary,
    leadStatus: nextUsernames.length ? "Assigned" : prev.leadStatus,
  }));

  // persist
  await handleSave(nextUsernames, {
    ...leadData,
    assignedTo: nextAssignedTo,
    primaryOfficer: nextPrimary,
    primaryInvestigator: nextPrimary,
    ...(nextUsernames.length ? { leadStatus: "Assigned" } : {}),
  });
}}

                      
                      />
                      <span className="inv-text">
                        {user.firstName} {user.lastName} ({user.username})
                      </span>
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
    )}
  </td>
</tr>


<tr>
  <td className="info-label">Primary Investigator *</td>
  <td>
    <select
      className="input-field"
      value={leadData.primaryOfficer}
      disabled={
        !(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") ||
        assignedOfficers.length === 0
      }
      onChange={async (e) => {
        const nextPrimary = e.target.value;
        setLeadData(prev => ({ ...prev, primaryOfficer: nextPrimary }));

        try {
          await handleSave(assignedOfficers, { ...leadData, primaryOfficer: nextPrimary }); // ✅ autosave
        } catch (err) {
          console.error("Auto-save failed", err);
          setAlertMessage("Failed to save Primary Investigator. Please try again.");
          setAlertOpen(true);
        }
      }}
    >
      <option value="" disabled>
        {assignedOfficers.length ? 'Select Primary' : 'Assign officers first'}
      </option>

      {assignedOfficers.map(uName => {
        const user = allUsers.find(u => u.username === uName);
        const label = user ? `${user.firstName} ${user.lastName} (${user.username})` : uName;
        return <option key={uName} value={uName}>{label}</option>;
      })}
    </select>
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
  {/* <td className="info-label" style={{ width: "25%" }}>Associated Subnumbers</td>
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
  </td> */}
  <td className="info-label" style={{ width: "25%" }}>Associated Subnumbers</td>
<td>
  {!isEditableByCaseManager("associatedSubNumbers") ? (
    <div
      className="dropdown-header"
      style={{ padding: "8px 10px", minHeight: "25px", border: "1px solid #ccc", borderRadius: "4px" }}
    >
      {associatedSubNumbers.length > 0 ? associatedSubNumbers.join(", ") : ""}
    </div>
  ) : (
    <div className="custom-dropdown">
      <div className="dropdown-header" onClick={() => setSubDropdownOpen(!subDropdownOpen)}>
        {associatedSubNumbers.length > 0 ? associatedSubNumbers.join(", ") : "Select Subnumbers"}
        <span className="dropdown-icon">{subDropdownOpen ? "▲" : "▼"}</span>
      </div>

      {subDropdownOpen && (
        <div className="dropdown-options">
          {subnumsLoading && <div className="dropdown-item">Loading…</div>}

          {!subnumsLoading && caseSubNumbers.length === 0 && (
            <div className="dropdown-item">No subnumbers for this case</div>
          )}

          {!subnumsLoading &&
            caseSubNumbers.length > 0 &&
            caseSubNumbers.map((subNum) => (
              <div key={subNum} className="dropdown-item">
                <input
                  type="checkbox"
                  id={`assoc-${subNum}`}
                  value={subNum}
                  checked={associatedSubNumbers.includes(subNum)}
                  onChange={(e) => {
                    const updated =
                      e.target.checked
                        ? [...associatedSubNumbers, subNum]
                        : associatedSubNumbers.filter((n) => n !== subNum);

                    // update UI immediately
                    setAssociatedSubNumbers(updated);
                    // persist to lead + autosave
                    saveField({ associatedSubNumbers: updated });
                  }}
                />
                <label htmlFor={`assoc-${subNum}`}>{subNum}</label>
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
             {/* {!isInvestigator && (
  <div className="update-lead-btn">
    <button className="save-btn1" onClick={handleSave}>
      Save Changes
    </button>
    {error && <div className="error">{error}</div>}
  </div>
)} */}
          </div>


            {canWorkOnReturn && (
            <div className="lead-tracker-container">
              {statuses.map((status, idx) => (
                <div
                  key={idx}
                  className="lead-tracker-row"
                  onClick={() => {
                    if (status === "Lead Return Submitted") handleNavigation("/LRInstruction");
                    if (status === "Lead Created") setEventsModalOpen(true);
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

            <LeadEventsModal
  open={eventsModalOpen}
  onClose={() => setEventsModalOpen(false)}
  events={eventsSorted}
/>

                </div>

</div>
        </div>
      </div>
    </div>
  );
};
