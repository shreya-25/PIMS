import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import "./Navbar1.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [notifications, setNotifications] = useState(0);
  const [chats, setChats] = useState(0);
  const [emails, setEmails] = useState(0);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showEmails, setShowEmails] = useState(false);

  const [notificationList, setNotificationList] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [emailList, setEmailList] = useState([]);

  const handleNavigation = (route) => {
    navigate(route); // Navigate to respective page
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
    setNotificationList([
      "New Assigned Lead 45: Collect Audio Records from Dispatcher",
      "New Assigned Lead 20: Interview Mr. John",
      "New Assigned Lead 84: Collect Evidence from 63 Mudray Street",
    ]);
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
    setNotifications((prev) => Math.max(0, prev - 1));
    setNotificationList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChatClick = (index) => {
    setChats((prev) => Math.max(0, prev - 1));
    setChatList((prev) => prev.filter((_, i) => i !== index));
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
          {/* <li className="dropdown1">
            <i
              className="fa-solid fa-bell"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowChats(false);
                setShowEmails(false);
              }}
            ></i>
            {notifications > 0 && <span className="badge">{notifications}</span>}
            {showNotifications && (
              <div className="dropdown-list">
                {notificationList.map((notification, index) => (
                  <div
                    key={index}
                    className="dropdown-item"
                    onClick={() => handleNotificationClick(index)}
                  >
                    {notification}
                  </div>
                ))}
              </div>
            )}
          </li> */}

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
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm("Are you sure you want to log out?")) {
                  localStorage.removeItem("loggedInUser");
                  window.location.href = "/";
                }
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
















