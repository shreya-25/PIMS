const express = require("express");
const { createLRPerson, getLRPersonByDetails, getLRPersonByDetailsandid, updateLRPerson, updateLRPersonById, deleteLRPerson, deleteLRPersonById, uploadPersonPhoto, deletePersonPhoto, searchPersonsByName, getPersonsByCaseNo } = require("../controller/LRPersonController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload-disk");

const router = express.Router();

// Search persons by name (must be before parameterized routes)
router.get('/search', verifyToken, searchPersonsByName);

// Get all persons for a case
router.get('/case/:caseNo', verifyToken, getPersonsByCaseNo);

router.post("/lrperson", verifyToken, createLRPerson);

router.get("/lrperson/:leadNo/:leadName(*)/:caseId", verifyToken, getLRPersonByDetails);

router.get("/lrperson/:leadNo/:leadName(*)/:caseId/:id", verifyToken, getLRPersonByDetailsandid);

router.put(
    '/:leadNo/:caseId/:leadReturnId/:firstName',
    verifyToken,
    updateLRPerson
  );

  // DELETE  /api/lrperson/:leadNo/:caseId/:leadReturnId/:firstName
  router.delete(
    '/:leadNo/:caseId/:leadReturnId/:firstName',
    verifyToken,
    deleteLRPerson
  );

  // PUT by MongoDB _id  /api/lrperson/id/:id
  router.put(
    '/id/:id',
    verifyToken,
    updateLRPersonById
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
