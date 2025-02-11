import React, { useState } from "react";
import "./Slidebar.css";

export const SlideBar = ({ onAddCase }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [caseDetails, setCaseDetails] = useState({
    title: "",
    number: "",
    managerName: "",
    investigators: [], // Store selected investigators
    summary: "",
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const caseManagers = ["Officer 1", "Officer 2", "Officer 3"];
  const investigators = ["Officer 1", "Officer 2", "Officer 3", "Officer 4"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCaseDetails({ ...caseDetails, [name]: value });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setCaseDetails((prevDetails) => ({
        ...prevDetails,
        investigators: [...prevDetails.investigators, value],
      }));
    } else {
      setCaseDetails((prevDetails) => ({
        ...prevDetails,
        investigators: prevDetails.investigators.filter((inv) => inv !== value),
      }));
    }
  };

  const handleDone = () => {
    if (caseDetails.title && caseDetails.number) {
      onAddCase({
        id: caseDetails.number,
        title: caseDetails.title,
        status: "ongoing",
        investigators: caseDetails.investigators,
      });
    }
    setCaseDetails({
      title: "",
      number: "",
      managerName: "",
      investigators: [],
      summary: "",
    });
    setIsSidebarOpen(false);
  };

  return (
    <div>
      <button className="add-case-button" onClick={toggleSidebar}>
        <i className="fa-solid fa-plus"></i> Add Case
      </button>
      {isSidebarOpen && (
        <div className="slide-bar">
          <button className="close-btnAC" onClick={toggleSidebar}>
            &times;
          </button>
          <h3>Add Case</h3>
          <div className="form-group">
            <label>Case Title:</label>
            <input
              type="text"
              name="title"
              value={caseDetails.title}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label>Case Number:</label>
            <input
              type="text"
              name="number"
              value={caseDetails.number}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label>Case Manager Name:</label>
            <select
              name="managerName"
              value={caseDetails.managerName}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="">Select Case Manager</option>
              {caseManagers.map((manager, index) => (
                <option key={index} value={manager}>
                  {manager}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Investigators Assigned:</label>
            <div className="custom-dropdown">
              <input
                type="text"
                readOnly
                value={caseDetails.investigators.join(", ")}
                className="input-field dropdown-input"
                onClick={toggleDropdown}
                placeholder="Select Investigators"
              />
              {dropdownOpen && (
                <div className="dropdown-menu">
                  {investigators.map((investigator, index) => (
                    <label key={index} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={investigator}
                        checked={caseDetails.investigators.includes(investigator)}
                        onChange={handleCheckboxChange}
                      />
                      {investigator}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Summary:</label>
            <textarea
              name="summary"
              value={caseDetails.summary}
              onChange={handleInputChange}
              className="input-field textarea-field"
            />
          </div>
          <div className="form-group">
            <h4>Upload any relevant document to the case</h4>
            <input type="file" className="input-field" />
          </div>
          <button className="done-button" onClick={handleDone}>
            Done
          </button>
        </div>
      )}
    </div>
  );
};
