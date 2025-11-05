// Sidebar.jsx
import React, { useContext, useState, useEffect, useMemo } from "react";
import "./Sidebar.css";
import { CaseContext } from "../../Pages/CaseContext";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api";

export const SideBar = ({
  leads = {},
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

  const showLeadCrumbPages = new Set(["LeadReview", "LeadInformation"]); // add/remove pages here
const leadActivePages     = new Set(["LeadReview", "LeadInformation"]); // which pages should highlight it

  const {
    assignedLeads = [],
    pendingLeads = [],
    pendingLeadReturns = [],
    allLeads = [],
  } = leads;

  const signedInOfficer = localStorage.getItem("loggedInUser");
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [caseList, setCaseList] = useState(initialCases);
  const [assignedLeadsList, setAssignedLeadsList] = useState([]);

  const [closedCaseList, setClosedCaseList] = useState([]);
  const [closedDropdownOpen, setClosedDropdownOpen] = useState(false);


  const folderIcon = `${process.env.PUBLIC_URL}/Materials/case1.png`;
  const folderIcon1 = `${process.env.PUBLIC_URL}/Materials/case.png`;
  const homeIcon = `${process.env.PUBLIC_URL}/Materials/home.png`;
  const logIcon = `${process.env.PUBLIC_URL}/Materials/log2.png`;
  const addIcon = `${process.env.PUBLIC_URL}/Materials/addicon.svg`;
  const printIcon = `${process.env.PUBLIC_URL}/Materials/print.png`;
  const bellIcon = `${process.env.PUBLIC_URL}/Materials/notification.png`;

  const handleCreateLead = () => {
    navigate("/createlead", {
      state: {
        caseDetails: selectedCase,
        leadOrigin: selectedLead?.leadNo || selectedLead?.id || null,
      },
    });
  };

  useEffect(() => {
  const fetchClosedCases = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/api/cases", {
        headers: { Authorization: `Bearer ${token}` },
        params: { officerName: signedInOfficer },
      });

      // Only cases where this officer is assigned AND their role is CM or DS
      const closed = data
        .filter(
          (c) =>
            c.caseStatus === "Completed" &&
            c.assignedOfficers.some((o) => o.name === signedInOfficer) &&
            ["Case Manager", "Detective Supervisor"].includes(
              c.assignedOfficers.find((o) => o.name === signedInOfficer)?.role
            )
        )
        .map((c) => ({
          id: c.caseNo,
          title: c.caseName,
          role:
            c.assignedOfficers.find((o) => o.name === signedInOfficer)?.role ||
            "Unknown",
        }));

      setClosedCaseList(closed);
    } catch (err) {
      console.error("Error fetching closed cases", err);
      setClosedCaseList([]);
    }
  };

  fetchClosedCases();
}, [signedInOfficer]);


  const goToCasePage = () => {
    const { role } = selectedCase || {};
    const dest =
      role === "Investigator"
        ? "/Investigator"
        : role === "Case Manager" || role === "Detective Supervisor"
        ? "/CasePageManager"
        : "/HomePage";
    navigate(dest, { state: { caseDetails: selectedCase } });
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");
      try {
        const resp = await api.get(
          `/api/notifications/unread/user/${signedInOfficer}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = Array.isArray(resp.data)
          ? resp.data
          : Array.isArray(resp.data?.notifications)
          ? resp.data.notifications
          : [];
        setNotifications(list);
      } catch (e) {
        console.error(e);
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, [signedInOfficer]);

  const notificationsByCase = useMemo(() => {
    if (!Array.isArray(notifications)) return {};
    return notifications.reduce((acc, note) => {
      const key = String(note.caseNo);
      (acc[key] ||= []).push(note);
      return acc;
    }, {});
  }, [notifications]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}` },
          params: { officerName: signedInOfficer },
        });

        const ongoing = data
          .filter(
            (c) =>
              c.caseStatus === "Ongoing" &&
              c.assignedOfficers.some((o) => o.name === signedInOfficer)
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
      }
    };
    fetchCases();
  }, [signedInOfficer]);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/lead/assignedTo-leads", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const caseNos = new Set(caseList.map((c) => c.id));
        const filtered = data
          .filter(
            (l) =>
              caseNos.has(l.caseNo) &&
              l.leadStatus === "Assigned" &&
              l.assignedTo.some((a) => a.username === signedInOfficer)
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
      }
    };
    if (caseList.length) fetchLeads();
  }, [signedInOfficer, caseList]);

  const leadsByCase = assignedLeadsList.reduce((acc, lead) => {
    (acc[lead.caseNo] ||= []).push(lead);
    return acc;
  }, {});

  const handleCaseSelect = (c) => {
    setSelectedCase({ caseNo: c.id, caseName: c.title, role: c.role });
    const dest = c.role === "Investigator" ? "/Investigator" : "/CasePageManager";
    navigate(dest, { state: { caseDetails: c } });
  };

  const handleLeadSelect = (lead) => {
    setSelectedLead(lead);
    navigate("/LeadReview", {
      state: { caseDetails: selectedCase, leadDetails: lead },
    });
  };

  /* ---- Home variant ---- */
  if (variant === "home") {
    return (
      <aside className="sidebar">
        <ul className="sidebar-list">
          <li
            className={`sidebar-item ${
              activeTab === "notifications" ? "active" : ""
            }`}
            onClick={() => setActiveTab?.("notifications")}
          >
            <img src={bellIcon} className="sidebar-icon" alt="" />
            <span>Notifications</span>
          </li>

          <li
            className={`sidebar-item ${
              ["cases", "assignedLeads", "pendingLeadReturns"].includes(activeTab)
                ? "active"
                : ""
            }`}
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

  /* ---- Default (case pages, etc.) ---- */
  return (
    <aside className="sidebar">
      <ul className="sidebar-list">
        <li
          className={`sidebar-item ${
            activePage === "HomePage" ? "active" : ""
          }`}
          onClick={() => navigate("/HomePage", { state: { caseDetails } })}
        >
          <img src={homeIcon} className="sidebar-icon" alt="" />
          <span>PIMS Home</span>
        </li>

        

        <li
          className={`sidebar-item ${
            ["CasePageManager", "Investigator"].includes(activePage)
              ? "active"
              : ""
          }`}
          onClick={goToCasePage}
        >
          <img src={folderIcon} className="sidebar-icon" alt="" />
          <span>Case: {selectedCase?.caseNo || "-"}</span>
        </li>

        {["Case Manager", "Detective Supervisor"].includes(
          selectedCase?.role
        ) && (
          <li
            className={`sidebar-item ${
              activePage === "CreateLead" ? "active" : ""
            }`}
            style={{ paddingLeft: 30 }}
            onClick={handleCreateLead}
          >
            <img src={addIcon} className="sidebar-icon" alt="" />
            <span>Add Lead</span>
          </li>
        )}

        {selectedLead && showLeadCrumbPages.has(activePage) && (
  <li
    className={`sidebar-item ${leadActivePages.has(activePage) ? "active" : ""}`}
    style={{ paddingLeft: 30 }}
    onClick={() => {
      const dest =
        activePage === "LeadReview" ? "/LeadReview" : "/LeadInformation";
      navigate(dest, {
        state: { caseDetails: selectedCase, leadDetails: selectedLead },
      });
    }}
  >
    <img src={folderIcon1} className="sidebar-icon" alt="" />
    <span>Lead: {selectedLead?.leadNo || "-"}</span>
  </li>
)}



        <li
          className={`sidebar-item ${
            activePage === "LeadsDesk" ? "active" : ""
          }`}
          style={{ paddingLeft: 30 }}
          onClick={() => navigate("/LeadsDesk", { state: { caseDetails } })}
        >
          <img src={folderIcon1} className="sidebar-icon" alt="" />
          <span>Leads Desk</span>
        </li>

        <li
          className={`sidebar-item ${
            activePage === "LeadsDeskTestExecSummary" ? "active" : ""
          }`}
          style={{ paddingLeft: 30 }}
          onClick={() =>
            navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } })
          }
        >
          <img src={printIcon} className="sidebar-icon" alt="" />
          <span>Generate Report</span>
        </li>

        <li
          className={`sidebar-item ${
            activePage === "LeadLog" ? "active" : ""
          }`}
          style={{ paddingLeft: 30 }}
          onClick={() => navigate("/LeadLog", { state: { caseDetails } })}
        >
          <img src={logIcon} className="sidebar-icon" alt="" />
          <span>Case Log</span>
        </li>

        {/* Other Ongoing Cases */}
        <li
          className="sidebar-item"
          onClick={() => setCaseDropdownOpen((o) => !o)}
        >
          <img src={folderIcon} className="sidebar-icon" alt="" />
          <span>Other Ongoing Cases {caseDropdownOpen ? "▲" : "▼"}</span>
        </li>

        {caseDropdownOpen && (
          <ul className="dropdown-list1">
            {caseList
              .filter((c) => c.id !== selectedCase?.caseNo)
              .map((c) => {
                const count = notificationsByCase[String(c.id)]?.length || 0;
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

        {/* Closed Cases for CM/DS */}
{["Case Manager", "Detective Supervisor", "Investigator"].includes(selectedCase?.role) && (
  <>
    <li
      className="sidebar-item"
       onClick={() =>
            navigate("/ClosedCase")
          }
    >
      <img src={folderIcon} className="sidebar-icon" alt="" />
      <span>Archived Cases</span>
    </li>
  </>
)}

      </ul>
    </aside>
  );
};
