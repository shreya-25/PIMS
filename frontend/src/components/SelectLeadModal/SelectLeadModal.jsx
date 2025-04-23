// src/components/SelectLeadModal/SelectLeadModal.jsx
import React from "react";
import "./SelectLeadModal.css";

const SelectLeadModal = ({ leads = [], onSelect, onClose }) => {
  const handleLeadSelect = (lead) => {
    console.log("Lead clicked:", lead);
    onSelect(lead);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
      <h3>Select a Lead to Continue</h3>

        {leads.length === 0 ? (
          <p>No leads available for this case.</p>
        ) : (
          <ul className="lead-list">
            {leads.map((lead) => (
              <li
                key={lead.leadNo}
                className="lead-option"
                onClick={() => handleLeadSelect(lead)}
              >
                {lead.leadNo} – {lead.description}
              </li>
            ))}
          </ul>
        )}

        <div className="btn-sec-modal">
          <button className="save-btn1" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectLeadModal;
