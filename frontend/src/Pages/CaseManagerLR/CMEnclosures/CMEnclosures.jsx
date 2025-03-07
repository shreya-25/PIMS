import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./CMEnclosures.css";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import FootBar from '../../../components/FootBar/FootBar';


export const CMEnclosures = () => {
  const navigate = useNavigate(); 
  const location = useLocation();
  

  // Sample enclosures data
  const [enclosures, setEnclosures] = useState([
    { dateEntered: "", leadReturnType: "", type: "", enclosure: "" },
    // { dateEntered: "12/03/2024", type: "Evidence", enclosure: "Photo Evidence" },
  ]);


  const [file, setFile] = useState(null);

  const handleInputChange = (field, value) => {
    setEnclosureData({ ...enclosureData, [field]: value });
  };

  // State to manage form data
  const [enclosureData, setEnclosureData] = useState({
    type: "",
    enclosure: "",
  });

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
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
  <div className = "content-to-add">
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
          <div className="form-row">
            <label>Upload File:</label>
            <input type="file" onChange={handleFileChange} />
          </div>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddEnclosure}>Add Enclosure</button>
          {/* <button className="back-btn" onClick={() => handleNavigation("/LRVehicle")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LREvidence")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button> */}
        </div>

        {/* Enclosures Table */}
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Associated Return Id</th>
              <th>Type</th>
              <th>Enclosure Description</th>
            </tr>
          </thead>
          <tbody>
            {enclosures.map((enclosure, index) => (
              <tr key={index}>
                <td>{enclosure.dateEntered}</td>
                <td>{enclosure.leadReturnId}</td>
                <td>{enclosure.type}</td>
                <td>{enclosure.enclosure}</td>
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
