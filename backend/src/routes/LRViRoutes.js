const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { createLRVideo, getLRVideoByDetails,
  updateLRVideo,
  deleteLRVideo } = require("../controller/LRVideoController");
const getUploadMiddleware = require("../middleware/upload");
const upload = require("../middleware/upload-disk");


const router = express.Router();

// router.post(
//   "/upload-lrevidence",
//   verifyToken,
//   async (req, res, next) => {
//     // 1) Perform the file upload
//     try {
//       const upload = await getUploadMiddleware();
//       upload.single("file")(req, res, function (err) {
//         if (err) {
//           console.error("Multer error:", err);
//           return res.status(400).json({ message: err.message });
//         }
//         console.log("Multer finished, req.file:", req.file);
//         next(); // Proceed to the next middleware/controller
//       });
//     } catch (error) {
//       console.error("Error in upload middleware:", error);
//       return res.status(500).json({ message: "File upload initialization failed" });
//     }
//   },
//   // 2) After the file is uploaded, call createLREnclosure
//   createLREvidence
// );


router.post(
    "/upload",
    verifyToken,
    upload.single("file"), // process file upload via disk storage
    createLRVideo  // then call your controller to save textual data & file details to MongoDB
  );

// router.post("/upload-test-gridfs", async (req, res) => {
//   try {
//     console.log("POST /upload-test-gridfs route reached");
//     const upload = await getUploadMiddleware();
//     console.log("Multer instance acquired for test");
//     upload.single("file")(req, res, function (err) {
//       if (err) {
//         console.error("Multer error on /upload-test-gridfs:", err);
//         return res.status(400).json({ message: err.message });
//       }
//       console.log("Multer finished, req.file:", req.file);
//       res.status(200).json({ 
//         message: "GridFS upload test successful", 
//         file: req.file 
//       });
//     });
//   } catch (error) {
//     console.error("Error in /upload-test-gridfs route:", error);
//     res.status(500).json({ message: "GridFS upload test initialization failed" });
//   }
// });

// router.post("/upload-test", (req, res) => {
//   upload.single("file")(req, res, (err) => {
//     if (err) {
//       console.error("Multer error:", err);
//       return res.status(400).json({ message: err.message });
//     }
//     console.log("Disk storage Multer finished, req.file:", req.file);
//     res.status(200).json({
//       message: "Disk storage upload test successful",
//       file: req.file
//     });
//   });
// });


router.get("/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLRVideoByDetails);

router.put(
  "/:id",
  verifyToken,
  upload.single("file"),
  updateLRVideo
);

// delete
router.delete(
  "/:id",
  verifyToken,
  deleteLRVideo
);


module.exports = router;
