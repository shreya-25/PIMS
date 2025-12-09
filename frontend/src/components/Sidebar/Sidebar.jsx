// Sidebar.jsx
import React, { useContext, useState, useEffect, useMemo } from "react";
import "./Sidebar.css";
import { CaseContext } from "../../Pages/CaseContext";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api";

export const SideBar = ({
  cases: initialCases = [],
  activePage,
  activeTab,
  setActiveTab,
  onShowCaseSelector,
  variant = "default",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { caseDetails } = location.state || {};
  const { selectedCase, selectedLead, setSelectedLead, setSelectedCase } =
    useContext(CaseContext);

  const LEAD_CRUMB_PAGES = useMemo(
    () => new Set(["LeadReview", "LeadInformation"]),
    []
  );

  const signedInOfficer = localStorage.getItem("loggedInUser");
  const signedInRole = selectedCase?.role;

  const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
  const [caseList, setCaseList] = useState(initialCases);

  // Investigator-only: assigned leads for badge counts
  const [assignedLeadsList, setAssignedLeadsList] = useState([]);

  // CM/DS-only: per-case "In Review" counts for all ongoing cases
  const [reviewCountByCase, setReviewCountByCase] = useState({});

  const folderIcon  = `${process.env.PUBLIC_URL}/Materials/case1.png`;
  const folderIcon1 = `${process.env.PUBLIC_URL}/Materials/case.png`;
  const homeIcon    = `${process.env.PUBLIC_URL}/Materials/home.png`;
  const logIcon     = `${process.env.PUBLIC_URL}/Materials/log2.png`;
  const addIcon     = `${process.env.PUBLIC_URL}/Materials/addicon.svg`;
  const printIcon   = `${process.env.PUBLIC_URL}/Materials/print.png`;
  const bellIcon    = `${process.env.PUBLIC_URL}/Materials/notification.png`;
   const searchIcon    = `${process.env.PUBLIC_URL}/Materials/search1.png`;

  const handleCreateLead = () => {
    navigate("/createlead", {
      state: {
        caseDetails: selectedCase,
        leadOrigin: selectedLead?.leadNo || selectedLead?.id || null,
      },
    });
  };

  const goToCasePage = () => {
    const role = selectedCase?.role;
    const dest =
      role === "Investigator"
        ? "/Investigator"
        : role === "Case Manager" || role === "Detective Supervisor"
        ? "/CasePageManager"
        : "/HomePage";
    navigate(dest, { state: { caseDetails: selectedCase } });
  };

  // Fetch ONGOING cases for this officer
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}` },
          params: { officerName: signedInOfficer },
        });

        const ongoing = (data || [])
          .filter(
            (c) =>
              c.caseStatus === "Ongoing" &&
              c.assignedOfficers?.some((o) => o.name === signedInOfficer)
          )
          .map((c) => ({
            id: c.caseNo,
            title: c.caseName,
            role:
              c.assignedOfficers.find((o) => o.name === signedInOfficer)?.role ||
              "Unknown",
          }));

        setCaseList(ongoing);
      } catch (err) {
        console.error("Error fetching cases", err);
        setCaseList([]);
      }
    };
    fetchCases();
  }, [signedInOfficer]);

  // Investigator: fetch only leads Assigned to this user in ongoing cases
  useEffect(() => {
    if (!caseList.length) {
      setAssignedLeadsList([]);
      return;
    }
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/lead/assignedTo-leads", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const caseNos = new Set(caseList.map((c) => c.id));
        const filtered = (data || [])
          .filter(
            (l) =>
              caseNos.has(l.caseNo) &&
              l.leadStatus === "Assigned" &&
              l.assignedTo?.some((a) => a.username === signedInOfficer)
          )
          .map((l) => ({
            id: l.leadNo,
            description: l.description,
            caseNo: l.caseNo,
            assignedTo: l.assignedTo,
            leadStatus: l.leadStatus,
          }));

        setAssignedLeadsList(filtered);
      } catch (err) {
        console.error("Error fetching assigned leads", err);
        setAssignedLeadsList([]);
      }
    };
    fetchLeads();
  }, [signedInOfficer, caseList]);

  // CM/DS: get per-case count of "In Review" leads for ALL ongoing cases
  useEffect(() => {
    const isCMDS =
      signedInRole === "Case Manager" || signedInRole === "Detective Supervisor";
    if (!isCMDS || !caseList.length) {
      setReviewCountByCase({});
      return;
    }

    let cancelled = false;

    const fetchAllCounts = async () => {
      const token = localStorage.getItem("token");
      try {
        const entries = await Promise.all(
          caseList.map(async (c) => {
            try {
              // Prefer asking the server to filter by status if supported
              const { data } = await api.get(`/api/lead/case/${c.id}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { status: "In Review" },
              });

              const arr = Array.isArray(data?.leads)
                ? data.leads
                : Array.isArray(data)
                ? data
                : [];

              const count = arr.filter(
                (l) =>
                  String(l.caseNo) === String(c.id) &&
                  (l.leadStatus === "In Review" || l.status === "In Review")
              ).length;

              return [String(c.id), count];
            } catch (e) {
              return [String(c.id), 0];
            }
          })
        );

        if (!cancelled) setReviewCountByCase(Object.fromEntries(entries));
      } catch (e) {
        console.error("Error fetching In Review counts", e);
        if (!cancelled) setReviewCountByCase({});
      }
    };

    fetchAllCounts();
    return () => {
      cancelled = true;
    };
  }, [signedInRole, caseList]);

  // Build the badge map:
  // - Investigator -> count of "Assigned" per case from assignedLeadsList
  // - CM/DS       -> count of "In Review" per case from reviewCountByCase
  const badgeCountByCase = useMemo(() => {
    if (signedInRole === "Investigator") {
      return assignedLeadsList.reduce((acc, l) => {
        const cno = String(l.caseNo ?? "");
        if (!cno) return acc;
        if (l.leadStatus === "Assigned") {
          acc[cno] = (acc[cno] || 0) + 1;
        }
        return acc;
      }, {});
    }
    return reviewCountByCase;
  }, [signedInRole, assignedLeadsList, reviewCountByCase]);

  const getCaseBadgeCount = (caseId) =>
    badgeCountByCase[String(caseId)] || 0;

  const handleCaseSelect = (c) => {
    setSelectedCase({ caseNo: c.id, caseName: c.title, role: c.role });
    const dest = c.role === "Investigator" ? "/Investigator" : "/CasePageManager";
    navigate(dest, { state: { caseDetails: c } });
  };

  // Home variant (kept minimal)
  if (variant === "home") {
    return (
      <aside className="sidebar">
        <ul className="sidebar-list">
          <li
            className={`sidebar-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab?.("notifications")}
          >
            <img src={bellIcon} className="sidebar-icon" alt="" />
            <span>Notifications</span>
          </li>

          <li
            className={`sidebar-item ${["cases"].includes(activeTab) ? "active" : ""}`}
            onClick={() => setActiveTab?.("cases")}
          >
            <img src={folderIcon} className="sidebar-icon" alt="" />
            <span>Case Management</span>
          </li>

          <li
            className="sidebar-item"
            style={{ paddingLeft: 32 }}
            onClick={() => {
              setActiveTab?.("cases");
              onShowCaseSelector?.(true);
            }}
          >
            <img src={addIcon} className="sidebar-icon" alt="" />
            <span>Add Case</span>
          </li>
        </ul>
      </aside>
    );
  }

  // Default variant
  return (
    <aside className="sidebar">
      <ul className="sidebar-list">
        <li
          className={`sidebar-item ${activePage === "HomePage" ? "active" : ""}`}
          onClick={() => navigate("/HomePage", { state: { caseDetails } })}
        >
          <img src={homeIcon} className="sidebar-icon" alt="" />
          <span>PIMS Home</span>
        </li>

        <li
          className={`sidebar-item ${["CasePageManager", "Investigator"].includes(activePage) ? "active" : ""}`}
          onClick={goToCasePage}
        >
          <img src={folderIcon} className="sidebar-icon" alt="" />
          <span>Case: {selectedCase?.caseNo || "-"}</span>
        </li>

        {["Case Manager", "Detective Supervisor"].includes(selectedCase?.role) && (
          <li
            className={`sidebar-item ${activePage === "CreateLead" ? "active" : ""}`}
            style={{ paddingLeft: 30 }}
            onClick={handleCreateLead}
          >
            <img src={addIcon} className="sidebar-icon" alt="" />
            <span>Add Lead</span>
          </li>
        )}

        {selectedLead && LEAD_CRUMB_PAGES.has(activePage) && (
          <li
            className={`sidebar-item ${LEAD_CRUMB_PAGES.has(activePage) ? "active" : ""}`}
            style={{ paddingLeft: 30 }}
            onClick={() => {
              const dest = activePage === "LeadReview" ? "/LeadReview" : "/LeadInformation";
              navigate(dest, {
                state: { caseDetails: selectedCase, leadDetails: selectedLead },
              });
            }}
          >
            <img src={folderIcon1} className="sidebar-icon" alt="" />
            <span>Lead: {selectedLead?.leadNo || "-"}</span>
          </li>
        )}

        {/* Leads Desk with role-aware badge for current case */}
        <li
          className={`sidebar-item ${activePage === "LeadsDesk" ? "active" : ""}`}
          style={{ paddingLeft: 30, display: "flex", alignItems: "center", justifyContent: "space-between" }}
          onClick={() => navigate("/LeadsDesk", { state: { caseDetails } })}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={folderIcon1} className="sidebar-icon" alt="" />
            <span>Leads Desk</span>
          </div>
        </li>

        <li
          className={`sidebar-item ${activePage === "LeadsDeskTestExecSummary" ? "active" : ""}`}
          style={{ paddingLeft: 30 }}
          onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } })}
        >
          <img src={printIcon} className="sidebar-icon" alt="" />
          <span>Generate Report</span>
        </li>

        <li
          className={`sidebar-item ${activePage === "LeadLog" ? "active" : ""}`}
          style={{ paddingLeft: 30 }}
          onClick={() => navigate("/LeadLog", { state: { caseDetails } })}
        >
          <img src={logIcon} className="sidebar-icon" alt="" />
          <span>Case Log</span>
        </li>

        <li
          className={`sidebar-item ${activePage === "SearchLead" ? "active" : ""}`}
          onClick={() => navigate("/SearchLead", { state: { caseDetails } })}
        >
          <img src={searchIcon} className="sidebar-icon" alt="" />
          <span>Advanced Search </span>
        </li>

        {/* Other Ongoing Cases */}
        <li className="sidebar-item" onClick={() => setCaseDropdownOpen((o) => !o)}>
          <img src={folderIcon} className="sidebar-icon" alt="" />
          <span>Other Ongoing Cases {caseDropdownOpen ? "▲" : "▼"}</span>
        </li>

        {caseDropdownOpen && (
          <ul className="dropdown-list1">
            {caseList
              .filter((c) => c.id !== selectedCase?.caseNo)
              .map((c) => {
                const count = getCaseBadgeCount(c.id);
                const isActive = selectedCase?.caseNo === c.id;
                return (
                  <li
                    key={c.id}
                    className={`sidebar-item${isActive ? " active" : ""}`}
                    onClick={() => handleCaseSelect(c)}
                  >
                    <div className="case-headerSB">
                      <span>Case: {c.id}</span>
                      <span className="sidebar-number">{count}</span>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}

        {["Case Manager", "Detective Supervisor", "Investigator"].includes(selectedCase?.role) && (
          <li className="sidebar-item" onClick={() => navigate("/ClosedCase")}>
            <img src={folderIcon} className="sidebar-icon" alt="" />
            <span>Archived Cases</span>
          </li>
        )}

        {["Case Manager", "Detective Supervisor", "Investigator"].includes(selectedCase?.role) && (
          <li
            className={`sidebar-item ${activePage === "Chatbot" ? "active" : ""}`}
            onClick={() => navigate("/Chatbot", { state: { caseDetails } })}
          >
            <img src={folderIcon} className="sidebar-icon" alt="" />
            <span>Chatbot</span>
          </li>
        )}
         {["Case Manager", "Detective Supervisor", "Investigator"].includes(selectedCase?.role) && (
          <li
            className={`sidebar-item ${activePage === "AdminDashboard" ? "active" : ""}`}
            onClick={() => navigate("/AdminDashboard", { state: { caseDetails } })}
          >
            <img src={folderIcon} className="sidebar-icon" alt="" />
            <span>Crime Dashboard</span>
          </li>
        )}
         {["Case Manager", "Detective Supervisor", "Investigator"].includes(selectedCase?.role) && (
          <li
            className={`sidebar-item ${activePage === "ViewTimeline" ? "active" : ""}`}
            onClick={() => navigate("/ViewTimeline", { state: { caseDetails } })}
          >
            <img src={folderIcon} className="sidebar-icon" alt="" />
            <span>Timeline Enteries</span>
          </li>
        )}
      </ul>
    </aside>
  );
};
