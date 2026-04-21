import React, { useState } from "react";

export default function HierarchyChain({ chain, chainIndex }) {
  const [expanded, setExpanded] = useState(false);
  const leadNumbers     = chain.map((l) => l.leadNo);
  const displayedNumbers = expanded ? leadNumbers : leadNumbers.slice(0, 2);
  return (
    <div
      style={{ marginBottom: "10px", cursor: "pointer", width: "100%", display: "flex", justifyContent: "flex-start", alignItems: "center" }}
      onClick={() => setExpanded((e) => !e)}
    >
      <strong>Chain #{chainIndex + 1}:</strong>&nbsp;{displayedNumbers.join(", ")}{" "}
      {leadNumbers.length > 2 && (expanded ? "▲ Expand" : "▼")}
    </div>
  );
}
