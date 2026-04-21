import React, { useState, useEffect, useRef } from "react";
import styles from "./GenerateReport.module.css";

export default function FlagPicker({
  flags = [],
  selected = [],
  onChange,
  multiple = true,
  placeholder = "Choose flag(s)",
  disabled = false,
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const btnRef   = useRef(null);
  const panelRef = useRef(null);

  const filtered   = flags.filter((f) => f.toLowerCase().includes(query.toLowerCase()));
  const isSelected = (f) => selected.includes(f);

  const toggle = (f) => {
    if (!multiple) { onChange([f]); setOpen(false); return; }
    const set = new Set(selected);
    set.has(f) ? set.delete(f) : set.add(f);
    onChange([...set]);
  };
  const selectAll = () => onChange(filtered.length ? Array.from(new Set([...selected, ...filtered])) : selected);
  const clearAll  = () => onChange([]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onEsc = (e) => (e.key === "Escape" ? setOpen(false) : null);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown",   onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown",   onEsc);
    };
  }, [open]);

  return (
    <div className={styles["fp-root"]}>
      <button
        type="button"
        ref={btnRef}
        className={`${styles["fp-btn"]} ${disabled ? styles["fp-btn--disabled"] : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        title={selected.length ? selected.join(", ") : placeholder}
      >
        <div className={styles["fp-btn-content"]}>
          {selected.length === 0 && <span className={styles["fp-placeholder"]}>{placeholder}</span>}
          {selected.length > 0 && (
            <div className={styles["fp-chips"]}>
              {selected.slice(0, 3).map((f) => (
                <span key={f} className={styles["fp-chip"]} onClick={(e) => e.stopPropagation()}>{f}</span>
              ))}
              {selected.length > 3 && (
                <span className={`${styles["fp-chip"]} ${styles["fp-chip--more"]}`}>+{selected.length - 3}</span>
              )}
            </div>
          )}
          <span className={styles["fp-caret"]} aria-hidden>▾</span>
        </div>
      </button>

      {open && (
        <div className={styles["fp-panel"]} ref={panelRef} role="listbox" aria-multiselectable={multiple}>
          <div className={styles["fp-toprow"]}>
            <input
              className={styles["fp-search"]}
              placeholder="Search flags…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div className={styles["fp-actions"]}>
              {multiple && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles["btn-secondary"]} ${styles["fp-small"]}`}
                  onClick={selectAll}
                  disabled={!filtered.length}
                >
                  Select all
                </button>
              )}
              <button
                type="button"
                className={`${styles.btn} ${styles["btn-secondary"]} ${styles["fp-small"]}`}
                onClick={clearAll}
                disabled={!selected.length}
              >
                Clear
              </button>
            </div>
          </div>

          <div className={styles["fp-list"]} tabIndex={-1}>
            {filtered.length ? filtered.map((f) => (
              <label key={f} className={styles["fp-item"]}>
                {multiple
                  ? <input type="checkbox" checked={isSelected(f)} onChange={() => toggle(f)} />
                  : <input type="radio" name="flagpicker-radio" checked={isSelected(f)} onChange={() => toggle(f)} />
                }
                <span className={styles["fp-item-text"]}>{f}</span>
              </label>
            )) : (
              <div className={styles["fp-empty"]}>No flags found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
