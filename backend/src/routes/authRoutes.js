const express = require("express");
const { register, login, loginSendOtp, microsoftLogin, sendOtp, verifyOtp, getSetupInfo, setupAccount, forgotPassword, resetPassword, totpGenerate, totpActivate } = require("../controller/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login-send-otp", loginSendOtp);
router.post("/microsoft", microsoftLogin);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/setup-info", getSetupInfo);
router.post("/setup-account", setupAccount);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/totp/generate", totpGenerate);
router.post("/totp/activate", totpActivate);

module.exports = router;