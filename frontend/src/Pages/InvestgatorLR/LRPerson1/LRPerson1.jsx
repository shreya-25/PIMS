import React, { useContext, useState, useEffect} from 'react';

import { useLocation, useNavigate } from "react-router-dom";
import FootBar from '../../../components/FootBar/FootBar';
import Navbar from '../../../components/Navbar/Navbar';
import './LRPerson1.css';
import { CaseContext } from "../../CaseContext";


export const LRPerson1 = () => {
      useEffect(() => {
          // Apply style when component mounts
          document.body.style.overflow = "hidden";
      
          return () => {
            // Reset to default when component unmounts
            document.body.style.overflow = "auto";
          };
        }, []);
    const navigate = useNavigate(); // Initialize useNavigate hook
const location = useLocation();
const [username, setUsername] = useState("");

useEffect(() => {
   const loggedInUser = localStorage.getItem("loggedInUser");
   if (loggedInUser) {
     setUsername(loggedInUser);
   }
  })
    const [formData, setFormData] = useState({
      dateEntered: "",
      leadReturnId: "",
      lastName: "",
      firstName: "",
      mi: "",
      suffix: "",
      cellNumber: "",
      businessName: "",
      street1: "",
      street2: "",
      building: "",
      apartment: "",
      city: "",
      state: "",
      zipCode: "",
    });
  
    // Handle form input changes
    const handleChange = (field, value) => {
      setFormData({ ...formData, [field]: value });
    };
    const { leadDetails, caseDetails } = location.state || {};
  const { selectedCase, selectedLead, leadInstructions, leadReturns } = useContext(CaseContext);
  const onShowCaseSelector = (route) => {
    navigate(route, { state: { caseDetails } });
};

const [miscDetails, setMiscDetails] = useState([
    { description: "", details: "" },
  ]);

  const addNewRow = () => {
    setMiscDetails([...miscDetails, { description: "", details: "" }]);
  };

  const handleInputChange = (index, field, value) => {
    const updatedDetails = [...miscDetails];
    updatedDetails[index][field] = value;
    setMiscDetails(updatedDetails);
  };

    const getCasePageRoute = () => {
      if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
      return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };
  

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  // const handleNextPage = () => {
  //   navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  // };

    const handlePrevPage = () => {
    navigate('/LRInstruction'); // Replace '/nextpage' with the actual next page route
  };


  const handleSave = async () => {
    const token = localStorage.getItem("token");
  
    const payload = {
      leadNo: selectedLead?.leadNo,
      description: selectedLead?.leadName,
      caseNo: selectedCase?.caseNo,
      caseName: selectedCase?.caseName,
      enteredBy: username, 
      enteredDate: formData.dateEntered,
      leadReturnId: formData.leadReturnId,
  
      lastName: formData.lastName,
      firstName: formData.firstName,
      middleInitial: formData.mi,
      suffix: formData.suffix,
      cellNumber: formData.cellNumber,
      businessName: formData.businessName,
      address: {
        street1: formData.street1,
        street2: formData.street2,
        building: formData.building,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      },
  
      // Optional: Extend this with other fields once you connect them in your form
      // ssn: formData.ssn,
      // age: formData.age,
      // email: formData.email,
      // occupation: formData.occupation,
      // personType: formData.personType,
      // etc...
  
      additionalData: miscDetails, // Store all misc rows
    };

    console.log(payload);
  
    try {
      const response = await fetch('http://localhost:5000/api/lrperson/lrperson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
  
      if (response.ok) {
        const data = await response.json();
        alert('Entry saved successfully');
      } else {
        const errorMessage = await response.text();
        alert('Failed to save entry: ' + errorMessage);
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert('An error occurred while saving the entry.');
    }
  };
  
  
  return (
    <div className="person-page">
      {/* Navbar at the top */}
      <Navbar />

      <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item" onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item active" onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" >
            Enclosures
          </span>
          <span className="menu-item" >
            Evidence
          </span>
          <span className="menu-item" >
            Pictures
          </span>
          <span className="menu-item" >
            Audio
          </span>
          <span className="menu-item" >
            Videos
          </span>
          <span className="menu-item" >
            Scratchpad
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" >
            Finish
          </span>
         </div>
       </div>

       <div className="LRI_Content">
       <div className="sideitem">
       <ul className="sidebar-list">
                   
                   <li className="sidebar-item">Case Information</li>
         <li className="sidebar-item" onClick={() => navigate(getCasePageRoute())}>Case Page</li>
         <li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>
             New Lead
           </li>                       {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>New Lead</li> */}
                      <li className="sidebar-item" onClick={() => navigate('/SearchLead')}>Search Lead</li>
                      <li className="sidebar-item active" >View Lead Return</li>
                      <li className="sidebar-item"onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>View Lead Chain of Custody</li>
             <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>
             View Lead Log
           </li>
           {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
             Officer Management
           </li> */}
           <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
             View/Add Case Notes
           </li>
           {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
             View Lead Hierarchy
           </li>
           <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
             Generate Report
           </li> */}
           <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>
             View Flagged Leads
           </li>
           <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>
             View Timeline Entries
           </li>
           {/* <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li> */}

           <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
           <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

         </ul>
                </div>
                <div className="left-content">
   
                <div className = "LRI-content-section">

<div className = "content-subsection">

     {/* Main Content */}
     {/* <div className="form-container1"> */}
        <table className="person-table2">
          <tbody>
            <tr>
              <td>Date Entered *</td>
              <td>
                <input
                  type="date"
                  value={formData.dateEntered}
                  className="input-large"
                  onChange={(e) => handleChange("dateEntered", e.target.value)}
                />
              </td>
              <td>Lead Return Id *</td>
              <td>
                <input
                  type="leadReturn"
                  value={formData.leadReturnId}
                  className="input-large"
                  onChange={(e) => handleChange("leadReturnId", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Last Name *</td>
              <td>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
              </td>
              <td>First Name *</td>
              <td>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>MI</td>
              <td>
                <input
                  type="text"
                  value={formData.mi}
                  onChange={(e) => handleChange("mi", e.target.value)}
                />
              </td>
              <td>Suffix</td>
              <td>
                <input
                  type="text"
                  value={formData.suffix}
                  onChange={(e) => handleChange("suffix", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Cell Number</td>
              <td>
                <input
                  type="text"
                  value={formData.cellNumber}
                  onChange={(e) => handleChange("cellNumber", e.target.value)}
                />
              </td>

              <td>Business Name</td>
              <td>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Street 1</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.street1}
                  onChange={(e) => handleChange("street1", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Street 2</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.street2}
                  onChange={(e) => handleChange("street2", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Building</td>
              <td>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => handleChange("building", e.target.value)}
                />
              </td>
              <td>Apartment</td>
              <td>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => handleChange("apartment", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>City</td>
              <td>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </td>
              <td>State</td>
              <td>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Zip Code</td>
              <td colSpan="1">
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                />
              </td>
              <td>Age</td>
              <td><input type="text" /></td>

            </tr>

            <tr>
              <td>SSN</td>
              <td><input type="text" /></td>
              
              <td>Occupation</td>
              <td><input type="text" /></td>
            </tr>

                {/* Second Row */}
                <tr>
              <td>Email</td>
              <td colSpan="3"><input type="email" /></td>
            </tr>

            {/* Fourth Row */}
            <tr>
              <td>Person Type</td>
              <td><select><option>Type</option></select></td>
              <td>Condition</td>
              <td><select><option>Condition</option></select></td>
            </tr>

            {/* Fifth Row */}
            <tr>
              <td>Caution Type</td>
              <td><select><option>Type</option></select></td>
              <td>Sex</td>
              <td><select><option>Male</option><option>Female</option></select></td>
            </tr>

            {/* Sixth Row */}
            <tr>
              <td>Race</td>
              <td><select><option>Race</option></select></td>
              <td>Ethnicity</td>
              <td><select><option>Ethnicity</option></select></td>
            </tr>

            {/* Seventh Row */}
            <tr>
              <td>Skin Tone</td>
              <td><select><option>Skin Tone</option></select></td>
              <td>Eye Color</td>
              <td><select><option>Eye Color</option></select></td>
            </tr>

            {/* Eighth Row */}
            <tr>
              <td>Glasses</td>
              <td><select><option>Yes</option><option>No</option></select></td>
              <td>Hair Color</td>
              <td><select><option>Hair Color</option></select></td>
            </tr>

            {/* Ninth Row */}
            <tr>
              <td>Height</td>
              <td>
                <input type="text" style={{ width: "40px" }} /> '
                <input type="text" style={{ width: "40px" }} /> "
              </td>
              <td>Weight</td>
              <td><input type="text" /></td>
            </tr>

            {/* Miscellaneous Section */}
            <tr>
              <td colSpan="4">
                <h4>Miscellaneous Information</h4>
                <table className="misc-table">
                <tbody>
            {miscDetails.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) =>
                      handleInputChange(index, "description", e.target.value)
                    }
                  />
                </td>
                <td>
                  <textarea
                    rows="2"
                    value={row.details}
                    onChange={(e) =>
                      handleInputChange(index, "details", e.target.value)
                    }
                  ></textarea>
                </td>
              </tr>
                  ))}
          </tbody>
        </table>
              </td>
            </tr>
          </tbody>
        </table>
        

        {/* Buttons */}
        <div className="form-buttons">
       
          <button className="save-btn1" onClick={handleSave}>Save</button>
          {/* <button className="cancel-btn">Cancel</button> */}
        </div>
      {/* </div> */}
        
      </div>
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVehicle")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};