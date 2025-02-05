import React, { useState } from "react";
import "./LeadInfo.css";
import Navbar from '../../components/Navbar/Navbar';

export const LeadInfo = () => {
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [assignedOfficers, setAssignedOfficers] = useState([
    "Officer 20", 
    "Officer 21", 
    "Officer 22"
  ]); 
  const allOfficers = ["Officer 1", "Officer 2", "Officer 3", "Officer 4"]; 

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
                <tr><td>Associated Subnumber</td><td>SUB-000001, SUB-000001,SUB-000001</td></tr>
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
              <button className="add-btn" onClick={handleAddOfficer}>Add</button>
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
          <div className="status-updates">
            {["Lead Created, 02/10/2025", "Lead Assigned 02/10/2025", "Lead Accepted 02/10/2025", "Lead Return Submitted 02/10/2025", "Lead Approved 02/10/2025", "Lead Returned 02/10/2025", "Lead Completed 02/10/2025"].map((status, index) => (
              <div key={index} className="status-item">
                <div className="status-circle"></div>
                <div className="status-text-box">
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
