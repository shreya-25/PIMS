// const GridFsStorage = require("multer-gridfs-storage");
// const mongoose = require("mongoose");

// const storage = new GridFsStorage({
//   db: new Promise((resolve, reject) => {
//     if (mongoose.connection.readyState === 1) {
//       return resolve(mongoose.connection.db);
//     }
//     mongoose.connection.once('open', () => {
//       resolve(mongoose.connection.db);
//     });
//   }),
//   file: (req, file) => ({
//     filename: `${Date.now()}-${file.originalname}`,
//     bucketName: "uploads",
//   }),
// });

// const crypto = require("crypto");
// const multer = require("multer");
// const GridFsStorage = require("multer-gridfs-storage");

// const path = require("path");
// const storage = new GridFsStorage({
//   url: "mongodb://yourMongoDBURI", 
//   options: { useNewUrlParser: true, useUnifiedTopology: true },
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       const filename = `${Date.now()}-${file.originalname}`;
//       resolve({ filename: filename, bucketName: "uploads" });
//     });
//   },
// });
