import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ResetPassword.module.css";
import api from "../../api";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;

export const ResetPassword = () => {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const getStrength = (pwd) => {
    if (!pwd) return { label: "", color: "", pct: 0 };
    const checks = [pwd.length >= 8, /[a-z]/.test(pwd), /[A-Z]/.test(pwd), /\d/.test(pwd), /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd)];
    const score = checks.filter(Boolean).length;
    if (score <= 2) return { label: "Weak", color: "#dc2626", pct: 25 };
    if (score === 3) return { label: "Fair", color: "#d97706", pct: 50 };
    if (score === 4) return { label: "Good", color: "#2563eb", pct: 75 };
    return { label: "Strong", color: "#059669", pct: 100 };
  };

  const strength = getStrength(password);

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>✕</div>
          <h2 className={styles.title}>Invalid Reset Link</h2>
          <p className={styles.subtitle}>This reset link is missing or malformed. Please request a new one.</p>
          <button className={styles.btn} onClick={() => navigate("/")}>Back to Login</button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.title}>Password Reset!</h2>
          <p className={styles.subtitle}>Your password has been updated. You can now log in with your new password.</p>
          <button className={styles.btn} onClick={() => navigate("/")}>Go to Login</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8 || !PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, digit, and special character.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Set New Password</h2>
          <p className={styles.subtitle}>Create a strong password for your PIMS account.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>New Password <span className={styles.required}>*</span></label>
            <div className={styles.pwdWrapper}>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className={styles.input}
                placeholder="Create a new password"
                required
                autoFocus
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            {password && (
              <div className={styles.strengthRow}>
                <div className={styles.strengthBar}>
                  <div className={styles.strengthFill} style={{ width: `${strength.pct}%`, background: strength.color }} />
                </div>
                <span className={styles.strengthLabel} style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}
            <span className={styles.hint}>Min 8 chars · uppercase · lowercase · digit · special character</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm Password <span className={styles.required}>*</span></label>
            <input
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              className={styles.input}
              placeholder="Repeat your password"
              required
            />
            {confirm && password !== confirm && <span className={styles.mismatch}>Passwords do not match</span>}
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <button type="submit" className={styles.btn} disabled={submitting}>
            {submitting ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};
