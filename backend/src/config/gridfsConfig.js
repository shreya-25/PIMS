const GridFsStorage = require("multer-gridfs-storage");
const mongoose = require("mongoose");

const storage = new GridFsStorage({
  db: new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1) {
      return resolve(mongoose.connection.db);
    }
    mongoose.connection.once('open', () => {
      resolve(mongoose.connection.db);
    });
  }),
  file: (req, file) => ({
    filename: `${Date.now()}-${file.originalname}`,
    bucketName: "uploads",
  }),
});
