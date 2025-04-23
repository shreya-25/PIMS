import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./CMEnclosures.css";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import Attachment from "../../../components/Attachment/Attachment";
import api, { BASE_URL } from "../../../api";




export const CMEnclosures = () => {

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
    const { selectedCase, selectedLead, setSelectedLead, leadReturns, setLeadReturns  } = useContext(CaseContext);
  

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


  // Sample enclosures data
  const [enclosures, setEnclosures] = useState([
    // { dateEntered: "", leadReturnType: "", type: "", enclosure: "" },
    // { dateEntered: "12/03/2024", leadReturnId: "1", type: "Evidence", enclosure: "Photo Evidence" },
  ]);


  const [file, setFile] = useState(null);

  const handleInputChange = (field, value) => {
    setEnclosureData({ ...enclosureData, [field]: value });
  };

  // State to manage form data
  const [enclosureData, setEnclosureData] = useState({
    type: "",
    enclosure: "",
  });

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };


  const handleAddEnclosure = () => {
    const newEnclosure = {
      dateEntered: new Date().toLocaleDateString(),
      type: enclosureData.type,
      enclosure: enclosureData.enclosure,
    };

    // Add new enclosure to the list
    setEnclosures([...enclosures, newEnclosure]);

    // Clear form fields
    setEnclosureData({
      type: "",
      enclosure: "",
    });
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

   // Fetch enclosures from backend when component mounts or when selectedLead/selectedCase update
   useEffect(() => {
    const fetchEnclosures = async () => {
      if (!selectedLead || !selectedCase) {
        console.warn("Missing selected lead or case details");
        return;
      }
      // Build URL using selectedLead and selectedCase; URL-encode values that may have spaces
      const leadNo = selectedLead.leadNo;
      const leadName = encodeURIComponent(selectedLead.leadName);
      const caseNo = encodeURIComponent(selectedLead.caseNo);
      // Here, assuming caseName is in selectedLead or selectedCase; adjust as needed.
      const caseName = encodeURIComponent(selectedLead.caseName || selectedCase.caseName);
      const token = localStorage.getItem("token");

      const url = `/api/lrenclosure/${leadNo}/${leadName}/${caseNo}/${caseName}`;
      try {
        const response = await api.get(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("Fetched enclosures:", response.data);
        setEnclosures(response.data);
      } catch (error) {
        console.error("Error fetching enclosures:", error);
      }
    };

    fetchEnclosures();
  }, [selectedLead, selectedCase]);

  const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
            const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
          
            const onShowCaseSelector = (route) => {
              navigate(route, { state: { caseDetails } });
          };

          const getCasePageRoute = () => {
            if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
            return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
        };
            

  return (
    <div className="lrenclosures-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/CMInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVehicle")}>Vehicles</span>
          <span className="menu-item active" onClick={() => handleNavigation("/CMEnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEvidence")}>Evidence</span>
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
        </div>

    
                <div className="left-content">
     
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
          <h2 className="">ENCLOSURES INFORMATION</h2>
        </div>
     

      <div className = "LRI-content-section">

<div className = "content-subsection">
        {/* Enclosure Form */}
  {/* <div className = "content-to-add">
  <div className="enclosure-form">
          <div className="form-row">
            <label>Type:</label>
            <input
              type="text"
              value={enclosureData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Enclosure:</label>
            <textarea
              value={enclosureData.enclosure}
              onChange={(e) => handleInputChange("enclosure", e.target.value)}
            ></textarea>
          </div>
          <div className="form-row">
            <label>Upload File:</label>
            <input type="file" onChange={handleFileChange} />
          </div>
        </div>
        </div> */}

        {/* <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddEnclosure}>Add Enclosure</button>
         
        </div> */}

        {/* Enclosures Table */}
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Date Entered</th>
              <th style={{ width: "9%" }}>Return ID</th>
              <th style={{ width: "10%" }}>Type</th>
              <th>Enclosure Description</th>
              <th style={{ width: "15%" }}>Access</th>
            </tr>
          </thead>
          <tbody>
            {enclosures.length > 0 ? (
              enclosures.map((enclosure, index) => (
              <tr key={index}>
                <td>{formatDate(enclosure.enteredDate)}</td>
                <td>{enclosure.leadReturnId}</td>
                <td>{enclosure.type}</td>
                <td>{enclosure.enclosure}</td>
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
            ))) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  No Enclosures Available
                </td>
              </tr>)}
          </tbody>
        </table>
        {/* <Attachment /> */}
        <Attachment attachments={enclosures.map(e => ({
            name: e.originalName || e.filename,
            // Optionally include size and date if available:
            size: e.size || "N/A",
            date: e.enteredDate ? new Date(e.enteredDate).toLocaleString() : "N/A",
            // Build a URL to view/download the file
            url: `http://${BASE_URL}/uploads/${e.filename}`
          }))} />

        <Comment tag= "Enclosures"/>
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
