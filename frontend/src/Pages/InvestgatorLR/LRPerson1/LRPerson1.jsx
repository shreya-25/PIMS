import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

import Navbar from '../../../components/Navbar/Navbar';
import './LRPerson1.css';

export const LRPerson1 = () => {
    const navigate = useNavigate(); // Initialize useNavigate hook

    const [formData, setFormData] = useState({
      dateEntered: "",
      lastName: "",
      firstName: "",
      mi: "",
      suffix: "",
      cellNumber: "",
      businessName: "",
      street1: "",
      street2: "",
      building: "",
      apartment: "",
      city: "",
      state: "",
      zipCode: "",
    });
  
    // Handle form input changes
    const handleChange = (field, value) => {
      setFormData({ ...formData, [field]: value });
    };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  // const handleNextPage = () => {
  //   navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  // };

    const handlePrevPage = () => {
    navigate('/LRInstruction'); // Replace '/nextpage' with the actual next page route
  };
  
  return (
    <div className="person-page">
      {/* Navbar at the top */}
      <Navbar />

      <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item" onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item active" onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item" >
            Vehicles
          </span>
          <span className="menu-item" >
            Enclosures
          </span>
          <span className="menu-item" >
            Evidence
          </span>
          <span className="menu-item" >
            Pictures
          </span>
          <span className="menu-item" >
            Audio
          </span>
          <span className="menu-item" >
            Videos
          </span>
          <span className="menu-item" >
            Scratchpad
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" >
            Finish
          </span>
         </div>
       </div>

     {/* Main Content */}
     <div className="form-container1">
        <table className="person-table2">
          <tbody>
            <tr>
              <td>Date Entered</td>
              <td>
                <input
                  type="date"
                  value={formData.dateEntered}
                  onChange={(e) => handleChange("dateEntered", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Last Name</td>
              <td>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
              </td>
              <td>First Name</td>
              <td>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>MI</td>
              <td>
                <input
                  type="text"
                  maxLength="1"
                  value={formData.mi}
                  onChange={(e) => handleChange("mi", e.target.value)}
                />
              </td>
              <td>Suffix</td>
              <td>
                <input
                  type="text"
                  value={formData.suffix}
                  onChange={(e) => handleChange("suffix", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Cell Number</td>
              <td>
                <input
                  type="text"
                  value={formData.cellNumber}
                  onChange={(e) => handleChange("cellNumber", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Business Name</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Street 1</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.street1}
                  onChange={(e) => handleChange("street1", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Street 2</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.street2}
                  onChange={(e) => handleChange("street2", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Building</td>
              <td>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => handleChange("building", e.target.value)}
                />
              </td>
              <td>Apartment</td>
              <td>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => handleChange("apartment", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>City</td>
              <td>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </td>
              <td>State</td>
              <td>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Zip Code</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Additional Details */}
        <button className="details-btn" onClick={() => handleNavigation('/LRPerson2')} >Add Additional Details ➤</button>

        {/* Action Buttons */}
        <div className="form-buttons">
          <button onClick={() => navigate(-1)} className="back-btn">
            Back
          </button>
          <button className="next-btn" onClick={() => handleNavigation('/LRPerson2')}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};