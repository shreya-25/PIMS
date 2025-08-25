import React, {
  useState,
  useEffect,
  useContext,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import { CaseContext } from "../../Pages/CaseContext";
import "./CommentBar.css";
import api from "../../api";

const CommentBar = forwardRef(
  ({ tag, autoFocus = true }, ref) => {
    const { selectedCase, selectedLead } = useContext(CaseContext) || {};
    const [comments, setComments] = useState([]);   // server shape
    const [draft, setDraft] = useState("");
    const [editingId, setEditingId] = useState(null); // _id when editing
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const enteredBy = localStorage.getItem("loggedInUser") || "Unknown";
    const token = localStorage.getItem("token");

    const ready =
      selectedCase?.caseNo &&
      selectedCase?.caseName &&
      selectedLead?.leadNo &&
      selectedLead?.leadName &&
      tag;

    // ---- Fetch comments (same API as your old component) ----
    const fetchComments = useCallback(async () => {
      if (!ready) return;
      setLoading(true);
      setError(null);
      try {
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
        // Sort newest first, just like before
        const list = Array.isArray(res.data) ? res.data.slice() : [];
        list.sort((a, b) => new Date(b.enteredDate) - new Date(a.enteredDate));
        setComments(list);
      } catch (e) {
        console.error("Error loading comments:", e);
        setError("Failed to load comments");
      } finally {
        setLoading(false);
      }
    }, [ready, selectedCase, selectedLead, tag, token]);

    useEffect(() => {
      fetchComments();
    }, [fetchComments]);

    useEffect(() => {
      if (autoFocus) setTimeout(() => inputRef.current?.focus(), 0);
    }, [autoFocus]);

    useImperativeHandle(
      ref,
      () => ({
        focusComposer: () => inputRef.current?.focus(),
        setDraft: (t) => setDraft(t ?? ""),
        reload: fetchComments,
      }),
      [fetchComments]
    );

    // ---- Save (create/update) using SAME endpoints ----
    const saveDraft = async () => {
      const text = draft.trim();
      if (!text || !ready) return;

      try {
        if (editingId) {
          // UPDATE
          const res = await api.put(
            `/api/comment/${editingId}`,
            { comment: text },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Replace item in list
          setComments((prev) =>
            prev.map((c) => (c._id === editingId ? res.data : c))
          );
          setEditingId(null);
          setDraft("");
        } else {
          // CREATE
          const body = {
            caseNo: selectedCase.caseNo,
            caseName: selectedCase.caseName,
            leadNo: selectedLead.leadNo,
            description: selectedLead.leadName, // matches your POST body
            tag,
            enteredBy,
            enteredDate: new Date(),
            comment: text,
          };

          const res = await api.post("/api/comment", body, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Prepend new comment from server
          setComments((c) => [res.data, ...c]);
          setDraft("");
        }
      } catch (e) {
        console.error("Error saving comment:", e);
        setError("Failed to save comment");
      }
    };

    const startEdit = (c) => {
      setEditingId(c._id);
      setDraft(c.comment || "");
      setTimeout(() => inputRef.current?.focus(), 0);
    };

    const cancelDraft = () => {
      setDraft("");
      setEditingId(null);
    };

    const onKeyDown = (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveDraft();
      }
    };

    return (
      <aside className="cbar">
        <header className="cbar__header">
          <div className="cbar__title">Comments</div>
              <div className="cbar__actions">
              <button
                className="cbar__btn cbar__btn--primary"
                onClick={saveDraft}
                disabled={!draft.trim() || !ready}
                title="Save (Ctrl+Enter)"
              >
                Save
              </button>
              <button className="cbar__btn" disabled={!draft.trim() || !ready} onClick={cancelDraft}>
                Cancel
              </button>
            </div>
        </header>

        {/* Composer (big textbox + Save/Cancel to the right) */}
        <div className="cbar__composer">
          <div className="cbar__row">
            <textarea
              ref={inputRef}
              className="cbar__textarea"
              placeholder="Write a comment…"
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={!ready}
            />
          </div>
          <div className="cbar__hint">
            Tip: Press Ctrl+Enter to post.
            {!ready && (
              <span style={{ marginLeft: 8, color: "#b45309" }}>
                Select case & lead to comment.
              </span>
            )}
          </div>
        </div>

        {loading && <div className="cbar__loading">Loading comments…</div>}
        {error && <div className="cbar__error">{error}</div>}

        {/* List */}
        <ul className="cbar__list">
          {comments
            .filter((c) => c.tag === tag) // safety—API already filters
            .map((c) => (
              <li key={c._id} className="cbar__item">
                <div className="cbar__avatar">
                  {(c.enteredBy || "A").charAt(0)}
                </div>
                <div className="cbar__bubble">
                  <div className="cbar__meta">
                    <strong>{c.enteredBy || "Anonymous"}</strong>
                    <span className="cbar__dot">•</span>
                    <time dateTime={c.enteredDate}>
                      {new Date(c.enteredDate).toLocaleString()}
                    </time>
                    {c.enteredBy === enteredBy && (
                      <button
                        className="cbar__edit"
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {/* If editing this row, show live draft text so buttons remain at top */}
                  {editingId === c._id ? (
                    <div className="cbar__text cbar__text--editing">
                      (Editing…)
                    </div>
                  ) : (
                    <div className="cbar__text">{c.comment}</div>
                  )}
                </div>
              </li>
            ))}

          {comments.length === 0 && !loading && (
            <li className="cbar__empty">No comments yet.</li>
          )}
        </ul>
      </aside>
    );
  }
);

export default CommentBar;
