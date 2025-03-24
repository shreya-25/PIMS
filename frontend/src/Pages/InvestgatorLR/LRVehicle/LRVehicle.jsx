import './LRVehicle.css';
import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from '../../../components/Navbar/Navbar';
import FootBar from '../../../components/FootBar/FootBar';
import VehicleModal from "../../../components/VehicleModal/VehicleModel";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import { useDataContext } from "../../Context/DataContext"; // Import Context
import { useLocation, useNavigate } from 'react-router-dom';
import Comment from "../../../components/Comment/Comment";

export const LRVehicle = () => {

  const navigate = useNavigate(); // Initialize useNavigate hook
    const location = useLocation();
   const { leadDetails, caseDetails } = location.state || {};
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");

      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date)) return "";
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const year = date.getFullYear().toString().slice(-2);
        return `${month}/${day}/${year}`;
      };

       const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };
      
    

  const [vehicles, setVehicles] = useState([
    {  returnId: 1,dateEntered: "01/01/2024", year: "2023", make: "Honda", model: "Accord",color: "Blue", vin: "123456", plate: "XYZ-1234", state: "NY" },
    {  returnId: 1,dateEntered: "01/05/2024", year: "2022", make: "Toyota", model: "Camry", color: "Black",vin: "654321", plate: "ABC-5678", state: "CA" },
    { returnId: 2, dateEntered: "01/10/2024", year: "2021", make: "Ford", model: "F-150", color: "White",vin: "789012", plate: "DEF-9101", state: "TX" },
    {  returnId: 2,dateEntered: "01/15/2024", year: "2024", make: "Tesla", model: "Model 3", color: "Red",vin: "345678", plate: "TES-2024", state: "FL" },
  ]);
   const [vehicleModalData, setVehicleModalData] = useState({
        leadNo: "",
        description: "",
        caseNo: "",
        caseName: "",
        leadReturnId: "",
        leadsDeskCode: "",
      });
      
                    const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);
        
 const openVehicleModal = (leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode) => {
      setVehicleModalData({
        leadNo,
        description,
        caseNo,
        caseName,
        leadReturnId,
        leadsDeskCode,
      });
      setShowVehicleModal(true); // Ensure this state exists
    };

    const closeVehicleModal = () => {
      setVehicleModalData({
        leadNo: "",
        description: "",
        caseNo: "",
        caseName: "",
        leadReturnId: "",
        leadsDeskCode: "",
      });
      setShowVehicleModal(false);
    };
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    
  const [vehicleData, setVehicleData] = useState({
    year: '',
    make: '',
    model: '',
    plate: '',
    category: '',
    type: '',
    color:'',
    vin: '',
    primaryColor: '',
    secondaryColor: '',
    state: '',
    information: '',
  });

  const handleChange = (field, value) => {
    setVehicleData({ ...vehicleData, [field]: value });
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  const handleAddVehicle = () => {
    const newVehicle = {
      dateEntered: new Date().toLocaleDateString(),
      year: vehicleData.year,
      make: vehicleData.make,
      model: vehicleData.model,
      color: vehicleData.color,
      vn: vehicleData.vin,
      plate: vehicleData.plate,
      state: vehicleData.state,
    };

    // Add the new vehicle to the list
    setVehicles([...vehicles, newVehicle]);

    // Clear the form fields
    setVehicleData({
      year: '',
      make: '',
      model: '',
      plate: '',
      category: '',
      type: '',
      color:'',
      vin: '',
      primaryColor: '',
      secondaryColor: '',
      state: '',
      information: '',
    });
  };



  return (
    // <div className="lrvehicle-container">
    <div className="person-page">
        <div className="person-page-content">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item " onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRPerson')}>
            Person
          </span>
          <span className="menu-item active" onClick={() => handleNavigation('/LRVehicle')}>
            Vehicles
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRScratchpad')}>
            Scratchpad
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div>
       </div>

       <div className="LRI_Content">
      <div className="sideitem">
                    <ul className="sidebar-list">
                   {/* Lead Management Dropdown */}
                   <li className="sidebar-item" onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Management {leadDropdownOpen ?  "▼" : "▲"}
        </li>
        {leadDropdownOpen && (
          <ul className="dropdown-list1">
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>
              New Lead
            </li>
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              View Lead Chain of Custody
            </li>
          </ul>
        )} 
                            {/* Case Information Dropdown */}
        <li className="sidebar-item" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Management {caseDropdownOpen ? "▼" : "▲" }
        </li>
        {caseDropdownOpen && (
          <ul className="dropdown-list1">
              <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
              <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>
              View Lead Log
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li>
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
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
        )}
                    </ul>
                </div>

                <div className="left-content">

                <div className="case-header">
          <h2 className="">VEHICLE INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Vehicle Form */}
        <div className = "timeline-form-sec">
        <div className="vehicle-form">
          <div className="form-row4">
            <label>Year:</label>
            <input
              type="text"
              value={vehicleData.year}
              onChange={(e) => handleChange('year', e.target.value)}
            />
            <label>Make:</label>
            <input
              type="text"
              value={vehicleData.make}
              onChange={(e) => handleChange('make', e.target.value)}
            />
            <label>Model:</label>
            <input
              type="text"
              value={vehicleData.model}
              onChange={(e) => handleChange('model', e.target.value)}
            />
          </div>
          {/* <label>Color:</label>
            <input
              type="text"
              value={vehicleData.color}
              onChange={(e) => handleChange('color', e.target.value)}
            /> */}
          
          <div className="form-row4">
            <label>Plate:</label>
            <input
              type="text"
              value={vehicleData.plate}
              onChange={(e) => handleChange('plate', e.target.value)}
            />
            <label>Category:</label>
            <input
              type="text"
              value={vehicleData.category}
              onChange={(e) => handleChange('category', e.target.value)}
            />
            <label>Type:</label>
            <input
              type="text"
              value={vehicleData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            />
          </div>
          <div className="form-row4">
            <label>VIN:</label>
            <input
              type="text"
              value={vehicleData.vn}
              onChange={(e) => handleChange('vn', e.target.value)}
            />
            <label>Primary Color:</label>
            <input
              type="text"
              value={vehicleData.primaryColor}
              onChange={(e) => handleChange('primaryColor', e.target.value)}
            />
            <label>Second Color:</label>
            <input
              type="text"
              value={vehicleData.secondaryColor}
              onChange={(e) => handleChange('secondaryColor', e.target.value)}
            />
          </div>
        </div>
        <div className="vehicle-form">
          <div className="form-row2">
            <label>State:</label>
            <input
              type="text"
              value={vehicleData.state}
              onChange={(e) => handleChange('state', e.target.value)}
            />
          </div>
          <div className="form-row1">
            <label>Information:</label>
            <textarea
              value={vehicleData.information}
              onChange={(e) => handleChange('information', e.target.value)}
            ></textarea>
          </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="form-buttons">
        <button className="save-btn1" onClick={handleAddVehicle}>
            Add Vehicle
          </button>
          {/* <button className="back-btn">Back</button>
          <button className="next-btn">Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button> */}
        </div>

             {/* Vehicle Table */}
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>Date Entered</th>
              <th style={{ width: "10%" }}>Return Id</th>
              <th>Year</th>
              <th>Make</th>
              <th>Model</th>
              <th>Color</th>
              <th>State</th>
              <th style={{ width: "15%" }}>Additional Details</th>
              <th style={{ width: "12%" }}></th>
            </tr>
          </thead>
          <tbody>
    {vehicles.map((vehicle, index) => (
      <tr key={index}>
        <td>{vehicle.dateEntered}</td>
        <td>{vehicle.returnId}</td>
        <td>{vehicle.year}</td>
        <td>{vehicle.make}</td>
        <td>{vehicle.model}</td>
        <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: '60px', display: 'inline-block' }}>{vehicle.color}</span>
          <div
            style={{
              width: '18px',
              height: '18px',
              backgroundColor: vehicle.color,
              marginLeft: '15px',
              border: '1px solid #000',
            }}
          ></div>
        </div>
      </td>
     
        <td>{vehicle.state}</td>
        <td> <button className="download-btn" onClick={() => openVehicleModal(
                      selectedLead.leadNo,
                      selectedLead.description,
                      selectedCase.caseNo,
                      selectedCase.caseName,
                      vehicle.returnId

                    )}>View</button></td>
                    <VehicleModal
    isOpen={showVehicleModal}
    onClose={closeVehicleModal}
    leadNo={vehicleModalData.leadNo}
    description={vehicleModalData.description}
    caseNo={vehicleModalData.caseNo}
    caseName={vehicleModalData.caseName}
    leadReturnId={vehicleModalData.leadReturnId}
  />
  <td>
                  <div classname = "lr-table-btn">
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  // onClick={() => handleEditReturn(ret)}
                />
                  </button>
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  // onClick={() => handleDeleteReturn(ret.id)}
                />
                  </button>
                  </div>
                </td>
      </tr>
    ))}
  </tbody>
        </table>
        <Comment/>

</div>
</div>

        {/* Buttons */}
        {/* <div className="form-buttons">
        <button className="add-btnvh" onClick={handleAddVehicle}>
            Add Vehicle
          </button>
          <button className="back-btn">Back</button>
          <button className="next-btn">Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
  
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREnclosures")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
    </div>
  );
};
