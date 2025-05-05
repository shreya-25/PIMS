import React, { useState, useEffect, useContext } from "react";
import { CaseContext } from "../../Pages/CaseContext";
import "./NotificationCard.css";
import SearchBar from "../Searchbar/Searchbar";
import axios from "axios"; 
import { useNavigate } from "react-router-dom";
import api from "../../api"


const NotificationCard1 = ({ acceptLead, signedInOfficer }) => {
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unacceptedNotifications,  setUnacceptedNotifications ] = useState([]);
  const [openCaseNotifications, setOpenCaseNotifications] = useState([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setSelectedCase, setSelectedLead } = useContext(CaseContext);
  const navigate = useNavigate();

  const fetchUnreadNotifications = async () => {
    try {
        setLoading(true);
        const response = await api.get(`/api/notifications/user/${signedInOfficer}`);

        // const newUnread = response.data.filter(notification => notification.unread ||  !notification.accepted);
        const allNotifications = response.data;
    
        const newUnread = allNotifications.filter((notification) => {
          // Check if `action1` mentions a new case or lead
          const isNewCaseOrLead =
            notification.action1.includes("assigned you to a new case") ||
            notification.action1.includes("assigned you to a new lead");
          
          // If it's a new case or lead: return notifications that are unread OR not accepted
          // Otherwise: return notifications that are unread
          if (isNewCaseOrLead) {
            return notification.unread || !notification.accepted;
          } else {
            return notification.unread;
          }
        });
        const sortedUnread = newUnread.sort((a, b) => new Date(b.time) - new Date(a.time));

        setUnreadNotifications(sortedUnread); 
        setLoading(false);
    } catch (err) {
        setError("Failed to load notifications");
        setLoading(false);
    }
  };

  const fetchOpenCaseNotifications = async () => {
    try {
        setLoading(true);
        const response = await api.get(`/api/notifications/open/user/${signedInOfficer}`);
        const sortedNotifications = response.data.sort((a, b) => new Date(b.time) - new Date(a.time));

        setOpenCaseNotifications(sortedNotifications);
        setLoading(false);
    } catch (err) {
        setError("Failed to load notifications");
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
  }, [signedInOfficer]);

  const getNotificationType = (notification) => {
    if (notification.action1.includes("assigned you to a new case")) {
      return { letter: "C", color: "blue" }; // Case: Blue Circle
    }
    if (notification.action1.includes("assigned you to a new lead")) {
      return { letter: "L", color: "green" }; // Lead: Green Circle
    }
    if (notification.action1.includes("returned a lead")) {
      return { letter: "LR", color: "red" }; // Lead Return: Red Circle
    }
    return { letter: "LR", color: "gray" }; // Unknown Type: Gray Circle
  };

  const handleView = async (_id) => {
    try {
      console.log("🔹 Received _id in handleView:", _id);
      if (!_id) return console.error("❌ Error: `_id` is undefined.");
  
      // Find the notification
      const notification = unreadNotifications.find(n => n._id === _id);
      if (!notification) {
        return console.error("❌ Error: No matching notification found in New Notifications.");
      }
  
      const { notificationId } = notification;
      if (!notificationId) {
        return console.error("❌ Error: `notificationId` is undefined.");
      }
  
      // Determine role
      const role = signedInOfficer === notification.assignedBy
        ? "Case Manager"
        : "Investigator";
  
      // Persist role
      localStorage.setItem("role", role);
      console.log(localStorage);
  
      console.log("🔹 Marking notification as read:", notificationId);
      await api.put(`/api/notifications/mark-read/${notificationId}`, { unread: false });
  
      // Remove from unread list
      setUnreadNotifications(prev =>
        prev.filter(n => n._id !== _id)
      );
  
      // Navigate
      const baseState = {
        // caseDetails: {
        //   id: notification.caseNo,
        //   title: notification.caseName,
        //   role, 
        //   // only add lead fields if present
        //   ...(notification.leadNo ? {
        //     leadNo: notification.leadNo,
        //     leadName: notification.leadName
        //   } : {})
        // }
        caseNo:   notification.caseName,
        caseName: notification.caseNo,
        role,
        ...(notification.leadNo && {
          leadNo:   notification.leadNo,
          leadName: notification.leadName})
      };

      setSelectedCase(baseState);

      setSelectedLead({
        leadNo:   notification.leadNo,
        leadName: notification.leadName,
      });

      localStorage.setItem("selectedCase", JSON.stringify(baseState));

      console.log("selectedCase", baseState);
  
      if (notification.action1.includes("assigned you to a new case")) {
        navigate("/CaseInformation", { state: baseState });
      }
      else if (notification.action1.includes("assigned you to a new lead")) {
        navigate("/LeadReview", { state: baseState });
      }
      else {
        navigate("/LRInstructions", { state: baseState });
      }
  
    } catch (error) {
      console.error(
        "❌ Error marking notification as read:",
        error.response?.data || error
      );
    }
  };
  


const handleAccept = async (_id) => {
  try {
      if (!window.confirm("Do you want to accept this lead?")) return;

      console.log("🔹 Received _id in handleAccept:", _id);

      if (!_id) {
          console.error("❌ Error: `_id` is undefined. Cannot determine `notificationId`.");
          return;
      }

      // ✅ Find notification in either list
      const notification = [...unreadNotifications, ...openCaseNotifications].find(n => n._id === _id);

      if (!notification) {
          console.error("❌ Error: No matching notification found for _id:", _id);
          return;
      }

      const notificationId = notification.notificationId;

      if (!notificationId) {
          console.error("❌ Error: `notificationId` is undefined in the found notification object:", notification);
          return;
      }

      console.log("🔹 Sending request with notificationId:", notificationId);

      // ✅ Make API request to accept lead
      const response = await api.put(`/api/notifications/accept/${notificationId}`, {});
      const token = localStorage.getItem("token");
      await api.put(
        `/api/lead/status/accepted`,
          {
            leadNo:   notification.leadNo,
            leadName: notification.leadName,
            caseNo:   notification.caseName,
           caseName: notification.caseNo
          },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        

      console.log("✅ Case accepted successfully", response.data);

      // ✅ Remove from "New Notifications"
      setUnreadNotifications((prevNotifications) =>
          prevNotifications.filter((n) => n._id !== _id)
      );

      // ✅ Now add it to "View All Notifications"
      setOpenCaseNotifications((prevNotifications) => [
          ...prevNotifications,
          { ...notification, accepted: true }
      ]);

  } catch (error) {
      console.error("❌ Error accepting Case:", error.response ? error.response.data : error);
  }
};

  
  
    if (loading) {
      return <p>Loading notifications...</p>;
    }
  
    if (error) {
      return <p className="error">{error}</p>;
    }

  return (
    <div className="notification-bar">
      <div className="headerNC">
        <h3 className="clickable-header" onClick={() => { 
          fetchUnreadNotifications();
          setShowAllNotifications(false);
          setShowSearchBar(false);
        }}>
          New Notifications <span className="count">{unreadNotifications.length}</span>
        </h3>
        <h3 className="clickable-header" onClick={() => { 
          setShowAllNotifications(true);
          setShowSearchBar(true);
          fetchOpenCaseNotifications();
        }}>
          View All Notifications
        </h3>
      </div>

      <div className="searchbar-container">
        {showSearchBar && <SearchBar />}
      </div>

      {!showAllNotifications && (
        <div className="notifications-list">
          {unreadNotifications.map(notification => {
            const { letter, color } = getNotificationType(notification);

            return (
              <div key={notification._id} className={`notification-card ${notification.unread ? "unread" : "read"}`}>
                <div className="circle-icon" style={{ backgroundColor: color }}>
                  <span className="notification-letter">{letter}</span>
                </div>
                <div className="notification-content">
                <div className="notification-text">
                  <p>
                    <strong>{notification.assignedBy}</strong> {notification.action1}{" "}
                    {notification.post1 && <strong>{notification.post1}</strong>}{" "}
                    {notification.action2}{" "}
                    {notification.post2 && <strong>{notification.post2}</strong>}
                  </p>
                  {notification.comment && <div className="message-box">{notification.comment}</div>}
                  <span className="time">{new Date(notification.time).toLocaleString()}</span>
                </div>
                <div className="buttons-container">
                  <button className="view-btnNC" onClick={() => handleView(notification._id)}>
                      View
                  </button>

                  {(notification.action1.includes("assigned you to a new lead") ||
                    notification.action1.includes("assigned you to a new case")) && (
                    <button
                      className={`accept-btnNC ${notification.accepted ? "accepted-btnNC" : ""}`}
                      onClick={() => handleAccept(notification._id)}
                      disabled={notification.accepted}
                    >
                      {notification.accepted ? "Accept" : "Accept"}
                    </button>
                  )}
                </div>
              </div>
              </div>
            );
          })}
        </div>
      )}

      {showAllNotifications && (
        <div className="notifications-list">
          {openCaseNotifications.map(notification => {
            const { letter, color } = getNotificationType(notification);

            return (
              <div key={notification._id} className={`notification-card ${notification.unread ? "unread" : "read"} gray-background`}>
                <div className="circle-icon" style={{ backgroundColor: color }}>
                  <span className="notification-letter">{letter}</span>
                </div>
                <div className="notification-content">
                <div className="notification-text">
                  <p>
                    <strong>{notification.assignedBy}</strong> {notification.action1}{" "}
                    {notification.post1 && <strong>{notification.post1}</strong>}{" "}
                    {notification.action2}{" "}
                    {notification.post2 && <strong>{notification.post2}</strong>}
                  </p>
                  {notification.comment && <div className="message-box">{notification.comment}</div>}
                  <span className="time">{new Date(notification.time).toLocaleString()}</span>
                </div>
                <div className="buttons-container">
                <button className="view-btnNC" onClick={() => handleView(notification._id)}>View</button>


                  {(notification.action1.includes("assigned you to a new lead") ||
                    notification.action1.includes("assigned you to a new case")) && (
                      <button
                      className={`accept-btnNC ${notification.accepted ? 'accepted-btnNC' : ''}`}
                      disabled={notification.accepted}
                    >
                      {notification.accepted ? 'Accept' : 'Accept'}
                    </button>
                  )}
                </div>
              </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationCard1;
