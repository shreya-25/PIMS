import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import Comment from "../../../components/Comment/Comment";
import "./LRReturn.css";
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";



export const LRReturn = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
    const FORM_KEY    = "LRReturn:form";
    const LIST_KEY    = "LRReturn:list";
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState("");
    const [leadData, setLeadData] = useState({});
    const [officerName, setOfficerName] = useState("");
    const todayDate = new Date().toLocaleDateString();
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    
    const { leadDetails, caseDetails } = location.state || {};
    const [maxReturnId, setMaxReturnId] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus, setLeadReturns  } = useContext(CaseContext);
    const isDisabled = leadStatus === "In Review" || leadStatus === "Completed";

    const caseNo = selectedCase?.caseNo ?? caseDetails.caseNo;

    useEffect(() => {
    const storedOfficer = localStorage.getItem("loggedInUser");
    if (storedOfficer) {
        const name = storedOfficer.trim();
        setOfficerName(name);
        setReturnData(prev => ({ ...prev, enteredBy: name }));
      }
    }, []);

    console.log(selectedCase, selectedLead);


    useEffect(() => {
    const fetchLeadData = async () => {
      if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;
      const token = localStorage.getItem("token");

      try {
        const response = await api.get(
          `/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.length > 0) {
          setLeadData({
            ...response.data[0],
            assignedTo: response.data[0].assignedTo || [],
            leadStatus: response.data[0].leadStatus || ''
          });
        }
      } catch (error) {
        console.error("Failed to fetch lead data:", error);
      }
    };

    fetchLeadData();
  }, [selectedLead, selectedCase]);

  setLeadStatus(leadData.leadStatus);

   useEffect(() => {
      const fetchLeadStatus = async () => {
        try {
          const token = localStorage.getItem("token");
          const { leadNo, leadName } = selectedLead;
          const { caseNo, caseName } = selectedCase;
    
         const resp = await api.get(
          `/api/lead/status/${leadNo}/${encodeURIComponent(leadName)}/${caseNo}/${encodeURIComponent(caseName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const leadStatus = resp.data.leadStatus;

        if (Array.isArray(resp.data) && resp.data.length > 0) {
          setLeadStatus(resp.data.leadStatus);
        } else {
          console.warn("No lead returned when fetching status");
                    setLeadStatus("Unknown");
        }
      } catch (err) {
        console.error("Failed to fetch lead status", err);
        setError("Could not load lead status");
      } finally {
        setLoading(false);
      }
    };
    
     if (selectedLead?.leadNo && selectedLead?.leadName && selectedCase?.caseNo && selectedCase?.caseName) {
      fetchLeadStatus();
    }
   }, [selectedLead, selectedCase, setLeadStatus]); 



  // State for managing form input

const [returnData, setReturnData]   = useState(() => {
    // Initialize from sessionStorage if present, otherwise default
    const saved = sessionStorage.getItem(FORM_KEY);
    return saved
      ? JSON.parse(saved)
      : { results: "", leadReturnId: "", enteredDate: new Date().toLocaleDateString(), enteredBy: officerName?.trim(), accessLevel: "Everyone" };
  });
  const [returns, setReturns] = useState(() => {
    const saved = sessionStorage.getItem(LIST_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleInputChange = (field, value) => {
    setReturnData({ ...returnData, [field]: value });
  };

  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};

// Helper functions to convert between alphabets and numbers
const alphabetToNumber = (str) => {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * 26 + (str.charCodeAt(i) - 64); // 'A' is 65 in ASCII
  }
  return result;
};

const numberToAlphabet = (num) => {
  let result = "";
  while (num > 0) {
    let rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
};

// 1) On mount: restore saved draft & list
    useEffect(() => {
      const savedForm = sessionStorage.getItem(FORM_KEY);
      const savedList = sessionStorage.getItem(LIST_KEY);
      if (savedForm) setReturnData(JSON.parse(savedForm));
      if (savedList) setReturns(JSON.parse(savedList));
    }, []);

    // 2) Persist the form draft whenever it changes
    useEffect(() => {
      sessionStorage.setItem(FORM_KEY, JSON.stringify(returnData));
    }, [returnData]);

    // 3) Persist the returns list whenever it changes
    useEffect(() => {
      sessionStorage.setItem(LIST_KEY, JSON.stringify(returns));
    }, [returns]);



// Fetch return entries for this lead and determine the max return id (alphabetic)
// useEffect(() => {
//   const fetchReturnData = async () => {
//     try {
//       if (
//         selectedLead?.leadNo &&
//         selectedLead?.leadName &&
//         selectedLead?.caseNo &&
//         selectedLead?.caseName
//       ) {
//         const token = localStorage.getItem("token");
//         const response = await api.get(
//           `/api/leadReturnResult/${selectedLead.leadNo}/${encodeURIComponent(
//             selectedLead.leadName
//           )}/${selectedLead.caseNo}/${encodeURIComponent(selectedLead.caseName)}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const data = response.data;
//         // setReturns(data);
//         const withAccess = data.map(r => ({
//           ...r,
//           access: r.access ?? "Everyone"
//         }));
//         setReturns(withAccess);
//         setLeadReturns(withAccess);
//         // Determine the highest existing return id (if any) using alphabetToNumber conversion
//         const maxNumericId = withAccess.reduce((max, item) => {
//           // If leadReturnId is not defined, treat it as 0.
//           const numVal = item.leadReturnId ? alphabetToNumber(item.leadReturnId) : 0;
//           return Math.max(max, numVal);
//         }, 0);
//         setMaxReturnId(maxNumericId);
//       }
//     } catch (err) {
//       console.error("Error fetching return data:", err);
//       setError("Failed to fetch return data.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchReturnData();
// }, [leadDetails, caseDetails, selectedLead]);

// Fetch return entries for this lead, normalize access, compute max ID, and filter by role
useEffect(() => {
  const fetchReturnData = async () => {
    setLoading(true);
    try {
      if (
        selectedLead?.leadNo &&
        selectedLead?.leadName &&
        selectedCase?.caseNo &&
        selectedCase?.caseName
      ) {
        const token = localStorage.getItem("token");
        const response = await api.get(
          `/api/leadReturnResult/${selectedLead.leadNo}/${encodeURIComponent(
            selectedLead.leadName
          )}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const raw = response.data;

        // 1. Ensure every return has an 'access' field
        const withAccess = raw.map(r => ({
          ...r,
          accessLevel: r.accessLevel || "Everyone"
        }));

        // 2. Compute the max numeric ID (for nextReturnId)
        const maxNumericId = withAccess.reduce((max, item) => {
          const numVal = item.leadReturnId
            ? alphabetToNumber(item.leadReturnId)
            : 0;
          return Math.max(max, numVal);
        }, 0);
        setMaxReturnId(maxNumericId);

        // 3. Filter based on role
        const visible = isCaseManager
          ? withAccess
          : withAccess.filter(r => r.accessLevel === "Everyone");

        // 4. Update state
        setReturns(visible);
        setLeadReturns(visible);
      }
    } catch (err) {
      console.error("Error fetching return data:", err);
      setError("Failed to fetch return data.");
    } finally {
      setLoading(false);
    }
  };

  fetchReturnData();
}, [
  selectedLead,
  selectedCase,    // re-run if role or case details change
  leadDetails,
  caseDetails
]);


// handler to change access per row
const handleAccessChange = async (idx, newAccess) => {
  const ret = returns[idx];
  const token = localStorage.getItem("token");

  try {
    console.log("AnyCase", selectedCase);
    const response = await api.patch(
      `/api/leadReturnResult/update/${ret.leadNo}/${caseNo}/${ret.leadReturnId}`,
      { accessLevel: newAccess },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // update local state
    setReturns(rs => {
      const copy = [...rs];
      copy[idx] = response.data;
      return copy;
    });
    setLeadReturns(rs => {
      const copy = [...rs];
      copy[idx] = response.data;
      return copy;
    });
  } catch (err) {
    console.error("Failed to update accessLevel", err);
     setAlertMessage("Could not change access. Try again.");
      setAlertOpen(true);
  }
};

// Calculate the next Return No (max return id plus one, converted back to alphabet)
const nextReturnId = numberToAlphabet(maxReturnId + 1);

const handleAddOrUpdateReturn = async () => {
  // 1) validation
  if (!returnData.results.trim()) {
    setAlertMessage("Please enter narrative details!");
    return setAlertOpen(true);
  }

  const officerName = localStorage.getItem("loggedInUser")?.trim();
  if (!officerName) {
    setAlertMessage("Officer name not found. Please log in again.");
    return setAlertOpen(true);
  }
  const token = localStorage.getItem("token");

  try {
    if (editMode && editId) {
      // ─── UPDATE EXISTING ─────────────────────────────────────────────
      const resp = await api.patch(
        `/api/leadReturnResult/update/${selectedLead.leadNo}/${caseNo}/${editId}`,
        { leadReturnResult: returnData.results },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // replace in state
      setReturns(rs => rs.map(r => r.leadReturnId === editId ? resp.data : r));
      setEditMode(false);
      setEditId(null);

    } else {
      // ─── CREATE NEW ──────────────────────────────────────────────────
      const payload = {
        leadNo:             selectedLead.leadNo,
        description:        selectedLead.leadName,
        caseNo,
        caseName:           selectedCase.caseName,
        enteredDate:        new Date(),
        enteredBy:          officerName,
        assignedTo:  { assignees: [officerName], lRStatus: "Pending" },
        assignedBy:  { assignee: officerName, lRStatus: "Pending" },
        leadReturnResult:   returnData.results,
        accessLevel:        returnData.accessLevel
      };

      const createResp = await api.post(
        "/api/leadReturnResult/create",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 4) append the returned document (with its generated leadReturnId)
      const newDoc = createResp.data;
      setReturns(rs => [...rs, newDoc]);
      setLeadReturns(rs => [...rs, newDoc]);

      setReturnData(rd => ({
      ...rd,
      leadReturnId: newDoc.leadReturnId,
      results:      ""    // clear out the textarea
    }));

    setMaxReturnId(n =>
      Math.max(n, alphabetToNumber(newDoc.leadReturnId))
    );

      // 5) bump maxReturnId so nextReturnId preview advances
      // const numeric = alphabetToNumber(newDoc.leadReturnId);
      // setMaxReturnId(prev => Math.max(prev, numeric));

      // 6) reset the form
      setReturnData(rd => ({
        ...rd,
        results: "",
      }));
    }
  } catch (err) {
    console.error("Error saving return:", err);
    setAlertMessage("Failed to save narrative. Please try again.");
    setAlertOpen(true);
  }
};


  useEffect(() => {
  if (officerName) {
    setReturnData((prev) => ({
      ...prev,
      enteredBy: officerName.trim()
    }));
  }
}, [officerName]);

  
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };
  
  const handleEditReturn = (ret) => {
    setReturnData({ results: ret.leadReturnResult,
      leadReturnId: ret.leadReturnId,
      enteredDate: formatDate(ret.enteredDate),
      enteredBy: ret.enteredBy });
    setEditMode(true);
    setEditId(ret.leadReturnId);
  };
  

  const handleDeleteReturn = async (leadReturnId) => {
    if (!window.confirm("Are you sure you want to delete this return?")) return;
  
    const token = localStorage.getItem("token");
  
    try {
      await api.delete(`/api/leadReturnResult/delete/${selectedLead.leadNo}/${selectedLead.caseNo}/${leadReturnId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      const filtered = returns.filter(r => r.leadReturnId !== leadReturnId);
      setReturns(filtered);
      setLeadReturns(filtered);
    } catch (err) {
      console.error("Error deleting return:", err);
      // alert("Failed to delete return.");
      setAlertMessage("Failed to delete narrative.");
      setAlertOpen(true);
    }
  };

  const handleNavigation = (route) => {
    navigate(route);
  };

    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  
    const onShowCaseSelector = (route) => {
      navigate(route, { state: { caseDetails } });
  };
    
  const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";
  
      if (!selectedCase && !caseDetails) {
    return <div>Loading case/lead…</div>;
  }

  return (
    <div className="lrenclosures-container">
      <Navbar />
      <AlertModal
              isOpen={alertOpen}
              title="Notification"
              message={alertMessage}
              onConfirm={() => setAlertOpen(false)}
              onClose={()   => setAlertOpen(false)}
            />
      

      {/* <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRTimeline")}>Timeline</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
        </div>
      </div> */}
           <div className="top-menu"   style={{ paddingLeft: '20%' }}>
      <div className="menu-items" >
        <span className="menu-item " onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LeadReview", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } }} > Lead Information</span>
                   <span className="menu-item active" >Add/View Lead Return</span>
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
        {/* <div className="menu-items">
      
        <span className="menu-item active" onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRScratchpad')}>
            Scratchpad
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> */}
       </div>

      <div className="LRI_Content">
        
      {/* <div className="sideitem">
       <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

       <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
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
            <li className="sidebar-item active" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
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
          <li className="sidebar-item" style={{ fontWeight: 'bold' }} onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Related Tabs {leadDropdownOpen ?  "▲": "▼"}
          </li>
        {leadDropdownOpen && (
          <ul>
              <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
              View Lead Chain of Custody
            </li>
             )}
          </ul>

            )}

                </div> */}
                  <SideBar  activePage="CasePageManager" />

      <div className="left-content">
      <div className="top-menu" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }} onClick={() => handleNavigation('/LRReturn')}>
            Narrative
          </span>
          <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRScratchpad')}>
            Notes
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> </div>

      <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${ leadStatus}`
    : `LEAD DETAILS | ${leadStatus}`}
</h5>

          </div>
        
        {/* Left Section */}
        {/* <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo-lr"
          />
        </div> */}


        {/* Center Section */}
        <div className="case-header">
          <h2 className="">NARRATIVE</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">
    
      <div className = "timeline-form-sec">
      <div className = "content-to-add-first-row">

      <div className="form-row4">
            <label>Narrative Id*</label>
            {/* <input type="text" value={returnData.leadReturnId || nextReturnId} readOnly /> */}
            <input
  readOnly
  value={ editMode
    ? returnData.leadReturnId    // when editing, show the saved one
    : (returnData.leadReturnId    // after a create, you've written it into returnData
       || nextReturnId)           // otherwise show the preview
  }
/>

          </div>
          <div className="form-row4">
            <label>Date Entered*</label>
            <input type="text" value={returnData.enteredDate || todayDate} readOnly />

          </div>
          <div className="form-row4">
            <label>Entered By*</label>
            <input type="text" value={returnData.enteredBy || officerName} readOnly />


          </div>
        </div>
        
           {/* <h4>Return Id</h4>
           <label className='input-field'></label>
           <h4 >Date Entered</h4>
           <label className='input-field'></label>
           <h4>Entered By</h4>
           <label className='input-field'></label> */}
     
    <h4 className="return-form-h4">{editMode ? "Edit Return" : "Save Narrative"}</h4>
      <div className="return-form">
        <textarea
        type = "text"
          value={returnData.results}
          onChange={(e) => handleInputChange("results", e.target.value)}
          placeholder="Enter return details"
        ></textarea>
      </div>

      <div className="form-buttons-return">
      <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

        className="save-btn1" onClick={handleAddOrUpdateReturn}>{editMode ? "Update" : "Save Narrative"}</button>
        {/* <button className="back-btn" onClick={() => handleNavigation("/LRPerson")}>Back</button>
        <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>Next</button>
        <button className="cancel-btn" onClick={() => setReturnData({ results: "" })}>Cancel</button> */}
      </div>
      </div>

      <table className="leads-table">
        <thead>
          <tr>
            <th style={{ width: "10%" }}>Narrative Id</th>
            <th style={{ width: "13%" }}>Date Entered</th>
            <th style={{ width: "9%" }}>Entered By</th>
            <th className="results-col">Narrative</th>
            <th style={{ width: "14%" }}></th>
            {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
          </tr>
        </thead>
        {/* <tbody>
            {returns.length > 0 ? returns.map((ret, idx) => (  
              <tr key={ret.id || idx}>
                 <td>{ret.leadReturnId}</td>
              <td>{formatDate(ret.enteredDate)}</td>
              <td>{ret.enteredBy}</td>
              <td>{ret.leadReturnResult}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditReturn(ret)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDeleteReturn(ret.leadReturnId)}
                />
                  </button>
                  </div>
                </td>

                {isCaseManager && (
          <td>
            <select
              value={ret.access}
              onChange={e => handleAccessChange(idx, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Case Manager Only</option>
            </select>
          </td>
        )}
      </tr>
       )) : (
        <tr>
          <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign:'center' }}>
            No Returns Available
          </td>
        </tr>
      )}
          </tbody> */}

<tbody>
  {returns.length > 0 ? returns.map((ret, idx) => {
    const canModify = ret.enteredBy.trim() === officerName.trim();

    console.log("Can Modify?", canModify, "| enteredBy:", ret.enteredBy, "| officerName:", officerName);
    const disableActions =
      selectedLead?.leadStatus === "In Review" ||
      selectedLead?.leadStatus === "Completed" ||
      !canModify;

    return (
      <tr key={ret.leadReturnId || idx}>
        <td>{ret.leadReturnId}</td>
        <td>{formatDate(ret.enteredDate)}</td>
        <td>{ret.enteredBy}</td>
        <td className="results-col">
          {ret.leadReturnResult}
            {/* <div className="scrollable-cell">
              {ret.leadReturnResult}
            </div> */}
          </td>
        <td>
          <div className="lr-table-btn">
            <button
              onClick={() => handleEditReturn(ret)}
              disabled={disableActions}
            >
              <img
                src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                alt="Edit Icon"
                className="edit-icon"
              />
            </button>
            <button
              onClick={() => handleDeleteReturn(ret.leadReturnId)}
              disabled={disableActions}
            >
              <img
                src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                alt="Delete Icon"
                className="edit-icon"
              />
            </button>
          </div>
        </td>
        {isCaseManager && (
          <td>
            <select
              value={ret.accessLevel}
              onChange={(e) => handleAccessChange(idx, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Only Case Manager</option>
            </select>
          </td>
        )}
      </tr>
    );
  }) : (
    <tr>
      <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign: 'center' }}>
        No Narrative Available
      </td>
    </tr>
  )}
</tbody>

        </table>

        
       {/* {selectedLead?.leadStatus !== "Completed" && !isCaseManager && (
  <div className="form-buttons-finish">
    <h4> Click here to submit the lead</h4>
    <button
      disabled={selectedLead?.leadStatus === "In Review"}
      className="save-btn1"
      onClick={handleSubmitReport}
    >
      Submit 
    </button>
  </div>
)} */}

        <Comment tag= "Return"/>

        </div>
        </div>
        <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRPerson")} // Takes user to CM Return page
      />
      </div>
      </div>
      </div>
  );
};
