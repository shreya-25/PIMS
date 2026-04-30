import React from "react";
import { formatDate, isDeletedStatus, isClosedStatus, lrKeyFor } from "./generateReportUtils";
import ReturnItem from "./ReturnItem";
import styles from "./GenerateReport.module.css";

const EVENT_LABELS = {
  "assigned":           "Lead Assigned",
  "accepted":           "Assignment Accepted",
  "declined":           "Assignment Declined",
  "reassigned-added":   "Officer Added",
  "reassigned-removed": "Officer Removed",
  "pi-submitted":       "Submitted for Review",
  "cm-approved":        "Approved",
  "cm-returned":        "Returned to Investigator",
  "cm-closed":          "Closed",
  "cm-reopened":        "Reopened",
  "cm-deleted":         "Deleted",
};

const ENTITY_LABELS = {
  LeadReturnResult: "Narrative",
  LeadReturn:       "Lead Return",
  LRPerson:         "Person",
  LRVehicle:        "Vehicle",
  LREnclosure:      "Enclosure",
  LREvidence:       "Evidence",
  LRPicture:        "Picture",
  LRAudio:          "Audio",
  LRVideo:          "Video",
  LRScratchpad:     "Note",
  LRTimeline:       "Timeline Entry",
};

export default function ReopenedLeadCard({ lead, displayUser, handleLeadCardClick }) {
  const isDeleted     = isDeletedStatus(lead?.leadStatus);
  const isClosed      = isClosedStatus(lead?.leadStatus);
  const deletedReason = lead?.deletedReason || lead?.deletedReasonText || lead?.deleteReason || lead?.reason || "";
  const closedReason  = lead?.closedReason  || lead?.closeReason  || lead?.reason || "";

  const preReopenKeys     = new Set((lead.preReopenReturns || []).map((r) => String(lrKeyFor(r) || "")).filter(Boolean));
  const preReopenReturns  = lead.preReopenReturns || [];
  const postReopenReturns = (lead.leadReturns || []).filter((r) => {
    const k = String(lrKeyFor(r) || "");
    return k && !preReopenKeys.has(k);
  });

  const statusEvents = (lead.events || []).map((e) => ({
    kind:        "status",
    timestamp:   e.at ? new Date(e.at) : null,
    action:      EVENT_LABELS[e.type] || e.type,
    by:          e.by || "—",
    to:          Array.isArray(e.to) && e.to.length ? e.to.join(", ") : null,
    detail:      e.reason || null,
    statusAfter: e.statusAfter || null,
  }));

  const entityEvents = (lead.auditLogs || []).map((a) => ({
    kind:        "entity",
    timestamp:   a.timestamp ? new Date(a.timestamp) : null,
    action:      `${a.action} ${ENTITY_LABELS[a.entityType] || a.entityType}`,
    by:          a.performedBy?.username || "—",
    to:          null,
    detail:      a.metadata?.reason || a.metadata?.notes || null,
    statusAfter: null,
  }));

  const allEvents = [...statusEvents, ...entityEvents]
    .filter((e) => e.timestamp)
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div
      className={`${styles["lead-section"]} ${isDeleted ? styles["is-deleted"] : ""} ${isClosed ? styles["is-closed"] : ""}`}
      onClick={(e) => handleLeadCardClick(e, lead)}
    >
      <div className={styles["leads-container"]}>

        {/* Lead header */}
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

        {/* Lead instruction */}
        <table className={styles["leads-table"]}>
          <tbody>
            <tr className={styles["table-first-row"]}>
              <td style={{ textAlign: "center", fontSize: "18px" }} className={styles["input-cell"]}>
                Lead Instruction
              </td>
              <td>
                <input type="text" value={lead.description || ""} className={styles["instruction-input"]} readOnly />
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
          </tbody>
        </table>

        {/* Reopen metadata banner */}
        <div style={{ margin: "10px 0", padding: "10px 14px", background: "#fff7ed", border: "1px solid #fb923c", borderRadius: 6, fontSize: 15, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <span><strong>Status:</strong> {lead.leadStatus || "N/A"}</span>
          <span><strong>Reopened Date:</strong> {formatDate(lead.reopenedDate) || "N/A"}</span>
          {lead.reopenedBy   && <span><strong>Reopened By:</strong>    {lead.reopenedBy}</span>}
          {lead.reopenReason && <span><strong>Reopen Reason:</strong>  {lead.reopenReason}</span>}
        </div>

        {/* Pre-reopen returns */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16, padding: "6px 10px", background: "#e0f2fe", borderLeft: "4px solid #0284c7", marginBottom: 4 }}>
            Pre-Reopen Returns ({preReopenReturns.length})
            <span style={{ fontWeight: 400, fontSize: 13, marginLeft: 10, color: "#555" }}>— returns that existed before the lead was reopened</span>
          </div>
          <table className={styles["leads-table"]}>
            <tbody>
              {preReopenReturns.length > 0 ? (
                preReopenReturns.map((returnItem, ri) => (
                  <ReturnItem key={returnItem._id || returnItem.leadReturnId || ri} returnItem={returnItem} />
                ))
              ) : (
                <tr><td colSpan={2} style={{ textAlign: "center", color: "#888" }}>No returns before reopen</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Post-reopen returns */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, padding: "6px 10px", background: "#dcfce7", borderLeft: "4px solid #16a34a", marginBottom: 4 }}>
            Post-Reopen Returns ({postReopenReturns.length})
            <span style={{ fontWeight: 400, fontSize: 13, marginLeft: 10, color: "#555" }}>— new returns added after the lead was reopened</span>
          </div>
          <table className={styles["leads-table"]}>
            <tbody>
              {postReopenReturns.length > 0 ? (
                postReopenReturns.map((returnItem, ri) => (
                  <ReturnItem key={returnItem._id || returnItem.leadReturnId || ri} returnItem={returnItem} />
                ))
              ) : (
                <tr><td colSpan={2} style={{ textAlign: "center", color: "#888" }}>No new returns after reopen</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
