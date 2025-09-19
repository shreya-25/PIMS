import Navbar from '../../../components/Navbar/Navbar';
import "./LREvidence.css"; // Custom CSS file for Evidence styling
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Comment from "../../../components/Comment/Comment";
import React, { useContext, useState, useEffect, useRef, useMemo} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';


export const LREvidence = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
  const navigate = useNavigate(); // Initialize navigate hook
  const location = useLocation();
  const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");
      const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);  
      const fileInputRef = useRef();
      const [editIndex, setEditIndex]         = useState(null);
      const [originalDesc, setOriginalDesc]   = useState("");
      const [leadData, setLeadData] = useState({});
 const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [deleteOpen, setDeleteOpen] = useState(false);
const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

// Open the confirm modal
const requestDelete = (idx) => {
  setPendingDeleteIndex(idx);
  setDeleteOpen(true);
};

// User clicked "Confirm" on the modal
const confirmDelete = async () => {
  const idx = pendingDeleteIndex;
  setDeleteOpen(false);
  setPendingDeleteIndex(null);
  if (idx == null) return;
  await performDelete(idx); // calls the actual delete
};

// DELETE without any prompt
const performDelete = async (idx) => {
  const ev = evidences[idx];
  const token = localStorage.getItem("token");
  const url = `/api/lrevidence/${selectedLead.leadNo}/` +
              `${encodeURIComponent(selectedLead.leadName)}/` +
              `${selectedCase.caseNo}/` +
              `${encodeURIComponent(selectedCase.caseName)}/` +
              `${ev.returnId}/` +
              `${encodeURIComponent(ev.evidenceDescription)}`;

  try {
    await api.delete(url, { headers: { Authorization: `Bearer ${token}` } });
    setEvidences(list => list.filter((_, i) => i !== idx));
  } catch (err) {
    console.error(err);
    setAlertMessage("Failed to delete: " + (err.response?.data?.message || err.message));
    setAlertOpen(true);
  }
};


  
    const { formKey, listKey } = useMemo(() => {
  const cn   = selectedCase?.caseNo ?? "NA";
  const cNam = encodeURIComponent(selectedCase?.caseName ?? "NA");
  const ln   = selectedLead?.leadNo ?? "NA";
  const lNam = encodeURIComponent(selectedLead?.leadName ?? "NA");
  return {
    formKey: `LREvidence:form:${cn}:${cNam}:${ln}:${lNam}`,
    listKey: `LREvidence:list:${cn}:${cNam}:${ln}:${lNam}`,
  };
}, [
  selectedCase?.caseNo,
  selectedCase?.caseName,
  selectedLead?.leadNo,
  selectedLead?.leadName,
]);
  
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

// defaultEvidence()
const defaultEvidence = () => ({
  leadReturnId: "",
  evidenceDescription: "",
  collectionDate: "",
  disposedDate: "",
  type: "",
  disposition: "",
  // old fields
  isLink: false,
  link: "",
  originalName: "",
  filename: "",
  // NEW
  uploadMode: "none", // 'none' | 'file' | 'link'
});


    // add near other useState hooks
const [narrativeIds, setNarrativeIds] = useState([]);

const alphabetToNumber = (str = "") => {
  let n = 0;
  for (let i = 0; i < str.length; i++) n = n * 26 + (str.charCodeAt(i) - 64);
  return n;
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

      const ids = [...new Set((resp?.data || []).map(r => r?.leadReturnId).filter(Boolean))];
      ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
      setNarrativeIds(ids);

      // for NEW entries (not editing), preselect the newest Narrative Id if none chosen yet
      setEvidenceData(prev =>
        (editIndex === null && !prev.leadReturnId)
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
  editIndex
]);



  // State to manage form data
   const [evidenceData, setEvidenceData] = useState(() => {
  const saved = sessionStorage.getItem(formKey);
  return saved ? JSON.parse(saved) : defaultEvidence();
});

const [evidences, setEvidences] = useState(() => {
  const saved = sessionStorage.getItem(listKey);
  return saved ? JSON.parse(saved) : [];
});

useEffect(() => {
  // reload form & list for the newly selected lead/case
  const savedForm = sessionStorage.getItem(formKey);
  setEvidenceData(savedForm ? JSON.parse(savedForm) : defaultEvidence());

  const savedList = sessionStorage.getItem(listKey);
  setEvidences(savedList ? JSON.parse(savedList) : []);

  // reset edit state and file input
  setEditIndex(null);
  setOriginalDesc("");
  setFile(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
}, [formKey, listKey]);


  const [file, setFile] = useState(null);

useEffect(() => {
  sessionStorage.setItem(formKey, JSON.stringify(evidenceData));
}, [formKey, evidenceData]);

useEffect(() => {
  sessionStorage.setItem(listKey, JSON.stringify(evidences));
}, [listKey, evidences]);

  
  const handleInputChange = (field, value) => {
    setEvidenceData({ ...evidenceData, [field]: value });
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

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
  

const handleSaveEvidence = async () => {
  const fd = new FormData();

  // FILE: only if in file mode AND a file was chosen
  if (evidenceData.uploadMode === "file" && file) {
    fd.append("file", file);
  }

  // Always send these
  fd.append("leadNo",            selectedLead.leadNo);
  fd.append("description",       selectedLead.leadName);
  fd.append("enteredBy",         localStorage.getItem("loggedInUser"));
  fd.append("caseName",          selectedCase.caseName);
  fd.append("caseNo",            selectedCase.caseNo);
  fd.append("leadReturnId",      evidenceData.leadReturnId);
  fd.append("enteredDate",       new Date().toISOString());
  fd.append("type",              evidenceData.type);
  fd.append("evidenceDescription", evidenceData.evidenceDescription);
  fd.append("collectionDate",    evidenceData.collectionDate);
  fd.append("disposedDate",      evidenceData.disposedDate);
  fd.append("disposition",       evidenceData.disposition);

  // LINK flags/values
  const isLink = evidenceData.uploadMode === "link";
  fd.append("isLink", String(isLink)); // backend checks 'true'/'false'

  if (isLink && evidenceData.link?.trim()) {
    fd.append("link", evidenceData.link.trim());
  }

  try {
    const token = localStorage.getItem("token");
    if (editIndex === null) {
      // CREATE
      await api.post("/api/lrevidence/upload", fd, {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: [(data, headers) => {
          delete headers["Content-Type"];
          return data;
        }]
      });
    } else {
      // UPDATE
      const ev = evidences[editIndex];
      const url =
        `/api/lrevidence/${selectedLead.leadNo}/` +
        `${encodeURIComponent(selectedLead.leadName)}/` +
        `${selectedCase.caseNo}/` +
        `${encodeURIComponent(selectedCase.caseName)}/` +
        `${ev.returnId}/` +
        `${encodeURIComponent(originalDesc)}`;

      await api.put(url, fd, {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: [(data, headers) => {
          delete headers["Content-Type"];
          return data;
        }]
      });
    }

    await fetchEvidences();
    setEvidenceData(defaultEvidence());
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setEditIndex(null);
    setOriginalDesc("");
    sessionStorage.removeItem(formKey);
  } catch (err) {
    console.error("Save error:", err);
    setAlertMessage("Failed to save evidence.");
    setAlertOpen(true);
  }
};

  

  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchEvidences();
    }
  }, [selectedLead, selectedCase]);
  const fetchEvidences = async () => {
    const token = localStorage.getItem("token");
  
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName); // encode to handle spaces
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);
  
    try {
      const res = await api.get(
        `/api/lrevidence/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            "Content-Type": undefined,  
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const mappedEvidences = res.data.map((enc) => ({
        dateEntered: formatDate(enc.enteredDate),
        type: enc.type,
        evidenceDescription:  enc.evidenceDescription,
        returnId: enc.leadReturnId,
        originalName: enc.originalName,
        collectionDate: formatDate(enc.collectionDate),
        disposedDate: formatDate(enc.disposedDate),
        disposition: enc.disposition,
        originalName:        enc.originalName,
        filename:            enc.filename,
         link:                enc.link || "" ,
               signedUrl: enc.signedUrl || "",  
      }));

      const withAccess = mappedEvidences.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
  
      setEvidences(withAccess);
      setLoading(false);
      setError("");
    } catch (err) {
      console.error("Error fetching evidences:", err);
      setError("Failed to load evidences");
      setLoading(false);
    }
  };
   // Handle file selection
   const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    console.log("Selected file:", event.target.files[0]);
  };

  const handleAccessChange = (idx, newAccess) => {
    setEvidences(rs => {
      const copy = [...rs];
      copy[idx] = { ...copy[idx], access: newAccess };
      return copy;
    });
  };
  const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";

const handleEdit = idx => {
  const ev = evidences[idx];
  setEditIndex(idx);
  setOriginalDesc(ev.evidenceDescription);

  const hasFile = !!(ev.signedUrl || ev.originalName || ev.filename);
  const hasLink = !!ev.link;

  setEvidenceData({
    leadReturnId:        ev.returnId,
    collectionDate:      ev.collectionDate,
    disposedDate:        ev.disposedDate,
    type:                ev.type,
    evidenceDescription: ev.evidenceDescription,
    disposition:         ev.disposition,
    isLink:              hasLink,          // keep for backward compatibility
    link:                ev.link || "",
    originalName:        ev.originalName,
    filename:            ev.filename,
    uploadMode:          hasLink ? "link" : hasFile ? "file" : "none", // NEW
  });

  if (fileInputRef.current) fileInputRef.current.value = "";
};

  
  const handleDelete = async idx => {
    if (!window.confirm("Delete this evidence?")) return;
    const ev = evidences[idx];
    const token = localStorage.getItem("token");
    const url = `/api/lrevidence/${selectedLead.leadNo}/` +
                `${encodeURIComponent(selectedLead.leadName)}/` +
                `${selectedCase.caseNo}/` +
                `${encodeURIComponent(selectedCase.caseName)}/` +
                `${ev.returnId}/` +
                `${encodeURIComponent(ev.evidenceDescription)}`;
    try {
      await api.delete(url, { headers:{ Authorization:`Bearer ${token}` } });
      setEvidences(list => list.filter((_,i)=>i!==idx));

    } catch (err) {
      console.error(err);
      setAlertMessage("Failed to delete: " + (err.response?.data?.message||err.message));
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
  
    const { status, isReadOnly } = useLeadStatus({
    caseNo: selectedCase.caseNo,
    caseName: selectedCase.caseName,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
  });

  return (
    <div className="lrevidence-container">
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
  isOpen={deleteOpen}
  title="Confirm Delete"
  message="Are you sure you want to delete this evidence? This action cannot be undone."
  onConfirm={confirmDelete}
  onClose={() => { setDeleteOpen(false); setPendingDeleteIndex(null); }}
/>


        <div className="top-menu"   style={{ paddingLeft: '20%' }}>
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
       
       </div>

      <div className="LRI_Content">
    
                  <SideBar  activePage="CasePageManager" />
                <div className="left-content">
                <div className="top-menu1" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
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
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRPictures')} >
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
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Evidences
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
        ? ` Lead Status:  ${status}`
    : ` ${leadStatus}`}
</h5>

          </div>
    
        <div className="case-header">
          <h2 className="">EVIDENCE INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Evidence Form */}
        <div className = "timeline-form-sec-enc">
          <div className="enclosure-form">
          <div className="form-row-evidence">
            <label  className="evidence-head">Collection Date*</label>
            <input
              type="date"
              value={evidenceData.collectionDate}
             
              onChange={(e) => handleInputChange("collectionDate", e.target.value)}
            />
            <label className="evidence-head">Disposed Date</label>
            <input
              type="date"
              value={evidenceData.disposedDate}
            
              onChange={(e) => handleInputChange("disposedDate", e.target.value)}
            />
            <label className="evidence-head">Narrative Id*</label>
            <select
              value={evidenceData.leadReturnId}
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
            >
              <option value="">Select Narrative Id</option>
              {narrativeIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>

          </div>
          <div className="form-row-evidence">
            <label className="evidence-head">Type</label>
            <input
              type="text"
              value={evidenceData.type}
            
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <label className="evidence-head">Description</label>
<textarea
  value={evidenceData.evidenceDescription}
  onChange={e => handleInputChange("evidenceDescription", e.target.value)}
/>
{/* Upload Type */}
<div className="form-row-evidence">
  <label>Upload Type</label>
  <select
    value={evidenceData.uploadMode}
    onChange={e => {
      const mode = e.target.value; // 'none' | 'file' | 'link'
      setEvidenceData(prev => ({
        ...prev,
        uploadMode: mode,
        isLink: mode === "link", // keep this in sync for server
        link: mode === "link" ? prev.link : "", // clear link if not link mode
      }));
      // clear the file input if leaving 'file' mode
      if (mode !== "file") {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }}
  >
    <option value="none">None</option>
    <option value="file">File</option>
    <option value="link">Link</option>
  </select>
</div>

{evidenceData.uploadMode === "file" && (
  <div className="form-row-evidence">
    <label>{editIndex === null ? "Upload File" : "Replace File (optional)"}</label>
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  </div>
)}

{evidenceData.uploadMode === "link" && (
  <div className="form-row-evidence">
    <label>Paste Link</label>
    <input
      type="text"
      placeholder="https://..."
      value={evidenceData.link}
      onChange={e => setEvidenceData(prev => ({ ...prev, link: e.target.value }))}
    />
  </div>
)}


{/* If editing a file‐upload entry, show current filename */}
{editIndex !== null && !evidenceData.isLink && evidenceData.originalName && (
  <div className="form-row-evidence">
    <label>Current File:</label>
    <span className="current-filename">
      {evidenceData.originalName}
    </span>
  </div>
)}

{/* File vs Link input */}
{!evidenceData.isLink ? (
  <div className="form-row-evidence">
    <label>
      {editIndex === null ? "Upload File" : "Replace File (optional)*"}
    </label>
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  </div>
) : (
  <div className="form-row-evidence">
    <label>Paste Link*</label>
    <input
      type="text"
      placeholder="https://..."
      value={evidenceData.link}
      onChange={e =>
        setEvidenceData(prev => ({ ...prev, link: e.target.value }))
      }
    />
  </div>
)}

        </div>
  
        <div className="form-buttons">
  <button
    disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
    className="save-btn1"
    onClick={handleSaveEvidence}
  >
    {editIndex === null ? "Add Evidence" : "Update Evidence"}
  </button>

  {editIndex !== null && (
    <button
      disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
      className="save-btn1"
      onClick={() => {
        // reset form back to “add” mode
        setEditIndex(null);
        setEvidenceData({
          leadReturnId:        "",
          evidenceDescription: "",
          collectionDate:      "",
          disposedDate:        "",
          type:                "",
          disposition:         "",
          isLink:              false,
          link:                "",
          originalName:        "",
          filename:            ""
        });
        setEvidenceData(defaultEvidence());
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }}
    >
      Cancel
    </button>
  )}
</div>

        </div>  
  

            {/* Evidence Table */}
            <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th style={{ width: "11%" }}> Narrative Id </th>
              <th>Type</th>
              {/* <th>Collection Date</th> */}
              {/* <th>Disposed Date</th> */}
              <th>File Name</th>
              <th>Description</th>
              <th>Actions</th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {evidences.length > 0 ?  evidences.map((item, index) => (
              <tr key={index}>
                <td>{item.dateEntered}</td>
                <td> {item.returnId} </td>
                <td>{item.type}</td>
                {/* <td>{item.collectionDate}</td> */}
                {/* <td>{item.disposedDate}</td> */}
                <td>
  {item.link ? (
    // if it's a link‐type upload
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {item.link}
    </a>
  )  : item.signedUrl ? (
                    <a href={item.signedUrl} target="_blank" rel="noopener noreferrer" className="link-button">
                      {item.originalName}
                    </a>
                  ) : (
                    <span style={{ color: "gray" }}>No File Available</span>
                  )}
                </td>

                <td>{item.evidenceDescription}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEdit(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => requestDelete(index)}
                />
                  </button>
                  </div>
                </td>
                {isCaseManager && (
          <td>
            <select
              value={item.access}
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
          <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign:'center' }}>
            No Evidences Available
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
)}  */}

        <Comment tag = "Evidence"/>
        </div>
        </div>

        {/* Action Buttons */}
        {/* <div className="form-buttons-evidence">
          <button className="add-btn" onClick={handleAddEvidence}>Add Evidence</button>
          <button className="back-btn" onClick={() => handleNavigation("/LREnclosures")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRPictures")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
     

      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRPictures")} // Takes user to CM Return page
      />
    </div>
    </div>
   </div>
  );
};
