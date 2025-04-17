import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from '../../../components/Navbar/Navbar';
import './CMTimeline.css';
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";



export const CMTimeline = () => {
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
    const { selectedCase, selectedLead, setSelectedLead, leadReturns, setLeadReturns  } = useContext(CaseContext);
  
      
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
    {
      date: '01/01/24',
      timeRange: '10:30 AM - 12:00 PM',
      location: '123 Main St, NY',
      description: 'Suspect spotted leaving crime scene',
      flags: ['High Priority'],
    },
    {
      date: '01/05/24',
      timeRange: '2:00 PM - 3:30 PM',
      location: '456 Elm St, CA',
      description: 'Suspect was going to the airport',
      flags: [],
    },
  ]);

  const [newEntry, setNewEntry] = useState({
    date: '',
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

  const handleAddEntry = () => {
    if (newEntry.date && newEntry.startTime && newEntry.endTime && newEntry.location && newEntry.description) {
      const formattedEntry = {
        date: newEntry.date,
        timeRange: `${newEntry.startTime} - ${newEntry.endTime}`,
        location: newEntry.location,
        description: newEntry.description,
        flags: newEntry.flag ? [newEntry.flag] : [],
      };
      setTimelineEntries([...timelineEntries, formattedEntry]);
      setNewEntry({
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
        flag: '',
      });
    }
  };

  const handleDeleteEntry = (index) => {
    const updatedEntries = timelineEntries.filter((_, i) => i !== index);
    setTimelineEntries(updatedEntries);
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
                  const getCasePageRoute = () => {
                    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
                    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
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
              onClick={() => navigate(`/CM${item}`)}
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
            <li className="sidebar-item" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
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

      {/* <div className="content-to-add">
          <h3>Add/Edit Entry</h3>
          <div className="timeline-form">
            <label>Date</label>
            <input
              type="date"
              value={newEntry.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
            <label>Start Time</label>
            <input
              type="time"
              value={newEntry.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
            />
            <label>End Time</label>
            <input
              type="time"
              value={newEntry.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
            />
            <label>Location</label>
            <input
              type="text"
              value={newEntry.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
            <label>Description</label>
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
              <button className="save-btn1" onClick={handleAddFlag}>Add Flag</button>
            </div>

            <button className="save-btn1" onClick={handleAddEntry}>Add Entry</button>
          </div>
        </div> */}
 <div className = "LRI-content-section">

<div className = "content-subsection">
          <table className="leads-table">
            <thead>
              <tr>
                <th style={{ width: "9%" }}>Event Date</th>
                <th style={{ width: "15%" }}>Event Time Range</th>
                <th style={{ width: "13%" }}>Event Location</th>
                <th>Event Description</th>
                <th style={{ width: "10%" }}>Flags</th>
                <th style={{ width: "14%" }}>Access</th>
                <th style={{ width: "14%" }}>Additional Details</th>

              </tr>
            </thead>
            <tbody>
              {timelineEntries.length > 0 ? (
                timelineEntries.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.date}</td>
                    <td>{entry.timeRange}</td>
                    <td>{entry.location}</td>
                    <td>{entry.description}</td>
                    <td>{entry.flags.join(', ')}</td>
                    <td>
        <select
          value={ "Case Manager"}
           // Pass index properly
        >
          <option value="Case Manager">Case Manager</option>
          <option value="Everyone">Everyone</option>
        </select>
      </td>
      <td>  <button className="download-btn" >View</button></td>
          
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-timeline">No timelines found during investigation.</td>
                </tr>
              )}
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
