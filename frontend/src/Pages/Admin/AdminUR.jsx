import React, { useState } from "react";
import styles from "./AdminUR.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import api from "../../api";

export const AdminUR = () => {
  const [showAddCase, setShowAddCase] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [alert, setAlert] = useState({ isOpen: false, title: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      setAlert({ isOpen: true, title: "Invalid Password", message: "Password must be at least 6 characters long." });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlert({ isOpen: true, title: "Password Mismatch", message: "The passwords you entered do not match. Please try again." });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/api/auth/register",
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          username: formData.username,
          password: formData.password,
        },
        { headers: { Authorization: `Bearer ${token}` }, suppressGlobalError: true }
      );
      setAlert({ isOpen: true, title: "Success", message: "User created successfully." });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        username: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      const data = err?.response?.data;
      const details = data?.details ? Object.values(data.details).join(" ") : null;
      setAlert({
        isOpen: true,
        title: "User Registration Failed",
        message: details || data?.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
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
              <h2>Create Account</h2>
              <span className={styles["chip"]}>User Registration</span>
            </div>

            <form onSubmit={handleSubmit} className={styles["form-grid"]}>
              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Email ID <span className={styles["required"]}>*</span></label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email ID"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>Role <span className={styles["required"]}>*</span></label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="CaseManager">Case Manager</option>
                    <option value="Investigator">Investigator</option>
                    <option value="Detective Supervisor">Detective Supervisor</option>
                  </select>
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label>Username <span className={styles["required"]}>*</span></label>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Password <span className={styles["required"]}>*</span></label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <span className={styles["field-hint"]}>Minimum 6 characters</span>
                </div>
                <div className={styles["form-group"]}>
                  <label>Repeat Password <span className={styles["required"]}>*</span></label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles["form-footer"]}>
                <button type="submit" className={styles["add-user-btn"]} disabled={loading}>
                  {loading ? "Creating..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ isOpen: false, title: "", message: "" })}
        onConfirm={() => setAlert({ isOpen: false, title: "", message: "" })}
      />
    </div>
  );
};
