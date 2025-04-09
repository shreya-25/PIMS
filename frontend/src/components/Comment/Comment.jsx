import React, { useState } from "react";
import "./Comment.css";

const Comment = () => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    // {
    //   id: 1,
    //   author: "Officer 916",
    //   timestamp: "03/12/25 10:08 PM",
    //   text: "Please add the interview details of the bank officer",
    // },
  ]);
  const [editingId, setEditingId] = useState(null);
  const [editedComment, setEditedComment] = useState("");

  // Load logged-in user from localStorage
  const signedInOfficer = localStorage.getItem("loggedInUser") || "Unknown Officer";

  const addComment = () => {
    if (!comment.trim()) return;

    const newComment = {
      id: comments.length + 1,
      author: signedInOfficer,
      timestamp: new Date().toLocaleString(),
      text: comment,
    };

    setComments([...comments, newComment]);
    setComment("");
  };

  const startEditing = (id, text) => {
    setEditingId(id);
    setEditedComment(text);
  };

  const saveEdit = (id) => {
    setComments(
      comments.map((c) => (c.id === id ? { ...c, text: editedComment } : c))
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedComment("");
  };

  return (
    <div className="comment-section">
      <h3>Activity</h3>
      <div className="tabs">
        <span className="active-tab">Comments</span>
        <span>Work Log</span>
        <span>History</span>
      </div>
      <div className="comments">
        {comments.map((c) => (
          <div key={c.id} className="comment-bar">
            <div className="comment-header">
              <p>
                <strong>{c.author}</strong> added a comment - {c.timestamp}
              </p>
              {/* Show edit icon only if the user matches the comment author */}
              {c.author === signedInOfficer && (
                <img
                  src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                  alt="Edit Icon"
                  className="edit-icon"
                  onClick={() => startEditing(c.id, c.text)}
                />
              )}
            </div>
            {editingId === c.id ? (
              <textarea
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
              />
            ) : (
              <p>{c.text}</p>
            )}

            {editingId === c.id && (
              <div className="edit-options">
                <button className="customer-btn" onClick={() => saveEdit(c.id)}>
                  Save
                </button>
                <button className="customer-btn" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="comment-input">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment"
        />
        <div className="buttons">
          <button className="customer-btn" onClick={addComment}>
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comment;
