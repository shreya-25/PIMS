import React, { useContext, useState, useEffect, useRef} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar';
import "./LREnclosures.css"; // Custom CSS file for Enclosures styling
import FootBar from '../../../components/FootBar/FootBar';
import axios from "axios";
import { CaseContext } from "../../CaseContext";
import Comment from "../../../components/Comment/Comment";
import api, { BASE_URL } from "../../../api";
import Attachment from "../../../components/Attachment/Attachment";
import {SideBar } from "../../../components/Sidebar/Sidebar";



export const LREnclosures = () => {
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
  const [formData, setFormData] = useState({ /* your fields */ });
  const fileInputRef = useRef();
  const [leadData, setLeadData] = useState({});

  const { leadDetails, caseDetails } = location.state || {};


  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { selectedCase, selectedLead, setSelectedLead, leadStatus, setLeadStatus } = useContext(CaseContext);  
  
      const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
              
                const onShowCaseSelector = (route) => {
                  navigate(route, { state: { caseDetails } });
              };

  // Sample enclosures data
  const [enclosures, setEnclosures] = useState([
    // { returnId:'',dateEntered: "", type: "", enclosure: "" },
    // { returnId:2, dateEntered: "12/03/2024", type: "Evidence", enclosure: "Photo Evidence" },
  ]);

  // State to manage form data
  const [enclosureData, setEnclosureData] = useState({
    returnId:'',
    type: "",
    enclosure: "",
     isLink: false,
  link: "",
  originalName: '',   // ← add this
  filename: ''   
  });

  const handleInputChange = (field, value) => {
    setEnclosureData({ ...enclosureData, [field]: value });
    console.log(`enclosureData.${field} updated to: `, value);
  };

    const [file, setFile] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [originalDesc, setOriginalDesc] = useState("");

   // Handle file selection
   const handleFileChange = (event) => {
    console.log("event.target.files:", event.target.files);
    const selected = event.target.files[0];
    console.log("selected file:", selected);
    setFile(selected);
  };
  const handleAddEnclosure = () => {
    const newEnclosure = {
      dateEntered: new Date().toLocaleDateString(),
      type: enclosureData.type,
      enclosure: enclosureData.enclosure,
      returnId: enclosureData.returnId,
    };

    console.log("New Enclosure to add:", newEnclosure);

    // Add new enclosure to the list
    setEnclosures([...enclosures, newEnclosure]);

    // Clear form fields
    setEnclosureData({
      returnId: '',
      type: "",
      enclosure: "",
    });
  };

   // Helper to get the current list for this lead+case
   const fetchEnclosuresForLead = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);

    try {
      const { data } = await api.get(
        `/api/lrenclosure/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // map date & description fields for display
      const mapped = data.map((enc) => ({
        dateEntered: new Date(enc.enteredDate).toLocaleDateString(),
        type: enc.type,
        enclosure: enc.enclosureDescription,
        returnId: enc.leadReturnId,
        originalName: enc.originalName,
        filename:      enc.filename,  
        link:        enc.link || ""
      }));

      setEnclosures(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load enclosures");
    } finally {
      setLoading(false);
    }
  };


  // Save Enclosure: Build FormData and post to backend including token from localStorage.
  // const handleSaveEnclosure = async () => {
  //   const formData = new FormData();
  //   if (file) {
  //     formData.append("file", file);
  //     console.log("file", file);
  //   }

  //   // Append other required fields
  //   formData.append("leadNo", selectedLead.leadNo); // Example value; update as needed
  //   formData.append("description", selectedLead.leadName);
  //   formData.append("enteredBy", localStorage.getItem("loggedInUser"));
  //   formData.append("caseName", selectedLead.caseName);
  //   formData.append("caseNo", selectedLead.caseNo);
  //   formData.append("leadReturnId", enclosureData.returnId); // Example value; update as needed
  //   formData.append("enteredDate", new Date().toISOString());
  //   formData.append("type", enclosureData.type);
  //   formData.append("enclosureDescription", enclosureData.enclosure);

  //   // Retrieve token from localStorage
  //   const token = localStorage.getItem("token");
  //   console.log(token);
  //   for (const [key, value] of formData.entries()) {
  //     console.log(`FormData - ${key}:`, value);
  //   }
    
  //   try {
  //     const response = await api.post(
  //       "/api/lrenclosure/upload",
  //       formData,
  //       { 
  //         headers: { 
  //           "Content-Type": undefined,   
  //           // "Content-Type": "multipart/form-data",
  //           "Authorization": `Bearer ${token}`  // Add token here
  //         } 
  //       }
  //     );
  //     console.log("Enclosure saved:", response.data);
  //     // Optionally update local state with the new enclosure
  //     setEnclosures([...enclosures, response.data.enclosure]);

  //     // Clear form fields if needed
  //     setEnclosureData({ type: "", enclosure: "" });
  //     setFile(null);
  //   } catch (error) {
  //     console.error("Error saving enclosure:", error);
  //     if (error.response) {
  //       console.error("Upload failed with status", error.response.status);
  //       console.error("Response body:", error.response.data);
  //     } else {
  //       console.error("Network or client error:", error);
  //     }
  //   }
  // };

  // const handleSaveEnclosure = async () => {
  //   if (!file) {
  //     console.warn("No file selected");
  //     return;
  //   }

  //   // build the FormData payload
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("leadNo", selectedLead.leadNo);
  //   formData.append("description", selectedLead.leadName);
  //   formData.append("enteredBy", localStorage.getItem("loggedInUser"));
  //   formData.append("caseName", selectedCase.caseName);
  //   formData.append("caseNo", selectedCase.caseNo);
  //   formData.append("leadReturnId", enclosureData.returnId);
  //   formData.append("enteredDate", new Date().toISOString());
  //   formData.append("type", enclosureData.type);
  //   formData.append("enclosureDescription", enclosureData.enclosure);

  //   const token = localStorage.getItem("token");

  //   try {
  //     await api.post(
  //       "/api/lrenclosure/upload",
  //       formData,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`, // no Content-Type here
  //         },
  //         transformRequest: [(data, headers) => {
  //           // remove JSON header so axios auto-sets multipart/form-data boundary
  //           delete headers["Content-Type"];
  //           return data;
  //         }],
  //       }
  //     );

  //     // **re-fetch** the entire list so the new one appears immediately
  //     await fetchEnclosuresForLead();

  //     // clear form & file
  //     setEnclosureData({ returnId: "", type: "", enclosure: "" });
  //     setFile(null);

  //     if (fileInputRef.current) fileInputRef.current.value = "";

  //   } catch (err) {
  //     console.error("Upload error:", err.response || err);
  //   }
  // };

  // const handleSave = async () => {
  //   // must always supply a file when creating; on update it's optional
  //   if (editIndex === null && !file) {
  //     alert("Please select a file to upload.");
  //     return;
  //   }

  //   const fd = new FormData();
  //   if (file) fd.append("file", file);
  //   fd.append("leadNo",   selectedLead.leadNo);
  //   fd.append("description", selectedLead.leadName);
  //   fd.append("enteredBy",   localStorage.getItem("loggedInUser"));
  //   fd.append("caseName",    selectedCase.caseName);
  //   fd.append("caseNo",      selectedCase.caseNo);
  //   fd.append("leadReturnId",enclosureData.returnId);
  //   fd.append("enteredDate", new Date().toISOString());
  //   fd.append("type",        enclosureData.type);
  //   fd.append("enclosureDescription", enclosureData.enclosure);

  //   const token = localStorage.getItem("token");

  //   try {
  //     if (editIndex === null) {
  //       // CREATE
  //       await api.post("/api/lrenclosure/upload", fd, {
  //         headers: { Authorization: `Bearer ${token}` },
  //         transformRequest: [(data, headers) => {
  //           delete headers["Content-Type"];
  //           return data;
  //         }]
  //       });
  //       alert("Enclosure added");
  //     } else {
  //       // UPDATE: must send to PUT /api/lrenclosure/:leadNo/:leadName/:caseNo/:caseName/:leadReturnId/:oldDesc
  //       const { leadReturnId } = enclosureData;
  //       const url = `/api/lrenclosure/${selectedLead.leadNo}/` +
  //                   `${encodeURIComponent(selectedLead.leadName)}/` +
  //                   `${selectedCase.caseNo}/` +
  //                   `${encodeURIComponent(selectedCase.caseName)}/` +
  //                   `${leadReturnId}/` +
  //                   `${encodeURIComponent(originalDesc)}`;
  //       await api.put(url, fd, {
  //         headers: { Authorization: `Bearer ${token}` },
  //         transformRequest: [(data, headers) => {
  //           delete headers["Content-Type"];
  //           return data;
  //         }]
  //       });
  //       alert("Enclosure updated");
  //     }
  //     // refresh & reset form
  //     await fetchEnclosures();
  //     setEnclosureData({ returnId:"", type:"", enclosure:"" });
  //     setFile(null);
  //     if (fileInputRef.current) fileInputRef.current.value = "";
  //     setEditIndex(null);
  //     setOriginalDesc("");
  //   } catch (err) {
  //     console.error("Save error:", err.response || err);
  //     alert("Save failed: " + (err.response?.data?.message || err.message));
  //   }
  // };

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

  const handleSave = async () => {
    // Validation: must supply a file or link when creating
    if (editIndex === null && !file && !enclosureData.isLink) {
      alert("Please select a file to upload or enter a valid link.");
      return;
    }
  
    const fd = new FormData();
  
    // Add file if not a link upload
    if (!enclosureData.isLink && file) {
      fd.append("file", file);
    }
  
    // Add common fields
    fd.append("leadNo", selectedLead.leadNo);
    fd.append("description", selectedLead.leadName);
    fd.append("enteredBy", localStorage.getItem("loggedInUser"));
    fd.append("caseName", selectedCase.caseName);
    fd.append("caseNo", selectedCase.caseNo);
    fd.append("leadReturnId", enclosureData.returnId);
    fd.append("enteredDate", new Date().toISOString());
    fd.append("type", enclosureData.type);
    fd.append("enclosureDescription", enclosureData.enclosure);
  
    // Link-related fields
    fd.append("isLink", enclosureData.isLink || false);
    if (enclosureData.isLink) {
      fd.append("link", enclosureData.link || "");
    }
  
    const token = localStorage.getItem("token");
  
    try {
      if (editIndex === null) {
        // CREATE
        await api.post("/api/lrenclosure/upload", fd, {
          headers: { Authorization: `Bearer ${token}` },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        });
        // alert("Enclosure added");
      } else {
        // UPDATE
        const { leadReturnId } = enclosureData;

        const url = `/api/lrenclosure/${selectedLead.leadNo}/` +
                    `${encodeURIComponent(selectedLead.leadName)}/` +
                    `${selectedCase.caseNo}/` +
                    `${encodeURIComponent(selectedCase.caseName)}/` +
                    `${enclosureData.returnId}/` +
                    `${encodeURIComponent(originalDesc)}`;
  
        await api.put(url, fd, {
          headers: { Authorization: `Bearer ${token}` },
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        });
        // alert("Enclosure updated");
      }
  
      // Refresh & reset form
      await fetchEnclosures();
      setEnclosureData({ returnId: "", type: "", enclosure: "", isLink: false, link: "" });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditIndex(null);
      setOriginalDesc("");
    } catch (err) {
      console.error("Save error:", err.response || err);
      alert("Save failed: " + (err.response?.data?.message || err.message));
    }
  };
  

  // start editing
  const handleEdit = idx => {
    const enc = enclosures[idx];
    setEditIndex(idx);
    setOriginalDesc(enc.enclosure);
    setEnclosureData({
      returnId: enc.returnId,
      type:     enc.type,
      enclosure:enc.enclosure,
      isLink: !!enc.link,
    link: enc.link || "",
    originalName: enc.originalName, // ← grab it here
    filename:     enc.filename 
    });
    // clear file input so user can choose new one if desired
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // delete
  const handleDelete = async idx => {
    if (!window.confirm("Delete this enclosure?")) return;
    const enc = enclosures[idx];
    const token = localStorage.getItem("token");
    try {
      const url = `/api/lrenclosure/${selectedLead.leadNo}/` +
                  `${encodeURIComponent(selectedLead.leadName)}/` +
                  `${selectedCase.caseNo}/` +
                  `${encodeURIComponent(selectedCase.caseName)}/` +
                  `${enc.returnId}/` +
                  `${encodeURIComponent(enc.enclosure)}`;
      await api.delete(url, {
        headers:{ Authorization:`Bearer ${token}` }
      });
      // remove immediately
      setEnclosures(list => list.filter((_,i)=>i!==idx));
      // alert("Deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };
  

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };

  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchEnclosures();
    }
  }, [selectedLead, selectedCase]);
  const fetchEnclosures = async () => {
    const token = localStorage.getItem("token");
  
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName); // encode to handle spaces
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);
  
    try {
      const res = await api.get(
        `/api/lrenclosure/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: {
            "Content-Type": undefined,   
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const mappedEnclosures = res.data.map((enc) => ({
        dateEntered: formatDate(enc.enteredDate),
        type: enc.type,
        enclosure: enc.enclosureDescription,
        returnId: enc.leadReturnId,
        originalName: enc.originalName,
        link: enc.link || "",
        filename: enc.filename, 
      }));

      const withAccess = mappedEnclosures.map(r => ({
        ...r,
        access: r.access ?? "Everyone"
      }));
  
      setEnclosures(withAccess);
      setLoading(false);
      setError("");
    } catch (err) {
      console.error("Error fetching enclosures:", err);
      setError("Failed to load enclosures");
      setLoading(false);
    }
  };
  
   const isCaseManager = 
    selectedCase?.role === "Case Manager" || selectedCase?.role === "Detective Supervisor";
  const handleAccessChange = (idx, newAccess) => {
    setEnclosures(rs => {
      const copy = [...rs];
      copy[idx] = { ...copy[idx], access: newAccess };
      return copy;
    });
  };


  return (
    <div className="lrenclosures-container">
      {/* Navbar */}
      <Navbar />

      {/* Top Menu */}
      {/* <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation("/LRInstruction")}>Instructions</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRReturn")}>Returns</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPerson")}>Person</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVehicle")}>Vehicles</span>
          <span className="menu-item active" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
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
          <span className="menu-item active" style={{fontWeight: '600' }}  onClick={() => handleNavigation('/LREnclosures')} >
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
                <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>
          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${selectedLead.leadStatus || leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${selectedLead?.leadStatus || leadStatus || "Unknown Status"}`}
</h5>

          </div>
     
        {/* Left Section */}
        {/* <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} // Replace with the actual path to your logo
            alt="Police Department Logo"
            className="police-logo-lr"
          />
        </div> */}

        {/* Center Section */}
        <div className="case-header">
          <h2 className="">ENCLOSURES INFORMATION</h2>
        </div>
     

      <div className = "LRI-content-section">

<div className = "content-subsection">

        {/* Enclosure Form */}
        <div className = "timeline-form-sec">
        <div className="enclosure-form">
        <div className="form-row-evidence">
            <label>Return Id *</label>
            <input
              type="returnId"
              value={enclosureData.returnId}
              onChange={(e) => handleInputChange("returnId", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label>Enclosure Type</label>
            <input
              type="text"
              value={enclosureData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
          </div>
          <div className="form-row-evidence">
            <label>Enclosure Description</label>
            <textarea
              value={enclosureData.enclosure}
              onChange={(e) => handleInputChange("enclosure", e.target.value)}
            ></textarea>
          </div>
          {/* <div className="form-row-evidence">
            <label>Upload File:</label>
          
<input
  type="file"
  name="file"               
  ref={fileInputRef}      
  onChange={handleFileChange}
/>

          </div> */}
          <div className="form-row-evidence">
  <label>Upload Type</label>
  <select
    value={enclosureData.isLink ? "link" : "file"}
    onChange={(e) =>
      setEnclosureData((prev) => ({
        ...prev,
        isLink: e.target.value === "link",
        link: "", // Reset link if switching from file
      }))
    }
  >
    <option value="file">File</option>
    <option value="link">Link</option>
  </select>
</div>
{/* {!enclosureData.isLink ? (
  <div className="form-row-evidence">
    <label>Upload File:</label>
    <input
      type="file"
      name="file"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  </div>
) : (
  <div className="form-row-evidence">
    <label>Paste Link:</label>
    <input
      type="text"
      placeholder="Enter URL (https://...)"
      value={enclosureData.link || ""}
      onChange={(e) =>
        setEnclosureData((prev) => ({ ...prev, link: e.target.value }))
      }
    />
  </div>
)} */}

{editIndex !== null && !enclosureData.isLink && enclosureData.originalName && (
  <div className="form-row-evidence">
    <label>Current File:</label>
    <span className="current-filename">
      {enclosureData.originalName}
    </span>
  </div>
)}

{!enclosureData.isLink ? (
  <div className="form-row-evidence">
    <label>{editIndex === null ? 'Upload File*' : 'Replace File (optional):'}</label>
    <input
      type="file"
      name="file"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  </div>
) : (
  <div className="form-row-evidence">
    <label>Paste Link:</label>
    <input
      type="text"
      placeholder="Enter URL (https://...)"
      value={enclosureData.link || ""}
      onChange={e =>
        setEnclosureData(prev => ({ ...prev, link: e.target.value }))
      }
    />
  </div>
)}


        </div>
        </div>
          {/* Action Buttons */}
          <div className="form-buttons">
              <button
                disabled={selectedLead?.leadStatus==="In Review" || selectedLead?.leadStatus==="Completed"}
                onClick={handleSave}
                className='save-btn1'
              >
                {editIndex === null ? "Add Enclosure" : "Save Changes"}
              </button>
              {editIndex !== null && (
                <button 
                disabled={selectedLead?.leadStatus==="In Review" || selectedLead?.leadStatus==="Completed"}
                className='save-btn1'
                onClick={() => {
                  setEditIndex(null);
                  setEnclosureData({ returnId:"", type:"", enclosure:"" });
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}>
                  Cancel
                </button>
              )}
            </div>
    

              {/* Enclosures Table */}
              <table className="leads-table">
          <thead>
            <tr>
              <th>Date Entered</th>
              <th>Return Id </th>
              <th>Type</th>
              <th>Enclosure</th>
              <th>File Name</th>
              <th></th>
              {isCaseManager && (
              <th style={{ width: "15%", fontSize: "20px" }}>Access</th>
            )}
            </tr>
          </thead>
          <tbody>
          {enclosures.length > 0 ? (
            enclosures.map((enclosure, index) => (
              <tr key={index}>
                <td>{enclosure.dateEntered}</td>
                <td>{enclosure.returnId}</td>
                <td>{enclosure.type}</td>
                <td>{enclosure.enclosure}</td>
                <td>
  {enclosure.link ? (
    <a href={enclosure.link} target="_blank" rel="noopener noreferrer" className="link-button">
      {enclosure.link}
    </a>
  ) : (
    <a
      href={`${BASE_URL}/uploads/${enclosure.filename}`}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {enclosure.originalName}
    </a>
  )}
</td>

                <td>
                  <div classname = "lr-table-btn">
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={()=>handleEdit(index)}
                />
                  </button>
                  <button disabled={selectedLead?.leadStatus === "In Review" || selectedLead?.leadStatus === "Completed"}>

                  <img
                  src={`${process.env.PUBLIC_URL}/Materials/delete.png`}
                  alt="Delete Icon"
                  className="edit-icon"
                  onClick={()=>handleDelete(index)}
                />
                  </button>
                  </div>
                </td>
              
                {isCaseManager && (
          <td>
            <select
              value={enclosure.access}
              onChange={e => handleAccessChange(index, e.target.value)}
            >
              <option value="Everyone">Everyone</option>
              <option value="Case Manager">Case Manager Only</option>
            </select>
          </td>
        )}
      </tr>
       ))) : (
        <tr>
          <td colSpan={isCaseManager ? 7 : 6} style={{ textAlign:'center' }}>
            No Enclosures Available
          </td>
        </tr>
      )}
          </tbody>
        </table>
         {/* <Attachment /> */}
                {/* <Attachment attachments={enclosures.map(e => ({
                    name: e.originalName || e.filename,
                    // Optionally include size and date if available:
                    size: e.size || "N/A",
                    date: e.enteredDate ? new Date(e.enteredDate).toLocaleString() : "N/A",
                    // Build a URL to view/download the file
                    url: `http://${BASE_URL}/uploads/${e.filename}`
                  }))} />
         */}

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
        <Comment tag= "Enclosures"/>
      </div>
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LREvidence")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};
