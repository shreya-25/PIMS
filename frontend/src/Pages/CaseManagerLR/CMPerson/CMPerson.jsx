import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

import Navbar from '../../../components/Navbar/Navbar';
import './CMPerson.css';

export const CMPerson = () => {
    const navigate = useNavigate(); // Initialize useNavigate hook

    const [persons, setPersons] = useState([
      { dateEntered: "01/01/2024", name: "John Doe", phoneNo: "123-456-7890", address: "123 Main St, NY" },
      { dateEntered: "01/05/2024", name: "Jane Smith", phoneNo: "987-654-3210", address: "456 Elm St, CA" },
      { dateEntered: "01/10/2024", name: "Mike Johnson", phoneNo: "555-789-1234", address: "789 Pine St, TX" },
      { dateEntered: "01/15/2024", name: "Emily Davis", phoneNo: "111-222-3333", address: "321 Maple St, FL" },
    ]);
  
    const [selectedRow, setSelectedRow] = useState(null);
  
    const handleAddPerson = () => {
      setPersons([...persons, { dateEntered: "", name: "", phoneNo: "", address: "" }]);
    };
  
    const handleEditPerson = () => {
      if (selectedRow === null) {
        alert("Please select a row to edit.");
        return;
      }
      const newName = prompt("Enter new name:", persons[selectedRow].name);
      if (newName !== null) {
        const updatedPersons = [...persons];
        updatedPersons[selectedRow].name = newName;
        setPersons(updatedPersons);
      }
    };
  
    const handleDeletePerson = () => {
      if (selectedRow === null) {
        alert("Please select a row to delete.");
        return;
      }
      if (window.confirm("Are you sure you want to delete this person?")) {
        setPersons(persons.filter((_, index) => index !== selectedRow));
        setSelectedRow(null);
      }
    };
  
  
  const [leadData, setLeadData] = useState({
    leadNumber: '16',
    leadOrigin: '7',
    incidentNumber: 'C000006',
    subNumber: 'C0000045',
    assignedDate: '09/29/24',
    leadSummary: 'Interview Mr. John',
    assignedBy: 'Officer 5',
    leadDescription: 'Mr. John was in California on Saturday, details verifyed from delta airlines',
    assignedOfficer: ['Officer 1','Officer 2'],
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

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  // const handleNextPage = () => {
  //   navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  // };

    const handlePrevPage = () => {
    navigate('/LRInstruction'); // Replace '/nextpage' with the actual next page route
  };
  
  return (
    <div className="person-page">
      {/* Navbar at the top */}
      <Navbar />

      <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item" onClick={() => handleNavigation('/CMInstruction')}>
            Instructions
          </span>
          <span className="menu-item " onClick={() => handleNavigation('/CMReturn')}>
            Returns
          </span>
          <span className="menu-item active" onClick={() => handleNavigation('/CMPerson')} >
            Person
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMEnclosures')}>
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMEvidence')}>
            Evidence
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMPictures')}>
            Pictures
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMAudio')}>
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

     {/* Main Table */}
     <div className="table-container1">
        <table className="person-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Name</th>
              <th>Phone No</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {persons.map((person, index) => (
              <tr
                key={index}
                className={selectedRow === index ? "selected-row" : ""}
                onClick={() => setSelectedRow(index)}
              >
                <td>{person.dateEntered}</td>
                <td>{person.name}</td>
                <td>{person.phoneNo}</td>
                <td>{person.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      {/* <div className="action-buttons">
        <button onClick={() => handleNavigation('/LRPerson1')} >Add Person</button>
        <button onClick={handleEditPerson}>Edit</button>
        <button onClick={handleDeletePerson}>Delete</button>
      </div> */}

      {/* Bottom Buttons */}
      <div className="bottom-buttons">
      <button onClick={() => handleNavigation('/LRPerson1')} className="back-btn">Add Person</button>
        <button className="back-btn"onClick={() => handleNavigation('/LRReturn')} >Back</button>
        <button className="next-btn"onClick={() => handleNavigation('/LRVehicle')} >Next</button>
        <button className="save-btn">Save</button>
        <button className="cancel-btn">Cancel</button>
      </div>
    </div>
  );
};