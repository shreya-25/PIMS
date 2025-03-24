import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import Comment from "../../../components/Comment/Comment";
import "./LRReturn.css";
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";


export const LRReturn = () => {
  const navigate = useNavigate();
   const location = useLocation();
    
  const { leadDetails, caseDetails } = location.state || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);
  
  

  // Sample returns data
  const [returns, setReturns] = useState([
    // { id: 1, dateEntered: "12/01/2024",enteredBy: "Officer 916", results: "Returned item A" },
    // { id: 2, dateEntered: "12/02/2024", enteredBy: "Officer 916",results: "Returned item B" },
    { leadReturnId: '', enteredDate: "",enteredBy: "", leadReturnResult: "" },

  ]);

  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        if (selectedLead?.leadNo && selectedLead?.leadName && selectedLead?.caseNo && selectedLead?.caseName) {
          const token = localStorage.getItem("token");

          const response = await axios.get(`http://localhost:5000/api/leadReturnResult/${selectedLead.leadNo}/${encodeURIComponent(
            selectedLead.leadName)}/${selectedLead.caseNo}/${encodeURIComponent(selectedLead.caseName)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
  

          console.log("Fetched Lead RR1:", response.data);

          setReturns(response.data.length > 0 ? response.data : []);


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


  // State for managing form input
  const [returnData, setReturnData] = useState({ results: "" });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleInputChange = (field, value) => {
    setReturnData({ ...returnData, [field]: value });
  };

  // const handleAddOrUpdateReturn = () => {
  //   if (!returnData.results) {
  //     alert("Please enter return details!");
  //     return;
  //   }

  //   if (editMode) {
  //     setReturns(
  //       returns.map((ret) =>
  //         ret.id === editId ? { ...ret, results: returnData.results } : ret
  //       )
  //     );
  //     setEditMode(false);
  //     setEditId(null);
  //   } else {
  //     const newReturn = {
  //       id: returns.length + 1,
  //       dateEntered: new Date().toLocaleDateString(),
  //       results: returnData.results,
  //     };
  //     setReturns([...returns, newReturn]);
  //   }

  //   setReturnData({ results: "" });
  // };

  const handleAddOrUpdateReturn = async () => {
    if (!returnData.results) {
      alert("Please enter return details!");
      return;
    }
  
    const officerName = localStorage.getItem("officerName") || "Officer 916";
    const token = localStorage.getItem("token");
  
    try {
      // Fetch existing lead returns to determine the next ID
      const response = await axios.get(`http://localhost:5000/api/leadReturnResult/${selectedLead.leadNo}/${encodeURIComponent(
        selectedLead.leadName)}/${selectedLead.caseNo}/${encodeURIComponent(selectedLead.caseName)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
    
  
      const existingReturns = response.data || [];
      console.log("data existing", response.data);
      
      // Determine the next sequential leadReturnId
      const nextLeadReturnId = existingReturns.length + 1;
      // Fetch the latest assignedTo and assignedBy from the most recent return
    const latestReturn = existingReturns.length > 0 ? existingReturns[existingReturns.length - 1] : null;

    const assignedTo = latestReturn ? latestReturn.assignedTo : { assignees: [officerName], lRStatus: "Pending" };
    const assignedBy = latestReturn ? latestReturn.assignedBy : { assignee: officerName, lRStatus: "Pending" };

  
      const newReturn = {
        leadNo: selectedLead?.leadNo,
        description: selectedLead?.leadName,
        enteredDate: new Date().toISOString(),
        enteredBy: officerName,
        caseName: selectedLead?.caseName,
        caseNo: selectedLead?.caseNo,
        leadReturnId: nextLeadReturnId, // Sequentially generated ID
        leadReturnResult: returnData.results,
        assignedTo,
        assignedBy,
      };

      console.log("New return created:", newReturn);
  
      // Send a POST request to create a new return
      const createResponse = await axios.post(
        "http://localhost:5000/api/leadReturnResult/create",
        newReturn,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log("New return created:", createResponse.data);
  
      // Update the local state with the new return
      setReturns([...existingReturns, createResponse.data]);
  
      // Reset input field
      setReturnData({ results: "" });
    } catch (err) {
      console.error("Error creating return:", err);
      alert("Failed to add return. Please try again.");
    }
  };
  
  
  const handleEditReturn = (ret) => {
    setReturnData({ results: ret.results });
    setEditMode(true);
    setEditId(ret.id);
  };

  const handleDeleteReturn = (id) => {
    if (window.confirm("Are you sure you want to delete this return?")) {
      setReturns(returns.filter((ret) => ret.id !== id));
    }
  };

  const handleNavigation = (route) => {
    navigate(route);
  };

    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  
    const onShowCaseSelector = (route) => {
      navigate(route, { state: { caseDetails } });
  };
    

  return (
    <div className="lrreturn-container1">
      <Navbar />

      <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRTimeline")}>Timeline</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
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

{/* 
                <div className="left-content"> */}
      <div className="main-contentLRR">
        
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
          <h2 className="">LEAD RETURNS</h2>
        </div>
      <div className = "bottom-sec-lr">
      <div className = "content-to-add">
      <div className = "content-to-add-first-row">
        
           <h4>Return Id</h4>
           <label className='input-field'></label>
           <h4>Date Entered</h4>
           <label className='input-field'></label>
           <h4>Entered By</h4>
           <label className='input-field'></label>
      </div>
    <h4 className="return-form-h4">{editMode ? "Edit Return" : "Add Return"}</h4>
      <div className="return-form">
        <textarea
          value={returnData.results}
          onChange={(e) => handleInputChange("results", e.target.value)}
          placeholder="Enter return details"
        ></textarea>
      </div>

      <div className="form-buttons-return">
        <button className="save-btn1" onClick={handleAddOrUpdateReturn}>{editMode ? "Update" : "Add Return"}</button>
        {/* <button className="back-btn" onClick={() => handleNavigation("/LRPerson")}>Back</button>
        <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>Next</button>
        <button className="cancel-btn" onClick={() => setReturnData({ results: "" })}>Cancel</button> */}
      </div>
      </div>

      <table className="leads-table">
        <thead>
          <tr>
            <th style={{ width: "10%" }}>Return Id</th>
            <th style={{ width: "13%" }}>Date Entered</th>
            <th style={{ width: "9%" }}>Entered By</th>
            <th>Results</th>
            <th style={{ width: "10%" }}></th>
          </tr>
        </thead>
        <tbody>
            {returns.map((ret) => (
              <tr key={ret.id}>
                 <td>{ret.leadReturnId}</td>
              <td>{ret.enteredDate}</td>
              <td>{ret.enteredBy}</td>
              <td>{ret.leadReturnResult}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditReturn(ret)}
                />
                  </button>
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDeleteReturn(ret.id)}
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
        <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRPerson")} // Takes user to CM Return page
      />
      </div>
      </div>
      </div>
  );
};
