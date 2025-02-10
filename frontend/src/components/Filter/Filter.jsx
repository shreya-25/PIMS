import React, { useState } from "react";
import "./Filter.css"; // Import the CSS file for styles

const Filter = () => {
  const [filters, setFilters] = useState({
    country: "",
    brand: "",
    abv: "",
  });

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilters = () => {
    console.log("Filters applied:", filters);
  };

  return (
    <div className="filter-container">
      <div className="item">
        {/* Country Dropdown */}
        <select
          name="country"
          value={filters.country}
          onChange={handleChange}
          className="filter-dropdown"
        >
          <option value="">Country</option>
          <option value="USA">USA</option>
          <option value="UK">UK</option>
          <option value="Germany">Germany</option>
        </select>
      </div>

      <div className="item">
        {/* Brand Dropdown */}
        <select
          name="brand"
          value={filters.brand}
          onChange={handleChange}
          className="filter-dropdown"
        >
          <option value="">Brand</option>
          <option value="Heineken">Heineken</option>
          <option value="Budweiser">Budweiser</option>
          <option value="Corona">Corona</option>
        </select>
      </div>

      <div className="item">
        {/* ABV Dropdown */}
        <select
          name="abv"
          value={filters.abv}
          onChange={handleChange}
          className="filter-dropdown"
        >
          <option value="">ABV</option>
          <option value="5%">5%</option>
          <option value="6%">6%</option>
          <option value="7%">7%</option>
        </select>
      </div>

      {/* Apply Filters Button */}
      <button onClick={applyFilters} className="filter-button">
        Apply Filters
      </button>
    </div>
  );
};

export default Filter;
