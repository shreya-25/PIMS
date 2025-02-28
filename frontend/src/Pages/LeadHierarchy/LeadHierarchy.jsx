import React, { useState, useEffect, useRef } from "react";
import "./LeadHierarchy.css";
import Navbar from '../../components/Navbar/Navbar';


const LeadHierarchy = () => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [disabledLeads, setDisabledLeads] = useState([]);
  const containerRef = useRef(null);
  const [positions, setPositions] = useState({});

  const leads = [
    { id: 1, parent: null, description: "Origin Lead 1", results: "Lead 1 Results" },
    { id: 2, parent: 1, description: "Lead 2 Description", results: "Lead 2 Results" },
    { id: 3, parent: 1, description: "Lead 3 Description", results: "Lead 3 Results" },
    { id: 4, parent: 2, description: "Lead 4 Description", results: "Lead 4 Results" },
    { id: 5, parent: 2, description: "Lead 5 Description", results: "Lead 5 Results" },
    { id: 6, parent: 3, description: "Lead 6 Description", results: "Lead 6 Results" },
    { id: 10, parent: 3, description: "Lead 10 Description", results: "Lead 10 Results" },
    { id: 11, parent: 10, description: "Lead 11 Description", results: "Lead 11 Results" },
    { id: 7, parent: 5, description: "Lead 7 Description", results: "Lead 7 Results" },
    { id: 8, parent: 6, description: "Lead 8 Description", results: "Lead 8 Results" },
    { id: 9, parent: 6, description: "Lead 9 Description", results: "Lead 9 Results" },
  ];

  // Recursive function to get all child leads
  const getAllChildLeads = (parentId) => {
    let childLeads = leads.filter((lead) => lead.parent === parentId);
    let allChildLeads = [...childLeads];

    // Recursively get descendants
    childLeads.forEach((lead) => {
      allChildLeads = [...allChildLeads, ...getAllChildLeads(lead.id)];
    });

    return allChildLeads.map((lead) => lead.id);
  };

  const toggleDisableLead = (leadId) => {
    // Get all child leads recursively
    const getAllChildLeads = (id) => {
      const children = leads.filter((lead) => lead.parent === id);
      return children.reduce(
        (acc, lead) => [...acc, lead, ...getAllChildLeads(lead.id)],
        []
      );
    };
  
    const allChildLeads = getAllChildLeads(leadId).map((lead) => lead.id);
  
    // Toggle disablement for lead and all descendants
    setDisabledLeads((prevDisabledLeads) => {
      const isCurrentlyDisabled = prevDisabledLeads.includes(leadId);
  
      if (isCurrentlyDisabled) {
        // Enable the lead and all descendants
        return prevDisabledLeads.filter((id) => ![leadId, ...allChildLeads].includes(id));
      } else {
        // Disable the lead and all descendants
        return [...prevDisabledLeads, leadId, ...allChildLeads];
      }
    });
  };
  

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
  };

  const closeSidebar = () => {
    setSelectedLead(null);
  };

  const isLeadDisabled = (leadId) => {
    return disabledLeads.includes(leadId);
  };

  const renderHierarchy = (parentId) => {
    const childLeads = leads.filter((lead) => lead.parent === parentId);
    
    return childLeads.map((lead) => (
      <div
        key={lead.id}
        className={`lead-node ${isLeadDisabled(lead.id) ? "disabled" : ""}`}
        onClick={(e) => {
          e.stopPropagation();  // Prevent parent click triggering
          handleLeadClick(lead);  // Select the correct lead
        }}
      >
        <div className="lead">Lead {lead.id}</div>
        <div className="children">
          {isLeadDisabled(lead.id) ? null : renderHierarchy(lead.id)}
        </div>
      </div>
    ));
  };
  
  

  return (
    <div className="lead-log-container" ref={containerRef}>
      <Navbar />
      <div className="hierarchy-container">
        <h2>Lead Hierarchy</h2>
        {renderHierarchy(null)}
      </div>

      <div className={`details-sidebar ${selectedLead ? "open" : ""}`}>
        {selectedLead && (
          <>
            <button className="close-sidebar-btn" onClick={closeSidebar}>
              X
            </button>
            <h3>Lead Details</h3>
            <p>
              <strong>Lead Number:</strong> {selectedLead.id}
            </p>
            <p>
              <strong>Lead Description:</strong> {selectedLead.description}
            </p>
            <p>
              <strong>Lead Results:</strong> {selectedLead.results}
            </p>
            <button
              className="disable-btn-hierarchy"
              onClick={() => toggleDisableLead(selectedLead.id)}
            >
              {disabledLeads.includes(selectedLead.id) ? "Enable Lead" : "Disable Lead"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export { LeadHierarchy };
