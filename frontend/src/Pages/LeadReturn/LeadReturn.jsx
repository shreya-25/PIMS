import React, { useState, useEffect, useContext } from "react";
import { CaseContext } from "../../Pages/CaseContext";
import Navbar from '../../components/Navbar/Navbar';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api";
import "./LeadReturn.css";

export const LeadReturn = () => {
  const signedInOfficer = "Officer 916";
  const { setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const navigate = useNavigate();

  const [newNotifs, setNewNotifs] = useState([]);
  const [openNotifs, setOpenNotifs] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collapsedAll, setCollapsedAll] = useState(true);

  const downArrow = `${process.env.PUBLIC_URL}/Materials/down_arrow.png`;
  const upArrow = `${process.env.PUBLIC_URL}/Materials/up_arrow.png`;

  const fetchNew = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/notifications/user/${signedInOfficer}`);
      const filtered = data
        .filter(n => (n.type === "Case" || n.type === "Lead") && n.caseStatus === "Open" && n.assignedTo.some(r => r.username === signedInOfficer && r.status === "pending"))
        .sort((a, b) => new Date(b.time) - new Date(a.time));
      setNewNotifs(filtered);
    } catch {
      setError("Failed to load new notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchOpen = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/notifications/open/user/${signedInOfficer}`);
      setOpenNotifs(data.sort((a, b) => new Date(b.time) - new Date(a.time)));
    } catch {
      setError("Failed to load open notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNew();
    fetchOpen();
  }, [signedInOfficer]);

  const getType = n => {
    if (n.type === "Case") return { letter: "C", color: "blue" };
    if (n.type === "Lead") return { letter: "L", color: "green" };
    if (n.type === "LeadReturn") return { letter: "R", color: "red" };
    return { letter: "?", color: "gray" };
  };

  const handleView = async _id => {
    const n = newNotifs.find(x => x._id === _id);
    if (!n) return;
    const { notificationId, assignedBy, leadNo, leadName, caseNo, caseName, action1 } = n;
    const role = signedInOfficer === assignedBy ? "Case Manager" : "Investigator";

    localStorage.setItem("role", role);
    await api.put(`/api/notifications/mark-read/${notificationId}`);
    setNewNotifs(prev => prev.filter(x => x._id !== _id));

    const baseState = {
      caseNo: caseName,
      caseName: caseNo,
      role,
      ...(leadNo && { leadNo, leadName })
    };
    setSelectedCase(baseState);
    setSelectedLead({ leadNo, leadName });
    localStorage.setItem("selectedCase", JSON.stringify(baseState));

    if (action1.includes("new case")) navigate("/Investigator", { state: baseState });
    else if (action1.includes("new lead")) navigate("/LeadReview", { state: baseState });
    else navigate("/LRInstructions", { state: baseState });
  };

  const handleAccept = async _id => {
    if (!window.confirm("Accept this?")) return;

    setNewNotifs(ns =>
      ns.map(n =>
        n._id === _id
          ? {
              ...n,
              assignedTo: n.assignedTo.map(r =>
                r.username === signedInOfficer ? { ...r, status: "accepted" } : r
              )
            }
          : n
      )
    );
    setOpenNotifs(os =>
      os.map(n =>
        n._id === _id
          ? {
              ...n,
              assignedTo: n.assignedTo.map(r =>
                r.username === signedInOfficer ? { ...r, status: "accepted" } : r
              )
            }
          : n
      )
    );

    try {
      const n = newNotifs.find(x => x._id === _id);
      const { notificationId } = n;
      await api.put(`/api/notifications/respond/${notificationId}`, {
        username: signedInOfficer,
        status: "accepted"
      });
      await api.put(`/api/notifications/mark-read/${notificationId}`);
      fetchNew();
      fetchOpen();
    } catch (err) {
      console.error("Failed to accept:", err);
    }
  };

  if (loading) return <p>Loading notifications…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="officer-assignment-page">
      <Navbar />
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
            {newNotifs.slice(0, 1).map(n => {
              const { letter, color } = getType(n);
              const thisAss = n.assignedTo.find(r => r.username === signedInOfficer);
              const isPending = thisAss?.status === "pending";
              return (
                <div key={n._id} className="notification-card unread">
                  <div className="circle-icon" style={{ backgroundColor: color }}>
                    <span className="notification-letter">{letter}</span>
                  </div>
                  <div className="notification-content">
                    <div className="notification-text">
                      <p>
                        <strong>{n.assignedBy}</strong> {n.action1}
                        {n.post1 && <strong> {n.post1}</strong>}
                      </p>
                      <span className="time">{new Date(n.time).toLocaleString()}</span>
                    </div>
                    <div className="buttons-container">
                      <button className="view-btnNC" onClick={() => handleView(n._id)}>
                        View
                      </button>
                      <button
                        className="accept-btnNC"
                        onClick={() => handleAccept(n._id)}
                        disabled={!isPending}
                      >
                        Accept
                      </button>
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
                  position: 'relative',
                  width: '100%',
                  height: '40px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={collapsedAll ? downArrow : upArrow}
                  alt={collapsedAll ? "Expand" : "Collapse"}
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '24px',
                    height: '24px'
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
                ? openNotifs.filter(x => x.assignedTo.some(r => r.status === "pending")).slice(0, 1)
                : openNotifs.filter(x => x.assignedTo.some(r => r.status === "pending"))
              ).map(n => {
                const { letter, color } = getType(n);
                const thisAss = n.assignedTo.find(r => r.username === signedInOfficer);
                const isPending = thisAss?.status === "pending";
                return (
                  <div key={n._id} className="notification-card">
                    <div className="circle-icon" style={{ backgroundColor: color }}>
                      <span className="notification-letter">{letter}</span>
                    </div>
                    <div className="notification-content">
                      <div className="notification-text">
                        <p>
                          <strong>{n.assignedBy}</strong> {n.action1}
                          {n.post1 && <strong> {n.post1}</strong>}
                        </p>
                        <span className="time">{new Date(n.time).toLocaleString()}</span>
                      </div>
                      <div className="buttons-container">
                        <button className="view-btnNC" onClick={() => handleView(n._id)}>View</button>
                        <button
                          className="accept-btnNC"
                          onClick={() => handleAccept(n._id)}
                          disabled={!isPending}
                        >
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
    </div>
  );
};