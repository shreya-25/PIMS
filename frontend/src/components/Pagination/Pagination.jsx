// import React from "react";

// const Pagination = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
//   return (
//     <div className="flex items-center justify-between p-4">
//       {/* Showing results info */}
//       <div className="text-gray-700">
//         Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalPages * pageSize)} of {totalPages * pageSize} results
//       </div>

//       {/* Page size selector */}
//       <div className="flex items-center">
//         <select
//           className="border rounded px-2 py-1 cursor-pointer"
//           value={pageSize}
//           onChange={(e) => onPageSizeChange(Number(e.target.value))}
//         >
//           <option value="50">50</option>
//           <option value="100">100</option>
//           <option value="500">500</option>
//           <option value="All">All</option>
//         </select>
//         <span className="ml-2 text-gray-700">per page</span>
//       </div>

//       {/* Pagination Controls */}
//       <div className="flex items-center space-x-2">
//         {/* Previous Button */}
//         <button
//           className="px-3 py-1 border rounded disabled:opacity-50"
//           onClick={() => onPageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//         >
//           ❮
//         </button>

//         {/* Page Numbers */}
//         {[...Array(totalPages)].map((_, index) => {
//           const page = index + 1;
//           return (
//             <button
//               key={page}
//               className={`px-3 py-1 border rounded ${
//                 currentPage === page ? "border-yellow-500 text-yellow-500" : ""
//               }`}
//               onClick={() => onPageChange(page)}
//             >
//               {page}
//             </button>
//           );
//         })}

//         {/* Next Button */}
//         <button
//           className="px-3 py-1 border rounded disabled:opacity-50"
//           onClick={() => onPageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//         >
//           ❯
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Pagination;

import React from "react";
import "./Pagination.css"; // Import the external CSS file

const Pagination = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  return (
    <div className="pagination-container">
      {/* Showing results info */}
      <div className="pagination-info">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalPages * pageSize)} of {totalPages * pageSize} results
      </div>

      {/* Page size selector */}
      <div className="page-size-selector">
        <select
          className="page-size-dropdown"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="500">500</option>
          <option value="All">All</option>
        </select>
        <span> per page</span>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        {/* Previous Button */}
        <button
          className="pagination-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ❮
        </button>

        {/* Page Numbers */}
        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              className={`pagination-button ${currentPage === page ? "active" : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          className="pagination-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ❯
        </button>
      </div>
    </div>
  );
};

export default Pagination;
