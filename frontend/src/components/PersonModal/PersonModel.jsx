// PersonModal.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PersonModal.css"; // Ensure this file contains the CSS for styling
import api from "../../api"

const PersonModal = ({
  isOpen,
  onClose,
  leadNo,
  description,
  caseNo,
  caseName,
  leadReturnId,
}) => {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPersons = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token") || "";
        const { data } = await api.get(
          `/api/lrperson/lrperson/${leadNo}/${encodeURIComponent(
            description
          )}/${caseNo}/${encodeURIComponent(caseName)}/${leadReturnId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPersons(data);
      } catch (err) {
        console.error("Error fetching person data:", err);
        setError("Failed to load person data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPersons();
  }, [isOpen, leadNo, description, caseNo, caseName, leadReturnId]);

  if (!isOpen) return null;

  return (
    <div className="person-modal-overlay">
      <div className="person-modal-content">
        {/* Close button */}
        <button className="person-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2>Person Details</h2>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && persons.length === 0 && (
          <p>No person records found.</p>
        )}

        {!loading && !error && persons.length > 0 && (
          persons.map((person, index) => (
            <table key={index} className="person-details-table">
              <tbody>
                {Object.entries(person).map(([key, value]) => {
                  if (value && typeof value === "object") {
                    return Object.entries(value).map(([subKey, subVal]) => (
                      <tr key={`${key}.${subKey}`}>
                        <td>{`${key}.${subKey}`}</td>
                        <td>{String(subVal ?? "")}</td>
                      </tr>
                    ));
                  }
                  return (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{String(value ?? "")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ))
        )}
      </div>
    </div>
  );
};

export default PersonModal;
