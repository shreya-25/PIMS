import FootBar from '../../../components/FootBar/FootBar';
import React, { useContext, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CaseContext } from "../../CaseContext";
import axios from "axios";
import PersonModal from "../../../components/PersonModal/PersonModel";
import Comment from "../../../components/Comment/Comment";

import Navbar from '../../../components/Navbar/Navbar';
import './LRPerson.css';
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";
import { useLeadStatus } from '../../../hooks/useLeadStatus';


export const LRPerson = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
    const navigate = useNavigate(); // Initialize useNavigate hook
       const location = useLocation();
          
        const { leadDetails, caseDetails } = location.state || {};
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState("");
          const [rawPersons, setRawPersons] = useState([]);
            const { selectedCase, selectedLead, setSelectedLead, setSelectedCase, leadStatus, setLeadPersons, setLeadStatus } = useContext(CaseContext);

                const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
                const [alertOpen, setAlertOpen] = useState(false);
                const [alertMessage, setAlertMessage] = useState("");
                
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

               // State to control the modal
                    const [showPersonModal, setShowPersonModal] = useState(false);
                
                    // We’ll store the leadReturn info we need for the modal
                    const [personModalData, setPersonModalData] = useState({
                      leadNo: "",
                      description: "",
                      caseNo: "",
                      caseName: "",
                      leadReturnId: "",
                    });
            
                     // Function to open the modal, passing the needed data
                const openPersonModal = (leadNo, description, caseNo, caseName, leadReturnId) => {
                  setPersonModalData({ leadNo, description, caseNo, caseName, leadReturnId });
                  setShowPersonModal(true);
                };
              
                // Function to close the modal
                const closePersonModal = () => {
                  setShowPersonModal(false);
                };

    const [persons, setPersons] = useState([
      // { returnId: 1,dateEntered: "01/01/2024", name: "John Doe", phoneNo: "123-456-7890", address: "123 Main St, NY" },
      // {  returnId: 1, dateEntered: "01/05/2024", name: "Jane Smith", phoneNo: "987-654-3210", address: "456 Elm St, CA" },
      // {  returnId: 2,dateEntered: "01/10/2024", name: "Mike Johnson", phoneNo: "555-789-1234", address: "789 Pine St, TX" },
      // { returnId: 2,dateEntered: "01/15/2024", name: "Emily Davis", phoneNo: "111-222-3333", address: "321 Maple St, FL" },
    ]);
  
    const [selectedRow, setSelectedRow] = useState(null);
  
    const handleAddPerson = () => {
      setPersons([...persons, { dateEntered: "", name: "", phoneNo: "", address: "" }]);
    };

    useEffect(() => {
      if (
        selectedCase?.caseNo &&
        selectedCase?.caseName &&
        selectedLead?.leadNo &&
        selectedLead?.leadName
      ) {
        fetchPersons();
      }
    }, [selectedCase, selectedLead]);
    
    useEffect(() => {
      if (caseDetails && leadDetails) {
        setSelectedCase(caseDetails);
        setSelectedLead(leadDetails);
      }
    }, [caseDetails, leadDetails]);
  
  const [leadData, setLeadData] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleGenerateLead = () => {
    const { leadNumber, leadSummary, assignedDate, assignedOfficer, assignedBy } = leadData;
  
    // Check if mandatory fields are filled
    if (!leadNumber || !leadSummary || !assignedDate || !assignedOfficer || !assignedBy) {
       setAlertMessage("Please fill in all the required fields before generating a lead.");
                      setAlertOpen(true);
      return;
    }
  
    // Show confirmation alert before proceeding
    if (window.confirm("Are you sure you want to generate this lead?")) {
      // Navigate to the Lead Log page with relevant lead data
      navigate("/leadlog", {
        state: {
          leadNumber,
          leadSummary,
          assignedDate,
          assignedOfficer,
        },
      });
    }
  };

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  // const handleNextPage = () => {
  //   navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  // };

    const handlePrevPage = () => {
    navigate('/LRInstruction'); // Replace '/nextpage' with the actual next page route
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

  // Confirm delete modal
const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

const requestDeletePerson = (idx) => {
  setPendingDeleteIndex(idx);
  setConfirmOpen(true);
};

const performDeletePerson = async () => {
  const visibleIdx = pendingDeleteIndex;
  if (visibleIdx == null) return;

  try {
    // 1) Resolve the raw record that matches the visible row
    const vis = persons[visibleIdx];
    // Prefer rawIndex if you added it to your mapped rows
    let rawIndex = vis?.rawIndex;

    // Fallback: find by composite keys if rawIndex is not present
    if (rawIndex == null) {
      rawIndex = rawPersons.findIndex(r =>
        r.leadReturnId === vis.leadReturnId &&
        (`${r.firstName} ${r.lastName}`).trim() === (vis.name || "").trim()
      );
    }

    if (rawIndex < 0) {
      throw new Error("Couldn't resolve the selected person in the raw list.");
    }

    const p = rawPersons[rawIndex];

    // 2) Build an encoded URL (prevents 404 when names have spaces/special chars)
    const url =
      `/api/lrperson/${encodeURIComponent(String(selectedLead.leadNo))}` +
      `/${encodeURIComponent(String(selectedCase.caseNo))}` +
      `/${encodeURIComponent(String(p.leadReturnId))}` +
      `/${encodeURIComponent(String(p.firstName))}` ;
      
    const token = localStorage.getItem("token");
    await api.delete(url, { headers: { Authorization: `Bearer ${token}` } });

    // 3) Remove from raw, then remap & refilter visible rows
    const newRaw = rawPersons.filter((_, i) => i !== rawIndex);
    setRawPersons(newRaw);

    const remapped = newRaw.map((pp, i) => ({
      rawIndex:    i, // keep this so future edits/deletes are exact
      returnId:    pp.leadReturnId,
      dateEntered: new Date(pp.enteredDate).toLocaleDateString(),
      name:        `${pp.firstName} ${pp.lastName}`,
      phoneNo:     pp.cellNumber || "N/A",
      address:     pp.address?.street1 &&
                   `${pp.address.street1}, ${pp.address.city || ""}, ${pp.address.state || ""}`,
      leadReturnId: pp.leadReturnId,
      accessLevel:  pp.accessLevel || "Everyone",
      firstName:    pp.firstName,
      lastName:     pp.lastName,
    }));

    const newVisible = isCaseManager
      ? remapped
      : remapped.filter(r => r.accessLevel === "Everyone");

    setPersons(newVisible);
  } catch (err) {
    console.error("Delete failed", err);
    setAlertMessage("Failed to delete person.");
    setAlertOpen(true);
  } finally {
    setConfirmOpen(false);
    setPendingDeleteIndex(null);
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

  

  const fetchPersons = async () => {
    const token = localStorage.getItem("token");
  
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName); // encode if contains spaces
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
  
    console.log("About to hit");
    try {
      const res = await api.get(
        `/api/lrperson/lrperson/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(res);
      const personsFromApi = res.data;

      const apiPersons = res.data;         // raw array of LRPerson docs
      setRawPersons(apiPersons);
  
      // Map response to desired format
      const mappedPersons = res.data.map((person) => ({
        returnId: person.leadReturnId,
        dateEntered: new Date(person.enteredDate).toLocaleDateString(),
        name: `${person.firstName} ${person.lastName}`,
        phoneNo: person.cellNumber || "N/A",
        address:
          person.address?.street1 &&
          `${person.address.street1}, ${person.address.city || ""}, ${person.address.state || ""}`,
        leadReturnId: person.leadReturnId,
        accessLevel: person.accessLevel || "Everyone"
      }));

      const withAccess = mappedPersons.map(r => ({
        ...r,
        accessLevel: r.accessLevel ?? "Everyone"
      }));

      const visible = isCaseManager
                      ? withAccess
                      : withAccess.filter(p => p.accessLevel === "Everyone");
      setPersons(visible);
      setLeadPersons(personsFromApi);
      setError("");
      setLoading(false);
      console.log("map person", mappedPersons);
    } catch (err) {
      console.error("Error fetching person records:", err);
      setError("Failed to fetch persons.");
      setLoading(false);
    }
  };

  // Edit: send the raw object to LRPerson1
const handleEditPerson = (idx) => {
  const person = rawPersons[idx];
  navigate("/LRPerson1", {
    state: {
      caseDetails,
      leadDetails,
      person
    }
  });
};

// Delete: call your DELETE endpoint by composite key
const handleDeletePerson = async (idx) => {
  if (!window.confirm("Delete this person?")) return;
  const p = rawPersons[idx];
  try {
    const token = localStorage.getItem("token");
    await api.delete(
      `/api/lrperson/${selectedLead.leadNo}/${selectedCase.caseNo}/${p.leadReturnId}/${p.firstName}/${p.lastName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // remove from both raw and display
    const newRaw = rawPersons.filter((_, i) => i !== idx);
    setRawPersons(newRaw);
    setPersons(newRaw.map(person => ({
      returnId:   person.leadReturnId,
      dateEntered:new Date(person.enteredDate).toLocaleDateString(),
      name:       `${person.firstName} ${person.lastName}`,
      phoneNo:    person.cellNumber || "N/A",
      address:    `${person.address?.street1 || ""}, ${person.address?.city || ""}`,
      access:     person.access ?? "Everyone"
    })));
  } catch (err) {
    console.error("Delete failed", err);
     setAlertMessage("Failed to delete person.");
     setAlertOpen(true);
  }
};
  

  const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";

  const handleAccessChange = async (idx, newAccess) => {
  const p     = rawPersons[idx];
  const token = localStorage.getItem("token");

  try {
    // 1) Persist to server
    const { data: updatedDoc } = await api.put(
      `/api/lrperson/${selectedLead.leadNo}/${selectedCase.caseNo}/` +
        `${p.leadReturnId}/${p.firstName}/${p.lastName}`,
      { accessLevel: newAccess },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 2) Swap it into rawPersons
    const newRaw = rawPersons.map((r, i) =>
      i === idx ? updatedDoc : r
    );
    setRawPersons(newRaw);

    // 3) Remap to your UI shape
    const remapped = newRaw.map(p => ({
      returnId:    p.leadReturnId,
      dateEntered: new Date(p.enteredDate).toLocaleDateString(),
      name:         `${p.firstName} ${p.lastName}`,
      phoneNo:      p.cellNumber || "N/A",
      address:      `${p.address?.street1 || ""}, ${p.address?.city || ""}`,
      accessLevel:  p.accessLevel || "Everyone"
    }));

    // 4) Filter again for non-CMs
    const visible = isCaseManager
      ? remapped
      : remapped.filter(r => r.accessLevel === "Everyone");

    setPersons(visible);

  } catch (err) {
    console.error("Failed to update accessLevel", err);
    setAlertMessage("Could not change access level. Please try again.");
     setAlertOpen(true);
  }
};

  
  return (
    <div className="person-page">
        <div className="person-page-content">
      {/* Navbar at the top */}
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
  onConfirm={performDeletePerson} // proceed
  onClose={() => {                // cancel
    setConfirmOpen(false);
    setPendingDeleteIndex(null);
  }}
/>


      {/* <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item" onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item active" onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRTimeline")}>Timeline</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
         </div>
       </div> */}
    

       <div className="LRI_Content">
      
                 <SideBar  activePage="CasePageManager" />

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
              
      <div className="top-menu1" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Narrative
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVehicle')} >
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
               <p> PIMS &gt; Cases &gt; Lead # {selectedLead.leadNo} &gt; Lead Persons
                 </p>
             </h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? ` Lead Status:  ${status}`
    : ` ${status}`}
</h5>

          </div>

        <div className="case-header">
          <h2 className="">LEAD PERSONS DETAILS</h2>
        </div>
        <div className = "LRI-content-section">

<div className = "content-subsection">
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: "13%" }}>Date Entered</th>
              <th style={{ width: "12%" }}>Narrative Id </th>
              <th style={{ width: "12%" }}>Name</th>
              <th style={{ width: "12%" }}>Phone No</th>
              {/* <th>Address</th> */}
              <th style={{ width: "14%" }}>More</th>
              <th style={{ width: "14%" }}>Actions</th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {persons.length > 0 ? persons.map((person, index) => (
              <tr
                key={index}
                className={selectedRow === index ? "selected-row" : ""}
                onClick={() => setSelectedRow(index)}
              >
                <td>{person.dateEntered}</td>
                <td>{person.returnId}</td>  
                <td>{person.name}</td>
                <td>{person.phoneNo}</td>
                {/* <td>{person.address}</td> */}
                <td>  <button className="download-btn" onClick={() =>
                              openPersonModal(
                                selectedLead.leadNo,
                                selectedLead.leadName,
                                selectedCase.caseNo,
                                selectedCase.caseName,
                                person.leadReturnId
                              )
                            }>View</button></td>
                            <PersonModal
  isOpen={showPersonModal}
  onClose={closePersonModal}
  leadNo={personModalData.leadNo}
  description={personModalData.description}
  caseNo={personModalData.caseNo}
  caseName={personModalData.caseName}
  leadReturnId={personModalData.leadReturnId}
/>
<td>
                  <div classname = "lr-table-btn">
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditPerson(index)}
                />
                  </button>
                  <button>
                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={() => requestDeletePerson(index)}
                />
                  </button>
                  </div>
                </td>
                {isCaseManager && (
          <td>
            <select
              value={person.access}
              onChange={e => handleAccessChange(index, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Only Case Manager</option>
            </select>
          </td>
        )}
      </tr>
       )) : (
        <tr>
          <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign:'center' }}>
            No Details Available
          </td>
        </tr>
      )}
          </tbody>
        </table>
        {/* <button onClick={() => handleNavigation('/LRPerson1')} className="save-btn1
        ">Add Person</button> */}

      {/* Bottom Buttons */}
      <div className="bottom-buttons">
      <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed" || selectedLead?.leadStatus === "Closed" || isReadOnly}

      onClick={() => handleNavigation('/LRPerson1')} className="save-btn1">Add Person</button>
      </div>

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

      <Comment tag = "Person"/>
</div>
</div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVehicle")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
</div>
      
  );
};