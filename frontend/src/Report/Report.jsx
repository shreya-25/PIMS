
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
// import pdfRef from "../refStore"; 
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

//  const generatePDF = (pdfElement) => {
//     console.log("HiI'm in PDF");
//     if (!pdfElement) {
//       console.error("No element provided for PDF generation");
//       return;
//     }
//     html2canvas(pdfElement, { scale: 2 }).then((canvas) => {
//       const imgData = canvas.toDataURL("image/png");
//       const pdf = new jsPDF("p", "mm", "a4");
//       const imgWidth = 210; // A4 width in mm
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
//       const pdfBlob = pdf.output("blob");
//         const fileURL = URL.createObjectURL(pdfBlob);
//         window.open(fileURL);
//       pdf.save("leads_desk.pdf");
//     });
//   };

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

// const Report = () => {

//   useEffect(() => {
//     // Apply style when component mounts
//     document.body.style.overflow = "hidden";

//     return () => {
//       // Reset to default when component unmounts
//       document.body.style.overflow = "auto";
//     };
//   }, []);
//   const navigate = useNavigate();
//   const { selectedCase, selectedLead, selectedReports  } = useContext(CaseContext);
//   const { persons } = useDataContext();
//   useEffect(() => {
//     console.log("Report mounted, pdfRef.current:", pdfRef.current);
//   }, []);

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
// //   const generatePDF = () => {
// //     const input = pdfRef.current;
// //     html2canvas(input, { scale: 2 }).then((canvas) => {
// //       const imgData = canvas.toDataURL("image/png");
// //       const pdf = new jsPDF("p", "mm", "a4");
// //       const imgWidth = 210; // A4 width
// //       const imgHeight = (canvas.height * imgWidth) / canvas.width;
// //       pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
// //       pdf.save("leads_desk.pdf");
// //     });
// //   };

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
// {selectedReports.leadInstruction && (
//   <>
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
// </>
// )}



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
//                     {selectedReports.leadReturn && (
//                      <>
//                     <tr>
//                       <td>{`Lead Return ID: ${returnItem.leadReturnId}`}</td>
//                       <td>
//                         <textarea
//                           className="lead-return-input"
//                           value={returnItem.leadReturnResult || ""}
//                           readOnly
//                           style={{
//                             whiteSpace: "pre-wrap",
//                             wordBreak: "break-word",
//                             fontSize: "14px",
//                             padding: "10px",
//                             border: "1px solid #ccc",
//                             borderRadius: "6px",
//                             minHeight: "80px",
//                             fontFamily: "Arial, sans-serif",
//                             boxSizing: "border-box",
//                             width: "100%",
//                           }}
//                           rows={Math.max((returnItem.leadReturnResult || "").length / 50, 2)}
//                         />
//                       </td>
//                     </tr>
//                     </>
//                      )}
//                     {/* Persons */}
//                     {selectedReports.leadPersons && (
//                      <>
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
//                     </>
//                      )}
//                     {/* Vehicles */}
//                     {selectedReports.leadPersons && (
//                      <>
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
//                     </>
//                      )}
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

//       <div className="main-content-ld">

//         {/* Main content */}
//         <div className="left-content">
//         <div className="top-sec-report">  
//         <div className="logo-sec-report">
//           <img
//             src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
//             alt="Police Department Logo"
//             className="police-logo-main-page"
//           />
//           <h1 className="main-page-heading"> PIMS</h1>
//         </div>

//         <div className="title-report">
//             <h1>
//               CASE: {selectedCase.caseNo || "N/A"} | {selectedCase.caseName.toUpperCase() || "Unknown Case"}
//             </h1>
//             <h2>
//               LEAD: {selectedLead. leadNo || "N/A"} | {selectedLead.leadName.toUpperCase() || "Unknown Case"}
//             </h2>
//           </div>
//           </div>

//           <div className="bottom-sec-ld" id="main-content">

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
//             {renderLeads(leadsData.filter(lead => lead.leadNo === 9))}
//               </>
//             )}
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


