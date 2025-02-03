import React, { useState } from "react";
import "./AdminSP.css";
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useNavigate } from "react-router-dom";

// Sample lead data for matching
const sampleLeads = [
  {
    id: "Lead45",
    name: "Collect Audio Records from Dispatcher",
    dueDate: "12/25/2024",
    priority: "High",
    remainingDays: 0,
    flags: "Important",
    assignedOfficers: "Officer 1, Officer 3",
  },
  {
    id: "Lead20",
    name: "Interview Mr. John",
    dueDate: "12/31/2024",
    priority: "Medium",
    remainingDays: 0,
    flags: "None",
    assignedOfficers: "Officer 2",
  },
  {
    id: "Lead84",
    name: "Collect Evidence from 63 Mudray Street",
    dueDate: "12/29/2024",
    priority: "Low",
    remainingDays: 0,
    flags: "None",
    assignedOfficers: "Officer 4",
  },
];


export const AdminSP = () => {
  

  const navigate = useNavigate();

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

   // Initial static rows (3 rows)
    const initialStaticRows = Array(3).fill({
      junction: "And",
      field: "",
      evaluator: "",
      value: "",
    });
  
    const [staticRows, setStaticRows] = useState(initialStaticRows);
    const [dynamicRows, setDynamicRows] = useState([]); // Dynamic rows managed separately
    const [matchingLeads, setMatchingLeads] = useState([]);
  
    // Handles input changes for static or dynamic rows
    const handleInputChange = (index, field, value, isDynamic = false) => {
      if (isDynamic) {
        const updatedRows = [...dynamicRows];
        updatedRows[index][field] = value;
        setDynamicRows(updatedRows);
      } else {
        const updatedRows = [...staticRows];
        updatedRows[index][field] = value;
        setStaticRows(updatedRows);
      }
    };
  
    // Clears static row content (does not remove it)
    const handleClearStaticRow = (index) => {
      const updatedRows = [...staticRows];
      updatedRows[index] = { junction: "And", field: "", evaluator: "", value: "" };
      setStaticRows(updatedRows);
    };
  
    // Removes dynamic rows entirely
    const handleRemoveDynamicRow = (index) => {
      const updatedRows = dynamicRows.filter((_, i) => i !== index);
      setDynamicRows(updatedRows);
    };
  
    // Adds a new dynamic row
    const handleAddRow = () => {
      setDynamicRows([
        ...dynamicRows,
        { junction: "And", field: "", evaluator: "", value: "" },
      ]);
    };
  
    // Search function to filter matching leads
    const handleSearch = () => {
      const combinedRows = [...staticRows, ...dynamicRows];
  
      const filteredLeads = sampleLeads.filter((lead) => {
        return combinedRows.some((row) => {
          const value = row.value.toLowerCase();
          switch (row.field) {
            case "Lead Number":
              return lead.id.toLowerCase().includes(value);
            case "Keyword":
            case "Lead Name":
              return lead.name.toLowerCase().includes(value);
            case "Assigned To":
              return lead.assignedOfficers.toLowerCase().includes(value);
            default:
              return false;
          }
        });
      });
  
      setMatchingLeads(filteredLeads);
    };
  


  return (
    <div className="admin-container">
      <Navbar />

      <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item" onClick={() => handleNavigation('/AdminUR')}>
            User Registration
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminCM')}>
           Case Management
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/AdminSC')} >
            Search Cases
          </span>
          <span className="menu-item active" onClick={() => handleNavigation('/AdminSP')} >
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
      <div classname = "title-block">
      <h1 className="searchlead-title">SEARCH PEOPLE</h1>
      </div>

<div className="main-content-searchlead">
  <table className="search-table">
    <thead>
      <tr>
        <th>Junction</th>
        <th>Field</th>
        <th>Evaluator</th>
        <th>Value</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {/* Render Static Rows */}
      {staticRows.map((row, index) => (
        <tr key={`static-${index}`}>
          <td>
            <select
              value={row.junction}
              onChange={(e) =>
                handleInputChange(index, "junction", e.target.value)
              }
            >
              <option value="And">And</option>
              <option value="Or">Or</option>
            </select>
          </td>
          <td>
            <select
              value={row.field}
              onChange={(e) =>
                handleInputChange(index, "field", e.target.value)
              }
            >
              <option value="">Select Field</option>
              <option value="Keyword">Keyword</option>
              <option value="Name">Name</option>
              <option value="Address">Address</option>
              <option value="Phone No">Phone No</option>
              <option value="Age">Age</option>
              <option value="Email">Email</option>
              <option value="Race">Race</option>
              <option value="Ethnicity">Ethnicity</option>
              <option value="HairColor">Hair Color</option>
              <option value="EyeColor">Eye Color</option>
            </select>
          </td>
          <td>
            <select
              value={row.evaluator}
              onChange={(e) =>
                handleInputChange(index, "evaluator", e.target.value)
              }
            >
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
            </select>
          </td>
          <td>
            <input
              type="text"
              value={row.value}
              onChange={(e) =>
                handleInputChange(index, "value", e.target.value)
              }
            />
          </td>
          <td>
            <button
              className="clear-btn"
              onClick={() => handleClearStaticRow(index)}
            >
              Clear row
            </button>
          </td>
        </tr>
      ))}

      {/* Render Dynamic Rows */}
      {dynamicRows.map((row, index) => (
        <tr key={`dynamic-${index}`}>
          <td>
            <select
              value={row.junction}
              onChange={(e) =>
                handleInputChange(index, "junction", e.target.value, true)
              }
            >
              <option value="And">And</option>
              <option value="Or">Or</option>
            </select>
          </td>
          <td>
            <select
              value={row.field}
              onChange={(e) =>
                handleInputChange(index, "field", e.target.value, true)
              }
            >
              <option value="">Select Field</option>
              <option value="Keyword">Keyword</option>
              <option value="Name">Name</option>
              <option value="Address">Address</option>
              <option value="Phone No">Phone No</option>
              <option value="Age">Age</option>
              <option value="Email">Email</option>
              <option value="Race">Race</option>
              <option value="Ethnicity">Ethnicity</option>
              <option value="HairColor">Hair Color</option>
              <option value="EyeColor">Eye Color</option>
            </select>
          </td>
          <td>
            <select
              value={row.evaluator}
              onChange={(e) =>
                handleInputChange(index, "evaluator", e.target.value, true)
              }
            >
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
            </select>
          </td>
          <td>
            <input
              type="text"
              value={row.value}
              onChange={(e) =>
                handleInputChange(index, "value", e.target.value, true)
              }
            />
          </td>
          <td>
            <button
              className="clear-btn"
              onClick={() => handleRemoveDynamicRow(index)}
            >
              Remove row
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  
  {/* Button Section */}
  <div className="searchlead-btns-container">
    <button className="add-row-btn" onClick={handleAddRow}>
      + Add Row
    </button>
    <button className="add-row-btn" onClick={handleSearch}>
      Search
    </button>
  </div>

  <div className="results-section">
<p className="results-title">Matching Records</p>
<div className="result-line"></div>
<table className="results-table">
<thead>
<tr>
  <th>Name</th>
  <th>Address</th>
  <th>Phone No</th>
  <th>Age</th>
  <th>Actions</th>
</tr>
</thead>
<tbody>
{matchingLeads.length > 0 ? (
  matchingLeads.map((lead, index) => (
    <tr key={index}>
      <td>{lead.id}: {lead.name}</td>
      <td>{lead.dueDate}</td>
      <td>{lead.priority}</td>
      <td>{lead.remainingDays}</td>
      <td>{lead.flags}</td>
      <td>{lead.assignedOfficers}</td>
      <td>
        <button className="view-btn" onClick={() => navigate(`/lead/${lead.id}`)}>View</button>
      </td>
    </tr>
  ))
) : (
  // Render empty rows if no data is available
  Array.from({ length: 1 }).map((_, index) => (
    <tr key={`empty-${index}`}>
      <td colSpan="7" style={{ textAlign: 'center', color: '#aaa' }}>
        No matching cases available
      </td>
    </tr>
  ))
)}
</tbody>
</table>
</div>
</div>
      
    </div>
  );
};
