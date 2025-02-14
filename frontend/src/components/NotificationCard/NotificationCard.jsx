import React from "react";
import "./NotificationCard.css";

const NotificationCard = () => {
  const notifications = [
    {
      id: 1,
      name: "Officer 1",
      action1: "assigned you a new case",
      post1: "\"Cook Street School Threat\"",
      time: "1m ago",
      profilePic: "https://via.placeholder.com/40",
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
      profilePic: "https://via.placeholder.com/40",
      unread: true,
    },
    {
      id: 3,
      name: "Officer 1",
      action1: "approved the submitted lead return for the lead titled",
      group: "\"Lead 2: Collect Audio Record from Dispatcher\"",
      time: "1 day ago",
      profilePic: "https://via.placeholder.com/40",
      unread: true,
    },
    {
      id: 4,
      name: "Officer 1",
      action1: "returned the submitted lead return for the lead titled",
      post1: "\"Lead 2: Collect Audio Record from Dispatcher\"",
      action2: "with the following comments",
      time: "5 days ago",
      profilePic: "https://via.placeholder.com/40",
      unread: false,
      message:
        "Please add the person details in the return",
    },
  ];

  return (
    <div className="notification-bar">
      <div className="headerNC">
        <h3>Notifications <span className="count">3</span></h3>
        <button className="mark-all">Mark all as read</button>
      </div>
      <div className="notifications-list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-card ${notification.unread ? "unread" : ""}`}
          >
            {/* <img src={notification.profilePic} alt={notification.name} className="profile-pic" /> */}
            <div className="profile-pic">
            <i className="fa-solid fa-user"></i>
            </div>
            <div className="notification-content">
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationCard;
