// comment.controller.js

const Comment = require("../models/Comment");
const mongoose = require("mongoose");

// Create a new comment entry
const createComment = async (req, res) => {
  try {
    const {
      leadNo,
      description,
      assignedTo,
      assignedBy,
      enteredBy,
      enteredByUserId,
      caseId,
      enteredDate,
      tag,
      comment: commentText
    } = req.body;

    // Resolve enteredByUserId from JWT token (most reliable), then request body, then username lookup
    const resolvedEnteredByUserId =
      req.user?.userId ||
      enteredByUserId ||
      null;

    const newComment = new Comment({
      leadNo,
      description,
      assignedTo,
      assignedBy,
      enteredBy,
      enteredByUserId: resolvedEnteredByUserId,
      caseId: caseId || null,
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
const getComments = async (req, res) => {
  try {
    const { caseId, leadNo, leadName, tag } = req.query;

    let query = {};

    if (caseId && mongoose.isValidObjectId(caseId)) {
      query.caseId = caseId;
    }

    if (leadNo) {
      query.leadNo = leadNo;
    }

    if (leadName) {
      query.description = { $regex: leadName, $options: "i" };
    }

    if (tag) {
      query.tag = new RegExp(`^${tag}$`, "i");
    }

    const comments = await Comment.find(query).notDeleted().lean();
    return res.status(200).json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { comment } = req.body;

    const updated = await Comment.findByIdAndUpdate(
      commentId,
      { comment, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Comment not found" });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating comment:", err.message);
    return res.status(500).json({ message: "Failed to update comment" });
  }
};


module.exports = { createComment, getComments, updateComment };
