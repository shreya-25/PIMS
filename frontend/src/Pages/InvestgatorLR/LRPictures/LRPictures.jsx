import Navbar from "../../../components/Navbar/Navbar";
import "./LRPictures.css";
import FootBar from '../../../components/FootBar/FootBar';
import Comment from "../../../components/Comment/Comment";
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import React, { useContext, useState, useEffect, useRef} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";



export const LRPictures = () => {
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
  const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);
  const [file, setFile] = useState(null);
const [leadData, setLeadData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
const [editingIndex, setEditingIndex] = useState(null);
 const fileInputRef = useRef();

  
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
  
   const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

  // Default pictures data
  const [pictures, setPictures] = useState([
    // {
    //   dateEntered: "2024-12-01",
    //   returnId:1,
    //   datePictureTaken: "2024-11-25",
    //   description: "Picture of the crime scene from Main Street.",
    //   image: "/Materials/pict1.jpeg", // Path to your default image
    // },
    // {
    //   dateEntered: "2024-12-02",
    //   returnId:1,
    //   datePictureTaken: "2024-11-26",
    //   description: "Vehicle involved in the robbery.",
    //   image: "/Materials/pict2.jpg", // Path to your default image
    // },
    // {
    //   dateEntered: "2024-12-03",
    //   returnId:2,
    //   datePictureTaken: "2024-11-27",
    //   description: "Evidence collected at the crime location.",
    //   image: "/Materials/pict3.jpg", // Path to your default image
    // },
  ]);

  // State to manage form data
  const [pictureData, setPictureData] = useState({
    datePictureTaken: "",
    description: "",
    image: "",
    leadReturnId: "",
    filename: "" 
  });

  const handleInputChange = (field, value) => {
    setPictureData({ ...pictureData, [field]: value });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPictureData({ ...pictureData, image: URL.createObjectURL(selectedFile), filename: selectedFile.name }); // for preview
    }
  };

  // populate the form to edit a picture
  const handleEditPicture = idx => {
    const pic = pictures[idx];
    setPictureData({
      datePictureTaken: new Date(pic.rawDatePictureTaken).toISOString().slice(0,10),
      leadReturnId:     pic.returnId,
      description:      pic.description,
      image:            pic.image,
      filename:         pic.filename,
      link:             pic.link || "",
      isLink:           !!pic.link
    });
    setIsEditing(true);
    setEditingIndex(idx);
    setFile(null);
  };

// delete a picture
const handleDeletePicture = async idx => {
  if (!window.confirm("Delete this picture?")) return;
  const pic = pictures[idx];
  const token = localStorage.getItem("token");
  await api.delete(
    `/api/lrpicture/${selectedLead.leadNo}/` +
    `${encodeURIComponent(selectedLead.leadName)}/` +
    `${selectedCase.caseNo}/` +
    `${encodeURIComponent(selectedCase.caseName)}/` +
    `${pic.returnId}/` +
    `${encodeURIComponent(pic.description)}`,
    { headers:{ Authorization:`Bearer ${token}` } }
  );
  setPictures(ps => ps.filter((_, i) => i !== idx));
};
const handleAddPicture = async () => {
  // 1️⃣ Validation: require date, description, and either a file or a link
  if (
    !pictureData.datePictureTaken ||
    !pictureData.description ||
    (!pictureData.isLink && !file) ||
    (pictureData.isLink && !pictureData.link.trim())
  ) {
    alert("Please fill in all required fields and select a file or enter a valid link.");
    return;
  }

  // 2️⃣ Build FormData
  const fd = new FormData();
  if (!pictureData.isLink) {
    fd.append("file", file);
  }
  fd.append("leadNo", selectedLead.leadNo);
  fd.append("description", selectedLead.leadName);
  fd.append("enteredBy", localStorage.getItem("loggedInUser"));
  fd.append("caseName", selectedCase.caseName);
  fd.append("caseNo", selectedCase.caseNo);
  fd.append("leadReturnId", pictureData.leadReturnId || "");
  fd.append("enteredDate", new Date().toISOString());
  fd.append("datePictureTaken", pictureData.datePictureTaken);
  fd.append("pictureDescription", pictureData.description);

  // 3️⃣ Link fields
  fd.append("isLink", pictureData.isLink);
  if (pictureData.isLink) {
    fd.append("link", pictureData.link.trim());
  }

  // 4️⃣ Send to server
  try {
    const token = localStorage.getItem("token");
    await api.post("/api/lrpicture/upload", fd, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      transformRequest: [(data, headers) => {
        delete headers["Content-Type"];
        return data;
      }]
    });

    // 5️⃣ Refresh list & reset form
    await fetchPictures();
    setPictureData({
      datePictureTaken: "",
      leadReturnId:     "",
      description:      "",
      isLink:           false,
      link:             "",
      originalName:     "",
      filename:         ""
    });
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  } catch (err) {
    console.error("Error uploading picture:", err);
    alert("Failed to save picture. See console for details.");
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

   const handleSubmitReport = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!selectedLead || !selectedCase) {
        alert("No lead or case selected!");
        return;
      }

      const body = {
        leadNo: selectedLead.leadNo,
        description: selectedLead.leadName,
        caseNo: selectedCase.caseNo,
        caseName: selectedCase.caseName,
        submittedDate: new Date(),
        assignedTo: {
          assignees: leadData.assignedTo || [],
          lRStatus: "Submitted"
        },
        assignedBy: {
          assignee: localStorage.getItem("officerName") || "Unknown Officer",
          lRStatus: "Pending"
        }
      };

      const response = await api.post("/api/leadReturn/create", body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 201) {
        const statusResponse = await api.put(
          "/api/lead/status/in-review",
          {
            leadNo: selectedLead.leadNo,
            description: selectedLead.leadName,
            caseNo: selectedCase.caseNo,
            caseName: selectedCase.caseName
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (statusResponse.status === 200) {
          setLeadStatus("In Review");

            setSelectedLead(prev => ({
            ...prev,
            leadStatus: "In Review"
          }));
          
          alert("Lead Return submitted and status set to 'In Review'");
        const manager    = leadData.assignedBy;                  // string username
        const investigators = (leadData.assignedTo || []).map(a => a.username);
        if (manager) {
          const payload = {
            notificationId: Date.now().toString(),
            assignedBy:     localStorage.getItem("loggedInUser"),
            assignedTo:     [{ username: manager, status: "pending" }],
            action1:        "submitted a lead return for review",
            post1:          `${selectedLead.leadNo}: ${selectedLead.leadName}`,
            caseNo:         selectedCase.caseNo,
            caseName:       selectedCase.caseName,
            leadNo:         selectedLead.leadNo,
            leadName:       selectedLead.leadName,
            type:           "Lead"
          };
          await api.post("/api/notifications", payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        alert("Lead Return submitted and Case Manager notified.");
        } else {
          alert("Lead Return submitted but status update failed.");
        }
      } else {
        alert("Failed to submit Lead Return");
      }
    } catch (error) {
      console.error("Error during Lead Return submission or status update:", error);
      alert("Something went wrong while submitting the report.");
    }
  };

const handleUpdatePicture = async () => {
  const pic = pictures[editingIndex];

  // 1️⃣ Validation for link-mode
  if (pictureData.isLink && !pictureData.link.trim()) {
    alert("Please enter a valid link.");
    return;
  }

  // 2️⃣ Build FormData
  const fd = new FormData();
  // only include a new file if user replaced it
  if (!pictureData.isLink && file) {
    fd.append("file", file);
  }

  // ● Required by your mongoose schema
  fd.append("leadReturnId", pictureData.leadReturnId);

  // ● All the rest of your fields
  fd.append("datePictureTaken", pictureData.datePictureTaken);
  fd.append("pictureDescription", pictureData.description);
  fd.append("enteredBy", localStorage.getItem("loggedInUser"));
  fd.append("isLink", pictureData.isLink);
  if (pictureData.isLink) {
    fd.append("link", pictureData.link.trim());
  }

  try {
    const token = localStorage.getItem("token");
    await api.put(
      `/api/lrpicture/` +
        `${selectedLead.leadNo}/` +
        `${encodeURIComponent(selectedLead.leadName)}/` +
        `${selectedCase.caseNo}/` +
        `${encodeURIComponent(selectedCase.caseName)}/` +
        `${pic.returnId}/` +
        `${encodeURIComponent(pic.description)}`,
      fd,
      {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: [(data, headers) => {
          delete headers["Content-Type"];
          return data;
        }]
      }
    );

    // Refresh & reset
    await fetchPictures();
    setIsEditing(false);
    setEditingIndex(null);
    setPictureData({
      datePictureTaken: "",
      leadReturnId:     "",
      description:      "",
      isLink:           false,
      link:             "",
      originalName:     "",
      filename:         ""
    });
    setFile(null);
  } catch (err) {
    console.error("Error updating LRPicture:", err);
    alert("Failed to update picture. See console for details.");
  }
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
      fetchPictures();
    }
  }, [selectedLead, selectedCase]);
  
  const fetchPictures = async () => {
    const token = localStorage.getItem("token");
  
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);
  
    try {
      const res = await api.get(
        `/api/lrpicture/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            "Content-Type": undefined,  
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const mappedPictures = res.data.map((pic) => ({
        dateEntered: formatDate(pic.enteredDate),
        rawEnteredDate:  pic.enteredDate, 
        returnId: pic.leadReturnId,
        datePictureTaken: formatDate(pic.datePictureTaken),
        rawDatePictureTaken: pic.datePictureTaken,
        filename: pic.filename,
  originalName: pic.originalName,
        description: pic.pictureDescription,
          image: `${BASE_URL}/uploads/${pic.filename}`,
          filename: pic.filename,
          link: pic.link || ""
      }));
      const withAccess = mappedPictures.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
  
      setPictures(withAccess);
    } catch (error) {
      console.error("Error fetching pictures:", error);
    }
  };

    const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";
  // handler to change access per row
const handleAccessChange = (idx, newAccess) => {
  setPictures(rs => {
    const copy = [...rs];
    copy[idx] = { ...copy[idx], access: newAccess };
    return copy;
  });
};

  return (
    <div className="lrpictures-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      {/* <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideos")}>Videos</span>
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
                    alert("Please select a case and lead first.");
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
                <div className="top-menu" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Returns
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
          <span className="menu-item " style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LRPictures')} >
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
                <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>

          </div>
                  

        {/* Center Section */}
        <div className="case-header">
          <h2 className="">PICTURES INFORMATION</h2>
        </div>

        <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Picture Form */}
        <div className = "timeline-form-sec">
        <h4 className="evidence-form-h4">Enter Picture Details</h4>
        <div className="picture-form">
          <div className="form-row-pic">
            <label  className="evidence-head">Date Picture Taken*</label>
            <input
              type="date"
              value={pictureData.datePictureTaken}
               className="evidence-head"
              onChange={(e) => handleInputChange("datePictureTaken", e.target.value)}
            />
          </div>
          <div className="form-row-pic">
            <label  className="evidence-head">Return Id*</label>
            <input
              type="leadReturnId"
              value={pictureData.leadReturnId}
               className="evidence-head"
              onChange={(e) => handleInputChange("leadReturnId", e.target.value)}
            />
          </div>
          <div className="form-row-pic">
            <label  className="evidence-head">Description</label>
            <textarea
              value={pictureData.description}
               className="evidence-head"
              onChange={(e) => handleInputChange("description", e.target.value)}
            ></textarea>
          </div>
        {/* … above your “Upload Image” row … */}
<div className="form-row-pic">
  <label>Upload Type</label>
  <select
    value={pictureData.isLink ? "link" : "file"}
    onChange={e =>
      setPictureData(prev => ({
        ...prev,
        isLink: e.target.value === "link",
        link:   ""            // reset link when switching back
      }))
    }
  >
    <option value="file">File</option>
    <option value="link">Link</option>
  </select>
</div>

{/* If editing a file‐upload entry, show current filename */}
{isEditing && !pictureData.isLink && pictureData.originalName && (
  <div className="form-row-pic">
    <label>Current File:</label>
    <span className="current-filename">{pictureData.originalName}</span>
  </div>
)}

{/* File vs Link input */}
{!pictureData.isLink ? (
  <div className="form-row-pic">
    <label>{isEditing ? "Replace Image (optional)" : "Upload Image*"}</label>
    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  </div>
) : (
  <div className="form-row-pic">
    <label>Paste Link*:</label>
    <input
      type="text"
      placeholder="https://..."
      value={pictureData.link}
      onChange={e =>
        setPictureData(prev => ({ ...prev, link: e.target.value }))
      }
    />
  </div>
)}

        </div>
        <div className="form-buttons">
        <div className="form-buttons">
  <button
    disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}
    className="save-btn1"
    onClick={isEditing ? handleUpdatePicture : handleAddPicture}
  >
    {isEditing ? "Update Picture" : "Add Picture"}
  </button>

  {isEditing && (
    <button
      disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}
      className="save-btn1"
      onClick={() => {
        // Cancel editing & reset form
        setIsEditing(false);
        setEditingIndex(null);
        setPictureData({
          datePictureTaken: "",
          leadReturnId:     "",
          description:      "",
          image:            "",
          filename:         "",
          link:             "",
          isLink:           false
        });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }}
    >
      Cancel
    </button>
  )}
</div>

        </div>
        {/* Uploaded Pictures Preview */}
        <div className="uploaded-pictures">
          <h4 className="evidence-head">Uploaded Pictures</h4>
          <div className="pictures-gallery">
            {pictures.map((picture, index) => (
              <div key={index} className="picture-card">
                <img src={picture.image} alt={`Uploaded ${index + 1}`} className="uploaded-image" />
                <p className="evidence-head">{picture.description}</p>
              </div>
            ))}
          </div>
        </div>
        </div>


           {/* Pictures Table */}
           <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Return Id </th>
              <th>Date Picture Taken</th>
              <th>File Name</th>
              <th>Description</th>
              <th></th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
            {pictures.length > 0 ? pictures.map((picture, index) => (
              <tr key={index}>
                <td>{picture.dateEntered}</td>
                <td>{picture.returnId}</td>
                <td>{picture.datePictureTaken}</td>
                <td>
  {picture.link ? (
    // if it was saved as a URL
    <a
      href={picture.link}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {picture.link}
    </a>
  ) : (
    // otherwise it’s a file on your server
    <a
      href={`${BASE_URL}/uploads/${picture.filename}`}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {picture.originalName}
    </a>
  )}
</td>

                <td>{picture.description}</td>
                <td>
        <button
          disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}
          onClick={() => handleEditPicture(index)}
        >
          <img src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
               alt="Edit" className="edit-icon" />
        </button>
        <button
          disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}
          onClick={() => handleDeletePicture(index)}
        >
          <img src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
               alt="Delete" className="edit-icon" />
        </button>
      </td>
                {isCaseManager && (
          <td>
            <select
              value={picture.access}
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
            No Pictures Available
          </td>
        </tr>
      )}
          </tbody>
        </table>
               {selectedLead?.leadStatus !== "Completed" && !isCaseManager && (
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
)}

        <Comment tag= "Pictures"/>
       </div>
    </div>
    
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRAudio")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
