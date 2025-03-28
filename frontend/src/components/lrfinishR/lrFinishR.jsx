import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "./lrFinishR.css";

function LrFinishR() {
  const navigate = useNavigate();
  const location = useLocation();

  // Example state to hold form values (customize as needed)
  const [formData, setFormData] = useState({
    logged: "",
    assignedBy: "",
    assignedTo: "",
    completedDate: "",
    lastUpdated: "",
    reportType: "Standard",
    leadInstructionSheet: false,
    enteredResults: false,
    leadResults: false,
    leadWorksheet: false,
    leadPersons: false,
    leadScratchpadEntries: false,
    leadInstructionWorksheet: false,
    leadPictures: false,
    leadVehicles: false,
  });

  // Example: could fetch data on mount or do other setup
  useEffect(() => {
    // For instance, if you want to populate fields from location.state
    // or do any initial data fetching
  }, [location]);

  // Example change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Example submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    // Do something with formData, then possibly navigate
    // navigate("/somewhere");
  };

  return (
    <form onSubmit={handleSubmit} className="container">
      {/* Top row with Logged, Assigned By, Assigned To, etc. */}
      <div className="top-row">
        <div className="field">
          <label>Logged:</label>
          <input
            type="text"
            name="logged"
            value={formData.logged}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Assigned By:</label>
          <input
            type="text"
            name="assignedBy"
            value={formData.assignedBy}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Assigned To:</label>
          <input
            type="text"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Completed Date:</label>
          <input
            type="date"
            name="completedDate"
            value={formData.completedDate}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Last Updated:</label>
          <input
            type="date"
            name="lastUpdated"
            value={formData.lastUpdated}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Report Generation section with radio buttons */}
      <div className="report-generation">
        <label className="section-title">Report Generation:</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="reportType"
              value="Standard"
              checked={formData.reportType === "Standard"}
              onChange={handleChange}
            />
            Standard
          </label>
          <label>
            <input
              type="radio"
              name="reportType"
              value="Full Report"
              checked={formData.reportType === "Full Report"}
              onChange={handleChange}
            />
            Full Report
          </label>
        </div>
      </div>

      {/* Custom section with checkboxes */}
      <div className="custom-section">
        <label className="section-title">Custom</label>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              name="leadInstructionSheet"
              checked={formData.leadInstructionSheet}
              onChange={handleChange}
            />
            Lead Instruction Sheet
          </label>
          <label>
            <input
              type="checkbox"
              name="enteredResults"
              checked={formData.enteredResults}
              onChange={handleChange}
            />
            Entered Results
          </label>
          <label>
            <input
              type="checkbox"
              name="leadResults"
              checked={formData.leadResults}
              onChange={handleChange}
            />
            Lead Results
          </label>
          <label>
            <input
              type="checkbox"
              name="leadWorksheet"
              checked={formData.leadWorksheet}
              onChange={handleChange}
            />
            Lead Worksheet
          </label>
          <label>
            <input
              type="checkbox"
              name="leadPersons"
              checked={formData.leadPersons}
              onChange={handleChange}
            />
            Lead Persons
          </label>
          <label>
            <input
              type="checkbox"
              name="leadScratchpadEntries"
              checked={formData.leadScratchpadEntries}
              onChange={handleChange}
            />
            Lead Scratchpad Entries
          </label>
          <label>
            <input
              type="checkbox"
              name="leadInstructionWorksheet"
              checked={formData.leadInstructionWorksheet}
              onChange={handleChange}
            />
            Lead Instruction Worksheet
          </label>
          <label>
            <input
              type="checkbox"
              name="leadPictures"
              checked={formData.leadPictures}
              onChange={handleChange}
            />
            Lead Pictures
          </label>
          <label>
            <input
              type="checkbox"
              name="leadVehicles"
              checked={formData.leadVehicles}
              onChange={handleChange}
            />
            Lead Vehicles
          </label>
        </div>
      </div>

      {/* Example Submit Button */}
      <div style={{ marginTop: "1rem" }}>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
}

export default LrFinishR;
