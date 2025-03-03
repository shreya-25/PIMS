import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./OfficerManagement.css";

export const OfficerManagement = () => {
  const navigate = useNavigate();

  const [officers, setOfficers] = useState([
    { name: "Officer 1", image: "http://4.bp.blogspot.com/-mvDI30f995k/VkCG_p0nUjI/AAAAAAAAgFQ/xInsGw3ILis/s1600/6.jpg", status: "Assigned", email: "Officer1@epd.com", date: "08/25/24", casesAssigned: 2, leadsAssigned: 5 },
    { name: "Officer 2", image: "https://c8.alamy.com/comp/P102E0/a-very-attractive-motorcycle-policewoman-on-fifth-avenue-in-midtown-manhattan-new-york-city-P102E0.jpg", status: "Assigned", email: "Officer2@epd.com", date: "08/28/24", casesAssigned: 1, leadsAssigned: 3 },
    { name: "Officer 3", image: "https://static.vecteezy.com/system/resources/previews/001/131/187/large_2x/serious-man-portrait-real-people-high-definition-grey-background-photo.jpg", status: "Assigned", email: "Officer3@epd.com", date: "08/30/24", casesAssigned: 3, leadsAssigned: 7 },
    { name: "Officer 4", image: "https://tse4.mm.bing.net/th?id=OIP.eVQqUbLayb6DS_wbwHU9LQAAAA&pid=Api&P=0&h=180", status: "Unassigned", email: "Officer4@epd.com", date: "", casesAssigned: 0, leadsAssigned: 0 },
  ]);

  const handleAction = (action, name) => {
    console.log(`${action} action on ${name}`);
  };

  return (
    <div>
      <Navbar />
      <div className="officer-management-container">
        <h2 className="title">OFFICER MANAGEMENT</h2>
        
        <div className="officer-list">
          {officers.map((officer, index) => (
            <div key={index} className="officer-item">
              <img src={officer.image} alt={officer.name} className="officer-avatar" />
              <div className="officer-details">
                <h3>{officer.name}</h3>
                <p><strong>Cases Assigned:</strong> {officer.casesAssigned}</p>
                <p><strong>Leads Assigned:</strong> {officer.leadsAssigned}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="table-container">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Officer Name</th>
                <th>Current Status</th>
                <th>Email</th>
                <th>Assigned Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((officer, index) => (
                <tr key={index}>
                  <td>{officer.name}</td>
                  <td>{officer.status}</td>
                  <td>{officer.email || ""}</td>
                  <td>{officer.date || ""}</td>
                  <td>
                    <div className="dropdown">
                      <button className="dropdown-btn">⋮</button>
                      <div className="dropdown-menu">
                        <button onClick={() => handleAction("Assign", officer.name)}>Assign</button>
                        <button onClick={() => handleAction("Unassign", officer.name)}>Unassign</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
