// gridfsconfig.js
const { GridFsStorage } = require("multer-gridfs-storage");
const multer = require("multer");
const mongoose = require("mongoose");

// A helper function to create and return the multer instance
function initGridFsStorage() {
    // Ensure the Mongoose connection is established
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Mongoose connection is not established");
    }

    const storage = new GridFsStorage({
        // Use the already established db connection
        db: mongoose.connection.db,
        file: (req, file) => {
            // Directly return the file info without using a Promise
            const filename = `${Date.now()}-${file.originalname}`;
            return {
              filename: filename,
              bucketName: "uploads", // This creates "uploads.files" and "uploads.chunks"
            };
          },
        });
        return multer({ storage });
      }
      
      module.exports = { initGridFsStorage };