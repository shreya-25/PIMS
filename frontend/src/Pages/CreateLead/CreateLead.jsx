import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from "axios";
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import Navbar from '../../components/Navbar/Navbar'; // Import your Navbar component
import './CreateLead.css'; // Create this CSS file for styling


export const CreateLead = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook
  const location = useLocation();
  const leadEntries = location.state?.leadEntries || [];


  // State for all input fields
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


//   useEffect(() => {
//     // Default highestLeadNumber to 3 so that it starts from 4 if nothing is found
//     let highestLeadNumber = 3;
 
//     if (leadEntries?.length > 0) {
//       // Calculate the highest lead number from the passed leadEntries
//       highestLeadNumber = leadEntries.reduce(
//         (max, lead) => Math.max(max, parseInt(lead.leadNumber || '0', 10)),
//         highestLeadNumber
//       );
//     } else {
//       // Check if anything is in localStorage
//       const savedEntries = JSON.parse(localStorage.getItem('leadEntries')) || [];
 
//       if (savedEntries.length > 0) {
//         highestLeadNumber = savedEntries.reduce(
//           (max, lead) => Math.max(max, parseInt(lead.leadNumber || '0', 10)),
//           highestLeadNumber
//         );
//       }
//     }
 
//     // Increment the highest lead number by 1
//     const newLeadNumber = highestLeadNumber + 1;
 
//      // Set leadNumber only if it hasn't been manually changed
//   setLeadData((prevData) => {
//     if (prevData.leadNumber) {
//       return prevData; // Prevent overwriting manual edits
//     }
//     return {
//       ...prevData,
//       leadNumber: newLeadNumber.toString(),
//       subNumber: `SUB-${newLeadNumber.toString().padStart(6, '0')}`,
//     };
//   });
// }, [leadEntries]);
 
useEffect(() => {
  const fetchMaxLeadNumber = async () => {
    try {
      const response = await axios.get("https://pims-backend.onrender.com/api/lead/maxLeadNumber");
      const maxLeadNo = response.data.maxLeadNo || 0; // Default to 0 if no leads exist
      const newLeadNumber = maxLeadNo + 1;

      setLeadData((prevData) => ({
        ...prevData,
        leadNumber: newLeadNumber.toString(),
        subNumber: `SUB-${newLeadNumber.toString().padStart(6, '0')}`, // Auto-generate sub-number
      }));
    } catch (error) {
      console.error("Error fetching max lead number:", error);
    }
  };

  fetchMaxLeadNumber();
}, []);
 

  const handleInputChange = (field, value) => {
    // Validate leadNumber to allow only numeric values
    if (field === 'leadNumber' && !/^\d*$/.test(value)) {
      alert("Lead Number must be a numeric value.");
      return;
    }
  
    // Update state
    setLeadData({ ...leadData, [field]: value });
  };

  // const handleInputChange = (field, value) => {
  //   setLeadData({ ...leadData, [field]: value });
  // };


  // const handleGenerateLead = () => {
  //   const { leadNumber, leadSummary, assignedDate, assignedOfficer, assignedBy } = leadData;
 
  //   // Check if mandatory fields are filled
  //   if (!leadNumber || !leadSummary || !assignedDate || !assignedOfficer || !assignedBy) {
  //     alert("Please fill in all the required fields before generating a lead.");
  //     return;
  //   }
 
  //   // Show confirmation alert before proceeding
  //   if (window.confirm("Are you sure you want to generate this lead?")) {
  //     const newLead = {
  //       leadNumber,
  //       leadSummary,
  //       assignedDate,
  //       assignedOfficer: Array.isArray(assignedOfficer)
  //         ? assignedOfficer
  //         : [assignedOfficer], // Ensure assignedOfficer is an array
  //       assignedBy,
  //       leadDescription: leadData.leadDescription,
  //       caseName: leadData.caseName,
  //     };
 
  //     // Save the new lead to localStorage
  //     const existingLeads = JSON.parse(localStorage.getItem("leads")) || [];
  //     localStorage.setItem("leads", JSON.stringify([...existingLeads, newLead]));
 
  //     // Navigate back to the Lead Log page and pass the new lead
  //     navigate("/LeadLog", { state: { newLead } });
 
  //     // Show success message
  //     alert("Lead successfully added!");
  //   }
  // };


const handleGenerateLead = async () => {
  const {
    leadNumber,
    leadOrigin,
    incidentNumber,
    subNumber,
    assignedDate,
    assignedOfficer,
    assignedBy,
    leadSummary,
    leadDescription,
  } = leadData;


  try {
    const response = await axios.post(
      "http://localhost:5000/api/lead/create", // Replace with your backend endpoint
      {
        leadNo: leadNumber,
        parentLeadNo: leadOrigin,
        incidentNo: incidentNumber,
        subNumber: subNumber,
        // associatedSubNumbers: [102, 103],
        assignedDate,
        assignedTo: assignedOfficer,
        assignedBy,
        summary: leadSummary,
        description: leadDescription,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );


    if (response.status === 201) {
      alert("Lead successfully added!");
      navigate("/LeadLog"); // Navigate to Lead Log page
    }
  } catch (error) {
    if (error.response) {
      // Handle known error messages from backend
      alert(`Error: ${error.response.data.message}`);
    } else {
      // Handle unexpected errors
      alert("An unexpected error occurred. Please try again.");
    }
  }
};  


  return (
    <div className="lead-instructions-page">
      {/* Navbar at the top */}
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
          <h2 className="title">LEAD INSTRUCTIONS</h2>
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
                  value={leadData.caseName || 'Main Street Murder'} // Display selected case name or an empty string
                  onChange={(e) => handleInputChange('caseName', e.target.value)} // Update 'caseName' in leadData
                  placeholder="Enter Case Name"
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


      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="next-btnlri" onClick={handleGenerateLead}>
          Create Lead
        </button>
        <button className="next-btnlri">Download PDF</button>
        <button className="next-btnlri">Print PDF</button>
      </div>
    </div>
  );
};
