import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from '../../../components/Navbar/Navbar';
import './LRTimeline.css';
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";


export const LRTimeline = () => {
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
   const { selectedCase, selectedLead } = useContext(CaseContext);
        
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
    flag: '',
  });

  const [timelineFlags, setTimelineFlags] = useState([
    'High Priority',
    'Investigation',
    'Evidence Collected',
  ]);

  const [newFlag, setNewFlag] = useState('');

  const handleInputChange = (field, value) => {
    setNewEntry({ ...newEntry, [field]: value });
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
  
  const fetchTimelineEntries = async () => {
    const token = localStorage.getItem("token");
  
    try {
      const res = await axios.get(
        `http://localhost:5000/api/timeline/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("response:", res);
  
      const mapped = res.data.map((entry) => ({
        date: formatDate(entry.eventDate),
        returnId: entry.leadReturnId,
        timeRange: formatTimeRangeNY(entry.eventStartTime, entry.eventEndTime),

        location: entry.eventLocation,
        description: entry.eventDescription,
        flags: entry.timelineFlag || [],
      }));
  
      setTimelineEntries(mapped);
    } catch (err) {
      console.error("Error fetching timeline entries:", err);
    }
  };
  
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
      const res = await axios.post("http://localhost:5000/api/timeline/create", payload, {
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
      flag: entryToEdit.flags[0] || '',
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
    

  return (
    <div className="timeline-container">
      <Navbar />

      <div className="top-menu">
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

            <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

            className="customer-btn" onClick={handleAddEntry}>Add Entry</button>
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
              </tr>
            </thead>
            <tbody>
              {timelineEntries.length > 0 ? (
                timelineEntries.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.date}</td>
                    <td>{entry.returnId}</td>
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
                  onClick={() => handleEditEntry(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDeleteEntry(index)}
                />
                  </button>
                  </div>
                </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No timelines found during investigation.</td>
                </tr>
              )}
            </tbody>
          </table>
          <Comment/>
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
