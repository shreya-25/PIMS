// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwksRsa = require("jwks-rsa");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const User = require("../models/userModel");

// In-memory OTP store: email -> { otp, expiresAt }
const otpStore = new Map();

// Shared professional OTP email template
function buildOtpEmail(otp) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px">
      <h2 style="color:#1a1a6e;margin-bottom:4px">Your Login Code</h2>
      <p style="color:#374151">Use the one-time code below to complete your sign-in. This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#374151">Your verification code:</p>
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:10px 16px;font-size:18px;font-weight:700;color:#0f172a;text-align:center">${otp}</div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#6b7280;font-size:13px">You can log in at: <a href="https://pims.endicott.pd.org" style="color:#1a73e8">https://pims.endicott.pd.org</a></p>
      <p style="color:#6b7280;font-size:13px">Do not share this code with anyone. If you did not request this, please contact your administrator immediately.</p>
    </div>
  `;

  const text = `Your PIMS login code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not request this code, please contact your administrator.`;

  return { html, text };
}

// Generate a random temp password: min 10 chars, upper+lower+digit+special
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

// Auto-generate unique username from lastName + badgeId (e.g. "smith1042")
async function generateUsername(lastName, badgeId) {
  const base = (String(lastName).toLowerCase().trim() + String(badgeId).trim()).replace(/[^a-z0-9_.\-]/g, "");
  let username = base;
  let count = 1;
  while (await User.exists({ username: new RegExp(`^${escapeRegExp(username)}$`, "i") })) {
    username = `${base}${count++}`;
  }
  return username;
}

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { title, firstName, lastName, role, email, agency, badgeId, ori, inviteMessage, accessExpiresAt, username: requestedUsername } = req.body;

    if (!firstName || !lastName || !role || !email) {
      return res.status(400).json({ message: "firstName, lastName, role & email are required" });
    }
    if (!badgeId || !String(badgeId).trim()) {
      return res.status(400).json({ message: "Badge ID is required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailDomain = cleanEmail.includes("@") ? cleanEmail.split("@")[1] : "";

    const existing = await User.findOne({ email: cleanEmail }).lean();
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    let username;
    if (requestedUsername && String(requestedUsername).trim()) {
      const cleanUsername = String(requestedUsername).trim().toLowerCase();
      if (!/^[a-z0-9_.\-]+$/i.test(cleanUsername)) {
        return res.status(400).json({ message: "Username may only contain letters, numbers, underscores, hyphens, and dots." });
      }
      const taken = await User.exists({ username: new RegExp(`^${escapeRegExp(cleanUsername)}$`, "i") });
      if (taken) {
        return res.status(409).json({ message: "That username is already taken." });
      }
      username = cleanUsername;
    } else {
      username = await generateUsername(lastName, badgeId);
    }
    const tempPassword = generateTempPassword();
    const setupToken = crypto.randomBytes(32).toString("hex");
    const setupTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const newUser = new User({
      title: title ? String(title).trim() : "",
      firstName,
      lastName,
      username,
      password: tempPassword,
      role,
      email: cleanEmail,
      agency: agency || "",
      badgeId: badgeId || "",
      ori: ori ? String(ori).toUpperCase().trim() : "",
      emailDomain,
      setupToken,
      setupTokenExpiry,
      accountSetupComplete: false,
      accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt) : null,
    });

    await newUser.save();

    // Send invitation email
    const frontendBase = (process.env.FRONTEND_URL || "https://pims.endicott.pd.org").replace(/\/$/, "");
    const setupLink = `${frontendBase}/setup-account?token=${setupToken}`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const expiryDate = accessExpiresAt ? new Date(accessExpiresAt) : null;
    const expiryText = expiryDate
      ? expiryDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : null;

    await transporter.sendMail({
      from: `"PIMS" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: "Welcome to PIMS – Set Up Your Account",
      text: [
        `Hello ${firstName},`,
        ``,
        ...(inviteMessage ? [`Message from your administrator:`, inviteMessage, ``] : []),
        `Your PIMS account has been created. Please set up your account by visiting the link below:`,
        ``,
        `${setupLink}`,
        ``,
        `Your temporary password (for reference): ${tempPassword}`,
        ``,
        `The setup link expires in 7 days.`,
        ...(expiryText ? [`Your account access expires on: ${expiryText}.`, ``] : []),
        `Once you set your password you can log in at: https://pims.endicott.pd.org`,
        ``,
        `Do not share your credentials.`,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px">
          <h2 style="color:#1a1a6e;margin-bottom:4px">Welcome to PIMS</h2>
          <p style="color:#374151">Hello <strong>${firstName} ${lastName}</strong>,</p>
          ${inviteMessage ? `<div style="background:#f8fafc;border-left:4px solid #1a73e8;border-radius:4px;padding:12px 16px;margin:12px 0;color:#374151;font-style:italic">${inviteMessage.replace(/\n/g, "<br/>")}</div>` : ""}
          <p style="color:#374151">Your PIMS account has been created with the role <strong>${role}</strong>${agency ? ` at <strong>${agency}</strong>` : ""}.</p>
          <p style="color:#374151">Please complete your account setup using the button below. This link expires in <strong>7 days</strong>.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${setupLink}" style="background:#1a73e8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Set Up My Account</a>
          </div>
          <p style="color:#374151">Your temporary password (for reference):</p>
          <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:10px 16px;font-family:monospace;font-size:16px;letter-spacing:2px;color:#0f172a">${tempPassword}</div>
          ${expiryText ? `<p style="color:#b45309;font-size:14px;margin-top:16px">Your account access expires on <strong>${expiryText}</strong>. After that date you will no longer be able to log in.</p>` : ""}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#6b7280;font-size:13px">Once you set your password, you can log in at: <a href="https://pims.endicott.pd.org" style="color:#1a73e8">https://pims.endicott.pd.org</a></p>
          <p style="color:#6b7280;font-size:13px">Do not share your credentials with anyone.</p>
        </div>
      `,
    });

    return res.status(201).json({
      message: `User registered. Invitation email sent to ${cleanEmail}.`,
      username,
      tempPassword,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        message: "Username or email already exists",
        duplicate: err.keyValue,
      });
    }

    if (err?.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        details: Object.fromEntries(
          Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
        ),
      });
    }

    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// GET /api/auth/setup-info?token=xxx
const getSetupInfo = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const user = await User.findOne({
      setupToken: token,
      setupTokenExpiry: { $gt: new Date() },
    })
      .select("firstName lastName email role agency badgeId ori username accountSetupComplete setupToken")
      .lean();

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired setup link. Please contact your admin." });
    }

    if (user.accountSetupComplete) {
      return res.status(409).json({ message: "Account already set up. Please log in." });
    }

    return res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      agency: user.agency,
      badgeId: user.badgeId || "",
      ori: user.ori || "",
      username: user.username || "",
    });
  } catch (err) {
    console.error("GET SETUP INFO ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/setup-account
const setupAccount = async (req, res) => {
  try {
    const { token, password, firstName, lastName, role, agency, badgeId, ori, username } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    // Validate username if provided
    if (username !== undefined) {
      const cleanUsername = String(username).trim().toLowerCase();
      if (!cleanUsername) {
        return res.status(400).json({ message: "Username cannot be empty." });
      }
      if (!/^[a-z0-9_.-]+$/.test(cleanUsername)) {
        return res.status(400).json({ message: "Username may only contain letters, numbers, underscores, hyphens, and dots." });
      }
    }

    // Validate password strength
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;
    if (password.length < 8 || !pwdRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character.",
      });
    }

    const user = await User.findOne({
      setupToken: token,
      setupTokenExpiry: { $gt: new Date() },
    }).select("+setupToken +password");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired setup link. Please contact your admin." });
    }

    if (user.accountSetupComplete) {
      return res.status(409).json({ message: "Account already set up. Please log in." });
    }

    // Check username uniqueness (excluding current user)
    if (username !== undefined) {
      const cleanUsername = String(username).trim().toLowerCase();
      const taken = await User.exists({
        _id: { $ne: user._id },
        username: new RegExp(`^${escapeRegExp(cleanUsername)}$`, "i"),
      });
      if (taken) {
        return res.status(409).json({ message: "That username is already taken. Please choose another." });
      }
      user.username = cleanUsername;
    }

    user.password = password;
    user.accountSetupComplete = true;
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (role) user.role = role;
    if (agency !== undefined) user.agency = agency;
    if (badgeId !== undefined) user.badgeId = String(badgeId).trim();
    if (ori !== undefined) user.ori = String(ori).toUpperCase().trim();
    // Reset displayName so pre-save hook regenerates it
    user.displayName = undefined;
    await user.save();
    await User.updateOne(
      { _id: user._id },
      { $unset: { setupToken: "", setupTokenExpiry: "" } }
    );

    return res.status(200).json({ message: "Account set up successfully. You can now log in." });
  } catch (err) {
    console.error("SETUP ACCOUNT ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/login-send-otp  — verify password then send OTP or indicate TOTP
const loginSendOtp = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select("+password");

    if (!user) {
      return res.status(404).json({ message: "No account found with that email." });
    }

    if (!user.accountSetupComplete) {
      return res.status(403).json({ message: "Account setup not complete. Please check your email to set up your account." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is deactivated. Contact admin." });
    }

    if (user.accessExpiresAt && new Date() > user.accessExpiresAt) {
      return res.status(403).json({ message: "Your account access has expired. Please contact your admin." });
    }

    const isMatch = typeof user.comparePassword === "function"
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Password mismatch. Please try again." });
    }

    // If user has TOTP enabled, don't send email — tell client to ask for authenticator code
    if (user.totpEnabled && user.mfaMethod === "totp") {
      return res.status(200).json({ mfaMethod: "totp", message: "Enter the code from your authenticator app." });
    }

    // Otherwise send email OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(cleanEmail, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"PIMS" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: "Your PIMS Login Code",
      ...buildOtpEmail(otp),
    });

    return res.status(200).json({ mfaMethod: "email", message: "OTP sent to your email." });
  } catch (err) {
    console.error("LOGIN SEND OTP ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/login  (accepts username OR email)
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginId = (username || email || "").trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }

    const isEmail = loginId.includes("@");
    const user = await User.findOne(
      isEmail
        ? { email: loginId.toLowerCase() }
        : { username: new RegExp(`^${escapeRegExp(loginId)}$`, "i") }
    ).select("+password");

    if (!user) {
      return res.status(404).json({ message: "No account found with those credentials." });
    }

    if (!user.accountSetupComplete) {
      return res.status(403).json({ message: "Account setup not complete. Please check your email to set up your account." });
    }

    // ✅ Compare password safely
    let isMatch = false;
    if (typeof user.comparePassword === "function") {
      isMatch = await user.comparePassword(password);
    } else {
      // fallback
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    if (user.accessExpiresAt && new Date() > user.accessExpiresAt) {
      return res.status(403).json({ message: "Your account access has expired. Please contact your admin." });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing in env");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    return res.status(200).json({
      token,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      username: user.username,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/microsoft
const microsoftLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Microsoft ID token is required" });
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const tenantId = process.env.MICROSOFT_TENANT_ID;

    if (!clientId || !tenantId) {
      console.error("MICROSOFT_CLIENT_ID or MICROSOFT_TENANT_ID missing in env");
      return res.status(500).json({ message: "Microsoft auth not configured on server" });
    }

    // Use the common JWKS endpoint so tokens from any organization are accepted
    const jwksClient = jwksRsa({
      jwksUri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
    });

    const getKey = (header, callback) => {
      jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        callback(null, key.getPublicKey());
      });
    };

    // Decode header to get the actual issuer tenant for validation
    const unverified = jwt.decode(idToken, { complete: true });
    const tokenIssuer = unverified?.payload?.iss;

    // Validate the issuer is a legitimate Microsoft Azure AD tenant
    if (!tokenIssuer || !tokenIssuer.startsWith("https://login.microsoftonline.com/")) {
      return res.status(401).json({ message: "Invalid token issuer" });
    }

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(
        idToken,
        getKey,
        {
          audience: clientId,
          issuer: tokenIssuer, // validate against the token's own tenant
          algorithms: ["RS256"],
        },
        (err, payload) => {
          if (err) reject(err);
          else resolve(payload);
        }
      );
    });

    const email = (decoded.preferred_username || decoded.email || decoded.upn || "").toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Could not extract email from Microsoft token" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No PIMS account found for this Microsoft email. Please contact your admin.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is deactivated. Contact admin." });
    }

    if (user.accessExpiresAt && new Date() > user.accessExpiresAt) {
      return res.status(403).json({ message: "Your account access has expired. Please contact your admin." });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    return res.status(200).json({
      token,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      username: user.username,
    });
  } catch (err) {
    console.error("MICROSOFT LOGIN ERROR:", err);

    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired Microsoft token" });
    }

    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/send-otp
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail }).lean();
    if (!user) {
      return res.status(404).json({ message: "No PIMS account found for this email. Contact your admin." });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is deactivated. Contact admin." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(cleanEmail, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"PIMS" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: "Your PIMS Login Code",
      ...buildOtpEmail(otp),
    });

    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    return res.status(500).json({ message: err?.message || "Failed to send OTP" });
  }
};

// POST /api/auth/verify-otp  — handles both email OTP and TOTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp, method } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and code are required" });

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select("+totpSecret");
    if (!user) return res.status(404).json({ message: "User not found." });

    // If the client explicitly sent method:"email" (e.g. after clicking E-MAIL ME),
    // always use email OTP regardless of the user's stored mfaMethod.
    const useTotp = method !== "email" && user.totpEnabled && user.mfaMethod === "totp";

    if (useTotp) {
      // Verify TOTP code from authenticator app
      const valid = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: "base32",
        token: String(otp).trim(),
        window: 4, // allow ±2 min clock drift between server and device
      });
      if (!valid) return res.status(400).json({ message: "Invalid authenticator code. Please try again." });
    } else {
      // Verify email OTP — either user chose email MFA, or overridden by E-MAIL ME
      const record = otpStore.get(cleanEmail);
      if (!record) return res.status(400).json({ message: "No code was requested for this email." });
      if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanEmail);
        return res.status(400).json({ message: "Code has expired. Please request a new one." });
      }
      if (record.otp !== String(otp).trim()) return res.status(400).json({ message: "Invalid code." });
      otpStore.delete(cleanEmail);
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    return res.status(200).json({
      token,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      username: user.username,
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).lean();

    // Always return 200 to prevent email enumeration
    if (!user) return res.status(200).json({ message: "If that email exists, a reset link has been sent." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.updateOne({ _id: user._id }, { resetToken, resetTokenExpiry });

    const frontendBase = (process.env.FRONTEND_URL || "https://pims.endicott.pd.org").replace(/\/$/, "");
    const resetLink = `${frontendBase}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"PIMS" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: "PIMS – Password Reset Request",
      text: `Hello,\n\nA password reset was requested for your PIMS account.\n\nReset your password here:\n${resetLink}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px">
          <h2 style="color:#1a1a6e;margin-bottom:4px">PIMS Password Reset</h2>
          <p style="color:#374151">A password reset was requested for your account (<strong>${cleanEmail}</strong>).</p>
          <p style="color:#374151">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${resetLink}" style="background:#1a73e8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Reset My Password</a>
          </div>
          <p style="color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email.</p>
        </div>`,
    });

    return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password are required" });

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;
    if (password.length < 8 || !pwdRegex.test(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters with uppercase, lowercase, digit, and special character." });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    }).select("+resetToken +password");

    if (!user) return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });

    user.password = password;
    await user.save();
    await User.updateOne({ _id: user._id }, { $unset: { resetToken: "", resetTokenExpiry: "" } });

    return res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/totp/generate  — generate secret + QR for account setup
const totpGenerate = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ message: "User not found." });

    const secret = speakeasy.generateSecret({
      name: "PIMS",
      issuer: "PIMS",
      length: 20,
    });

    // Store the pending secret (not yet enabled)
    await User.updateOne({ _id: user._id }, { totpSecret: secret.base32 });

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return res.status(200).json({ qrCode: qrDataUrl, secret: secret.base32 });
  } catch (err) {
    console.error("TOTP GENERATE ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// POST /api/auth/totp/activate  — confirm first code and enable TOTP
const totpActivate = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select("+totpSecret");
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.totpSecret) return res.status(400).json({ message: "No authenticator setup in progress." });

    const valid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token: String(code).trim(),
      window: 4,
    });

    if (!valid) return res.status(400).json({ message: "Invalid code. Make sure your app is synced and try again." });

    await User.updateOne({ _id: user._id }, { totpEnabled: true, mfaMethod: "totp" });

    return res.status(200).json({ message: "Authenticator app enabled successfully." });
  } catch (err) {
    console.error("TOTP ACTIVATE ERROR:", err);
    return res.status(500).json({ message: err?.message || "Something went wrong" });
  }
};

// Helper: escape regex special chars in username
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  register,
  login,
  loginSendOtp,
  microsoftLogin,
  sendOtp,
  verifyOtp,
  getSetupInfo,
  setupAccount,
  forgotPassword,
  resetPassword,
  totpGenerate,
  totpActivate,
};