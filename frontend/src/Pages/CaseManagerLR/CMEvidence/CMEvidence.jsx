import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./CMEvidence.css"; // Custom CSS file for Evidence styling
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Comment from "../../../components/Comment/Comment";
import Attachment from "../../../components/Attachment/Attachment";
import api, { BASE_URL } from "../../../api";




export const CMEvidence = () => {

  useEffect(() => {
      // Apply style when component mounts
      document.body.style.overflow = "hidden";
  
      return () => {
        // Reset to default when component unmounts
        document.body.style.overflow = "auto";
      };
    }, []);
  const navigate = useNavigate();
   const location = useLocation();

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


  // Sample evidence data
  const [evidence, setEvidence] = useState([
    // {
    //   dateEntered: "12/01/2024",
    //   type: "Physical",
    //   collectionDate: "12/01/2024",
    //   disposedDate: "12/03/2024",
    //   disposition: "Stored",
    // },
    // {
    //   dateEntered: "12/02/2024",
    //   type: "Digital",
    //   collectionDate: "12/02/2024",
    //   disposedDate: "12/04/2024",
    //   disposition: "Archived",
    // },
  ]);

  // State to manage form data
  const [evidenceData, setEvidenceData] = useState({
    collectionDate: "",
    disposedDate: "",
    type: "",
    disposition: "",
  });
    const [file, setFile] = useState(null);
  

  const handleInputChange = (field, value) => {
    setEvidenceData({ ...evidenceData, [field]: value });
  };

   // Handle file selection
   const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };


  const handleAddEvidence = () => {
    const newEvidence = {
      dateEntered: new Date().toLocaleDateString(),
      collectionDate: evidenceData.collectionDate,
      disposedDate: evidenceData.disposedDate,
      type: evidenceData.type,
      disposition: evidenceData.disposition,
    };

    // Add new evidence to the list
    setEvidence([...evidence, newEvidence]);

    // Clear form fields
    setEvidenceData({
      collectionDate: "",
      disposedDate: "",
      type: "",
      disposition: "",
    });
  };

    const { selectedCase, selectedLead, leadInstructions, leadReturns} = useContext(CaseContext);
  

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};

   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
              const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
            
              const onShowCaseSelector = (route) => {
                navigate(route, { state: { caseDetails } });
            };

  // Fetch enclosures from backend when component mounts or when selectedLead/selectedCase update
  // useEffect(() => {
  //   const fetchEvidences = async () => {
  //     if (!selectedLead || !selectedCase) {
  //       console.warn("Missing selected lead or case details");
  //       return;
  //     }
  //     // Build URL using selectedLead and selectedCase; URL-encode values that may have spaces
  //     const leadNo = selectedLead.leadNo;
  //     const leadName = encodeURIComponent(selectedLead.leadName);
  //     const caseNo = encodeURIComponent(selectedLead.caseNo);
  //     // Here, assuming caseName is in selectedLead or selectedCase; adjust as needed.
  //     const caseName = encodeURIComponent(selectedLead.caseName || selectedCase.caseName);
  //     const token = localStorage.getItem("token");

  //     const url = `/api/lrevidence/${leadNo}/${leadName}/${caseNo}/${caseName}`;
  //     try {
  //       const response = await axios.get(url, {
  //         headers: { "Content-Type": undefined,   "Authorization": `Bearer ${token}` }
  //       });
  //       console.log("Fetched enclosures:", response.data);
  //       setEvidence(response.data);
  //     } catch (error) {
  //       console.error("Error fetching enclosures:", error);
  //     }
  //   };

  //   fetchEvidences();
  // }, [selectedLead, selectedCase]);

  useEffect(() => {
    const fetchEvidences = async () => {
      if (!selectedLead?.leadNo || !selectedCase?.caseNo) {
        console.warn("fetchEvidences: missing selectedLead or selectedCase");
        return;
      }
  
      const leadNo    = selectedLead.leadNo;
      const leadName  = encodeURIComponent(selectedLead.leadName);
      const caseNo    = encodeURIComponent(selectedCase.caseNo);
      const caseName  = encodeURIComponent(selectedCase.caseName);
      const token     = localStorage.getItem("token");
      const path      = `/api/lrevidence/${leadNo}/${leadName}/${caseNo}/${caseName}`;
  
      console.log("📡 CMEvidence fetch →", path);
      try {
        // use your pre-configured axios instance so the proxy works
        const response = await api.get(path, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Fetched evidence:", response.data);
        setEvidence(response.data);
      } catch (err) {
        // log the real status & response
        console.error("Error fetching evidence:", err.response || err);
      }
    };
  
    fetchEvidences();
  }, [selectedLead, selectedCase]);
  

  return (
    <div className="lrevidence-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/CMInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEnclosures")}>Enclosures</span>
          <span className="menu-item active" onClick={() => handleNavigation("/CMEvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVideo")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/CMTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/CMFinish")}>Finish</span>
        </div>
      </div>

      <div className="LRI_Content">
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
         </ul>
                </div>
                <div className="left-content">
     
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

        
        {/* <div className = "content-to-add">
        <h4 className="evidence-form-h4">Enter Evidence Details</h4>
        <div className="evidence-form">
          <div className="form-row-evidence">
            <label  className="evidence-head">Collection Date:</label>
            <input
              type="date"
              value={evidenceData.collectionDate}
              className="input-field"
              onChange={(e) => handleInputChange("collectionDate", e.target.value)}
            />
            <label className="evidence-head">Disposed Date:</label>
            <input
              type="date"
              value={evidenceData.disposedDate}
              className="input-field"
              onChange={(e) => handleInputChange("disposedDate", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label className="evidence-head">Type:</label>
            <input
              type="text"
              value={evidenceData.type}
              className="input-field"
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label className="evidence-head">Disposition:</label>
            <textarea
              value={evidenceData.disposition}
              onChange={(e) => handleInputChange("disposition", e.target.value)}
            ></textarea>
          </div>
        </div>
        </div> */}
        {/* <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddEvidence}>Add Evidence</button>
        </div> */}

<div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Evidence Table */}
        <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Return ID</th>
              <th>Type</th>
              <th>Collection Date</th>
              <th>Disposed Date</th>
              <th>Disposition</th>
              <th style={{ width: "15%" }}>Access</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((item, index) => (
              <tr key={index}>
                <td>{formatDate(item.enteredDate)}</td>
                <td>{item.leadReturnId}</td>
                <td>{item.type}</td>
                <td>{formatDate(item.collectionDate)}</td>
                <td>{formatDate(item.disposedDate)}</td>
                <td>{item.disposition}</td>
                <td>
        <select
          value={ "Case Manager"}
          // onChange={(e) => handleAccessChange(index, e.target.value)} 
        >
          <option value="Case Manager">Case Manager</option>
          <option value="Everyone">Everyone</option>
        </select>
      </td>
              </tr>
            ))}
          </tbody>
        </table>
         {/* <Attachment /> */}
               <Attachment attachments={evidence.map(e => ({
                   name: e.originalName || e.filename,
                   // Optionally include size and date if available:
                   size: e.size || "N/A",
                   date: e.enteredDate ? new Date(e.enteredDate).toLocaleString() : "N/A",
                   // Build a URL to view/download the file
                   url: `${BASE_URL}/uploads/${e.filename}`
                 }))} />
         <Comment tag= "Evidence"/>
        </div>
        </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREnclosures")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
