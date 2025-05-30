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

//   return (
//     <div className="person-modal-overlay">
//       <div className="person-modal-content">
//         {/* Close button */}
//         <button className="person-modal-close" onClick={onClose}>
//           &times;
//         </button>

//         <h2>Person Details</h2>

//         {loading && <p>Loading...</p>}
//         {error && <p style={{ color: "red" }}>{error}</p>}
//         {!loading && !error && persons.length === 0 && (
//           <p>No person records found.</p>
//         )}

//         {!loading && !error && persons.length > 0 && (
//           persons.map((person, index) => (
//             <table key={index} className="person-details-table">
//               <tbody>
//                 {Object.entries(person).map(([key, value]) => {
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

// export default PersonModal;

return (
  <div className="person-modal-overlay">
    <div className="person-modal-content">
      <button className="person-modal-close" onClick={onClose}>&times;</button>
      <h2>Person Details</h2>
      <p><strong>Case:</strong> {caseName}</p>
      <p><strong>Lead #:</strong> {leadNo}</p>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && persons.length === 0 && <p>No records found.</p>}

      {!loading && !error && persons.map((person, idx) => {
        // Define and format every possible field
        const fields = [
          ["Lead Number",       person.leadNo],
          ["Description",       person.description],
          ["Assigned To",       person.assignedTo?.assignees?.join(', ')],
          ["Assigned By",       person.assignedBy?.assignee],
          ["Entered By",        person.enteredBy],
          ["Case Name",         person.caseName],
          ["Case Number",       person.caseNo],
          ["Return ID",         person.leadReturnId],
          ["Date Entered",      person.enteredDate ? new Date(person.enteredDate).toLocaleDateString() : undefined],
          ["First Name",        person.firstName],
          ["Middle Initial",    person.middleInitial],
          ["Last Name",         person.lastName],
          ["Suffix",            person.suffix],
          ["Cell Number",       person.cellNumber],
          ["Alias",       person.alias],
          ["Business Name",     person.businessName],
          ["Street 1",          person.address?.street1],
          ["Street 2",          person.address?.street2],
          ["Building",          person.address?.building],
          ["Apartment",         person.address?.apartment],
          ["City",              person.address?.city],
          ["State",             person.address?.state],
          ["Zip Code",          person.address?.zipCode],
          ["SSN",               person.ssn],
          ["Age",               person.age],
          ["Email",             person.email],
          ["Occupation",        person.occupation],
          ["Person Type",       person.personType],
          ["Condition",         person.condition],
          ["Caution Type",      person.cautionType],
          ["Sex",               person.sex],
          ["Race",              person.race],
          ["Ethnicity",         person.ethnicity],
          ["Skin Tone",         person.skinTone],
          ["Eye Color",         person.eyeColor],
          ["Hair Color",        person.hairColor],
          ["Glasses",           person.glasses],
          ["Height (ft)",       person.height?.feet],
          ["Height (in)",       person.height?.inches],
          ["Weight (lbs)",      person.weight],
          ["Scar",              person.scar],
          ["Tattoo",            person.tattoo],
          ["Mark",              person.mark],
          ["Additional Data",   person.additionalData ? JSON.stringify(person.additionalData) : undefined],
        ];

        // Filter out empty or undefined
        const filled = fields.filter(([, val]) => val != null && val !== '');

        return (
          <table key={idx} className="person-details-table">
            <tbody>
              {filled.map(([label, value], i) => (
                <tr key={i}>
                  <td className="label">{label}</td>
                  <td className="value">{String(value)}</td>
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

export default PersonModal;
