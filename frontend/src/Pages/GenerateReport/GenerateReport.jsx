import { useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Pagination from "../../components/Pagination/Pagination";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import { CaseContext } from "../CaseContext";
import { useGenerateReport } from "./useGenerateReport";
import ReportControlsSection from "./ReportControlsSection";
import HierarchyChain from "./HierarchyChain";
import LeadCard from "./LeadCard";
import ReopenedLeadCard from "./ReopenedLeadCard";
import styles from "./GenerateReport.module.css";

export const GenerateReport = () => {
  const pdfRef = useRef();
  const navigate = useNavigate();
  const { selectedCase } = useContext(CaseContext);

  const {
    // data
    leadsData, hierarchyLeadsData, hierarchyChains, leadsLoading, leadsLoadingProgress, displayUser,
    // search / sort / filter
    searchTerm, setSearchTerm,
    leadSortOrder, setLeadSortOrder,
    selectedSubCategories, setSelectedSubCategories,
    subCategoryDropdownOpen, setSubCategoryDropdownOpen, subCategoryDropdownRef,
    // report targeting
    reportType, setReportType,
    setReportScope,
    selectedSingleLeadNo, setSelectedSingleLeadNo,
    selectStartLead1, setSelectStartLead1,
    selectEndLead2,   setSelectEndLead2,
    isGeneratingReport, reportProgress, cancelReport,
    // timeline & flags
    timelineEntries, timelineOrderedLeads,
    availableFlags, selectedFlags, setSelectedFlags,
    isMultiFlag, setIsMultiFlag,
    // executive summary
    summaryMode, setSummaryMode, typedSummary, setTypedSummary,
    // alert
    alertOpen, setAlertOpen, alertMessage, showAlert,
    // hierarchy ui
    hierarchyLeadInput, setHierarchyLeadInput,
    visibleChainsCount, setVisibleChainsCount,
    hierarchyOrder, setHierarchyOrder,
    // pagination
    currentPage, setCurrentPage, pageSize, setPageSize, totalEntries,
    // derived
    getReopenedLeads, getSingleLeadForReport, getLeadsForSelectedFlags,
    // handlers
    handleRunReportWithSummary, handleRunTimelineOnlyReport,
    handleRegenerateReport,
    handleSearch, handleShowSingleLead, handleShowHierarchy,
    handleShowAllLeads, handleShowLeadsInRange,
    handleExecSummaryFileChange, handleLeadCardClick,
  } = useGenerateReport(selectedCase);

  // ===== Leads display logic =====

  const allSubCategories = [...new Set(leadsData.flatMap((l) => l.subCategory || []))].sort();
  const baseLeads        = reportType === "reopened"
    ? getReopenedLeads()
    : reportType === "timeline" && timelineOrderedLeads.length > 0
      ? timelineOrderedLeads
      : (hierarchyLeadsData.length > 0 ? hierarchyLeadsData : leadsData);

  const timelineEntriesByLead = reportType === "timeline"
    ? timelineEntries.reduce((map, e) => {
        const key = String(e.leadNo ?? "");
        if (!key) return map;
        if (!map[key]) map[key] = [];
        map[key].push(e);
        return map;
      }, {})
    : null;

  // For the hierarchy report type use the hierarchy-specific order toggle;
  // everywhere else use the general leadSortOrder.
  const activeSortOrder =
    reportType === "hierarchy" && hierarchyLeadsData.length > 0
      ? hierarchyOrder
      : leadSortOrder;

  const displayLeads = [...baseLeads]
    .filter((lead) => {
      if (selectedSubCategories.length === 0) return true;
      const cats = lead.subCategory || [];
      return selectedSubCategories.every((sc) => cats.includes(sc));
    })
    .sort((a, b) =>
      activeSortOrder === "asc"
        ? Number(a.leadNo) - Number(b.leadNo)
        : Number(b.leadNo) - Number(a.leadNo)
    );

  const leadCardProps = { displayUser, handleLeadCardClick };

  return (
    <>
      {/* Leads-loading modal overlay */}
      {leadsLoading && (
        <div className={styles.reportModalOverlay}>
          <div className={styles.reportModalBox}>
            <div className={styles.reportModalHeader}>
              Loading Leads
              <button className={styles.reportModalCloseBtn} onClick={() => navigate(-1)} aria-label="Cancel loading">
                &times;
              </button>
            </div>
            <div className={styles.reportModalBody}>
              <p className={styles.reportModalMessage}>
                Please wait while leads are loading.
              </p>
              <div className={styles.reportModalProgressWrap}>
                <div className={styles.reportModalProgressBar}>
                  <div className={styles.reportModalProgressFill} style={{ width: `${leadsLoadingProgress}%` }} />
                </div>
                <span className={styles.reportModalPercent}>{Math.round(leadsLoadingProgress)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generating-report modal overlay */}
      {isGeneratingReport && (
        <div className={styles.reportModalOverlay}>
          <div className={styles.reportModalBox}>
            <div className={styles.reportModalHeader}>
              Generating Report
              <button className={styles.reportModalCloseBtn} onClick={cancelReport} aria-label="Cancel report">
                &times;
              </button>
            </div>
            <div className={styles.reportModalBody}>
              <p className={styles.reportModalMessage}>
                Your report is being compiled. Please remain on this page until the process is complete.
              </p>
              <div className={styles.reportModalProgressWrap}>
                <div className={styles.reportModalProgressBar}>
                  <div className={styles.reportModalProgressFill} style={{ width: `${reportProgress}%` }} />
                </div>
                <span className={styles.reportModalPercent}>{Math.round(reportProgress)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={pdfRef} className={styles["lead-desk-page"]}>
        <Navbar />

        <div className={styles["main-content-ld-ExecSummary"]}>
          <div className={styles["right-sec"]}>

            {/* Breadcrumb */}
            <div className={styles["ld-head"]}>
              <span
                className={styles.crumb}
                style={{ cursor: "pointer" }}
                onClick={() => (localStorage.getItem("systemRole") || localStorage.getItem("role")) === "Admin" ? navigate("/AdminTeam") : navigate("/HomePage")}
              >PIMS Home</span>
              <span className={styles.sep}>{" >> "}</span>
              <Link
                to={["Admin", "Case Manager", "Detective Supervisor"].includes(selectedCase?.role) ? "/CasePageManager" : "/Investigator"}
                state={{ caseDetails: selectedCase }}
                className={styles.crumb}
              >
                Case Page: {selectedCase?.caseNo || ""}: {selectedCase?.caseName || "Unknown Case"}
              </Link>
              <span className={styles.sep}>{" >> "}</span>
              <span className={styles["crumb-current"]} aria-current="page">Generate Report</span>
            </div>

            <div className={styles["down-content"]}>

              {/* Executive Summary side panel — only for "All leads" + "type" mode */}
              {reportType === "all" && summaryMode === "type" && (
                <div className={styles["exec-summary-sec"]}>
                  <h3 style={{ marginTop: 0 }}>Executive Summary</h3>
                  <textarea
                    className={styles["summary-input"]}
                    placeholder="Type your executive summary here… (auto-saved)"
                    value={typedSummary}
                    onChange={(e) => setTypedSummary(e.target.value)}
                  />
                </div>
              )}

              <div className={styles["left-content-execSummary"]}>
                <div className={styles["bottom-sec-ldExecSummary"]} id="main-content">

                  {/* ===== Report Controls ===== */}
                  <ReportControlsSection
                    reportType={reportType}          setReportType={setReportType}
                    summaryMode={summaryMode}         setSummaryMode={setSummaryMode}
                    handleExecSummaryFileChange={handleExecSummaryFileChange}
                    isGeneratingReport={isGeneratingReport}
                    handleRunReportWithSummary={handleRunReportWithSummary}
                    handleRegenerateReport={handleRegenerateReport}
                    setReportScope={setReportScope}
                    selectStartLead1={selectStartLead1} setSelectStartLead1={setSelectStartLead1}
                    selectEndLead2={selectEndLead2}     setSelectEndLead2={setSelectEndLead2}
                    selectedSingleLeadNo={selectedSingleLeadNo} setSelectedSingleLeadNo={setSelectedSingleLeadNo}
                    handleShowSingleLead={handleShowSingleLead}
                    setHierarchyLeadsData={() => {}} // handled internally via handleShowSingleLead
                    setHierarchyChains={() => {}}    // handled internally
                    getSingleLeadForReport={getSingleLeadForReport}
                    showAlert={showAlert}
                    availableFlags={availableFlags}
                    selectedFlags={selectedFlags}    setSelectedFlags={setSelectedFlags}
                    isMultiFlag={isMultiFlag}        setIsMultiFlag={setIsMultiFlag}
                    getLeadsForSelectedFlags={getLeadsForSelectedFlags}
                    leadsLoading={leadsLoading}
                    handleRunTimelineOnlyReport={handleRunTimelineOnlyReport}
                    timelineOrderedLeads={timelineOrderedLeads}
                    timelineEntries={timelineEntries}
                    selectedCase={selectedCase}
                    hierarchyLeadInput={hierarchyLeadInput} setHierarchyLeadInput={setHierarchyLeadInput}
                    handleShowHierarchy={handleShowHierarchy}
                    handleShowAllLeads={handleShowAllLeads}
                    hierarchyLeadsData={hierarchyLeadsData}
                    hierarchyOrder={hierarchyOrder} setHierarchyOrder={setHierarchyOrder}
                    handleShowLeadsInRange={handleShowLeadsInRange}
                    getReopenedLeads={getReopenedLeads}
                  />

                  {/* ===== Search bar ===== */}
                  <div className={styles["search-lead-portion"]}>
                    <div className={styles["search-lead-head"]}>
                      <label className={styles["input-label1"]}>Search Lead</label>
                    </div>
                    <div className={styles.search_and_hierarchy_container}>
                      <div className={styles["search-bar"]}>
                        <div className={styles["search-container1"]}>
                          <i className="fa-solid fa-magnifying-glass"></i>
                          <input
                            type="text"
                            className={styles["search-input1"]}
                            placeholder="Search Lead"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ===== Pagination ===== */}
                  <div className={styles["p-6"]}>
                    <Pagination
                      currentPage={currentPage}
                      totalEntries={totalEntries}
                      onPageChange={setCurrentPage}
                      pageSize={pageSize}
                      onPageSizeChange={setPageSize}
                    />
                  </div>

                  {/* ===== Sort / Filter toolbar ===== */}
                  <div className={styles["sort-bar"]}>
                    <span className={styles["sort-bar__label"]}>Sort by creation:</span>
                    <button
                      className={styles["sort-bar__btn"]}
                      onClick={() => setLeadSortOrder(leadSortOrder === "asc" ? "desc" : "asc")}
                    >
                      {leadSortOrder === "asc" ? "Oldest First ↑" : "Newest First ↓"}
                    </button>
                    <span className={styles["sort-bar__label"]}>Filter by subcategory:</span>
                    <div className={styles["subcat-dropdown"]} ref={subCategoryDropdownRef}>
                      <button
                        className={styles["subcat-dropdown__toggle"]}
                        onClick={() => setSubCategoryDropdownOpen((o) => !o)}
                      >
                        {selectedSubCategories.length === 0 ? "All subcategories" : selectedSubCategories.join(", ")}
                        {" ▾"}
                      </button>
                      {subCategoryDropdownOpen && (
                        <div className={styles["subcat-dropdown__menu"]}>
                          {allSubCategories.length === 0 ? (
                            <div className={styles["subcat-dropdown__empty"]}>No subcategories</div>
                          ) : (
                            <>
                              <label className={styles["subcat-dropdown__item"]}>
                                <input
                                  type="checkbox"
                                  checked={selectedSubCategories.length === 0}
                                  onChange={() => setSelectedSubCategories([])}
                                />
                                All
                              </label>
                              {allSubCategories.map((sc) => (
                                <label key={sc} className={styles["subcat-dropdown__item"]}>
                                  <input
                                    type="checkbox"
                                    checked={selectedSubCategories.includes(sc)}
                                    onChange={() =>
                                      setSelectedSubCategories((prev) =>
                                        prev.includes(sc) ? prev.filter((x) => x !== sc) : [...prev, sc]
                                      )
                                    }
                                  />
                                  {sc}
                                </label>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedSubCategories.length > 0 && (
                      <button
                        className={styles["subcat-clear-btn"]}
                        onClick={() => setSelectedSubCategories([])}
                      >
                        Clear filter
                      </button>
                    )}
                  </div>

                  {/* ===== Lead cards ===== */}
                  {hierarchyLeadsData.length > 0 && (
                    <div style={{ width: "100%", alignSelf: "flex-start", textAlign: "left" }}>
                      <h3 style={{ textAlign: "left" }}>Hierarchy for Lead {hierarchyLeadInput}:</h3>
                      {hierarchyChains.slice(0, visibleChainsCount).map((chain, idx) => (
                        <HierarchyChain key={idx} chain={chain} chainIndex={idx} />
                      ))}
                      <div style={{ marginTop: "10px", textAlign: "left" }}>
                        {visibleChainsCount < hierarchyChains.length && (
                          <button
                            className={styles["show-more-chains-btn"]}
                            onClick={() => setVisibleChainsCount((prev) => prev + 5)}
                            style={{ marginLeft: "-20px", color: "grey", background: "none", border: "none", cursor: "pointer" }}
                          >
                            Load More Chains
                          </button>
                        )}
                        {visibleChainsCount > 2 && (
                          <button
                            className={styles["show-more-chains-btn"]}
                            onClick={() => setVisibleChainsCount(2)}
                            style={{ marginLeft: "-20px", color: "grey", background: "none", border: "none", cursor: "pointer" }}
                          >
                            Load Less Chains
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {reportType === "reopened"
                    ? displayLeads.map((lead, i) => (
                        <ReopenedLeadCard key={lead.leadNo || i} lead={lead} {...leadCardProps} />
                      ))
                    : displayLeads.map((lead, i) => (
                        <LeadCard
                          key={lead.leadNo || i}
                          lead={lead}
                          {...leadCardProps}
                          leadTimelineEntries={
                            timelineEntriesByLead
                              ? (timelineEntriesByLead[String(lead.leadNo)] || [])
                              : undefined
                          }
                        />
                      ))
                  }

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertOpen}
        title="Alert"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
};
