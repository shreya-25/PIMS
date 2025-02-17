import React, { useState } from "react";
import "./Sort.css"; // Import styles

const Sort = ({ columns, onApplySort }) => {
  // Initial state for sorting
  const [sortConfig, setSortConfig] = useState({
    category: "", // Column to sort
    order: "asc", // Sort order (asc or desc)
  });

  // Handle changes in dropdowns
  const handleChange = (e) => {
    setSortConfig({
      ...sortConfig,
      [e.target.name]: e.target.value,
    });
  };

  // Apply sorting function
  const applySort = () => {
    console.log("Sorting applied:", sortConfig);
    onApplySort(sortConfig); // Send sorting config back to parent component
  };

  return (
    <div className="sort-container-tailwind">
      {/* Select Category Column */}
      <select
        name="category"
        value={sortConfig.category}
        onChange={handleChange}
        className="sort-dropdown"
      >
        <option value="">Select Category</option>
        {columns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>

      {/* Select Sorting Order */}
      <select
        name="order"
        value={sortConfig.order}
        onChange={handleChange}
        className="sort-dropdown"
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>

      {/* Sort Button */}
      <button onClick={applySort} className="sort-button">
        Apply Sort
      </button>
    </div>
  );
};

export default Sort;
