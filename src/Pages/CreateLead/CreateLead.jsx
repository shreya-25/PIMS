import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import Navbar from '../../components/Navbar/Navbar'; // Import your Navbar component
import './CreateLead.css'; // Create this CSS file for styling

export const CreateLead = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  // State for all input fields
  const [leadData, setLeadData] = useState({
    leadNumber: '12',
    leadOrigin: '5',
    incidentNumber: 'C000000',
    subNumber: 'C0000000',
    assignedDate: '08/25/24',
    leadSummary: 'Default Summary',
    assignedBy: '',
    leadDescription: '',
    assignedOfficer: '',
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);


  const handleInputChange = (field, value) => {
    setLeadData({ ...leadData, [field]: value });
  };

  const handleGenerateLead = () => {
    const { leadNumber, leadSummary, assignedDate, assignedOfficer, assignedBy } = leadData;
  
    // Check if mandatory fields are filled
    if (!leadNumber || !leadSummary || !assignedDate || !assignedOfficer || !assignedBy) {
      alert("Please fill in all the required fields before generating a lead.");
      return;
    }
  
    // Show confirmation alert before proceeding
    if (window.confirm("Are you sure you want to generate this lead?")) {
      // Navigate to the Lead Log page with relevant lead data
      navigate("/leadlog", {
        state: {
          leadNumber,
          leadSummary,
          assignedDate,
          assignedOfficer,
        },
      });
    }
  };
  

  return (
    <div className="lead-instructions-page">
      {/* Navbar at the top */}
      <Navbar />

      <div className="main-content">
        {/* Left Section */}
        <div className="left-section">
          <img
            src="/Materials/newpolicelogo.png" // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo"
          />
        </div>

        {/* Center Section */}
        <div className="center-section">
          <h2 className="title">LEAD INSTRUCTIONS</h2>
        </div>

        {/* Right Section */}
        <div className="right-section">
          <table className="info-table">
            <tbody>
              <tr>
                <td>LEAD NUMBER:</td>
                <td>
                  <input
                    type="text"
                    className="input-field1"
                    value={leadData.leadNumber}
                    onChange={(e) => handleInputChange('leadNumber', e.target.value)}
                    placeholder="12"
                  />
                </td>
              </tr>
              <tr>
                <td>LEAD ORIGIN:</td>
                <td>
                  <input
                    type="text"
                    className="input-field1"
                    value={leadData.leadOrigin}
                    onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                    placeholder="5"
                  />
                </td>
              </tr>
              <tr>
                <td>INCIDENT NUMBER:</td>
                <td>
                  <input
                    type="text"
                    className="input-field1"
                    value={leadData.incidentNumber}
                    onChange={(e) => handleInputChange('incidentNumber', e.target.value)}
                    placeholder="C000000"
                  />
                </td>
              </tr>
              <tr>
                <td>SUBNUMBER:</td>
                <td>
                  <input
                    type="text"
                    className="input-field1"
                    value={leadData.subNumber}
                    onChange={(e) => handleInputChange('subNumber', e.target.value)}
                    placeholder="C0000000"
                  />
                </td>
              </tr>
              <tr>
                <td>ASSIGNED DATE:</td>
                <td>
                  <input
                    type="text"
                    className="input-field1"
                    value={leadData.assignedDate}
                    onChange={(e) => handleInputChange('assignedDate', e.target.value)}
                    placeholder="08/25/24"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Content */}
      <div className="bottom-content">
        <table className="details-table">
          <tbody>
          <tr>
              <td>Case Name:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.caseName || 'Default Case'} // Display selected case name or an empty string
      onChange={(e) => handleInputChange('caseName', e.target.value)} // Update 'caseName' in leadData
    />

              </td>
            </tr>
            <tr>
              <td>Lead Summary:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.leadSummary}
                  onChange={(e) => handleInputChange('leadSummary', e.target.value)}
                  placeholder="Summary"
                />
              </td>
            </tr>
            <tr>
  <td>Assign Officers:</td>
  <td>
    <div className="custom-dropdown">
      <div
        className="dropdown-header"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {leadData.assignedOfficer.length > 0
          ? leadData.assignedOfficer.join(', ')
          : 'Select Officers'}
        <span className="dropdown-icon">{dropdownOpen ? '▲' : '▼'}</span>
      </div>
      {dropdownOpen && (
        <div className="dropdown-options">
          {['Officer 1', 'Officer 2', 'Officer 3'].map((officer) => (
            <div key={officer} className="dropdown-item">
              <input
                type="checkbox"
                id={officer}
                value={officer}
                checked={leadData.assignedOfficer.includes(officer)}
                onChange={(e) => {
                  const newAssignedOfficers = e.target.checked
                    ? [...leadData.assignedOfficer, e.target.value]
                    : leadData.assignedOfficer.filter((o) => o !== e.target.value);
                  handleInputChange('assignedOfficer', newAssignedOfficers);
                }}
              />
              <label htmlFor={officer}>{officer}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  </td>
</tr>


            <tr>
              <td>Assigned By:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.assignedBy}
                  onChange={(e) => handleInputChange('assignedBy', e.target.value)}
                  placeholder="Assigned By"
                />
              </td>
            </tr>
            <tr>
              <td>Lead Description:</td>
              <td>
                <textarea
                  className="textarea-field"
                  value={leadData.leadDescription}
                  onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                  placeholder="Enter Description"
                ></textarea>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="next-btnlri" onClick={handleGenerateLead}>
          Done
        </button>
        <button className="next-btnlri">Download PDF</button>
        <button className="next-btnlri">Print PDF</button>
      </div>
    </div>
  );
};
