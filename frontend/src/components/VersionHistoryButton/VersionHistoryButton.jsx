import React from "react";
import { useNavigate } from "react-router-dom";
import "./VersionHistoryButton.css";

export const VersionHistoryButton = ({ leadNo, className = "", label = "Version History" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!leadNo) {
      alert("Please select a lead first");
      return;
    }
    navigate("/LeadVersionHistory");
  };

  return (
    <button
      className={`version-history-btn ${className}`}
      onClick={handleClick}
      title="View version history for this lead"
    >
      <svg
        className="version-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      {label}
    </button>
  );
};
