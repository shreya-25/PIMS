import React, { useState, useEffect, useContext } from "react";
import { CaseContext } from "../../Pages/CaseContext";
import "./NotificationCard.css";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const NotificationCard = ({ signedInOfficer }) => {
  const [unreadNotifications, setUnreadNotifications]     = useState([]);
  const [openCaseNotifications, setOpenCaseNotifications] = useState([]);
  const [showAll, setShowAll]                             = useState(false);
  const [loading, setLoading]                             = useState(false);
  const [error, setError]                                 = useState(null);
  const [refreshToggle, setRefreshToggle]                 = useState(false);
  const [collapsedAll, setCollapsedAll]                   = useState(true);

  const { setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const navigate                            = useNavigate();

  const downArrow = `${process.env.PUBLIC_URL}/Materials/down_arrow.png`;
  const upArrow   = `${process.env.PUBLIC_URL}/Materials/up_arrow.png`;

  useEffect(() => {
    fetchUnread();
    fetchAllOpen();
  }, [signedInOfficer, refreshToggle]);

  // ─── Fetch NEW (pending) Case/Lead notifications ────────────────────────────
  async function fetchUnread() {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/notifications/user/${signedInOfficer}`);
      const pending = data
        .filter(n =>
          (n.type === "Case" || n.type === "Lead") &&
          n.caseStatus === "Open" &&
          n.assignedTo.some(r =>
            r.username === signedInOfficer &&
            r.status   === "pending"
          )
        )
        .sort((a, b) => new Date(b.time) - new Date(a.time));
      setUnreadNotifications(pending);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  // ─── Fetch ALL open‐case notifications ───────────────────────────────────────
  async function fetchAllOpen() {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/notifications/open/user/${signedInOfficer}`);
      setOpenCaseNotifications(
        data.sort((a, b) => new Date(b.time) - new Date(a.time))
      );
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  // ─── Determine circle letter/color by type ─────────────────────────────────
  const getNotificationType = n => {
    switch (n.type) {
      case "Case":       return { letter: "C",  color: "blue" };
      case "Lead":       return { letter: "L",  color: "green" };
      case "LeadReturn": return { letter: "R",  color: "red"   };
      default:           return { letter: "?",  color: "gray"  };
    }
  };

  // ─── Mark as read & navigate ───────────────────────────────────────────────
  const handleView = async _id => {
    const notif = unreadNotifications.find(n => n._id === _id);
    if (!notif) return;

    const { notificationId, assignedBy, leadNo, leadName, caseNo, caseName, action1 } = notif;
    const role = signedInOfficer === assignedBy ? "Case Manager" : "Investigator";

    localStorage.setItem("role", role);
    await api.put(`/api/notifications/mark-read/${notificationId}`);

    setUnreadNotifications(prev => prev.filter(n => n._id !== _id));

    const baseState = {
      caseNo:   caseName,
      caseName: caseNo,
      role,
      ...(leadNo && { leadNo, leadName })
    };
    setSelectedCase(baseState);
    setSelectedLead({ leadNo, leadName });
    localStorage.setItem("selectedCase", JSON.stringify(baseState));

    if (action1.includes("new case"))      navigate("/Investigator",    { state: baseState });
    else if (action1.includes("new lead")) navigate("/LeadReview",      { state: baseState });
    else                                   navigate("/LRInstructions", { state: baseState });
  };

  // ─── Accept (respond) ─────────────────────────────────────────────────────
  const handleAccept = async _id => {
    if (!window.confirm("Accept this lead?")) return;
    const notif = unreadNotifications.find(n => n._id === _id);
    if (!notif) return;
    const { notificationId } = notif;

    // 1. Update officer’s status to accepted
    await api.put(`/api/notifications/respond/${notificationId}`, {
      username: signedInOfficer,
      status:   "accepted"
    });
    // 2. Mark as read
    await api.put(`/api/notifications/mark-read/${notificationId}`);

    // 3. Move it into the open list
    setUnreadNotifications(prev => prev.filter(n => n._id !== _id));
    setOpenCaseNotifications(prev => [{ ...notif, unread: false }, ...prev]);
  };

  if (loading) return <p>Loading notifications...</p>;
  if (error)   return <p className="error">{error}</p>;

  return (
    <div className="notification-bar">
      <div className="headerNC">
        <h3
          className="clickable-header"
          onClick={() => { setShowAll(false); setRefreshToggle(f => !f); }}
        >
          New Notifications <span className="count">{unreadNotifications.length}</span>
        </h3>
        <h3
          className="clickable-header"
          onClick={() => { setShowAll(true); setRefreshToggle(f => !f); }}
        >
          View All Notifications
        </h3>
      </div>

      { !showAll ? (
        <div className="notifications-list">
          {unreadNotifications.slice(0, 1).map(n => {
            const { letter, color } = getNotificationType(n);
            return (
              <div key={n._id} className={`notification-card ${n.unread ? "unread" : ""}`}>
                <div className="circle-icon" style={{ backgroundColor: color }}>
                  <span className="notification-letter">{letter}</span>
                </div>
                <div className="notification-content">
                  <p>
                    <strong>{n.assignedBy}</strong> {n.action1}
                    {n.post1 && <strong> {n.post1}</strong>} {n.action2}
                    {n.post2 && <strong> {n.post2}</strong>}
                  </p>
                  <span className="time">{new Date(n.time).toLocaleString()}</span>
                  <div className="buttons-container">
                    <button className="view-btnNC" onClick={() => handleView(n._id)}>View</button>
                    {n.type === "Lead" && (
                      <button className="accept-btnNC" onClick={() => handleAccept(n._id)}>
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="view-all-collapse-toggle">
            <button className="collapse-btn" onClick={() => setCollapsedAll(c => !c)}>
              <img
                src={collapsedAll ? downArrow : upArrow}
                alt={collapsedAll ? "Expand" : "Collapse"}
                className="collapse-icon"
              />
            </button>
          </div>

          <div
            className="notifications-list view-all"
            style={{
              height: collapsedAll ? "80px" : "auto",
              overflowY: collapsedAll ? "hidden" : "auto"
            }}
          >
            {(collapsedAll
              ? openCaseNotifications.filter(n => n.unread).slice(0, 1)
              : openCaseNotifications.filter(n => n.unread)
            ).map(n => {
              const { letter, color } = getNotificationType(n);
              return (
                <div key={n._id} className={`notification-card ${n.unread ? "unread" : ""}`}>
                  <div className="circle-icon" style={{ backgroundColor: color }}>
                    <span className="notification-letter">{letter}</span>
                  </div>
                  <div className="notification-content">
                    <p>
                      <strong>{n.assignedBy}</strong> {n.action1}
                      {n.post1 && <strong> {n.post1}</strong>} {n.action2}
                      {n.post2 && <strong> {n.post2}</strong>}
                    </p>
                    <span className="time">{new Date(n.time).toLocaleString()}</span>
                    <div className="buttons-container">
                      <button className="view-btnNC" onClick={() => handleView(n._id)}>View</button>
                      <button className="accept-btnNC" onClick={() => handleAccept(n._id)}>
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCard;
