const mongoose = require("mongoose");
const { dbConnect } = require("../config/dbConnect");
const multer = require("multer");
// const { GridFsStorage } = require("multer-gridfs-storage");
const GridFsStorage = require("multer-gridfs-storage");

const Grid = require("gridfs-stream");
const path = require("path");

let gfs; 

const getUploadMiddleware = async () => {
  try {
    console.log("Awaiting dbConnect...");
    const conn = await dbConnect();
    console.log("DB connected. Initializing GridFS...");
    gfs = Grid(conn.connection.db, mongoose.mongo);
    gfs.collection("uploads");
    console.log("GridFS initialized.");

    // const storage = new GridFsStorage({
    //   url: "mongodb+srv://sagarwal4:HCDKdSmZ9VBcpWnX@cluster0.jcfyr.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0",
    //   options: { useNewUrlParser: true, useUnifiedTopology: true },
    //   file: (req, file) => {
    //     return new Promise((resolve, reject) => {
    //       console.log("GridFsStorage file function called for:", file.originalname);
    //       const fileInfo = {
    //         filename: `${Date.now()}-${file.originalname}`,
    //         bucketName: 'uploads'
    //       };
    //       console.log("File info to be saved:", fileInfo);
    //       resolve(fileInfo);
    //     });
    //   }
    // });
    
    const storage = new GridFsStorage({
        db: new Promise((resolve, reject) => {
          if (mongoose.connection.readyState === 1) {
            // Use getClient() to obtain the underlying MongoClient,
            // then get the native db instance.
            resolve(mongoose.connection.getClient().db());
          } else {
            mongoose.connection.once('open', () => {
              resolve(mongoose.connection.getClient().db());
            });
          }
        }),
        file: (req, file) => {
          return new Promise((resolve, reject) => {
            console.log("GridFsStorage file function called for:", file.originalname);
            const fileInfo = {
              filename: `${Date.now()}-${file.originalname}`,
              bucketName: 'uploads'
            };
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



