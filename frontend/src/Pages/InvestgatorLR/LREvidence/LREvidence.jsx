import Navbar from '../../../components/Navbar/Navbar';
import "./LREvidence.css"; // Custom CSS file for Evidence styling
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Comment from "../../../components/Comment/Comment";
import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";


export const LREvidence = () => {
    useEffect(() => {
        // Apply style when component mounts
        document.body.style.overflow = "hidden";
    
        return () => {
          // Reset to default when component unmounts
          document.body.style.overflow = "auto";
        };
      }, []);
  const navigate = useNavigate(); // Initialize navigate hook
  const location = useLocation();
  const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");
      const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);  
  
  
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
  // const [evidence, setEvidence] = useState([
  //   {
  //     dateEntered: "12/01/2024",
  //     returnId:1,
  //     type: "Physical",
  //     collectionDate: "12/01/2024",
  //     disposedDate: "12/03/2024",
  //     disposition: "Stored",
  //   },
  //   {
  //     dateEntered: "12/02/2024",
  //     returnId:2,
  //     type: "Digital",
  //     collectionDate: "12/02/2024",
  //     disposedDate: "12/04/2024",
  //     disposition: "Archived",
  //   },
  // ]);

  const [evidences, setEvidences] = useState([
    // {
    //   dateEntered: "",
    //   returnId:'',
    //   type: "",
    //   collectionDate: "",
    //   disposedDate: "",
    //   disposition: "",
    // }
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

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

   // Save Enclosure: Build FormData and post to backend including token from localStorage.
  const handleSaveEvidence = async () => {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
      console.log("file", file);
    }

    // Append other required fields
    formData.append("leadNo", selectedLead.leadNo); // Example value; update as needed
    formData.append("description", selectedLead.leadName);
    formData.append("enteredBy", localStorage.getItem("loggedInUser"));
    formData.append("caseName", selectedLead.caseName);
    formData.append("caseNo", selectedLead.caseNo);
    formData.append("leadReturnId", evidenceData.leadReturnId); // Example value; update as needed
    formData.append("enteredDate", new Date().toISOString());
    formData.append("type", evidenceData.type);
    formData.append("envidenceDescription", evidenceData.evidence);
    formData.append("collectionDate", evidenceData.collectionDate);
    formData.append("disposedDate", evidenceData.disposedDate);
    formData.append("disposition", evidenceData.disposition);

    // Retrieve token from localStorage
    const token = localStorage.getItem("token");
    console.log(token);
    for (const [key, value] of formData.entries()) {
      console.log(`FormData - ${key}:`, value);
    }
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/lrevidence/upload",
        formData,
        { 
          headers: { 
            // "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`  // Add token here
          } 
        }
      );
      console.log("Evidence saved:", response.data);
      // Optionally update local state with the new enclosure
      setEvidences([...evidences, response.data.evidences]);

      // Clear form fields if needed
      setEvidenceData({ type: "", evidences: "" });
      setFile(null);
    } catch (error) {
      console.error("Error saving evidence:", error);
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
      const res = await axios.get(
        `http://localhost:5000/api/lrevidence/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const mappedEvidences = res.data.map((enc) => ({
        dateEntered: formatDate(enc.enteredDate),
        type: enc.type,
        enclosure: enc.enclosureDescription,
        returnId: enc.leadReturnId,
        originalName: enc.originalName,
        collectionDate: formatDate(enc.collectionDate),
        disposedDate: formatDate(enc.disposedDate),
        disposition: enc.disposition
      }));
  
      setEvidences(mappedEvidences);
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
  

  return (
    <div className="lrevidence-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
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
        <div className = "timeline-form-sec">
        <h4 className="evidence-form-h4">Enter Evidence Details</h4>
        <div className="evidence-form">
          <div className="form-row-evidence">
            <label  className="evidence-head">Collection Date:</label>
            <input
              type="date"
              value={evidenceData.collectionDate}
             
              onChange={(e) => handleInputChange("collectionDate", e.target.value)}
            />
            <label className="evidence-head">Disposed Date:</label>
            <input
              type="date"
              value={evidenceData.disposedDate}
            
              onChange={(e) => handleInputChange("disposedDate", e.target.value)}
            />
            <label className="evidence-head">Return Id:</label>
            <input
              type="leadReturnId"
              value={evidenceData.leadReturnId}
            
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label className="evidence-head">Type:</label>
            <input
              type="text"
              value={evidenceData.type}
            
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
          <div className="form-row-evidence">
            <label>Upload File:</label>
            <input type="file" onChange={handleFileChange} />
          </div>
        </div>
        </div>
        <div className="form-buttons">
          <button className="save-btn1" onClick={handleSaveEvidence}>Add Evidence</button>
        </div>  

            {/* Evidence Table */}
            <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th style={{ width: "10%" }}> Return Id </th>
              <th>Type</th>
              <th>Collection Date</th>
              <th>Disposed Date</th>
              <th>Disposition</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {evidences.map((item, index) => (
              <tr key={index}>
                <td>{item.dateEntered}</td>
                <td> {item.returnId} </td>
                <td>{item.type}</td>
                <td>{item.collectionDate}</td>
                <td>{item.disposedDate}</td>
                <td>{item.disposition}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  // onClick={() => handleEditReturn(ret)}
                />
                  </button>
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  // onClick={() => handleDeleteReturn(ret.id)}
                />
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Comment/>
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
