import React, { useContext, useState, useEffect, useRef} from 'react';
import { useLocation } from 'react-router-dom';
import axios from "axios";
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import Navbar from '../../components/Navbar/Navbar'; // Import your Navbar component
import './CreateLead.css'; // Create this CSS file for styling
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
const leadDetails =  location.state?.leadDetails || {}; // Get case details
const leadOrigin = location.state?.leadOrigin || null; // Directly assign leadOrigin
const { id: caseID, title: caseName } = caseDetails;  // Extract Case ID & Case Title
const [showSelectModal, setShowSelectModal] = useState(false);
console.log(caseDetails, leadDetails, leadOrigin);
  const [pendingRoute, setPendingRoute]   = useState(null);
  const [caseTeam, setCaseTeam] = useState({detectiveSupervisor: "", caseManagers: [], investigators: [] });
const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
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

useEffect(() => {
   const loggedInUser = localStorage.getItem("loggedInUser");
   if (loggedInUser) {
     setUsername(loggedInUser);
   }
  })


  // State for all input fields
  const [leadData, setLeadData] = useState(() => {
    const saved = sessionStorage.getItem(FORM_KEY);
    return saved
      ? JSON.parse(saved)
      : {
    CaseName: '',
    CaseNo: '',
    leadNumber: '',
    leadOrigin: '',
    incidentNumber: '',
    subNumber: '',
    associatedSubNumbers: [],
    assignedDate: '',
    dueDate: '',
    leadSummary: '',
    assignedBy: '',
    leadDescription: '',
    assignedOfficer: [],
    accessLevel: 'Everyone',
      };
  });

  useEffect(() => {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(leadData));
  }, [leadData]);

 const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [availableSubNumbers, setAvailableSubNumbers] = useState([
    "SUB-000001", "SUB-000002", "SUB-000003", "SUB-000004", "SUB-000005"
  ]); // Static List of Subnumbers
  
  const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]); // Selected Subnumbers
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  const getFormattedDate = () => {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

useEffect(() => {
  const fetchMaxLeadNumber = async () => {
    try {
      // Ensure caseDetails exists before proceeding.
      // if (!caseDetails) return;
      if (!selectedCase.caseNo || !selectedCase.caseName) return;

      // Destructure case details
      // const { id: caseNo, title: caseName } = caseDetails;

      // Otherwise, fetch the max lead number using the caseNo and caseName.
      const response = await api.get(
        `/api/lead/maxLeadNumber?caseNo=${selectedCase.caseNo}&caseName=${encodeURIComponent(selectedCase.caseName)}`
      );
      const maxLeadNo = response.data.maxLeadNo || 0;
      console.log("Max fetch No", maxLeadNo, selectedCase.caseNo, selectedCase.caseName );
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
    if (!selectedCase?.caseNo || !selectedCase?.caseName) return;

    try {
      const token = localStorage.getItem("token");
      const resp = await api.get(
        `/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`,
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
   const [usernames, setUsernames] = useState([]); // State to hold fetched usernames


        
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


const handleGenerateLead = async () => {
  // parse comma-lists
  const originNumbers = leadData.leadOrigin
    .split(',')
    .map((v) => parseInt(v.trim(), 10))
    .filter((n) => !isNaN(n));

  const subNumbersArray = leadData.subNumber
    .split(',')
    .map((v) => v.trim())
    .filter((s) => s);

  try {
    // 1) Create the lead
    const response = await api.post(
      "/api/lead/create",
      {
        caseName:            selectedCase.caseName,
        caseNo:              selectedCase.caseNo,
        parentLeadNo:        originNumbers,
        incidentNo:          leadData.incidentNumber,
        subNumber:           subNumbersArray,
        associatedSubNumbers: leadData.associatedSubNumbers,
        dueDate:             leadData.dueDate,
        assignedDate:        leadData.assignedDate,
        assignedTo:          leadData.assignedOfficer,
        assignedBy:          username,
        summary:             leadData.leadSummary,
        description:         leadData.leadDescription,
        accessLevel:         leadData.accessLevel,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    // treat any 2xx as success
    if (!leadData.leadDescription?.trim() || !leadData.leadSummary?.trim()) {
    setAlertMessage("Mandatory fields missing");
    setAlertOpen(true);
    return;
  }

    if (response.status >= 200 && response.status < 300) {
      const payload = response.data;

  // If the server returns an array, pick [0]; else if it wraps it in .data, use that; otherwise assume top‑level.
  let createdLead;
  if (Array.isArray(payload)) {
    createdLead = payload[0];
  } else if (payload.data && typeof payload.data === "object") {
    createdLead = payload.data;
  } else {
    createdLead = payload;
  }

  // 3) Safely read leadNo:
  const realLeadNo = createdLead?.leadNo;
  if (!realLeadNo) {
    console.error("⚠️ Couldn’t find leadNo in response", payload);
    setAlertMessage("Lead created, but could not read its number.");
  } else {
    setAlertMessage(`Lead #${realLeadNo} created successfully!`);
  }

  setAlertOpen(true);
  sessionStorage.removeItem(FORM_KEY);
    
      const token = localStorage.getItem("token");

      // 2) Determine which officers are truly new
      const already = [
        ...caseTeam.investigators,
        ...caseTeam.caseManagers,
        caseTeam.detectiveSupervisor,
      ].filter(Boolean);

      const newlyAdded = leadData.assignedOfficer.filter((u) => !already.includes(u));

      // 3) If any new, push updated officers list
      if (newlyAdded.length) {
        const updatedInvestigators = [
          ...caseTeam.investigators,
          ...newlyAdded,
        ];

        const officers = [
          ...(caseTeam.detectiveSupervisor
            ? [{ name: caseTeam.detectiveSupervisor, role: "Detective Supervisor", status: "accepted" }]
            : []),
          ...((caseTeam.caseManagers || []).map((name) => ({
            name,
            role:   "Case Manager",
            status: "accepted",
          }))),
          ...updatedInvestigators.map((name) => ({
            name,
            role:   "Investigator",
            status: "pending",
          })),
        ];

        await api.put(
          `/api/cases/${encodeURIComponent(selectedCase.caseNo)}/${encodeURIComponent(selectedCase.caseName)}/officers`,
          { officers },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // 4) Build & send a single notification payload
      if (leadData.assignedOfficer.length) {
        const assignedToEntries = leadData.assignedOfficer.map((u) => ({
          username: u,
          role: (caseTeam.caseManagers || []).includes(u)
            ? "Case Manager"
            : u === caseTeam.detectiveSupervisor
            ? "Detective Supervisor"
            : "Investigator",
          status: "pending",
          unread: true,
        }));

        const notificationPayload = {
          notificationId: Date.now().toString(),
          assignedBy:     username,
          assignedTo:     assignedToEntries,
          action1:        "assigned you to a new lead",
          post1:          `${realLeadNo}: ${leadData.leadDescription}`,
          action2:        "related to the case",
          post2:          `${selectedCase.caseNo}: ${selectedCase.caseName}`,
          leadNo:         realLeadNo,
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
              "Content-Type":  "application/json",
              Authorization:   `Bearer ${token}`,
            },
          }
        );
      }

      // 5) Finally navigate back and stop
      // navigate(-1);
      return;
    }

    // if we get here it wasn’t a 2xx
    const text = await response.text();
    throw new Error(`Unexpected status ${response.status}: ${text}`);
  } catch (err) {
    console.error("handleGenerateLead failed:", err);
    const msg =
      err.response?.data?.message ||
      err.response?.data ||
      err.message ||
      "Unknown error";
    // alert(`Error: ${typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg}`);
    setAlertMessage(`Error: ${typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg}`);
       setAlertOpen(true);
  }
};




// const handleGenerateLead = async () => {

//   const originNumbers = leadData.leadOrigin
//   .split(',')
//   .map((val) => parseInt(val.trim()))
//   .filter((num) => !isNaN(num));

//   const subNumbersArray = leadData.subNumber
//   .split(',')
//   .map((val) => val.trim())
//   .filter((val) => val !== '');

//   try {
//     const response = await api.post(
//       "/api/lead/create", // Replace with your backend endpoint
//       {
//         caseName: selectedCase.caseName,
//         caseNo:   selectedCase.caseNo,
//         leadNo:   leadData.leadNumber,
//         parentLeadNo:       originNumbers,
//         incidentNo:         leadData.incidentNumber,
//         subNumber:          subNumbersArray,
//         associatedSubNumbers: leadData.associatedSubNumbers,
//         dueDate:      leadData.dueDate,
//         assignedDate: leadData.assignedDate,
//         assignedTo:   leadData.assignedOfficer,
//         assignedBy:   username,
//         summary:      leadData.leadSummary,
//         description:  leadData.leadDescription,
//         accessLevel:  leadData.accessLevel,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       }
//     );


//     if (response.status === 201) {
//       alert("Lead successfully added!");
      

//       const token = localStorage.getItem("token");
//       const cNo    = encodeURIComponent(selectedCase.caseNo);
//       const cName  = encodeURIComponent(selectedCase.caseName);

//       const allAlreadyOnCase = [
//         ...caseTeam.investigators,
//         ...caseTeam.caseManagers,
//         caseTeam.detectiveSupervisor
//       ].filter(Boolean);

//       const newlyAdded = leadData.assignedOfficer.filter(
//         u => !allAlreadyOnCase.includes(u)
//       );

//       if (newlyAdded.length) {

//         const officers = [
//                     // only add Supervisor if we actually fetched one
//                     ...(caseTeam.detectiveSupervisor
//                       ? [{ name: caseTeam.detectiveSupervisor,
//                             role: "Detective Supervisor",
//                             status: "accepted" }]
//                       : []),

//                     // only add CM if present
//                     ...((caseTeam.caseManagers || []).map(n => ({
//                           name: n,
//                           role:   "Case Manager",
//                           status: "accepted"
//                     }))),

//                     // then all investigators (old + new)
//                     ...updatedInvestigators.map(n => ({
//                       name: n,
//                       role:   "Investigator",
//                       status: "pending"
//                     }))
//                   ];


//         // 3) push them in one PUT to your /officers route
//         await api.put(
//           `/api/cases/${encodeURIComponent(selectedCase.caseNo)}/${encodeURIComponent(selectedCase.caseName)}/officers`,
//           { officers },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

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

//       const notificationPayload = {
//         notificationId: Date.now().toString(), // Use timestamp as a unique ID; customize if needed
//         assignedBy: username, // the logged-in user creates the lead
//         assignedTo: assignedToEntries, // send notification to the selected officers
//         action1: "assigned you to a new lead ", // action text; change as needed
//         post1: `${leadNumber}: ${leadDescription}`, // you might want to use the case title or lead summary here
//         action2:"related to the case",
//         post2: `${selectedCase.caseNo}: ${selectedCase.caseName}`,
//         leadNo: leadNumber,         // include lead details if desired
//         leadName: leadDescription,      // or leave empty as per your requirements
//         caseNo: selectedCase.caseNo,     // using the case ID
//         caseName: selectedCase.caseName,
//         caseStatus: "Open",
//         unread: true,
//         type: "Lead",
//         time: new Date().toISOString(),
//       };

//       // Send notification using axios
//         const notifResponse = await api.post(
//           "/api/notifications",
//           notificationPayload,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//         console.log("Notification sent successfully:", notifResponse.data);
      
//       navigate(-1); // Navigate to Lead Log page
//       return;
//     }

//     throw new Error(`Unexpected status code ${createResp.status}`);
//      } catch (err) {
//     console.error("handleGenerateLead failed:", err);

//     // peel off the most helpful message you can
//     const msg =
//       err.response?.data?.message ||
//       err.response?.data ||
//       err.message ||
//       "Unknown error";

//     alert(`Error: ${typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg}`);
//   }
// };

// console.log("Submitting leadData:", leadData);


const defaultCaseSummary = "";
const [availableCaseSubNumbers, setAvailableCaseSubNumbers] = useState([]); // To store subnumbers fetched for the case

 // etch all subnumbers for this case
 useEffect(() => {
  const fetchCaseSubNumbers = async () => {
    try {
      if (caseDetails && caseDetails.id) {
        const token = localStorage.getItem("token");
        const response = await api.get(
          `/api/cases/${caseDetails.id}/subNumbers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAvailableCaseSubNumbers(response.data.subNumbers);
      }
    } catch (error) {
      console.error("Error fetching case subnumbers:", error);
    }
  };

  fetchCaseSubNumbers();
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
    const fetchAssociatedSubNumbers = async () => {
      try {
        if (caseDetails && caseDetails.id && caseDetails.title) {
          const token = localStorage.getItem("token");
          const response = await api.get(
            `/api/lead/associatedSubNumbers/${caseDetails.id}/${encodeURIComponent(caseDetails.title)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setAvailableSubNumbers(response.data.associatedSubNumbers);
        }
      } catch (error) {
        console.error("Error fetching associated subnumbers:", error);
      }
    };
  
    fetchAssociatedSubNumbers();
  }, [caseDetails]);
  
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


  return (
    <div className="lead-instructions-page">
      {/* Navbar at the top */}
      <Navbar />
       <AlertModal
  isOpen={alertOpen}
  title="Notification"
  message={alertMessage}
  onConfirm={() => {
    setAlertOpen(false);
    navigate(-1);
  }}
  onClose={() => setAlertOpen(false)}
/>
      

      <div className="LRI_Content">
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
                <SideBar activePage = "CasePageManager" />

                <div className="left-content">
                <h5 className = "side-titleLeft">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>



        {/* Center Section */}
        <div className="case-header">
          <h2 >CREATE LEAD</h2>
          </div>


        {/* Right Section */}
        <div className="LRI-content-section">
        <table className="leads-table">
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
      <div className="bottom-content-LRI">
        <table className="details-table">
          <tbody>
            <tr>
              <td>Case Name</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={selectedCase.caseName}
                  onChange={(e) => handleInputChange('caseName', e.target.value)} // Update 'caseName' in leadData
                  placeholder=""
    />
              </td>
            </tr>
            <tr>
              <td>Lead Log Summary *</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.leadDescription}
                  onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                  placeholder=""
                />
              </td>
            </tr>
            <tr>
              <td> Lead Instruction *</td>
              <td>
                <textarea
                  className="textarea-field-cl"
                  value={leadData.leadSummary}
                  onChange={(e) => handleInputChange('leadSummary', e.target.value)}
                  placeholder=""
                ></textarea>
              </td>
            </tr>
            <tr>
                <td>Lead Origin</td>
                <td>
                  {/* <input
                    type="text"
                    className="input-field"
                    value={leadData.leadOrigin || leadOrigin}
                    onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                    placeholder=""
                  /> */}
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.leadOrigin}
                    onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                    placeholder="e.g. 1, 2, 3"
                  />
                  

                </td>
              </tr>
                <tr>
                  <td>Subnumber</td>
                  <td>
                    {/* <input
                      type="text"
                      className="input-field"
                      value={leadData.subNumber}
                      onChange={(e) => {
                        const values = e.target.value.split(',').map(val => val.trim()).filter(Boolean);
                        handleInputChange('subNumber', values); // Pass array to state
                      }}
                      placeholder="Enter Subnumber"
                    /> */}
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.subNumber}
                      onChange={(e) => handleInputChange('subNumber', e.target.value)}
                      placeholder="e.g. SUB-000001, SUB-000002"
                    />
                  </td>
                </tr>
            <tr>
  <td>Associated Subnumbers</td>
  <td>
    <div className="custom-dropdown-cl" ref={dropdownRef}>
      <div
        className="dropdown-header-cl"
        ref={dropdownRef}
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
                  const updatedSubNumbers = e.target.checked
                    ? [...associatedSubNumbers, e.target.value]
                    : associatedSubNumbers.filter((num) => num !== e.target.value);
                  setAssociatedSubNumbers(updatedSubNumbers);

                  setLeadData((prevData) => ({
                    ...prevData,
                    associatedSubNumbers: updatedSubNumbers, // ✅ Add this
                  }));
                }}
              />
              <label htmlFor={subNum}>{subNum}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  </td>
</tr>
<tr>
  <td>Due Date </td>
  <td>
    <input
      type="date"
      className="input-field"
      value={leadData.dueDate}
      onChange={(e) => handleInputChange('dueDate', e.target.value)}
      // placeholder="MM/DD/YY"
      style={{
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        border: '1px solid #ccc',
        padding: '8px',
        color: '#333',
        borderRadius: '4px',
        fontSize: '20px',
        backgroundColor: 'white',
      }}
    />
  </td>
</tr>


          {/* <tr>
            <td>Priority:</td>
              <td>
              <div className="custom-dropdown-cl">
                    <div
                      className="dropdown-header-cl"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      {leadData.assignedOfficer.length > 0
                        ? leadData.assignedOfficer.join(', ')
                        : 'Select Priority'}
                      <span className="dropdown-icon">{dropdownOpen ? '▲' : '▼'}</span>
                    </div>
                    {dropdownOpen && (
                      <div className="dropdown-options">
                        {['High', 'Medium', 'Low'].map((priority) => {
                          return (
                            <div key={officer} className="dropdown-item">
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
  {/* <td>Assign Officers:</td>
  <td>
    <div className="custom-dropdown-cl">
      <div
        className="dropdown-header-cl"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {leadData.assignedOfficer.length > 0
          ? leadData.assignedOfficer.join(', ')
          : 'Select Officers'}
        <span className="dropdown-icon">{dropdownOpen ? '▲' : '▼'}</span>
      </div>
      {dropdownOpen && (
        <div className="dropdown-options">
          {['Officer 1 [5] [4]', 'Officer 2 [3] [3]', 'Officer 3 [2] [1]'].map((officer) => (
            <div key={officer} className="dropdown-item">
              <input
                type="checkbox"
                id={officer}
                value={officer}
                checked={leadData.assignedOfficer.includes(officer)}
                onChange={(e) => {
                  const newAssignedOfficers = e.target.checked
                    ? [...leadData.assignedOfficer, e.target.value]
                    : leadData.assignedOfficer.filter((o) => o !== e.target.value);
                  handleInputChange('assignedOfficer', newAssignedOfficers);
                }}
              />
              <label htmlFor={officer}>{officer}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  </td> */}
  <td>Assign Officers </td>
<td>
  {/* <div className="custom-dropdown-cl">
    <div
      className="dropdown-header-cl"
      onClick={() => setDropdownOpen(!dropdownOpen)}
    >
      {leadData.assignedOfficer.length > 0
        ? leadData.assignedOfficer.join(', ')
        : 'Select Officers'}
      <span className="dropdown-icon">{dropdownOpen ? '▲' : '▼'}</span>
    </div>
    {dropdownOpen && (
      <div className="dropdown-options">
        {[
            { name: "Officer 1", assignedLeads: 2, totalAssignedLeads: 1, assignedDays: 5, unavailableDays: 4 },
            { name: "Officer 2", assignedLeads: 3, totalAssignedLeads: 3, assignedDays: 3, unavailableDays: 3 },
            { name: "Officer 3", assignedLeads: 3, totalAssignedLeads: 3, assignedDays: 2, unavailableDays: 1 },
          ].map((officer) => {
            const isAvailable =
              officer.unavailableDays === 0
                ? "Available"
                : `Unavailable for ${officer.unavailableDays} days`;
        // {['Officer 1 [2] [1]', 'Officer 2 [3] [3]', 'Officer 3 [5] [4]'].map((officer) => {
          // const officerName = officer.split(' [')[0]; // Extract only the name

          return (
            <div key={officer} className="dropdown-item">
              <input
                type="checkbox"
                id={officer.name}
                value={officer.name} // Store only the officer's name
                checked={leadData.assignedOfficer.includes(officer.name)}
                onChange={(e) => {
                  const newAssignedOfficers = e.target.checked
                    ? [...leadData.assignedOfficer, e.target.value]
                    : leadData.assignedOfficer.filter((o) => o !== e.target.value);
                  handleInputChange('assignedOfficer', newAssignedOfficers);
                }}
              />
              <label htmlFor={officer.name}>
                  {officer.name}{" "}[{officer.assignedLeads}] {" "} [{officer.totalAssignedLeads}] {"   "}
                  <em style={{ fontSize: "20px", color: "gray" }}>
                    ({isAvailable})
                  </em>
                </label>
            </div>
          );
        })}
      </div>
    )}
  </div> */}

<div className="custom-dropdown-cl" ref={dropdownRef}>
  {/* Header */}
  <div
    className="dropdown-header-cl"
    onClick={() => setDropdownOpen(!dropdownOpen)}
  >
    {leadData.assignedOfficer.length > 0
      ? // map each assigned username back to its user object
        leadData.assignedOfficer
          .map((uName) => {
            const user = usernames.find((u) => u.username === uName);
            return user
              ? `${user.firstName} ${user.lastName} (${user.username})`
              : uName;
          })
          .join(", ")
      : "Select Officers"}
    <span className="dropdown-icon">{dropdownOpen ? "▲" : "▼"}</span>
  </div>

  {/* Options */}
  {dropdownOpen && (
    <div className="dropdown-options">
      {usernames.length > 0 ? (
        usernames.map((user) => (
          <div key={user.username} className="dropdown-item">
            <input
              type="checkbox"
              id={user.username}
              value={user.username}
              checked={leadData.assignedOfficer.includes(user.username)}
              onChange={(e) => {
                const { checked, value } = e.target;
                const newList = checked
                  ? [...leadData.assignedOfficer, value]
                  : leadData.assignedOfficer.filter((o) => o !== value);
                handleInputChange("assignedOfficer", newList);
              }}
            />
            <label htmlFor={user.username}>
              {user.firstName} {user.lastName} ({user.username})
            </label>
          </div>
        ))
      ) : (
        <div className="dropdown-item">No officers found</div>
      )}
    </div>
  )}
</div>

</td>
</tr>
<tr>
  <td>Access</td>
  <td>
    <select
      className="input-field"
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
      <div className="btn-sec-cl">
        <button className="next-btncl" onClick={handleGenerateLead}>
          Create Lead
        </button>
        <button className="next-btncl">Download</button>
        <button className="next-btncl">Print</button>
      </div>
    </div>
    </div>
    </div>
    </div>
  );
};