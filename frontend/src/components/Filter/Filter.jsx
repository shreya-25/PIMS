// import React, { useState } from "react";
// import "./Filter.css"; // Import the CSS file for styles

// const Filter = () => {
//   const [filters, setFilters] = useState({
//     country: "",
//     brand: "",
//     abv: "",
//   });

//   const handleChange = (e) => {
//     setFilters({
//       ...filters,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const applyFilters = () => {
//     console.log("Filters applied:", filters);
//   };

//   return (
//     <div className="filter-container-tailwind">
//       <div className="filter-cat">
//         {/* Country Dropdown */}
//         <select
//           name="Case Number"
//           value={filters.country}
//           onChange={handleChange}
//           className="filter-dropdown"
//         >
//           <option value="">Case Number</option>
//           <option value="12345">12345</option>
//           <option value="45607">45607</option>
//           <option value="23789">23789</option>
//         </select>
//       </div>

//       <div className="filter-cat">
//         {/* Brand Dropdown */}
//         <select
//           name="Case Name"
//           value={filters.brand}
//           onChange={handleChange}
//           className="filter-dropdown"
//         >
//           <option value="">Case Name</option>
//           <option value="Main Street Murder">Main Street Murder</option>
//           <option value="Cook Street Stolen Truck">Cook Street Stolen Truck</option>
//           <option value="216 Endicott Burglary">216 Endicott Burglary</option>
//         </select>
//       </div>

//       <div className="filter-cat">
//         <select
//           name="Case Manager"
//           value={filters.abv}
//           onChange={handleChange}
//           className="filter-dropdown"
//         >
//           <option value="">Case Manager</option>
//           <option value="Officer 1">Officer 1</option>
//           <option value="Officer 2">Officer 2</option>
//           <option value="Officer 3">Officer 3</option>
//         </select>
//       </div>

//       {/* Apply Filters Button */}
//       <button onClick={applyFilters} className="filter-button">
//         Apply Filters
//       </button>
//     </div>
//   );
// };

// export default Filter;

import React, { useState } from "react";
import "./Filter.css"; // Import styles

const Filter = ({ filtersConfig, onApply }) => {
  const initialFilters = filtersConfig.reduce((acc, filter) => {
    acc[filter.name] = "";
    return acc;
  }, {});

  const [filters, setFilters] = useState(initialFilters);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilters = () => {
    console.log("Filters applied:", filters);
    onApply(filters); // Send filters back to the parent component
  };

  return (
    <div className="filter-container-tailwind">
      {filtersConfig.map((filter) => (
        <div className="filter-cat" key={filter.name}>
          <select
            name={filter.name}
            value={filters[filter.name]}
            onChange={handleChange}
            className="filter-dropdown"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Apply Filters Button */}
      <button onClick={applyFilters} className="filter-buttonNC">
        Apply Filters
      </button>
    </div>
  );
};

export default Filter;
