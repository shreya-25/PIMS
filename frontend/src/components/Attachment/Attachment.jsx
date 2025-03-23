import React, { useState } from "react";
import "./Attachment.css"; // Import the CSS file

export default function Attachment() {
  // Example attachment data
  const [attachments] = useState([
    {
      name: "crime scene.png",
      size: "76 KB",
      date: "05 Jan 2022 4:29pm",
    },
    {
      name: "Favicon_2014_blue.docx",
      size: "24 KB",
      date: "05 Jan 2022 4:32pm",
    },
    {
      name: "Favicon_2014_white.pdf",
      size: "14 KB",
      date: "05 Jan 2022 4:33pm",
    },
  ]);

  return (
    <div className="attachments-section">
      {/* Header with title */}
      <div className="attachments-header">
        <span className="attachments-title">
          Attachments ({attachments.length})
        </span>
      </div>

      {/* List of attachments */}
      <ul className="attachments-list">
        {attachments.map((file, index) => (
          <li key={index} className="attachment-item">
            {/* Left side (icon + file info) */}
            <div className="attachment-left">
              <div className="attachment-icon">
                <img
                  src={`${process.env.PUBLIC_URL}/Materials/file-solid.svg`}
                  alt="File Icon"
                  className="icon-image"
                />

                <div className="attachment-info">
                <div className="attachment-name">{file.name}</div>
                <div className="attachment-meta">
                  <span className="attachment-size">{file.size}</span>
                  <span className="attachment-date">{file.date}</span>
                </div>
              </div>
              </div>
            </div>

            {/* Right side (action buttons) */}
            <div className="attachment-right">
              <button className="icon-button">
                <img
                  src={`${process.env.PUBLIC_URL}/Materials/download.png`}
                  alt="Download"
                  className="icon-image"
                />
              </button>
              <button className="icon-button">
                <img
                  src={`${process.env.PUBLIC_URL}/Materials/printer.png`}
                  alt="Print"
                  className="icon-image"
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
