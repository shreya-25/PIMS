import FootBar from '../../../components/FootBar/FootBar';
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactToPrint from 'react-to-print';

import Navbar from '../../../components/Navbar/Navbar';
import './LRInstruction.css';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";




export const LRInstruction = () => {
    useEffect(() => {
        // Apply style when component mounts
        document.body.style.overflow = "hidden";
    
        return () => {
          // Reset to default when component unmounts
          document.body.style.overflow = "auto";
        };
      }, []);
    const navigate = useNavigate(); // Initialize useNavigate hook
    const printRef = useRef();
    const routerLocation = useLocation();
    const location = useLocation();
         const [loading, setLoading] = useState(true);
          const [error, setError] = useState("");
    const { caseDetails } = routerLocation.state || {};

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date)) return "";
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    };

    // const handleLRClick = () => {
    //   navigate("/LRReturn", { state: {caseDetails, leadDetails } });
    // };

    const getCasePageRoute = () => {
      if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
      return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };
  const [leadData, setLeadData] = useState({
    // leadNumber: '16',
    // leadOrigin: '7',
    // incidentNumber: 'C000006',
    // subNumber: 'C0000045',
    // associatedSubNumbers: [],
    // assignedDate: '09/29/24',
    // leadSummary: 'Interview Sarah',
    // assignedBy: 'Officer 5',
    // leadDescription: 'Interview Sarah to find out where she was on Saturday 09/25',
    // assignedOfficer: ['Officer 1','Officer 2'], leadNumber: '',
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
   const [availableSubNumbers, setAvailableSubNumbers] = useState([
        "SUB-000001", "SUB-000002", "SUB-000003", "SUB-000004", "SUB-000005"
      ]); // Static List of Subnumbers
      
      const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]); // Selected Subnumbers
      const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  const handleInputChange = (field, value) => {
    setLeadData({ ...leadData, [field]: value });
  };

  const handleGenerateLead = () => {
    const { leadNumber, leadSummary, assignedDate, assignedOfficer, assignedBy } = leadData;
  
    // Check if mandatory fields are filled
    if (!leadNumber || !leadSummary || !assignedDate || !assignedOfficer || !assignedBy) {
      alert("Please fill in all the required fields before generating a lead.");
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
    navigate(route); // Navigate to the respective page
  };

      const [assignedOfficers, setAssignedOfficers] = useState([]);
  

  const handleNextPage = () => {
    navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  };

            const { selectedCase, selectedLead, setSelectedLead, leadInstructions, setLeadInstructions } = useContext(CaseContext);
  
  
    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

    useEffect(() => {
      const fetchLeadData = async () => {
        try {
          if (selectedLead?.leadNo && selectedLead?.leadName && selectedLead?.caseNo && selectedLead?.caseName) {
            const token = localStorage.getItem("token");
            console.log("localstorage data",localStorage.getItem("token"));
  
            const response = await api.get(`/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(
              selectedLead.leadName)}/${selectedLead.caseNo}/${encodeURIComponent(selectedLead.caseName)}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
  
            console.log("Fetched Lead Data1:", response.data);
  
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

      <div className="top-menu">
        <div className="menu-items">
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
        {/* <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
            alt="Police Department Logo"
            className="police-logo-cl"
          />
        </div> */}

       <div className="left-content">

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
        <table className="leads-table">
    <thead>
      <tr>

        <th style={{ width: "10%" }}>Lead No.</th>
          <th style={{ width: "10%" }}>Incident No.</th>
          <th style={{ width: "10%" }}>Subnumber</th>
          <th style={{ width: "8%" }}>Assigned Date</th>
      </tr>
      </thead>
      <tbody>
      <tr>
      <td>{selectedLead.leadNo} </td>
      <td>{leadData.incidentNo}</td>
        <td>{leadData.subNumber}</td>
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
                  placeholder="Enter Case Name"
    />
              </td>
            </tr>
            <tr>
              <td>Lead Log Summary:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={selectedLead.leadName}
                  onChange={(e) => handleInputChange('leadSummary', e.target.value)}
                  placeholder="Enter Lead Summary"
                />
              </td>
            </tr>
            <tr>
              <td>Lead Instruction:</td>
              <td>
                <textarea
                  className="input-field"
                  value={leadData.summary}
                  onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                  placeholder="Enter Lead Description"
                ></textarea>
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
                    placeholder="NA"
                  />
                </td>
              </tr>
              <tr>
  <td >Associated Subnumbers:</td>
  <td>
    <div className="custom-dropdown">
      <div
        className="dropdown-header"
        onClick={() => setSubDropdownOpen(!subDropdownOpen)}
      >
        {associatedSubNumbers.length > 0
          ? associatedSubNumbers.join(", ")
          : "NA"}
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

                  setAssociatedSubNumbers(updatedSubs); // Update dropdown selection
                  setLeadData((prevData) => ({
                    ...prevData,
                    associatedSubNumbers: updatedSubs, // Update leadData
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
  <td >Assigned Officers:</td>
  <td>
    <div className="custom-dropdown">
      <div
        className="dropdown-header"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {assignedOfficers.length > 0
          ? assignedOfficers.join(", ")
          : "NA"}
        <span className="dropdown-icon">{dropdownOpen ? "▲" : "▼"}</span>
      </div>
      {dropdownOpen && (
        <div className="dropdown-options">
          {["Officer 99", "Officer 24", "Officer 1", "Officer 2", "Officer 3"].map((officer) => (
            <div key={officer} className="dropdown-item">
              <input
                type="checkbox"
                id={officer}
                value={officer}
                checked={assignedOfficers.includes(officer)}
                onChange={(e) => {
                  const updatedOfficers = e.target.checked
                    ? [...assignedOfficers, e.target.value]
                    : assignedOfficers.filter((o) => o !== e.target.value);

                  setAssignedOfficers(updatedOfficers); // Update UI state
                  setLeadData((prevData) => ({
                    ...prevData,
                    assignedTo: updatedOfficers, // Ensure backend gets updated
                  }));
                }}
              />
              <label htmlFor={officer}>{officer}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  </td>
</tr>

<tr>
                  <td >Assigned By:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.assignedBy}
                      onChange={(e) => handleInputChange('assignedBy', e.target.value)}
                      placeholder=""
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