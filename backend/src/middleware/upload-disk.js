// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Define the destination folder
// const uploadDir = path.join(__dirname, "../temp_uploads");

// // Ensure the folder exists
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
//   console.log("Created temp_uploads directory");
// }

// // Configure disk storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const filename = `${Date.now()}-${file.originalname}`;
//     cb(null, filename);
//   }
// });

// const upload = multer({ storage });
// module.exports = upload;


const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define the destination folder relative to this file
const uploadDir = path.join(__dirname, "../temp_uploads");

// Ensure the destination folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created temp_uploads directory");
}

// Configure disk storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using the current timestamp
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  }
});

// Create and export the multer instance
const upload = multer({ storage });
module.exports = upload;

