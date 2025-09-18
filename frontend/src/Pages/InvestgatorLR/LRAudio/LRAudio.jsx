import Navbar from '../../../components/Navbar/Navbar';
import "./LRAudio.css"; // Custom CSS file for Audio styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';


export const LRAudio = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
  const navigate = useNavigate();
  const FORM_KEY = "LRAudio:form";
  const LIST_KEY = "LRAudio:list";
  const location = useLocation();
  const [leadData, setLeadData] = useState({});
  const { selectedCase, selectedLead, setSelectedLead , leadStatus, setLeadStatus} = useContext(CaseContext);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
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
  const [editingId, setEditingId] = useState(null);
  const isEditing   = editingId !== null;
// const formState   = isEditing ? editData : audioData;
// const onField     = isEditing ? handleEditInput : handleInputChange;
// const onFileField = isEditing ? handleEditFileChange : handleFileChange;
// const onSubmit    = isEditing ? handleUpdateAudio : handleAddAudio;

      // const [editData, setEditData] = useState({
      //   dateAudioRecorded: "",
      //   description: "",
      //   leadReturnId: "",
      //   file: null,
      // });

  // Sample audio data
  const [audioFiles, setAudioFiles] = useState(() => {
   const saved = sessionStorage.getItem(LIST_KEY);
   return saved ? JSON.parse(saved) : [];
 });

 // Narrative Ids from API
const [narrativeIds, setNarrativeIds] = useState([]);

const DEFAULT_AUDIO = {
  dateAudioRecorded: "",
  description: "",
  audioSrc: "",
  leadReturnId: "",
  isLink: false,
  link: "",
  filename: "",
  accessLevel: "Everyone",   // ✅ default that matches your schema enum
};

const savedDraft = sessionStorage.getItem(FORM_KEY);
const [audioData, setAudioData] = useState(() => {
  try {
    return { ...DEFAULT_AUDIO, ...(savedDraft ? JSON.parse(savedDraft) : {}) };
  } catch {
    return DEFAULT_AUDIO;
  }
});

const normalizeId = (id) => String(id ?? "").trim().toUpperCase();
const alphabetToNumber = (str = "") => {
  str = normalizeId(str);
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

      // Get all narrative rows for this lead/case
      const resp = await api.get(
        `/api/leadReturnResult/${leadNo}/${encLead}/${caseNo}/${encCase}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: ac.signal }
      );

      // Unique, cleaned ids (skip blanks)
      const ids = [...new Set((resp?.data || [])
        .map(r => normalizeId(r?.leadReturnId))
        .filter(Boolean))];

      // Sort in a predictable way (A..Z..AA..AB..)
      ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));

      setNarrativeIds(ids);

      // If ADDING a new audio (not editing) and no id chosen yet → preselect latest
      setAudioData(prev =>
        (!isEditing && !prev.leadReturnId)
          ? { ...prev, leadReturnId: ids.at(-1) || "" }
          : prev
      );
    } catch (err) {
      if (!ac.signal.aborted) console.error("Failed to fetch Narrative Ids:", err);
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


  // State to manage form data
//  const [audioData, setAudioData] = useState(() => {
//    const saved = sessionStorage.getItem(FORM_KEY);
//    return saved
//      ? JSON.parse(saved)
//      : {
//          dateAudioRecorded: "",
//          description: "",
//          audioSrc: "",
//          leadReturnId: "",
//          isLink: false,
//          link: "",
//          accessLevel: "Everyone"
//        };
//  });

  const handleInputChange = (field, value) => {
    setAudioData({ ...audioData, [field]: value });
  };

  // Persist draft form whenever it changes
useEffect(() => {
  sessionStorage.setItem(FORM_KEY, JSON.stringify(audioData));
}, [audioData]);

// Persist list whenever it changes
useEffect(() => {
  sessionStorage.setItem(LIST_KEY, JSON.stringify(audioFiles));
}, [audioFiles]);


  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const audioUrl = URL.createObjectURL(selectedFile);
      setFile(selectedFile); // ✅ This was missing
      setAudioData({ ...audioData, audioSrc: audioUrl, filename: selectedFile.name });
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
  
  

  const handleAddAudio = async () => {
  // 1️⃣ Validation:
  if (
    audioData.isLink
      ? !audioData.link.trim() || !audioData.leadReturnId || !audioData.dateAudioRecorded
      : !file || !audioData.leadReturnId || !audioData.dateAudioRecorded || !audioData.description
  ) {
    setAlertMessage("Please fill in all required fields and either select a file or enter a valid link.");
    setAlertOpen(true);
    return;
  }

  // 2️⃣ Build FormData
  const formData = new FormData();
  if (!audioData.isLink) {
    formData.append("file", file);
  }
  formData.append("leadNo", selectedLead.leadNo);
  formData.append("description", selectedLead.leadName);
  formData.append("enteredBy", localStorage.getItem("loggedInUser"));
  formData.append("caseName", selectedCase.caseName);
  formData.append("caseNo", selectedCase.caseNo);
  formData.append("leadReturnId", audioData.leadReturnId);
  formData.append("enteredDate", new Date().toISOString());
  formData.append("dateAudioRecorded", audioData.dateAudioRecorded);
  formData.append("audioDescription", audioData.description);
  formData.append("accessLevel", audioData.accessLevel || "Everyone");

  // 3️⃣ Link fields
  formData.append("isLink", audioData.isLink);
  if (audioData.isLink) {
    formData.append("link", audioData.link.trim());
  }

  try {
    const token = localStorage.getItem("token");
    const response = await api.post("/api/lraudio/upload", formData, {
      headers: {
        "Content-Type": undefined,
        "Authorization": `Bearer ${token}`
      }
    });

    // 4️⃣ On success, append to your state and/or re‐fetch
    await fetchAudioFiles();

    // 5️⃣ Reset form state
    setAudioData({
      dateAudioRecorded: "",
      description: "",
      leadReturnId: "",
      isLink: false,
      link: "",
      audioSrc: "",
      filename: ""
    });
    setFile(null);
    
    // after resetting audioData and file...
    sessionStorage.removeItem(FORM_KEY);

  } catch (error) {
    console.error("Error uploading audio:", error);
    setAlertMessage("Failed to upload audio.");
    setAlertOpen(true);
  }
};


  const handleNavigation = (route) => {
    navigate(route);
  };
    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                  const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
                
                  const onShowCaseSelector = (route) => {
                    navigate(route, { state: { caseDetails } });
                };

                const fetchAudioFiles = async () => {
  const token = localStorage.getItem("token");
  const leadNo = selectedLead.leadNo;
  const leadName = encodeURIComponent(selectedLead.leadName);
  const caseNo = selectedCase.caseNo;
  const caseName = encodeURIComponent(selectedCase.caseName);

  try {
    const res = await api.get(`/api/lraudio/${leadNo}/${leadName}/${caseNo}/${caseName}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const mappedAudios = res.data.map(a => ({
      dateEntered: formatDate(a.enteredDate),
      returnId: a.leadReturnId,
      dateAudioRecorded: formatDate(a.dateAudioRecorded),
      rawDateAudioRecorded: a.dateAudioRecorded,
      description: a.audioDescription,
      id: a._id,
      originalName: a.originalName || "",
       accessLevel: a.accessLevel || "Everyone" ,
       filename: a.filename || "", 

      // If server returns a 'link' field, use that. Otherwise build file URL:
      isLink: a.isLink,
      link: a.link || "",
      audioSrc: a.isLink ? a.link : `${BASE_URL}/uploads/${a.filename}`
    }));

    // Default access:
    const withAccess = mappedAudios.map(r => ({
      ...r,
      accessLevel: r.accessLevel ?? "Everyone"
    }));

    setAudioFiles(withAccess);
  } catch (error) {
    console.error("Error fetching audios:", error);
  }
};


                useEffect(() => {
                  if (
                    selectedLead?.leadNo &&
                    selectedLead?.leadName &&
                    selectedCase?.caseNo &&
                    selectedCase?.caseName
                  ) {
                    fetchAudioFiles();
                  }
                }, [selectedLead, selectedCase]);
                  const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";
                
    const handleAccessChange = (idx, newAccessLevel) => {
  setAudioFiles(rs => {
    const copy = [...rs];
    copy[idx] = { ...copy[idx], accessLevel: newAccessLevel };
    return copy;
  });
};



                const handleDeleteAudio = async idx => {
                   if (!window.confirm("Delete this audio?")) return;
                     const a = audioFiles[idx];
                    const leadNo   = selectedLead.leadNo;
                     const leadName = encodeURIComponent(selectedLead.leadName);
                      const caseNo   = selectedCase.caseNo;
                      const caseName = encodeURIComponent(selectedCase.caseName);
                      await api.delete(
                        `/api/lraudio/${a.id}`,
                        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                      );
             
                  setAudioFiles(prev => prev.filter((_, i) => i !== idx));
                  };


  // const handleEditInput = (field, value) => {
  //   setEditData(prev => ({ ...prev, [field]: value }));
  // };

  // const handleEditFileChange = (e) => {
  //   const f = e.target.files[0];
  //   if (f) setEditData(prev => ({ ...prev, file: f }));
  // };

// Populate form from an existing row
const handleEditAudio = idx => {
  const a = audioFiles[idx];
  setEditingId(idx);
    if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
  setFile(null);

  setAudioData({
    dateAudioRecorded: new Date(a.rawDateAudioRecorded).toISOString().slice(0,10),
    leadReturnId: a.returnId,
    description: a.description,
    // NEW: populate isLink & link
    isLink: a.isLink,
    link: a.isLink ? a.link : "",
    // existing file data
    audioSrc: a.isLink ? "" : a.audioSrc,
    filename: a.isLink ? "" : a.originalName,
     accessLevel: a.accessLevel || "Everyone"
  });
};

// const handleUpdateAudio = async () => {
//   const idx = editingId;
//   const a   = audioFiles[idx];
//   const fd  = new FormData();

//   fd.append("leadReturnId", audioData.leadReturnId);
//   fd.append("dateAudioRecorded", audioData.dateAudioRecorded);
//   fd.append("audioDescription", audioData.description);
//     fd.append("accessLevel", audioData.accessLevel);


  
//   fd.append("isLink", audioData.isLink);
//   if (audioData.isLink) {
//     fd.append("link", audioData.link.trim());
//   } else if (file) {
//     fd.append("file", file);
//   }

//   try {
//     const token = localStorage.getItem("token");
//     await api.put(`/api/lraudio/${a.id}`, fd, {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     });

//     await fetchAudioFiles();
//     setEditingId(null);
//     setAudioData({
//       dateAudioRecorded: "",
//       leadReturnId: "",
//       description: "",
//       isLink: false,
//       link: "",
//       audioSrc: "",
//       filename: ""
//     });
//     setFile(null);
//   } catch (error) {
//     console.error("Error updating audio:", error);
//     alert("Failed to update audio.");
//   }
// };

const handleUpdateAudio = async () => {
  const idx = editingId;
  const a   = audioFiles[idx];
  const fd  = new FormData();

  // 1️⃣ Always send these fields:
  fd.append("leadReturnId", audioData.leadReturnId);
  fd.append("dateAudioRecorded", audioData.dateAudioRecorded);
  fd.append("audioDescription", audioData.description);
  fd.append("accessLevel", audioData.accessLevel || "Everyone");

  // 2️⃣ Indicate link‐mode or file‐mode
  fd.append("isLink", audioData.isLink);
  if (audioData.isLink) {
    fd.append("link", audioData.link.trim());
  } else if (file) {
    // only append a new file if the user chose a replacement
    fd.append("file", file);
  }

  try {
    const token = localStorage.getItem("token");
    await api.put(
      `/api/lraudio/${a.id}`,
      fd,
      {
        headers: {
          Authorization: `Bearer ${token}`
          // ⇢ No Content-Type here!
        },
        transformRequest: [(data, headers) => {
          // ← UPDATED: remove any default Content-Type so the browser sets
          //     multipart/form-data; boundary=… automatically
          delete headers["Content-Type"];
          return data;
        }]
      }
    );

    // 3️⃣ Re-fetch the list from the server
    await fetchAudioFiles();

    // 4️⃣ Clear editing state
    setEditingId(null);
    setAudioData(DEFAULT_AUDIO);
    setFile(null);

    if (fileInputRef.current) fileInputRef.current.value = ""; // clear filename display

    // 5️⃣ Clear the file <input>
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // after resetting audioData and file...
sessionStorage.removeItem(FORM_KEY);

  } catch (error) {
    console.error("Error updating audio:", error);
    setAlertMessage("Failed to update audio.");
    setAlertOpen(true);
  }
};

    const { status, isReadOnly } = useLeadStatus({
    caseNo: selectedCase.caseNo,
    caseName: selectedCase.caseName,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
  });

                      

  return (
    <div className="lraudio-container">
      {/* Navbar */}
      <Navbar />
       <AlertModal
          isOpen={alertOpen}
          title="Notification"
          message={alertMessage}
          onConfirm={() => setAlertOpen(false)}
          onClose={()   => setAlertOpen(false)}
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
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideo")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
        </div>
      </div> */}
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
                   <span className="menu-item active" >Add/View Lead Return</span>
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
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LRAudio')} >
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
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Audios
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
        ? ` Lead Status:  ${status}`
    : ` ${leadStatus}`}
</h5>

          </div>

        <div className="case-header">
          <h2 className="">AUDIO INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Audio Form */}
        <div className = "timeline-form-sec">
        <div className="audio-form">
          <div className="form-row-audio">
            <label className="evidence-head">Date Audio Recorded*</label>
            <input
              type="date"
              value={audioData.dateAudioRecorded}
              className="evidence-head"
              onChange={(e) => handleInputChange("dateAudioRecorded", e.target.value)}
            />
          </div>
          <div className="form-row-audio">
            <label className="evidence-head">Narrative Id*</label>
            <select
              value={audioData.leadReturnId}
              className="evidence-head"
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
            >
              <option value="">Select Narrative Id</option>

              {/* keep current value visible even if it's not in the latest API list (e.g., old record) */}
              {audioData.leadReturnId &&
                !narrativeIds.includes(normalizeId(audioData.leadReturnId)) && (
                  <option value={audioData.leadReturnId}>
                    {audioData.leadReturnId}
                  </option>
                )
              }

              {narrativeIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>

          </div>
          <div className="form-row-audio">
            <label className="evidence-head">Description</label>
            <textarea
              value={audioData.description}
              className="evidence-head"
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
          <div className="form-row-audio">
  <label>Upload Type</label>
  <select
    value={audioData.isLink ? "link" : "file"}
    onChange={e =>
      setAudioData(prev => ({
        ...prev,
        isLink: e.target.value === "link",
        link: ""    // clear the link field whenever you flip back to “file”‐mode
      }))
    }
  >
    <option value="file">File</option>
    <option value="link">Link</option>
  </select>
</div>
        {/* If not link‐mode, show file input */}
{!audioData.isLink ? (
  <div className="form-row-audio">
    <label>{isEditing ? "Replace Audio (optional)" : "Upload Audio*"}</label>
    <input
      type="file"
      accept="audio/*"
      ref={fileInputRef}                  

      onChange={handleFileChange}
    />
    {/* If editing and the entry already had a filename, show it: */}
    {isEditing && audioData.filename && (
      <div className="current-filename">
        Current File: {audioData.filename}
      </div>
    )}
  </div>
) : (
  /* Otherwise, link‐mode: */
  <div className="form-row-audio">
    <label>Paste Link*:</label>
    <input
      type="text"
      placeholder="https://..."
      value={audioData.link}
      onChange={e =>
        setAudioData(prev => ({ ...prev, link: e.target.value }))
      }
    />
  </div>
)}
<div className="form-row-audio">
  <label>Access Level</label>
  <select
    value={audioData.accessLevel || "Everyone"}
    onChange={e =>
      setAudioData(prev => ({ ...prev, accessLevel: e.target.value }))
    }
  >
    <option value="Everyone">Everyone</option>
    <option value="Case Manager">Case Manager Only</option>
  </select>
</div>


        </div>
        <div className="form-buttons-audio">
        {/* <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

          className="save-btn1" onClick={handleAddAudio}>Add Audio</button> */}

  <button
  disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}
   onClick={ isEditing ? handleUpdateAudio : handleAddAudio }
    className="save-btn1"
 >
   {isEditing ? "Update Audio" : "Add Audio"}
  </button>
  {isEditing && (
    <button
     className="save-btn1"
     onClick={() => {
        setEditingId(null);
 setAudioData(DEFAULT_AUDIO);
  setFile(null);
 if (fileInputRef.current) fileInputRef.current.value = "";
    }}
   >Cancel</button>
  )}
         </div>
         {/* Uploaded Audio Preview */}
        <div className="uploaded-audio">
          {/* <h4 className="evidence-head">Uploaded Audio</h4> */}
          <div className="audio-gallery">
            {audioFiles.map((audio, index) => (
              <div key={index} className="audio-card">
                <audio controls>
                  <source src={audio.audioSrc} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
                <p>{audio.description}</p>
              </div>
            ))}
          </div>
        </div>
        </div>

           {/* Audio Files Table */}
           <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>Date Entered</th>
              <th style={{ width: "12%" }}>Narrative Id </th>
              {/* <th>Date Audio Recorded</th> */}
              <th>File Name</th>
              <th>Description</th>
              <th style={{ width: "13%" }}>Actions</th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {audioFiles.length > 0 ? audioFiles.map((audio, index) => (
              <tr key={index}>
                <td>{audio.dateEntered}</td>
                <td>{audio.returnId}</td>
                {/* <td>{audio.dateAudioRecorded}</td> */}
                 <td>
  <a
    href={audio.audioSrc}
    target="_blank"
    rel="noopener noreferrer"
    className="link-button"
  >
    {audio.originalName || (audio.isLink ? audio.link : "Download")}
  </a>
</td>

                <td>{audio.description}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditAudio(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => handleDeleteAudio(index)}
                />
                  </button>
                  </div>
                </td>
                {isCaseManager && (
          <td>
            <select
              value={audio.accessLevel}
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
            No Audio Data Available
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

        <Comment tag="Audio" />
      </div>
      </div>

       

        {/* Action Buttons */}
        {/* <div className="form-buttons-audio">
          <button className="add-btn" onClick={handleAddAudio}>Add Audio</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRPictures")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRVideos")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
      
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVideo")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
