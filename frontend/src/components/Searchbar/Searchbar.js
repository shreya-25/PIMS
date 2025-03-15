import React from 'react';
import './Searchbar.css';

const Searchbar = ({ placeholder, onSearch, className = '' }) => {
  return (
    <div className={`search-wrapper ${className}`}>
      <div className="search-container">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>
    </div>
  );
};

export default Searchbar;
