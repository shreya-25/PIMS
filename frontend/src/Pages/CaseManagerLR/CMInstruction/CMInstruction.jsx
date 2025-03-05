import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

import Navbar from '../../../components/Navbar/Navbar';
import FootBar from '../../../components/FootBar/FootBar';
import './CMInstruction.css';
import axios from "axios";
import { CaseContext } from "../../CaseContext";



export const CMInstruction = () => {
    const navigate = useNavigate(); 
    const location = useLocation();
     const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");
    
        const { caseDetails, leadDetails } = location.state || {};

        const handleLRClick = () => {
          navigate("/CMReturn", { state: {caseDetails, leadDetails } });
        };

          const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);

  
  const [leadData, setLeadData] = useState({
    leadNumber: '',
    parentLeadNo: '',
    incidentNo: '',
    subNumber: '',
    associatedSubNumbers: [],
    assignedDate: '',
    dueDate: '',
    summary: '',
    assignedBy: '',
    leadDescription: '',
    assignedTo: [],
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [availableSubNumbers, setAvailableSubNumbers] = useState([
      "SUB-000001", "SUB-000002", "SUB-000003", "SUB-000004", "SUB-000005"
    ]); // Static List of Subnumbers
    
    const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]); // Selected Subnumbers
    const [subDropdownOpen, setSubDropdownOpen] = useState(false);

    const [assignedOfficers, setAssignedOfficers] = useState([]);


  const handleInputChange = (field, value) => {
    setLeadData({ ...leadData, [field]: value });
  };

    useEffect(() => {
      if (leadData.associatedSubNumbers) {
        setAssociatedSubNumbers(leadData.associatedSubNumbers);
      }
    }, [leadData]);

    useEffect(() => {
      if (leadData.assignedTo) {
        setAssignedOfficers(leadData.assignedTo);
      }
    }, [leadData]);
    
console.log(selectedLead);
  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        if (selectedLead?.leadNo && selectedLead?.leadName && selectedLead?.caseNo && selectedLead?.caseName) {
          const token = localStorage.getItem("token");
          console.log("localstorage data",localStorage.getItem("token"));

          const response = await axios.get(`http://localhost:5000/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(
            selectedLead.leadName)}/${selectedLead.caseNo}/${encodeURIComponent(selectedLead.caseName)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

          console.log("Fetched Lead Data1:", response.data);

          if (response.data.length > 0) {
            setLeadData({
              ...response.data[0], 
              assignedOfficer: response.data[0].assignedOfficer || [] // Ensure array
            });
          }
          
        }
      } catch (err) {
        console.error("Error fetching lead data:", err);
        setError("Failed to fetch lead data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [selectedLead]);

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
  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  const handleNextPage = () => {
    navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  };
  
  return (
    <div className="person-page">
      {/* Navbar at the top */}
      <Navbar />

      <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item active" onClick={() => handleNavigation('/CMInstruction')}>
            Instructions
          </span>
          <span className="menu-item" onClick={() =>   handleLRClick()}>
            Returns
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMPerson')} >
            Person
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/CMVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMEnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMEvidence')} >
            Evidence
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/CMPictures')} >
            Pictures
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/CMAudio')} >
            Audio
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMVideo')}>
            Videos
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMScratchpad')}>
            Scratchpad
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMFinish')}>
            Finish
          </span>
         </div>
       </div>

      <div className="main-content-cl">
        {/* Left Section */}
        <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
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
                    className="input-field"
                    value={selectedLead.leadNo}
                    onChange={(e) => handleInputChange('leadNumber', e.target.value)}
                    placeholder=""
                  />
                </td>
              </tr>
              <tr>
                <td>INCIDENT NUMBER:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.incidentNo}
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
                    onChange={(e) => handleInputChange('subNumber', e.target.value)}
                    placeholder=""
                  />
                </td>
              </tr>
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
              <td className="info-label">Case Name:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={selectedLead.caseName} // Display selected case name or an empty string
                  onChange={(e) => handleInputChange('caseName', e.target.value)} // Update 'caseName' in leadData
                  placeholder=""
    />
              </td>
            </tr>
            <tr>
              <td className="info-label">Lead Description:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={selectedLead.leadName}
                  onChange={(e) => handleInputChange('leadSummary', e.target.value)}
                  placeholder=""
                />
              </td>
            </tr>
            <tr>
                <td className="info-label">Lead Origin:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.parentLeadNo}
                    onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                    placeholder=""
                  />
                </td>
              </tr>
              <tr>
  <td className="info-label">Associated Subnumbers:</td>
  <td>
    <div className="custom-dropdown">
      <div
        className="dropdown-header"
        onClick={() => setSubDropdownOpen(!subDropdownOpen)}
      >
        {associatedSubNumbers.length > 0
          ? associatedSubNumbers.join(", ")
          : "NA"}
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
                  const updatedSubs = e.target.checked
                    ? [...associatedSubNumbers, e.target.value]
                    : associatedSubNumbers.filter((num) => num !== e.target.value);

                  setAssociatedSubNumbers(updatedSubs); // Update dropdown selection
                  setLeadData((prevData) => ({
                    ...prevData,
                    associatedSubNumbers: updatedSubs, // Update leadData
                  }));
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
  <td className="info-label">Assigned Officers:</td>
  <td>
    <div className="custom-dropdown">
      <div
        className="dropdown-header"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {assignedOfficers.length > 0
          ? assignedOfficers.join(", ")
          : "NA"}
        <span className="dropdown-icon">{dropdownOpen ? "▲" : "▼"}</span>
      </div>
      {dropdownOpen && (
        <div className="dropdown-options">
          {["Officer 99", "Officer 24", "Officer 1", "Officer 2", "Officer 3"].map((officer) => (
            <div key={officer} className="dropdown-item">
              <input
                type="checkbox"
                id={officer}
                value={officer}
                checked={assignedOfficers.includes(officer)}
                onChange={(e) => {
                  const updatedOfficers = e.target.checked
                    ? [...assignedOfficers, e.target.value]
                    : assignedOfficers.filter((o) => o !== e.target.value);

                  setAssignedOfficers(updatedOfficers); // Update UI state
                  setLeadData((prevData) => ({
                    ...prevData,
                    assignedTo: updatedOfficers, // Ensure backend gets updated
                  }));
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
                  <td className="info-label">Assigned By:</td>
                  <td>
                    <input
                      type="text"
                      className="input-field"
                      value={leadData.assignedBy}
                      onChange={(e) => handleInputChange('assignedBy', e.target.value)}
                      placeholder=""
                    />
                  </td>
                </tr>
                <tr>
                  <td className="info-label">Lead Summary:</td>
                  <td>
                    <textarea
                      className="textarea-field"
                      value={leadData.summary}
                      onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                      placeholder=""
                    ></textarea>
                  </td>
                </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      {/* <div className="form-buttons-inst">
        <button className="edit-btn" onClick={handleGenerateLead}>
          Edit
        </button>
        <button className="next-btn" onClick={handleNextPage}>Next</button>
        <button className="next-btn" onClick={handleNextPage}>Save</button>
        <button className="next-btn" onClick={handleNextPage}>Cancel</button>


      </div> */}
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => handleLRClick()} // Takes user to CM Return page
      />
    </div>
  );
};