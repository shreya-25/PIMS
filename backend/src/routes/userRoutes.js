const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();
const { getAllUsernames, updateUser } = require("../controller/userController");


//Only admin can access
router.get("/admin", verifyToken, (req, res) => {
    res.json({
        message:"Welcome Admin" });
});

//Both admin and manager can access this route
router.get("/casemanager", (req, res) => {
    res.json({
        message:"Welcome Case Manager" });
});

//All can access this route
router.get("/investigator", (req, res) => {
    res.json({
        message:"Welcome User" });
});

router.get("/usernames", getAllUsernames);
router.patch("/:id", verifyToken, updateUser);

module.exports = router;