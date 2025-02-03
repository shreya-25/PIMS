import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MainPage.css";
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useNavigate } from "react-router-dom";

export const MainPage = () => {
  const [activeTab, setActiveTab] = useState("cases"); // Default tab
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


  const [cases, setCases] = useState([
    // { id: 12345, title: "Main Street Murder", status: "ongoing", role: "Investigator" },
    // { id: 45637, title: "Cook Street School Threat", status: "ongoing", role: "Case Manager" },
    // { id: 23789, title: "216 Endicott Suicide", status: "ongoing", role: "Investigator" },
    // { id: 65734, title: "Murray Street Stolen Gold", status: "ongoing", role: "Investigator" },
  ]);

  const loggedInOfficer = localStorage.getItem("loggedInUser")?.trim();
  console.log("Logged-in officer from localStorage:", loggedInOfficer);



  useEffect(() => {

    if (!loggedInOfficer) {
      navigate("/"); // Redirect to login if not authenticated
      return;
  }

    const fetchCases = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/cases", {
          params: { officerName: loggedInOfficer },
        });

        setCases(response.data);

        const formattedCases = response.data.map((c) => ({
          id: c.caseNo,
          title: c.caseName,
          status: c.caseStatus,
          role: c.assignedOfficers.find((o) => o.name === loggedInOfficer)?.role || "Unknown",
        }));

        setCases(formattedCases);
      } catch (error) {
        console.error("Error fetching cases:", error);
      }
    };

    fetchCases();
  }, [loggedInOfficer]);


  // Handler to view the assigned lead details (can be updated to show a modal or navigate)
const handleViewAssignedLead = (lead) => {
};
const handleCaseClick = (caseDetails) => {
  if (caseDetails.role === "Investigator") {
    navigate("/Investigator", { state: { caseDetails } });
  } else if (caseDetails.role === "Case Manager") {
    navigate("/CasePageManager", { state: { caseDetails } });
  }
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
      { id: 1, description: "Lead 45: Collect Audio Records from Dispatcher",dueDate: "12/28/2024",
        priority: "High",
        flags: ["Important"],
        assignedOfficers: ["Officer 1", "Officer 3"], },
      { id: 2, description: "Lead 20: Interview Mr. John",dueDate: "12/31/2024",
        priority: "Medium",
        flags: [],
        assignedOfficers: ["Officer 2"] },
      { id: 3, description: "Lead 84: Collect Evidence from 63 Mudray Street",dueDate: "12/20/2024",
        priority: "Low",
        flags: [],
        assignedOfficers: ["Officer 4"] },
    ],
    pendingLeads: [
      {
        id: 4,
        description: "Lead 21: Interview Witness",
        dueDate: "12/28/2024",
        priority: "High",
        flags: ["Important"],
        assignedOfficers: ["Officer 1", "Officer 3"],
      },
      {
        id: 6,
        description: "Lead 30: Interview Neighbours",
        dueDate: "12/30/2024",
        priority: "Medium",
        flags: [],
        assignedOfficers: ["Officer 2"],
      },
      {
        id: 7,
        description: "Lead 32: Collect Evidence",
        dueDate: "12/31/2024",
        priority: "Low",
        flags: [],
        assignedOfficers: ["Officer 4"],
      },
    ],
    pendingLeadReturns: [
      { id: 5, description: "Lead 33: Submit Crime Scene Photos" },
      { id: 8, description: "Lead 32: Collect Evidence", dueDate: "12/25/2024" },
      { id: 9, description: "Lead 21: Interview Witness", dueDate: "12/24/2024" },
    ],
  });

  const navigate = useNavigate();


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
  

  // Adding a case to the list
 // Adding a case to the list
const addCase = (newCase) => {
  if (!newCase.id || !newCase.title || !newCase.status) {
    alert("Case must have an ID, title, and status.");
    return;
  }
  
  if (window.confirm(`Are you sure you want to add the case "${newCase.title}" with ID ${newCase.id}?`)) {
    setCases((prevCases) => [...prevCases, newCase]);
    alert(`Case "${newCase.title}" added successfully!`);
  }
};


  // Close an ongoing case
  const closeCase = (caseId) => {
    if (window.confirm("Are you sure you want to close this case?")) {
      setCases((prevCases) =>
        prevCases.filter((c) => c.id !== caseId)
      );
    }
  };

  // Delete an ongoing case
  const deleteCase = (caseId) => {
    if (window.confirm("Are you sure you want to delete this case?")) {
      setCases((prevCases) =>
        prevCases.filter((c) => c.id !== caseId)
      );
    }
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

  return (
    <div>
    <Navbar />
    <div className="main-container">
        {/* Pass down props for leads, cases, and modal visibility */}
        {/* <SideBar
          leads={leads} // Pass leads if needed
          cases={cases}
          setActiveTab={setActiveTab}
          onShowCaseSelector={handleShowCaseSelector} // Pass handler
        /> */}
        <div className="logo-sec">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo-main-page"
          />
          <h1 className="main-page-heading"> PIMS</h1>
        </div>
        <div className="content-container">
          {/* {showCaseSelector && (
            <CaseSelector
              cases={cases}
              navigateTo={navigateTo}
              onClose={handleCloseCaseSelector} // Pass close functionality
            />
          )} */}
      <div className="main-page">
        <div className="above-sec">
          <div className="top-controls">
            <Searchbar
              placeholder="Search Cases"
              onSearch={(query) => console.log("Search query:", query)}
            />
            {/* <SlideBar
                onAddCase={(newCase) => addCase(newCase)} // Pass addCase function with confirmation
            /> */}
          </div>
        </div>
        <div className="stats-bar">
          <span
            className={`hoverable ${activeTab === "assignedLeads" ? "active" : ""}`}
            onClick={() => setActiveTab("assignedLeads")}
          >
            Assigned Leads: {leads.assignedLeads.length}
          </span>
          <span
            className={`hoverable ${activeTab === "pendingLeads" ? "active" : ""}`}
            onClick={() => setActiveTab("pendingLeads")}
          >
            Pending Leads: {leads.pendingLeads.length}
          </span>
          <span
            className={`hoverable ${activeTab === "pendingLeadReturns" ? "active" : ""}`}
            onClick={() => setActiveTab("pendingLeadReturns")}
          >
            Pending Lead Returns: {leads.pendingLeadReturns.length}
          </span>
          <span
            className={`hoverable ${activeTab === "cases" ? "active" : ""}`}
            onClick={() => setActiveTab("cases")}
          >
            My Ongoing Cases: {cases.length}
          </span>
        </div>

        <div className="content-section">
        {activeTab === "cases" && (
            <div className="case-list">
            {cases.map((c) => (
              <div key={c.id} className="case-item">
                <span
                  className="case-details"
                  onClick={() => handleCaseClick(c)} // Handle case click
                >
                  <strong>Case Number:</strong> {c.id} | {c.title} | <strong>Role:</strong> {c.role}
                </span>
               
                <div className="case-actions">

                  <button
                    className="close-button"
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
          </div>
          
)}



{activeTab === "assignedLeads" && (
  <div className="assigned-leads">
    <button
      onClick={() => setFilterSortPopupVisible(true)}
      className="filter-sort-button"
    >
      Open Filter & Sort
    </button>

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
          <th>Lead Number and Name</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Remaining Days</th>
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
              <td>{lead.description}</td>
              <td>{lead.dueDate || "N/A"}</td>
              <td>{lead.priority || "N/A"}</td>
              <td>{calculateRemainingDays(lead.dueDate) }</td>
              <td>{lead.flags?.join(", ") || "None"}</td>
              <td>{lead.assignedOfficers?.join(", ") || "Unassigned"}</td>
              <td>
                <button
                  className="view-btn"
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
    <button
      onClick={() => setFilterSortPopupVisible(true)}
      className="filter-sort-button"
    >
      Open Filter & Sort
    </button>

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
          <th>Lead Number and Name</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Remaining Days</th>
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
              <td>{lead.description}</td>
              <td>{lead.dueDate}</td>
              <td>{lead.priority}</td>
              <td>{calculateRemainingDays(lead.dueDate)}</td>
              <td>{lead.flags.join(", ") || "None"}</td>
              <td>{lead.assignedOfficers.join(", ")}</td>
              <td>
                <button
                  className="view-btn"
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
    <ul className="lead-list">
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
    </ul>
  </div>
)}  

        </div>
      </div>
    </div>
    </div>
    </div>
  );
};