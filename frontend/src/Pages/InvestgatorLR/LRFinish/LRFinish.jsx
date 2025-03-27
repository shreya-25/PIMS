import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import FootBar1 from "../../../components/FootBar1/FootBar1";
import "./LRFinish.css";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Comment from "../../../components/Comment/Comment";

export const LRFinish = () => {
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

  const [destination, setDestination] = useState("");
  const [leadInstructionContent, setLeadInstructionContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const { leadDetails, caseDetails } = location.state || {};
  const [leadInstruction, setLeadInstruction] = useState({});
  const [leadReturn, setLeadReturn] = useState([]);
  const [leadPersons, setLeadPersons] = useState([]);
  const [leadVehicles, setLeadVehicles] = useState([]);
  const [leadEnclosures, setLeadEnclosures] = useState([]);
  const [leadEvidences, setLeadEvidences] = useState([]);

  const { selectedCase, selectedLead, leadInstructions, leadReturns } = useContext(CaseContext);

  console.log("LD", leadInstructions);

  useEffect(() => {
    if (leadInstructions) {
      setLeadInstruction(leadInstructions);
    }
  }, [leadInstructions]);

  useEffect(() => {
    if (leadReturns) {
      setLeadReturn(leadReturns);
    }
  }, [leadReturns]);



  const [selectedReports, setSelectedReports] = useState({
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
        user: "Officer 916",  // Or from your auth context
        reportTimestamp: new Date().toLocaleString(),

        // Pass the entire object or only if selected
        leadInstruction: selectedReports.leadInstruction ? leadInstruction : null,
        leadReturn: selectedReports.leadReturn ? leadReturn : null,
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
const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
              const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
            
              const onShowCaseSelector = (route) => {
                navigate(route, { state: { caseDetails } });
            };

      
  

  const handleNavigation = (route) => {
    navigate(route);
  };

  const fetchLeadInstruction = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedLead.caseNo}/${encodeURIComponent(selectedLead.caseName)}", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Fetched LRInstruction data:", response.data);
      // If your endpoint returns HTML as text or JSON that you'll convert to HTML,
      // adjust this accordingly. For HTML, you might just set response.data directly.
      setLeadInstructionContent(response.data);
    } catch (error) {
      console.error("Error fetching Lead Instruction:", error);
    }
  };
  
  // In LRFinish.jsx
const handleNavigationToInstruction = () => {
  navigate("/LRInstruction", { state: { caseDetails, selectedReport: "Lead Instruction" } });
};


  const handleReportChange = (reportName) => {
    // When adding the report, if it's "Lead Instruction", fetch its content
    if (!selectedReports.includes(reportName)) {
      if (reportName === "Lead Instruction") {
        fetchLeadInstruction();
      }
      setSelectedReports((prev) => [...prev, reportName]);
    } else {
      // On unchecking, remove the report and clear the content if needed
      setSelectedReports((prev) => prev.filter((name) => name !== reportName));
      if (reportName === "Lead Instruction") {
        setLeadInstructionContent(null);
      }
    }
  };

  const handleDestinationChange = (e) => {
    setDestination(e.target.value);
  };

  const runReport = () => {
    if (destination === "Print") {
      // Build the HTML string for the new window
      const printContents = `
  <html>
    <head>
      <title>Lead Return Report – ${selectedCase?.caseNo} – ${selectedCase?.caseName}</title>
      <style>
        /* Add any print-specific styling here */
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; margin-bottom: 20px; }
        h2 { text-align: center; margin-bottom: 20px; } /* Center the h2 element */
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table td, .details-table th { border: 1px solid #000; padding: 8px; }
      </style>
    </head>
    <body>
      <h1>Lead Return Report</h1>
      <h2>${selectedCase?.caseNo || 'CaseNo'} – ${selectedCase?.caseName || 'CaseName'}</h2>
      <div class="bottom-content">
        ${leadInstructionContent ? leadInstructionContent : "<p>No content available.</p>"}
      </div>
    </body>
  </html>
`;
      // Open a new window and write the content
      const printWindow = window.open("", "_blank", "width=800,height=600");
      printWindow.document.open();
      printWindow.document.write(printContents);
      printWindow.document.close();
      printWindow.focus();
      // Delay to ensure content is loaded before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else if (destination === "Preview") {
      // You can use a similar approach for preview if desired
      console.log("Preview mode selected");
    } else {
      alert("Please select a destination (Print or Preview).");
    }
  };
  

  return (
    <div className="lrfinish-container">
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>
            Instructions
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRReturn")}>
            Returns
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>
            Person
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>
            Vehicles
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>
            Evidence
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>
            Pictures
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>
            Audio
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideo")}>
            Videos
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>
            Scratchpad
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRTimeline")}>
            Timeline
          </span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRFinish")}>
            Finish
          </span>
        </div>
      </div>

      <div className="LRI_Content">
       <div className="sideitem">
                    <ul className="sidebar-list">
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
              Add/View Case Notes
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
                <div className="left-content">
   


        {/* Center Section */}
        <div className="case-header">
          <h2 className=""> FINISH</h2>
        </div>

      <div className = "LRI-content-section">

      <div className = "content-subsection">

        {/* Logged Information */}
        <div className="timeline-form-sec">
         <div className="finish-row">
         <div className="finish-field">
            <label>Last Updated:</label>
            <input type="date" />
          </div>
          <div className="finish-field">
            <label>Last Updated By:</label>
            <input type="text" value="Officer 916" readOnly />
          </div>
          <div className="finish-field">
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
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Instruction")}
                />{" "}
                Lead Instruction
              </label>

              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Returns")}
                />{" "}
                Lead Returns
              </label>
              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Persons")}
                />{" "}
                Lead Persons
              </label>
              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Vehicles")}
                />{" "}
                Lead Vehicles
              </label>
              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Enclosures")}
                />{" "}
                Lead Enclosures
              </label>
              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Evidences")}
                />{" "}
                Lead Evidences
              </label>
            </div>
            <div className="report-column">
              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Pictures")}
                />{" "}
                Lead Pictures
              </label>
              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Audio Description")}
                />{" "}
                Lead Audio Description
              </label>
              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Videos Description")}
                />{" "}
                Lead Videos Description
              </label>
              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Scratchpad Entries")}
                />{" "}
                Lead Scratchpad Entries
              </label>
              <label>
                <input
                  type="checkbox"
                  name="report"
                  onChange={() => handleReportChange("Lead Timeline Entries")}
                />{" "}
                Lead Timeline Entries
              </label>
            </div>
          </div>
          <div className="destination-options">
            <h4>Destination:</h4>
            <label>
              <input
                type="radio"
                name="destination"
                value="Print"
                className="dest-op-class"
                onChange={handleDestinationChange}
              />{" "}
              Print
            </label>
            <label>
              <input
                type="radio"
                name="destination"
                value="Preview"
                className="dest-op-class"
                onChange={handleDestinationChange}
              />{" "}
              Preview
            </label>
          </div>
        </div>
        </div>
        <Comment/>
        {/* Buttons */}
        <div className="form-buttons-finish">
          <button className="save-btn1" onClick={runReport}>
            Run Report
          </button>
          <button className="save-btn1">
            Submit Report
          </button>
        </div>

        </div>
        </div>

        {/* Conditionally render preview area if "Preview" is selected */}
        {/* {destination === "Preview" && (
          <div className="preview-report">
            {selectedReports.length ? (
              selectedReports.map((report) => (
                <div key={report} className="report-section">
                  <h2>{report}</h2>
                  {report === "Lead Instruction" ? (
                    leadInstructionContent ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: leadInstructionContent }}
                      />
                    ) : (
                      <p>Loading Lead Instruction content...</p>
                    )
                  ) : (
                    <p>Details for {report} ...</p>
                  )}
                </div>
              ))
            ) : (
              <p>No report sections selected.</p>
            )}
          </div>
        )} */}
   

      <FootBar1
        onPrevious={() => navigate(-1)}
        onNext={() =>
          navigate("/casepagemanager", { state: { caseDetails } })
        }
      />
    </div>
    </div>
    </div>
  );
};
