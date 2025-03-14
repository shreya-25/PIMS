import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar/Navbar";
import FootBar from "../../components/FootBar/FootBar";
import { useDataContext } from "../Context/DataContext"; // Import Context
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";
import PersonModal from "../../components/PersonModal/PersonModel";
import VehicleModal from "../../components/VehicleModal/VehicleModel";
import Pagination from "../../components/Pagination/Pagination";


import "./LeadsDesk.css"; // Ensure this file is linked for styling
import jsPDF from "jspdf";
import html2canvas from "html2canvas";



export const LeadsDesk = () => {

  useEffect(() => {
    // Apply style when component mounts
    document.body.style.overflow = "hidden";

    return () => {
      // Reset to default when component unmounts
      document.body.style.overflow = "auto";
    };
  }, []);
  const navigate = useNavigate();
  const pdfRef = useRef();
  const { selectedCase, setSelectedLead } = useContext(CaseContext);
  const { persons } = useDataContext(); // Fetch Data from Context

    // State to control the modal
    const [showPersonModal, setShowPersonModal] = useState(false);

    // We’ll store the leadReturn info we need for the modal
    const [personModalData, setPersonModalData] = useState({
      leadNo: "",
      description: "",
      caseNo: "",
      caseName: "",
      leadReturnId: "",
    });

    const [vehicleModalData, setVehicleModalData] = useState({
      leadNo: "",
      description: "",
      caseNo: "",
      caseName: "",
      leadReturnId: "",
      leadsDeskCode: "",
    });
    
  
    // Function to open the modal, passing the needed data
    const openPersonModal = (leadNo, description, caseNo, caseName, leadReturnId) => {
      setPersonModalData({ leadNo, description, caseNo, caseName, leadReturnId });
      setShowPersonModal(true);
    };

    
  // Function to format dates as MM/DD/YY
const formatDate = (dateString) => {
  if (!dateString) return ""; // Handle empty dates
  const date = new Date(dateString);
  if (isNaN(date)) return ""; // Handle invalid dates

  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year

  return `${month}/${day}/${year}`;
};

  
    // Function to close the modal
    const closePersonModal = () => {
      setShowPersonModal(false);
    };

        const [currentPage, setCurrentPage] = useState(1);
      const [pageSize, setPageSize] = useState(50);
      const totalPages = 10; // Change based on your data
      const totalEntries = 100;

    const openVehicleModal = (leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode) => {
      setVehicleModalData({
        leadNo,
        description,
        caseNo,
        caseName,
        leadReturnId,
        leadsDeskCode,
      });
      setShowVehicleModal(true); // Ensure this state exists
    };

    const closeVehicleModal = () => {
      setVehicleModalData({
        leadNo: "",
        description: "",
        caseNo: "",
        caseName: "",
        leadReturnId: "",
        leadsDeskCode: "",
      });
      setShowVehicleModal(false);
    };
    const [showVehicleModal, setShowVehicleModal] = useState(false);

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
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
      );
    };
    
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
  
    // const openImageModal = (url) => {
    //   setImageUrl(url);
    //   setShowImageModal(true);
    // };
  
    // const closeImageModal = () => {
    //   setShowImageModal(false);
    // };
    const openMediaModal = (media) => {
      setSelectedMedia(media);
      setShowMediaModal(true);
    };
  
    const closeMediaModal = () => {
      setShowMediaModal(false);
    };
    

  const [leadsData, setLeadsData] = useState([]);

  // Dummy data for multiple leads
  // const [leadsData, setLeadsData] = useState([
  //   {
  //     leadNumber: "1",
  //     leadOrigin: "",
  //     assignedOfficer: "Officer 912",
  //     assignedDate: "02/25/25",
  //     leadDescription: "Collect Audio Recording from dispatcher",
  //     leadReturns: [
  //       "As part of the Bank Robbery Investigation Case No. 65734, Officer 916 assigned Officers 1, 2, and 3 the task of interviewing Matthew under Lead No. 11. The interview was conducted on February 20, 2025, at 10:30 AM (UTC) and was officially logged by Officer 1. Following the interview, the officers gathered key details regarding Matthew’s whereabouts during the time of the robbery, his possible connections to the suspects, and any unusual activities he may have observed. Their findings were submitted for further review, indicating that Matthew provided potentially valuable information that may assist in identifying suspects, confirming alibis, or uncovering new leads in the investigation",
  //     ],
  //   },
  //   {
  //     leadNumber: "2",
  //     leadOrigin: "",
  //     assignedOfficer: "Officer 914",
  //     assignedDate: "02/26/25",
  //     leadDescription: "Interview witness near the grocery store",
  //     leadReturns: [
  //       "Security footage shows the suspect.",
  //       "Officer confirmed identity with store clerk.",
  //     ],
  //   },
  //   {
  //     leadNumber: "3",
  //     leadOrigin: "1",
  //     assignedOfficer: "Officer 918",
  //     assignedDate: "02/27/25",
  //     leadDescription: "Follow up on car seen near the location",
  //     leadReturns: [
  //       "Car owner identified.",
  //     ],
  //   },
  //   {
  //     leadNumber: "4",
  //     leadOrigin: "2",
  //     assignedOfficer: "Officer 918",
  //     assignedDate: "02/27/25",
  //     leadDescription: "Check video footage of main street",
  //     leadReturns: [
  //       "Suspect went outside the house at 2:00 PM "
  //     ],
  //   },
  // ]);

  // useEffect(() => {

  //   const fetchLeadsReturnsAndPersons = async () => {
  //     if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
  
  //     const token = localStorage.getItem("token");
  //     try {
  //       // Step 1: Fetch all leads for the selected case
  //       const { data: leads } = await axios.get(
  //         `http://localhost:5000/api/lead/case/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  
  //       // Step 2: Fetch lead returns, persons, and vehicles for each lead
  //       const leadsWithDetails = await Promise.all(
  //         leads.map(async (lead) => {
  //           let leadReturns = [];
  //           let hierarchyChain = [];
  
  //           try {
  //             // Fetch lead returns
  //             const { data: returnsData } = await axios.get(
  //               `http://localhost:5000/api/leadReturnResult/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
  //               { headers: { Authorization: `Bearer ${token}` } }
  //             );
  
  //             // Fetch person and vehicle details for each lead return
  //             leadReturns = await Promise.all(
  //               returnsData.map(async (leadReturn) => {
  //                 let persons = [];
  //                 let vehicles = [];
  
  //                 // Fetch persons
  //                 try {
  //                   const { data: personsData } = await axios.get(
  //                     `http://localhost:5000/api/lrperson/lrperson/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/${leadReturn.leadReturnId}`,
  //                     { headers: { Authorization: `Bearer ${token}` } }
  //                   );
  //                   persons = personsData;
  //                 } catch (personError) {
  //                   console.error(`Error fetching persons for LeadReturn ${leadReturn.leadReturnId}`, personError);
  //                 }
  
  //                 // Fetch vehicles
  //                 try {
  //                   const { data: vehiclesData } = await axios.get(
  //                     `http://localhost:5000/api/lrvehicle/lrvehicle/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/${leadReturn.leadReturnId}`,
  //                     { headers: { Authorization: `Bearer ${token}` } }
  //                   );
  //                   vehicles = vehiclesData;
  //                 } catch (vehicleError) {
  //                   console.error(`Error fetching vehicles for LeadReturn ${leadReturn.leadReturnId}`, vehicleError);
  //                 }
  
  //                 return {
  //                   ...leadReturn,
  //                   persons,
  //                   vehicles,
  //                 };
  //               })
  //             );
  //           } catch (returnsError) {
  //             console.error(`Error fetching returns for Lead ${lead.leadNo}`, returnsError);
  //           }
  
  //           return {
  //             ...lead,
  //             leadReturns,
  //           };
  //         })
  //       );
  
  //       setLeadsData(leadsWithDetails);
  //       console.log("Leads with full details:", leadsWithDetails);
  //     } catch (leadsError) {
  //       console.error("Error fetching leads:", leadsError);
  //     }
  //   };
  
  //   fetchLeadsReturnsAndPersons();
  // }, [selectedCase]);

  const fetchLeadHierarchy = async (leadNo, token) => {
    try {
      // Fetch the lead details by lead number
      const { data: leadData } = await axios.get(
        `http://localhost:5000/api/lead/${leadNo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // If this lead has a parent, fetch its hierarchy recursively.
      if (leadData.parentLeadNo) {
        const parentHierarchy = await fetchLeadHierarchy(leadData.parentLeadNo, token);
        return [...parentHierarchy, leadData.leadNo];
      } else {
        // No parent lead; this is the top of the chain.
        return [leadData.leadNo];
      }
    } catch (error) {
      console.error("Error fetching lead hierarchy for", leadNo, error);
      return [];
    }
  };
  

  useEffect(() => {
    const fetchLeadsReturnsAndPersons = async () => {
      if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
  
      const token = localStorage.getItem("token");
      try {
        // Step 1: Fetch all leads for the selected case
        const { data: leads } = await axios.get(
          `http://localhost:5000/api/lead/case/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        // Step 2: Fetch details (returns, persons, vehicles) and the hierarchy for each lead
        const leadsWithDetails = await Promise.all(
          leads.map(async (lead) => {
            let leadReturns = [];
            let hierarchyChain = [];
            
            try {
              // Fetch lead returns
              const { data: returnsData } = await axios.get(
                `http://localhost:5000/api/leadReturnResult/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
  
              // Fetch person and vehicle details for each lead return
              leadReturns = await Promise.all(
                returnsData.map(async (leadReturn) => {
                  let persons = [];
                  let vehicles = [];
  
                  // Fetch persons
                  try {
                    const { data: personsData } = await axios.get(
                      `http://localhost:5000/api/lrperson/lrperson/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/${leadReturn.leadReturnId}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    persons = personsData;
                  } catch (personError) {
                    console.error(`Error fetching persons for LeadReturn ${leadReturn.leadReturnId}`, personError);
                  }
  
                  // Fetch vehicles
                  try {
                    const { data: vehiclesData } = await axios.get(
                      `http://localhost:5000/api/lrvehicle/lrvehicle/${lead.leadNo}/${encodeURIComponent(lead.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}/${leadReturn.leadReturnId}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    vehicles = vehiclesData;
                  } catch (vehicleError) {
                    console.error(`Error fetching vehicles for LeadReturn ${leadReturn.leadReturnId}`, vehicleError);
                  }
  
                  return {
                    ...leadReturn,
                    persons,
                    vehicles,
                  };
                })
              );
            } catch (returnsError) {
              console.error(`Error fetching returns for Lead ${lead.leadNo}`, returnsError);
            }
  
            // Fetch the lead hierarchy for this lead using the helper function
            hierarchyChain = await fetchLeadHierarchy(lead.leadNo, token);
  
            return {
              ...lead,
              leadReturns,
              // Convert hierarchy array to a string. For example: "TopLead > ParentLead > CurrentLead"
              leadHierarchy: hierarchyChain.join(" > "),
            };
          })
        );
  
        setLeadsData(leadsWithDetails);
        console.log("Leads with full details and hierarchy:", leadsWithDetails);
      } catch (leadsError) {
        console.error("Error fetching leads:", leadsError);
      }
    };
  
    fetchLeadsReturnsAndPersons();
  }, [selectedCase]);
  
  

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
        url: "/Materials/forensic.jpg",
      },
      {
        id: 5,
        name: "Crime Scene Video.mp4",
        type: "MP4",
        sharing: "Shared",
        modified: "Today",
        size: "1.5 MB",
        url: "/Materials/video1.mp4",
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
  
    // For image preview modal (only images are previewable)
    const [selectedFile, setSelectedFile] = useState(null);
  
    // (Optional) Allow users to upload files from their system
    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (!file) return;
  
      const extension = file.name.split(".").pop().toLowerCase();
      const fileUrl = URL.createObjectURL(file);
      const newFile = {
        id: Date.now(),
        name: file.name,
        type: extension.toUpperCase(),
        sharing: "Only you",
        modified: new Date().toLocaleDateString(),
        size: `${Math.round(file.size / 1024)} KB`,
        url: fileUrl,
      };
  
      setUploadedFiles((prevFiles) => [...prevFiles, newFile]);
    };
  
    // Only images (JPG, JPEG, PNG) will be previewed in a modal
    const isPreviewable = (file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      return ["jpg", "jpeg", "png"].includes(ext);
    };
  
    // Handle download by creating an <a> element
    const handleDownload = async (file) => {
      try {
        const response = await fetch(file.url, { mode: "cors" });
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
      }
    };
    

  const defaultCaseSummary = "Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.";


  const [caseSummary, setCaseSummary] = useState('' ||  defaultCaseSummary);

  const [isEditing, setIsEditing] = useState(false); // Controls whether the textarea is editable

  useEffect(() => {
   const fetchCaseSummary = async () => {
     try {
       if (selectedCase && selectedCase.caseNo) {
         const token = localStorage.getItem("token");
         const response = await axios.get(`http://localhost:5000/api/cases/summary/${selectedCase.caseNo}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         // Update case summary if data is received
         console.log("Response data:", response.data);
         if (response.data) {
           setCaseSummary(response.data.summary );
         }
       }
     } catch (error) {
       console.error("Error fetching case summary:", error);
     }
   };

   fetchCaseSummary();
 }, [selectedCase]);

  const handleCaseSummaryChange = (e) => {
      setCaseSummary(e.target.value);
  };

  // Toggle edit mode
  const handleEditClick = () => {
   setIsEditing(true);
  };

   // Save the edited text and disable editing
   const handleSaveClick = () => {
       setIsEditing(false);
       alert("Report Saved!");
       // You can add logic here to update the backend with the new summary if needed
   };

  const options = [
    { name: "Person" },
    { name: "Vehicle" },
    { name: "Evidence" },
    { name: "Enclosure" },
    { name: "Pictures" },
    { name: "Audio" },
    { name: "Video" },
    { name: "Scratchpad" },
  ];

  const generatePDF = () => {
    const input = pdfRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("leads_desk.pdf");
    });
  };

  const runReport = () => {
    const content = document.getElementById("main-content").innerHTML;
  
    const printContents = `
      <html>
        <head>
          <title>Lead Return Report – ${selectedCase?.caseNo} – ${selectedCase?.caseName}</title>
          <style>
            @media print {
              body {
                font-family: Arial, sans-serif;
                margin: 10px;
                color: #000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
  
              h1, h2 {
                text-align: center;
                margin-bottom: 15px;
              }
  
              table {
                width: 100% !important;
                border-collapse: collapse;
                table-layout: auto !important;
                word-wrap: break-word !important;
                font-size: 11px;
                overflow: visible !important;
              }
  
              th, td {
                border: 1px solid #000;
                padding: 5px;
                text-align: left;
                vertical-align: top;
                white-space: normal !important;
                word-break: break-word !important;
                overflow: visible !important;
              }
  
              /* Explicitly ensure containers don't hide overflow content */
              div, span, p {
                overflow: visible !important;
                white-space: normal !important;
                word-break: break-word !important;
              }
  
              /* Explicitly remove height constraints */
              .case-summary, .lead-return-id, .lead-instruction {
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
              }
  
              /* Ensure flex/grid layouts do not constrain content */
              .container, .row, .col, .content, .main-content {
                display: block !important;
                overflow: visible !important;
                width: 100% !important;
                height: auto !important;
                max-height: none !important;
                flex: none !important;
                grid: none !important;
              }
  
              /* Inputs and textareas clearly displayed */
              input, textarea {
                border: none !important;
                width: 100% !important;
                height: auto !important;
                box-sizing: border-box !important;
                resize: none !important;
                overflow: visible !important;
                white-space: normal !important;
                word-break: break-word !important;
              }
  
              /* Header labels explicitly styled for clarity */
              .single-line-header {
                white-space: nowrap !important;
                font-weight: bold !important;
                vertical-align: top !important;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  
    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.open();
    printWindow.document.write(printContents);
    printWindow.document.close();
    printWindow.focus();
  
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  
    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  
  //   const onShowCaseSelector = (route) => {
  //     navigate(route, { state: { caseDetails } });
  // };
  
  
  return (
    <div ref={pdfRef} className="lead-desk-page">
      <Navbar />

      <div className="main-content-ld">
      <div className="sideitem">
                    <ul className="sidebar-list">
                    {/* <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
                        <li className="sidebar-item" onClick={() => navigate('/createlead')}>Create Lead</li>
                        <li className="sidebar-item" onClick={() => navigate("/leadlog", { state: { caseDetails } } )} >View Lead Log</li>
                        <li className="sidebar-item" onClick={() => navigate('/OfficerManagement')}>Officer Management</li>
                        <li className="sidebar-item"onClick={() => navigate('/casescratchpad')}>Case Scratchpad</li>
                        <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
                        <li className="sidebar-item"onClick={() => navigate('/LeadHierarchy1')}>View Lead Hierarchy</li>
                        <li className="sidebar-item">Generate Report</li>
                        <li className="sidebar-item"onClick={() => navigate('/FlaggedLead')}>View Flagged Leads</li>
                        <li className="sidebar-item"onClick={() => navigate('/ViewTimeline')}>View Timeline Entries</li>
                        <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li>

                        <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li> */}

                            {/* Case Information Dropdown */}
        <li className="sidebar-item" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Management {caseDropdownOpen ? "▼" : "▲" }
        </li>
        {caseDropdownOpen && (
          <ul className="dropdown-list1">
              <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
              <li className="sidebar-item" onClick={() => navigate("/LeadLog")}>
              View Lead Log
            </li>
            <li className="sidebar-item" onClick={() => navigate("/OfficerManagement")}>
              Officer Management
            </li>
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Case Scratchpad
            </li>
            <li className="sidebar-item" onClick={() => navigate("/LeadHierarchy")}>
              View Lead Hierarchy
            </li>
            <li className="sidebar-item" onClick={() => navigate("/ViewHierarchy")}>
              Generate Report
            </li>
            <li className="sidebar-item" onClick={() => navigate("/FlaggedLead")}>
              View Flagged Leads
            </li>
            <li className="sidebar-item" onClick={() => navigate("/ViewTimeline")}>
              View Timeline Entries
            </li>
            <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li>

            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk" )} >View Leads Desk</li>
            <li className="sidebar-item" onClick={() => navigate("/HomePage" )} >Go to Home Page</li>

         
          </ul>
        )}


                                 {/* Lead Management Dropdown */}
                                 <li className="sidebar-item" onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Management {leadDropdownOpen ?  "▼" : "▲"}
        </li>
        {leadDropdownOpen && (
          <ul className="dropdown-list1">
            <li className="sidebar-item" onClick={() => navigate("/CreateLead")}>
              New Lead
            </li>
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" onClick={() => navigate("/ViewHierarchy")}>
              View Lead Chain of Custody
            </li>
          </ul>
        )} 

                    </ul>
                </div>
        {/* Left Section */}
        {/* <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
            alt="Police Department Logo"
            className="police-logo-cl"
          />
        </div> */}

        {/* Center Section */}
        {/* <div className="center-section-ld">
          <h1 className="title">LEADS DESK</h1>
          <h1>
               Case: {selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"}
          </h1>
        </div>
      </div> */}
          <div className="left-content">

                <div className="case-header">
                  <h2 className="">LEADS DESK</h2>
                </div>

                <div className="center-section-ld">
          <h1>
               Case: {selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"}
          </h1>
        </div>

      <div className="bottom-sec-ld" id="main-content">

      <div className = "case-summary-ld">
                <label className="input-label">Case Summary</label>
                        <textarea
                            className="textarea-field"
                            value={caseSummary}
                            onChange={handleCaseSummaryChange}
                            readOnly={!isEditing} // Read-only when not in edit mode
                        ></textarea>

                         {/* <button className="save-btn1" onClick={handleSaveClick}>Save</button> */}
                 {/* Buttons: Show "Edit" when not editing, "Save" when editing */}
                 {/* {!isEditing ? (
                            <button className="edit-btn1" onClick={handleEditClick}>Edit</button>
                        ) : (
                            <button className="save-btn1" onClick={handleSaveClick}>Save</button>
                        )} */}
                </div>
    <div className="search_and_hierarchy_container">
    <div className="search-bar">
      <div className="search-container1">
      <i className="fa-solid fa-magnifying-glass"></i>
      <input
        type="text"
        className="search-input1"
        placeholder="Search Lead"
      />
      {/* <button className="search-button">Search</button> */}
      </div>
      </div>
    </div>

        {/* Loop through multiple leads */}
        {leadsData.map((lead, leadIndex) => (
          <div key={leadIndex} className="lead-section">
            

            {/* Leads Table */}
            <div className="leads-container">
            <table className="table-heading">
                  <tbody>
                    <tr>
                      <td className="table-label">Lead Number:</td>
                      <td className="table-input">
                      <input
                            type="text"
                            value={lead.leadNo}
                            // className="lead-input1"
                             className = "input-field"
                            // style={{ fontSize: '20px', padding: '10px', textAlign: 'center' }}
                            readOnly
                          />

                      </td>

                      <td className="table-label">Lead Origin:</td>
                      <td className="table-input">
                           <input
                            type="text"
                            value={lead.parentLeadNo}
                            // className="lead-input1"
                            className = "input-field"
                            // style={{ fontSize: '20px', padding: '10px', textAlign: 'center' }}
                            readOnly
                          />

                      </td>

                      <td className="table-label">Assigned Date:</td>
                      <td className="table-input">
                        <input type="text" value={formatDate(lead.assignedDate)} className="input-field" readOnly />
                        
                      </td>
                    </tr>

                    <tr>
                      <td className="table-label">Assigned Officers:</td>
                      <td className="table-input" colSpan={5}>
                        <input type="text" value={lead.assignedTo} className="input-field" readOnly />
                      </td>
                    </tr>
                    <tr>
                      <td className="table-label">Lead Hierarchy:</td>
                      <td className="table-input" colSpan={5}>
                        <input type="text" value={lead.leadHierarchy} className="input-field" readOnly />
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
          value={lead.description}
          className="instruction-input"
          readOnly
        />
      </td>
    </tr>

    {lead.leadReturns && lead.leadReturns.length > 0 ? (
      lead.leadReturns.map((returnItem) => (
        <React.Fragment key={returnItem._id}>
          <tr>
          <td>{`Lead Return ID: ${returnItem.leadReturnId}`}</td>
            <td>
              <textarea
                className="lead-return-input"
                value={returnItem.leadReturnResult}
                readOnly
                style={{
                  fontSize: "20px",
                  padding: "10px",
                  borderRadius: "6px",
                  width: "100%",
                  resize: "none",
                  overflow: "hidden",
                  height: "auto",
                  // fontFamily: "Segoe UI",
                  fontFamily:"Arial",
                }}
                rows={Math.max(returnItem.leadReturnResult.length / 50, 2)}
              />
            </td>
          </tr>
          <tr>
  <td colSpan={2}>
    {returnItem.persons && returnItem.persons.length > 0 && (
      <div className="person-section">
        <h2 className="title">Person Details</h2>
        <table className="lead-table2" style={{ width: '100%', tableLayout: 'fixed' }}>
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
                <td>{person.enteredDate}</td>
                <td>
                  {person.firstName
                    ? `${person.firstName || ''}, ${person.lastName || ''}`
                    : 'N/A'}
                </td>
                <td>{person.cellNumber}</td>
                <td>
                  {person.address
                    ? `${person.address.street1 || ''}, ${person.address.city || ''}, ${person.address.state || ''}, ${person.address.zipCode || ''}`
                    : 'N/A'}
                </td>
                <td>
                  <button className="download-btn" onClick={() =>
                              openPersonModal(
                                lead.leadNo,
                                lead.description,
                                selectedCase.caseNo,
                                selectedCase.caseName,
                                returnItem.leadReturnId
                              )
                            }>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </td>
  {/* Render the PersonModal conditionally */}
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
        <h2 className="title">Vehicles Details</h2>
        <table className="lead-table2" style={{ width: '100%', tableLayout: 'fixed' }}>
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
                  <td>{vehicle.enteredDate}</td>

        <td>{vehicle.make}</td>
        <td>{vehicle.model}</td>
        <td >
        <div style={{ display: 'flex', alignItems: 'center' }}> 
        {/* justifyContent: 'center' */}
          <span style={{ width: '60px', display: 'inline-block' }}>{vehicle.primaryColor}</span>
          <div
            style={{
              width: '18px',
              height: '18px',
              backgroundColor: vehicle.primaryColor,
              marginLeft: '15px',
              border: '1px solid #000',
            }}
          ></div>
        </div>
      </td>
    
        <td>{vehicle.plate}</td>
        <td>{vehicle.state}</td>
        <td> <button className="download-btn" onClick={() => openVehicleModal(
                      lead.leadNo,
                      lead.description,
                      selectedCase.caseNo,
                      selectedCase.caseName,
                      returnItem.leadReturnId,
                      returnItem.leadsDeskCode // Including Leads Desk Code

                    )}>View</button></td>
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
    description={vehicleModalData.description}
    caseNo={vehicleModalData.caseNo}
    caseName={vehicleModalData.caseName}
    leadReturnId={vehicleModalData.leadReturnId}
    leadsDeskCode={vehicleModalData.leadsDeskCode} // Passing Leads Desk Code
  />
</tr>

<tr>
  <td colSpan={2}>
      <div className="person-section">
        <h2 className="title">Uploaded Files</h2>
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
                        <a href="#" onClick={(e) => { e.preventDefault(); openMediaModal(file); }}>
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
      </div>
  </td>
  <MediaModal isOpen={showMediaModal} onClose={closeMediaModal} media={selectedMedia} />

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
                   
            {/* <div className="person-section">
              <h2 className="title">Uploaded Files</h2>

              <table className="lead-table1">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Sharing</th>
                    <th>Modified</th>
                    <th>Size</th>
                    <th style={{ width: "150px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedFiles.map((file) => {
                      const fileTypeLower = file.type.toLowerCase();

                      const isDocument = ["doc", "docx", "pdf"].includes(fileTypeLower);
                    return (
                      <tr key={file.id}>
                        <td>
                          {isDocument ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {file.name}
                            </a>
                          ) : (
                            file.name
                          )}
                        </td>
                        <td>{file.sharing}</td>
                        <td>{file.modified}</td>
                        <td>{file.size}</td>
                        <td>
                          <button
                            className="download-btn"
                            onClick={() => handleDownload(file)}
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div> */}
                               

            </div>
          </div>
        ))}
                <div className="p-6">
                <Pagination
  currentPage={currentPage}
  totalEntries={totalEntries}  // Automatically calculate total entries
  onPageChange={setCurrentPage} // Update current page state
  pageSize={pageSize}
  onPageSizeChange={setPageSize} // Update page size state
/>
    </div>
      </div>
      
      <div className = "last-sec">
      <div className = "btn-sec">
      <button className="save-btn1"  onClick={() => runReport()}>
            Run Report
          </button>
      </div>

       {/* FootBar with navigation */}
       <FootBar onPrevious={() => navigate(-1)} />

      </div>

    </div>
    </div>
    </div>
  );
};