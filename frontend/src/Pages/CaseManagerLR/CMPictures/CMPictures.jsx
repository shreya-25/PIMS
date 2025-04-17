import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./CMPictures.css";
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Attachment from "../../../components/Attachment/Attachment";




export const CMPictures = () => {
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  const { leadDetails, caseDetails } = location.state || {};
    const { selectedCase, selectedLead, leadInstructions, leadReturns} = useContext(CaseContext);
    const getCasePageRoute = () => {
      if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
      return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };
  


  // Default pictures data
  const [pictures, setPictures] = useState([
    {
      dateEntered: "12/01/24",
      datePictureTaken: "11/25/24",
      description: "Picture of the crime scene from Main Street.",
      image: "/Materials/pict1.jpeg", // Path to your default image
    },
    {
      dateEntered: "12/02/24",
      datePictureTaken: "11/26/24",
      description: "Vehicle involved in the robbery.",
      image: "/Materials/pict2.jpg", // Path to your default image
    },
    {
      dateEntered: "12/03/24",
      datePictureTaken: "11/27/24",
      description: "Evidence collected at the crime location.",
      image: "/Materials/pict3.jpg", // Path to your default image
    },
  ]);

  // State to manage form data
  const [pictureData, setPictureData] = useState({
    datePictureTaken: "",
    description: "",
    image: "",
  });

  const handleInputChange = (field, value) => {
    setPictureData({ ...pictureData, [field]: value });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPictureData({ ...pictureData, image: imageUrl });
    }
  };

  const handleAddPicture = () => {
    const newPicture = {
      dateEntered: new Date().toLocaleDateString(),
      datePictureTaken: pictureData.datePictureTaken,
      description: pictureData.description,
      image: pictureData.image || `${process.env.PUBLIC_URL}/Materials/default-image.jpg`, // Default image if not provided
    };

    // Add new picture to the list
    setPictures([...pictures, newPicture]);

    // Clear form fields
    setPictureData({
      datePictureTaken: "",
      description: "",
      image: "",
    });
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
    <div className="lrpictures-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/CMInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMEvidence")}>Evidence</span>
          <span className="menu-item active" onClick={() => handleNavigation("/CMPictures")}>Pictures</span>
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
      <ul className="sidebar-list">
      <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li>            
            <li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>
            <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item active" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li> */}
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>
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
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>
            <li className="sidebar-item"onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>View Lead Chain of Custody</li>


         </ul>
                </div>
                <div className="left-content">

                  

        {/* Center Section */}
        <div className="case-header">
          <h2 className="">PICTURES INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">
       
        {/* <div className = "content-to-add">
        <h4 className="evidence-form-h4">Enter Picture Details</h4>
        <div className="picture-form">
          <div className="form-row-pic">
            <label  className="evidence-head">Date Picture Taken:</label>
            <input
              type="date"
              value={pictureData.datePictureTaken}
               className="evidence-head"
              onChange={(e) => handleInputChange("datePictureTaken", e.target.value)}
            />
          </div>
          <div className="form-row-pic">
            <label  className="evidence-head">Description:</label>
            <textarea
              value={pictureData.description}
               className="evidence-head"
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
          <div className="form-row-pic">
            <label  className="evidence-head">Upload Image:</label>
            <input type="file" accept="image/*"  className="evidence-head" onChange={handleFileChange} />
          </div>
        </div>
       
        <div className="uploaded-pictures">
          <h4 className="evidence-head">Uploaded Pictures</h4>
          <div className="pictures-gallery">
            {pictures.map((picture, index) => (
              <div key={index} className="picture-card">
                <img src={picture.image} alt={`Uploaded ${index + 1}`} className="uploaded-image" />
                <p className="evidence-head">{picture.description}</p>
              </div>
            ))}
          </div>
        </div>
        </div> */}
{/* 
        <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddPicture}>Add Picture</button>
        </div> */}

        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Date Entered</th>
              <th style={{ width: "15%" }}>Date Picture Taken</th>
              <th>Description</th>
              <th style={{ width: "15%" }}>Access</th>
            </tr>
          </thead>
          <tbody>
            {pictures.map((picture, index) => (
              <tr key={index}>
                <td>{picture.dateEntered}</td>
                <td>{picture.datePictureTaken}</td>
                <td>{picture.description}</td>
                <td>
        <select
          value={ "Case Manager"}
           // Pass index properly
        >
          <option value="Case Manager">Case Manager</option>
          <option value="Everyone">Everyone</option>
        </select>
      </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Attachment />
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
