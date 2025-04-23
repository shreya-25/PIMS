import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import FootBar1 from "../../../components/FootBar1/FootBar1";
import "./LRFinish.css";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Comment from "../../../components/Comment/Comment";
import api, { BASE_URL } from "../../../api";


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

  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
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

  // const handleSubmitReport = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  
  //     // Ensure that a lead and case are selected (adjust as needed)
  //     if (!selectedLead || !selectedCase) {
  //       alert("No lead or case selected!");
  //       return;
  //     }
  
  //     // Build the request body for the Lead Return entry.
  //     // Replace the hardcoded values or use state/form values as necessary.
  //     const body = {
  //       leadNo: selectedLead.leadNo,
  //       description: selectedLead.leadName, // You might get this from an input field.
  //       caseNo: selectedCase.caseNo,
  //       caseName: selectedCase.caseName,
  //       submittedDate: new Date(), // Today's date
  //       // The assignedTo object: override its status to "Submitted"
  //       assignedTo: {
  //         assignees: ["Officer 916", "Officer 91"], // Replace with your dynamic data
  //         lRStatus: "Submitted"
  //       },
  //       // The assignedBy object: override its status to "Pending"
  //       assignedBy: {
  //         assignee: "Officer 912", // Replace with your dynamic data
  //         lRStatus: "Pending"
  //       }
  //     };
  
  //     const response = await axios.post(
  //       "http://localhost:5000/api/leadReturn/create",
  //       body,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json"
  //         }
  //       }
  //     );
  
  //     if (response.status === 201) {
  //       alert("Lead Return submitted successfully");
  //       // Optionally, navigate to another page or update your state
  //     } else {
  //       alert("Failed to create Lead Return");
  //     }
  //   } catch (error) {
  //     console.error("Error submitting Lead Return:", error);
  //     alert("Error submitting Lead Return");
  //   }
  // };

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
      const response = await api.post("/api/report/generate", body, {
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
      const response = await api.get("/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedLead.caseNo}/${encodeURIComponent(selectedLead.caseName)}", {
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
</div>


        </div>
        </div>
        <Comment tag= "Finish"/>
        {/* Buttons */}
        <div className="form-buttons-finish">
          <button className="save-btn1" onClick={runReport}>
            Run Report
          </button>
          <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

          className="save-btn1" onClick={handleSubmitReport}>
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
