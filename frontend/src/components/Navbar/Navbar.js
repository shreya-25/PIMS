import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertModal } from "../AlertModal/AlertModal";
import api from "../../api";
import "./Navbar1.css";
import { CaseContext } from "../../Pages/CaseContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [systemRoleState, setSystemRoleState] = useState(localStorage.getItem("systemRole") || "");
  const [notifications, setNotifications] = useState(0);
  const [chats, setChats] = useState(0);
  const [emails, setEmails] = useState(0);
   const [alertOpen,    setAlertOpen]    = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { selectedCase, setSelectedCase, setSelectedLead } = useContext(CaseContext) || {};

  const [newNotifs, setNewNotifs]         = useState([]);
  const [navigating, setNavigating]       = useState(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showEmails, setShowEmails] = useState(false);

  const [notificationList, setNotificationList] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [emailList, setEmailList] = useState([]);

  const roleFromCase = selectedCase?.role?.trim();
  const roleFromStorage = localStorage.getItem("role") || "";
  const onHome = location.pathname === "/HomePage" || location.pathname === "/";
  // Admin always shows their system role; on homepage show system role;
  // elsewhere (case pages) show the case-level role
  const isAdminUser = systemRoleState === "Admin";
  const role = (isAdminUser || onHome) ? systemRoleState : (roleFromStorage || roleFromCase);
  const showRole = !!role;

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
  };
   const doLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "/";
  };

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
      setUsername(loggedInUser);
    }

    // Back-fill systemRole for sessions created before the systemRole key was introduced.
    // Only safe when the stored "role" is still a system-level value
    // (case navigation overwrites "role" with case-level values like "Case Manager").
    const CASE_LEVEL_ROLES = new Set(["Case Manager", "Investigator"]);
    if (!localStorage.getItem("systemRole")) {
      const storedRole = localStorage.getItem("role");
      if (storedRole && !CASE_LEVEL_ROLES.has(storedRole)) {
        localStorage.setItem("systemRole", storedRole);
        setSystemRoleState(storedRole);
      }
    }

    // Sample data
    setNotifications(3);
    setChats(5);
    setEmails(4);
    
     const fetchNewOnly = async () => {
     if (!loggedInUser) return;
     const signedInUserId = localStorage.getItem("userId");
     try {
       const url = signedInUserId
         ? `/api/notifications/user/id/${signedInUserId}`
         : `/api/notifications/user/${loggedInUser}`;
       const { data } = await api.get(url);
       // filter to only "unread" & "pending" Ongoing case/lead notifications
       const fresh = data
         .filter(n =>
           (n.type === "Case" || n.type === "Lead") &&
           n.caseStatus === "Open" &&
           n.assignedTo.some(r =>
             (signedInUserId && r.userId
               ? String(r.userId) === signedInUserId
               : r.username === loggedInUser) &&
             r.status === "pending" &&
             r.unread === true
           )
         )
         .sort((a, b) => new Date(b.time) - new Date(a.time));
       setNewNotifs(fresh);
     } catch (e) {
       console.error("Failed to load notifications", e);
     }
   };

   fetchNewOnly();
   const intervalId = setInterval(fetchNewOnly, 15000);
   return () => clearInterval(intervalId);
    setChatList([
      "Officer 1 replied to Lead 33 return",
      "Officer 5 replied to Lead 20 return",
      "Officer 6 commented on Lead 50",
      "Officer 8 commented on Lead 34",
      "Officer 5 replied to Lead 10 return",
    ]);
    setEmailList([
      "Email from Officer 3",
      "Weekly Newsletter",
      "Press Event Meeting Invitation",
      "Email from Officer 6",
    ]);
  }, []);

  const getNotifType = (n) => {
    if (n.type === "Case")       return { letter: "C",  color: "#2563eb" };
    if (n.type === "Lead")       return { letter: "L",  color: "#16a34a" };
    if (n.type === "LeadReturn") return { letter: "LR", color: "#dc2626" };
    return { letter: "?", color: "#6b7280" };
  };

  const handleNotificationClick = async (n) => {
    const loggedInUser  = localStorage.getItem("loggedInUser");
    const signedInUserId = localStorage.getItem("userId");

    const isMyEntry = (r) =>
      signedInUserId && r.userId
        ? String(r.userId) === signedInUserId
        : r.username === loggedInUser;

    const myAss = n.assignedTo.find(r => isMyEntry(r));
    if (!myAss) return;

    setNavigating(n._id);
    setShowNotifications(false);
    setNewNotifs(prev => prev.filter(x => x._id !== n._id));

    try {
      if (myAss.unread !== false) {
        api.put(`/api/notifications/mark-read/${n.notificationId}`, {
          userId: signedInUserId || undefined,
          username: loggedInUser,
        }).catch(e => console.error("Mark-read failed:", e.message));
      }

      const token = localStorage.getItem("token");
      const { data: allCases } = await api.get("/api/cases", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        params: { officerName: loggedInUser },
      });

      const matchedCase = allCases.find(
        c => String(c.caseNo) === String(n.caseNo) || String(c._id) === String(n.caseId)
      );
      if (!matchedCase) { setNavigating(null); return; }

      let resolvedRole = myAss.role;
      const name = loggedInUser?.toLowerCase?.() ?? "";
      const matchMember = (u) =>
        (signedInUserId && (String(u._id) === signedInUserId || String(u.id) === signedInUserId || String(u.userId) === signedInUserId)) ||
        u.username?.toLowerCase() === name ||
        u.displayName?.toLowerCase() === name;

      if (matchedCase.detectiveSupervisorUserId && matchMember(matchedCase.detectiveSupervisorUserId)) {
        resolvedRole = "Detective Supervisor";
      } else if (Array.isArray(matchedCase.caseManagerUserIds) && matchedCase.caseManagerUserIds.some(matchMember)) {
        resolvedRole = "Case Manager";
      } else if (Array.isArray(matchedCase.investigatorUserIds) && matchedCase.investigatorUserIds.some(matchMember)) {
        resolvedRole = "Investigator";
      }

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
        const dest = resolvedRole === "Case Manager" || resolvedRole === "Detective Supervisor"
          ? "/CasePageManager" : "/Investigator";
        navigate(dest, { state: { caseDetails: caseObj } });
      } else {
        const leadObj = { leadNo: n.leadNo, leadName: n.leadName };
        setSelectedLead(leadObj);
        sessionStorage.setItem("selectedLead", JSON.stringify(leadObj));
        localStorage.setItem("selectedLead", JSON.stringify(leadObj));
        if (n.type === "Lead") {
          navigate("/LeadReview", { state: { caseDetails: caseObj, leadDetails: leadObj } });
        } else if (n.type === "LeadReturn") {
          navigate("/LRInstruction", { state: { caseDetails: caseObj, leadDetails: leadObj } });
        }
      }
    } catch (err) {
      console.error("Notification navigation failed:", err);
    } finally {
      setNavigating(null);
    }
  };

  const handleChatClick = (index) => {
    setNewNotifs(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmailClick = (index) => {
    setEmails((prev) => Math.max(0, prev - 1));
    setEmailList((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <nav className="NavbarItems">    
      {/* Left Section: Logo and PIMS Text */}
       <div className="navbar-left">
    <img
      src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
      alt="Police Department"
      className="brand-badge"
    />
    <div className="brand-copy">
      <span className="brand-title">PIMS</span>
      <span className="brand-subtitle">Police Investigation Management System</span>
    </div>
  </div>

      {/* Right Section: Icons & Profile */}
      <div className="profile">

           {/* User Profile Info */}
           {/* <div className="user-profile">
           <div className="userImg">

          <i className="fa-solid fa-user"></i>
            <div className="user-ident">
          <div className="username">{username || "Guest"}</div>
      </div>
      </div>
      {showRole && <div className="user-role">Role: {role}</div>}
        </div> */}
        <div className="user-profile">
  <div className="user-row">
    <i className="fa-solid fa-user" aria-hidden="true"></i>
    <span className="username">{username || "Guest"}</span>
  </div>
    {showRole && <span className="user-sep" aria-hidden="true"></span>}
     {showRole && <div className="user-role">Role: {role}</div>}
</div>

        {/* <div className="user-profile">
  <div className="user-row">
    {showRole && <div className="user-role">Role: {role}</div>}
  </div>
</div> */}


        <ul>
          {/* Home */}
          <li>
            <img
              src={`${process.env.PUBLIC_URL}/Materials/home-white.png`}
              alt="Home"
              onClick={() => navigate("/HomePage", { state: { activeTab: "cases" } })}
              className="icon-img"
            />
          </li>

          {/* Emails */}
          {/* <li className="dropdown1">
            <i
              className="fa-solid fa-envelope"
              onClick={() => {
                setShowEmails(!showEmails);
                setShowChats(false);
                setShowNotifications(false);
              }}
            ></i>
            {emails > 0 && <span className="badge">{emails}</span>}
            {showEmails && (
              <div className="dropdown-list">
                {emailList.map((email, index) => (
                  <div 
                    key={index} 
                    className="dropdown-item" 
                    onClick={() => handleEmailClick(index)}
                  >
                    {email}
                  </div>
                ))}
              </div>
            )}
          </li> */}

          {/* Chats */}
          {/* <li className="dropdown1">
            <i
              className="fa-brands fa-rocketchat"
              onClick={() => {
                setShowChats(!showChats);
                setShowEmails(false);
                setShowNotifications(false);
              }}
            ></i>
            {chats > 0 && <span className="badge">{chats}</span>}
            {showChats && (
              <div className="dropdown-list">
                {chatList.map((chat, index) => (
                  <div 
                    key={index} 
                    className="dropdown-item" 
                    onClick={() => handleChatClick(index)}
                  >
                    {chat}
                  </div>
                ))}
              </div>
            )}
          </li> */}

          {/* Notifications */}
          <li className="dropdown1">
            <i
              className="fa-solid fa-bell"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowChats(false);
                setShowEmails(false);
              }}
            ></i>
            {newNotifs.length > 0 && <span className="badge">{newNotifs.length}</span>}
            {showNotifications && (
              <div className="dropdown-list">
                <div className="dropdown-notif-header">
                  Notifications
                </div>
                {newNotifs.length > 0
                  ? newNotifs.map((n) => {
                      const { letter, color } = getNotifType(n);
                      const isLoading = navigating === n._id;
                      return (
                        <div
                          key={n._id}
                          className={`dropdown-itemNB${isLoading ? " loading" : ""}`}
                          onClick={() => !isLoading && handleNotificationClick(n)}
                        >
                          <div className="notif-type-badge" style={{ backgroundColor: color }}>
                            {letter}
                          </div>
                          <div className="notif-body">
                            <div className="notif-content">
                              {isLoading
                                ? <em>Loading…</em>
                                : <><strong>{n.assignedBy}</strong> {n.action1}
                                    {n.post1 && <strong> {n.post1}</strong>}
                                  </>
                              }
                            </div>
                            <div className="notif-date">
                              {n.type}&nbsp;&bull;&nbsp;
                              {new Date(n.time).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric"
                              })}{" "}
                              {new Date(n.time).toLocaleTimeString("en-US", {
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : <div className="dropdown-item empty">No new notifications</div>
                }
              </div>
            )}
          </li>

          {/* Profile */}
          {/* <li>
            <Link to="#">
              <i className="fa-solid fa-user-pen"></i>
            </Link>
          </li> */}

          {/* Logout */}
          <li>
            <Link
              to="#"
               onClick={e => {
              e.preventDefault();
              setLogoutConfirmOpen(true);
            }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </Link>
          </li>
        </ul>
      </div>
       <AlertModal
        isOpen={logoutConfirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          doLogout();
        }}
        onClose={() => setLogoutConfirmOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
















