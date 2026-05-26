import React from "react";
import styles from "./GenerateReport.module.css";

export default function ReturnItem({ returnItem }) {
  const text  = returnItem.leadReturnResult || "";
  // Count rows by actual newlines + estimated wrap lines so nothing is clipped
  const newlineCount = (text.match(/\n/g) || []).length;
  const wrapLines    = Math.ceil(text.length / 80);
  const rows         = Math.max(newlineCount + wrapLines, 2);

  return (
    <tr>
      <td style={{ textAlign: "center", fontSize: "18px" }}>
        {`Lead Return ID: ${returnItem.leadReturnId}`}
      </td>
      <td>
        <textarea
          className={styles["lead-return-input"]}
          value={text}
          readOnly
          rows={rows}
          style={{
            fontSize: "18px", padding: "10px", borderRadius: "6px",
            width: "100%", resize: "none",
            height: "auto", maxHeight: "none", // override the 150px CSS cap
            fontFamily: "Arial", whiteSpace: "pre-wrap", wordWrap: "break-word",
            overflowY: "hidden",
          }}
        />
      </td>
    </tr>
  );
}
