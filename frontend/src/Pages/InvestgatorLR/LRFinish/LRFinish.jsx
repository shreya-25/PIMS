import React from "react";
import { useLocation, useNavigate } from 'react-router-dom';

import Navbar from '../../../components/Navbar/Navbar';
import "./LRFinish.css";
import FootBar from '../../../components/FootBar/FootBar';


export const LRFinish = () => {
  const navigate = useNavigate();
    const location = useLocation();
  const { caseDetails } = location.state || {};

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

  return (
    <div className="lrfinish-container">
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
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-contentLRF">
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
          <h2 className="title">FINISH </h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>

        {/* Logged Information */}
        <div className="logged-info">
          <div className="info-item">
            <label>Logged:</label>
            <input type="text" value="Officer 1" readOnly />
          </div>
          <div className="info-item">
            <label>Assigned To:</label>
            <input type="text" value="Officer 1" readOnly />
          </div>
          <div className="info-item">
            <label>Last Updated:</label>
            <input type="date" />
          </div>
          <div className="info-item">
            <label>Assigned By:</label>
            <input type="text" value="Officer 5" readOnly />
          </div>
          <div className="info-item">
            <label>Completed Date:</label>
            <input type="date" />
          </div>
        </div>

        {/* Reports and Destination */}
        <div className="reports-destination">
          <div className="report-options">
            <h4>Reports:</h4>
            <div className="report-column">
              <label>
                <input type="checkbox" name="report" /> Lead Instruction
              </label>
              <label>
                <input type="checkbox" name="report" /> Lead Returns
              </label>
              <label>
                <input type="checkbox" name="report" /> Lead Persons
              </label>
              <label>
                <input type="checkbox" name="report" /> Lead Vehicles
              </label>
              <label>
                <input type="checkbox" name="report" /> Lead Enclosures
              </label>
              <label>
                <input type="checkbox" name="report" /> Lead Evidences
              </label>
            </div>
            <div className="report-column">
              <label>
                <input type="checkbox" name="report" /> Lead Pictures
              </label>
              <label>
                <input type="checkbox" name="report" /> Lead Audio Description
              </label>
              <label>
                <input type="checkbox" name="report" /> Lead Videos Description
              </label>
              <label>
                <input type="checkbox" name="report" /> Lead Scratchpad Entries
              </label>
              <label>
                <input type="checkbox" name="report" /> Lead Timeline Entries
              </label>
            </div>
          </div>
          <div className="destination-options">
            <h4>Destination:</h4>
            <label>
              <input type="radio" name="destination" className="dest-op-class" /> Print
            </label>
            <label>
              <input type="radio" name="destination" className="dest-op-class" /> Preview
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="form-buttons-finish">
          <button className="save-btn1">Run Report</button>
          {/* <button className="back-btn" onClick={() => handleNavigation("/LRScratchpad")}>Back</button>
          <button className="finish-btn"onClick={() => handleNavigation("/casepagemanager")}>Submit</button>
          <button className="cancel-btn"onClick={() => handleNavigation("/casepagemanager")}>Cancel</button> */}
         
        </div>
      </div>

      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/casepagemanager", { state: { caseDetails } } )}
        
        
        
        // Takes user to CM Return page
      />
    </div>
  );
};
