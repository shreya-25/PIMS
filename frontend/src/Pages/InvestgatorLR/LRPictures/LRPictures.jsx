import Navbar from "../../../components/Navbar/Navbar";
import "./LRPictures.css";
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../../../api";


export const LRPictures = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
  const navigate = useNavigate();
    const location = useLocation();
  const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);
  const [file, setFile] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
const [editingIndex, setEditingIndex] = useState(null);

  
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
    // {
    //   dateEntered: "2024-12-01",
    //   returnId:1,
    //   datePictureTaken: "2024-11-25",
    //   description: "Picture of the crime scene from Main Street.",
    //   image: "/Materials/pict1.jpeg", // Path to your default image
    // },
    // {
    //   dateEntered: "2024-12-02",
    //   returnId:1,
    //   datePictureTaken: "2024-11-26",
    //   description: "Vehicle involved in the robbery.",
    //   image: "/Materials/pict2.jpg", // Path to your default image
    // },
    // {
    //   dateEntered: "2024-12-03",
    //   returnId:2,
    //   datePictureTaken: "2024-11-27",
    //   description: "Evidence collected at the crime location.",
    //   image: "/Materials/pict3.jpg", // Path to your default image
    // },
  ]);

  // State to manage form data
  const [pictureData, setPictureData] = useState({
    datePictureTaken: "",
    description: "",
    image: "",
    leadReturnId: "",
    filename: "" 
  });

  const handleInputChange = (field, value) => {
    setPictureData({ ...pictureData, [field]: value });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPictureData({ ...pictureData, image: URL.createObjectURL(selectedFile), filename: selectedFile.name }); // for preview
    }
  };

  // populate the form to edit a picture
const handleEditPicture = (idx) => {
  const pic = pictures[idx];
  setPictureData({
    datePictureTaken: new Date(pic.rawDatePictureTaken)
    .toISOString()
    .slice(0, 10),
    leadReturnId: pic.returnId,
    description: pic.description,
    image: pic.image,
    filename:         pic.filename
  });
  setIsEditing(true);
  setEditingIndex(idx);
  setFile(null);
};

// delete a picture
const handleDeletePicture = async (idx) => {
  if (!window.confirm("Delete this picture?")) return;
  const pic = pictures[idx];
  const token = localStorage.getItem("token");

  try {
    await api.delete(
      `/api/lrpicture/` +
      `${selectedLead.leadNo}/` +
      `${encodeURIComponent(selectedLead.leadName)}/` +
      `${selectedCase.caseNo}/` +
      `${encodeURIComponent(selectedCase.caseName)}/` +
      `${pic.returnId}/` +
      `${encodeURIComponent(pic.description)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPictures(pics => pics.filter((_, i) => i !== idx));
  } catch (err) {
    console.error("Error deleting picture:", err);
    alert("Failed to delete picture");
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
    formData.append("leadReturnId", pictureData.leadReturnId || "");
    formData.append("enteredDate", new Date().toISOString());
    formData.append("datePictureTaken", pictureData.datePictureTaken);
    formData.append("pictureDescription", pictureData.description);
  
    const token = localStorage.getItem("token");
  
    try {
      const response = await api.post(
        "/api/lrpicture/upload",
        formData,
        {
          headers: {
            "Content-Type": undefined,  
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
          image: `${BASE_URL}/uploads/${savedPicture.filename}`
        }
      ]);
  
      // Clear form
      setPictureData({
        datePictureTaken: "",
        description: "",
        image: "",
        leadReturnId: "",
        filename: ""
      });
      setFile(null);
    } catch (error) {
      console.error("Error uploading picture:", error);
      alert("Failed to upload picture.");
    }
  };

  const handleUpdatePicture = async () => {
    const pic = pictures[editingIndex];
    const token = localStorage.getItem("token");
    const fd = new FormData();
  
    // only append file if user picked a new one
    if (file) fd.append("file", file);
  
    // these must match what your controller expects
    fd.append("leadReturnId", pictureData.leadReturnId);
    fd.append("datePictureTaken", pictureData.datePictureTaken);
    fd.append("pictureDescription", pictureData.description);
    fd.append("enteredBy", localStorage.getItem("loggedInUser"));
  
    try {
      const res = await api.put(
        `/api/lrpicture/` +
        `${selectedLead.leadNo}/` +
        `${encodeURIComponent(selectedLead.leadName)}/` +
        `${selectedCase.caseNo}/` +
        `${encodeURIComponent(selectedCase.caseName)}/` +
        `${pic.returnId}/` +
        `${encodeURIComponent(pic.description)}`,
        fd,
        { headers: { Authorization: `Bearer ${token}`,  "Content-Type": "multipart/form-data" } }
      );
      const updated = res.data;
  
      // reflect update in local state
      setPictures(ps => {
        const copy = [...ps];
        copy[editingIndex] = {
          dateEntered: formatDate(updated.enteredDate),
          returnId: updated.leadReturnId,
          datePictureTaken: formatDate(updated.datePictureTaken),
          description: updated.pictureDescription,
          image: file
            ? URL.createObjectURL(file)
            : `${BASE_URL}/uploads/${updated.filename}`,
        };
        return copy;
      });
  
      // clear edit mode
      setIsEditing(false);
      setEditingIndex(null);
      setPictureData({ datePictureTaken: "", leadReturnId: "", description: "", image: "",
        filename: "" });
      setFile(null);
    } catch (err) {
      console.error("Error updating:", err);
      alert("Failed to update picture");
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
      const res = await api.get(
        `/api/lrpicture/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            "Content-Type": undefined,  
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const mappedPictures = res.data.map((pic) => ({
        dateEntered: formatDate(pic.enteredDate),
        rawEnteredDate:  pic.enteredDate, 
        returnId: pic.leadReturnId,
        datePictureTaken: formatDate(pic.datePictureTaken),
        rawDatePictureTaken: pic.datePictureTaken,
        description: pic.pictureDescription,
          image: `${BASE_URL}/uploads/${pic.filename}`,
          filename: pic.filename  
      }));
      const withAccess = mappedPictures.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
  
      setPictures(withAccess);
    } catch (error) {
      console.error("Error fetching pictures:", error);
    }
  };

  const isCaseManager = selectedCase?.role === "Case Manager";
  // handler to change access per row
const handleAccessChange = (idx, newAccess) => {
  setPictures(rs => {
    const copy = [...rs];
    copy[idx] = { ...copy[idx], access: newAccess };
    return copy;
  });
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

            {pictureData.filename && (
              <div style={{ marginTop: 4, marginLeft: 8 }}>
                <em>Current file:</em> {pictureData.filename}
              </div>
            )}
          </div>
        </div>
        <div className="form-buttons">
        <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

           className="save-btn1" 
           onClick={isEditing ? handleUpdatePicture : handleAddPicture}>
            {isEditing ? "Update Picture" : "Add Picture"}</button>
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
              <th>Return Id </th>
              <th>Date Picture Taken</th>
              <th>Description</th>
              <th></th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {pictures.length > 0 ? pictures.map((picture, index) => (
              <tr key={index}>
                <td>{picture.dateEntered}</td>
                <td>{picture.returnId}</td>
                <td>{picture.datePictureTaken}</td>
                <td>{picture.description}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditPicture(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDeletePicture(index)}
                />
                  </button>
                  </div>
                </td>
                {isCaseManager && (
          <td>
            <select
              value={picture.access}
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
          <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign:'center' }}>
            No Pictures Available
          </td>
        </tr>
      )}
          </tbody>
        </table>
        <Comment tag= "Pictures"/>
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
