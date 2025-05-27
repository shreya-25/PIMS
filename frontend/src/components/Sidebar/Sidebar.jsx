import React, { useContext, useState, useEffect} from 'react';
import axios from "axios";
import "./Sidebar.css";
import { CaseContext } from "../../Pages/CaseContext";

import { CaseSelector } from "../CaseSelector/CaseSelector";
import { useLocation, useNavigate } from 'react-router-dom';
import api from "../../api";

export const SideBar = ({ leads = {}, cases = [], activePage,   activeTab,   setActiveTab, onShowCaseSelector }) => {
  const navigate = useNavigate(); 

  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
  const location = useLocation();
  const { caseDetails } = location.state || {};
  const { selectedCase, selectedLead, setSelectedLead } = useContext(CaseContext);
  const {
    assignedLeads = [],
    pendingLeads = [],
    pendingLeadReturns = [],
    allLeads = []
  } = leads;
  
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


    </div>
  );
};

