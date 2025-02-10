import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./LRScratchpad.css"; // Custom CSS file for Scratchpad styling

export const LRScratchpad = () => {
  const navigate = useNavigate();

  // Sample scratchpad data
  const [notes, setNotes] = useState([
    {
      dateEntered: "12/01/2024",
      enteredBy: "John Smith",
      text: "Initial observations of the case.",
    },
    {
      dateEntered: "12/02/2024",
      enteredBy: "Jane Doe",
      text: "Follow-up notes on interviews conducted.",
    },
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

  const handleNavigation = (route) => {
    navigate(route);
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

      {/* Main Content */}
      <div className="main-contentLRS">
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
          <h2 className="title">SCRATCHPAD INFORMATION</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>

        {/* Scratchpad Table */}
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Entered By</th>
              <th>Text</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note, index) => (
              <tr key={index}>
                <td>{note.dateEntered}</td>
                <td>{note.enteredBy}</td>
                <td>{note.text}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Scratchpad Form */}
        <h4 className="evidence-form-h4">Add New Note</h4>
        <div className="scratchpad-form">
          <textarea
            value={noteData.text}
            onChange={(e) => handleInputChange("text", e.target.value)}
            placeholder="Write your note here..."
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="form-buttons-scratchpad">
          <button className="add-btn" onClick={handleAddNote}>Add Note</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRVideos")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRFinish")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};
