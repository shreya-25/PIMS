import React, { useContext, useState, useEffect, useRef} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./LRFinish.css";
import FootBar1 from '../../../components/FootBar1/FootBar1';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
// import { Report, generatePDF } from "../../Report/Report";
import pdfRef from "../../refStore";
import api, { BASE_URL } from "../../../api";


export const LRFinish = () => {
  // useEffect(() => {
  //     // Apply style when component mounts
  //     document.body.style.overflow = "hidden";
  
  //     return () => {
  //       // Reset to default when component unmounts
  //       document.body.style.overflow = "auto";
  //     };
  //   }, []);
  const navigate = useNavigate();
  const localPdfRef = useRef(null);
  const { selectedCase, selectedLead} = useContext(CaseContext);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};

useEffect(() => {
  // 1) Must have a case
  if (!selectedCase?.caseNo || !selectedCase?.caseName) {
    alert("Please select a case first.");
    return navigate("/HomePage");
  }
  // 2) Must have a lead
  if (!selectedLead?.leadNo || !selectedLead?.leadName) {
    alert("Please select a lead first.");
    // if this user is an Investigator send them to /Investigator
    // otherwise send them to the Case Manager page
    const leadPicker =
      selectedCase.role === "Investigator"
        ? "/Investigator"
        : "/CasePageManager";
    return navigate(leadPicker);
  }
}, [selectedCase, selectedLead, navigate]);
      
        const formatDate = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          if (isNaN(date)) return "";
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const day = date.getDate().toString().padStart(2, "0");
          const year = date.getFullYear().toString().slice(-2);
          return `${month}/${day}/${year}`;
        };
      
        const { leadDetails, caseDetails } = location.state || {};
        const [leadInstruction, setLeadInstruction] = useState({});
        const [leadInstructions, setLeadInstructions] = useState({});
        const [leadReturns, setLeadReturns] = useState([]);
        const [leadPersons, setLeadPersons] = useState([]);
        const [leadVehicles, setLeadVehicles] = useState([]);
        const [leadEnclosures, setLeadEnclosures] = useState([]);
        const [leadEvidence, setLeadEvidence] = useState([]);
        const [leadPictures, setLeadPictures] = useState([]);
        const [leadAudio,    setLeadAudio]    = useState([]);
        const [leadVideos,   setLeadVideos]   = useState([]);
        const [leadScratchpad, setLeadScratchpad] = useState([]);
        const [leadTimeline, setLeadTimeline] = useState([]);

        // useEffect(() => {
        //   if (!selectedCase?.caseNo || !selectedLead?.leadNo) return;
        
        //   const { leadNo, leadName } = selectedLead;
        //   const { caseNo, caseName } = selectedCase;
        //   const encLead = encodeURIComponent(leadName);
        //   const encCase = encodeURIComponent(caseName);
        //   const token = localStorage.getItem("token");
        //   const headers = { headers: { Authorization: `Bearer ${token}` } };
        
        //   const calls = {
        //     Instructions: api.get(`/api/lead/lead/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Returns:      api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Persons:      api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Vehicles:     api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Enclosures:   api.get(`/api/lrenclosures/lrenclosures/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Evidence:     api.get(`/api/lrevidence/lrevidence/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Scratchpad:   api.get(`/api/scratchpad/scratchpad/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Timeline:     api.get(`/api/timeline/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Pictures:     api.get(`/api/lrpictures/lrpictures/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Audio:        api.get(`/api/lraudio/lraudio/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //     Videos:       api.get(`/api/lrvideo/lrvideo/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
        //   };
        
        //   Promise
        //     .allSettled(Object.values(calls))
        //     .then(results => {
        //       const emptySections = [];
        
        //       // map the results back to your state setters & collect empties
        //       Object.entries(calls).forEach(( [section, _], idx ) => {
        //         const res = results[idx];
        //         if (res.status === 'fulfilled') {
        //           const data = res.value.data || [];
        //           switch(section) {
        //             case 'Instructions':   setLeadInstructions(data[0] || {}); break;
        //             case 'Returns':        setLeadReturns(data);             break;
        //             case 'Persons':        setLeadPersons(data);             break;
        //             case 'Vehicles':       setLeadVehicles(data);            break;
        //             case 'Enclosures':     setLeadEnclosures(data);          break;
        //             case 'Evidence':       setLeadEvidence(data);            break;
        //             case 'Scratchpad':     setLeadScratchpad(data);          break;
        //             case 'Timeline':       setLeadTimeline(data);            break;
        //             case 'Pictures':       setLeadPictures(data);            break;
        //             case 'Audio':          setLeadAudio(data);               break;
        //             case 'Videos':         setLeadVideos(data);              break;
        //           }
        //           if ((Array.isArray(data) && data.length === 0) ||
        //               (section === 'Instructions' && !data[0])) {
        //             emptySections.push(section);
        //           }
        //         } else {
        //           // network/server error: treat as empty or truly failed?
        //           console.error(`${section} fetch failed:`, res.reason);
        //           emptySections.push(section + ' (error)');
        //         }
        //       });
        
        //       if (emptySections.length) {
        //         // alert(`No data for: ${emptySections.join(', ')}`);
        //       }
        //     })
        //     .catch(err => {
        //       // This should never fire, since allSettled never rejects
        //       console.error("Unexpected error:", err);
        //       alert("Error loading lead data. Please try again.");
        //     })
        //     .finally(() => setLoading(false));
        // }, [selectedCase, selectedLead]);

        useEffect(() => {
          if (!selectedCase?.caseNo || !selectedLead?.leadNo) return;
        
          const { leadNo, leadName } = selectedLead;
          const { caseNo, caseName } = selectedCase;
          const encLead = encodeURIComponent(leadName);
          const encCase = encodeURIComponent(caseName);
          const token = localStorage.getItem("token");
          const headers = { headers: { Authorization: `Bearer ${token}` } };
        
          async function loadAll() {
            try {
              // 1) Fetch the “main” arrays in parallel
              const [
                instrRes,
                returnsRes,
                personsRes,
                vehiclesRes,
                enclosuresRes,
                evidenceRes,
                scratchpadRes,
                timelineRes,
                picturesRes,
                audioRes,
                videosRes,
              ] = await Promise.all([
                api.get(`/api/lead/lead/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/lrenclosures/lrenclosures/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/lrevidence/lrevidence/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/scratchpad/scratchpad/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/timeline/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/lrpictures/lrpictures/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/lraudio/lraudio/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
                api.get(`/api/lrvideo/lrvideo/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers),
              ]);
        
              // 2) Instructions is a single object
              setLeadInstructions(instrRes.data[0] || {});
        
              // 3) For every section that can have files, 
              //    map over its array and fetch `/files/:id`
              const attachFiles = async (items, idField, fetchUrlBase) => {
                return Promise.all(
                  (items || []).map(async item => {
                    const fileRes = await api.get(
                      `${fetchUrlBase}/${item[idField]}`,
                      headers
                    );
                    // assume fileRes.data is an array of { filename, url, … }
                    return { ...item, files: fileRes.data };
                  })
                );
              };
        
              setLeadReturns(
                await attachFiles(
                  returnsRes.data,
                  "leadReturnId",
                  "/api/leadReturn/files"
                )
              );
              setLeadPersons(personsRes.data);
              setLeadVehicles(vehiclesRes.data);
              setLeadEnclosures(
                await attachFiles(
                  enclosuresRes.data,
                  "enclosureId",
                  "/api/lrenclosures/files"
                )
              );
              setLeadEvidence(
                await attachFiles(
                  evidenceRes.data,
                  "evidenceId",
                  "/api/lrevidence/files"
                )
              );
              setLeadScratchpad(scratchpadRes.data);
              setLeadTimeline(timelineRes.data);
              setLeadPictures(
                await attachFiles(
                  picturesRes.data,
                  "pictureId",
                  "/api/lrpictures/files"
                )
              );
              setLeadAudio(
                await attachFiles(
                  audioRes.data,
                  "audioId",
                  "/api/lraudio/files"
                )
              );
              setLeadVideos(
                await attachFiles(
                  videosRes.data,
                  "videoId",
                  "/api/lrvideo/files"
                )
              );
        
            } catch (err) {
              console.error("Error loading lead data:", err);
              // alert("Error loading lead data. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        
          loadAll();
        }, [selectedCase, selectedLead]);
        
        const [selectedReports, setSelectedReports] = useState({
          FullReport: false,
          leadInstruction: false,
          leadReturn: false,
          leadPersons: false,
          leadVehicles: false,
          leadEnclosures: false,
          leadEvidence: false,
          leadPictures: false,
          leadAudio: false,
          leadVideos: false,
          leadScratchpad: false,
          leadTimeline: false,
        });

        const toggleReportSection = (sectionKey) => {
          if (sectionKey === "FullReport") {
            setSelectedReports((prev) => {
              // Toggle the full report value
              const newValue = !prev.FullReport;
              // Create a new state object where all keys are set to newValue
              const updated = {};
              Object.keys(prev).forEach((key) => {
                updated[key] = newValue;
              });
              return updated;
            });
          } else {
            setSelectedReports((prev) => ({
              ...prev,
              [sectionKey]: !prev[sectionKey],
            }));
          }
        };

        const token = localStorage.getItem("token");
        const handleRunReport = async () => {
          try {
            // Build the request body. Only include data for selected sections
            // to keep the payload small (optional). The server can also handle
            // skipping unselected sections if they come as null/undefined.
            const body = {
              user: "Officer 916",  // Or from your auth context
              reportTimestamp: new Date().toLocaleString(),
      
              // Pass the entire object or only if selected
              leadInstruction: selectedReports.leadInstruction ? leadInstruction : null,
              leadReturn: selectedReports.leadReturn ? leadReturns : null,
              leadPersons:     selectedReports.leadPersons     ? leadPersons     : null,
              leadVehicles: selectedReports.leadVehicles ? leadVehicles : null,
              leadEnclosures: selectedReports.leadEnclosures ? leadVehicles : null,
              leadEvidence: selectedReports.leadEvidence ? leadVehicles : null,
              leadPictures: selectedReports.leadPictures ? leadVehicles : null,
              leadAudio: selectedReports.leadAudio ? leadVehicles : null,
              leadVideos: selectedReports.leadVideos ? leadVehicles : null,
              leadScratchpad: selectedReports.leadScratchpad ? leadVehicles : null,
              leadTimeline: selectedReports.leadTimeline ? leadVehicles : null,
      
              // Also pass along which sections are selected
              selectedReports,
              leadInstructions,   
              leadReturns,      
              // leadPersons,       
            };

            // generatePDF(pdfRef.current);
            console.log("📤 Report Data Sent to Backend:", JSON.stringify(body, null, 2));

      
            // Call your Node server endpoint
            const response = await api.post("/api/report/generate", body, {
              responseType: "blob", // so we get the PDF back as a blob
              headers: {
                Authorization: `Bearer ${token}`, // Must match your verifyToken strategy
              },
            });
            // Create a blob and open in a new browser tab OR force download
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL); 

    }  catch (err) {
      // 4) If it's a blob error, read it as text so you can see the server message
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        console.error("📋 Backend error message:", text);
        alert("Error generating PDF:\n" + text);
      } else {
        console.error("AxiosError:", err);
        alert("Error generating PDF: " + err.message);
      }
    }
  
  };

  const handleSubmitReport = async () => {
    try {
      const token = localStorage.getItem("token");
  
      if (!selectedLead || !selectedCase) {
        alert("No lead or case selected!");
        return;
      }
  
      const body = {
        leadNo: selectedLead.leadNo,
        description: selectedLead.leadName,
        caseNo: selectedCase.caseNo,
        caseName: selectedCase.caseName,
        submittedDate: new Date(),
        assignedTo: {
          assignees: ["Officer 916", "Officer 91"],
          lRStatus: "Submitted"
        },
        assignedBy: {
          assignee: "Officer 912",
          lRStatus: "Pending"
        }
      };
  
      // Step 1: Submit the LeadReturn
      const response = await api.post(
        "/api/leadReturn/create",
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
  
      if (response.status === 201) {
        // Step 2: Update lead status to 'In Review' via PUT
        const statusResponse = await api.put(
          "/api/lead/status/in-review",
          {
            leadNo: selectedLead.leadNo,
            description: selectedLead.leadName,
            caseNo: selectedCase.caseNo,
            caseName: selectedCase.caseName
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );
  
        if (statusResponse.status === 200) {
          alert("Lead Return submitted and status set to 'In Review'");
        } else {
          alert("Lead Return submitted but status update failed.");
        }
      } else {
        alert("Failed to submit Lead Return");
      }
    } catch (error) {
      console.error("Error during Lead Return submission or status update:", error);
      alert("Something went wrong while submitting the report.");
    }
  };
  


  const submitReturnAndUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!selectedLead || !selectedCase) {
        alert("No lead or case selected!");
        return;
      }
  
      // --- 2) Update the leadStatus to either Complete or Pending ---
      const statusRes = await api.put(
        `/api/lead/status/${newStatus}`,           // "/status/complete" or "/status/pending"
        {
          leadNo:     selectedLead.leadNo,
          description: selectedLead.leadName,
          caseNo:     selectedCase.caseNo,
          caseName:   selectedCase.caseName
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }}
      );
  
      if (statusRes.status === 200) {
        alert(`Lead Return submitted and status set to '${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}'`);
      } else {
        alert("Return submitted but status update failed");
      }
  
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };
      

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };
      const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
                  
                    const onShowCaseSelector = (route) => {
                      navigate(route, { state: { caseDetails } });
                  };

  const isCaseManager = selectedCase?.role === "Case Manager";

  return (
    <div className="lrfinish-container">
      <Navbar />

      {/* Top Menu */}
      {/* <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/CMInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVideo")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/CMTimeline')}>
            Timeline
          </span>
          <span className="menu-item active" onClick={() => handleNavigation("/CMFinish")}>Finish</span>
        </div>
      </div> */}

      {/* <div className="LRI_Content">
       <div className="sideitem">
       <ul className="sidebar-list">
       <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li>            
            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
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
            {selectedCase.role !== "Investigator" && (
  <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
    View Lead Chain of Custody
  </li>
)}
         </ul>
                </div> */}

<div className="top-menu">
        <div className="menu-items">
          {[
            'Instruction', 'Return', 'Person', 'Vehicle', 'Enclosures', 'Evidence',
            'Pictures', 'Audio', 'Video', 'Scratchpad', 'Timeline', 'Finish'
          ].map((item, index) => (
            <span
              key={index}
              className={`menu-item ${item === 'Finish' ? 'active' : ''}`}
              onClick={() => navigate(`/LR${item}`)}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="LRI_Content">
       <div className="sideitem">
       <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
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
            <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item active" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li> */}
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
              View Lead Hierarchy
            </li> */}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              Generate Report
            </li> */}
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            {/* <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li> */}
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}
            {selectedCase.role !== "Investigator" && (
  <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
    View Lead Chain of Custody
  </li>
)}

                </div>
                <div className="left-content">

                  {/* Hidden Report Preview Container (positioned offscreen) */}
                  {/* <div
                      ref={pdfRef}
                      style={{
                        position: "absolute",
                        top: "-10000px",
                        left: "-10000px",
                        width: "2000px", // A4 width at 96 DPI
                        padding: "20px",
                        backgroundColor: "white",
                        fontFamily: "Arial",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        color: "black",
                       
                      }}
                      >
                      <Report />
                      </div> */}

   


        {/* Center Section */}
        <div className="case-header">
          <h2 className=""> FINISH</h2>
        </div>

      <div className = "LRI-content-section">

      <div className = "content-subsection">

        {/* Logged Information */}
        <div className="timeline-form-sec">

        <div className="finish-content">
        <div className="logged-info">
        <div className="info-item">
            <label>Assigned Date:</label>
            <input type="date" value ="03/12/2024" readOnly />
          </div>
          <div className="info-item">
            <label>Last Updated By:</label>
            <input type="text" value="Officer 1" readOnly />
          </div>
          <div className="info-item">
            <label>Last Updated Date:</label>
            <input type="date" />
          </div>
          <div className="info-item">
            <label>Completed Date:</label>
            <input type="date" />
          </div>
        </div>

        {/* Reports and Destination */}
        <h2>Generate Report</h2>
<div className="reports-destination-lr">
  <table className="report-table">
    <thead>
      <tr>
        <th>Report Section</th>
        <th>Options</th>
      </tr>
    </thead>
    <tbody>
      {/* Standard Report Row */}
      <tr>
        <td>Standard Report</td>
        <td>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="report"
              checked={selectedReports.FullReport}
              onChange={() => toggleReportSection("FullReport")}
            />
            Full Report
          </label>
        </td>
      </tr>

      {/* Custom Report Row */}
      <tr>
        <td>Custom Report</td>
        <td>
          <div className="checkbox-grid">
            <div className="checkbox-col">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadInstruction}
                  onChange={() => toggleReportSection("leadInstruction")}
                />
                Lead Instruction
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadReturn}
                  onChange={() => toggleReportSection("leadReturn")}
                />
                Lead Returns
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadPersons}
                  onChange={() => toggleReportSection("leadPersons")}
                />
                Lead Persons
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadVehicles}
                  onChange={() => toggleReportSection("leadVehicles")}
                />
                Lead Vehicles
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadEnclosures}
                  onChange={() => toggleReportSection("leadEnclosures")}
                />
                Lead Enclosures
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadEvidence}
                  onChange={() => toggleReportSection("leadEvidence")}
                />
                Lead Evidences
              </label>
            </div>
            <div className="checkbox-col">
            
             
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadPictures}
                  onChange={() => toggleReportSection("leadPictures")}
                />
                Lead Pictures
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadAudio}
                  onChange={() => toggleReportSection("leadAudio")}
                />
                Lead Audio Description
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadVideos}
                  onChange={() => toggleReportSection("leadVideos")}
                />
                Lead Videos Description
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadScratchpad}
                  onChange={() => toggleReportSection("leadScratchpad")}
                />
                Lead Scratchpad Entries
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="report"
                  checked={selectedReports.leadTimeline}
                  onChange={() => toggleReportSection("leadTimeline")}
                />
                Lead Timeline Entries
              </label>
            </div>
          </div>
        </td>
      </tr>

      {/* Destination Row */}
      <tr>
        <td>Destination</td>
        <td>
          <label className="radio-label">
            <input
              type="radio"
              name="destination"
              className="dest-op-class"
            />
            Print
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="destination"
              className="dest-op-class"
            />
            Preview
          </label>
        </td>
      </tr>
    </tbody>
  </table>
  <div className="run-sec">
  <button className="save-btn1" onClick={handleRunReport}>Run Report</button> </div>
</div>


        </div>
        </div>

        <Comment tag= "Finish"/>
        {/* Buttons */}

        {isCaseManager ?
        (
        <div className="form-buttons-finish">
          <button className="save-btn1"  onClick={() => submitReturnAndUpdate("complete")} >Approve</button>
          <button className="save-btn1"  onClick={() => submitReturnAndUpdate("pending")}>Return</button>
        </div>
         ) :
        (
        <div className="form-buttons-finish">
          <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

          className="save-btn1" onClick={handleSubmitReport}>
            Submit Report
          </button>
        </div>
        )
      }

        </div>
        </div>
   
     
     <FootBar1
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRTimelines")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
