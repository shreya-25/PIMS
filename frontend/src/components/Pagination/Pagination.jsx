import React from "react";
import "./Pagination.css"; // Import the external CSS file

const Pagination = ({ currentPage, totalEntries, onPageChange, pageSize, onPageSizeChange }) => {
  const totalPages = Math.ceil(totalEntries / pageSize); // Dynamically calculate total pages

  return (
    <div className="pagination-container">
      {/* Showing results info */}
      <div className="pagination-info">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} results
      </div>

      {/* Page size selector (only show if more than 50 entries) */}
      {totalEntries > 50 && (
        <div className="page-size-selector">
          <select
            className="page-size-dropdown"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
            <option value={totalEntries}>All</option>
          </select>
          <span> per page</span>
        </div>
      )}

      {/* Pagination Controls (Only show if more than one page exists) */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          {/* Previous Button */}
          <button
            className="pagination-button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ❮
          </button>

          {/* Page Numbers (Dynamic) */}
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
      )}
    </div>
  );
};

export default Pagination;
