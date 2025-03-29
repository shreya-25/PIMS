const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const leadRoutes = require("./routes/leadRoutes.js"); // Import lead routes
const leadReturnRoutes = require("./routes/leadReturnRoutes.js");
const caseRoutes = require("./routes/caseRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes");
const leadReturnResultRoutes = require("./routes/leadReturnResultRoutes.js");
const LPRoutes = require("./routes/LPRoutes.js");
const LVRoutes = require("./routes/LVRoutes.js");
const LEnRoutes = require("./routes/LEnRoutes.js");
const { dbConnect } = require("./config/dbConnect"); // Import dbConnect properly

const reportRoutes = require("./routes/reportRoutes.js"); // For report generation

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
 })); 

 app.options('*', cors());

dbConnect().then((conn) => {
    console.log("✅ Database connected, starting server...");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/lead", leadRoutes); 
app.use("/api/cases", caseRoutes); 
app.use("/api/notifications", notificationRoutes);
app.use("/api/leadReturn", leadReturnRoutes);
app.use("/api/leadReturnResult", leadReturnResultRoutes);
app.use("/api/lrperson", LPRoutes);
app.use("/api/lrvehicle", LVRoutes);
app.use("/api/lrenclosure", LEnRoutes);

app.use("/api/report", reportRoutes); // For report generation

// Default Route
app.get("/", (req, res) => {
    res.send("Server is ready");
});

app.get('/test', (req, res) => {
    res.send({ message: 'Server is still alive!' });
  });

// Log connection string (remove in production)
console.log(process.env.MONGO_URI);

// Start server
const PORT = process.env.PORT || 7002;
server = app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});

// 🔁 Handle nodemon restarts gracefully
process.once("SIGUSR2", () => {
  console.log("♻️  SIGUSR2 received. Restarting server...");
  server.close(() => {
    console.log("🛑 Server closed. Releasing port...");
    process.kill(process.pid, "SIGUSR2");
  });
});
})
.catch((error) => {
console.error("❌ Database connection failed", error);
});