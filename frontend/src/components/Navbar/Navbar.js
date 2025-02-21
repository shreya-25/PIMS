import React, { useEffect, useState } from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [username, setUsername] = useState("");
  const [notifications, setNotifications] = useState(0);
  const [chats, setChats] = useState(0);
  const [emails, setEmails] = useState(0);

  // States to toggle dropdowns
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showEmails, setShowEmails] = useState(false);

  // Lists for notifications, chats, and emails
  const [notificationList, setNotificationList] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [emailList, setEmailList] = useState([]);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
      setUsername(loggedInUser);
    }

    // Simulated API data fetching
    const fetchData = () => {
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
    };

    fetchData();
  }, []);

  // Handler to remove an item from a list and update counts
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
      <div className="profile">
        <div className="user-profile">
          <Link to="#">
            <i className="fa-solid fa-user"></i>
          </Link>
          <span className="username">{username || "Guest"}</span>
        </div>
        <ul>
          {/* Emails */}
          <li className="dropdown">
            <i
              className="fa-solid fa-envelope"
              onClick={() => {
                // setShowEmails(!showEmails);
                // setShowChats(false);
                // setShowNotifications(false);
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
          </li>

          {/* Chats */}
          <li className="dropdown">
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
          </li>

          {/* Notifications */}
          <li className="dropdown">
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
          </li>
          <li>
            <Link to="#">
              <i className="fa-solid fa-user-pen"></i>
            </Link>
          </li>
          <li>
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault(); // Prevent navigation
                  if (window.confirm("Are you sure you want to log out?")) {
                    // Perform logout logic here
                    localStorage.removeItem("loggedInUser"); // Clear user data
                    window.location.href = "/"; // Redirect to home or login page
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
















