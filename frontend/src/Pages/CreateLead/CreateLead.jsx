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
const caseDetails = location.state?.caseDetails || {}; // Get case details
const { id: caseID, title: caseName } = caseDetails;  // Extract Case ID & Case Title




  // State for all input fields
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


  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [availableSubNumbers, setAvailableSubNumbers] = useState([
    "SUB-000001", "SUB-000002", "SUB-000003", "SUB-000004", "SUB-000005"
  ]); // Static List of Subnumbers
  
  const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]); // Selected Subnumbers
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  const getFormattedDate = () => {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

useEffect(() => {
  const fetchMaxLeadNumber = async () => {
    try {
      // Ensure caseDetails exists before proceeding.
      if (!caseDetails) return;

      // Destructure case details
      const { id: caseNo, title: caseName } = caseDetails;

      // Special case: if the case is "Main Street Theft", use predefined values.
      if (caseName === "Main Street Theft") {
        setLeadData((prevData) => ({
          ...prevData,
          leadNumber: "1",
          subNumber: `SUB-${"1".padStart(6, '0')}`,
          incidentNumber:`INC-${"1".padStart(6, '0')}`,
          assignedDate: getFormattedDate(),
        }));
        return; // Prevent API call for this case.
      }

      // Otherwise, fetch the max lead number using the caseNo and caseName.
      const response = await axios.get(
        `http://localhost:5000/api/lead/maxLeadNumber?caseNo=${caseNo}&caseName=${encodeURIComponent(caseName)}`
      );
      const maxLeadNo = response.data.maxLeadNo || 0;
      const newLeadNumber = maxLeadNo + 1;

      setLeadData((prevData) => ({
        ...prevData,
        leadNumber: newLeadNumber.toString(),
        subNumber: `SUB-${newLeadNumber.toString().padStart(6, '0')}`,
        assignedDate: getFormattedDate(),
        incidentNumber :  `INC-${newLeadNumber.toString().padStart(6, '0')}`,
      }));
    } catch (error) {
      console.error("Error fetching max lead number:", error);
    }
  };

  fetchMaxLeadNumber();
}, [caseDetails]);


 

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
    caseName,
    caseNo,
    leadNumber,
    leadOrigin,
    incidentNumber,
    subNumber,
    associatedSubNumbers,
    assignedDate,
    dueDate,
    assignedOfficer,
    assignedBy,
    leadSummary,
    leadDescription,
  } = leadData;

  try {
    const response = await axios.post(
      "http://localhost:5000/api/lead/create", // Replace with your backend endpoint
      {
        caseName:  caseDetails.title,
        caseNo: caseDetails.id,
        leadNo: leadNumber,
        parentLeadNo: leadOrigin,
        incidentNo: incidentNumber,
        subNumber: subNumber,
        associatedSubNumbers: associatedSubNumbers,
        dueDate,
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
      navigate(-1); // Navigate to Lead Log page
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

const defaultCaseSummary = "Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.";


const [caseSummary, setCaseSummary] = useState('' ||  defaultCaseSummary);

  const [isEditing, setIsEditing] = useState(false); // Controls whether the textarea is editable
  useEffect(() => {
   const fetchCaseSummary = async () => {
     try {
       if (caseDetails && caseDetails.id) {
         const token = localStorage.getItem("token");
         const response = await axios.get(`http://localhost:5000/api/cases/summary/${caseDetails.id}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         // Update case summary if data is received
         console.log("Response data:", response.data);
         if (response.data) {
           setCaseSummary(response.data.summary );
         }
       }
     } catch (error) {
       console.error("Error fetching case summary:", error);
     }
   };

   fetchCaseSummary();
 }, [caseDetails]);



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
              <td>Case No:

              </td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={caseDetails?.id
                     || '65734'} // Display selected case name or an empty string
                  onChange={(e) => handleInputChange('caseName', e.target.value)} // Update 'caseName' in leadData
                  placeholder="Enter Case No"
    />
              </td>
            </tr>
            <tr>
              <td>Case Name:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={caseDetails?.title
                     || 'Bank Robbery Investigation'} // Display selected case name or an empty string
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
                  value={caseSummary}
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
      value={leadData.dueDate}
      onChange={(e) => handleInputChange('dueDate', e.target.value)}
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


      {/* Action Buttons */}
      <div className="btn-sec-cl">
        <button className="next-btncl" onClick={handleGenerateLead}>
          Create Lead
        </button>
        <button className="next-btncl">Download</button>
        <button className="next-btncl">Print</button>
      </div>
    </div>
  );
};
