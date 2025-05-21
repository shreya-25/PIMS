import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from '../../../components/Navbar/Navbar';
import './LRTimeline.css';
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";




export const LRTimeline = () => {
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
   const [leadData, setLeadData] = useState({});
   const { selectedCase, selectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);
   const [entries, setEntries] = useState([]);
        
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
        
  
    const handleNavigation = (route) => {
      navigate(route); // Navigate to the respective page
    };
  
  const [timelineEntries, setTimelineEntries] = useState([
    // {
    //   date: '01/01/2024',
    //   returnId:1,
    //   timeRange: '10:30 AM - 12:00 PM',
    //   location: '123 Main St, NY',
    //   description: 'Suspect spotted leaving crime scene',
    //   flags: ['High Priority'],
    // },
    // {
    //   date: '01/05/2024',
    //   returnId:2,
    //   timeRange: '2:00 PM - 3:30 PM',
    //   location: '456 Elm St, CA',
    //   description: 'Suspect was going to the airport',
    //   flags: [],
    // },
  ]);

  const [newEntry, setNewEntry] = useState({
    date: '',
    leadReturnId: '',
    eventStartDate: '',
    eventEndDate: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    flag: ''
  });

  const [timelineFlags, setTimelineFlags] = useState([
    'High Priority',
    'Investigation',
    'Evidence Collected',
  ]);

  const [newFlag, setNewFlag] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  const handleInputChange = (field, value) => {
    setNewEntry({ ...newEntry, [field]: value });
  };

  async function fetchTimelineEntries() {
    const token = localStorage.getItem("token");
    const url = `/api/timeline/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`;
    try {
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setTimelineEntries(res.data.map(e => ({
        id: e._id,
        rawEventDate: e.eventDate,
        rawStartDate: e.eventStartDate,
        rawEndDate: e.eventEndDate,
        rawStartTime: e.eventStartTime,
        rawEndTime: e.eventEndTime,
        leadReturnId: e.leadReturnId,
        eventLocation: e.eventLocation,
        eventDescription: e.eventDescription,
        flags: e.timelineFlag || [],
        access: e.access || "Everyone",
        // for display:
        date: formatDate(e.eventDate),
        timeRange: formatTimeRangeNY(e.eventStartTime, e.eventEndTime),
        location: e.eventLocation,
        description: e.eventDescription,
      })));
    } catch (err) {
      console.error("Error fetching timeline entries:", err);
    }
  }
  
  const handleChange = (field, val) => {
    setNewEntry(ne => ({ ...ne, [field]: val }));
  };


  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchTimelineEntries();
    }
  }, [selectedLead, selectedCase]);
  
  const formatTimeRangeNY = (startTime, endTime) => {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/New_York",
    };
  
    const start = new Date(startTime).toLocaleTimeString("en-US", options);
    const end = new Date(endTime).toLocaleTimeString("en-US", options);
  
    return `${start} - ${end}`;
  };
  
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
          assignees: leadData.assignedTo || [],
          lRStatus: "Submitted"
        },
        assignedBy: {
          assignee: localStorage.getItem("officerName") || "Unknown Officer",
          lRStatus: "Pending"
        }
      };

      const response = await api.post("/api/leadReturn/create", body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 201) {
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
          setLeadStatus("In Review");
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


  const handleAddEntry = async () => {
    if (!newEntry.date || !newEntry.eventStartDate || !newEntry.eventEndDate ||  !newEntry.startTime || !newEntry.endTime || !newEntry.location || !newEntry.description) {
      alert("Please fill in all required fields.");
      return;
    }
  
    const token = localStorage.getItem("token");
  
    const payload = {
      leadNo: selectedLead?.leadNo,
      description: selectedLead?.leadName,
      assignedTo: selectedLead?.assignedTo || {},
      assignedBy: selectedLead?.assignedBy || {},
      enteredBy: localStorage.getItem("loggedInUser"),
      caseName: selectedCase?.caseName,
      caseNo: selectedCase?.caseNo,
      leadReturnId: newEntry.leadReturnId,
      enteredDate: new Date().toISOString(),
      eventDate: newEntry.date,
      eventStartDate: newEntry.eventStartDate,
      eventEndDate: newEntry.eventEndDate,
      eventStartTime: combineDateTime(newEntry.date, newEntry.startTime),
      eventEndTime: combineDateTime(newEntry.date, newEntry.endTime),
      eventLocation: newEntry.location,
      eventDescription: newEntry.description,
      timelineFlag: newEntry.flag ? [newEntry.flag] : [],
    };
  
    try {
      const res = await api.post("/api/timeline/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const saved = res.data.timeline;
      setTimelineEntries((prev) => [
        ...prev,
        {
          date: formatDate(saved.eventDate),
          returnId: saved.leadReturnId,
          timeRange: formatTimeRangeNY(saved.eventStartTime, saved.eventEndTime),
          location: saved.eventLocation,
          description: saved.eventDescription,
          flags: saved.timelineFlag || [],
        },
      ]);
  
      // Reset form
      setNewEntry({
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        description: "",
        flag: "",
      });
    } catch (err) {
      console.error("Error saving timeline entry:", err);
      alert("Failed to add timeline entry.");
    }
  };
  

  const handleDeleteEntry = (index) => {
    const updatedEntries = timelineEntries.filter((_, i) => i !== index);
    setTimelineEntries(updatedEntries);
  };
  const combineDateTime = (dateStr, timeStr) => {
    return new Date(`${dateStr}T${timeStr}`);
  };

  const handleEditEntry = (index) => {
    const entryToEdit = timelineEntries[index];
    setNewEntry({
      date: entryToEdit.date,
      startTime: entryToEdit.timeRange.split(' - ')[0],
      endTime: entryToEdit.timeRange.split(' - ')[1],
      location: entryToEdit.location,
      description: entryToEdit.description,
      flag: entryToEdit.flags[0] || ''
    });
    handleDeleteEntry(index);
  };

  const handleAddFlag = () => {
    if (newFlag && !timelineFlags.includes(newFlag)) {
      setTimelineFlags([...timelineFlags, newFlag]);
      setNewFlag('');
    }
  };

     const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                      const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
                    
                      const onShowCaseSelector = (route) => {
                        navigate(route, { state: { caseDetails } });
                    };
    const isCaseManager = selectedCase?.role === "Case Manager";

    // handler to change access per row
const handleAccessChange = (idx, newAccess) => {
  setTimelineEntries(rs => {
    const copy = [...rs];
    copy[idx] = { ...copy[idx], access: newAccess };
    return copy;
  });
};

async function handleSubmit() {
  const {
    date, leadReturnId, eventStartDate, eventEndDate,
    startTime, endTime, location, description, flag
  } = newEntry;
  if (!date || !eventStartDate || !eventEndDate || !startTime || !endTime || !location || !description) {
    return alert("Please fill in all required fields.");
  }
  const token = localStorage.getItem("token");
  const payload = {
    leadNo: selectedLead.leadNo,
    description: selectedLead.leadName,
    assignedTo: selectedLead.assignedTo || {},
    assignedBy: selectedLead.assignedBy || {},
    enteredBy: localStorage.getItem("loggedInUser"),
    caseName: selectedCase.caseName,
    caseNo: selectedCase.caseNo,
    leadReturnId,
    enteredDate: new Date().toISOString(),
    eventDate: date,
    eventStartDate,
    eventEndDate,
    eventStartTime: combineDateTime(date, startTime),
    eventEndTime: combineDateTime(date, endTime),
    eventLocation: location,
    eventDescription: description,
    timelineFlag: flag ? [flag] : [],
  };

  try {
    if (editingIndex === null) {
      // CREATE
      await api.post("/api/timeline/create", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      // UPDATE
      const e = timelineEntries[editingIndex];
      await api.put(`/api/timeline/${e.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    // refresh, reset form
    await fetchTimelineEntries();
    setEditingIndex(null);
    setNewEntry({
      date: '', leadReturnId:'', eventStartDate:'', eventEndDate:'',
      startTime:'', endTime:'', location:'', description:'', flag:''
    });
  } catch (err) {
    console.error(err);
    alert(`Failed to ${editingIndex===null? 'add':'update'} entry`);
  }
}

// Delete
async function handleDelete(idx) {
  if (!window.confirm("Delete this entry?")) return;
  const token = localStorage.getItem("token");
  const e = timelineEntries[idx];
  try {
    await api.delete(`/api/timeline/${e.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTimelineEntries(te => te.filter((_,i)=>i!==idx));
  } catch (err) {
    console.error(err);
    alert("Failed to delete entry");
  }
}

// Prefill form for edit
function handleEdit(idx) {
  const e = timelineEntries[idx];
  setEditingIndex(idx);
  setNewEntry({
    date:   new Date(e.rawEventDate).toISOString().slice(0,10),
    leadReturnId: e.leadReturnId,
    eventStartDate: new Date(e.rawStartDate).toISOString().slice(0,10),
    eventEndDate:   new Date(e.rawEndDate).toISOString().slice(0,10),
    startTime:      new Date(e.rawStartTime).toISOString().substr(11,5),
    endTime:        new Date(e.rawEndTime).toISOString().substr(11,5),
    location: e.eventLocation,
    description: e.eventDescription,
    flag: e.flags[0] || ''
  });
}


  return (
    <div className="timeline-container">
      <Navbar />

      {/* <div className="top-menu">
        <div className="menu-items">
          {[
            'Instructions', 'Returns', 'Person', 'Vehicles', 'Enclosures', 'Evidence',
            'Pictures', 'Audio', 'Videos', 'Scratchpad', 'Timeline', 'Finish'
          ].map((item, index) => (
            <span
              key={index}
              className={`menu-item ${item === 'Timeline' ? 'active' : ''}`}
              onClick={() => navigate(`/LR${item}`)}
            >
              {item}
            </span>
          ))}
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
                    alert("Please select a case and lead first.");
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
                <div className="top-menu" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Returns
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
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRScratchpad')}>
            Notes
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> </div>
                <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>



          </div>

        <div className="case-header">
          <h2 className="">TIMELINE INFORMATION</h2>
        </div>
        <div className = "LRI-content-section">

<div className = "content-subsection">

        <div className="timeline-form-sec">
          <h3>Add/Edit Entry</h3>
          <div className="timeline-form">
            <label>Date *</label>
            <input
              type="date"
              value={newEntry.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
            <label>Lead Return Id *</label>
            <input
              type="text"
              value={newEntry.leadReturnId}
              onChange={(e) => handleInputChange('leadReturnId', e.target.value)}
            />
             <label> Event Start Date *</label>
            <input
              type="date"
              value={newEntry.eventStartDate}
              onChange={(e) => handleInputChange('eventStartDate', e.target.value)}
            />
            <label> Event End Date *</label>
            <input
              type="date"
              value={newEntry.eventEndDate}
              onChange={(e) => handleInputChange('eventEndDate', e.target.value)}
            />
            <label>Start Time *</label>
            <input
              type="time"
              value={newEntry.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
            />
            <label>End Time *</label>
            <input
              type="time"
              value={newEntry.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
            />
            <label>Location *</label>
            <input
              type="text"
              value={newEntry.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
            <label>Description *</label>
            <textarea
              rows="3"
              value={newEntry.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            ></textarea>

            <label>Assign Flag</label>
            <select value={newEntry.flag} onChange={(e) => handleInputChange('flag', e.target.value)}>
              <option value="">Select Flag</option>
              {timelineFlags.map((flag, index) => (
                <option key={index} value={flag}>{flag}</option>
              ))}
            </select>

            <div className="add-flag">
              <input
                type="text"
                placeholder="Create new flag"
                value={newFlag}
                onChange={(e) => setNewFlag(e.target.value)}
              />
              <button className="customer-btn" onClick={handleAddFlag}>Add Flag</button>
            </div>

            <button
                disabled={selectedLead?.leadStatus==="In Review"||selectedLead?.leadStatus==="Completed"}
                className="customer-btn"
                onClick={handleSubmit}>
                {editingIndex===null ? "Add Entry" : "Update Entry"}
              </button>
              {editingIndex!==null && (
                <button
                  className="customer-btn"
                  onClick={()=>{
                    setEditingIndex(null);
                    setNewEntry({
                      date:'',leadReturnId:'',eventStartDate:'',
                      eventEndDate:'',startTime:'',endTime:'',
                      location:'',description:'',flag:''
                    });
                  }}>
                  Cancel
                </button>
              )}
          </div>
        </div>

          <table  className="leads-table">
            <thead>
              <tr>
                <th style={{ width: "10%" }} >Event Date</th>
                <th style={{ width: "10%" }}> Return Id </th>
                <th style={{ width: "15%" }}>Event Time Range</th>
                <th style={{ width: "15%" }}>Event Location</th>
                <th >Event Description</th>
                <th style={{ width: "13%" }}></th>
                {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
              </tr>
            </thead>
            <tbody>
              {timelineEntries.length > 0 ? (
                timelineEntries.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.date}</td>
                    <td>{entry.leadReturnId}</td>
                    <td>{entry.timeRange}</td>
                    <td>{entry.location}</td>
                    <td>{entry.description}</td>
                    {/* <td>
                      <button className="btn-edit" onClick={() => handleEditEntry(index)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDeleteEntry(index)}>Delete</button>
                    </td> */}
                    <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEdit(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDelete(index)}
                />
                  </button>
                  </div>
                </td>
              
                {isCaseManager && (
          <td>
            <select
              value={entry.access}
              onChange={e => handleAccessChange(index, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Case Manager Only</option>
            </select>
          </td>
        )}
      </tr>
       ))) : (
        <tr>
          <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign:'center' }}>
            No Timeline Entry Available
          </td>
        </tr>
      )}
            </tbody>
          </table>

                  {selectedLead?.leadStatus !== "Completed" && !isCaseManager && (
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
)}

          <Comment tag= "Timeline"/>
        </div>
        </div>
      {/* <div className="form-buttons-timeline">
          <button className="back-btn" onClick={() => handleNavigation("/LRScratchpad")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRFinish")}>Next</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}

        <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRFinish")} // Takes user to CM Return page
      />
        
    </div>
    </div>
    </div>
  );
};
