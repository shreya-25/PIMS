import './LRVehicle.css';
import React, { useContext, useState, useEffect, useRef } from "react";
import Navbar from '../../../components/Navbar/Navbar';
import FootBar from '../../../components/FootBar/FootBar';
import VehicleModal from "../../../components/VehicleModal/VehicleModal";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import { useDataContext } from "../../Context/DataContext"; // Import Context
import { useLocation, useNavigate } from 'react-router-dom';
import Comment from "../../../components/Comment/Comment";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';



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
     };
  });

  


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

// Confirm delete modal (add these)
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

    // build encoded URL (avoid 404s when VIN/IDs contain special chars)
    const url =
      `/api/lrvehicle/${encodeURIComponent(String(selectedLead.leadNo))}` +
      `/${encodeURIComponent(String(selectedCase.caseNo))}` +
      `/${encodeURIComponent(String(r.leadReturnId))}` +
      `/${encodeURIComponent(String(r.vin))}`;

    const token = localStorage.getItem("token");
    await api.delete(url, { headers: { Authorization: `Bearer ${token}` } });

    // remove from raw, then rebuild display list
    const newRaw = rawVehicles.filter((_, i) => i !== rawIdx);
    setRawVehicles(newRaw);

    const newDisplay = newRaw.map(v => ({
      returnId:    v.leadReturnId,
      dateEntered: formatDate(v.enteredDate),
      year:        v.year,
      make:        v.make,
      model:       v.model,
      color:       v.primaryColor,
      vin:         v.vin,
      plate:       v.plate,
      state:       v.state,
      access:      v.access ?? "Everyone",
    }));
    setVehicles(newDisplay);

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

useEffect(() => {
  if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;

  const ac = new AbortController();

  (async () => {
    try {
      const token = localStorage.getItem("token");
      const encLead = encodeURIComponent(selectedLead.leadName);
      const encCase = encodeURIComponent(selectedCase.caseName);

      // Same endpoint you use elsewhere to list Lead Returns
      const resp = await api.get(
        `/api/leadReturnResult/${selectedLead.leadNo}/${encLead}/${selectedCase.caseNo}/${encCase}`,
        { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
      );

      const ids = [...new Set((resp?.data || []).map(r => r?.leadReturnId).filter(Boolean))];
      ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
      setNarrativeIds(ids);

      // If creating a new vehicle (not editing) and no selection yet, default to the latest ID
      setVehicleData(v =>
        (editIndex === null && !v.leadReturnId)
          ? { ...v, leadReturnId: ids.at(-1) || "" , enteredDate: v.enteredDate || todayISO}
          : v
      );
    } catch (e) {
      if (!ac.signal.aborted) {
        console.error("Failed to fetch Narrative IDs:", e);
        // optional: show a toast/modal if you like
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
      setShowVehicleModal(true); // Ensure this state exists
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
      const v = rawVehicles[idx];
      setEditIndex(idx);
      // pre-fill your form fields from the raw document
      setVehicleData({
        leadReturnId:  v.leadReturnId,
        enteredDate:   v.enteredDate.slice(0,10), // YYYY-MM-DD
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
    navigate(route); // Navigate to the respective page
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
  


  const handleSaveVehicle = async () => {
    const token = localStorage.getItem("token");
    const payload = {
      leadNo:        selectedLead.leadNo,
      description:   selectedLead.leadName,
      caseNo:        selectedCase.caseNo,
      caseName:      selectedCase.caseName,
      enteredBy:     username,
      enteredDate:   vehicleData.enteredDate || new Date().toISOString(),
      ...vehicleData
    };
  
    try {
      let res;
      if (editIndex !== null) {
        // update existing
        const old = rawVehicles[editIndex];
        res = await api.put(
          `/api/lrvehicle/${selectedLead.leadNo}/${selectedCase.caseNo}/${old.leadReturnId}/${old.vin}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // patch local arrays
        const updatedRaw = [...rawVehicles];
        updatedRaw[editIndex] = res.data;
        setRawVehicles(updatedRaw);
      } else {
        // create new
        res = await api.post(
          "/api/lrvehicle/lrvehicle",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRawVehicles([res.data, ...rawVehicles]);
      }
  
      // rebuild your display array
      fetchVehicles();  // or you can do your existing map of setVehicles
      // exit edit mode
      setEditIndex(null);
      setVehicleData({
        year: '', make: '', model: '', plate: '',
        category: '', type: '', color:'', vin: '',
        primaryColor:'', secondaryColor:'', state:'',
        leadReturnId:'', information:''
      });
        setAlertMessage(editIndex!==null ? "Vehicle updated" : "Vehicle added");
     setAlertOpen(true);
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
      const mapped = res.data.map((vehicle) => ({
        returnId: vehicle.leadReturnId,
        dateEntered: formatDate(vehicle.enteredDate),
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.primaryColor,
        vin: vehicle.vin,
        plate: vehicle.plate,
        state: vehicle.state,
      }));

      const withAccess = mapped.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
  
      setVehicles(withAccess);

      setError("");
    } catch (err) {
      console.error("Error fetching vehicle records:", err);
      setError("Failed to fetch vehicles.");
    }
  };
  
  const handleAccessChange = (idx, newAccess) => {
    setVehicles(rs => {
      const copy = [...rs];
      copy[idx] = { ...copy[idx], access: newAccess };
      return copy;
    });
  };
  
  const handleDeleteVehicle = async (idx) => {
    if (!window.confirm("Delete this vehicle?")) return;
    const v = rawVehicles[idx];
    try {
      const token = localStorage.getItem("token");
      await api.delete(
        `/api/lrvehicle/${selectedLead.leadNo}/${selectedCase.caseNo}/${v.leadReturnId}/${v.vin}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // 1) remove from rawVehicles
      const newRaw = rawVehicles.filter((_, i) => i !== idx);
      setRawVehicles(newRaw);
  
      // 2) rebuild your display array in vehicles
      const newDisplay = newRaw.map(vehicle => ({
        returnId:   vehicle.leadReturnId,
        dateEntered: formatDate(vehicle.enteredDate),
        year:        vehicle.year,
        make:        vehicle.make,
        model:       vehicle.model,
        color:       vehicle.primaryColor,
        vin:         vehicle.vin,
        plate:       vehicle.plate,
        state:       vehicle.state,
        access:      vehicle.access ?? "Everyone"
      }));
      setVehicles(newDisplay);
    } catch (e) {
      console.error(e);
       setAlertMessage("Failed to delete");
     setAlertOpen(true);
    }
  };
  

  
    const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";

  if (!selectedCase && !caseDetails) {
    return <div>Loading case/lead…</div>;
  }


  return (
    // <div className="lrvehicle-container">
    <div className="person-page">
        <div className="person-page-content">
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
  onConfirm={performDeleteVehicle}
  onClose={() => { setConfirmOpen(false); setPendingDeleteIndex(null); }}
/>





       <div className="LRI_Content">
       
<SideBar  activePage="LeadReview" />

                <div className="left-contentLI">

                           <div className="top-menu1" >
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
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREnclosures')} >
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

                {/* <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>

          </div> */}
            <div className="caseandleadinfo">
          <h5 className = "side-title"> 
             {/* Case: {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""} */}
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Vehicle
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
        ? ` Lead Status:  ${status}`
    : ` ${leadStatus}`}
</h5>

          </div>

                <div className="case-header">
          <h2 className="">VEHICLE INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Vehicle Form */}
        <div className = "timeline-form-sec">
            <div className = "LR-EnteringContentBox">
        <div className="vehicle-form">
          <div className="form-row4">
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
            <label>Entered Date*</label>
            <input
              type="text"
              value= {formatDate(new Date().toISOString())}
              onChange={(e) => handleChange('enteredDate', e.target.value)}
            />
            <label>Model</label>
            <input
              type="text"
              value={vehicleData.model}
              onChange={(e) => handleChange('model', e.target.value)}
            />
          </div>
          {/* <label>Color:</label>
            <input
              type="text"
              value={vehicleData.color}
              onChange={(e) => handleChange('color', e.target.value)}
            /> */}
          
          <div className="form-row4">
            <label>Plate</label>
            <input
              type="text"
              value={vehicleData.plate}
              onChange={(e) => handleChange('plate', e.target.value)}
            />
            <label>Category</label>
            <input
              type="text"
              value={vehicleData.category}
              onChange={(e) => handleChange('category', e.target.value)}
            />
            <label>Type</label>
            <input
              type="text"
              value={vehicleData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            />
          </div>
          <div className="form-row4">
            <label>VIN *</label>
            <input
              type="text"
              value={vehicleData.vin}
              onChange={(e) => handleChange('vin', e.target.value)}
            />
             <label>Year</label>
            <input
              type="text"
              value={vehicleData.year}
              onChange={(e) => handleChange('year', e.target.value)}
            />
            <label>Make</label>
            <input
              type="text"
              value={vehicleData.make}
              onChange={(e) => handleChange('make', e.target.value)}
            />
           
          </div>
          <div className="form-row4">
          <label>State</label>
            <input
              type="text"
              value={vehicleData.state}
              onChange={(e) => handleChange('state', e.target.value)}
            />
             <label>Main Color</label>
            <input
              type="text"
              value={vehicleData.primaryColor}
              onChange={(e) => handleChange('primaryColor', e.target.value)}
            />
            <label>Second Color</label>
            <input
              type="text"
              value={vehicleData.secondaryColor}
              onChange={(e) => handleChange('secondaryColor', e.target.value)}
            />
           
          </div>
        </div>
        <div className="vehicle-form">
          <div className="form-row1">
            <label>Information</label>
            <textarea
              value={vehicleData.information}
              onChange={(e) => handleChange('information', e.target.value)}
            ></textarea>
          </div>
          {/* <div className="form-row1">
            <label>Date Entered *</label>
            <input
                  type="date"
                  value={vehicleData.dateEntered}
                  className="input-large"
                  onChange={(e) => handleChange("dateEntered", e.target.value)}
                />
          </div> */}
          </div>
        </div>
        {/* Buttons */}
        <div className="form-buttons">
        {/* <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}
         className="save-btn1" onClick={handleAddVehicle}>
            Add Vehicle
          </button> */}
          <button
  disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly || selectedLead?.leadStatus === "Closed" || isReadOnly }
  className="save-btn1"
  onClick={handleSaveVehicle}
>
  {editIndex !== null ? "Update Vehicle" : "Add Vehicle"}
</button>

{editIndex !== null && (
  <button
    className="cancel-btn"
    onClick={() => {
      setEditIndex(null);
      // reset form
      setVehicleData({
        year: '', make: '', model: '', plate: '',
        category: '', type: '', color:'', vin: '',
        primaryColor:'', secondaryColor:'', state:'',
        leadReturnId:'', information:''
      });
    }}
  >
    Cancel
  </button>
)}
          {/* <button className="back-btn">Back</button>
          <button className="next-btn">Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button> */}
          </div>
        </div>

             {/* Vehicle Table */}
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "13%" }}>Date Entered</th>
              <th style={{ width: "12%" }}>Narrative Id</th>
              {/* <th style={{ width: "10%" }}>Make</th> */}
              <th style={{ width: "10%" }}>Model</th>
              <th style={{ width: "10%" }}>Color</th>
              {/* <th>State</th> */}
              <th style={{ width: "15%" }}>More</th>
              <th style={{ width: "14%" }}>Actions</th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
    {vehicles.length > 0 ? vehicles.map((vehicle, index) => (
      <tr key={index}>
        <td>{vehicle.dateEntered}</td>
        <td>{vehicle.returnId}</td>
        {/* <td>{vehicle.make}</td> */}
        <td>{vehicle.model}</td>
        <td style={{ textAlign: 'center' }}>
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
          ></div>
        </div>
      </td>
     
        {/* <td>{vehicle.state}</td> */}
        <td> <button className="download-btn" onClick={() => openVehicleModal(
                      selectedLead.leadNo,
                      selectedLead.leadName,
                      selectedCase.caseNo,
                      selectedCase.caseName,
                      vehicle.returnId

                    )}>View</button></td>
                    <VehicleModal
    isOpen={showVehicleModal}
    onClose={closeVehicleModal}
    leadNo={vehicleModalData.leadNo}
    leadName={vehicleModalData.leadName}
    caseNo={vehicleModalData.caseNo}
    caseName={vehicleModalData.caseName}
    leadReturnId={vehicleModalData.leadReturnId}
  />
  <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditVehicle(index)}

                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || isReadOnly}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => requestDeleteVehicle(index)}
                />
                  </button>
                  </div>
                </td>
                {isCaseManager && (
          <td>
            <select
              value={vehicle.access}
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
            No Vehicle Data Available
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

        <Comment tag= "Vehicle"/>

</div>
</div>

        {/* Buttons */}
        {/* <div className="form-buttons">
        <button className="add-btnvh" onClick={handleAddVehicle}>
            Add Vehicle
          </button>
          <button className="back-btn">Back</button>
          <button className="next-btn">Next</button>
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div> */}
  
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREnclosures")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
    </div>
  );
};
