import React, { useState } from "react";
import { formatDate, isDeletedStatus, isClosedStatus } from "./generateReportUtils";
import ReturnItem from "./ReturnItem";
import styles from "./GenerateReport.module.css";

const fmtEntryTime = (t) => {
  if (!t) return "";
  const dt = new Date(t);
  if (!isNaN(dt)) return dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return String(t);
};

export default function LeadCard({ lead, displayUser, handleLeadCardClick, leadTimelineEntries }) {
  const isDeleted     = isDeletedStatus(lead?.leadStatus);
  const isClosed      = isClosedStatus(lead?.leadStatus);
  const deletedReason = lead?.deletedReason || lead?.deletedReasonText || lead?.deleteReason || lead?.reason || "";
  const closedReason  = lead?.closedReason  || lead?.closeReason  || lead?.reason || "";

  const [tlSectionOpen,       setTlSectionOpen]       = useState(true);
  const [expandedDescs,       setExpandedDescs]        = useState(new Set());
  const [tlModalEntry,        setTlModalEntry]         = useState(null);

  const toggleDesc = (key) =>
    setExpandedDescs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const hasTimeline = Array.isArray(leadTimelineEntries) && leadTimelineEntries.length > 0;

  return (
    <>
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

          {/* Timeline entries — LeadsDesk style */}
          {hasTimeline && (
            <div className={styles["tl-person-section"]} onClick={(e) => e.stopPropagation()}>
              <h3
                className={styles["tl-collapsibleHeader"]}
                onClick={() => setTlSectionOpen((o) => !o)}
              >
                <span className={`${styles["tl-collapsibleChevron"]}${tlSectionOpen ? ` ${styles["tl-collapsibleChevronOpen"]}` : ""}`}>
                  ▶
                </span>
                Timeline Entries
              </h3>

              {tlSectionOpen && (
                <table className={styles["tl-lead-table2"]} style={{ width: "100%", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "6%"  }} />
                    <col style={{ width: "9%"  }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "9%"  }} />
                    <col style={{ width: "9%"  }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "31%" }} />
                    <col style={{ width: "8%"  }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Date</th>
                      <th>Entered By</th>
                      <th>Event Start</th>
                      <th>Event End</th>
                      <th>Location</th>
                      <th>Description</th>
                      <th>More</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadTimelineEntries.map((tl, i) => {
                      const descKey = `tl-${tl._id || i}`;
                      return (
                        <tr key={tl._id || i}>
                          <td>{tl.leadReturnId}</td>
                          <td>{formatDate(tl.enteredDate)}</td>
                          <td>{tl.enteredBy}</td>
                          <td>{formatDate(tl.eventStartDate || tl.eventDate)}</td>
                          <td>{formatDate(tl.eventEndDate)}</td>
                          <td>{tl.eventLocation}</td>
                          <td className={styles["tl-wrapDescCell"]}>
                            <div className={expandedDescs.has(descKey) ? styles["tl-descTextExpanded"] : styles["tl-descText"]}>
                              {tl.eventDescription}
                            </div>
                            {tl.eventDescription && (
                              <button
                                className={styles["tl-viewToggleBtn"]}
                                onClick={() => toggleDesc(descKey)}
                              >
                                {expandedDescs.has(descKey) ? "View Less ▲" : "View ▶"}
                              </button>
                            )}
                          </td>
                          <td>
                            <button
                              className={styles["tl-viewBtn"]}
                              onClick={() => setTlModalEntry(tl)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Timeline detail modal */}
      {tlModalEntry && (
        <div className={styles["tl-tlModalOverlay"]} onClick={() => setTlModalEntry(null)}>
          <div className={styles["tl-tlModalContent"]} onClick={(e) => e.stopPropagation()}>
            <button className={styles["tl-tlModalClose"]} onClick={() => setTlModalEntry(null)}>×</button>
            <h2>Timeline Entry Details</h2>
            <p><strong>Narrative Id:</strong> {tlModalEntry.leadReturnId}</p>

            <table className={styles["tl-tlGroupTable"]}>
              <thead><tr><th>Date Entered</th><th>Entered By</th></tr></thead>
              <tbody><tr>
                <td>{formatDate(tlModalEntry.enteredDate)}</td>
                <td>{tlModalEntry.enteredBy}</td>
              </tr></tbody>
            </table>

            <table className={styles["tl-tlGroupTable"]}>
              <thead><tr><th>Event Start Date</th><th>Event End Date</th></tr></thead>
              <tbody><tr>
                <td>{formatDate(tlModalEntry.eventStartDate || tlModalEntry.eventDate)}</td>
                <td>{formatDate(tlModalEntry.eventEndDate)}</td>
              </tr></tbody>
            </table>

            <table className={styles["tl-tlGroupTable"]}>
              <thead><tr><th>Start Time</th><th>End Time</th></tr></thead>
              <tbody><tr>
                <td>{fmtEntryTime(tlModalEntry.eventStartTime) || "—"}</td>
                <td>{fmtEntryTime(tlModalEntry.eventEndTime)   || "—"}</td>
              </tr></tbody>
            </table>

            <table className={styles["tl-tlGroupTable"]}>
              <thead><tr><th>Location</th></tr></thead>
              <tbody><tr><td>{tlModalEntry.eventLocation || "—"}</td></tr></tbody>
            </table>

            <table className={styles["tl-tlGroupTable"]}>
              <thead><tr><th>Description</th></tr></thead>
              <tbody><tr><td>{tlModalEntry.eventDescription || ""}</td></tr></tbody>
            </table>

            {Array.isArray(tlModalEntry.timelineFlag) && tlModalEntry.timelineFlag.filter(Boolean).length > 0 && (
              <table className={styles["tl-tlGroupTable"]}>
                <thead><tr><th>Flag</th></tr></thead>
                <tbody><tr><td>{tlModalEntry.timelineFlag.filter(Boolean).join(", ")}</td></tr></tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  );
}
