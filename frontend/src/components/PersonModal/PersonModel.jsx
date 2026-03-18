// PersonModal.jsx

import React, { useEffect, useState } from "react";
import "./PersonModal.css";
import api from "../../api";

const PersonModal = ({
  isOpen,
  onClose,
  leadNo,
  description,
  caseNo,
  caseName,
  leadReturnId,
  personData,
}) => {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // If a specific person object is passed directly, use it — no fetch needed
    if (personData) {
      setPersons([personData]);
      setLoading(false);
      setError(null);
      return;
    }

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
  }, [isOpen, leadNo, description, caseNo, caseName, leadReturnId, personData]);

  if (!isOpen) return null;

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
          // Derived display values
          const fullAddress = [
            person.address?.street1,
            person.address?.city,
            person.address?.state,
            person.address?.zipCode,
          ].filter(Boolean).join(", ");

          const heightDisplay = (person.height?.feet != null || person.height?.inches != null)
            ? `${person.height?.feet ?? 0}ft ${person.height?.inches ?? 0}in`
            : "";

          const scarsMarks = [
            person.scar   ? `Scar: ${person.scar}`   : null,
            person.mark   ? `Mark: ${person.mark}`   : null,
            person.tattoo ? `Tattoo: ${person.tattoo}` : null,
          ].filter(Boolean).join("; ");
          // kept for backward compat but now rendered as separate columns below

          const dob = person.dateOfBirth
            ? (() => { const d = new Date(person.dateOfBirth); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString(); })()
            : "";

          return (
            <div key={idx} style={{ marginBottom: 32 }}>
              {idx > 0 && <hr style={{ margin: "16px 0" }} />}

              {/* Photo */}
              {person.photoUrl && (
                <div className="person-photo-wrapper">
                  <img
                    src={person.photoUrl}
                    alt={`${person.firstName || ""} ${person.lastName || ""}`}
                  />
                </div>
              )}

              {/* Row 1: Last Name | First Name | Middle Initial | Suffix | Alias */}
              <table className="person-group-table">
                <thead>
                  <tr>
                    <th>Last Name</th>
                    <th>First Name</th>
                    <th>Middle Initial</th>
                    <th>Suffix</th>
                    <th>Alias</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{person.lastName || ""}</td>
                    <td>{person.firstName || ""}</td>
                    <td>{person.middleInitial || ""}</td>
                    <td>{person.suffix || ""}</td>
                    <td>{person.alias || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* Row 2: Sex | Date Of Birth | Address | Phone No | Email */}
              <table className="person-group-table">
                <thead>
                  <tr>
                    <th>Sex</th>
                    <th>Date Of Birth</th>
                    <th>Address</th>
                    <th>Phone No</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{person.sex || ""}</td>
                    <td>{dob}</td>
                    <td>{fullAddress}</td>
                    <td>{person.cellNumber || ""}</td>
                    <td>{person.email || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* Row 3: Race | Ethnicity | Person Type | Condition | Caution Type */}
              <table className="person-group-table">
                <thead>
                  <tr>
                    <th>Race</th>
                    <th>Ethnicity</th>
                    <th>Person Type</th>
                    <th>Condition</th>
                    <th>Caution Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{person.race || ""}</td>
                    <td>{person.ethnicity || ""}</td>
                    <td>{person.personType || ""}</td>
                    <td>{person.condition || ""}</td>
                    <td>{person.cautionType || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* Row 4: Skin Tone | Eye Color | Glasses | Hair Color | Height */}
              <table className="person-group-table">
                <thead>
                  <tr>
                    <th>Skin Tone</th>
                    <th>Eye Color</th>
                    <th>Glasses</th>
                    <th>Hair Color</th>
                    <th>Height</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{person.skinTone || ""}</td>
                    <td>{person.eyeColor || ""}</td>
                    <td>{person.glasses || ""}</td>
                    <td>{person.hairColor || ""}</td>
                    <td>{heightDisplay}</td>
                  </tr>
                </tbody>
              </table>

              {/* Row 5: Weight | Scars | Marks | Tattoo */}
              <table className="person-group-table">
                <thead>
                  <tr>
                    <th>Weight</th>
                    <th>Scars</th>
                    <th>Marks</th>
                    <th>Tattoo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{person.weight != null ? `${person.weight} lbs` : ""}</td>
                    <td>{person.scar || ""}</td>
                    <td>{person.mark || ""}</td>
                    <td>{person.tattoo || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* Row 6: SSN | Occupation | Business Name */}
              <table className="person-group-table">
                <thead>
                  <tr>
                    <th>SSN</th>
                    <th>Occupation</th>
                    <th>Business Name</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{person.ssn || ""}</td>
                    <td>{person.occupation || ""}</td>
                    <td>{person.businessName || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* Row 7: Street 1 | Street 2 | Building */}
              <table className="person-group-table">
                <thead>
                  <tr>
                    <th>Street 1</th>
                    <th>Street 2</th>
                    <th>Building</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{person.address?.street1 || ""}</td>
                    <td>{person.address?.street2 || ""}</td>
                    <td>{person.address?.building || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* Row 8: Apartment | City | State | Zip Code */}
              <table className="person-group-table">
                <thead>
                  <tr>
                    <th>Apartment</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Zip Code</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{person.address?.apartment || ""}</td>
                    <td>{person.address?.city || ""}</td>
                    <td>{person.address?.state || ""}</td>
                    <td>{person.address?.zipCode || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* Additional Data */}
              {Array.isArray(person.additionalData) && person.additionalData.length > 0 && (
                <table className="person-details-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {person.additionalData.map((item, i) => (
                      <tr key={i}>
                        <td>{item.category || ""}</td>
                        <td>{item.value || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonModal;
