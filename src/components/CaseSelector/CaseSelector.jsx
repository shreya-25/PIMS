import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./CaseSelector.css";

export const CaseSelector = ({ cases = [], navigateTo, onClose }) => {
  const [selectedCase, setSelectedCase] = useState(""); // State to store the selected case
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Handler for the "Done" button
  const handleDone = () => {
    if (selectedCase) {
      navigate(navigateTo, { state: { caseId: selectedCase } }); // Pass selected case to the Lead Log page
    } else {
      alert("Please select a case before proceeding.");
    }
  };

  return (
    <div className="overlay">
      <div className="card">
        <h3>Select a Case to Proceed</h3>
        <div className="select-container">
          <select
            className="case-select"
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
          >
            <option value="" disabled>
              -- Select a Case --
            </option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                Case #{c.id} - {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="button-group">
          <button className="done-btn" onClick={handleDone}>
            Done
          </button>
          <button className="close-btnsb" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
