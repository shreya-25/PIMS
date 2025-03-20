import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./CMFinish.css";
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";

export const CMFinish = () => {
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
        const [leadInstruction, setLeadInstruction] = useState({});
        const [leadReturns, setLeadReturns] = useState([]);
        const [leadPersons, setLeadPersons] = useState([]);
        const [leadVehicles, setLeadVehicles] = useState([]);
        const [leadEnclosures, setLeadEnclosures] = useState([]);
        const [leadEvidences, setLeadEvidences] = useState([]);

        const [selectedReports, setSelectedReports] = useState({
          leadInstruction: false,
          leadReturns: false,
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
          setSelectedReports((prev) => ({
            ...prev,
            [sectionKey]: !prev[sectionKey],
          }));
        };

        const token = localStorage.getItem("token");
        const handleRunReport = async () => {
          try {
            // Build the request body. Only include data for selected sections
            // to keep the payload small (optional). The server can also handle
            // skipping unselected sections if they come as null/undefined.
            const body = {
              user: "OfficerXYZ",  // Or from your auth context
              reportTimestamp: new Date().toLocaleString(),
      
              // Pass the entire object or only if selected
              leadInstruction: selectedReports.leadInstruction ? leadInstruction : null,
              leadReturns: selectedReports.leadReturns ? leadReturns : null,
              leadPersons: selectedReports.leadPersons ? leadPersons : null,
              leadVehicles: selectedReports.leadVehicles ? leadVehicles : null,
              // etc. for the rest
      
              // Also pass along which sections are selected
              selectedReports,
            };
      
            // Call your Node server endpoint
            const response = await axios.post("http://localhost:5000/api/report/generate", body, {
              responseType: "blob", // so we get the PDF back as a blob
              headers: {
                Authorization: `Bearer ${token}`, // Must match your verifyToken strategy
              },
            });
            // Create a blob and open in a new browser tab OR force download
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL); // Opens in a new tab for printing/previewing

    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Error generating PDF");
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


  return (
    <div className="lrfinish-container">
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
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
                <div className="left-content">
   


        {/* Center Section */}
        <div className="case-header">
          <h2 className=""> FINISH</h2>
        </div>

      <div className = "LRI-content-section">

      <div className = "content-subsection">

        {/* Logged Information */}
        <div className="logged-info">
          <div className="info-item">
            <label>Logged:</label>
            <input type="text" value="Officer 1" readOnly />
          </div>
          <div className="info-item">
            <label>Assigned To:</label>
            <input type="text" value="Officer 1" readOnly />
          </div>
          <div className="info-item">
            <label>Last Updated:</label>
            <input type="date" />
          </div>
          <div className="info-item">
            <label>Assigned By:</label>
            <input type="text" value="Officer 5" readOnly />
          </div>
          <div className="info-item">
            <label>Completed Date:</label>
            <input type="date" />
          </div>
        </div>

        {/* Reports and Destination */}
        <div className="reports-destination">
          <div className="report-options">
            <h4>Reports:</h4>
            <div className="report-column">
              <label>
                <input type="checkbox" name="report"  checked={selectedReports.leadInstruction}
              onChange={() => toggleReportSection("leadInstruction")} /> Lead Instruction
              </label>
              <label>
                <input type="checkbox" name="report" checked={selectedReports.leadReturns}
              onChange={() => toggleReportSection("leadReturns")} /> Lead Returns
              </label>
              <label>
                <input type="checkbox" name="report" checked={selectedReports.leadPersons}
              onChange={() => toggleReportSection("leadPersons")} /> Lead Persons
              </label>
              <label>
                <input type="checkbox" name="report"  checked={selectedReports.leadEnclosures}
              onChange={() => toggleReportSection("leadVehicles")} /> Lead Vehicles
              </label>
              <label>
                <input type="checkbox" name="report"  checked={selectedReports.leadEvidence}
              onChange={() => toggleReportSection("leadEnclosures")} /> Lead Enclosures
              </label>
              <label>
                <input type="checkbox" name="report" checked={selectedReports.leadPictures}
              onChange={() => toggleReportSection("leadEvidence")} /> Lead Evidences
              </label>
            </div>
            <div className="report-column">
              <label>
                <input type="checkbox" name="report" checked={selectedReports.leadPictures}
              onChange={() => toggleReportSection("leadPictures")}/> Lead Pictures
              </label>
              <label>
                <input type="checkbox" name="report"   checked={selectedReports.leadAudio}
              onChange={() => toggleReportSection("leadAudio")}/> Lead Audio Description
              </label>
              <label>
                <input type="checkbox" name="report"  checked={selectedReports.leadVideos}
              onChange={() => toggleReportSection("leadVideos")} /> Lead Videos Description
              </label>
              <label>
                <input type="checkbox" name="report" checked={selectedReports.leadScratchpad}
              onChange={() => toggleReportSection("leadScratchpad")} /> Lead Scratchpad Entries
              </label>
              <label>
                <input type="checkbox" name="report" checked={selectedReports.leadTimeline}
              onChange={() => toggleReportSection("leadTimeline")} /> Lead Timeline Entries
              </label>
            </div>
          </div>
          <div className="destination-options">
            <h4>Destination:</h4>
            <label>
              <input type="radio" name="destination" className="dest-op-class" /> Print
            </label>
            <label>
              <input type="radio" name="destination" className="dest-op-class" /> Preview
            </label>
          </div>
        </div>

        <Comment/>
        {/* Buttons */}
        <div className="form-buttons-finish">
          <button className="save-btn1" onClick={handleRunReport}>Run Report</button>
          <button className="save-btn1">Approve</button>
          <button className="save-btn1">Return</button>
        </div>

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
