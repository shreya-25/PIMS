import React, { useContext, useState, useEffect} from 'react';
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { CaseContext } from "../CaseContext";
import api from "../../api"; // adjust the path as needed
import SelectLeadModal from "../../components/SelectLeadModal/SelectLeadModal";

export const ChainOfCustody = () => {
  

  const navigate = useNavigate(); 
 
   const location = useLocation();
 
     const { caseDetails } = location.state || {};
       const { selectedCase, setSelectedLead , selectedLead, leadStatus, setLeadStatus} = useContext(CaseContext);

       const onShowCaseSelector = (route) => {
        navigate(route, { state: { caseDetails } });
    };
       const [showSelectModal, setShowSelectModal] = useState(false);
            const [pendingRoute, setPendingRoute]   = useState(null);
                  const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                  const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);

       const [leads, setLeads] = useState({
                assignedLeads: [],
                pendingLeads: [],
                pendingLeadReturns: [],
                allLeads: [],
              } );

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  const [logEntries, setLogEntries] = useState([
    {
      date: "2024-01-01T09:00:00",
      action: "Submitted Return",
      officer: "Officer 1",
    },
    {
      date: "2024-01-01T10:15:00",
      action: "Added Lead Instruction",
      officer: "Officer 2",
    },
    {
      date: "2024-01-01T11:30:00",
      action: "Added Return",
      officer: "Officer 3",
    },
    {
      date: "2024-01-01T12:45:00",
      action: "Edited Enclosures",
      officer: "Officer 4",
    },
    {
      date: "2024-01-01T14:00:00",
      action: "View Enclosures",
      officer: "Officer 5",
    },
    {
      date: "2024-01-01T15:15:00",
      action: "Edited Enclosures",
      officer: "Officer 6",
    },
  ]);

  const confirmAndNavigate = (route, caseNo) => {
    if (window.confirm(`Do you really want to edit Case No: ${caseNo}?`)) {
      handleNavigation(route);
    }
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

  // const fetchLogs = async () => {
  //   if (!selectedLead?.leadNo) return;
  //   try {
  //     const { data } = await api.get(
  //       `/api/logs/${selectedCase.caseNo}/${selectedLead.leadNo}`
  //     );
  //     setLogEntries(
  //       data.map((e: any) => ({
  //         date:    e.timestamp,
  //         officer: e.officer,
  //         action:  e.action,
  //       }))
  //     );
  //   } catch (err) {
  //     console.error("Failed to fetch logs:", err);
  //   }
  // };

  // // 2️⃣ Post an action to the audit-trail and optimistically update UI
  // const logAction = async (action: string) => {
  //   if (!selectedLead?.leadNo) return;
  //   const officer = localStorage.getItem("loggedInUser") || "Unknown";
  //   try {
  //     await api.post("/api/logs", {
  //       caseNo:    selectedCase.caseNo,
  //       leadNo:    selectedLead.leadNo,
  //       action,
  //       officer,
  //     });
  //     setLogEntries((prev) => [
  //       ...prev,
  //       { date: new Date().toISOString(), action, officer },
  //     ]);
  //   } catch (err) {
  //     console.error("Failed to log action:", err);
  //     // you might still want to append locally even on error:
  //     setLogEntries((prev) => [
  //       ...prev,
  //       { date: new Date().toISOString(), action, officer },
  //     ]);
  //   }
  // };

  // // 3️⃣ Whenever the selectedLead changes, reload its history
  // useEffect(() => {
  //   fetchLogs();
  // }, [selectedLead]);


  return (
    <div className="admin-container">
      <Navbar />

      <div className="main-container">
          
      <SideBar  activePage="CasePageManager" />

      <div className="left-content">

        <div className="top-menu">
        <div className="menu-items">
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
          <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LRInstruction", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                    alert("Please select a case and lead first.");
                  }
                }}>Add/View Lead Return</span>
          <span className="menu-item active" onClick={() => {
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
      </div>
   
      <div className="caseandleadinfo">
          <h5 className = "side-title">  Case:{selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"} | {selectedCase.role || ""}</h5>

          <h5 className="side-title">
  {selectedLead?.leadNo
    ? `Lead: ${selectedLead.leadNo} | ${selectedLead.leadName} | ${ leadStatus || "Unknown Status"}`
    : `LEAD DETAILS | ${ leadStatus || "Unknown Status"}`}
</h5>

          </div>

          <div className="case-header">
            {/* <h1>LEAD:{selectedLead.leadNo} | {selectedLead.leadName.toUpperCase()}</h1> */}
            <h1>
  {selectedLead?.leadNo ? `LEAD: ${selectedLead.leadNo} | ${selectedLead.leadName?.toUpperCase()}` : "LEAD DETAILS"}
</h1>

          </div>

             {/* Main Table */}
        <div className="table-container1">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Officer</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
            {logEntries.map((entry, index) => (
          <tr key={index}>
            <td>{new Date(entry.date).toLocaleString()}</td>
            <td>{entry.officer}</td>
            <td>{entry.action}</td>
          </tr>
        ))}
            </tbody>
          </table>
        </div>
     </div>
    </div>
    </div>
  );
};
