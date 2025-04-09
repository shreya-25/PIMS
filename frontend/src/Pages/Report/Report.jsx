// Report.jsx
import React from 'react';
import './Report.css';

const Report = React.forwardRef(({ name, department, score, date }, ref) => {
  return (
    <div className="report-container" ref={ref}>
      <h1 className="report-title">📊 Monthly Performance Report</h1>
      <div className="report-section">
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Department:</strong> {department}</p>
        <p><strong>Score:</strong> {score}</p>
        <p><strong>Date:</strong> {date}</p>
      </div>
      <div className="report-summary">
        <p>This report summarizes the performance and outcomes for the month. All data is confidential and for internal use only.</p>
      </div>
    </div>
  );
});

export default Report;
