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

    const lead = await Lead.findOne({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.leadStatus = status;
    await lead.save();

    res.status(200).json({ message: "Status updated successfully", lead });
  } catch (err) {
    console.error("Error updating lead status:", err.message);
    res.status(500).json({ message: "Server error while updating lead status" });
  }
};

exports.updateLeadLRStatus = async (req, res) => {
  const { leadNo, leadName, caseNo, caseName, lRStatus } = req.body;

  try {
    const lead = await Lead.findOne({
      leadNo,
      leadName,
      caseNo,
      caseName,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Assuming the `assignedBy` field exists and has `lRStatus`
    lead.assignedBy.lRStatus = lRStatus;

    await lead.save();

    return res.status(200).json({ message: "Lead status updated successfully" });
  } catch (error) {
    console.error("Error updating lead status:", error);
    return res.status(500).json({ message: "Server error updating lead status" });
  }
};

const updateLRStatusToPending = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo } = req.body;

    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const updatedDoc = await LeadReturn.findOneAndUpdate(
      {
        leadNo,
        description,
        caseName,
        caseNo,
      },
      {
        $set: {
          "assignedTo.lRStatus": "Pending",
        },
      },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "Lead return not found." });
    }

    res.status(200).json(updatedDoc);
  } catch (err) {
    console.error("Error updating lead return status:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const searchLeadsByKeyword = async (req, res) => {
  try {
    const { caseNo, caseName, keyword } = req.query;
    
    if (!caseNo || !caseName || !keyword) {
      return res.status(400).json({ message: "caseNo, caseName, and keyword are required." });
    }
    
    // Create a case-insensitive regex for the keyword
    const regex = new RegExp(keyword, "i");
    
    // Find leads matching the case and keyword in description or summary

    const leads = await Lead.find({
      caseNo, // ensure this is the same type as stored (if it's a string, it should be fine)
      caseName: { $regex: new RegExp(`^${caseName}$`, "i") },
      $or: [
        { description: { $regex: new RegExp(keyword, "i") } },
        { summary: { $regex: new RegExp(keyword, "i") } }
      ]
    });
    
    
    res.status(200).json(leads);
  } catch (err) {
    console.error("Error searching leads:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};




module.exports = { createLead, getLeadsByOfficer, getLeadsByCase, getLeadsForAssignedToOfficer, getLeadsByLeadNoandLeadName , getLeadsforHierarchy, updateLeadStatus, getAssociatedSubNumbers, updateLRStatusToPending, searchLeadsByKeyword };
