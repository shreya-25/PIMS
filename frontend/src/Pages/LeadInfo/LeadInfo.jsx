import React, { useState } from "react";
import "./LeadInfo.css";
import Navbar from '../../components/Navbar/Navbar';
import { useLocation, useNavigate } from 'react-router-dom';

export const LeadInfo = () => {
  const navigate = useNavigate();
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [assignedOfficers, setAssignedOfficers] = useState([
    "Officer 20", 
    "Officer 21", 
    "Officer 22"
  ]); 
  const allOfficers = ["Officer 1", "Officer 2", "Officer 3", "Officer 4"]; 
  const statuses = [
    "Lead Created",
    "Lead Assigned",
    "Lead Accepted",
    "Lead Return Submitted",
    "Lead Approved",
    "Lead Returned",
    "Lead Completed",
  ];
  
  // Change this index to highlight the current status dynamically
  const currentStatusIndex = 3; // Example: Highlighting "Lead Return Submitted"

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

  const handleAddOfficer = () => {
    if (selectedOfficer && !assignedOfficers.includes(selectedOfficer)) {
      setAssignedOfficers([...assignedOfficers, selectedOfficer]);
      setSelectedOfficer("");
    }
  };

  const handleRemoveOfficer = (officer) => {
    setAssignedOfficers(assignedOfficers.filter(o => o !== officer));
  };

  return (
    <div className="leads-container">
      <Navbar />
      <div className="lead-info">
        <h2>Lead Information</h2>
        <h3>
          Lead No: <span className="case-number">12</span> | Interview Mr. John
        </h3>
        <div className="lead-content">
        <div className="lead-content-left">
        <div className="lead-details">
            <table>
              <tbody>
                <tr><td>Lead Details</td><td></td></tr>
                <tr><td>Assigned By</td><td>Officer 1</td></tr>
                <tr><td>Lead Origin</td><td>Lead 2</td></tr>
                <tr><td>Incident Number</td><td>C000008</td></tr>
                <tr><td>Subnumber</td><td>SUB-000001</td></tr>
                <tr><td>Associated Subnumber</td><td>SUB-000001, SUB-000001, SUB-000001</td></tr>
                <tr><td>Last Updated</td><td>02/20/25</td></tr>
                <tr><td>Lead Instruction</td><td>Interview Mr. John</td></tr>
              </tbody>
            </table>
          </div>
          <div className="assigned-officers">
            <div className="assigned-officers-title">
              <h4>Assigned Officers</h4>
            </div>
            <div className="add-officer">
              <select 
                value={selectedOfficer} 
                onChange={(e) => setSelectedOfficer(e.target.value)}
              >
                <option value="">Select Officer</option>
                {allOfficers.map((officer, index) => (
                  <option key={index} value={officer}>{officer}</option>
                ))}
              </select>
              <button className="add-officer-btn" onClick={handleAddOfficer}>Add</button>
            </div>
            <div className="officer-list">
              {assignedOfficers.map((officer, index) => (
                <div key={index} className="officer">
                  {officer} <button className="remove-btn" onClick={() => handleRemoveOfficer(officer)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
          </div>
          <div className="lead-content-right">
             <div className="lead-tracker-container">
                  {statuses.map((status, index) => (
                       <div key={index} className="lead-tracker-row" onClick={() => {
                        if (status === "Lead Return Submitted") {
                          handleNavigation("/CMInstruction");
                        }
                      }}
                      style={{ cursor: status === "Lead Return Submitted" ? "pointer" : "default" }}
                    >
                          {/* Circle Indicator */}
                          <div
                            className={`status-circle ${index <= currentStatusIndex ? "active" : ""}`}
                          >
                            {index <= currentStatusIndex && <span className="status-number">{index + 1}</span>}
                         </div>

                            {/* Connector Line (Except Last Item) */}
                            {index < statuses.length && (
                              <div className={`status-line ${index < currentStatusIndex ? "active" : ""}`}></div>
                            )}

                            {/* Status Box */}
                            <div
                              className={`status-text-box ${index === currentStatusIndex ? "highlighted" : ""}`}
                            >
                              {status}
                            </div>
                        </div>
                      ))}
                </div>
          </div>
        </div>
      </div>
    </div>
  );
};

