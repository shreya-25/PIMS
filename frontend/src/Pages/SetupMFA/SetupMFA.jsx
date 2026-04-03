import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./SetupMFA.module.css";
import api from "../../api";

// step: 'email' → 'otp' → 'qr' → 'done'
export const SetupMFA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillEmail = location.state?.email || "";

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(prefillEmail);
  const [otpCode, setOtpCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [qrImg, setQrImg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ── Step 1: send email OTP ── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/send-otp", { email: email.trim() }, { suppressGlobalError: true });
      setStep("otp");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: verify email OTP then generate QR ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Verify the email OTP — this returns a JWT but we only need it to confirm identity
      await api.post("/api/auth/verify-otp", { email: email.trim(), otp: otpCode.trim(), method: "email" }, { suppressGlobalError: true });

      // Generate new TOTP secret + QR
      const res = await api.post("/api/auth/totp/generate", { email: email.trim() });
      setQrImg(res.data.qrCode);
      setStep("qr");
    } catch (err) {
      setError(err?.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: confirm TOTP code and activate ── */
  const handleActivate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/totp/activate", { email: email.trim(), code: totpCode.trim() }, { suppressGlobalError: true });
      setStep("done");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>← Back to login</button>

        {/* Step 1 — enter email */}
        {step === "email" && (
          <>
            <div className={styles.iconWrap}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>
              </svg>
            </div>
            <h2 className={styles.title}>Re-setup Authenticator</h2>
            <p className={styles.subtitle}>Enter your account email. We'll send a verification code to confirm your identity before setting up a new authenticator.</p>
            <form onSubmit={handleSendOtp} className={styles.form}>
              <input
                type="email"
                className={styles.input}
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.btn} disabled={loading || !email.trim()}>
                {loading ? <span className={styles.spinner} /> : "Send Verification Code"}
              </button>
            </form>
          </>
        )}

        {/* Step 2 — verify email OTP */}
        {step === "otp" && (
          <>
            <div className={styles.iconWrap} style={{ background: "#eff6ff", color: "#1d4ed8" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
              </svg>
            </div>
            <h2 className={styles.title}>Check Your Email</h2>
            <p className={styles.subtitle}>A 6-digit code was sent to <strong>{email}</strong>. Enter it below to continue.</p>
            <form onSubmit={handleVerifyOtp} className={styles.form}>
              <input
                type="text"
                inputMode="numeric"
                className={`${styles.input} ${styles.codeInput}`}
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                required
                autoFocus
                disabled={loading}
              />
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.btn} disabled={loading || otpCode.length !== 6}>
                {loading ? <span className={styles.spinner} /> : "Verify & Continue"}
              </button>
              <button type="button" className={styles.resendBtn} onClick={() => { setStep("email"); setOtpCode(""); setError(""); }}>
                Use a different email
              </button>
            </form>
          </>
        )}

        {/* Step 3 — scan QR */}
        {step === "qr" && (
          <>
            <h2 className={styles.title}>Scan New QR Code</h2>
            <p className={styles.subtitle}>
              Open <strong>Microsoft Authenticator</strong>, tap <strong>+</strong> → <strong>Other account</strong>, then scan the code below.
            </p>
            <div className={styles.qrWrap}>
              <img src={qrImg} alt="QR Code" className={styles.qrImg} />
            </div>
            <p className={styles.qrHint}>Enter the 6-digit code shown in the app to confirm.</p>
            <form onSubmit={handleActivate} className={styles.form}>
              <input
                type="text"
                inputMode="numeric"
                className={`${styles.input} ${styles.codeInput}`}
                placeholder="Enter 6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                required
                autoFocus
                disabled={loading}
              />
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.btn} disabled={loading || totpCode.length !== 6}>
                {loading ? <span className={styles.spinner} /> : "Confirm & Activate"}
              </button>
            </form>
          </>
        )}

        {/* Done */}
        {step === "done" && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.title}>Authenticator Updated!</h2>
            <p className={styles.subtitle}>Your authenticator app is set up. Use it to log in next time.</p>
            <button className={styles.btn} onClick={() => navigate("/")}>Go to Login</button>
          </>
        )}
      </div>
    </div>
  );
};
