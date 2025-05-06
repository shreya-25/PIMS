import Navbar from '../../../components/Navbar/Navbar';
import "./LRAudio.css"; // Custom CSS file for Audio styling
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import React, { useContext, useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../../../api";

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
   const location = useLocation();
  const { selectedCase, selectedLead, setSelectedLead , leadStatus} = useContext(CaseContext);
   const [file, setFile] = useState(null);
    
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
  const [audioFiles, setAudioFiles] = useState([
  ]);

  // State to manage form data
  const [audioData, setAudioData] = useState({
    dateAudioRecorded: "",
    description: "",
    audioSrc: "",
    leadReturnId: "",
  });

  const handleInputChange = (field, value) => {
    setAudioData({ ...audioData, [field]: value });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const audioUrl = URL.createObjectURL(selectedFile);
      setFile(selectedFile); // ✅ This was missing
      setAudioData({ ...audioData, audioSrc: audioUrl, filename: selectedFile.name });
    }
  };

  
  

  const handleAddAudio = async () => {
    const formData = new FormData();
  
    // Validation
    if (!file ||  !audioData.leadReturnId || !audioData.dateAudioRecorded || !audioData.description) {
      alert("Please fill in all required fields and select a file.");
      return;
    }
  
    // File and fields
    formData.append("file", file);
    formData.append("leadNo", selectedLead?.leadNo);
    formData.append("description", selectedLead?.leadName);
    formData.append("enteredBy", localStorage.getItem("loggedInUser"));
    formData.append("caseName", selectedCase?.caseName);
    formData.append("caseNo", selectedCase?.caseNo);
    formData.append("leadReturnId", audioData.leadReturnId);
    formData.append("enteredDate", new Date().toISOString());
    formData.append("dateAudioRecorded", audioData.dateAudioRecorded);
    formData.append("audioDescription", audioData.description);
  
    const token = localStorage.getItem("token");
  
    try {
      const response = await api.post(
        "/api/lraudio/upload",
        formData,
        {
          headers: {
            "Content-Type": undefined,  
            "Authorization": `Bearer ${token}`,
          },
        }
      );
  
      const savedAudio = response.data.audio;
  
      setAudioFiles((prev) => [
        ...prev,
        {
          dateEntered: formatDate(savedAudio.enteredDate),
          returnId: savedAudio.leadReturnId,
          dateAudioRecorded: formatDate(savedAudio.dateAudioRecorded),
          description: savedAudio.audioDescription,
          audioSrc: `${BASE_URL}/uploads/${savedAudio.filename}`,
          id:                 savedAudio._id
        },
      ]);

      await fetchAudioFiles();
  
      // Reset form
      setAudioData({
        dateAudioRecorded: "",
        description: "",
        audioSrc: "",
        leadReturnId: "",
      });
      setFile(null);
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Failed to upload audio.");
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
                
                  const leadNo = selectedLead?.leadNo;
                  const leadName = encodeURIComponent(selectedLead?.leadName);
                  const caseNo = selectedCase?.caseNo;
                  const caseName = encodeURIComponent(selectedCase?.caseName);
                
                  try {
                    const res = await api.get(
                      `/api/lraudio/${leadNo}/${leadName}/${caseNo}/${caseName}`,
                      {
                        headers: {
                          "Content-Type": undefined,  
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );
                
                    const mappedAudios = res.data.map((audio) => ({
                      dateEntered: formatDate(audio.enteredDate),
                      returnId: audio.leadReturnId,
                      dateAudioRecorded: formatDate(audio.dateAudioRecorded),
                      rawDateAudioRecorded:  audio.dateAudioRecorded,   
                      description: audio.audioDescription,
                      audioSrc: `${BASE_URL}/uploads/${audio.filename}`,
                      id:                audio._id,   
                      originalName: audio.originalName,
                    }));

                    const withAccess = mappedAudios.map(r => ({
                      ...r,
                      access: r.access ?? "Everyone"
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
                const isCaseManager = selectedCase?.role === "Case Manager";  
                const handleAccessChange = (idx, newAccess) => {
                  setAudioFiles(rs => {
                    const copy = [...rs];
                    copy[idx] = { ...copy[idx], access: newAccess };
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
  setFile(null);
  setAudioData({
    dateAudioRecorded: new Date(a.rawDateAudioRecorded).toISOString().slice(0,10),
    leadReturnId:      a.returnId,
    description:       a.description,
    audioSrc:          a.audioSrc,
    filename:          a.filename
  });
};


  const handleUpdateAudio = async () => {
     const idx = editingId;
    const a   = audioFiles[idx];
      const fd  = new FormData();
    fd.append("leadReturnId", audioData.leadReturnId);
    fd.append("dateAudioRecorded", audioData.dateAudioRecorded);
     fd.append("audioDescription", audioData.description);
       if (file) fd.append("file", file);
    const leadNo   = selectedLead.leadNo;
      const leadName = encodeURIComponent(selectedLead.leadName);
      const caseNo   = selectedCase.caseNo;
      const caseName = encodeURIComponent(selectedCase.caseName);
 
     await api.put(
        `/api/lraudio/${a.id}`,
        fd,
         { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
       );

     await fetchAudioFiles();

     setEditingId(null);
        setAudioData({ dateAudioRecorded:"", leadReturnId:"", description:"", audioSrc:"", filename:"" });
      setFile(null);
      };
      
                      

  return (
    <div className="lraudio-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      <div className="top-menu">
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
      </div>

      <div className="LRI_Content">
      <div className="sideitem">
       <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

       <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>  
            {/* {selectedCase.role !== "Investigator" && (      
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li> )}  */}


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
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/OfficerManagement")}>
              Officer Management
            </li> */}
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadHierarchy")}>
              View Lead Hierarchy
            </li> */}
            {/* <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewHierarchy")}>
              Generate Report
            </li> */}
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            {/* <li className="sidebar-item"onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li> */}
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

                </div>
                <div className="left-content">

                <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>


          </div>

        <div className="case-header">
          <h2 className="">AUDIO INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Audio Form */}
        <div className = "timeline-form-sec">
        <h4 className="evidence-form-h4">Enter Audio Details</h4>
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
            <label className="evidence-head">Return Id*</label>
            <input
              type="text"
              value={audioData.leadReturnId}
              className="evidence-head"
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
            />
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
            <label className="evidence-head">Upload Audio*</label>
            
            <input type="file" accept="audio/*" className="evidence-head" onChange={handleFileChange} />
          </div>
        </div>
        <div className="form-buttons-audio">
        {/* <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}

          className="save-btn1" onClick={handleAddAudio}>Add Audio</button> */}

  <button
  disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}
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
        setAudioData({ dateAudioRecorded:"", leadReturnId:"", description:"", audioSrc:"", filename:"" });
       setFile(null);
    }}
   >Cancel</button>
  )}
         </div>
         {/* Uploaded Audio Preview */}
         <div className="uploaded-audio">
          <h4 className="evidence-head">Uploaded Audio</h4>
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
              <th style={{ width: "11%" }}>Date Entered</th>
              <th style={{ width: "10%" }}>Return Id </th>
              <th>Date Audio Recorded</th>
              <th>File Name</th>
              <th>Description</th>
              <th style={{ width: "13%" }}></th>
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
                <td>{audio.dateAudioRecorded}</td>
                  <td>
                                                <a
                                    href={`${BASE_URL}/uploads/${audio.filename}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-button"
                                  >
                                    {audio.originalName}
                                  </a>
                                  </td>
                <td>{audio.description}</td>
                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => handleEditAudio(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

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
              value={audio.access}
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
            No Audio Data Available
          </td>
        </tr>
      )}
          </tbody>
        </table>
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
