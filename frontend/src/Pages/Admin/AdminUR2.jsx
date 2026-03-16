import React, { useState, useEffect, useRef } from "react";
import styles from "./AdminUR2.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import api from "../../api";

const AGENCIES = [
  "Endicott Police Department",
  "Binghamton Police Department",
  "Johnson City Police Department",
  "Broome County Sheriff's Office",
  "New York State Police",
  "FBI Field Office",
];

const ROLES = [
  { value: "Admin",                label: "Admin" },
  { value: "CaseManager",         label: "Case Manager" },
  { value: "Investigator",        label: "Investigator" },
  { value: "Detective Supervisor", label: "Detective Supervisor" },
];

const PERMISSIONS = [
  { key: "viewCase",         label: "View Case" },
  { key: "addLeads",         label: "Add Leads" },
  { key: "uploadEvidence",   label: "Upload Evidence" },
  { key: "editDetails",      label: "Edit Details" },
  { key: "generateReports",  label: "Generate Reports" },
];

const DEFAULT_PERMISSIONS = {
  viewCase: true,
  addLeads: true,
  uploadEvidence: false,
  editDetails: true,
  generateReports: false,
};

export const AdminUR2 = () => {
  const [showAddCase, setShowAddCase] = useState(false);
  const [allCases, setAllCases] = useState([]);
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    agency: "",
    role: "",
    userType: "External",
    assignedCases: [],
    permissions: { ...DEFAULT_PERMISSIONS },
    inviteMessage: "",
    setExpiry: false,
    expiryDate: "",
  });

  const [alert, setAlert] = useState({ isOpen: false, title: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Fetch all cases for the case selector
  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/cases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllCases(
          (data || []).map((c) => ({ id: c.caseNo, name: c.caseName }))
        );
      } catch {
        setAllCases([]);
      }
    };
    fetch();
  }, []);

  // Close case dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCaseDropdownOpen(false);
        setCaseSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handlePermission = (key) =>
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));

  const addCase = (c) => {
    if (formData.assignedCases.find((ac) => ac.id === c.id)) return;
    setFormData((prev) => ({
      ...prev,
      assignedCases: [...prev.assignedCases, c],
    }));
    setCaseDropdownOpen(false);
    setCaseSearch("");
  };

  const removeCase = (id) =>
    setFormData((prev) => ({
      ...prev,
      assignedCases: prev.assignedCases.filter((c) => c.id !== id),
    }));

  const filteredCases = allCases.filter(
    (c) =>
      !formData.assignedCases.find((ac) => ac.id === c.id) &&
      (String(c.id).toLowerCase().includes(caseSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(caseSearch.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.assignedCases.length === 0) {
      setAlert({ isOpen: true, title: "Missing Cases", message: "Please assign at least one case." });
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
          username: formData.email.split("@")[0],
          password: "Invite@123",
        },
        { headers: { Authorization: `Bearer ${token}` }, suppressGlobalError: true }
      );
      setAlert({ isOpen: true, title: "Invite Sent", message: `Invitation sent to ${formData.email}.` });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        agency: "",
        role: "",
        userType: "External",
        assignedCases: [],
        permissions: { ...DEFAULT_PERMISSIONS },
        inviteMessage: "",
        setExpiry: false,
        expiryDate: "",
      });
    } catch (err) {
      const data = err?.response?.data;
      const details = data?.details ? Object.values(data.details).join(" ") : null;
      setAlert({
        isOpen: true,
        title: "Invite Failed",
        message: details || data?.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      agency: "",
      role: "",
      userType: "External",
      assignedCases: [],
      permissions: { ...DEFAULT_PERMISSIONS },
      inviteMessage: "",
      setExpiry: false,
      expiryDate: "",
    });
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
            <div className={styles["card-title-block"]}>
              <h2>Invite User</h2>
              <p className={styles["card-subtitle"]}>
                Add a new user and assign role &amp; case access
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles["form"]}>
              {/* Row 1: First / Last Name */}
              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>
                    First Name <span className={styles["req"]}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleField("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>
                    Last Name <span className={styles["req"]}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleField("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Email / Agency */}
              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>
                    Email ID <span className={styles["req"]}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="user@agency.com"
                    value={formData.email}
                    onChange={(e) => handleField("email", e.target.value)}
                    required
                  />
                  <span className={styles["field-hint"]}>
                    An invitation will be sent via email
                  </span>
                </div>
                <div className={styles["form-group"]}>
                  <label>
                    Agency <span className={styles["req"]}>*</span>
                  </label>
                  <select
                    value={formData.agency}
                    onChange={(e) => handleField("agency", e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Agency</option>
                    {AGENCIES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Role / User Type */}
              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>
                    Role <span className={styles["req"]}>*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleField("role", e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Role</option>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles["form-group"]}>
                  <label>User Type</label>
                  <div className={styles["radio-group"]}>
                    {["External", "Internal"].map((t) => (
                      <label key={t} className={styles["radio-label"]}>
                        <input
                          type="radio"
                          name="userType"
                          value={t}
                          checked={formData.userType === t}
                          onChange={() => handleField("userType", t)}
                        />
                        <span className={styles["radio-custom"]} />
                        {t} User
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assign Cases */}
              <div className={styles["form-group"]}>
                <label>
                  Assign Case(s) <span className={styles["req"]}>*</span>
                </label>
                <div className={styles["case-chip-row"]}>
                  {formData.assignedCases.map((c) => (
                    <span key={c.id} className={styles["case-chip"]}>
                      Case #{c.id}
                      <button
                        type="button"
                        className={styles["chip-remove"]}
                        onClick={() => removeCase(c.id)}
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <div className={styles["case-dropdown-wrap"]} ref={dropdownRef}>
                    <button
                      type="button"
                      className={styles["add-case-btn"]}
                      onClick={() => setCaseDropdownOpen((o) => !o)}
                    >
                      + Add Case
                    </button>
                    {caseDropdownOpen && (
                      <div className={styles["case-dropdown"]}>
                        <input
                          className={styles["case-search"]}
                          placeholder="Search cases..."
                          value={caseSearch}
                          onChange={(e) => setCaseSearch(e.target.value)}
                          autoFocus
                        />
                        <ul className={styles["case-list"]}>
                          {filteredCases.length === 0 ? (
                            <li className={styles["case-empty"]}>No cases found</li>
                          ) : (
                            filteredCases.map((c) => (
                              <li
                                key={c.id}
                                className={styles["case-option"]}
                                onClick={() => addCase(c)}
                              >
                                Case #{c.id} — {c.name}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Access Permissions */}
              <div className={styles["form-group"]}>
                <label className={styles["section-label"]}>Access Permissions</label>
                <div className={styles["permissions-row"]}>
                  {PERMISSIONS.map(({ key, label }) => (
                    <label key={key} className={styles["check-label"]}>
                      <input
                        type="checkbox"
                        checked={formData.permissions[key]}
                        onChange={() => handlePermission(key)}
                      />
                      <span className={styles["check-custom"]} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Invite Message */}
              <div className={styles["form-group"]}>
                <label>Invite Message <span className={styles["optional"]}>(Optional)</span></label>
                <textarea
                  className={styles["textarea"]}
                  placeholder="Add a message for the user..."
                  value={formData.inviteMessage}
                  onChange={(e) => handleField("inviteMessage", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Footer: Expiry + Buttons */}
              <div className={styles["form-footer"]}>
                <div className={styles["expiry-block"]}>
                  <button
                    type="button"
                    className={`${styles["toggle"]} ${formData.setExpiry ? styles["toggle-on"] : ""}`}
                    onClick={() => handleField("setExpiry", !formData.setExpiry)}
                    aria-label="Toggle expiry date"
                  >
                    <span className={styles["toggle-thumb"]} />
                  </button>
                  <span className={styles["expiry-label"]}>
                    Set Expiry Date <span className={styles["optional"]}>(Optional)</span>
                  </span>
                  {formData.setExpiry && (
                    <input
                      type="date"
                      className={styles["date-input"]}
                      value={formData.expiryDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => handleField("expiryDate", e.target.value)}
                    />
                  )}
                </div>

                <div className={styles["btn-group"]}>
                  <button
                    type="button"
                    className={styles["cancel-btn"]}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles["submit-btn"]}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Invite"}
                  </button>
                </div>
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
