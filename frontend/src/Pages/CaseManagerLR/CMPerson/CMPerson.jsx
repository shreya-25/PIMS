import React, { useContext, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CaseContext } from "../../CaseContext";
import Navbar from '../../../components/Navbar/Navbar';
import './CMPerson.css';
import axios from "axios";
import FootBar from '../../../components/FootBar/FootBar';
import PersonModal from "../../../components/PersonModal/PersonModel";


export const CMPerson = () => {
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
      { leadReturnId: "", dateEntered: "", name: "", phoneNo: "", address: "" },
      // { dateEntered: "01/05/2024", name: "Jane Smith", phoneNo: "987-654-3210", address: "456 Elm St, CA" },
      // { dateEntered: "01/10/2024", name: "Mike Johnson", phoneNo: "555-789-1234", address: "789 Pine St, TX" },
      // { dateEntered: "01/15/2024", name: "Emily Davis", phoneNo: "111-222-3333", address: "321 Maple St, FL" },
    ]);
  
    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
      const fetchLeadData = async () => {
        try {
          if (selectedLead?.leadNo && selectedLead?.leadName && selectedLead?.caseNo && selectedLead?.caseName)  {
            const token = localStorage.getItem("token");
  
            const response = await axios.get(`http://localhost:5000/api/lrperson/lrperson/${selectedLead.leadNo}/${encodeURIComponent(
              selectedLead.leadName)}/${selectedLead.caseNo}/${encodeURIComponent(selectedLead.caseName)}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
  
            console.log("Fetched Lead RR1:", response.data);

            setPersons(response.data.length > 0 ? response.data : []);

  
            // if (response.data.length > 0) {
            //   setReturns({
            //     ...response.data[0], 
            //   });
            // }
            
          }
        } catch (err) {
          console.error("Error fetching person data:", err);
          setError("Failed to fetch lead data.");
        } finally {
          setLoading(false);
        }
      };
  
      fetchLeadData();
    }, [leadDetails, caseDetails]);
  
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
 
    const handleAccessChange = (index, newAccess) => {
      setPersons((prevPersons) =>
        prevPersons.map((person, i) =>
          i === index ? { ...person, access: newAccess } : person
        )
      );
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
            <th>Associated Return Id</th>
              <th>Date Entered</th>
              <th>Name</th>
              <th>Phone No</th>
              <th>Address</th>
              <th>Access</th>
              <th>Additional Details</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
  {persons.map((person, index) => (
    <tr
      key={index}
      className={selectedRow === index ? "selected-row" : ""}
      onClick={() => setSelectedRow(index)}
    >
      <td>{person.leadReturnId}</td>
      <td>{person.enteredDate}</td>
      <td>
        {person.firstName
          ? `${person.firstName || ''}, ${person.lastName || ''}`
          : "N/A"}
      </td>
      <td>{person.cellNumber}</td>
      <td>
        {person.address
          ? `${person.address.street1 || ''}, ${person.address.city || ''}, ${person.address.state || ''}, ${person.address.zipCode || ''}`
          : "N/A"}
      </td>
      <td>
        <select
          value={person.access || "Case Manager"}
          onChange={(e) => handleAccessChange(index, e.target.value)} // Pass index properly
        >
          <option value="Case Manager">Case Manager</option>
          <option value="Everyone">Everyone</option>
        </select>
      </td>
      <td>  <button className="download-btn" onClick={() =>
                              openPersonModal(
                                selectedLead.leadNo,
                                selectedLead.description,
                                selectedCase.caseNo,
                                selectedCase.caseName,
                                person.leadReturnId
                              )
                            }>View</button></td>
                            <td>
        <div className="lr-table-btn">
          <button className="save-btn1" >Edit</button>
          <button className="del-button" >Delete</button>
        </div>
      </td>
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
      <button onClick={() => handleNavigation('/CMPerson1')} className="save-btn1">Add Person</button>
        {/* <button className="back-btn"onClick={() => handleNavigation('/LRReturn')} >Back</button>
        <button className="next-btn"onClick={() => handleNavigation('/LRVehicle')} >Next</button>
        <button className="save-btn">Save</button>
        <button className="cancel-btn">Cancel</button> */}
      </div>

      <div className = "content-to-add">
     
     <h4 className="return-form-h4"> Add Comment</h4>
       <div className="return-form">
         <textarea
          //  value={returnData.results}
          //  onChange={(e) => handleInputChange("results", e.target.value)}
           placeholder="Enter comments"
         ></textarea>
       </div>

       <div className="form-buttons-return">
         <button className="save-btn1">Add Comment</button>
         {/* <button className="back-btn" onClick={() => handleNavigation("/LRPerson")}>Back</button>
         <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>Next</button>
         <button className="cancel-btn" onClick={() => setReturnData({ results: "" })}>Cancel</button> */}
       </div>
</div>

      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVehicle")} // Takes user to CM Return page
      />
    </div>
  );
};