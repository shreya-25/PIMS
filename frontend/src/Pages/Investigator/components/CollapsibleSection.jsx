import React from 'react';
import styles from '../Investigator.module.css';

/**
 * A section card with a clickable header that toggles body visibility.
 *
 * @param {string}    title    - Header text.
 * @param {boolean}   isOpen   - Whether the body is currently visible.
 * @param {Function}  onToggle - Called when the header is clicked.
 * @param {ReactNode} children - Body content shown when isOpen is true.
 */
export function CollapsibleSection({ title, isOpen, onToggle, children }) {
  return (
    <section className={styles['collapsible-section']}>
      <button
        type="button"
        className={styles['collapse-header']}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles['collapse-title']}>{title}</span>
        <img
          src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
          className={styles['icon-image']}
          alt=""
        />
      </button>

      {isOpen && children}
    </section>
  );
}
