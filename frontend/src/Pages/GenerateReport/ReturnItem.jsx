import React from "react";
import styles from "./GenerateReport.module.css";

export default function ReturnItem({ returnItem }) {
  return (
    <tr>
      <td style={{ textAlign: "center", fontSize: "18px" }}>
        {`Lead Return ID: ${returnItem.leadReturnId}`}
      </td>
      <td>
        <textarea
          className={styles["lead-return-input"]}
          value={returnItem.leadReturnResult || ""}
          readOnly
          style={{
            fontSize: "18px", padding: "10px", borderRadius: "6px",
            width: "100%", resize: "none", height: "auto",
            fontFamily: "Arial", whiteSpace: "pre-wrap", wordWrap: "break-word",
          }}
          rows={Math.max(((returnItem.leadReturnResult || "").length / 50) | 0, 2)}
        />
      </td>
    </tr>
  );
}
