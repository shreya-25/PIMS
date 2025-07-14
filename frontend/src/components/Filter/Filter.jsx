// src/components/FilterSortPopup/FilterSortPopup.jsx
import React, { useState, useMemo } from 'react';
import './Filter.css'; // your .filter-popupHome, .fp-list, etc

export default function Filter({
  dataKey,
  distinctValues,
  open,
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
  if (!open) return null;

  return (
    <div className="filter-popupHome">
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
    </div>
  );
}