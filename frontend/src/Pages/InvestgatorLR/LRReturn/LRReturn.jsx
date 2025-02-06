import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./LRReturn.css";

export const LRReturn = () => {
  const navigate = useNavigate();

  // Sample returns data
  const [returns, setReturns] = useState([
    { dateEntered: "12/01/2024", results: "Returned item A" },
    { dateEntered: "12/02/2024", results: "Returned item B" },
  ]);

  // State for managing form input
  const [returnData, setReturnData] = useState({ results: "" });

  const handleInputChange = (field, value) => {
    setReturnData({ ...returnData, [field]: value });
  };

  const handleAddReturn = () => {
    const newReturn = {
      dateEntered: new Date().toLocaleDateString(),
      results: returnData.results,
    };
    setReturns([...returns, newReturn]);
    setReturnData({ results: "" });
  };

  const handleNavigation = (route) => {
    navigate(route);
  };

  return (
    <div className="lrreturn-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
      <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-contentLRR">
        <h2 className="title">Lead Returns</h2>

        {/* Returns Table */}
        <table className="returns-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Results</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((ret, index) => (
              <tr key={index}>
                <td>{ret.dateEntered}</td>
                <td>{ret.results}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Action Buttons Below Table */}
        {/* <div className="table-action-buttons">
          <button className="action-btn" onClick={handleAddReturn}>
            Add Return
          </button>
          <button className="action-btn">Edit</button>
          <button className="action-btn">Delete</button>
        </div> */}

        {/* Add Return Form */}
        <h4>Add Results</h4>
        <div className="return-form">
          <textarea
            value={returnData.results}
            onChange={(e) => handleInputChange("results", e.target.value)}
            placeholder="Enter return details..."
          ></textarea>
        </div>

        {/* Bottom Action Buttons */}
        <div className="form-buttons-return">
        <button className="save-btn">Add Return</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRPerson")}>
            Back
          </button>
          <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>
            Next
          </button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};
