import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./CMVideo.css"; // Custom CSS file for Video styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Attachment from "../../../components/Attachment/Attachment";




export const CMVideo = () => {
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
    

  // Sample video data
  const [videos, setVideos] = useState([
    {
      dateEntered: "12/01/24",
      dateVideoRecorded: "12/01/24",
      description: "Surveillance video of the incident.",
      videoSrc: `${process.env.PUBLIC_URL}/Materials/video1.mp4`
    
    },
    {
      dateEntered: "12/02/24",
      dateVideoRecorded: "12/02/24",
      description: "Witness interview recording.",
      videoSrc: `${process.env.PUBLIC_URL}/Materials/video2.mp4`
    },
  ]);

  // State to manage form data
  const [videoData, setVideoData] = useState({
    dateVideoRecorded: "",
    description: "",
    videoSrc: "",
  });

  const handleInputChange = (field, value) => {
    setVideoData({ ...videoData, [field]: value });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setVideoData({ ...videoData, videoSrc: videoUrl });
    }
  };

  const handleAddVideo = () => {
    const newVideo = {
      dateEntered: new Date().toLocaleDateString(),
      dateVideoRecorded: videoData.dateVideoRecorded,
      description: videoData.description,
      videoSrc: videoData.videoSrc || "/Materials/default-video.mp4", // Default video if not provided
    };

    // Add new video to the list
    setVideos([...videos, newVideo]);

    // Clear form fields
    setVideoData({
      dateVideoRecorded: "",
      description: "",
      videoSrc: "",
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
    <div className="lrvideos-container">
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
          <span className="menu-item" onClick={() => handleNavigation("/CMAudio")}>Audio</span>
          <span className="menu-item active" onClick={() => handleNavigation("/CMVideos")}>Videos</span>
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
        <div className="case-header">
          <h2 className="">VIDEO INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">


        
          {/* <div className = "content-to-add">
          <h4 className="evidence-form-h4">Enter Video Details</h4>
        <div className="video-form">
          <div className="form-row-video">
            <label className="evidence-head">Date Video Recorded:</label>
            <input
              type="date"
              value={videoData.dateVideoRecorded}
              className="evidence-head"
              onChange={(e) => handleInputChange("dateVideoRecorded", e.target.value)}
            />
          </div>
          <div className="form-row-video">
            <label className="evidence-head">Description:</label>
            <textarea
              value={videoData.description}
              className="evidence-head"
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
          <div className="form-row-video">
            <label className="evidence-head">Upload Video:</label>
            <input type="file" accept="video/*" className="evidence-head" onChange={handleFileChange} />
          </div>
        </div>

      
        <div className="uploaded-video">
          <h4 className="evidence-head">Uploaded Videos</h4>
          <div className="video-gallery">
            {videos.map((video, index) => (
              <div key={index} className="video-card">
                <video controls>
                  <source src={video.videoSrc} type="video/mp4"className="evidence-head" />
                  Your browser does not support the video tag.
                </video>
                <p className="evidence-head">{video.description}</p>
              </div>
            ))}
          </div>
        </div>
        </div> */}

        {/* <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddVideo}>Add Video</button>
          </div> */}
      
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Date Entered</th>
              <th style={{ width: "16%" }}>Date Video Recorded</th>
              <th>Description</th>
              <th style={{ width: "15%" }}>Access</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video, index) => (
              <tr key={index}>
                <td>{video.dateEntered}</td>
                <td>{video.dateVideoRecorded}</td>
                <td>{video.description}</td>
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
