// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv").config();
// const authRoutes = require("./routes/authRoutes.js");
// const userRoutes = require("./routes/userRoutes.js");
// const leadRoutes = require("./routes/leadRoutes.js"); // Import lead routes
// const leadReturnRoutes = require("./routes/leadReturnRoutes.js");
// const caseRoutes = require("./routes/caseRoutes.js");
// const notificationRoutes = require("./routes/notificationRoutes");
// const leadReturnResultRoutes = require("./routes/leadReturnResultRoutes.js");
// const LPRoutes = require("./routes/LPRoutes.js");
// const LVRoutes = require("./routes/LVRoutes.js");
// const LEnRoutes = require("./routes/LEnRoutes.js");
// const { dbConnect } = require("./config/dbConnect"); // Import dbConnect properly
// const {execSync } = require("child_process"); 
// const reportRoutes = require("./routes/reportRoutes.js"); // For report generation

// const app = express();
// const PORT = process.env.PORT || 7002;

// // Middleware
// app.use(express.json());
// app.use(cors({ origin: "http://localhost:3000",
//     methods: ["GET", "POST", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//  })); 

//  app.options('*', cors());

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/lead", leadRoutes); 
// app.use("/api/cases", caseRoutes); 
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/leadReturn", leadReturnRoutes);
// app.use("/api/leadReturnResult", leadReturnResultRoutes);
// app.use("/api/lrperson", LPRoutes);
// app.use("/api/lrvehicle", LVRoutes);
// // app.use("/api/lrenclosure", LEnRoutes);

// app.use("/api/report", reportRoutes);

// // Default Route
// app.get("/", (req, res) => {
//     res.send("Server is ready");
// });

// app.get('/test', (req, res) => {
//     res.send({ message: 'Server is still alive!' })
//   });


// dbConnect()
// .then(() => {
//   console.log("✅ Database connected successfully");
//   app.listen(PORT, () => {
//     console.log(`🚀 Server  on http://localhost:${PORT}`);
//   });
// })
// .catch((err) => {
//   //console.error("❌ Failed to connect to the database", err);
//   const stdout = execSync(`netstat -ano | findstr :5000`).toString();
// console.log(stdout);
// if (stdout.trim() !== "") {
//   console.log(`Port 5000 is in use. Killing...`);
//   execSync(`npx kill-port 5000`);
//   console.log(`Port 5000 has been freed.`);
// }
// });


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
const LEvRoutes = require("./routes/LEvRoutes.js");
const LRPRoutes = require("./routes/LRPRoutes.js");
const LRARoutes = require("./routes/LRARoutes.js");
const LRViRoutes = require("./routes/LRViRoutes.js");
const LRTimelineRoutes = require("./routes/LRTimelineRoute.js");
const LRScratchpadRoutes = require("./routes/LRScratchpadRoutes");
const { dbConnect } = require("./config/dbConnect"); // Import dbConnect properly
const path = require('path');



const reportRoutes = require("./routes/reportRoutes.js"); // For report generation


const app = express();


// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000",
    methods: ["GET", "POST","PUT", "PATCH", "DELETE", "OPTIONS"],
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
app.use("/api/lrevidence", LEvRoutes);
app.use("/api/lrpicture", LRPRoutes);
app.use("/api/lraudio", LRARoutes);
app.use("/api/lrvideo", LRViRoutes);
app.use("/api/timeline", LRTimelineRoutes);
app.use("/api/scratchpad", LRScratchpadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'temp_uploads')));

app.use("/api/report", reportRoutes); // For report generation


// Default Route
app.get("/", (req, res) => {
    res.send("Server is ready");
});


app.get('/test', (req, res) => {
    res.send({ message: 'Server is still alive!' });
  });


// Log MongoDB connection string (for debugging, remove in production)
console.log(process.env.MONGO_URI);


// Start Server
const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});


  // Add cleanup logic for graceful shutdown
  process.on("SIGINT", async () => {
    console.log("SIGINT signal received: closing MongoDB connection");
    await conn.connection.close();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}).catch((error) => {
  console.error("Database connection failed", error);
});

