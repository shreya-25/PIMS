import React, { useState } from "react";
import styles from "./GenerateReport.module.css";

export default function CollapsibleSection({ title, defaultOpen = true, rightSlot = null, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={styles.collapsible}>
      <header
        className={styles["collapsible__header"]}
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setOpen((o) => !o) : null)}
      >
        <div className={styles["collapsible__title"]}>
          <span className={styles.chev}>{open ? "▾" : "▸"}</span> {title}
        </div>
        {rightSlot ? <div onClick={(e) => e.stopPropagation()}>{rightSlot}</div> : null}
      </header>
      {open && <div className={styles["collapsible__body"]}>{children}</div>}
    </section>
  );
}
