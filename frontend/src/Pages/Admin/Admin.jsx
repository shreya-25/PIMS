import React, { useState } from "react";
import "./Admin.css";
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useNavigate } from "react-router-dom";

// export const Admin = () => {
//   const [activeTab, setActiveTab] = useState("cases"); // Default tab
//   const [sortField, setSortField] = useState(""); // Sorting field
//   const [filterText, setFilterText] = useState(""); // Filter text
//   const [filterPopupVisible, setFilterPopupVisible] = useState(false);
//   const [filterSortPopupVisible, setFilterSortPopupVisible] = useState(false); // State for popup visibility
//   const [selectedPriority, setSelectedPriority] = useState(""); // State for priority filter
//   const [sortOrder, setSortOrder] = useState(""); // State for sort order
//   const [remainingDaysFilter, setRemainingDaysFilter] = useState("");
// const [flagsFilter, setFlagsFilter] = useState("");
// const [assignedOfficersFilter, setAssignedOfficersFilter] = useState("");
// const [newInvestigator, setNewInvestigator] = useState("");

// const [showCaseSelector, setShowCaseSelector] = useState(false);
//   const [navigateTo, setNavigateTo] = useState(""); // Target page

//   const handleShowCaseSelector = (targetPage) => {
//     setNavigateTo(targetPage);
//     setShowCaseSelector(true);
//   };

//   // Function to close CaseSelector
//   const handleCloseCaseSelector = () => {
//     setShowCaseSelector(false);
//     setNavigateTo(""); // Reset navigation target
//   };

//   const [officers, setOfficers] = useState([
//     { id: 1, name: "Officer 1", casesAssigned: "2H 3M 4L" },
//     { id: 2, name: "Officer 1", casesAssigned: "2H 3M 4L" },
//     { id: 3, name: "Officer 1", casesAssigned: "2H 3M 4L" },
//   ]);

//   // Filter and sort functionality for officers
//   const [officerFilterText, setOfficerFilterText] = useState("");
//   const [officerSortOrder, setOfficerSortOrder] = useState("ascending");

//   const filteredOfficers = officers.filter((officer) =>
//     officer.name.toLowerCase().includes(officerFilterText.toLowerCase())
//   );

//   const sortedOfficers = [...filteredOfficers].sort((a, b) => {
//     if (officerSortOrder === "ascending") {
//       return a.casesAssigned - b.casesAssigned;
//     } else {
//       return b.casesAssigned - a.casesAssigned;
//     }
//   });

//   const handleOfficerSortToggle = () => {
//     setOfficerSortOrder((prevOrder) => (prevOrder === "ascending" ? "descending" : "ascending"));
//   };


//   const handleAssignRole = (caseId) => {
//     const role = prompt("Assign role (Investigator/Case Manager):");
//     if (role) {
//       setCases((prevCases) =>
//         prevCases.map((c) =>
//           c.id === caseId ? { ...c, role: role } : c
//         )
//       );
//     }
//   };



//   const [cases, setCases] = useState([
//     { id: 12345, title: "Main Street Murder", status: "ongoing", role: "Investigator" },
//     { id: 45637, title: "Cook Street School Threat", status: "ongoing", role: "Case Manager" },
//     { id: 23789, title: "216 Endicott Suicide", status: "ongoing", role: "Investigator" },
//     { id: 65734, title: "Murray Street Stolen Gold", status: "ongoing", role: "Investigator" },
//   ]);
//   // Handler to view the assigned lead details (can be updated to show a modal or navigate)
// const handleViewAssignedLead = (lead) => {
// };
// const handleCaseClick = (caseDetails) => {
//   navigate("/CasePageManager");
// };

// const handleAssignInvestigator = (caseId) => {
//   const investigator = prompt("Enter investigator name:");
//   if (investigator) {
//     setCases((prevCases) =>
//       prevCases.map((c) =>
//         c.id === caseId ? { ...c, assignedInvestigator: investigator } : c
//       )
//     );
//   }
// };

//   const navigate = useNavigate();

//   // Adding a case to the list
//  // Adding a case to the list
// const addCase = (newCase) => {
//   if (!newCase.id || !newCase.title || !newCase.status) {
//     alert("Case must have an ID, title, and status.");
//     return;
//   }
  
//   if (window.confirm(`Are you sure you want to add the case "${newCase.title}" with ID ${newCase.id}?`)) {
//     setCases((prevCases) => [...prevCases, newCase]);
//     alert(`Case "${newCase.title}" added successfully!`);
//   }
// };


//   // Close an ongoing case
//   const closeCase = (caseId) => {
//     if (window.confirm("Are you sure you want to close this case?")) {
//       setCases((prevCases) =>
//         prevCases.filter((c) => c.id !== caseId)
//       );
//     }
//   };

//   // Delete an ongoing case
//   const deleteCase = (caseId) => {
//     if (window.confirm("Are you sure you want to delete this case?")) {
//       setCases((prevCases) =>
//         prevCases.filter((c) => c.id !== caseId)
//       );
//     }
//   };

//   return (
//     <div>
//     <Navbar />
//     <div className="main-container">
//         {/* Pass down props for leads, cases, and modal visibility */}
//         {/* <SideBar
//           leads={leads} // Pass leads if needed
//           cases={cases}
//           setActiveTab={setActiveTab}
//           onShowCaseSelector={handleShowCaseSelector} // Pass handler
//         /> */}
//         <div className="logo-sec">
//           <img
//             src="/Materials/newpolicelogo.png" // Replace with the actual path to your logo
//             alt="Police Department Logo"
//             className="police-logo-main-page"
//           />
//           <h1 className="main-page-heading"> PIMS</h1>
//         </div>
//         <div className="content-container">
//           {showCaseSelector && (
//             <CaseSelector
//               cases={cases}
//               navigateTo={navigateTo}
//               onClose={handleCloseCaseSelector} // Pass close functionality
//             />
//           )}
//       <div className="main-page-admin">
//         <div className="above-sec">
//           <div className="top-controls">
//             <Searchbar
//               placeholder="Search Cases"
//               onSearch={(query) => console.log("Search query:", query)}
//             />
//             <SlideBar
//   onAddCase={(newCase) => addCase(newCase)} // Pass addCase function with confirmation
// />
//           </div>
//         </div>
//         <div classname = "admin-main-section">
//         <div classname = "left-column">
//         <div className="left-stats-bar">
//           <span
//             className={`hoverable ${activeTab === "cases" ? "active" : ""}`}
//             onClick={() => setActiveTab("cases")}
//           >
//             All Officers: {officers.length}
//           </span>
//           <span
//             className={`hoverable ${activeTab === "cases" ? "active" : ""}`}
//             onClick={() => setActiveTab("cases")}
//           >
//             Assigned Cases: {officers.length}
//           </span>
//         </div>

//         <div className="left-content-section">
//         {activeTab === "cases" && (
//             <div className="case-list">
//             {cases.map((c) => (
//               <div key={c.id} className="case-item">
//                 <span
//                   className="case-details"
//                   onClick={() => handleCaseClick(c)} // Handle case click
//                 >
//                   <strong>Officer:</strong> {c.id} | {c.title}
//                 </span>
               
//                 <div className="case-actions">

//                   <button
//                     className="close-button"
//                     onClick={() => {
//                       if (window.confirm(`Are you sure you want to close case ${c.id}?`)) {
//                         closeCase(c.id);
//                       }
//                     }}
//                   >
//                     Close
//                   </button>
//                   <button
//                     className="delete-btn"
//                     onClick={() => {
//                       if (window.confirm(`Are you sure you want to delete case ${c.id}?`)) {
//                         deleteCase(c.id);
//                       }
//                     }}
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
          
// )}

//         </div>
//         </div>
//         <div classname = "right-column">
//         <div className="right-stats-bar">
//           <span
//             className={`hoverable ${activeTab === "cases" ? "active" : ""}`}
//             onClick={() => setActiveTab("cases")}
//           >
//             My Ongoing Cases: {cases.length}
//           </span>
//         </div>

//         <div className="right-content-section">
//         {activeTab === "cases" && (
//             <div className="case-list">
//             {cases.map((c) => (
//               <div key={c.id} className="case-item">
//                 <span
//                   className="case-details"
//                   onClick={() => handleCaseClick(c)} // Handle case click
//                 >
//                   <strong>Case Number:</strong> {c.id} | {c.title} | <strong>Role:</strong> {c.role}
//                 </span>
               
//                 <div className="case-actions">

//                   <button
//                     className="close-button"
//                     onClick={() => {
//                       if (window.confirm(`Are you sure you want to close case ${c.id}?`)) {
//                         closeCase(c.id);
//                       }
//                     }}
//                   >
//                     Close
//                   </button>
//                   <button
//                     className="delete-btn"
//                     onClick={() => {
//                       if (window.confirm(`Are you sure you want to delete case ${c.id}?`)) {
//                         deleteCase(c.id);
//                       }
//                     }}
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
          
// )}

//         </div>
//         </div>
//         </div>
//       </div>
//     </div>
//     </div>
//     </div>
//   );
// };

export const Admin = () => {
  const [cases, setCases] = useState([
    { id: 12345, name: "Main Street Murder", role: "Investigator" },
    { id: 45607, name: "Cook Street Stolen Truck", role: "Case Manager" },
    { id: 23789, name: "216 Endicott Burglary", role: "Investigator" },
    { id: 65741, name: "Murray Street Stolen Gold", role: "Investigator" },
  ]);

    const navigate = useNavigate();
      const [activeTab, setActiveTab] = useState("cases"); // Default tab

  const officers = [
    { name: "Officer 1", casesAssigned: "2" },
    { name: "Officer 2", casesAssigned: "1" },
    { name: "Officer 3", casesAssigned: "3" },
  ];

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

  return (
    <div className="admin-container">
      <Navbar />
      <div className="logo-sec">
        <img
          src="/Materials/newpolicelogo.png" // Replace with the actual path to your logo
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
          <SlideBar
                onAddCase={(newCase) => addCase(newCase)} // Pass addCase function with confirmation
            />
          <div className="officer-section">
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
          </div>
          <div className="stats-bar">
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
            {cases.map((c) => (
              <div key={c.id} className="case-item">
                <span
                  className="case-details"
                  onClick={() => handleCaseClick(c)} // Handle case click
                >
                  <strong>Case Number:</strong> {c.id} | {c.name} | <strong>Role:</strong> {c.role}
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
          <button className="view-all-cases-btn-admin">View All Cases</button>
        </div>
      </div>
    </div>
    </div>
  );
};
