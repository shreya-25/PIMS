import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./CMAudio.css"; // Custom CSS file for Audio styling
import FootBar from '../../../components/FootBar/FootBar';


export const CMAudio = () => {
  const navigate = useNavigate();

  // Sample audio data
  const [audioFiles, setAudioFiles] = useState([
    {
      dateEntered: "12/01/2024",
      dateAudioRecorded: "12/01/2024",
      description: "Audio recording of the witness interview.",
      audioSrc: "/assets/sample-audio.mp3", // Replace with actual audio path
    },
    {
      dateEntered: "12/02/2024",
      dateAudioRecorded: "12/02/2024",
      description: "Recording from the crime scene.",
      audioSrc: "/assets/sample-audio2.mp3", // Replace with actual audio path
    },
  ]);

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

  const handleNavigation = (route) => {
    navigate(route);
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

      {/* Main Content */}
      <div className="main-contentLRA">
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
          <h2 className="title">AUDIO INFORMATION</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>

        {/* Audio Files Table */}
         {/* Audio Form */}
         <div className = "content-to-add">
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

        {/* Action Buttons */}
        <div className="form-buttons">
          <button className="save-btn1" onClick={handleAddAudio}>Add Audio</button>
          {/* <button className="back-btn" onClick={() => handleNavigation("/LRPictures")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRVideos")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button> */}
        </div>
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Date Audio Recorded</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {audioFiles.map((audio, index) => (
              <tr key={index}>
                <td>{audio.dateEntered}</td>
                <td>{audio.dateAudioRecorded}</td>
                <td>{audio.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className = "content-to-add">
     
     <h4 className="return-form-h4"> Add Comment</h4>
       <div className="return-form">
         <textarea
          //  value={returnData.results}
          //  onChange={(e) => handleInputChange("results", e.target.value)}
           placeholder="Enter comments"
         ></textarea>
       </div>

       <div className="form-buttons-return">
         <button className="save-btn1">Add Comment</button>
         {/* <button className="back-btn" onClick={() => handleNavigation("/LRPerson")}>Back</button>
         <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>Next</button>
         <button className="cancel-btn" onClick={() => setReturnData({ results: "" })}>Cancel</button> */}
       </div>
</div>
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREnclosures")} // Takes user to CM Return page
      />
  
    </div>
  );
};
