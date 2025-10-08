import React, { useContext, useState, useEffect,useRef, useMemo } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import "./LRVideo.css"; // Custom CSS file for Video styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';


export const LRVideo = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);
  const [editingIndex, setEditingIndex] = useState(null);
      const [leadData, setLeadData] = useState({});
       const [alertOpen, setAlertOpen] = useState(false);
          const [alertMessage, setAlertMessage] = useState("");
  const [narrativeIds, setNarrativeIds] = useState([]);

  const normalizeId = (id) => String(id ?? "").trim().toUpperCase();
const alphabetToNumber = (str = "") => {
  str = normalizeId(str);
  let n = 0;
  for (let i = 0; i < str.length; i++) n = n * 26 + (str.charCodeAt(i) - 64);
  return n;
};

const isEditing = editingIndex !== null;

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setVideoData({ ...videoData, videoSrc: URL.createObjectURL(selectedFile) }); // preview
    }
  };

const { formKey, listKey } = useMemo(() => {
const cn   = selectedCase?.caseNo ?? "NA";
const cNam = encodeURIComponent(selectedCase?.caseName ?? "NA");
const ln   = selectedLead?.leadNo ?? "NA";
const lNam = encodeURIComponent(selectedLead?.leadName ?? "NA");
 return {
   formKey: `LRVideo:form:${cn}:${cNam}:${ln}:${lNam}`,
   listKey: `LRVideo:list:${cn}:${cNam}:${ln}:${lNam}`,
  };
}, [
 selectedCase?.caseNo,
 selectedCase?.caseName,  selectedLead?.leadNo,
 selectedLead?.leadName,
]);

const DEFAULT_VIDEO = {
  dateVideoRecorded: "",
 leadReturnId: "",
 description: "",
 isLink: false,
  link: "",
  videoSrc: "",
 filename: "",
};
const [videoData, setVideoData] = useState(DEFAULT_VIDEO);

  // Open the confirm modal for a given row
const requestDeleteVideo = (idx) => {
  setPendingDeleteIndex(idx);
  setDeleteOpen(true);
};

// Close without deleting
const cancelDeleteVideo = () => {
  setDeleteOpen(false);
  setPendingDeleteIndex(null);
};

// Confirm delete (no window.confirm)
const confirmDeleteVideo = async () => {
  const idx = pendingDeleteIndex;
  setDeleteOpen(false);
  setPendingDeleteIndex(null);
  if (idx == null) return;

  const v = videos[idx];
  try {
    await api.delete(`/api/lrvideo/${v.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    setVideos(prev => prev.filter((_, i) => i !== idx));
  } catch (err) {
    console.error("Error deleting video:", err);
    setAlertMessage("Failed to delete video: " + (err.response?.data?.message || err.message));
    setAlertOpen(true);
  }
};
const [videos, setVideos] = useState([]);
      
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
      

  // Sample video data

    const handleFileChangeWrapper = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setVideoData({
        ...videoData,
        videoSrc: URL.createObjectURL(selectedFile),
        filename: selectedFile.name
      });
    }
  };

useEffect(() => {
  const savedForm = sessionStorage.getItem(formKey);
  setVideoData(savedForm ? JSON.parse(savedForm) : DEFAULT_VIDEO);

  const savedList = sessionStorage.getItem(listKey);
  setVideos(savedList ? JSON.parse(savedList) : []);

  setEditingIndex(null);
  setFile(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
}, [formKey, listKey]);

useEffect(() => {
  sessionStorage.setItem(formKey, JSON.stringify(videoData));
}, [formKey, videoData]);


useEffect(() => {
  sessionStorage.setItem(listKey, JSON.stringify(videos));
}, [listKey, videos]);


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

  const handleInputChange = (field, value) => {
    setVideoData({ ...videoData, [field]: value });
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

      // unique, cleaned, non-empty IDs
      const ids = [...new Set((resp?.data || [])
        .map(r => normalizeId(r?.leadReturnId))
        .filter(Boolean))];

      // sort A…Z…AA…AB…
      ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));

      setNarrativeIds(ids);

      // If ADDING (not editing) and no id chosen yet → preselect latest
      setVideoData(prev =>
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


   const handleAddVideo = async () => {
    // Validation:
   if (
  !videoData.leadReturnId ||
  !videoData.dateVideoRecorded ||
  !videoData.description ||
  (videoData.isLink && !videoData.link.trim())
) {
  setAlertMessage("Please fill in Date, Narrative Id, Description, and a link if using Link mode.");
setAlertOpen(true);
   return;
}
    // Build FormData
    const fd = new FormData();
    fd.append("leadNo", selectedLead.leadNo);
    fd.append("description", selectedLead.leadName);
    fd.append("enteredBy", localStorage.getItem("loggedInUser"));
    fd.append("caseName", selectedCase.caseName);
    fd.append("caseNo", selectedCase.caseNo);
    fd.append("leadReturnId", videoData.leadReturnId);
    fd.append("enteredDate", new Date().toISOString());
    fd.append("dateVideoRecorded", videoData.dateVideoRecorded);
    fd.append("videoDescription", videoData.description);

    // Link fields
    fd.append("isLink", videoData.isLink);
    if (videoData.isLink) {
      fd.append("link", videoData.link.trim());
    }
    else if (file) {
  fd.append("file", file);          // ✅ append only if a real file exists
  }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/api/lrvideo/upload",
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`
            // ⇢ no Content-Type: let browser set multipart/form-data boundary
          },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        }
      );

      // Re-fetch video list
      await fetchVideos();

      // Reset form
     setVideoData(DEFAULT_VIDEO);
      setFile(null);

      // Clear native file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to upload video.";
      setAlertMessage(msg);
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

                  useEffect(() => {
                    if (
                      selectedLead?.leadNo &&
                      selectedLead?.leadName &&
                      selectedCase?.caseNo &&
                      selectedCase?.caseName
                    ) {
                      fetchVideos();
                    }
                  }, [selectedLead, selectedCase]);
                  
                  const fetchVideos = async () => {
                    const token = localStorage.getItem("token");
                    const leadNo = selectedLead?.leadNo;
                    const leadName = encodeURIComponent(selectedLead?.leadName);
                    const caseNo = selectedCase?.caseNo;
                    const caseName = encodeURIComponent(selectedCase?.caseName);
                  
                    try {
                      const res = await api.get(
                        `/api/lrvideo/${leadNo}/${leadName}/${caseNo}/${caseName}`,
                        {
                          headers: {
                            "Content-Type": undefined,  
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                  
                      const mappedVideos = res.data.map((video) => ({
        id: video._id,
        dateEntered: formatDate(video.enteredDate),
        returnId: video.leadReturnId,
        dateVideoRecorded: formatDate(video.dateVideoRecorded),
        rawDateVideoRecorded: video.dateVideoRecorded,
        description: video.videoDescription,
        filename: video.filename,       // needed to construct a download URL
        originalName: video.originalName || "",
          videoSrc: video.isLink ? video.link : video.signedUrl,
        signedUrl: video.signedUrl || "",
        link: video.link || "",
        isLink: video.isLink,
      }));
      setVideos(mappedVideos);
                    } catch (error) {
                      console.error("Error fetching videos:", error);
                    }
                  };

                  const handleAccessChange = (idx, newAccess) => {
                    setVideos(rs => {
                      const copy = [...rs];
                      copy[idx] = { ...copy[idx], accessLevel: newAccess };
                      return copy;
                    });
                  };
                    const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";  
                  
                  const handleEditVideo = (idx) => {
    const v = videos[idx];
    setEditingIndex(idx);

    // Clear any leftover file in <input>
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFile(null);

    setVideoData({
      dateVideoRecorded: new Date(v.rawDateVideoRecorded).toISOString().slice(0, 10),
      leadReturnId: v.returnId,
      description: v.description,
      isLink: v.isLink,
      link: v.isLink ? v.link : "",
      videoSrc: v.isLink ? "" : v.videoSrc,
      filename: v.isLink ? "" : v.originalName,
    });
  };
                  
    //  B) on “Update Video”
    const handleUpdateVideo = async () => {
    if (editingIndex === null) return;
    const v = videos[editingIndex];

    // Validation for “link” mode
    if (videoData.isLink && !videoData.link.trim()) {
        setAlertMessage("Please enter a valid link.");
       setAlertOpen(true);
      return;
    }

    // Build FormData
    const fd = new FormData();
    fd.append("leadReturnId", videoData.leadReturnId);
    fd.append("dateVideoRecorded", videoData.dateVideoRecorded);
    fd.append("videoDescription", videoData.description);
    fd.append("isLink", videoData.isLink);

    if (videoData.isLink) {
      fd.append("link", videoData.link.trim());
    } else if (file) {
      fd.append("file", file);
    }

    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/api/lrvideo/${v.id}`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        }
      );

      // Re-fetch video list
      await fetchVideos();

      // Reset form
      setEditingIndex(null);
      setVideoData(DEFAULT_VIDEO);
      setFile(null);
      
      // Clear native file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error updating video:", err);
   
      setAlertMessage("Failed to update video.");
       setAlertOpen(true);
    }
  };
                  
                  //  C) on “🗑” icon
                   const handleDeleteVideo = async (idx) => {
    if (!window.confirm("Delete this video?")) return;
    const v = videos[idx];
    try {
      await api.delete(`/api/lrvideo/${v.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setVideos((prev) => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error("Error deleting video:", err);
       setAlertMessage("Failed to delete video.");
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
    <div className="lrvideos-container">
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
  message="Are you sure you want to delete this video? This action cannot be undone."
  onConfirm={confirmDeleteVideo}
  onClose={cancelDeleteVideo}
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
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
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
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LRVideo')}>
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
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Videos
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
        ? ` Lead Status:  ${status}`
    : ` ${leadStatus}`}
</h5>

          </div>
        <div className="case-header">
          <h2 className="">VIDEO INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Video Form */}
        <div className = "timeline-form-sec">
        {/* <h4 className="evidence-form-h4">Enter Video Details</h4> */}
        <div className="video-form">
          <div className="form-row-video">
            <label className="evidence-head">Date Video Recorded*</label>
            <input
              type="date"
              value={videoData.dateVideoRecorded}
              className="evidence-head"
              onChange={(e) => handleInputChange("dateVideoRecorded", e.target.value)}
            />
          </div>
          <div className="form-row-video">
            <label className="evidence-head">Narrative Id*</label>
             <select
    value={videoData.leadReturnId}
    className="evidence-head"
    onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
  >
    <option value="">Select Narrative Id</option>

    {/* keep current value visible even if it's not in the latest API list (e.g., older record) */}
    {videoData.leadReturnId &&
      !narrativeIds.includes(normalizeId(videoData.leadReturnId)) && (
        <option value={videoData.leadReturnId}>
          {videoData.leadReturnId}
        </option>
      )
    }

    {narrativeIds.map(id => (
      <option key={id} value={id}>{id}</option>
    ))}
  </select>
          </div>
          <div className="form-row-video">
            <label className="evidence-head">Description*</label>
            <textarea
              value={videoData.description}
              className="evidence-head"
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
           <div className="form-row-video">
                    <label>Upload Type</label>
                    <select
                      value={videoData.isLink ? "link" : "file"}
                      onChange={(e) =>
                        setVideoData((prev) => ({
                          ...prev,
                          isLink: e.target.value === "link",
                          link: "" // clear link if switching back to file
                        }))
                      }
                    >
                      <option value="file">File</option>
                      <option value="link">Link</option>
                    </select>
                  </div>

                  {/* If link‐mode, show a text input for the URL */}
                  {videoData.isLink ? (
                    <div className="form-row-video">
                      <label>Paste Link*:</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={videoData.link}
                        onChange={(e) =>
                          setVideoData((prev) => ({
                            ...prev,
                            link: e.target.value
                          }))
                        }
                      />
                    </div>
                  ) : (
                    /* Otherwise, file‐mode: */
                    <div className="form-row-video">
                      <label>
                        {editingIndex !== null
                          ? "Replace Video (optional)"
                          : "Upload Video"}
                      </label>
                      <input
                        type="file"
                        accept="video/*"
                        ref={fileInputRef}                 // ← attach the ref
                        onChange={handleFileChangeWrapper}
                      />
                      {/* If we’re editing and we already had a filename, show it */}
                      {editingIndex !== null && videoData.filename && (
                        <div className="current-filename">
                          Current File: {videoData.filename}
                        </div>
                      )}
                    </div>
                  )}

              
                </div>
      
     <div className="form-buttons-video">
                  <button
                    disabled={
                      selectedLead?.leadStatus === "In Review" ||
                      selectedLead?.leadStatus === "Completed" || isReadOnly
                    }
                    className="save-btn1"
                    onClick={
                      editingIndex !== null
                        ? handleUpdateVideo
                        : handleAddVideo
                    }
                  >
                    {editingIndex !== null ? "Update Video" : "Add Video"}
                  </button>

                  {editingIndex !== null && (
                    <button
                      className="save-btn1"
                      onClick={() => {
                        setEditingIndex(null);
                       setVideoData(DEFAULT_VIDEO);
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>

        {/* Uploaded Video Preview */}
        <div className="uploaded-video">
          {/* <h4 className="evidence-head">Uploaded Videos</h4> */}
          <div className="video-gallery">
            {videos.map((video, index) => (
              <div key={index} className="video-card">
                <video controls>
                  <source src={video.videoSrc} type="video/mp4"className="evidence-head" />
                  Your browser does not support the video tag.
                </video>
                <p className="evidence-head">{video.description}</p>
              </div>
            ))}
          </div>
        </div>
        </div>




            {/* Videos Table */}
            <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "14%" }}>Date Entered</th>
              <th style={{ width: "12%" }}> Narrative Id </th>
              {/* <th>Date Video Recorded</th> */}
              <th>File Name</th>
              <th>Description</th>
              <th style={{ width: "13%" }}>Actions</th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {videos.length > 0 ? videos.map((video, index) => (
              <tr key={index}>
                <td>{video.dateEntered}</td>
                <td>{video.returnId} </td>
                {/* <td>{video.dateVideoRecorded}</td> */}
                  <td>
  {video.isLink ? (
    <a
      href={video.link}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {video.link}
    </a>
  ) : (
    <a
      href={video.signedUrl}  // ✅ S3 Signed URL
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {video.originalName || ""}
    </a>
  )}
</td>
                <td>{video.description}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditVideo(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => requestDeleteVideo(index)}
                />
                  </button>
                  </div>
                </td>
            
                {isCaseManager && (
          <td>
            <select
              value={video.accessLevel}
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
            No Video Data Available
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

        <Comment tag="Video" />
        </div>
        {/* Action Buttons */}
        {/* <div className="form-buttons-video">
          <button className="add-btn" onClick={handleAddVideo}>Add Video</button>
          <button className="back-btn" onClick={() => handleNavigation("/LRAudio")}>Back</button>
          <button className="next-btn" onClick={() => handleNavigation("/LRScratchpad")}>Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
      </div>

      <FootBar
         onPrevious={() => navigate(-1)} // Takes user to the last visited page
         onNext={() => navigate("/LRScratchpad")} // Takes user to CM Return page
       />
    </div>
    </div>
    </div>
  );
};
