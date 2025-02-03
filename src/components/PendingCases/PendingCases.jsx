import React from 'react';

const PendingCases = ({ searchText }) => {
  const pendingCases = [
    { id: 1, title: 'Pending Case 1', description: 'Details about Pending Case 1' },
    { id: 2, title: 'Pending Case 2', description: 'Details about Pending Case 2' },
    { id: 3, title: 'Pending Case 3', description: 'Details about Pending Case 3' },
  ];

  // Filter cases based on searchText
  const filteredCases = pendingCases.filter((caseItem) =>
    caseItem.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="case-list">
      {filteredCases.map((caseItem) => (
        <div key={caseItem.id} className="case-item">
          <h3>{caseItem.title}</h3>
          <p>{caseItem.description}</p>
        </div>
      ))}
    </div>
  );
};

export default PendingCases;
