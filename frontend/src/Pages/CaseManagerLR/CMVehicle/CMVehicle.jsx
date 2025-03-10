
import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import './CMVehicle.css';
import Navbar from '../../../components/Navbar/Navbar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import FootBar from '../../../components/FootBar/FootBar';
import VehicleModal from "../../../components/VehicleModal/VehicleModel";



export const CMVehicle = () => {

  const navigate = useNavigate(); 
  const location = useLocation();

  const { leadDetails, caseDetails } = location.state || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);
  

  const [vehicles, setVehicles] = useState([
    { enteredDate: "", leadReturnId: '', year: "", make: "", model: "",primaryColor: "", vin: "", plate: "", state: "" },
    // { dateEntered: "01/05/2024", year: "2022", make: "Toyota", model: "Camry", color: "Black",vin: "654321", plate: "ABC-5678", state: "CA" },
    // { dateEntered: "01/10/2024", year: "2021", make: "Ford", model: "F-150", color: "White",vin: "789012", plate: "DEF-9101", state: "TX" },
    // { dateEntered: "01/15/2024", year: "2024", make: "Tesla", model: "Model 3", color: "Red",vin: "345678", plate: "TES-2024", state: "FL" },
  ]);

   const [vehicleModalData, setVehicleModalData] = useState({
          leadNo: "",
          description: "",
          caseNo: "",
          caseName: "",
          leadReturnId: "",
          leadsDeskCode: "",
        });
                  
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

  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        if (selectedLead?.leadNo && selectedLead?.leadName && selectedLead?.caseNo && selectedLead?.caseName) {
          const token = localStorage.getItem("token");

          const response = await axios.get(`http://localhost:5000/api/lrvehicle/lrvehicle/${selectedLead.leadNo}/${encodeURIComponent(
            selectedLead.leadName)}/${selectedLead.caseNo}/${encodeURIComponent(selectedLead.caseName)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
  

          console.log("Fetched Lead RR1:", response.data);

          setVehicles(response.data.length > 0 ? response.data : []);


          // if (response.data.length > 0) {
          //   setReturns({
          //     ...response.data[0], 
          //   });
          // }
          
        }
      } catch (err) {
        console.error("Error fetching lead data:", err);
        setError("Failed to fetch lead data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [leadDetails, caseDetails]);

  const handleAccessChange = (index, newAccess) => {
    setVehicles((prevVehicles) =>
      prevVehicles.map((vehicle, i) =>
        i === index ? { ...vehicle, access: newAccess } : vehicle
      )
    );
  };

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
        <span className="menu-item " onClick={() => handleNavigation('/CMInstruction')}>
            Instructions
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMReturn')}>
            Returns
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/CMPerson')}>
            Person
          </span>
          <span className="menu-item active" onClick={() => handleNavigation('/CMVehicle')}>
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

      <div className = "content-to-add">
        {/* Vehicle Form */}
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
              {/* <th>Year</th> */}
              <th>Make</th>
              <th>Model</th>
              <th>Color</th>
              <th>State</th>
              <th>Access</th>
              <th>Additional Details</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
    {vehicles.map((vehicle, index) => (
      <tr key={index}>
        <td>{vehicle.enteredDate}</td>
        <td>{vehicle.leadReturnId}</td>
        {/* <td>{vehicle.year}</td> */}
        <td>{vehicle.make}</td>
        <td>{vehicle.model}</td>
        <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: '60px', display: 'inline-block' }}>{vehicle.primaryColor}</span>
          <div
            style={{
              width: '18px',
              height: '18px',
              backgroundColor: vehicle.primaryColor,
              marginLeft: '15px',
              border: '1px solid #000',
            }}
          ></div>
        </div>
      </td>
        <td>{vehicle.state}</td>
        <td>
        <select
          value={vehicle.access || "Case Manager"}
          onChange={(e) => handleAccessChange(index, e.target.value)} // Pass index properly
        >
          <option value="Case Manager">Case Manager</option>
          <option value="Everyone">Everyone</option>
        </select>
      </td>
      <td> <button className="download-btn" onClick={() => openVehicleModal(
                      selectedLead.leadNo,
                      selectedLead.description,
                      selectedCase.caseNo,
                      selectedCase.caseName,
                      vehicle.returnId

                    )}>View</button></td> <VehicleModal
                    isOpen={showVehicleModal}
                    onClose={closeVehicleModal}
                    leadNo={vehicleModalData.leadNo}
                    description={vehicleModalData.description}
                    caseNo={vehicleModalData.caseNo}
                    caseName={vehicleModalData.caseName}
                    leadReturnId={vehicleModalData.leadReturnId}
                  />

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
        onNext={() => navigate("/LREnclosures")} // Takes user to CM Return page
      />
    </div>
  );
};
