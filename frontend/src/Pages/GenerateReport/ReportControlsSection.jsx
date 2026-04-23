import React from "react";
import CollapsibleSection from "./CollapsibleSection";
import FlagPicker from "./FlagPicker";
import styles from "./GenerateReport.module.css";

const REPORT_TYPES = [
  { value: "all",       label: "All leads"      },
  { value: "single",    label: "Single lead"    },
  { value: "selected",  label: "Selected leads" },
  { value: "hierarchy", label: "Lead hierarchy" },
  { value: "timeline",  label: "Timeline leads" },
  { value: "flagged",   label: "Flagged leads"  },
  { value: "reopened",  label: "Reopened leads" },
];

export default function ReportControlsSection({
  reportType, setReportType,
  summaryMode, setSummaryMode,
  handleExecSummaryFileChange,
  isGeneratingReport,
  handleRunReportWithSummary,
  handleRegenerateReport,
  setReportScope,
  // single lead
  selectStartLead1, setSelectStartLead1,
  selectEndLead2,   setSelectEndLead2,
  selectedSingleLeadNo, setSelectedSingleLeadNo,
  handleShowSingleLead,
  setHierarchyLeadsData, setHierarchyChains,
  getSingleLeadForReport,
  showAlert,
  // flagged
  availableFlags,
  selectedFlags, setSelectedFlags,
  isMultiFlag,   setIsMultiFlag,
  getLeadsForSelectedFlags,
  // timeline
  leadsLoading,
  handleRunTimelineOnlyReport,
  timelineOrderedLeads,
  selectedCase,
  // hierarchy
  hierarchyLeadInput, setHierarchyLeadInput,
  handleShowHierarchy,
  handleShowAllLeads,
  hierarchyLeadsData,
  hierarchyOrder, setHierarchyOrder,
  // selected range
  handleShowLeadsInRange,
  // reopened
  getReopenedLeads,
}) {
  return (
    <CollapsibleSection title="Generate Report" defaultOpen={true}>

      {/* Report type selector */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {REPORT_TYPES.map(({ value, label }) => (
          <label key={value} className={styles.summaryOption1}>
            <input
              type="checkbox"
              checked={reportType === value}
              onChange={() => setReportType(reportType === value ? null : value)}
            />
            <span className={styles.summaryOptionText1}>{label}</span>
          </label>
        ))}
      </div>

      {/* All leads */}
      {reportType === "all" && (
        <>
          <div className={styles.summaryModeRow1}>
            <label className={styles.summaryOption2}>
              <input type="radio" name="summary-mode" value="type" checked={summaryMode === "type"} onChange={() => setSummaryMode("type")} />
              <span className={styles.summaryOptionText2}>Type summary manually</span>
            </label>
            <label className={styles.summaryOption2}>
              <input type="radio" name="summary-mode" value="file" checked={summaryMode === "file"} onChange={() => setSummaryMode("file")} />
              <span className={styles.summaryOptionText2}>Attach executive report</span>
            </label>
          </div>

          {summaryMode === "file" && (
            <div style={{ marginBottom: 16 }}>
              <input type="file" accept=".doc,.docx,.pdf" onChange={handleExecSummaryFileChange} />
            </div>
          )}

          <div style={{ margin: "8px 0 0", display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className={`${styles.btn} ${styles["btn-primary"]}`}
              disabled={isGeneratingReport}
              onClick={() => { setReportScope("all"); handleRunReportWithSummary(); }}
            >
              {isGeneratingReport ? "Generating…" : "Run report"}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles["btn-secondary"]}`}
              disabled={isGeneratingReport}
              onClick={() => { setReportScope("all"); handleRegenerateReport(); }}
              title="Clear the cached report and generate a fresh one"
            >
              Regenerate
            </button>
          </div>
        </>
      )}

      {/* Single lead */}
      {reportType === "single" && (
        <>
          <div className={styles["range-filter"]}>
            <div className={styles["range-filter__label"]}>Select Lead</div>
            <div className={styles["range-filter__row"]}>
              <input
                id="single-lead"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles["range-filter__input"]}
                placeholder="Lead #"
                value={selectStartLead1}
                onChange={(e) => setSelectStartLead1(e.target.value)}
                aria-label="Lead number"
              />
              <div className={styles["range-filter__actions"]}>
                <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={handleShowSingleLead}>
                  Apply
                </button>
                <button
                  className={`${styles.btn} ${styles["btn-secondary"]}`}
                  onClick={() => { setSelectStartLead1(""); setHierarchyLeadsData([]); setHierarchyChains([]); setSelectedSingleLeadNo(""); }}
                >
                  Clear
                </button>
              </div>
              <span className={styles["range-filter__hint"]}>
                Type a lead number (e.g., 1234) and click Apply, or click a card below to select it.
              </span>
            </div>
          </div>

          <div style={{ margin: "8px 0 0", display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className={`${styles.btn} ${styles["btn-primary"]}`}
              onClick={() => {
                const lead = getSingleLeadForReport();
                if (!lead) { showAlert("Selected lead not found."); return; }
                handleRunReportWithSummary([lead]);
              }}
              disabled={!selectedSingleLeadNo || isGeneratingReport}
            >
              Run report
            </button>
          </div>
        </>
      )}

      {/* Flagged leads */}
      {reportType === "flagged" && (
        <>
          <div style={{ marginTop: 10, marginBottom: 6, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: "#1e293b" }}>Choose flag(s)</span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 18, color: "#1e293b" }}>
              <input
                type="checkbox"
                style={{ transform: "scale(1.3)", accentColor: "#2563eb", cursor: "pointer" }}
                checked={isMultiFlag}
                onChange={(e) => {
                  const next = e.target.checked;
                  setIsMultiFlag(next);
                  if (!next && selectedFlags.length > 1) setSelectedFlags([selectedFlags[selectedFlags.length - 1]]);
                }}
              />
              Allow multiple
            </label>
          </div>

          <div className={styles["fp-row"]}>
            <FlagPicker
              flags={availableFlags}
              selected={selectedFlags}
              onChange={setSelectedFlags}
              multiple={isMultiFlag}
              placeholder={availableFlags.length ? "Select timeline flags" : "No flags available"}
              disabled={!availableFlags.length}
            />
            <button
              type="button"
              className={`${styles.btn} ${styles["btn-secondary"]}`}
              onClick={() => setSelectedFlags([])}
              disabled={!selectedFlags.length}
            >
              Clear
            </button>
            <span className={styles["hierarchy-filter__hint"]}>
              Pick one or more flags. The report will include leads with at least one of the selected flags on a timeline entry.
            </span>
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className={`${styles.btn} ${styles["btn-primary"]}`}
              onClick={() => {
                const flaggedLeads = getLeadsForSelectedFlags();
                if (!flaggedLeads.length) { showAlert("No leads found with the selected flag(s)."); return; }
                handleRunReportWithSummary(flaggedLeads);
              }}
              disabled={!selectedFlags.length || isGeneratingReport}
            >
              Run report
            </button>
          </div>
        </>
      )}

      {/* Timeline leads */}
      {reportType === "timeline" && (
        <>
          <p className={styles["hierarchy-filter__hint"]} style={{ marginTop: 8 }}>
            Generate report in hierarchical order of <strong>timeline</strong> (oldest to newest).
          </p>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              className={`${styles.btn} ${styles["btn-primary"]}`}
              disabled={isGeneratingReport || !selectedCase?.caseNo}
              onClick={handleRunTimelineOnlyReport}
            >
              Run timeline-only report
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles["btn-primary"]}`}
              disabled={!timelineOrderedLeads.length || isGeneratingReport}
              onClick={() => { setReportScope("visible"); handleRunReportWithSummary(timelineOrderedLeads); }}
            >
              Run full report (ascending timeline order)
            </button>
            {!timelineOrderedLeads.length && (
              <div style={{ fontSize: 13, opacity: 0.8 }}>No timeline-linked leads found yet for this case.</div>
            )}
          </div>
        </>
      )}

      {/* Lead hierarchy */}
      {reportType === "hierarchy" && (
        <>
          <div className={styles["hierarchy-filter"]}>
            <div className={styles["hierarchy-filter__label"]}>Lead chain lookup</div>
            <form
              className={styles["hierarchy-filter__row"]}
              onSubmit={(e) => { e.preventDefault(); handleShowHierarchy(); }}
            >
              <input
                id="hierarchy-lead"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles["hierarchy-filter__input"]}
                placeholder="Lead # (e.g., 1234)"
                value={hierarchyLeadInput}
                onChange={(e) => setHierarchyLeadInput(e.target.value)}
                aria-label="Lead number"
              />
              <div className={styles["hierarchy-filter__actions"]}>
                <button type="submit" className={`${styles.btn} ${styles["btn-primary"]}`}>Show Hierarchy</button>
                <button type="button" className={`${styles.btn} ${styles["btn-secondary"]}`} onClick={handleShowAllLeads}>Clear</button>
                <span className={styles["hierarchy-filter__hint"]}>
                  Enter a lead number to view its parent/child chain of custody.
                </span>
              </div>
            </form>
          </div>

          {/* Order toggle */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Report order:</span>
            {[
              { value: "asc",  label: "Ascending (oldest → newest)" },
              { value: "desc", label: "Descending (newest → oldest)" },
            ].map(({ value, label }) => (
              <label key={value} className={styles.summaryOption2} style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  name="hierarchy-order"
                  value={value}
                  checked={hierarchyOrder === value}
                  onChange={() => setHierarchyOrder(value)}
                />
                <span className={styles.summaryOptionText2}>{label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className={`${styles.btn} ${styles["btn-primary"]}`}
              disabled={isGeneratingReport || !hierarchyLeadsData.length}
              onClick={() => {
                const sorted = [...hierarchyLeadsData].sort((a, b) =>
                  hierarchyOrder === "asc"
                    ? Number(a.leadNo) - Number(b.leadNo)
                    : Number(b.leadNo) - Number(a.leadNo)
                );
                setReportScope("visible");
                handleRunReportWithSummary(sorted);
              }}
            >
              Run report
            </button>
          </div>
        </>
      )}

      {/* Selected leads (range) */}
      {reportType === "selected" && (
        <>
          <div className={styles["range-filter"]}>
            <div className={styles["range-filter__label"]}>Lead range</div>
            <div className={styles["range-filter__row"]}>
              <input
                id="lead-range-from"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles["range-filter__input"]}
                placeholder="From lead #"
                value={selectStartLead1}
                onChange={(e) => setSelectStartLead1(e.target.value)}
                aria-label="From lead number"
              />
              <span className={styles["range-filter__sep"]}>—</span>
              <input
                id="lead-range-to"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles["range-filter__input"]}
                placeholder="To lead #"
                value={selectEndLead2}
                onChange={(e) => setSelectEndLead2(e.target.value)}
                aria-label="To lead number"
              />
              <div className={styles["range-filter__actions"]}>
                <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={handleShowLeadsInRange}>Apply</button>
                <button className={`${styles.btn} ${styles["btn-secondary"]}`} onClick={handleShowAllLeads}>Clear</button>
              </div>
              <span className={styles["range-filter__hint"]}>
                Enter a lead number range (e.g., 1200 — 1250) and click Apply.
              </span>
            </div>
          </div>

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className={`${styles.btn} ${styles["btn-primary"]}`}
              disabled={isGeneratingReport}
              onClick={() => { setReportScope("visible"); handleRunReportWithSummary(hierarchyLeadsData); }}
            >
              Run report
            </button>
          </div>
        </>
      )}

      {/* Reopened leads */}
      {reportType === "reopened" && (() => {
        const reopenedLeads = getReopenedLeads();
        return (
          <>
            <p className={styles["hierarchy-filter__hint"]} style={{ marginTop: 8 }}>
              Generate a report that includes <strong>only reopened leads</strong>. Each lead shows returns that existed
              before the reopen and any new returns added after the reopen.
              {reopenedLeads.length > 0
                ? <> <strong>{reopenedLeads.length}</strong> reopened lead{reopenedLeads.length !== 1 ? "s" : ""} found.</>
                : <> No reopened leads found for this case.</>}
            </p>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles["btn-primary"]}`}
                disabled={isGeneratingReport || !reopenedLeads.length}
                onClick={() => {
                  if (!reopenedLeads.length) { showAlert("No reopened leads found."); return; }
                  handleRunReportWithSummary(reopenedLeads);
                }}
              >
                Run reopened leads report
              </button>
            </div>
          </>
        );
      })()}

    </CollapsibleSection>
  );
}
