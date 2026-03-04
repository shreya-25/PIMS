import styles from './LRVehicle.module.css';
import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from '../../../components/Navbar/Navbar';
import VehicleModal from "../../../components/VehicleModal/VehicleModal";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import { useDataContext } from "../../Context/DataContext"; // Import Context
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Comment from "../../../components/Comment/Comment";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';
import { ActivityLog } from '../../../components/ActivityLog/ActivityLog';



export const LRVehicle = () => {

  const navigate = useNavigate(); // Initialize useNavigate hook
  const FORM_KEY = "LRVehicle:form";
  const LIST_KEY = "LRVehicle:list";
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [leadData, setLeadData] = useState({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [auditLogRefresh, setAuditLogRefresh] = useState(0);
  const [rawVehicles, setRawVehicles] = useState(() => {
    const saved = sessionStorage.getItem(LIST_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [narrativeIds, setNarrativeIds] = useState([]);


    const [vehicleData, setVehicleData] = useState(() => {
   const saved = sessionStorage.getItem(FORM_KEY);
   return saved
     ? JSON.parse(saved)
     : {
    year: '',
    make: '',
    model: '',
    plate: '',
    category: '',
    type: '',
    color:'',
    vin: '',
    primaryColor: '',
    secondaryColor: '',
    state: '',
    leadReturnId:'',
    information: '',
    enteredDate: new Date().toISOString().slice(0,10),
     };
  });

  const REQUIRED_FIELDS = [
  { key: "leadReturnId", label: "Narrative Id" },
  { key: "enteredDate",  label: "Entered Date" },
];

function findMissingFields(obj) {
  const isEmpty = (v) => {
    if (v == null) return true;
    if (typeof v === "string") return v.trim() === "";
    return false;
  };
  return REQUIRED_FIELDS
    .filter(({ key }) => isEmpty(obj[key]))
    .map(({ label }) => label);
}


  useEffect(() => {
  sessionStorage.setItem(FORM_KEY, JSON.stringify(vehicleData));
}, [vehicleData]);

useEffect(() => {
  sessionStorage.setItem(LIST_KEY, JSON.stringify(rawVehicles));
}, [rawVehicles]);



    useEffect(() => {
       const loggedInUser = localStorage.getItem("loggedInUser");
       if (loggedInUser) {
         setUsername(loggedInUser);
       }
      })
   const { leadDetails, caseDetails } = location.state || {};
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");

      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date)) return "";
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const year = date.getFullYear().toString().slice(-4);
        return `${month}/${day}/${year}`;
      };

       const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };
  const todayISO = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

const alphabetToNumber = (str) => {
  if (!str) return 0;
  let n = 0;
  for (let i = 0; i < str.length; i++) n = n * 26 + (str.charCodeAt(i) - 64); // 'A' = 65
  return n;
};

// Confirm delete modal
const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

const requestDeleteVehicle = (idx) => {
  setPendingDeleteIndex(idx);
  setConfirmOpen(true);
};

// Use visible row index → resolve raw record, call DELETE, then rebuild tables
const performDeleteVehicle = async () => {
  const visIdx = pendingDeleteIndex;
  if (visIdx == null) return;

  try {
    // resolve the visible row
    const vis = vehicles[visIdx];

    // find the matching raw record (safer than assuming indexes match)
    const rawIdx = rawVehicles.findIndex(
      r => r.leadReturnId === vis.returnId && r.vin === vis.vin
    );
    if (rawIdx < 0) throw new Error("Could not resolve vehicle in raw list");

    const r = rawVehicles[rawIdx];

    // Use VIN or fallback to empty string (encode empty as '-EMPTY-')
    const vinParam = r.vin ? encodeURIComponent(String(r.vin)) : encodeURIComponent('-EMPTY-');

    // build encoded URL (avoid 404s when VIN/IDs contain special chars)
    const url =
      `/api/lrvehicle/${encodeURIComponent(String(selectedLead.leadNo))}` +
      `/${encodeURIComponent(String(selectedCase.caseNo))}` +
      `/${encodeURIComponent(String(r.leadReturnId))}` +
      `/${vinParam}`;

    const token = localStorage.getItem("token");
    await api.delete(url, { headers: { Authorization: `Bearer ${token}` } });

    // remove from raw, then rebuild display list
    const newRaw = rawVehicles.filter((_, i) => i !== rawIdx);
    setRawVehicles(newRaw);

    const remapped = newRaw.map((v, i) => ({
      rawIndex:    i,
      returnId:    v.leadReturnId,
      dateEntered: formatDate(v.enteredDate),
      year:        v.year,
      make:        v.make,
      model:       v.model,
      color:       v.primaryColor,
      vin:         v.vin,
      plate:       v.plate,
      state:       v.state,
      accessLevel: v.accessLevel ?? "Everyone",
      enteredBy:   v.enteredBy
    }));

    // Filter based on role and access level
    let newVisible = remapped;
    if (!isCaseManager) {
      const currentUser = localStorage.getItem("loggedInUser")?.trim();
      const leadAssignees = (leadData?.assignedTo || []).map(a => a?.trim());

      newVisible = remapped.filter(r => {
        if (r.accessLevel === "Everyone") return true;
        if (r.accessLevel === "Case Manager and Assignees") {
          const isAssignedToLead = leadAssignees.some(a => a === currentUser);
          return isAssignedToLead;
        }
        return false;
      });
    }

    setVehicles(newVisible);
    setAuditLogRefresh(prev => prev + 1);

  } catch (e) {
    console.error(e);
    setAlertMessage("Failed to delete vehicle.");
    setAlertOpen(true);
  } finally {
    setConfirmOpen(false);
    setPendingDeleteIndex(null);
  }
};




  const [vehicles, setVehicles] = useState([
  ]);
   const [vehicleModalData, setVehicleModalData] = useState({
        leadNo: "",
        leadName: "",
        caseNo: "",
        caseName: "",
        leadReturnId: "",
        leadsDeskCode: "",
      });

const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);

// Fallback to location.state if context is not available
const effectiveCase = selectedCase?.caseNo ? selectedCase : caseDetails;
const effectiveLead = selectedLead?.leadNo ? selectedLead : leadDetails;

useEffect(() => {
  if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;

  const ac = new AbortController();

  (async () => {
    try {
      const token = localStorage.getItem("token");
      const encLead = encodeURIComponent(selectedLead.leadName);
      const encCase = encodeURIComponent(selectedCase.caseName);

      const resp = await api.get(
        `/api/leadReturnResult/${selectedLead.leadNo}/${encLead}/${selectedCase.caseNo}/${encCase}`,
        { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
      );

      const ids = [...new Set((resp?.data || []).map(r => r?.leadReturnId).filter(Boolean))];
      ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
      setNarrativeIds(ids);

      setVehicleData(v =>
        (editIndex === null && !v.leadReturnId)
          ? { ...v, leadReturnId: ids.at(-1) || "" , enteredDate: v.enteredDate || todayISO}
          : v
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
  editIndex,
  todayISO
]);


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


 const openVehicleModal = (leadNo, leadName, caseNo, caseName, leadReturnId, leadsDeskCode) => {
      setVehicleModalData({
        leadNo,
        leadName,
        caseNo,
        caseName,
        leadReturnId,
        leadsDeskCode,
      });
      setShowVehicleModal(true);
    };

    const closeVehicleModal = () => {
      setVehicleModalData({
        leadNo: "",
        leadName: "",
        caseNo: "",
        caseName: "",
        leadReturnId: "",
        leadsDeskCode: "",
      });
      setShowVehicleModal(false);
    };
    const [showVehicleModal, setShowVehicleModal] = useState(false);

    const handleEditVehicle = (idx) => {
      const vis = vehicles[idx];
      let rawIdx = vis?.rawIndex;
      if (rawIdx == null) {
        rawIdx = rawVehicles.findIndex(r =>
          r.leadReturnId === vis.returnId && r.vin === vis.vin
        );
      }

      if (rawIdx < 0) {
        console.error("Could not resolve vehicle in raw list");
        return;
      }

      const v = rawVehicles[rawIdx];
      setEditIndex(rawIdx);
      setVehicleData({
        leadReturnId:  v.leadReturnId,
        enteredDate:   v.enteredDate.slice(0,10),
        vin:           v.vin,
        year:          v.year,
        make:          v.make,
        model:         v.model,
        plate:         v.plate,
        state:         v.state,
        primaryColor:  v.primaryColor,
        secondaryColor:v.secondaryColor,
        category:      v.category,
        type:          v.type,
        information:   v.information
      });
    };

  const handleChange = (field, value) => {
    setVehicleData({ ...vehicleData, [field]: value });
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
      fetchVehicles();
    }
  }, [selectedLead, selectedCase]);

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



  const handleSaveVehicle = async () => {

     const missing = findMissingFields(vehicleData);
  if (missing.length) {
    setAlertMessage(
      `Please fill the required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`
    );
    setAlertOpen(true);
    return;
  }

  const dataFields = [
    vehicleData.year,
    vehicleData.make,
    vehicleData.model,
    vehicleData.plate,
    vehicleData.category,
    vehicleData.type,
    vehicleData.vin,
    vehicleData.primaryColor,
    vehicleData.secondaryColor,
    vehicleData.state,
    vehicleData.information
  ];
  const hasAtLeastOneField = dataFields.some(
    (val) => val != null && String(val).trim() !== ""
  );
  if (!hasAtLeastOneField) {
    setAlertMessage("Please fill in at least one vehicle field before saving.");
    setAlertOpen(true);
    return;
  }

    const token = localStorage.getItem("token");
    const payload = {
      leadNo:        selectedLead.leadNo,
      description:   selectedLead.leadName,
      caseNo:        selectedCase.caseNo,
      caseName:      selectedCase.caseName,
      enteredBy:     username,
      enteredDate:   vehicleData.enteredDate || new Date().toISOString(),
      accessLevel:   vehicleData.accessLevel || "Everyone",
      ...vehicleData
    };

    try {
      let res;
      if (editIndex !== null) {
        const old = rawVehicles[editIndex];
        const vinParam = old.vin ? encodeURIComponent(old.vin) : encodeURIComponent('-EMPTY-');
        res = await api.put(
          `/api/lrvehicle/${selectedLead.leadNo}/${selectedCase.caseNo}/${encodeURIComponent(old.leadReturnId)}/${vinParam}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await api.post(
          "/api/lrvehicle/lrvehicle",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const updatedRaw = editIndex !== null
        ? rawVehicles.map((r, i) => (i === editIndex ? res.data : r))
        : [res.data, ...rawVehicles];

      const remapped = updatedRaw.map((v, i) => ({
        rawIndex:    i,
        returnId:    v.leadReturnId,
        dateEntered: formatDate(v.enteredDate),
        year:        v.year,
        make:        v.make,
        model:       v.model,
        color:       v.primaryColor,
        vin:         v.vin,
        plate:       v.plate,
        state:       v.state,
        accessLevel: v.accessLevel ?? "Everyone",
        enteredBy:   v.enteredBy
      }));

      let visible = remapped;
      if (!isCaseManager) {
        const currentUser = localStorage.getItem("loggedInUser")?.trim();
        const leadAssignees = (leadData?.assignedTo || []).map(a => (typeof a === "string" ? a.trim() : String(a ?? "")));
        visible = remapped.filter(r => {
          if (r.accessLevel === "Everyone") return true;
          if (r.accessLevel === "Case Manager and Assignees") {
            return leadAssignees.some(a => a === currentUser);
          }
          return false;
        });
      }

      setRawVehicles(updatedRaw);
      setVehicles(visible);

      setEditIndex(null);
      setVehicleData({
        year: '', make: '', model: '', plate: '',
        category: '', type: '', color:'', vin: '',
        primaryColor:'', secondaryColor:'', state:'',
        leadReturnId:'', information:'', enteredDate: todayISO
      });
      setAuditLogRefresh(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setAlertMessage("Save failed: " + (err.response?.data?.message || err.message));
      setAlertOpen(true);
    }
  };


  const fetchVehicles = async () => {
    const token = localStorage.getItem("token");
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);

    try {
      const res = await api.get(
        `/api/lrvehicle/lrvehicle/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRawVehicles(res.data);
      const mapped = res.data.map((vehicle, i) => ({
        rawIndex: i,
        returnId: vehicle.leadReturnId,
        dateEntered: formatDate(vehicle.enteredDate),
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.primaryColor,
        vin: vehicle.vin,
        plate: vehicle.plate,
        state: vehicle.state,
        accessLevel: vehicle.accessLevel || "Everyone",
        enteredBy: vehicle.enteredBy
      }));

      const withAccess = mapped.map(r => ({
        ...r,
        accessLevel: r.accessLevel ?? "Everyone"
      }));

      let visible = withAccess;
      if (!isCaseManager) {
        const currentUser = localStorage.getItem("loggedInUser")?.trim();
        const leadAssignees = (leadData?.assignedTo || []).map(a => (typeof a === "string" ? a.trim() : String(a ?? "")));

        visible = withAccess.filter(v => {
          if (v.accessLevel === "Everyone") return true;
          if (v.accessLevel === "Case Manager and Assignees") {
            const isAssignedToLead = leadAssignees.some(a => a === currentUser);
            return isAssignedToLead;
          }
          return false;
        });
      }

      setVehicles(visible);
      setError("");
    } catch (err) {
      console.error("Error fetching vehicle records:", err);
      setError("Failed to fetch vehicles.");
    }
  };

  const handleAccessChange = async (idx, newAccess) => {
    const vis = vehicles[idx];

    let rawIdx = vis?.rawIndex;
    if (rawIdx == null) {
      rawIdx = rawVehicles.findIndex(r =>
        r.leadReturnId === vis.returnId && r.vin === vis.vin
      );
    }

    if (rawIdx < 0) {
      console.error("Could not resolve vehicle in raw list");
      setAlertMessage("Could not find vehicle record. Please refresh the page.");
      setAlertOpen(true);
      return;
    }

    const v = rawVehicles[rawIdx];
    const vinParam = v.vin ? encodeURIComponent(v.vin) : encodeURIComponent('-EMPTY-');

    const token = localStorage.getItem("token");
    const url = `/api/lrvehicle/${selectedLead.leadNo}/${selectedCase.caseNo}/` +
          `${encodeURIComponent(v.leadReturnId)}/${vinParam}`;

    try {
      const { data: updatedDoc } = await api.put(
        url,
        { accessLevel: newAccess },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newRaw = rawVehicles.map((r, i) =>
        i === rawIdx ? updatedDoc : r
      );
      setRawVehicles(newRaw);

      const remapped = newRaw.map((v, i) => ({
        rawIndex: i,
        returnId: v.leadReturnId,
        dateEntered: formatDate(v.enteredDate),
        year: v.year,
        make: v.make,
        model: v.model,
        color: v.primaryColor,
        vin: v.vin,
        plate: v.plate,
        state: v.state,
        accessLevel: v.accessLevel || "Everyone",
        enteredBy: v.enteredBy
      }));

      let visible = remapped;
      if (!isCaseManager) {
        const currentUser = localStorage.getItem("loggedInUser")?.trim();
        const leadAssignees = (leadData?.assignedTo || []).map(a => (typeof a === "string" ? a.trim() : String(a ?? "")));

        visible = remapped.filter(r => {
          if (r.accessLevel === "Everyone") return true;
          if (r.accessLevel === "Case Manager and Assignees") {
            const isAssignedToLead = leadAssignees.some(a => a === currentUser);
            return isAssignedToLead;
          }
          return false;
        });
      }

      setVehicles(visible);

    } catch (err) {
      console.error("Failed to update accessLevel", err);
      setAlertMessage("Could not change access level. Please try again.");
      setAlertOpen(true);
    }
  };


  const isCaseManager =
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";

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
        onClose={() => setAlertOpen(false)}
      />

      <AlertModal
        isOpen={confirmOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record?"
        onConfirm={performDeleteVehicle}
        onClose={() => { setConfirmOpen(false); setPendingDeleteIndex(null); }}
      />

      <VehicleModal
        isOpen={showVehicleModal}
        onClose={closeVehicleModal}
        leadNo={vehicleModalData.leadNo}
        leadName={vehicleModalData.leadName}
        caseNo={vehicleModalData.caseNo}
        caseName={vehicleModalData.caseName}
        leadReturnId={vehicleModalData.leadReturnId}
      />

      <div className={styles.LRIContent}>

        <SideBar activePage="LeadReview" />

        <div className={styles.leftContentLI}>

          {/* Top nav bar */}
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

          {/* Section tabs bar */}
          <div className={styles.topMenuSections}>
            <div className={styles.menuItems} style={{ fontSize: '19px' }}>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
                Instructions
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
                Narrative
              </span>
              <span className={styles.menuItem} style={{ fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')}>
                Person
              </span>
              <span className={`${styles.menuItem} ${styles.menuItemActive}`} style={{ fontWeight: '600' }} onClick={() => handleNavigation('/LRVehicle')}>
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

          {/* Breadcrumb bar */}
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
                <span className={styles.crumbCurrent} aria-current="page">Lead Vehicles</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? ` Lead Status:  ${status}` : ` ${leadStatus}`}
            </h5>
          </div>

          {/* Page heading */}
          <div className={styles.caseHeader}>
            <h2>VEHICLE INFORMATION</h2>
          </div>

          {/* Main scrollable content */}
          <div className={styles.lriContentSection}>
            <div className={styles.contentSubsection}>

              {/* Vehicle Entry Section */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Vehicle Entry</div>
                <div className={styles.LREnteringContentBox}>

                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>Narrative Id*</label>
                      <select
                        value={vehicleData.leadReturnId}
                        onChange={(e) => handleChange('leadReturnId', e.target.value)}
                      >
                        <option value="">Select Id</option>
                        {narrativeIds.map(id => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formRow4}>
                      <label>Entered Date*</label>
                      <input
                        type="date"
                        value={vehicleData.enteredDate || todayISO}
                        onChange={(e) => handleChange('enteredDate', e.target.value)}
                      />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Model</label>
                      <input
                        type="text"
                        value={vehicleData.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>Plate</label>
                      <input
                        type="text"
                        value={vehicleData.plate}
                        onChange={(e) => handleChange('plate', e.target.value)}
                      />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Category</label>
                      <input
                        type="text"
                        value={vehicleData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                      />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Type</label>
                      <input
                        type="text"
                        value={vehicleData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>VIN</label>
                      <input
                        type="text"
                        value={vehicleData.vin}
                        onChange={(e) => handleChange('vin', e.target.value)}
                      />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Year</label>
                      <input
                        type="text"
                        value={vehicleData.year}
                        onChange={(e) => handleChange('year', e.target.value)}
                      />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Make</label>
                      <input
                        type="text"
                        value={vehicleData.make}
                        onChange={(e) => handleChange('make', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.contentToAddFirstRow}>
                    <div className={styles.formRow4}>
                      <label>State</label>
                      <input
                        type="text"
                        value={vehicleData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                      />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Primary Color</label>
                      <input
                        type="text"
                        value={vehicleData.primaryColor}
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                      />
                    </div>
                    <div className={styles.formRow4}>
                      <label>Secondary Color</label>
                      <input
                        type="text"
                        value={vehicleData.secondaryColor}
                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className={styles.returnFormH4}>Information</h4>
                  <div className={styles.returnForm}>
                    <textarea
                      value={vehicleData.information}
                      onChange={(e) => handleChange('information', e.target.value)}
                      placeholder="Enter vehicle information"
                    />
                  </div>

                  <div className={styles.formButtonsReturn}>
                    <button
                      disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || selectedLead?.leadStatus === "Closed" || isReadOnly}
                      className={styles.saveBtn1}
                      onClick={handleSaveVehicle}
                    >
                      {editIndex !== null ? "Update Vehicle" : "Add Vehicle"}
                    </button>
                    {editIndex !== null && (
                      <button
                        className={styles.cancelBtn}
                        onClick={() => {
                          setEditIndex(null);
                          setVehicleData({
                            year: '', make: '', model: '', plate: '',
                            category: '', type: '', color: '', vin: '',
                            primaryColor: '', secondaryColor: '', state: '',
                            leadReturnId: '', information: '', enteredDate: todayISO
                          });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {error && (
                <div style={{ color: "red", textAlign: "center", margin: "10px 0", fontSize: "16px" }}>
                  {error}
                </div>
              )}

              {/* Vehicle Records Section */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Vehicle Records</div>
                <table className={styles.leadsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "13%" }}>Date Entered</th>
                      <th style={{ width: "12%" }}>Narrative Id</th>
                      <th style={{ width: "10%" }}>Model</th>
                      <th style={{ width: "10%" }}>Color</th>
                      <th style={{ width: "9%" }}>More</th>
                      <th style={{ width: "14%" }}>Actions</th>
                      {isCaseManager && (
                        <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length > 0 ? vehicles.map((vehicle, index) => {
                      const canModify = vehicle.enteredBy?.trim() === signedInOfficer?.trim();
                      const disableActions =
                        selectedLead?.leadStatus === "In Review" ||
                        selectedLead?.leadStatus === "Completed" ||
                        selectedLead?.leadStatus === "Closed" ||
                        isReadOnly ||
                        !canModify;

                      return (
                        <tr key={index}>
                          <td>{vehicle.dateEntered}</td>
                          <td>{vehicle.returnId}</td>
                          <td>{vehicle.model}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ width: '60px', display: 'inline-block' }}>{vehicle.color}</span>
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  backgroundColor: vehicle.color,
                                  marginLeft: '15px',
                                  border: '1px solid #000',
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <button
                              className={styles.viewPersonBtn}
                              onClick={() => openVehicleModal(
                                selectedLead.leadNo,
                                selectedLead.leadName,
                                selectedCase.caseNo,
                                selectedCase.caseName,
                                vehicle.returnId
                              )}
                            >
                              View
                            </button>
                          </td>
                          <td>
                            <div className={styles.lrTableBtn}>
                              <button onClick={() => handleEditVehicle(index)} disabled={disableActions}>
                                <img
                                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                                  alt="Edit Icon"
                                  className={styles.editIcon}
                                />
                              </button>
                              <button onClick={() => requestDeleteVehicle(index)} disabled={disableActions}>
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
                                value={vehicle.accessLevel}
                                onChange={e => handleAccessChange(index, e.target.value)}
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
                        <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign: 'center' }}>
                          No Vehicle Data Available
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
