import React, { useContext, useState, useEffect} from 'react';
import Navbar from "../../components/Navbar/Navbar";
import "./CaseScratchpad.css";
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";
import api from "../../api"; // adjust the path as needed
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";
import {SideBar } from "../../components/Sidebar/Sidebar";

export const CaseScratchpad = () => {

  const navigate = useNavigate(); 

  const location = useLocation();

    const { caseDetails } = location.state || {};
      const { selectedCase, setSelectedLead } = useContext(CaseContext);
  const [entries, setEntries] = useState([
    { id: 1, date: "2024-12-01", notes: "Initial details of the case." },
    { id: 2, date: "2024-12-02", notes: "Follow-up notes." },
  ]);

  const [newEntry, setNewEntry] = useState({
    date: "",
    notes: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
   const [pendingRoute, setPendingRoute]   = useState(null);
     const [showSelectModal, setShowSelectModal] = useState(false);

  const handleInputChange = (field, value) => {
    setNewEntry({ ...newEntry, [field]: value });
  };

  const handleAddOrUpdateEntry = () => {
    if (!newEntry.date || !newEntry.notes) {
      alert("Please fill in all fields!");
      return;
    }

    if (editMode) {
      setEntries(
        entries.map((entry) =>
          entry.id === editId ? { ...entry, ...newEntry } : entry
        )
      );
      setEditMode(false);
      setEditId(null);
    } else {
      const entry = {
        id: entries.length + 1,
        ...newEntry,
      };
      setEntries([...entries, entry]);
    }

    setNewEntry({ date: "", notes: "" });
  };

  const handleSelectLead = (lead) => {
    setSelectedLead({
      leadNo: lead.leadNo,
      leadName: lead.description,
      caseName: lead.caseName,
      caseNo: lead.caseNo,
    });
  
    setShowSelectModal(false);
    navigate(pendingRoute, {
      state: {
        caseDetails: selectedCase,
        leadDetails: lead
      }
    });
    
    setPendingRoute(null);
  };
  

  const handleDeleteEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  };

  const handleEditEntry = (entry) => {
    setNewEntry({ date: entry.date, notes: entry.notes });
    setEditMode(true);
    setEditId(entry.id);
  };

    // Function to format dates as MM/DD/YY
  const formatDate = (dateString) => {
    if (!dateString) return ""; // Handle empty dates
    const date = new Date(dateString);
    if (isNaN(date)) return ""; // Handle invalid dates
  
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year
  
    return `${month}/${day}/${year}`;
  };
  
  
    const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  
    const onShowCaseSelector = (route) => {
      navigate(route, { state: { caseDetails } });
  };
    
    const [leads, setLeads] = useState({
            assignedLeads: [],
            pendingLeads: [],
            pendingLeadReturns: [],
            allLeads: [],
          } );
          useEffect(() => {
            const fetchAllLeads = async () => {
              if (!selectedCase?.caseNo || !selectedCase?.caseName) return;
          
              try {
                const token = localStorage.getItem("token");
                const resp = await api.get(
                  `/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
          
                // assume resp.data is an array
                let leadsArray = Array.isArray(resp.data) ? resp.data : [];
          
                // if user is _not_ a Case Manager, strip out CM-only leads:
                if (selectedCase.role !== "Case Manager") {
                  leadsArray = leadsArray.filter(
                    (l) => l.accessLevel !== "Only Case Manager and Assignees"
                  );
                }
          
                setLeads((prev) => ({
                  ...prev,
                  allLeads: leadsArray.map((lead) => ({
                    leadNo: lead.leadNo,
                    description: lead.description,
                    leadStatus: lead.leadStatus,
                    // any other fields you need...
                  })),
                }));
              } catch (err) {
                console.error("Error fetching all leads:", err);
              }
            };
          
            fetchAllLeads();
          }, [selectedCase])

  return (
    <div className="scratchpad-container">
      <Navbar />


      <div className="main-container">
            {/* Sidebar */}
            {/* <div className="sideitem">
                    <ul className="sidebar-list">
                    
                    <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>
                    <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>        
            <li className="sidebar-item" onClick={() => navigate('/CasePageManager')}>Case Page</li>            
            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item" 
             onClick={() => {
              selectedCase.role === "Investigator"
              ? setPendingRoute("/LRInstruction")
              : setPendingRoute("/CMInstruction")
             
              setShowSelectModal(true);
            }}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
          
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item active" onClick={() => navigate("/CaseScratchpad")}>
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
 <li
 className="sidebar-item"
 onClick={() => {
   setPendingRoute("/ChainOfCustody", { state: { caseDetails } });
   setShowSelectModal(true);
 }}
>    View Lead Chain of Custody
  </li> )}
  </ul>)}
       

                    </ul>

                    {showSelectModal && (
      <SelectLeadModal
        leads={leads.allLeads}
        onSelect={handleSelectLead}
        onClose={() => setShowSelectModal(false)}
      />
    )}
                </div> */}
                 <SideBar activePage="LeadsDesk" />
   

        <div className="left-content">

        <div className="case-header">
          {/* <h2 className="">ALL NOTES</h2> */}
          <h2 className="">WEBPAGE UNDER CONSTRUCTION</h2>
        </div>

      {/* <main className="scratchpad-main">
  
        <div className="entries-list">
          {entries.map((entry) => (
            <div key={entry.id} className="entry-item">
              <span className="entry-text">
                <strong>Date Entered:</strong> {entry.date} | <strong>Notes:</strong>{" "}
                {entry.notes}
              </span>
              <div className="entry-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEditEntry(entry)}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteEntry(entry.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="scratchpad-content">
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Entered Date:</label>
              <input
                className="input-field"
                type="date"
                value={newEntry.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
              <label className="input-label">Notes:</label>
              <textarea
                className="textarea-field"
                placeholder="Enter your notes here..."
                value={newEntry.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="button-group">
            <button className="btn btn-save" onClick={handleAddOrUpdateEntry}>
              {editMode ? "Update" : "Save"}
            </button>
            <button
              className="btn btn-cancel"
              onClick={() => setNewEntry({ date: "", notes: "" })}
            >
              Cancel
            </button>
          </div>

        </div>
      </main> */}
    </div>

    </div>
      </div>
  );
};
