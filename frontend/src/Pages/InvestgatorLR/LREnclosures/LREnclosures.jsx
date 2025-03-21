import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./LREnclosures.css"; // Custom CSS file for Enclosures styling
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";


export const LREnclosures = () => {
  const navigate = useNavigate(); 
  const location = useLocation();
  
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);  
  

  // Sample enclosures data
  const [enclosures, setEnclosures] = useState([
    { returnId:'',dateEntered: "", type: "", enclosure: "" },
    // { returnId:2, dateEntered: "12/03/2024", type: "Evidence", enclosure: "Photo Evidence" },
  ]);

  // State to manage form data
  const [enclosureData, setEnclosureData] = useState({
    returnId:'',
    type: "",
    enclosure: "",
  });

  const handleInputChange = (field, value) => {
    setEnclosureData({ ...enclosureData, [field]: value });
  };

    const [file, setFile] = useState(null);
  

   // Handle file selection
   const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };
  const handleAddEnclosure = () => {
    const newEnclosure = {
      dateEntered: new Date().toLocaleDateString(),
      type: enclosureData.type,
      enclosure: enclosureData.enclosure,
    };

    // Add new enclosure to the list
    setEnclosures([...enclosures, newEnclosure]);

    // Clear form fields
    setEnclosureData({
      type: "",
      enclosure: "",
    });
  };

  // Save Enclosure: Build FormData and post to backend including token from localStorage.
  const handleSaveEnclosure = async () => {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }

    // Append other required fields
    formData.append("leadNo", selectedLead.leadNo); // Example value; update as needed
    formData.append("description", selectedLead.leadName);
    formData.append("enteredBy", localStorage.getItem("loggedInUser"));
    formData.append("caseName", selectedLead.caseName);
    formData.append("caseNo", selectedLead.caseNo);
    formData.append("leadReturnId", enclosureData.returnId); // Example value; update as needed
    formData.append("enteredDate", new Date().toISOString());
    formData.append("type", enclosureData.type);
    formData.append("enclosureDescription", enclosureData.enclosure);

    // Retrieve token from localStorage
    const token = localStorage.getItem("token");
    console.log(token);
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/lrenclosure/upload",
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`  // Add token here
          } 
        }
      );
      console.log("Enclosure saved:", response.data);
      // Optionally update local state with the new enclosure
      setEnclosures([...enclosures, response.data.enclosure]);

      // Clear form fields if needed
      setEnclosureData({ type: "", enclosure: "" });
      setFile(null);
    } catch (error) {
      console.error("Error saving enclosure:", error);
    }
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

  return (
    <div className="lrenclosures-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideo")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-contentLRE">
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
          <h2 className="title">ENCLOSURES INFORMATION</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>

        {/* Enclosure Form */}
        <div className = "content-to-add">
        <div className="enclosure-form">
        <div className="form-row">
            <label>Associated Return Id:</label>
            <input
              type="returnId"
              value={enclosureData.leadId}
              onChange={(e) => handleInputChange("returnId", e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Enclosure Type:</label>
            <input
              type="text"
              value={enclosureData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Enclosure Description:</label>
            <textarea
              value={enclosureData.enclosure}
              onChange={(e) => handleInputChange("enclosure", e.target.value)}
            ></textarea>
          </div>
          <div className="form-row">
            <label>Upload File:</label>
            <input type="file" onChange={handleFileChange} />
          </div>
        </div>
        </div>
          {/* Action Buttons */}
          <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddEnclosure}>Add Enclosure</button>
          {/* <button className="back-btn" onClick={() => handleNavigation("/LRVehicle")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LREvidence")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button> */}
        </div>

              {/* Enclosures Table */}
              <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Associated Return Id </th>
              <th>Type</th>
              <th>Enclosure</th>
            </tr>
          </thead>
          <tbody>
            {enclosures.map((enclosure, index) => (
              <tr key={index}>
                <td>{enclosure.dateEntered}</td>
                <td>{enclosure.returnId}</td>
                <td>{enclosure.type}</td>
                <td>{enclosure.enclosure}</td>
              </tr>
            ))}
          </tbody>
        </table>


        {/* Action Buttons */}
        <div className="form-buttons">
          {/* <button className="add-btn" onClick={handleAddEnclosure}>Add Enclosure</button> */}
          {/* <button className="back-btn" onClick={() => handleNavigation("/LRVehicle")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LREvidence")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button> */}
        </div>

      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREvidence")} // Takes user to CM Return page
      />
    </div>
  );
};
