import React, { useEffect, useState } from "react";
import "./VehicleModal.css";
import api from "../../api";

const VehicleModal = ({
  isOpen,
  onClose,
  leadNo,
  leadName,
  caseNo,
  caseName,
  leadReturnId,
  vehicleData,
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // If a specific vehicle object is passed directly, use it — no fetch needed
    if (vehicleData) {
      setVehicles([vehicleData]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    api.get(
      `/api/lrvehicle/lrvehicle/${leadNo}/${encodeURIComponent(leadName)}/${caseNo}/${encodeURIComponent(caseName)}/${leadReturnId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    )
      .then(({ data }) => setVehicles(data))
      .catch(err => {
        console.error("Error fetching vehicle data:", err);
        setError("Failed to load vehicle data.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, leadNo, leadName, caseNo, caseName, leadReturnId, vehicleData]);

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return isNaN(d) ? "" : new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString();
  };

  return (
    <div className="vehicle-modal-overlay">
      <div className="vehicle-modal-content">
        <button className="vehicle-modal-close" onClick={onClose}>&times;</button>
        <h2>Vehicle Details</h2>
        <p><strong>Case:</strong> {caseName}</p>
        <p><strong>Lead #:</strong> {leadNo}</p>

        {loading && <p>Loading…</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && vehicles.length === 0 && <p>No vehicle records found.</p>}

        {!loading && !error && vehicles.map((v, idx) => (
          <div key={idx} style={{ marginBottom: 32 }}>
            {idx > 0 && <hr />}

            {/* Row 1: Narrative ID | Entered Date | Year */}
            <table className="vehicle-group-table">
              <thead>
                <tr>
                  <th>Narrative ID</th>
                  <th>Entered Date</th>
                  <th>Year</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{v.leadReturnId || ""}</td>
                  <td>{formatDate(v.enteredDate)}</td>
                  <td>{v.year || ""}</td>
                </tr>
              </tbody>
            </table>

            {/* Row 2: Make | Model | Category | Type */}
            <table className="vehicle-group-table">
              <thead>
                <tr>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Category</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{v.make || ""}</td>
                  <td>{v.model || ""}</td>
                  <td>{v.category || ""}</td>
                  <td>{v.type || ""}</td>
                </tr>
              </tbody>
            </table>

            {/* Row 3: VIN | Plate | State */}
            <table className="vehicle-group-table">
              <thead>
                <tr>
                  <th>VIN</th>
                  <th>Plate</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{v.vin || ""}</td>
                  <td>{v.plate || ""}</td>
                  <td>{v.state || ""}</td>
                </tr>
              </tbody>
            </table>

            {/* Row 4: Primary Color | Secondary Color */}
            <table className="vehicle-group-table">
              <thead>
                <tr>
                  <th>Primary Color</th>
                  <th>Secondary Color</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{v.primaryColor || ""}</td>
                  <td>{v.secondaryColor || ""}</td>
                </tr>
              </tbody>
            </table>

            {/* Information */}
            {v.information && (
              <table className="vehicle-group-table">
                <thead>
                  <tr>
                    <th>Information</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ whiteSpace: "normal" }}>{v.information}</td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Additional Data */}
            {Array.isArray(v.additionalData) && v.additionalData.length > 0 && (
              <table className="vehicle-details-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {v.additionalData.map((item, i) => (
                    <tr key={i}>
                      <td>{item.category || ""}</td>
                      <td>{item.value || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleModal;
