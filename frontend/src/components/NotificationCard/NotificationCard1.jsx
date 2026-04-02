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

  const handleView = async (_id) => {
  const n = newNotifs.find(x => x._id === _id) || openNotifs.find(x => x._id === _id);
  if (!n) return;

  const myAss = n.assignedTo.find(r => r.username === signedInOfficer);
  if (!myAss) return;

  setNavigating(_id);

  try {
    if (myAss.unread !== false) {
      api.put(`/api/notifications/mark-read/${n.notificationId}`, {
        username: signedInOfficer,
      })
        .then(() => {
          setNewNotifs(prev => prev.filter(x => x._id !== _id));
          setOpenNotifs(prev =>
            prev.map(x =>
              x._id === _id
                ? {
                    ...x,
                    assignedTo: x.assignedTo.map(r =>
                      r.username === signedInOfficer
                        ? { ...r, unread: false }
                        : r
                    ),
                  }
                : x
            )
          );
        })
        .catch(e => console.error("Mark-read failed:", e.message));
    }

    const token = localStorage.getItem("token");

    // fetch actual case from backend
    const { data: allCases } = await api.get("/api/cases", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: { officerName: signedInOfficer },
    });

    const matchedCase = allCases.find(
      c =>
        String(c.caseNo) === String(n.caseNo) ||
        String(c._id) === String(n.caseId)
    );

    if (!matchedCase) {
      console.error("Case not found from notifications payload:", n);
      setNavigating(null);
      return;
    }

    let resolvedRole = myAss.role;

    const name = signedInOfficer?.toLowerCase?.() ?? "";

    if (
      matchedCase.detectiveSupervisorUserId &&
      (matchedCase.detectiveSupervisorUserId.username?.toLowerCase() === name ||
        matchedCase.detectiveSupervisorUserId.displayName?.toLowerCase() === name)
    ) {
      resolvedRole = "Detective Supervisor";
    } else if (
      Array.isArray(matchedCase.caseManagerUserIds) &&
      matchedCase.caseManagerUserIds.some(
        u =>
          u.username?.toLowerCase() === name ||
          u.displayName?.toLowerCase() === name
      )
    ) {
      resolvedRole = "Case Manager";
    } else if (
      Array.isArray(matchedCase.investigatorUserIds) &&
      matchedCase.investigatorUserIds.some(
        u =>
          u.username?.toLowerCase() === name ||
          u.displayName?.toLowerCase() === name
      )
    ) {
      resolvedRole = "Investigator";
    }

    // make same shape as working ongoing-case navigation
    const caseObj = {
      _id: matchedCase._id,
      id: matchedCase.caseNo,
      title: matchedCase.caseName,
      caseNo: matchedCase.caseNo,
      caseName: matchedCase.caseName,
      status: matchedCase.status,
      role: resolvedRole,
      createdAt: matchedCase.createdAt,
    };

    setSelectedCase(caseObj);
    sessionStorage.setItem("selectedCase", JSON.stringify(caseObj));
    localStorage.setItem("selectedCase", JSON.stringify(caseObj));
    localStorage.setItem("role", resolvedRole);

    if (n.type === "Case") {
      setSelectedLead(null);
      sessionStorage.removeItem("selectedLead");
      localStorage.removeItem("selectedLead");

      const dest =
        resolvedRole === "Case Manager" || resolvedRole === "Detective Supervisor"
          ? "/CasePageManager"
          : "/Investigator";

      navigate(dest, { state: { caseDetails: caseObj } });
    } else {
      const leadObj = {
        leadNo: n.leadNo,
        leadName: n.leadName,
      };

      setSelectedLead(leadObj);
      sessionStorage.setItem("selectedLead", JSON.stringify(leadObj));
      localStorage.setItem("selectedLead", JSON.stringify(leadObj));

      if (n.type === "Lead") {
        navigate("/LeadReview", {
          state: { caseDetails: caseObj, leadDetails: leadObj },
        });
      } else if (n.type === "LeadReturn") {
        navigate("/LRInstruction", {
          state: { caseDetails: caseObj, leadDetails: leadObj },
        });
      }
    }
  } catch (err) {
    console.error("Notification navigation failed:", err);
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
