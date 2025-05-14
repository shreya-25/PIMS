import FootBar from '../../../components/FootBar/FootBar';
import React, { useContext, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CaseContext } from "../../CaseContext";
import axios from "axios";
import PersonModal from "../../../components/PersonModal/PersonModel";
import Comment from "../../../components/Comment/Comment";

import Navbar from '../../../components/Navbar/Navbar';
import './LRPerson.css';
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";


export const LRPerson = () => {
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
          
        const { leadDetails, caseDetails } = location.state || {};
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState("");
          const [rawPersons, setRawPersons] = useState([]);
            const { selectedCase, selectedLead, setSelectedLead, setSelectedCase, leadStatus, setLeadPersons } = useContext(CaseContext);

                const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

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
      // { returnId: 1,dateEntered: "01/01/2024", name: "John Doe", phoneNo: "123-456-7890", address: "123 Main St, NY" },
      // {  returnId: 1, dateEntered: "01/05/2024", name: "Jane Smith", phoneNo: "987-654-3210", address: "456 Elm St, CA" },
      // {  returnId: 2,dateEntered: "01/10/2024", name: "Mike Johnson", phoneNo: "555-789-1234", address: "789 Pine St, TX" },
      // { returnId: 2,dateEntered: "01/15/2024", name: "Emily Davis", phoneNo: "111-222-3333", address: "321 Maple St, FL" },
    ]);
  
    const [selectedRow, setSelectedRow] = useState(null);
  
    const handleAddPerson = () => {
      setPersons([...persons, { dateEntered: "", name: "", phoneNo: "", address: "" }]);
    };
  
    // const handleEditPerson = () => {
    //   if (selectedRow === null) {
    //     alert("Please select a row to edit.");
    //     return;
    //   }
    //   const newName = prompt("Enter new name:", persons[selectedRow].name);
    //   if (newName !== null) {
    //     const updatedPersons = [...persons];
    //     updatedPersons[selectedRow].name = newName;
    //     setPersons(updatedPersons);
    //   }
    // };
  
    // const handleDeletePerson = () => {
    //   if (selectedRow === null) {
    //     alert("Please select a row to delete.");
    //     return;
    //   }
    //   if (window.confirm("Are you sure you want to delete this person?")) {
    //     setPersons(persons.filter((_, index) => index !== selectedRow));
    //     setSelectedRow(null);
    //   }
    // };

    useEffect(() => {
      if (
        selectedCase?.caseNo &&
        selectedCase?.caseName &&
        selectedLead?.leadNo &&
        selectedLead?.leadName
      ) {
        fetchPersons();
      }
    }, [selectedCase, selectedLead]);
    
    useEffect(() => {
      if (caseDetails && leadDetails) {
        setSelectedCase(caseDetails);
        setSelectedLead(leadDetails);
      }
    }, [caseDetails, leadDetails]);
  
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

  const fetchPersons = async () => {
    const token = localStorage.getItem("token");
  
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName); // encode if contains spaces
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
  
    console.log("About to hit");
    try {
      const res = await api.get(
        `/api/lrperson/lrperson/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(res);
      const personsFromApi = res.data;

      const apiPersons = res.data;         // raw array of LRPerson docs
      setRawPersons(apiPersons);
  
      // Map response to desired format
      const mappedPersons = res.data.map((person) => ({
        returnId: person.leadReturnId,
        dateEntered: new Date(person.enteredDate).toLocaleDateString(),
        name: `${person.firstName} ${person.lastName}`,
        phoneNo: person.cellNumber || "N/A",
        address:
          person.address?.street1 &&
          `${person.address.street1}, ${person.address.city || ""}, ${person.address.state || ""}`,
        leadReturnId: person.leadReturnId,
        access: "Everyone"
      }));

      const withAccess = mappedPersons.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
      setPersons(withAccess);
      setLeadPersons(personsFromApi);
      setError("");
      setLoading(false);
      console.log("map person", mappedPersons);
    } catch (err) {
      console.error("Error fetching person records:", err);
      setError("Failed to fetch persons.");
      setLoading(false);
    }
  };

  // Edit: send the raw object to LRPerson1
const handleEditPerson = (idx) => {
  const person = rawPersons[idx];
  navigate("/LRPerson1", {
    state: {
      caseDetails,
      leadDetails,
      person
    }
  });
};

// Delete: call your DELETE endpoint by composite key
const handleDeletePerson = async (idx) => {
  if (!window.confirm("Delete this person?")) return;
  const p = rawPersons[idx];
  try {
    const token = localStorage.getItem("token");
    await api.delete(
      `/api/lrperson/${selectedLead.leadNo}/${selectedCase.caseNo}/${p.leadReturnId}/${p.firstName}/${p.lastName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // remove from both raw and display
    const newRaw = rawPersons.filter((_, i) => i !== idx);
    setRawPersons(newRaw);
    setPersons(newRaw.map(person => ({
      returnId:   person.leadReturnId,
      dateEntered:new Date(person.enteredDate).toLocaleDateString(),
      name:       `${person.firstName} ${person.lastName}`,
      phoneNo:    person.cellNumber || "N/A",
      address:    `${person.address?.street1 || ""}, ${person.address?.city || ""}`,
      access:     person.access ?? "Everyone"
    })));
  } catch (err) {
    console.error("Delete failed", err);
    alert("Failed to delete person.");
  }
};
  
  const handleAccessChange = (idx, newAccess) => {
    setPersons(rs => {
      const copy = [...rs];
      copy[idx] = { ...copy[idx], access: newAccess };
      return copy;
    });
  };

  const isCaseManager = selectedCase?.role === "Case Manager";
  
  return (
    <div className="person-page">
        <div className="person-page-content">
      {/* Navbar at the top */}
      <Navbar />

      {/* <div className="top-menu">
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
          <span className="menu-item"onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRTimeline")}>Timeline</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
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
            Returns
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }} onClick={() => handleNavigation('/LRPerson')} >
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
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>

          </div>

        <div className="case-header">
          <h2 className="">LEAD PERSONS DETAILS</h2>
        </div>
        <div className = "LRI-content-section">

<div className = "content-subsection">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th style={{ width: "10%" }}>Return Id </th>
              <th>Name</th>
              <th>Phone No</th>
              <th>Address</th>
              <th style={{ width: "14%" }}>Additional Details</th>
              <th style={{ width: "14%" }}></th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {persons.length > 0 ? persons.map((person, index) => (
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
                                selectedLead.leadName,
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
<td>
                  <div classname = "lr-table-btn">
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditPerson(index)}
                />
                  </button>
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDeletePerson(index)}
                />
                  </button>
                  </div>
                </td>
                {isCaseManager && (
          <td>
            <select
              value={person.access}
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
          <td colSpan={isCaseManager ? 8 : 7} style={{ textAlign:'center' }}>
            No Details Available
          </td>
        </tr>
      )}
          </tbody>
        </table>
        {/* <button onClick={() => handleNavigation('/LRPerson1')} className="save-btn1
        ">Add Person</button> */}

      {/* Bottom Buttons */}
      <div className="bottom-buttons">
      <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

      onClick={() => handleNavigation('/LRPerson1')} className="save-btn1">Add Person</button>
      </div>
      <Comment tag = "Person"/>
</div>
</div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVehicle")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
</div>
      
  );
};