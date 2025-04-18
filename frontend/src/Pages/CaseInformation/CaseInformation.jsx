import React, { useContext, useState, useEffect} from 'react';
import axios from "axios";
import Navbar from '../../components/Navbar/Navbar';
import { useLocation, useNavigate } from 'react-router-dom';
import './CaseInformation.css'; // Custom CSS
import { CaseContext } from "../CaseContext";


export const CaseInformation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { caseDetails } = location.state || {};

    const { selectedCase } = useContext(CaseContext);
    
    
    const handleHomeClick = () => {
      navigate("/Homepage"); // Replace "/" with the actual home page route if different
    };

    // Example state fields mirroring the police report sections
    const [recentType, setRecentType] = useState('');
    const [reportDateAndTime, setReportDateAndTime] = useState('');
    const [dateTimeFrom, setDateTimeFrom] = useState('');
    const [dateTimeTo, setDateTimeTo] = useState('');
    const [recentLocation, setRecentLocation] = useState('');

    // Offenses can be an array if you want multiple offenses
    const [offenses, setOffenses] = useState([
      { statute: '', desc: '', attemptCommit: '', counts: '' },
    ]);

    // You can allow multiple Subjects; for demonstration, we'll set 3
    const [subjects, setSubjects] = useState([
      {
        name: '',
        isVictimAlsoComplainant: false,
        address: '',
        phone1: '',
        phone2: '',
        phone3: '',
        dob: '',
        age: '',
        sex: '',
        race: '',
        ethnicity: '',
        height: '',
        weight: '',
        hairColor: '',
        eyeColor: '',
        glasses: '',
        alias: '',
        scarsMarksTattoos: '',
        schoolEmployerNameAndAddress: '',
        schoolEmployerPhone: ''
      },
     
    ]);

    const [caseStatus, setCaseStatus] = useState('');
    const [exceptionalClearance, setExceptionalClearance] = useState('');
    const [reportingOfficer, setReportingOfficer] = useState('Lane, Dale 467');
    const [reportDate, setReportDate] = useState('');
    const [reviewedBy, setReviewedBy] = useState('');
    const [reviewedDate, setReviewedDate] = useState('');

    // Example summary handling (like your existing code):
    const defaultCaseSummary = "Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.";
  

    const handleSaveClick = () => {
      // Save logic or API call can go here

      if (inputMethod === 'upload' && uploadedFile) {
        // Process the uploaded document
        console.log('File to be processed:', uploadedFile);
      } else {
        // Process the typed executive summary
        console.log('Executive Summary:', execCaseSummary);
      }
      console.log("Saved report fields:", {
        recentType,
        reportDateAndTime,
        dateTimeFrom,
        dateTimeTo,
        recentLocation,
        offenses,
        subjects,
        caseStatus,
        exceptionalClearance,
        reportingOfficer,
        reportDate,
        reviewedBy,
        reviewedDate,
        caseSummary
      });
      alert("Report Saved!");
    };

    // Helper to handle changes for multiple offense rows
    const handleOffenseChange = (index, field, value) => {
      const updatedOffenses = [...offenses];
      updatedOffenses[index][field] = value;
      setOffenses(updatedOffenses);
    };

    // Helper to handle changes for multiple subjects
    const handleSubjectChange = (index, field, value) => {
      const updatedSubjects = [...subjects];
      updatedSubjects[index][field] = value;
      setSubjects(updatedSubjects);
    };

    // Collapsible sections states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOffensesOpen, setIsOffensesOpen] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false);
  const [isDOpen, setIsDOpen] = useState(false);

  const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  
  const onShowCaseSelector = (route) => {
    navigate(route, { state: { caseDetails } });
  };

  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};

  // New: Reject click handler that calls your backend endpoint with token
  const handleRejectClick = async () => {
    // Ensure that we have a valid case number from caseDetails
    // if (!caseDetails || !caseDetails.caseNo) {
    //   alert("Case number not found!");
    //   return;
    // }
    
    try {
      // Retrieve token from localStorage (or any other storage method you're using)
      const token = localStorage.getItem('token');

      // Call the backend endpoint using the case number and include the token in the headers.
      const response = await fetch(`http://localhost:5000/api/cases/1001/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error rejecting case:", result);
        alert("Error rejecting case: " + result.message);
      } else {
        alert("Case rejected. Case Manager changed to 'Admin'.");
        console.log("Updated case details:", result.data);
        // Optionally update local state or navigate to a different page
      }
    } catch (error) {
      console.error("Error in handleRejectClick:", error);
      alert("An error occurred while rejecting the case.");
    }
  };

  const [caseSummary, setCaseSummary] = useState('' ||  defaultCaseSummary);
  const [execCaseSummary, setExecCaseSummary] = useState('');
  const [inputMethod, setInputMethod] = useState('direct'); // 'direct' or 'upload'
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = (e) => {
    // Handle the file upload logic here
    setUploadedFile(e.target.files[0]);
  }

  const [isEditing, setIsEditing] = useState(false); // Controls whether the textarea is editable
  useEffect(() => {
   const fetchCaseSummary = async () => {
     try {
       if (caseDetails && caseDetails.id) {
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
 }, [caseDetails]);



    return (
      <div className="case-page-manager">
        {/* Navbar */}
        <Navbar />

        <div className="main-container">
        <div className="sideitem">
          <ul className="sidebar-list">

          <li className="sidebar-item active">Case Information</li>
          <li className="sidebar-item" onClick={() => navigate(getCasePageRoute())}>Case Page</li>
          <li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>
              New Lead
            </li>                       {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>New Lead</li> */}
                       <li className="sidebar-item" onClick={() => navigate('/SearchLead')}>Search Lead</li>
                       <li className="sidebar-item " >View Lead Return</li>
                       <li className="sidebar-item"onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>View Lead Chain of Custody</li>
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
        </div>

          {/* Main Content: Replicate the Police Report Fields */}
          <div className="left-content">
            <div className="case-header">
            {
                        <h1>
                          Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName.toUpperCase() || "Unknown Case"}
                        </h1>
                    }
            </div>

            {/* Detail Section */}
             {/* Case Summary (existing logic) */}
             <div className="case-summary">
              <label className="input-label">Case Summary</label>
              <textarea
                className="textarea-field"
                value={caseSummary}
                onChange={(e) => setCaseSummary(e.target.value)}
              />

               {/* Save Button */}
             <button className="save-btn1" onClick={handleSaveClick}>
              Save
            </button>
            </div>

            <div className="case-summary">
      <label className="input-label1">Start Executive Case Summary</label>
      <div>
        <label>
          <input
            type="radio"
            value="upload"
            checked={inputMethod === 'upload'}
            onChange={() => setInputMethod('upload')}
          />
          Upload Document
        </label>
        <label>
          <input
            type="radio"
            value="direct"
            checked={inputMethod === 'direct'}
            onChange={() => setInputMethod('direct')}
          />
          Write Directly
        </label>
      </div>

      {inputMethod === 'upload' ? (
        <input type="file" onChange={handleFileUpload} />
      ) : (
        <textarea
          className="textarea-field"
          value={execCaseSummary}
          onChange={(e) => setExecCaseSummary(e.target.value)}
        />
      )}

      <button className="save-btn1" onClick={handleSaveClick}>
        Save
      </button>
    </div>
           
        
        </div>
     </div>
     </div>
    );
};
