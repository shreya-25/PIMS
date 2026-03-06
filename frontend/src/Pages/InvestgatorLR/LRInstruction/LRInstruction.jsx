import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import { pickHigherStatus } from '../../../utils/status'
import { useLeadStatus } from '../../../hooks/useLeadStatus';


import Navbar from '../../../components/Navbar/Navbar';
import styles from './LRInstruction.module.css';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";

import { AlertModal } from "../../../components/AlertModal/AlertModal";



export const LRInstruction = () => {
    // useEffect(() => {
    //     // Apply style when component mounts
    //     document.body.style.overflow = "hidden";
    
    //     return () => {
    //       // Reset to default when component unmounts
    //       document.body.style.overflow = "auto";
    //     };
    //   }, []);
    const navigate = useNavigate(); // Initialize useNavigate hook
    const printRef = useRef();
    const routerLocation = useLocation();
    const location = useLocation();
         const [loading, setLoading] = useState(true);
          const [error, setError] = useState("");
    const { caseDetails, leadDetails } = routerLocation.state || {};
    const [alertMessage, setAlertMessage] = useState("");
      const [alertOpen, setAlertOpen] = useState(false);
    
      const params = new URLSearchParams(location.search);
  const qpCaseNo   = params.get("caseNo")   || undefined;
  const qpCaseName = params.get("caseName") || undefined;
  const qpLeadNo   = params.get("leadNo")   ? Number(params.get("leadNo")) : undefined;
  const qpLeadName = params.get("leadName") || undefined;

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date)) return "";
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    };

    const getCasePageRoute = () => {
      if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
      return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };

    const { selectedCase, selectedLead, setSelectedCase, setSelectedLead, leadInstructions, leadStatus, setLeadStatus, setLeadInstructions } = useContext(CaseContext);

    const routerState = (useLocation().state || {});
  const stateCase   = routerState.caseDetails;
  const stateLead   = routerState.leadDetails;

  const resolvedCaseNo   = selectedCase?.caseNo ?? stateCase?.caseNo ?? qpCaseNo;
  const resolvedCaseName = selectedCase?.caseName ?? stateCase?.caseName ?? qpCaseName;
  const resolvedLeadNo   = selectedLead?.leadNo ?? stateLead?.leadNo ?? qpLeadNo;
  const resolvedLeadName = selectedLead?.leadName ?? stateLead?.leadName ?? qpLeadName;
  const [isGenerating, setIsGenerating] = useState(false);

// helper to attach files for sections that have uploads
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

  // 3) (Optional but nice) hydrate Context from query on first load
  useEffect(() => {
    if (resolvedCaseNo && resolvedCaseName && !selectedCase?.caseNo && typeof setSelectedCase === "function") {
      setSelectedCase(prev => ({ ...(prev || {}), caseNo: resolvedCaseNo, caseName: resolvedCaseName }));
    }
    if (resolvedLeadNo && resolvedLeadName && !selectedLead?.leadNo) {
      setSelectedLead?.({
        leadNo: resolvedLeadNo,
        leadName: resolvedLeadName,
        caseNo: resolvedCaseNo,
        caseName: resolvedCaseName
      });
    }
  }, [
    resolvedCaseNo, resolvedCaseName, resolvedLeadNo, resolvedLeadName,
    selectedCase?.caseNo, selectedLead?.leadNo, setSelectedCase, setSelectedLead
  ]);

  const [leadData, setLeadData] = useState({
    leadNumber: '',
    parentLeadNo: '',
    incidentNo: '',
    subCategory: '',
    associatedSubCategories: [],
    assignedDate: '',
    dueDate: '',
    summary: '',
    assignedBy: '',
    leadDescription: '',
    assignedTo: [],
    assignedOfficer: []
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [associatedSubCategories, setAssociatedSubCategories] = useState([]); // Selected Subcategories
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);
  const handleInputChange = (field, value) => {
    setLeadData({ ...leadData, [field]: value });
  };
  const handleGenerateLead = () => {
  const { leadNumber, leadSummary, assignedDate, assignedOfficer, assignedBy } = leadData;
  
    // Check if mandatory fields are filled
    if (!leadNumber || !leadSummary || !assignedDate || !assignedOfficer || !assignedBy) {
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
    navigate(route, {
      state: {
        caseDetails,
        leadDetails
      }
    });
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

  const [assignedOfficers, setAssignedOfficers] = useState([]);
  

  const handleNextPage = () => {
    navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  };

  
    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

    useEffect(() => {
      const fetchLeadData = async () => {
        try {
          const lead = selectedLead?.leadNo ? selectedLead : leadDetails;
          const kase = selectedCase?.caseNo ? selectedCase : caseDetails;
    
          if (lead?.leadNo && lead?.leadName && kase?.caseNo && kase?.caseName) {
            const token = localStorage.getItem("token");
    
            const response = await api.get(
              `/api/lead/lead/${lead.leadNo}/${encodeURIComponent(
                lead.leadName
              )}/${kase.caseNo}/${encodeURIComponent(kase.caseName)}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
    
  
            // console.log("Fetched Lead Data1:", response.data);
  
            if (response.data.length > 0) {
              setLeadData({
                ...response.data[0], 
                assignedOfficer: response.data[0].assignedOfficer || [] // Ensure array
              });
              setLeadInstructions(response.data[0]);
            }
            
          }
        } catch (err) {
          console.error("Error fetching lead data:", err);
          setError("Failed to fetch lead data.");
        } finally {
          setLoading(false);
        }
      };
  
      fetchLeadData();
    }, [selectedLead, setLeadInstructions]);

    // setLeadStatus(leadData.leadStatus);

    useEffect(() => {
  if (!leadData?.leadStatus) return;
  setLeadStatus(prev => prev ? pickHigherStatus(prev, leadData.leadStatus) : leadData.leadStatus);
}, [leadData?.leadStatus, setLeadStatus]);

 const { status, isReadOnly } = useLeadStatus({
    caseNo: selectedCase.caseNo,
    caseName: selectedCase.caseName,
    leadNo: selectedLead.leadNo,
    leadName: selectedLead.leadName,
  });

// console.log("leadData.status", leadData.leadStatus);
// console.log("leadstatus", leadStatus);
console.log("status from hook", status);
console.log("isReadOnly", isReadOnly);
  
    const onShowCaseSelector = (route) => {
      navigate(route, { state: { caseDetails } });
  };

  const PrintableContent = React.forwardRef((props, ref) => (
    <div ref={ref}>
      {/* Title with Case No and Case Name */}
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Lead Return Report - {caseDetails.caseNo} - {caseDetails.caseName}
      </h1>
      {/* The printable area (starting from the bottom-content) */}
      <div className={styles.bottomContentLRI}>
        <table className={styles.detailsTable}>
          <tbody>
            <tr>
              <td>Case Name:</td>
              <td>
                <input
                  type="text"
                  className={styles.inputField}
                  value={leadData.caseName || 'Main Street Murder'}
                  readOnly
                />
              </td>
            </tr>
            <tr>
              <td>Lead Summary:</td>
              <td>
                <input
                  type="text"
                  className={styles.inputField}
                  value={leadData.leadSummary}
                  readOnly
                />
              </td>
            </tr>
            <tr>
              <td>Assigned Date:</td>
              <td>
                <input
                  type="text"
                  className={styles.inputField}
                  value={leadData.assignedDate}
                  readOnly
                />
              </td>
            </tr>
            {/* Add any other rows you want printed */}
          </tbody>
        </table>
      </div>
    </div>
  ));
  
  return (
    <div className={styles.personPage}>
      {/* Navbar at the top */}
      <Navbar />

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
                  title={isGenerating ? "Preparing report..." : "View Lead Return"}
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
                  alert("Please select a case and lead first.");
                }
              }}>Lead Chain of Custody</span>
            </div>
          </div>

          <div className={styles.topMenuSections}>
            <div className={styles.menuItems} style={{ fontSize: '18px' }}>
              <span className={`${styles.menuItem} ${styles.menuItemActive}`} onClick={() => handleNavigation('/LRInstruction')}>Instructions</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LRReturn')}>Narrative</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LRPerson')}>Person</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LRVehicle')}>Vehicles</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LREnclosures')}>Enclosures</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LREvidence')}>Evidence</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LRPictures')}>Pictures</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LRAudio')}>Audio</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LRVideo')}>Videos</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LRScratchpad')}>Notes</span>
              <span className={styles.menuItem} onClick={() => handleNavigation('/LRTimeline')}>Timeline</span>
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
                <span className={styles.crumbCurrent} aria-current="page">Lead Instructions</span>
              </div>
            </h5>
            <h5 className={styles.sideTitle}>
              {selectedLead?.leadNo ? ` Lead Status:  ${leadStatus}` : ` ${leadStatus}`}
            </h5>
          </div>

          {/* Center Section */}
          <div className={styles.caseHeader}>
            <h2>LEAD INSTRUCTIONS</h2>
          </div>

          {/* Right Section */}
          <div className={styles.lriContentSection}>

            {(selectedCase.role === "Case Manager" || selectedCase.role === "Detective Supervisor") && (
              <div className={styles.addLeadSection}>
              </div>
            )}

            <table className={styles.leadsTable}>
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Lead No.</th>
                  <th style={{ width: "10%" }}>Case No.</th>
                  <th style={{ width: "10%" }}>Assigned By</th>
                  <th style={{ width: "8%" }}>Assigned Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedLead.leadNo}</td>
                  <td>{leadData.caseNo}</td>
                  <td>{leadData.assignedBy}</td>
                  <td>{formatDate(leadData.assignedDate)}</td>
                </tr>
              </tbody>
            </table>

            {/* Bottom Content */}
            <div className={styles.bottomContentLRI}>
              <table className={styles.detailsTable}>
                <tbody>
                  <tr>
                    <td className={styles.infoLabel}>Case Name:</td>
                    <td>
                      <div className={styles.inputField}>
                        {leadData.caseName || "—"}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className={styles.infoLabel}>Lead Log Summary:</td>
                    <td>
                      <div className={styles.inputField}>
                        {leadData.description || "—"}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className={styles.infoLabel}>Lead Instruction:</td>
                    <td>
                      <div className={styles.leadInstructionText}>
                        {leadData.summary || "—"}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className={styles.infoLabel}>Assigned Officers:</td>
                    <td>
                      <div className={styles.inputField}>
                        {Array.isArray(leadData.assignedTo)
                          ? leadData.assignedTo
                              .map(o => (typeof o === "string" ? o : o.username))
                              .filter(Boolean)
                              .join(", ") || "—"
                          : "—"}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className={styles.infoLabel}>Lead Origin:</td>
                    <td>
                      <div className={styles.inputField}>
                        {leadData.parentLeadNo || "—"}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className={styles.infoLabel}>Subcategory:</td>
                    <td>
                      <div className={styles.inputField}>
                        {leadData.subCategory || "—"}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className={styles.infoLabel}>Associated Subcategories:</td>
                    <td>
                      <div className={styles.inputField}>
                        {Array.isArray(leadData.associatedSubCategories)
                          ? leadData.associatedSubCategories.join(", ") || "—"
                          : "—"}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};