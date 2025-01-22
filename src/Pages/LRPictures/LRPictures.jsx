import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./LRPictures.css";

export const LRPictures = () => {
  const navigate = useNavigate();

  // Default pictures data
  const [pictures, setPictures] = useState([
    {
      dateEntered: "2024-12-01",
      datePictureTaken: "2024-11-25",
      description: "Picture of the crime scene from Main Street.",
      image: "/Materials/pict1.jpeg", // Path to your default image
    },
    {
      dateEntered: "2024-12-02",
      datePictureTaken: "2024-11-26",
      description: "Vehicle involved in the robbery.",
      image: "/Materials/pict2.jpg", // Path to your default image
    },
    {
      dateEntered: "2024-12-03",
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
      image: pictureData.image || "/Materials/default-image.jpg", // Default image if not provided
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
        <h2 className="title">Picture Information</h2>

        {/* Pictures Table */}
        <table className="pictures-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Date Picture Taken</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {pictures.map((picture, index) => (
              <tr key={index}>
                <td>{picture.dateEntered}</td>
                <td>{picture.datePictureTaken}</td>
                <td>{picture.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Picture Form */}
        <h4>Enter Picture Details</h4>
        <div className="picture-form">
          <div className="form-row-pic">
            <label>Date Picture Taken:</label>
            <input
              type="date"
              value={pictureData.datePictureTaken}
              onChange={(e) => handleInputChange("datePictureTaken", e.target.value)}
            />
          </div>
          <div className="form-row-pic">
            <label>Description:</label>
            <textarea
              value={pictureData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
          <div className="form-row-pic">
            <label>Upload Image:</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>

        {/* Uploaded Pictures Preview */}
        <div className="uploaded-pictures">
          <h4>Uploaded Pictures</h4>
          <div className="pictures-gallery">
            {pictures.map((picture, index) => (
              <div key={index} className="picture-card">
                <img src={picture.image} alt={`Uploaded ${index + 1}`} className="uploaded-image" />
                <p>{picture.description}</p>
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
