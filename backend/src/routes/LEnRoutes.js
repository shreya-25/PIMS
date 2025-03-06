const express = require("express");
const { createLREnclosure, getLREnclosureByDetails } = require("../controller/LREnclosureController");
const verifyToken = require("../middleware/authMiddleware");
const { initGridFsStorage  } = require("../config/gridfsConfig"); // Use the GridFS storage

const router = express.Router();

router.post("/upload", verifyToken, (req, res, next) => {
    console.log("Before upload middleware, req.file:", req.file);

    let upload;
    try {
      // Initialize multer storage after connection is expected to be ready.
      upload = initGridFsStorage();
    } catch (error) {
      return next(error); // Forward the error if connection is not ready.
    }
    // Use the upload middleware to handle the file upload.
    upload.single("file")(req, res, (err) => {
      if (err) {
        return next(err);
      }
      // Proceed to the controller if file upload is successful.
      createLREnclosure(req, res, next);
    });
  });

// **Fetch Enclosures by Details**
router.get("/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLREnclosureByDetails);

module.exports = router;
