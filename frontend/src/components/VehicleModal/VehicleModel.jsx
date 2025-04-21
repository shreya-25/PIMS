import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VehicleModal.css"; // Ensure this file contains the CSS for styling
import api from "../../api"

const VehicleModal = ({
  isOpen,
  onClose,
  leadNo,
  description,
  caseNo,
  caseName,
  leadReturnId,
  leadsDeskCode, // Added Leads Desk Code
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token") || "";
        const { data } = await axios.get(
          `/api/lrvehicle/lrvehicle/${leadNo}/${encodeURIComponent(description)}/${caseNo}/${encodeURIComponent(caseName)}/${leadReturnId}`, // Updated endpoint with leadsDeskCode
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVehicles(data);
      } catch (err) {
        console.error("Error fetching vehicle data:", err);
        setError("Failed to load vehicle data.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [isOpen, leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode]);

  if (!isOpen) return null;

  return (
    <div className="vehicle-modal-overlay">
      <div className="vehicle-modal-content">
        {/* Close button */}
        <button className="vehicle-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2>Vehicle Details</h2>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && vehicles.length === 0 && (
          <p>No vehicle records found.</p>
        )}

        {!loading && !error && vehicles.length > 0 && (
          vehicles.map((vehicle, index) => (
            <table key={index} className="person-details-table">
              <tbody>
                {Object.entries(vehicle).map(([key, value]) => {
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

export default VehicleModal;
