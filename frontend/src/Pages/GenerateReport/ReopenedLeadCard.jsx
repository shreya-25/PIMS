import React from "react";
import { formatDate, isDeletedStatus, isClosedStatus, lrKeyFor } from "./generateReportUtils";
import ReturnItem from "./ReturnItem";
import styles from "./GenerateReport.module.css";

function SubSection({ title, items, headers, renderRow, accent = "#16a34a", bg = "#f0fdf4", headBg = "#dcfce7", cellBorder = "#d1fae5", headBorder = "#bbf7d0", stripeBg = "#f0fdf4" }) {
  if (!items.length) return null;
  const CELL = { padding: "5px 8px", border: `1px solid ${cellBorder}`, verticalAlign: "top", fontSize: 14 };
  const HEAD = { padding: "5px 8px", border: `1px solid ${headBorder}`, textAlign: "left", fontWeight: 600, fontSize: 14, background: headBg };
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 14, padding: "3px 8px", background: bg, borderLeft: `3px solid ${accent}`, marginBottom: 3 }}>
        {title} ({items.length})
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{headers.map((h) => <th key={h} style={HEAD}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item._id || i} style={{ background: i % 2 === 0 ? "#fff" : stripeBg }}>
              {renderRow(item).map((cell, j) => <td key={j} style={CELL}>{cell || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

  // Post-reopen sub-items: filter every section by createdAt > reopenedDate
  const reopenedAt = lead.reopenedDate ? new Date(lead.reopenedDate).getTime() : null;
  const isAfterReopen = (item) => {
    if (!reopenedAt) return false;
    return new Date(item.createdAt || item.enteredDate || 0).getTime() > reopenedAt;
  };

  const allReturns    = lead.leadReturns || [];
  const tag           = (r) => (x) => ({ ...x, _retId: r.leadReturnId });

  const isBeforeReopen = (item) => !isAfterReopen(item);

  const postPersons    = allReturns.flatMap((r) => (r.persons    || []).filter(isAfterReopen).map(tag(r)));
  const postVehicles   = allReturns.flatMap((r) => (r.vehicles   || []).filter(isAfterReopen).map(tag(r)));
  const postEnclosures = allReturns.flatMap((r) => (r.enclosures || []).filter(isAfterReopen).map(tag(r)));
  const postEvidence   = allReturns.flatMap((r) => (r.evidence   || []).filter(isAfterReopen).map(tag(r)));
  const postPictures   = allReturns.flatMap((r) => (r.pictures   || []).filter(isAfterReopen).map(tag(r)));
  const postAudio      = allReturns.flatMap((r) => (r.audio      || []).filter(isAfterReopen).map(tag(r)));
  const postVideos     = allReturns.flatMap((r) => (r.videos     || []).filter(isAfterReopen).map(tag(r)));
  const postNotes      = allReturns.flatMap((r) => (r.scratchpad || []).filter(isAfterReopen).map(tag(r)));
  const postTimeline   = allReturns.flatMap((r) => (r.timeline   || []).filter(isAfterReopen).map(tag(r)));

  const prePersons    = allReturns.flatMap((r) => (r.persons    || []).filter(isBeforeReopen).map(tag(r)));
  const preVehicles   = allReturns.flatMap((r) => (r.vehicles   || []).filter(isBeforeReopen).map(tag(r)));
  const preEnclosures = allReturns.flatMap((r) => (r.enclosures || []).filter(isBeforeReopen).map(tag(r)));
  const preEvidence   = allReturns.flatMap((r) => (r.evidence   || []).filter(isBeforeReopen).map(tag(r)));
  const prePictures   = allReturns.flatMap((r) => (r.pictures   || []).filter(isBeforeReopen).map(tag(r)));
  const preAudio      = allReturns.flatMap((r) => (r.audio      || []).filter(isBeforeReopen).map(tag(r)));
  const preVideos     = allReturns.flatMap((r) => (r.videos     || []).filter(isBeforeReopen).map(tag(r)));
  const preNotes      = allReturns.flatMap((r) => (r.scratchpad || []).filter(isBeforeReopen).map(tag(r)));
  const preTimeline   = allReturns.flatMap((r) => (r.timeline   || []).filter(isBeforeReopen).map(tag(r)));

  const totalPostChanges =
    postReopenReturns.length + postPersons.length + postVehicles.length +
    postEnclosures.length + postEvidence.length + postPictures.length +
    postAudio.length + postVideos.length + postNotes.length + postTimeline.length;

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
                <td style={{ textAlign: "center", fontSize: "18px" }} className={styles["label-cell"]}>Deleted Reason</td>
                <td><input type="text" value={deletedReason || "N/A"} readOnly className={styles["instruction-input"]} /></td>
              </tr>
            )}
            {isClosed && (
              <tr className={styles["closed-row"]}>
                <td style={{ textAlign: "center", fontSize: "18px" }} className={styles["label-cell"]}>Closed Reason</td>
                <td><input type="text" value={closedReason || "N/A"} readOnly className={styles["instruction-input"]} /></td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Reopen metadata banner */}
        <div style={{ margin: "10px 0", padding: "10px 14px", background: "#fff7ed", border: "1px solid #fb923c", borderRadius: 6, fontSize: 15, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <span><strong>Status:</strong> {lead.leadStatus || "N/A"}</span>
          <span><strong>Reopened Date:</strong> {formatDate(lead.reopenedDate) || "N/A"}</span>
          {lead.reopenedBy   && <span><strong>Reopened By:</strong>   {lead.reopenedBy}</span>}
          {lead.reopenReason && <span><strong>Reopen Reason:</strong> {lead.reopenReason}</span>}
        </div>

        {/* Pre-Reopen Returns */}
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

          {/* Pre-reopen sub-items */}
          {[prePersons, preVehicles, preEnclosures, preEvidence, prePictures, preAudio, preVideos, preNotes, preTimeline].some(a => a.length > 0) && (
            <div style={{ marginTop: 8 }}>
              <SubSection title="Persons"    items={prePersons}    headers={["Return ID","Name","Type","Entered By","Date"]}               accent="#0284c7" bg="#f0f9ff" headBg="#e0f2fe" cellBorder="#bae6fd" headBorder="#7dd3fc" stripeBg="#f0f9ff" renderRow={(p) => [p._retId, [p.lastName, p.firstName].filter(Boolean).join(", "), p.personType, p.enteredBy, formatDate(p.enteredDate)]} />
              <SubSection title="Vehicles"   items={preVehicles}   headers={["Return ID","Year / Make / Model","Plate","Entered By","Date"]} accent="#0284c7" bg="#f0f9ff" headBg="#e0f2fe" cellBorder="#bae6fd" headBorder="#7dd3fc" stripeBg="#f0f9ff" renderRow={(v) => [v._retId, [v.year, v.make, v.model].filter(Boolean).join(" "), v.plate, v.enteredBy, formatDate(v.enteredDate)]} />
              <SubSection title="Enclosures" items={preEnclosures} headers={["Return ID","Type","Description","Entered By","Date"]}          accent="#0284c7" bg="#f0f9ff" headBg="#e0f2fe" cellBorder="#bae6fd" headBorder="#7dd3fc" stripeBg="#f0f9ff" renderRow={(e) => [e._retId, e.type, e.enclosureDescription, e.enteredBy, formatDate(e.enteredDate)]} />
              <SubSection title="Evidence"   items={preEvidence}   headers={["Return ID","Description","Collected","Entered By","Date"]}     accent="#0284c7" bg="#f0f9ff" headBg="#e0f2fe" cellBorder="#bae6fd" headBorder="#7dd3fc" stripeBg="#f0f9ff" renderRow={(e) => [e._retId, e.evidenceDescription, formatDate(e.collectionDate), e.enteredBy, formatDate(e.enteredDate)]} />
              <SubSection title="Pictures"   items={prePictures}   headers={["Return ID","Filename","Entered By","Date"]}                    accent="#0284c7" bg="#f0f9ff" headBg="#e0f2fe" cellBorder="#bae6fd" headBorder="#7dd3fc" stripeBg="#f0f9ff" renderRow={(p) => [p._retId, p.originalName || p.filename, p.enteredBy, formatDate(p.enteredDate)]} />
              <SubSection title="Audio"      items={preAudio}      headers={["Return ID","Description","Filename","Entered By","Date"]}      accent="#0284c7" bg="#f0f9ff" headBg="#e0f2fe" cellBorder="#bae6fd" headBorder="#7dd3fc" stripeBg="#f0f9ff" renderRow={(a) => [a._retId, a.audioDescription, a.filename, a.enteredBy, formatDate(a.enteredDate)]} />
              <SubSection title="Videos"     items={preVideos}     headers={["Return ID","Description","Filename","Entered By","Date"]}      accent="#0284c7" bg="#f0f9ff" headBg="#e0f2fe" cellBorder="#bae6fd" headBorder="#7dd3fc" stripeBg="#f0f9ff" renderRow={(v) => [v._retId, v.videoDescription, v.filename, v.enteredBy, formatDate(v.enteredDate)]} />
              <SubSection title="Notes"      items={preNotes}      headers={["Return ID","Note","Entered By","Date"]}                        accent="#0284c7" bg="#f0f9ff" headBg="#e0f2fe" cellBorder="#bae6fd" headBorder="#7dd3fc" stripeBg="#f0f9ff" renderRow={(n) => [n._retId, n.text, n.enteredBy, formatDate(n.enteredDate)]} />
              <SubSection title="Timeline Entries" items={preTimeline} headers={["Return ID","Event Date","Description","Location","Entered By"]} accent="#0284c7" bg="#f0f9ff" headBg="#e0f2fe" cellBorder="#bae6fd" headBorder="#7dd3fc" stripeBg="#f0f9ff" renderRow={(t) => [t._retId, formatDate(t.eventStartDate || t.eventDate), t.eventDescription, t.eventLocation, t.enteredBy]} />
            </div>
          )}
        </div>

        {/* Post-Reopen Changes */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, padding: "6px 10px", background: "#dcfce7", borderLeft: "4px solid #16a34a", marginBottom: 8 }}>
            Post-Reopen Changes ({totalPostChanges})
            <span style={{ fontWeight: 400, fontSize: 13, marginLeft: 10, color: "#555" }}>— additions after the lead was reopened</span>
          </div>

          {/* New narrative returns */}
          {postReopenReturns.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#166534", padding: "3px 8px", background: "#f0fdf4", borderLeft: "3px solid #16a34a", marginBottom: 3 }}>
                New Returns ({postReopenReturns.length})
              </div>
              <table className={styles["leads-table"]}>
                <tbody>
                  {postReopenReturns.map((ret, ri) => (
                    <ReturnItem key={ret._id || ret.leadReturnId || ri} returnItem={ret} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <SubSection
            title="Persons"
            items={postPersons}
            headers={["Return ID", "Name", "Type", "Entered By", "Date"]}
            renderRow={(p) => [
              p._retId,
              [p.lastName, p.firstName].filter(Boolean).join(", "),
              p.personType,
              p.enteredBy,
              formatDate(p.enteredDate),
            ]}
          />

          <SubSection
            title="Vehicles"
            items={postVehicles}
            headers={["Return ID", "Year / Make / Model", "Plate", "Entered By", "Date"]}
            renderRow={(v) => [
              v._retId,
              [v.year, v.make, v.model].filter(Boolean).join(" "),
              v.plate,
              v.enteredBy,
              formatDate(v.enteredDate),
            ]}
          />

          <SubSection
            title="Enclosures"
            items={postEnclosures}
            headers={["Return ID", "Type", "Description", "Entered By", "Date"]}
            renderRow={(e) => [
              e._retId,
              e.type,
              e.enclosureDescription,
              e.enteredBy,
              formatDate(e.enteredDate),
            ]}
          />

          <SubSection
            title="Evidence"
            items={postEvidence}
            headers={["Return ID", "Description", "Collected", "Entered By", "Date"]}
            renderRow={(e) => [
              e._retId,
              e.evidenceDescription,
              formatDate(e.collectionDate),
              e.enteredBy,
              formatDate(e.enteredDate),
            ]}
          />

          <SubSection
            title="Pictures"
            items={postPictures}
            headers={["Return ID", "Filename", "Entered By", "Date"]}
            renderRow={(p) => [
              p._retId,
              p.originalName || p.filename,
              p.enteredBy,
              formatDate(p.enteredDate),
            ]}
          />

          <SubSection
            title="Audio"
            items={postAudio}
            headers={["Return ID", "Description", "Filename", "Entered By", "Date"]}
            renderRow={(a) => [
              a._retId,
              a.audioDescription,
              a.filename,
              a.enteredBy,
              formatDate(a.enteredDate),
            ]}
          />

          <SubSection
            title="Videos"
            items={postVideos}
            headers={["Return ID", "Description", "Filename", "Entered By", "Date"]}
            renderRow={(v) => [
              v._retId,
              v.videoDescription,
              v.filename,
              v.enteredBy,
              formatDate(v.enteredDate),
            ]}
          />

          <SubSection
            title="Notes"
            items={postNotes}
            headers={["Return ID", "Note", "Entered By", "Date"]}
            renderRow={(n) => [
              n._retId,
              n.text,
              n.enteredBy,
              formatDate(n.enteredDate),
            ]}
          />

          <SubSection
            title="Timeline Entries"
            items={postTimeline}
            headers={["Return ID", "Event Date", "Description", "Location", "Entered By"]}
            renderRow={(t) => [
              t._retId,
              formatDate(t.eventStartDate || t.eventDate),
              t.eventDescription,
              t.eventLocation,
              t.enteredBy,
            ]}
          />

          {totalPostChanges === 0 && (
            <div style={{ textAlign: "center", color: "#888", padding: "8px 12px", fontSize: 14 }}>
              No changes after reopen
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
