import React, { useContext, useState, useEffect} from 'react';
import axios from "axios";
import "./Sidebar.css";
import { CaseContext } from "../../Pages/CaseContext";

import { CaseSelector } from "../CaseSelector/CaseSelector";
import { useLocation, useNavigate } from 'react-router-dom';
import api from "../../api";

export const SideBar = ({ leads = {}, cases: initialCases = [],  activePage,   activeTab,   setActiveTab, onShowCaseSelector }) => {
  const navigate = useNavigate(); 

  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  const location = useLocation();
  const { caseDetails } = location.state || {};
  const { selectedCase, selectedLead, setSelectedLead , setSelectedCase} = useContext(CaseContext);
  const {
    assignedLeads = [],
    pendingLeads = [],
    pendingLeadReturns = [],
    allLeads = []
  } = leads;
  
   const signedInOfficer = localStorage.getItem("loggedInUser");
  const [caseList, setCaseList] = useState(initialCases);
  const [assignedLeadsList, setAssignedLeadsList] = useState([]);
  const [open, setOpen]               = useState(false);

  const folderIcon    = `${process.env.PUBLIC_URL}/Materials/case1.png`;
  const folderIcon1    = `${process.env.PUBLIC_URL}/Materials/case.png`;
  const homeIcon    = `${process.env.PUBLIC_URL}/Materials/home.png`;
  const logIcon    = `${process.env.PUBLIC_URL}/Materials/log2.png`;

  const isCasePage = activePage === 'CasePageManager' || activePage === 'Investigator';
 const goToCasePage = () => {
    const { role } = selectedCase;
    let dest;
        if (role === 'Investigator') {
      dest = '/Investigator';
    } else if (role === 'Case Manager' || role === 'Detective Supervisor') {
      // both Case Manager and DS land on the same manager page
      dest = '/CasePageManager';
    } else {
      // fallback
      dest = '/HomePage';
    }
    navigate(dest, { state: { caseDetails: selectedCase } });
  };


  // helper array for dropdown items
  const caseTabs = [
    ['assignedLeads',       'Assigned Leads',            assignedLeads.length],
    ['pendingLeads',        'Accepted Leads',            pendingLeads.length],
    ['pendingLeadReturns',  'Lead Returns for Review',   pendingLeadReturns.length],
    ['allLeads',            'All Leads',                 allLeads.length],
  ];

  const leadTabs = [
    ['assignedLeads',       'Assigned Leads',            assignedLeads.length],
    ['pendingLeads',        'Pending Leads',            pendingLeads.length],
    ['pendingLeadReturns',  'Lead Returns In Review',   pendingLeadReturns.length],
    ['allLeads',            'All Leads',                 allLeads.length],
  ];

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}` },
          params: { officerName: signedInOfficer }
        });

        const ongoing = data
          .filter(c =>
            c.caseStatus === "Ongoing" &&
            c.assignedOfficers.some(o => o.name === signedInOfficer)
          )
          .map(c => ({
            id: c.caseNo,
            title: c.caseName,
            role: c.assignedOfficers.find(o => o.name === signedInOfficer)?.role || "Unknown"
          }));

        setCaseList(ongoing);
      } catch (err) {
        console.error("Error fetching cases", err);
      }
    };
    fetchCases();
  }, [signedInOfficer]);

  // 2) Fetch all leads assigned to this officer — then filter by those same ongoing cases
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/lead/assignedTo-leads", {
          headers: { Authorization: `Bearer ${token}` }
        });

        // only keep leads in our ongoing cases
        const caseNos = new Set(caseList.map(c => c.id));
      const filtered = data
        .filter(l =>
          caseNos.has(l.caseNo) &&
          l.leadStatus === "Assigned" &&
          l.assignedTo.some(a => a.username === signedInOfficer)
        )
        .map(l => ({
          id: l.leadNo,
          description: l.description,
          caseNo: l.caseNo,
          assignedTo: l.assignedTo,  // we’ll need this if you want to drill in
          leadStatus: l.leadStatus
        }));

      setAssignedLeadsList(filtered);
      } catch (err) {
        console.error("Error fetching assigned leads", err);
      }
    };

    if (caseList.length) fetchLeads();
  }, [signedInOfficer, caseList]);

   const leadsByCase = assignedLeadsList.reduce((acc, lead) => {
    (acc[lead.caseNo] ||= []).push(lead);
    return acc;
  }, {});

  // when you click a case header
  const handleCaseSelect = (c) => {
    setSelectedCase({
      caseNo: c.id,
      caseName: c.title,
      role: c.role,
    });
    // go to that case’s page
    const dest = c.role === 'Investigator'
      ? '/Investigator'
      : '/CasePageManager';
    navigate(dest, { state: { caseDetails: c } });
  };

  // when you click one of the nested leads
  const handleLeadSelect = (lead) => {
    setSelectedLead(lead);
    // navigate to whatever lead‐details page you have
    navigate('/LeadReview', { state: { caseDetails: selectedCase, leadDetails: lead } });
  };


  return (
    <div className="sideitem">
    
        
    <li className={`sidebar-item ${activePage === 'HomePage' ? 'active' : ''}`} onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >
    <img src={homeIcon} className="sidebar-icon" alt="" />
      PIMS Home</li>
{/*     
    {isCasePage ? (
        <>
       
          <li
  className={`sidebar-item ${['CasePageManager','Investigator'].includes(activePage) ? 'active' : ''}`}
  onClick={() => setLeadDropdownOpen(o => !o)}
>
  Case Page {leadDropdownOpen ? '▲' : '▼'}
</li>

        
          {leadDropdownOpen && (
          <ul className="dropdown-list1">
          {activePage === "CasePageManager"
            ? caseTabs.map(([tab, label, count]) => (
                <li
                  key={tab}
                  className={`sidebar-item ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  <div className="sidebar-content">
                    <span className="sidebar-text">{label}</span>
                    <span className="sidebar-number">{count}</span>
                  </div>
                </li>
              ))
            : leadTabs.map(([tab, label, count]) => (
                <li
                  key={tab}
                  className={`sidebar-item ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  <div className="sidebar-content">
                    <span className="sidebar-text">{label}</span>
                    <span className="sidebar-number">{count}</span>
                  </div>
                </li>
              ))}
        </ul>
          )}
        </>
      ) : (
      
        <li
          className="sidebar-item"
          onClick={goToCasePage}
        >
          Case Page
        </li>
      )} */}

<li className={`sidebar-item ${['CasePageManager','Investigator'].includes(activePage) ? 'active' : ''}`}
          onClick={goToCasePage}
        >
          <img src={folderIcon} className="sidebar-icon" alt="" />
          Case: {selectedCase.caseNo}
        </li>


    <li  style={{ paddingLeft: '30px' }}  className={`sidebar-item ${activePage === 'LeadLog' ? 'active' : ''}`} onClick={() =>navigate("/LeadLog", { state: { caseDetails } } )}>
    <img src={logIcon} className="sidebar-icon" alt="" />

              Lead Log
            </li>
    <li style={{ paddingLeft: '30px' }}  className={`sidebar-item ${activePage === 'LeadsDesk' ? 'active' : ''}`}
            onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )}
             > <img src={folderIcon1} className="sidebar-icon" alt="" />
              Leads Desk</li>


  {/* Toggle Cases dropdown */}
      {/* Toggle Cases dropdown */}
{/* 1) Toggle button */}
<li
  className="sidebar-item"
  onClick={() => setCaseDropdownOpen(o => !o)}
>
  <img src={folderIcon} className="sidebar-icon" alt="" /> My Ongoing Cases {caseDropdownOpen ? '▲' : '▼'}
</li>

{/* 2) Dropdown list as a sibling, not inside the <li> */}
{/* 2) Dropdown list as a sibling */}
{caseDropdownOpen && (
  <ul className="dropdown-list1">
    {caseList.map(c => {
      const myLeads = leadsByCase[c.id] || [];
      const count   = myLeads.length;
      const isActive = selectedCase.caseNo === c.id;

      return (
        <li
          key={c.id}
          className={`sidebar-item ${isActive ? ' active' : ''}`}
        >
          <div
            className="case-headerSB"
            onClick={() => handleCaseSelect(c)}
          >
            {/* Case title */}
            Case: {c.id}
            {/* Lead count badge */}
            <span className="sidebar-number">{count}</span>
          </div>

          {/* nested leads */}
         {/* {count > 0 && (
            <ul className="nested-list">
              {myLeads.map(lead => {
                const leadActive =
                  isActive && selectedCase.leadId === lead.id;
                return (
                  <li
                    key={lead.id}
                    className={`sidebar-item lead-item${leadActive ? ' active' : ''}`}
                    onClick={() => handleLeadSelect(lead)}
                  >
                    Lead {lead.id}: {lead.description}
                  </li>
                );
              })}
            </ul> */}
            
        
        </li>
      );
    })}
  </ul>
)}




    </div>

    
  );
};

