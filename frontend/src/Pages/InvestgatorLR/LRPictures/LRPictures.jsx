import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./LRPictures.css";

export const LRPictures = () => {
  const navigate = useNavigate();

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
  });

  const handleInputChange = (field, value) => {
    setPictureData({ ...pictureData, [field]: value });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPictureData({ ...pictureData, image: imageUrl });
    }
  };

  const handleAddPicture = () => {
    const newPicture = {
      dateEntered: new Date().toLocaleDateString(),
      datePictureTaken: pictureData.datePictureTaken,
      description: pictureData.description,
      image: pictureData.image || `${process.env.PUBLIC_URL}/Materials/default-image.jpg`, // Default image if not provided
    };

    // Add new picture to the list
    setPictures([...pictures, newPicture]);

    // Clear form fields
    setPictureData({
      datePictureTaken: "",
      description: "",
      image: "",
    });
  };

  const handleNavigation = (route) => {
    navigate(route);
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

      {/* Main Content */}
      <div className="main-contentLRP">
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
          <h2 className="title">PICTURES INFORMATION</h2>
        </div>

         {/* Right Section */}
         <div className="right-section">
        </div>
      </div>

        {/* Pictures Table */}
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Associated Return Id </th>
              <th>Date Picture Taken</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {pictures.map((picture, index) => (
              <tr key={index}>
                <td>{picture.dateEntered}</td>
                <td>{picture.returnId}</td>
                <td>{picture.datePictureTaken}</td>
                <td>{picture.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Picture Form */}
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

        {/* Action Buttons */}
        <div className="form-buttons-pic">
          <button className="add-btn" onClick={handleAddPicture}>Add Picture</button>
          <button className="back-btn" onClick={() => handleNavigation("/LREvidence")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRAudio")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};
