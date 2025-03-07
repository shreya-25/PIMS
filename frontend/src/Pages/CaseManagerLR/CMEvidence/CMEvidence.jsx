import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import Navbar from '../../../components/Navbar/Navbar';
import "./CMEvidence.css"; // Custom CSS file for Evidence styling
import FootBar from '../../../components/FootBar/FootBar';


export const CMEvidence = () => {
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
          <span className="menu-item" onClick={() => handleNavigation("/CMInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEnclosures")}>Enclosures</span>
          <span className="menu-item active" onClick={() => handleNavigation("/CMEvidence")}>Evidence</span>
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
          <h2 className="title">EVIDENCE INFORMATION</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>

        {/* Evidence Form */}
        <div className = "content-to-add">
        <h4 className="evidence-form-h4">Enter Evidence Details</h4>
        <div className="evidence-form">
          <div className="form-row-evidence">
            <label  className="evidence-head">Collection Date:</label>
            <input
              type="date"
              value={evidenceData.collectionDate}
              className="input-field"
              onChange={(e) => handleInputChange("collectionDate", e.target.value)}
            />
            <label className="evidence-head">Disposed Date:</label>
            <input
              type="date"
              value={evidenceData.disposedDate}
              className="input-field"
              onChange={(e) => handleInputChange("disposedDate", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label className="evidence-head">Type:</label>
            <input
              type="text"
              value={evidenceData.type}
              className="input-field"
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label className="evidence-head">Disposition:</label>
            <textarea
              value={evidenceData.disposition}
              onChange={(e) => handleInputChange("disposition", e.target.value)}
            ></textarea>
          </div>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddEvidence}>Add Evidence</button>
          {/* <button className="back-btn" onClick={() => handleNavigation("/LREnclosures")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRPictures")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button> */}
        </div>

        {/* Evidence Table */}
        <table className="timeline-table">
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

      
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREnclosures")} // Takes user to CM Return page
      />
    </div>
  );
};
