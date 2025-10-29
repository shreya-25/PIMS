import React, { useContext, useState, useEffect} from 'react';

import { useLocation, useNavigate } from "react-router-dom";
import FootBar from '../../../components/FootBar/FootBar';
import Navbar from '../../../components/Navbar/Navbar';
import './LRPerson1.css';
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";



export const LRPerson1 = () => {
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
const FORM_KEY = "LRPerson1:form";
const MISC_KEY = "LRPerson1:misc";
const [username, setUsername] = useState("");
      const [leadData, setLeadData] = useState({});
  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };
  const { leadDetails, caseDetails, person } = location.state || {};
const { selectedCase, selectedLead, leadInstructions, leadReturns } = useContext(CaseContext);
     const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
const onShowCaseSelector = (route) => {
  navigate(route, { state: { caseDetails } });
};
const [narrativeIds, setNarrativeIds] = useState([]);

useEffect(() => {
  if (!selectedLead?.leadNo || !selectedLead?.leadName || !selectedCase?.caseNo || !selectedCase?.caseName) return;

  // If context already has IDs you can skip the fetch:
  if (Array.isArray(leadReturns) && leadReturns.length) {
    const ids = [...new Set(leadReturns.map(r => r?.leadReturnId).filter(Boolean))];
    // optional alphabet sort A,B,C...
    ids.sort((a,b) => a.localeCompare(b));
    setNarrativeIds(ids);
    return;
  }

  const ac = new AbortController();
  (async () => {
    try {
      const token = localStorage.getItem("token");
      const resp = await api.get(
        `/api/leadReturnResult/${selectedLead.leadNo}/${encodeURIComponent(selectedLead.leadName)}/${selectedCase.caseNo}/${encodeURIComponent(selectedCase.caseName)}`,
        { signal: ac.signal, headers: { Authorization: `Bearer ${token}` } }
      );
      const ids = [...new Set((resp?.data ?? []).map(r => r?.leadReturnId).filter(Boolean))];
      ids.sort((a,b) => a.localeCompare(b));
      setNarrativeIds(ids);
    } catch (e) {
      if (!ac.signal.aborted) console.error("Failed to load narrative ids", e);
    }
  })();

  return () => ac.abort();
}, [
  selectedLead?.leadNo,
  selectedLead?.leadName,
  selectedCase?.caseNo,
  selectedCase?.caseName,
  leadReturns
]);



const todayISO = React.useMemo(
  () => new Date().toISOString().slice(0, 10),
  []
);

const alphabetToNumber = (str) => {
  if (!str) return 0;
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * 26 + (str.charCodeAt(i) - 64); // 'A' = 65
  }
  return result;
};

const narrativeIdOptions = React.useMemo(() => {
  const ids = Array.isArray(leadReturns)
    ? [...new Set(leadReturns.map(r => r?.leadReturnId).filter(Boolean))]
    : [];
  // sort alphabetically by A, B, C... (or remove this to keep API order)
  return ids.sort((a, b) => alphabetToNumber(a) - alphabetToNumber(b));
}, [leadReturns]);


useEffect(() => {
   const loggedInUser = localStorage.getItem("loggedInUser");
   if (loggedInUser) {
     setUsername(loggedInUser);
   }
  })

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
  

  const initialForm = {
    dateEntered:  person?.enteredDate?.slice(0,10)   || "",
    leadReturnId: person?.leadReturnId                || "",
    lastName:     person?.lastName                    || "",
    firstName:    person?.firstName                   || "",
    mi:           person?.middleInitial                || "",
    suffix:       person?.suffix                       || "",
    cellNumber:   person?.cellNumber                   || "",
    alias:        person?.alias                || "",
    businessName: person?.businessName                 || "",
    street1:      person?.address?.street1             || "",
    street2:      person?.address?.street2             || "",
    building:     person?.address?.building            || "",
    apartment:    person?.address?.apartment           || "",
    city:         person?.address?.city                || "",
    state:        person?.address?.state               || "",
    zipCode:      person?.address?.zipCode             || "",
    age:          person?.age                          || "",
    ssn:          person?.ssn                          || "",
    occupation:   person?.occupation                   || "",
    email:        person?.email                        || "",
    personType:   person?.personType                   || "",
    condition:    person?.condition                    || "",
    cautionType:  person?.cautionType                  || "",
    sex:          person?.sex                          || "",
    race:         person?.race                         || "",
    ethnicity:    person?.ethnicity                    || "",
    skinTone:     person?.skinTone                     || "",
    eyeColor:     person?.eyeColor                     || "",
    glasses:      person?.glasses                      || "",
    hairColor:    person?.hairColor                    || "",
    tattoo:       person?.tattoo                       || "",
    scar:         person?.scar                         || "",
    mark:         person?.mark                         || ""
  };

  const [formData, setFormData] = useState(() => {
  const saved = sessionStorage.getItem(FORM_KEY);
  if (saved) return JSON.parse(saved);

  // If editing, use the existing person values
  if (person) {
    return {
      dateEntered: person?.enteredDate?.slice(0, 10) || "",
      leadReturnId: person?.leadReturnId || "",
      lastName: person?.lastName || "",
      firstName: person?.firstName || "",
      mi: person?.middleInitial || "",
      suffix: person?.suffix || "",
      cellNumber: person?.cellNumber || "",
      alias: person?.alias || "",
      businessName: person?.businessName || "",
      street1: person?.address?.street1 || "",
      street2: person?.address?.street2 || "",
      building: person?.address?.building || "",
      apartment: person?.address?.apartment || "",
      city: person?.address?.city || "",
      state: person?.address?.state || "",
      zipCode: person?.address?.zipCode || "",
      age: person?.age || "",
      ssn: person?.ssn || "",
      occupation: person?.occupation || "",
      email: person?.email || "",
      personType: person?.personType || "",
      condition: person?.condition || "",
      cautionType: person?.cautionType || "",
      sex: person?.sex || "",
      race: person?.race || "",
      ethnicity: person?.ethnicity || "",
      skinTone: person?.skinTone || "",
      eyeColor: person?.eyeColor || "",
      glasses: person?.glasses || "",
      hairColor: person?.hairColor || "",
      tattoo: person?.tattoo || "",
      scar: person?.scar || "",
      mark: person?.mark || "",
    };
  }

  // Creating new: Date defaults to today; Narrative defaults to last available (optional)
  return {
    dateEntered: todayISO,
    leadReturnId: "", // or narrativeIdOptions.at(-1) || "" to preselect the most recent
    lastName: "",
    firstName: "",
    mi: "",
    suffix: "",
    cellNumber: "",
    alias: "",
    businessName: "",
    street1: "",
    street2: "",
    building: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    age: "",
    ssn: "",
    occupation: "",
    email: "",
    personType: "",
    condition: "",
    cautionType: "",
    sex: "",
    race: "",
    ethnicity: "",
    skinTone: "",
    eyeColor: "",
    glasses: "",
    hairColor: "",
    tattoo: "",
    scar: "",
    mark: "",
  };
});


  const [miscDetails, setMiscDetails] = useState(() => {
    const saved = sessionStorage.getItem(MISC_KEY);
    return saved
      ? JSON.parse(saved)
      : person?.additionalData || [];
  });

  // 2) Whenever formData changes, persist it
  useEffect(() => {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(formData));
  }, [formData]);

  // 3) Whenever miscDetails changes, persist it
  useEffect(() => {
    sessionStorage.setItem(MISC_KEY, JSON.stringify(miscDetails));
  }, [miscDetails]);

useEffect(() => {
  if (!person && !formData.leadReturnId && narrativeIdOptions.length) {
    setFormData(fd => ({ ...fd, leadReturnId: narrativeIdOptions.at(-1) }));
  }
  if (!person && !formData.dateEntered) {
    setFormData(fd => ({ ...fd, dateEntered: todayISO }));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [person, narrativeIdOptions, todayISO]);

  
  const addNewRow = () => {
    setMiscDetails([...miscDetails, { category: "", value: "" }]);
  };

  const handleInputChange = (index, field, value) => {
    const updatedDetails = [...miscDetails];
    updatedDetails[index][field] = value;
    setMiscDetails(updatedDetails);
  };

    const getCasePageRoute = () => {
      if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
      return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
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


  const handleSave = async () => {
    const token = localStorage.getItem("token");
  
    const payload = {
      leadNo: selectedLead?.leadNo,
      description: selectedLead?.leadName,
      caseNo: selectedCase?.caseNo,
      caseName: selectedCase?.caseName,
      enteredBy: username, 
      enteredDate: formData.dateEntered,
      leadReturnId: formData.leadReturnId,
  
      lastName: formData.lastName,
      firstName: formData.firstName,
      middleInitial: formData.mi,
      suffix: formData.suffix,
      cellNumber: formData.cellNumber,
      alias: formData.alias,
      businessName: formData.businessName,
      address: {
        street1: formData.street1,
        street2: formData.street2,
        building: formData.building,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      },
  
      age: formData.age,
      ssn: formData.ssn,
      occupation: formData.occupation,
      email: formData.email,
      personType: formData.personType,
      condition: formData.condition,
      cautionType: formData.cautionType,
      sex: formData.sex,
      race: formData.race,
      ethnicity: formData.ethnicity,
      skinTone: formData.skinTone,
      eyeColor: formData.eyeColor,
      glasses: formData.glasses,
      hairColor: formData.hairColor,
      tattoo: formData.tattoo,
      scar: formData.scar,
      mark: formData.mark,
  
      additionalData: miscDetails, // Store all misc rows
    };

    console.log(payload);
  
  //   try {
  //     // axios.post(url, data, config)
  //     const response = await api.post(
  //       "/api/lrperson/lrperson",
  //       payload,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           "Authorization": `Bearer ${token}`,
  //         },
  //       }
  //     );
  
  //     // If you get here, status was 2xx:
  //     console.log("Saved entry", response.data);
  //     alert("Entry saved successfully!");
  //   } catch (err) {
  //     // err.response exists when the server replied with non-2xx
  //     if (err.response) {
  //       console.error("Server rejected:", err.response);
  //       // Try to pull out a useful message from your API’s JSON error body:
  //       const serverMsg = err.response.data?.message
  //                       || JSON.stringify(err.response.data);
  //       alert(`Failed to save entry: ${serverMsg}`);
  //     } else {
  //       // Something went wrong setting up the request
  //       console.error("Network or code error:", err);
  //       alert(`An error occurred: ${err.message}`);
  //     }
  //   }
  // };
  try {
    let response;
    if (person) {
      // UPDATE existing record
      response = await api.put(
        `/api/lrperson/${selectedLead.leadNo}/` +
          `${selectedCase.caseNo}/` +
          `${person.leadReturnId}/` +
          `${person.firstName}/` +
          `${person.lastName}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      // CREATE new record
      response = await api.post(
        "/api/lrperson/lrperson",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
    }

    console.log("Server response:", response.data);
    sessionStorage.removeItem(FORM_KEY);
    sessionStorage.removeItem(MISC_KEY);

    // alert(person ? "Updated successfully!" : "Created successfully!");
    setAlertMessage(person ? "Updated successfully!" : "Created successfully!");
    setAlertOpen(true);

    navigate(-1);
    // optionally redirect back or refresh your list here

  } catch (err) {
    console.error("Save failed:", err.response || err);
    // alert("Error: " + (err.response?.data?.message || err.message));
    setAlertMessage("Error: " + (err.response?.data?.message || err.message));
                    setAlertOpen(true);
  }
};

 if (!selectedCase && !caseDetails) {
    return <div>Loading case/lead…</div>;
  }

  
  
  
  return (
    <div className="person-page">
      {/* Navbar at the top */}
      <Navbar />

       <AlertModal
              isOpen={alertOpen}
              title="Notification"
              message={alertMessage}
              onConfirm={() => setAlertOpen(false)}
              onClose={()   => setAlertOpen(false)}
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
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideo")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
        </div>
       </div> */}


       <div className="LRI_Content">
    
                  <SideBar  activePage="CasePageManager" />
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
                    // alert("Please select a case and lead first.");
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
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
           <span className="menu-item active" style={{fontWeight: '600' }} onClick={() => handleNavigation('/LRPerson1')} >
            Add Person
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
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> </div>
   
                <div className = "LRI-content-section">

<div className = "content-subsection">

     {/* Main Content */}
     {/* <div className="form-container1"> */}
        <table className="person-table2">
          <tbody>
            <tr>
              <td>Date Entered *</td>
              <td>
                <input
                  type="date"
                  value={formData.dateEntered}
                  className="input-large"
                  onChange={(e) => handleChange("dateEntered", e.target.value)}
                />
              </td>
              <td>Narrative Id *</td>
              <td>
                 {/* <select
                  className="input-large"
                  value={formData.leadReturnId}
                  onChange={(e) => handleChange("leadReturnId", e.target.value)}
                >
                  <option value="">Select Narrative Id</option>
                  {narrativeIdOptions.map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select> */}

    <select
      className="input-large"
      value={formData.leadReturnId}
      onChange={(e) => handleChange("leadReturnId", e.target.value)}
    >
      <option value="">Select Narrative Id</option>
      {narrativeIds.map(id => (
        <option key={id} value={id}>{id}</option>
      ))}
    </select>


              </td>
            </tr>
            <tr>
              <td>Last Name </td>
              <td>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
              </td>
              <td>First Name *</td>
              <td>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>MI</td>
              <td>
                <input
                  type="text"
                  value={formData.mi}
                  onChange={(e) => handleChange("mi", e.target.value)}
                />
              </td>
              <td>Suffix</td>
              <td>
                <input
                  type="text"
                  value={formData.suffix}
                  onChange={(e) => handleChange("suffix", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Cell Number</td>
              <td>
                <input
                  type="text"
                  value={formData.cellNumber}
                  onChange={(e) => handleChange("cellNumber", e.target.value)}
                />
              </td>

              <td>Alias</td>
              <td>
                <input
                  type="text"
                  value={formData.Alias}
                  onChange={(e) => handleChange("Alias", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Street 1</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.street1}
                  onChange={(e) => handleChange("street1", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Street 2</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.street2}
                  onChange={(e) => handleChange("street2", e.target.value)}
                />
              </td>
            </tr>
            <tr>
                 <td>Business Name</td>
              <td>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                />
              </td>
              <td>Apartment</td>
              <td>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => handleChange("apartment", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>City</td>
              <td>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </td>
              <td>State</td>
              <td>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Zip Code</td>
              <td colSpan="1">
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                />
              </td>
              <td>Age</td>
              <td><input type="text" /></td>

            </tr>

            <tr>
              <td>SSN</td>
              <td><input type="text" /></td>
              
              <td>Occupation</td>
              <td><input type="text" /></td>
            </tr>

                {/* Second Row */}
                <tr>
              <td>Email</td>
              <td colSpan="3"><input type="email" /></td>
            </tr>

            {/* Fourth Row */}
            <tr>
                    <td>Person Type</td>
                    <td>
                      <select
                        value={formData.personType}
                        onChange={(e) => handleChange('personType', e.target.value)}
                      >
                        <option value="">Select Type</option>
                        <option value="Suspect">Suspect</option>
                        <option value="Victim">Victim</option>
                        <option value="Witness">Witness</option>
                        <option value="Officer">Officer</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Condition</td>
                    <td>
                      <select
                        value={formData.condition}
                        onChange={(e) => handleChange('condition', e.target.value)}
                      >
                        <option value="">Select Condition</option>
                        <option value="Cooperative">Cooperative</option>
                        <option value="Uncooperative">Uncooperative</option>
                        <option value="Injured">Injured</option>
                        <option value="Deceased">Deceased</option>
                      </select>
                    </td>
                  </tr>

            {/* Fifth Row */}
            <tr>
                    <td>Caution Type</td>
                    <td>
                      <select
                        value={formData.cautionType}
                        onChange={(e) => handleChange('cautionType', e.target.value)}
                      >
                        <option value="">Select Type</option>
                        <option value="Armed">Armed</option>
                        <option value="Unarmed">Unarmed</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Sex</td>
                    <td>
                      <select
                        value={formData.sex}
                        onChange={(e) => handleChange('sex', e.target.value)}
                      >
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>

            {/* Sixth Row */}
            <tr>
                    <td>Race</td>
                    <td>
                      <select
                        value={formData.race}
                        onChange={(e) => handleChange('race', e.target.value)}
                      >
                        <option value="">Select Race</option>
                        <option value="White">White</option>
                        <option value="Black">Black or African American</option>
                        <option value="Asian">Asian</option>
                        <option value="Native American">Native American</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Ethnicity</td>
                    <td>
                      <select
                        value={formData.ethnicity}
                        onChange={(e) => handleChange('ethnicity', e.target.value)}
                      >
                        <option value="">Select Ethnicity</option>
                        <option value="Hispanic">Hispanic or Latino</option>
                        <option value="Non-Hispanic">Not Hispanic or Latino</option>
                      </select>
                    </td>
                  </tr> 

            {/* Seventh Row */}
            <tr>
                    <td>Skin Tone</td>
                    <td>
                      <select value={formData.skinTone} onChange={(e) => handleChange('skinTone', e.target.value)}>
                        <option value="">Select Skin Tone</option>
                        <option value="Light">Light</option>
                        <option value="Medium">Medium</option>
                        <option value="Dark">Dark</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Eye Color</td>
                    <td>
                      <select value={formData.eyeColor} onChange={(e) => handleChange('eyeColor', e.target.value)}>
                        <option value="">Select Eye Color</option>
                        <option value="Brown">Brown</option>
                        <option value="Blue">Blue</option>
                        <option value="Green">Green</option>
                        <option value="Hazel">Hazel</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>Glasses</td>
                    <td>
                      <select value={formData.glasses} onChange={(e) => handleChange('glasses', e.target.value)}>
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td>Hair Color</td>
                    <td>
                      <select value={formData.hairColor} onChange={(e) => handleChange('hairColor', e.target.value)}>
                        <option value="">Select Hair Color</option>
                        <option value="Black">Black</option>
                        <option value="Brown">Brown</option>
                        <option value="Blonde">Blonde</option>
                        <option value="Red">Red</option>
                        <option value="Gray">Gray</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>
                       {/* Ninth Row */}
            <tr>
              <td>Height</td>
              <td>
                <input type="text" style={{ width: "40px" }} /> '
                <input type="text" style={{ width: "40px" }} /> "
              </td>
              <td>Weight</td>
              <td><input type="text" /></td>
            </tr>

                  <tr>
                    <td>Tattoo</td>
                    <td><input type="text"  value={formData.tattoo}
                    onChange={(e) =>
                      handleChange("tattoo", e.target.value)
                    } /></td>
                    
                    <td>Scar</td>
              
                    <td><input type="text"  value={formData.scar}
                    onChange={(e) =>
                      handleChange("scar", e.target.value)
                    } /></td>
                    
                  </tr>
                  <tr>
                    <td>Mark</td>
                    {/* <td colSpan="7"> */}
                    <td><input type="text"  value={formData.mark}
                    onChange={(e) =>
                      handleChange("mark", e.target.value)
                    } /></td>
      
                  </tr>
                  {/* Miscellaneous Section */}
                  <tr>
                    <td colSpan="4">
                      <h4>Miscellaneous Information</h4>
                      <table className="misc-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {miscDetails.map((row, i) => (
                            <tr key={i}>
                              <td>
                                <input
                                  type="text"
                                  placeholder="Category"
                                  value={row.category}
                                  onChange={e => handleInputChange(i, "category", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  placeholder="Value"
                                  value={row.value}
                                  onChange={e => handleInputChange(i, "value", e.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button type="button" className ="save-btn1" onClick={addNewRow}>
                        + Add Category / Value
                      </button>
                    </td>
                  </tr>

          </tbody>
        </table>
        

        {/* Buttons */}
        <div className="form-buttons">
       
          <button className="save-btn1" onClick={handleSave}>Save</button>
          {/* <button className="cancel-btn">Cancel</button> */}
        </div>
      {/* </div> */}
        
      </div>
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVehicle")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};