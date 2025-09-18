const Lead = require("../models/lead");
const mongoose = require("mongoose");


// lead.controller.js (or wherever your createLead function is defined)

// Put near the top of the file
const computeAggregateStatus = (assignedTo = []) => {
  const list = (assignedTo || []).map(a => a?.status || "pending");
  if (!list.length) return "Assigned";
  const allAccepted = list.every(s => s === "accepted");
  const allDeclined = list.every(s => s === "declined");
  if (allAccepted) return "Accepted";
  if (allDeclined) return "Rejected";
  if (list.includes("declined")) return "To Reassign";
  return "Assigned";
};


const createLead = async (req, res) => {
  try {
    const {
      parentLeadNo = [],
      incidentNo,
      subNumber = [],
      associatedSubNumbers = [],
      assignedDate,
      completedDate,
      assignedTo: assignedToInput = [],
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
      primaryInvestigator,
    } = req.body;

     const missing = [];
    if (!caseName)    missing.push('Case Name');
    if (!caseNo)      missing.push('Case Number');
    if (!summary)     missing.push('Lead Log Summary');
    if (!description) missing.push('Lead Description');

    if (missing.length) {
      return res.status(400).json({
        message: `${missing.length > 1 ? 's' : ''} ${missing.join(', ')} field missing`
      });
    }

    const actor = req.user?.name || assignedBy;

    const assignedTo = assignedToInput.map(item =>
      typeof item === 'string'
        ? { username: item, status: 'pending' }
        : { username: item.username, status: item.status || 'pending' }
    );

   let savedLead = null;
    while (!savedLead) {
      const last = await Lead.findOne({ caseNo, caseName }).sort({ leadNo: -1 }).limit(1);
      const nextLeadNo = last ? last.leadNo + 1 : 1;

      try {
        const initialEvent = {
          type: "assigned",
          by: actor,
          to: assignedTo.map(x => x.username),
          primaryInvestigator: primaryInvestigator || null,
          statusAfter: "Assigned",
          at: assignedDate ? new Date(assignedDate) : new Date()
        };

        savedLead = await new Lead({
          leadNo: nextLeadNo,
          parentLeadNo,
          incidentNo,
          subNumber,
          associatedSubNumbers,
          assignedDate,
          completedDate,
          assignedTo,
          assignedBy,
          summary,
          description,
          leadStatus: leadStatus || "Assigned",
          dueDate,
          priority,
          caseName,
          caseNo,
          accessLevel,
          submittedDate,
          approvedDate,
          returnedDate,
          primaryInvestigator,
          events: [initialEvent]   // 👈 add the first event
        }).save();

        return res.status(201).json(savedLead);
      } catch (err) {
        if (err.code === 11000) continue;
        throw err;
      }
    }
  } catch (err) {
    console.error("Error creating lead:", err);
    return res.status(500).json({ message: "Something went wrong" });
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

const getLeadsForAssignedToOfficer = async (req, res) => {
  try {
    const officerName = req.user.name; 

    // find any lead where assignedTo array contains an object with this username
    const leads = await Lead.find({ 
      'assignedTo.username': officerName 
    });

    res.status(200).json(leads);
  } catch (err) {
    console.error("Error fetching leads for officer:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const getAssignedLeadsForOfficer = async (req, res) => {
  try {
    const officerName = req.user.name; 

    // Query: assignedTo.username must match, and leadStatus === "Assigned"
    const leads = await Lead.find({
      "assignedTo.username": officerName,
      leadStatus: "Assigned"
    });

    return res.status(200).json(leads);
  } catch (err) {
    console.error("Error fetching only‐assigned leads:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getLRForCM = async (req, res) => {
  try {
    const officerName = req.user.name; 

    // Query: assignedTo.username must match, and leadStatus === "Assigned"
    const leads = await Lead.find({
      "assignedBy": officerName,
      leadStatus: "In Review"
    });

    return res.status(200).json(leads);
  } catch (err) {
    console.error("Error fetching lead returns for review:", err);
    return res.status(500).json({ message: "Something went wrong" });
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
    lead.leadStatus = "Accepted";
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
          "assignedTo.lRStatus": "Accepted",
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

// controller/leadController.js
const deleteLead = async (req, res) => {
  const { leadNo, leadName, caseNo, caseName } = req.params;

  try {
    // Guard: only Case Manager or Detective Supervisor
    const role = req.user?.role || "";
    const allowed = /^(case\s*manager|detective\s*supervisor)$/i.test(role);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only Case Managers or Detective Supervisors can delete a lead." });
    }

    // Build filter (adjust 'description' if your schema field differs)
    const filter = {
      leadNo: Number(leadNo),
      description: leadName,
      caseNo,
      caseName,
    };

    // Ensure it exists (optional but gives nicer 404)
    const existing = await Lead.findOne(filter);
    if (!existing) {
      return res.status(404).json({ message: "Lead not found." });
    }

    // Delete the lead (Lead-only)
    await Lead.deleteOne({ _id: existing._id });

    return res.status(200).json({ message: "Lead deleted successfully." });
  } catch (err) {
    console.error("Error deleting lead:", err);
    return res.status(500).json({ message: "Server error while deleting lead." });
  }
};


const setLeadStatusToInReview = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo, submittedDate } = req.body;

    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const lead = await Lead.findOne({
      leadNo,
      description,
      caseName,
      caseNo,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    lead.leadStatus = "In Review";
    lead.submittedDate  = submittedDate ? new Date(submittedDate) : new Date();
    await lead.save();

    console.log(`✅ [DEBUG] Lead ${leadNo} status set to 'In Review' for case ${caseName} (${caseNo})`);


    return res.status(200).json({ message: "Lead status set to 'In Review'.", lead });
  } catch (err) {
    console.error("Error updating lead status to 'In Review':", err.message);
    return res.status(500).json({ message: "Something went wrong while updating status." });
  }
};

const setLeadStatusToComplete = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo, approvedDate } = req.body;

    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const lead = await Lead.findOne({
      leadNo,
      description,
      caseName,
      caseNo,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    lead.leadStatus = "Completed";
    lead.approvedDate  = approvedDate ? new Date(approvedDate): new Date();
    await lead.save();

    console.log(`✅ [DEBUG] Lead ${leadNo} status set to 'Completed' for case ${caseName} (${caseNo})`);


    return res.status(200).json({ message: "Lead status set to 'Completed'.", lead });
  } catch (err) {
    console.error("Error updating lead status to 'Completed':", err.message);
    return res.status(500).json({ message: "Something went wrong while updating status." });
  }
};

const setLeadStatusToPending = async (req, res) => {
  try {
    const { leadNo, description, caseName, caseNo } = req.body;

    if (!leadNo || !description || !caseName || !caseNo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const lead = await Lead.findOne({
      leadNo,
      description,
      caseName,
      caseNo,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    lead.leadStatus = "Accepted";
    await lead.save();

    console.log(`✅ [DEBUG] Lead ${leadNo} status set to 'Completed' for case ${caseName} (${caseNo})`);


    return res.status(200).json({ message: "Lead status set to 'Completed'.", lead });
  } catch (err) {
    console.error("Error updating lead status to 'Completed':", err.message);
    return res.status(500).json({ message: "Something went wrong while updating status." });
  }
};

// const updateLead = async (req, res) => {
//   try {
//     const { leadNo, description, caseNo, caseName } = req.params;
//     const incoming = req.body;

//     const prev = await Lead.findOne({ leadNo: Number(leadNo), description, caseNo, caseName });
//     if (!prev) return res.status(404).json({ message: "Lead not found" });


//     const prevSet = new Set((prev.assignedTo || []).map(a => a.username));
//     const nextSet = new Set((incoming.assignedTo || []).map(a => a.username));
//     const added = [...nextSet].filter(u => !prevSet.has(u));
//     const removed = [...prevSet].filter(u => !nextSet.has(u));

//     const actor = req.user?.name || incoming.assignedBy || prev.assignedBy;
//     const eventsToPush = [];

//     added.forEach(u => eventsToPush.push({
//       type: "reassigned-added",
//       by: actor,
//       to: [u],
//       primaryInvestigator: (incoming.primaryInvestigator ?? prev.primaryInvestigator) || null,
//       statusAfter: incoming.leadStatus || prev.leadStatus || "Assigned",
//       at: new Date()
//     }));
//     removed.forEach(u => eventsToPush.push({
//       type: "reassigned-removed",
//       by: actor,
//       to: [u],
//       primaryInvestigator: (incoming.primaryInvestigator ?? prev.primaryInvestigator) || null,
//       statusAfter: incoming.leadStatus || prev.leadStatus || "Assigned",
//       at: new Date()
//     }));

//     const lead = await Lead.findOneAndUpdate(
//       { leadNo: Number(leadNo), description, caseNo, caseName },
//       {
//         $set: incoming,
//         ...(eventsToPush.length ? { $push: { events: { $each: eventsToPush } } } : {})
//       },
//       { new: true }
//     );

//     return res.status(200).json(lead);
//   } catch (err) {
//     console.error("Error updating lead:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const updateLead = async (req, res) => {
  try {
    const { leadNo, description, caseNo, caseName } = req.params;
    const incoming = req.body;

    const prev = await Lead.findOne({ leadNo: Number(leadNo), description, caseNo, caseName });
    if (!prev) return res.status(404).json({ message: "Lead not found" });

    // ✅ Do NOT allow client to overwrite events directly
    const { events: _ignoreEvents, ...incomingNoEvents } = incoming;

    // normalize assignedTo
    const normalizeAssignedTo = (arr) =>
      (Array.isArray(arr) ? arr : []).map(x =>
        typeof x === "string"
          ? { username: x, status: "pending" }
          : { username: x?.username, status: x?.status || "pending" }
      ).filter(a => a.username);

    const nextAssignedTo = normalizeAssignedTo(incomingNoEvents.assignedTo ?? prev.assignedTo);

    // diff for event log
    const prevSet = new Set((prev.assignedTo || []).map(a => a.username));
    const nextSet = new Set(nextAssignedTo.map(a => a.username));
    const added   = [...nextSet].filter(u => !prevSet.has(u));
    const removed = [...prevSet].filter(u => !nextSet.has(u));

    const actor = req.user?.name || incomingNoEvents.assignedBy || prev.assignedBy;

    const computeAggregateStatus = (assignedTo = []) => {
      const list = (assignedTo || []).map(a => a?.status || "pending");
      if (!list.length) return "Assigned";
      const allAccepted = list.every(s => s === "accepted");
      const allDeclined = list.every(s => s === "declined");
      if (allAccepted) return "Accepted";
      if (allDeclined) return "Rejected";
      if (list.includes("declined")) return "To Reassign";
      return "Assigned";
    };
    const statusAfter = computeAggregateStatus(nextAssignedTo);

    const eventsToPush = [
      ...added.map(u => ({
        type: "reassigned-added",
        by: actor,
        to: [u],
        primaryInvestigator: incomingNoEvents.primaryInvestigator ?? prev.primaryInvestigator ?? null,
        statusAfter,
        at: new Date()
      })),
      ...removed.map(u => ({
        type: "reassigned-removed",
        by: actor,
        to: [u],
        primaryInvestigator: incomingNoEvents.primaryInvestigator ?? prev.primaryInvestigator ?? null,
        statusAfter,
        at: new Date()
      }))
    ];

    // ensure PI is either in list or null
    const candidatePI = incomingNoEvents.primaryInvestigator ?? prev.primaryInvestigator ?? null;
    const nextPI = candidatePI && nextSet.has(candidatePI) ? candidatePI : null;

    // ✅ Build update doc WITHOUT touching `events` in $set
    const updateDoc = {
      $set: {
        ...incomingNoEvents,
        assignedTo: nextAssignedTo,
        leadStatus: incomingNoEvents.leadStatus || statusAfter,
        primaryInvestigator: nextPI
      }
    };
    if (eventsToPush.length) {
      updateDoc.$push = { events: { $each: eventsToPush } };
    }

    const lead = await Lead.findOneAndUpdate(
      { leadNo: Number(leadNo), description, caseNo, caseName },
      updateDoc,
      { new: true, runValidators: true }
    );

    return res.status(200).json(lead);
  } catch (err) {
    console.error("Error updating lead:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * PUT /api/lead/:leadNo/:description/:caseNo/:caseName/assignedTo
 * body: { officerUsername, status }
 */
// const updateAssignedToStatus = async (req, res) => {
//   try {
//     const { leadNo, description, caseNo, caseName } = req.params;
//     const { officerUsername, status } = req.body;

//     if (!officerUsername || !status) {
//       return res.status(400).json({ message: "Need officerUsername and status" });
//     }

//     // positional operator to update only the matching array element
//     const lead = await Lead.findOneAndUpdate(
//       {
//         leadNo: Number(leadNo),
//         description,
//         caseNo,
//         caseName,
//         'assignedTo.username': officerUsername
//       },
//       {
//         $set: { 'assignedTo.$.status': status }
//       },
//       { new: true }
//     );

//     if (!lead) {
//       return res.status(404).json({ message: "Lead or officer not found" });
//     }

//     res.status(200).json({ message: "Officer status updated", lead });
//   } catch (err) {
//     console.error("Error updating officer status:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// body: { officerUsername, status, reason? }
const updateAssignedToStatus = async (req, res) => {
  try {
    const { leadNo, description, caseNo, caseName } = req.params;
    const { officerUsername, status, reason } = req.body;

    if (!officerUsername || !status) {
      return res.status(400).json({ message: "Need officerUsername and status" });
    }

    // Update the one array element
    const lead = await Lead.findOneAndUpdate(
      {
        leadNo: Number(leadNo),
        description,
        caseNo,
        caseName,
        'assignedTo.username': officerUsername
      },
      { $set: { 'assignedTo.$.status': status } },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead or officer not found" });

    // Recompute aggregate status
    const statusAfter = computeAggregateStatus(lead.assignedTo);

    // Append event + update leadStatus
    lead.events.push({
      type: status === "accepted" ? "accepted" : "declined",
      by: req.user?.name || officerUsername,
      to: [officerUsername],
      reason: status === "declined" ? (reason || "") : undefined,
      primaryInvestigator: lead.primaryInvestigator || null,
      statusAfter,
      at: new Date()
    });
    lead.leadStatus = statusAfter;
    await lead.save();

    return res.status(200).json({ message: "Officer status updated", lead });
  } catch (err) {
    console.error("Error updating officer status:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// const removeAssignedOfficer = async (req, res) => {
//   try {
//     const { leadNo, description, caseNo, caseName, username } = req.params;

//     // Find & pull the matching username out of assignedTo
//     const lead = await Lead.findOneAndUpdate(
//       {
//         leadNo: Number(leadNo),
//         description,
//         caseNo,
//         caseName
//       },
//       {
//         $pull: { assignedTo: { username } }
//       },
//       { new: true }  // return the updated document
//     );

//     if (!lead) {
//       return res.status(404).json({ message: "Lead not found" });
//     }

//     res.status(200).json({
//       message: `Officer '${username}' removed from assignedTo`,
//       lead
//     });
//   } catch (err) {
//     console.error("Error removing assigned officer:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const removeAssignedOfficer = async (req, res) => {
  try {
    const { leadNo, description, caseNo, caseName, username } = req.params;

    const lead = await Lead.findOneAndUpdate(
      { leadNo: Number(leadNo), description, caseNo, caseName },
      { $pull: { assignedTo: { username } } },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // Recompute aggregate status after removal
    const statusAfter = computeAggregateStatus(lead.assignedTo);

    lead.events.push({
      type: "reassigned-removed",
      by: req.user?.name || lead.assignedBy,
      to: [username],
      primaryInvestigator: lead.primaryInvestigator || null,
      statusAfter,
      at: new Date()
    });
    lead.leadStatus = statusAfter;
    await lead.save();

    res.status(200).json({
      message: `Officer '${username}' removed from assignedTo`,
      lead
    });
  } catch (err) {
    console.error("Error removing assigned officer:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET /api/lead/status/:leadNo/:leadName/:caseNo/:caseName
 * Returns only the leadStatus string for the matching Lead document.
 */
const getLeadStatus = async (req, res) => {
  try {
    const { leadNo, leadName, caseNo, caseName } = req.params;

    // find the single lead document
    const lead = await Lead.findOne({
      leadNo:   Number(leadNo),
      description: leadName,
      caseNo,
      caseName
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // return only the status
    res.status(200).json({ leadStatus: lead.leadStatus });
  } catch (err) {
    console.error("Error fetching lead status:", err);
    res.status(500).json({ message: "Server error while fetching lead status" });
  }
};

// at the bottom of controllers/lead.controller.js
/**
 * PUT /api/lead/status/close
 * body: { leadNo, description, caseNo, caseName, reason }
 */
const setLeadStatusToClosed = async (req, res) => {
  try {
    const { leadNo, description, caseNo, caseName, reason } = req.body;
    if (!leadNo || !description || !caseNo || !caseName || !reason) {
      return res.status(400).json({ message: "All fields (including reason) are required." });
    }

    const lead = await Lead.findOne({
      leadNo: Number(leadNo),
      description,
      caseNo,
      caseName
    });
    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    // update status, completedDate, and store the reason
    lead.leadStatus     = "Closed";
    lead.completedDate  = new Date();
    lead.comment        = reason;           // or a new `closeReason` field
    await lead.save();

    return res.status(200).json({ message: "Lead closed successfully.", lead });
  } catch (err) {
    console.error("Error closing lead:", err);
    return res.status(500).json({ message: "Server error while closing lead." });
  }
};



module.exports = { createLead, getLeadsByOfficer, getLeadsByCase, getLeadsForAssignedToOfficer, getLeadsByLeadNoandLeadName , getLeadsforHierarchy, updateLeadStatus, getAssociatedSubNumbers, updateLRStatusToPending, searchLeadsByKeyword , setLeadStatusToInReview, 
  setLeadStatusToComplete, setLeadStatusToPending, updateLead, updateAssignedToStatus, removeAssignedOfficer, getAssignedLeadsForOfficer, getLRForCM, getLeadStatus, setLeadStatusToClosed,  deleteLead,
};






