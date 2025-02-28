import React, { useState, useRef } from "react";
import "./LeadHierarchy1.css";  // adapt this to include your .tree CSS
import Navbar from "../../components/Navbar/Navbar";
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";


const LeadHierarchy1 = () => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [disabledLeads, setDisabledLeads] = useState([]);
  const [leads, setLeads] = useState([
    { id: 1, parent: null, description: "Collect Field Case Report from Patrol Officer", results: "Lead 1 Results" },
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
  ]); 

  const containerRef = useRef(null);
    const navigate = useNavigate();
      const location = useLocation();
      const { caseDetails } = location.state || {};

  // const leads = [
  //   { id: 1, parent: null, description: "Collect Field Case Report from Patrol Officer", results: "Lead 1 Results" },
  //   { id: 2, parent: 1, description: "Lead 2 Description", results: "Lead 2 Results" },
  //   { id: 3, parent: 1, description: "Lead 3 Description", results: "Lead 3 Results" },
  //   { id: 4, parent: 2, description: "Lead 4 Description", results: "Lead 4 Results" },
  //   { id: 5, parent: 2, description: "Lead 5 Description", results: "Lead 5 Results" },
  //   { id: 6, parent: 3, description: "Lead 6 Description", results: "Lead 6 Results" },
  //   { id: 10, parent: 3, description: "Lead 10 Description", results: "Lead 10 Results" },
  //   { id: 11, parent: 10, description: "Lead 11 Description", results: "Lead 11 Results" },
  //   { id: 7, parent: 5, description: "Lead 7 Description", results: "Lead 7 Results" },
  //   { id: 8, parent: 6, description: "Lead 8 Description", results: "Lead 8 Results" },
  //   { id: 9, parent: 6, description: "Lead 9 Description", results: "Lead 9 Results" },
  // ];

  // Recursively get all child leads of a given leadId
  const getAllChildLeads = (leadId) => {
    const directChildren = leads.filter((lead) => lead.parent === leadId);
    return directChildren.reduce(
      (acc, child) => [...acc, child, ...getAllChildLeads(child.id)],
      []
    );
  };
  

  const toggleDisableLead = (leadId) => {
    // Gather this lead and its descendants
    const childLeads = getAllChildLeads(leadId).map((child) => child.id);

    setDisabledLeads((prev) => {
      const isDisabled = prev.includes(leadId);
      if (isDisabled) {
        // Enable this lead & its descendants
        return prev.filter((id) => ![leadId, ...childLeads].includes(id));
      } else {
        // Disable this lead & its descendants
        return [...prev, leadId, ...childLeads];
      }
    });
  };

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
  };

  const closeSidebar = () => {
    setSelectedLead(null);
  };

  const updateLeadDetails = (leadId, field, value) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, [field]: value } : lead
      )
    );
  };

  const isLeadDisabled = (leadId) => disabledLeads.includes(leadId);

  /**
   * Recursively renders a <ul> containing each child <li>.
   * If a node is disabled, we do not render its children.
   */
  const renderTree = (parentId) => {
    // Get immediate child leads
    const childLeads = leads.filter((l) => l.parent === parentId);
    if (childLeads.length === 0) {
      return null;
    }

    return (
      <ul>
        {childLeads.map((child) => {
          const disabled = isLeadDisabled(child.id);
          return (
            <li key={child.id} className={disabled ? "disabled" : ""}>
              {/* 
                Use an <a> tag (or any element) for the clickable node. 
                Stopping default click so it doesn't jump anywhere.
              */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLeadClick(child);
                }}
              >
                Lead {child.id}
                {/* 
                  If you want images like your snippet, adapt the src path below 
                  or remove <img> if you don’t have actual images 
                */}
                <span> {child.description}</span>
              </a>

              {/* Recursively render children if not disabled */}
              {!disabled && renderTree(child.id)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="lead-log-container" ref={containerRef}>
      <Navbar />

      {/* The container/row structure from your snippet */}
      <div className="container">
        <div className="row">
        <h2>LEAD HIERARCHY</h2>
          <div className="case-header">
          {caseDetails ? (
                        <h1>
                          Case: {caseDetails?.id || "N/A"} | {caseDetails?.title || "Unknown Case"}
                        </h1>
                    ) : (
                        <h1>Case: 12345 | Main Street Murder </h1>
                    )}
                </div>
          <div className="tree">
            {/* Start the tree from the root (parent = null) */}
            {renderTree(null)}
          </div>
        </div>
      </div>

      {/* Sidebar for details */}
      {/* <div className={`details-sidebar ${selectedLead ? "open" : ""}`}>
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
      </div> */}
      <div className={`details-sidebar ${selectedLead ? "open" : ""}`}>
  {selectedLead && (
    <>
      <button className="close-sidebar-btn" onClick={closeSidebar}>
        ✖
      </button>
      <h3 className="sidebar-title">Lead Details</h3>
      <div className="lead-info">
        <label>
          <strong>Lead Number:</strong>
          <span>{selectedLead.id}</span>
        </label>
      </div>

      <div className="lead-input">
        <label htmlFor="lead-description"><strong>Lead Description:</strong></label>
        <textarea
          id="lead-description"
          value={selectedLead.description}
          onChange={(e) => updateLeadDetails(selectedLead.id, 'description', e.target.value)}
          placeholder="Enter lead description..."
        />
      </div>

      <div className="lead-input">
        <label htmlFor="lead-results"><strong>Lead Results:</strong></label>
        <textarea
          id="lead-results"
          value={selectedLead.results}
          onChange={(e) => updateLeadDetails(selectedLead.id, 'results', e.target.value)}
          placeholder="Enter lead results..."
        />
      </div>

      <button
        className={`disable-btn ${disabledLeads.includes(selectedLead.id) ? "enable" : "disable"}`}
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
