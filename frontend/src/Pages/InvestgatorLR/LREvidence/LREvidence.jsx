import Navbar from '../../../components/Navbar/Navbar';
import "./LREvidence.css"; // Custom CSS file for Evidence styling
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Comment from "../../../components/Comment/Comment";
import React, { useContext, useState, useEffect, useRef} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';


export const LREvidence = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
  const navigate = useNavigate(); // Initialize navigate hook
  const FORM_KEY = "LREvidence:form";
const LIST_KEY = "LREvidence:list";

  const location = useLocation();
  const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");
      const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);  
      const fileInputRef = useRef();
      const [editIndex, setEditIndex]         = useState(null);
      const [originalDesc, setOriginalDesc]   = useState("");
      const [leadData, setLeadData] = useState({});
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
  
    const { leadDetails, caseDetails } = location.state || {};

    const [evidences, setEvidences] = useState(() => {
      const saved = sessionStorage.getItem(LIST_KEY);
      return saved ? JSON.parse(saved) : [];
    });


  // State to manage form data
   const [evidenceData, setEvidenceData] = useState(() => {
    const saved = sessionStorage.getItem(FORM_KEY);
      return saved
        ? JSON.parse(saved)
        : {
        leadReturnId:         "",
        evidenceDescription:  "",
        collectionDate:       "",
        disposedDate:         "",
        type:                 "",
        disposition:          "",
        isLink: false,
        link: "",
        originalName: '',   
        filename: '' 
        };  
    });

  const [file, setFile] = useState(null);

  useEffect(() => {
  sessionStorage.setItem(FORM_KEY, JSON.stringify(evidenceData));
}, [evidenceData]);

// save the list
useEffect(() => {
  sessionStorage.setItem(LIST_KEY, JSON.stringify(evidences));
}, [evidences]);
  
  const handleInputChange = (field, value) => {
    setEvidenceData({ ...evidenceData, [field]: value });
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

   // Save Enclosure: Build FormData and post to backend including token from localStorage.
  // const handleSaveEvidence = async () => {
  //   const formData = new FormData();
  //   if (file) {
  //     formData.append("file", file);
  //     console.log("file", file);
  //   }

  //   // Append other required fields
  //   formData.append("leadNo", selectedLead.leadNo); // Example value; update as needed
  //   formData.append("description", selectedLead.leadName);
  //   formData.append("enteredBy", localStorage.getItem("loggedInUser"));
  //   formData.append("caseName", selectedLead.caseName);
  //   formData.append("caseNo", selectedLead.caseNo);
  //   formData.append("leadReturnId", evidenceData.leadReturnId); // Example value; update as needed
  //   formData.append("enteredDate", new Date().toISOString());
  //   formData.append("type", evidenceData.type);
  //   formData.append("envidenceDescription", evidenceData.evidence);
  //   formData.append("collectionDate", evidenceData.collectionDate);
  //   formData.append("disposedDate", evidenceData.disposedDate);
  //   formData.append("disposition", evidenceData.disposition);

  //   // Retrieve token from localStorage
  //   const token = localStorage.getItem("token");
  //   console.log(token);
  //   for (const [key, value] of formData.entries()) {
  //     console.log(`FormData - ${key}:`, value);
  //   }
    
  //   try {
  //     const response = await api.post(
  //       "/api/lrevidence/upload",
  //       formData,
  //       { 
  //         headers: { 
  //           "Content-Type": undefined,  
  //           // "Content-Type": "multipart/form-data",
  //           "Authorization": `Bearer ${token}`  // Add token here
  //         } 
  //       }
  //     );
  //     console.log("Evidence saved:", response.data);
  //     // Optionally update local state with the new enclosure
  //     setEvidences([...evidences, response.data.evidences]);

  //     // Clear form fields if needed
  //     setEvidenceData({ type: "", evidences: "" });
  //     setFile(null);
  //   } catch (error) {
  //     console.error("Error saving evidence:", error);
  //   }
  // };

  const handleSaveEvidence = async () => {
    // require a file or a link on new entries
    if (editIndex === null && !file && !evidenceData.isLink) {
       setAlertMessage("Please select a file or enter a link.");
                      setAlertOpen(true);
      return;
    }
  
    // build payload
    const fd = new FormData();
    if (!evidenceData.isLink && file) {
      fd.append("file", file);
    }
    fd.append("leadNo", selectedLead.leadNo);
    fd.append("description", selectedLead.leadName);
    fd.append("enteredBy", localStorage.getItem("loggedInUser"));
    fd.append("caseName", selectedCase.caseName);
    fd.append("caseNo", selectedCase.caseNo);
    fd.append("leadReturnId", evidenceData.leadReturnId);
    fd.append("enteredDate", new Date().toISOString());
    fd.append("type", evidenceData.type);
    fd.append("evidenceDescription", evidenceData.evidenceDescription);
    fd.append("collectionDate", evidenceData.collectionDate);
    fd.append("disposedDate", evidenceData.disposedDate);
    fd.append("disposition", evidenceData.disposition);
    // link-specific
    fd.append("isLink", evidenceData.isLink);
    if (evidenceData.isLink) {
      fd.append("link", evidenceData.link);
    }
  
    try {
      const token = localStorage.getItem("token");
      if (editIndex === null) {
        // CREATE
        await api.post("/api/lrevidence/upload", fd, {
          headers: { Authorization: `Bearer ${token}` },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        });
        
      } else {
        // UPDATE
        const ev = evidences[editIndex];
        const url =
          `/api/lrevidence/${selectedLead.leadNo}/` +
          `${encodeURIComponent(selectedLead.leadName)}/` +
          `${selectedCase.caseNo}/` +
          `${encodeURIComponent(selectedCase.caseName)}/` +
          `${ev.returnId}/` +
          `${encodeURIComponent(originalDesc)}`;
        await api.put(url, fd, {
          headers: { Authorization: `Bearer ${token}` },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        });
      }
  
      // refresh & reset
      await fetchEvidences();
      setEvidenceData({
        leadReturnId:        "",
        evidenceDescription: "",
        collectionDate:      "",
        disposedDate:        "",
        type:                "",
        disposition:         "",
        isLink:              false,
        link:                "",
        originalName:        "",
        filename:            ""
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditIndex(null);
      setOriginalDesc("");
      sessionStorage.removeItem(FORM_KEY);

    } catch (err) {
      console.error("Save error:", err);
      setAlertMessage("Failed to save evidence.");
      setAlertOpen(true);
    }
  };
  

  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchEvidences();
    }
  }, [selectedLead, selectedCase]);
  const fetchEvidences = async () => {
    const token = localStorage.getItem("token");
  
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName); // encode to handle spaces
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);
  
    try {
      const res = await api.get(
        `/api/lrevidence/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            "Content-Type": undefined,  
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const mappedEvidences = res.data.map((enc) => ({
        dateEntered: formatDate(enc.enteredDate),
        type: enc.type,
        evidenceDescription:  enc.evidenceDescription,
        returnId: enc.leadReturnId,
        originalName: enc.originalName,
        collectionDate: formatDate(enc.collectionDate),
        disposedDate: formatDate(enc.disposedDate),
        disposition: enc.disposition,
        originalName:        enc.originalName,
        filename:            enc.filename,
         link:                enc.link || ""   
      }));

      const withAccess = mappedEvidences.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
  
      setEvidences(withAccess);
      setLoading(false);
      setError("");
    } catch (err) {
      console.error("Error fetching evidences:", err);
      setError("Failed to load evidences");
      setLoading(false);
    }
  };
   // Handle file selection
   const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    console.log("Selected file:", event.target.files[0]);
  };

  const handleAccessChange = (idx, newAccess) => {
    setEvidences(rs => {
      const copy = [...rs];
      copy[idx] = { ...copy[idx], access: newAccess };
      return copy;
    });
  };
  const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";

  const handleEdit = idx => {
    const ev = evidences[idx];
    setEditIndex(idx);
    setOriginalDesc(ev.evidenceDescription);
    setEvidenceData({
      leadReturnId:        ev.returnId,
      collectionDate:      ev.collectionDate,
      disposedDate:        ev.disposedDate,
      type:                ev.type,
      evidenceDescription: ev.evidenceDescription,
      disposition:         ev.disposition,
      isLink:              !!ev.link,
      link:                ev.link || "",
      originalName:        ev.originalName,
      filename:            ev.filename
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  
  const handleDelete = async idx => {
    if (!window.confirm("Delete this evidence?")) return;
    const ev = evidences[idx];
    const token = localStorage.getItem("token");
    const url = `/api/lrevidence/${selectedLead.leadNo}/` +
                `${encodeURIComponent(selectedLead.leadName)}/` +
                `${selectedCase.caseNo}/` +
                `${encodeURIComponent(selectedCase.caseName)}/` +
                `${ev.returnId}/` +
                `${encodeURIComponent(ev.evidenceDescription)}`;
    try {
      await api.delete(url, { headers:{ Authorization:`Bearer ${token}` } });
      setEvidences(list => list.filter((_,i)=>i!==idx));

    } catch (err) {
      console.error(err);
      setAlertMessage("Failed to delete: " + (err.response?.data?.message||err.message));
                      setAlertOpen(true);
    }
  };

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
  
    const { status, isReadOnly } = useLeadStatus({
    caseNo: selectedCase.caseNo,
    caseName: selectedCase.caseName,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
  });

  return (
    <div className="lrevidence-container">
      {/* Navbar */}
      <Navbar />
        <AlertModal
          isOpen={alertOpen}
          title="Notification"
          message={alertMessage}
          onConfirm={() => setAlertOpen(false)}
          onClose={()   => setAlertOpen(false)}
        />

      {/* Top Menu */}
      {/* <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideo")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
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
                <div className="top-menu1" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Narrative
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LREvidence')} >
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
         </div> </div>
                {/* <div className="caseandleadinfo">
          <h5 className = "side-title">  Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>


          </div> */}
               <div className="caseandleadinfo">
          <h5 className = "side-title"> 
             {/* Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""} */}
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Evidences
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
        ? `Your Role: ${selectedCase.role || ""} | Lead Status:  ${status}`
    : ` ${leadStatus}`}
</h5>

          </div>
     
        {/* <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo-lr"
          />
        </div> */}
        <div className="case-header">
          <h2 className="">EVIDENCE INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Evidence Form */}
        <div className = "timeline-form-sec-enc">
          <div className="enclosure-form">
          <div className="form-row-evidence">
            <label  className="evidence-head">Collection Date*</label>
            <input
              type="date"
              value={evidenceData.collectionDate}
             
              onChange={(e) => handleInputChange("collectionDate", e.target.value)}
            />
            <label className="evidence-head">Disposed Date</label>
            <input
              type="date"
              value={evidenceData.disposedDate}
            
              onChange={(e) => handleInputChange("disposedDate", e.target.value)}
            />
            <label className="evidence-head">Narrative Id*</label>
            <input
              type="leadReturnId"
              value={evidenceData.leadReturnId}
            
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label className="evidence-head">Type</label>
            <input
              type="text"
              value={evidenceData.type}
            
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <label className="evidence-head">Description*</label>
<textarea
  value={evidenceData.evidenceDescription}
  onChange={e => handleInputChange("evidenceDescription", e.target.value)}
/>
{/* Upload Type */}
<div className="form-row-evidence">
  <label>Upload Type</label>
  <select
    value={evidenceData.isLink ? "link" : "file"}
    onChange={e =>
      setEvidenceData(prev => ({
        ...prev,
        isLink: e.target.value === "link",
        link:   ""     // reset link if switching back to file
      }))
    }
  >
    <option value="file">File</option>
    <option value="link">Link</option>
  </select>
</div>

{/* If editing a file‐upload entry, show current filename */}
{editIndex !== null && !evidenceData.isLink && evidenceData.originalName && (
  <div className="form-row-evidence">
    <label>Current File:</label>
    <span className="current-filename">
      {evidenceData.originalName}
    </span>
  </div>
)}

{/* File vs Link input */}
{!evidenceData.isLink ? (
  <div className="form-row-evidence">
    <label>
      {editIndex === null ? "Upload File*" : "Replace File (optional)*"}
    </label>
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  </div>
) : (
  <div className="form-row-evidence">
    <label>Paste Link*</label>
    <input
      type="text"
      placeholder="https://..."
      value={evidenceData.link}
      onChange={e =>
        setEvidenceData(prev => ({ ...prev, link: e.target.value }))
      }
    />
  </div>
)}

        </div>
  
        <div className="form-buttons">
  <button
    disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
    className="save-btn1"
    onClick={handleSaveEvidence}
  >
    {editIndex === null ? "Add Evidence" : "Update Evidence"}
  </button>

  {editIndex !== null && (
    <button
      disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
      className="save-btn1"
      onClick={() => {
        // reset form back to “add” mode
        setEditIndex(null);
        setEvidenceData({
          leadReturnId:        "",
          evidenceDescription: "",
          collectionDate:      "",
          disposedDate:        "",
          type:                "",
          disposition:         "",
          isLink:              false,
          link:                "",
          originalName:        "",
          filename:            ""
        });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }}
    >
      Cancel
    </button>
  )}
</div>

        </div>  
  

            {/* Evidence Table */}
            <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th style={{ width: "11%" }}> Narrative Id </th>
              <th>Type</th>
              {/* <th>Collection Date</th> */}
              {/* <th>Disposed Date</th> */}
              <th>File Name</th>
              <th>Description</th>
              <th>Actions</th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {evidences.length > 0 ?  evidences.map((item, index) => (
              <tr key={index}>
                <td>{item.dateEntered}</td>
                <td> {item.returnId} </td>
                <td>{item.type}</td>
                {/* <td>{item.collectionDate}</td> */}
                {/* <td>{item.disposedDate}</td> */}
                <td>
  {item.link ? (
    // if it's a link‐type upload
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {item.link}
    </a>
  ) : (
    // otherwise it's a file
    <a
      href={`${BASE_URL}/uploads/${item.filename}`}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {item.originalName}
    </a>
  )}
</td>

                <td>{item.evidenceDescription}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEdit(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDelete(index)}
                />
                  </button>
                  </div>
                </td>
                {isCaseManager && (
          <td>
            <select
              value={item.access}
              onChange={e => handleAccessChange(index, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Case Manager Only</option>
            </select>
          </td>
        )}
      </tr>
       )) : (
        <tr>
          <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign:'center' }}>
            No Evidences Available
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
)}  */}

        <Comment tag = "Evidence"/>
        </div>
        </div>

        {/* Action Buttons */}
        {/* <div className="form-buttons-evidence">
          <button className="add-btn" onClick={handleAddEvidence}>Add Evidence</button>
          <button className="back-btn" onClick={() => handleNavigation("/LREnclosures")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRPictures")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
     

      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRPictures")} // Takes user to CM Return page
      />
    </div>
    </div>
   </div>
  );
};
