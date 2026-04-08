const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  createLREvidence,
  getLREvidenceByDetails,
  updateLREvidence,
  deleteLREvidence,
  getEvidenceByCaseNo,
} = require("../controller/LREvidenceController");
const getUploadMiddleware = require("../middleware/upload");
const upload = require("../middleware/upload-disk");

const router = express.Router();

router.post(
  "/upload-lrevidence",
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
  createLREvidence
);

router.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  createLREvidence
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

router.get("/case/:caseNo", verifyToken, getEvidenceByCaseNo);

router.get("/:leadNo/:leadName(*)/:caseId", verifyToken, getLREvidenceByDetails);

router.put(
  "/:leadNo/:leadName(*)/:caseId/:leadReturnId/:evidenceDescription(*)",
  verifyToken,
  upload.single("file"),
  updateLREvidence
);

router.delete(
  "/:leadNo/:leadName(*)/:caseId/:leadReturnId/:evidenceDescription(*)",
  verifyToken,
  deleteLREvidence
);

module.exports = router;