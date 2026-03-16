import React, { useState, useEffect } from "react";
import styles from "./AdminUserList.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import api from "../../api";

const ROLE_LABELS = {
  Admin: "Admin",
  CaseManager: "Case Manager",
  Investigator: "Investigator",
  "Detective Supervisor": "Detective Supervisor",
};

export const AdminUserList = () => {
  const [showAddCase, setShowAddCase] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/users/usernames", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(data.users || []);
      } catch {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className={styles["page-wrapper"]}>
      <Navbar />

      <div className={styles["main-container"]}>
        <SideBar variant="admin" onShowCaseSelector={setShowAddCase} />
        {showAddCase && (
          <SlideBar
            isOpen={showAddCase}
            hideTrigger
            onClose={() => setShowAddCase(false)}
            onAddCase={() => setShowAddCase(false)}
          />
        )}

        <div className={styles["content"]}>
          <div className={styles["card"]}>
            <div className={styles["card-header"]}>
              <h2>Registered Users</h2>
              <span className={styles["chip"]}>User Registration</span>
            </div>

            {loading && <p className={styles["state-msg"]}>Loading...</p>}
            {error && <p className={styles["error-msg"]}>{error}</p>}

            {!loading && !error && (
              <div className={styles["table-wrapper"]}>
                <table className={styles["user-table"]}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles["empty-row"]}>
                          No users registered yet.
                        </td>
                      </tr>
                    ) : (
                      users.map((u, i) => (
                        <tr key={u._id || i}>
                          <td>{i + 1}</td>
                          <td>{u.firstName || "—"}</td>
                          <td>{u.lastName || "—"}</td>
                          <td>{u.username}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`${styles["role-badge"]} ${styles[`role-${(u.role || "").replace(/\s+/g, "-")}`]}`}>
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          <td>
                            <span className={u.isActive !== false ? styles["status-active"] : styles["status-inactive"]}>
                              {u.isActive !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
