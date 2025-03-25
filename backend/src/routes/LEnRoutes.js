// const express = require("express");
// const getUploadMiddleware = require("../middleware/upload"); // Import the async function
// const { createLREnclosure, getLREnclosureByDetails } = require("../controller/LREnclosureController");
// const verifyToken = require("../middleware/authMiddleware");

// const router = express.Router();

// (async () => {
//     try {
//         const upload = await getUploadMiddleware(); // Await middleware initialization

//         // **Upload File & Create LREnclosure**

//         router.post("/upload",
//             verifyToken,
//             (req, res, next) => {
//               console.log("About to call upload.single('file')");
//               next();
//             },
//             upload.single("file"),
//             (req, res, next) => {
//               console.log("After upload.single('file') - req.file is:", req.file);
//               next();
//             },
//             async (req, res, next) => {
//               console.log("Inside final handler. req.file:", req.file);
//               try {
//                 console.log("📁 Uploaded file:", req.file);

//                 if (!req.file) {
//                     return res.status(400).json({ message: "No file uploaded" });
//                 }

//                 await createLREnclosure(req, res, next);
//             } catch (error) {
//                 console.error("❌ Upload error:", error);
//                 res.status(500).json({ message: "File upload failed", error: error.message });
//             }
//             }
//           );

//         // **Fetch Enclosures by Details**
//         router.get("/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLREnclosureByDetails);

//     } catch (error) {
//         console.error("❌ Error initializing upload middleware:", error);
//     }
// })();

// module.exports = router;

const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { createLREnclosure, getLREnclosureByDetails } = require("../controller/LREnclosureController");
const createUploadMiddleware = require("../middleware/upload");

const router = express.Router();

(async () => {
  try {
    console.log("Initializing upload middleware...");
    const upload = await createUploadMiddleware();
    console.log("Upload middleware initialized");

    router.post("/upload",
      verifyToken,
      (req, res, next) => {
        console.log("Before upload.single('file')");
        next();
      },
      upload.single("file"),
      (req, res, next) => {
        console.log("After upload.single('file') - req.file:", req.file);
        next();
      },
      async (req, res, next) => {
        console.log("Inside final handler. req.file:", req.file);
        try {
          if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
          }
          await createLREnclosure(req, res, next);
        } catch (error) {
          console.error("Upload error in final middleware:", error);
          res.status(500).json({ message: "File upload failed", error: error.message });
        }
      }
    );

    router.get("/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLREnclosureByDetails);

  } catch (error) {
    console.error("Error initializing upload middleware:", error);
  }
})();

module.exports = router;
