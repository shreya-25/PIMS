import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

import Navbar from '../../../components/Navbar/Navbar';
import './LRPerson2.css';

export const LRPerson2 = () => {
    const navigate = useNavigate(); // Initialize useNavigate hook

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  // const handleNextPage = () => {
  //   navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  // };

    const handlePrevPage = () => {
    navigate('/LRInstruction'); // Replace '/nextpage' with the actual next page route
  };

  const [miscDetails, setMiscDetails] = useState([
    { description: "", details: "" },
  ]);

  const addNewRow = () => {
    setMiscDetails([...miscDetails, { description: "", details: "" }]);
  };

  const handleInputChange = (index, field, value) => {
    const updatedDetails = [...miscDetails];
    updatedDetails[index][field] = value;
    setMiscDetails(updatedDetails);
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
          <span className="menu-item" onClick={() => handleNavigation('/LRVehicle')}  >
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
            {/* First Row */}
            <tr>
              <td>SSN</td>
              <td><input type="text" /></td>
              <td>Age</td>
              <td><input type="text" /></td>
            </tr>

            {/* Second Row */}
            <tr>
              <td>Email</td>
              <td colSpan="3"><input type="email" /></td>
            </tr>

            {/* Third Row */}
            <tr>
              <td>Occupation</td>
              <td colSpan="3"><input type="text" /></td>
            </tr>

            {/* Fourth Row */}
            <tr>
              <td>Person Type</td>
              <td><select><option>Type</option></select></td>
              <td>Condition</td>
              <td><select><option>Condition</option></select></td>
            </tr>

            {/* Fifth Row */}
            <tr>
              <td>Caution Type</td>
              <td><select><option>Type</option></select></td>
              <td>Sex</td>
              <td><select><option>Male</option><option>Female</option></select></td>
            </tr>

            {/* Sixth Row */}
            <tr>
              <td>Race</td>
              <td><select><option>Race</option></select></td>
              <td>Ethnicity</td>
              <td><select><option>Ethnicity</option></select></td>
            </tr>

            {/* Seventh Row */}
            <tr>
              <td>Skin Tone</td>
              <td><select><option>Skin Tone</option></select></td>
              <td>Eye Color</td>
              <td><select><option>Eye Color</option></select></td>
            </tr>

            {/* Eighth Row */}
            <tr>
              <td>Glasses</td>
              <td><select><option>Yes</option><option>No</option></select></td>
              <td>Hair Color</td>
              <td><select><option>Hair Color</option></select></td>
            </tr>

            {/* Ninth Row */}
            <tr>
              <td>Height</td>
              <td>
                <input type="text" style={{ width: "40px" }} /> '
                <input type="text" style={{ width: "40px" }} /> "
              </td>
              <td>Weight</td>
              <td><input type="text" /></td>
            </tr>

            {/* Miscellaneous Section */}
            <tr>
              <td colSpan="4">
                <h4>Miscellaneous Information</h4>
                <table className="misc-table">
                <tbody>
            {miscDetails.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) =>
                      handleInputChange(index, "description", e.target.value)
                    }
                  />
                </td>
                <td>
                  <textarea
                    rows="2"
                    value={row.details}
                    onChange={(e) =>
                      handleInputChange(index, "details", e.target.value)
                    }
                  ></textarea>
                </td>
              </tr>
              
            ))}
          </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Buttons */}
        <div className="form-buttons">
          <button className="back-btn"onClick={() => handleNavigation('/LRPerson1')}>Back</button>
          <button className="next-btn"onClick={() => handleNavigation('/LRVehicle')}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};