
import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import './CMVehicle.css';
import Navbar from '../../../components/Navbar/Navbar';
import axios from "axios";
import Comment from "../../../components/Comment/Comment";
import { CaseContext } from "../../CaseContext";
import FootBar from '../../../components/FootBar/FootBar';
import VehicleModal from "../../../components/VehicleModal/VehicleModel";



export const CMVehicle = () => {

  useEffect(() => {
      // Apply style when component mounts
      document.body.style.overflow = "hidden";
  
      return () => {
        // Reset to default when component unmounts
        document.body.style.overflow = "auto";
      };
    }, []);

  const navigate = useNavigate(); 
  const location = useLocation();

  const { leadDetails, caseDetails } = location.state || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date)) return "";
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    };
  
  

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

  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};

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

   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
          const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
        
          const onShowCaseSelector = (route) => {
            navigate(route, { state: { caseDetails } });
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


       <div className="LRI_Content">
      <div className="sideitem">
      <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li>            
            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item active" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li> */}
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
              View Lead Hierarchy
            </li> */}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              Generate Report
            </li> */}
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            {/* <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li> */}
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}
            {selectedCase.role !== "Investigator" && (
  <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
    View Lead Chain of Custody
  </li>
)}
        </div>

                <div className="left-content">

      {/* Main Content */}
      {/* <div className="main-contentLRV"> */}
      {/* <div className="main-content-cl">
        {/* Left Section */}
        {/* <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo-lr"
          />
        </div> */} 


        {/* Center Section */}
        <div className="case-header">
          <h2 className="">VEHICLE INFORMATION</h2>
        </div>
      {/* </div> */}

      <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Vehicle Table */}
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Date Entered</th>
              <th style={{ width: "16%" }}>Associated Return ID</th>
              {/* <th>Year</th> */}
              <th>Make</th>
              <th>Model</th>
              <th>Color</th>
              <th>State</th>
              <th style={{ width: "14%" }}>Access</th>
              <th style={{ width: "15%" }}>Additional Details</th>
              {/* <th></th> */}
            </tr>
          </thead>
          <tbody>
    {vehicles.map((vehicle, index) => (
      <tr key={index}>
        <td>{formatDate(vehicle.enteredDate)}</td>
        <td>{vehicle.leadReturnId}</td>
        {/* <td>{vehicle.year}</td> */}
        <td>{vehicle.make}</td>
        <td>{vehicle.model}</td>
        <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'left', justifyContent: 'flex-start' }}>
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

{/* <td>
        <div className="lr-table-btn">
          <button className="save-btn1" >Edit</button>
          <button className="del-button" >Delete</button>
        </div>
      </td> */}
      </tr>
    ))}
  </tbody>
        </table>

      <Comment/>

      </div>
      </div>

      
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREnclosures")} // Takes user to CM Return page
      />
    </div>
    </div>
</div>
  );
};
