// import React, { useState } from "react";
// import "./Attachment.css"; // Import the CSS file

// export default function Attachment() {
//   // Example attachment data
//   const [attachments] = useState([
//     {
//       name: "crime scene.png",
//       size: "76 KB",
//       date: "05 Jan 2022 4:29pm",
//     },
//     {
//       name: "field case report.docx",
//       size: "24 KB",
//       date: "05 Jan 2022 4:32pm",
//     },
//     {
//       name: "leads desk report.pdf",
//       size: "14 KB",
//       date: "05 Jan 2022 4:33pm",
//     },
//   ]);

//   return (
//     <div className="attachments-section">
//       {/* Header with title */}
//       <div className="attachments-header">
//         <span className="attachments-title">
//           Attachments ({attachments.length})
//         </span>
//       </div>

//       {/* List of attachments */}
//       <ul className="attachments-list">
//         {attachments.map((file, index) => (
//           <li key={index} className="attachment-item">
//             {/* Left side (icon + file info) */}
//             <div className="attachment-left">
//               <div className="attachment-icon">
//                 <img
//                   src={`${process.env.PUBLIC_URL}/Materials/file-solid.svg`}
//                   alt="File Icon"
//                   className="icon-image"
//                 />

//                 <div className="attachment-info">
//                 <div className="attachment-name">{file.name}</div>
//                 <div className="attachment-meta">
//                   <span className="attachment-size">{file.size}</span>
//                   <span className="attachment-date">{file.date}</span>
//                 </div>
//               </div>
//               </div>
//             </div>

//             {/* Right side (action buttons) */}
//             <div className="attachment-right">
//               <button className="icon-button">
//                 <img
//                   src={`${process.env.PUBLIC_URL}/Materials/download.png`}
//                   alt="Download"
//                   className="icon-image"
//                 />
//               </button>
//               <button className="icon-button">
//                 <img
//                   src={`${process.env.PUBLIC_URL}/Materials/printer.png`}
//                   alt="Print"
//                   className="icon-image"
//                 />
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

import React from "react";
import "./Attachment.css"; // Make sure your CSS styles are applied

export default function Attachment({ attachments = [] }) {
  return (
    <div className="attachments-section">
      <div className="attachments-header">
        <span className="attachments-title">
          Attachments ({attachments.length})
        </span>
      </div>
      <ul className="attachments-list">
        {attachments.map((file, index) => (
          <li key={index} className="attachment-item">
            <div className="attachment-left">
              <div className="attachment-icon">
                <img
                  src={`${process.env.PUBLIC_URL}/Materials/file-solid.svg`}
                  alt="File Icon"
                  className="icon-image"
                />
              </div>
              <div className="attachment-info">
                {/* <div className="attachment-name">{file.name}</div> */}

                <div className="attachment-name">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-button"
                  >
                    {file.name}
                  </a>
                </div>
                
                <div className="attachment-meta">
                  <span className="attachment-size">{file.size}</span>
                  <span className="attachment-date">{file.date}</span>
                </div>
              </div>
            </div>
            {/* <div className="attachment-right">
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <button className="icon-button">
                  <img
                    src={`${process.env.PUBLIC_URL}/Materials/download.png`}
                    alt="Download"
                    className="icon-image"
                  />
                </button>
              </a>
              <button className="icon-button">
                <img
                  src={`${process.env.PUBLIC_URL}/Materials/printer.png`}
                  alt="Print"
                  className="icon-image"
                />
              </button>
            </div> */}
          </li>
        ))}
      </ul>
    </div>
  );
}

