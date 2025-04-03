const express = require("express");
const { createLead, getLeadsByOfficer, getLeadsByCase, getLeadsForAssignedToOfficer, getLeadsByLeadNoandLeadName, getLeadsforHierarchy, updateLeadStatus } = require("../controller/leadController");
const verifyToken = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");
const Lead = require("../models/lead");



const router = express.Router();

router.post("/create", verifyToken, roleMiddleware("CaseManager"), createLead);

// Fetch leads assigned by the logged-in officer
router.get("/assigned-leads", verifyToken, getLeadsByOfficer);

router.get("/case/:caseNo/:caseName", verifyToken, getLeadsByCase);

router.get("/assignedTo-leads", verifyToken, getLeadsForAssignedToOfficer);

router.get("/lead/:leadNo/:leadName/:caseNo/:caseName", verifyToken, getLeadsByLeadNoandLeadName);
router.get("/lead/:leadNo/:caseNo/:caseName", verifyToken, getLeadsforHierarchy);

router.patch('/:leadNo/:caseNo/:caseName/status', verifyToken, updateLeadStatus);



// API to get the maximum lead number
// router.get("/maxLeadNumber", async (req, res) => {
//     try {
//         const maxLead = await Lead.findOne().sort({ leadNo: -1 }).limit(1); // Get the highest lead number
//         const maxLeadNo = maxLead ? maxLead.leadNo : 0; // Default to 0 if no leads exist
//         res.status(200).json({ maxLeadNo });
//     } catch (error) {
//         console.error("Error fetching max lead number:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });


router.get("/maxLeadNumber", async (req, res) => {
    try {
      const { caseNo, caseName } = req.query;
  
      if (!caseNo || !caseName) {
        return res.status(400).json({ message: "caseNo and caseName are required" });
      }
  
      const numericCaseNo = Number(caseNo);
  
      // Find the lead with the highest leadNo for the given caseNo and caseName
      const maxLead = await Lead.findOne({ caseNo: numericCaseNo, caseName: caseName })
        .sort({ leadNo: -1 })
        .limit(1);
  
      const maxLeadNo = maxLead ? maxLead.leadNo : 0;
      res.status(200).json({ maxLeadNo });
    } catch (error) {
      console.error("Error fetching max lead number:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

module.exports = router;
