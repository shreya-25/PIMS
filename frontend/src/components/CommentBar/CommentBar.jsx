// components/CommentBar/CommentBar.jsx
import React, {
  useState, useEffect, useContext, useRef, useCallback, forwardRef, useImperativeHandle
} from "react";
import api from "../../api";
import { CaseContext } from "../../Pages/CaseContext";
import "./CommentBar.css";

/**
 * Props:
 * - caseNo, caseName, leadNo, leadName (preferred). If omitted, falls back to CaseContext.
 * - tag: string to group comments, e.g. "ViewLR" or "DocumentReview"
 * - autoFocus: boolean
 */
const CommentBar = forwardRef(function CommentBar(
  {
    caseNo: pCaseNo,
    caseName: pCaseName,
    leadNo: pLeadNo,
    leadName: pLeadName,
    tag = "ViewLR",
    autoFocus = true,
  },
  ref
) {
  const { selectedCase, selectedLead } = useContext(CaseContext) || {};

  // ---- Resolve exact scope (prefer explicit props) ----
  const caseNo   = pCaseNo   ?? selectedCase?.caseNo;
  const caseName = pCaseName ?? selectedCase?.caseName;
  const leadNo   = pLeadNo   ?? selectedLead?.leadNo;
  const leadName = pLeadName ?? selectedLead?.leadName;

  const ready = Boolean(caseNo && caseName && leadNo && leadName && tag);

  const [comments, setComments]   = useState([]);  // server rows
  const [draft, setDraft]         = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const inputRef = useRef(null);
  const token    = localStorage.getItem("token");
  const enteredBy = localStorage.getItem("loggedInUser") || "Unknown";

  const sendIcon = `${process.env.PUBLIC_URL}/Materials/send.png`;

  // ---- Fetch (strictly scoped to case+lead+tag) ----
  const fetchComments = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/comment", {
        params: { caseNo, caseName, leadNo, leadName, tag },
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data.slice() : [];
      list.sort((a, b) => new Date(b.enteredDate) - new Date(a.enteredDate));
      setComments(list);
    } catch (e) {
      console.error("Comment load failed:", e);
      setError("Failed to load comments.");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [ready, caseNo, caseName, leadNo, leadName, tag, token]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 0);
  }, [autoFocus]);

  useImperativeHandle(ref, () => ({
    reload: fetchComments,
    focusComposer: () => inputRef.current?.focus(),
    setDraft: (t) => setDraft(t ?? ""),
  }), [fetchComments]);

  // ---- Save (create/update) with strict scope ----
  const saveDraft = async () => {
    const text = draft.trim();
    if (!text || !ready) return;

    try {
      if (editingId) {
        const res = await api.put(
          `/api/comment/${editingId}`,
          { comment: text },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComments(prev => prev.map(c => (c._id === editingId ? res.data : c)));
        setEditingId(null);
        setDraft("");
      } else {
        const body = {
          caseNo,
          caseName,
          leadNo,
          description: leadName,   // backend expects description = leadName in your API
          tag,
          enteredBy,
          enteredDate: new Date(),
          comment: text,
        };
        const res = await api.post("/api/comment", body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComments(prev => [res.data, ...prev]);
        setDraft("");
      }
    } catch (e) {
      console.error("Comment save failed:", e);
      setError("Failed to save comment.");
    }
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setDraft(row.comment || "");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelDraft = () => {
    setEditingId(null);
    setDraft("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveDraft();
    }
  };

  return (
    <aside className="cbar">
      <header className="cbar__header">
        <div className="cbar__title">Comments</div>
      </header>

      {!ready && (
        <div className="cbar__hint" style={{ marginBottom: 8 }}>
          Select a case &amp; lead to comment.
        </div>
      )}

      {loading && <div className="cbar__loading">Loading comments…</div>}
      {error && <div className="cbar__error">{error}</div>}

      <ul className="cbar__list">
        {comments.map((c) => (
          <li key={c._id} className="cbar__item">
            <div className="cbar__avatar">
              <span>{(c.enteredBy || "A").charAt(0)} </span>

              </div>
            <div className="cbar__bubble">
              <div className="cbar__meta">
                <strong>{c.enteredBy || "Anonymous"}</strong>
                <span className="cbar__dot">•</span>
                <time dateTime={c.enteredDate}>
                  {new Date(c.enteredDate).toLocaleString()}
                </time>
                {c.enteredBy === enteredBy && (
                  <button className="cbar__edit" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                )}
              </div>

              {editingId === c._id ? (
                <div className="cbar__text cbar__text--editing">(Editing…)</div>
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

          <div className="cbar__composer">
        <div className="cbar__inputWrap">
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
          <button
            type="button"
            className="cbar__sendBtn"
            onClick={saveDraft}
            disabled={!draft.trim() || !ready}
            title="Send (Ctrl+Enter)"
          >
            {/* simple send icon (can swap with svg) */}
            {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              className="cbar__sendIcon"
              viewBox="0 0 24 24"
            >
              <path d="M3 4.27v15.46l18-7.73L3 4.27zm2.4 3.62 9.72 3.38-9.72 3.38v-2.66l4.38-.72-4.38-.72V7.89z" />
            </svg> */}
            <img src={sendIcon} alt="send" className="cbar__sendIcon" />
          </button>
        </div>
        {/* <div className="cbar__hint">Tip: Press Ctrl+Enter to post.</div> */}
      </div>

    </aside>
  );
});

export default CommentBar;
