import React, { useContext, useState, useEffect,useRef } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./LRVideo.css"; // Custom CSS file for Video styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";

export const LRVideo = () => {
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
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);
  const [editingIndex, setEditingIndex] = useState(null);
      const [leadData, setLeadData] = useState({});

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setVideoData({ ...videoData, videoSrc: URL.createObjectURL(selectedFile) }); // preview
    }
  };

  const [videoData, setVideoData] = useState({
    dateVideoRecorded: "",
    leadReturnId: "",
    description: "",
    // isLink + link allow toggling between file-upload vs URL
    isLink: false,
    link: "",
    videoSrc: "",
    filename: "",      // used for showing “Current file:” when editing
    accessLevel: "Everyone" // default access level
  });
  
      
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

    const handleFileChangeWrapper = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setVideoData({
        ...videoData,
        videoSrc: URL.createObjectURL(selectedFile),
        filename: selectedFile.name
      });
    }
  };

     useEffect(() => {
    const fetchLeadData = async () => {
      if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;
      const token = localStorage.getItem("token");

      try {
        const response = await api.get(
          `/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.length > 0) {
          setLeadData({
            ...response.data[0],
            assignedTo: response.data[0].assignedTo || [],
            leadStatus: response.data[0].leadStatus || ''
          });
        }
      } catch (error) {
        console.error("Failed to fetch lead data:", error);
      }
    };

    fetchLeadData();
  }, [selectedLead, selectedCase]);

    const handleSubmitReport = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!selectedLead || !selectedCase) {
        alert("No lead or case selected!");
        return;
      }

      const body = {
        leadNo: selectedLead.leadNo,
        description: selectedLead.leadName,
        caseNo: selectedCase.caseNo,
        caseName: selectedCase.caseName,
        submittedDate: new Date(),
        assignedTo: {
          assignees: leadData.assignedTo || [],
          lRStatus: "Submitted"
        },
        assignedBy: {
          assignee: localStorage.getItem("officerName") || "Unknown Officer",
          lRStatus: "Pending"
        }
      };

      const response = await api.post("/api/leadReturn/create", body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 201) {
        const statusResponse = await api.put(
          "/api/lead/status/in-review",
          {
            leadNo: selectedLead.leadNo,
            description: selectedLead.leadName,
            caseNo: selectedCase.caseNo,
            caseName: selectedCase.caseName
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (statusResponse.status === 200) {
          setLeadStatus("In Review");

            setSelectedLead(prev => ({
            ...prev,
            leadStatus: "In Review"
          }));
          
          alert("Lead Return submitted and status set to 'In Review'");
        const manager    = leadData.assignedBy;                  // string username
        const investigators = (leadData.assignedTo || []).map(a => a.username);
        if (manager) {
          const payload = {
            notificationId: Date.now().toString(),
            assignedBy:     localStorage.getItem("loggedInUser"),
            assignedTo:     [{ username: manager, status: "pending" }],
            action1:        "submitted a lead return for review",
            post1:          `${selectedLead.leadNo}: ${selectedLead.leadName}`,
            caseNo:         selectedCase.caseNo,
            caseName:       selectedCase.caseName,
            leadNo:         selectedLead.leadNo,
            leadName:       selectedLead.leadName,
            type:           "Lead"
          };
          await api.post("/api/notifications", payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        alert("Lead Return submitted and Case Manager notified.");
        } else {
          alert("Lead Return submitted but status update failed.");
        }
      } else {
        alert("Failed to submit Lead Return");
      }
    } catch (error) {
      console.error("Error during Lead Return submission or status update:", error);
      alert("Something went wrong while submitting the report.");
    }
  };

  const handleInputChange = (field, value) => {
    setVideoData({ ...videoData, [field]: value });
  };

   const handleAddVideo = async () => {
    // Validation:
    if (
      videoData.isLink
        ? !videoData.link.trim() || !videoData.leadReturnId || !videoData.dateVideoRecorded
        : !file || !videoData.leadReturnId || !videoData.dateVideoRecorded || !videoData.description
    ) {
      alert("Please fill in all required fields and either select a file or enter a valid link.");
      return;
    }

    // Build FormData
    const fd = new FormData();
    if (!videoData.isLink) {
      fd.append("file", file);
    }
    fd.append("leadNo", selectedLead.leadNo);
    fd.append("description", selectedLead.leadName);
    fd.append("enteredBy", localStorage.getItem("loggedInUser"));
    fd.append("caseName", selectedCase.caseName);
    fd.append("caseNo", selectedCase.caseNo);
    fd.append("leadReturnId", videoData.leadReturnId);
    fd.append("enteredDate", new Date().toISOString());
    fd.append("dateVideoRecorded", videoData.dateVideoRecorded);
    fd.append("videoDescription", videoData.description);
    fd.append("accessLevel", videoData.accessLevel);

    // Link fields
    fd.append("isLink", videoData.isLink);
    if (videoData.isLink) {
      fd.append("link", videoData.link.trim());
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/api/lrvideo/upload",
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`
            // ⇢ no Content-Type: let browser set multipart/form-data boundary
          },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        }
      );

      // Re-fetch video list
      await fetchVideos();

      // Reset form
      setVideoData({
        dateVideoRecorded: "",
        leadReturnId: "",
        description: "",
        isLink: false,
        link: "",
        videoSrc: "",
        filename: "",
        accessLevel: "Everyone"
      });
      setFile(null);

      // Clear native file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error uploading video:", err);
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
                      const res = await api.get(
                        `/api/lrvideo/${leadNo}/${leadName}/${caseNo}/${caseName}`,
                        {
                          headers: {
                            "Content-Type": undefined,  
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                  
                      const mappedVideos = res.data.map((video) => ({
        id: video._id,
        dateEntered: formatDate(video.enteredDate),
        returnId: video.leadReturnId,
        dateVideoRecorded: formatDate(video.dateVideoRecorded),
        rawDateVideoRecorded: video.dateVideoRecorded,
        description: video.videoDescription,
        filename: video.filename,       // needed to construct a download URL
        originalName: video.originalName || "",
        videoSrc: `${BASE_URL}/uploads/${video.filename}`,
        link: video.link || "",
        isLink: video.isLink,
        accessLevel: video.accessLevel || "Everyone"
      }));

                      const withAccess = mappedVideos.map(r => ({
                        ...r,
                        accessLevel: r.accessLevel ?? "Everyone"
                      }));
                  
                      setVideos(withAccess);
                    } catch (error) {
                      console.error("Error fetching videos:", error);
                    }
                  };

                  const handleAccessChange = (idx, newAccess) => {
                    setVideos(rs => {
                      const copy = [...rs];
                      copy[idx] = { ...copy[idx], accessLevel: newAccess };
                      return copy;
                    });
                  };
                    const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";  
                  
                  const handleEditVideo = (idx) => {
    const v = videos[idx];
    setEditingIndex(idx);

    // Clear any leftover file in <input>
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFile(null);

    setVideoData({
      dateVideoRecorded: new Date(v.rawDateVideoRecorded).toISOString().slice(0, 10),
      leadReturnId: v.returnId,
      description: v.description,
      isLink: v.isLink,
      link: v.isLink ? v.link : "",
      videoSrc: v.isLink ? "" : v.videoSrc,
      filename: v.isLink ? "" : v.originalName,
      accessLevel: v.accessLevel || "Everyone"
    });
  };
                  
                  //  B) on “Update Video”
                   const handleUpdateVideo = async () => {
    if (editingIndex === null) return;
    const v = videos[editingIndex];

    // Validation for “link” mode
    if (videoData.isLink && !videoData.link.trim()) {
      alert("Please enter a valid link.");
      return;
    }

    // Build FormData
    const fd = new FormData();
    fd.append("leadReturnId", videoData.leadReturnId);
    fd.append("dateVideoRecorded", videoData.dateVideoRecorded);
    fd.append("videoDescription", videoData.description);
    fd.append("accessLevel", videoData.accessLevel);
    fd.append("isLink", videoData.isLink);

    if (videoData.isLink) {
      fd.append("link", videoData.link.trim());
    } else if (file) {
      fd.append("file", file);
    }

    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/api/lrvideo/${v.id}`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        }
      );

      // Re-fetch video list
      await fetchVideos();

      // Reset form
      setEditingIndex(null);
      setVideoData({
        dateVideoRecorded: "",
        leadReturnId: "",
        description: "",
        isLink: false,
        link: "",
        videoSrc: "",
        filename: "",
        accessLevel: "Everyone"
      });
      setFile(null);

      // Clear native file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error updating video:", err);
      alert("Failed to update video.");
    }
  };
                  
                  //  C) on “🗑” icon
                   const handleDeleteVideo = async (idx) => {
    if (!window.confirm("Delete this video?")) return;
    const v = videos[idx];
    try {
      await api.delete(`/api/lrvideo/${v.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setVideos((prev) => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error("Error deleting video:", err);
      alert("Failed to delete video.");
    }
  };

                  
  return (
    <div className="lrvideos-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      {/* <div className="top-menu">
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
      </div> */}
        <div className="top-menu"   style={{ paddingLeft: '20%' }}>
      <div className="menu-items" >
        <span className="menu-item " onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LeadReview", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } }} > Lead Information</span>
                   <span className="menu-item active" >Add/View Lead Return</span>
                   <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/ChainOfCustody", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                    alert("Please select a case and lead first.");
                  }
                }}>Lead Chain of Custody</span>
          
                  </div>
        {/* <div className="menu-items">
      
        <span className="menu-item active" onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRScratchpad')}>
            Scratchpad
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> */}
       </div>

      <div className="LRI_Content">
      {/* <div className="sideitem">
       <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

       <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>  
          

                  <li
  className="sidebar-item"
  onClick={() =>
    selectedCase.role === "Investigator"
      ? navigate("/Investigator")
      : navigate("/CasePageManager")
  }
>
Case Page
</li>


            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item active" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
          
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
           
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}

            </ul>
        )}
          <li className="sidebar-item" style={{ fontWeight: 'bold' }} onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Related Tabs {leadDropdownOpen ?  "▲": "▼"}
          </li>
        {leadDropdownOpen && (
          <ul>
              <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
              View Lead Chain of Custody
            </li>
             )}
          </ul>

            )}

                </div> */}
                 <SideBar  activePage="CasePageManager" />
                <div className="left-content">
                <div className="top-menu" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRScratchpad')}>
            Notes
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> </div>
                <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>


          </div>
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
                    <label>Upload Type</label>
                    <select
                      value={videoData.isLink ? "link" : "file"}
                      onChange={(e) =>
                        setVideoData((prev) => ({
                          ...prev,
                          isLink: e.target.value === "link",
                          link: "" // clear link if switching back to file
                        }))
                      }
                    >
                      <option value="file">File</option>
                      <option value="link">Link</option>
                    </select>
                  </div>

                  {/* If link‐mode, show a text input for the URL */}
                  {videoData.isLink ? (
                    <div className="form-row-video">
                      <label>Paste Link*:</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={videoData.link}
                        onChange={(e) =>
                          setVideoData((prev) => ({
                            ...prev,
                            link: e.target.value
                          }))
                        }
                      />
                    </div>
                  ) : (
                    /* Otherwise, file‐mode: */
                    <div className="form-row-video">
                      <label>
                        {editingIndex !== null
                          ? "Replace Video (optional)"
                          : "Upload Video*"}
                      </label>
                      <input
                        type="file"
                        accept="video/*"
                        ref={fileInputRef}                 // ← attach the ref
                        onChange={handleFileChangeWrapper}
                      />
                      {/* If we’re editing and we already had a filename, show it */}
                      {editingIndex !== null && videoData.filename && (
                        <div className="current-filename">
                          Current File: {videoData.filename}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Access level dropdown */}
                  <div className="form-row-video">
                    <label>Access Level</label>
                    <select
                      value={videoData.accessLevel}
                      onChange={(e) =>
                        setVideoData((prev) => ({
                          ...prev,
                          accessLevel: e.target.value
                        }))
                      }
                    >
                      <option value="Everyone">Everyone</option>
                      <option value="Case Manager">Case Manager Only</option>
                    </select>
                  </div>
                </div>
      
     <div className="form-buttons-video">
                  <button
                    disabled={
                      selectedLead?.leadStatus === "In Review" ||
                      selectedLead?.leadStatus === "Completed"
                    }
                    className="save-btn1"
                    onClick={
                      editingIndex !== null
                        ? handleUpdateVideo
                        : handleAddVideo
                    }
                  >
                    {editingIndex !== null ? "Update Video" : "Add Video"}
                  </button>

                  {editingIndex !== null && (
                    <button
                      className="save-btn1"
                      onClick={() => {
                        setEditingIndex(null);
                        setVideoData({
                          dateVideoRecorded: "",
                          leadReturnId: "",
                          description: "",
                          isLink: false,
                          link: "",
                          videoSrc: "",
                          filename: "",
                          accessLevel: "Everyone"
                        });
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      Cancel
                    </button>
                  )}
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
              <th>File Name</th>
              <th>Description</th>
              <th style={{ width: "13%" }}></th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {videos.length > 0 ? videos.map((video, index) => (
              <tr key={index}>
                <td>{video.dateEntered}</td>
                <td>{video.returnId} </td>
                <td>{video.dateVideoRecorded}</td>
                 <td>
                          {video.isLink ? (
                            <a
                              href={video.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-button"
                            >
                              {video.link}
                            </a>
                          ) : (
                            <a
                              href={`${BASE_URL}/uploads/${video.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-button"
                            >
                              {video.originalName || "Download"}
                            </a>
                          )}
                        </td>
                <td>{video.description}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditVideo(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDeleteVideo(index)}
                />
                  </button>
                  </div>
                </td>
            
                {isCaseManager && (
          <td>
            <select
              value={video.accessLevel}
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
          <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign:'center' }}>
            No Video Data Available
          </td>
        </tr>
      )}
          </tbody>
        </table>

        
         {selectedLead?.leadStatus !== "Completed" && !isCaseManager && (
  <div className="form-buttons-finish">
    <h4> Click here to submit the lead</h4>
    <button
      disabled={selectedLead?.leadStatus === "In Review"}
      className="save-btn1"
      onClick={handleSubmitReport}
    >
      Submit 
    </button>
  </div>
)}

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
