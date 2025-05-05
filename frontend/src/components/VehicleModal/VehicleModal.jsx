// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "./VehicleModal.css"; // Ensure this file contains the CSS for styling
// import api from "../../api"

// const VehicleModal = ({
//   isOpen,
//   onClose,
//   leadNo,
//   description,
//   caseNo,
//   caseName,
//   leadReturnId,
//   leadsDeskCode, // Added Leads Desk Code
// }) => {
//   const [vehicles, setVehicles] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!isOpen) return;

//     const fetchVehicles = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const token = localStorage.getItem("token") || "";
//         const { data } = await axios.get(
//           `/api/lrvehicle/lrvehicle/${leadNo}/${encodeURIComponent(description)}/${caseNo}/${encodeURIComponent(caseName)}/${leadReturnId}`, // Updated endpoint with leadsDeskCode
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         setVehicles(data);
//       } catch (err) {
//         console.error("Error fetching vehicle data:", err);
//         setError("Failed to load vehicle data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchVehicles();
//   }, [isOpen, leadNo, description, caseNo, caseName, leadReturnId, leadsDeskCode]);

//   if (!isOpen) return null;

//   return (
//     <div className="vehicle-modal-overlay">
//       <div className="vehicle-modal-content">
//         {/* Close button */}
//         <button className="vehicle-modal-close" onClick={onClose}>
//           &times;
//         </button>

//         <h2>Vehicle Details</h2>

//         {loading && <p>Loading...</p>}
//         {error && <p style={{ color: "red" }}>{error}</p>}
//         {!loading && !error && vehicles.length === 0 && (
//           <p>No vehicle records found.</p>
//         )}

//         {!loading && !error && vehicles.length > 0 && (
//           vehicles.map((vehicle, index) => (
//             <table key={index} className="person-details-table">
//               <tbody>
//                 {Object.entries(vehicle).map(([key, value]) => {
//                   if (value && typeof value === "object") {
//                     return Object.entries(value).map(([subKey, subVal]) => (
//                       <tr key={`${key}.${subKey}`}>
//                         <td>{`${key}.${subKey}`}</td>
//                         <td>{String(subVal ?? "")}</td>
//                       </tr>
//                     ));
//                   }
//                   return (
//                     <tr key={key}>
//                       <td>{key}</td>
//                       <td>{String(value ?? "")}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default VehicleModal;

// import React, { useEffect, useState } from "react";
// import "./VehicleModal.css";
// import api from "../../api";

// const VehicleModal = ({
//   isOpen,
//   onClose,
//   leadNo,
//   leadName,
//   caseNo,
//   caseName,
//   leadReturnId
// }) => {
//   const [vehicles, setVehicles] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!isOpen) return;
//     setLoading(true);
//     setError(null);

//     const fetchVehicles = async () => {
//       try {
//         const token = localStorage.getItem("token") || "";
//         const { data } = await api.get(
//           `/api/lrvehicle/lrvehicle/${leadNo}/${leadName}/${caseNo}/${caseName}/${leadReturnId}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         setVehicles(data);
//       } catch (err) {
//         console.error("Error fetching vehicle data:", err);
//         setError("Failed to load vehicle data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchVehicles();
//   }, [isOpen, leadNo, caseNo, leadReturnId]);

//   if (!isOpen) return null;

//   return (
//     <div className="vehicle-modal-overlay">
//       <div className="vehicle-modal-content">
//         <header className="modal-header">
//           <h2>Vehicle Details</h2>
//           <button className="close-btn" onClick={onClose}>&times;</button>
//         </header>

//         <section className="modal-info">
//           <p><strong>Case:</strong> {caseName}</p>
//           <p><strong>Lead #:</strong> {leadNo}</p>
//           <p><strong>Return ID:</strong> {leadReturnId}</p>
//         </section>

//         {loading && <p>Loading...</p>}
//         {error && <p className="error">{error}</p>}
//         {!loading && !error && vehicles.length === 0 && <p>No vehicle records found.</p>}

//         {!loading && !error && vehicles.map((v, idx) => {
//           const fields = [
//             ["Entered Date",    v.enteredDate ? new Date(v.enteredDate).toLocaleDateString() : undefined],
//             ["VIN",             v.vin],
//             ["Year",            v.year],
//             ["Make",            v.make],
//             ["Model",           v.model],
//             ["Plate",           v.plate],
//             ["State",           v.state],
//             ["Category",        v.category],
//             ["Type",            v.type],
//             ["Primary Color",   v.primaryColor],
//             ["Secondary Color", v.secondaryColor],
//             ["Information",     v.information],
//             ["Additional Data", v.additionalData ? JSON.stringify(v.additionalData) : undefined]
//           ];

//           const filled = fields.filter(([, val]) => val != null && val !== "");

//           return (
//             <table key={idx} className="vehicle-details-table">
//               <tbody>
//                 {filled.map(([label, value], i) => (
//                   <tr key={i}>
//                     <td className="label">{label}</td>
//                     <td className="value">{value}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default VehicleModal;

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
  leadReturnId
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, leadNo, leadName, caseNo, caseName, leadReturnId]);

  if (!isOpen) return null;

  return (
    <div className="vehicle-modal-overlay">
      <div className="vehicle-modal-content">
        <button className="vehicle-modal-close" onClick={onClose}>
          &times;
        </button>
        <h2>Vehicle Details</h2>
        <div className="modal-info">
          <p><strong>Case:</strong> {caseName}</p>
          <p><strong>Lead #:</strong> {leadNo}</p>
          <p><strong>Return ID:</strong> {leadReturnId}</p>
        </div>

        {loading && <p>Loading…</p>}
        {error   && <p className="error">{error}</p>}
        {!loading && !error && vehicles.length === 0 && (
          <p>No vehicle records found.</p>
        )}

        {!loading && !error && vehicles.map((v,idx) => {
          const fields = [
            ["Entered Date",    v.enteredDate && new Date(v.enteredDate).toLocaleDateString()],
            ["VIN",             v.vin],
            ["Year",            v.year],
            ["Make",            v.make],
            ["Model",           v.model],
            ["Plate",           v.plate],
            ["State",           v.state],
            ["Category",        v.category],
            ["Type",            v.type],
            ["Primary Color",   v.primaryColor],
            ["Secondary Color", v.secondaryColor],
            ["Information",     v.information],
            ["Additional Data", v.additionalData && JSON.stringify(v.additionalData)]
          ].filter(([,val]) => val);

          return (
            <table key={idx} className="person-details-table">
              <tbody>
                {fields.map(([label,val], i) => (
                  <tr key={i}>
                    <td className="label">{label}</td>
                    <td className="value">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleModal;
