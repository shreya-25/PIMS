import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import "./HomePage.css";
import { CaseContext } from "../CaseContext";
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import NotificationCard from "../../components/NotificationCard/NotificationCard1";
import Filter from "../../components/Filter/Filter";
import Sort from "../../components/Sort/Sort";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
// import { FaFilter, FaSort } from "react-icons/fa";
import Pagination from "../../components/Pagination/Pagination";


export const HomePage = () => {

  const [activeTab, setActiveTab] = useState("cases"); // Default tab
  const [sortField, setSortField] = useState(""); 
  const [filterText, setFilterText] = useState("");
  // const [filterPopupVisible, setFilterPopupVisible] = useState(false);
  const [filterSortPopupVisible, setFilterSortPopupVisible] = useState(false); // State for popup visibility
  const [selectedPriority, setSelectedPriority] = useState(""); // State for priority filter
  const [sortOrder, setSortOrder] = useState(""); // State for sort order
  const [remainingDaysFilter, setRemainingDaysFilter] = useState("");
const [flagsFilter, setFlagsFilter] = useState("");
const [assignedOfficersFilter, setAssignedOfficersFilter] = useState("");
// const [newInvestigator, setNewInvestigator] = useState("");
const [appliedFilters, setAppliedFilters] = useState({});


    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const totalPages = 10;
    const totalEntries = 100;
  


const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [navigateTo, setNavigateTo] = useState(""); 

  const { setSelectedCase, setToken, withAutoRefresh } = useContext(CaseContext);

  const [showFilter, setShowFilter] = useState(false);
const [showSort, setShowSort] = useState(false);




  // const handleShowCaseSelector = (targetPage) => {
  //   setNavigateTo(targetPage);
  //   setShowCaseSelector(true);
  // };

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


  const signedInOfficer = localStorage.getItem("loggedInUser");

  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem("token"); // Get JWT token

        if (!token) {
          console.error("❌ No token found. User is not authenticated.");
          return;
        }

        const response = await axios.get("https://pims-backend.onrender.com/api/cases", {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ Pass token in Authorization header
            "Content-Type": "application/json",
          },
          params: { officerName: signedInOfficer }, // ✅ Send officerName as query param
        });

        console.log("✅ API Response:", response.data); // Debugging log

        // ✅ Filter cases where the signed-in officer is assigned
        const assignedCases = response.data
          .filter(c => c.assignedOfficers.some(o => o.name === signedInOfficer)) // ✅ Remove cases where officer is not assigned
          .map((c) => {
            const officerInfo = c.assignedOfficers.find(o => o.name === signedInOfficer);
            return {
              id: c.caseNo,
              title: c.caseName,
              status: c.caseStatus,
              role: officerInfo ? officerInfo.role : "Unknown", // ✅ Ensure correct role is displayed
            };
          });

        setCases(assignedCases); // ✅ Set filtered cases in state
      } catch (error) {
        console.error("❌ Error fetching cases:", error.response?.data || error);
      }
    };

    fetchCases();
  }, [signedInOfficer]);

  // Handler to view the assigned lead details (can be updated to show a modal or navigate)
const handleViewAssignedLead = (lead) => {
};

const handleCaseClick = (caseDetails) => {
 

  // Save case details in context
  setSelectedCase({
    caseNo: caseDetails.id,
    caseName: caseDetails.title,
    role: caseDetails.role
  });

  // Navigate to the appropriate page based on role
  if (caseDetails.role === "Investigator") {
    localStorage.setItem("role", "Investigator");
    setSelectedCase({
      caseNo: caseDetails.id,
      caseName: caseDetails.title,
      role: caseDetails.role
    });
    navigate("/Investigator", { state: { caseDetails } });
  } else if (caseDetails.role === "Case Manager") {
    localStorage.setItem("role", "Case Manager");
    setSelectedCase({
      caseNo: caseDetails.id,
      caseName: caseDetails.title,
      role: caseDetails.role
    });
    navigate("/CasePageManager", { state: { caseDetails } });
  }
};

console.log(localStorage);


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
    // { id: 45, description: "Collect Audio Records from Dispatcher",dueDate: "12/28/2024",
    //   priority: "High",
    //   flags: ["Important"],
    //   assignedOfficers: ["Officer 1", "Officer 3"], },
    // { id: 20, description: "Interview Mr. John",dueDate: "12/31/2024",
    //   priority: "Medium",
    //   flags: [],
    //   assignedOfficers: ["Officer 2"] },
    // { id: 84, description: "Collect Evidence from 63 Mudray Street",dueDate: "12/20/2024",
    //   priority: "Low",
    //   flags: [],
    //   assignedOfficers: ["Officer 4"] },
  ],
  pendingLeads: [
    // {
    //   id: 21,
    //   description: "Interview Witness",
    //   dueDate: "12/28/2024",
    //   priority: "High",
    //   flags: ["Important"],
    //   assignedOfficers: ["Officer 1", "Officer 3", "Officer 8"],
    // },
    // {
    //   id: 30,
    //   description: "Interview Neighbours",
    //   dueDate: "12/30/2024",
    //   priority: "Medium",
    //   flags: [],
    //   assignedOfficers: ["Officer 2"],
    // },
    // {
    //   id: 32,
    //   description: "Collect Evidence",
    //   dueDate: "12/31/2024",
    //   priority: "Low",
    //   flags: [],
    //   assignedOfficers: ["Officer 4"],
    // },
  ],
  pendingLeadReturns: [
    // { id: 33, description: "Submit Crime Scene Photos" },
    // { id: 32, description: "Collect Evidence", dueDate: "12/25/2024" },
    // { id: 21, description: "Interview Witness", dueDate: "12/24/2024" },
  ],
});


  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingLeadReturns = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("❌ No token found. User is not authenticated.");
                return;
            }

            // ✅ Fetch all lead returns assigned to or assigned by the officer
            const leadsResponse = await axios.get("https://pims-backend.onrender.com/api/leadreturn/officer-leads", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            console.log("✅ API Response (Lead Returns):", leadsResponse.data); // Debugging log

            // ✅ Fetch all cases with their statuses
            const casesResponse = await axios.get("https://pims-backend.onrender.com/api/cases", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            console.log("✅ API Response (Cases):", casesResponse.data); // Debugging log

            // ✅ Extract only ongoing cases (caseStatus = "Ongoing")
            const ongoingCases = casesResponse.data
                .filter(c => c.caseStatus === "Ongoing")
                .map(c => ({ caseNo: c.caseNo, caseName: c.caseName })); // Extract relevant fields

            console.log("✅ Ongoing Cases:", ongoingCases);

            // ✅ Filter pending lead returns for the signed-in officer and ongoing cases
            const pendingLeadReturns = [];

            leadsResponse.data.forEach(lead => {
                let officerStatus = null;

                // Check if the signed-in officer is in assignedTo
                if (lead.assignedTo.assignees.includes(signedInOfficer)) {
                    officerStatus = lead.assignedTo.lRStatus;
                }

                // Check if the signed-in officer is in assignedBy
                if (lead.assignedBy.assignee === signedInOfficer) {
                    officerStatus = lead.assignedBy.lRStatus;
                }

                // ✅ If officerStatus is Pending and the case is ongoing, add to pendingLeadReturns
                if (officerStatus === "Pending" &&
                    ongoingCases.some(c => c.caseNo === lead.caseNo && c.caseName === lead.caseName)) {
                    pendingLeadReturns.push({
                        id: lead.leadNo,
                        description: lead.description,
                        caseName: lead.caseName,
                        caseNo: lead.caseNo,
                    });
                }
            });

            console.log("✅ Filtered Pending Lead Returns:", pendingLeadReturns);

            // ✅ Update state with filtered lead returns
            setLeads(prevLeads => ({
                ...prevLeads,
                pendingLeadReturns: pendingLeadReturns
            }));

        } catch (error) {
            console.error("❌ Error fetching pending lead returns:", error.response?.data || error);
        }
    };

    fetchPendingLeadReturns();
}, [signedInOfficer]);



useEffect(() => {
  const fetchPendingLeads = async () => {
      try {
          const token = localStorage.getItem("token");
          if (!token) {
              console.error("❌ No token found. User is not authenticated.");
              return;
          }

          // ✅ Fetch all assigned leads
          const leadsResponse = await axios.get("https://pims-backend.onrender.com/api/lead/assignedTo-leads", {
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
              }
          });

          console.log("✅ API Response (Assigned Leads):", leadsResponse.data); // Debugging log

          // ✅ Fetch all cases with their statuses
          const casesResponse = await axios.get("https://pims-backend.onrender.com/api/cases", {
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
              }
          });

          console.log("✅ API Response (Cases):", casesResponse.data); // Debugging log

          // ✅ Extract only ongoing cases (caseStatus = "Ongoing")
          const ongoingCases = casesResponse.data
              .filter(c => c.caseStatus === "Ongoing")
              .map(c => ({ caseNo: c.caseNo, caseName: c.caseName })); // Extract relevant fields

          console.log("✅ Ongoing Cases:", ongoingCases);

          // ✅ Filter leads where the signed-in officer is assigned and the case is ongoing
          const assignedLeads = leadsResponse.data
              .filter(lead =>
                  lead.assignedTo.includes(signedInOfficer) && 
                  ongoingCases.some(c => c.caseNo === lead.caseNo && c.caseName === lead.caseName) // Match ongoing cases
              )
              .map(lead => ({
                  id: lead.leadNo,
                  description: lead.description,
                  dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().split("T")[0] : "N/A",
                  priority: lead.priority || "Medium",
                  flags: lead.associatedFlags || [],
                  assignedOfficers: lead.assignedTo, // Keep all assigned officers
                  leadStatus: lead.leadStatus, // Capture status
                  caseName: lead.caseName,
                  caseNo: lead.caseNo
              }));

          // ✅ Filter leads where status is "Pending"
          const pendingLeads = assignedLeads.filter(lead => lead.leadStatus === "Pending");

          console.log("✅ Filtered Assigned Leads:", assignedLeads);
          console.log("✅ Filtered Pending Leads:", pendingLeads);

          // ✅ Update state with filtered leads
          setLeads(prevLeads => ({
              ...prevLeads,
              assignedLeads: assignedLeads,
              pendingLeads: pendingLeads
          }));

      } catch (error) {
          console.error("❌ Error fetching assigned leads:", error.response?.data || error);
      }
  };

  fetchPendingLeads();
}, [signedInOfficer]);

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
 

  const handleCaseSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  
    setCases((prevCases) => {
      return [...prevCases].sort((a, b) => {
        let aField = a;
        let bField = b;
  
        // Convert Case No to numbers for accurate sorting
        if (field === "Case No") {
          aField = parseInt(a.id, 10);
          bField = parseInt(b.id, 10);
        } else if (field === "Case Name") {
          aField = a.title.toLowerCase();
          bField = b.title.toLowerCase();
        } else if (field === "Role") {
          aField = a.role.toLowerCase();
          bField = b.role.toLowerCase();
        }
  
        if (aField < bField) return order === "asc" ? -1 : 1;
        if (aField > bField) return order === "asc" ? 1 : -1;
        return 0;
      });
    });
  };
  
  


  // Adding a case to the list
 // Adding a case to the list
const addCase = (newCase) => {
  if (!newCase.id || !newCase.title || !newCase.status) {
    // alert("Case must have an ID, title, and status.");
    return;
  }
    setCases((prevCases) => [...prevCases, newCase]);
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
      name: "assignedOfficers",
      label: "Assigned Officers",
      options: ["Officer 1", "Officer 2", "Officer 3"],
    },
    {
      name: "CaseName",
      label: "Case Name",
      options: [
        "Main Street Murder",
        "Cook Streat School Threat",
        "216 Endicott Suicide",
      ],
    }
    // {
    //   name: "daysLeft",
    //   label: "Days Left",
    //   options: ["1", "2", "3"],
    // },
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
      name: "CaseName",
      label: "Case Name",
      options: [
        "Main Street Murder",
        "Cook Streat School Threat",
        "216 Endicott Suicide",
      ],
    }
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
    {
      name: "Status",
      label: "Case Status",
      options: ["Ongoing", "Closed"],
    },
  ];

  const handleFilterApply = (filters) => {
    console.log("✅ Applied Filters:", filters);
    setAppliedFilters(filters);
  };
  

  const [sortedData, setSortedData] = useState([]);
  const data = [
    { category: "Electronics", price: 100 },
    { category: "Clothing", price: 50 },
    { category: "Electronics", price: 200 },
    { category: "Home", price: 150 },
  ];

  // Function to apply sorting
  // const handleSort = (sortConfig) => {
  //   const { category, order } = sortConfig;

  //   if (!category) return; // If no column selected, do nothing

  //   const sorted = [...data].sort((a, b) => {
  //     if (a[category] < b[category]) return order === "asc" ? -1 : 1;
  //     if (a[category] > b[category]) return order === "asc" ? 1 : -1;
  //     return 0;
  //   });

  //   setSortedData(sorted);
  // };



  return (
    <div className = "main-page-body">
    <Navbar />
    {/* <div className="main-container"> */}
        {/* Pass down props for leads, cases, and modal visibility */}
        {/* <SideBar
          leads={leads} // Pass leads if needed
          cases={cases}
          setActiveTab={setActiveTab}
          onShowCaseSelector={handleShowCaseSelector} // Pass handler
        /> */}
         {/* <div className="above-sec-MP"> */}
        {/* <div className="logo-sec">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} 
            alt="Police Department Logo"
            className="police-logo-main-page"
          />
          <h1 className="main-page-heading"> PIMS</h1>
        </div> */}
        {/* </div> */}
        {/* <div className="top-controlsMP"> */}
            {/* <div className="search-container">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search Cases"
                    />
              </div> */}
              {/* <div className="slidebartopcontrolMP">
              <SlideBar
              onAddCase={(newCase) => addCase(newCase)}
              buttonClass="custom-add-case-btn1"
            />
            </div> */}
          {/* </div> */}
        {/* <div className="content-container"> */}
          {/* {showCaseSelector && (
            <CaseSelector
              cases={cases}
              navigateTo={navigateTo}
              onClose={handleCloseCaseSelector} // Pass close functionality
            />
          )} */}
           <div className="main-page-content">
      <div className="main-page">
      <NotificationCard acceptLead={acceptLead} signedInOfficer={signedInOfficer} />

      <div className= "add-case-section">
          <h2> Click here to add a new case</h2>
          {/* <div className="slidebartopcontrolMP"> */}
              <SlideBar
              onAddCase={(newCase) => addCase(newCase)}
              buttonClass="custom-add-case-btn1"
            />
            {/* </div> */}
        </div>
        <div className="stats-bar">
          {/* <span
            className={`hoverable ${activeTab === "assignedLeads" ? "active" : ""}`}
            onClick={() => setActiveTab("assignedLeads")}
          >
            Assigned Leads: {leads.assignedLeads.length}
          </span> */}
          <span
            className={`hoverable ${activeTab === "pendingLeads" ? "active" : ""}`}
            onClick={() => setActiveTab("pendingLeads")}
          >
            {/* Pending Leads: {leads.pendingLeads.length} */}
            Assigned Leads: {leads?.pendingLeads?.length || 0}
          </span>
          <span
            className={`hoverable ${activeTab === "pendingLeadReturns" ? "active" : ""}`}
            onClick={() => setActiveTab("pendingLeadReturns")}
          >
            Lead Returns for Review: {leads.pendingLeadReturns.length}
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
            <Sort columns={["Case No", "Case Name", "Lead Number", "Lead Name", "Priority", "Flag"]} onApplySort={handleCaseSort} />
          </div>
          </div>
      )}

        <table className="leads-table">
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Case No.</th>
                  <th>Case Name</th>
                  <th style={{ width: "12%" }}>Role</th>
                  <th style={{ width: "10%" }}></th>
                </tr>
              </thead>
              <tbody>
                {cases.length > 0 ? ( cases.filter((c) => {
    const { CaseNumber, CaseName, Role, Status } = appliedFilters;
    const matchesCaseNo = !CaseNumber || c.id.toString() === CaseNumber;
    const matchesCaseName = !CaseName || c.title === CaseName;
    const matchesRole = !Role || c.role === Role;
    const matchesStatus = !Status || c.status === Status; 

    return matchesCaseNo && matchesCaseName && matchesRole && matchesStatus;
  }) 

  .sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    let aField = sortField === "Case No" ? a.id.toString() : a.title?.toLowerCase();
    let bField = sortField === "Case No" ? b.id.toString() : b.title?.toLowerCase();

    if (sortField === "Role") {
      aField = a.role?.toLowerCase();
      bField = b.role?.toLowerCase();
    }

    if (!aField || !bField) return 0;

    return sortOrder === "asc"
      ? aField.localeCompare(bField)
      : bField.localeCompare(aField);
  })
                  .map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.title}</td>
                      <td>{c.role}</td>
                      <td>
                        <button
                          className="view-btn1"
                          onClick={() => handleCaseClick(c)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>
                      No Cases Available
                    </td>
                  </tr>)}
              </tbody>
            </table>
            {/* {cases.map((c) => (
              <div key={c.id} className="case-item">
                <span
                  className="case-details"
                  // onClick={() => handleCaseClick(c)} 
                >
                  <strong>Case Number:</strong> {c.id} | {c.title} | <strong>Role:</strong> {c.role}
                </span>
               
                <div className="case-actions">


                  <button
                    className="close-button"
                    // onClick={() => {
                    //   if (window.confirm(`Are you sure you want to close case ${c.id}?`)) {
                    //     closeCase(c.id);
                    //   }
                    // }}
                    onClick={() => handleCaseClick(c)}
                  >
                    View
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
            ))} */}
               <Pagination
  currentPage={currentPage}
  totalEntries={totalEntries}  // Automatically calculate total entries
  onPageChange={setCurrentPage} // Update current page state
  pageSize={pageSize}
  onPageSizeChange={setPageSize} // Update page size state
/>
          </div>
         
)}






{/* {activeTab === "assignedLeads" && (
  <div className="assigned-leads">
          <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
          <Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} />


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
)} */}




         
{activeTab === "pendingLeads" && (
  <div className="pending-leads">

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
            <Filter filtersConfig={filtersConfig} onApply={handleFilterApply} />
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
            <Sort columns={["Lead Number", "Lead Name", "Due Date", "Priority", "Flag", "Assigned Officers", "Days Left"]} onApplySort={handleSort} />
            </div>
          </div>
      )}

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
          <th style={{ width: "10%" }}>Lead No.</th>
          <th>Lead Name</th>
          <th>Assigned Officers</th>
          <th>Case Name</th>
          <th style={{ width: "10%" }}>Due Date</th>
          <th style={{ width: "10%" }}></th>
        </tr>
      </thead>
      <tbody>
        {leads.length > 0 ? (
          leads.pendingLeads
          .filter((lead) => {
            const leadNoMatch = !appliedFilters.leadNumber || lead.id.toString() === appliedFilters.leadNumber;
            const leadNameMatch = !appliedFilters.leadName || lead.description === appliedFilters.leadName;
            const dueDateMatch = !appliedFilters.dueDate || lead.dueDate === appliedFilters.dueDate;
            const officerMatch = !appliedFilters.assignedOfficers || lead.assignedOfficers.includes(appliedFilters.assignedOfficers);
            const caseMatch = !appliedFilters.CaseName || lead.caseName === appliedFilters.CaseName;
        
            return (
              leadNoMatch &&
              leadNameMatch &&
              dueDateMatch &&
              officerMatch &&
              caseMatch
            );
          })
        
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
              {/* <td>{lead.assignedOfficers.join(", ")}</td> */}
              <td style={{ width: "14%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
                {/* {lead.assignedOfficers.join(", ")} */}
                {lead.assignedOfficers.map((officer, index) => (
                  <span key={index} style={{ display: "block", marginBottom: "4px", padding: "8px 0px 0px 8px" }}>{officer}</span>
                ))}
                </td>
              <td>{lead.caseName }</td>
              <td>{lead.dueDate}</td>
              <td>
                <button
                  className="view-btn1"
                >
                  View
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center' }}>
              No Pending Leads Available
            </td>
          </tr>
        )}
      </tbody>
    </table>

    <Pagination
  currentPage={currentPage}
  totalEntries={totalEntries}  // Automatically calculate total entries
  onPageChange={setCurrentPage} // Update current page state
  pageSize={pageSize}
  onPageSizeChange={setPageSize} // Update page size state
/>
  </div>
)}

{activeTab === "pendingLeadReturns" && (
  <div className="pending-lead-returns">

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
            <Filter filtersConfig={filtersConfigPLR} onApply={handleFilterApply} />
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
            <Sort columns={["Lead Number", "Lead Name","Priority", "Flag"]} onApplySort={handleSort} />
            </div>
          </div>
      )}



    <table className="leads-table">
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Lead No.</th>
                  <th>Lead Name</th>
                  <th style={{ width: "20%" }}>Case Name</th>
                  <th style={{ width: "10%" }}></th>
                </tr>
              </thead>
              <tbody>
                {leads.pendingLeadReturns.length > 0 ? (
                leads.pendingLeadReturns.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.id}</td>
                      <td>{lead.description}</td>
                      <td>{lead.caseName}</td>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>
                      No Pending Lead Returns Available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
  currentPage={currentPage}
  totalEntries={totalEntries}  // Automatically calculate total entries
  onPageChange={setCurrentPage} // Update current page state
  pageSize={pageSize}
  onPageSizeChange={setPageSize} // Update page size state
/>
  </div>
)}  


        </div>
      </div>
    </div>
   </div>
  );
};

