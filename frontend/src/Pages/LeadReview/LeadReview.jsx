import React, { useContext, useState, useEffect} from 'react';

import Navbar from '../../components/Navbar/Navbar';
import Searchbar from '../../components/Searchbar/Searchbar';
import Button from '../../components/Button/Button';
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import './LeadReview.css';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";


export const LeadReview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Grab case details from location.state
  const { caseDetails } = location.state || {};
  const { leadId, leadDescription } = location.state || {};
  const leadEntries = location.state?.leadEntries || [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { selectedCase, setSelectedLead , selectedLead} = useContext(CaseContext);
// const leadFromState = location.state?.lead || null;

// const selectedLead = leadFromState || null;

  const statuses = [
    "Lead Created",
    "Lead Assigned",
    "Lead Accepted",
    "Lead Return Submitted",
    "Lead Approved",
    "Lead Returned",
    "Lead Completed",
  ];
  
  // Change this index to highlight the current status dynamically
  const currentStatusIndex = 1; // Example: Highlighting "Lead Return Submitted"

  const formatDate = (dateString) => {
    if (!dateString) return ""; // Handle empty dates
    const date = new Date(dateString);
    if (isNaN(date)) return ""; // Handle invalid dates
  
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year
  
    return `${month}/${day}/${year}`;
  };


  // Default case summary if no data is passed
  const defaultCaseSummary = "Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.";
  // For demonstration, we store lead-related data
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
    // caseName: 'Main Street Theft',
    // caseSummary: defaultCaseSummary,
  });

  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};

const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

const onShowCaseSelector = (route) => {
  navigate(route, { state: { caseDetails } });
};


  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        if (selectedLead.leadNo && selectedLead.leadName && selectedCase?.caseNo && selectedCase?.caseName) {
          const token = localStorage.getItem("token");
          console.log("localstorage data",localStorage.getItem("token"));

          const response = await axios.get(`http://localhost:5000/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(
            selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

          console.log("Fetched Lead Data1:", response.data);

          // if (response.data.length > 0) {
          //   setLeadData(response.data[0]); // Assuming one lead is returned
          // } else {
          //   setError("No lead data found.");
          // }

          if (response.data.length > 0) {
            setLeadData({
              ...response.data[0], 
              assignedOfficer: response.data[0].assignedOfficer || [] // Ensure array
            });
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
  }, [selectedLead, selectedCase]);


  // For subnumbers
  const [availableSubNumbers] = useState([
    "SUB-000001", "SUB-000002", "SUB-000003", "SUB-000004", "SUB-000005"
  ]);
  const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]);
      const [assignedOfficers, setAssignedOfficers] = useState([]);
  

  useEffect(() => {
    if (leadData.associatedSubNumbers) {
      setAssociatedSubNumbers(leadData.associatedSubNumbers);
    }
  }, [leadData]);

  useEffect(() => {
    if (leadData.assignedTo) {
      setAssignedOfficers(leadData.assignedTo);
    }
  }, [leadData]);
  

  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  // Navigation and tab states
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Input change handler
  const handleInputChange = (field, value) => {
    // Example: Only allow digits for 'leadNumber'
    if (field === 'leadNumber' && !/^\d*$/.test(value)) {
      alert("Lead Number must be numeric.");
      return;
    }
    setLeadData({ ...leadData, [field]: value });
  };

  // Reusable navigation
  const handleNavigation = (route) => {
    navigate(route);
  };

  const [caseSummary, setCaseSummary] = useState('' ||  defaultCaseSummary);

  const [isEditing, setIsEditing] = useState(false); // Controls whether the textarea is editable
  useEffect(() => {
   const fetchCaseSummary = async () => {
     try {
       if (selectedCase && selectedCase.caseNo) {
         const token = localStorage.getItem("token");
         const response = await axios.get(`http://localhost:5000/api/cases/summary/${selectedCase.caseNo}`, {
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
 }, [selectedCase]);


  return (
    <div className="lead-review-page">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <div className="lead-review-container1">

      <div className="sideitem">
          <ul className="sidebar-list">

          <li className="sidebar-item" onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
                    Lead Management {leadDropdownOpen ?  "▲": "▼" }
                  </li>
                  {leadDropdownOpen && (
                    <ul className="dropdown-list1">
                       {/* <li className="sidebar-item" onClick={() => navigate('/LeadReview')}>Lead Information</li> */}
                       <li className="sidebar-item" onClick={() => navigate('/LRInstruction', { state: { caseDetails } } )}>Go To Lead Return</li>
                       {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>New Lead</li> */}
                       <li className="sidebar-item" onClick={() => navigate('/SearchLead')}>Search Lead</li>
                       <li className="sidebar-item"onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>View Lead Chain of Custody</li>
          </ul>
        )} 

          <li className="sidebar-item" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Management {caseDropdownOpen ? "▲" : "▼"}
        </li>
        {caseDropdownOpen && (
          <ul className="dropdown-list1">
              <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
              <li className="sidebar-item" onClick={() => navigate(getCasePageRoute())}>Case Page</li>
              <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>
              View Lead Log
            </li>
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li> */}
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              View/Add Case Notes
            </li>
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
              View Lead Hierarchy
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              Generate Report
            </li> */}
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>
              View Flagged Leads
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>
              View Timeline Entries
            </li>
            {/* <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li> */}

            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

         
          </ul>
        )}
          </ul>
        </div>

        {/* Content Area */}
        <div className="lead-main-content">
          {/* Page Header */}
          <div className="case-header">
            {/* <h1>LEAD:{selectedLead.leadNo} | {selectedLead.leadName.toUpperCase()}</h1> */}
            <h1>
  {selectedLead?.leadNo ? `LEAD: ${selectedLead.leadNo} | ${selectedLead.leadName?.toUpperCase()}` : "LEAD DETAILS"}
</h1>

          </div>

          {/* Case Summary Textarea */}
          {/* <div className="form-section">
            <label className="input-label">Case Summary</label>
            <textarea
              className="case-summary-textarea"
              value={caseSummary}
              onChange={(e) => setCaseSummary(e.target.value)}
            />
          </div> */}

          {/* Additional Lead Details (Bottom Table) */}
          <div className="form_and_tracker">
          <div className="form-section">
            <table className="details-table">
              <tbody>
                {/* <tr>
                  <td className="info-label">Case Name:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.caseName}
                      onChange={(e) => handleInputChange('caseName', e.target.value)}
                    />
                  </td>
                </tr> */}
                {/* <tr>
                  <td className="info-label">Case Summary:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field read-only"
                      value={leadData.caseSummary}
                      readOnly
                    />
                  </td>
                </tr> */}
                {/* <tr>
                  <td className="info-label">Lead Number:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field read-only"
                      value={leadData.leadNumber}
                      readOnly
                    />
                  </td>
                </tr> */}
                <tr>
                  <td className="info-label">Incident Number:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.incidentNo}
                      onChange={(e) => handleInputChange('incidentNumber', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="info-label">Subnumber:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.subNumber}
                    
                    />
                  </td>
                </tr>
                <tr>
                  <td className="info-label">Assigned Date:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={formatDate(leadData.assignedDate)}
                      onChange={(e) => handleInputChange('assignedDate', e.target.value)}
                      placeholder="MM/DD/YY"
                    />
                  </td>
                </tr>
                {/* <tr>
                  <td className="info-label">Lead Summary:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.leadSummary}
                      onChange={(e) => handleInputChange('leadSummary', e.target.value)}
                      placeholder="Enter Lead Summary"
                    />
                  </td>
                </tr> */}
                <tr>
                  <td className="info-label">Lead Origin:</td>
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

                {/* Associated Subnumbers */}
                <tr>
  <td className="info-label"style={{ width: "30%" }}>Associated Subnumbers:</td>
  <td>
    <div className="custom-dropdown">
      <div
        className="dropdown-header"
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

                {/* Another example date field */}
                <tr>
                  <td className="info-label">Due Date:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={formatDate(leadData.dueDate)}
                      placeholder="MM/DD/YY"
                    />
                  </td>
                </tr>

                <tr>
  <td className="info-label">Assigned Officers:</td>
  <td>
    <div className="custom-dropdown">
      <div
        className="dropdown-header"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {assignedOfficers.length > 0
          ? assignedOfficers.join(", ")
          : "Select Officers"}
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
                  <td className="info-label">Assigned By:</td>
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
                <tr>
                  <td className="info-label">Lead Instruction:</td>
                  <td>
                    <textarea
                      className="textarea-field"
                      value={leadData.summary}
                      onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                      placeholder=""
                    ></textarea>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="lead-tracker-container">
                  {statuses.map((status, index) => (
                       <div key={index} className="lead-tracker-row" onClick={() => {
                        if (status === "Lead Return Submitted") {
                          handleNavigation("/CMInstruction");
                        }
                      }}
                      style={{ cursor: status === "Lead Return Submitted" ? "pointer" : "default" }}
                    >
                          {/* Circle Indicator */}
                          <div
                            className={`status-circle ${index <= currentStatusIndex ? "active" : ""}`}
                          >
                            {index <= currentStatusIndex && <span className="status-number">{index + 1}</span>}
                         </div>

                            {/* Connector Line (Except Last Item) */}
                            {index < statuses.length && (
                              <div className={`status-line ${index < currentStatusIndex ? "active" : ""}`}></div>
                            )}

                            {/* Status Box */}
                            <div
                              className={`status-text-box ${index === currentStatusIndex ? "highlighted" : ""}`}
                            >
                              {status}
                            </div>
                        </div>
                      ))}
                </div>
                </div>

          {/* Example "Go to Main Page" button */}
          {/* <div className="navigation-buttons">
            <button
              className="custom-button secondary-button"
              onClick={() => handleNavigation("/MainPage")}
            >
              Go to Main Page
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};
