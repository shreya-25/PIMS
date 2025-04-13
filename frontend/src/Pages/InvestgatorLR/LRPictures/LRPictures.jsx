import Navbar from "../../../components/Navbar/Navbar";
import "./LRPictures.css";
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";

export const LRPictures = () => {
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
  const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);
  const [file, setFile] = useState(null);

  
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
  
   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

  // Default pictures data
  const [pictures, setPictures] = useState([
    {
      dateEntered: "2024-12-01",
      returnId:1,
      datePictureTaken: "2024-11-25",
      description: "Picture of the crime scene from Main Street.",
      image: "/Materials/pict1.jpeg", // Path to your default image
    },
    {
      dateEntered: "2024-12-02",
      returnId:1,
      datePictureTaken: "2024-11-26",
      description: "Vehicle involved in the robbery.",
      image: "/Materials/pict2.jpg", // Path to your default image
    },
    {
      dateEntered: "2024-12-03",
      returnId:2,
      datePictureTaken: "2024-11-27",
      description: "Evidence collected at the crime location.",
      image: "/Materials/pict3.jpg", // Path to your default image
    },
  ]);

  // State to manage form data
  const [pictureData, setPictureData] = useState({
    datePictureTaken: "",
    description: "",
    image: "",
    leadReturnId: "",
  });

  const handleInputChange = (field, value) => {
    setPictureData({ ...pictureData, [field]: value });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPictureData({ ...pictureData, image: URL.createObjectURL(selectedFile) }); // for preview
    }
  };
  

  const handleAddPicture = async () => {
    const formData = new FormData();
  
    // Validate required fields
    if (!file || !pictureData.datePictureTaken || !pictureData.description) {
      alert("Please fill in all required fields and select a file.");
      return;
    }
  
    // Append image file
    formData.append("file", file);
  
    // Append textual fields
    formData.append("leadNo", selectedLead?.leadNo);
    formData.append("description", selectedLead?.leadName);
    formData.append("enteredBy", localStorage.getItem("loggedInUser"));
    formData.append("caseName", selectedCase?.caseName);
    formData.append("caseNo", selectedCase?.caseNo);
    formData.append("leadReturnId", pictureData.returnId || "1"); // Use returnId from formData if applicable
    formData.append("enteredDate", new Date().toISOString());
    formData.append("datePictureTaken", pictureData.datePictureTaken);
    formData.append("pictureDescription", pictureData.description);
  
    const token = localStorage.getItem("token");
  
    try {
      const response = await axios.post(
        "http://localhost:5000/api/lrpicture/upload",
        formData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
  
      const savedPicture = response.data.picture;
  
      // Add newly saved picture to the table list
      setPictures(prev => [
        ...prev,
        {
          dateEntered: formatDate(savedPicture.enteredDate),
          returnId: savedPicture.leadReturnId,
          datePictureTaken: formatDate(savedPicture.datePictureTaken),
          description: savedPicture.pictureDescription,
          image: `http://localhost:5000/uploads/${savedPicture.filename}`
        }
      ]);
  
      // Clear form
      setPictureData({
        datePictureTaken: "",
        description: "",
        image: "",
      });
      setFile(null);
    } catch (error) {
      console.error("Error uploading picture:", error);
      alert("Failed to upload picture.");
    }
  };
  

  const handleNavigation = (route) => {
    navigate(route);
  };

  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchPictures();
    }
  }, [selectedLead, selectedCase]);
  
  const fetchPictures = async () => {
    const token = localStorage.getItem("token");
  
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);
  
    try {
      const res = await axios.get(
        `http://localhost:5000/api/lrpicture/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const mappedPictures = res.data.map((pic) => ({
        dateEntered: formatDate(pic.enteredDate),
        returnId: pic.leadReturnId,
        datePictureTaken: formatDate(pic.datePictureTaken),
        description: pic.pictureDescription,
          image: `http://localhost:5000/uploads/${pic.filename}`
      }));
  
      setPictures(mappedPictures);
    } catch (error) {
      console.error("Error fetching pictures:", error);
    }
  };
  

  return (
    <div className="lrpictures-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
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
                <div className="left-content">

                  

        {/* Center Section */}
        <div className="case-header">
          <h2 className="">PICTURES INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Picture Form */}
        <div className = "timeline-form-sec">
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
            <label  className="evidence-head">Lead Return Id:</label>
            <input
              type="leadReturnId"
              value={pictureData.leadReturnId}
               className="evidence-head"
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
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
        <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddPicture}>Add Picture</button>
        </div>
        {/* Uploaded Pictures Preview */}
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
        </div>


           {/* Pictures Table */}
           <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Associated Return Id </th>
              <th>Date Picture Taken</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pictures.map((picture, index) => (
              <tr key={index}>
                <td>{picture.dateEntered}</td>
                <td>{picture.returnId}</td>
                <td>{picture.datePictureTaken}</td>
                <td>{picture.description}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  // onClick={() => handleEditReturn(ret)}
                />
                  </button>
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  // onClick={() => handleDeleteReturn(ret.id)}
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
    </div>
    
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRAudio")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
