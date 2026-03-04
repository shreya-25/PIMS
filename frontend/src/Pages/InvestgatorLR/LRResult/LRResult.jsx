// LRResult Component - Lead Narrative Result Page
import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar/Navbar";
import styles from './LRResult.module.css';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { pickHigherStatus } from '../../../utils/status'
import { useLeadStatus } from '../../../hooks/useLeadStatus';
import { ActivityLog } from '../../../components/ActivityLog/ActivityLog';


export const LRResult = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { leadDetails, caseDetails } = location.state || {};
    const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus, setLeadReturns  } = useContext(CaseContext);
    const effectiveCase = selectedCase?.caseNo ? selectedCase : caseDetails;
    const effectiveLead = selectedLead?.leadNo ? selectedLead : leadDetails;
    const [expandedRows, setExpandedRows] = useState(new Set());

    const storagePrefix = React.useMemo(() => {
    const cn = effectiveCase?.caseNo ?? "";
    const cName = effectiveCase?.caseName ?? "";
    const ln = effectiveLead?.leadNo ?? "";
    const lName = effectiveLead?.leadName ?? "";
    return `LRResult:${cn}:${encodeURIComponent(cName)}:${ln}:${encodeURIComponent(lName)}`;
  }, [
    effectiveCase?.caseNo,
    effectiveCase?.caseName,
    effectiveLead?.leadNo,
    effectiveLead?.leadName
  ]);

    const FORM_KEY = `${storagePrefix}:form`;
    const LIST_KEY = `${storagePrefix}:list`;
    const [username, setUsername] = useState("");
    const [leadData, setLeadData] = useState({});
    const [officerName, setOfficerName] = useState("");
    const todayDate = new Date().toLocaleDateString();
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [maxReturnId, setMaxReturnId] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [auditLogRefresh, setAuditLogRefresh] = useState(0);
    const isDisabled = leadStatus === "In Review" || leadStatus === "Completed"|| leadStatus === "Closed";
    const caseNo = selectedCase?.caseNo ?? caseDetails.caseNo;
    const { status, isReadOnly } = useLeadStatus({
      caseNo:   effectiveCase?.caseNo,
      caseName: effectiveCase?.caseName,
      leadNo:   effectiveLead?.leadNo,
      leadName: effectiveLead?.leadName,
    });

     const isCaseManager = selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";

    useEffect(() => {
  if (status) setLeadStatus(prev => prev ? pickHigherStatus(prev, status) : status);
}, [status, setLeadStatus]);

    useEffect(() => {
    const storedOfficer = localStorage.getItem("loggedInUser");
    if (storedOfficer) {
        const name = storedOfficer.trim();
        setOfficerName(name);
        setReturnData(prev => ({ ...prev, enteredBy: name }));
      }
    }, []);

    useEffect(() => {
  if (!effectiveLead?.leadNo || !effectiveLead?.leadName || !effectiveCase?.caseNo || !effectiveCase?.caseName) {
    return;
  }

  const ac = new AbortController();

  (async () => {
    try {
      const token = localStorage.getItem("token");
      const resp = await api.get(
        `/api/lead/lead/${effectiveLead.leadNo}/${encodeURIComponent(effectiveLead.leadName)}/${effectiveCase.caseNo}/${encodeURIComponent(effectiveCase.caseName)}`,
        { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
      );

      if (ac.signal.aborted) return;
      if (!resp?.data?.length) return;

      setLeadData({
        ...resp.data[0],
        assignedTo: resp.data[0].assignedTo || [],
        leadStatus: resp.data[0].leadStatus || "",
      });
    } catch (e) {
      if (!ac.signal.aborted) {
        console.error("Failed to fetch lead data:", e);
      }
    }
  })();

  return () => ac.abort();
}, [
  effectiveLead?.leadNo,
  effectiveLead?.leadName,
  effectiveCase?.caseNo,
  effectiveCase?.caseName
]);

    useEffect(() => {
      if (!leadData?.leadStatus) return;
      setLeadStatus(prev => prev ? pickHigherStatus(prev, leadData.leadStatus) : leadData.leadStatus);
    }, [leadData?.leadStatus, setLeadStatus]);


   useEffect(() => {
  if (!effectiveLead?.leadNo || !effectiveLead?.leadName || !effectiveCase?.caseNo || !effectiveCase?.caseName) {
    return;
  }

  const ac = new AbortController();

  (async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await api.get(
        `/api/lead/status/${effectiveLead.leadNo}/${encodeURIComponent(effectiveLead.leadName)}/${effectiveCase.caseNo}/${encodeURIComponent(effectiveCase.caseName)}`,
        { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
      );

      if (ac.signal.aborted) return;

      const incoming =
        (resp?.data && typeof resp.data === "object" && "leadStatus" in resp.data && resp.data.leadStatus) ||
        (Array.isArray(resp?.data) && resp.data[0]?.leadStatus) ||
        null;

      if (incoming) {
        setLeadStatus(prev => (prev ? pickHigherStatus(prev, incoming) : incoming));
      } else {
        console.warn("No lead returned when fetching status");
        setLeadStatus("Unknown");
      }
    } catch (err) {
      if (!ac.signal.aborted) {
        console.error("Failed to fetch lead status", err);
        setError("Could not load lead status");
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  })();

  return () => ac.abort();
}, [
  effectiveLead?.leadNo,
  effectiveLead?.leadName,
  effectiveCase?.caseNo,
  effectiveCase?.caseName,
  setLeadStatus
]);

const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingDeleteId, setPendingDeleteId] = useState(null);

const requestDeleteReturn = (leadReturnId) => {
  setPendingDeleteId(leadReturnId);
  setConfirmOpen(true);
};

const performDeleteReturn = async () => {
  if (!pendingDeleteId) return;
  const token = localStorage.getItem("token");

  try {
    await api.delete(
      `/api/leadReturnResult/delete/${effectiveLead.leadNo}/${effectiveCase.caseNo}/${pendingDeleteId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const filtered = returns.filter(r => r.leadReturnId !== pendingDeleteId);
    setReturns(filtered);
    setLeadReturns(filtered);
    setAuditLogRefresh(prev => prev + 1);
  } catch (err) {
    console.error("Error deleting return:", err);
    setAlertMessage("Failed to delete narrative.");
    setAlertOpen(true);
  } finally {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  }
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

  navigate("/viewLR", {
    state: { caseDetails: kase, leadDetails: lead }
  });
};


const [returnData, setReturnData]   = useState(() => {
    const saved = sessionStorage.getItem(FORM_KEY);
    return saved
      ? JSON.parse(saved)
      : { results: "", leadReturnId: "", enteredDate: new Date().toLocaleDateString(), enteredBy: officerName?.trim(), accessLevel: "Everyone" };
  });
  const [returns, setReturns] = useState(() => {
    const saved = sessionStorage.getItem(LIST_KEY);
    return saved ? JSON.parse(saved) : [];
  });


  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);


  const handleInputChange = (field, value) => {
    setReturnData({ ...returnData, [field]: value });
  };

  const getCasePageRoute = () => {
    if (!selectedCase || !selectedCase.role) return "/HomePage";
    return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
};

const alphabetToNumber = (str) => {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * 26 + (str.charCodeAt(i) - 64);
  }
  return result;
};

const numberToAlphabet = (num) => {
  let result = "";
  while (num > 0) {
    let rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
};

const defaultForm = (officer) => ({
  results: "",
  leadReturnId: "",
  enteredDate: new Date().toLocaleDateString(),
  enteredBy: officer?.trim() || "",
  accessLevel: "Everyone",
});

const justLoadedFormRef = React.useRef(false);
const justLoadedListRef = React.useRef(false);

useEffect(() => {
  try {
    const savedForm = sessionStorage.getItem(FORM_KEY);
    setReturnData(savedForm ? JSON.parse(savedForm) : defaultForm(officerName));
    try { sessionStorage.removeItem(FORM_KEY); } catch {}
  } catch {
    setReturnData(defaultForm(officerName));
  } finally {
    justLoadedFormRef.current = true;
  }

  try {
    const savedList = sessionStorage.getItem(LIST_KEY);
    setReturns(savedList ? JSON.parse(savedList) : []);
  } catch {
    setReturns([]);
  } finally {
    justLoadedListRef.current = true;
  }
}, [FORM_KEY, LIST_KEY]);

useEffect(() => {
  if (justLoadedFormRef.current) {
    justLoadedFormRef.current = false;
    return;
  }
  try {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(returnData));
  } catch (e) {
    console.error("Failed to persist form draft", e);
  }
}, [FORM_KEY, returnData]);

useEffect(() => {
  if (justLoadedListRef.current) {
    justLoadedListRef.current = false;
    return;
  }
  try {
    sessionStorage.setItem(LIST_KEY, JSON.stringify(returns));
  } catch (e) {
    console.error("Failed to persist returns list", e);
  }
}, [LIST_KEY, returns]);

useEffect(() => {
  if (!effectiveLead?.leadNo || !effectiveLead?.leadName || !effectiveCase?.caseNo || !effectiveCase?.caseName) {
    return;
  }

  const ac = new AbortController();

  (async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await api.get(
        `/api/leadReturnResult/${effectiveLead.leadNo}/${encodeURIComponent(effectiveLead.leadName)}/${effectiveCase.caseNo}/${encodeURIComponent(effectiveCase.caseName)}`,
        { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
      );

      if (ac.signal.aborted) return;

      const raw = Array.isArray(resp?.data) ? resp.data : [];
      const withAccess = raw.map(r => ({
        ...r,
        accessLevel: r.accessLevel || "Everyone",
      }));

      const maxNumericId = withAccess.reduce((max, item) => {
        const numVal = item.leadReturnId ? alphabetToNumber(item.leadReturnId) : 0;
        return Math.max(max, numVal);
      }, 0);
      setMaxReturnId(maxNumericId);

      let visible = withAccess;

      if (!isCaseManager) {
        const currentUser = localStorage.getItem("loggedInUser")?.trim();
        const leadAssignees = (leadData?.assignedTo || []).map(a => a?.trim());

        visible = withAccess.filter(r => {
          if (r.accessLevel === "Everyone") return true;

          if (r.accessLevel === "Case Manager and Assignees") {
            const returnAssignees = (r.assignedTo?.assignees || []).map(a => a?.trim());
            const isAssignedToLead = leadAssignees.some(a => a === currentUser);
            const isAssignedToReturn = returnAssignees.some(a => a === currentUser);
            return isAssignedToLead || isAssignedToReturn;
          }

          return false;
        });
      }

      setReturns(visible);
      setLeadReturns(visible);
    } catch (err) {
      if (!ac.signal.aborted) {
        console.error("Error fetching return data:", err);
        setError("Failed to fetch return data.");
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  })();

  return () => ac.abort();
}, [
  effectiveLead?.leadNo,
  effectiveLead?.leadName,
  effectiveCase?.caseNo,
  effectiveCase?.caseName,
  isCaseManager,
  leadData?.assignedTo,
  setLeadReturns
]);


const handleAccessChange = async (idx, newAccess) => {
  const ret = returns[idx];
  const token = localStorage.getItem("token");

  try {
    const response = await api.patch(
      `/api/leadReturnResult/update/${ret.leadNo}/${caseNo}/${ret.leadReturnId}`,
      { accessLevel: newAccess },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setReturns(rs => {
      const copy = [...rs];
      copy[idx] = response.data;
      return copy;
    });
    setLeadReturns(rs => {
      const copy = [...rs];
      copy[idx] = response.data;
      return copy;
    });
    setAuditLogRefresh(prev => prev + 1);
  } catch (err) {
    console.error("Failed to update accessLevel", err);
     setAlertMessage("Could not change access. Try again.");
      setAlertOpen(true);
  }
};

const nextReturnId = numberToAlphabet(maxReturnId + 1);

 const displayReturnId = editMode ? returnData.leadReturnId : nextReturnId;

const handleAddOrUpdateReturn = async () => {
  if (!returnData.results.trim()) {
    setAlertMessage("Please enter narrative details!");
    return setAlertOpen(true);
  }

  const officerName = localStorage.getItem("loggedInUser")?.trim();
  if (!officerName) {
    setAlertMessage("Officer name not found. Please log in again.");
    return setAlertOpen(true);
  }
  const token = localStorage.getItem("token");

  try {
    if (editMode && editId) {
      const resp = await api.patch(
        `/api/leadReturnResult/update/${selectedLead.leadNo}/${caseNo}/${editId}`,
        { leadReturnResult: returnData.results },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReturns(rs => rs.map(r => r.leadReturnId === editId ? resp.data : r));
      setEditMode(false);
      setEditId(null);
      setAuditLogRefresh(prev => prev + 1);

    } else {
      const payload = {
        leadNo:             selectedLead.leadNo,
        description:        selectedLead.leadName,
        caseNo,
        caseName:           selectedCase.caseName,
        enteredDate:        new Date(),
        enteredBy:          officerName,
        assignedTo:  { assignees: [officerName], lRStatus: "Pending" },
        assignedBy:  { assignee: officerName, lRStatus: "Pending" },
        leadReturnResult:   returnData.results,
        accessLevel:        returnData.accessLevel
      };

      const createResp = await api.post(
        "/api/leadReturnResult/create",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newDoc = createResp.data;
      setReturns(rs => [...rs, newDoc]);
      setLeadReturns(rs => [...rs, newDoc]);
      setMaxReturnId(n => Math.max(n, alphabetToNumber(newDoc.leadReturnId)));

      setReturnData(defaultForm(officerName));
      try { sessionStorage.removeItem(FORM_KEY); } catch {}
      setAuditLogRefresh(prev => prev + 1);
    }
  } catch (err) {
    console.error("Error saving return:", err);
    setAlertMessage("Failed to save narrative. Please try again.");
    setAlertOpen(true);
  }
};


  useEffect(() => {
  if (officerName) {
    setReturnData((prev) => ({
      ...prev,
      enteredBy: officerName.trim()
    }));
  }
}, [officerName]);


  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  const handleEditReturn = (ret) => {
  setReturnData({
    results: ret.leadReturnResult,
    leadReturnId: ret.leadReturnId,
    enteredDate: formatDate(ret.enteredDate),
    enteredBy: ret.enteredBy
  });
  setEditMode(true);
  setEditId(ret.leadReturnId);
};



  const handleDeleteReturn = async (leadReturnId) => {
    if (!window.confirm("Are you sure you want to delete this return?")) return;

    const token = localStorage.getItem("token");

    try {
      await api.delete(`/api/leadReturnResult/delete/${effectiveLead.leadNo}/${effectiveCase.caseNo}/${leadReturnId}`,
        {
        headers: { Authorization: `Bearer ${token}` }
      });

      const filtered = returns.filter(r => r.leadReturnId !== leadReturnId);
      setReturns(filtered);
      setLeadReturns(filtered);
    } catch (err) {
      console.error("Error deleting return:", err);
      setAlertMessage("Failed to delete narrative.");
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



  if (!selectedCase && !caseDetails) {
    return <div>Loading case/lead…</div>;
  }



  return (
    <div key={`${effectiveCase?.caseNo}-${effectiveLead?.leadNo}`} className={styles.personPage}>

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
        onConfirm={performDeleteReturn}
        onClose={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
      />

      <div className={styles.LRIContent}>

        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          <div className={styles.topMenuNav}>
            <div className={styles.menuItems}>
              <span className={styles.menuItem} onClick={() => {
                const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
                if (lead && kase) {
                  navigate("/LeadReview", { state: { caseDetails: kase, leadDetails: lead } });
                }
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
                <span className={styles.menuItem} onClick={goToViewLR}>
                  Submit Lead Return
                </span>
              )}
              {selectedCase?.role === "Investigator" && !isPrimaryInvestigator && (
                <span className={styles.menuItem} onClick={goToViewLR}>
                  Review Lead Return
                </span>
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
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
                Instructions
              </span>
              <span className={`${styles.menuItem} ${styles.menuItemActive}`} style={{ fontWeight: '600' }} onClick={() => handleNavigation('/LRReturn')}>
                Narrative
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')}>
                Person
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRVehicle')}>
                Vehicles
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LREnclosures')}>
                Enclosures
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LREvidence')}>
                Evidence
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRPictures')}>
                Pictures
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRAudio')}>
                Audio
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRVideo')}>
                Videos
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRScratchpad')}>
                Notes
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRTimeline')}>
                Timeline
              </span>
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
                <Link
                  to={"/LeadReview"}
                  state={{ leadDetails: selectedLead }}
                  className={styles.crumb}
                >
                  Lead: {selectedLead.leadNo || ""}
                </Link>
                <span className={styles.sep}>{" >> "}</span>
                <span className={styles.crumbCurrent} aria-current="page">Lead Narrative</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? ` Lead Status:  ${leadStatus}` : ` ${leadStatus}`}
            </h5>
          </div>

          {/* Page heading */}
          <div className={styles.caseHeader}>
            <h2>LEAD NARRATIVE</h2>
          </div>

          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* Narrative Entry section */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Narrative Entry</div>
                <div className={styles.LREnteringContentBox}>
                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>Narrative ID*</label>
                      <input readOnly value={displayReturnId} />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Date Entered*</label>
                      <input type="text" value={returnData.enteredDate || todayDate} readOnly />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Entered By*</label>
                      <input type="text" value={returnData.enteredBy || officerName} readOnly />
                    </div>
                  </div>

                  <h4 className={styles.returnFormH4}>Narrative Description</h4>
                  <div className={styles.returnForm}>
                    <textarea
                      value={returnData.results}
                      onChange={(e) => handleInputChange("results", e.target.value)}
                      placeholder="Enter narrative"
                    />
                  </div>

                  <div className={styles.formButtonsReturn}>
                    <button
                      disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || selectedLead?.leadStatus === "Closed" || isReadOnly}
                      className={styles.saveBtn1}
                      onClick={handleAddOrUpdateReturn}
                    >
                      {editMode ? "Update" : "Save Narrative"}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ color: "red", textAlign: "center", margin: "10px 0", fontSize: "16px" }}>
                  {error}
                </div>
              )}

              {/* Narrative History section */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Narrative History</div>
                <table className={styles.leadsTable}>
                <thead>
                  <tr>
                    <th style={{ width: "8%" }}>Id</th>
                    <th style={{ width: "9%" }}>Date</th>
                    <th style={{ width: "12%" }}>Entered By</th>
                    <th className={styles.resultsCol}>Narrative</th>
                    <th style={{ width: "10%" }}>Actions</th>
                    {isCaseManager && (
                      <th style={{ width: "15%" }}>Access</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {returns.length > 0 ? returns.map((ret, idx) => {
                    const canModify = ret.enteredBy.trim() === officerName.trim();
                    const isExpanded = expandedRows.has(ret.leadReturnId);
                    const narrativeText = ret.leadReturnResult || "";
                    const shouldTruncate = narrativeText.length > 150;

                    const disableActions =
                      selectedLead?.leadStatus === "In Review" ||
                      selectedLead?.leadStatus === "Completed" ||
                      isReadOnly ||
                      !canModify;

                    const toggleExpand = () => {
                      setExpandedRows(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(ret.leadReturnId)) {
                          newSet.delete(ret.leadReturnId);
                        } else {
                          newSet.add(ret.leadReturnId);
                        }
                        return newSet;
                      });
                    };

                    return (
                      <tr key={ret.leadReturnId || idx}>
                        <td>{ret.leadReturnId}</td>
                        <td>{formatDate(ret.enteredDate)}</td>
                        <td>{ret.enteredBy}</td>
                        <td className={styles.narrativeCell}>
                          <div className={isExpanded ? styles.narrativeContentExpanded : styles.narrativeContentCollapsed}>
                            {ret.leadReturnResult}
                          </div>
                          {shouldTruncate && (
                            <button className={styles.viewToggleBtn} onClick={toggleExpand}>
                              {isExpanded ? "View Less ▲" : "View ▶"}
                            </button>
                          )}
                        </td>
                        <td>
                          <div className={styles.lrTableBtn}>
                            <button onClick={() => handleEditReturn(ret)} disabled={disableActions}>
                              <img
                                src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                alt="Edit Icon"
                                className={styles.editIcon}
                              />
                            </button>
                            <button onClick={() => requestDeleteReturn(ret.leadReturnId)} disabled={disableActions}>
                              <img
                                src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                                alt="Delete Icon"
                                className={styles.editIcon}
                              />
                            </button>
                          </div>
                        </td>
                        {isCaseManager && (
                          <td>
                            <select
                              value={ret.accessLevel}
                              onChange={(e) => handleAccessChange(idx, e.target.value)}
                              className={styles.accessDropdown}
                            >
                              <option value="Everyone">All</option>
                              <option value="Case Manager">Case Manager</option>
                              <option value="Case Manager and Assignees">Assignees</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={isCaseManager ? 6 : 5} style={{ textAlign: 'center' }}>
                        No Narrative Available
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
