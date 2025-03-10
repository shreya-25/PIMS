// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
// import "./Sidebar.css";
// import { CaseSelector } from "../CaseSelector/CaseSelector";

// export const SideBar = ({ leads = {}, cases = [], setActiveTab, onShowCaseSelector, }) => {
//   const {
//     pendingLeads = [],
//     assignedLeads = [],
//     pendingLeadReturns = [],
//   } = leads;

//   const navigate = useNavigate(); // Initialize the useNavigate hook

//   const [showCaseSelector, setShowCaseSelector] = useState(false); // State to toggle CaseSelector


//   const handleViewLeadLog = () => onShowCaseSelector("/LeadLog"); // Pass specific page
//   const handleViewHierarchy = () => onShowCaseSelector("/ViewHierarchy");
//   const handleViewFlaggedLeads = () => onShowCaseSelector("/FlaggedLeads");
//   const handleViewCreateLead = () => onShowCaseSelector("/CreateLead");

//   return (
//     <div className="sideitem">
//         <ul className="sidebar-list">
//           <li
//             className="sidebar-item"
//             onClick={() => setActiveTab("assignedLeads")}
//           >
//             My Assigned Leads: {assignedLeads.length}
//           </li>
//           <li
//             className="sidebar-item"
//             onClick={() => setActiveTab("pendingLeads")}
//           >
//             My Pending Leads: {pendingLeads.length}
//           </li>
//           <li
//             className="sidebar-item"
//             onClick={() => setActiveTab("pendingLeadReturns")}
//           >
//             My Pending Lead Returns: {pendingLeadReturns.length}
//           </li>
//           <li
//             className="sidebar-item"
//             onClick={() => setActiveTab("cases")}
//           >
//             My Ongoing Cases: {cases.length}
//           </li>
//           <li className="sidebar-item"onClick={() => onShowCaseSelector("/OfficerManagement")}>Officer Management</li>
//           <li className="sidebar-item"onClick={() => onShowCaseSelector("/CreateLead")}>Create Lead</li>
//           <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>
//             View Lead Log
//           </li>
//           <li
//             className="sidebar-item"
//             onClick={() => navigate("/CaseScratchpad")}
//           >
//             Case Scratchpad
//           </li>
//           <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>View Lead Hierarchy</li>
//           <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>Generate Report</li>
//           <li className="sidebar-item"onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
//           <li className="sidebar-item"onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
//           <li className="sidebar-item"onClick={() => onShowCaseSelector("/ViewHierarchy")}>View Lead Chain of Custody</li>
//         </ul>
//     </div>
//   );
// };

import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./Sidebar.css";
import { CaseSelector } from "../CaseSelector/CaseSelector";

export const SideBar = ({ leads = {}, cases = [], setActiveTab, onShowCaseSelector }) => {
  const { pendingLeads = [], assignedLeads = [], pendingLeadReturns = [] } = leads;
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);

  return (
    <div className="sideitem">
      <ul className="sidebar-list">
        
        {/* Case Information Dropdown */}
        <li className="sidebar-item" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Information {caseDropdownOpen ? "▲" : "▼"}
        </li>
        {caseDropdownOpen && (
          <ul className="dropdown-list">
            <li className="sidebar-item" onClick={() => setActiveTab("assignedLeads")}>
              My Assigned Leads: {assignedLeads.length}
            </li>
            <li className="sidebar-item" onClick={() => setActiveTab("pendingLeads")}>
              My Pending Leads: {pendingLeads.length}
            </li>
            <li className="sidebar-item" onClick={() => setActiveTab("pendingLeadReturns")}>
              My Pending Lead Returns: {pendingLeadReturns.length}
            </li>
            <li className="sidebar-item" onClick={() => setActiveTab("cases")}>
              My Ongoing Cases: {cases.length}
            </li>
          </ul>
        )}

        {/* Lead Management Dropdown */}
        <li className="sidebar-item" onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Management {leadDropdownOpen ? "▲" : "▼"}
        </li>
        {leadDropdownOpen && (
          <ul className="dropdown-list">
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/CreateLead")}>
              Create Lead
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>
              View Lead Log
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li>
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Case Scratchpad
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
              View Lead Hierarchy
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              Generate Report
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>
              View Flagged Leads
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>
              View Timeline Entries
            </li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              View Lead Chain of Custody
            </li>
          </ul>
        )}
      </ul>
    </div>
  );
};

