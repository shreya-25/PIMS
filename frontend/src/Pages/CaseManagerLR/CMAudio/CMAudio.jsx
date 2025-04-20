import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./CMAudio.css"; // Custom CSS file for Audio styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Attachment from "../../../components/Attachment/Attachment";

export const CMAudio = () => {
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
  const { selectedCase, selectedLead, leadInstructions, leadReturns} = useContext(CaseContext);


  
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
    // {
    //   dateEntered: "12/01/2024",
    //   dateAudioRecorded: "12/01/2024",
    //   description: "Audio recording of the witness interview.",
    //   audioSrc: "/assets/sample-audio.mp3", // Replace with actual audio path
    // },
    // {
    //   dateEntered: "12/02/2024",
    //   dateAudioRecorded: "12/02/2024",
    //   description: "Recording from the crime scene.",
    //   audioSrc: "/assets/sample-audio2.mp3", // Replace with actual audio path
    // },
  ]);

    const [file, setFile] = useState(null);

  // State to manage form data
  const [audioData, setAudioData] = useState({
    dateAudioRecorded: "",
    description: "",
    audioSrc: "",
  });

  const handleInputChange = (field, value) => {
    setAudioData({ ...audioData, [field]: value });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const audioUrl = URL.createObjectURL(file);
      setAudioData({ ...audioData, audioSrc: audioUrl });
    }
  };

  const handleAddAudio = () => {
    const newAudio = {
      dateEntered: new Date().toLocaleDateString(),
      dateAudioRecorded: audioData.dateAudioRecorded,
      description: audioData.description,
      audioSrc: audioData.audioSrc || "/Materials/default-audio.mp3", // Default audio if not provided
    };

    // Add new audio to the list
    setAudioFiles([...audioFiles, newAudio]);

    // Clear form fields
    setAudioData({
      dateAudioRecorded: "",
      description: "",
      audioSrc: "",
    });
  };

  useEffect(() => {
    const fetchAudios = async () => {
      if (!selectedLead || !selectedCase) {
        console.warn("Missing selected lead or case details");
        return;
      }
      // Build URL using selectedLead and selectedCase; URL-encode values that may have spaces
      const leadNo = selectedLead.leadNo;
      const leadName = encodeURIComponent(selectedLead.leadName);
      const caseNo = encodeURIComponent(selectedLead.caseNo);
      // Here, assuming caseName is in selectedLead or selectedCase; adjust as needed.
      const caseName = encodeURIComponent(selectedLead.caseName || selectedCase.caseName);
      const token = localStorage.getItem("token");

      const url = `http://localhost:5000/api/lraudio/${leadNo}/${leadName}/${caseNo}/${caseName}`;
      try {
        const response = await axios.get(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("Fetched audios:", response.data);
        setAudioFiles(response.data);
      } catch (error) {
        console.error("Error fetching audios:", error);
      }
    };

    fetchAudios();
  }, [selectedLead, selectedCase]);


  const handleNavigation = (route) => {
    navigate(route);
  };
  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};

   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

  return (
    <div className="lraudio-container">
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
          <span className="menu-item" onClick={() => handleNavigation("/CMPictures")}>Pictures</span>
          <span className="menu-item active" onClick={() => handleNavigation("/CMAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/CMVideo")}>Videos</span>
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
         </ul>
       </div>
      <div className="left-content">



        <div className="case-header">
          <h2 className="">AUDIO INFORMATION</h2>
        </div>
    

    
         {/* <div className = "content-to-add">
         <h4 className="evidence-form-h4">Enter Audio Details</h4>
        <div className="audio-form">
          <div className="form-row-audio">
            <label className="evidence-head">Date Audio Recorded:</label>
            <input
              type="date"
              value={audioData.dateAudioRecorded}
              className="evidence-head"
              onChange={(e) => handleInputChange("dateAudioRecorded", e.target.value)}
            />
          </div>
          <div className="form-row-audio">
            <label className="evidence-head">Description:</label>
            <textarea
              value={audioData.description}
              className="evidence-head"
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
          <div className="form-row-audio">
            <label className="evidence-head">Upload Audio:</label>
            
            <input type="file" accept="audio/*" className="evidence-head" onChange={handleFileChange} />
          </div>
        </div>

       
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
        </div> */}

<div className = "LRI-content-section">

<div className = "content-subsection">
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Date Entered</th>
              <th style={{ width: "10%" }}>Return ID</th>
              <th style={{ width: "18%" }}>Date Audio Recorded</th>
              <th>Description</th>
              <th style={{ width: "15%" }}>Access</th>
            </tr>
          </thead>
          <tbody>
            {audioFiles.map((audio, index) => (
              <tr key={index}>
                <td>{formatDate(audio.enteredDate)}</td>
                <td>{audio.returnId || "A"}</td>
                <td>{formatDate(audio.dateAudioRecorded)}</td>
                <td>{audio.description}</td>
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

       <Attachment attachments={audioFiles.map(e => ({
                  name: e.originalName || e.filename,
                  // Optionally include size and date if available:
                  size: e.size || "N/A",
                  date: e.enteredDate ? new Date(e.enteredDate).toLocaleString() : "N/A",
                  // Build a URL to view/download the file
                  url: `http://localhost:5000/uploads/${e.filename}`
                }))} />
      

      <Comment tag="Audio" />
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
