import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./LRVideo.css"; // Custom CSS file for Video styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";



export const LRVideo = () => {
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
  const [file, setFile] = useState(null);
  const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);
  

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setVideoData({ ...videoData, videoSrc: URL.createObjectURL(selectedFile) }); // preview
    }
  };
  
      
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
      

  // Sample video data
  const [videos, setVideos] = useState([
  ]);

  // State to manage form data
  const [videoData, setVideoData] = useState({
    dateVideoRecorded: "",
    description: "",
    videoSrc: "",
    leadReturnId: "",
  });

  const handleInputChange = (field, value) => {
    setVideoData({ ...videoData, [field]: value });
  };

  const handleAddVideo = async () => {
    if (!file || !videoData.dateVideoRecorded || !videoData.description || !videoData.leadReturnId) {
      alert("Please fill in all required fields and select a file.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("leadNo", selectedLead?.leadNo);
    formData.append("description", selectedLead?.leadName);
    formData.append("enteredBy", localStorage.getItem("loggedInUser"));
    formData.append("caseName", selectedCase?.caseName);
    formData.append("caseNo", selectedCase?.caseNo);
    formData.append("leadReturnId", videoData.leadReturnId);
    formData.append("enteredDate", new Date().toISOString());
    formData.append("dateVideoRecorded", videoData.dateVideoRecorded);
    formData.append("videoDescription", videoData.description);
  
    const token = localStorage.getItem("token");
  
    try {
      const response = await axios.post(
        "http://localhost:5000/api/lrvideo/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const savedVideo = response.data.video;
      setVideos((prev) => [
        ...prev,
        {
          dateEntered: formatDate(savedVideo.enteredDate),
          returnId: savedVideo.leadReturnId,
          dateVideoRecorded: formatDate(savedVideo.dateVideoRecorded),
          description: savedVideo.videoDescription,
          videoSrc: `http://localhost:5000/uploads/${savedVideo.filename}`,
        },
      ]);
  
      setVideoData({
        dateVideoRecorded: "",
        description: "",
        videoSrc: "",
        leadReturnId: "",
      });
      setFile(null);
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Failed to upload video.");
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

                  useEffect(() => {
                    if (
                      selectedLead?.leadNo &&
                      selectedLead?.leadName &&
                      selectedCase?.caseNo &&
                      selectedCase?.caseName
                    ) {
                      fetchVideos();
                    }
                  }, [selectedLead, selectedCase]);
                  
                  const fetchVideos = async () => {
                    const token = localStorage.getItem("token");
                    const leadNo = selectedLead?.leadNo;
                    const leadName = encodeURIComponent(selectedLead?.leadName);
                    const caseNo = selectedCase?.caseNo;
                    const caseName = encodeURIComponent(selectedCase?.caseName);
                  
                    try {
                      const res = await axios.get(
                        `http://localhost:5000/api/lrvideo/${leadNo}/${leadName}/${caseNo}/${caseName}`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                  
                      const mappedVideos = res.data.map((video) => ({
                        dateEntered: formatDate(video.enteredDate),
                        returnId: video.leadReturnId,
                        dateVideoRecorded: formatDate(video.dateVideoRecorded),
                        description: video.videoDescription,
                        videoSrc: `http://localhost:5000/uploads/${video.filename}`,
                      }));
                  
                      setVideos(mappedVideos);
                    } catch (error) {
                      console.error("Error fetching videos:", error);
                    }
                  };
                  
  return (
    <div className="lrvideos-container">
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
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
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
          <h2 className="">VIDEO INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Video Form */}
        <div className = "timeline-form-sec">
        <h4 className="evidence-form-h4">Enter Video Details</h4>
        <div className="video-form">
          <div className="form-row-video">
            <label className="evidence-head">Date Video Recorded*</label>
            <input
              type="date"
              value={videoData.dateVideoRecorded}
              className="evidence-head"
              onChange={(e) => handleInputChange("dateVideoRecorded", e.target.value)}
            />
          </div>
          <div className="form-row-video">
            <label className="evidence-head">Lead Return Id*</label>
            <input
              type="text"
              value={videoData.leadReturnId}
              className="evidence-head"
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
            />
          </div>
          <div className="form-row-video">
            <label className="evidence-head">Description*</label>
            <textarea
              value={videoData.description}
              className="evidence-head"
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
          <div className="form-row-video">
            <label className="evidence-head">Upload Video*</label>
            <input type="file" accept="video/*" className="evidence-head" onChange={handleFileChange} />
          </div>
        </div>
        <div className="form-buttons-video">
        <button className="save-btn1" onClick={handleAddVideo}>Add Video</button>
        </div>

        {/* Uploaded Video Preview */}
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
        </div>




            {/* Videos Table */}
            <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>Date Entered</th>
              <th style={{ width: "10%" }}> Return Id </th>
              <th>Date Video Recorded</th>
              <th>Description</th>
              <th style={{ width: "13%" }}></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video, index) => (
              <tr key={index}>
                <td>{video.dateEntered}</td>
                <td>{video.returnId} </td>
                <td>{video.dateVideoRecorded}</td>
                <td>{video.description}</td>
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
        <Comment tag="Video" />
        </div>
        {/* Action Buttons */}
        {/* <div className="form-buttons-video">
          <button className="add-btn" onClick={handleAddVideo}>Add Video</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRAudio")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
      </div>

      <FootBar
         onPrevious={() => navigate(-1)} // Takes user to the last visited page
         onNext={() => navigate("/LRScratchpad")} // Takes user to CM Return page
       />
    </div>
    </div>
    </div>
  );
};
