import React, { useState, useEffect, useContext, useCallback } from "react";
import { CaseContext } from "../../Pages/CaseContext";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./NotificationCard.css";

const NotificationCard1 = ({ signedInOfficer }) => {
  const [newNotifs,    setNewNotifs]    = useState([]);
  const [openNotifs,   setOpenNotifs]   = useState([]);
  const [showAll,      setShowAll]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [collapsedAll, setCollapsedAll] = useState(false);
  const [navigating,   setNavigating]   = useState(null); // _id being navigated

  const { setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const navigate = useNavigate();

  const downArrow = `${process.env.PUBLIC_URL}/Materials/down_arrow.png`;
  const upArrow   = `${process.env.PUBLIC_URL}/Materials/up_arrow.png`;

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchNewOnly = useCallback(async () => {
    const { data } = await api.get(`/api/notifications/user/${signedInOfficer}`);
    return data
      .filter(n =>
        (n.type === "Case" || n.type === "Lead") &&
        n.caseStatus === "Open" &&
        n.assignedTo.some(r =>
          r.username === signedInOfficer &&
          r.status === "pending" &&
          r.unread === true
        )
      )
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [signedInOfficer]);

  const fetchOpenOnly = useCallback(async () => {
    const { data } = await api.get(`/api/notifications/open/user/${signedInOfficer}`);
    return data
      .filter(n => n.caseStatus === "Open")
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [signedInOfficer]);

  // ── Polling (15 s) ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!signedInOfficer) return;

    const poll = async () => {
      try {
        const [freshNew, freshOpen] = await Promise.all([fetchNewOnly(), fetchOpenOnly()]);
        setNewNotifs(prev =>
          JSON.stringify(prev) !== JSON.stringify(freshNew) ? freshNew : prev
        );
        setOpenNotifs(prev =>
          JSON.stringify(prev) !== JSON.stringify(freshOpen) ? freshOpen : prev
        );
      } catch (e) {
        setError(e.message || "Failed to load notifications");
      }
    };

    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [signedInOfficer, fetchNewOnly, fetchOpenOnly]);

  // ── Type badge ─────────────────────────────────────────────────────────────

  const getType = n => {
    if (n.type === "Case")       return { letter: "C",  color: "#2563eb" };
    if (n.type === "Lead")       return { letter: "L",  color: "#16a34a" };
    if (n.type === "LeadReturn") return { letter: "LR", color: "#dc2626" };
    return { letter: "?", color: "#6b7280" };
  };

  // ── View handler ───────────────────────────────────────────────────────────

  const handleView = async _id => {
    const n = newNotifs.find(x => x._id === _id) || openNotifs.find(x => x._id === _id);
    if (!n) return;

    const myAss = n.assignedTo.find(r => r.username === signedInOfficer);
    if (!myAss) return;

    setNavigating(_id);
    try {
      // 1. Mark as read (treat missing unread field as unread=true for legacy docs)
      if (myAss.unread !== false) {
        await api.put(`/api/notifications/mark-read/${n.notificationId}`, {
          username: signedInOfficer,
        });
        // Remove from New Notifications
        setNewNotifs(prev => prev.filter(x => x._id !== _id));
        // Mark as read in All Notifications without waiting for next poll
        setOpenNotifs(prev =>
          prev.map(x =>
            x._id === _id
              ? {
                  ...x,
                  assignedTo: x.assignedTo.map(r =>
                    r.username === signedInOfficer ? { ...r, unread: false } : r
                  ),
                }
              : x
          )
        );
      }

      // 2. Fetch full case by caseId (ObjectId)
      let fullCase = { caseNo: n.caseNo, caseName: n.caseName, role: myAss.role };
      if (n.caseId) {
        try {
          const { data } = await api.get(`/api/cases/${n.caseId}`);
          if (data) fullCase = { ...data, role: myAss.role };
        } catch (e) {
          console.error("Could not fetch full case:", e.message);
        }
      }

      // Persist case to both storages + context
      setSelectedCase(fullCase);
      sessionStorage.setItem("selectedCase", JSON.stringify(fullCase));
      localStorage.setItem("selectedCase", JSON.stringify(fullCase));

      // 3. Fetch full lead using caseId (ObjectId) — use leadNo+caseId to avoid
      //    brittle name-matching (notification.leadName may differ from lead.description)
      const caseId = fullCase._id || fullCase.id;
      let fullLead = { leadNo: n.leadNo, leadName: n.leadName };
      if (n.leadNo && caseId) {
        try {
          const { data } = await api.get(`/api/lead/lead/${n.leadNo}/${caseId}`);
          const hit = Array.isArray(data) ? data[0] : data;
          if (hit) {
            // Normalize: pages use `leadName`, but the Lead model stores it in `description`
            fullLead = { ...hit, leadName: hit.leadName || hit.description || n.leadName };
          }
        } catch (e) {
          console.error("Could not fetch full lead:", e.message);
        }
      }

      // Persist lead to both storages + context
      setSelectedLead(fullLead);
      sessionStorage.setItem("selectedLead", JSON.stringify(fullLead));
      localStorage.setItem("selectedLead", JSON.stringify(fullLead));

      // 4. Navigate to appropriate page
      const action = (n.action1 || "").toLowerCase();
      if (action.includes("case")) {
        const dest = (myAss.role === "Case Manager" || myAss.role === "Detective Supervisor")
          ? "/CasePageManager"
          : "/Investigator";
        navigate(dest, { state: { caseDetails: fullCase } });
      } else if (action.includes("lead")) {
        navigate("/LeadReview", { state: { caseDetails: fullCase, leadDetails: fullLead } });
      } else {
        navigate("/LRInstruction", { state: { caseDetails: fullCase, leadDetails: fullLead } });
      }
    } catch (e) {
      console.error("Notification view failed:", e.message);
    } finally {
      setNavigating(null);
    }
  };

  // ── Card renderer ──────────────────────────────────────────────────────────
  // isNew: true  → "New Notifications" section — View always clickable
  // isNew: false → "View All" section — View disabled once already read

  const renderCard = (n, isNew = false) => {
    const { letter, color } = getType(n);
    const thisAss = n.assignedTo.find(r => r.username === signedInOfficer);
    if (!thisAss) return null;

    // Treat missing unread field (legacy docs) as unread=true
    const isUnread  = thisAss.unread !== false;
    const isLoading = navigating === n._id;
    // Only disable View in the "View All" tab when already read
    const viewDisabled = isLoading || (!isNew && !isUnread);

    return (
      <div
        key={n._id}
        className={`notification-card ${isUnread ? "unread" : "read"}`}
      >
        <div className="circle-icon" style={{ backgroundColor: color }}>
          <span className="notification-letter">{letter}</span>
        </div>

        <div className="notification-content">
          <div className="notification-text">
            <p>
              <strong>{n.assignedBy}</strong> {n.action1}
              {n.post1 && <strong> {n.post1}</strong>}
              {n.action2 && (
                <> {n.action2}{n.post2 && <strong> {n.post2}</strong>}</>
              )}
            </p>
            <span className="time">Role: {thisAss.role}</span>
            <span className="time">{new Date(n.time).toLocaleString()}</span>
          </div>

          <div className="buttons-container">
            <button
              className="view-btnNC"
              onClick={() => handleView(n._id)}
              disabled={viewDisabled}
              title={viewDisabled && !isLoading ? "Already viewed" : "View"}
              style={viewDisabled && !isLoading ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
            >
              {isLoading ? "Loading…" : "View"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <p>Loading notifications…</p>;
  if (error)   return <p className="error">{error}</p>;

  return (
    <div className="notification-bar">
      <div className="headerNC">
        <h3
          className={`clickable-header ${!showAll ? "active" : ""}`}
          onClick={() => setShowAll(false)}
        >
          New Notifications <span className="count">{newNotifs.length}</span>
        </h3>
        <h3
          className={`clickable-header ${showAll ? "active" : ""}`}
          onClick={() => setShowAll(true)}
        >
          View All Notifications
        </h3>
      </div>

      {!showAll ? (
        <div className="notifications-list">
          {newNotifs.length === 0 ? (
            <p style={{ padding: "8px", color: "#6b7280" }}>No new notifications.</p>
          ) : (
            newNotifs.map(n => <React.Fragment key={n._id}>{renderCard(n, true)}</React.Fragment>)
          )}
        </div>
      ) : (
        <>
          <div className="view-all-collapse-toggle">
            <button
              onClick={() => setCollapsedAll(c => !c)}
              aria-label={collapsedAll ? "Expand" : "Collapse"}
              style={{
                position: "relative",
                width: "100%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0px",
              }}
            >
              <img
                src={collapsedAll ? downArrow : upArrow}
                alt={collapsedAll ? "Expand" : "Collapse"}
                style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "24px",
                  height: "24px",
                }}
              />
            </button>
          </div>

          <div
            className="notifications-list view-all"
            style={{
              height: collapsedAll ? "80px" : "auto",
              overflowY: collapsedAll ? "hidden" : "auto",
            }}
          >
            {(() => {
              const filtered = openNotifs.filter(n =>
                n.assignedTo.some(r => r.username === signedInOfficer)
              );
              const visible = collapsedAll ? filtered.slice(0, 1) : filtered;
              if (visible.length === 0) {
                return (
                  <p style={{ padding: "8px", color: "#6b7280" }}>No notifications.</p>
                );
              }
              return visible.map(n => (
                <React.Fragment key={n._id}>{renderCard(n)}</React.Fragment>
              ));
            })()}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCard1;
