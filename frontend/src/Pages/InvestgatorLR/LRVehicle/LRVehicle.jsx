import './LRVehicle.css';
import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from '../../../components/Navbar/Navbar';
import FootBar from '../../../components/FootBar/FootBar';
import VehicleModal from "../../../components/VehicleModal/VehicleModel";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import { useDataContext } from "../../Context/DataContext"; // Import Context
import { useLocation, useNavigate } from 'react-router-dom';




export const LRVehicle = () => {

  const navigate = useNavigate(); // Initialize useNavigate hook

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
    <div className="lrvehicle-container">
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

      {/* Main Content */}
      <div className="main-contentLRV">

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
          <h2 className="title">VEHICLE INFORMATION</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>
        {/* Vehicle Form */}
        <div className = "content-to-add">
        <div className="vehicle-form">
          <div className="form-row">
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
          
          <div className="form-row">
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
          <div className="form-row">
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
            <label>Secondary Color:</label>
            <input
              type="text"
              value={vehicleData.secondaryColor}
              onChange={(e) => handleChange('secondaryColor', e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>State:</label>
            <input
              type="text"
              value={vehicleData.state}
              onChange={(e) => handleChange('state', e.target.value)}
            />
          </div>
          <div className="form-row">
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
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Associated Return Id</th>
              <th>Year</th>
              <th>Make</th>
              <th>Model</th>
              <th>Color</th>
              <th>State</th>
              <th>Additional Details</th>
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
      </tr>
    ))}
  </tbody>
        </table>


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
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREnclosures")} // Takes user to CM Return page
      />
    </div>
  );
};
