import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./OfficerManagement.css";

export const OfficerManagement = () => {
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([
    { voucher: "Officer 1", status: "Assigned", email: "Officer1@epd.com", date: "08/25/24" },
    { voucher: "Officer 2", status: "Assigned", email: "Officer2@epd.com", date: "08/28/24" },
    { voucher: "Officer 3", status: "Assigned", email: "Officer3@epd.com", date: "08/30/24" },
    { voucher: "Officer 4", status: "Unassigned", email: "Officer4@epd.com", date: "" },
  ]);

  const handleAction = (action, voucher) => {
    console.log(`${action} action on ${voucher}`);
    // Add logic for Assign, Unassign, Re-assign, Delete
  };

  return (
    <div>
      <Navbar />
      <div className="officer-management-container">
      <h2 className="title">OFFICER MANAGEMENT</h2>

      <div className="table-container">
        <table className="voucher-table">
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
            {vouchers.map((voucher, index) => (
              <tr key={index}>
                <td>{voucher.voucher}</td>
                <td>{voucher.status}</td>
                <td>{voucher.email || ""}</td>
                <td>{voucher.date || ""}</td>
                <td>
                  <div className="dropdown">
                    <button className="dropdown-btn"></button>
                    <div className="dropdown-menu">
                      <button onClick={() => handleAction("Assign", voucher.voucher)}>Assign</button>
                      <button onClick={() => handleAction("Unassign", voucher.voucher)}>Unassign</button>
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