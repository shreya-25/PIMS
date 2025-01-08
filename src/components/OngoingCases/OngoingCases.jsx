import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './OngoingCases.css'; // Create this file for styling if needed

const OngoingCases = () => {
  const [ongoingCases, setOngoingCases] = useState([]);

  // Load ongoing cases from localStorage on component mount
  useEffect(() => {
    const savedCases = JSON.parse(localStorage.getItem('ongoingCases')) || [];
    setOngoingCases(savedCases);
  }, []);

  // Save ongoing cases to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ongoingCases', JSON.stringify(ongoingCases));
  }, [ongoingCases]);

  const handleDeleteCase = (caseNumber) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete case ${caseNumber}?`
    );
    if (confirmDelete) {
      const updatedCases = ongoingCases.filter(
        (caseItem) => caseItem.number !== caseNumber
      );
      setOngoingCases(updatedCases);
    }
  };

  const handleCloseCase = (caseNumber) => {
    const confirmClose = window.confirm(
      `Are you sure you want to close case ${caseNumber}?`
    );
    if (confirmClose) {
      const updatedCases = ongoingCases.filter(
        (caseItem) => caseItem.number !== caseNumber
      );
      setOngoingCases(updatedCases);
    }
  };

  return (
    <div className="ongoing-cases">
      <h4>Ongoing Cases ({ongoingCases.length})</h4>
      <div className="case-list">
        {ongoingCases.map((ongoingCase, index) => (
          <div key={index} className="case-item">
            <Link
              to={{
                pathname: `/CasePageManager`,
                state: { caseDetails: ongoingCase },
              }}
              className="case-item-link"
            >
              <strong>Case {ongoingCase.number}:</strong> {ongoingCase.title}
            </Link>
            <div className="case-actions">
              <button
                className="close-case-button"
                onClick={() => handleCloseCase(ongoingCase.number)}
              >
                Close
              </button>
              <button
                className="delete-button"
                onClick={() => handleDeleteCase(ongoingCase.number)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OngoingCases;
