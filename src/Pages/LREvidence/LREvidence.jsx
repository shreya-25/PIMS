import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import Navbar from "../../components/Navbar/Navbar";
import "./LREvidence.css"; // Custom CSS file for Evidence styling

export const LREvidence = () => {
  const navigate = useNavigate(); // Initialize navigate hook

  // Sample evidence data
  const [evidence, setEvidence] = useState([
    {
      dateEntered: "12/01/2024",
      type: "Physical",
      collectionDate: "12/01/2024",
      disposedDate: "12/03/2024",
      disposition: "Stored",
    },
    {
      dateEntered: "12/02/2024",
      type: "Digital",
      collectionDate: "12/02/2024",
      disposedDate: "12/04/2024",
      disposition: "Archived",
    },
  ]);

  // State to manage form data
  const [evidenceData, setEvidenceData] = useState({
    collectionDate: "",
    disposedDate: "",
    type: "",
    disposition: "",
  });

  const handleInputChange = (field, value) => {
    setEvidenceData({ ...evidenceData, [field]: value });
  };

  const handleAddEvidence = () => {
    const newEvidence = {
      dateEntered: new Date().toLocaleDateString(),
      collectionDate: evidenceData.collectionDate,
      disposedDate: evidenceData.disposedDate,
      type: evidenceData.type,
      disposition: evidenceData.disposition,
    };

    // Add new evidence to the list
    setEvidence([...evidence, newEvidence]);

    // Clear form fields
    setEvidenceData({
      collectionDate: "",
      disposedDate: "",
      type: "",
      disposition: "",
    });
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

  return (
    <div className="lrevidence-container">
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
          <span className="menu-item active" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideo")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-contentLRE">
        <h2 className="title">Evidence Information</h2>

        {/* Evidence Table */}
        <table className="evidence-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Type</th>
              <th>Collection Date</th>
              <th>Disposed Date</th>
              <th>Disposition</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((item, index) => (
              <tr key={index}>
                <td>{item.dateEntered}</td>
                <td>{item.type}</td>
                <td>{item.collectionDate}</td>
                <td>{item.disposedDate}</td>
                <td>{item.disposition}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Evidence Form */}
        <h4>Enter Evidence Details</h4>
        <div className="evidence-form">
          <div className="form-row-evidence">
            <label>Collection Date:</label>
            <input
              type="date"
              value={evidenceData.collectionDate}
              onChange={(e) => handleInputChange("collectionDate", e.target.value)}
            />
            <label>Disposed Date:</label>
            <input
              type="date"
              value={evidenceData.disposedDate}
              onChange={(e) => handleInputChange("disposedDate", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label>Type:</label>
            <input
              type="text"
              value={evidenceData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label>Disposition:</label>
            <textarea
              value={evidenceData.disposition}
              onChange={(e) => handleInputChange("disposition", e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-buttons-evidence">
          <button className="add-btn" onClick={handleAddEvidence}>Add Evidence</button>
          <button className="back-btn" onClick={() => handleNavigation("/LREnclosures")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRPictures")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};
