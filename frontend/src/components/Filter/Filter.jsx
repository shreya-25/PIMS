// // src/components/FilterSortPopup/FilterSortPopup.jsx
// import React, { useState, useMemo } from 'react';
// import './Filter.css'; // your .filter-popupHome, .fp-list, etc

// export default function Filter({
//   dataKey,
//   distinctValues,
//   open,
//   onSort,
//   onSearch,
//   searchValue,
//   selections,
//   onToggleAll,
//   allChecked,
//   onToggleOne,
//   onApply,
//   onCancel,
// }) {
//   if (!open) return null;

//   return (
//     <div className="filter-popupHome">
//       <div className="fp-header">
//         <button className="fp-btn" onClick={() => onSort(dataKey, 'asc')}>A→Z</button>
//         <button className="fp-btn" onClick={() => onSort(dataKey, 'desc')}>Z→A</button>
//       </div>
//       <input
//         className="fp-search"
//         value={searchValue}
//         placeholder="Search"
//         onChange={e => onSearch(dataKey, e.target.value)}
//       />
//       <div className="fp-list">
//         <label className="fp-option">
//           <input
//             type="checkbox"
//             checked={allChecked(dataKey)}
//             onChange={() => onToggleAll(dataKey)}
//           />
//           (Select All)
//         </label>
//         {distinctValues[dataKey]
//           .filter(v => v.toLowerCase().includes(searchValue.toLowerCase()))
//           .map(v => (
//             <label key={v} className="fp-option">
//               <input
//                 type="checkbox"
//                 checked={selections.includes(v)}
//                 onChange={() => onToggleOne(dataKey, v)}
//               />
//               {v}
//             </label>
//           ))}
//       </div>
//       <div className="fp-footer">
//         <button className="fp-apply" onClick={() => onApply(dataKey)}>OK</button>
//         <button className="fp-cancel" onClick={onCancel}>Cancel</button>
//       </div>
//     </div>
//   );
// }

// src/components/FilterSortPopup/FilterSortPopup.jsx
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Filter.css';

export default function Filter({
  dataKey,
  distinctValues,
  open,
  anchorRef,      // ← new: ref to the button that opened this popup
  onSort,
  onSearch,
  searchValue,
  selections,
  onToggleAll,
  allChecked,
  onToggleOne,
  onApply,
  onCancel,
}) {
  const popupRef = useRef();
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // When opening, compute absolute screen coords based on the anchor button
  useLayoutEffect(() => {
    if (open && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onCancel();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onCancel, anchorRef]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      ref={popupRef}
      className="filter-popupHome"
      style={{
        position: 'absolute',
        top:  `${pos.top}px`,
        left: `${pos.left}px`,
        zIndex: 9999,
      }}
    >
      <div className="fp-header">
        <button className="fp-btn" onClick={() => onSort(dataKey, 'asc')}>A→Z</button>
        <button className="fp-btn" onClick={() => onSort(dataKey, 'desc')}>Z→A</button>
      </div>
      <input
        className="fp-search"
        value={searchValue}
        placeholder="Search"
        onChange={e => onSearch(dataKey, e.target.value)}
      />
      <div className="fp-list">
        <label className="fp-option">
          <input
            type="checkbox"
            checked={allChecked(dataKey)}
            onChange={() => onToggleAll(dataKey)}
          />
          (Select All)
        </label>
        {distinctValues[dataKey]
          .filter(v => v.toLowerCase().includes(searchValue.toLowerCase()))
          .map(v => (
            <label key={v} className="fp-option">
              <input
                type="checkbox"
                checked={selections.includes(v)}
                onChange={() => onToggleOne(dataKey, v)}
              />
              {v}
            </label>
          ))}
      </div>
      <div className="fp-footer">
        <button className="fp-apply" onClick={() => onApply(dataKey)}>OK</button>
        <button className="fp-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>,
    document.body
  );
}
