import FootBar from '../../../components/FootBar/FootBar';
import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactToPrint from 'react-to-print';

import Navbar from '../../../components/Navbar/Navbar';
import './LRInstruction.css';



export const LRInstruction = () => {
    const navigate = useNavigate(); // Initialize useNavigate hook
    const printRef = useRef();
    const routerLocation = useLocation();
    const { caseDetails } = routerLocation.state || {};

  
  const [leadData, setLeadData] = useState({
    leadNumber: '16',
    leadOrigin: '7',
    incidentNumber: 'C000006',
    subNumber: 'C0000045',
    associatedSubNumbers: [],
    assignedDate: '09/29/24',
    leadSummary: 'Interview Sarah',
    assignedBy: 'Officer 5',
    leadDescription: 'Interview Sarah to find out where she was on Saturday 09/25',
    assignedOfficer: ['Officer 1','Officer 2'],
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

  const handleNextPage = () => {
    navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  };

  
    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  
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
                    <ul className="sidebar-list">
                    {/* <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
                        <li className="sidebar-item" onClick={() => navigate('/createlead')}>Create Lead</li>
                        <li className="sidebar-item" onClick={() => navigate("/leadlog", { state: { caseDetails } } )} >View Lead Log</li>
                        <li className="sidebar-item" onClick={() => navigate('/OfficerManagement')}>Officer Management</li>
                        <li className="sidebar-item"onClick={() => navigate('/casescratchpad')}>Case Scratchpad</li>
                        <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
                        <li className="sidebar-item"onClick={() => navigate('/LeadHierarchy1')}>View Lead Hierarchy</li>
                        <li className="sidebar-item">Generate Report</li>
                        <li className="sidebar-item"onClick={() => navigate('/FlaggedLead')}>View Flagged Leads</li>
                        <li className="sidebar-item"onClick={() => navigate('/ViewTimeline')}>View Timeline Entries</li>
                        <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li>

                        <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li> */}

                            {/* Case Information Dropdown */}
        <li className="sidebar-item" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Management {caseDropdownOpen ? "▼" : "▲" }
        </li>
        {caseDropdownOpen && (
          <ul className="dropdown-list1">
              <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
              <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>
              View Lead Log
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li>
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Case Scratchpad
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
              View Lead Hierarchy
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              Generate Report
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>
              View Flagged Leads
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>
              View Timeline Entries
            </li>
            <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li>

            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

         
          </ul>
        )}


                                 {/* Lead Management Dropdown */}
                                 <li className="sidebar-item" onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Management {leadDropdownOpen ?  "▼" : "▲"}
        </li>
        {leadDropdownOpen && (
          <ul className="dropdown-list1">
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>
              New Lead
            </li>
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              View Lead Chain of Custody
            </li>
          </ul>
        )} 

                    </ul>
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
        <div className="info-table-sec">
          <table className="info-table">
            <tbody>
              <tr>
                <td>LEAD NUMBER:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.leadNumber}
                    onChange={(e) => handleInputChange('leadNumber', e.target.value)}
                    placeholder="12"
                  />
                </td>
              </tr>
              <tr>
                <td>INCIDENT NUMBER:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.incidentNumber}
                    onChange={(e) => handleInputChange('incidentNumber', e.target.value)}
                    placeholder="C000000"
                  />
                </td>
              </tr>
              <tr>
                <td>SUBNUMBER:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.subNumber}
                    onChange={(e) => handleInputChange('subNumber', e.target.value)}
                    placeholder="C0000000"
                  />
                </td>
              </tr>
              <tr>
                <td>ASSIGNED DATE:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.assignedDate}
                    onChange={(e) => handleInputChange('assignedDate', e.target.value)}
                    placeholder="08/25/24"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
                  value={leadData.caseName || 'Main Street Murder'} // Display selected case name or an empty string
                  onChange={(e) => handleInputChange('caseName', e.target.value)} // Update 'caseName' in leadData
                  placeholder="Enter Case Name"
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
                  onChange={(e) => handleInputChange('leadSummary', e.target.value)}
                  placeholder="Enter Lead Summary"
                />
              </td>
            </tr>
            <tr>
                <td>Lead Origin:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.leadOrigin}
                    onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                    placeholder="Enter Lead Origin"
                  />
                </td>
              </tr>
            <tr>
  <td>Associated Subnumbers:</td>
  <td>
    <div className="custom-dropdown-cl">
      <div
        className="dropdown-header-cl"
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
  <td>Assign Officers:</td>
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
          {['Officer 1', 'Officer 2', 'Officer 3'].map((officer) => (
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
  </td>
</tr>




            <tr>
              <td>Assigned By:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.assignedBy}
                  onChange={(e) => handleInputChange('assignedBy', e.target.value)}
                  placeholder="Assigned By"
                />
              </td>
            </tr>
            <tr>
              <td>Lead Description:</td>
              <td>
                <textarea
                  className="textarea-field-cl"
                  value={leadData.leadDescription}
                  onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                  placeholder="Enter Lead Description"
                ></textarea>
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