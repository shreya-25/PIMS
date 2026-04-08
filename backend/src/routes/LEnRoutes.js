const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  createLREnclosure,
  getLREnclosureByDetails,
  updateLREnclosure,
  deleteLREnclosure,
  getEnclosuresByCaseNo,
} = require("../controller/LREnclosureController");
const getUploadMiddleware = require("../middleware/upload");
const upload = require("../middleware/upload-disk");

const router = express.Router();

router.post(
  "/upload-lrenclosure",
  verifyToken,
  async (req, res, next) => {
    try {
      const dynamicUpload = await getUploadMiddleware();

      dynamicUpload.single("file")(req, res, function (err) {
        if (err) {
          console.error("Multer error:", err);
          return res.status(400).json({ message: err.message });
        }

        console.log("Multer finished, req.file:", req.file);
        next();
      });
    } catch (error) {
      console.error("Error in upload middleware:", error);
      return res.status(500).json({ message: "File upload initialization failed" });
    }
  },
  createLREnclosure
);

router.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  createLREnclosure
);

// router.post("/upload-test-gridfs", async (req, res) => {
//   try {
//     console.log("POST /upload-test-gridfs route reached");
//     const dynamicUpload = await getUploadMiddleware();
//     console.log("Multer instance acquired for test");

//     dynamicUpload.single("file")(req, res, function (err) {
//       if (err) {
//         console.error("Multer error on /upload-test-gridfs:", err);
//         return res.status(400).json({ message: err.message });
//       }

//       console.log("Multer finished, req.file:", req.file);
//       res.status(200).json({
//         message: "GridFS upload test successful",
//         file: req.file,
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
//       file: req.file,
//     });
//   });
// });

router.get("/case/:caseNo", verifyToken, getEnclosuresByCaseNo);

router.get("/:leadNo/:leadName(*)/:caseId", verifyToken, getLREnclosureByDetails);

router.put(
  "/:leadNo/:leadName(*)/:caseId/:leadReturnId",
  verifyToken,
  upload.single("file"),
  updateLREnclosure
);

router.delete(
  "/:leadNo/:leadName(*)/:caseId/:leadReturnId",
  verifyToken,
  deleteLREnclosure
);

module.exports = router;