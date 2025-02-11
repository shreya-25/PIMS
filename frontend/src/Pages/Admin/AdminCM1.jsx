import React, { useState } from "react";
import "./AdminCM1.css";
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useNavigate } from "react-router-dom";

export const AdminCM1 = () => {
  

  const navigate = useNavigate();

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  const [caseInfo, setcaseInfo] = useState([
    {
      CaseNo: "12345",
      CaseName: "Main Street Murder",
      CaseManager: "Officer 1",
      Officers: ["Officer 2", "Officer 4"],
      Status: "Completed",
      CompletionDate: "01/01/2024",
    },
    {
      CaseNo: "12457",
      CaseName: "Smith Robbery Case",
      CaseManager: "Officer 3",
      Officers: ["Officer 5", "Officer 6"],
      Status: "Ongoing",
      CompletionDate: "",
    },
    {
      CaseNo: "12458",
      CaseName: "Johnson Fraud Investigation",
      CaseManager: "Officer 2",
      Officers: ["Officer 1", "Officer 3"],
      Status: "Pending",
      CompletionDate: "",
    },
    {
      CaseNo: "12459",
      CaseName: "Doe Missing Person Case",
      CaseManager: "Officer 4",
      Officers: ["Officer 2"],
      Status: "Completed",
      CompletionDate: "12/15/2023",
    },
    {
      CaseNo: "12460",
      CaseName: "Anderson Drug Bust",
      CaseManager: "Officer 5",
      Officers: ["Officer 3", "Officer 6"],
      Status: "Ongoing",
      CompletionDate: "",
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

      <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item " onClick={() => handleNavigation('/AdminUR')}>
            User Registration
          </span>
          <span className="menu-item active" onClick={() => handleNavigation('/AdminCM')}>
           Case Management
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/AdminSC')} >
            Search Cases
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminSP')} >
            Search People
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminDB')} >
           Database Backup
          </span>
         </div>
       </div>

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
          <Searchbar
              placeholder="Search Cases"
              onSearch={(query) => console.log("Search query:", query)}
            />
            </div>

             {/* Main Table */}
        <div className="table-container1">
          <table className="person-table">
            <thead>
              <tr>
                <th>Case Number and Name</th>
                <th>Assigned Case Manager</th>
                <th>Assigned Officers</th>
                <th>Status</th>
                <th>Completion Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {caseInfo.map((caseItem, index) => (
                <tr key={index}>
                  <td>{`${caseItem.CaseNo} | ${caseItem.CaseName}`}</td>
                  <td>{caseItem.CaseManager}</td>
                  <td>{caseItem.Officers.join(", ")}</td>
                  <td>{caseItem.Status}</td>
                  <td>{caseItem.CompletionDate}</td>
                  <td>
                    <button className = "edit-button1"
                      onClick={() => confirmAndNavigate('/CasePageManager', caseItem.CaseNo)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
     </div>
    </div>
  );
};
