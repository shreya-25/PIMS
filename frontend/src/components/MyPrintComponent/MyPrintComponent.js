import React from 'react';

const MyPrintComponent = React.forwardRef(({ selectedReport, selectedCase, leadInstructionContent, leadReturnsContent }, ref) => {
  return (
    <div ref={ref} style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {selectedReport} Report
      </h1>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {selectedCase?.caseNo || 'CaseNo'} – {selectedCase?.caseName || 'CaseName'}
      </h2>
      <div className="report-content">
        {selectedReport === "Lead Instruction" && (
          leadInstructionContent ? leadInstructionContent : <p>No content available.</p>
        )}
        {selectedReport === "Lead Returns" && (
          leadReturnsContent ? leadReturnsContent : <p>No content available.</p>
        )}
        {/* Add additional conditions for other report types as needed */}
      </div>
    </div>
  );
});

export default MyPrintComponent;
