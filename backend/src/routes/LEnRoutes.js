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

// const express = require("express");
// const verifyToken = require("../middleware/authMiddleware");
// const { createLREnclosure, getLREnclosureByDetails } = require("../controller/LREnclosureController");
// const getUploadMiddleware  = require("../middleware/upload");

// const router = express.Router();

// (async () => {
//   try {
//     console.log("Initializing upload middleware...");
//     const upload = await createUploadMiddleware();
//     console.log("Upload middleware initialized");

//     router.post("/upload",
//       verifyToken,
//       (req, res, next) => {
//         console.log("Before upload.single('file')");
//         next();
//       },
//       upload.single("file"),
//       (req, res, next) => {
//         console.log("After upload.single('file') - req.file:", req.file);
//         next();
//       },
//       async (req, res, next) => {
//         console.log("Inside final handler. req.file:", req.file);
//         try {
//           if (!req.file) {
//             return res.status(400).json({ message: "No file uploaded" });
//           }
//           await createLREnclosure(req, res, next);
//         } catch (error) {
//           console.error("Upload error in final middleware:", error);
//           res.status(500).json({ message: "File upload failed", error: error.message });
//         }
//       }
//     );

//     router.get("/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLREnclosureByDetails);

//   } catch (error) {
//     console.error("Error initializing upload middleware:", error);
//   }
// })();

// router.post("/upload", verifyToken, upload.single("file"), createLREnclosure);

// router.post("/upload",
//   // verifyToken,  // comment out for testing
//   upload.single("file"),
//   (req, res) => {
//     console.log("Reached /upload route");
//     res.send("Test response");
//   }
// );

// router.post(
//   "/upload",
//   verifyToken,
//   (req, res, next) => {
//     console.log("Before upload.single('file')");
//     next();
//   },
//   getUploadMiddleware().single("file"),
//   (req, res, next) => {
//     console.log("After upload.single('file') - req.file:", req.file);
//     next();
//   },
//   createLREnclosure
// );


// router.get("/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLREnclosureByDetails);

// module.exports = router;

// LEnRoutes.js
const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { createLREnclosure, getLREnclosureByDetails } = require("../controller/LREnclosureController");
const getUploadMiddleware = require("../middleware/upload");

const router = express.Router();

// router.post("/upload", (req, res, next) => {
//   console.log("Request headers:", req.headers);
//   if (!req.headers["content-type"] || !req.headers["content-type"].includes("multipart/form-data")) {
//     console.warn("Content-Type does not indicate a multipart/form-data request");
//   }
//   next();
// }, async (req, res, next) => {
//   try {
//     const upload = await getUploadMiddleware();
//     upload.single("file"), verifyToken, (req, res, function(err) {
//       if (err) {
//         console.error("Multer error:", err);
//         return res.status(400).json({ message: err.message });
//       }
//       console.log("After Multer, req.file:", req.file);
//       next();
//     });
//   } catch (error) {
//     console.error("Error in upload middleware:", error);
//     return res.status(500).json({ message: "File upload initialization failed" });
//   }
// }, createLREnclosure);



// router.get("/:leadNo/:leadName/:caseNo/:caseName",verifyToken, getLREnclosureByDetails);

router.post("/test", (req, res) => {
  console.log("POST /api/lrenclosure/test route hit");
  res.json({ message: "Test route works" });
});

// LEnRoutes.js
router.post("/upload", verifyToken, (req, res) => {
  console.log("POST /api/lrenclosure/upload route reached");
  res.status(200).json({ message: "Basic /upload route works" });
});


module.exports = router;
