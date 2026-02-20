const express = require("express");
const { createLRPerson, getLRPersonByDetails, getLRPersonByDetailsandid, updateLRPerson, deleteLRPerson, deleteLRPersonById, uploadPersonPhoto, deletePersonPhoto } = require("../controller/LRPersonController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload-disk");

const router = express.Router();
router.post("/lrperson", verifyToken, createLRPerson);

router.get("/lrperson/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLRPersonByDetails);

router.get("/lrperson/:leadNo/:leadName/:caseNo/:caseName/:id", verifyToken, getLRPersonByDetailsandid);

router.put(
    '/:leadNo/:caseNo/:leadReturnId/:firstName',
    verifyToken,
    updateLRPerson
  );

  // DELETE  /api/lrperson/:leadNo/:caseNo/:leadReturnId/:firstName
  router.delete(
    '/:leadNo/:caseNo/:leadReturnId/:firstName',
    verifyToken,
    deleteLRPerson
  );

  // DELETE by MongoDB _id  /api/lrperson/id/:id
  router.delete(
    '/id/:id',
    verifyToken,
    deleteLRPersonById
  );

  // Upload person photo
  router.post(
    '/photo/:id',
    verifyToken,
    upload.single('photo'),
    uploadPersonPhoto
  );

  // Delete person photo
  router.delete(
    '/photo/:id',
    verifyToken,
    deletePersonPhoto
  );

module.exports = router;
