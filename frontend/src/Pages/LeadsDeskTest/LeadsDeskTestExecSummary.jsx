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


import "./LeadsDeskExecSummary.css";

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

const convert12To24 = (time12h) => {
  if (!time12h) return time12h;
  const upper = String(time12h).toUpperCase();
  if (!upper.includes("AM") && !upper.includes("PM")) return time12h;

  const [time, modifier] = upper.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (modifier === "AM") { if (h === 12) h = 0; }
  else { if (h !== 12) h += 12; }
  return `${String(h).padStart(2,"0")}:${m.toString().padStart(2,"0")}`;
};

function CollapsibleSection({ title, defaultOpen = true, rightSlot = null, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="collapsible">
      <header
        className="collapsible__header"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setOpen(o => !o) : null)}
      >
        <div className="collapsible__title">
          <span className="chev">{open ? "▾" : "▸"}</span> {title}
        </div>
        {rightSlot ? <div onClick={(e) => e.stopPropagation()}>{rightSlot}</div> : null}
      </header>
      {open && <div className="collapsible__body">{children}</div>}
    </section>
  );
}


const cleanLeadRecord = (lead) => ({
  ...lead,
  leadNo: String(lead.leadNo ?? ""),
  parentLeadNo: toArray(lead.parentLeadNo),
});

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
    const lead = cleanLeadRecord(leadData[0]);
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

const toArray = (val) => {
  if (Array.isArray(val)) return val.map(String);
  if (val == null) return [];
  if (typeof val === "number") return [String(val)];
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
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
  for (const parentNo of toArray(currentLead.parentLeadNo)) {
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

export const LeadsDeskTestExecSummary = () => {
  // useEffect(() => {
  //   document.body.style.overflow = "hidden";
  //   return () => {
  //     document.body.style.overflow = "auto";
  //   };
  // }, []);

  const navigate = useNavigate();
  const pdfRef = useRef();
  const { selectedCase } = useContext(CaseContext);
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
    const [selectedSingleLeadNo, setSelectedSingleLeadNo] = useState("");
  const [timelineEntries, setTimelineEntries] = useState([]);
const [timelineOrderedLeads, setTimelineOrderedLeads] = useState([]);

  const [reportScope, setReportScope] = useState("all"); // 'all' | 'visible' | 'selected'
const [selectedForReport, setSelectedForReport] = useState(() => new Set());
const [reportType, setReportType] = useState(null); 

const [availableFlags, setAvailableFlags] = useState([]);     // unique flags from timeline
const [selectedFlags, setSelectedFlags] = useState([]); 

// Range just for the "selected subset" flow
const [subsetRange, setSubsetRange] = useState({ start: "", end: "" });

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

const handleLeadCardClick = (e, lead) => {
  // Only react to clicks when the "Single lead" target is active
  if (reportType !== "single") return;

  // Ignore clicks on interactive controls inside the card
  const tag = e.target?.tagName?.toLowerCase();
  if (["button", "a", "input", "textarea", "select", "label"].includes(tag)) return;

  setSelectedSingleLeadNo(String(lead.leadNo));
  // Set scope locally for computeLeadsForReport()
  setReportScope("single");
};

const getLeadsForSelectedFlags = () => {
  if (!selectedFlags.length) return [];
  // leadNos from timeline entries having any of the selected flags
  const allowedNos = new Set(
    (timelineEntries || [])
      .filter(t => Array.isArray(t.timelineFlag) && t.timelineFlag.some(f => selectedFlags.includes(f)))
      .map(t => String(t.leadNo))
  );

  // map to full lead objects from leadsData (dedup), keep a stable order (e.g., by leadNo desc)
  const out = [];
  const seen = new Set();
  for (const lead of leadsData || []) {
    const key = String(lead.leadNo);
    if (!seen.has(key) && allowedNos.has(key)) {
      seen.add(key);
      out.push(lead);
    }
  }
  // optional: order by event chronological order of first matching timeline entry
  // If you prefer timeline ascending, uncomment below:
  // const firstByLead = {};
  // for (const t of timelineEntries) {
  //   const k = String(t.leadNo);
  //   if (!firstByLead[k]) firstByLead[k] = new Date(`${t.eventStartDate}T${convert12To24(t.eventStartTime)}`);
  // }
  // out.sort((a,b) => (firstByLead[a.leadNo] - firstByLead[b.leadNo]) || (toNum(a.leadNo) - toNum(b.leadNo)));

  return out;
};


useEffect(() => {
  const fetchTimeline = async () => {
    if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
    const token = localStorage.getItem("token");
    try {
      const { data } = await api.get(
        `/api/timeline/case/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Ascending sort: by eventStartDate then eventStartTime
      const sorted = [...data].sort((a, b) => {
        const aDT = new Date(`${a.eventStartDate}T${convert12To24(a.eventStartTime)}`);
        const bDT = new Date(`${b.eventStartDate}T${convert12To24(b.eventStartTime)}`);
        return aDT - bDT;
      });

      setTimelineEntries(sorted);

      // Map sorted entries -> unique leads from your leadsData (ascending order)
      // NOTE: wait for leadsData to be loaded; if not yet, we'll also compute again below
      const makeOrderedLeads = (entries, allLeads) => {
        const out = [];
        const seen = new Set();
        for (const e of entries) {
          const key = String(e.leadNo ?? "");
          if (!key) continue;
          if (seen.has(key)) continue;
          const match = (allLeads || []).find(l => String(l.leadNo) === key);
          if (match) {
            seen.add(key);
            out.push(match);
          }
        }
        return out;
      };

      setTimelineOrderedLeads(makeOrderedLeads(sorted, leadsData));
    } catch (err) {
      console.error("Failed to fetch timeline entries:", err);
      setTimelineEntries([]);
      setTimelineOrderedLeads([]);
    }
  };

  fetchTimeline();
  // also recompute whenever leadsData refreshes
}, [selectedCase?.caseNo, selectedCase?.caseName]);

// If leadsData arrives after timeline, recompute ordered list
useEffect(() => {
  if (!timelineEntries.length || !leadsData?.length) return;
  const out = [];
  const seen = new Set();
  for (const e of timelineEntries) {
    const key = String(e.leadNo ?? "");
    if (!key || seen.has(key)) continue;
    const match = leadsData.find(l => String(l.leadNo) === key);
    if (match) { seen.add(key); out.push(match); }
  }
  setTimelineOrderedLeads(out);
}, [timelineEntries, leadsData]);

useEffect(() => {
  // collect unique flags from timeline entries (timelineFlag is an array of strings)
  const uniq = new Set();
  for (const t of timelineEntries || []) {
    (Array.isArray(t.timelineFlag) ? t.timelineFlag : []).forEach(f => {
      const val = String(f || "").trim();
      if (val) uniq.add(val);
    });
  }
  setAvailableFlags([...uniq].sort((a,b) => a.localeCompare(b)));
}, [timelineEntries]);

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

  const handleShowSingleLead = () => {
  const n = toNum(selectStartLead1);
  if (!Number.isFinite(n)) {
    alert("Please enter a valid lead number.");
    return;
  }
  // Find exact match from full list
  const match = leadsData.filter(l => String(toNum(l.leadNo)) === String(n));
  setHierarchyLeadsData(match);        // show only that lead
  setHierarchyChains([]);              // clear chains
  setSelectedSingleLeadNo(String(n));  // store selection for reportScope='single'
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
            const base = cleanLeadRecord(lead);
            let leadReturns = [];
            try {
              const { data: returnsData } = await api.get(
                `/api/leadReturnResult/${base.leadNo}/${encodeURIComponent(base.description)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
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

// Allow single or multiple flag selection
const [isMultiFlag, setIsMultiFlag] = useState(true);

// Handle <select> changes
const handleFlagsChange = (e) => {
  const picked = Array.from(e.target.selectedOptions).map(o => o.value);
  // If single-select, keep only the last picked option
  setSelectedFlags(isMultiFlag ? picked : (picked.slice(-1)));
};

// Optional: clear selection
const clearFlags = () => setSelectedFlags([]);


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
      {leadNumbers.length > 2 && (expanded ? "▲ Expand" : "▼")}
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

  const toNum = (v) => {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  return s ? Number.parseInt(s, 10) : NaN;
};

  // Helper: compute which leads to include based on scope
const computeLeadsForReport = () => {
  const all = Array.isArray(leadsData) ? leadsData : [];
  const visible = Array.isArray(hierarchyLeadsData) && hierarchyLeadsData.length ? hierarchyLeadsData : all;

  if (reportScope === "all") return all;
  if (reportScope === "visible") return visible;

  if (reportScope === "single") {
    const target = toNum(selectedSingleLeadNo);
    if (!Number.isFinite(target)) return [];
    return visible.filter(l => toNum(l.leadNo) === target);
  }

  if (reportScope === "selected") {
    // 1) Prefer the explicit inputs from the Selected range UI
    const minInput = toNum(selectStartLead1);
    const maxInput = toNum(selectEndLead2);

    // 2) Else fall back to subsetRange if used elsewhere in your UI
    const min = Number.isFinite(minInput) ? minInput : toNum(subsetRange.start);
    const max = Number.isFinite(maxInput) ? maxInput : toNum(subsetRange.end);

    // If we have a valid numeric range, filter from the full data
    if (Number.isFinite(min) && Number.isFinite(max) && min <= max) {
      return all.filter(l => {
        const n = toNum(l.leadNo);
        return Number.isFinite(n) && n >= min && n <= max;
      });
    }

    // If the user already clicked "Apply" and the table is showing the filtered set, use it
    if (visible.length && visible !== all) return visible;

    // No valid range provided
    return [];
  }

  // Optional: manual checkbox subset (if you use it elsewhere)
  if (selectedForReport && selectedForReport.size > 0) {
    const selected = new Set([...selectedForReport].map(String));
    return visible.filter(l => selected.has(String(l.leadNo)));
  }

  return [];
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
//    const handleRunReportWithSummary = async (explicitLeads) => {
//     const token = localStorage.getItem("token");
//     const leadsForReport = computeLeadsForReport();
// if (reportScope === "selected" && leadsForReport.length === 0) {
//   alert("No leads selected for the subset.");
//   return;
// }
//     if (useWebpageSummary) {
//       try {
//         const payload = {
//           user: "Officer 916", 
//           reportTimestamp: new Date().toLocaleString(),
//            leadsData: leadsForReport,
//           caseSummary: typedSummary,
//           selectedReports: { FullReport: true },
//         };
//         const response = await api.post(
//           "/api/report/generateCase",
//           payload,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//             responseType: "blob", 
//           }
//         );
//         const file = new Blob([response.data], { type: "application/pdf" });
//         const fileURL = URL.createObjectURL(file);
//         window.open(fileURL, "_blank");
//       } catch (error) {
//         console.error("Failed to generate report", error);
//         alert("Error generating PDF");
//       }
//   }

//   else if (useFileUpload && execSummaryFile) {
//     try {
//       const formData = new FormData();
//       formData.append("user", "Officer 916");
//       formData.append("reportTimestamp", new Date().toLocaleString());
//       formData.append("leadsData", JSON.stringify(leadsData));
//       formData.append("selectedReports", JSON.stringify({ FullReport: true }));
//       formData.append("execSummaryFile", execSummaryFile);
  
//       const response = await axios.post(
//         "http://localhost:5000/api/report/generateCaseExecSummary",
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
           
//           },
//           responseType: "blob",
//         }
//       );
//       const fileBlob = new Blob([response.data], { type: "application/pdf" });
//       const fileURL = URL.createObjectURL(fileBlob);
//       window.open(fileURL, "_blank");
//     } catch (err) {
//       console.error("Error generating PDF with upload:", err);
//       alert("Failed to generate report with uploaded summary");
//     }
//   }
  
//   };

const handleRunReportWithSummary = async (explicitLeads = null) => {
  const token = localStorage.getItem("token");

  // Prefer an explicit list (timeline / hierarchy / selected range).
  // Otherwise fall back to the scoped computation.
  const computed = computeLeadsForReport();
  const leadsForReport = Array.isArray(explicitLeads) && explicitLeads.length
    ? explicitLeads
    : computed;

  if (!leadsForReport || leadsForReport.length === 0) {
    alert("No leads selected to include.");
    return;
  }

  if (useWebpageSummary) {
    try {
      const payload = {
        user: "Officer 916",
        reportTimestamp: new Date().toLocaleString(),
        leadsData: leadsForReport,          // ✅ use filtered/ordered list
        caseSummary: typedSummary,
        selectedReports: { FullReport: true },
      };

      const response = await api.post("/api/report/generateCase", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        responseType: "blob",
      });

      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");
    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Error generating PDF");
    }
  } else if (useFileUpload && execSummaryFile) {
    try {
      const formData = new FormData();
      formData.append("user", "Officer 916");
      formData.append("reportTimestamp", new Date().toLocaleString());
      formData.append("leadsData", JSON.stringify(leadsForReport)); // ✅ same list here
      formData.append("selectedReports", JSON.stringify({ FullReport: true }));
      formData.append("execSummaryFile", execSummaryFile);

      const response = await axios.post(
        "http://localhost:5000/api/report/generateCaseExecSummary",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
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
    
    return leadsArray.map((lead, leadIndex) => (
      
      <div key={leadIndex} 
       className={`lead-section ${String(selectedSingleLeadNo) === String(lead.leadNo) ? 'lead--selected' : ''}`}
    onClick={(e) => handleLeadCardClick(e, lead)}
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
                <td className="label-cell">Lead Number</td>
                <td className="input-cell">
                  <input type="text" value={lead.leadNo} readOnly />
                </td>
                <td className="label-cell">Lead Origin</td>
                <td className="input-cell">
                  <input
                    type="text"
                    value={lead.parentLeadNo ? lead.parentLeadNo.join(", ") : ""}
                    readOnly
                  />
                </td>
                <td className="label-cell">Assigned Date</td>
                <td className="input-cell">
                  <input type="text" value={formatDate(lead.assignedDate)} readOnly />
                </td>
                <td className="label-cell">Completed Date</td>
                <td className="input-cell">
                  <input type="text" value={formatDate(lead.completedDate)} readOnly />
                </td>
              </tr>
              <tr>
                <td className="label-cell">Assigned Officers</td>
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
                <td style={{ textAlign: 'center' }}>Lead Instruction</td>
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
                      <td style={{ textAlign: 'center' }}>{`Lead Return ID: ${returnItem.leadReturnId}`}</td>
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
                  <td colSpan="2" style={{ textAlign: 'center' }}>No Lead Returns Available</td>
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

        <div className="right-sec">

        {/* <div className="caseandleadinfo"> 
          <h5 className = "side-title">  Case {selectedCase.caseNo || ""}: {selectedCase.caseName || "Unknown Case"} </h5> 


          </div> */}

             <div className="ld-head">
            <Link to="/HomePage" className="crumb">PIMS Home</Link>
            <span className="sep">{" >> "}</span>
            <Link
              to={selectedCase?.role === "Investigator" ? "/Investigator" : "/CasePageManager"}
              state={{ caseDetails: selectedCase }}
              className="crumb"
            >
              Case Page: {selectedCase.caseNo || ""}: {selectedCase.caseName || "Unknown Case"}
            </Link>
            <span className="sep">{" >> "}</span>
            <span className="crumb-current" aria-current="page">Generate Report</span>
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

       <div className="down-content"> 
          {summaryMode === 'type' && (
        <div className="exec-summary-sec">
          <h3>Executive Summary</h3>

<textarea
  className="summary-input"
  placeholder="Type here..."
  value={typedSummary}
  onChange={e => setTypedSummary(e.target.value)}
  disabled={!useWebpageSummary}
  style={{ opacity: useWebpageSummary ? 1 : 0.5 }}
/>

        </div>
          )}


        {/* <div className="left-content-execSummary"> */}
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
            {/* <CollapsibleSection title="Case Summary" defaultOpen={true}>
            <div className="case-summary-ld">
              <textarea
                className="textarea-field-ld"
                style={{ fontFamily: "inherit", fontSize: "20px" }}
                value={caseSummary}
                onChange={handleCaseSummaryChange}
                readOnly={!isEditing}
              ></textarea>
            </div>
            </CollapsibleSection> */}

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

<CollapsibleSection title="Generate Report" defaultOpen={true}>

  {/* Single straight-line checkbox row */}
  <div className="reportTargetRow" style={{display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}}>
    <label className="summaryOption" style={{display:'inline-flex',alignItems:'center',gap:8}}>
      <input
        type="checkbox"
        checked={reportType === 'all'}
        onChange={() => setReportType(reportType === 'all' ? null : 'all')}
      />
      <span className="summaryOptionText">All leads</span>
    </label>

    <label className="summaryOption" style={{display:'inline-flex',alignItems:'center',gap:8}}>
      <input
        type="checkbox"
        checked={reportType === 'single'}
        onChange={() => setReportType(reportType === 'single' ? null : 'single')}
      />
      <span className="summaryOptionText">Single lead</span>
    </label>

     <label className="summaryOption" style={{display:'inline-flex',alignItems:'center',gap:8}}>
      <input
        type="checkbox"
        checked={reportType === 'selected'}
        onChange={() => setReportType(reportType === 'selected' ? null : 'selected')}
      />
      <span className="summaryOptionText">Selected leads (range)</span>
    </label>

    

    <label className="summaryOption" style={{display:'inline-flex',alignItems:'center',gap:8}}>
      <input
        type="checkbox"
        checked={reportType === 'hierarchy'}
        onChange={() => setReportType(reportType === 'hierarchy' ? null : 'hierarchy')}
      />
      <span className="summaryOptionText">Lead hierarchy</span>
    </label>

    <label className="summaryOption" style={{display:'inline-flex',alignItems:'center',gap:8}}>
      <input
        type="checkbox"
        checked={reportType === 'timeline'}
        onChange={() => setReportType(reportType === 'timeline' ? null : 'timeline')}
      />
      <span className="summaryOptionText">Timeline entry leads</span>
    </label>
     <label className="summaryOption" style={{display:'inline-flex',alignItems:'center',gap:8}}>
      <input
        type="checkbox"
        checked={reportType === 'flagged'}
        onChange={() => setReportType(reportType === 'flagged' ? null : 'flagged')}
      />
      <span className="summaryOptionText">Flagged leads</span>
    </label>
  </div>

  {/* When "All leads" is selected, show ONLY this part below */}
  {reportType === 'all' && (
    <>
      {/* Summary input mode */}
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

        <label className="summaryOption">
          <input
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

      <div style={{margin:'8px 0 0'}}>
        <div style={{marginBottom:8}}>All leads selected — run report.</div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setReportScope('all');
            handleRunReportWithSummary();
          }}
        >
          Run report
        </button>
      </div>
    </>
  )}


{reportType === 'single' && (
  <>
    <div className="range-filter">
      <div className="range-filter__label">Select Lead</div>
      <div className="range-filter__row">
        <input
          id="single-lead"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          className="range-filter__input"
          placeholder="Lead #"
          value={selectStartLead1}
          onChange={(e) => setSelectStartLead1(e.target.value)}
          aria-label="Lead number"
        />
        <div className="range-filter__actions">
          <button className="btn btn-primary" onClick={handleShowSingleLead}>
            Apply
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectStartLead1("");
              setHierarchyLeadsData([]);
              setHierarchyChains([]);
              setSelectedSingleLeadNo("");
            }}
          >
            Clear
          </button>
        </div>
      </div>
      <p className="range-filter__hint">
        Type a lead number (e.g., 1234) and click Apply, or click a card below to select it.
      </p>
    </div>

    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          setReportScope('single');    // ✅ use the single scope
          handleRunReportWithSummary();
        }}
        disabled={!selectedSingleLeadNo}
      >
        Run report
      </button>
    </div>
  </>
)}

{reportType === 'flagged' && (
  <>
    <div className="range-filter">
      <div className="range-filter__label" id="flag-select-label">Choose flag(s)</div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        {/* Single vs Multiple toggle */}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={isMultiFlag}
            onChange={(e) => {
              const next = e.target.checked;
              setIsMultiFlag(next);
              // If switching to single and multiple are selected, keep the last one
              if (!next && selectedFlags.length > 1) {
                setSelectedFlags([selectedFlags[selectedFlags.length - 1]]);
              }
            }}
          />
          <span className="summaryOptionText">Allow multiple</span>
        </label>

        {/* Flags dropdown */}
        <select
          aria-labelledby="flag-select-label"
          className="flag-select"
          multiple={isMultiFlag}
          size={Math.min(8, Math.max(3, availableFlags.length))} // good UX height
          value={selectedFlags}
          onChange={handleFlagsChange}
          style={{ minWidth: 260, maxWidth: 420 }}
        >
          {availableFlags.length ? (
            availableFlags.map((flag) => (
              <option key={flag} value={flag}>{flag}</option>
            ))
          ) : (
            <option disabled>(No timeline flags found)</option>
          )}
        </select>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={clearFlags}
          disabled={!selectedFlags.length}
        >
          Clear
        </button>
      </div>

      <p className="hierarchy-filter__hint" style={{ marginTop: 8 }}>
        Pick one or more flags. The report will include leads with at least one of the selected flags on a timeline entry.
      </p>
    </div>

    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          const flaggedLeads = getLeadsForSelectedFlags();
          if (!flaggedLeads.length) {
            alert("No leads found with the selected flag(s).");
            return;
          }
          handleRunReportWithSummary(flaggedLeads);
        }}
        disabled={!selectedFlags.length}
      >
        Run report
      </button>
    </div>
  </>
)}



{reportType === 'timeline' && (
  <>
    <p className="hierarchy-filter__hint" style={{ marginTop: 8 }}>
      Generate report in hierarchical order of <strong>timeline</strong> (oldest to newest).
    </p>

    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          // use the timeline-ordered list; keep scope as 'visible' for your backend payload builder
          setReportScope('visible');
          handleRunReportWithSummary(timelineOrderedLeads);
        }}
        disabled={!timelineOrderedLeads.length}
      >
        Run report (ascending timeline)
      </button>
      {!timelineOrderedLeads.length && (
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
          No timeline-linked leads found yet for this case.
        </div>
      )}
    </div>
  </>
)}



  {reportType === 'hierarchy' && (<>
    <div className="hierarchy-filter">
      <div className="hierarchy-filter__label">Lead chain lookup</div>

      <form
        className="hierarchy-filter__row"
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
          className="hierarchy-filter__input"
          placeholder="Lead # (e.g., 1234)"
          value={hierarchyLeadInput}
          onChange={(e) => setHierarchyLeadInput(e.target.value)}
          aria-label="Lead number"
        />

        <div className="hierarchy-filter__actions">
          <button
            type="submit"
            className="btn btn-primary"
            // disabled={!String(hierarchyLeadInput).trim()}
          >
            Show Hierarchy
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleShowAllLeads}
          >
            Clear
          </button>
        </div>
      </form>

      <p className="hierarchy-filter__hint">
        Enter a lead number to view its parent/child chain of custody.
      </p>
    </div>

    <div style={{ marginTop: 8 }}>
  <button
    type="button"
    className="btn btn-primary"
    onClick={() => {
      // Use the currently visible hierarchy results
      setReportScope('visible'); // or a custom scope if you prefer
      handleRunReportWithSummary(hierarchyLeadsData);
    }}
  >
    Run report
  </button>
</div>
</>
)}

 {reportType === 'selected' && (
    <>
      <>
        <div className="range-filter">
          <div className="range-filter__label"> Lead range</div>

          <div className="range-filter__row">
            <input
              id="lead-range-from"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              className="range-filter__input"
              placeholder="From lead #"
              value={selectStartLead1}
              onChange={(e) => setSelectStartLead1(e.target.value)}
              aria-label="From lead number"
            />

            <span className="range-filter__sep">—</span>

            <input
              id="lead-range-to"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              className="range-filter__input"
              placeholder="To lead #"
              value={selectEndLead2}
              onChange={(e) => setSelectEndLead2(e.target.value)}
              aria-label="To lead number"
            />

            <div className="range-filter__actions">
              <button className="btn btn-primary" onClick={handleShowLeadsInRange}>
                Apply
              </button>
              <button className="btn btn-secondary" onClick={handleShowAllLeads}>
                Clear
              </button>
            </div>
          </div>

          <p className="range-filter__hint">
            Enter a lead number range (e.g., 1200 — 1250) and click Apply.
          </p>
        </div>
        </>

      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setReportScope('visible'); // use the currently visible filtered leads
            handleRunReportWithSummary(hierarchyLeadsData);
          }}
        >
          Run report
        </button>
      </div>
    </>
  )}

  

</CollapsibleSection>



              {/* <CaseHeaderSection /> */}







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
