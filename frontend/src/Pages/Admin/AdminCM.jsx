import React, { useState } from "react";
import "./AdminCM.css";
import Navbar from "../../components/Navbar/Navbar";
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";

import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import NotificationCard from "../../components/NotificationCard/NotificationCard1";
import { useNavigate } from "react-router-dom";

export const AdminCM = () => {
  const [cases, setCases] = useState([
    { id: 12345, name: "Main Street Murder", dateCreated:"04/25/25" , caseManager:"Officer 1", officers:['Officer 2 ', 'Officer 3']  },
    { id: 45607, name: "Cook Street Stolen Truck",dateCreated:"04/25/25"  , caseManager:"Officer 1", officers:['Officer 2 ', 'Officer 3'] },
    { id: 23789, name: "216 Endicott Burglary",dateCreated:"04/25/25"  , caseManager:"Officer 1", officers:['Officer 2 ', 'Officer 3']  },
    { id: 65741, name: "Murray Street Stolen Gold", dateCreated:"04/25/25"  , caseManager:"Officer 1", officers:['Officer 2 ', 'Officer 3'] },
  ]);

    const navigate = useNavigate();
      const [activeTab, setActiveTab] = useState("cases"); // Default tab

  const officers = [
    { name: "Officer 1", casesAssigned: "2" },
    { name: "Officer 2", casesAssigned: "1" },
    { name: "Officer 3", casesAssigned: "3" },
  ];

  const signedInOfficer = localStorage.getItem("loggedInUser");
  console.log(signedInOfficer)

    const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const addCase = (newCase) => {
    setCases([...cases, newCase]);
  };

  const deleteCase = (id) => {
    setCases(cases.filter((c) => c.id !== id));
  };
  const handleCaseClick = (caseDetails) => {
    if (caseDetails.role === "Investigator") {
      navigate("/Investigator", { state: { caseDetails } });
    } else if (caseDetails.role === "Case Manager") {
      navigate("/CasePageManager", { state: { caseDetails } });
    }
  };

  const closeCase = (id) => {
    console.log(`Case ${id} closed.`);
  };

  const editCase = (caseDetails) => {
    navigate("/CasePageManager", { state: { caseDetails } });
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

    const [sortField, setSortField] = useState(""); // Sorting field
    const [filterText, setFilterText] = useState(""); // Filter text
    const [filterPopupVisible, setFilterPopupVisible] = useState(false);
    const [filterSortPopupVisible, setFilterSortPopupVisible] = useState(false); // State for popup visibility
    const [selectedPriority, setSelectedPriority] = useState(""); // State for priority filter
    const [sortOrder, setSortOrder] = useState(""); // State for sort order
    const [remainingDaysFilter, setRemainingDaysFilter] = useState("");
  const [flagsFilter, setFlagsFilter] = useState("");
  const [assignedOfficersFilter, setAssignedOfficersFilter] = useState("");
  const [newInvestigator, setNewInvestigator] = useState("");
  
  
  const [showCaseSelector, setShowCaseSelector] = useState(false);
    const [navigateTo, setNavigateTo] = useState(""); // Target page
  
  
    const handleShowCaseSelector = (targetPage) => {
      setNavigateTo(targetPage);
      setShowCaseSelector(true);
    };
  
  
    // Function to close CaseSelector
    const handleCloseCaseSelector = () => {
      setShowCaseSelector(false);
      setNavigateTo(""); // Reset navigation target
    };
  
  
    const handleAssignRole = (caseId) => {
      const role = prompt("Assign role (Investigator/Case Manager):");
      if (role) {
        setCases((prevCases) =>
          prevCases.map((c) =>
            c.id === caseId ? { ...c, role: role } : c
          )
        );
      }
    };

    // Handler to view the assigned lead details (can be updated to show a modal or navigate)
    const handleViewAssignedLead = (lead) => {
    };
    
    
    const handleLRClick = (lead) => {
      navigate("/LRInstruction", { state: { leadDetails: lead } });
    };
    const handleAssignInvestigator = (caseId) => {
      const investigator = prompt("Enter investigator name:");
      if (investigator) {
        setCases((prevCases) =>
          prevCases.map((c) =>
            c.id === caseId ? { ...c, assignedInvestigator: investigator } : c
          )
        );
      }
    };
    
    
    // Handler to accept the assigned lead
    const handleAcceptAssignedLead = (lead) => {
      const confirmAccept = window.confirm(
        `Are you sure you want to accept this lead?`
      );
      if (confirmAccept) {
        // Remove lead from assignedLeads and add it to pendingLeads
        setLeads((prevLeads) => {
          const updatedAssignedLeads = prevLeads.assignedLeads.filter(
            (l) => l.id !== lead.id
          );
          const updatedPendingLeads = [...prevLeads.pendingLeads, lead];
          return {
            ...prevLeads,
            assignedLeads: updatedAssignedLeads,
            pendingLeads: updatedPendingLeads,
          };
        });
      }
    };
    
    
    const acceptLead = (leadId) => {
      const leadToAccept = leads.assignedLeads.find((lead) => lead.id === leadId);
      if (!leadToAccept) return;
    
    
      // Add lead to pending leads with default fields if not present
      const newPendingLead = {
        ...leadToAccept,
        dueDate: leadToAccept.dueDate || "12/31/2024", // Default due date
        priority: leadToAccept.priority || "Medium", // Default priority
        flags: leadToAccept.flags || [],
        assignedOfficers: leadToAccept.assignedOfficers || ["Unassigned"],
      };
    
    
      setLeads((prevLeads) => ({
        ...prevLeads,
        assignedLeads: prevLeads.assignedLeads.filter((lead) => lead.id !== leadId),
        pendingLeads: [...prevLeads.pendingLeads, newPendingLead],
      }));
    };
    
    
    
    
     
      const [leads, setLeads] = useState({
        assignedLeads: [
          { id: 45, description: "Collect Audio Records from Dispatcher",dueDate: "12/28/2024",
            priority: "High",
            flags: ["Important"],
            assignedOfficers: ["Officer 1", "Officer 3"], },
          { id: 20, description: "Interview Mr. John",dueDate: "12/31/2024",
            priority: "Medium",
            flags: [],
            assignedOfficers: ["Officer 2"] },
          { id: 84, description: "Collect Evidence from 63 Mudray Street",dueDate: "12/20/2024",
            priority: "Low",
            flags: [],
            assignedOfficers: ["Officer 4"] },
        ],
        pendingLeads: [
          {
            id: 21,
            description: "Interview Witness",
            dueDate: "12/28/2024",
            priority: "High",
            flags: ["Important"],
            assignedOfficers: ["Officer 1", "Officer 3", "Officer 8"],
          },
          {
            id: 30,
            description: "Interview Neighbours",
            dueDate: "12/30/2024",
            priority: "Medium",
            flags: [],
            assignedOfficers: ["Officer 2"],
          },
          {
            id: 32,
            description: "Collect Evidence",
            dueDate: "12/31/2024",
            priority: "Low",
            flags: [],
            assignedOfficers: ["Officer 4"],
          },
        ],
        pendingLeadReturns: [
          { id: 33, description: "Submit Crime Scene Photos" },
          { id: 32, description: "Collect Evidence", dueDate: "12/25/2024" },
          { id: 21, description: "Interview Witness", dueDate: "12/24/2024" },
        ],
      });

      const addPendingLead = (newLead) => {
        setLeads((prevLeads) => ({
          ...prevLeads,
          pendingLeads: [
            ...prevLeads.pendingLeads,
            {
              ...newLead,
              dueDate: newLead.dueDate || "12/31/2024", // Default due date
              priority: newLead.priority || "Medium", // Default priority
              flags: newLead.flags || [],
              assignedOfficers: newLead.assignedOfficers || ["Unassigned"], // Default officer
            },
          ],
        }));
      };
     
    
    
      // Calculate remaining days from the due date
      const calculateRemainingDays = (dueDate) => {
        const currentDate = new Date();
        const targetDate = new Date(dueDate);
        const timeDifference = targetDate - currentDate;
        return Math.max(0, Math.ceil(timeDifference / (1000 * 60 * 60 * 24))); // Return 0 if negative
      };
     
    
    
      // Sort leads
      const handleSort = (field, order) => {
        setSortField(`${field}-${order}`);
        setLeads((prevLeads) => ({
          ...prevLeads,
          pendingLeads: [...prevLeads.pendingLeads].sort((a, b) => {
            let comparison = 0;
     
            if (field === "remainingDays") {
              const remainingDaysA = Math.max(0, calculateRemainingDays(a.dueDate));
              const remainingDaysB = Math.max(0, calculateRemainingDays(b.dueDate));
              comparison = remainingDaysA - remainingDaysB;
            } else if (field === "priority") {
              const priorities = { High: 3, Medium: 2, Low: 1 };
              comparison = priorities[a[field]] - priorities[b[field]];
            } else {
              comparison = a[field]?.localeCompare(b[field]);
            }
     
            return order === "asc" ? comparison : -comparison;
          }),
        }));
      };
    
      // Continue a pending lead return
      const continueLead = (leadId) => {
        const leadToContinue = leads.pendingLeadReturns.find(
          (lead) => lead.id === leadId
        );
        if (!leadToContinue) return;
        setLeads((prevLeads) => ({
          ...prevLeads,
          pendingLeadReturns: prevLeads.pendingLeadReturns.filter(
            (lead) => lead.id !== leadId
          ),
          pendingLeads: [...prevLeads.pendingLeads, leadToContinue],
        }));
      };
     
    
    
     
    
    
      // Filter leads
      const handleFilter = (e) => {
        setFilterText(e.target.value);
      };
    
       const filtersConfig = [
              {
                name: "leadNumber",
                label: "Lead Number",
                options: ["45", "23", "14"],
              },
              {
                name: "leadName",
                label: "Lead Name",
                options: [
                  "Collect Audio from Dispatcher",
                  "Interview Mr. John",
                  "Collect evidence from 63 Mudray Street",
                ],
              },
              {
                name: "dueDate",
                label: "Due Date",
                options: ["Officer 1", "Officer 2", "Officer 3"],
              },
              {
                name: "Priority",
                label: "Priority",
                options: ["High", "Medium", "Low"],
              },
              {
                name: "Flag",
                label: "Flag",
                options: ["Important"],
              },
              {
                name: "assignedOfficers",
                label: "Assigned Officers",
                options: ["Officer 1", "Officer 2", "Officer 3"],
              },
              {
                name: "daysLeft",
                label: "Days Left",
                options: ["1", "2", "3"],
              },
            ];
          
            const filtersConfigPLR = [
              {
                name: "leadNumber",
                label: "Lead Number",
                options: ["45", "23", "14"],
              },
              {
                name: "leadName",
                label: "Lead Name",
                options: [
                  "Collect Audio from Dispatcher",
                  "Interview Mr. John",
                  "Collect evidence from 63 Mudray Street",
                ],
              },
              {
                name: "Priority",
                label: "Priority",
                options: ["High", "Medium", "Low"],
              },
              {
                name: "Flag",
                label: "Flag",
                options: ["Important"],
              },
            ];
          
            const filtersConfigOC = [
              {
                name: "CaseNumber",
                label: "Case Number",
                options: ["12345", "45637", "23789"],
              },
              {
                name: "CaseName",
                label: "Case Name",
                options: [
                  "Main Street Murder",
                  "Cook Streat School Threat",
                  "216 Endicott Suicide",
                ],
              },
              {
                name: "Role",
                label: "Role",
                options: ["Case Manager", "Investigator"],
              },
            ];
          
            const handleFilterApply = (filters) => {
              console.log("Applied Filters:", filters);
              // Perform filtering logic here (e.g., API call, state update)
            };
          
            const [sortedData, setSortedData] = useState([]);
            const data = [
              { category: "Electronics", price: 100 },
              { category: "Clothing", price: 50 },
              { category: "Electronics", price: 200 },
              { category: "Home", price: 150 },
            ];
            
    
  
  


  return (
    <div className="main-page-body">
      <Navbar />


      <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item" onClick={() => handleNavigation('/AdminUR')}>
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
          <span className="menu-item" onClick={() => handleNavigation('/AdminSP')} >
            Calendar
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminDashboard')} >
            Dashboard
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/Chatbot')} >
            Chatbot
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminDB')} >
           Database Backup
          </span>
         </div>
       </div>
      <div className="main-page-content">
        <div className="main-page-abovepart">

           {/* <NotificationCard acceptLead={acceptLead} signedInOfficer={signedInOfficer} /> */}
          
                <div className= "add-case-section">
                    <h2> Click here to add a new case</h2>
                    {/* <div className="slidebartopcontrolMP"> */}
                        <SlideBar
                        onAddCase={(newCase) => addCase(newCase)}
                        buttonClass="custom-add-case-btn1"
                      />
                      {/* </div> */}
                  </div>


                    <SlideBar
  onAddCase={(newCase) => addCase(newCase)}
  buttonClass="custom-add-case-btn"
/>

          {/* <div className="officer-section">
            <table className="officer-table">
              <thead>
                <tr>
                  <th>View Team</th>
                  <th>Cases Assigned</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((officer, index) => (
                  <tr key={index}>
                    <td>{officer.name}</td>
                    <td>{officer.casesAssigned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div> */}
          <div className = "left-content">
          <div className="stats-bar">
          {/* <span
            className={`hoverable ${activeTab === "assignedLeads" ? "active" : ""}`}
            onClick={() => setActiveTab("assignedLeads")}
          >
            My Assigned Leads: {leads.assignedLeads.length}
          </span>
          <span
            className={`hoverable ${activeTab === "pendingLeads" ? "active" : ""}`}
            onClick={() => setActiveTab("pendingLeads")}
          >
            My Pending Leads: {leads.pendingLeads.length}
          </span>
          <span
            className={`hoverable ${activeTab === "pendingLeadReturns" ? "active" : ""}`}
            onClick={() => setActiveTab("pendingLeadReturns")}
          >
            My Pending Lead Returns: {leads.pendingLeadReturns.length}
          </span> */}
          <span
            className={`hoverable ${activeTab === "cases" ? "active" : ""}`}
            onClick={() => setActiveTab("cases")}
          >
            Ongoing Cases: {cases.length}
          </span>
        </div>

        <div className="content-section">
        {activeTab === "cases" && (
            <div className="case-list">

<div className="filter-sort-icons">
                    <button onClick={() => setShowFilter(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/filter.png`}
                        alt="Filter Icon"
                        className="icon-image"
                      />
                    </button>
                    <button onClick={() => setShowSort(true)} className="icon-button">
                      <img 
                        src={`${process.env.PUBLIC_URL}/Materials/sort1.png`}
                        alt="Sort Icon"
                        className="icon-image"
                      />
                    </button>
                  </div>

                   {/* Conditionally render the Filter component */}
      {showFilter && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-popup-btn" onClick={() => setShowFilter(false)}>
              &times;
            </button>
            <Filter filtersConfig={filtersConfigOC} onApply={handleFilterApply} />
          </div>
        </div>
      )}

      {/* Conditionally render the Sort component */}
      {showSort && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-popup-btn" onClick={() => setShowSort(false)}>
              &times;
            </button>
            <Sort columns={["Lead Number", "Lead Name", "Priority", "Flag"]} onApplySort={handleSort} />
          </div>
          </div>
      )}


             {/* <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
             <Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} /> */}
            {cases.map((c) => (
              <div key={c.id} className="case-item">
                <span
                  className="case-details"
                  onClick={() => handleCaseClick(c)} // Handle case click
                >
                  <div className="case-details">
                        <span><strong>Case Number:</strong> {c.id} | {c.name} | <strong>Date Created:</strong> {c.dateCreated}</span>
                        <span className="block"><strong>Case Manager:</strong> {c.caseManager}</span>
                        <span className="block"><strong>Assigned Officers:</strong> {c.officers}</span>
                      </div>

                </span>
               
                <div className="case-actions">
                <button
                    className="edit-button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to edit case ${c.id}?`)) {
                        editCase(c.id);
                      }
                    }}
                  >
                    View
                  </button>

                  <button
                    className="save-btn1"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to close case ${c.id}?`)) {
                        closeCase(c.id);
                      }
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete case ${c.id}?`)) {
                        deleteCase(c.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>)}

          {activeTab === "assignedLeads" && (
  <div className="assigned-leads">
    {/* <Filter /> */}
    {/* <button
      onClick={() => setFilterSortPopupVisible(true)}
      className="filter-sort-button"
    >
      Open Filter & Sort
    </button> */}


    {filterSortPopupVisible && (
      <div className="popup-overlay">
        <div className="popup-content">
          <button
            className="close-popup-btn"
            onClick={() => setFilterSortPopupVisible(false)}
          >
            &times;
          </button>
          <h3>Filter & Sort Leads</h3>
          <div className="filter-sort-section">
            <div className="filters">
              <h4 className="filter-label">Filters</h4>
              <div className="filter-item">
                <input
                  type="text"
                  placeholder="Filter by Lead Name"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="filter-input"
                />
                <button
                  onClick={() => setFilterText("")}
                  className="clear-button"
                >
                  Clear Name Filter
                </button>
              </div>
              <div className="filter-item">
                <label className="filter-label">Priority:</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="filter-dropdown"
                >
                  <option value="">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  onClick={() => setSelectedPriority("")}
                  className="clear-button"
                >
                  Clear Priority Filter
                </button>
              </div>
              <div className="filter-item">
                <label className="filter-label">Remaining Days:</label>
                <input
                  type="number"
                  placeholder="Enter Remaining Days"
                  value={remainingDaysFilter}
                  onChange={(e) => setRemainingDaysFilter(e.target.value)}
                  className="filter-input"
                />
                <button
                  onClick={() => setRemainingDaysFilter("")}
                  className="clear-button"
                >
                  Clear Days Filter
                </button>
              </div>
              <div className="filter-item">
                <label className="filter-label">Flags:</label>
                <input
                  type="text"
                  placeholder="Filter by Flags"
                  value={flagsFilter}
                  onChange={(e) => setFlagsFilter(e.target.value)}
                  className="filter-input"
                />
                <button
                  onClick={() => setFlagsFilter("")}
                  className="clear-button"
                >
                  Clear Flags Filter
                </button>
              </div>
              <div className="filter-item">
                <label className="filter-label">Assigned Officers:</label>
                <input
                  type="text"
                  placeholder="Filter by Assigned Officers"
                  value={assignedOfficersFilter}
                  onChange={(e) =>
                    setAssignedOfficersFilter(e.target.value)
                  }
                  className="filter-input"
                />
                <button
                  onClick={() => setAssignedOfficersFilter("")}
                  className="clear-button"
                >
                  Clear Officers Filter
                </button>
              </div>
            </div>


            <div className="sorting">
              <h4 className="filter-label">Sorting</h4>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortField(field);
                  setSortOrder(order);
                }}
                className="sort-dropdown"
              >
                <option value="">Sort by...</option>
                <option value="description-asc">Name (A-Z)</option>
                <option value="description-desc">Name (Z-A)</option>
                <option value="dueDate-asc">Due Date (Oldest First)</option>
                <option value="dueDate-desc">Due Date (Newest First)</option>
                <option value="priority-asc">Priority (Low-High)</option>
                <option value="priority-desc">Priority (High-Low)</option>
              </select>
              <button
                onClick={() => {
                  setSortField("");
                  setSortOrder("");
                }}
                className="clear-button"
              >
                Clear Sorting
              </button>
            </div>
          </div>
          <button
            onClick={() => setFilterSortPopupVisible(false)}
            className="apply-button"
          >
            Apply Filters & Sorting
          </button>
        </div>
      </div>
    )}


    <table className="leads-table">
      <thead>
        <tr>
          <th>Lead No.</th>
          <th>Lead Name</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Days Left</th>
          <th>Flags</th>
          <th>Assigned Officers</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {leads.assignedLeads
          .filter(
            (lead) =>
              lead.description
                .toLowerCase()
                .includes(filterText.toLowerCase()) &&
              (!selectedPriority || lead.priority === selectedPriority)
          )
          .sort((a, b) => {
            if (!sortField || !sortOrder) return 0;
            if (sortField === "remainingDays") {
              return sortOrder === "asc"
                ? calculateRemainingDays(a.dueDate) -
                    calculateRemainingDays(b.dueDate)
                : calculateRemainingDays(b.dueDate) -
                    calculateRemainingDays(a.dueDate);
            }
            const fieldA = (a[sortField] || "").toString().toLowerCase();
            const fieldB = (b[sortField] || "").toString().toLowerCase();
            return sortOrder === "asc"
              ? fieldA.localeCompare(fieldB)
              : fieldB.localeCompare(fieldA);
          })
          .map((lead) => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td>{lead.dueDate || "N/A"}</td>
              <td>{lead.priority || "N/A"}</td>
              <td>{calculateRemainingDays(lead.dueDate) }</td>
              <td>{lead.flags?.join(", ") || "None"}</td>
              <td>{lead.assignedOfficers?.join(", ") || "Unassigned"}</td>
              <td>
                <button
                  className="view-btn1"
                  // onClick={() =>
                  // }
                >
                  View
                </button>
                <button
                  className="accept-btn"
                  onClick={() => {
                    if (
                      window.confirm(`Do you want to accept this lead?`)
                    ) {
                      acceptLead(lead.id);
                    }
                  }}
                >
                  Accept
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)}

          {activeTab === "pendingLeads" && (
  <div className="pending-leads">
    {/* <button
      onClick={() => setFilterSortPopupVisible(true)}
      className="filter-sort-button"
    >
      Open Filter & Sort
    </button> */}


    {filterSortPopupVisible && (
      <div className="popup-overlay">
        <div className="popup-content">
        <button
        className="close-popup-btn"
        onClick={() => setFilterSortPopupVisible(false)}
      >
        &times; {/* Close icon */}
      </button>
          <h3>Filter & Sort Leads</h3>
          <div className="filter-sort-section">
            <div className="filters">
              <h4>Filters</h4>
              <div className="filter-item">
                <input
                  type="text"
                  placeholder="Filter by Lead Name"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="filter-input"
                />
                <button
                  onClick={() => setFilterText("")}
                  className="clear-button"
                >
                  Clear Name Filter
                </button>
              </div>
              <div className="filter-item">
                <label>Priority:</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="filter-dropdown"
                >
                  <option value="">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  onClick={() => setSelectedPriority("")}
                  className="clear-button"
                >
                  Clear Priority Filter
                </button>
              </div>


            {/* Filter by Remaining Days */}
        <div className="filter-item">
          <label>Remaining Days:</label>
          <input
            type="number"
            placeholder="Enter Remaining Days"
            onChange={(e) => setRemainingDaysFilter(e.target.value)}
            className="filter-input"
          />
          <button
            onClick={() => setRemainingDaysFilter("")}
            className="clear-button"
          >
            Clear Days Filter
          </button>
        </div>


        {/* Filter by Flags */}
        <div className="filter-item">
          <label>Flags:</label>
          <input
            type="text"
            placeholder="Filter by Flags"
            onChange={(e) => setFlagsFilter(e.target.value)}
            className="filter-input"
          />
          <button onClick={() => setFlagsFilter("")} className="clear-button">
            Clear Flags Filter
          </button>
        </div>


        {/* Filter by Assigned Officers */}
        <div className="filter-item">
          <label>Assigned Officers:</label>
          <input
            type="text"
            placeholder="Filter by Assigned Officers"
            onChange={(e) => setAssignedOfficersFilter(e.target.value)}
            className="filter-input"
          />
          <button
            onClick={() => setAssignedOfficersFilter("")}
            className="clear-button"
          >
            Clear Officers Filter
          </button>
        </div>
        </div>


            <div className="sorting">
              <h4>Sorting</h4>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortField(field);
                  setSortOrder(order);
                }}
                className="sort-dropdown"
              >
                <option value="">Sort by...</option>
                <option value="description-asc">Name (A-Z)</option>
                <option value="description-desc">Name (Z-A)</option>
                <option value="dueDate-asc">Due Date (Oldest First)</option>
                <option value="dueDate-desc">Due Date (Newest First)</option>
                <option value="priority-asc">Priority (Low-High)</option>
                <option value="priority-desc">Priority (High-Low)</option>
              </select>
              <button
                onClick={() => {
                  setSortField("");
                  setSortOrder("");
                }}
                className="clear-button"
              >
                Clear Sorting
              </button>
            </div>
          </div>
          <button
            onClick={() => setFilterSortPopupVisible(false)}
            className="apply-button"
          >
            Apply Filters & Sorting
          </button>
        </div>
      </div>
    )}


    <table className="leads-table">
      <thead>
        <tr>
          <th>Lead No.</th>
          <th>Lead Name</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Days Left</th>
          <th>Flags</th>
          <th>Assigned Officers</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {leads.pendingLeads
          .filter(
            (lead) =>
              lead.description
                .toLowerCase()
                .includes(filterText.toLowerCase()) &&
              (!selectedPriority || lead.priority === selectedPriority)
          )
          .sort((a, b) => {
            if (!sortField || !sortOrder) return 0;
            if (sortField === "remainingDays") {
              return sortOrder === "asc"
                ? calculateRemainingDays(a.dueDate) -
                    calculateRemainingDays(b.dueDate)
                : calculateRemainingDays(b.dueDate) -
                    calculateRemainingDays(a.dueDate);
            }
            const fieldA = (a[sortField] || "").toString().toLowerCase();
            const fieldB = (b[sortField] || "").toString().toLowerCase();
            return sortOrder === "asc"
              ? fieldA.localeCompare(fieldB)
              : fieldB.localeCompare(fieldA);
          })
          .map((lead) => (
            <tr key={lead.id}>
              <td>{lead.id}</td>
              <td>{lead.description}</td>
              <td>{lead.dueDate}</td>
              <td>{lead.priority}</td>
              <td>{calculateRemainingDays(lead.dueDate)}</td>
              <td>{lead.flags.join(", ") || "None"}</td>
              <td>{lead.assignedOfficers.join(", ")}</td>
              <td>
                <button
                  className="view-btn1"
                  onClick={() => alert(`Viewing lead: ${lead.description}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)}


          {activeTab === "pendingLeadReturns" && (
  <div className="pending-lead-returns">
    <table className="pending-lr-table">
              <thead>
                <tr>
                  <th>Lead No.</th>
                  <th>Lead Name</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leads.pendingLeadReturns.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.id}</td>
                      <td>{lead.description}</td>
                      <td>
                        <button
                              className="continue-btn"
                              onClick={() => {
                                handleLRClick(lead)
                              }}
                            >
                              Continue
                            </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
    {/* <ul className="lead-list">
      {leads.pendingLeadReturns.map((lead) => (
        <li key={lead.id} className="lead-item">
          <span>{lead.description}</span>
          <button
            className="continue-btn"
            onClick={() => {
              handleLRClick(lead)
            }}
          >
            Continue
          </button>
        </li>
      ))}
    </ul> */}
  </div>
)}  


          <button className="view-all-cases-btn-admin" onClick={() => handleNavigation('/AdminCM1')}>View All Cases</button>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};
