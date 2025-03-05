import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./CMReturn.css";
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";

export const CMReturn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
const { leadDetails, caseDetails } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);


  //  Sample returns data
    const [returns, setReturns] = useState([
      { leadReturnId: '', enteredDate: "",enteredBy: "", leadReturnResult: "" },
      // { id: 2, dateEntered: "12/02/2024", enteredBy: "Officer 916",results: "Returned item B" },
    ]);

    const handleLRClick = () => {
      navigate("/CMPerson", { state: {caseDetails, leadDetails } });
    };



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

    <div className="main-contentLRR">
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
        <h2 className="title">LEAD RETURNS</h2>
      </div>

       {/* Right Section */}
       <div className="right-section">
      </div>
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
        <button className="save-btn" onClick={handleAddOrUpdateReturn}>{editMode ? "Update" : "Add Return"}</button>
        {/* <button className="back-btn" onClick={() => handleNavigation("/LRPerson")}>Back</button>
        <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>Next</button>
        <button className="cancel-btn" onClick={() => setReturnData({ results: "" })}>Cancel</button> */}
      </div>

      <table className="timeline-table">
        <thead>
          <tr>
            <th>Return Id</th>
            <th>Date Entered</th>
            <th>Entered By</th>
            <th>Results</th>
            <th></th>
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
                <button className="btn-edit" onClick={() => handleEditReturn(ret)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDeleteReturn(ret.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>

    <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRPerson")} // Takes user to CM Return page
      />
  </div>
);
};
