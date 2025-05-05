// import React, { useState } from "react";
// import "./Comment.css";

// const Comment = () => {
//   const [comment, setComment] = useState("");
//   const [comments, setComments] = useState([
//     // {
//     //   id: 1,
//     //   author: "Officer 916",
//     //   timestamp: "03/12/25 10:08 PM",
//     //   text: "Please add the interview details of the bank officer",
//     // },
//   ]);
//   const [editingId, setEditingId] = useState(null);
//   const [editedComment, setEditedComment] = useState("");

//   // Load logged-in user from localStorage
//   const signedInOfficer = localStorage.getItem("loggedInUser") || "Unknown Officer";

//   const addComment = () => {
//     if (!comment.trim()) return;

//     const newComment = {
//       id: comments.length + 1,
//       author: signedInOfficer,
//       timestamp: new Date().toLocaleString(),
//       text: comment,
//     };

//     setComments([...comments, newComment]);
//     setComment("");
//   };

//   const startEditing = (id, text) => {
//     setEditingId(id);
//     setEditedComment(text);
//   };

//   const saveEdit = (id) => {
//     setComments(
//       comments.map((c) => (c.id === id ? { ...c, text: editedComment } : c))
//     );
//     setEditingId(null);
//   };

//   const cancelEdit = () => {
//     setEditingId(null);
//     setEditedComment("");
//   };

//   return (
//     <div className="comment-section">
//       <h3>Activity</h3>
//       <div className="tabs">
//         <span className="active-tab">Comments</span>
//         <span>Work Log</span>
//         <span>History</span>
//       </div>
//       <div className="comments">
//         {comments.map((c) => (
//           <div key={c.id} className="comment-bar">
//             <div className="comment-header">
//               <p>
//                 <strong>{c.author}</strong> added a comment - {c.timestamp}
//               </p>
//               {/* Show edit icon only if the user matches the comment author */}
//               {c.author === signedInOfficer && (
//                 <img
//                   src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
//                   alt="Edit Icon"
//                   className="edit-icon"
//                   onClick={() => startEditing(c.id, c.text)}
//                 />
//               )}
//             </div>
//             {editingId === c.id ? (
//               <textarea
//                 value={editedComment}
//                 onChange={(e) => setEditedComment(e.target.value)}
//               />
//             ) : (
//               <p>{c.text}</p>
//             )}

//             {editingId === c.id && (
//               <div className="edit-options">
//                 <button className="customer-btn" onClick={() => saveEdit(c.id)}>
//                   Save
//                 </button>
//                 <button className="customer-btn" onClick={cancelEdit}>
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//       <div className="comment-input">
//         <textarea
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           placeholder="Add a comment"
//         />
//         <div className="buttons">
//           <button className="customer-btn" onClick={addComment}>
//             Add Comment
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Comment;

// src/components/Comment/Comment.jsx
// import React, { useState, useEffect, useContext } from "react";
// import axios from "axios";
// import { CaseContext } from "../../Pages/CaseContext";    // adjust path as needed
// import "./Comment.css";

// export default function Comment({ tag }) {
//   const { selectedCase, selectedLead } = useContext(CaseContext);
//   const [commentText, setCommentText] = useState("");
//   const [comments, setComments] = useState([]);
//   const enteredBy = localStorage.getItem("loggedInUser") || "Unknown";

//   // Fetch existing comments for this case/lead/tag
//   useEffect(() => {
//     if (
//       !selectedCase?.caseNo ||
//       !selectedCase?.caseName ||
//       !selectedLead?.leadNo ||
//       !selectedLead?.leadName
//     ) return;

//     const fetchComments = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await axios.get("http://localhost:5000/api/comment", {
//           params: {
//             caseNo: selectedCase.caseNo,
//             caseName: selectedCase.caseName,
//             leadNo: selectedLead.leadNo,
//             leadName: selectedLead.leadName,
//             tag,
//           },
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setComments(res.data);
//       } catch (err) {
//         console.error("Error loading comments:", err);
//       }
//     };

//     fetchComments();
//   }, [selectedCase, selectedLead, tag]);

//   // Post a new comment
//   const addComment = async () => {
//     if (!commentText.trim()) return;
//     try {
//       const token = localStorage.getItem("token");
//       const body = {
//         caseNo: selectedCase.caseNo,
//         caseName: selectedCase.caseName,
//         leadNo: selectedLead.leadNo,
//         description: selectedLead.leadName,
//         tag,
//         enteredBy,
//         enteredDate: new Date(),
//         comment: commentText,
//       };
//       const res = await axios.post(
//         "http://localhost:5000/api/comment",
//         body,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       // Prepend the new comment
//       setComments((c) => [res.data, ...c]);
//       setCommentText("");
//     } catch (err) {
//       console.error("Error posting comment:", err);
//       alert("Failed to post comment");
//     }
//   };

//   return (
//     <div className="comment-section">
//       <h3>Activity</h3>
//       <div className="tabs">
//         <span className="active-tab">Comments</span>
//         <span>Work Log</span>
//         <span>History</span>
//       </div>

//       <div className="comments">
//       {comments.filter(c => c.tag === tag)            // ← only comments with the right tag
//       .map(c => (
//           <div key={c._id} className="comment-bar">
//             <div className="comment-header">
//               <p>
//                 <strong>{c.enteredBy}</strong> –{" "}
//                 {new Date(c.enteredDate).toLocaleString()}
//               </p>
//             </div>
//             <p>{c.comment}</p>
//           </div>
//         ))}
        
//       </div>

//       <div className="comment-input">
//         <textarea
//           value={commentText}
//           onChange={(e) => setCommentText(e.target.value)}
//           placeholder="Add a comment"
//         />
//         <button className="customer-btn" onClick={addComment}>
//           Add Comment
//         </button>
//       </div>
//     </div>
//   );
// }

// src/components/Comment/Comment.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import api from "../../api"
import { CaseContext } from "../../Pages/CaseContext";
import "./Comment.css";

export default function Comment({ tag }) {
  const { selectedCase, selectedLead } = useContext(CaseContext);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const enteredBy = localStorage.getItem("loggedInUser") || "Unknown";

  // --- Edit state ---
  const [editingId, setEditingId] = useState(null);
  const [editedComment, setEditedComment] = useState("");

  // Fetch comments
  useEffect(() => {
    if (
      !selectedCase?.caseNo ||
      !selectedCase?.caseName ||
      !selectedLead?.leadNo ||
      !selectedLead?.leadName
    )
      return;

    const fetchComments = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/api/comment", {
          params: {
            caseNo: selectedCase.caseNo,
            caseName: selectedCase.caseName,
            leadNo: selectedLead.leadNo,
            leadName: selectedLead.leadName,
            tag,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        setComments(res.data);
      } catch (err) {
        console.error("Error loading comments:", err);
      }
    };

    fetchComments();
  }, [selectedCase, selectedLead, tag]);

  // Add new comment
  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const body = {
        caseNo: selectedCase.caseNo,
        caseName: selectedCase.caseName,
        leadNo: selectedLead.leadNo,
        description: selectedLead.leadName,
        tag,
        enteredBy,
        enteredDate: new Date(),
        comment: commentText,
      };
      const res = await api.post("/api/comment", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((c) => [res.data, ...c]);
      setCommentText("");
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Failed to post comment");
    }
  };

  const startEditing = (id, currentText) => {
    setEditingId(id);
    setEditedComment(currentText);
  };

  const saveEdit = async (id) => {
    if (!editedComment.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(
        `/api/comment/${id}`,
        { comment: editedComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) =>
        prev.map((c) => (c._id === id ? res.data : c))
      );
      cancelEdit();
    } catch (err) {
      console.error("Error updating comment:", err);
      alert("Failed to update comment");
    }
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
        {comments
          .filter((c) => c.tag === tag)
          .map((c) => (
            <div key={c._id} className="comment-bar">
              <div className="comment-header">
                <p>
                  <strong>{c.enteredBy}</strong> –{" "}
                  {new Date(c.enteredDate).toLocaleString()}
                </p>
                {/* show edit icon only on your own comments */}
                {c.enteredBy === enteredBy && editingId !== c._id && (
                  <img
                    src={`${process.env.PUBLIC_URL}/Materials/edit.png`}
                    alt="Edit"
                    className="edit-icon"
                    onClick={() => startEditing(c._id, c.comment)}
                  />
                )}
              </div>

              {/* if this comment is being edited, show textarea */}
              {editingId === c._id ? (
                <textarea
                  value={editedComment}
                  onChange={(e) => setEditedComment(e.target.value)}
                />
              ) : (
                <p>{c.comment}</p>
              )}

              {/* Save / Cancel buttons */}
              {editingId === c._id && (
                <div className="edit-options">
                  <button
                    className="customer-btn"
                    onClick={() => saveEdit(c._id)}
                  >
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
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment"
        />
        <button className="customer-btn" onClick={addComment}>
          Add Comment
        </button>
      </div>
    </div>
  );
}

