import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AlertModal } from "../AlertModal/AlertModal";
import api from "../../api";
import styles from "./Navbar.module.css";
import { CaseContext } from "../../Pages/CaseContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCase } = useContext(CaseContext) || {};

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [username, setUsername] = useState("");
  const [newNotifs, setNewNotifs] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const roleFromCase = selectedCase?.role?.trim();
  const roleFromStorage = localStorage.getItem("userRole") || "";
  const role = roleFromCase || roleFromStorage;
  const onHome = location.pathname === "/HomePage" || location.pathname === "/";
  const showRole = !!role && !onHome;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
      setUsername(loggedInUser);
    }

    const fetchNewNotifications = async () => {
      if (!loggedInUser) return;

      try {
        const { data } = await api.get(`/api/notifications/user/${loggedInUser}`);

        // Filter to only "unread" & "pending" notifications for ongoing cases/leads
        const fresh = data
          .filter(
            (n) =>
              (n.type === "Case" || n.type === "Lead") &&
              n.caseStatus === "Open" &&
              n.assignedTo.some(
                (r) =>
                  r.username === loggedInUser &&
                  r.status === "pending" &&
                  r.unread === true
              )
          )
          .sort((a, b) => new Date(b.time) - new Date(a.time));

        setNewNotifs(fresh);
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    fetchNewNotifications();
    const intervalId = setInterval(fetchNewNotifications, 15000);

    return () => clearInterval(intervalId);
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleNavigation = (route) => {
    navigate(route);
  };

  const handleNotificationClick = () => {
    setShowNotifications(false);
    navigate("/HomePage");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "/";
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      <nav className={styles.navbar}>
        {/* Left Section: Logo and Brand */}
        <div className={styles.navbarLeft}>
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
            alt="Police Department"
            className={styles.brandBadge}
          />
          <div className={styles.brandCopy}>
            <span className={styles.brandTitle}>PIMS</span>
            <span className={styles.brandSubtitle}>
              Police Investigation Management System
            </span>
          </div>
        </div>

        {/* Right Section: User Info & Actions */}
        <div className={styles.navbarRight}>
          {/* User Profile */}
          <div className={styles.userProfile}>
            <div className={styles.userRow}>
              <i className="fa-solid fa-user" aria-hidden="true"></i>
              <span className={styles.username}>{username || "Guest"}</span>
            </div>
            {showRole && (
              <>
                <span className={styles.userSep} aria-hidden="true"></span>
                <div className={styles.userRole}>Role: {role}</div>
              </>
            )}
          </div>

          {/* Action Icons */}
          <ul className={styles.iconList}>
            {/* Home */}
            <li>
              <img
                src={`${process.env.PUBLIC_URL}/Materials/home-white.png`}
                alt="Home"
                onClick={() => handleNavigation("/HomePage")}
                className={styles.iconImg}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleNavigation("/HomePage");
                }}
              />
            </li>

            {/* Notifications */}
            <li className={styles.dropdown}>
              <i
                className="fa-solid fa-bell"
                onClick={toggleNotifications}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter") toggleNotifications();
                }}
                aria-label="Notifications"
              ></i>
              {newNotifs.length > 0 && (
                <span className={styles.badge}>{newNotifs.length}</span>
              )}
              {showNotifications && (
                <div className={styles.dropdownList}>
                  {newNotifs.length > 0 ? (
                    newNotifs.map((notification) => (
                      <div
                        key={notification._id}
                        className={styles.dropdownItem}
                        onClick={handleNotificationClick}
                      >
                        <div className={styles.notifContent}>
                          <strong>{notification.assignedBy}</strong>{" "}
                          {notification.action1}
                        </div>
                        <div className={styles.notifDate}>
                          {formatNotificationDate(notification.time)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`${styles.dropdownItem} ${styles.empty}`}>
                      No new notifications
                    </div>
                  )}
                </div>
              )}
            </li>

            {/* Logout */}
            <li>
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  setLogoutConfirmOpen(true);
                }}
                aria-label="Logout"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <AlertModal
        isOpen={logoutConfirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          handleLogout();
        }}
        onClose={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
};

export default Navbar;