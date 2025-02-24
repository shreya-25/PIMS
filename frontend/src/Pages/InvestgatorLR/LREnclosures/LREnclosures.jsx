import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import Navbar from '../../../components/Navbar/Navbar';
import "./LREnclosures.css"; // Custom CSS file for Enclosures styling
import FootBar from '../../../components/FootBar/FootBar';


export const LREnclosures = () => {
  const navigate = useNavigate(); // Initialize navigate hook

  // Sample enclosures data
  const [enclosures, setEnclosures] = useState([
    { returnId:1,dateEntered: "12/01/2024", type: "Report", enclosure: "Incident Report" },
    { returnId:2, dateEntered: "12/03/2024", type: "Evidence", enclosure: "Photo Evidence" },
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
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
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
          <h2 className="title">ENCLOSURES INFORMATION</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>

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
        <button className="save-btn1
        " onClick={handleAddEnclosure}>Add Enclosure</button>

              {/* Enclosures Table */}
              <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Associated Return Id </th>
              <th>Type</th>
              <th>Enclosure</th>
            </tr>
          </thead>
          <tbody>
            {enclosures.map((enclosure, index) => (
              <tr key={index}>
                <td>{enclosure.dateEntered}</td>
                <td>{enclosure.returnId}</td>
                <td>{enclosure.type}</td>
                <td>{enclosure.enclosure}</td>
              </tr>
            ))}
          </tbody>
        </table>


        {/* Action Buttons */}
        <div className="form-buttons">
          {/* <button className="add-btn" onClick={handleAddEnclosure}>Add Enclosure</button> */}
          {/* <button className="back-btn" onClick={() => handleNavigation("/LRVehicle")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LREvidence")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button> */}
        </div>

      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREvidence")} // Takes user to CM Return page
      />
    </div>
  );
};
