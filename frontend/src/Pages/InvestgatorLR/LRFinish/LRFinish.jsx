import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import FootBar from "../../../components/FootBar/FootBar";
import "./LRFinish.css";
import axios from "axios";
import { CaseContext } from "../../CaseContext";



export const LRFinish = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { caseDetails } = location.state || {};

  const [selectedReports, setSelectedReports] = useState([]);
  const [destination, setDestination] = useState("");
  const [leadInstructionContent, setLeadInstructionContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);
      
  

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

      {/* Main Content */}
      <div className="main-contentLRF">
        <div className="main-content-cl">
          {/* Left Section */}
          <div className="left-section">
            <img
              src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
              alt="Police Department Logo"
              className="police-logo-lr"
            />
          </div>

          {/* Center Section */}
          <div className="center-section">
            <h2 className="title">FINISH</h2>
          </div>

          {/* Right Section */}
          <div className="right-section"></div>
        </div>

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

        {/* Buttons */}
        <div className="form-buttons-finish">
          <button className="save-btn1" onClick={runReport}>
            Run Report
          </button>
          <button className="save-btn1">
            Submit Report
          </button>
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
      </div>

      <FootBar
        onPrevious={() => navigate(-1)}
        onNext={() =>
          navigate("/casepagemanager", { state: { caseDetails } })
        }
      />
    </div>
  );
};
