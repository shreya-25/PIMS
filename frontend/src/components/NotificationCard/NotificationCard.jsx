import React, { useState } from "react";
import "./NotificationCard.css";
import SearchBar from "../Searchbar/Searchbar";

const NotificationCard = ({ acceptLead }) => {
  // Initial state for all notifications
  const [allNotifications, setAllNotifications] = useState([
    {
      id: 1,
      name: "Officer 1",
      action1: "assigned you a new case",
      post1: "\"Cook Street School Threat\"",
      time: "1m ago",
      unread: true,
    },
    {
      id: 2,
      name: "Officer 2",
      action1: "assigned you a new lead titled",
      post1: "\"Lead 45: Interview Mr. John\"",
      action2: "related to the case",
      post2: "\"Main Street Murder\"",
      time: "5m ago",
      unread: true,
    },
    {
      id: 3,
      name: "Officer 1",
      action1: "approved the submitted lead return for the lead titled",
      group: "\"Lead 2: Collect Audio Record from Dispatcher\"",
      time: "1 day ago",
      unread: true,
    },
    {
      id: 4,
      name: "Officer 1",
      action1: "returned the submitted lead return for the lead titled",
      post1: "\"Lead 2: Collect Audio Record from Dispatcher\"",
      action2: "with the following comments",
      time: "5 days ago",
      unread: false,
      message: "Please add the person details in the return",
    }
  ]);

  // State to toggle view all notifications section
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false); // New state for SearchBar visibility

  // Handle when a notification is viewed (Mark as Read)
  const handleView = (id) => {
    setAllNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    );
  };

  return (
    <div className="notification-bar">
      {/* Clickable Section Headers */}
      <div className="headerNC">
        <h3 className="clickable-header">
          New Notifications <span className="count">{allNotifications.filter(n => n.unread).length}</span>
        </h3>
        <h3 
          className="clickable-header" 
          onClick={() => {
            setShowAllNotifications(!showAllNotifications);
            setShowSearchBar(!showSearchBar); // Toggle SearchBar visibility
          }}
        >
          View All Notifications
        </h3>
      </div>

      {/* Show Search Bar when "View All Notifications" is clicked */}
      {showSearchBar && <SearchBar />}

      {/* New Notifications Section - Shows only Unread */}
      <div className="notifications-list">
        {allNotifications.filter(n => n.unread).map((notification) => (
          <div key={notification.id} className="notification-card unread">
            <div className="profile-pic">
              <i className="fa-solid fa-user"></i>
            </div>
            <div className="notification-content">
              <div className="notification-text">
                <p>
                  <strong>{notification.name}</strong> {notification.action1}{" "}
                  {notification.post1 && <strong>{notification.post1}</strong>}
                  {" "}{notification.action2}{" "}
                  {notification.post2 && <strong>{notification.post2}</strong>}
                  {notification.group && <strong> {notification.group}</strong>}
                </p>
                {notification.message && (
                  <div className="message-box">{notification.message}</div>
                )}
                <span className="time">{notification.time}</span>
              </div>
              <div className="buttons-container">
                <button className="view-btnNC" onClick={() => handleView(notification.id)}>View</button>
                {notification.action1.includes("assigned you a new lead") || 
                 notification.action1.includes("assigned you a new case") ? (
                  <button className="accept-btnNC"  onClick={() => {
                    if (window.confirm(`Do you want to accept this lead?`)) {
                      acceptLead(notification.id);
                    }
                  }}>Accept</button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Notifications Section */}
      {showAllNotifications && (
        <div className="notifications-list">
          {allNotifications.map((notification) => (
            <div key={notification.id} className={`notification-card ${notification.unread ? "unread" : "read"}`}>
              <div className="profile-pic">
                <i className="fa-solid fa-user"></i>
              </div>
              <div className="notification-content">
                <div className="notification-text">
                  <p>
                    <strong>{notification.name}</strong> {notification.action1}{" "}
                    {notification.post1 && <strong>{notification.post1}</strong>}
                    {" "}{notification.action2}{" "}
                    {notification.post2 && <strong>{notification.post2}</strong>}
                    {notification.group && <strong> {notification.group}</strong>}
                  </p>
                  {notification.message && (
                    <div className="message-box">{notification.message}</div>
                  )}
                  <span className="time">{notification.time}</span>
                </div>
                <div className="buttons-container">
                  <button className="view-btnNC">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCard;
