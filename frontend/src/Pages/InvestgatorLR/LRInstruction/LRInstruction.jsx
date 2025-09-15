import FootBar from '../../../components/FootBar/FootBar';
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import { pickHigherStatus } from '../../../utils/status'
import { useLeadStatus } from '../../../hooks/useLeadStatus';


import Navbar from '../../../components/Navbar/Navbar';
import './LRInstruction.css';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";

import { AlertModal } from "../../../components/AlertModal/AlertModal";



export const LRInstruction = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
    const navigate = useNavigate(); // Initialize useNavigate hook
    const printRef = useRef();
    const routerLocation = useLocation();
    const location = useLocation();
         const [loading, setLoading] = useState(true);
          const [error, setError] = useState("");
    const { caseDetails, leadDetails } = routerLocation.state || {};
    const [alertMessage, setAlertMessage] = useState("");
      const [alertOpen, setAlertOpen] = useState(false);
    
      const params = new URLSearchParams(location.search);
  const qpCaseNo   = params.get("caseNo")   || undefined;
  const qpCaseName = params.get("caseName") || undefined;
  const qpLeadNo   = params.get("leadNo")   ? Number(params.get("leadNo")) : undefined;
  const qpLeadName = params.get("leadName") || undefined;

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date)) return "";
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    };

    const getCasePageRoute = () => {
      if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
      return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };

    const { selectedCase, selectedLead, setSelectedCase, setSelectedLead, leadInstructions, leadStatus, setLeadStatus, setLeadInstructions } = useContext(CaseContext);

    const routerState = (useLocation().state || {});
  const stateCase   = routerState.caseDetails;
  const stateLead   = routerState.leadDetails;

  const resolvedCaseNo   = selectedCase?.caseNo ?? stateCase?.caseNo ?? qpCaseNo;
  const resolvedCaseName = selectedCase?.caseName ?? stateCase?.caseName ?? qpCaseName;
  const resolvedLeadNo   = selectedLead?.leadNo ?? stateLead?.leadNo ?? qpLeadNo;
  const resolvedLeadName = selectedLead?.leadName ?? stateLead?.leadName ?? qpLeadName;
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

  // 3) (Optional but nice) hydrate Context from query on first load
  useEffect(() => {
    if (resolvedCaseNo && resolvedCaseName && !selectedCase?.caseNo && typeof setSelectedCase === "function") {
      setSelectedCase(prev => ({ ...(prev || {}), caseNo: resolvedCaseNo, caseName: resolvedCaseName }));
    }
    if (resolvedLeadNo && resolvedLeadName && !selectedLead?.leadNo) {
      setSelectedLead?.({
        leadNo: resolvedLeadNo,
        leadName: resolvedLeadName,
        caseNo: resolvedCaseNo,
        caseName: resolvedCaseName
      });
    }
  }, [
    resolvedCaseNo, resolvedCaseName, resolvedLeadNo, resolvedLeadName,
    selectedCase?.caseNo, selectedLead?.leadNo, setSelectedCase, setSelectedLead
  ]);

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
    leadDescription: '',
    assignedTo: [],
    assignedOfficer: []
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [availableSubNumbers, setAvailableSubNumbers] = useState([]);
  const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]); // Selected Subnumbers
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);
  const handleInputChange = (field, value) => {
    setLeadData({ ...leadData, [field]: value });
  };
  const handleGenerateLead = () => {
  const { leadNumber, leadSummary, assignedDate, assignedOfficer, assignedBy } = leadData;
  
    // Check if mandatory fields are filled
    if (!leadNumber || !leadSummary || !assignedDate || !assignedOfficer || !assignedBy) {
      return;
    }
  
    // Show confirmation alert before proceeding
    if (window.confirm("Are you sure you want to generate this lead?")) {
      // Navigate to the Lead Log page with relevant lead data
      navigate("/leadlog", {
        state: {
          leadNumber,
          leadSummary,
          assignedDate,
          assignedOfficer,
        },
      });
    }
  };
  

  const handleNavigation = (route) => {
    navigate(route, {
      state: {
        caseDetails,
        leadDetails
      }
    });
  };
 const signedInOfficer = localStorage.getItem("loggedInUser");
 // who is primary for this lead?
const primaryUsername =
  leadData?.primaryInvestigator || leadData?.primaryOfficer || "";

// am I the primary investigator on this lead?
const isPrimaryInvestigator =
  selectedCase?.role === "Investigator" &&
  !!signedInOfficer &&
  signedInOfficer === primaryUsername;

// primary goes to the interactive ViewLR page
const goToViewLR = () => {
  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

  if (!lead?.leadNo || !lead?.leadName || !kase?.caseNo || !kase?.caseName) {
    setAlertMessage("Please select a case and lead first.");
    setAlertOpen(true);
    return;
  }

  navigate("/viewLR", {
    state: { caseDetails: kase, leadDetails: lead }
  });
};

  const [assignedOfficers, setAssignedOfficers] = useState([]);
  

  const handleNextPage = () => {
    navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  };

  
    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

    useEffect(() => {
      const fetchLeadData = async () => {
        try {
          const lead = selectedLead?.leadNo ? selectedLead : leadDetails;
          const kase = selectedCase?.caseNo ? selectedCase : caseDetails;
    
          if (lead?.leadNo && lead?.leadName && kase?.caseNo && kase?.caseName) {
            const token = localStorage.getItem("token");
    
            const response = await api.get(
              `/api/lead/lead/${lead.leadNo}/${encodeURIComponent(
                lead.leadName
              )}/${kase.caseNo}/${encodeURIComponent(kase.caseName)}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
    
  
            // console.log("Fetched Lead Data1:", response.data);
  
            if (response.data.length > 0) {
              setLeadData({
                ...response.data[0], 
                assignedOfficer: response.data[0].assignedOfficer || [] // Ensure array
              });
              setLeadInstructions(response.data[0]);
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
    }, [selectedLead, setLeadInstructions]);

    // setLeadStatus(leadData.leadStatus);

    useEffect(() => {
  if (!leadData?.leadStatus) return;
  setLeadStatus(prev => prev ? pickHigherStatus(prev, leadData.leadStatus) : leadData.leadStatus);
}, [leadData?.leadStatus, setLeadStatus]);

 const { status, isReadOnly } = useLeadStatus({
    caseNo: selectedCase.caseNo,
    caseName: selectedCase.caseName,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
  });

// console.log("leadData.status", leadData.leadStatus);
// console.log("leadstatus", leadStatus);
console.log("status from hook", status);
console.log("isReadOnly", isReadOnly);
  
    const onShowCaseSelector = (route) => {
      navigate(route, { state: { caseDetails } });
  };

  const PrintableContent = React.forwardRef((props, ref) => (
    <div ref={ref}>
      {/* Title with Case No and Case Name */}
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Lead Return Report – {caseDetails.caseNo} – {caseDetails.caseName}
      </h1>
      {/* The printable area (starting from the bottom-content) */}
      <div className="bottom-content">
        <table className="details-table">
          <tbody>
            <tr>
              <td>Case Name:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.caseName || 'Main Street Murder'}
                  readOnly
                />
              </td>
            </tr>
            <tr>
              <td>Lead Summary:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.leadSummary}
                  readOnly
                />
              </td>
            </tr>
            <tr>
              <td>Assigned Date:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.assignedDate}
                  readOnly
                />
              </td>
            </tr>
            {/* Add any other rows you want printed */}
          </tbody>
        </table>
      </div>
    </div>
  ));
  
  return (
    <div className="person-page">
      {/* Navbar at the top */}
      <Navbar />

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
                   <span className="menu-item active" >Add Lead Return</span>
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

            {selectedCase?.role === "Investigator" && isPrimaryInvestigator && (
  <span className="menu-item" onClick={goToViewLR}>
    Submit Lead Return
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
                    alert("Please select a case and lead first.");
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
       <div className="top-menu1" style={{ marginTop: '2px', backgroundColor: '#3333330e', fontWeight: '900' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item active" style={{fontWeight: '600' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
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
          {/* <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span> */}
          {/* {(["Case Manager", "Detective Supervisor"].includes(selectedCase?.role)) && (
            <span
              className="menu-item"
              onClick={handleViewLeadReturn}   
              title={isGenerating ? "Preparing report…" : "Manage Lead Return"}
              style={{ fontWeight: '400', opacity: isGenerating ? 0.6 : 1, pointerEvents: isGenerating ? "none" : "auto" }}
            >
              Review
            </span>
          )}
          {selectedCase?.role === "Investigator" && (
            <span
              className="menu-item"
              onClick={goToViewLR}
              style={{fontWeight: '400' }}
              title="View Lead Return"
            >
              Submit
            </span>
          )} */}
         </div> </div>
       <div className="caseandleadinfo">
          <h5 className = "side-title"> 
             {/* Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""} */}
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Instruction
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
        ? `Your Role: ${selectedCase.role || ""} | Lead Status:  ${leadStatus}`

    : ` ${leadStatus}`}
</h5>

          </div>

       {/* <div className="main-content-cl"> */}
        {/* Left Section */}
        {/* <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo"
          />
        </div> */}

        {/* Center Section */}
        <div className="case-header">
          <h2 className="">LEAD INSTRUCTIONS</h2>
        </div>

        {/* Right Section */}

        <div className="LRI-content-section">

      {(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") && (
  <div className="add-lead-section">
    {/* <div className="add-lead-section-content">
      <h4>Click here to add a new lead</h4>
    </div> */}
    {/* <div className="add-lead-btn1">
      <button
        className="save-btn1"
        style={{ cursor: 'pointer' }}
        onClick={() =>
          navigate('/createlead', {
            state: {
              caseDetails: selectedCase,
              // send current lead as the “origin”
              leadOrigin: selectedLead?.leadNo || leadData.leadNumber
            }
          })
        }
      >
       <i className="fa-solid fa-plus"></i> Add Lead
      </button>
    </div> */}
  </div>
)}

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
      <td>{selectedLead.leadNo} </td>
      <td>{leadData.caseNo}</td>
      <td> {leadData.assignedBy} </td>
        <td>{formatDate(leadData.assignedDate)} </td>

      </tr>
    </tbody>
  </table>
      {/* </div> */}

       {/* Bottom Content */}
       <div className="bottom-content-LRI">
        <table className="details-table">
          <tbody>
          <tr>
              <td>Case Name:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.caseName} // Display selected case name or an empty string
                  onChange={(e) => handleInputChange('caseName', e.target.value)} // Update 'caseName' in leadData
                  placeholder=""
                  readOnly
    />
              </td>
            </tr>
            <tr>
              <td>Lead Log Summary:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.description}
                  onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                  placeholder=""
                  readOnly
                />
              </td>
            </tr>
            <tr>
              <td>Lead Instruction:</td>
              <td>
                <textarea
                  className="input-field"
                  value={leadData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder=""
                  readOnly
                ></textarea>
              </td>
            </tr>
              <tr>
                <td>Assigned Officers:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={Array.isArray(leadData.assignedTo)
                      ? leadData.assignedTo
                          .map(o => typeof o === "string" ? o : o.username)
                          .join(", ")
                      : ""}
                    readOnly
                  />
                </td>
              </tr>

                 <tr>
                <td>Lead Origin:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.parentLeadNo}
                    onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                    placeholder=""
                  readOnly
                  />
                </td>
              </tr>

             <tr>
  <td>Subnumber:</td>
  <td>
    <input
      type="text"
      className="input-field"
      value={leadData.subNumber || ""}
      readOnly
    />
  </td>
</tr>
<tr>
  <td>Associated Subnumbers:</td>
  <td>
    <input
      type="text"
      className="input-field"
      value={Array.isArray(leadData.associatedSubNumbers)
        ? leadData.associatedSubNumbers.join(", ")
        : ""}
      readOnly
    />
  </td>
</tr>

          </tbody>
        </table>
      </div>
      </div>
      {/* Action Buttons */}
      {/* <div className="form-buttons-inst">
        <button className="edit-btn" onClick={handleGenerateLead}>
          Edit
        </button>
        <button className="next-btn" onClick={handleNextPage}>Next</button>
        <button className="next-btn" onClick={handleNextPage}>Save</button>
        <button className="next-btn" onClick={handleNextPage}>Cancel</button>


      </div> */}
     <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRReturn")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};