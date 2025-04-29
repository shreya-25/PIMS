import React, { useContext, useState, useEffect} from 'react';
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";

export const ChainOfCustody = () => {
  

  const navigate = useNavigate(); 
 
   const location = useLocation();
 
     const { caseDetails } = location.state || {};
       const { selectedCase, setSelectedLead } = useContext(CaseContext);

       const onShowCaseSelector = (route) => {
        navigate(route, { state: { caseDetails } });
    };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  const [logEntries, setLogEntries] = useState([
    {
      date: "2024-01-01T09:00:00",
      action: "Submitted Return",
      officer: "Officer 1",
    },
    {
      date: "2024-01-01T10:15:00",
      action: "Added Lead Instruction",
      officer: "Officer 2",
    },
    {
      date: "2024-01-01T11:30:00",
      action: "Added Return",
      officer: "Officer 3",
    },
    {
      date: "2024-01-01T12:45:00",
      action: "Edited Enclosures",
      officer: "Officer 4",
    },
    {
      date: "2024-01-01T14:00:00",
      action: "View Enclosures",
      officer: "Officer 5",
    },
    {
      date: "2024-01-01T15:15:00",
      action: "Edited Enclosures",
      officer: "Officer 6",
    },
  ]);

  const confirmAndNavigate = (route, caseNo) => {
    if (window.confirm(`Do you really want to edit Case No: ${caseNo}?`)) {
      handleNavigation(route);
    }
  };

  return (
    <div className="admin-container">
      <Navbar />

      <div className="main-container">
            {/* Sidebar */}
            <div className="sideitem">
                 
            <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li>            
            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li> */}
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
              View Lead Hierarchy
            </li> */}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              Generate Report
            </li> */}
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            {/* <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li> */}
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}
            {selectedCase.role !== "Investigator" && (
  <li className="sidebar-item active" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
    View Lead Chain of Custody
  </li>
)}

                </div>

      <div className="left-content">
      <div className="case-header">
          {/* <h2 className="">ALL NOTES</h2> */}
          <h2 className="">WEBPAGE UNDER CONSTRUCTION</h2>
        </div>
        {/* <div className="main-section-admin">

        <h2>
          Lead No: <span className="case-number">12</span> | Interview Mr. John
        </h2>

           <div className='searchContainer'>
           <Searchbar
              placeholder="Search"
              onSearch={(query) => console.log("Search query:", query)}
            />
                    </div>
            </div> */}

             {/* Main Table */}
        {/* <div className="table-container1">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Officer</th>
              </tr>
            </thead>
            <tbody>
            {logEntries.map((entry, index) => (
          <tr key={index}>
            <td>{new Date(entry.date).toLocaleString()}</td>
            <td>{entry.action}</td>
            <td>{entry.officer}</td>
          </tr>
        ))}
            </tbody>
          </table>
        </div> */}
     </div>
    </div>
    </div>
  );
};
