import React, { useState } from "react";
import "./ExecSummaryModal.css"; // Create a CSS file for styling if needed

const ExecSummaryModal = ({ isOpen, onClose, onSelectOption }) => {
  // selectedOption can be "page" or "upload"
  const [selectedOption, setSelectedOption] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    // Pass the selected option (and file if applicable) back to parent.
    onSelectOption(selectedOption, uploadFile);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Select Executive Summary Option</h2>
        <p>Please choose one of the following:</p>
        <div className="modal-options">
          <button
            className="option-btn"
            onClick={() => {
              setSelectedOption("page");
              setUploadFile(null);
            }}
          >
            Add Executive Summary from Page
          </button>
          <button
            className="option-btn"
            onClick={() => {
              setSelectedOption("upload");
            }}
          >
            Upload a Document
          </button>
        </div>

        {selectedOption === "upload" && (
          <div className="exec-summary-upload">
            <label htmlFor="execSummaryFile">
              Attach an Executive Summary Document:
            </label>
            <input
              id="execSummaryFile"
              type="file"
              accept=".doc,.docx,.pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadFile(e.target.files[0]);
                }
              }}
            />
          </div>
        )}
        <div className="modal-buttons">
          <button className="confirm-btn" onClick={handleConfirm}>
            Confirm
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecSummaryModal;
