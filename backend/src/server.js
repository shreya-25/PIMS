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
// const LogRoutes = require("./routes/LogRoutes.js");
const CommentRoutes = require("./routes/CommentRoutes.js");
const { dbConnect } = require("./config/dbConnect"); // Import dbConnect properly
const path = require('path');
const presenceRoutes = require("./routes/presenceRoutes");
const verifyToken = require("./middleware/authMiddleware"); 





const reportRoutes = require("./routes/reportRoutes.js"); // For report generation


const app = express();


// Middleware
app.use(express.json());
// app.use(cors({ origin: ["http://localhost:3000","https://inquisitive-profiterole-e40491.netlify.app", "https://ephemeral-churros-459728.netlify.app"],
//     methods: ["GET", "POST","PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//  }));

const allowedOrigins = [
  "http://localhost:3000",                            // dev
  /\.netlify\.app$/,                                  // any Netlify preview or prod
  /\.herokuapp\.com$/                                 // any Heroku app
];

app.use(cors({
  origin: (origin, callback) => {
    // allow tools (no Origin header)
    if (!origin) return callback(null, true);

    // allow exact strings or regex matches
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.some(o => o instanceof RegExp && o.test(origin))
    ) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));



 app.options('*', cors());


dbConnect().then((conn) => {
    console.log("✅ Database connected, starting server...");

app.use((req, res, next) => {
  res.setHeader('X-Server-ID', `${process.pid}`);
  next();
});


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
app.use("/api/comment", CommentRoutes);
app.use("/api/presence", presenceRoutes);
// app.use("/api/logs", LogRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'temp_uploads')));

app.use("/api/report", reportRoutes); // For report generation

if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', '..', 'frontend', 'build');
  app.use(express.static(buildPath));

  // All other GET requests not handled by API go to React’s index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}


// Default Route
// app.get("/", (req, res) => {
//     res.send("Server is ready");
// });


app.get('/test', (req, res) => {
    res.send({ message: 'Server is still alive!' });
  });

  // in your server.js (or wherever you mount express.static)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(filePath) + '"');
    }
  }
}));



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

