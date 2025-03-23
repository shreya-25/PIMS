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
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
require("dotenv").config(); // load .env file for MONGO_URI

async function createUploadMiddleware() {
  try {
    const storage = new GridFsStorage({
      url: process.env.MONGO_URI,
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      file: (req, file) => {
        return new Promise((resolve, reject) => {
          const fileInfo = {
            filename: `LREnclosure_${Date.now()}_${file.originalname}`,
            bucketName: "uploads", // Files will be stored in uploads.files/chunks
            metadata: {
              originalname: file.originalname,
              fieldname: file.fieldname,
            },
          };
          resolve(fileInfo);
        });
      },
    });
    const upload = multer({ storage });
    return upload;
  } catch (error) {
    console.error("Error setting up GridFsStorage:", error);
    throw error;
  }
}

module.exports = createUploadMiddleware;




