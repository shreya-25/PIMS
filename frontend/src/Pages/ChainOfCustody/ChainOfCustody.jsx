import React, { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useNavigate } from "react-router-dom";

export const ChainOfCustody = () => {
  

  const navigate = useNavigate();

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

      <div className="logo-sec">
        <img
          src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
          alt="Police Department Logo"
          className="police-logo-main-page"
        />
        <h1 className="main-page-heading">PIMS</h1>
      </div>
      <div className="admin-content">
        <div className="main-section-admin">

        <h2>
          Lead No: <span className="case-number">12</span> | Interview Mr. John
        </h2>

           <div className='searchContainer'>
           <Searchbar
              placeholder="Search"
              onSearch={(query) => console.log("Search query:", query)}
            />
                    </div>
            </div>

             {/* Main Table */}
        <div className="table-container1">
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
            {/* Format the ISO date string to show both date and time */}
            <td>{new Date(entry.date).toLocaleString()}</td>
            <td>{entry.action}</td>
            <td>{entry.officer}</td>
          </tr>
        ))}
            </tbody>
          </table>
        </div>
     </div>
    </div>
  );
};
