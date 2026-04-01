import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SetupAccount.module.css";
import api from "../../api";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;

const AGENCY_ORI = [
  { agency: "Endicott Police Department",              ori: "NY0070600" },
  { agency: "Union Police Department",                 ori: "NY0070601" },
  { agency: "Binghamton Police Department",            ori: "NY0070200" },
  { agency: "Federal Bureau of Investigation",         ori: "NY0010000" },
  { agency: "Broome County Sheriff's Office",          ori: "NY0070000" },
  { agency: "Binghamton University Police Department", ori: "NY0070800" },
  { agency: "Johnson City Police Department",          ori: "NY0070300" },
];

const ROLES = [
  { value: "Admin",                  label: "Admin" },
  { value: "Detective Supervisor",   label: "Detective Supervisor" },
  { value: "CaseManager",            label: "Case Manager" },
  { value: "Detective/Investigator", label: "Detective/Investigator" },
  { value: "External Contributor",   label: "External Contributor" },
  { value: "Read Only",              label: "Read Only" },
];

export const SetupAccount = () => {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");

  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    agency: "",
    badgeId: "",
    ori: "",
    password: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [step, setStep] = useState("form"); // "form" | "mfa-choice" | "totp-scan" | "done"

  // TOTP setup state
  const [totpQr, setTotpQr] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState("");

  useEffect(() => {
    if (!token) {
      setTokenError("Invalid setup link. Please check your email.");
      setLoading(false);
      return;
    }
    api.get(`/api/auth/setup-info?token=${token}`)
      .then((res) => {
        setFormData((prev) => ({
          ...prev,
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          email: res.data.email || "",
          role: res.data.role || "",
          agency: res.data.agency || "",
          badgeId: res.data.badgeId || "",
          ori: res.data.ori || "",
        }));
        setLoading(false);
      })
      .catch((err) => {
        setTokenError(err?.response?.data?.message || "Invalid or expired setup link. Please contact your admin.");
        setLoading(false);
      });
  }, [token]);

  const getStrength = (pwd) => {
    if (!pwd) return { label: "", color: "", pct: 0 };
    const checks = [
      pwd.length >= 8,
      /[a-z]/.test(pwd),
      /[A-Z]/.test(pwd),
      /\d/.test(pwd),
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd),
    ];
    const score = checks.filter(Boolean).length;
    if (score <= 2) return { label: "Weak", color: "#dc2626", pct: 25 };
    if (score === 3) return { label: "Fair", color: "#d97706", pct: 50 };
    if (score === 4) return { label: "Good", color: "#2563eb", pct: 75 };
    return { label: "Strong", color: "#059669", pct: 100 };
  };

  const strength = getStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "agency") {
      const match = AGENCY_ORI.find((item) => item.agency === value);
      setFormData((prev) => ({ ...prev, agency: value, ori: match ? match.ori : "" }));
      setFormError("");
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    if (!formData.role) {
      setFormError("Please select a role.");
      return;
    }
    if (!formData.agency) {
      setFormError("Please select an agency.");
      return;
    }
    if (!formData.ori) {
      setFormError("Please select an agency to set the Agency ID (ORI).");
      return;
    }
    if (formData.password.length < 8 || !PASSWORD_REGEX.test(formData.password)) {
      setFormError("Password must be at least 8 characters with uppercase, lowercase, digit, and special character.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/api/auth/setup-account", {
        token,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        agency: formData.agency,
        badgeId: formData.badgeId,
        ori: formData.ori,
        password: formData.password,
      });
      setStep("mfa-choice");
    } catch (err) {
      setFormError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChooseEmail = () => setStep("done");

  const handleChooseTotp = async () => {
    setTotpLoading(true);
    setTotpError("");
    try {
      const res = await api.post("/api/auth/totp/generate", { email: formData.email });
      setTotpQr(res.data.qrCode);
      setStep("totp-scan");
    } catch (err) {
      setTotpError(err?.response?.data?.message || "Failed to generate QR code.");
    } finally {
      setTotpLoading(false);
    }
  };

  const handleTotpActivate = async (e) => {
    e.preventDefault();
    setTotpLoading(true);
    setTotpError("");
    try {
      await api.post("/api/auth/totp/activate", { email: formData.email, code: totpCode.trim() }, { suppressGlobalError: true });
      setStep("done");
    } catch (err) {
      setTotpError(err?.response?.data?.message || "Invalid code. Please try again.");
    } finally {
      setTotpLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.loadingText}>Verifying your setup link…</p>
        </div>
      </div>
    );
  }

  /* ── Invalid token ── */
  if (tokenError) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>✕</div>
          <h2 className={styles.title}>Setup Link Invalid</h2>
          <p className={styles.errorText}>{tokenError}</p>
        </div>
      </div>
    );
  }

  /* ── MFA choice ── */
  if (step === "mfa-choice") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.title}>Choose Your Verification Method</h2>
            <p className={styles.subtitle}>Every login will require a 6-digit code — pick how you'd like to receive it.</p>
          </div>
          {totpError && <div className={styles.errorBanner}>{totpError}</div>}
          <div className={styles.mfaOptions}>
            <button className={styles.mfaCard} onClick={handleChooseEmail} disabled={totpLoading}>
              <div className={styles.mfaIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
                </svg>
              </div>
              <div className={styles.mfaCardBody}>
                <span className={styles.mfaCardTitle}>Email OTP</span>
                <span className={styles.mfaCardDesc}>A one-time code will be sent to your email each time you log in.</span>
              </div>
            </button>
            <button className={styles.mfaCard} onClick={handleChooseTotp} disabled={totpLoading}>
              <div className={styles.mfaIcon} style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>
                </svg>
              </div>
              <div className={styles.mfaCardBody}>
                <span className={styles.mfaCardTitle}>Authenticator App</span>
                <span className={styles.mfaCardDesc}>Use Microsoft Authenticator or Google Authenticator — works offline, no email needed.</span>
              </div>
              {totpLoading && <span className={styles.mfaSpinner} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── TOTP scan step ── */
  if (step === "totp-scan") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.title}>Scan the QR Code</h2>
            <p className={styles.subtitle}>Open Microsoft Authenticator (or any authenticator app), tap <strong>+</strong>, choose <strong>Other account</strong>, and scan the code below.</p>
          </div>
          <div className={styles.qrWrapper}>
            <img src={totpQr} alt="QR Code" className={styles.qrImage} />
          </div>
          <p className={styles.qrHint}>Once scanned, enter the 6-digit code shown in the app to confirm setup.</p>
          <form onSubmit={handleTotpActivate} className={styles.totpForm}>
            <input
              type="text"
              inputMode="numeric"
              className={styles.totpInput}
              placeholder="Enter 6-digit code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              required
              autoFocus
            />
            {totpError && <div className={styles.errorBanner}>{totpError}</div>}
            <button type="submit" className={styles.submitBtn} disabled={totpLoading || totpCode.length !== 6}>
              {totpLoading ? "Verifying…" : "Confirm & Finish"}
            </button>
            <button type="button" className={styles.backBtn} onClick={() => setStep("mfa-choice")}>
              ← Choose a different method
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Done ── */
  if (step === "done") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.title}>Account Ready!</h2>
          <p className={styles.subtitle}>Your account has been set up. You can now log in to PIMS.</p>
          <button className={styles.loginBtn} onClick={() => navigate("/")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  /* ── Setup form ── */
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Set Up Your PIMS Account</h2>
          <p className={styles.subtitle}>Confirm your details and create a secure password.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Name row */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First Name <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={styles.input}
                placeholder="First Name"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={styles.input}
                placeholder="Last Name"
                required
              />
            </div>
          </div>

          {/* Email (readonly) | Role — same line */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                value={formData.email}
                readOnly
                className={`${styles.input} ${styles.readOnly}`}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Role <span className={styles.required}>*</span></label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={styles.input}
                required
              >
                <option value="" disabled>Select Role</option>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Agency | ORI — both mandatory, same line */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Agency <span className={styles.required}>*</span></label>
              <select
                name="agency"
                value={formData.agency}
                onChange={handleChange}
                className={styles.input}
                required
              >
                <option value="" disabled>Select Agency</option>
                {AGENCY_ORI.map(({ agency }) => (
                  <option key={agency} value={agency}>{agency}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>ORI – Agency ID <span className={styles.required}>*</span></label>
              <select
                name="ori"
                value={formData.ori}
                onChange={handleChange}
                className={styles.input}
                required
              >
                <option value="" disabled>Select ORI</option>
                {AGENCY_ORI.map(({ agency, ori }) => (
                  <option key={ori} value={ori}>{ori} — {agency}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Badge ID | New Password — same line */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Badge ID</label>
              <input
                type="text"
                name="badgeId"
                value={formData.badgeId}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g. 1042"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>New Password <span className={styles.required}>*</span></label>
              <div className={styles.pwdWrapper}>
                <input
                  type={showPwd ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Create a password"
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
              {formData.password && (
                <div className={styles.strengthRow}>
                  <div className={styles.strengthBar}>
                    <div className={styles.strengthFill} style={{ width: `${strength.pct}%`, background: strength.color }} />
                  </div>
                  <span className={styles.strengthLabel} style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
              <span className={styles.hint}>Min 8 · A–Z · a–z · 0–9 · symbol</span>
            </div>
          </div>

          {/* Confirm password — full width */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm Password <span className={styles.required}>*</span></label>
            <input
              type={showPwd ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={styles.input}
              placeholder="Repeat your password"
              required
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <span className={styles.mismatch}>Passwords do not match</span>
            )}
          </div>

          {formError && <div className={styles.errorBanner}>{formError}</div>}

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "Setting up…" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
};
