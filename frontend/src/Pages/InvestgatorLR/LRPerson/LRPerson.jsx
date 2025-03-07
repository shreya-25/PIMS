
import FootBar from '../../../components/FootBar/FootBar';
import React, { useContext, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CaseContext } from "../../CaseContext";
import axios from "axios";
import PersonModal from "../../../components/PersonModal/PersonModel";

import Navbar from '../../../components/Navbar/Navbar';
import './LRPerson.css';

export const LRPerson = () => {
    const navigate = useNavigate(); // Initialize useNavigate hook
       const location = useLocation();
          
        const { leadDetails, caseDetails } = location.state || {};
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState("");
            const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);

               // State to control the modal
                    const [showPersonModal, setShowPersonModal] = useState(false);
                
                    // We’ll store the leadReturn info we need for the modal
                    const [personModalData, setPersonModalData] = useState({
                      leadNo: "",
                      description: "",
                      caseNo: "",
                      caseName: "",
                      leadReturnId: "",
                    });
            
                     // Function to open the modal, passing the needed data
                const openPersonModal = (leadNo, description, caseNo, caseName, leadReturnId) => {
                  setPersonModalData({ leadNo, description, caseNo, caseName, leadReturnId });
                  setShowPersonModal(true);
                };
              
                // Function to close the modal
                const closePersonModal = () => {
                  setShowPersonModal(false);
                };

    const [persons, setPersons] = useState([
      { returnId: 1,dateEntered: "01/01/2024", name: "John Doe", phoneNo: "123-456-7890", address: "123 Main St, NY" },
      {  returnId: 1, dateEntered: "01/05/2024", name: "Jane Smith", phoneNo: "987-654-3210", address: "456 Elm St, CA" },
      {  returnId: 2,dateEntered: "01/10/2024", name: "Mike Johnson", phoneNo: "555-789-1234", address: "789 Pine St, TX" },
      { returnId: 2,dateEntered: "01/15/2024", name: "Emily Davis", phoneNo: "111-222-3333", address: "321 Maple St, FL" },
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
        <div className="person-page-content">
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

       <div className="main-content-cl">
        {/* Left Section */}
        <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo-lr"
          />
        </div>


        {/* Center Section */}
        <div className="center-section">
          <h2 className="title">LEAD PERSONS DETAILS</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>

     {/* Main Table */}
     <div className="table-container1">
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Associated Return Id </th>
              <th>Name</th>
              <th>Phone No</th>
              <th>Address</th>
              <th>Additional Details</th>
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
                <td>{person.returnId}</td>  
                <td>{person.name}</td>
                <td>{person.phoneNo}</td>
                <td>{person.address}</td>
                <td>  <button className="download-btn" onClick={() =>
                              openPersonModal(
                                selectedLead.leadNo,
                                selectedLead.description,
                                selectedCase.caseNo,
                                selectedCase.caseName,
                                person.leadReturnId
                              )
                            }>View</button></td>
                            <PersonModal
  isOpen={showPersonModal}
  onClose={closePersonModal}
  leadNo={personModalData.leadNo}
  description={personModalData.description}
  caseNo={personModalData.caseNo}
  caseName={personModalData.caseName}
  leadReturnId={personModalData.leadReturnId}
/>
              </tr>
            ))}
          </tbody>
        </table>
        {/* <button onClick={() => handleNavigation('/LRPerson1')} className="save-btn1
        ">Add Person</button> */}

      </div>

      {/* Action Buttons */}
      {/* <div className="action-buttons">
        <button onClick={() => handleNavigation('/LRPerson1')} >Add Person</button>
        <button onClick={handleEditPerson}>Edit</button>
        <button onClick={handleDeletePerson}>Delete</button>
      </div> */}

      {/* Bottom Buttons */}
      <div className="bottom-buttons">
      <button onClick={() => handleNavigation('/LRPerson1')} className="save-btn1">Add Person</button>

      {/* <button onClick={() => handleNavigation('/LRPerson1')} className="back-btn">Add Person</button> */}
        {/* <button className="back-btn"onClick={() => handleNavigation('/LRReturn')} >Back</button>
        <button className="next-btn"onClick={() => handleNavigation('/LRVehicle')} >Next</button> */}
        {/* <button className="save-btn">Save</button>
        <button className="cancel-btn">Cancel</button> */}
      </div>
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVehicle")} // Takes user to CM Return page
      />
    </div>
  );
};