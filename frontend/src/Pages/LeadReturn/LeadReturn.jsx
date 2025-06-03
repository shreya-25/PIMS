import React, { useContext, useEffect, useState } from "react";
import api, { BASE_URL } from "../../api"; // your axios instance + BASE_URL
import { CaseContext } from "../CaseContext";

export const LeadReturn = () => {
  const { selectedCase, selectedLead } = useContext(CaseContext);
  const [imageUrls, setImageUrls] = useState([]);    // array of strings
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      selectedCase?.caseNo &&
      selectedCase?.caseName
    ) {
      fetchEnclosuresAndImages();
    }
  }, [selectedLead, selectedCase]);

  async function fetchEnclosuresAndImages() {
    const token = localStorage.getItem("token");
    const leadNo = selectedLead.leadNo;
    const leadName = encodeURIComponent(selectedLead.leadName);
    const caseNo = selectedCase.caseNo;
    const caseName = encodeURIComponent(selectedCase.caseName);

    try {
      // ① Fetch the bare “enclosure” records (which include filename/link)
      const { data: rawEnclosures } = await api.get(
        `/api/lrenclosure/${leadNo}/${leadName}/${caseNo}/${caseName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("📦 rawEnclosures:", rawEnclosures);

      // ② Build URLs directly from each enclosure’s filename or link
      const urls = rawEnclosures
        .map((enc) => {
          if (enc.link) {
            // if there’s a link field, use it directly
            return enc.link;
          }
          if (enc.filename) {
            // otherwise, construct from uploads folder + filename
            return `${BASE_URL}/uploads/${enc.filename}`;
          }
          return null;
        })
        .filter((u) => u !== null);

      setImageUrls(urls);
      setError(null);
    } catch (err) {
      console.error("Error fetching enclosure images:", err);
      setError("Failed to load images");
    }
  }

  return (
    <div style={{ padding: "16px" }}>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {imageUrls.length === 0 && !error ? (
        <p>No enclosure images to display.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {imageUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Enclosure ${idx + 1}`}
              style={{
                maxWidth: "700px",
                maxHeight: "700px",
                objectFit: "cover",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
