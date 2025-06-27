import React, { useState, useEffect, useContext } from "react";
import { CaseContext } from "../../Pages/CaseContext";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./NotificationCard.css";

const NotificationCard1 = ({ signedInOfficer }) => {
  const [newNotifs,   setNewNotifs]   = useState([]);
  const [openNotifs,  setOpenNotifs]  = useState([]);
  const [showAll,     setShowAll]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [collapsedAll,setCollapsedAll]= useState(false);

  const { setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const navigate = useNavigate();

   const downArrow = `${process.env.PUBLIC_URL}/Materials/down_arrow.png`;
  const upArrow   = `${process.env.PUBLIC_URL}/Materials/up_arrow.png`;


  // ————————————————
  // 1) “fetch‐only” helpers return arrays (no setState inside)
  // ————————————————
  const fetchNewOnly = async () => {
    const { data } = await api.get(`/api/notifications/user/${signedInOfficer}`);
    return data
      .filter(n =>
        (n.type === "Case" || n.type === "Lead") &&
        n.caseStatus === "Open" &&
        n.unread === true &&
        n.assignedTo.some(r => r.username === signedInOfficer && r.status === "pending")
      )
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  const fetchOpenOnly = async () => {
    const { data } = await api.get(`/api/notifications/open/user/${signedInOfficer}`);
    return data.sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  // ————————————————
  // 2) Utility to compare two arrays of notifications
  // ————————————————
  const arraysAreEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  };

  // ————————————————
  // 3) Poll every 15 seconds, but only set state if the data actually changed
  // ————————————————
  useEffect(() => {
    if (!signedInOfficer) return;
    let intervalId;

    const pollNotifications = async () => {
      // setLoading(true);
      try {
        const [freshNew, freshOpen] = await Promise.all([
          fetchNewOnly(),
          fetchOpenOnly()
        ]);

        // Update newNotifs only if it’s different
        setNewNotifs(prev => {
          if (!arraysAreEqual(prev, freshNew)) {
            return freshNew;
          }
          return prev;
        });

        // Update openNotifs only if it’s different
        setOpenNotifs(prev => {
          if (!arraysAreEqual(prev, freshOpen)) {
            return freshOpen;
          }
          return prev;
        });
      } catch (e) {
        setError(e.message || "Failed to load notifications");
      } finally {
        // setLoading(false);
      }
    };

    // Run once immediately, then every 15s
    pollNotifications();
    intervalId = setInterval(pollNotifications, 15000);
    return () => clearInterval(intervalId);
  }, [signedInOfficer]);

  // ————————————————
  // 4) “View” handler (same as before)
  // ————————————————
  const getType = n => {
    if (n.type === "Case")       return { letter: "C", color: "blue" };
    if (n.type === "Lead")       return { letter: "L", color: "green" };
    if (n.type === "LeadReturn") return { letter: "LR", color: "red" };
    return { letter: "?", color: "gray" };
  };

  const handleView = async _id => {
    const n = newNotifs.find(x => x._id === _id) || openNotifs.find(x => x._id === _id);
    if (!n) return;

    const { notificationId, leadNo, leadName, caseNo, caseName, action1 } = n;
    let role = "Investigator";

    try {
      const token = localStorage.getItem("token");
      const caseRes = await api.get(`/api/cases/${caseNo}/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // if (caseRes.data.caseManager === signedInOfficer) {
      //   role = "Case Manager";
      // } else if (caseRes.data.investigators.includes(signedInOfficer)) {
      //   role = "Investigator";
      // }
      const { caseManagers = [], investigators = [], detectiveSupervisor } = caseRes.data;
    if (caseManagers.includes(signedInOfficer) || detectiveSupervisor === signedInOfficer) {
      role = "Case Manager";
    } else if (investigators.includes(signedInOfficer)) {
      role = "Investigator";
    }
    } catch (err) {
      console.error("Failed to fetch case role:", err);
    }

    localStorage.setItem("role", role);

    // Mark as read if still unread
    if (n.unread) {
      await api.put(`/api/notifications/mark-read/${notificationId}`);
      setNewNotifs(prev => prev.filter(x => x._id !== _id));
    }

    const baseState = { caseNo, caseName, role, ...(leadNo && { leadNo, leadName }) };
    setSelectedCase(baseState);
    setSelectedLead({ leadNo, leadName });
    localStorage.setItem("selectedCase", JSON.stringify(baseState));

    if (action1.includes("case")) {
      if (role === "Case Manager") {
        navigate("/CasePageManager", { state: baseState });
      } else {
        navigate("/Investigator", { state: baseState });
      }
    }
    else if (action1.includes("lead")) {
      navigate("/LeadReview", { state: { ...baseState, role } });
    }
    else {
      navigate("/LRInstruction", { state: baseState });
    }
  };

  if (loading) return <p>Loading notifications…</p>;
  if (error)   return <p className="error">{error}</p>;

  return (
    <div className="notification-bar">
      <div className="headerNC">
        <h3 className="clickable-header" onClick={() => setShowAll(false)}>
          New Notifications <span className="count">{newNotifs.length}</span>
        </h3>
        <h3 className="clickable-header" onClick={() => setShowAll(true)}>
          View All Notifications
        </h3>
      </div>

      {!showAll ? (
        <div className="notifications-list">
          {newNotifs.slice(0,5).map(n => {
            const { letter, color } = getType(n);
            const thisAss = n.assignedTo.find(r => r.username === signedInOfficer);
            const isPending = thisAss?.status === "pending";

            return (
              <div key={n._id} className={`notification-card ${n.unread ? "unread" : "read"}`}>
                <div className="circle-icon" style={{ backgroundColor: color }}>
                  <span className="notification-letter">{letter}</span>
                </div>
                <div className="notification-content">
                  <div className="notification-text">
                    <p>
                      <strong>{n.assignedBy}</strong> {n.action1}
                      {n.post1 && <strong> {n.post1}</strong>}
                    </p>
                    {n.action1.toLowerCase().includes("assigned") ? (
            <span className="time">Role: Investigator</span>
          ) : (
            <span className="time">Role: Case Manager</span>
          )}
                    <span className="time">{new Date(n.time).toLocaleString()}</span>
                  </div>
                  <div className="buttons-container">
                    <button className="view-btnNC" onClick={() => handleView(n._id)}>
                      View
                    </button>
                    {isPending &&
                      !n.action1.toLowerCase().includes("accepted") &&
                      !n.action1.toLowerCase().includes("declined") && (
                        <>{/* Accept/Decline buttons */}</>
                      )
                    }
                  </div>
                </div>
              </div>
            );
          })}
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
                height: "40px",
                background: "transparent",
                border: "none",
                cursor: "pointer"
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
                  height: "24px"
                }}
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
              ? openNotifs.filter(x =>
                  x.assignedTo.some(r => r.username === signedInOfficer)
                ).slice(0, 1)
              : openNotifs.filter(x =>
                  x.assignedTo.some(r => r.username === signedInOfficer)
                )
            ).map(n => {
              const { letter, color } = getType(n);
              const thisAss = n.assignedTo.find(r => r.username === signedInOfficer);
              const isPending = thisAss?.status === "pending";

              return (
                <div key={n._id} className={`notification-card ${n.unread ? "unread" : "read"}`}>
                  <div className="circle-icon" style={{ backgroundColor: color }}>
                    <span className="notification-letter">{letter}</span>
                  </div>
                  <div className="notification-content">
                    <div className="notification-text">
                      <p>
                        <strong>{n.assignedBy}</strong> {n.action1}
                        {n.post1 && <strong> {n.post1}</strong>}
                      </p>
                       {n.action1.toLowerCase().includes("assigned") ? (
            <span className="time">Role: Investigator</span>
          ) : (
            <span className="time">Role: Case Manager</span>
          )}
                      <span className="time">{new Date(n.time).toLocaleString()}</span>
                    </div>
                    <div className="buttons-container">
                      <button className="view-btnNC" onClick={() => handleView(n._id)}>
                        View
                      </button>
                      {isPending &&
                        !n.action1.toLowerCase().includes("accepted") &&
                        !n.action1.toLowerCase().includes("declined") && (
                          <>{/* Accept/Decline buttons */}</>
                        )
                      }
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

export default NotificationCard1;
