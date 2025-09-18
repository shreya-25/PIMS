import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../../../components/Navbar/Navbar";
import "./LRScratchpad.css"; // Custom CSS file for Scratchpad styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';




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
  const FORM_KEY = "LRScratchpad:form";
const LIST_KEY = "LRScratchpad:list";
// Narrative Ids from API
const [narrativeIds, setNarrativeIds] = useState([]);

const normalizeId = (id) => String(id ?? "").trim().toUpperCase();
const alphabetToNumber = (str = "") => {
  str = normalizeId(str);
  let n = 0;
  for (let i = 0; i < str.length; i++) n = n * 26 + (str.charCodeAt(i) - 64);
  return n;
};




   const location = useLocation();
       const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);  
    const [leadData, setLeadData] = useState({});
        
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
           const [alertOpen, setAlertOpen] = useState(false);
            const [alertMessage, setAlertMessage] = useState("");

          const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                              const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
                            
                              const onShowCaseSelector = (route) => {
                                navigate(route, { state: { caseDetails } });
                            };
        
const [editingIndex, setEditingIndex] = useState(null);
const isEditing = editingIndex !== null;

useEffect(() => {
  if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;

  const ac = new AbortController();

  (async () => {
    try {
      const token   = localStorage.getItem("token");
      const { leadNo } = selectedLead;
      const { caseNo } = selectedCase;
      const encLead = encodeURIComponent(selectedLead.leadName);
      const encCase = encodeURIComponent(selectedCase.caseName);

      const resp = await api.get(
        `/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: ac.signal }
      );

      // unique, cleaned, non-empty IDs
      const ids = [...new Set((resp?.data || [])
        .map(r => normalizeId(r?.leadReturnId))
        .filter(Boolean))];

      // sort A…Z…AA…AB…
      ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
      setNarrativeIds(ids);

      // if ADDING (not editing) and nothing selected yet, preselect latest
      setNoteData(prev =>
        (!isEditing && !prev.returnId)
          ? { ...prev, returnId: ids.at(-1) || "" }
          : prev
      );
    } catch (err) {
      if (!ac.signal.aborted) console.error("Failed to fetch Narrative Ids:", err);
    }
  })();

  return () => ac.abort();
}, [
  selectedLead?.leadNo,
  selectedLead?.leadName,
  selectedCase?.caseNo,
  selectedCase?.caseName,
  isEditing
]);


   useEffect(() => {
    const fetchLeadData = async () => {
      if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;
      const token = localStorage.getItem("token");

      try {
        const response = await api.get(
          `/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.length > 0) {
          setLeadData({
            ...response.data[0],
            assignedTo: response.data[0].assignedTo || [],
            leadStatus: response.data[0].leadStatus || ''
          });
        }
      } catch (error) {
        console.error("Failed to fetch lead data:", error);
      }
    };

    fetchLeadData();
  }, [selectedLead, selectedCase]);

  // Sample scratchpad data
  const [notes, setNotes] = useState(() => {
   const saved = sessionStorage.getItem(LIST_KEY);
   return saved ? JSON.parse(saved) : [];
 });

  // State to manage form data
 const [noteData, setNoteData] = useState(() => {
   const saved = sessionStorage.getItem(FORM_KEY);
   return saved
     ? JSON.parse(saved)
     : { text: "", returnId: "" };
 });

  const handleInputChange = (field, value) => {
    setNoteData({ ...noteData, [field]: value });
  };

  const handleAddNote = async () => {
    if (!noteData.text) {
       setAlertMessage("Please enter a note.");
                      setAlertOpen(true);
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
      sessionStorage.removeItem(FORM_KEY);
    } catch (err) {
      console.error("Error saving scratchpad note:", err.message);
      setAlertMessage("Failed to save note.");
      setAlertOpen(true);
    }
  };
  

  useEffect(() => {
  sessionStorage.setItem(FORM_KEY, JSON.stringify(noteData));
}, [noteData]);

useEffect(() => {
  sessionStorage.setItem(LIST_KEY, JSON.stringify(notes));
}, [notes]);


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
  
   const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";

  const handleAccessChange = (idx, newAccess) => {
    setNotes(rs => {
      const copy = [...rs];
      copy[idx] = { ...copy[idx], access: newAccess };
      return copy;
    });
  };

  function handleEditClick(idx) {
    const n = notes[idx];
    setEditingIndex(idx);
    setNoteData({
      text: n.text,
      returnId: n.leadReturnId || "",
    });
  }

  async function handleUpdateNote() {
    if (editingIndex === null) return;
    const note = notes[editingIndex];
    const token = localStorage.getItem("token");
    try {
      await api.put(
        `/api/scratchpad/${note._id}`,
        { leadReturnId: noteData.returnId, text: noteData.text, type: "Lead" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchNotes();
      // reset form
      setEditingIndex(null);
      setNoteData({ text: "", returnId: "" });
      sessionStorage.removeItem(FORM_KEY);
    } catch (err) {
      console.error("Update failed", err);
      setAlertMessage("Failed to update note.");
      setAlertOpen(true);
    }
  }

  async function handleDeleteNote(idx) {
    if (!window.confirm("Delete this note?")) return;
    const note = notes[idx];
    const token = localStorage.getItem("token");
    try {
      await api.delete(
        `/api/scratchpad/${note._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes(n => n.filter((_,i) => i !== idx));
    } catch (err) {
      console.error("Delete failed", err);
      setAlertMessage("Failed to delete note.");
      setAlertOpen(true);
    }
  }
  
const { status, isReadOnly } = useLeadStatus({
    caseNo: selectedCase.caseNo,
    caseName: selectedCase.caseName,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
  });
  return (
    <div className="lrscratchpad-container">
      {/* Navbar */}
      <Navbar />
      <AlertModal
                          isOpen={alertOpen}
                          title="Notification"
                          message={alertMessage}
                          onConfirm={() => setAlertOpen(false)}
                          onClose={()   => setAlertOpen(false)}
                        />

      {/* Top Menu */}
      {/* <div className="top-menu">
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
      </div> */}
        <div className="top-menu"   style={{ paddingLeft: '20%' }}>
      <div className="menu-items" >
        <span className="menu-item " onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LeadReview", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } }} > Lead Information</span>
                   <span className="menu-item active" >Add/View Lead Return</span>
                   <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/ChainOfCustody", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                     setAlertMessage("Please select a case and lead first.");
                      setAlertOpen(true);
                  }
                }}>Lead Chain of Custody</span>
          
                  </div>
        {/* <div className="menu-items">
      
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
         </div> */}
       </div>

      <div className="LRI_Content">
      {/* <div className="sideitem">
       <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

       <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>  

                  <li
  className="sidebar-item"
  onClick={() =>
    selectedCase.role === "Investigator"
      ? navigate("/Investigator")
      : navigate("/CasePageManager")
  }
>
Case Page
</li>


            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item active" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
          
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
          
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}

            </ul>
        )}
          <li className="sidebar-item" style={{ fontWeight: 'bold' }} onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Related Tabs {leadDropdownOpen ?  "▲": "▼"}
          </li>
        {leadDropdownOpen && (
          <ul>
              <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
              View Lead Chain of Custody
            </li>
             )}
          </ul>

            )}

                </div> */}
                  <SideBar  activePage="CasePageManager" />
                <div className="left-content">
                <div className="top-menu1" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Narrative
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LRScratchpad')}>
            Notes
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          {/* <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span> */}
         </div> </div>
     
                {/* <div className="caseandleadinfo">
          <h5 className = "side-title">  Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>


          </div> */}
               <div className="caseandleadinfo">
          <h5 className = "side-title"> 
             {/* Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""} */}
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Notes
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
        ? ` Lead Status:  ${status}`
    : ` ${leadStatus}`}
</h5>

          </div>

        {/* Center Section */}
        <div className="case-header">
          <h2 className="">NOTES</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">
        {/* Scratchpad Form */}
        <div className = "timeline-form-sec">
        <div className="scratchpad-form">
            <label>Narrative Id*</label>
             <select
    value={noteData.returnId}
    onChange={(e) => handleInputChange("returnId", e.target.value)}
  >
    <option value="">Select Narrative Id</option>

    {/* Keep current value visible even if it’s not in latest API list (editing/legacy) */}
    {noteData.returnId &&
      !narrativeIds.includes(normalizeId(noteData.returnId)) && (
        <option value={noteData.returnId}>{noteData.returnId}</option>
      )
    }

    {narrativeIds.map(id => (
      <option key={id} value={id}>{id}</option>
    ))}
  </select>
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
        {/* <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

        className="save-btn1" onClick={handleAddNote}>Add Note</button> */}

{editingIndex === null ? (
              <button 
              disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
              onClick={handleAddNote} className="save-btn1">
                Add Note
              </button>
            ) : (
              <>
                <button
                 disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly} 
                onClick={handleUpdateNote} className="save-btn1">
                  Update Note
                </button>
                <button
                 disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
                  onClick={() => {
                    setEditingIndex(null);
                    setNoteData({ text: "", returnId: "" });
                  }}
                  className="save-btn1"
                >
                  Cancel
                </button>
              </>
            )}
        </div>
        </div>

           {/* Scratchpad Table */}
           <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Narrative Id </th>
              <th>Entered By</th>
              <th>Text</th>
              <th>Actions</th>
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
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditClick(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDeleteNote(index)}
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
            No Notes Added
          </td>
        </tr>
      )}
          </tbody>
        </table>

        
         {/* {selectedLead?.leadStatus !== "Completed" && !isCaseManager && (
  <div className="form-buttons-finish">
    <h4> Click here to submit the lead</h4>
    <button
      disabled={selectedLead?.leadStatus === "In Review"}
      className="save-btn1"
      onClick={handleSubmitReport}
    >
      Submit 
    </button>
  </div>
)} */}
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
