import React, { useEffect, useState, useContext } from "react";
import "./SelectLeadModal.css";
import axios from "axios";
import { CaseContext } from "../../Pages/CaseContext";
import { useNavigate } from "react-router-dom";
import api from "../../api"

const SelectLeadModal = ({ onSelect, onClose }) => {
  const { selectedCase, setSelectedCase } = useContext(CaseContext);
  const { selectedLead, setSelectedLead } = useContext(CaseContext);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeads = async () => {
      if (!selectedCase?.caseNo || !selectedCase?.caseName) {
        navigate("/HomePage");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await api.get(
          `/api/lead/case/${selectedCase.caseNo}/${selectedCase.caseName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const leadsArray = Array.isArray(response.data) ? response.data : [];
        setLeads(leadsArray);
      } catch (err) {
        setError("Failed to fetch leads.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [selectedCase, navigate]);

  const handleLeadSelect = (lead) => {

    console.log("Lead clicked:", lead);

//     // ✅ Update CaseContext with selected lead
//     setSelectedLead({
//       leadNo: lead.leadNo,
//       leadName: lead.description,
//       caseName: lead.caseName,
//       caseNo: lead.caseNo,
//     });
//     setSelectedCase({
//       caseName: lead.caseName,
//       caseNo: lead.caseNo,
//     });
//     console.log("lead.leadNo:", lead.leadNo);
// console.log("lead.id:", lead.id);

//     console.log("Seleted Lead when lead clicked", selectedLead);

//     onSelect(lead);  // Optional: call the parent-provided callback

navigate("/CMInstruction", {
  state: {
    caseDetails: selectedCase,
    leadDetails: {
      leadNo: lead.leadNo,
      leadName: lead.description,
      caseName: lead.caseName,
      caseNo: lead.caseNo,
    }
  }
});

  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Select a Lead to Continue</h3>

        {loading ? (
          <p>Loading leads...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : leads.length === 0 ? (
          <p>No leads available for this case.</p>
        ) : (
          <ul className="lead-list">
            {leads.map((lead) => (
              <li
                key={lead.leadNo}
                className="lead-option"
                onClick={() => handleLeadSelect(lead)}
              >
                {lead.leadNo} - {lead.description}
              </li>
            ))}
          </ul>
        )}
<div className="btn-sec-modal">
<button className="save-btn1" onClick={onClose}>
          Cancel
        </button>
        </div>
      </div>
    </div>
  );
};

export default SelectLeadModal;
