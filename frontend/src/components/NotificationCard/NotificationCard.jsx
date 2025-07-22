import React, { useState, useEffect, useContext, forwardRef, useImperativeHandle } from "react";
import { CaseContext } from "../../Pages/CaseContext";
import "./NotificationCard.css";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { v4 as uuidv4 } from "uuid";

const NotificationCard1 = ({ signedInOfficer }) => {
  const [newNotifs, setNewNotifs]         = useState([]);
  const [openNotifs, setOpenNotifs]       = useState([]);
  const [showAll, setShowAll]             = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [collapsedAll, setCollapsedAll]   = useState(false);
  const token = localStorage.getItem("token");

  const { setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const navigate= useNavigate();
  const signedInOfficer1 = localStorage.getItem("loggedInUser");

  console.log("Officer", signedInOfficer1);

  const downArrow = `${process.env.PUBLIC_URL}/Materials/down_arrow.png`;
  const upArrow   = `${process.env.PUBLIC_URL}/Materials/up_arrow.png`;

  // Fetch "new" pending Case/Lead notifications
  const fetchNew = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/notifications/user/${signedInOfficer}`);
      const filtered = data
        .filter(n =>
          (n.type === "Case" || n.type === "Lead") &&
          n.caseStatus === "Open" && n.unread === true &&
          n.assignedTo.some(r => r.username === signedInOfficer && r.status === "pending")
        )
        .sort((a, b) => new Date(b.time) - new Date(a.time));
      setNewNotifs(filtered);
    } catch {
      setError("Failed to load new notifications");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all open‐case notifications
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
    let intervalId;

    const pollNotifications = async () => {
      setLoading(true);
      await Promise.all([fetchNew(), fetchOpen()]);
      setLoading(false);
    };

    // 1) Fire once immediately:
    pollNotifications();

    // 2) Schedule it to run every 15 seconds:
    intervalId = setInterval(pollNotifications, 15000);

    // 3) Clear on unmount:
    return () => clearInterval(intervalId);
  }, [signedInOfficer]); // re-run effect if signedInOfficer changes


  const getType = n => {
    if (n.type === "Case")       return { letter: "C", color: "blue" };
    if (n.type === "Lead")       return { letter: "L", color: "green" };
    if (n.type === "LeadReturn") return { letter: "LR", color: "red" };
    return { letter: "?", color: "gray" };
  };

  // const handleView = async _id => {
  //   const n = newNotifs.find(x => x._id === _id);
  //   if (!n) return;
  //   const { notificationId, assignedBy, leadNo, leadName, caseNo, caseName, action1 } = n;
  //   const role = signedInOfficer === assignedBy ? "Case Manager" : "Investigator";

  //   localStorage.setItem("role", role);
  //   await api.put(`/api/notifications/mark-read/${notificationId}`);
  //   setNewNotifs(prev => prev.filter(x => x._id !== _id));

  //   const baseState = {
  //     caseNo:   caseName,
  //     caseName: caseNo,
  //     role,
  //     ...(leadNo && { leadNo, leadName })
  //   };
  //   setSelectedCase(baseState);
  //   setSelectedLead({ leadNo, leadName });
  //   localStorage.setItem("selectedCase", JSON.stringify(baseState));

  //   if (action1.includes("new case"))      navigate("/Investigator",    { state: baseState });
  //   else if (action1.includes("new lead")) navigate("/LeadReview",      { state: baseState });
  //   else                                   navigate("/LRInstructions", { state: baseState });
  // };

  const handleView = async _id => {
  // Try to find the notification in both new and open lists
  const n = newNotifs.find(x => x._id === _id) || openNotifs.find(x => x._id === _id);
  if (!n) return;

  const { notificationId, assignedBy, leadNo, leadName, caseNo, caseName, action1 } = n;
  // const role = signedInOfficer === assignedBy ? "Case Manager" : "Investigator";

  // 2. Fetch role from the case table
  let role = "Investigator"; // default
  try {
    const token = localStorage.getItem("token");
    const caseRes = await api.get(`/api/cases/${caseNo}/team`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (caseRes.data.caseManager === signedInOfficer) {
      role = "Case Manager";
    } else if (caseRes.data.investigators.includes(signedInOfficer)) {
      role = "Investigator";
    }
  } catch (err) {
    console.error("❌ Failed to fetch case role:", err);
  }

  // 3. Save and navigate
  localStorage.setItem("role", role);

  // Mark as read (only if unread)
  if (n.unread) {
    await api.put(`/api/notifications/mark-read/${notificationId}`);
    setNewNotifs(prev => prev.filter(x => x._id !== _id));
  }

  const baseState = {
    caseNo:   caseNo,
    caseName: caseName,
    role,
    ...(leadNo && { leadNo, leadName })
  };

  setSelectedCase(baseState);
  setSelectedLead({ leadNo, leadName });
  console.log("print lead no and name", n);
  localStorage.setItem("selectedCase", JSON.stringify(baseState));

if (action1.includes("case")) {
  if (role === "Case Manager") {
    navigate("/CasePageManager", { state: baseState });
  } else {
    navigate("/Investigator", { state: baseState });
  }
}
  else if (action1.includes("lead")) {
  if (role === "Case Manager") {
    // case‐manager hitting a “lead” notification
    navigate("/LeadReview", {
      state: { ...baseState, role: "Case Manager" }
    });
  } else {
    // investigator hitting a “lead” notification
    navigate("/LeadReview", {
      state: { ...baseState, role: "Investigator" }
    });
  }
}
  else                                   navigate("/LRInstruction", { state: baseState });
};

const handleDecline = async _id => {
  if (!window.confirm("Are you sure you want to decline?")) return;

  // Optimistic update for UI
  setNewNotifs(ns =>
    ns.map(n =>
      n._id === _id
        ? {
            ...n,
            assignedTo: n.assignedTo.map(r =>
              r.username === signedInOfficer ? { ...r, status: "declined" } : r
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
              r.username === signedInOfficer ? { ...r, status: "declined" } : r
            )
          }
        : n
    )
  );

  try {
    const n = newNotifs.find(x => x._id === _id) || openNotifs.find(x => x._id === _id);
    const { notificationId } = n;

    await api.put(`/api/notifications/decline/${notificationId}`, {
      username: signedInOfficer
    });

    await api.put(`/api/notifications/mark-read/${notificationId}`);

    await api.post("/api/notifications", {
  notificationId: Date.now().toString(),
  assignedBy: signedInOfficer,
  assignedTo: [
    { username: n.assignedBy }         // case-manager
  ],
  action1: `declined the case titled`,  // required
  post1:   `${n.caseNo}: ${n.caseName}`,                                   // required (can be empty)
  caseNo:   n.caseNo,
  caseName: n.caseName,
  caseStatus:     n.caseStatus || "Open", 
  type:     "Case"                            // now in your enum
},
  {
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${token}`
    }
  }
);

    // Re-fetch to ensure consistency
    fetchNew();
    fetchOpen();
  } catch (err) {
    console.error("❌ Failed to decline:", err);
  }
};



  console.log("Officer", signedInOfficer);
   const handleAccept = async _id => {
    
  if (!window.confirm("Accept this?")) return;

  // Optimistic UI update
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

    // ✅ Call your updated backend route
    await api.put(`/api/notifications/accept/${notificationId}`, {
      username: signedInOfficer
    });

    await api.put(`/api/notifications/mark-read/${notificationId}`);

    // Re-fetch to stay synced
    await api.post("/api/notifications", {
  notificationId: Date.now().toString(),
  assignedBy: signedInOfficer,
  assignedTo: [
    { username: n.assignedBy }         // case-manager
  ],
  action1: `accepted the case titled`,  // required
  post1:   `${n.caseNo}: ${n.caseName}`,                                   // required (can be empty)
  caseNo:   n.caseNo,
  caseName: n.caseName,
  caseStatus:     n.caseStatus || "Open", 
  type:     "Case"                            // now in your enum
},
  {
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${token}`
    }
  }
);

await api.put("/api/cases/update-officer-status", {
  caseNo: n.caseNo,
  caseName: n.caseName,
  officerName: signedInOfficer,
  status: "accepted"
}, {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }
});


    fetchNew();
    fetchOpen();
  } catch (err) {
    console.error("Failed to accept:", err);
    // Optionally rollback optimistic update
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

      { !showAll
        ? <div className="notifications-list">
            {newNotifs.slice(0,5).map(n => {
              const { letter, color } = getType(n);
               const thisAss = n.assignedTo.find(r => r.username === signedInOfficer);
  const isPending = thisAss?.status === "pending";
              return (
                <div
  key={n._id}
  className={`notification-card ${n.unread ? "unread" : "read"}`}
>
                  <div className="circle-icon" style={{ backgroundColor: color }}>
                    <span className="notification-letter">{letter}</span>
                  </div>
                  <div className="notification-content">
                    <div className="notification-text">
                    <p>
                      <strong>{n.assignedBy}</strong> {n.action1}
                      {n.post1 && <strong> {n.post1}</strong>}
                      {n.action2 && <> — {n.action2}{n.post2 && <strong> {n.post2}</strong>}</>}
                       {n.action2 && (
    <> — {n.action2}{n.post2 && <strong> {n.post2}</strong>}</>
  )}
                    </p>
                    <span className="time">{new Date(n.time).toLocaleString()}</span>
                    </div>
                    <div className="buttons-container">

                
  {  (
    <button className="view-btnNC" onClick={()=>handleView(n._id)}>
      View
    </button>
  )}

                     {isPending && 
 !n.action1?.toLowerCase().includes("accepted") &&
 !n.action1?.toLowerCase().includes("declined") && (
  <>
    {/* <button className="accept-btnNC" onClick={() => handleAccept(n._id)}>Accept</button>
    <button className="decline-btnNC" onClick={() => handleDecline(n._id)}>Decline</button> */}
  </>
)}

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        : <>
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
  ? openNotifs.filter(x => x.assignedTo.some(r => r.username === signedInOfficer)).slice(0, 1)
  : openNotifs.filter(x => x.assignedTo.some(r => r.username === signedInOfficer))
)
.map(n => {
                const { letter, color } = getType(n);
                const thisAss = n.assignedTo.find(r=>r.username===signedInOfficer);
                const isPending = thisAss?.status==="pending";
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
                        {n.action2 && <> — {n.action2}{n.post2 && <strong> {n.post2}</strong>}</>}
                      </p>
                      <span className="time">{new Date(n.time).toLocaleString()}</span>
                      </div>
                      <div className="buttons-container">
  { (
    <button className="view-btnNC" onClick={()=>handleView(n._id)}>
      View
    </button> )}

                      {isPending && 
 !n.action1?.toLowerCase().includes("accepted") &&
 !n.action1?.toLowerCase().includes("declined") && (
  <>
    {/* <button className="accept-btnNC" onClick={() => handleAccept(n._id)}>Accept</button>
    <button className="decline-btnNC" onClick={() => handleDecline(n._id)}>Decline</button> */}
  </>
)}

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
      }
    </div>
  );
};

export default NotificationCard1;
