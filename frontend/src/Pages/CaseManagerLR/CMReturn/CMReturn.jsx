import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import Comment from "../../../components/Comment/Comment";
import "./CMReturn.css";
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";

export const CMReturn = () => {
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
  const { selectedCase, selectedLead, setSelectedLead, leadReturns, setLeadReturns  } = useContext(CaseContext);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };


  //  Sample returns data
    const [returns, setReturns] = useState([
      { leadReturnId: '', enteredDate: "",enteredBy: "", leadReturnResult: "" },
      // { id: 2, dateEntered: "12/02/2024", enteredBy: "Officer 916",results: "Returned item B" },
    ]);

    const handleLRClick = () => {
      navigate("/CMPerson", { state: {caseDetails, leadDetails } });
    };
    
 console.log("casedetails", selectedCase, selectedLead);

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

            const minimalReturns = response.data.map((item) => ({
              leadReturnId: item.leadReturnId,
              leadReturn: item.leadReturnResult, // or whichever field holds "Interview Ram" / "Returned item A"
              enteredBy: item.enteredBy,
              dateEntered: item.enteredDate,
            }));
 

            setLeadReturns(minimalReturns);
  
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
    }, [leadDetails, caseDetails, setLeadReturns]);
  
  
    // State for managing form input
    const [returnData, setReturnData] = useState({ results: "" });
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
  
    const handleInputChange = (field, value) => {
      setReturnData({ ...returnData, [field]: value });
    };
    const getCasePageRoute = () => {
      if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
      return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };
  
    const handleAddOrUpdateReturn = () => {
      if (!returnData.results) {
        alert("Please enter return details!");
        return;
      }
  
      if (editMode) {
        setReturns(
          returns.map((ret) =>
            ret.id === editId ? { ...ret, results: returnData.results } : ret
          )
        );
        setEditMode(false);
        setEditId(null);
      } else {
        const newReturn = {
          id: returns.length + 1,
          dateEntered: new Date().toLocaleDateString(),
          results: returnData.results,
        };
        setReturns([...returns, newReturn]);
      }
  
      setReturnData({ results: "" });
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
    const handleAccessChange = (index, newAccess) => {
      setReturns((prevReturns) =>
        prevReturns.map((ret, i) =>
          i === index ? { ...ret, access: newAccess } : ret
        )
      );
    };

        const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
        const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
      
        const onShowCaseSelector = (route) => {
          navigate(route, { state: { caseDetails } });
      };
    
    
  return (
    <div className="lrreturn-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
      <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/CMInstruction")}>Instructions</span>
          <span className="menu-item active" onClick={() => handleNavigation("/CMReturn")}>Returns</span>
          <span className="menu-item" onClick={() =>  handleLRClick()}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVideos")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/CMTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/CMFinish")}>Finish</span>
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

      <div className = "LRI-content-section">

      <div className = "content-subsection">

      <table className="leads-table">
        <thead>
          <tr>
            <th style={{ width: "10%" }}>Return ID</th>
            <th style={{ width: "10%" }}>Date Entered</th>
            <th style={{ width: "9%" }}>Entered By</th>
            <th>Results</th>
            <th style={{ width: "15%" , fontSize: "20px" }}>Access</th>
            {/* <th style={{ width: "10%" }}></th> */}
          </tr>
        </thead>
        <tbody>
  {returns.length > 0 ? (
  returns.map((ret, index) => ( 
    <tr key={ret.id || index}>
      <td>{ret.leadReturnId}</td>
      <td>{formatDate(ret.enteredDate)}</td>
      <td>{ret.enteredBy}</td>
      <td>{ret.leadReturnResult}</td>
      <td>
        <select
          value={ret.access || "Case Manager"}
          onChange={(e) => handleAccessChange(index, e.target.value)} // Pass index correctly
        >
          <option value="Case Manager">Case Manager</option>
          <option value="Everyone">Everyone</option>
        </select>
      </td>
      {/* <td>
        <div className="lr-table-btn">
          <button className="save-btn1" onClick={() => handleEditReturn(ret)}>Edit</button>
          <button className="del-button" onClick={() => handleDeleteReturn(ret.id)}>Delete</button>
        </div>
      </td> */}
    </tr>
  ))
) : (
  <tr>
    <td colSpan="5" style={{ textAlign: 'center' }}>
      No Returns Available
    </td>
  </tr>)}
</tbody>

      </table>


      <Comment/>
      </div>

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
