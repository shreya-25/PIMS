// comment.controller.js

const Comment = require("../models/Comment"); // Ensure the model path is correct

// Create a new comment entry
const createComment = async (req, res) => {
  try {
    // Destructure the necessary fields from the request body.
    // Fields: leadNo, description, assignedTo, assignedBy, enteredBy,
    // caseName, caseNo, enteredDate, tag, and comment.
    const {
      leadNo,
      description,
      assignedTo,  // expected structure: { assignees: [...], lRStatus: "Assigned" }
      assignedBy,  // expected structure: { assignee: "name", lRStatus: "Assigned" }
      enteredBy,
      caseName,
      caseNo,
      enteredDate,
      tag,
      comment: commentText // renamed to avoid conflict with the model variable name if needed
    } = req.body;

    // Create new comment instance
    const newComment = new Comment({
      leadNo,
      description,
      assignedTo,
      assignedBy,
      enteredBy,
      caseName,
      caseNo,
      enteredDate,
      tag,
      comment: commentText
    });

    await newComment.save();
    return res.status(201).json(newComment);
  } catch (err) {
    console.error("Error creating comment:", err.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Fetch comments using query parameters
// Expected query parameters:
// - caseNo: exact number match
// - caseName: full name match, case-insensitive
// - leadNo: exact number match
// - leadName: to search within the 'description' (or adjust as needed)
// - tag: full tag match, case-insensitive
const getComments = async (req, res) => {
  try {
    // Extract filter parameters from req.query
    const { caseNo, caseName, leadNo, leadName, tag } = req.query;
    
    // Build query dynamically based on provided filters
    let query = {};
    
    if (caseNo) {
      query.caseNo = caseNo;
    }
    
    if (caseName) {
      // Use a regular expression for a case-insensitive full match
      query.caseName = new RegExp(`^${caseName}$`, "i");
    }
    
    if (leadNo) {
      query.leadNo = leadNo;
    }
    
    if (leadName) {
      // Assuming the "leadName" is stored within the description field.
      // Adjust as needed if you have a separate field.
      query.description = { $regex: leadName, $options: "i" };
    }
    
    if (tag) {
      query.tag = new RegExp(`^${tag}$`, "i");
    }
    
    const comments = await Comment.find(query);
    return res.status(200).json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { createComment, getComments };
