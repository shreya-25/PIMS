import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../../../components/Navbar/Navbar";
import "./LRScratchpad.css"; // Custom CSS file for Scratchpad styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";



export const LRScratchpad = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
  const navigate = useNavigate();
   const location = useLocation();
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

          const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                              const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
                            
                              const onShowCaseSelector = (route) => {
                                navigate(route, { state: { caseDetails } });
                            };
        

  // Sample scratchpad data
  const [notes, setNotes] = useState([
  ]);

  // State to manage form data
  const [noteData, setNoteData] = useState({
    text: "",
    returnId: "",
  });

  const handleInputChange = (field, value) => {
    setNoteData({ ...noteData, [field]: value });
  };

  const handleAddNote = async () => {
    if (!noteData.text) {
      alert("Please enter a note.");
      return;
    }
  
    const newNote = {
      leadNo: selectedLead?.leadNo,
      description: selectedLead?.leadName,
      assignedTo: {},
      assignedBy: {}, 
      enteredBy: localStorage.getItem("loggedInUser"),
      caseName: selectedCase?.caseName,
      caseNo: selectedCase?.caseNo,
      leadReturnId: noteData.returnId, // Default or fetched
      enteredDate: new Date().toISOString(),
      text: noteData.text,
      type: "Lead"
    };
  
    const token = localStorage.getItem("token");
  
    try {
      const res = await api.post("/api/scratchpad/create", newNote, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setNotes((prev) => [
        ...prev,
        {
          ...res.data,
          dateEntered: formatDate(res.data.enteredDate),
          returnId: res.data.leadReturnId,
        },
      ]);
  
      setNoteData({ text: "" });
    } catch (err) {
      console.error("Error saving scratchpad note:", err.message);
      alert("Failed to save note.");
    }
  };
  

  const handleNavigation = (route) => {
    navigate(route);
  };

  const fetchNotes = async () => {
    const token = localStorage.getItem("token");
  
    const leadNo = selectedLead?.leadNo;
    const leadName = encodeURIComponent(selectedLead?.leadName);
    const caseNo = selectedCase?.caseNo;
    const caseName = encodeURIComponent(selectedCase?.caseName);
  
    try {
      const res = await api.get(
        `/api/scratchpad/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
    
      const formatted = res.data
      .filter((note) => note.type === "Lead") // ✅ Filter by type === 'Lead'
      .map((note) => ({
        ...note,
        dateEntered: formatDate(note.enteredDate),
        returnId: note.leadReturnId,
      }));
    const withAccess = formatted.map(r => ({
      ...r,
      access: r.access ?? "Everyone"
    }));

    setNotes(formatted);

    } catch (error) {
      console.error("Error fetching scratchpad notes:", error);
    }
  };
  
  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchNotes();
    }
  }, [selectedLead, selectedCase]);
  
  const isCaseManager = selectedCase?.role === "Case Manager";

  const handleAccessChange = (idx, newAccess) => {
    setNotes(rs => {
      const copy = [...rs];
      copy[idx] = { ...copy[idx], access: newAccess };
      return copy;
    });
  };
  

  return (
    <div className="lrscratchpad-container">
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
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideo")}>Videos</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
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
     


        {/* Center Section */}
        <div className="case-header">
          <h2 className="">NOTES</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">
        {/* Scratchpad Form */}
        <div className = "timeline-form-sec">
        <div className="scratchpad-form">
            <label>Return Id*</label>
            <input
              type="returnId"
              value={noteData.returnId}
              onChange={(e) => handleInputChange("returnId", e.target.value)}
            />
          </div>
        <h4 className="evidence-form-h4">Add New Note*</h4>
        <div className="scratchpad-form">
          <textarea
            value={noteData.text}
            onChange={(e) => handleInputChange("text", e.target.value)}
            placeholder="Write your note here"
          ></textarea>
        </div>
        <div className="form-buttons-scratchpad">
        <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

        className="save-btn1" onClick={handleAddNote}>Add Note</button>
        </div>
        </div>

           {/* Scratchpad Table */}
           <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Return Id </th>
              <th>Entered By</th>
              <th>Text</th>
              <th></th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {notes.length > 0 ? notes.map((note, index) => (
              <tr key={index}>
                <td>{note.dateEntered}</td>
                <td> {note.returnId} </td>
                <td>{note.enteredBy}</td>
                <td>{note.text}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  // onClick={() => handleEditReturn(ret)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  // onClick={() => handleDeleteReturn(ret.id)}
                />
                  </button>
                  </div>
                </td>
            
                {isCaseManager && (
          <td>
            <select
              value={note.access}
              onChange={e => handleAccessChange(index, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Case Manager Only</option>
            </select>
          </td>
        )}
      </tr>
       )) : (
        <tr>
          <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign:'center' }}>
            No Returns Available
          </td>
        </tr>
      )}
          </tbody>
        </table>
        <Comment tag= "Scratchpad"/>

</div>

        {/* Action Buttons */}
        {/* <div className="form-buttons-scratchpad">
          <button className="add-btn" onClick={handleAddNote}>Add Note</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRVideos")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRFinish")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
      </div>

      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRTimeline")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
