import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/Navbar/Navbar';
import './CMTimeline.css';

export const CMTimeline = () => {
  const navigate = useNavigate();
  
    const handleNavigation = (route) => {
      navigate(route); // Navigate to the respective page
    };
  
  const [timelineEntries, setTimelineEntries] = useState([
    {
      date: '01/01/2024',
      timeRange: '10:30 AM - 12:00 PM',
      location: '123 Main St, NY',
      description: 'Suspect spotted leaving crime scene',
      flags: ['High Priority'],
    },
    {
      date: '01/05/2024',
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

      {/* <div className="timeline-section"> */}
      <div className="main-content-cl">
        {/* Left Section */}
        <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo-lr"
          />
        </div>


        {/* Center Section */}
        <div className="center-section">
          <h2 className="title">TIMELINE INFORMATION</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>
        <div className="timeline-table">
          <table>
            <thead>
              <tr>
                <th>Event Date</th>
                <th>Event Time Range</th>
                <th>Event Location</th>
                <th>Event Description</th>
                <th>Flags</th>
                <th>Actions</th>
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
                      <button className="btn-edit" onClick={() => handleEditEntry(index)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDeleteEntry(index)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-timeline">No timelines found during investigation.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="timeline-form-sec">
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
              <button onClick={handleAddFlag}>Add Flag</button>
            </div>

            <button className="btn-add" onClick={handleAddEntry}>Add Entry</button>
          </div>
        </div>
      <div className="form-buttons-timeline">
          <button className="back-btn" onClick={() => handleNavigation("/LRScratchpad")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRFinish")}>Next</button>
          <button className="cancel-btn">Cancel</button>
        </div>
    </div>
  );
};
