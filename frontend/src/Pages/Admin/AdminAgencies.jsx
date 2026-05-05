import React, { useState, useEffect } from "react";
import styles from "./AdminAgencies.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { AddCaseInline } from "../HomePage/AddCaseInline";
import api from "../../api";

const BLANK = { name: "", ori: "" };

export const AdminAgencies = () => {
  const [showAddCase, setShowAddCase] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // add-new form
  const [addForm, setAddForm] = useState(BLANK);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  // inline edit
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // delete confirm
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchAgencies();
    api.get("/api/users/usernames").then(({ data }) => setAllUsers(data.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = showAddCase ? "hidden" : "";
    document.body.style.overflow = showAddCase ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; document.body.style.overflow = ""; };
  }, [showAddCase]);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/agencies");
      setAgencies(data.agencies || []);
    } catch {
      setError("Failed to load agencies.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Add new ─────────────────────────────────────────────────────────────── */
  const handleAddChange = (e) =>
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddSaving(true);
    setAddError("");
    setAddSuccess("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.post("/api/agencies", addForm, {
        headers: { Authorization: `Bearer ${token}` },
        suppressGlobalError: true,
      });
      setAgencies((prev) => [...prev, data.agency].sort((a, b) => a.name.localeCompare(b.name)));
      setAddForm(BLANK);
      setAddSuccess("Agency added successfully.");
    } catch (err) {
      setAddError(err?.response?.data?.message || "Failed to add agency.");
    } finally {
      setAddSaving(false);
    }
  };

  /* ── Inline edit ─────────────────────────────────────────────────────────── */
  const startEdit = (ag) => {
    setEditId(ag._id);
    setEditForm({ name: ag.name, ori: ag.ori || "" });
    setEditError("");
  };

  const cancelEdit = () => { setEditId(null); setEditError(""); };

  const handleEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const saveEdit = async (id) => {
    setEditSaving(true);
    setEditError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.patch(`/api/agencies/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
        suppressGlobalError: true,
      });
      setAgencies((prev) =>
        prev.map((ag) => (ag._id === id ? data.agency : ag))
           .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditId(null);
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to save changes.");
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Delete ──────────────────────────────────────────────────────────────── */
  const confirmDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/api/agencies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        suppressGlobalError: true,
      });
      setAgencies((prev) => prev.filter((ag) => ag._id !== id));
    } catch {
      // silently ignore; could add toast
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className={styles["page-wrapper"]}>
      <Navbar />

      <div className={styles["main-container"]}>
        <SideBar variant="admin" onShowCaseSelector={setShowAddCase} showAddCase={showAddCase} />

        <div className={styles["left-content"]}>
          {showAddCase ? (
            <AddCaseInline allUsers={allUsers} onAddCase={() => setShowAddCase(false)} />
          ) : (
        <div className={styles["content"]}>

          {/* ── Add Agency card ─────────────────────────────────────────────── */}
          <div className={styles["card"]}>
            <div className={styles["card-header"]}>
              <h2>Add New Agency</h2>
              <span className={styles["chip"]}>Agency Management</span>
            </div>

            <form onSubmit={handleAddSubmit} className={styles["add-form"]}>
              <div className={styles["add-row"]}>
                <div className={styles["form-group"]}>
                  <label>Agency Name <span className={styles["required"]}>*</span></label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Endicott Police Department"
                    value={addForm.name}
                    onChange={handleAddChange}
                    required
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>ORI – Agency ID</label>
                  <input
                    type="text"
                    name="ori"
                    placeholder="e.g. NY0070600"
                    value={addForm.ori}
                    onChange={handleAddChange}
                  />
                </div>
                <div className={styles["add-btn-cell"]}>
                  <button type="submit" className={styles["add-btn"]} disabled={addSaving}>
                    {addSaving ? "Adding..." : "Add Agency"}
                  </button>
                </div>
              </div>
              {addError   && <p className={styles["msg-error"]}>{addError}</p>}
              {addSuccess && <p className={styles["msg-success"]}>{addSuccess}</p>}
            </form>
          </div>

          {/* ── Agency list card ─────────────────────────────────────────────── */}
          <div className={styles["card"]}>
            <div className={styles["card-header"]}>
              <h2>Registered Agencies</h2>
              <span className={styles["count-chip"]}>{agencies.length} agencies</span>
            </div>

            {loading && <p className={styles["state-msg"]}>Loading...</p>}
            {error   && <p className={styles["msg-error"]}>{error}</p>}

            {!loading && !error && (
              <div className={styles["table-wrapper"]}>
                <table className={styles["ag-table"]}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Agency Name</th>
                      <th>ORI – Agency ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agencies.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={styles["empty-row"]}>
                          No agencies registered yet.
                        </td>
                      </tr>
                    ) : (
                      agencies.map((ag, i) => (
                        <tr key={ag._id}>
                          <td>{i + 1}</td>

                          {/* Name cell */}
                          <td>
                            {editId === ag._id ? (
                              <input
                                className={styles["inline-input"]}
                                name="name"
                                value={editForm.name}
                                onChange={handleEditChange}
                              />
                            ) : (
                              ag.name
                            )}
                          </td>

                          {/* ORI cell */}
                          <td>
                            {editId === ag._id ? (
                              <input
                                className={styles["inline-input"]}
                                name="ori"
                                value={editForm.ori}
                                onChange={handleEditChange}
                                placeholder="e.g. NY0070600"
                              />
                            ) : (
                              ag.ori ? (
                                <span className={styles["ori-badge"]}>{ag.ori}</span>
                              ) : (
                                <span className={styles["ori-empty"]}>—</span>
                              )
                            )}
                          </td>

                          {/* Actions cell */}
                          <td className={styles["actions-cell"]}>
                            {editId === ag._id ? (
                              <>
                                {editError && (
                                  <span className={styles["inline-error"]}>{editError}</span>
                                )}
                                <button
                                  className={styles["save-btn"]}
                                  onClick={() => saveEdit(ag._id)}
                                  disabled={editSaving}
                                >
                                  {editSaving ? "Saving…" : "Save"}
                                </button>
                                <button className={styles["cancel-btn"]} onClick={cancelEdit}>
                                  Cancel
                                </button>
                              </>
                            ) : deleteId === ag._id ? (
                              <>
                                <span className={styles["confirm-text"]}>Delete?</span>
                                <button
                                  className={styles["delete-confirm-btn"]}
                                  onClick={() => confirmDelete(ag._id)}
                                >
                                  Yes
                                </button>
                                <button
                                  className={styles["cancel-btn"]}
                                  onClick={() => setDeleteId(null)}
                                >
                                  No
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className={styles["edit-btn"]}
                                  onClick={() => startEdit(ag)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={styles["delete-btn"]}
                                  onClick={() => setDeleteId(ag._id)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
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
          )}
        </div>
      </div>
    </div>
  );
};
