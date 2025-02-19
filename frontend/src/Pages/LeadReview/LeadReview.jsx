import React, { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Searchbar from '../../components/Searchbar/Searchbar';
import Button from '../../components/Button/Button';
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import './LeadReview.css';
import { useLocation, useNavigate } from 'react-router-dom';

export const LeadReview  = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { caseDetails } = location.state || {};
    const leadEntries = location.state?.leadEntries || [];
    const [assignedOfficersFilter, setAssignedOfficersFilter] = useState("");
    // const { id: caseID, title: caseName } = caseDetails;  // Extract Case ID & Case Title


    const [activeTab, setActiveTab] = useState("allLeads"); // Default to All Leads tab
    const handleViewAssignedLead = (lead) => {
    };
    const handleCaseClick = (caseDetails) => {
      navigate("/CasePageManager", { state: { caseDetails } }); // Pass case details via state
    };
    const handleLRClick = (lead) => {
      navigate("/LRInstruction", { state: { leadDetails: lead } });
    };
    const handleNavigation = (route) => {
      navigate(route); // Navigate to respective page
    };

    const defaultCaseSummary = "Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.";
        const [caseSummary, setCaseSummary] = useState(caseDetails?.summary || defaultCaseSummary);

          const [leadData, setLeadData] = useState({
            leadNumber: '',
            leadOrigin: '',
            incidentNumber: '',
            subNumber: '',
            associatedSubNumbers: [],
            assignedDate: '',
            leadSummary: '',
            assignedBy: '',
            leadDescription: '',
            assignedOfficer: '',
          });
        
        
          const [dropdownOpen, setDropdownOpen] = useState(false);
        
          const [availableSubNumbers, setAvailableSubNumbers] = useState([
            "SUB-000001", "SUB-000002", "SUB-000003", "SUB-000004", "SUB-000005"
          ]); // Static List of Subnumbers
          
          const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]); // Selected Subnumbers
          const [subDropdownOpen, setSubDropdownOpen] = useState(false);
          const handleInputChange = (field, value) => {
            // Validate leadNumber to allow only numeric values
            if (field === 'leadNumber' && !/^\d*$/.test(value)) {
              alert("Lead Number must be a numeric value.");
              return;
            }
          
            // Update state
            setLeadData({ ...leadData, [field]: value });
          };
    

    return (
        <div className="case-page-manager">
            {/* Navbar */}
            <Navbar />

            {/* Main Container */}
            <div className="main-container">
                {/* Sidebar */}
                <div className="sideitem">
                    <ul className="sidebar-list">
                    <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
                    <li className="sidebar-item"onClick={() => navigate('/LeadReview')}> Lead Information </li>  
                        <li className="sidebar-item"onClick={() => navigate('/Investigator')}>Case Page </li>
                        <li className="sidebar-item"onClick={() => navigate('/leadlog')}>View Lead Log</li>
                        <li className="sidebar-item"onClick={() => navigate('/LRInstructions')}>View Lead Return</li>
                        <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
                        <li className="sidebar-item"onClick={() => navigate('/casescratchpad')}>Case Scratchpad</li>
                    </ul>
                </div>
                <div className="left-content">

                   {/* Display Case Number and Name */}
                <div className="case-header">
                  <h1> Lead No: 24 | Interview Sarah </h1> 
                </div>
                {/* Content Area */}
                <div className="content">

                <div className="case-summarylr">
              <label className="input-label">Case Summary</label>
              <textarea
                className="textarea-field"
                value={caseSummary}
                onChange={(e) => setCaseSummary(e.target.value)}
              />
            </div>
              

            <table className="info-tablelr">
            <tbody>
              <tr>
                <td>LEAD NUMBER:</td>
                <td>
                {/* <input
                    type="text"
                    className="input-field1"
                    value={leadData.leadNumber}
                    onChange={(e) => handleInputChange('leadNumber', e.target.value)} // Allow manual edits
                    placeholder="Enter Lead Number"
                  /> */}
                        <input type="text" value={leadData.leadNumber} className="input-field" readOnly /> {/* Read-only auto-generated */}

                </td>
              </tr>
              <tr>
                <td>INCIDENT NUMBER:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.incidentNumber}
                    onChange={(e) => handleInputChange('incidentNumber', e.target.value)}
                    placeholder=""
                  />
                </td>
              </tr>
              <tr>
                <td>SUBNUMBER:</td>
                <td>
                <input
                    type="text"
                    className="input-field"
                    value={leadData.subNumber}
                    readOnly // Make it read-only
                  />
                </td>
              </tr>
              {/* <tr>
                <td>ASSOCIATED SUBNUMBERS:</td>
                <td>
                <input
                    type="text"
                    className="input-field1"
                    value={leadData.associatedSubNumbers}
                    readOnly // Make it read-only
                  />
                </td>
              </tr> */}
             
                           <tr>
                <td>ASSIGNED DATE:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.assignedDate}
                    onChange={(e) => handleInputChange('assignedDate', e.target.value)}
                    placeholder=""
                  />
                </td>
              </tr>
            </tbody>
          </table>

            <div className="inst-table-sec">
            <table className="details-table">
          <tbody>
          <tr>
              <td>Case Name:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.caseName || 'Main Street Theft'} // Display selected case name or an empty string
                  onChange={(e) => handleInputChange('caseName', e.target.value)} // Update 'caseName' in leadData
                  placeholder="Enter Case Name"
    />
              </td>
            </tr>
            <tr>
              <td>Case Summary:</td>
              <td>
                <input
                  type="text"
                  // className="input-field"
                  value={leadData.caseSummary || 'Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.'} 
                  // onChange={(e) => handleInputChange('caseName', e.target.value)} 
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
                  placeholder="Enter Lead Summary"
                />
              </td>
            </tr>
            <tr>
                <td>Lead Origin:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.leadOrigin}
                    onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                    placeholder="Enter Lead Origin"
                  />
                </td>
              </tr>
            <tr>
  <td>Associated Subnumbers:</td>
  <td>
    <div className="custom-dropdown-cl">
      <div
        className="dropdown-header-cl"
        onClick={() => setSubDropdownOpen(!subDropdownOpen)}
      >
        {associatedSubNumbers.length > 0
          ? associatedSubNumbers.join(", ")
          : "Select Subnumbers"}
        <span className="dropdown-icon">{subDropdownOpen ? "▲" : "▼"}</span>
      </div>
      {subDropdownOpen && (
        <div className="dropdown-options">
          {availableSubNumbers.map((subNum) => (
            <div key={subNum} className="dropdown-item">
              <input
                type="checkbox"
                id={subNum}
                value={subNum}
                checked={associatedSubNumbers.includes(subNum)}
                onChange={(e) => {
                  const updatedSubNumbers = e.target.checked
                    ? [...associatedSubNumbers, e.target.value]
                    : associatedSubNumbers.filter((num) => num !== e.target.value);
                  setAssociatedSubNumbers(updatedSubNumbers);
                }}
              />
              <label htmlFor={subNum}>{subNum}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  </td>
</tr>
<tr>
              <td>Due Date:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  // value={leadData.leadSummary}
                  // onChange={(e) => handleInputChange('leadSummary', e.target.value)}
                  placeholder="MM/DD/YY"
                />
              </td>
            </tr>

          {/* <tr>
            <td>Priority:</td>
              <td>
              <div className="custom-dropdown-cl">
                    <div
                      className="dropdown-header-cl"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      {leadData.assignedOfficer.length > 0
                        ? leadData.assignedOfficer.join(', ')
                        : 'Select Priority'}
                      <span className="dropdown-icon">{dropdownOpen ? '▲' : '▼'}</span>
                    </div>
                    {dropdownOpen && (
                      <div className="dropdown-options">
                        {['High', 'Medium', 'Low'].map((priority) => {
                          return (
                            <div key={officer} className="dropdown-item">
                              <input
                                type="checkbox"
                              />
                              <label htmlFor={priority}>{priority}</label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
              </td>
            </tr> */}

            <tr>
  {/* <td>Assign Officers:</td>
  <td>
    <div className="custom-dropdown-cl">
      <div
        className="dropdown-header-cl"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {leadData.assignedOfficer.length > 0
          ? leadData.assignedOfficer.join(', ')
          : 'Select Officers'}
        <span className="dropdown-icon">{dropdownOpen ? '▲' : '▼'}</span>
      </div>
      {dropdownOpen && (
        <div className="dropdown-options">
          {['Officer 1 [5] [4]', 'Officer 2 [3] [3]', 'Officer 3 [2] [1]'].map((officer) => (
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
  </td> */}
  <td>Assign Officers:</td>
<td>
  <div className="custom-dropdown-cl">
    <div
      className="dropdown-header-cl"
      onClick={() => setDropdownOpen(!dropdownOpen)}
    >
      {leadData.assignedOfficer.length > 0
        ? leadData.assignedOfficer.join(', ')
        : 'Select Officers'}
      <span className="dropdown-icon">{dropdownOpen ? '▲' : '▼'}</span>
    </div>
    {dropdownOpen && (
      <div className="dropdown-options">
        {[
            { name: "Officer 1", assignedLeads: 2, totalAssignedLeads: 1, assignedDays: 5, unavailableDays: 4 },
            { name: "Officer 2", assignedLeads: 3, totalAssignedLeads: 3, assignedDays: 3, unavailableDays: 3 },
            { name: "Officer 3", assignedLeads: 3, totalAssignedLeads: 3, assignedDays: 2, unavailableDays: 1 },
          ].map((officer) => {
            const isAvailable =
              officer.unavailableDays === 0
                ? "Available"
                : `Unavailable for ${officer.unavailableDays} days`;
        // {['Officer 1 [2] [1]', 'Officer 2 [3] [3]', 'Officer 3 [5] [4]'].map((officer) => {
          // const officerName = officer.split(' [')[0]; // Extract only the name

          return (
            <div key={officer} className="dropdown-item">
              <input
                type="checkbox"
                id={officer.name}
                value={officer.name} // Store only the officer's name
                checked={leadData.assignedOfficer.includes(officer.name)}
                onChange={(e) => {
                  const newAssignedOfficers = e.target.checked
                    ? [...leadData.assignedOfficer, e.target.value]
                    : leadData.assignedOfficer.filter((o) => o !== e.target.value);
                  handleInputChange('assignedOfficer', newAssignedOfficers);
                }}
              />
              <label htmlFor={officer.name}>
                  {officer.name}{" "}[{officer.assignedLeads}] {" "} [{officer.totalAssignedLeads}] {" "}
                  <em style={{ fontSize: "14px", color: "gray" }}>
                    ({isAvailable})
                  </em>
                </label>
            </div>
          );
        })}
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
                  className="textarea-field-cl"
                  value={leadData.leadDescription}
                  onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                  placeholder="Enter Lead Description"
                ></textarea>
              </td>
            </tr>
          </tbody>
        </table>  
        </div>
                
                <div className="gotomainpagebtn">
                   <button className="cancel-btn"onClick={() => handleNavigation("/MainPage")}>Go to Main Page</button>
                </div>
            </div>
            </div>
            </div>
            </div>
      
    );
};
