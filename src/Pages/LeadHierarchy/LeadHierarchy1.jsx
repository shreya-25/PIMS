import React, { useState, useEffect, useRef } from "react";
import "./LeadHierarchy1.css";

const LeadHierarchy1 = () => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [disabledLeads, setDisabledLeads] = useState([]);
  const containerRef = useRef(null);

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

  useEffect(() => {
    if (containerRef.current) {
      calculateLinePositions();
    }
  }, []);

  const calculateLinePositions = () => {
    const containers = containerRef.current.querySelectorAll(".children");
  
    containers.forEach((container) => {
      const childNodes = container.querySelectorAll(".lead-node");
      if (childNodes.length > 1) { // Only calculate offsets if there are multiple children
        const firstChild = container.querySelector(".lead-node:first-child");
        const lastChild = container.querySelector(".lead-node:last-child");
  
        if (firstChild && lastChild) {
          const containerRect = container.getBoundingClientRect();
          const firstChildRect = firstChild.getBoundingClientRect();
          const lastChildRect = lastChild.getBoundingClientRect();
  
          const leftOffset = firstChildRect.left - containerRect.left;
          const rightOffset = containerRect.right - lastChildRect.right;
  
          container.style.setProperty("--line-left-offset", `${leftOffset}px`);
          container.style.setProperty("--line-right-offset", `${rightOffset}px`);
        }
      } else {
        // Reset offsets for single or no children
        container.style.setProperty("--line-left-offset", `0px`);
        container.style.setProperty("--line-right-offset", `0px`);
      }
    });
  };
  

  const toggleDisableLead = (leadId) => {
    const getAllChildLeads = (id) => {
      const children = leads.filter((lead) => lead.parent === id);
      return children.reduce(
        (acc, lead) => [...acc, lead, ...getAllChildLeads(lead.id)],
        []
      );
    };

    const allChildLeads = getAllChildLeads(leadId).map((lead) => lead.id);

    setDisabledLeads((prevDisabledLeads) => {
      const isCurrentlyDisabled = prevDisabledLeads.includes(leadId);

      if (isCurrentlyDisabled) {
        return prevDisabledLeads.filter((id) => ![leadId, ...allChildLeads].includes(id));
      } else {
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
          e.stopPropagation();
          handleLeadClick(lead);
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
          <div className="form-group">
            <label>Lead Number:</label>
            <input type="text" value={selectedLead.id} readOnly className="input-field" />
          </div>
          <div className="form-group">
            <label>Lead Description:</label>
            <textarea
              value={selectedLead.description}
              readOnly
              className="textarea-field"
            />
          </div>
          <div className="form-group">
            <label>Lead Results:</label>
            <textarea
              value={selectedLead.results}
              readOnly
              className="textarea-field"
            />
          </div>
          <button
            className="done-button"
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

export { LeadHierarchy1 };
