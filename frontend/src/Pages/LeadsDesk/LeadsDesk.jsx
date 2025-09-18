// import React, { useContext, useState, useEffect, useRef } from "react";
// import Navbar from "../../components/Navbar/Navbar";
// import FootBar from "../../components/FootBar/FootBar";
// import { useDataContext } from "../Context/DataContext"; // Import Context
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { CaseContext } from "../CaseContext";
// import PersonModal from "../../components/PersonModal/PersonModel";
// import VehicleModal from "../../components/VehicleModal/VehicleModel";
// import Pagination from "../../components/Pagination/Pagination";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

// import "./LeadsDesk.css";

// // ---------- Helper to format dates as MM/DD/YY ----------
// const formatDate = (dateString) => {
//   if (!dateString) return "";
//   const date = new Date(dateString);
//   if (isNaN(date)) return "";
//   const month = (date.getMonth() + 1).toString().padStart(2, "0");
//   const day = date.getDate().toString().padStart(2, "0");
//   const year = date.getFullYear().toString().slice(-2);
//   return `${month}/${day}/${year}`;
// };

// // ---------- Fetch one lead (with returns, persons, vehicles) ----------
// const fetchSingleLeadFullDetails = async (leadNo, caseNo, caseName, token) => {
//   try {
//     // 1) Fetch the lead itself
//     const { data: leadData } = await axios.get(
//       `http://localhost:5000/api/lead/lead/${leadNo}/${caseNo}/${encodeURIComponent(caseName)}`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     if (!leadData || leadData.length === 0) {
//       console.warn(`No lead found for leadNo: ${leadNo}`);
//       return null;
//     }
//     const lead = leadData[0];

//     // 2) Fetch lead returns
//     const { data: returnsData } = await axios.get(
//       `http://localhost:5000/api/leadReturnResult/${lead.leadNo}/${encodeURIComponent(lead.description)}/${caseNo}/${encodeURIComponent(caseName)}`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     // 3) For each lead return, fetch persons & vehicles
//     const leadReturns = await Promise.all(
//       returnsData.map(async (lr) => {
//         let persons = [];
//         let vehicles = [];
//         try {
//           const { data: personsData } = await axios.get(
//             `http://localhost:5000/api/lrperson/lrperson/${lead.leadNo}/${encodeURIComponent(lead.description)}/${caseNo}/${encodeURIComponent(caseName)}/${lr.leadReturnId}`,
//             { headers: { Authorization: `Bearer ${token}` } }
//           );
//           persons = personsData;
//         } catch (err) {
//           console.error(`Error fetching persons for leadReturn ${lr.leadReturnId}`, err);
//         }
//         try {
//           const { data: vehiclesData } = await axios.get(
//             `http://localhost:5000/api/lrvehicle/lrvehicle/${lead.leadNo}/${encodeURIComponent(lead.description)}/${caseNo}/${encodeURIComponent(caseName)}/${lr.leadReturnId}`,
//             { headers: { Authorization: `Bearer ${token}` } }
//           );
//           vehicles = vehiclesData;
//         } catch (err) {
//           console.error(`Error fetching vehicles for leadReturn ${lr.leadReturnId}`, err);
//         }
//         return {
//           ...lr,
//           persons,
//           vehicles,
//         };
//       })
//     );

//     return {
//       ...lead,
//       leadReturns,
//     };
//   } catch (error) {
//     console.error(`Error fetching details for leadNo: ${leadNo}`, error);
//     return null;
//   }
// };

// // ---------- Recursively fetch entire chain of leads (child -> parents) ----------
// const fetchLeadHierarchyFullDetails = async (leadNo, caseNo, caseName, token, chain = []) => {
//   const currentLead = await fetchSingleLeadFullDetails(leadNo, caseNo, caseName, token);
//   if (!currentLead) {
//     return [chain];
//   }
//   const updatedChain = [...chain, currentLead];

//   // If no parent leads, we have a complete chain
//   if (!currentLead.parentLeadNo || currentLead.parentLeadNo.length === 0) {
//     return [updatedChain];
//   }

//   // If there are multiple parents, we get multiple chains
//   let allChains = [];
//   for (const parentNo of currentLead.parentLeadNo) {
//     const subChains = await fetchLeadHierarchyFullDetails(
//       parentNo,
//       caseNo,
//       caseName,
//       token,
//       updatedChain
//     );
//     allChains.push(...subChains);
//   }
//   return allChains;
// };

// export const LeadsDesk = () => {
//   useEffect(() => {
//     // Apply style when component mounts
//     document.body.style.overflow = "hidden";

//     return () => {
//       // Reset to default when component unmounts
//       document.body.style.overflow = "auto";
//     };
//   }, []);
//   const navigate = useNavigate();
//   const pdfRef = useRef();
//   const { selectedCase } = useContext(CaseContext);
//   const { persons } = useDataContext();

//   // ------------------ State ------------------
//   // All leads for the case
//   const [leadsData, setLeadsData] = useState([]);

//   // Hierarchy leads data (once user clicks “Show Hierarchy”)
//   const [hierarchyLeadsData, setHierarchyLeadsData] = useState([]);
//   // We'll also store the raw chain arrays to display short strings like "10,1" or "10,2,6"
//   const [hierarchyChains, setHierarchyChains] = useState([]);

//   // For modals
//   const [showPersonModal, setShowPersonModal] = useState(false);
//   const [personModalData, setPersonModalData] = useState({
//     leadNo: "",
//     description: "",
//     caseNo: "",
//     caseName: "",
//     leadReturnId: "",
//   });

//   const [showVehicleModal, setShowVehicleModal] = useState(false);
//   const [vehicleModalData, setVehicleModalData] = useState({
//     leadNo: "",
//     description: "",
//     caseNo: "",
//     caseName: "",
//     leadReturnId: "",
//     leadsDeskCode: "",
//   });

//   const [showMediaModal, setShowMediaModal] = useState(false);
//   const [selectedMedia, setSelectedMedia] = useState(null);

//   // For hierarchy search
//   const [hierarchyLeadInput, setHierarchyLeadInput] = useState("");

//   // Pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(50);
//   const totalEntries = 100; // or dynamically from leads?

//   // Case summary
//   const defaultCaseSummary =
//     "Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.";
//   const [caseSummary, setCaseSummary] = useState(defaultCaseSummary);
//   const [isEditing, setIsEditing] = useState(false); // For editing summary

//   // ------------------ Modal Handlers ------------------
//   const openPersonModal = (leadNo, description, caseNo, caseName, leadReturnId) => {
//     setPersonModalData({ leadNo, description, caseNo, caseName, leadReturnId });
//     setShowPersonModal(true);
//   };
//   const closePersonModal = () => setShowPersonModal(false);

//   const openVehicleModal = (leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode) => {
//     setVehicleModalData({ leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode });
//     setShowVehicleModal(true);
//   };
//   const closeVehicleModal = () => setShowVehicleModal(false);

//   const openMediaModal = (media) => {
//     setSelectedMedia(media);
//     setShowMediaModal(true);
//   };
//   const closeMediaModal = () => setShowMediaModal(false);

//   // ------------------ Show Hierarchy / Show All Leads ------------------
//   const handleShowHierarchy = async () => {
//     if (!hierarchyLeadInput) return;
//     const token = localStorage.getItem("token");
//     try {
//       // 1) Fetch all chains from the searched lead up to top parents
//       const chainResults = await fetchLeadHierarchyFullDetails(
//         hierarchyLeadInput,
//         selectedCase.caseNo,
//         selectedCase.caseName,
//         token,
//         []
//       );
//       // Store the chain arrays so we can display short strings (e.g., "10,1" or "10,2,6")
//       setHierarchyChains(chainResults);

//       // 2) Flatten them into a single list of leads
//       const flattened = chainResults.flat();

//       // 3) Remove duplicates (if a lead appears in multiple parent chains)
//       const uniqueLeads = [];
//       const seen = new Set();
//       for (const leadObj of flattened) {
//         if (!seen.has(leadObj.leadNo)) {
//           uniqueLeads.push(leadObj);
//           seen.add(leadObj.leadNo);
//         }
//       }

//       // 4) We'll display ONLY these leads in the table
//       setHierarchyLeadsData(uniqueLeads);
//     } catch (err) {
//       console.error("Error fetching hierarchy:", err);
//       setHierarchyChains([]);
//       setHierarchyLeadsData([]);
//     }
//   };

//   // Resets back to showing all leads
//   const handleShowAllLeads = () => {
//     setHierarchyLeadInput("");
//     setHierarchyChains([]);
//     setHierarchyLeadsData([]);
//   };

//   // ------------------ Fetch All Leads on Load ------------------
//   useEffect(() => {
//     const fetchLeadsReturnsAndPersons = async () => {
//       if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
//       const token = localStorage.getItem("token");
//       try {
//         // 1) Fetch all leads for the selected case
//         const { data: leads } = await axios.get(
//           `http://localhost:5000/api/lead/case/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

//         // 2) For each lead, fetch returns, persons, vehicles
//         const leadsWithDetails = await Promise.all(
//           leads.map(async (lead) => {
//             let leadReturns = [];
//             try {
//               // lead returns
//               const { data: returnsData } = await axios.get(
//                 `http://localhost:5000/api/leadReturnResult/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
//                 { headers: { Authorization: `Bearer ${token}` } }
//               );

//               // persons & vehicles for each return
//               leadReturns = await Promise.all(
//                 returnsData.map(async (leadReturn) => {
//                   let persons = [];
//                   let vehicles = [];
//                   try {
//                     const { data: personsData } = await axios.get(
//                       `http://localhost:5000/api/lrperson/lrperson/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/${leadReturn.leadReturnId}`,
//                       { headers: { Authorization: `Bearer ${token}` } }
//                     );
//                     persons = personsData;
//                   } catch (err) {
//                     console.error(`Error fetching persons for LeadReturn ${leadReturn.leadReturnId}`, err);
//                   }
//                   try {
//                     const { data: vehiclesData } = await axios.get(
//                       `http://localhost:5000/api/lrvehicle/lrvehicle/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/${leadReturn.leadReturnId}`,
//                       { headers: { Authorization: `Bearer ${token}` } }
//                     );
//                     vehicles = vehiclesData;
//                   } catch (err) {
//                     console.error(`Error fetching vehicles for LeadReturn ${leadReturn.leadReturnId}`, err);
//                   }
//                   return { ...leadReturn, persons, vehicles };
//                 })
//               );
//             } catch (err) {
//               console.error(`Error fetching returns for Lead ${lead.leadNo}`, err);
//             }

//             return {
//               ...lead,
//               leadReturns,
//             };
//           })
//         );

//         setLeadsData(leadsWithDetails);
//         // Clear hierarchy if user switches to a new case
//         setHierarchyChains([]);
//         setHierarchyLeadsData([]);
//       } catch (err) {
//         console.error("Error fetching leads:", err);
//       }
//     };

//     fetchLeadsReturnsAndPersons();
//   }, [selectedCase]);

//   // ------------------ Fetch Case Summary (Optional) ------------------
//   useEffect(() => {
//     const fetchCaseSummary = async () => {
//       try {
//         if (selectedCase && selectedCase.caseNo) {
//           const token = localStorage.getItem("token");
//           const response = await axios.get(
//             `http://localhost:5000/api/cases/summary/${selectedCase.caseNo}`,
//             { headers: { Authorization: `Bearer ${token}` } }
//           );
//           if (response.data) {
//             setCaseSummary(response.data.summary);
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching case summary:", error);
//       }
//     };
//     fetchCaseSummary();
//   }, [selectedCase]);

//   // ------------------ Case Summary Editing ------------------
//   const handleCaseSummaryChange = (e) => setCaseSummary(e.target.value);
//   const handleEditClick = () => setIsEditing(true);
//   const handleSaveClick = () => {
//     setIsEditing(false);
//     alert("Report Saved!");
//     // Optionally update backend
//   };

//   // ------------------ PDF / Print Logic ------------------
//   const generatePDF = () => {
//     const input = pdfRef.current;
//     html2canvas(input, { scale: 2 }).then((canvas) => {
//       const imgData = canvas.toDataURL("image/png");
//       const pdf = new jsPDF("p", "mm", "a4");
//       const imgWidth = 210; // A4 width
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
//       pdf.save("leads_desk.pdf");
//     });
//   };

//   const runReport = () => {
//     const content = document.getElementById("main-content").innerHTML;
//     const printContents = `
//       <html>
//         <head>
//           <title>Lead Return Report – ${selectedCase?.caseNo} – ${selectedCase?.caseName}</title>
//           <style>
//             @media print {
//               body {
//                 font-family: Arial, sans-serif;
//                 margin: 10px;
//                 color: #000;
//                 -webkit-print-color-adjust: exact;
//                 print-color-adjust: exact;
//               }
//               h1, h2 {
//                 text-align: center;
//                 margin-bottom: 15px;
//               }
//               table {
//                 width: 100% !important;
//                 border-collapse: collapse;
//                 table-layout: auto !important;
//                 word-wrap: break-word !important;
//                 font-size: 11px;
//                 overflow: visible !important;
//               }
//               th, td {
//                 border: 1px solid #000;
//                 padding: 5px;
//                 text-align: left;
//                 vertical-align: top;
//                 white-space: normal !important;
//                 word-break: break-word !important;
//                 overflow: visible !important;
//               }
//               div, span, p {
//                 overflow: visible !important;
//                 white-space: normal !important;
//                 word-break: break-word !important;
//               }
//               .case-summary, .lead-return-id, .lead-instruction {
//                 height: auto !important;
//                 max-height: none !important;
//                 overflow: visible !important;
//               }
//               .container, .row, .col, .content, .main-content {
//                 display: block !important;
//                 overflow: visible !important;
//                 width: 100% !important;
//                 height: auto !important;
//                 max-height: none !important;
//                 flex: none !important;
//                 grid: none !important;
//               }
//               input, textarea {
//                 border: none !important;
//                 width: 100% !important;
//                 height: auto !important;
//                 box-sizing: border-box !important;
//                 resize: none !important;
//                 overflow: visible !important;
//                 white-space: normal !important;
//                 word-break: break-word !important;
//               }
//               .single-line-header {
//                 white-space: nowrap !important;
//                 font-weight: bold !important;
//                 vertical-align: top !important;
//               }
//             }
//           </style>
//         </head>
//         <body>
//           ${content}
//         </body>
//       </html>
//     `;
//     const printWindow = window.open("", "_blank", "width=800,height=600");
//     printWindow.document.open();
//     printWindow.document.write(printContents);
//     printWindow.document.close();
//     printWindow.focus();
//     setTimeout(() => {
//       printWindow.print();
//       printWindow.close();
//     }, 500);
//   };

//   // ------------------ Dummy Uploaded Files for demonstration ------------------
//   const [uploadedFiles, setUploadedFiles] = useState([
//     {
//       id: 1,
//       name: "Suspect Description.docx",
//       type: "DOCX",
//       sharing: "Only Manager",
//       modified: "Just now",
//       size: "3 KB",
//       url: "https://example.com/sample.docx",
//     },
//     {
//       id: 2,
//       name: "Field Case Report.pdf",
//       type: "PDF",
//       sharing: "Shared",
//       modified: "Sep 23, 2023",
//       size: "341 KB",
//       url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
//     },
//     {
//       id: 4,
//       name: "Crime Scene Picture.jpg",
//       type: "JPG",
//       sharing: "Shared",
//       modified: "Today",
//       size: "150 KB",
//       url: "/Materials/forensic.jpg",
//     },
//     {
//       id: 5,
//       name: "Crime Scene Video.mp4",
//       type: "MP4",
//       sharing: "Shared",
//       modified: "Today",
//       size: "1.5 MB",
//       url: "/Materials/video1.mp4",
//     },
//     {
//       id: 6,
//       name: "Crime Scene Audio.mp3",
//       type: "MP3",
//       sharing: "Shared",
//       modified: "Today",
//       size: "2 MB",
//       url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
//     },
//     {
//       id: 7,
//       name: "Suspects Phone Logs.pdf",
//       type: "PDF",
//       sharing: "Shared",
//       modified: "Today",
//       size: "500 KB",
//       url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
//     },
//   ]);

//   // Optional: handle file upload
//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;
//     const extension = file.name.split(".").pop().toLowerCase();
//     const fileUrl = URL.createObjectURL(file);
//     const newFile = {
//       id: Date.now(),
//       name: file.name,
//       type: extension.toUpperCase(),
//       sharing: "Only you",
//       modified: new Date().toLocaleDateString(),
//       size: `${Math.round(file.size / 1024)} KB`,
//       url: fileUrl,
//     };
//     setUploadedFiles((prev) => [...prev, newFile]);
//   };

//   // ------------------ Sidebar toggles ------------------
//   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
//   const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

//   // ------------------ Render Leads Table ------------------
//   const renderLeads = (leadsArray) => {
//     return leadsArray.map((lead, leadIndex) => (
//       <div key={leadIndex} className="lead-section">
//         <div className="leads-container">
//           {/* <table className="table-heading">
//             <tbody>
//               <tr>
//                 <td className="table-label">Lead Number:</td>
//                 <td className="table-input1">
//                   <input type="text" value={lead.leadNo} className="input-field" readOnly />
//                 </td>
//                 <td className="table-label">Lead Origin:</td>
//                 <td className="table-input1">
//                   <input
//                     type="text"
//                     value={lead.parentLeadNo ? lead.parentLeadNo.join(", ") : ""}
//                     className="input-field"
//                     readOnly
//                   />
//                 </td>
//                 <td className="table-label">Assigned Date:</td>
//                 <td className="table-input">
//                   <input
//                     type="text"
//                     value={formatDate(lead.assignedDate)}
//                     className="input-field"
//                     readOnly
//                   />
//                 </td>
//               </tr>
//               <tr>
//                 <td className="table-label">Assigned Officers:</td>
//                 <td className="table-input" colSpan={5}>
//                   <input type="text" value={lead.assignedTo || ""} className="input-field" readOnly />
//                 </td>
//               </tr>
//               <tr>
//                 <td className="table-label">Lead Hierarchy:</td>
//                 <td className="table-input" colSpan={5}>
//                   <input
//                     type="text"
//                     value={
//                       lead.parentLeadNo && lead.parentLeadNo.length > 0
//                         ? lead.parentLeadNo.join(", ")
//                         : "No Hierarchy Available"
//                     }
//                     className="input-field"
//                     readOnly
//                   />
//                 </td>
//               </tr>
//             </tbody>
//           </table> */}

// <table className="lead-details-table">
//   <colgroup>
//     {/* Adjust widths as needed; total ~100% */}
//     <col style={{ width: "15%" }} />
//     <col style={{ width: "7%" }} />
//     <col style={{ width: "10%" }} />
//     <col style={{ width: "13%" }} />
//     <col style={{ width: "12%" }} />
//     <col style={{ width: "10%" }} />
//     <col style={{ width: "14%" }} />
//     <col style={{ width: "10%" }} />
//   </colgroup>
//   <tbody>
//     <tr>
//       <td className="label-cell">Lead Number:</td>
//       <td className="input-cell">
//         <input type="text" value={lead.leadNo} readOnly />
//       </td>

//       <td className="label-cell">Lead Origin:</td>
//       <td className="input-cell">
//         <input
//           type="text"
//           value={lead.parentLeadNo ? lead.parentLeadNo.join(", ") : ""}
//           readOnly
//         />
//       </td>

//       <td className="label-cell">Assigned Date:</td>
//       <td className="input-cell">
//         <input type="text" value={formatDate(lead.assignedDate)} readOnly />
//       </td>

//       <td className="label-cell">Completed Date:</td>
//       <td className="input-cell">
//         <input type="text" value={formatDate(lead.completedDate)} readOnly />
//       </td>
//     </tr>

//     <tr>
//       <td className="label-cell">Assigned Officers:</td>
//       {/* colSpan=7 so it spans the remaining columns */}
//       <td className="input-cell" colSpan={7}>
//         <input type="text" value={lead.assignedTo || ""} readOnly />
//       </td>
//     </tr>
//   </tbody>
// </table>



//           <table className="leads-table">
//             <tbody>
//               <tr className="table-first-row">
//                 <td>Lead Instruction</td>
//                 <td>
//                   <input
//                     type="text"
//                     value={lead.description || ""}
//                     className="instruction-input"
//                     readOnly
//                   />
//                 </td>
//               </tr>

//               {lead.leadReturns && lead.leadReturns.length > 0 ? (
//                 lead.leadReturns.map((returnItem) => (
//                   <React.Fragment key={returnItem._id || returnItem.leadReturnId}>
//                     <tr>
//                       <td>{`Lead Return ID: ${returnItem.leadReturnId}`}</td>
//                       <td>
//                         <textarea
//                           className="lead-return-input"
//                           value={returnItem.leadReturnResult || ""}
//                           readOnly
//                           style={{
//                             fontSize: "20px",
//                             padding: "10px",
//                             borderRadius: "6px",
//                             width: "100%",
//                             resize: "none",
//                             // overflow: "hidden",
//                             height: "auto",
//                             fontFamily: "Arial",
//                             whiteSpace: "pre-wrap",
//                             wordWrap: "break-word",
//                           }}
//                           rows={Math.max((returnItem.leadReturnResult || "").length / 50, 2)}
//                         />
//                       </td>
//                     </tr>
//                     {/* Persons */}
//                     <tr>
//                       <td colSpan={2}>
//                         {returnItem.persons && returnItem.persons.length > 0 && (
//                           <div className="person-section">
//                             <h3 className="title-ld">Person Details</h3>
//                             <table
//                               className="lead-table2"
//                               style={{ width: "100%", tableLayout: "fixed" }}
//                             >
//                               <thead>
//                                 <tr>
//                                   <th>Date Entered</th>
//                                   <th>Name</th>
//                                   <th>Phone No</th>
//                                   <th>Address</th>
//                                   <th>Additional Details</th>
//                                 </tr>
//                               </thead>
//                               <tbody>
//                                 {returnItem.persons.map((person, index) => (
//                                   <tr key={person._id || index}>
//                                     <td>{formatDate(person.enteredDate)}</td>

//                                     <td>
//                                       {person.firstName
//                                         ? `${person.firstName}, ${person.lastName}`
//                                         : "N/A"}
//                                     </td>
//                                     <td>{person.cellNumber}</td>
//                                     <td style = {{whiteSpace: "normal", wordWrap: "break-word"}}>
//                                       {person.address
//                                         ? `${person.address.street1 || ""}, ${person.address.city || ""}, ${person.address.state || ""}, ${person.address.zipCode || ""}`
//                                         : "N/A"}
//                                     </td>
//                                     <td>
//                                       <button
//                                         className="download-btn"
//                                         onClick={() =>
//                                           openPersonModal(
//                                             lead.leadNo,
//                                             lead.description,
//                                             selectedCase.caseNo,
//                                             selectedCase.caseName,
//                                             returnItem.leadReturnId
//                                           )
//                                         }
//                                       >
//                                         View
//                                       </button>
//                                     </td>
//                                   </tr>
//                                 ))}
//                               </tbody>
//                             </table>
//                           </div>
//                         )}
//                       </td>
//                       <PersonModal
//                         isOpen={showPersonModal}
//                         onClose={closePersonModal}
//                         leadNo={personModalData.leadNo}
//                         description={personModalData.description}
//                         caseNo={personModalData.caseNo}
//                         caseName={personModalData.caseName}
//                         leadReturnId={personModalData.leadReturnId}
//                       />
//                     </tr>
//                     {/* Vehicles */}
//                     <tr>
//                       <td colSpan={2}>
//                         {returnItem.vehicles && returnItem.vehicles.length > 0 && (
//                           <div className="person-section">
//                             <h3 className="title-ld">Vehicles Details</h3>
//                             <table
//                               className="lead-table2"
//                               style={{ width: "100%", tableLayout: "fixed" }}
//                             >
//                               <thead>
//                                 <tr>
//                                   <th>Date Entered</th>
//                                   <th>Make</th>
//                                   <th>Model</th>
//                                   <th>Color</th>
//                                   <th>Plate</th>
//                                   <th>State</th>
//                                   <th>Additional Details</th>
//                                 </tr>
//                               </thead>
//                               <tbody>
//                                 {returnItem.vehicles.map((vehicle, index) => (
//                                   <tr key={vehicle._id || index}>
//                                     <td>{formatDate(vehicle.enteredDate)}</td>
//                                     <td>{vehicle.make}</td>
//                                     <td>{vehicle.model}</td>
//                                     <td>
//                                       <div style={{ display: "flex", alignItems: "center" }}>
//                                         <span style={{ width: "60px", display: "inline-block" }}>
//                                           {vehicle.primaryColor}
//                                         </span>
//                                         <div
//                                           style={{
//                                             width: "18px",
//                                             height: "18px",
//                                             backgroundColor: vehicle.primaryColor,
//                                             marginLeft: "15px",
//                                             border: "1px solid #000",
//                                           }}
//                                         ></div>
//                                       </div>
//                                     </td>
//                                     <td>{vehicle.plate}</td>
//                                     <td>{vehicle.state}</td>
//                                     <td>
//                                       <button
//                                         className="download-btn"
//                                         onClick={() =>
//                                           openVehicleModal(
//                                             lead.leadNo,
//                                             lead.description,
//                                             selectedCase.caseNo,
//                                             selectedCase.caseName,
//                                             returnItem.leadReturnId,
//                                             returnItem.leadsDeskCode
//                                           )
//                                         }
//                                       >
//                                         View
//                                       </button>
//                                     </td>
//                                   </tr>
//                                 ))}
//                               </tbody>
//                             </table>
//                           </div>
//                         )}
//                       </td>
//                       <VehicleModal
//                         isOpen={showVehicleModal}
//                         onClose={closeVehicleModal}
//                         leadNo={vehicleModalData.leadNo}
//                         description={vehicleModalData.description}
//                         caseNo={vehicleModalData.caseNo}
//                         caseName={vehicleModalData.caseName}
//                         leadReturnId={vehicleModalData.leadReturnId}
//                         leadsDeskCode={vehicleModalData.leadsDeskCode}
//                       />
//                     </tr>
//                     {/* Example: Uploaded Files */}
//                     <tr>
//                       <td colSpan={2}>
//                         <div className="person-section">
//                           <h3 className="title-ld">Uploaded Files</h3>
//                           <table
//                             className="lead-table2"
//                             style={{ width: "100%", tableLayout: "fixed" }}
//                           >
//                             <thead>
//                               <tr>
//                                 <th>Name</th>
//                                 <th>Sharing</th>
//                                 <th>Size</th>
//                                 <th>Actions</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {uploadedFiles.map((file) => {
//                                 const fileTypeLower = file.type.toLowerCase();
//                                 const isImage = ["jpg", "jpeg", "png"].includes(fileTypeLower);
//                                 const isVideo = ["mp4", "webm", "ogg"].includes(fileTypeLower);
//                                 const isDocument = ["pdf", "doc", "docx"].includes(fileTypeLower);

//                                 return (
//                                   <tr key={file.id}>
//                                     <td>
//                                       {isImage || isVideo ? (
//                                         <a
//                                           href="#"
//                                           onClick={(e) => {
//                                             e.preventDefault();
//                                             openMediaModal(file);
//                                           }}
//                                         >
//                                           {file.name}
//                                         </a>
//                                       ) : isDocument ? (
//                                         <a href={file.url} target="_blank" rel="noopener noreferrer">
//                                           {file.name}
//                                         </a>
//                                       ) : (
//                                         file.name
//                                       )}
//                                     </td>
//                                     <td>{file.sharing}</td>
//                                     <td>{file.size}</td>
//                                     <td>
//                                       <a href={file.url} download>
//                                         <button className="download-btn">Download</button>
//                                       </a>
//                                     </td>
//                                   </tr>
//                                 );
//                               })}
//                             </tbody>
//                           </table>
//                         </div>
//                       </td>
//                       <MediaModal
//                         isOpen={showMediaModal}
//                         onClose={closeMediaModal}
//                         media={selectedMedia}
//                       />
//                     </tr>
//                   </React.Fragment>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="2">No Lead Returns Available</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     ));
//   };

//   // ------------------ Render ------------------
//   return (
//     <div ref={pdfRef} className="lead-desk-page">
//       <Navbar />

//       <div className="main-content-ld">
//         {/* Sidebar */}
//         <div className="sideitem">
//           <ul className="sidebar-list">
//           <li className="sidebar-item">Case Information</li>
//           <li className="sidebar-item" onClick={() => navigate("/CasePageManager")}>Case Page</li>
//           <li className="sidebar-item" onClick={() => navigate("/CreateLead")}>
//                   New Lead
//                 </li>   
//                 <li className="sidebar-item" onClick={() => navigate("/SearchLead")}>
//                   Search Lead
//                 </li>
//                 <li className="sidebar-item" >View Lead Return</li>
//                 <li className="sidebar-item" onClick={() => navigate("/ViewHierarchy")}>
//                   View Lead Chain of Custody
//                 </li>
//                 <li className="sidebar-item" onClick={() => navigate("/LeadLog")}>
//                   View Lead Log
//                 </li>
//                 <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
//                 View/Add Case Notes
//                 </li>
//                 <li className="sidebar-item" onClick={() => navigate("/FlaggedLead")}>
//                   View Flagged Leads
//                 </li>
//                 <li className="sidebar-item" onClick={() => navigate("/ViewTimeline")}>
//                   View Timeline Entries
//                 </li>
//                 <li className="sidebar-item active" onClick={() => navigate("/LeadsDesk")}>
//                   View Leads Desk
//                 </li>
//                 <li className="sidebar-item " onClick={() => navigate("/HomePage")}>
//                   Go to Home Page
//                 </li>
//                 </ul>
//         </div>

//         {/* Main content */}
//         <div className="left-content">
//           <div className="case-header">
//             <h2>LEADS DESK</h2>
//           </div>
//           <div className="center-section-ld">
//             <h1>
//               CASE: {selectedCase.caseNo || "N/A"} | {selectedCase.caseName.toUpperCase() || "Unknown Case"}
//             </h1>
//           </div>

//           <div className="bottom-sec-ld" id="main-content">
//             {/* Case Summary */}
//             <div className="case-summary-ld">
//               <label className="input-label">Case Summary</label>
//               <textarea
//                 className="textarea-field-ld"
//                 style={{ fontFamily: "inherit", fontSize: "20px" }}
//                 value={caseSummary}
//                 onChange={handleCaseSummaryChange}
//                 readOnly={!isEditing}
//               ></textarea>
//               {/* 
//               {!isEditing ? (
//                 <button className="edit-btn1" onClick={handleEditClick}>Edit</button>
//               ) : (
//                 <button className="save-btn1" onClick={handleSaveClick}>Save</button>
//               )} 
//               */}
//             </div>

//             {/* Search bars */}
//             <div className="search_and_hierarchy_container">
//               <div className="search-bar">
//                 <div className="search-container1">
//                   <i className="fa-solid fa-magnifying-glass"></i>
//                   <input
//                     type="text"
//                     className="search-input1"
//                     placeholder="Search Lead"
//                   />
//                 </div>
//               </div>

//               {/* Hierarchy Search & Show All Leads */}
//               <div className="hierarchy-search">
//                 <input
//                   type="text"
//                   className="input-field"
//                   placeholder="Enter Lead"
//                   value={hierarchyLeadInput}
//                   onChange={(e) => setHierarchyLeadInput(e.target.value)}
//                 />
//                 <button className="search-button" onClick={handleShowHierarchy}>
//                   Show Hierarchy
//                 </button>
//                 <button className="search-button" onClick={handleShowAllLeads}>
//                   Show All Leads
//                 </button>
//               </div>
//             </div>

//             {/* If we have hierarchy leads, show them. Otherwise, show all leads. */}
//             {hierarchyLeadsData.length > 0 ? (
//               <>
//                 <h3>Hierarchy for Lead {hierarchyLeadInput}:</h3>
//                 {/* Display each chain as a short comma‐separated string of leadNo */}
//                 {hierarchyChains.map((chain, idx) => {
//                   const chainStr = chain.map((l) => l.leadNo).join(",");
//                   return <div key={idx}>Chain #{idx + 1}: {chainStr}</div>;
//                 })}

//                 {renderLeads(hierarchyLeadsData)}
//               </>
//             ) : (
//               <>
//                 {renderLeads(leadsData)}
//                 <div className="p-6">
//                   <Pagination
//                     currentPage={currentPage}
//                     totalEntries={totalEntries}
//                     onPageChange={setCurrentPage}
//                     pageSize={pageSize}
//                     onPageSizeChange={setPageSize}
//                   />
//                 </div>
//               </>
//             )}
//           </div>

//           <div className="last-sec">
//             <div className="btn-sec">
//               <button className="save-btn1" onClick={runReport}>
//                 Run Report
//               </button>
//             </div>
//             <FootBar onPrevious={() => navigate(-1)} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// /** If your MediaModal is separate, import it instead. Otherwise, define it here. */
// const MediaModal = ({ isOpen, onClose, media }) => {
//   if (!isOpen || !media) return null;
//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//         {["jpg", "jpeg", "png"].includes(media.type.toLowerCase()) ? (
//           <img src={media.url} alt="Preview" className="modal-media-full" />
//         ) : ["mp4", "webm", "ogg"].includes(media.type.toLowerCase()) ? (
//           <video controls className="modal-media-full">
//             <source src={media.url} type={`video/${media.type.toLowerCase()}`} />
//             Your browser does not support the video tag.
//           </video>
//         ) : null}
//         <button className="close-btn" onClick={onClose}>✕</button>
//       </div>
//     </div>
//   );
// };

import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar/Navbar";
import FootBar from "../../components/FootBar/FootBar";
import { useDataContext } from "../Context/DataContext";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { CaseContext } from "../CaseContext";
import PersonModal from "../../components/PersonModal/PersonModel";
import CaseHeaderSection from "../../components/CaseHeaderSection/CaseHeaderSection";
import ReactQuill from "react-quill";
import api from "../../api"; // adjust the path as needed


import ExecSummaryModal from "../../components/ExecSummaryModal/ExecSummaryModal";
import VehicleModal from "../../components/VehicleModal/VehicleModal";
import Pagination from "../../components/Pagination/Pagination";
import { jsPDF } from "jspdf"; // if still used elsewhere
import html2canvas from "html2canvas";

import "./LeadsDesk.css";
import { SideBar } from "../../components/Sidebar/Sidebar";

// ---------- Helper to format dates as MM/DD/YY ----------
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};


// ---------- Fetch one lead (with returns, persons, vehicles) ----------
const fetchSingleLeadFullDetails = async (leadNo, caseNo, caseName, token) => {
  try {
    console.log("🔎 fetchSingleLeadFullDetails ➡️ leadNo:", leadNo);
    const { data: leadData } = await api.get(
      `/api/lead/lead/${leadNo}/${caseNo}/${encodeURIComponent(caseName)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!leadData || leadData.length === 0) {
      console.warn(`No lead found for leadNo: ${leadNo}`);
      return null;
    }
    const lead = leadData[0];
    const { data: returnsData } = await api.get(
      `/api/leadReturnResult/${lead.leadNo}/${encodeURIComponent(lead.description)}/${caseNo}/${encodeURIComponent(caseName)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const leadReturns = await Promise.all(
      returnsData.map(async (lr) => {
        let persons = [];
        let vehicles = [];
        try {
          const { data: personsData } = await api.get(
            `/api/lrperson/lrperson/${lead.leadNo}/${encodeURIComponent(lead.description)}/${caseNo}/${encodeURIComponent(caseName)}/${lr.leadReturnId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          persons = personsData;
        } catch (err) {
          console.error(`Error fetching persons for leadReturn ${lr.leadReturnId}`, err);
        }
        try {
          const { data: vehiclesData } = await api.get(
            `/api/lrvehicle/lrvehicle/${lead.leadNo}/${encodeURIComponent(lead.description)}/${caseNo}/${encodeURIComponent(caseName)}/${lr.leadReturnId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          vehicles = vehiclesData;
        } catch (err) {
          console.error(`Error fetching vehicles for leadReturn ${lr.leadReturnId}`, err);
        }
        return { ...lr, persons, vehicles };
      })
    );
    return { ...lead, leadReturns };
  } catch (error) {
    console.error(`Error fetching details for leadNo: ${leadNo}`, error);
    return null;
  }
};

// ---------- Recursively fetch entire chain of leads (child -> parents) ----------
const fetchLeadHierarchyFullDetails = async (leadNo, caseNo, caseName, token, chain = []) => {
  const currentLead = await fetchSingleLeadFullDetails(leadNo, caseNo, caseName, token);
  if (!currentLead) {
    return [chain];
  }
  const updatedChain = [...chain, currentLead];
  if (!currentLead.parentLeadNo || currentLead.parentLeadNo.length === 0) {
    return [updatedChain];
  }
  let allChains = [];
  for (const parentNo of currentLead.parentLeadNo) {
    const subChains = await fetchLeadHierarchyFullDetails(
      parentNo,
      caseNo,
      caseName,
      token,
      updatedChain
    );
    allChains.push(...subChains);
  }
  return allChains;
};

export const LeadsDesk = () => {
  // useEffect(() => {
  //   document.body.style.overflow = "hidden";
  //   return () => {
  //     document.body.style.overflow = "auto";
  //   };
  // }, []);

  const navigate = useNavigate();
    const location = useLocation();
  const pdfRef = useRef();
  const { selectedCase } = useContext(CaseContext);
  const { persons } = useDataContext();

  // ------------------ State ------------------
  const [leadsData, setLeadsData] = useState([]);
  const [hierarchyLeadsData, setHierarchyLeadsData] = useState([]);
  const [hierarchyChains, setHierarchyChains] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExecFileModal, setShowExecFileModal] = useState(false);
  const [execSummaryFile, setExecSummaryFile] = useState(null);
  const { leadDetails, caseDetails } = location.state || {};

  const [useFileUpload, setUseFileUpload] = useState(false);
  const [useWebpageSummary, setUseWebpageSummary] = useState(true);
  const [webpageUrl, setWebpageUrl] = useState("");
  const [typedSummary, setTypedSummary] = useState("");
  const saveTimeout = useRef(null);

  const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  const [leadDropdownOpen1, setLeadDropdownOpen1] = useState(true);

   // Save to backend
   const saveExecutiveSummary = async () => {
    if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
    const token = localStorage.getItem("token");
    try {
      await api.put(
        "/api/cases/executive-summary",
        {
          caseNo: selectedCase.caseNo,
          caseName: selectedCase.caseName,
          executiveCaseSummary: typedSummary,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Executive summary saved");
    } catch (err) {
      console.error("Failed to save executive summary", err);
    }
  };

  // Manual save button handler
  const handleSaveClick = () => {
    saveExecutiveSummary();
  };

  // Auto–save after 2s of inactivity
  useEffect(() => {
    if (!useWebpageSummary) return;
    // reset timer on every keystroke
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveExecutiveSummary();
    }, 2000);

    // cleanup on unmount or next keystroke
    return () => clearTimeout(saveTimeout.current);
  }, [typedSummary, useWebpageSummary, selectedCase.caseNo, selectedCase.caseName]);


  useEffect(() => {
    if (!selectedCase?.caseNo) return;
    const token = localStorage.getItem("token");
  
    api
      .get(
        `/api/cases/executive-summary/${selectedCase.caseNo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(({ data }) => {
        setTypedSummary(data.executiveCaseSummary);
        setUseWebpageSummary(true);    // ensure the textarea is enabled
      })
      .catch((err) => console.error("Failed to load exec summary", err));
  }, [selectedCase.caseNo]);
  
  // Modal states
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [personModalData, setPersonModalData] = useState({
    leadNo: "",
    description: "",
    caseNo: "",
    caseName: "",
    leadReturnId: "",
  });
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleModalData, setVehicleModalData] = useState({
    leadNo: "",
    description: "",
    caseNo: "",
    caseName: "",
    leadReturnId: "",
    leadsDeskCode: "",
  });
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // For hierarchy search
  const [hierarchyLeadInput, setHierarchyLeadInput] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const totalEntries = 100;

  // Case summary
  const defaultCaseSummary =
    "Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.";
  const [caseSummary, setCaseSummary] = useState(defaultCaseSummary);
  const [isEditing, setIsEditing] = useState(false);

  // ------------------ Modal Handlers ------------------
  const openPersonModal = (leadNo, description, caseNo, caseName, leadReturnId) => {
    setPersonModalData({ leadNo, description, caseNo, caseName, leadReturnId });
    setShowPersonModal(true);
  };
  const closePersonModal = () => setShowPersonModal(false);

  const openVehicleModal = (leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode) => {
    setVehicleModalData({ leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode });
    setShowVehicleModal(true);
  };
  const closeVehicleModal = () => setShowVehicleModal(false);

  const openMediaModal = (media) => {
    setSelectedMedia(media);
    setShowMediaModal(true);
  };
  const closeMediaModal = () => setShowMediaModal(false);

  const handleExecSummaryOptionSelect = (option, file) => {
    if (option === "upload") {
      setExecSummaryFile(file);
      handleRunReportWithSummary();
    } else {
      setExecSummaryFile(null);
      handleRunReport();
    }
    console.log("Executive Summary Option Selected:", option, file);
    // handleRunReportWithSummary();
  };

              
  const onShowCaseSelector = (route) => {
    navigate(route, { state: { caseDetails } });
};



  // ------------------ Show Hierarchy / Show All Leads ------------------
  const handleShowHierarchy = async () => {
    console.log("🔍 handleShowHierarchy for leadNo:", hierarchyLeadInput);
    if (!hierarchyLeadInput) return;
    const token = localStorage.getItem("token");
    try {
      const chainResults = await fetchLeadHierarchyFullDetails(
        hierarchyLeadInput,
        selectedCase.caseNo,
        selectedCase.caseName,
        token,
        []
      );
      console.log("⛓️ chainResults:", chainResults);
      setHierarchyChains(chainResults);
      const flattened = chainResults.flat();
      const uniqueLeads = [];
      const seen = new Set();
      for (const leadObj of flattened) {
        if (!seen.has(leadObj.leadNo)) {
          uniqueLeads.push(leadObj);
          seen.add(leadObj.leadNo);
        }
      }
      uniqueLeads.sort((a, b) => Number(b.leadNo) - Number(a.leadNo));
      setHierarchyLeadsData(uniqueLeads);
    } catch (err) {
      console.error("Error fetching hierarchy:", err);
      setHierarchyChains([]);
      setHierarchyLeadsData([]);
    }
  };

  const handleShowAllLeads = () => {
    setHierarchyLeadInput("");
    setHierarchyChains([]);
    setHierarchyLeadsData([]);
  };

  
   const [uploadedFiles, setUploadedFiles] = useState([
        {
          id: 1,
          name: "Suspect Description.docx",
          type: "DOCX",
          sharing: "Only Manager",
          modified: "Just now",
          size: "3 KB",
          url: "https://example.com/sample.docx",
        },
        {
          id: 2,
          name: "Field Case Report.pdf",
          type: "PDF",
          sharing: "Shared",
          modified: "Sep 23, 2023",
          size: "341 KB",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        },
        {
          id: 4,
          name: "Crime Scene Picture.jpg",
          type: "JPG",
          sharing: "Shared",
          modified: "Today",
          size: "150 KB",
          url: "https://via.placeholder.com/150",
        },
        {
          id: 5,
          name: "Crime Scene Video.mp4",
          type: "MP4",
          sharing: "Shared",
          modified: "Today",
          size: "1.5 MB",
          url: "https://www.w3schools.com/html/mov_bbb.mp4",
        },
        {
          id: 6,
          name: "Crime Scene Audio.mp3",
          type: "MP3",
          sharing: "Shared",
          modified: "Today",
          size: "2 MB",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        },
        {
          id: 7,
          name: "Suspects Phone Logs.pdf",
          type: "PDF",
          sharing: "Shared",
          modified: "Today",
          size: "500 KB",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        },
      ]);

  // ------------------ Fetch All Leads on Load ------------------
  useEffect(() => {
    const fetchLeadsReturnsAndPersons = async () => {
      if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
      const token = localStorage.getItem("token");
      try {
        const { data: leads } = await api.get(
          `/api/lead/case/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const leadsWithDetails = await Promise.all(
          leads.map(async (lead) => {
            let leadReturns = [];
            try {
              const { data: returnsData } = await api.get(
                `/api/leadReturnResult/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              leadReturns = await Promise.all(
                returnsData.map(async (leadReturn) => {
                  let persons = [];
                  let vehicles = [];
                  try {
                    const { data: personsData } = await api.get(
                      `/api/lrperson/lrperson/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/${leadReturn.leadReturnId}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    persons = personsData;
                  } catch (err) {
                    console.error(`Error fetching persons for LeadReturn ${leadReturn.leadReturnId}`, err);
                  }
                  try {
                    const { data: vehiclesData } = await api.get(
                      `/api/lrvehicle/lrvehicle/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/${leadReturn.leadReturnId}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    vehicles = vehiclesData;
                  } catch (err) {
                    console.error(`Error fetching vehicles for LeadReturn ${leadReturn.leadReturnId}`, err);
                  }
                  return { ...leadReturn, persons, vehicles };
                })
              );
            } catch (err) {
              console.error(`Error fetching returns for Lead ${lead.leadNo}`, err);
            }
            return { ...lead, leadReturns };
          })
        );
        setLeadsData(leadsWithDetails);
        setHierarchyChains([]);
        setHierarchyLeadsData([]);
      } catch (err) {
        console.error("Error fetching leads:", err);
      }
    };
    fetchLeadsReturnsAndPersons();
  }, [selectedCase]);

  const [selectStartLead1, setSelectStartLead1] = useState("");
const [selectEndLead2, setSelectEndLead2] = useState("");
const [visibleChainsCount, setVisibleChainsCount] = useState(2);

// This function will run when the user clicks "Show Leads"
const handleShowLeadsInRange = () => {
  // Convert the inputs to numbers
  const min = parseInt(selectStartLead1, 10);
  const max = parseInt(selectEndLead2, 10);

  // If either value is not a valid number, show an alert (optional)
  if (isNaN(min) || isNaN(max)) {
    alert("Please enter valid numeric lead numbers.");
    return;
  }

  // Filter your full leadsData based on leadNo being in [min, max]
  const filtered = leadsData.filter((lead) => {
    const leadNoNum = parseInt(lead.leadNo, 10);
    return leadNoNum >= min && leadNoNum <= max;
  });

  // Put these filtered leads into hierarchyLeadsData (so your render picks them up)
  setHierarchyLeadsData(filtered);
  // Clear out any existing chain data
  setHierarchyChains([]);
};

  // ------------------ Fetch Case Summary (Optional) ------------------
  useEffect(() => {
    const fetchCaseSummary = async () => {
      try {
        if (selectedCase && selectedCase.caseNo) {
          const token = localStorage.getItem("token");
          const response = await api.get(
            `/api/cases/summary/${selectedCase.caseNo}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data) {
            setCaseSummary(response.data.summary);
          }
        }
      } catch (error) {
        console.error("Error fetching case summary:", error);
      }
    };
    fetchCaseSummary();
  }, [selectedCase]);

  // ------------------ Case Summary Editing ------------------
  const handleCaseSummaryChange = (e) => setCaseSummary(e.target.value);
  const handleEditClick = () => setIsEditing(true);
  
  // const handleSaveClick = () => {
  //   setIsEditing(false);
  //   alert("Report Saved!");
  // };
  const [value, setValue] = useState("");
  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/api/lead/search", {
        params: {
          caseNo: selectedCase.caseNo,
          caseName: selectedCase.caseName,
          keyword: searchTerm,  // searchTerm is the input value from the user
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update your state with the results
      setLeadsData(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const HierarchyChain = ({ chain, chainIndex }) => {
    const [expanded, setExpanded] = useState(false);
    const leadNumbers = chain.map((l) => l.leadNo);
    const displayedNumbers = expanded ? leadNumbers : leadNumbers.slice(0, 2);
  
  //   return (
  //     <div key={chainIndex} style={{ marginBottom: "10px" }}>
  //       <strong>Chain #{chainIndex + 1}:</strong> {displayedNumbers.join(", ")}
  //       {leadNumbers.length > 2 && (
  //         // <button className = "show-more-btn" onClick={() => setExpanded(!expanded)} style={{ marginLeft: "10px" }}>
  //         //   {expanded ? "Show Less" : "Show More"}
  //         // </button>
  //          <button className = "show-more-btn" onClick={() => setExpanded(!expanded)} style={{ marginLeft: "10px" }}>
  //            {expanded ? "▲" : "▼"}
  //         </button>
  //       )}
  //     </div>
  //   );
  // };

  return (
    <div
      key={chainIndex}
      style={{
        marginBottom: "10px",
        cursor: "pointer",
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center"
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <strong>Chain #{chainIndex + 1}:</strong> {displayedNumbers.join(", ")}{" "}
      {leadNumbers.length > 2 && (expanded ? "▲ Shrink" : "▼Expand")}
      {/* {leadNumbers.length > 2 && (expanded ? "" : "")} */}
    </div>
  );
};


    // Handler to capture the file input
    const handleExecSummaryFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        setExecSummaryFile(e.target.files[0]);
      }
    };
  
  

  // ------------------ Updated PDF / Report Generation ------------------
  // This function builds a payload from your current state and calls your Node server endpoint
  // that uses the PDFKit generateCaseReport controller.
  const handleRunReport = async () => {
    const token = localStorage.getItem("token");
    try {
      // Build payload. You may adjust the payload structure as required by your backend.
      const payload = {
        user: "Officer 916", // Or get from auth context
        reportTimestamp: new Date().toLocaleString(),
        // For a full report, pass the entire leadsData and caseSummary.
        leadsData,
        caseSummary: typedSummary,
        // Here, you could also include selectedReports if you want sections toggled.
        selectedReports: { FullReport: true },
      };
      // Call your backend endpoint (adjust the URL if needed)
      const response = await api.post(
        "/api/report/generateCase",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob", // Expect a PDF blob back
        }
      );
      // Create a blob URL and open in a new tab
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");
    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Error generating PDF");
    }
  };


   // New function to run the report and merge it with an uploaded executive summary document
   const handleRunReportWithSummary = async () => {
    // const token = localStorage.getItem("token");
    // if (!execSummaryFile) {
    //   alert("Please upload an executive summary document.");
    //   return;
    // }

    // const formData = new FormData();
    // formData.append("user", "Officer 916");
    // formData.append("reportTimestamp", new Date().toLocaleString());
    // formData.append("caseSummary", caseSummary);
    // formData.append("leadsData", JSON.stringify(leadsData));
    // formData.append("execSummaryFile", execSummaryFile);
    // formData.append("selectedReports", JSON.stringify({ FullReport: true }));

    // try {
    //   const response = await axios.post(
    //     "http://localhost:5000/api/report/generateCaseExecSummary",
    //     formData,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //         "Content-Type": "multipart/form-data",
    //       },
    //       responseType: "blob",
    //     }
    //   );
    //   const file = new Blob([response.data], { type: "application/pdf" });
    //   const fileURL = URL.createObjectURL(file);
    //   window.open(fileURL, "_blank");
    // } catch (error) {
    //   console.error("Failed to generate report with executive summary", error);
    //   alert("Error generating PDF with executive summary");
    // }

    const token = localStorage.getItem("token");
    if (useWebpageSummary) {
      try {
        // Build payload. You may adjust the payload structure as required by your backend.
        const payload = {
          user: "Officer 916", // Or get from auth context
          reportTimestamp: new Date().toLocaleString(),
          // For a full report, pass the entire leadsData and caseSummary.
          leadsData,
          caseSummary: typedSummary,
          // Here, you could also include selectedReports if you want sections toggled.
          selectedReports: { FullReport: true },
        };
        // Call your backend endpoint (adjust the URL if needed)
        const response = await api.post(
          "/api/report/generateCase",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            responseType: "blob", // Expect a PDF blob back
          }
        );
        // Create a blob URL and open in a new tab
        const file = new Blob([response.data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, "_blank");
      } catch (error) {
        console.error("Failed to generate report", error);
        alert("Error generating PDF");
      }
  }

  else if (useFileUpload && execSummaryFile) {
    // try {
    //   const formData = new FormData();
    //   formData.append("user", "Officer 916");
    //   formData.append("reportTimestamp", new Date().toLocaleString());
    //   formData.append("leadsData", JSON.stringify(leadsData));
    //   // The *file* goes here:
    //   formData.append("execSummaryFile", execSummaryFile);
  
    //   const response = await axios.post(
    //     "http://localhost:5000/api/report/generateCaseExecSummary",
    //     formData,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //         "Content-Type": "multipart/form-data",
    //       },
    //       responseType: "blob",
    //     }
    //   );
    //   const file = new Blob([response.data], { type: "application/pdf" });
    //   window.open(URL.createObjectURL(file), "_blank");
    // } catch (err) {
    //   console.error("Error generating PDF with upload:", err);
    //   alert("Failed to generate report with uploaded summary");
    // }

    try {
      // Build payload. You may adjust the payload structure as required by your backend.
      const payload = {
        user: "Officer 916", // Or get from auth context
        reportTimestamp: new Date().toLocaleString(),
        // For a full report, pass the entire leadsData and caseSummary.
        leadsData,
        // Here, you could also include selectedReports if you want sections toggled.
        selectedReports: { FullReport: true },
      };
      // Call your backend endpoint (adjust the URL if needed)
      const response = await api.post(
        "/api/report/generateCaseExecSummary",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob", // Expect a PDF blob back
        }
      );
      // Create a blob URL and open in a new tab
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");
    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Error generating PDF");
    }
  }
  
  };

  



  // ------------------ Render Leads Table ------------------
  const renderLeads = (leadsArray) => {
    return leadsArray.map((lead, leadIndex) => (
      <div key={leadIndex} className="lead-section">
        <div className="leads-container">
          <table className="lead-details-table">
            <colgroup>
              <col style={{ width: "15%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="label-cell">Lead Number:</td>
                <td className="input-cell">
                  <input type="text" value={lead.leadNo} readOnly />
                </td>
                <td className="label-cell">Lead Origin:</td>
                <td className="input-cell">
                  <input
                    type="text"
                    value={lead.parentLeadNo ? lead.parentLeadNo.join(", ") : ""}
                    readOnly
                  />
                </td>
                <td className="label-cell">Assigned Date:</td>
                <td className="input-cell">
                  <input type="text" value={formatDate(lead.assignedDate)} readOnly />
                </td>
                <td className="label-cell">Completed Date:</td>
                <td className="input-cell">
                  <input type="text" value={formatDate(lead.completedDate)} readOnly />
                </td>
              </tr>
              <tr>
                <td className="label-cell">Assigned Officers:</td>
                <td className="input-cell" colSpan={7}>
                   <input type="text" value={ Array.isArray(lead.assignedTo) && lead.assignedTo.length ? lead.assignedTo
                              .map((a) => a.username)            
                              .join(", ") : ""
                              }readOnly
                   />

                </td>
              </tr>
            </tbody>
          </table>

          <table className="leads-table">
            <tbody>
              <tr className="table-first-row">
                <td>Lead Instruction</td>
                <td>
                  <input
                    type="text"
                    value={lead.description || ""}
                    className="instruction-input"
                    readOnly
                  />
                </td>
              </tr>

              {lead.leadReturns && lead.leadReturns.length > 0 ? (
                lead.leadReturns.map((returnItem) => (
                  <React.Fragment key={returnItem._id || returnItem.leadReturnId}>
                    <tr>
                      <td>{`Lead Return ID: ${returnItem.leadReturnId}`}</td>
                      <td>
                        <textarea
                          className="lead-return-input"
                          value={returnItem.leadReturnResult || ""}
                          readOnly
                          style={{
                            fontSize: "20px",
                            padding: "10px",
                            borderRadius: "6px",
                            width: "100%",
                            resize: "none",
                            height: "auto",
                            fontFamily: "Arial",
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                          }}
                          rows={Math.max((returnItem.leadReturnResult || "").length / 50, 2)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        {returnItem.persons && returnItem.persons.length > 0 && (
                          <div className="person-section">
                            <h3 className="title-ld">Person Details</h3>
                            <table className="lead-table2" style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead>
                                <tr>
                                  <th>Date Entered</th>
                                  <th>Name</th>
                                  <th>Phone No</th>
                                  <th>Address</th>
                                  <th>Additional Details</th>
                                </tr>
                              </thead>
                              <tbody>
                                {returnItem.persons.map((person, index) => (
                                  <tr key={person._id || index}>
                                    <td>{formatDate(person.enteredDate)}</td>
                                    <td>
                                      {person.firstName
                                        ? `${person.firstName}, ${person.lastName}`
                                        : "N/A"}
                                    </td>
                                    <td>{person.cellNumber}</td>
                                    <td style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                                      {person.address
                                        ? `${person.address.street1 || ""}, ${person.address.city || ""}, ${person.address.state || ""}, ${person.address.zipCode || ""}`
                                        : "N/A"}
                                    </td>
                                    <td>
                                      <button
                                        className="download-btn"
                                        onClick={() =>
                                          openPersonModal(
                                            lead.leadNo,
                                            lead.description,
                                            selectedCase.caseNo,
                                            selectedCase.caseName,
                                            returnItem.leadReturnId
                                          )
                                        }
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
                      </td>
                      <PersonModal
                        isOpen={showPersonModal}
                        onClose={closePersonModal}
                        leadNo={personModalData.leadNo}
                        description={personModalData.description}
                        caseNo={personModalData.caseNo}
                        caseName={personModalData.caseName}
                        leadReturnId={personModalData.leadReturnId}
                      />
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        {returnItem.vehicles && returnItem.vehicles.length > 0 && (
                          <div className="person-section">
                            <h3 className="title-ld">Vehicles Details</h3>
                            <table className="lead-table2" style={{ width: "100%", tableLayout: "fixed" }}>
                              <thead>
                                <tr>
                                  <th>Date Entered</th>
                                  <th>Make</th>
                                  <th>Model</th>
                                  <th>Color</th>
                                  <th>Plate</th>
                                  <th>State</th>
                                  <th>Additional Details</th>
                                </tr>
                              </thead>
                              <tbody>
                                {returnItem.vehicles.map((vehicle, index) => (
                                  <tr key={vehicle._id || index}>
                                    <td>{formatDate(vehicle.enteredDate)}</td>
                                    <td>{vehicle.make}</td>
                                    <td>{vehicle.model}</td>
                                    <td>
                                      <div style={{ display: "flex", alignItems: "center" }}>
                                        <span style={{ width: "60px", display: "inline-block" }}>
                                          {vehicle.primaryColor}
                                        </span>
                                        <div
                                          style={{
                                            width: "18px",
                                            height: "18px",
                                            backgroundColor: vehicle.primaryColor,
                                            marginLeft: "15px",
                                            border: "1px solid #000",
                                          }}
                                        ></div>
                                      </div>
                                    </td>
                                    <td>{vehicle.plate}</td>
                                    <td>{vehicle.state}</td>
                                    <td>
                                      <button
                                        className="download-btn"
                                        onClick={() =>
                                          openVehicleModal(
                                            lead.leadNo,
                                            lead.description,
                                            selectedCase.caseNo,
                                            selectedCase.caseName,
                                            returnItem.leadReturnId,
                                            returnItem.leadsDeskCode
                                          )
                                        }
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
                      </td>
                      <VehicleModal
                        isOpen={showVehicleModal}
                        onClose={closeVehicleModal}
                        leadNo={vehicleModalData.leadNo}
                        leadName={vehicleModalData.description}
                        caseNo={vehicleModalData.caseNo}
                        caseName={vehicleModalData.caseName}
                        leadReturnId={vehicleModalData.leadReturnId}
                        leadsDeskCode={vehicleModalData.leadsDeskCode}
                      />
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        {/* <div className="person-section">
                          <h3 className="title-ld">Uploaded Files</h3>
                          <table className="lead-table2" style={{ width: "100%", tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Sharing</th>
                                <th>Size</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {uploadedFiles.map((file) => {
                                const fileTypeLower = file.type.toLowerCase();
                                const isImage = ["jpg", "jpeg", "png"].includes(fileTypeLower);
                                const isVideo = ["mp4", "webm", "ogg"].includes(fileTypeLower);
                                const isDocument = ["pdf", "doc", "docx"].includes(fileTypeLower);
                                return (
                                  <tr key={file.id}>
                                    <td>
                                      {isImage || isVideo ? (
                                        <a
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            openMediaModal(file);
                                          }}
                                        >
                                          {file.name}
                                        </a>
                                      ) : isDocument ? (
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                          {file.name}
                                        </a>
                                      ) : (
                                        file.name
                                      )}
                                    </td>
                                    <td>{file.sharing}</td>
                                    <td>{file.size}</td>
                                    <td>
                                      <a href={file.url} download>
                                        <button className="download-btn">Download</button>
                                      </a>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div> */}
                      </td>
                      <MediaModal
                        isOpen={showMediaModal}
                        onClose={closeMediaModal}
                        media={selectedMedia}
                      />
                    </tr>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No Lead Returns Available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    ));
  };

  return (
    <div ref={pdfRef} className="lead-desk-page">
      <Navbar />

      <div className="main-content-ld-ExecSummary">
        {/* <div className="sideitem">
        
          <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
          <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >

            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li>            
            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
        
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" onClick={() => navigate('/LRInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
          
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
          
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            <li className="sidebar-item active" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}

            </ul>
        )}

<li className="sidebar-item" style={{ fontWeight: 'bold' }} onClick={() => setLeadDropdownOpen1(!leadDropdownOpen1)}>
          Lead Related Tabs {leadDropdownOpen1 ?  "▲": "▼"}
</li>
        {leadDropdownOpen1 && (
          <ul>
             <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>

            {selectedCase.role !== "Investigator" && (
  <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
    View Lead Chain of Custody
  </li>
)}
       
          </ul>
        )}

        </div> */}
         <SideBar activePage="LeadsDesk" />

        <div className="right-sec">
            
      

          {/* <div className="header-ld-exec"> */}
        {/* <div className="case-header-ldExecSummary">
            <h2>LEADS DESK</h2>
          </div> */}
          {/* <div className="center-section-ldExecSummary">
            <h1>
              CASE: {selectedCase.caseNo || "N/A"} | {selectedCase.caseName.toUpperCase() || "Unknown Case"}
            </h1>
          </div> */}
          {/* </div> */}

             <div className="top-menu">
        <div className="menu-items">
           <span className="menu-item active " onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )}>
            Leads Desk
          </span>
        <span className="menu-item " onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )}>
            Generate Report
          </span>
          {/* <span className="menu-item" onClick={() => navigate("/CaseScratchpad", { state: { caseDetails } } )}>
            Add/View Case Notes
          </span> */}
          <span className="menu-item" onClick={() => navigate('/SearchLead', { state: { caseDetails } } )} >
            Advanced Search
          </span>
          <span className="menu-item" onClick={() => navigate("/ViewTimeline", { state: { caseDetails } } )}>
          View Timelines
          </span>
          {/* <span className="menu-item" onClick={() => navigate("/FlaggedLead", { state: { caseDetails } } )}>
          View Flagged Leads
          </span> */}
         </div>
       </div>
       <div className="down-content"> 

        <div className="left-content-execSummary">

        {/* <div className="case-header">
            <h2>LEADS DESK</h2>
          </div>
          <div className="center-section-ld">
            <h1>
              CASE: {selectedCase.caseNo || "N/A"} | {selectedCase.caseName.toUpperCase() || "Unknown Case"}
            </h1>
          </div> */}

          <div className="bottom-sec-ldExecSummary" id="main-content">
            <div className="case-summary-ld">
              <label className="input-label">Case Summary</label>
              <textarea
                className="textarea-field-ld"
                style={{ fontFamily: "inherit", fontSize: "20px" }}
                value={caseSummary}
                onChange={handleCaseSummaryChange}
                readOnly={!isEditing}
              ></textarea>
            </div>

            <div className="search-lead-portion">
            <div className="search-lead-head">
            <label className="input-label1">Search Lead</label>
            </div>
            <div className="search_and_hierarchy_container">
              <div className="search-bar">
                <div className="search-container1">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input type="text" className="search-input1" placeholder="Search Lead" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      console.log("Enter pressed, calling handleSearch");
                      handleSearch();
                    }
                  }} />
                </div>
              </div>
              </div>
              </div> 
              {/* <CaseHeaderSection /> */}

              <div className="block1">
        <label className="input-label">Select Leads to view</label>
        <div className="top-row">
        <div className="top-rowhead">
          <div className="square">
          <input
                  type="text"
                  className="square-input"
                  placeholder=""
                  value={selectStartLead1}
                  onChange={(e) => setSelectStartLead1(e.target.value)}
                />
          </div>
          <div className="dash"></div>
          <div className="square">
          <input
                  type="text"
                  className="square-input"
                  placeholder=""
                  value={selectEndLead2}
                  onChange={(e) => setSelectEndLead2(e.target.value)}
                />
          </div>
          </div>
          {/* <div className="select-lead-btn-container"> */}
          <button className="search-button1" onClick={handleShowLeadsInRange} >
                  Show Leads
                </button>
                {/* <button className="search-button1" onClick={handleShowAllLeads}>
                  Show All Leads
                </button> */}
                </div>
                <div className="show-all-lead-btn-sec">
                <button className="show-all-lead-btn" onClick={handleShowAllLeads}>
                  Show All Leads
                </button>
                </div>
        </div>


        <div className="block1">
        <label className="input-label">View Lead Hierarchy</label>
        <div className="top-row">
        <div className="top-rowhead">
          <div className="square1">
          <input
                  type="text"
                  className="square-input"
                  placeholder=""
                  value={hierarchyLeadInput}
                  onChange={(e) => setHierarchyLeadInput(e.target.value)}
                />
          </div>
          <div className="square4"></div>
          <div className="square3"></div>
          </div>
          <button className="search-button1" 
          // onClick={() => console.log("🔥 button clicked!")}>
        onClick={handleShowHierarchy}>
                  Show Hierarchy
                </button>
        </div>
        </div>
               <div className="p-6">
                  <Pagination
                    currentPage={currentPage}
                    totalEntries={totalEntries}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                  />
                </div>

            {hierarchyLeadsData.length > 0 ? (
              <>
                {/* <h3 style={{ textAlign: "left" }}>Hierarchy for Lead {hierarchyLeadInput}:</h3>

                {
                  hierarchyChains.slice(0, visibleChainsCount).map((chain, idx) => (
                    <HierarchyChain key={idx} chain={chain} chainIndex={idx} />
                  ))
                }

<div style={{ marginTop: "10px" }}>
      {visibleChainsCount < hierarchyChains.length && (
        <button
          className="show-more-chains-btn"
          onClick={() => setVisibleChainsCount(prev => prev + 5)}
          style={{ marginRight: "10px", color: "grey", backgroundColor:"whitesmoke" }}
        >
          Load More Chains
        </button>
      )}
      {visibleChainsCount > 2 && (
        <button
          className="show-more-chains-btn"
          onClick={() => setVisibleChainsCount(2)}
        >
          Load Less Chains
        </button>
      )}
    </div> */}

<div style={{ width: "100%", alignSelf: "flex-start", textAlign: "left" }}>
  <h3 style={{ width: "100%", alignSelf: "flex-start", textAlign: "left" }}>Hierarchy for Lead {hierarchyLeadInput}:</h3>
  {hierarchyChains.slice(0, visibleChainsCount).map((chain, idx) => (
    <HierarchyChain key={idx} chain={chain} chainIndex={idx} />
  ))}
  <div style={{ marginTop: "10px", textAlign: "left" }}>
    {visibleChainsCount < hierarchyChains.length && (
      <button
        className="show-more-chains-btn"
        onClick={() => setVisibleChainsCount(prev => prev + 5)}
        style={{
          marginLeft: "-20px",
          color: "grey",
          background: "none",
          border: "none",
          cursor: "pointer"
        }}
      >
        Load More Chains
      </button>
    )}
    {visibleChainsCount > 2 && (
      <button
        className="show-more-chains-btn"
        onClick={() => setVisibleChainsCount(2)}
        style={{
          // marginRight: "10px",
          marginLeft: "-20px",
          color: "grey",
          background: "none",
          border: "none",
          cursor: "pointer"
        }}
      >
        Load Less Chains
      </button>
    )}
  </div>
</div>


                {renderLeads(hierarchyLeadsData)}
              </>
            ) : (
              <>
                {renderLeads(leadsData)}
                {/* <div className="p-6">
                  <Pagination
                    currentPage={currentPage}
                    totalEntries={totalEntries}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                  />
                </div> */}
              </>
            )}
            </div>
        </div>
        </div>  
        </div>
      </div>

       {/* Render the ExecSummaryModal */}
       <ExecSummaryModal
        isOpen={showExecFileModal}
        onClose={() => setShowExecFileModal(false)}
        onSelectOption={handleExecSummaryOptionSelect}
      />
    </div>
  );
};

const MediaModal = ({ isOpen, onClose, media }) => {
  if (!isOpen || !media) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {["jpg", "jpeg", "png"].includes(media.type.toLowerCase()) ? (
          <img src={media.url} alt="Preview" className="modal-media-full" />
        ) : ["mp4", "webm", "ogg"].includes(media.type.toLowerCase()) ? (
          <video controls className="modal-media-full">
            <source src={media.url} type={`video/${media.type.toLowerCase()}`} />
            Your browser does not support the video tag.
          </video>
        ) : null}
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};
