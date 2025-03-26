const mongoose = require("mongoose");
const { dbConnect } = require("../config/dbConnect");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const path = require("path");

let gfs; // To hold the GridFS instance
// let cachedUpload = null;

// const getUploadMiddleware = async () => {
//   if (cachedUpload) {
//     console.log("Using cached multer instance");
//     return cachedUpload;
//   }
//   try {
//     console.log("Awaiting dbConnect...");
//     const conn = await dbConnect();
//     console.log("DB connected. Initializing GridFS...");

//     gfs = Grid(conn.connection.db, mongoose.mongo);
//     gfs.collection("uploads");
//     console.log("GridFS initialized.");

//     const storage = new GridFsStorage({
//       url: "mongodb+srv://sagarwal4:HCDKdSmZ9VBcpWnX@cluster0.jcfyr.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0",
//       options: { useNewUrlParser: true, useUnifiedTopology: true },
//       file: (req, file) => {
//         return new Promise((resolve, reject) => {
//           console.log("GridFsStorage file function called for:", file.originalname);
//           const fileInfo = {
//             filename: `${Date.now()}-${file.originalname}`,
//             bucketName: 'uploads' // Ensure this matches your GridFS bucket
//           };
//           console.log("File info to be saved:", fileInfo);
//           resolve(fileInfo);
//         });
//       }
//     });

//     console.log("GridFsStorage created.");
//     cachedUpload = multer({ storage });
//     return  cachedUpload;
//   } catch (error) {
//     console.error("Error initializing GridFS Storage:", error);
//     throw error;
//   }
// };

const getUploadMiddleware = async () => {
  try {
    console.log("Awaiting dbConnect...");
    const conn = await dbConnect();
    console.log("DB connected. Initializing GridFS...");
    gfs = Grid(conn.connection.db, mongoose.mongo);
    gfs.collection("uploads");
    console.log("GridFS initialized.");

    const storage = new GridFsStorage({
      url: "mongodb+srv://sagarwal4:YOUR_PASSWORD@cluster0.jcfyr.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0",
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      file: (req, file) => {
        return new Promise((resolve, reject) => {
          console.log("GridFsStorage file function called for:", file.originalname);
          const fileInfo = {
            filename: `${Date.now()}-${file.originalname}`,
            bucketName: 'uploads'
          };
          console.log("File info to be saved:", fileInfo);
          resolve(fileInfo);
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



