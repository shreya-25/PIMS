import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import Navbar from '../../../components/Navbar/Navbar';
import "./CMEnclosures.css"; // Custom CSS file for Enclosures styling

export const CMEnclosures = () => {
  const navigate = useNavigate(); // Initialize navigate hook

  // Sample enclosures data
  const [enclosures, setEnclosures] = useState([
    { dateEntered: "12/01/2024", type: "Report", enclosure: "Incident Report" },
    { dateEntered: "12/03/2024", type: "Evidence", enclosure: "Photo Evidence" },
  ]);

  // State to manage form data
  const [enclosureData, setEnclosureData] = useState({
    type: "",
    enclosure: "",
  });

  const handleInputChange = (field, value) => {
    setEnclosureData({ ...enclosureData, [field]: value });
  };

  const handleAddEnclosure = () => {
    const newEnclosure = {
      dateEntered: new Date().toLocaleDateString(),
      type: enclosureData.type,
      enclosure: enclosureData.enclosure,
    };

    // Add new enclosure to the list
    setEnclosures([...enclosures, newEnclosure]);

    // Clear form fields
    setEnclosureData({
      type: "",
      enclosure: "",
    });
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

  return (
    <div className="lrenclosures-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/CMInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVehicle")}>Vehicles</span>
          <span className="menu-item active" onClick={() => handleNavigation("/CMEnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVideo")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/CMTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/CMFinish")}>Finish</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-contentLRE">
        <h2 className="title">Enclosure Information</h2>

        {/* Enclosures Table */}
        <table className="enclosures-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Type</th>
              <th>Enclosure</th>
            </tr>
          </thead>
          <tbody>
            {enclosures.map((enclosure, index) => (
              <tr key={index}>
                <td>{enclosure.dateEntered}</td>
                <td>{enclosure.type}</td>
                <td>{enclosure.enclosure}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Enclosure Form */}
        <div className="enclosure-form">
          <div className="form-row">
            <label>Type:</label>
            <input
              type="text"
              value={enclosureData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Enclosure:</label>
            <textarea
              value={enclosureData.enclosure}
              onChange={(e) => handleInputChange("enclosure", e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-buttons">
          <button className="add-btn" onClick={handleAddEnclosure}>Add Enclosure</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRVehicle")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LREvidence")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};
