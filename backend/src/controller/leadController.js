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
        completedDate,
        assignedTo,              // <-- Array of strings
        assignedBy,
        summary,
        description,
        leadStatus,
        dueDate,
        priority,
        caseName,
        caseNo,
        accessLevel
      } = req.body;
  
      // Pass them directly into the new Lead object
      const newLead = new Lead({
        leadNo,
        parentLeadNo,      // Don't redefine type or default here; schema handles it
        incidentNo,
        subNumber,
        associatedSubNumbers,
        assignedDate,
        completedDate,
        assignedTo,
        assignedBy,
        summary,
        description,
        leadStatus,
        dueDate,
        priority,
        caseName,
        caseNo,
        accessLevel
      });
  
      await newLead.save();
      res.status(201).json(newLead);
      
          // Update the corresponding case with the new subNumber if not already present
    // const caseDoc = await Case.findById(caseNo);
    // if (caseDoc && !caseDoc.subNumbers.includes(subNumber)) {
    //   caseDoc.subNumbers.push(subNumber);
    //   await caseDoc.save();
    // }
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

const getLeadsForAssignedToOfficer= async (req, res) => {
  try {
      const officerName = req.user.name; // Extract officer's name from the authenticated request

      // Fetch leads where assignedTo contains the officer's name
      const leads = await Lead.find({ assignedTo: officerName });

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

  const getLeadsByLeadNoandLeadName = async (req, res) => {
    try {

        const { leadNo, leadName, caseNo, caseName } = req.params;

        const query = { 
            leadNo: leadNo, 
            description: leadName,  
            caseNo: caseNo, 
            caseName: caseName
        };

        const leads = await Lead.find(query);

   

        res.status(200).json(leads);
    } catch (err) {
        console.error("Error fetching leads by case:", err.message);
        res.status(500).json({ message: "Something went wrong" });
    }
};
const getLeadsforHierarchy = async (req, res) => {
  try {

      const { leadNo, caseNo, caseName } = req.params;

      const query = { 
          leadNo: leadNo, 
          caseNo: caseNo, 
          caseName: caseName
      };

      const leads = await Lead.find(query);

 

      res.status(200).json(leads);
  } catch (err) {
      console.error("Error fetching leads by case:", err.message);
      res.status(500).json({ message: "Something went wrong" });
  }
};

const getAssociatedSubNumbers = async (req, res) => {
  try {
    const { caseNo, caseName } = req.params;

    const leads = await Lead.find({ caseNo, caseName });
    const uniqueSubNumbers = [...new Set(leads.flatMap(lead => lead.subNumber || []))];

    res.status(200).json({ associatedSubNumbers: uniqueSubNumbers });
  } catch (err) {
    console.error("Error fetching subnumbers:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};



const updateLeadStatus = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;
    const { status } = req.body;

    // Find the lead
    const lead = await Lead.findOne({ leadNo: Number(leadNo), caseNo, caseName });
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Update the status
    lead.leadStatus = status;
    await lead.save();

    res.status(200).json({ message: "Status updated successfully", lead });
  } catch (err) {
    console.error("Error updating lead status:", err.message);
    res.status(500).json({ message: "Server error while updating lead status" });
  }
};

module.exports = { updateLeadStatus };




module.exports = { createLead, getLeadsByOfficer, getLeadsByCase, getLeadsForAssignedToOfficer, getLeadsByLeadNoandLeadName , getLeadsforHierarchy, updateLeadStatus, getAssociatedSubNumbers };
