import React, { useContext, useState, useEffect, useRef} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./LREnclosures.css"; // Custom CSS file for Enclosures styling
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Comment from "../../../components/Comment/Comment";
import api, { BASE_URL } from "../../../api";
import Attachment from "../../../components/Attachment/Attachment";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';



export const LREnclosures = () => {

  const navigate = useNavigate(); 
  const FORM_KEY = "LREnclosures:form";
  const LIST_KEY = "LREnclosures:list";
  const location = useLocation();
  const [formData, setFormData] = useState({ /* your fields */ });
  const fileInputRef = useRef();
  const [leadData, setLeadData] = useState({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [narrativeIds, setNarrativeIds] = useState([]);

  const { leadDetails, caseDetails } = location.state || {};


    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date)) return "";
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    };

    const alphabetToNumber = (str) => {
      if (!str) return 0;
      let n = 0;
      for (let i = 0; i < str.length; i++) n = n * 26 + (str.charCodeAt(i) - 64); // 'A' = 65
      return n;
    };

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);  
  
    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
    
    const onShowCaseSelector = (route) => {
        navigate(route, { state: { caseDetails } });
    };

  const [enclosureData, setEnclosureData] = useState(() => {
  const saved = sessionStorage.getItem(FORM_KEY);
  return saved
    ? JSON.parse(saved)
    : {
        returnId: '',
        type: '',
        enclosure: '',
        isLink: false,
        link: '',
        originalName: '',
        filename: ''
      };
});

// Master list
const [enclosures, setEnclosures] = useState(() => {
  const saved = sessionStorage.getItem(LIST_KEY);
  return saved ? JSON.parse(saved) : [];
});

  const handleInputChange = (field, value) => {
    setEnclosureData({ ...enclosureData, [field]: value });
    console.log(`enclosureData.${field} updated to: `, value);
  };

    const [file, setFile] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [originalDesc, setOriginalDesc] = useState("");

   // Handle file selection
   const handleFileChange = (event) => {
    console.log("event.target.files:", event.target.files);
    const selected = event.target.files[0];
    console.log("selected file:", selected);
    setFile(selected);
  };
  const handleAddEnclosure = () => {
    const newEnclosure = {
      dateEntered: new Date().toLocaleDateString(),
      type: enclosureData.type,
      enclosure: enclosureData.enclosure,
      returnId: enclosureData.returnId,
    };

    console.log("New Enclosure to add:", newEnclosure);

    // Add new enclosure to the list
    setEnclosures([...enclosures, newEnclosure]);

    // Clear form fields
    setEnclosureData({
      returnId: '',
      type: "",
      enclosure: "",
    });
  };

  // save draft
useEffect(() => {
  sessionStorage.setItem(FORM_KEY, JSON.stringify(enclosureData));
}, [enclosureData]);

// save list
useEffect(() => {
  sessionStorage.setItem(LIST_KEY, JSON.stringify(enclosures));
}, [enclosures]);


   // Helper to get the current list for this lead+case
   const fetchEnclosuresForLead = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);

    try {
      const { data } = await api.get(
        `/api/lrenclosure/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // map date & description fields for display
      const mapped = data.map((enc) => ({
        dateEntered: new Date(enc.enteredDate).toLocaleDateString(),
        type: enc.type,
        enclosure: enc.enclosureDescription,
        returnId: enc.leadReturnId,
        originalName: enc.originalName,
        filename:      enc.filename,  
        link:        enc.link || ""
      }));

      setEnclosures(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load enclosures");
    } finally {
      setLoading(false);
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

  useEffect(() => {
  if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;

  const ac = new AbortController();

  (async () => {
    try {
      const token = localStorage.getItem("token");
      const encLead = encodeURIComponent(selectedLead.leadName);
      const encCase = encodeURIComponent(selectedCase.caseName);

      // same endpoint used elsewhere to list lead returns
      const resp = await api.get(
        `/api/leadReturnResult/${selectedLead.leadNo}/${encLead}/${selectedCase.caseNo}/${encCase}`,
        { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
      );

      const ids = [...new Set((resp?.data || []).map(r => r?.leadReturnId).filter(Boolean))];
      ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
      setNarrativeIds(ids);

      // default Narrative Id for NEW enclosure forms (not editing)
      setEnclosureData(prev =>
        (editIndex === null && !prev.returnId)
          ? { ...prev, returnId: ids.at(-1) || "" }
          : prev
      );
    } catch (e) {
      if (!ac.signal.aborted) {
        console.error("Failed to fetch Narrative IDs:", e);
      }
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
  


  const handleSave = async () => {
    // Validation: must supply a file or link when creating
    if (editIndex === null && !file && !enclosureData.isLink) {
      // alert("Please select a file to upload or enter a valid link.");
        setAlertMessage("Please select a file to upload or enter a valid link.");
                      setAlertOpen(true);
      return;
    }
  
    const fd = new FormData();
  
    // Add file if not a link upload
    if (!enclosureData.isLink && file) {
      fd.append("file", file);
    }
  
    // Add common fields
    fd.append("leadNo", selectedLead.leadNo);
    fd.append("description", selectedLead.leadName);
    fd.append("enteredBy", localStorage.getItem("loggedInUser"));
    fd.append("caseName", selectedCase.caseName);
    fd.append("caseNo", selectedCase.caseNo);
    fd.append("leadReturnId", enclosureData.returnId);
    fd.append("enteredDate", new Date().toISOString());
    fd.append("type", enclosureData.type);
    fd.append("enclosureDescription", enclosureData.enclosure);
  
    // Link-related fields
    fd.append("isLink", enclosureData.isLink || false);
    if (enclosureData.isLink) {
      fd.append("link", enclosureData.link || "");
    }
  
    const token = localStorage.getItem("token");
  
    try {
      if (editIndex === null) {
        // CREATE
        await api.post("/api/lrenclosure/upload", fd, {
          headers: { Authorization: `Bearer ${token}` },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        });
        // alert("Enclosure added");
      } else {
        // UPDATE
        const { leadReturnId } = enclosureData;

        const url = `/api/lrenclosure/${selectedLead.leadNo}/` +
                    `${encodeURIComponent(selectedLead.leadName)}/` +
                    `${selectedCase.caseNo}/` +
                    `${encodeURIComponent(selectedCase.caseName)}/` +
                    `${enclosureData.returnId}/` +
                    `${encodeURIComponent(originalDesc)}`;
  
        await api.put(url, fd, {
          headers: { Authorization: `Bearer ${token}` },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        });
        // alert("Enclosure updated");
      }
  
      // Refresh & reset form
      await fetchEnclosures();
      setEnclosureData({ returnId: "", type: "", enclosure: "", isLink: false, link: "" });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditIndex(null);
      setOriginalDesc("");
    } catch (err) {
      console.error("Save error:", err.response || err);
       setAlertMessage("Save failed: " + (err.response?.data?.message || err.message));
                      setAlertOpen(true);
    }
  };
  

  // start editing
  const handleEdit = idx => {
    const enc = enclosures[idx];
    setEditIndex(idx);
    setOriginalDesc(enc.enclosure);
    setEnclosureData({
      returnId: enc.returnId,
      type:     enc.type,
      enclosure:enc.enclosure,
      isLink: !!enc.link,
    link: enc.link || "",
    originalName: enc.originalName, // ← grab it here
    filename:     enc.filename 
    });
    // clear file input so user can choose new one if desired
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // delete
  const handleDelete = async idx => {
    if (!window.confirm("Delete this enclosure?")) return;
    const enc = enclosures[idx];
    const token = localStorage.getItem("token");
    try {
      const url = `/api/lrenclosure/${selectedLead.leadNo}/` +
                  `${encodeURIComponent(selectedLead.leadName)}/` +
                  `${selectedCase.caseNo}/` +
                  `${encodeURIComponent(selectedCase.caseName)}/` +
                  `${enc.returnId}/` +
                  `${encodeURIComponent(enc.enclosure)}`;
      await api.delete(url, {
        headers:{ Authorization:`Bearer ${token}` }
      });
      // remove immediately
      setEnclosures(list => list.filter((_,i)=>i!==idx));
      // alert("Deleted");
    } catch (err) {
      console.error(err);
      setAlertMessage("Failed to delete");
                      setAlertOpen(true);
      
    }
  };
  

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchEnclosures();
    }
  }, [selectedLead, selectedCase]);
  const fetchEnclosures = async () => {
    const token = localStorage.getItem("token");
  
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName); // encode to handle spaces
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);
  
    try {
      const res = await api.get(
        `/api/lrenclosure/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            "Content-Type": undefined,   
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const mappedEnclosures = res.data.map((enc) => ({
        dateEntered: formatDate(enc.enteredDate),
        type: enc.type,
        enclosure: enc.enclosureDescription,
        returnId: enc.leadReturnId,
        originalName: enc.originalName,
        link: enc.link || "",
        filename: enc.filename, 
      }));

      const withAccess = mappedEnclosures.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
  
      setEnclosures(withAccess);
      setLoading(false);
      setError("");
    } catch (err) {
      console.error("Error fetching enclosures:", err);
      setError("Failed to load enclosures");
      setLoading(false);
    }
  };
  
   const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";
  const handleAccessChange = (idx, newAccess) => {
    setEnclosures(rs => {
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
    <div className="lrenclosures-container">
      {/* Navbar */}
      <Navbar />
       <AlertModal
                          isOpen={alertOpen}
                          title="Notification"
                          message={alertMessage}
                          onConfirm={() => setAlertOpen(false)}
                          onClose={()   => setAlertOpen(false)}
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
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREvidence')} >
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
              
               <div className="caseandleadinfo">
          <h5 className = "side-title"> 
             {/* Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""} */}
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Enclosures
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
          <h2 className="">ENCLOSURES INFORMATION</h2>
        </div>
     

      <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Enclosure Form */}
        <div className = "timeline-form-sec-enc">
        <div className="enclosure-form">
        <div className="form-row-evidence">
            <label>Narrative Id *</label>
            <select
              value={enclosureData.returnId}
              onChange={(e) => handleInputChange("returnId", e.target.value)}
            >
              <option value="">Select Narrative Id</option>
              {narrativeIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <div className="form-row-evidence">
            <label>Enclosure Type</label>
            <input
              type="text"
              value={enclosureData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label>Enclosure Description</label>
            <textarea
              value={enclosureData.enclosure}
              onChange={(e) => handleInputChange("enclosure", e.target.value)}
            ></textarea>
          </div>
          {/* <div className="form-row-evidence">
            <label>Upload File:</label>
          
<input
  type="file"
  name="file"               
  ref={fileInputRef}      
  onChange={handleFileChange}
/>

          </div> */}
          <div className="form-row-evidence">
  <label>Upload Type</label>
  <select
    value={enclosureData.isLink ? "link" : "file"}
    onChange={(e) =>
      setEnclosureData((prev) => ({
        ...prev,
        isLink: e.target.value === "link",
        link: "", // Reset link if switching from file
      }))
    }
  >
    <option value="file">File</option>
    <option value="link">Link</option>
  </select>
</div>
{/* {!enclosureData.isLink ? (
  <div className="form-row-evidence">
    <label>Upload File:</label>
    <input
      type="file"
      name="file"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  </div>
) : (
  <div className="form-row-evidence">
    <label>Paste Link:</label>
    <input
      type="text"
      placeholder="Enter URL (https://...)"
      value={enclosureData.link || ""}
      onChange={(e) =>
        setEnclosureData((prev) => ({ ...prev, link: e.target.value }))
      }
    />
  </div>
)} */}

{editIndex !== null && !enclosureData.isLink && enclosureData.originalName && (
  <div className="form-row-evidence">
    <label>Current File:</label>
    <span className="current-filename">
      {enclosureData.originalName}
    </span>
  </div>
)}

{!enclosureData.isLink ? (
  <div className="form-row-evidence">
    <label>{editIndex === null ? 'Upload File*' : 'Replace File (optional):'}</label>
    <input
      type="file"
      name="file"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  </div>
) : (
  <div className="form-row-evidence">
    <label>Paste Link:</label>
    <input
      type="text"
      placeholder="Enter URL (https://...)"
      value={enclosureData.link || ""}
      onChange={e =>
        setEnclosureData(prev => ({ ...prev, link: e.target.value }))
      }
    />
  </div>
)}


        </div>

           {/* Action Buttons */}
          <div className="form-buttons">
              <button
                disabled={selectedLead?.leadStatus==="In Review" || selectedLead?.leadStatus==="Completed" || isReadOnly}
                onClick={handleSave}
                className='save-btn1'
              >
                {editIndex === null ? "Add Enclosure" : "Save Changes"}
              </button>
              {editIndex !== null && (
                <button 
                disabled={selectedLead?.leadStatus==="In Review" || selectedLead?.leadStatus==="Completed" || isReadOnly}
                className='save-btn1'
                onClick={() => {
                  setEditIndex(null);
                  setEnclosureData({ returnId:"", type:"", enclosure:"" });
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}>
                  Cancel
                </button>
              )}
            </div>
    
        </div>

              {/* Enclosures Table */}
              <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Narrative Id </th>
              <th>Type</th>
              <th>Enclosure</th>
              <th>File Name</th>
              <th>Actions</th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
          {enclosures.length > 0 ? (
            enclosures.map((enclosure, index) => (
              <tr key={index}>
                <td>{enclosure.dateEntered}</td>
                <td>{enclosure.returnId}</td>
                <td>{enclosure.type}</td>
                <td>{enclosure.enclosure}</td>
                <td>
  {enclosure.link ? (
    <a href={enclosure.link} target="_blank" rel="noopener noreferrer" className="link-button">
      {enclosure.link}
    </a>
  ) : (
    <a
      href={`${BASE_URL}/uploads/${enclosure.filename}`}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {enclosure.originalName}
    </a>
  )}
</td>

                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={()=>handleEdit(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={()=>handleDelete(index)}
                />
                  </button>
                  </div>
                </td>
              
                {isCaseManager && (
          <td>
            <select
              value={enclosure.access}
              onChange={e => handleAccessChange(index, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Case Manager Only</option>
            </select>
          </td>
        )}
      </tr>
       ))) : (
        <tr>
          <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign:'center' }}>
            No Enclosures Available
          </td>
        </tr>
      )}
          </tbody>
        </table>
         {/* <Attachment /> */}
                {/* <Attachment attachments={enclosures.map(e => ({
                    name: e.originalName || e.filename,
                    // Optionally include size and date if available:
                    size: e.size || "N/A",
                    date: e.enteredDate ? new Date(e.enteredDate).toLocaleString() : "N/A",
                    // Build a URL to view/download the file
                    url: `http://${BASE_URL}/uploads/${e.filename}`
                  }))} />
         */}

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
        <Comment tag= "Enclosures"/>
      </div>
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREvidence")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
