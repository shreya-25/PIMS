import React from "react";
import { formatDate, isDeletedStatus, isClosedStatus } from "./generateReportUtils";
import ReturnItem from "./ReturnItem";
import styles from "./GenerateReport.module.css";

export default function LeadCard({ lead, displayUser, handleLeadCardClick }) {
  const isDeleted     = isDeletedStatus(lead?.leadStatus);
  const isClosed      = isClosedStatus(lead?.leadStatus);
  const deletedReason = lead?.deletedReason || lead?.deletedReasonText || lead?.deleteReason || lead?.reason || "";
  const closedReason  = lead?.closedReason  || lead?.closeReason  || lead?.reason || "";

  return (
    <div
      className={`${styles["lead-section"]} ${isDeleted ? styles["is-deleted"] : ""} ${isClosed ? styles["is-closed"] : ""}`}
      onClick={(e) => handleLeadCardClick(e, lead)}
    >
      <div className={styles["leads-container"]}>

        {/* Lead header: number, origin, dates, officers */}
        <table className={styles["lead-details-table"]}>
          <colgroup>
            <col style={{ width: "15%" }} /><col style={{ width: "7%"  }} />
            <col style={{ width: "10%" }} /><col style={{ width: "13%" }} />
            <col style={{ width: "12%" }} /><col style={{ width: "10%" }} />
            <col style={{ width: "14%" }} /><col style={{ width: "10%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td className={styles["label-cell"]}>Lead Number</td>
              <td className={styles["input-cell"]}>
                <input type="text" value={lead.leadNo} readOnly />
              </td>
              <td className={styles["label-cell"]}>Lead Origin</td>
              <td className={styles["input-cell"]}>
                <input
                  type="text"
                  value={Array.isArray(lead.parentLeadNo) ? lead.parentLeadNo.join(", ") : (lead.parentLeadNo || "")}
                  readOnly
                />
              </td>
              <td className={styles["label-cell"]}>Assigned Date</td>
              <td className={styles["input-cell"]}>
                <input type="text" value={formatDate(lead.assignedDate)} readOnly />
              </td>
              <td className={styles["label-cell"]}>Completed Date</td>
              <td className={styles["input-cell"]}>
                <input type="text" value={formatDate(lead.completedDate)} readOnly />
              </td>
            </tr>
            <tr>
              <td className={styles["label-cell"]}>Assigned Officers</td>
              <td className={styles["input-cell"]} colSpan={7}>
                <input
                  type="text"
                  value={
                    Array.isArray(lead.assignedTo) && lead.assignedTo.length
                      ? lead.assignedTo.map((a) => displayUser(a.username)).join(", ")
                      : ""
                  }
                  readOnly
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Lead instruction + returns */}
        <table className={styles["leads-table"]}>
          <tbody>
            <tr className={styles["table-first-row"]}>
              <td style={{ textAlign: "center", fontSize: "18px" }} className={styles["input-cell"]}>
                Lead Instruction
              </td>
              <td>
                <input
                  type="text"
                  value={lead.description || ""}
                  className={styles["instruction-input"]}
                  readOnly
                />
              </td>
            </tr>

            {isDeleted && (
              <tr className={styles["deleted-row"]}>
                <td style={{ textAlign: "center", fontSize: "18px" }} className={styles["label-cell"]}>
                  Deleted Reason
                </td>
                <td>
                  <input type="text" value={deletedReason || "N/A"} readOnly className={styles["instruction-input"]} />
                </td>
              </tr>
            )}

            {isClosed && (
              <tr className={styles["closed-row"]}>
                <td style={{ textAlign: "center", fontSize: "18px" }} className={styles["label-cell"]}>
                  Closed Reason
                </td>
                <td>
                  <input type="text" value={closedReason || "N/A"} readOnly className={styles["instruction-input"]} />
                </td>
              </tr>
            )}

            {Array.isArray(lead.leadReturns) && lead.leadReturns.length > 0 ? (
              lead.leadReturns.map((returnItem, ri) => (
                <ReturnItem key={returnItem._id || returnItem.leadReturnId || ri} returnItem={returnItem} />
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ textAlign: "center" }}>No Lead Returns Available</td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}
