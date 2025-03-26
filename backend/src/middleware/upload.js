// const multer = require("multer");
// const GridFsStorage = require("multer-gridfs-storage");
// const mongoose = require("mongoose");
// const { dbConnect } = require("../config/dbConnect");

// console.log("Mongoose connection readyState:", mongoose.connection.readyState);


// // **Ensure MongoDB is Connected Before Initializing Storage**
// const initGridFsStorage = async () => {
//     try {
//         const conn = await dbConnect(); // Ensure MongoDB is connected

//         const storage = new GridFsStorage({
//             url: process.env.MONGO_URI,
//             file: (req, file) => {
//                 return {
//                     filename: `${Date.now()}-${file.originalname}`,
//                     bucketName: "uploads",
//                 };
//             },
//         });
        
        
        

//         console.log("✅ GridFS Storage Initialized for File Uploads");
//         return storage;
//     } catch (error) {
//         console.error("❌ GridFS Storage Initialization Error:", error);
//         throw error;
//     }
// };

// // **Export the Middleware Properly**
// const getUploadMiddleware = async () => {
//     const storage = await initGridFsStorage();
//     return multer({ storage });
// };

// module.exports = getUploadMiddleware;

// const multer = require("multer");
// const fs = require("fs");
// const path = require("path");

// // Ensure the uploads directory exists
// const uploadDir = path.join(__dirname, "../uploads");

// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
//   console.log("✅ Created 'uploads/' directory");
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir); 
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage });

// module.exports = upload;


// middleware/upload.js
// const crypto = require("crypto");
// const multer = require("multer");
// const GridFsStorage = require("multer-gridfs-storage");
// const Grid = require("gridfs-stream");
// const methodOverride = require('method-override');
// const path = require("path");


// const storage = new GridFsStorage({
//   url: "mongodb+srv://sagarwal4:HCDKdSmZ9VBcpWnX@cluster0.jcfyr.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0",
//   options: { useNewUrlParser: true, useUnifiedTopology: true },
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       const filename = `${Date.now()}-${file.originalname}`;
//       resolve({ filename, bucketName: "uploads" });
//     });
//   },
// });

// // const upload = multer({ dest: 'uploads/' });
// const upload = multer({ storage });

// module.exports = upload;

// upload.js
// const multer = require("multer");
// const GridFsStorage = require("multer-gridfs-storage");
// const { dbConnect } = require("../config/dbConnect");

// let upload; // We'll assign this after we connect to MongoDB

// dbConnect()
//   .then(() => {
//     console.log("DB connected, setting up GridFS storage...");

//     const storage = new GridFsStorage({
//       url: process.env.MONGO_URI,
//       options: { useNewUrlParser: true, useUnifiedTopology: true },
//       file: (req, file) => {
//         return new Promise((resolve, reject) => {
//           const filename = `${Date.now()}-${file.originalname}`;
//           resolve({ filename, bucketName: "uploads" });
//         });
//       },
//     });

//     upload = multer({ storage });
//   })
//   .catch((err) => {
//     console.error("Error connecting to MongoDB for GridFS storage:", err);
//   });

// // Export a function that returns the upload middleware once it's ready
// module.exports = function getUploadMiddleware() {
//   if (!upload) {
//     throw new Error("GridFS Storage is not initialized yet!");
//   }
//   return upload;
// };

const mongoose = require("mongoose");
const { dbConnect } = require("../config/dbConnect");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const path = require("path");

let gfs; // To hold the GridFS instance
let cachedUpload = null;

// Ensure that GridFsStorage is initialized only after DB is connected
const getUploadMiddleware = async () => {
  if (cachedUpload) {
    return cachedUpload;
  }
  try {
    console.log("Awaiting dbConnect...");
    const conn = await dbConnect();
    console.log("DB connected. Initializing GridFS...");

    gfs = Grid(conn.connection.db, mongoose.mongo);
    gfs.collection("uploads");
    console.log("GridFS initialized.");

    const storage = new GridFsStorage({
      url: process.env.MONGO_URI,
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      file: (req, file) => {
        return new Promise((resolve, reject) => {
          console.log("GridFsStorage file function called for:", file.originalname);
          const filename = `${Date.now()}-${file.originalname}`;
          console.log("Resolving file:", filename);
          resolve({ filename, bucketName: "uploads" });
        });
      }
    });

    console.log("GridFsStorage created.");
    return multer({ storage });
  } catch (error) {
    console.error("Error initializing GridFS Storage:", error);
    throw error;
  }
};


module.exports = getUploadMiddleware;





