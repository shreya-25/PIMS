import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./CMScratchpad.css"; // Custom CSS file for Scratchpad styling
import FootBar from '../../../components/FootBar/FootBar';


export const CMScratchpad = () => {
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
      <div className = "content-to-add">
          {/* Scratchpad Form */}
          <h4 className="evidence-form-h4">Add New Note</h4>
        <div className="scratchpad-form">
          <textarea
            value={noteData.text}
            onChange={(e) => handleInputChange("text", e.target.value)}
            placeholder="Write your note here"
          ></textarea>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddNote}>Add Note</button>
          {/* <button className="back-btn" onClick={() => handleNavigation("/LRVideos")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRFinish")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button> */}
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

      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREnclosures")} // Takes user to CM Return page
      />
    </div>
  );
};
