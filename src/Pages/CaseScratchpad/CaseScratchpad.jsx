import React, { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import "./CaseScratchpad.css";

export const CaseScratchpad = () => {
  const [entries, setEntries] = useState([
    { id: 1, date: "2024-12-01", notes: "Initial details of the case." },
    { id: 2, date: "2024-12-02", notes: "Follow-up notes." },
  ]);

  const [newEntry, setNewEntry] = useState({
    date: "",
    notes: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleInputChange = (field, value) => {
    setNewEntry({ ...newEntry, [field]: value });
  };

  const handleAddOrUpdateEntry = () => {
    if (!newEntry.date || !newEntry.notes) {
      alert("Please fill in all fields!");
      return;
    }

    if (editMode) {
      setEntries(
        entries.map((entry) =>
          entry.id === editId ? { ...entry, ...newEntry } : entry
        )
      );
      setEditMode(false);
      setEditId(null);
    } else {
      const entry = {
        id: entries.length + 1,
        ...newEntry,
      };
      setEntries([...entries, entry]);
    }

    setNewEntry({ date: "", notes: "" });
  };

  const handleDeleteEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  };

  const handleEditEntry = (entry) => {
    setNewEntry({ date: entry.date, notes: entry.notes });
    setEditMode(true);
    setEditId(entry.id);
  };

  return (
    <div className="scratchpad-container">
      <Navbar />
      <main className="scratchpad-main">
        <h1 className="scratchpad-title">ALL SCRATCHPAD ENTRIES</h1>

        {/* List of Entries */}
        <div className="entries-list">
          {entries.map((entry) => (
            <div key={entry.id} className="entry-item">
              <span className="entry-text">
                <strong>Date Entered:</strong> {entry.date} | <strong>Notes:</strong>{" "}
                {entry.notes}
              </span>
              <div className="entry-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEditEntry(entry)}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteEntry(entry.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form to Add or Edit Entry */}
        <div className="scratchpad-content">
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">Entered Date:</label>
              <input
                className="input-field"
                type="date"
                value={newEntry.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
              <label className="input-label">Notes:</label>
              <textarea
                className="textarea-field"
                placeholder="Enter your notes here..."
                value={newEntry.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="button-group">
            <button className="btn btn-save" onClick={handleAddOrUpdateEntry}>
              {editMode ? "Update" : "Save"}
            </button>
            <button
              className="btn btn-cancel"
              onClick={() => setNewEntry({ date: "", notes: "" })}
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
