import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from "axios";
import { useNavigate } from 'react-router-dom'; 
import Navbar from '../../components/Navbar/Navbar'; 
import './LeadsDesk.css'; 
import FootBar from '../../components/FootBar/FootBar'; // Ensure FootBar is properly linked

export const LeadsDesk = () => {
  const navigate = useNavigate();
  const location = useLocation();

    const [leadData, setLeadData] = useState({
      CaseName: '',
      CaseNo: '',
      leadNumber: '',
      leadOrigin: '',
      incidentNumber: '',
      subNumber: '',
      associatedSubNumbers: [],
      assignedDate: '',
      dueDate: '',
      leadSummary: '',
      assignedBy: '',
      leadDescription: '',
      assignedOfficer: '',
    });

    const handleInputChange = (field, value) => {
      // Validate leadNumber to allow only numeric values
      if (field === 'leadNumber' && !/^\d*$/.test(value)) {
        alert("Lead Number must be a numeric value.");
        return;
      }
    
      // Update state
      setLeadData({ ...leadData, [field]: value });
    };

  // Extract case details
  const caseDetails = location.state?.caseDetails || {};
  const { id: caseID, title: caseName } = caseDetails;

  // State to store leads
  const [leads, setLeads] = useState([]);

  // Fetch all leads for the case
  useEffect(() => {
    const fetchLeadsForCase = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/lead/getLeads?caseID=${caseID}`);
        
        if (response.data && response.data.length > 0) {
          // Sort leads in ascending order based on lead number
          const sortedLeads = response.data.sort((a, b) => a.leadNo - b.leadNo);
          setLeads(sortedLeads);
        }
      } catch (error) {
        console.error("Error fetching leads:", error);
      }
    };

    if (caseID) {
      fetchLeadsForCase();
    }
  }, [caseID]);

  return (
    <div className="lead-instructions-page">
      {/* Navbar */}
      <Navbar />

      <div className="main-content-cl">
        {/* Left Section */}
        <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo-cl"
          />
        </div>


        {/* Center Section */}
        <div className="center-section">
        <h1 className="title">LEADS DESK</h1>
          {caseDetails ? (
                        <h1>
                          Case: {caseDetails?.id || "N/A"} | {caseDetails?.title || "Unknown Case"}
                        </h1>
                    ) : (
                        <h1>Case: 12345 | Main Street Murder </h1>
                    )}
        </div>


        {/* Right Section */}
        <div className="right-section">
          <table className="info-table">
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
        </div>
        </div>

        {/* Leads Table */}
        <div className="leads-container">
          {/* {leads.length > 0 ? ( */}
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Lead No</th>
                  <th>Lead Instruction</th>
                  <th>Assigned Officer</th>
                  <th>Assigned Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.leadNo}>
                    <td>{lead.leadNo|| "1"}</td>
                    <td>{lead.description || "Collect Audio Recording from Dispatcher"}</td>
                    <td>{lead.assignedTo || "Not Assigned"}</td>
                    <td>{lead.assignedDate|| "02/25/25"}</td>
                    <td>{lead.dueDate || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          {/* ) : (
            <p>No leads available for this case.</p>
          )} */}
      </div>

      {/* FootBar with navigation */}
      <FootBar 
        onPrevious={() => navigate(-1)} // Go back
        onNext={() => navigate("/cm-return")} // Go to CM Return page
      />
    </div>
  );
};
