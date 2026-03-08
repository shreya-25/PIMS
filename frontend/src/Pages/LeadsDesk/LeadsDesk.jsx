import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar/Navbar";
import FootBar from "../../components/FootBar/FootBar";
import { useDataContext } from "../Context/DataContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { CaseContext } from "../CaseContext";
import PersonModal from "../../components/PersonModal/PersonModel";
import CaseHeaderSection from "../../components/CaseHeaderSection/CaseHeaderSection";
import ReactQuill from "react-quill";
import RichTextEditor from "../../components/RichTextEditor/RichTextEditor";

import ExecSummaryModal from "../../components/ExecSummaryModal/ExecSummaryModal";
import VehicleModal from "../../components/VehicleModal/VehicleModal";
import Pagination from "../../components/Pagination/Pagination";
import { jsPDF } from "jspdf"; // if still used elsewhere
import html2canvas from "html2canvas";
import api from "../../api"; // adjust the path as needed


import styles from "./LeadsDesk.module.css";

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

function CollapsibleSection({ title, defaultOpen = true, rightSlot = null, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={styles.collapsible}>
      <header
        className={styles["collapsible__header"]}
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setOpen(o => !o) : null)}
      >
        <div className={styles["collapsible__title"]}>
          <span className={styles.chev}>{open ? "▾" : "▸"}</span> {title}
        </div>
        {rightSlot ? <div onClick={(e) => e.stopPropagation()}>{rightSlot}</div> : null}
      </header>
      {open && <div className={styles["collapsible__body"]}>{children}</div>}
    </section>
  );
}

// Normalize parentLeadNo into an array of strings
const toArray = (val) => {
  if (Array.isArray(val)) return val.map(String);
  if (val == null) return [];
  if (typeof val === "number") return [String(val)];
  if (typeof val === "string") {
    return val
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
};




// ---------- Fetch one lead (with returns, persons, vehicles) ----------
const fetchSingleLeadFullDetails = async (leadNo, caseNo, caseName, token) => {
  try {
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
// const fetchLeadHierarchyFullDetails = async (leadNo, caseNo, caseName, token, chain = []) => {
//   const currentLead = await fetchSingleLeadFullDetails(leadNo, caseNo, caseName, token);
//   if (!currentLead) {
//     return [chain];
//   }
//   const updatedChain = [...chain, currentLead];
//   if (!currentLead.parentLeadNo || currentLead.parentLeadNo.length === 0) {
//     return [updatedChain];
//   }
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

const fetchLeadHierarchyFullDetails = async (
  leadNo,
  caseNo,
  caseName,
  token,
  chain = [],
  visited = new Set()
) => {
  const key = String(leadNo);
  if (visited.has(key)) return [chain]; // prevent loops
  visited.add(key);

  const current = await fetchSingleLeadFullDetails(leadNo, caseNo, caseName, token);

  // If the *first* fetch fails, return [] (not [chain])
  if (!current && chain.length === 0) return [];
  if (!current) return [chain];

  const updated = [...chain, current];
  const parents = toArray(current.parentLeadNo);
  if (parents.length === 0) return [updated];

  let all = [];
  for (const p of parents) {
    const sub = await fetchLeadHierarchyFullDetails(p, caseNo, caseName, token, updated, visited);
    all.push(...sub);
  }
  return all;
};



export const LeadsDesk = () => {
  // useEffect(() => {
  //   document.body.style.overflow = "hidden";
  //   return () => {
  //     document.body.style.overflow = "auto";
  //   };
  // }, []);

  const navigate = useNavigate();
  const pdfRef = useRef();
  const { selectedCase, setSelectedLead, setLeadStatus } = useContext(CaseContext);
  const { persons } = useDataContext();
      const location = useLocation();

  // ------------------ State ------------------
  const [leadsData, setLeadsData] = useState([]);
  const [hierarchyLeadsData, setHierarchyLeadsData] = useState([]);
  const [hierarchyChains, setHierarchyChains] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExecFileModal, setShowExecFileModal] = useState(false);
  const [execSummaryFile, setExecSummaryFile] = useState(null);

  const [useFileUpload, setUseFileUpload] = useState(false);
  const [useWebpageSummary, setUseWebpageSummary] = useState(true);
  const [webpageUrl, setWebpageUrl] = useState("");
  const [typedSummary, setTypedSummary] = useState("");
  const saveTimeout = useRef(null);
    const { leadDetails, caseDetails } = location.state || {};

  const [reportScope, setReportScope] = useState("all"); // 'all' | 'visible' | 'selected'
const [selectedForReport, setSelectedForReport] = useState(() => new Set());

// Range just for the "selected subset" flow
const [subsetRange, setSubsetRange] = useState({ start: "", end: "" });

const getDeletedReason = (lead) => lead?.deletedReason || "";
const isDeletedStatus = (s) => String(s ?? "").trim().toLowerCase() === "deleted";



const applySubsetRange = () => {
  const min = parseInt(subsetRange.start, 10);
  const max = parseInt(subsetRange.end, 10);
  if (Number.isNaN(min) || Number.isNaN(max)) {
    alert("Please enter valid numeric lead numbers.");
    return;
  }
  const filtered = leadsData.filter((lead) => {
    const n = parseInt(lead.leadNo, 10);
    return !Number.isNaN(n) && n >= min && n <= max;
  });
  setHierarchyLeadsData(filtered);   // show only that range
  setHierarchyChains([]);            // clear hierarchy view
};

const clearSubsetRange = () => {
  setSubsetRange({ start: "", end: "" });
  setHierarchyLeadsData([]);         // fallback to all leads
  setHierarchyChains([]);
};


// Toggle a lead in/out of the selected subset
const toggleLeadForReport = (leadNo) => {
  setSelectedForReport((prev) => {
    const next = new Set(prev);
    if (next.has(leadNo)) next.delete(leadNo);
    else next.add(leadNo);
    return next;
  });
};

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

  // Case summary
  const [caseSummary, setCaseSummary] = useState('');
  const caseSummarySaveTimer = useRef(null);

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


  // ------------------ Show Hierarchy / Show All Leads ------------------
  const handleShowHierarchy = async () => {
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

  const handleLeadClick = (lead) => {
    setSelectedLead({
      leadNo: lead.leadNo,
      incidentNo: lead.incidentNo,
      leadName: lead.description,
      dueDate: lead.dueDate || "",
      priority: lead.priority || "Medium",
      flags: lead.flags || [],
      assignedOfficers: lead.assignedTo ? lead.assignedTo.map((a) => a.username) : [],
      leadStatus: lead.leadStatus,
      caseName: lead.caseName || selectedCase.caseName,
      caseNo: lead.caseNo || selectedCase.caseNo,
      summary: lead.summary
    });
    setLeadStatus(lead.leadStatus);

    // Navigate to Lead Review Page
    navigate("/leadReview", {
      state: {
        leadDetails: lead,
        caseDetails: selectedCase
      }
    });
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

  // Reset to page 1 whenever the displayed data changes
  useEffect(() => { setCurrentPage(1); }, [leadsData, hierarchyLeadsData]);

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

  useEffect(() => {
    if (!selectedCase?.caseNo) return;
    clearTimeout(caseSummarySaveTimer.current);
    caseSummarySaveTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        await api.put(
          "/api/cases/case-summary",
          { caseNo: selectedCase.caseNo, caseName: selectedCase.caseName, caseSummary },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Failed to save case summary", err);
      }
    }, 2000);
    return () => clearTimeout(caseSummarySaveTimer.current);
  }, [caseSummary, selectedCase?.caseNo]);
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
      {leadNumbers.length > 2 && (expanded ? "▲ Shrink" : "▼ Expand")}
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
      const payload = {
        user: "Officer 916",
        reportTimestamp: new Date().toLocaleString(),
        caseNo: selectedCase.caseNo,
        caseName: selectedCase.caseName,
        caseSummary: typedSummary,
        selectedReports: { FullReport: true },
        summaryMode: "none",
        reportScope: "all",
      };
      const response = await api.post(
        "/api/report/generateCase",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");
    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Error generating PDF");
    }
  };

  const toNum = (v) => {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  return s ? Number.parseInt(s, 10) : NaN;
};

  // Helper: compute report params for server-side filtering
const computeReportParams = () => {
  if (reportScope === "all" || reportScope === "visible") {
    return { reportScope: "all" };
  }
  if (reportScope === "selected") {
    const min = toNum(subsetRange.start);
    const max = toNum(subsetRange.end);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return null;
    return { reportScope: "selected", subsetRange: { start: min, end: max } };
  }
  return { reportScope: "all" };
};

const [summaryMode, setSummaryMode] = useState('none'); // 'none' | 'type' | 'file'
const handleSummaryMode = (mode) => setSummaryMode(mode);

useEffect(() => {
  if (summaryMode === 'type') {
    setUseWebpageSummary(true);
    setUseFileUpload(false);
  } else if (summaryMode === 'file') {
    setUseWebpageSummary(false);
    setUseFileUpload(true);
  } else {
    setUseWebpageSummary(false);
    setUseFileUpload(false);
  }
}, [summaryMode]);





   // New function to run the report and merge it with an uploaded executive summary document
   const handleRunReportWithSummary = async () => {
    const token = localStorage.getItem("token");
    const reportParams = computeReportParams();
    if (reportScope === "selected" && !reportParams) {
      alert("No leads selected for the subset.");
      return;
    }

    if (useWebpageSummary) {
      try {
        const payload = {
          user: "Officer 916",
          reportTimestamp: new Date().toLocaleString(),
          caseNo: selectedCase.caseNo,
          caseName: selectedCase.caseName,
          caseSummary: typedSummary,
          selectedReports: { FullReport: true },
          summaryMode,
          ...reportParams,
        };
        const response = await api.post(
          "/api/report/generateCase",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            responseType: "blob",
          }
        );
        const file = new Blob([response.data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, "_blank");
      } catch (error) {
        console.error("Failed to generate report", error);
        alert("Error generating PDF");
      }
  }

  else if (useFileUpload && execSummaryFile) {
    try {
      const formData = new FormData();
      formData.append("user", "Officer 916");
      formData.append("reportTimestamp", new Date().toLocaleString());
      formData.append("caseNo", selectedCase.caseNo);
      formData.append("caseName", selectedCase.caseName);
      formData.append("selectedReports", JSON.stringify({ FullReport: true }));
      formData.append("reportScope", reportParams?.reportScope || "all");
      if (reportParams?.subsetRange) {
        formData.append("subsetRange", JSON.stringify(reportParams.subsetRange));
      }
      formData.append("execSummaryFile", execSummaryFile);

      const response = await api.post(
        "/api/report/generateCaseExecSummary",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );
      const fileBlob = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(fileBlob);
      window.open(fileURL, "_blank");
    } catch (err) {
      console.error("Error generating PDF with upload:", err);
      alert("Failed to generate report with uploaded summary");
    }
  }
  
  };

  



  // ------------------ Render Leads Table ------------------
  const renderLeads = (leadsArray) => {
  return leadsArray.map((lead, leadIndex) => {
    // Be compatible with your earlier helpers if they exist
    const isDeleted =
      typeof isDeletedStatus === "function"
        ? isDeletedStatus(lead?.leadStatus)
        : String(lead?.leadStatus ?? "")
            .trim()
            .toLowerCase() === "deleted";

    const deletedReason =
      typeof getDeletedReason === "function"
        ? getDeletedReason(lead)
        : (lead?.deletedReason ||
           lead?.deletedReasonText ||
           lead?.deleteReason ||
           lead?.reason ||
           "");

    return (
      <div
        key={leadIndex}
        className={`${styles["lead-section"]} ${isDeleted ? styles["is-deleted"] : ""}`}
      >
        {/* <div className="lead-section-head" style={{ marginBottom: 8 }}>
          <label style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
            <input
              type="checkbox"
              checked={selectedForReport.has(String(lead.leadNo))}
              onChange={() => toggleLeadForReport(String(lead.leadNo))}
            />
            <span className="summaryOptionText">Include this lead in subset</span>
          </label>
        </div> */}
        <div className={styles["leads-container"]}>
          <table className={styles["lead-details-table"]}>
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
                <td className={styles["label-cell"]}>Lead Number</td>
                <td className={styles["input-cell"]}>
                  <span
                    onClick={() => handleLeadClick(lead)}
                    style={{
                      textDecoration: 'underline',
                      color: '#007bff',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {lead.leadNo}
                  </span>
                </td>
                <td className={styles["label-cell"]}>Lead Origin</td>
                <td className={styles["input-cell"]}>
                  <input
                    type="text"
                    value={lead.parentLeadNo ? lead.parentLeadNo.join(", ") : ""}
                    readOnly
                  />
                </td>
                <td className={styles["label-cell"]}>Assigned Date</td>
                <td className={styles["input-cell"]}>
                  <input type="text" value={formatDate(lead.assignedDate)} readOnly />
                </td>
                <td className={styles["label-cell"]}>Approved Date</td>
                <td className={styles["input-cell"]}>
                  <input type="text" value={formatDate(lead.approvedDate)} readOnly />
                </td>
              </tr>
              <tr>
                <td className={styles["label-cell"]}>Assigned Officers</td>
                <td className={styles["input-cell"]} colSpan={7}>
                  <input
                    type="text"
                    value={
                      Array.isArray(lead.assignedTo) && lead.assignedTo.length
                        ? lead.assignedTo.map((a) => a.username).join(", ")
                        : ""
                    }
                    readOnly
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <table className={styles["leads-table"]}>
            <tbody>
              {/* Lead Instruction */}
              <tr className={styles["table-first-row"]}>
                <td
                  style={{ textAlign: "center", fontSize: "18px" }}
                  className={styles["input-cell"]}
                >
                  Lead Instruction
                </td>
                <td>
                  <input
                    type="text"
                    value={lead.description || ""}
                    className={styles["instruction-input"]}
                    readOnly
                  />
                </td>
              </tr>

              {/* NEW: Deleted Reason (only when deleted) */}
              {isDeleted && (
                <tr className={styles["deleted-row"]}>
                  <td      style={{ textAlign: "center", fontSize: "18px" }} className={styles["label-cell"]}>Deleted Reason</td>
                  <td>
                    <input
                      type="text"
                      value={deletedReason || "N/A"}
                      readOnly
                      className={styles["instruction-input"]}
                    />
                  </td>
                </tr>
              )}

              {lead.leadReturns && lead.leadReturns.length > 0 ? (
                lead.leadReturns.map((returnItem) => (
                  <React.Fragment key={returnItem._id || returnItem.leadReturnId}>
                    <tr>
                      <td style={{ textAlign: "center", fontSize: "18px" }}>
                        {`Lead Return ID: ${returnItem.leadReturnId}`}
                      </td>
                      <td>
                        <textarea
                          className={styles["lead-return-input"]}
                          value={returnItem.leadReturnResult || ""}
                          readOnly
                          style={{
                            fontSize: "18px",
                            padding: "10px",
                            borderRadius: "6px",
                            width: "100%",
                            resize: "none",
                            height: "auto",
                            fontFamily: "Arial",
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                          }}
                          rows={Math.max(
                            (returnItem.leadReturnResult || "").length / 50,
                            2
                          )}
                        />
                      </td>
                    </tr>

                    {/* Persons */}
                    {returnItem.persons && returnItem.persons.length > 0 && (
                    <tr>
                      <td colSpan={2}>
                        <div className={styles["person-section"]}>
                            <h3 className={styles["title-ld"]}>Person Details</h3>
                            <table
                              className={styles["lead-table2"]}
                              style={{ width: "100%", tableLayout: "fixed" }}
                            >
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
                                    <td
                                      style={{
                                        whiteSpace: "normal",
                                        wordWrap: "break-word",
                                      }}
                                    >
                                      {person.address
                                        ? `${person.address.street1 || ""}, ${
                                            person.address.city || ""
                                          }, ${person.address.state || ""}, ${
                                            person.address.zipCode || ""
                                          }`
                                        : "N/A"}
                                    </td>
                                    <td>
                                      <button
                                        className={styles["download-btn"]}
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
                    )}

                    {/* Vehicles */}
                    {returnItem.vehicles && returnItem.vehicles.length > 0 && (
                    <tr>
                      <td colSpan={2}>
                        <div className={styles["person-section"]}>
                            <h3 className={styles["title-ld"]}>Vehicles Details</h3>
                            <table
                              className={styles["lead-table2"]}
                              style={{ width: "100%", tableLayout: "fixed" }}
                            >
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
                                        />
                                      </div>
                                    </td>
                                    <td>{vehicle.plate}</td>
                                    <td>{vehicle.state}</td>
                                    <td>
                                      <button
                                        className={styles["download-btn"]}
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
                    )}
                    <MediaModal
                      isOpen={showMediaModal}
                      onClose={closeMediaModal}
                      media={selectedMedia}
                    />
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center" }}>
                    No Lead Returns Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  });
};


  const activeLeads = hierarchyLeadsData.length > 0 ? hierarchyLeadsData : leadsData;
  const totalEntries = activeLeads.length;
  const pagedLeads = activeLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div ref={pdfRef} className={styles["lead-desk-page"]}>
      <Navbar />

      <div className={styles["main-content-ld-ExecSummary"]}>
        {/* <div className="sideitem">
          <ul className="sidebar-list">
            <li className="sidebar-item">Case Information</li>
            <li className="sidebar-item" onClick={() => navigate("/CasePageManager")}>Case Page</li>
            <li className="sidebar-item" onClick={() => navigate("/CreateLead")}>New Lead</li>
            <li className="sidebar-item" onClick={() => navigate("/SearchLead")}>Search Lead</li>
            <li className="sidebar-item">View Lead Return</li>
            <li className="sidebar-item" onClick={() => navigate("/ViewHierarchy")}>View Lead Chain of Custody</li>
            <li className="sidebar-item" onClick={() => navigate("/LeadLog")}>View Lead Log</li>
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>View/Add Case Notes</li>
            <li className="sidebar-item" onClick={() => navigate("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => navigate("/ViewTimeline")}>View Timeline Entries</li>
            <li className="sidebar-item active" onClick={() => navigate("/LeadsDesk")}>View Leads Desk</li>
            <li className="sidebar-item" onClick={() => navigate("/HomePage")}>Go to Home Page</li>
          </ul>
        </div> */}

        <div className={styles["right-sec"]}>

         <div className={styles["ld-head"]}>
  <Link to="/HomePage" className={styles.crumb}>PIMS Home</Link>
  <span className={styles.sep}>{" >> "}</span>
  <Link
    to={selectedCase?.role === "Investigator" ? "/Investigator" : "/CasePageManager"}
    state={{ caseDetails: selectedCase }}
    className={styles.crumb}
  >
    Case Page: {selectedCase.caseNo || ""} - {selectedCase.caseName || "Unknown Case"}
  </Link>
  <span className={styles.sep}>{" >> "}</span>
  <span className={styles["crumb-current"]} aria-current="page">Leads Desk</span>
</div>

          {/* <div className="header-ld-exec"> */}
        {/* <div className="case-header-ldExecSummary">
            <h2>GENERATE REPORT</h2>
          </div> */}
          {/* <div className="center-section-ldExecSummary">
            <h1 onClick={() => navigate("/LeadsDesk")} style={{ cursor: 'pointer' }}>
              CASE: {selectedCase.caseNo || "N/A"} | {selectedCase.caseName.toUpperCase() || "Unknown Case"}
            </h1>
          </div> */}
          {/* </div> */}


              

             {/* <div className="top-menu">
        <div className="menu-items">
           <span className="menu-item " onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )}>
            Leads Desk
          </span>
        <span className="menu-item active " onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )}>
            Generate Report
          </span>
          <span className="menu-item" onClick={() => navigate("/CaseScratchpad", { state: { caseDetails } } )}>
            Add/View Case Notes
          </span>
          <span className="menu-item" onClick={() => navigate('/SearchLead', { state: { caseDetails } } )} >
            Advanced Search
          </span>
          <span className="menu-item" onClick={() => navigate("/ViewTimeline", { state: { caseDetails } } )}>
          View Timelines
          </span>
   
         </div>
       </div> */}

       <div className={styles["down-content"]}>
          {summaryMode === 'type' && (
        <div className={styles["exec-summary-sec"]}>
          <h3>Executive Summary</h3>

<textarea
  className={styles["summary-input"]}
  placeholder="Type here..."
  value={typedSummary}
  onChange={e => setTypedSummary(e.target.value)}
  disabled={!useWebpageSummary}
  style={{ opacity: useWebpageSummary ? 1 : 0.5 }}
/>

        </div>
          )}


        {/* <div className="left-content-execSummary"> */}
        <div className={styles["ld-content-bottom"]}>

        {/* <div className="case-header">
            <h2>LEADS DESK</h2>
          </div>
          <div className="center-section-ld">
            <h1>
              CASE: {selectedCase.caseNo || "N/A"} | {selectedCase.caseName.toUpperCase() || "Unknown Case"}
            </h1>
          </div> */}

          <div className={styles["bottom-sec-ldExecSummary"]} id="main-content">
            <CollapsibleSection title="Case Summary" defaultOpen={true}>
            <div className={styles["case-summary-ld"]}>
              <textarea
                className={styles["textarea-field-ld"]}
                style={{ fontFamily: "inherit", fontSize: "18px" }}
                value={caseSummary}
                onChange={handleCaseSummaryChange}
              ></textarea>
            </div>
            </CollapsibleSection>


              {/* <CaseHeaderSection /> */}

<CollapsibleSection title="Select Leads to View (Range)" defaultOpen={true}>
  <div className={styles["range-filter"]}>
    <div className={styles["range-filter__label"]}> Lead range</div>

    <div className={styles["range-filter__row"]}>
      <input
        id="lead-range-from"
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        className={styles["range-filter__input"]}
        placeholder="From lead #"
        value={selectStartLead1}
        onChange={(e) => setSelectStartLead1(e.target.value)}
        aria-label="From lead number"
      />

      <span className={styles["range-filter__sep"]}>—</span>

      <input
        id="lead-range-to"
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        className={styles["range-filter__input"]}
        placeholder="To lead #"
        value={selectEndLead2}
        onChange={(e) => setSelectEndLead2(e.target.value)}
        aria-label="To lead number"
      />

      <div className={styles["range-filter__actions"]}>
        <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={handleShowLeadsInRange}>
          Apply
        </button>
        <button className={`${styles.btn} ${styles["btn-secondary"]}`} onClick={handleShowAllLeads}>
          Clear
        </button>
        <p className={styles["range-filter__hint"]}>Enter a lead number range (e.g., 1200 — 1250) and click Apply.</p>
      </div>
    </div>
  </div>
</CollapsibleSection>


<CollapsibleSection title="View Lead Hierarchy" defaultOpen={true}>
  <div className={styles["hierarchy-filter"]}>
    <div className={styles["hierarchy-filter__label"]}>Lead chain lookup</div>

    <form
      className={styles["hierarchy-filter__row"]}
      onSubmit={(e) => {
        e.preventDefault();
        handleShowHierarchy();
      }}
    >
      <input
        id="hierarchy-lead"
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        className={styles["hierarchy-filter__input"]}
        placeholder="Lead # (e.g., 1234)"
        value={hierarchyLeadInput}
        onChange={(e) => setHierarchyLeadInput(e.target.value)}
        aria-label="Lead number"
      />

      <div className={styles["hierarchy-filter__actions"]}>
        <button
          type="submit"
          className={`${styles.btn} ${styles["btn-primary"]}`}
          // disabled={!String(hierarchyLeadInput).trim()}
        >
          Show Hierarchy
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles["btn-secondary"]}`}
          onClick={handleShowAllLeads}
        >
          Clear
        </button>
        <p className={styles["hierarchy-filter__hint"]}>
          Enter a lead number to view its parent/child chain of custody.
        </p>
      </div>
    </form>
  </div>
</CollapsibleSection>


{/* <CollapsibleSection title="Generate Report" defaultOpen={true}>
  <div className="summaryModeRow">
  <label className="summaryOption">
      <input
        type="radio"
        name="summary-mode"
        value="type"
        checked={summaryMode === 'type'}
        onChange={() => handleSummaryMode('type')}
      />
      <span className="summaryOptionText">Type summary manually</span>
    </label>
 <label className="summaryOption">      <input
        type="radio"
        name="summary-mode"
        value="file"
        checked={summaryMode === 'file'}
        onChange={() => handleSummaryMode('file')}
      />
          <span className="summaryOptionText">Attach executive report</span>

    </label>
  </div>


  {summaryMode === 'file' && (
    <div style={{ marginBottom: 16 }}>
      <input
        type="file"
        accept=".doc,.docx,.pdf"
        onChange={handleExecSummaryFileChange}
      />
    </div>
  )}

  <div style={{ marginTop: 8 }}>
    <h4>Report Scope</h4>

    <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0" }}>
      <input
        type="radio"
        name="report-scope"
        value="all"
        checked={reportScope === "all"}
        onChange={() => setReportScope("all")}
      />
      <span className="summaryOptionText">All leads in the case</span>
    </label>

    <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0" }}>
      <input
        type="radio"
        name="report-scope"
        value="selected"
        checked={reportScope === "selected"}
        onChange={() => setReportScope("selected")}
      />
      <span className="summaryOptionText">Manually selected subset (via checkboxes next to each lead)</span>

    </label>

 {reportScope === "selected" && (
  <div style={{ margin: "8px 0 12px" }}>
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <span className="summaryOptionText">Limit visible leads by range:</span>
      <input
        type="text"
        placeholder="From #"
        value={subsetRange.start}
        onChange={(e) => setSubsetRange((r) => ({ ...r, start: e.target.value }))}
        style={{ width: 100, padding: "6px 8px" }}
      />
      <span>—</span>
      <input
        type="text"
        placeholder="To #"
        value={subsetRange.end}
        onChange={(e) => setSubsetRange((r) => ({ ...r, end: e.target.value }))}
        style={{ width: 100, padding: "6px 8px" }}
      />
      <button  type="submit" className="btn btn-primary" onClick={applySubsetRange}>Apply</button>
      <button  type="submit" className="btn btn-secondary"   onClick={clearSubsetRange}>Clear</button>

      <span className="hierarchy-filter__hint"> Only leads in this range will be displayed below. Tick the checkboxes to include them in the subset.
    </span>
    </div>
  </div>
)}
  </div>

  <button type="submit" className="btn btn-primary" onClick={handleRunReportWithSummary}>
    Run Report
  </button>
</CollapsibleSection> */}


              <div className={styles["search-lead-portion"]}>
            <div className={styles["search-lead-head"]}>
            <label className={styles["input-label1"]}>Search Lead</label>
            </div>
            <div className={styles["search_and_hierarchy_container"]}>
              <div className={styles["search-bar"]}>
                <div className={styles["search-container1"]}>
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input type="text" className={styles["search-input1"]} placeholder="Search Lead"
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
               <div className={styles["p-6"]}>
                  <Pagination
                    currentPage={currentPage}
                    totalEntries={totalEntries}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
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
        className={styles["show-more-chains-btn"]}
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
        className={styles["show-more-chains-btn"]}
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


                {renderLeads(pagedLeads)}
              </>
            ) : (
              <>
                {renderLeads(pagedLeads)}
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
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal-content"]} onClick={(e) => e.stopPropagation()}>
        {["jpg", "jpeg", "png"].includes(media.type.toLowerCase()) ? (
          <img src={media.url} alt="Preview" className={styles["modal-media-full"]} />
        ) : ["mp4", "webm", "ogg"].includes(media.type.toLowerCase()) ? (
          <video controls className={styles["modal-media-full"]}>
            <source src={media.url} type={`video/${media.type.toLowerCase()}`} />
            Your browser does not support the video tag.
          </video>
        ) : null}
        <button className={styles["close-btn"]} onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};
