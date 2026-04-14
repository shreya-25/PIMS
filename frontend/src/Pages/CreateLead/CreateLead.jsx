import React, { useContext, useState, useEffect, useRef} from 'react';
import { useLocation } from 'react-router-dom';
import axios from "axios";
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import Navbar from '../../components/Navbar/Navbar'; // Import your Navbar component
import styles from './CreateLead.module.css';
import { CaseContext } from "../CaseContext";
import api from "../../api";
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";
import {SideBar } from "../../components/Sidebar/Sidebar";
import { AlertModal } from "../../components/AlertModal/AlertModal";



export const CreateLead = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook
  const FORM_KEY = 'CreateLead:form';
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const leadEntries = location.state?.leadEntries || [];
const caseDetails = location.state?.caseDetails || {}; // Get case details
const routerOrigin = location.state?.leadOrigin;
const leadDetails =  location.state?.leadDetails || {}; // Get case details
const leadOrigin = location.state?.leadOrigin || null; // Directly assign leadOrigin
const { id: caseID, title: caseName } = caseDetails;  // Extract Case ID & Case Title
const [showSelectModal, setShowSelectModal] = useState(false);
console.log(caseDetails, leadDetails, leadOrigin);
  const [pendingRoute, setPendingRoute]   = useState(null);
  const [caseTeam, setCaseTeam] = useState({detectiveSupervisor: "", caseManagers: [], investigators: [] });
const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
const [leadCreated, setLeadCreated] = useState(false);
const [submitting, setSubmitting] = useState(false);
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

const [username, setUsername] = useState("");
const [officersOpen, setOfficersOpen] = useState(false);
const [officersQuery, setOfficersQuery] = useState("");
   const [usernames, setUsernames] = useState([]); // State to hold fetched usernames


useEffect(() => {
    if (routerOrigin == null) {
      sessionStorage.removeItem(FORM_KEY);
    }
  }, [routerOrigin]);

useEffect(() => {
   const loggedInUser = localStorage.getItem("loggedInUser");
   if (loggedInUser) {
     setUsername(loggedInUser);
   }
  })


  // State for all input fields
  const [leadData, setLeadData] = useState(() => {
    const saved = sessionStorage.getItem(FORM_KEY);
    const base = saved ? JSON.parse(saved) : {
    CaseName: '',
    CaseNo: '',
    leadNumber: '',
    leadOrigin: '',
    incidentNumber: '',
    subCategory: '',
    associatedSubCategories: [],
    assignedDate: '',
    dueDate: '',
    leadSummary: '',
    assignedBy: '',
    leadDescription: '',
    primaryOfficer: '',
    assignedOfficer: [],
    accessLevel: 'Everyone',
      };

      return {
    ...base,
    // always override or seed from the router
     leadOrigin: routerOrigin != null ? String(routerOrigin) : '',

  };
});

const OFFICER_ROLES = new Set(["Detective Supervisor", "CaseManager", "Detective/Investigator"]);

const filteredOfficers = React.useMemo(() => {
  const eligible = (usernames || []).filter((u) => OFFICER_ROLES.has(u.role));
  const q = officersQuery.trim().toLowerCase();
  if (!q) return eligible;
  return eligible.filter((u) => {
    const a = (u.username || "").toLowerCase();
    const b = (u.firstName || "").toLowerCase();
    const c = (u.lastName || "").toLowerCase();
    return a.includes(q) || b.includes(q) || c.includes(q) || `${b} ${c}`.includes(q);
  });
}, [usernames, officersQuery]);

  useEffect(() => {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(leadData));
  }, [leadData]);

 const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [availableSubCategories, setAvailableSubCategories] = useState([
    "SUB-000001", "SUB-000002", "SUB-000003", "SUB-000004", "SUB-000005"
  ]); // Static List of Subcategories
  
  const [associatedSubCategories, setAssociatedSubCategories] = useState([]); // Selected Subcategories
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  const getFormattedDate = () => {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  useEffect(() => {
  const onDocClick = (e) => {
    const el = document.getElementById("assign-officers-wrap");
    if (el && !el.contains(e.target)) setOfficersOpen(false);
  };
  const onEsc = (e) => e.key === "Escape" && setOfficersOpen(false);

  document.addEventListener("mousedown", onDocClick);
  document.addEventListener("keydown", onEsc);
  return () => {
    document.removeEventListener("mousedown", onDocClick);
    document.removeEventListener("keydown", onEsc);
  };
}, []);

useEffect(() => {
  const fetchMaxLeadNumber = async () => {
    try {
      // Ensure caseDetails exists before proceeding.
      // if (!caseDetails) return;
      if (!selectedCase._id && !selectedCase.id) return;

      // Destructure case details
      // const { id: caseNo, title: caseName } = caseDetails;

      // Otherwise, fetch the max lead number using the caseId.
      const caseId = selectedCase._id || selectedCase.id;
      const response = await api.get(
        `/api/lead/maxLeadNumber?caseId=${caseId}`
      );
      const maxLeadNo = response.data.maxLeadNo || 0;
      console.log("Max fetch No", maxLeadNo, caseId);
      const newLeadNumber = maxLeadNo + 1;

      setLeadData((prevData) => ({
        ...prevData,
        leadNumber: newLeadNumber.toString(),
        assignedDate: getFormattedDate(),
        incidentNumber :  `INC-${newLeadNumber.toString().padStart(6, '0')}`,
      }));
    } catch (error) {
      console.error("Error fetching max lead number:", error);
    }
  };

  fetchMaxLeadNumber();
}, [selectedCase]);

useEffect(() => {
  const fetchAllLeads = async () => {
    if (!selectedCase?._id && !selectedCase?.id) return;

    try {
      const token = localStorage.getItem("token");
      const resp = await api.get(
        `/api/lead/case/${selectedCase._id || selectedCase.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // assume resp.data is an array
      let leadsArray = Array.isArray(resp.data) ? resp.data : [];

      // if user is _not_ a Case Manager, strip out CM-only leads:
      if (selectedCase.role !== "Case Manager") {
        leadsArray = leadsArray.filter(
          (l) => l.accessLevel !== "Only Case Manager and Assignees"
        );
      }

      setLeads((prev) => ({
        ...prev,
        allLeads: leadsArray.map((lead) => ({
          leadNo: lead.leadNo,
          description: lead.description,
          leadStatus: lead.leadStatus,
          // any other fields you need...
        })),
      }));
    } catch (err) {
      console.error("Error fetching all leads:", err);
    }
  };

  fetchAllLeads();
}, [selectedCase])


 const [leads, setLeads] = useState({
          assignedLeads: [],
          pendingLeads: [],
          pendingLeadReturns: [],
          allLeads: [],
     } );



 console.log("CD", caseDetails);

  // const handleInputChange = (field, value) => {
  //   // Validate leadNumber to allow only numeric values
  //   if (field === 'leadNumber' && !/^\d*$/.test(value)) {
  //     alert("Lead Number must be a numeric value.");
  //     return;
  //   }
  
  //   // Update state
  //   setLeadData({ ...leadData, [field]: value });
  // };

  const handleInputChange = (field, value) => {

    if (field === 'leadOrigin') {
    // Allow only digits, commas, and spaces
    const regex = /^[0-9,\s]*$/;
    if (!regex.test(value)) {
      setAlertMessage("Lead Origin should only contain numbers and commas.");
      setLeadCreated(false);
      setAlertOpen(true);
      return;
    }
    const numbers = value
    .split(',')
    .map((num) => parseInt(num.trim(), 10))
    .filter((num) => !isNaN(num)); // filter out empty/invalid entries

  if (numbers.some((num) => num > parseInt(leadData.leadNumber || "0", 10))) {
    setAlertMessage(`Lead Origin numbers cannot be greater than Lead Number (${leadData.leadNumber}).`);
    setLeadCreated(false);
    setAlertOpen(true);
    return;
  }
  }
    // Ensure only numeric values (or empty)
    if (field === 'leadNumber' && !/^\d*$/.test(value)) {
      // alert("Lead Number must be a numeric value.");
      setAlertMessage("Lead Number must be a numeric value.");
       setAlertOpen(true);
      return;
    }
  
    // Update state properly
    setLeadData((prevData) => ({
      ...prevData,
      [field]: value, // Allow empty value
    }));
  };
  
 const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
 const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
 const [leadDropdownOpen1, setLeadDropdownOpen1] = useState(true);


        
   const onShowCaseSelector = (route) => {
            navigate(route, { state: {caseDetails, leadDetails}});
        };

  // const handleInputChange = (field, value) => {
  //   setLeadData({ ...leadData, [field]: value });
  // };


  // const handleGenerateLead = () => {
  //   const { leadNumber, leadSummary, assignedDate, assignedOfficer, assignedBy } = leadData;
 
  //   // Check if mandatory fields are filled
  //   if (!leadNumber || !leadSummary || !assignedDate || !assignedOfficer || !assignedBy) {
  //     alert("Please fill in all the required fields before generating a lead.");
  //     return;
  //   }
 
  //   // Show confirmation alert before proceeding
  //   if (window.confirm("Are you sure you want to generate this lead?")) {
  //     const newLead = {
  //       leadNumber,
  //       leadSummary,
  //       assignedDate,
  //       assignedOfficer: Array.isArray(assignedOfficer)
  //         ? assignedOfficer
  //         : [assignedOfficer], // Ensure assignedOfficer is an array
  //       assignedBy,
  //       leadDescription: leadData.leadDescription,
  //       caseName: leadData.caseName,
  //     };
 
  //     // Save the new lead to localStorage
  //     const existingLeads = JSON.parse(localStorage.getItem("leads")) || [];
  //     localStorage.setItem("leads", JSON.stringify([...existingLeads, newLead]));
 
  //     // Navigate back to the Lead Log page and pass the new lead
  //     navigate("/LeadLog", { state: { newLead } });
 
  //     // Show success message
  //     alert("Lead successfully added!");
  //   }
  // };

  useEffect(() => {
  if (!selectedCase.caseNo) return;
  const fetchCaseTeam = async () => {
    const token = localStorage.getItem("token");
    const resp = await api.get(
      `/api/cases/${selectedCase.caseNo}/team`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Make sure caseManagers is always an array
    const managers = resp.data.caseManagers;
    setCaseTeam({
      detectiveSupervisor: resp.data.detectiveSupervisor || "",
      caseManagers: Array.isArray(managers) ? managers : managers ? [managers] : [],
      investigators: Array.isArray(resp.data.investigators)
        ? resp.data.investigators
        : resp.data.investigators
        ? [resp.data.investigators]
        : [],
    });
  };
  fetchCaseTeam().catch(console.error);
}, [selectedCase.caseNo]);




// const handleGenerateLead = async () => {
//   // parse comma-lists
//   const originNumbers = leadData.leadOrigin
//     .split(',')
//     .map((v) => parseInt(v.trim(), 10))
//     .filter((n) => !isNaN(n));

//   const subCategoriesArray = leadData.subCategory
//     .split(',')
//     .map((v) => v.trim())
//     .filter((s) => s);

//   try {
//     // 1) Create the lead
//     const response = await api.post(
//       "/api/lead/create",
//       {
//         caseName:            selectedCase.caseName,
//         caseNo:              selectedCase.caseNo,
//         parentLeadNo:        originNumbers,
//         incidentNo:          leadData.incidentNumber,
//         subCategory:           subCategoriesArray,
//         associatedSubCategories: leadData.associatedSubCategories,
//         dueDate:             leadData.dueDate,
//         assignedDate:        leadData.assignedDate,
//         assignedTo:          leadData.assignedOfficer,
//         assignedBy:          username,
//         summary:             leadData.leadSummary,
//         description:         leadData.leadDescription,
//         accessLevel:         leadData.accessLevel,
//       },
//       {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       }
//     );

//     // treat any 2xx as success
//     if (!leadData.leadDescription?.trim() || !leadData.leadSummary?.trim()) {
//     setAlertMessage("Mandatory fields missing");
//     setAlertOpen(true);
//     return;
//   }

//     if (response.status >= 200 && response.status < 300) {
//       const payload = response.data;

//   // If the server returns an array, pick [0]; else if it wraps it in .data, use that; otherwise assume top‑level.
//   let createdLead;
//   if (Array.isArray(payload)) {
//     createdLead = payload[0];
//   } else if (payload.data && typeof payload.data === "object") {
//     createdLead = payload.data;
//   } else {
//     createdLead = payload;
//   }

//   // 3) Safely read leadNo:
//   const realLeadNo = createdLead?.leadNo;
//   if (!realLeadNo) {
//     console.error("⚠️ Couldn’t find leadNo in response", payload);
//     setAlertMessage("Lead created, but could not read its number.");
//   } else {
//     setAlertMessage(`Lead #${realLeadNo} created successfully!`);
//   }

//    setLeadCreated(true);
//   setAlertOpen(true);
//   sessionStorage.removeItem(FORM_KEY);
    
//       const token = localStorage.getItem("token");

//       // 2) Determine which officers are truly new
//       const already = [
//         ...caseTeam.investigators,
//         ...caseTeam.caseManagers,
//         caseTeam.detectiveSupervisor,
//       ].filter(Boolean);

//       const newlyAdded = leadData.assignedOfficer.filter((u) => !already.includes(u));

//       // 3) If any new, push updated officers list
//       if (newlyAdded.length) {
//         const updatedInvestigators = [
//           ...caseTeam.investigators,
//           ...newlyAdded,
//         ];

//         const officers = [
//           ...(caseTeam.detectiveSupervisor
//             ? [{ name: caseTeam.detectiveSupervisor, role: "Detective Supervisor", status: "accepted" }]
//             : []),
//           ...((caseTeam.caseManagers || []).map((name) => ({
//             name,
//             role:   "Case Manager",
//             status: "accepted",
//           }))),
//           ...updatedInvestigators.map((name) => ({
//             name,
//             role:   "Investigator",
//             status: "pending",
//           })),
//         ];

//         await api.put(
//           `/api/cases/${encodeURIComponent(selectedCase.caseNo)}/${encodeURIComponent(selectedCase.caseName)}/officers`,
//           { officers },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       }

//       // 4) Build & send a single notification payload
//       if (leadData.assignedOfficer.length) {
//         const assignedToEntries = leadData.assignedOfficer.map((u) => ({
//           username: u,
//           role: (caseTeam.caseManagers || []).includes(u)
//             ? "Case Manager"
//             : u === caseTeam.detectiveSupervisor
//             ? "Detective Supervisor"
//             : "Investigator",
//           status: "pending",
//           unread: true,
//         }));

//         const notificationPayload = {
//           notificationId: Date.now().toString(),
//           assignedBy:     username,
//           assignedTo:     assignedToEntries,
//           action1:        "assigned you to a new lead",
//           post1:          `${realLeadNo}: ${leadData.leadDescription}`,
//           action2:        "related to the case",
//           post2:          `${selectedCase.caseNo}: ${selectedCase.caseName}`,
//           leadNo:         realLeadNo,
//           leadName:       leadData.leadDescription,
//           caseNo:         selectedCase.caseNo,
//           caseName:       selectedCase.caseName,
//           caseStatus:     "Open",
//           unread:         true,
//           type:           "Lead",
//           time:           new Date().toISOString(),
//         };

//         await api.post(
//           "/api/notifications",
//           notificationPayload,
//           {
//             headers: {
//               "Content-Type":  "application/json",
//               Authorization:   `Bearer ${token}`,
//             },
//           }
//         );
//       }

//       // 5) Finally navigate back and stop
//       // navigate(-1);
//       return;
//     }

//     // if we get here it wasn’t a 2xx
//     const text = await response.text();
//     throw new Error(`Unexpected status ${response.status}: ${text}`);
//   } catch (err) {
//     console.error("handleGenerateLead failed:", err);
//     const msg =
//       err.response?.data?.message ||
//       err.response?.data ||
//       err.message ||
//       "Unknown error";
//     // alert(`Error: ${typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg}`);
//     setAlertMessage(`Error: ${typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg}`);
//        setAlertOpen(true);
//   }
// };

const handleGenerateLead = async () => {
  // 1) Parse comma-lists
  const originNumbers = (leadData.leadOrigin || "")
    .split(",")
    .map((v) => parseInt(String(v).trim(), 10))
    .filter((n) => !isNaN(n));

  const subCategoriesArray = (leadData.subCategory || "")
    .split(",")
    .map((v) => String(v).trim())
    .filter((s) => s);

  // 2) Basic validation before any network calls
  if (!leadData.leadDescription?.trim() || !leadData.leadSummary?.trim()) {
    setAlertMessage("Mandatory fields missing");
    setLeadCreated(false);
    setAlertOpen(true);
    return;
  }

 const hasAssignees = assignedOfficerUsernames.length > 0;
const computedLeadStatus = hasAssignees ? "Assigned" : "Created";

if (hasAssignees && !leadData.primaryOfficer) {
  setAlertMessage("Please select a Primary Investigator.");
  setLeadCreated(false);
  setAlertOpen(true);
  return;
}
if (leadData.primaryOfficer && !assignedOfficerUsernames.includes(leadData.primaryOfficer)) {
  setAlertMessage("Primary Investigator must be one of the assigned officers.");
  setLeadCreated(false);
  setAlertOpen(true);
  return;
}

const orderedAssignees = hasAssignees
  ? [leadData.primaryOfficer, ...assignedOfficerUsernames.filter(u => u !== leadData.primaryOfficer)]
  : [];

  // If your backend expects objects { username, status }, map here instead:
  // const assignedToPayload = orderedAssignees.map(u => ({ username: u, status: "pending" }));
  const assignedToPayload = orderedAssignees; // ← usernames array (primary first)

  setSubmitting(true);
  try {
    // 4) Create the lead
    const response = await api.post(
      "/api/lead/create",
      {
        caseId:               selectedCase.id || selectedCase._id,
        caseName:             selectedCase.caseName?.trim(),
        caseNo:               selectedCase.caseNo?.trim(),
        parentLeadNo:         originNumbers,
        incidentNo:           leadData.incidentNumber?.trim(),
        subCategory:            subCategoriesArray,
        associatedSubCategories: leadData.associatedSubCategories,
        dueDate:              leadData.dueDate?.trim(),
        assignedDate:         leadData.assignedDate?.trim(),

        assignedTo:           assignedToPayload,
        primaryInvestigator:  leadData.primaryOfficer?.trim() || null,
        assignedBy:           username?.trim(),
        summary:              leadData.leadSummary?.trim(),
        description:          leadData.leadDescription?.trim(),
        accessLevel:          leadData.accessLevel,
        leadStatus:           computedLeadStatus,
      },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    if (response.status >= 200 && response.status < 300) {
      const payload = response.data;

      // 5) Safely read created lead
      let createdLead;
      if (Array.isArray(payload)) {
        createdLead = payload[0];
      } else if (payload?.data && typeof payload.data === "object") {
        createdLead = payload.data;
      } else {
        createdLead = payload;
      }

      const realLeadNo = createdLead?.leadNo;
      if (!realLeadNo) {
        console.error("⚠️ Couldn’t find leadNo in response", payload);
        setAlertMessage("Lead created, but could not read its number.");
      } else {
        setAlertMessage(`Lead #${realLeadNo} created successfully!`);
      }

      setLeadCreated(true);
      setAlertOpen(true);
      sessionStorage.removeItem(FORM_KEY);

      const token = localStorage.getItem("token");

      // 6) Update case team with any *new* investigators (compares to existing)
      const already = [
        ...caseTeam.investigators,
        ...caseTeam.caseManagers,
        caseTeam.detectiveSupervisor,
      ].filter(Boolean);

      const newlyAdded = leadData.assignedOfficer.filter((u) => !already.includes(u));
      if (newlyAdded.length) {
        const updatedInvestigators = [...caseTeam.investigators, ...newlyAdded];

        const officers = [
          ...(caseTeam.detectiveSupervisor
            ? [{ name: caseTeam.detectiveSupervisor, role: "Detective Supervisor", status: "accepted" }]
            : []),
          ...((caseTeam.caseManagers || []).map((name) => ({
            name,
            role: "Case Manager",
            status: "accepted",
          }))),

          // all investigators default pending (you can special-case primary as accepted here if you want)
          ...updatedInvestigators.map((name) => ({
            name,
            role: "Investigator",
            status: "pending",
          })),
        ];

        await api.put(
          `/api/cases/${encodeURIComponent(selectedCase.caseNo)}/${encodeURIComponent(selectedCase.caseName)}/officers`,
          { officers },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // 7) Notifications — keep primary first for display consistency
      if (orderedAssignees.length) {
        const assignedToEntries = orderedAssignees
          .filter((u) => u !== caseTeam.detectiveSupervisor)
          .map((u) => ({
            username: u,
            role: (caseTeam.caseManagers || []).includes(u)
              ? "Case Manager"
              : "Investigator",
            status: "pending",
            unread: true,
          }));

        const notificationPayload = {
          notificationId: Date.now().toString(),
          assignedBy:     username,
          assignedTo:     assignedToEntries,
          action1:        "assigned you to a new lead",
          post1:          `${realLeadNo ?? ""}: ${leadData.leadDescription}`,
          action2:        "related to the case",
          post2:          `${selectedCase.caseNo}: ${selectedCase.caseName}`,
          caseId:         selectedCase._id || selectedCase.id || undefined,
          leadNo:         realLeadNo ?? undefined,
          leadName:       leadData.leadDescription,
          caseNo:         selectedCase.caseNo,
          caseName:       selectedCase.caseName,
          caseStatus:     "Open",
          unread:         true,
          type:           "Lead",
          time:           new Date().toISOString(),
        };

        await api.post(
          "/api/notifications",
          notificationPayload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // navigate(-1); // if you want to go back automatically
      return;
    }

    // If we get here it wasn’t a 2xx
    const text = await response.text?.();
    throw new Error(`Unexpected status ${response.status}: ${text}`);
  } catch (err) {
    console.error("handleGenerateLead failed:", err);
    const msg =
      err.response?.data?.message ||
      err.response?.data ||
      err.message ||
      "Unknown error";
    setAlertMessage(`Error: ${typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg}`);
    setAlertOpen(true);
    setSubmitting(false);
  }
};

useEffect(() => {
  // Normalize any legacy saved value like [{ username: "alice" }] -> ["alice"]
  setLeadData(prev => {
    const arr = Array.isArray(prev.assignedOfficer) ? prev.assignedOfficer : [];
    const normalized = arr.map(x => (typeof x === "string" ? x : x?.username)).filter(Boolean);

    // also fix primary if it doesn't exist in the normalized list
    const primary = normalized.includes(prev.primaryOfficer) ? prev.primaryOfficer : "";

    // only update if something changed (avoid loops)
    if (
      normalized.length !== arr.length ||
      primary !== prev.primaryOfficer
    ) {
      return { ...prev, assignedOfficer: normalized, primaryOfficer: primary };
    }
    return prev;
  });
}, []); // run once after mount

const assignedOfficerUsernames = React.useMemo(
  () =>
    (leadData.assignedOfficer || [])
      .map(x => (typeof x === "string" ? x : x?.username))
      .filter(Boolean),
  [leadData.assignedOfficer]
);




const defaultCaseSummary = "";
const [availableCaseSubCategories, setAvailableCaseSubCategories] = useState([]); // To store subcategories fetched for the case

 // etch all subcategories for this case
 useEffect(() => {
  const fetchCaseSubCategories = async () => {
    try {
      if (caseDetails && caseDetails.id) {
        const token = localStorage.getItem("token");
        const response = await api.get(
          `/api/cases/${caseDetails.id}/subCategories`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAvailableCaseSubCategories(response.data.subCategories);
      }
    } catch (error) {
      console.error("Error fetching case subcategories:", error);
    }
  };

  fetchCaseSubCategories();
}, [caseDetails]);


const [caseSummary, setCaseSummary] = useState('' ||  defaultCaseSummary);

  const [isEditing, setIsEditing] = useState(false); // Controls whether the textarea is editable
  useEffect(() => {
   const fetchCaseSummary = async () => {
     try {
       if (caseDetails && caseDetails.id) {
         const token = localStorage.getItem("token");
         const response = await api.get(`/api/cases/summary/${caseDetails.id}`, {
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
 }, [caseDetails]);


  // New useEffect: Fetch all usernames for "Assign Officers"
  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/api/users/usernames", {
          // headers: {
          //   Authorization: `Bearer ${token}`
          // }
        });
        // Assuming the API returns an object with a "usernames" property that is an array.
        setUsernames(response.data.users);
      } catch (error) {
        console.error("Error fetching usernames:", error);
      }
    };

    fetchUsernames();
  }, []);

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
  const fetchAssociatedSubCategories = async () => {
    try {
      // Ensure we have valid case identifiers
      const caseId = selectedCase?._id || selectedCase?.id || caseDetails?._id || caseDetails?.id;

      if (!caseId) return;

      const token = localStorage.getItem("token");
      const response = await api.get(
        `/api/lead/associatedSubCategories/${caseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Fetched Associated Subcategories:", response.data);

      // Adjust if API returns differently
      const subs = response.data.associatedSubCategories || response.data.subCategories || [];
      setAvailableSubCategories(subs);
    } catch (error) {
      console.error("Error fetching associated subcategories:", error);
    }
  };

  fetchAssociatedSubCategories();
}, [selectedCase, caseDetails]);

  
    useEffect(() => {
      function handleClickOutside(e) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setDropdownOpen(false);
        }
      }
      if (dropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [dropdownOpen]);

    const displayUser = (uname) => {
  const user = usernames.find((u) => u.username === uname);
  if (!user) return uname;
  const full = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const title = user.title ? ` (${user.title})` : "";
  return full ? `${full}${title} (${user.username})` : user.username;
};


  return (
    <div className={styles.page}>
      {/* Navbar at the top */}
      <Navbar />
       <AlertModal
  isOpen={alertOpen}
  title="Notification"
  message={alertMessage}
  onConfirm={() => {
    setAlertOpen(false);
    if (leadCreated) navigate(-1);
  }}
  onClose={() => setAlertOpen(false)}
/>
      

      <div className={styles.mainContainer}>
       {/* <div className="sideitem">
       <ul className="sidebar-list">
                  

            <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
            <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li>            
            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item active" onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" 
             onClick={() => {
              selectedCase.role === "Investigator"
              ? setPendingRoute("/LRInstruction")
              : setPendingRoute("/LRInstruction")
             
              setShowSelectModal(true);
            }}>View Lead Return</li>
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
            </ul>)}

            <li className="sidebar-item" style={{ fontWeight: 'bold' }} onClick={() => setLeadDropdownOpen1(!leadDropdownOpen1)}>
          Lead Related Tabs {leadDropdownOpen1 ?  "▲": "▼"}
</li>
        {leadDropdownOpen1 && (
          <ul>
            <li className="sidebar-item" 
             onClick={() => {
              setPendingRoute("/leadReview");
              setShowSelectModal(true);
            }}>Lead Information</li>
            
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
</ul>)}
                    </ul>

                    {showSelectModal && (
      <SelectLeadModal
        leads={leads.allLeads}
        onSelect={handleSelectLead}
        onClose={() => setShowSelectModal(false)}
      />
    )}
                </div> */}
                <SideBar activePage = "CreateLead" />

                <div className={styles.leftContent}>
                {/* <h5 className = "side-titleLeft">  Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5> */}


        {/* Center Section */}
        <div className={styles.caseHeader}>
          <h2 >CREATE LEAD</h2>
          </div>


        {/* Right Section */}
        <div className={styles.lriContentSection}>
        <table className={styles.leadsTable}>
    <thead>
      <tr>

        <th style={{ width: "10%" }}>Lead No.</th>
          <th style={{ width: "10%" }}>Case No.</th>
          <th style={{ width: "10%" }}>Assigned By</th>
          <th style={{ width: "8%" }}>Assigned Date</th>
      </tr>
      </thead>
      <tbody>
      <tr>
      <td>{leadData.leadNumber} </td>
        <td>{selectedCase.caseNo}</td>
        <td>{username}</td>
        <td>{formatDate(leadData.assignedDate)} </td>

      </tr>
    </tbody>
  </table>


      {/* Bottom Content */}
      <div className={styles.bottomContent}>
        <table className={styles.detailsTable}>
          <tbody>
            <tr>
              <td>Case Name</td>
              <td colSpan={3}>
                <input
                  type="text"
                  className={styles.inputField}
                  value={selectedCase.caseName}
                  readOnly
                  placeholder=""
    />
              </td>
            </tr>
            <tr>
              <td>Lead Log Summary *</td>
              <td colSpan={3}>
                <input
                  type="text"
                  className={styles.inputField}
                  value={leadData.leadDescription}
                  onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                  placeholder=""
                  maxLength={100}
                />
                <small style={{ color: leadData.leadDescription.length >= 100 ? 'red' : '#888', fontSize: '0.8em' }}>
                  {leadData.leadDescription.length}/100
                </small>
              </td>
            </tr>
            <tr>
              <td> Lead Instruction *</td>
              <td colSpan={3}>
                <textarea
                  className={styles.textareaField}
                  value={leadData.leadSummary}
                  onChange={(e) => handleInputChange('leadSummary', e.target.value)}
                  placeholder=""
                ></textarea>
              </td>
            </tr>
            <tr>
                <td>Lead Origin</td>
                <td>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={leadData.leadOrigin}
                    onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                    placeholder="e.g. 1, 2, 3"
                  />
                </td>
                <td className={styles.labelCell}>Due Date</td>
                <td>
                  <input
                    type="date"
                    className={styles.inputField}
                    value={leadData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </td>
              </tr>
                <tr>
                  <td>Subcategory</td>
                  <td colSpan={3}>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={leadData.subCategory}
                      onChange={(e) => handleInputChange('subCategory', e.target.value)}
                      placeholder="e.g. suspect-info"
                    />
                  </td>
                </tr>
            <tr>
  <td>Associated Subcategories</td>
  <td colSpan={3}>
    <div className={styles.customDropdown} ref={dropdownRef}>
      <div
        className={styles.dropdownHeader}
        ref={dropdownRef}
        onClick={() => setSubDropdownOpen(!subDropdownOpen)}
      >
        {associatedSubCategories.length > 0
          ? associatedSubCategories.join(", ")
          : "Select Subcategories"}
        <span className={styles.dropdownIcon}>{subDropdownOpen ? "▲" : "▼"}</span>
      </div>
      {subDropdownOpen && (
        <div className={styles.dropdownOptions}>
          {availableSubCategories.length > 0 ? (
          availableSubCategories.map((subNum) => (
            <div key={subNum} className={styles.dropdownItem}>
              <input
                type="checkbox"
                id={subNum}
                value={subNum}
                checked={associatedSubCategories.includes(subNum)}
                onChange={(e) => {
                  const updatedSubCategories = e.target.checked
                    ? [...associatedSubCategories, e.target.value]
                    : associatedSubCategories.filter((num) => num !== e.target.value);
                  setAssociatedSubCategories(updatedSubCategories);

                  setLeadData((prevData) => ({
                    ...prevData,
                    associatedSubCategories: updatedSubCategories, // ✅ Add this
                  }));
                }}
              />
              <label htmlFor={subNum}>{subNum}</label>
            </div>
          )) ) : (
  <div className={styles.dropdownItemNoOption}>No subcategory added</div>
)}
        </div>
      )}
    </div>
  </td>
</tr>
          {/* <tr>
            <td>Priority:</td>
              <td>
              <div className={styles.customDropdown}>
                    <div
                      className={styles.dropdownHeader}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      {leadData.assignedOfficer.length > 0
                        ? leadData.assignedOfficer.join(', ')
                        : 'Select Priority'}
                      <span className={styles.dropdownIcon}>{dropdownOpen ? '▲' : '▼'}</span>
                    </div>
                    {dropdownOpen && (
                      <div className={styles.dropdownOptions}>
                        {['High', 'Medium', 'Low'].map((priority) => {
                          return (
                            <div key={officer} className={styles.dropdownItem}>
                              <input
                                type="checkbox"
                              />
                              <label htmlFor={priority}>{priority}</label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
              </td>
            </tr> */}

            <tr>

  <td>Assign Officers </td>
{/* <td colSpan={3}>

<div className={styles.customDropdown} ref={dropdownRef}>
  <div
    className={styles.dropdownHeader}
    onClick={() => setDropdownOpen(!dropdownOpen)}
  >
    {leadData.assignedOfficer.length > 0
      ? 
        leadData.assignedOfficer
          .map((uName) => displayUser(uName))
          .join(", ")
      : "Select Officers"}
    <span className={styles.dropdownIcon}>{dropdownOpen ? "▲" : "▼"}</span>
  </div>

  {dropdownOpen && (
    <div className={styles.dropdownOptions}>
      {usernames.length > 0 ? (
        usernames.map((user) => (
          <div key={user.username} className={styles.dropdownItem}>
            <input
              type="checkbox"
              id={user.username}
              value={user.username}
              checked={leadData.assignedOfficer.includes(user.username)}
           
              onChange={(e) => {
                const { checked, value } = e.target;
                const newList = checked
                  ? [...assignedOfficerUsernames, value]
                  : assignedOfficerUsernames.filter((o) => o !== value);

                const newPrimary = newList.includes(leadData.primaryOfficer) ? leadData.primaryOfficer : "";
                setLeadData(prev => ({ ...prev, assignedOfficer: newList, primaryOfficer: newPrimary }));
              }}


            />
            <label htmlFor={user.username}>
              {user.firstName} {user.lastName} ({user.username})
            </label>
          </div>
        ))
      ) : (
        <div className={styles.dropdownItem}>No officers found</div>
      )}
    </div>
  )}
</div>
</td> */}
<td colSpan={3}>
  <div id="assign-officers-wrap" className={styles.invDropdown}>
    {/* Trigger shows selected officer names (or placeholder) */}
    <button
      type="button"
      className={styles.invInput}
      onClick={() => setOfficersOpen((o) => !o)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOfficersOpen((o) => !o)}
      aria-haspopup="listbox"
      aria-expanded={officersOpen}
      title={
        assignedOfficerUsernames.length
          ? assignedOfficerUsernames.map(displayUser).join(", ")
          : "Select Officers"
      }
    >
      <span className={styles.invInputLabel}>
        {assignedOfficerUsernames.length
          ? assignedOfficerUsernames.map(displayUser).join(", ")
          : "Select Officers"}
      </span>
      <span className={styles.invCaret} aria-hidden />
    </button>

    {officersOpen && (
      <div className={styles.invOptions} role="listbox" onMouseDown={(e) => e.stopPropagation()}>
        {/* Sticky search */}
        <div className={styles.invSearchWrap}>
          <input
            type="text"
            className={styles.invSearch}
            placeholder="Type to filter officers…"
            value={officersQuery}
            onChange={(e) => setOfficersQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* List */}
        <div className={styles.invList}>
          {filteredOfficers.length ? (
            filteredOfficers.map((user) => {
              const checked = assignedOfficerUsernames.includes(user.username);
              return (
                <label key={user.username} className={styles.invItem}>
                  <input
                    type="checkbox"
                    value={user.username}
                    checked={checked}
                    onChange={(e) => {
                      const { checked, value } = e.target;
                      const newList = checked
                        ? [...assignedOfficerUsernames, value]
                        : assignedOfficerUsernames.filter((o) => o !== value);

                      // keep primary valid: clear if it’s no longer in the list
                      // const newPrimary = newList.includes(leadData.primaryOfficer)
                      //   ? leadData.primaryOfficer
                      //   : "";
                       const newPrimary = newList.includes(leadData.primaryOfficer)
                        ? leadData.primaryOfficer
                        : (newList.length === 1 ? newList[0] : "");

                      setLeadData((prev) => ({
                        ...prev,
                        assignedOfficer: newList,
                        primaryOfficer: newPrimary,
                      }));
                    }}
                  />
                  <span className={styles.invText}>
                    {`${user.firstName || ""} ${user.lastName || ""}`.trim()}{user.title ? ` (${user.title})` : ""} ({user.username})
                  </span>
                </label>
              );
            })
          ) : (
            <div className={styles.invEmpty}>No matches</div>
          )}
        </div>
      </div>
    )}
  </div>
</td>

</tr>
<tr>
  <td>Primary Investigator *</td>
  <td>
    <select
      className={styles.inputField}
      value={leadData.primaryOfficer}
      onChange={(e) => handleInputChange('primaryOfficer', e.target.value)}
      disabled={assignedOfficerUsernames.length === 0}
    >
      <option value="" disabled>
        {assignedOfficerUsernames.length ? 'Select Primary' : 'Select officers first'}
      </option>
      {assignedOfficerUsernames.map((uName) => {
        const user = usernames.find((u) => u.username === uName);
        const full = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";
        const title = user?.title ? ` (${user.title})` : "";
        const label = full ? `${full}${title} (${uName})` : uName;
        return (
          <option key={uName} value={uName}>{label}</option>
        );
      })}
    </select>
  </td>
  <td className={styles.labelCell}>Access</td>
  <td>
    <select
      className={styles.inputField}
      value={leadData.accessLevel}
      onChange={(e) => handleInputChange("accessLevel", e.target.value)}
    >
      <option value="Only Case Manager and Assignees">Only Case Manager and Assignees</option>
      <option value="Everyone">Everyone</option>
    </select>
  </td>
</tr>
          </tbody>
        </table>
      </div>


      {/* Action Buttons */}
      <div className={styles.btnSec}>
        <button
          className={styles.nextBtn}
          onClick={handleGenerateLead}
          disabled={submitting || leadCreated}
        >
          {submitting ? "Creating…" : "Create Lead"}
        </button>
        {/* <button className={styles.nextBtn}>Download</button>
        <button className={styles.nextBtn}>Print</button> */}
      </div>
    </div>
    </div>
    </div>
    </div>
  );
};