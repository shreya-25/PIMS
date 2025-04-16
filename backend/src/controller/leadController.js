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
        accessLevel,
        submittedDate,
        approvedDate,
        returnedDate,

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
        accessLevel,
        submittedDate,
        approvedDate,
        returnedDate,
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

    const lead = await Lead.findOne({
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Set leadStatus as "pending" by default
    lead.leadStatus = "Pending";
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
  console.log("Inside searchLeadsByKeyword");
  try {
    // Expect these query parameters from the client.
    const { caseNo, caseName, keyword, field } = req.query;
    console.log("Received query:", caseNo, caseName, keyword, field);

    // Validate required fields.
    if (!caseNo || !caseName) {
      return res.status(400).json({ message: "caseNo and caseName are required." });
    }
    
    // Use the provided keyword or default to an empty string.
    const searchKeyword = keyword || "";
    
    // Build the common part of the query using case info.
    const baseQuery = {
      caseNo,
      caseName: { $regex: new RegExp(`^${caseName}$`, "i") }
    };

    let query;
    // If the client provided a specific 'field' parameter,
    // build the query accordingly.
    if (field) {
      switch (field) {
        case "Lead Number":
          // For lead number, expect an exact match.
          query = { ...baseQuery, leadNo: searchKeyword };
          break;
        case "Priority":
          // Use a regex to perform a case‑insensitive search on priority.
          query = { ...baseQuery, priority: { $regex: new RegExp(searchKeyword, "i") } };
          break;
        case "Due Date":
          // For due date, you might choose regex (for partial matches) or exact match.
          // Here, we use regex. Adjust the logic if you need proper date comparisons.
          query = { ...baseQuery, dueDate: { $regex: new RegExp(searchKeyword, "i") } };
          break;
        case "Remaining Days":
          // For numeric fields, convert the keyword to a number.
          const numericKeyword = Number(searchKeyword);
          if (isNaN(numericKeyword)) {
            return res.status(400).json({ message: "Invalid value for Remaining Days." });
          }
          query = { ...baseQuery, remainingDays: numericKeyword };
          break;
        default:
          // If an unsupported field is provided, fall back to default search.
          query = {
            ...baseQuery,
            $or: [
              { description: { $regex: new RegExp(searchKeyword, "i") } },
              { summary: { $regex: new RegExp(searchKeyword, "i") } }
            ]
          };
      }
    } else {
      // Without a 'field' parameter, default behavior:
      // - If keyword matches the lead number pattern, search by leadNo.
      // - Else search the description and summary fields.
      if (searchKeyword.match(/^Lead\d+$/i)) {
        query = { ...baseQuery, leadNo: searchKeyword };
      } else {
        query = {
          ...baseQuery,
          $or: [
            { description: { $regex: new RegExp(searchKeyword, "i") } },
            { summary: { $regex: new RegExp(searchKeyword, "i") } }
          ]
        };
      }
    }
    
    // Execute the query.
    const leads = await Lead.find(query);
    res.status(200).json(leads);
  } catch (err) {
    console.error("Error searching leads:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};





module.exports = { createLead, getLeadsByOfficer, getLeadsByCase, getLeadsForAssignedToOfficer, getLeadsByLeadNoandLeadName , getLeadsforHierarchy, updateLeadStatus, getAssociatedSubNumbers, updateLRStatusToPending, searchLeadsByKeyword };






