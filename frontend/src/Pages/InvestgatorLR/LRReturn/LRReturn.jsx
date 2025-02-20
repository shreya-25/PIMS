import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./LRReturn.css";

export const LRReturn = () => {
  const navigate = useNavigate();

  // Sample returns data
  const [returns, setReturns] = useState([
    { id: 1, dateEntered: "12/01/2024",enteredBy: "Officer 916", results: "Returned item A" },
    { id: 2, dateEntered: "12/02/2024", enteredBy: "Officer 916",results: "Returned item B" },
  ]);

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

        <table className="timeline-table">
          <thead>
            <tr>
            <th>Return Id </th>
              <th>Date Entered</th>
              <th>Entered By</th>
              <th>Results</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {returns.map((ret) => (
              <tr key={ret.id}>
                 <td>{ret.id}</td>
                <td>{ret.dateEntered}</td>
                <td>{ret.enteredBy}</td>
                <td>{ret.results}</td>
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
          <button className="back-btn" onClick={() => handleNavigation("/LRPerson")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>Next</button>
          <button className="cancel-btn" onClick={() => setReturnData({ results: "" })}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
