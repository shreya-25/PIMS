import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./LRAudio.css"; // Custom CSS file for Audio styling
import FootBar from '../../../components/FootBar/FootBar';


export const LRAudio = () => {
  const navigate = useNavigate();

  // Sample audio data
  const [audioFiles, setAudioFiles] = useState([
    {
      dateEntered: "12/01/2024",
      returnId: 1,
      dateAudioRecorded: "12/01/2024",
      description: "Audio recording of the witness interview.",
      audioSrc: "/assets/sample-audio.mp3", // Replace with actual audio path
    },
    {
      dateEntered: "12/02/2024",
      returnId: 2,
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

        {/* Audio Form */}
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
        <button className="save-btn1" onClick={handleAddAudio}>Add Audio</button>

           {/* Audio Files Table */}
           <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th> Associated Return Id </th>
              <th>Date Audio Recorded</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {audioFiles.map((audio, index) => (
              <tr key={index}>
                <td>{audio.dateEntered}</td>
                <td>{audio.returnId}</td>
                <td>{audio.dateAudioRecorded}</td>
                <td>{audio.description}</td>
              </tr>
            ))}
          </tbody>
        </table>


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

        {/* Action Buttons */}
        {/* <div className="form-buttons-audio">
          <button className="add-btn" onClick={handleAddAudio}>Add Audio</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRPictures")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRVideos")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVideo")} // Takes user to CM Return page
      />
    </div>
  );
};
