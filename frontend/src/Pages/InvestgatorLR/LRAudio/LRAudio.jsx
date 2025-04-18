import Navbar from '../../../components/Navbar/Navbar';
import "./LRAudio.css"; // Custom CSS file for Audio styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";

export const LRAudio = () => {
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
    

  // Sample audio data
  const [audioFiles, setAudioFiles] = useState([
  ]);

  // State to manage form data
  const [audioData, setAudioData] = useState({
    dateAudioRecorded: "",
    description: "",
    audioSrc: "",
    leadReturnId: "",
  });

  const handleInputChange = (field, value) => {
    setAudioData({ ...audioData, [field]: value });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const audioUrl = URL.createObjectURL(selectedFile);
      setFile(selectedFile); // ✅ This was missing
      setAudioData({ ...audioData, audioSrc: audioUrl });
    }
  };
  

  const handleAddAudio = async () => {
    const formData = new FormData();
  
    // Validation
    if (!file ||  !audioData.leadReturnId || !audioData.dateAudioRecorded || !audioData.description) {
      alert("Please fill in all required fields and select a file.");
      return;
    }
  
    // File and fields
    formData.append("file", file);
    formData.append("leadNo", selectedLead?.leadNo);
    formData.append("description", selectedLead?.leadName);
    formData.append("enteredBy", localStorage.getItem("loggedInUser"));
    formData.append("caseName", selectedCase?.caseName);
    formData.append("caseNo", selectedCase?.caseNo);
    formData.append("leadReturnId", audioData.leadReturnId);
    formData.append("enteredDate", new Date().toISOString());
    formData.append("dateAudioRecorded", audioData.dateAudioRecorded);
    formData.append("audioDescription", audioData.description);
  
    const token = localStorage.getItem("token");
  
    try {
      const response = await axios.post(
        "http://localhost:5000/api/lraudio/upload",
        formData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
  
      const savedAudio = response.data.audio;
  
      setAudioFiles((prev) => [
        ...prev,
        {
          dateEntered: formatDate(savedAudio.enteredDate),
          returnId: savedAudio.leadReturnId,
          dateAudioRecorded: formatDate(savedAudio.dateAudioRecorded),
          description: savedAudio.audioDescription,
          audioSrc: `http://localhost:5000/uploads/${savedAudio.filename}`,
        },
      ]);
  
      // Reset form
      setAudioData({
        dateAudioRecorded: "",
        description: "",
        audioSrc: "",
        leadReturnId: "",
      });
      setFile(null);
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Failed to upload audio.");
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

                const fetchAudioFiles = async () => {
                  const token = localStorage.getItem("token");
                
                  const leadNo = selectedLead?.leadNo;
                  const leadName = encodeURIComponent(selectedLead?.leadName);
                  const caseNo = selectedCase?.caseNo;
                  const caseName = encodeURIComponent(selectedCase?.caseName);
                
                  try {
                    const res = await axios.get(
                      `http://localhost:5000/api/lraudio/${leadNo}/${leadName}/${caseNo}/${caseName}`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );
                
                    const mappedAudios = res.data.map((audio) => ({
                      dateEntered: formatDate(audio.enteredDate),
                      returnId: audio.leadReturnId,
                      dateAudioRecorded: formatDate(audio.dateAudioRecorded),
                      description: audio.audioDescription,
                      audioSrc: `http://localhost:5000/uploads/${audio.filename}`,
                    }));
                
                    setAudioFiles(mappedAudios);
                  } catch (error) {
                    console.error("Error fetching audios:", error);
                  }
                };

                useEffect(() => {
                  if (
                    selectedLead?.leadNo &&
                    selectedLead?.leadName &&
                    selectedCase?.caseNo &&
                    selectedCase?.caseName
                  ) {
                    fetchAudioFiles();
                  }
                }, [selectedLead, selectedCase]);
                

  return (
    <div className="lraudio-container">
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
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideo")}>Videos</span>
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



        <div className="case-header">
          <h2 className="">AUDIO INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Audio Form */}
        <div className = "timeline-form-sec">
        <h4 className="evidence-form-h4">Enter Audio Details</h4>
        <div className="audio-form">
          <div className="form-row-audio">
            <label className="evidence-head">Date Audio Recorded*</label>
            <input
              type="date"
              value={audioData.dateAudioRecorded}
              className="evidence-head"
              onChange={(e) => handleInputChange("dateAudioRecorded", e.target.value)}
            />
          </div>
          <div className="form-row-audio">
            <label className="evidence-head">Return Id*</label>
            <input
              type="text"
              value={audioData.leadReturnId}
              className="evidence-head"
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
            />
          </div>
          <div className="form-row-audio">
            <label className="evidence-head">Description</label>
            <textarea
              value={audioData.description}
              className="evidence-head"
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
          <div className="form-row-audio">
            <label className="evidence-head">Upload Audio*</label>
            
            <input type="file" accept="audio/*" className="evidence-head" onChange={handleFileChange} />
          </div>
        </div>
        <div className="form-buttons-audio">
        <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

          className="save-btn1" onClick={handleAddAudio}>Add Audio</button>
         </div>
         {/* Uploaded Audio Preview */}
         <div className="uploaded-audio">
          <h4 className="evidence-head">Uploaded Audio</h4>
          <div className="audio-gallery">
            {audioFiles.map((audio, index) => (
              <div key={index} className="audio-card">
                <audio controls>
                  <source src={audio.audioSrc} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
                <p>{audio.description}</p>
              </div>
            ))}
          </div>
        </div>
        </div>

           {/* Audio Files Table */}
           <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "11%" }}>Date Entered</th>
              <th style={{ width: "10%" }}>Return Id </th>
              <th>Date Audio Recorded</th>
              <th>Description</th>
              <th style={{ width: "13%" }}></th>
            </tr>
          </thead>
          <tbody>
            {audioFiles.map((audio, index) => (
              <tr key={index}>
                <td>{audio.dateEntered}</td>
                <td>{audio.returnId}</td>
                <td>{audio.dateAudioRecorded}</td>
                <td>{audio.description}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  // onClick={() => handleEditReturn(ret)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

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
        <Comment tag="Audio" />
      </div>
      </div>

       

        {/* Action Buttons */}
        {/* <div className="form-buttons-audio">
          <button className="add-btn" onClick={handleAddAudio}>Add Audio</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRPictures")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRVideos")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
      
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVideo")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
