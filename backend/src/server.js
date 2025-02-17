const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const leadRoutes = require("./routes/leadRoutes.js"); // Import lead routes
const caseRoutes = require("./routes/caseRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes");
const dbConnect = require("./config/dbConnect.js");

dbConnect();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" })); // Replace with your frontend URL

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/lead", leadRoutes); // Mount lead routes
app.use("/api/cases", caseRoutes); 
app.use("/api/notifications", notificationRoutes);


// Start Server
const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});

// Default Route
app.get("/", (req, res) => {
    res.send("Server is ready");
});

// Log MongoDB connection string (for debugging, remove in production)
console.log(process.env.MONGO_URI);
