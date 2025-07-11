import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertModal } from "../AlertModal/AlertModal";
import api from "../../api";
import "./Navbar1.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [notifications, setNotifications] = useState(0);
  const [chats, setChats] = useState(0);
  const [emails, setEmails] = useState(0);
   const [alertOpen,    setAlertOpen]    = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const [newNotifs, setNewNotifs]         = useState([]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showEmails, setShowEmails] = useState(false);

  const [notificationList, setNotificationList] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [emailList, setEmailList] = useState([]);

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

    // Sample data
    setNotifications(3);
    setChats(5);
    setEmails(4);
    
     const fetchNewOnly = async () => {
     if (!loggedInUser) return;
     try {
       const { data } = await api.get(`/api/notifications/user/${loggedInUser}`);
       // filter to only “unread” & “pending” Ongoing case/lead notifications
       const fresh = data
         .filter(n =>
           (n.type === "Case" || n.type === "Lead") &&
           n.caseStatus === "Open" &&
           n.assignedTo.some(r =>
             r.username === loggedInUser &&
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

  const handleNotificationClick = (index) => {
    // setNewNotifs(prev => prev.filter((_, i) => i !== index));
    navigate('/HomePage');
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
      <div className="navbar-left-content">
        <img
          src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
          alt="Police Department Logo"
          className="police-logo-navbar"
        />
        <span className="pims-text">PIMS</span>
      </div>

      {/* Right Section: Icons & Profile */}
      <div className="profile">

           {/* User Profile Info */}
           <div className="user-profile">
          <i className="fa-solid fa-user"></i>
          <span className="username">{username || "Guest"}</span>
        </div>
        <ul>
          {/* Home */}
          <li>
            <img
              src={`${process.env.PUBLIC_URL}/Materials/home-white.png`}
              alt="Home"
              onClick={() => handleNavigation("/HomePage")}
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
              // <div className="dropdown-list">
              //    {newNotifs.length > 0 
              //       ? newNotifs.map((n, idx) => (
              //           <div
              //             key={n._id}
              //             className="dropdown-item"
              //             onClick={() => handleNotificationClick(idx)}
              //           >
              //             <strong>{n.assignedBy}</strong> {n.action1}
              //           </div>
              //         ))
              //       : <div className="dropdown-item">No new notifications</div>
              //     }
              // </div>
               <div className="dropdown-list">
      {newNotifs.length > 0
        ? newNotifs.map((n, idx) => (
            <div
              key={n._id}
              className="dropdown-item"
              onClick={() => handleNotificationClick(idx)}
            >
              <div className="notif-content">
                <strong>{n.assignedBy}</strong> {n.action1}
              </div>
              <div className="notif-date">
                {new Date(n.time).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}{" "}
                {new Date(n.time).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>
          ))
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
















