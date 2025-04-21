import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../../../components/Navbar/Navbar";
import "./CMScratchpad.css"; // Custom CSS file for Scratchpad styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";



export const CMScratchpad = () => {
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
      
        const { leadDetails, caseDetails } = location.state || {};
      
        const getCasePageRoute = () => {
          if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
          return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
      };

        const { selectedCase, selectedLead, leadInstructions, leadReturns} = useContext(CaseContext);
      

  // Sample scratchpad data
  const [notes, setNotes] = useState([
    // {
    //   dateEntered: "12/01/2024",
    //   enteredBy: "John Smith",
    //   text: "Initial observations of the case.",
    // },
    // {
    //   dateEntered: "12/02/2024",
    //   enteredBy: "Jane Doe",
    //   text: "Follow-up notes on interviews conducted.",
    // },
  ]);

  // State to manage form data
  const [noteData, setNoteData] = useState({
    text: "",
  });

  const handleInputChange = (field, value) => {
    setNoteData({ ...noteData, [field]: value });
  };

  const handleAddNote = () => {
    const newNote = {
      dateEntered: new Date().toLocaleDateString(),
      enteredBy: "John Smith", // Replace with actual user
      text: noteData.text,
    };

    // Add new note to the list
    setNotes([...notes, newNote]);

    // Clear form fields
    setNoteData({
      text: "",
    });
  };

  // Fetch enclosures from backend when component mounts or when selectedLead/selectedCase update
  useEffect(() => {
    const fetchNotes = async () => {
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

      const url = `/api/scratchpad/${leadNo}/${leadName}/${caseNo}/${caseName}`;
      try {
        const response = await api.get(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("Fetched Notes:", response.data);
        setNotes(response.data);
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    };

    fetchNotes();
  }, [selectedLead, selectedCase]);


  const handleNavigation = (route) => {
    navigate(route);
  };
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
                  
                    const onShowCaseSelector = (route) => {
                      navigate(route, { state: { caseDetails } });
                  };

  return (
    <div className="lrscratchpad-container">
      {/* Navbar */}
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
          <span className="menu-item active" onClick={() => handleNavigation("/CMScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/CMTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/CMFinish")}>Finish</span>
        </div>
      </div>
      <div className="LRI_Content">
      <div className="sideitem">
       <ul className="sidebar-list">
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
         </ul>
                </div>
                <div className="left-content">
     


        {/* Center Section */}
        <div className="case-header">
          <h2 className="">SCRATCHPAD INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

      {/* <div className = "content-to-add">
          <h4 className="evidence-form-h4">Add New Note</h4>
        <div className="scratchpad-form">
          <textarea
            value={noteData.text}
            onChange={(e) => handleInputChange("text", e.target.value)}
            placeholder="Write your note here"
          ></textarea>
        </div>
        </div> */}

        {/* Scratchpad Table */}
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Date Entered</th>
              <th style={{ width: "10%" }}>Return ID</th>
              <th style={{ width: "11%" }}>Entered By</th>
              <th>Text</th>
              <th style={{ width: "15%" }}>Access</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note, index) => (
              <tr key={index}>
                <td>{formatDate(note.enteredDate)}</td>
                <td>{note.leadReturnId}</td>
                <td>{note.enteredBy}</td>
                <td>{note.text}</td>
                <td>
        <select
          value={ "Case Manager"}
           // Pass index properly
        >
          <option value="Case Manager">Case Manager</option>
          <option value="Everyone">Everyone</option>
        </select>
      </td>         
              </tr>
            ))}
          </tbody>
        </table>

        <Comment/>

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
