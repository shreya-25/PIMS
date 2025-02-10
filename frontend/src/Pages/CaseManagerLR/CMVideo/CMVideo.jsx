import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./CMVideo.css"; // Custom CSS file for Video styling

export const CMVideo = () => {
  const navigate = useNavigate();

  // Sample video data
  const [videos, setVideos] = useState([
    {
      dateEntered: "12/01/2024",
      dateVideoRecorded: "12/01/2024",
      description: "Surveillance video of the incident.",
      videoSrc: `${process.env.PUBLIC_URL}/Materials/video1.mp4`
    
    },
    {
      dateEntered: "12/02/2024",
      dateVideoRecorded: "12/02/2024",
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

      {/* Main Content */}
      <div className="main-contentLRV">
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
          <h2 className="title">VIDEO INFORMATION</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>

        {/* Videos Table */}
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Date Video Recorded</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video, index) => (
              <tr key={index}>
                <td>{video.dateEntered}</td>
                <td>{video.dateVideoRecorded}</td>
                <td>{video.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

         {/* Video Form */}
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

        {/* Action Buttons */}
        <div className="form-buttons-video">
          <button className="add-btn" onClick={handleAddVideo}>Add Video</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRAudio")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};
