import FootBar from '../../../components/FootBar/FootBar';
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactToPrint from 'react-to-print';

import Navbar from '../../../components/Navbar/Navbar';
import './LRInstruction.css';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";




export const LRInstruction = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
    const navigate = useNavigate(); // Initialize useNavigate hook
    const printRef = useRef();
    const routerLocation = useLocation();
    const location = useLocation();
         const [loading, setLoading] = useState(true);
          const [error, setError] = useState("");
    const { caseDetails, leadDetails } = routerLocation.state || {};

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date)) return "";
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    };

    // const handleLRClick = () => {
    //   navigate("/LRReturn", { state: {caseDetails, leadDetails } });
    // };

    const getCasePageRoute = () => {
      if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
      return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };
  const [leadData, setLeadData] = useState({
    // leadNumber: '16',
    // leadOrigin: '7',
    // incidentNumber: 'C000006',
    // subNumber: 'C0000045',
    // associatedSubNumbers: [],
    // assignedDate: '09/29/24',
    // leadSummary: 'Interview Sarah',
    // assignedBy: 'Officer 5',
    // leadDescription: 'Interview Sarah to find out where she was on Saturday 09/25',
    // assignedOfficer: ['Officer 1','Officer 2'], leadNumber: '',
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
    assignedOfficer: []
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
   const [availableSubNumbers, setAvailableSubNumbers] = useState([
        "SUB-000001", "SUB-000002", "SUB-000003", "SUB-000004", "SUB-000005"
      ]); // Static List of Subnumbers
      
      const [associatedSubNumbers, setAssociatedSubNumbers] = useState([]); // Selected Subnumbers
      const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  const handleInputChange = (field, value) => {
    setLeadData({ ...leadData, [field]: value });
  };

  const handleGenerateLead = () => {
    const { leadNumber, leadSummary, assignedDate, assignedOfficer, assignedBy } = leadData;
  
    // Check if mandatory fields are filled
    if (!leadNumber || !leadSummary || !assignedDate || !assignedOfficer || !assignedBy) {
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
    navigate(route, {
      state: {
        caseDetails,
        leadDetails
      }
    });
  };

      const [assignedOfficers, setAssignedOfficers] = useState([]);
  

  const handleNextPage = () => {
    navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  };

  const { selectedCase, selectedLead, setSelectedLead, leadInstructions, leadStatus, setLeadStatus, setLeadInstructions } = useContext(CaseContext);

  
    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

    useEffect(() => {
      const fetchLeadData = async () => {
        try {
          const lead = selectedLead?.leadNo ? selectedLead : leadDetails;
          const kase = selectedCase?.caseNo ? selectedCase : caseDetails;
    
          if (lead?.leadNo && lead?.leadName && kase?.caseNo && kase?.caseName) {
            const token = localStorage.getItem("token");
    
            const response = await api.get(
              `/api/lead/lead/${lead.leadNo}/${encodeURIComponent(
                lead.leadName
              )}/${kase.caseNo}/${encodeURIComponent(kase.caseName)}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
    
  
            console.log("Fetched Lead Data1:", response.data);
  
            if (response.data.length > 0) {
              setLeadData({
                ...response.data[0], 
                assignedOfficer: response.data[0].assignedOfficer || [] // Ensure array
              });
              setLeadInstructions(response.data[0]);
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
    }, [selectedLead, setLeadInstructions]);

    setLeadStatus(leadData.leadStatus);
  
    const onShowCaseSelector = (route) => {
      navigate(route, { state: { caseDetails } });
  };

  const PrintableContent = React.forwardRef((props, ref) => (
    <div ref={ref}>
      {/* Title with Case No and Case Name */}
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Lead Return Report – {caseDetails.caseNo} – {caseDetails.caseName}
      </h1>
      {/* The printable area (starting from the bottom-content) */}
      <div className="bottom-content">
        <table className="details-table">
          <tbody>
            <tr>
              <td>Case Name:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.caseName || 'Main Street Murder'}
                  readOnly
                />
              </td>
            </tr>
            <tr>
              <td>Lead Summary:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.leadSummary}
                  readOnly
                />
              </td>
            </tr>
            <tr>
              <td>Assigned Date:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.assignedDate}
                  readOnly
                />
              </td>
            </tr>
            {/* Add any other rows you want printed */}
          </tbody>
        </table>
      </div>
    </div>
  ));
  
  return (
    <div className="person-page">
      {/* Navbar at the top */}
      <Navbar />

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
       <div className="top-menu1" style={{ marginTop: '2px', backgroundColor: '#3333330e', fontWeight: '900' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item active" style={{fontWeight: '600' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Narrative
          </span>
          <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVehicle')} >
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
          <h5 className = "side-title">  Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${leadStatus}`
    : `LEAD DETAILS | ${leadStatus}`}
</h5>

          </div>

       {/* <div className="main-content-cl"> */}
        {/* Left Section */}
        {/* <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo"
          />
        </div> */}

        {/* Center Section */}
        <div className="case-header">
          <h2 className="">LEAD INSTRUCTIONS</h2>
        </div>

        {/* Right Section */}

        <div className="LRI-content-section">

      {(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") && (
  <div className="add-lead-section">
    {/* <div className="add-lead-section-content">
      <h4>Click here to add a new lead</h4>
    </div> */}
    <div className="add-lead-btn1">
      <button
        className="save-btn1"
        style={{ cursor: 'pointer' }}
        onClick={() =>
          navigate('/createlead', {
            state: {
              caseDetails: selectedCase,
              // send current lead as the “origin”
              leadOrigin: selectedLead?.leadNo || leadData.leadNumber
            }
          })
        }
      >
       <i className="fa-solid fa-plus"></i> Add Lead
      </button>
    </div>
  </div>
)}

        <table className="leads-table">
    <thead>
      <tr>

        <th style={{ width: "10%" }}>Lead No.</th>
          <th style={{ width: "10%" }}>Case No.</th>
          <th style={{ width: "10%" }}>Assigned By</th>
          <th style={{ width: "8%" }}>Assigned Date</th>
      </tr>
      </thead>
      <tbody>
      <tr>
      <td>{selectedLead.leadNo} </td>
      <td>{leadData.caseNo}</td>
      <td> {leadData.assignedBy} </td>
        <td>{formatDate(leadData.assignedDate)} </td>

      </tr>
    </tbody>
  </table>
      {/* </div> */}

       {/* Bottom Content */}
       <div className="bottom-content-LRI">
        <table className="details-table">
          <tbody>
          <tr>
              <td>Case Name:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.caseName} // Display selected case name or an empty string
                  onChange={(e) => handleInputChange('caseName', e.target.value)} // Update 'caseName' in leadData
                  placeholder=""
                  readOnly
    />
              </td>
            </tr>
            <tr>
              <td>Lead Log Summary:</td>
              <td>
                <input
                  type="text"
                  className="input-field"
                  value={leadData.description}
                  onChange={(e) => handleInputChange('leadDescription', e.target.value)}
                  placeholder=""
                  readOnly
                />
              </td>
            </tr>
            <tr>
              <td>Lead Instruction:</td>
              <td>
                <textarea
                  className="input-field"
                  value={leadData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder=""
                  readOnly
                ></textarea>
              </td>
            </tr>
              <tr>
                <td>Assigned Officers:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={Array.isArray(leadData.assignedTo)
                      ? leadData.assignedTo
                          .map(o => typeof o === "string" ? o : o.username)
                          .join(", ")
                      : ""}
                    readOnly
                  />
                </td>
              </tr>

                 <tr>
                <td>Lead Origin:</td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={leadData.parentLeadNo}
                    onChange={(e) => handleInputChange('leadOrigin', e.target.value)}
                    placeholder=""
                  readOnly
                  />
                </td>
              </tr>

             <tr>
  <td>Subnumber:</td>
  <td>
    <input
      type="text"
      className="input-field"
      value={leadData.subNumber || ""}
      readOnly
    />
  </td>
</tr>
<tr>
  <td>Associated Subnumbers:</td>
  <td>
    <input
      type="text"
      className="input-field"
      value={Array.isArray(leadData.associatedSubNumbers)
        ? leadData.associatedSubNumbers.join(", ")
        : ""}
      readOnly
    />
  </td>
</tr>

          </tbody>
        </table>
      </div>
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
        onNext={() => navigate("/LRReturn")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};