import './LRVehicle.css';
import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from '../../../components/Navbar/Navbar';
import FootBar from '../../../components/FootBar/FootBar';
import VehicleModal from "../../../components/VehicleModal/VehicleModal";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import { useDataContext } from "../../Context/DataContext"; // Import Context
import { useLocation, useNavigate } from 'react-router-dom';
import Comment from "../../../components/Comment/Comment";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";



export const LRVehicle = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);

  const navigate = useNavigate(); // Initialize useNavigate hook
    const location = useLocation();
    const [username, setUsername] = useState("");
    const [rawVehicles, setRawVehicles] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
      const [leadData, setLeadData] = useState({});


    
    useEffect(() => {
       const loggedInUser = localStorage.getItem("loggedInUser");
       if (loggedInUser) {
         setUsername(loggedInUser);
       }
      })
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
    // {  returnId: 1,dateEntered: "01/01/2024", year: "2023", make: "Honda", model: "Accord",color: "Blue", vin: "123456", plate: "XYZ-1234", state: "NY" },
    // {  returnId: 1,dateEntered: "01/05/2024", year: "2022", make: "Toyota", model: "Camry", color: "Black",vin: "654321", plate: "ABC-5678", state: "CA" },
    // { returnId: 2, dateEntered: "01/10/2024", year: "2021", make: "Ford", model: "F-150", color: "White",vin: "789012", plate: "DEF-9101", state: "TX" },
    // {  returnId: 2,dateEntered: "01/15/2024", year: "2024", make: "Tesla", model: "Model 3", color: "Red",vin: "345678", plate: "TES-2024", state: "FL" },
  ]);
   const [vehicleModalData, setVehicleModalData] = useState({
        leadNo: "",
        leadName: "",
        caseNo: "",
        caseName: "",
        leadReturnId: "",
        leadsDeskCode: "",
      });
      
const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);

  useEffect(() => {
    const fetchLeadData = async () => {
      if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;
      const token = localStorage.getItem("token");

      try {
        const response = await api.get(
          `/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.length > 0) {
          setLeadData({
            ...response.data[0],
            assignedTo: response.data[0].assignedTo || [],
            leadStatus: response.data[0].leadStatus || ''
          });
        }
      } catch (error) {
        console.error("Failed to fetch lead data:", error);
      }
    };

    fetchLeadData();
  }, [selectedLead, selectedCase]);

   const handleSubmitReport = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!selectedLead || !selectedCase) {
        alert("No lead or case selected!");
        return;
      }

      const body = {
        leadNo: selectedLead.leadNo,
        description: selectedLead.leadName,
        caseNo: selectedCase.caseNo,
        caseName: selectedCase.caseName,
        submittedDate: new Date(),
        assignedTo: {
          assignees: leadData.assignedTo || [],
          lRStatus: "Submitted"
        },
        assignedBy: {
          assignee: localStorage.getItem("officerName") || "Unknown Officer",
          lRStatus: "Pending"
        }
      };

      const response = await api.post("/api/leadReturn/create", body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 201) {
        const statusResponse = await api.put(
          "/api/lead/status/in-review",
          {
            leadNo: selectedLead.leadNo,
            description: selectedLead.leadName,
            caseNo: selectedCase.caseNo,
            caseName: selectedCase.caseName
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (statusResponse.status === 200) {
          setLeadStatus("In Review");

            setSelectedLead(prev => ({
            ...prev,
            leadStatus: "In Review"
          }));
          
          alert("Lead Return submitted and status set to 'In Review'");
        const manager    = leadData.assignedBy;                  // string username
        const investigators = (leadData.assignedTo || []).map(a => a.username);
        if (manager) {
          const payload = {
            notificationId: Date.now().toString(),
            assignedBy:     localStorage.getItem("loggedInUser"),
            assignedTo:     [{ username: manager, status: "pending" }],
            action1:        "submitted a lead return for review",
            post1:          `${selectedLead.leadNo}: ${selectedLead.leadName}`,
            caseNo:         selectedCase.caseNo,
            caseName:       selectedCase.caseName,
            leadNo:         selectedLead.leadNo,
            leadName:       selectedLead.leadName,
            type:           "Lead"
          };
          await api.post("/api/notifications", payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        alert("Lead Return submitted and Case Manager notified.");
        } else {
          alert("Lead Return submitted but status update failed.");
        }
      } else {
        alert("Failed to submit Lead Return");
      }
    } catch (error) {
      console.error("Error during Lead Return submission or status update:", error);
      alert("Something went wrong while submitting the report.");
    }
  };

        
 const openVehicleModal = (leadNo, leadName, caseNo, caseName, leadReturnId, leadsDeskCode) => {
      setVehicleModalData({
        leadNo,
        leadName,
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
        leadName: "",
        caseNo: "",
        caseName: "",
        leadReturnId: "",
        leadsDeskCode: "",
      });
      setShowVehicleModal(false);
    };
    const [showVehicleModal, setShowVehicleModal] = useState(false);

    const handleEditVehicle = (idx) => {
      const v = rawVehicles[idx];
      setEditIndex(idx);
      // pre-fill your form fields from the raw document
      setVehicleData({
        leadReturnId:  v.leadReturnId,
        enteredDate:   v.enteredDate.slice(0,10), // YYYY-MM-DD
        vin:           v.vin,
        year:          v.year,
        make:          v.make,
        model:         v.model,
        plate:         v.plate,
        state:         v.state,
        primaryColor:  v.primaryColor,
        secondaryColor:v.secondaryColor,
        category:      v.category,
        type:          v.type,
        information:   v.information
      });
    };
    
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
    leadReturnId:'',
    information: '',
  });

  const handleChange = (field, value) => {
    setVehicleData({ ...vehicleData, [field]: value });
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchVehicles();
    }
  }, [selectedLead, selectedCase]);
  

  // const handleAddVehicle = () => {
  //   const newVehicle = {
  //     dateEntered: new Date().toLocaleDateString(),
  //     year: vehicleData.year,
  //     make: vehicleData.make,
  //     model: vehicleData.model,
  //     color: vehicleData.color,
  //     vn: vehicleData.vin,
  //     plate: vehicleData.plate,
  //     state: vehicleData.state,
  //   };

  //   // Add the new vehicle to the list
  //   setVehicles([...vehicles, newVehicle]);

  //   // Clear the form fields
  //   setVehicleData({
  //     year: '',
  //     make: '',
  //     model: '',
  //     plate: '',
  //     category: '',
  //     type: '',
  //     color:'',
  //     vin: '',
  //     primaryColor: '',
  //     secondaryColor: '',
  //     state: '',
  //     information: '',
  //   });
  // };

  // const handleAddVehicle = async () => {
  //   const token = localStorage.getItem("token");
  
  //   const payload = {
  //     leadNo: selectedLead?.leadNo,
  //     description: selectedLead?.leadName,
  //     caseNo: selectedCase?.caseNo,
  //     caseName: selectedCase?.caseName,
  //     enteredBy: username, // Replace with real user
  //     enteredDate: new Date().toISOString(),
  //     leadReturnId: vehicleData.leadReturnId, // You may fetch/set this dynamically
  //     year: vehicleData.year,
  //     make: vehicleData.make,
  //     model: vehicleData.model,
  //     plate: vehicleData.plate,
  //     vin: vehicleData.vin,
  //     state: vehicleData.state,
  //     category: vehicleData.category,
  //     type: vehicleData.type,
  //     primaryColor: vehicleData.primaryColor,
  //     secondaryColor: vehicleData.secondaryColor,
  //     information: vehicleData.information,
  //     additionalData: {} // Add any extra info if needed
  //   };

  //   console.log(payload);
  
  //   try {
  //     // 1) axios.post(url, data, config)
  //     const res = await api.post(
  //       "/api/lrvehicle/lrvehicle",
  //       payload,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           "Authorization": `Bearer ${token}`
  //         }
  //       }
  //     );
  
  //     console.log("Server response:", res.data);
  //     alert("Vehicle added successfully");
  //     fetchVehicles();
  //   } catch (err) {
  //     // 2) Inspect err.response for server rejection
  //     if (err.response) {
  //       console.error("Server error:", err.response);
  //       const msg =
  //         err.response.data?.message ||
  //         JSON.stringify(err.response.data) ||
  //         err.response.statusText;
  //       alert(`Failed to add vehicle (${err.response.status}): ${msg}`);
  //     } else {
  //       console.error("Network or code error:", err);
  //       alert(`Error adding vehicle: ${err.message}`);
  //     }
  //   }
  // };

  const handleSaveVehicle = async () => {
    const token = localStorage.getItem("token");
    const payload = {
      leadNo:        selectedLead.leadNo,
      description:   selectedLead.leadName,
      caseNo:        selectedCase.caseNo,
      caseName:      selectedCase.caseName,
      enteredBy:     username,
      enteredDate:   vehicleData.enteredDate || new Date().toISOString(),
      ...vehicleData
    };
  
    try {
      let res;
      if (editIndex !== null) {
        // update existing
        const old = rawVehicles[editIndex];
        res = await api.put(
          `/api/lrvehicle/${selectedLead.leadNo}/${selectedCase.caseNo}/${old.leadReturnId}/${old.vin}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // patch local arrays
        const updatedRaw = [...rawVehicles];
        updatedRaw[editIndex] = res.data;
        setRawVehicles(updatedRaw);
      } else {
        // create new
        res = await api.post(
          "/api/lrvehicle/lrvehicle",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRawVehicles([res.data, ...rawVehicles]);
      }
  
      // rebuild your display array
      fetchVehicles();  // or you can do your existing map of setVehicles
      // exit edit mode
      setEditIndex(null);
      setVehicleData({
        year: '', make: '', model: '', plate: '',
        category: '', type: '', color:'', vin: '',
        primaryColor:'', secondaryColor:'', state:'',
        leadReturnId:'', information:''
      });
      alert(editIndex!==null ? "Vehicle updated" : "Vehicle added");
    } catch (err) {
      console.error(err);
      alert("Save failed: " + (err.response?.data?.message || err.message));
    }
  };
  

  const fetchVehicles = async () => {
    const token = localStorage.getItem("token");
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);
  
    try {
      const res = await api.get(
        `/api/lrvehicle/lrvehicle/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      setRawVehicles(res.data);
      const mapped = res.data.map((vehicle) => ({
        returnId: vehicle.leadReturnId,
        dateEntered: formatDate(vehicle.enteredDate),
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.primaryColor,
        vin: vehicle.vin,
        plate: vehicle.plate,
        state: vehicle.state,
      }));

      const withAccess = mapped.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
  
      setVehicles(withAccess);

      setError("");
    } catch (err) {
      console.error("Error fetching vehicle records:", err);
      setError("Failed to fetch vehicles.");
    }
  };
  
  const handleAccessChange = (idx, newAccess) => {
    setVehicles(rs => {
      const copy = [...rs];
      copy[idx] = { ...copy[idx], access: newAccess };
      return copy;
    });
  };
  
  const handleDeleteVehicle = async (idx) => {
    if (!window.confirm("Delete this vehicle?")) return;
    const v = rawVehicles[idx];
    try {
      const token = localStorage.getItem("token");
      await api.delete(
        `/api/lrvehicle/${selectedLead.leadNo}/${selectedCase.caseNo}/${v.leadReturnId}/${v.vin}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // 1) remove from rawVehicles
      const newRaw = rawVehicles.filter((_, i) => i !== idx);
      setRawVehicles(newRaw);
  
      // 2) rebuild your display array in vehicles
      const newDisplay = newRaw.map(vehicle => ({
        returnId:   vehicle.leadReturnId,
        dateEntered: formatDate(vehicle.enteredDate),
        year:        vehicle.year,
        make:        vehicle.make,
        model:       vehicle.model,
        color:       vehicle.primaryColor,
        vin:         vehicle.vin,
        plate:       vehicle.plate,
        state:       vehicle.state,
        access:      vehicle.access ?? "Everyone"
      }));
      setVehicles(newDisplay);
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
  };
  

  
    const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";



  return (
    // <div className="lrvehicle-container">
    <div className="person-page">
        <div className="person-page-content">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      {/* <div className="top-menu">
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
       </div> */}
         <div className="top-menu"   style={{ paddingLeft: '20%' }}>
      <div className="menu-items" >
        <span className="menu-item " onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LeadReview", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } }} > Lead Information</span>
                   <span className="menu-item active" >Add/View Lead Return</span>
                   <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/ChainOfCustody", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                    alert("Please select a case and lead first.");
                  }
                }}>Lead Chain of Custody</span>
          
                  </div>
        {/* <div className="menu-items">
      
        <span className="menu-item active" onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRVehicle')} >
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
         </div> */}
       </div>

       <div className="LRI_Content">
       {/* <div className="sideitem">
       <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

       <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>  
          
          

                  <li
  className="sidebar-item"
  onClick={() =>
    selectedCase.role === "Investigator"
      ? navigate("/Investigator")
      : navigate("/CasePageManager")
  }
>
Case Page
</li>


            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item active" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
          
          
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
          
          
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>

            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}

            </ul>
        )}
          <li className="sidebar-item" style={{ fontWeight: 'bold' }} onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Related Tabs {leadDropdownOpen ?  "▲": "▼"}
          </li>
        {leadDropdownOpen && (
          <ul>
              <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
              View Lead Chain of Custody
            </li>
             )}
          </ul>

            )}

                </div> */}

<SideBar  activePage="CasePageManager" />

                <div className="left-content">
                <div className="top-menu" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Narrative
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRScratchpad')}>
            Notes
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> </div>

                <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>

          </div>

                <div className="case-header">
          <h2 className="">VEHICLE INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Vehicle Form */}
        <div className = "timeline-form-sec">
        <div className="vehicle-form">
          <div className="form-row4">
          <label>Narrative Id*</label>
            <input
              type="text"
              value={vehicleData.leadReturnId}
              onChange={(e) => handleChange('leadReturnId', e.target.value)}
            />
            <label>Entered Date*</label>
            <input
              type="text"
              value= {formatDate(new Date().toISOString())}
              onChange={(e) => handleChange('enteredDate', e.target.value)}
            />
            <label>Model</label>
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
            <label>Plate</label>
            <input
              type="text"
              value={vehicleData.plate}
              onChange={(e) => handleChange('plate', e.target.value)}
            />
            <label>Category</label>
            <input
              type="text"
              value={vehicleData.category}
              onChange={(e) => handleChange('category', e.target.value)}
            />
            <label>Type</label>
            <input
              type="text"
              value={vehicleData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            />
          </div>
          <div className="form-row4">
            <label>VIN *</label>
            <input
              type="text"
              value={vehicleData.vin}
              onChange={(e) => handleChange('vin', e.target.value)}
            />
             <label>Year</label>
            <input
              type="text"
              value={vehicleData.year}
              onChange={(e) => handleChange('year', e.target.value)}
            />
            <label>Make</label>
            <input
              type="text"
              value={vehicleData.make}
              onChange={(e) => handleChange('make', e.target.value)}
            />
           
          </div>
          <div className="form-row4">
          <label>State</label>
            <input
              type="text"
              value={vehicleData.state}
              onChange={(e) => handleChange('state', e.target.value)}
            />
             <label>Main Color</label>
            <input
              type="text"
              value={vehicleData.primaryColor}
              onChange={(e) => handleChange('primaryColor', e.target.value)}
            />
            <label>Second Color</label>
            <input
              type="text"
              value={vehicleData.secondaryColor}
              onChange={(e) => handleChange('secondaryColor', e.target.value)}
            />
           
          </div>
        </div>
        <div className="vehicle-form">
          <div className="form-row1">
            <label>Information</label>
            <textarea
              value={vehicleData.information}
              onChange={(e) => handleChange('information', e.target.value)}
            ></textarea>
          </div>
          {/* <div className="form-row1">
            <label>Date Entered *</label>
            <input
                  type="date"
                  value={vehicleData.dateEntered}
                  className="input-large"
                  onChange={(e) => handleChange("dateEntered", e.target.value)}
                />
          </div> */}
          </div>
        </div>
        {/* Buttons */}
        <div className="form-buttons">
        {/* <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}
         className="save-btn1" onClick={handleAddVehicle}>
            Add Vehicle
          </button> */}
          <button
  disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}
  className="save-btn1"
  onClick={handleSaveVehicle}
>
  {editIndex !== null ? "Update Vehicle" : "Add Vehicle"}
</button>

{editIndex !== null && (
  <button
    className="cancel-btn"
    onClick={() => {
      setEditIndex(null);
      // reset form
      setVehicleData({
        year: '', make: '', model: '', plate: '',
        category: '', type: '', color:'', vin: '',
        primaryColor:'', secondaryColor:'', state:'',
        leadReturnId:'', information:''
      });
    }}
  >
    Cancel
  </button>
)}
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
              <th style={{ width: "10%" }}>Narrative Id</th>
              <th>Make</th>
              <th>Model</th>
              <th>Color</th>
              <th>State</th>
              <th style={{ width: "15%" }}>Additional Details</th>
              <th style={{ width: "14%" }}></th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
    {vehicles.length > 0 ? vehicles.map((vehicle, index) => (
      <tr key={index}>
        <td>{vehicle.dateEntered}</td>
        <td>{vehicle.returnId}</td>
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
                      selectedLead.leadName,
                      selectedCase.caseNo,
                      selectedCase.caseName,
                      vehicle.returnId

                    )}>View</button></td>
                    <VehicleModal
    isOpen={showVehicleModal}
    onClose={closeVehicleModal}
    leadNo={vehicleModalData.leadNo}
    leadName={vehicleModalData.leadName}
    caseNo={vehicleModalData.caseNo}
    caseName={vehicleModalData.caseName}
    leadReturnId={vehicleModalData.leadReturnId}
  />
  <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditVehicle(index)}

                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDeleteVehicle(index)}
                />
                  </button>
                  </div>
                </td>
                {isCaseManager && (
          <td>
            <select
              value={vehicle.access}
              onChange={e => handleAccessChange(index, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Case Manager Only</option>
            </select>
          </td>
        )}
      </tr>
       )) : (
        <tr>
          <td colSpan={isCaseManager ? 9 : 8} style={{ textAlign:'center' }}>
            No Vehicle Data Available
          </td>
        </tr>
      )}
  </tbody>
        </table>

           {/* {selectedLead?.leadStatus !== "Completed" && !isCaseManager && (
  <div className="form-buttons-finish">
    <h4> Click here to submit the lead</h4>
    <button
      disabled={selectedLead?.leadStatus === "In Review"}
      className="save-btn1"
      onClick={handleSubmitReport}
    >
      Submit 
    </button>
  </div>
)} */}

        <Comment tag= "Vehicle"/>

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
