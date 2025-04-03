import React, { useContext, useState, useEffect, useRef } from "react";
import "./CaseHeaderSection.css"; // Ensure you have CaseHeaderSection.css in the same folder

const CaseHeaderSection = () => {

    const [searchLeadsValue, setSearchLeadsValue] = useState("");
    const [selectLead1, setSelectLead1] = useState("");
    const [selectLead2, setSelectLead2] = useState("");
    const [hierarchyLead1, setHierarchyLead1] = useState("");

  return (
    <div className="case-header-section">
      {/* Left Column */}
      <div className="left-column">

      <div className="block1">
        <label className="input-label">Search Leads</label>
        <div className="search_and_hierarchy_container">
              <div className="search-bar">
                <div className="search-container1">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input type="text" className="search-input1" placeholder="Search Lead" />
                </div>
              </div>
              </div>
        </div>


        <div className="block1">
        <label className="input-label">Select Leads to view</label>
        <div className="top-row">
        <div className="top-rowhead">
          <div className="square">
          <input
                  type="text"
                  className="square-input"
                  placeholder=""
                  value={selectLead1}
                  onChange={(e) => setSelectLead1(e.target.value)}
                />
          </div>
          <div className="dash"></div>
          <div className="square">
          <input
                  type="text"
                  className="square-input"
                  placeholder=""
                  value={selectLead2}
                  onChange={(e) => setSelectLead2(e.target.value)}
                />
          </div>
          </div>
          <button className="search-button1" >
                  Show Leads
                </button>
        </div>
        </div>
        <div className="block1">
        <label className="input-label">View Lead Hierarchy</label>
        <div className="top-row">
        <div className="top-rowhead">
          <div className="square1">
          <input
                  type="text"
                  className="square-input"
                  placeholder=""
                  value={hierarchyLead1}
                  onChange={(e) => setHierarchyLead1(e.target.value)}
                />
          </div>
          <div className="square4"></div>
          <div className="square3"></div>
          </div>
          <button className="search-button1">
                  Show Hierarchy
                </button>
        </div>
        </div>
    </div>
    </div>
  );
};

export default CaseHeaderSection;
