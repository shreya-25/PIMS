import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./LRFinish.css";

export const LRFinish = () => {
  const navigate = useNavigate();

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
        <h2 className="title">Finish</h2>

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
                <input type="radio" name="report" /> Lead Instruction Sheet
              </label>
              <label>
                <input type="radio" name="report" /> Lead Worksheet
              </label>
              <label>
                <input type="radio" name="report" /> Lead Instruction Worksheet
              </label>
              <label>
                <input type="radio" name="report" /> Entered Results
              </label>
            </div>
            <div className="report-column">
              <label>
                <input type="radio" name="report" /> Lead Persons
              </label>
              <label>
                <input type="radio" name="report" /> Lead Pictures
              </label>
              <label>
                <input type="radio" name="report" /> Lead Results
              </label>
              <label>
                <input type="radio" name="report" /> Lead Scratchpad Entries
              </label>
              <label>
                <input type="radio" name="report" /> Lead Vehicles
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
          <button className="run-report-btn">Run Report</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRScratchpad")}>Back</button>
          <button className="finish-btn"onClick={() => handleNavigation("/casepagemanager")}>Submit</button>
          <button className="cancel-btn"onClick={() => handleNavigation("/casepagemanager")}>Cancel</button>
         
        </div>
      </div>
    </div>
  );
};
