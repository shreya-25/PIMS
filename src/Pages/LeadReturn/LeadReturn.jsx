import React, { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './LeadReturn.css';

export const LeadReturn = () => {
  const [assignedOfficers, setAssignedOfficers] = useState(['Officer 1']);
  const [notAssignedOfficers, setNotAssignedOfficers] = useState(['Officer 2', 'Officer 3', 'Officer 4']);

  const handleAssign = (officer) => {
    setAssignedOfficers([...assignedOfficers, officer]);
    setNotAssignedOfficers(notAssignedOfficers.filter((item) => item !== officer));
  };

  const handleUnassign = (officer) => {
    setNotAssignedOfficers([...notAssignedOfficers, officer]);
    setAssignedOfficers(assignedOfficers.filter((item) => item !== officer));
  };

  const handleAssignAll = () => {
    setAssignedOfficers([...assignedOfficers, ...notAssignedOfficers]);
    setNotAssignedOfficers([]);
  };

  const handleUnassignAll = () => {
    setNotAssignedOfficers([...notAssignedOfficers, ...assignedOfficers]);
    setAssignedOfficers([]);
  };

  return (
    <div className="officer-assignment-page">
      <Navbar />
      <nav className="top-navigation">
        <a href="#instructions">Instructions</a>
        <a href="#officers" className="active"><b>Officers</b></a>
        <a href="#returns">Returns</a>
        <a href="#person">Person</a>
        <a href="#vehicles">Vehicles</a>
        <a href="#evidence">Evidence</a>
        <a href="#pictures">Pictures</a>
        <a href="#audio">Audio</a>
        <a href="#videos">Videos</a>
        <a href="#timeline">Timeline</a>
        <a href="#finish">Finish</a>
      </nav>

      <div className="container">
        <div className="assignment-section">
          <div className="not-assigned">
            <h4>Not Assigned</h4>
            <ul>
              {notAssignedOfficers.map((officer, index) => (
                <li key={index}>
                  <label>
                    <input
                      type="checkbox"
                      onChange={() => handleAssign(officer)}
                    />
                    {officer}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="buttonslr">
            <button onClick={handleAssignAll} disabled={!notAssignedOfficers.length}>Assign All</button>
            <button onClick={handleUnassignAll} disabled={!assignedOfficers.length}>Unassign All</button>
          </div>

          <div className="assignedlr">
            <h4>Assigned</h4>
            <ul>
              {assignedOfficers.map((officer, index) => (
                <li key={index}>
                  <label>
                    <input
                      type="checkbox"
                      onChange={() => handleUnassign(officer)}
                    />
                    {officer}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-buttons">
          <button className="back">Back</button>
          <button className="finish">Finish</button>
          <button className="done">Done</button>
          <button className="cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
};
