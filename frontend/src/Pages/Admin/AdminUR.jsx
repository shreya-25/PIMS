import React, { useState, useEffect } from "react";
import styles from "./AdminUR.module.css";
import Navbar from "../../components/Navbar/Navbar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { AlertModal } from "../../components/AlertModal/AlertModal";
import api from "../../api";

function generateTempPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  let pwd =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 10; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

export const AdminUR = () => {
  const [showAddCase, setShowAddCase] = useState(false);
  const [agencyList, setAgencyList] = useState([]);

  useEffect(() => {
    api.get("/api/agencies")
      .then(({ data }) => setAgencyList(data.agencies || []))
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    role: "",
    agency: "",
    badgeId: "",
    ori: "",
  });
  const [tempPassword, setTempPassword] = useState(() => generateTempPassword());
  const [inviteMessage, setInviteMessage] = useState("");
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [alert, setAlert] = useState({ isOpen: false, title: "", message: "" });
  const [loading, setLoading] = useState(false);

  const minExpiryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "agency") {
      const match = agencyList.find((item) => item.name === value);
      setFormData((prev) => ({ ...prev, agency: value, ori: match ? match.ori : "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegenerate = () => {
    setTempPassword(generateTempPassword());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ori) {
      setAlert({ isOpen: true, title: "Missing ORI", message: "Please select an agency to set the Agency ID (ORI)." });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/api/auth/register",
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          ...(formData.username.trim() ? { username: formData.username.trim().toLowerCase() } : {}),
          role: formData.role,
          agency: formData.agency,
          badgeId: formData.badgeId,
          ori: formData.ori,
          ...(inviteMessage.trim() ? { inviteMessage: inviteMessage.trim() } : {}),
          ...(expiryEnabled && expiryDate ? { accessExpiresAt: new Date(expiryDate).toISOString() } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` }, suppressGlobalError: true }
      );

      const generatedUsername = res.data.username || "";
      setAlert({
        isOpen: true,
        title: "User Created",
        message: `Account created for ${formData.email}.\nUsername: ${generatedUsername}\nA setup invitation email has been sent with instructions to create their password.`,
      });
      setFormData({ firstName: "", lastName: "", email: "", username: "", role: "", agency: "", badgeId: "", ori: "" });
      setInviteMessage("");
      setExpiryEnabled(false);
      setExpiryDate("");
      setTempPassword(generateTempPassword());
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
                  <label>First Name <span className={styles["required"]}>*</span></label>
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
                  <label>Last Name <span className={styles["required"]}>*</span></label>
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
                    <option value="Detective Supervisor">Detective Supervisor</option>
                    <option value="CaseManager">Case Manager</option>
                    <option value="Detective/Investigator">Detective/Investigator</option>
                    <option value="External Contributor">External Contributor</option>
                    <option value="Read Only">Read Only</option>
                  </select>
                </div>
              </div>

              {/* Username — optional */}
              <div className={styles["form-group"]}>
                <label>Username <span className={styles["optional"]}>(Optional — auto-generated from last name + badge ID if left blank)</span></label>
                <input
                  type="text"
                  name="username"
                  placeholder="e.g. jsmith"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>

              {/* Agency | ORI — both mandatory, same line */}
              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Agency <span className={styles["required"]}>*</span></label>
                  <select
                    name="agency"
                    value={formData.agency}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select Agency</option>
                    {agencyList.map(({ _id, name }) => (
                      <option key={_id} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles["form-group"]}>
                  <label>ORI – Agency ID <span className={styles["required"]}>*</span></label>
                  <select
                    name="ori"
                    value={formData.ori}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select ORI</option>
                    {agencyList.map(({ _id, name, ori }) => (
                      <option key={_id} value={ori}>{ori} — {name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Badge ID | Temp Password — same line */}
              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Badge ID <span className={styles["required"]}>*</span></label>
                  <input
                    type="text"
                    name="badgeId"
                    placeholder="e.g. 777"
                    value={formData.badgeId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>Auto-Generated Temporary Password</label>
                  <div className={styles["password-row"]}>
                    <input
                      type="text"
                      value={tempPassword}
                      readOnly
                      className={styles["password-display"]}
                    />
                    <button
                      type="button"
                      className={styles["regen-btn"]}
                      onClick={handleRegenerate}
                      title="Generate a new password"
                    >
                      ↻
                    </button>
                  </div>
                  <span className={styles["field-hint"]}>Sent in the invitation email.</span>
                </div>
              </div>

              {/* Invite message */}
              <div className={styles["invite-section"]}>
                <label>
                  Invite Message <span className={styles["optional"]}>(Optional)</span>
                </label>
                <textarea
                  className={styles["invite-textarea"]}
                  placeholder="Add a message for the user..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Footer: expiry toggle left, buttons right */}
              <div className={styles["form-footer"]}>
                <div className={styles["expiry-toggle-group"]}>
                  <label className={styles["toggle-label"]}>
                    <span
                      className={`${styles["toggle-track"]} ${expiryEnabled ? styles["toggle-on"] : ""}`}
                      onClick={() => {
                        setExpiryEnabled((v) => !v);
                        if (expiryEnabled) setExpiryDate("");
                      }}
                      role="switch"
                      aria-checked={expiryEnabled}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === " " && e.currentTarget.click()}
                    >
                      <span className={styles["toggle-thumb"]} />
                    </span>
                    <span className={styles["toggle-text"]}>
                      Set Expiry Date <span className={styles["optional"]}>(Optional)</span>
                    </span>
                  </label>
                  {expiryEnabled && (
                    <input
                      type="date"
                      className={styles["expiry-date-input"]}
                      value={expiryDate}
                      min={minExpiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required={expiryEnabled}
                    />
                  )}
                </div>
                <div className={styles["footer-btns"]}>
                  <button
                    type="button"
                    className={styles["cancel-btn"]}
                    onClick={() => {
                      setFormData({ firstName: "", lastName: "", email: "", username: "", role: "", agency: "", badgeId: "", ori: "" });
                      setInviteMessage("");
                      setExpiryEnabled(false);
                      setExpiryDate("");
                      setTempPassword(generateTempPassword());
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles["add-user-btn"]} disabled={loading}>
                    {loading ? "Creating..." : "Send Invite"}
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
