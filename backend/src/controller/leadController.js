const Lead = require("../models/lead");

// lead.controller.js (or wherever your createLead function is defined)

const createLead = async (req, res) => {
    try {
      // Destructure all relevant fields from req.body
      const {
        leadNo,
        parentLeadNo,            // <-- Expect an array of numbers if provided
        incidentNo,
        subNumber,
        associatedSubNumbers,    // <-- Array of numbers
        assignedDate,
        assignedTo,              // <-- Array of strings
        assignedBy,
        summary,
        description,
        leadStatus,
        dueDate,
        priority,
        caseName,
        caseNo
      } = req.body;
  
      // Pass them directly into the new Lead object
      const newLead = new Lead({
        leadNo,
        parentLeadNo,      // Don't redefine type or default here; schema handles it
        incidentNo,
        subNumber,
        associatedSubNumbers,
        assignedDate,
        assignedTo,
        assignedBy,
        summary,
        description,
        leadStatus,
        dueDate,
        priority,
        caseName,
        caseNo
      });
  
      await newLead.save();
      res.status(201).json(newLead);
    } catch (err) {
      console.error("Error creating lead:", err.message);
      res.status(500).json({ message: "Something went wrong" });
    }
  };
  

const getLeadsByOfficer = async (req, res) => {
    try {
        const officerName = req.user.name; // Extract officer's name from the authenticated request

        // Fetch leads where assignedBy matches the officer's name
        const leads = await Lead.find({ assignedBy: officerName });

        res.status(200).json(leads);
    } catch (err) {
        console.error("Error fetching leads:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getLeadsByCase = async (req, res) => {
    try {
      const { caseNo, caseName } = req.params; 
      // Alternatively, you could use req.query if you prefer /case?caseNo=123&caseName=XYZ
      
      const leads = await Lead.find({ caseNo, caseName });
      res.status(200).json(leads);
    } catch (err) {
      console.error("Error fetching leads by case:", err.message);
      res.status(500).json({ message: "Something went wrong" });
    }
  };

module.exports = { createLead, getLeadsByOfficer, getLeadsByCase };
