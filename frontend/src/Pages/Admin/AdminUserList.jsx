import React, { useState, useEffect } from "react";
import styles from "./AdminUserList.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import api from "../../api";

const ROLE_LABELS = {
  Admin: "Admin",
  "Detective Supervisor": "Detective Supervisor",
  Detective: "Detective",
  "Case Specific": "Case Specific",
};


const BLANK_EDIT = {
  title: "", firstName: "", lastName: "", username: "", email: "", role: "",
  agency: "", ori: "", badgeId: "", isActive: true,
};

export const AdminUserList = () => {
  const [showAddCase, setShowAddCase] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agencyList, setAgencyList] = useState([]);

  // edit modal
  const [editUser, setEditUser] = useState(null);   // user being edited
  const [editForm, setEditForm] = useState(BLANK_EDIT);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
    api.get("/api/agencies")
      .then(({ data }) => setAgencyList(data.agencies || []))
      .catch(() => {});
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
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

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      title:     u.title     || "",
      firstName: u.firstName || "",
      lastName:  u.lastName  || "",
      username:  u.username  || "",
      email:     u.email     || "",
      role:      u.role      || "",
      agency:    u.agency    || "",
      ori:       u.ori       || "",
      badgeId:   u.badgeId   || "",
      isActive:  u.isActive !== false,
    });
    setEditError("");
    setEditSuccess("");
  };

  const closeEdit = () => {
    setEditUser(null);
    setEditError("");
    setEditSuccess("");
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "agency") {
      const match = agencyList.find((item) => item.name === value);
      setEditForm((prev) => ({ ...prev, agency: value, ori: match ? match.ori : "" }));
      return;
    }
    if (name === "ori") {
      const match = agencyList.find((item) => item.ori === value);
      setEditForm((prev) => ({ ...prev, ori: value, agency: match ? match.name : prev.agency }));
      return;
    }
    setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError("");
    setEditSuccess("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.patch(
        `/api/users/${editUser._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` }, suppressGlobalError: true }
      );
      // update local list
      setUsers((prev) => prev.map((u) => (u._id === editUser._id ? { ...u, ...data.user } : u)));
      closeEdit();
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to update user.");
    } finally {
      setEditSaving(false);
    }
  };

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
                      <th>Actions</th>
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
                            <span className={`${styles["role-badge"]} ${styles[`role-${(u.role || "").replace(/[\s/]+/g, "-")}`]}`}>
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          <td>
                            <button
                              className={styles["edit-btn"]}
                              onClick={() => openEdit(u)}
                            >
                              Edit
                            </button>
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

      {/* ── Centered modal overlay — outside main-container so fixed positioning is truly full-viewport ── */}
      {editUser && (
        <div className={styles["modal-overlay"]} onClick={closeEdit}>
          <div className={styles["modal-card"]} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles["modal-header"]}>
              <div className={styles["modal-header-left"]}>
                <h3 className={styles["modal-title"]}>Edit User</h3>
                <span className={styles["modal-username"]}>@{editUser.username}</span>
              </div>
              <button className={styles["modal-close"]} onClick={closeEdit} aria-label="Close">✕</button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className={styles["modal-form"]}>
              {/* Row 1: Title · First Name · Last Name */}
              <div className={styles["modal-row-3"]}>
                <div className={styles["modal-group"]}>
                  <label>Title</label>
                  <select name="title" value={editForm.title} onChange={handleEditChange}>
                    <option value="">— None —</option>
                    <option value="Chief">Chief</option>
                    <option value="Lt.">Lt.</option>
                    <option value="Det. Sergeant">Det. Sergeant</option>
                    <option value="P.O.">P.O.</option>
                    <option value="Det.">Det.</option>
                  </select>
                </div>
                <div className={styles["modal-group"]}>
                  <label>First Name</label>
                  <input type="text" name="firstName" value={editForm.firstName} onChange={handleEditChange} placeholder="First Name" />
                </div>
                <div className={styles["modal-group"]}>
                  <label>Last Name</label>
                  <input type="text" name="lastName" value={editForm.lastName} onChange={handleEditChange} placeholder="Last Name" />
                </div>
              </div>

              {/* Row 2: Username · Email · Role */}
              <div className={styles["modal-row-3"]}>
                <div className={styles["modal-group"]}>
                  <label>Username</label>
                  <input type="text" name="username" value={editForm.username} onChange={handleEditChange} placeholder="Username" />
                </div>
                <div className={styles["modal-group"]}>
                  <label>Email</label>
                  <input type="email" name="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" />
                </div>
                <div className={styles["modal-group"]}>
                  <label>Role</label>
                  <select name="role" value={editForm.role} onChange={handleEditChange}>
                    <option value="" disabled>Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Detective Supervisor">Detective Supervisor</option>
                    <option value="Detective">Detective</option>
                    <option value="Case Specific">Case Specific</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Badge ID · Agency · ORI */}
              <div className={styles["modal-row-3"]}>
                <div className={styles["modal-group"]}>
                  <label>Badge ID</label>
                  <input type="text" name="badgeId" value={editForm.badgeId} onChange={handleEditChange} placeholder="e.g. 777" />
                </div>
                <div className={styles["modal-group"]}>
                  <label>Agency</label>
                  <select name="agency" value={editForm.agency} onChange={handleEditChange}>
                    <option value="">— None —</option>
                    {agencyList.map(({ _id, name }) => (
                      <option key={_id} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles["modal-group"]}>
                  <label>ORI – Agency ID</label>
                  <select name="ori" value={editForm.ori} onChange={handleEditChange}>
                    <option value="">— None —</option>
                    {agencyList.map(({ _id, ori }) => (
                      <option key={_id} value={ori}>{ori}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Account Status */}
              <div className={styles["modal-row-3"]}>
                <div className={styles["modal-group"]}>
                  <label>Account Status</label>
                  <select
                    name="isActive"
                    value={editForm.isActive ? "true" : "false"}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.value === "true" }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              {editError   && <p className={styles["modal-error"]}>{editError}</p>}
              {editSuccess && <p className={styles["modal-success"]}>{editSuccess}</p>}

              <div className={styles["modal-footer"]}>
                <button type="button" className={styles["cancel-btn"]} onClick={closeEdit}>Cancel</button>
                <button type="submit" className={styles["save-btn"]} disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};
