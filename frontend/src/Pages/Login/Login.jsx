import { useState } from 'react';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';
import api from "../../api";
// import { msalInstance, loginRequest } from "../../msalConfig";

// view: 'login' | 'forgot' | 'forgot-sent'
export function Login() {
  const [view, setView] = useState('login');
  const [errorMessage, setErrorMessage] = useState('');
  // const [msLoading, setMsLoading] = useState(false);

  // Email+password → OTP/TOTP flow
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdStep, setPwdStep] = useState('credentials'); // 'credentials' | 'otp'
  const [pwdOtpCode, setPwdOtpCode] = useState('');
  const [mfaMethod, setMfaMethod] = useState('email'); // 'email' | 'totp'

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [emailMeSent, setEmailMeSent] = useState(false);

  const navigate = useNavigate();

  const storeAndNavigate = ({ token, userId, username: name, role }) => {
    localStorage.clear();
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("loggedInUser", name);
    localStorage.setItem("role", role);
    localStorage.setItem("systemRole", role);
    if (role === "Admin") {
      navigate("/AdminCM");
    } else {
      navigate("/HomePage");
    }
  };

  // useEffect(() => {
  //   msalInstance.initialize().then(() => {
  //     msalInstance.handleRedirectPromise().then(async (result) => {
  //       if (!result) return;
  //       try {
  //         setMsLoading(true);
  //         const response = await api.post("/api/auth/microsoft", { idToken: result.idToken });
  //         const { token, userId, username: name, role } = response.data;
  //         if (!token) { setErrorMessage("Authentication failed: Token not provided by the server."); return; }
  //         storeAndNavigate({ token, userId, username: name, role });
  //       } catch (error) {
  //         setErrorMessage(error.response?.data?.message || "Microsoft login failed.");
  //       } finally {
  //         setMsLoading(false);
  //       }
  //     }).catch(() => setErrorMessage("Microsoft login failed. Please try again."));
  //   });
  // }, []);

  // const handleMicrosoftLogin = async () => {
  //   setMsLoading(true);
  //   setErrorMessage('');
  //   try {
  //     await msalInstance.initialize();
  //     await msalInstance.loginRedirect(loginRequest);
  //   } catch {
  //     setErrorMessage("Microsoft login failed. Please try again.");
  //     setMsLoading(false);
  //   }
  // };

  /* ── E-MAIL ME — send OTP to email regardless of MFA method ── */
  const handleEmailMe = async () => {
    setPwdLoading(true);
    setErrorMessage('');
    try {
      await api.post("/api/auth/send-otp", { email: credentials.email.trim() }, { suppressGlobalError: true });
      setMfaMethod('email');
      setEmailMeSent(true);
      setPwdOtpCode('');
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Failed to send email. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  };

  /* ── Step 1: verify password → determine MFA method ── */
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setPwdLoading(true);
    try {
      const res = await api.post("/api/auth/login-send-otp", {
        email: credentials.email.trim(),
        password: credentials.password,
      }, { suppressGlobalError: true });
      setMfaMethod(res.data.mfaMethod || 'email');
      setPwdStep('otp');
      setPwdOtpCode('');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setPwdLoading(false);
    }
  };

  /* ── Step 2: verify OTP from password flow ── */
  const handlePwdVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setPwdLoading(true);
    try {
      const response = await api.post("/api/auth/verify-otp", {
        email: credentials.email.trim(),
        otp: pwdOtpCode.trim(),
        method: emailMeSent ? 'email' : mfaMethod,
      }, { suppressGlobalError: true });
      storeAndNavigate(response.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  };

  /* ── Forgot password ── */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setErrorMessage('');
    try {
      await api.post("/api/auth/forgot-password", { email: forgotEmail.trim() });
      setView('forgot-sent');
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  /* ── Forgot-sent confirmation ── */
  if (view === 'forgot-sent') {
    return (
      <div className={styles.background}>
        <img src={`${process.env.PUBLIC_URL}/Materials/forensic.jpg`} alt="Background" className={styles.bgImage} />
        <div className={styles.overlay}>
          <div className={styles.mainBox}>
            <LeftPanel />
            <div className={styles.formContainer}>
              <h2 className={styles.welcomeText}>Check your email</h2>
              <p className={styles.signInPrompt}>
                If an account exists for <strong style={{ color: '#93c5fd' }}>{forgotEmail}</strong>, a password reset link has been sent.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8 }}>
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
              <button
                className={styles.backLink}
                style={{ marginTop: 24 }}
                onClick={() => { setView('login'); setForgotEmail(''); setErrorMessage(''); }}
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Forgot password form ── */
  if (view === 'forgot') {
    return (
      <div className={styles.background}>
        <img src={`${process.env.PUBLIC_URL}/Materials/forensic.jpg`} alt="Background" className={styles.bgImage} />
        <div className={styles.overlay}>
          <div className={styles.mainBox}>
            <LeftPanel />
            <div className={styles.formContainer}>
              <h2 className={styles.welcomeText}>Reset password</h2>
              <p className={styles.signInPrompt}>Enter your account email and we'll send a reset link.</p>

              <div className={styles.loginForm}>
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                <form onSubmit={handleForgotPassword} className={styles.otpForm}>
                  <input
                    type="email"
                    className={styles.otpInput}
                    placeholder="Your email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                    required
                    autoFocus
                  />
                  <button type="submit" className={styles.otpButton} disabled={forgotLoading || !forgotEmail.trim()}>
                    {forgotLoading ? <span className={styles.spinnerDark} /> : "Send Reset Link"}
                  </button>
                </form>
                <button
                  className={styles.backLink}
                  style={{ marginTop: 12 }}
                  onClick={() => { setView('login'); setErrorMessage(''); }}
                >
                  ← Back to login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main login ── */
  return (
    <div className={styles.background}>
      <img src={`${process.env.PUBLIC_URL}/Materials/forensic.jpg`} alt="Forensic Background" className={styles.bgImage} />
      <div className={styles.overlay}>
        <div className={styles.mainBox}>
          <LeftPanel />

          <div className={styles.formContainer}>
            <h2 className={styles.welcomeText}>Welcome back</h2>
            <p className={styles.signInPrompt}>Sign in to access the secure portal</p>

            <div className={styles.loginForm}>
              {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

              {/* Microsoft SSO — commented out
              <button
                type="button"
                className={styles.msButton}
                onClick={handleMicrosoftLogin}
                disabled={msLoading || pwdLoading}
              >
                {msLoading ? <span className={styles.spinner} /> : (
                  <span className={styles.msButtonIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                      <rect x="11" y="1" width="9" height="9" fill="#00a4ef"/>
                      <rect x="1" y="11" width="9" height="9" fill="#7fba00"/>
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                  </span>
                )}
                {msLoading ? "Signing in..." : "Continue with Microsoft"}
              </button>

              <div className={styles.divider}><span>or sign in with email &amp; password</span></div>
              */}

              {/* Email + Password */}
              {pwdStep === 'credentials' ? (
                <form onSubmit={handlePasswordLogin} className={styles.otpForm}>
                  <input
                    type="email"
                    className={styles.otpInput}
                    placeholder="Email address"
                    value={credentials.email}
                    onChange={(e) => setCredentials((p) => ({ ...p, email: e.target.value }))}
                    disabled={pwdLoading}
                    required
                  />
                  <div className={styles.pwdField}>
                    <input
                      type={showPwd ? "text" : "password"}
                      className={styles.otpInput}
                      placeholder="Password"
                      value={credentials.password}
                      onChange={(e) => setCredentials((p) => ({ ...p, password: e.target.value }))}
                      disabled={pwdLoading}
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeToggle}
                      onClick={() => setShowPwd((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPwd ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className={styles.forgotRow}>
                    <button
                      type="button"
                      className={styles.forgotLink}
                      onClick={() => { setView('forgot'); setErrorMessage(''); }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <button
                    type="submit"
                    className={styles.otpButton}
                    disabled={pwdLoading || !credentials.email.trim() || !credentials.password}
                  >
                    {pwdLoading ? <span className={styles.spinnerDark} /> : "Sign In"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePwdVerifyOtp} className={styles.otpForm}>
                  {mfaMethod === 'totp' && !emailMeSent ? (
                    <div className={styles.totpPrompt}>
                      <div className={styles.totpIcon}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>
                        </svg>
                      </div>
                      <p className={styles.otpSentNote}>
                        Open <strong>Microsoft Authenticator</strong> and enter the 6-digit code for <strong>PIMS</strong>.
                      </p>
                    </div>
                  ) : (
                    <p className={styles.otpSentNote}>
                      {emailMeSent
                        ? <>Code sent to <strong>{credentials.email}</strong></>
                        : <>A verification code was sent to <strong>{credentials.email}</strong></>}
                    </p>
                  )}

                  {/* OTP input */}
                  <div className={styles.otpFieldRow}>
                    <label className={styles.otpLabel}>One-time-password: <span className={styles.otpRequired}>*</span></label>
                    <div className={styles.otpInputWrap}>
                      <input
                        type={showPwd ? "text" : "password"}
                        inputMode="numeric"
                        className={styles.otpInput}
                        placeholder="••••••"
                        value={pwdOtpCode}
                        onChange={(e) => setPwdOtpCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        disabled={pwdLoading}
                        required
                        autoFocus
                      />
                      <button type="button" className={styles.otpEyeBtn} onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {showPwd
                            ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className={styles.otpActions}>
                    <button
                      type="submit"
                      className={styles.otpActionBtn}
                      disabled={pwdLoading || pwdOtpCode.trim().length !== 6}
                    >
                      {pwdLoading ? <span className={styles.spinnerDark} /> : "Login"}
                    </button>
                    <button
                      type="button"
                      className={styles.otpCancelBtn}
                      onClick={() => { setPwdStep('credentials'); setPwdOtpCode(''); setEmailMeSent(false); setErrorMessage(''); }}
                      disabled={pwdLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.otpEmailBtn}
                      onClick={handleEmailMe}
                      disabled={pwdLoading}
                    >
                      {pwdLoading ? <span className={styles.spinnerDark} /> : "E-Mail Me"}
                    </button>
                  </div>

                  {/* Fallback link */}
                  <button
                    type="button"
                    className={styles.otpHelpLink}
                    onClick={() => navigate('/setup-mfa', { state: { email: credentials.email } })}
                  >
                    I don't know my one-time-password (OTP)
                  </button>
                </form>
              )}

              {/* <div className={styles.divider}><span>or sign in with email code</span></div> */}

              {/* OTP */}
              {/* {otpStep === 'idle' ? (
                <form onSubmit={handleSendOtp} className={styles.otpForm}>
                  <input
                    type="email"
                    className={styles.otpInput}
                    placeholder="Enter your email address"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    disabled={otpLoading}
                    required
                  />
                  <button type="submit" className={styles.otpButton} disabled={otpLoading || !otpEmail.trim()}>
                    {otpLoading ? <span className={styles.spinnerDark} /> : "Send Code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className={styles.otpForm}>
                  <p className={styles.otpSentNote}>Code sent to <strong>{otpEmail}</strong></p>
                  <input
                    type="text"
                    className={styles.otpInput}
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    disabled={otpLoading}
                    required
                    autoFocus
                  />
                  <button type="submit" className={styles.otpButton} disabled={otpLoading || otpCode.trim().length !== 6}>
                    {otpLoading ? <span className={styles.spinnerDark} /> : "Verify Code"}
                  </button>
                  <button type="button" className={styles.backLink} onClick={() => { setOtpStep('idle'); setOtpCode(''); setErrorMessage(''); }}>
                    Use a different email
                  </button>
                </form>
              )} */}
            </div>

            <div className={styles.secureNote}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Secured access portal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className={styles.imgContainer}>
      <div className={styles.logo}>
        <img src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} alt="Endicott Police Logo" />
      </div>
      <h1 className={styles.mainHeading}>PIMS</h1>
      <p className={styles.subHeading}>Police Investigation Management System</p>
      <div className={styles.badge}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Endicott Police Department
      </div>
    </div>
  );
}
