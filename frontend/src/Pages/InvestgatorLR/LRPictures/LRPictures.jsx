import Navbar from "../../../components/Navbar/Navbar";
import "./LRPictures.css";
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import React, { useContext, useState, useEffect, useRef} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';



export const LRPictures = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
  const navigate = useNavigate();
    const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);

 const baseKey = React.useMemo(() => {
  const c = selectedCase?.caseNo ?? "UNKC";
  const l = selectedLead?.leadNo ?? "UNKL";
  return `LRPictures:${c}:${l}`;
}, [selectedCase?.caseNo, selectedLead?.leadNo]);

const FORM_KEY = `${baseKey}:form`;
const LIST_KEY = `${baseKey}:list`;
    const location = useLocation();
  const [file, setFile] = useState(null);
const [leadData, setLeadData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
const [editingIndex, setEditingIndex] = useState(null);
 const fileInputRef = useRef();
 const [alertOpen, setAlertOpen] = useState(false);
     const [alertMessage, setAlertMessage] = useState("");
     // Narrative Ids fetched from the server
const [narrativeIds, setNarrativeIds] = useState([]);

const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

const requestDeletePicture = (idx) => {
  setPendingDeleteIndex(idx);
  setConfirmOpen(true);
};

const normalizeId = (id) => String(id ?? "").trim().toUpperCase();
const alphabetToNumber = (str = "") => {
  str = normalizeId(str);
  let n = 0;
  for (let i = 0; i < str.length; i++) n = n * 26 + (str.charCodeAt(i) - 64);
  return n;
};


  
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date)) return "";
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    };
  
    const { leadDetails, caseDetails } = location.state || {};
  
   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

  // Default pictures data
  const [pictures, setPictures] = useState(() => {
   const saved = sessionStorage.getItem(LIST_KEY);
   return saved ? JSON.parse(saved) : [];
  });

  // State to manage form data
  const [pictureData, setPictureData] = useState(() => {
   const saved = sessionStorage.getItem(FORM_KEY);
   return saved
     ? JSON.parse(saved)
     : {
         datePictureTaken: "",
         description: "",
         image: "",
         leadReturnId: "",
         filename: ""
       };
 });
  const handleInputChange = (field, value) => {
    setPictureData({ ...pictureData, [field]: value });
  };

const handleFileChange = (e) => {
  const selectedFile = e.target.files?.[0];
  if (!selectedFile) return;
  // revoke previous preview
  if (pictureData.image && pictureData.image.startsWith("blob:")) {
    try { URL.revokeObjectURL(pictureData.image); } catch {}
  }
  const preview = URL.createObjectURL(selectedFile);
  setFile(selectedFile);
  setPictureData(prev => ({ ...prev, image: preview, filename: selectedFile.name, isLink: false, link: "" }));
};

// put this near your other handlers
const handleUploadTypeChange = (e) => {
  const nextIsLink = e.target.value === "link";

  setPictureData((prev) => {
    // revoke old blob preview if any
    if (prev.image && typeof prev.image === "string" && prev.image.startsWith("blob:")) {
      try { URL.revokeObjectURL(prev.image); } catch {}
    }
    return {
      ...prev,
      isLink: nextIsLink,
      link: "",
      image: "",     // clear preview
      filename: ""
    };
  });

  setFile(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
};


  // whenever the draft changes, save it
useEffect(() => {
  sessionStorage.setItem(FORM_KEY, JSON.stringify(pictureData));
}, [pictureData, FORM_KEY]);

useEffect(() => {
  sessionStorage.setItem(LIST_KEY, JSON.stringify(pictures));
}, [pictures, LIST_KEY]);

useEffect(() => {
  // When the case/lead changes, reset local state to what's in *new* keys
  const savedForm = sessionStorage.getItem(FORM_KEY);
  const savedList = sessionStorage.getItem(LIST_KEY);

  setPictureData(savedForm ? JSON.parse(savedForm) : {
    datePictureTaken: "",
    description: "",
    image: "",
    leadReturnId: "",
    filename: "",
    isLink: false,
    link: ""
  });
  setPictures(savedList ? JSON.parse(savedList) : []);
  // also clear editing state
  setIsEditing(false);
  setEditingIndex(null);
  setFile(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
}, [FORM_KEY, LIST_KEY]);


const attachFiles = async (items, idFieldName, filesEndpoint) => {
  return Promise.all(
    (items || []).map(async (item) => {
      const realId = item[idFieldName];
      if (!realId) return { ...item, files: [] };
      try {
        const { data: filesArray } = await api.get(
          `${filesEndpoint}/${realId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        return { ...item, files: filesArray };
      } catch (err) {
        console.error(`Error fetching files for ${filesEndpoint}/${realId}:`, err);
        return { ...item, files: [] };
      }
    })
  );
};


    const [isGenerating, setIsGenerating] = useState(false);
    const handleViewLeadReturn = async () => {
  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

  if (!lead?.leadNo || !(lead.leadName || lead.description) || !kase?.caseNo || !kase?.caseName) {
    setAlertMessage("Please select a case and lead first.");
    setAlertOpen(true);
    return;
  }

  if (isGenerating) return;

  try {
    setIsGenerating(true);

    const token = localStorage.getItem("token");
    const headers = { headers: { Authorization: `Bearer ${token}` } };

    const { leadNo } = lead;
    const leadName = lead.leadName || lead.description;
    const { caseNo, caseName } = kase;
    const encLead = encodeURIComponent(leadName);
    const encCase = encodeURIComponent(caseName);

    // fetch everything we need for the report (same endpoints you use on LRFinish)
    const [
      instrRes,
      returnsRes,
      personsRes,
      vehiclesRes,
      enclosuresRes,
      evidenceRes,
      picturesRes,
      audioRes,
      videosRes,
      scratchpadRes,
      timelineRes,
    ] = await Promise.all([
      api.get(`/api/lead/lead/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrenclosure/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrevidence/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrpicture/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lraudio/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/lrvideo/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/scratchpad/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
      api.get(`/api/timeline/${leadNo}/${encLead}/${caseNo}/${encCase}`, headers).catch(() => ({ data: [] })),
    ]);

    // add files where applicable (note the plural file endpoints)
    const enclosuresWithFiles = await attachFiles(enclosuresRes.data, "_id", "/api/lrenclosures/files");
    const evidenceWithFiles   = await attachFiles(evidenceRes.data,   "_id", "/api/lrevidences/files");
    const picturesWithFiles   = await attachFiles(picturesRes.data,   "pictureId", "/api/lrpictures/files");
    const audioWithFiles      = await attachFiles(audioRes.data,      "audioId",   "/api/lraudio/files");
    const videosWithFiles     = await attachFiles(videosRes.data,     "videoId",   "/api/lrvideo/files");

    const leadInstructions = instrRes.data?.[0] || {};
    const leadReturns      = returnsRes.data || [];
    const leadPersons      = personsRes.data || [];
    const leadVehicles     = vehiclesRes.data || [];
    const leadScratchpad   = scratchpadRes.data || [];
    const leadTimeline     = timelineRes.data || [];

    // make all sections true (Full Report)
    const selectedReports = {
      FullReport: true,
      leadInstruction: true,
      leadReturn: true,
      leadPersons: true,
      leadVehicles: true,
      leadEnclosures: true,
      leadEvidence: true,
      leadPictures: true,
      leadAudio: true,
      leadVideos: true,
      leadScratchpad: true,
      leadTimeline: true,
    };

    const body = {
      user: localStorage.getItem("loggedInUser") || "",
      reportTimestamp: new Date().toISOString(),

      // sections (values are the fetched arrays/objects)
      leadInstruction: leadInstructions,
      leadReturn:      leadReturns,
      leadPersons,
      leadVehicles,
      leadEnclosures:  enclosuresWithFiles,
      leadEvidence:    evidenceWithFiles,
      leadPictures:    picturesWithFiles,
      leadAudio:       audioWithFiles,
      leadVideos:      videosWithFiles,
      leadScratchpad,
      leadTimeline,

      // also send these two, since your backend expects them
      selectedReports,
      leadInstructions,
      leadReturns,
    };

    const resp = await api.post("/api/report/generate", body, {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` },
    });

    const file = new Blob([resp.data], { type: "application/pdf" });

    navigate("/DocumentReview", {
      state: {
        pdfBlob: file,
        filename: `Lead_${leadNo || "report"}.pdf`,
      },
    });
  } catch (err) {
    if (err?.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      console.error("Report error:", text);
      setAlertMessage("Error generating PDF:\n" + text);
    } else {
      console.error("Report error:", err);
      setAlertMessage("Error generating PDF:\n" + (err.message || "Unknown error"));
    }
    setAlertOpen(true);
  } finally {
    setIsGenerating(false);
  }
};

  const signedInOfficer = localStorage.getItem("loggedInUser");
 // who is primary for this lead?
const primaryUsername =
  leadData?.primaryInvestigator || leadData?.primaryOfficer || "";

// am I the primary investigator on this lead?
const isPrimaryInvestigator =
  selectedCase?.role === "Investigator" &&
  !!signedInOfficer &&
  signedInOfficer === primaryUsername;

// primary goes to the interactive ViewLR page
const goToViewLR = () => {
  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

  if (!lead?.leadNo || !lead?.leadName || !kase?.caseNo || !kase?.caseName) {
    setAlertMessage("Please select a case and lead first.");
    setAlertOpen(true);
    return;
  }

  navigate("/viewLR", {
    state: { caseDetails: kase, leadDetails: lead }
  });
};


  // populate the form to edit a picture
  const handleEditPicture = idx => {
    const pic = pictures[idx];
    setPictureData({
      datePictureTaken: new Date(pic.rawDatePictureTaken).toISOString().slice(0,10),
      leadReturnId:     pic.returnId,
      description:      pic.description,
      image:            pic.image,
      filename:         pic.filename,
      link:             pic.link || "",
      isLink:           !!pic.link
    });
    setIsEditing(true);
    setEditingIndex(idx);
    setFile(null);
  };

  useEffect(() => {
  if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;

  const ac = new AbortController();

  (async () => {
    try {
      const token   = localStorage.getItem("token");
      const leadNo  = selectedLead.leadNo;
      const caseNo  = selectedCase.caseNo;
      const encLead = encodeURIComponent(selectedLead.leadName);
      const encCase = encodeURIComponent(selectedCase.caseName);

      const resp = await api.get(
        `/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: ac.signal }
      );

      const ids = [...new Set((resp?.data || [])
        .map(r => normalizeId(r?.leadReturnId))
        .filter(Boolean))];

      ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
      setNarrativeIds(ids);

      // If adding a NEW picture and no Id chosen yet, preselect the newest
      setPictureData(prev =>
        (!isEditing && !prev.leadReturnId)
          ? { ...prev, leadReturnId: ids.at(-1) || "" }
          : prev
      );
    } catch (e) {
      if (!ac.signal.aborted) console.error("Failed to fetch Narrative Ids:", e);
    }
  })();

  return () => ac.abort();
}, [
  selectedLead?.leadNo,
  selectedLead?.leadName,
  selectedCase?.caseNo,
  selectedCase?.caseName,
  isEditing
]);

const performDeletePicture = async () => {
  const idx = pendingDeleteIndex;
  if (idx == null) return;

  const pic = pictures[idx];
  const token = localStorage.getItem("token");
  try {
    await api.delete(
      `/api/lrpicture/${selectedLead.leadNo}/` +
      `${encodeURIComponent(selectedLead.leadName)}/` +
      `${selectedCase.caseNo}/` +
      `${encodeURIComponent(selectedCase.caseName)}/` +
      `${pic.returnId}/` +
      `${encodeURIComponent(pic.description)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPictures(ps => ps.filter((_, i) => i !== idx));
  } catch (e) {
    console.error("Delete picture failed:", e);
    setAlertMessage("Failed to delete picture.");
    setAlertOpen(true);
  } finally {
    setConfirmOpen(false);
    setPendingDeleteIndex(null);
  }
};


// delete a picture
const handleDeletePicture = async idx => {
  if (!window.confirm("Delete this picture?")) return;
  const pic = pictures[idx];
  const token = localStorage.getItem("token");
  await api.delete(
    `/api/lrpicture/${selectedLead.leadNo}/` +
    `${encodeURIComponent(selectedLead.leadName)}/` +
    `${selectedCase.caseNo}/` +
    `${encodeURIComponent(selectedCase.caseName)}/` +
    `${pic.returnId}/` +
    `${encodeURIComponent(pic.description)}`,
    { headers:{ Authorization:`Bearer ${token}` } }
  );
  setPictures(ps => ps.filter((_, i) => i !== idx));
};
const handleAddPicture = async () => {
  // ✅ Only the fields you truly want to require. Remove file/link requirement.
  if (!pictureData.datePictureTaken || !pictureData.description) {
    setAlertMessage("Please fill in the required fields.");
    setAlertOpen(true);
    return;
  }

  const fd = new FormData();
  // attach file only if present
  if (!pictureData.isLink && file) {
    fd.append("file", file);
  }
  fd.append("leadNo", selectedLead.leadNo);
  fd.append("description", selectedLead.leadName);
  fd.append("enteredBy", localStorage.getItem("loggedInUser"));
  fd.append("caseName", selectedCase.caseName);
  fd.append("caseNo", selectedCase.caseNo);
  fd.append("leadReturnId", pictureData.leadReturnId || "");
  fd.append("enteredDate", new Date().toISOString());
  fd.append("datePictureTaken", pictureData.datePictureTaken);
  fd.append("pictureDescription", pictureData.description);

  // link is optional
  fd.append("isLink", !!pictureData.isLink);
  if (pictureData.isLink && pictureData.link?.trim()) {
    fd.append("link", pictureData.link.trim());
  }

  try {
    const token = localStorage.getItem("token");
    await api.post("/api/lrpicture/upload", fd, {
      headers: { Authorization: `Bearer ${token}` },
      transformRequest: [(data, headers) => { delete headers["Content-Type"]; return data; }]
    });

    await fetchPictures();
    setPictureData({
      datePictureTaken: "",
      leadReturnId: "",
      description: "",
      isLink: false,
      link: "",
      originalName: "",
      filename: ""
    });
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    sessionStorage.removeItem(FORM_KEY);
  } catch (err) {
    console.error("Error uploading picture:", err);
    setAlertMessage("Failed to save picture. See console for details.");
    setAlertOpen(true);
  }
};


  useEffect(() => {
    const fetchLeadData = async () => {
      if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;
      const token = localStorage.getItem("token");

      try {
        const response = await api.get(
          `/api/lead/lead/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.length > 0) {
          setLeadData({
            ...response.data[0],
            assignedTo: response.data[0].assignedTo || [],
            leadStatus: response.data[0].leadStatus || ''
          });
        }
      } catch (error) {
        console.error("Failed to fetch lead data:", error);
      }
    };

    fetchLeadData();
  }, [selectedLead, selectedCase]);

const handleUpdatePicture = async () => {
  const pic = pictures[editingIndex];

  // 1️⃣ Validation for link-mode
  if (pictureData.isLink && !pictureData.link.trim()) {
    setAlertMessage("Please enter a valid link.");
                      setAlertOpen(true);
    return;
  }

  // 2️⃣ Build FormData
  const fd = new FormData();
  // only include a new file if user replaced it
  if (!pictureData.isLink && file) {
    fd.append("file", file);
  }

  // ● Required by your mongoose schema
  fd.append("leadReturnId", pictureData.leadReturnId);

  // ● All the rest of your fields
  fd.append("datePictureTaken", pictureData.datePictureTaken);
  fd.append("pictureDescription", pictureData.description);
  fd.append("enteredBy", localStorage.getItem("loggedInUser"));
  fd.append("isLink", pictureData.isLink);
  if (pictureData.isLink) {
    fd.append("link", pictureData.link.trim());
  }

  try {
    const token = localStorage.getItem("token");
    await api.put(
      `/api/lrpicture/` +
        `${selectedLead.leadNo}/` +
        `${encodeURIComponent(selectedLead.leadName)}/` +
        `${selectedCase.caseNo}/` +
        `${encodeURIComponent(selectedCase.caseName)}/` +
        `${pic.returnId}/` +
        `${encodeURIComponent(pic.description)}`,
      fd,
      {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: [(data, headers) => {
          delete headers["Content-Type"];
          return data;
        }]
      }
    );

    // Refresh & reset
    await fetchPictures();
    setIsEditing(false);
    setEditingIndex(null);
    setPictureData({
      datePictureTaken: "",
      leadReturnId:     "",
      description:      "",
      isLink:           false,
      link:             "",
      originalName:     "",
      filename:         ""
    });
    setFile(null);
  } catch (err) {
    console.error("Error updating LRPicture:", err);
     setAlertMessage("Failed to update picture. See console for details.");
                      setAlertOpen(true);
  }
};


  

  const handleNavigation = (route) => {
    navigate(route);
  };

  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchPictures();
    }
  }, [selectedLead, selectedCase]);
  
  const fetchPictures = async () => {
    const token = localStorage.getItem("token");
  
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);
  
    try {
      const res = await api.get(
        `/api/lrpicture/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            "Content-Type": undefined,  
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const mappedPictures = res.data.map((pic) => ({
        dateEntered: formatDate(pic.enteredDate),
        rawEnteredDate:  pic.enteredDate, 
        returnId: pic.leadReturnId,
        datePictureTaken: formatDate(pic.datePictureTaken),
        rawDatePictureTaken: pic.datePictureTaken,
        filename: pic.filename,
  originalName: pic.originalName,
        description: pic.pictureDescription,
         image: pic.signedUrl || pic.link,
          filename: pic.filename,
          link: pic.link || ""
      }));
      const withAccess = mappedPictures.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
  
      setPictures(withAccess);
    } catch (error) {
      console.error("Error fetching pictures:", error);
    }
  };

    const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";
  // handler to change access per row
const handleAccessChange = (idx, newAccess) => {
  setPictures(rs => {
    const copy = [...rs];
    copy[idx] = { ...copy[idx], access: newAccess };
    return copy;
  });
};

    const { status, isReadOnly } = useLeadStatus({
    caseNo: selectedCase.caseNo,
    caseName: selectedCase.caseName,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
  });



  return (
    <div className="lrpictures-container">
      {/* Navbar */}
      <Navbar />
      <AlertModal
                isOpen={alertOpen}
                title="Notification"
                message={alertMessage}
                onConfirm={() => setAlertOpen(false)}
                onClose={()   => setAlertOpen(false)}
              />

    <AlertModal
  isOpen={confirmOpen}
  title="Confirm Deletion"
  message="Are you sure you want to delete this record?"
  onConfirm={performDeletePicture}
  onClose={() => {
    setConfirmOpen(false);
    setPendingDeleteIndex(null);
  }}
/>



      {/* Top Menu */}
      {/* <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
        </div>
      </div> */}
   

      <div className="LRI_Content">
      {/* <div className="sideitem">
       <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

       <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>  
          


                  <li
  className="sidebar-item"
  onClick={() =>
    selectedCase.role === "Investigator"
      ? navigate("/Investigator")
      : navigate("/CasePageManager")
  }
>
Case Page
</li>


            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item active" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
         
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
      
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}

            </ul>
        )}
          <li className="sidebar-item" style={{ fontWeight: 'bold' }} onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Related Tabs {leadDropdownOpen ?  "▲": "▼"}
          </li>
        {leadDropdownOpen && (
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
                  <SideBar  activePage="LeadReview" />
                <div className="left-contentLI">

                       <div className="top-menu1">
      <div className="menu-items" >
        <span className="menu-item " onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LeadReview", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } }} > Lead Information</span>
                   <span className="menu-item active" >Add Lead Return</span>
                    {(["Case Manager", "Detective Supervisor"].includes(selectedCase?.role)) && (
           <span
              className="menu-item"
              onClick={handleViewLeadReturn}
              title={isGenerating ? "Preparing report…" : "View Lead Return"}
              style={{ opacity: isGenerating ? 0.6 : 1, pointerEvents: isGenerating ? "none" : "auto" }}
            >
              Manage Lead Return
            </span>
              )}

            {selectedCase?.role === "Investigator" && isPrimaryInvestigator && (
  <span className="menu-item" onClick={goToViewLR}>
    Submit Lead Return
  </span>
)}

  {selectedCase?.role === "Investigator" && !isPrimaryInvestigator && (
  <span className="menu-item" onClick={goToViewLR}>
   Review Lead Return
  </span>
)}


                   <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/ChainOfCustody", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                    setAlertMessage("Please select a case and lead first.");
                      setAlertOpen(true);
                  }
                }}>Lead Chain of Custody</span>
          
                  </div>
        {/* <div className="menu-items">
      
        <span className="menu-item active" onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRScratchpad')}>
            Scratchpad
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> */}
       </div>
                <div className="top-menu1">
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Narrative
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRScratchpad')}>
            Notes
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          {/* <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span> */}
         </div> </div>
                {/* <div className="caseandleadinfo">
          <h5 className = "side-title">  Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>

          </div> */}
               <div className="caseandleadinfo">
          <h5 className = "side-title"> 
             {/* Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""} */}
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Pictures
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
        ? ` Lead Status:  ${status}`
    : ` ${leadStatus}`}
</h5>

          </div>
                  

        {/* Center Section */}
        <div className="case-header">
          <h2 className="">PICTURES INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Picture Form */}
        <div className = "timeline-form-sec">
        <div className="picture-form">
          <div className="form-row-pic">
            <label  className="evidence-head">Date Picture Taken*</label>
            <input
              type="date"
              value={pictureData.datePictureTaken}
               className="evidence-head"
              onChange={(e) => handleInputChange("datePictureTaken", e.target.value)}
            />
          </div>
          <div className="form-row-pic">
            <label className="evidence-head">Narrative Id*</label>
            <select
              value={pictureData.leadReturnId}
              className="evidence-head"
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
            >
              <option value="">Select Id</option>
              {narrativeIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>

          </div>
          <div className="form-row-pic">
            <label  className="evidence-head">Description</label>
            <textarea
              value={pictureData.description}
               className="evidence-head"
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
        {/* … above your “Upload Image” row … */}
<div className="form-row-pic">
  <label>Upload Type</label>
  <select
  value={pictureData.isLink ? "link" : "file"}
  onChange={handleUploadTypeChange}
>
  <option value="file">File</option>
  <option value="link">Link</option>
</select>
</div>

{/* If editing a file‐upload entry, show current filename */}
{isEditing && !pictureData.isLink && pictureData.originalName && (
  <div className="form-row-pic">
    <label>Current File:</label>
    <span className="current-filename">{pictureData.originalName}</span>
  </div>
)}

{/* File vs Link input */}
{!pictureData.isLink ? (
  <div className="form-row-pic">
    <label>{isEditing ? "Replace Image (optional)" : "Upload Image"}</label>
    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  </div>
) : (
  <div className="form-row-pic">
    <label>Paste Link:</label>
    <input
      type="text"
      placeholder="https://..."
      value={pictureData.link}
      onChange={e =>
        setPictureData(prev => ({ ...prev, link: e.target.value }))
      }
    />
  </div>
)}

        </div>
        <div className="form-buttons">
        <div className="form-buttons">
  <button
    disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
    className="save-btn1"
    onClick={isEditing ? handleUpdatePicture : handleAddPicture}
  >
    {isEditing ? "Update Picture" : "Add Picture"}
  </button>

  {isEditing && (
    <button
      disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
      className="save-btn1"
      onClick={() => {
        // Cancel editing & reset form
        setIsEditing(false);
        setEditingIndex(null);
        setPictureData({
          datePictureTaken: "",
          leadReturnId:     "",
          description:      "",
          image:            "",
          filename:         "",
          link:             "",
          isLink:           false
        });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }}
    >
      Cancel
    </button>
  )}
</div>

        </div>
        {/* Uploaded Pictures Preview */}
        <div className="uploaded-pictures">
          {/* <h4 className="evidence-head">Uploaded Pictures</h4> */}
          <div className="pictures-gallery">
            {pictures.map((picture, index) => (
              <div key={index} className="picture-card">
                <img src={picture.image} alt={`Uploaded ${index + 1}`} className="uploaded-image" />
                <p className="evidence-head">{picture.description}</p>
              </div>
            ))}
          </div>
        </div>
        </div>


           {/* Pictures Table */}
           <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Narrative Id </th>
              {/* <th>Date Picture Taken</th> */}
              <th>File Name</th>
              <th>Description</th>
              <th>Actions</th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {pictures.length > 0 ? pictures.map((picture, index) => (
              <tr key={index}>
                <td>{picture.dateEntered}</td>
                <td>{picture.returnId}</td>
                {/* <td>{picture.datePictureTaken}</td> */}
                
                 <td>
  {picture.link ? (
    // if it was saved as a URL
    <a
      href={picture.link}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {picture.link}
    </a>
  ) : (
    // otherwise it’s a file on your server
    <a
      href={picture.link ? picture.link : picture.image}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {picture.originalName}
    </a>
  )}
</td>

                <td>{picture.description}</td>
                <td>
        <button
          disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
          onClick={() => handleEditPicture(index)}
        >
          <img src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
               alt="Edit" className="edit-icon" />
        </button>
        <button
          disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
          onClick={() => requestDeletePicture(index)}
        >
          <img src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
               alt="Delete" className="edit-icon" />
        </button>
      </td>
                {isCaseManager && (
          <td>
            <select
              value={picture.access}
              onChange={e => handleAccessChange(index, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Case Manager Only</option>
            </select>
          </td>
        )}
      </tr>
       )) : (
        <tr>
          <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign:'center' }}>
            No Pictures Available
          </td>
        </tr>
      )}
          </tbody>
        </table>
               {/* {selectedLead?.leadStatus !== "Completed" && !isCaseManager && (
  <div className="form-buttons-finish">
    <h4> Click here to submit the lead</h4>
    <button
      disabled={selectedLead?.leadStatus === "In Review"}
      className="save-btn1"
      onClick={handleSubmitReport}
    >
      Submit 
    </button>
  </div>
)} */}

        <Comment tag= "Pictures"/>
       </div>
    </div>
    
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRAudio")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
