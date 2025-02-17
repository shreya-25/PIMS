// import React, { useState } from "react";
// import "./NotificationCard.css";
// import SearchBar from "../Searchbar/Searchbar";

// const NotificationCard = ({ acceptLead }) => {
//   // Initial state for all notifications
//   const [allNotifications, setAllNotifications] = useState([
//     {
//       id: 1,
//       name: "Officer 1",
//       action1: "assigned you a new case",
//       post1: "\"Cook Street School Threat\"",
//       time: "1m ago",
//       unread: true,
//     },
//     {
//       id: 2,
//       name: "Officer 2",
//       action1: "assigned you a new lead titled",
//       post1: "\"Lead 45: Interview Mr. John\"",
//       action2: "related to the case",
//       post2: "\"Main Street Murder\"",
//       time: "5m ago",
//       unread: true,
//     },
//     {
//       id: 3,
//       name: "Officer 1",
//       action1: "approved the submitted lead return for the lead titled",
//       group: "\"Lead 2: Collect Audio Record from Dispatcher\"",
//       time: "1 day ago",
//       unread: true,
//     },
//     {
//       id: 4,
//       name: "Officer 1",
//       action1: "returned the submitted lead return for the lead titled",
//       post1: "\"Lead 2: Collect Audio Record from Dispatcher\"",
//       action2: "with the following comments",
//       time: "5 days ago",
//       unread: false,
//       message: "Please add the person details in the return",
//     }
//   ]);

//   // State to toggle view all notifications section
//   const [showAllNotifications, setShowAllNotifications] = useState(false);
//   const [showSearchBar, setShowSearchBar] = useState(false); // New state for SearchBar visibility

//   // Handle when a notification is viewed (Mark as Read)
//   const handleView = (id) => {
//     setAllNotifications((prevNotifications) =>
//       prevNotifications.map((notification) =>
//         notification.id === id ? { ...notification, unread: false } : notification
//       )
//     );
//   };

//   return (
//     <div className="notification-bar">
//       {/* Clickable Section Headers */}
//       <div className="headerNC">
//         <h3 className="clickable-header">
//           New Notifications <span className="count">{allNotifications.filter(n => n.unread).length}</span>
//         </h3>
//         <h3 
//           className="clickable-header" 
//           onClick={() => {
//             setShowAllNotifications(!showAllNotifications);
//             setShowSearchBar(!showSearchBar); // Toggle SearchBar visibility
//           }}
//         >
//           View All Notifications
//         </h3>
//       </div>

//       {/* Show Search Bar when "View All Notifications" is clicked */}
//       {showSearchBar && <SearchBar />}

//       {/* New Notifications Section - Shows only Unread */}
//       <div className="notifications-list">
//         {allNotifications.filter(n => n.unread).map((notification) => (
//           <div key={notification.id} className="notification-card unread">
//             <div className="profile-pic">
//               <i className="fa-solid fa-user"></i>
//             </div>
//             <div className="notification-content">
//               <div className="notification-text">
//                 <p>
//                   <strong>{notification.name}</strong> {notification.action1}{" "}
//                   {notification.post1 && <strong>{notification.post1}</strong>}
//                   {" "}{notification.action2}{" "}
//                   {notification.post2 && <strong>{notification.post2}</strong>}
//                   {notification.group && <strong> {notification.group}</strong>}
//                 </p>
//                 {notification.message && (
//                   <div className="message-box">{notification.message}</div>
//                 )}
//                 <span className="time">{notification.time}</span>
//               </div>
//               <div className="buttons-container">
//                 <button className="view-btnNC" onClick={() => handleView(notification.id)}>View</button>
//                 {notification.action1.includes("assigned you a new lead") || 
//                  notification.action1.includes("assigned you a new case") ? (
//                   <button className="accept-btnNC"  onClick={() => {
//                     if (window.confirm(`Do you want to accept this lead?`)) {
//                       acceptLead(notification.id);
//                     }
//                   }}>Accept</button>
//                 ) : null}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* View All Notifications Section */}
//       {showAllNotifications && (
//         <div className="notifications-list">
//           {allNotifications.map((notification) => (
//             <div key={notification.id} className={`notification-card ${notification.unread ? "unread" : "read"}`}>
//               <div className="profile-pic">
//                 <i className="fa-solid fa-user"></i>
//               </div>
//               <div className="notification-content">
//                 <div className="notification-text">
//                   <p>
//                     <strong>{notification.name}</strong> {notification.action1}{" "}
//                     {notification.post1 && <strong>{notification.post1}</strong>}
//                     {" "}{notification.action2}{" "}
//                     {notification.post2 && <strong>{notification.post2}</strong>}
//                     {notification.group && <strong> {notification.group}</strong>}
//                   </p>
//                   {notification.message && (
//                     <div className="message-box">{notification.message}</div>
//                   )}
//                   <span className="time">{notification.time}</span>
//                 </div>
//                 <div className="buttons-container">
//                   <button className="view-btnNC">View</button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationCard;

// import React, { useState, useEffect } from "react";
// import "./NotificationCard.css";
// import SearchBar from "../Searchbar/Searchbar";
// import axios from "axios"; // Import axios for API calls

// const NotificationCard = ({ acceptLead, signedInOfficer }) => {
//   // State for storing notifications
//   const [unreadNotifications, setUnreadNotifications] = useState([]);
//   const [openCaseNotifications, setOpenCaseNotifications] = useState([]);
//   const [showAllNotifications, setShowAllNotifications] = useState(false);
//   const [showSearchBar, setShowSearchBar] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch unread notifications and open case notifications for the signed-in officer
//   useEffect(() => {
//     const fetchNotifications = async () => {
//       try {
//         // Fetch Unread Notifications
//         // const unreadResponse = await axios.get(`https://pims-backend.onrender.com/api/notifications/user/Officer 916`);
//         const unreadResponse = await axios.get(`http://localhost:5000/api/notifications/user/Officer 916`);

//         setUnreadNotifications(unreadResponse.data.filter(notification => notification.unread));

//         // Fetch Open Case Notifications
//         // const openResponse = await axios.get(`/api/notifications/open/user/${signedInOfficer}`);
//         const openResponse = await axios.get(`http://localhost:5000/api/notifications/open/user/Officer 916`);

//         setOpenCaseNotifications(openResponse.data);

//         setLoading(false);
//       } catch (err) {
//         setError("Failed to load notifications");
//         setLoading(false);
//       }
//     };

//     fetchNotifications();
//   }, [signedInOfficer]); // Runs whenever `signedInOfficer` changes

//   // Handle when a notification is viewed (Mark as Read)
//   const handleView = async (id) => {
//     try {
//       await axios.put(`/api/notifications/${id}`, { unread: false });

//       // Update the unread notifications list
//       setUnreadNotifications((prevNotifications) =>
//         prevNotifications.filter((notification) => notification._id !== id)
//       );

//       // Refresh open case notifications (as it may contain the read one)
//       setOpenCaseNotifications((prevNotifications) =>
//         prevNotifications.map((notification) =>
//           notification._id === id ? { ...notification, unread: false } : notification
//         )
//       );
//     } catch (error) {
//       console.error("Error marking notification as read", error);
//     }
//   };

//   if (loading) {
//     return <p>Loading notifications...</p>;
//   }

//   if (error) {
//     return <p className="error">{error}</p>;
//   }

//   return (
//     <div className="notification-bar">
//       {/* Clickable Section Headers */}
//       <div className="headerNC">
//         <h3 className="clickable-header">
//           New Notifications <span className="count">{unreadNotifications.length}</span>
//         </h3>
//         <h3
//           className="clickable-header"
//           onClick={() => {
//             setShowAllNotifications(!showAllNotifications);
//             setShowSearchBar(!showSearchBar); // Toggle SearchBar visibility
//           }}
//         >
//           View All Notifications
//         </h3>
//       </div>

//       {/* Show Search Bar when "View All Notifications" is clicked */}
//       {showSearchBar && <SearchBar />}

//       {/* New Notifications Section - Shows only Unread */}
//       <div className="notifications-list">
//         {unreadNotifications.map((notification) => (
//           <div key={notification._id} className="notification-card unread">
//             <div className="profile-pic">
//               <i className="fa-solid fa-user"></i>
//             </div>
//             <div className="notification-content">
//               <div className="notification-text">
//                 <p>
//                   <strong>{notification.assignedBy}</strong> {notification.action1}{" "}
//                   {notification.post1 && <strong>{notification.post1}</strong>}
//                   {" "}{notification.action2}{" "}
//                   {notification.post2 && <strong>{notification.post2}</strong>}
//                 </p>
//                 {notification.comment && <div className="message-box">{notification.comment}</div>}
//                 <span className="time">{new Date(notification.time).toLocaleString()}</span>
//               </div>
//               <div className="buttons-container">
//                 <button className="view-btnNC" onClick={() => handleView(notification._id)}>View</button>
//                 {notification.action1.includes("assigned you a new lead") || 
//                  notification.action1.includes("assigned you a new case") ? (
//                   <button className="accept-btnNC" onClick={() => {
//                     if (window.confirm(`Do you want to accept this lead?`)) {
//                       acceptLead(notification._id);
//                     }
//                   }}>Accept</button>
//                 ) : null}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* View All Notifications Section - Only Open Cases */}
//       {showAllNotifications && (
//         <div className="notifications-list">
//           {openCaseNotifications.map((notification) => (
//             <div key={notification._id} className={`notification-card ${notification.unread ? "unread" : "read"}`}>
//               <div className="profile-pic">
//                 <i className="fa-solid fa-user"></i>
//               </div>
//               <div className="notification-content">
//                 <div className="notification-text">
//                   <p>
//                     <strong>{notification.assignedBy}</strong> {notification.action1}{" "}
//                     {notification.post1 && <strong>{notification.post1}</strong>}
//                     {" "}{notification.action2}{" "}
//                     {notification.post2 && <strong>{notification.post2}</strong>}
//                   </p>
//                   {notification.comment && <div className="message-box">{notification.comment}</div>}
//                   <span className="time">{new Date(notification.time).toLocaleString()}</span>
//                 </div>
//                 <div className="buttons-container">
//                   <button className="view-btnNC">View</button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationCard;

// import React, { useState, useEffect } from "react";
// import "./NotificationCard.css";
// import SearchBar from "../Searchbar/Searchbar";
// import axios from "axios"; // Import axios for API calls

// const NotificationCard = ({ acceptLead, signedInOfficer }) => {
//   // State for storing notifications
//   const [unreadNotifications, setUnreadNotifications] = useState([]);
//   const [openCaseNotifications, setOpenCaseNotifications] = useState([]);
//   const [showAllNotifications, setShowAllNotifications] = useState(false);
//   const [showSearchBar, setShowSearchBar] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Function to fetch unread/unaccepted notifications
//   const fetchUnreadNotifications = async () => {
//     try {
//       setLoading(true);
//       const unreadResponse = await axios.get(
//         `http://localhost:5000/api/notifications/user/${signedInOfficer}`
//       );

//       const newUnread = unreadResponse.data.filter(
//         (notification) => notification.unread || !notification.accepted
//       );

//       setUnreadNotifications(newUnread);
//       setLoading(false);
//     } catch (err) {
//       setError("Failed to load notifications");
//       setLoading(false);
//     }
//   };

//   // Function to fetch all notifications for open cases
//   const fetchOpenCaseNotifications = async () => {
//     try {
//       setLoading(true);
//       const openResponse = await axios.get(
//         `http://localhost:5000/api/notifications/open/user/${signedInOfficer}`
//       );

//       setOpenCaseNotifications(openResponse.data);
//       setLoading(false);
//     } catch (err) {
//       setError("Failed to load notifications");
//       setLoading(false);
//     }
//   };

//   // Fetch unread notifications on mount
//   useEffect(() => {
//     fetchUnreadNotifications();
//   }, [signedInOfficer]);

//   // Handle when a notification is viewed (Mark as Read)
//   const handleView = async (id, isLead) => {
//     try {
//       if (!isLead) {
//         await axios.put(`http://localhost:5000/api/notifications/${id}`, {
//           unread: false,
//         });

//         // Refresh notifications
//         fetchUnreadNotifications();
//         fetchOpenCaseNotifications();
//       }
//     } catch (error) {
//       console.error("Error marking notification as read", error);
//     }
//   };

//   // Handle when a lead is accepted (Mark as Read & Disable Accept Button)
//   const handleAccept = async (id) => {
//     try {
//       if (!window.confirm(`Do you want to accept this lead?`)) return;

//       await acceptLead(id);
//       await axios.put(`http://localhost:5000/api/notifications/${id}`, {
//         unread: false,
//         accepted: true,
//       });

//       // Refresh notifications
//       fetchUnreadNotifications();
//       fetchOpenCaseNotifications();
//     } catch (error) {
//       console.error("Error accepting lead", error);
//     }
//   };

//   if (loading) {
//     return <p>Loading notifications...</p>;
//   }

//   if (error) {
//     return <p className="error">{error}</p>;
//   }

//   return (
//     <div className="notification-bar">
//       {/* Clickable Section Headers */}
//       <div className="headerNC">
//         <h3
//           className="clickable-header"
//           onClick={() => {
//             fetchUnreadNotifications();
//             setShowAllNotifications(false);
//             setShowSearchBar(false);
//           }}
//         >
//           New Notifications <span className="count">{unreadNotifications.length}</span>
//         </h3>
//         <h3
//           className="clickable-header"
//           onClick={() => {
//             setShowAllNotifications(true);
//             setShowSearchBar(true);
//             fetchOpenCaseNotifications();
//           }}
//         >
//           View All Notifications
//         </h3>
//       </div>

//       {/* Show Search Bar when "View All Notifications" is clicked */}
//       {showSearchBar && <SearchBar />}

//       {/* New Notifications Section - Shows only Unread or Unaccepted Leads */}
//       {!showAllNotifications && (
//         <div className="notifications-list">
//           {unreadNotifications.map((notification) => (
//             <div
//               key={notification._id}
//               className={`notification-card ${notification.unread ? "unread" : "read"} ${
//                 notification.accepted ? "gray-background" : ""
//               }`}
//             >
//               <div className="profile-pic">
//                 <i className="fa-solid fa-user"></i>
//               </div>
//               <div className="notification-content">
//                 <div className="notification-text">
//                   <p>
//                     <strong>{notification.assignedBy}</strong> {notification.action1}{" "}
//                     {notification.post1 && <strong>{notification.post1}</strong>}
//                     {" "}{notification.action2}{" "}
//                     {notification.post2 && <strong>{notification.post2}</strong>}
//                   </p>
//                   {notification.comment && <div className="message-box">{notification.comment}</div>}
//                   <span className="time">{new Date(notification.time).toLocaleString()}</span>
//                 </div>
//                 <div className="buttons-container">
//                   <button
//                     className="view-btnNC"
//                     onClick={() =>
//                       handleView(
//                         notification._id,
//                         notification.action1.includes("assigned you a new lead") ||
//                           notification.action1.includes("assigned you a new case")
//                       )
//                     }
//                   >
//                     View
//                   </button>
//                   {(notification.action1.includes("assigned you a new lead") ||
//                     notification.action1.includes("assigned you a new case")) && (
//                     <button
//                       className={`accept-btnNC ${notification.accepted ? "accepted-btnNC" : ""}`}
//                       onClick={() => handleAccept(notification._id)}
//                       disabled={notification.accepted} // Disable button if already accepted
//                     >
//                       {notification.accepted ? "Accepted" : "Accept"}
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* View All Notifications Section - Shows All Open Cases */}
//       {showAllNotifications && (
//         <div className="notifications-list">
//           {openCaseNotifications.map((notification) => (
//             <div
//               key={notification._id}
//               className={`notification-card ${notification.unread ? "unread" : "read"} ${
//                 notification.accepted ? "gray-background" : ""
//               }`}
//             >
//               <div className="profile-pic">
//                 <i className="fa-solid fa-user"></i>
//               </div>
//               <div className="notification-content">
//                 <div className="notification-text">
//                   <p>
//                     <strong>{notification.assignedBy}</strong> {notification.action1}{" "}
//                     {notification.post1 && <strong>{notification.post1}</strong>}
//                     {" "}{notification.action2}{" "}
//                     {notification.post2 && <strong>{notification.post2}</strong>}
//                   </p>
//                   {notification.comment && <div className="message-box">{notification.comment}</div>}
//                   <span className="time">{new Date(notification.time).toLocaleString()}</span>
//                 </div>
//                 <div className="buttons-container">
//                   <button className="view-btnNC" onClick={() => handleView(notification._id)}>
//                     View
//                   </button>
//                   {(notification.action1.includes("assigned you a new lead") ||
//                     notification.action1.includes("assigned you a new case")) && (
//                     <button
//                       className={`accept-btnNC ${notification.accepted ? "accepted-btnNC" : ""}`}
//                       onClick={() => handleAccept(notification._id)}
//                       disabled={notification.accepted} // Disable button if already accepted
//                     >
//                       {notification.accepted ? "Accepted" : "Accept"}
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationCard;

import React, { useState, useEffect } from "react";
import "./NotificationCard.css";
import SearchBar from "../Searchbar/Searchbar";
import axios from "axios"; // Import axios for API calls

const NotificationCard = ({ acceptLead, signedInOfficer }) => {
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [openCaseNotifications, setOpenCaseNotifications] = useState([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch unread/unaccepted notifications (Exclude Accepted Leads)
  const fetchUnreadNotifications = async () => {
    try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/notifications/user/${signedInOfficer}`);

        // ✅ Only include notifications that are unread AND not accepted
        const newUnread = response.data.filter(notification => notification.unread && !notification.accepted);

        // ✅ Sort notifications by `time` in descending order
        const sortedUnread = newUnread.sort((a, b) => new Date(b.time) - new Date(a.time));

        // ✅ Correctly update state
        setUnreadNotifications(sortedUnread); 

        setLoading(false);
    } catch (err) {
        setError("Failed to load notifications");
        setLoading(false);
    }
};


  //  Fetch all notifications for open cases
  const fetchOpenCaseNotifications = async () => {
    try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/notifications/open/user/${signedInOfficer}`);

        // ✅ Sort notifications by `time` (Descending Order)
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

  const handleView = async (_id) => {
    try {
        // ✅ Debugging: Log the received _id
        console.log("🔹 Received _id in handleView:", _id);

        if (!_id) {
            console.error("❌ Error: `_id` is undefined. Cannot determine `notificationId`.");
            return;
        }

        // ✅ Find the full notification object in the current state
        const notification = unreadNotifications.find(n => n._id === _id);

        if (!notification) {
            console.error("❌ Error: No matching notification found for _id:", _id);
            return;
        }

        const notificationId = notification.notificationId;

        if (!notificationId) {
            console.error("❌ Error: `notificationId` is undefined in the found notification object:", notification);
            return;
        }

        console.log("🔹 Sending request to mark notification as read with notificationId:", notificationId);

        // ✅ Make API request to mark as read
        await axios.put(`http://localhost:5000/api/notifications/mark-read/${notificationId}`, { unread: false });

        console.log("✅ Notification marked as read:", notificationId);

        // ✅ Remove from "New Notifications"
        setUnreadNotifications((prevNotifications) =>
            prevNotifications.filter((n) => n._id !== _id)
        );

        // ✅ Add to "View All Notifications" with updated status (read)
        setOpenCaseNotifications((prevNotifications) => [
            ...prevNotifications,
            { ...notification, unread: false }, // Ensure it's marked as read
        ]);

    } catch (error) {
        console.error("❌ Error marking notification as read:", error.response ? error.response.data : error);
    }
};




const handleAccept = async (_id) => {
  try {
      if (!window.confirm("Do you want to accept this lead?")) return;

      // ✅ Debugging: Log the received _id
      console.log("🔹 Received _id in handleAccept:", _id);

      if (!_id) {
          console.error("❌ Error: `_id` is undefined. Cannot determine `notificationId`.");
          return;
      }

      // ✅ Find the full notification object in the current state
      const notification = unreadNotifications.find(n => n._id === _id);

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

      // ✅ Make API request
      const response = await axios.put(`http://localhost:5000/api/notifications/accept/${notificationId}`, {});

      console.log("✅ Lead accepted successfully", response.data);

      // ✅ Remove from "New Notifications"
      setUnreadNotifications((prevNotifications) =>
          prevNotifications.filter((n) => n._id !== _id)
      );

      fetchOpenCaseNotifications();
  } catch (error) {
      console.error("❌ Error accepting lead:", error.response ? error.response.data : error);
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

       {/* SearchBar inside a div */}
       <div className="searchbar-container">
        {showSearchBar && <SearchBar />}
      </div>

      {/* New Notifications Section (Exclude Accepted Leads) */}
      {!showAllNotifications && (
        <div className="notifications-list">
          {unreadNotifications.map(notification => (
            <div key={notification._id} className={`notification-card ${notification.unread ? "unread" : "read"}`}>
              <div className="profile-pic">
                <i className="fa-solid fa-user"></i>
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

                  {(notification.action1.includes("assigned you a new lead") ||
                    notification.action1.includes("assigned you a new case")) && (
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
          ))}
        </div>
      )}

      {/* ✅ View All Notifications Section */}
      {showAllNotifications && (
        <div className="notifications-list">
          {openCaseNotifications.map(notification => (
            <div key={notification._id} className={`notification-card ${notification.unread ? "unread" : "read"} gray-background`}>
              <div className="profile-pic">
                <i className="fa-solid fa-user"></i>
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
                  <button className="view-btnNC" onClick={() => handleView(notification.notificationId)}>
                      View
                  </button>

                  {(notification.action1.includes("assigned you a new lead") ||
                    notification.action1.includes("assigned you a new case")) && (
                    <button
                      className={`accept-btnNC accepted-btnNC`}
                      disabled
                    >
                      Accept
                    </button>
                  )}
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
