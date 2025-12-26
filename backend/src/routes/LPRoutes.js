const express = require("express");
const { createLRPerson, getLRPersonByDetails, getLRPersonByDetailsandid, updateLRPerson, deleteLRPerson } = require("../controller/LRPersonController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");

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

module.exports = router;
