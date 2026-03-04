import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import styles from './LRVideo.module.css';
import { CaseContext } from "../../CaseContext";
import api from "../../../api";
import { SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';


export const LRVideo = () => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizeId = (id) => String(id ?? "").trim().toUpperCase();
  const alphabetToNumber = (str = "") => {
    str = normalizeId(str);
    let n = 0;
    for (let i = 0; i < str.length; i++) n = n * 26 + (str.charCodeAt(i) - 64);
    return n;
  };

  const isEditing = editingIndex !== null;

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
    selectedCase?.caseName,
    selectedLead?.leadNo,
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
    accessLevel: "Everyone",
  };
  const [videoData, setVideoData] = useState(DEFAULT_VIDEO);

  const requestDeleteVideo = (idx) => {
    setPendingDeleteIndex(idx);
    setDeleteOpen(true);
  };

  const cancelDeleteVideo = () => {
    setDeleteOpen(false);
    setPendingDeleteIndex(null);
  };

  const isHttpUrl = (s) => /^https?:\/\/\S+$/i.test((s || "").trim());

  function getMissingVideoFields({ videoData, file, isEditing }) {
    const missing = [];
    if (!videoData.leadReturnId?.trim())      missing.push("Narrative Id");
    if (!videoData.dateVideoRecorded?.trim()) missing.push("Date Video Recorded");
    if (!videoData.description?.trim())       missing.push("Description");
    if (videoData.isLink) {
      if (!isHttpUrl(videoData.link)) missing.push("Link (valid URL)");
    } else {
      if (!isEditing && !file) missing.push("Video File");
    }
    return missing;
  }

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
          { headers: { Authorization: `Bearer ${token}` } }
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

      const [
        instrRes, returnsRes, personsRes, vehiclesRes, enclosuresRes,
        evidenceRes, picturesRes, audioRes, videosRes, scratchpadRes, timelineRes,
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

      const selectedReports = {
        FullReport: true, leadInstruction: true, leadReturn: true, leadPersons: true,
        leadVehicles: true, leadEnclosures: true, leadEvidence: true, leadPictures: true,
        leadAudio: true, leadVideos: true, leadScratchpad: true, leadTimeline: true,
      };

      const body = {
        user: localStorage.getItem("loggedInUser") || "",
        reportTimestamp: new Date().toISOString(),
        leadInstruction: leadInstructions,
        leadReturn:      leadReturns,
        leadPersons, leadVehicles,
        leadEnclosures:  enclosuresWithFiles,
        leadEvidence:    evidenceWithFiles,
        leadPictures:    picturesWithFiles,
        leadAudio:       audioWithFiles,
        leadVideos:      videosWithFiles,
        leadScratchpad, leadTimeline,
        selectedReports, leadInstructions, leadReturns,
      };

      const resp = await api.post("/api/report/generate", body, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      const file = new Blob([resp.data], { type: "application/pdf" });
      navigate("/DocumentReview", {
        state: { pdfBlob: file, filename: `Lead_${leadNo || "report"}.pdf` },
      });
    } catch (err) {
      if (err?.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        setAlertMessage("Error generating PDF:\n" + text);
      } else {
        setAlertMessage("Error generating PDF:\n" + (err.message || "Unknown error"));
      }
      setAlertOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const signedInOfficer = localStorage.getItem("loggedInUser");
  const primaryUsername = leadData?.primaryInvestigator || leadData?.primaryOfficer || "";
  const isPrimaryInvestigator =
    selectedCase?.role === "Investigator" &&
    !!signedInOfficer &&
    signedInOfficer === primaryUsername;

  const goToViewLR = () => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
    if (!lead?.leadNo || !lead?.leadName || !kase?.caseNo || !kase?.caseName) {
      setAlertMessage("Please select a case and lead first.");
      setAlertOpen(true);
      return;
    }
    navigate("/viewLR", { state: { caseDetails: kase, leadDetails: lead } });
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
    if (isSubmitting) return;
    const missing = getMissingVideoFields({ videoData, file, isEditing: false });
    if (missing.length) {
      setAlertMessage(`Please fill the required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
      setAlertOpen(true);
      return;
    }
    setIsSubmitting(true);
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
    fd.append("accessLevel", "Everyone");
    fd.append("isLink", videoData.isLink);
    if (videoData.isLink) {
      fd.append("link", videoData.link.trim());
    } else if (file) {
      fd.append("file", file);
    }
    try {
      const token = localStorage.getItem("token");
      await api.post("/api/lrvideo/upload", fd, {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: [(data, headers) => { delete headers["Content-Type"]; return data; }]
      });
      await fetchVideos();
      setVideoData(DEFAULT_VIDEO);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      sessionStorage.removeItem(formKey);
      setAlertMessage("Video added successfully!");
      setAlertOpen(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to upload video.";
      setAlertMessage(msg);
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigation = (route) => { navigate(route); };

  useEffect(() => {
    if (selectedLead?.leadNo && selectedLead?.leadName && selectedCase?.caseNo && selectedCase?.caseName) {
      fetchVideos();
    }
  }, [selectedLead, selectedCase]);

  const fetchVideos = async () => {
    const token = localStorage.getItem("token");
    const leadNo   = selectedLead?.leadNo;
    const leadName = encodeURIComponent(selectedLead?.leadName);
    const caseNo   = selectedCase?.caseNo;
    const caseName = encodeURIComponent(selectedCase?.caseName);
    try {
      const res = await api.get(
        `/api/lrvideo/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        { headers: { "Content-Type": undefined, Authorization: `Bearer ${token}` } }
      );
      const mappedVideos = res.data.map((video) => ({
        id: video._id,
        dateEntered: formatDate(video.enteredDate),
        returnId: video.leadReturnId,
        dateVideoRecorded: formatDate(video.dateVideoRecorded),
        rawDateVideoRecorded: video.dateVideoRecorded,
        description: video.videoDescription,
        filename: video.filename,
        originalName: video.originalName || "",
        videoSrc: video.isLink ? video.link : video.signedUrl,
        signedUrl: video.signedUrl || "",
        link: video.link || "",
        isLink: video.isLink,
        accessLevel: video.accessLevel || "Everyone",
      }));

      const withAccess = mappedVideos.map(r => ({ ...r, accessLevel: r.accessLevel ?? "Everyone" }));
      let visible = withAccess;
      if (!isCaseManager) {
        const currentUser = localStorage.getItem("loggedInUser")?.trim();
        const leadAssignees = (leadData?.assignedTo || []).map(a => a?.trim());
        visible = withAccess.filter(video => {
          if (video.accessLevel === "Everyone") return true;
          if (video.accessLevel === "Case Manager and Assignees") {
            return leadAssignees.some(a => a === currentUser);
          }
          return false;
        });
      }
      setVideos(visible);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  const handleAccessChange = async (idx, newAccessLevel) => {
    const video = videos[idx];
    const token = localStorage.getItem("token");
    try {
      const fd = new FormData();
      fd.append("accessLevel", newAccessLevel);
      await api.put(`/api/lrvideo/${video.id}`, fd, {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: [(data, headers) => { delete headers["Content-Type"]; return data; }]
      });
      setVideos(rs => {
        const copy = [...rs];
        copy[idx] = { ...copy[idx], accessLevel: newAccessLevel };
        return copy;
      });
    } catch (err) {
      console.error("Failed to update accessLevel", err);
      setAlertMessage("Could not change access level. Please try again.");
      setAlertOpen(true);
    }
  };

  const isCaseManager =
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";

  const handleEditVideo = (idx) => {
    const v = videos[idx];
    setEditingIndex(idx);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleUpdateVideo = async () => {
    if (isSubmitting) return;
    if (editingIndex === null) return;
    const v = videos[editingIndex];
    setIsSubmitting(true);
    if (videoData.isLink && !videoData.link.trim()) {
      setAlertMessage("Please enter a valid link.");
      setAlertOpen(true);
      setIsSubmitting(false);
      return;
    }
    const fd = new FormData();
    fd.append("leadReturnId", videoData.leadReturnId);
    fd.append("dateVideoRecorded", videoData.dateVideoRecorded);
    fd.append("videoDescription", videoData.description);
    fd.append("accessLevel", "Everyone");
    fd.append("isLink", videoData.isLink);
    if (videoData.isLink) {
      fd.append("link", videoData.link.trim());
    } else if (file) {
      fd.append("file", file);
    }
    try {
      const token = localStorage.getItem("token");
      await api.put(`/api/lrvideo/${v.id}`, fd, {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: [(data, headers) => { delete headers["Content-Type"]; return data; }]
      });
      await fetchVideos();
      setEditingIndex(null);
      setVideoData(DEFAULT_VIDEO);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      sessionStorage.removeItem(formKey);
      setAlertMessage("Video updated successfully!");
      setAlertOpen(true);
    } catch (err) {
      console.error("Error updating video:", err);
      setAlertMessage("Failed to update video: " + (err.response?.data?.message || err.message));
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { status, isReadOnly } = useLeadStatus({
    caseNo: selectedCase.caseNo,
    caseName: selectedCase.caseName,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
  });

  return (
    <div className={styles.evidencePage}>
      <Navbar />
      <AlertModal
        isOpen={alertOpen}
        title="Notification"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={() => setAlertOpen(false)}
      />
      <AlertModal
        isOpen={deleteOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this video? This action cannot be undone."
        onConfirm={confirmDeleteVideo}
        onClose={cancelDeleteVideo}
      />

      <div className={styles.LRIContent}>
        <SideBar activePage="LeadReview" />
        <div className={styles.leftContentLI}>

          <div className={styles.topMenuNav}>
            <div className={styles.menuItems}>
              <span className={styles.menuItem} onClick={() => {
                const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                if (lead && kase) navigate("/LeadReview", { state: { caseDetails: kase, leadDetails: lead } });
              }}>Lead Information</span>
              <span className={`${styles.menuItem} ${styles.menuItemActive}`}>Add Lead Return</span>
              {(["Case Manager", "Detective Supervisor"].includes(selectedCase?.role)) && (
                <span
                  className={styles.menuItem}
                  onClick={handleViewLeadReturn}
                  title={isGenerating ? "Preparing report…" : "View Lead Return"}
                  style={{ opacity: isGenerating ? 0.6 : 1, pointerEvents: isGenerating ? "none" : "auto" }}
                >
                  Manage Lead Return
                </span>
              )}
              {selectedCase?.role === "Investigator" && isPrimaryInvestigator && (
                <span className={styles.menuItem} onClick={goToViewLR}>Submit Lead Return</span>
              )}
              {selectedCase?.role === "Investigator" && !isPrimaryInvestigator && (
                <span className={styles.menuItem} onClick={goToViewLR}>Review Lead Return</span>
              )}
              <span className={styles.menuItem} onClick={() => {
                const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                if (lead && kase) {
                  navigate("/ChainOfCustody", { state: { caseDetails: kase, leadDetails: lead } });
                } else {
                  setAlertMessage("Please select a case and lead first.");
                  setAlertOpen(true);
                }
              }}>Lead Chain of Custody</span>
            </div>
          </div>

          <div className={styles.topMenuSections}>
            <div className={styles.menuItems} style={{ fontSize: '19px' }}>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>Instructions</span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>Narrative</span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')}>Person</span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRVehicle')}>Vehicles</span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LREnclosures')}>Enclosures</span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LREvidence')}>Evidence</span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRPictures')}>Pictures</span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRAudio')}>Audio</span>
              <span className={`${styles.menuItem} ${styles.menuItemActive}`} style={{ fontWeight: '600' }} onClick={() => handleNavigation('/LRVideo')}>Videos</span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRScratchpad')}>Notes</span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRTimeline')}>Timeline</span>
            </div>
          </div>

          <div className={styles.caseandleadinfo}>
            <h5 className={styles.sideTitle}>
              <div className={styles.ldHead}>
                <Link to="/HomePage" className={styles.crumb}>PIMS Home</Link>
                <span className={styles.sep}>{" >> "}</span>
                <Link
                  to={selectedCase?.role === "Investigator" ? "/Investigator" : "/CasePageManager"}
                  state={{ caseDetails: selectedCase }}
                  className={styles.crumb}
                >
                  Case: {selectedCase.caseNo || ""}
                </Link>
                <span className={styles.sep}>{" >> "}</span>
                <Link to={"/LeadReview"} state={{ leadDetails: selectedLead }} className={styles.crumb}>
                  Lead: {selectedLead.leadNo || ""}
                </Link>
                <span className={styles.sep}>{" >> "}</span>
                <span className={styles.crumbCurrent} aria-current="page">Lead Videos</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? ` Lead Status:  ${status}` : ` ${leadStatus}`}
            </h5>
          </div>

          <div className={styles.caseHeader}>
            <h2>VIDEO INFORMATION</h2>
          </div>

          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* Video Form */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Video Entry</div>
                <div className={styles.LREnteringContentBox}>
                  <div className={styles.evidenceForm}>

                    {/* Row 1: Narrative Id + Date Video Recorded */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>Narrative Id*</label>
                        <select
                          value={videoData.leadReturnId}
                          onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
                        >
                          <option value="">Select Id</option>
                          {videoData.leadReturnId && !narrativeIds.includes(normalizeId(videoData.leadReturnId)) && (
                            <option value={videoData.leadReturnId}>{videoData.leadReturnId}</option>
                          )}
                          {narrativeIds.map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formRowEvidence}>
                        <label>Date Video Recorded*</label>
                        <input
                          type="date"
                          value={videoData.dateVideoRecorded}
                          onChange={(e) => handleInputChange("dateVideoRecorded", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 2: Description */}
                    <div className={styles.formRowEvidence}>
                      <label>Description*</label>
                      <textarea
                        value={videoData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                      />
                    </div>

                    {/* Row 3: File Type + Upload/Link */}
                    <div className={styles.formRowPair}>
                      <div className={styles.formRowEvidence}>
                        <label>File Type</label>
                        <select
                          value={videoData.isLink ? "link" : "file"}
                          onChange={(e) =>
                            setVideoData((prev) => ({
                              ...prev,
                              isLink: e.target.value === "link",
                              link: ""
                            }))
                          }
                        >
                          <option value="file">File</option>
                          <option value="link">Link</option>
                        </select>
                      </div>
                      <div className={styles.formRowEvidence}>
                        {videoData.isLink ? (
                          <>
                            <label>Paste Link*</label>
                            <input
                              type="text"
                              placeholder="https://..."
                              value={videoData.link}
                              onChange={(e) => setVideoData((prev) => ({ ...prev, link: e.target.value }))}
                            />
                          </>
                        ) : (
                          <>
                            <label>{editingIndex !== null ? "Replace Video (optional)" : "Upload Video"}</label>
                            <input
                              type="file"
                              accept="video/*"
                              ref={fileInputRef}
                              onChange={handleFileChangeWrapper}
                            />
                            {editingIndex !== null && videoData.filename && (
                              <span className={styles.currentFilename}>Current File: {videoData.filename}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                  <div className={styles.formButtonsReturn}>
                    <button
                      disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly || isSubmitting}
                      className={styles.saveBtn1}
                      onClick={editingIndex !== null ? handleUpdateVideo : handleAddVideo}
                    >
                      {isSubmitting
                        ? (editingIndex !== null ? "Updating..." : "Adding...")
                        : (editingIndex !== null ? "Update Video" : "Add Video")}
                    </button>
                    {editingIndex !== null && (
                      <button
                        className={styles.saveBtn1}
                        disabled={isSubmitting}
                        onClick={() => {
                          setEditingIndex(null);
                          setVideoData(DEFAULT_VIDEO);
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Table */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Video History</div>
                <table className={styles.leadsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "14%" }}>Date Entered</th>
                      <th style={{ width: "12%" }}>Narrative Id</th>
                      <th>File Name</th>
                      <th>Description</th>
                      <th style={{ width: "13%" }}>Actions</th>
                      {isCaseManager && <th style={{ width: "15%" }}>Access</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {videos.length > 0 ? videos.map((video, index) => (
                      <tr key={index}>
                        <td>{video.dateEntered}</td>
                        <td>{video.returnId}</td>
                        <td>
                          {video.isLink ? (
                            <a href={video.link} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                              {video.link}
                            </a>
                          ) : (
                            <a href={video.signedUrl} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                              {video.originalName || ""}
                            </a>
                          )}
                        </td>
                        <td>{video.description}</td>
                        <td>
                          <div className={styles.lrTableBtn}>
                            <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>
                              <img
                                src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                alt="Edit Icon"
                                className={styles.editIcon}
                                onClick={() => handleEditVideo(index)}
                              />
                            </button>
                            <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>
                              <img
                                src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                                alt="Delete Icon"
                                className={styles.editIcon}
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
                              className={styles.accessDropdown}
                            >
                              <option value="Everyone">All</option>
                              <option value="Case Manager Only">Case Manager</option>
                              <option value="Case Manager and Assignees">Assignees</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign: 'center' }}>
                          No Video Data Available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
