import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import FootBar from "../../components/FootBar/FootBar";
import "./LeadsDesk.css"; // Ensure this file is linked for styling

export const LeadsDesk = () => {
  const navigate = useNavigate();

  // Dummy data for multiple leads
  const [leadsData, setLeadsData] = useState([
    {
      leadNumber: "1",
      leadOrigin: "",
      assignedOfficer: "Officer 912",
      assignedDate: "02/25/25",
      leadDescription: "Collect Audio Recording from dispatcher",
      leadReturns: [
        "As part of the Bank Robbery Investigation (Case No. 65734), Officer 916 assigned Officers 1, 2, and 3 the task of interviewing Matthew under Lead No. 11. The interview was conducted on February 20, 2025, at 10:30 AM (UTC) and was officially logged by Officer 1. Following the interview, the officers gathered key details regarding Matthew’s whereabouts during the time of the robbery, his possible connections to the suspects, and any unusual activities he may have observed. Their findings were submitted for further review, indicating that Matthew provided potentially valuable information that may assist in identifying suspects, confirming alibis, or uncovering new leads in the investigation..",
        "Neighbor provided security footage.",
        "Witness identified the child.",
      ],
    },
    {
      leadNumber: "2",
      leadOrigin: "",
      assignedOfficer: "Officer 914",
      assignedDate: "02/26/25",
      leadDescription: "Interview witness near the grocery store",
      leadReturns: [
        "Security footage shows the suspect.",
        "Officer confirmed identity with store clerk.",
      ],
    },
    {
      leadNumber: "3",
      leadOrigin: "1",
      assignedOfficer: "Officer 918",
      assignedDate: "02/27/25",
      leadDescription: "Follow up on car seen near the location",
      leadReturns: [
        "Car owner identified.",
        "Suspect had no criminal record.",
        "No suspicious activity found.",
      ],
    },
    {
      leadNumber: "4",
      leadOrigin: "2",
      assignedOfficer: "Officer 918",
      assignedDate: "02/27/25",
      leadDescription: "Check video footage of main street",
      leadReturns: [
        "Suspect went outside the house at 2:00 PM "
      ],
    },
  ]);

  const options = [
    { name: "Person" },
    { name: "Vehicle" },
    { name: "Evidence" },
    { name: "Enclosure" },
    { name: "Pictures" },
    { name: "Audio" },
    { name: "Video" },
    { name: "Scratchpad" },
  ];

  return (
    <div className="lead-instructions-page">
      <Navbar />

      <div className="main-content-cl1">
        {/* Left Section */}
        <div className="left-section">
          <img
            src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
            alt="Police Department Logo"
            className="police-logo-cl"
          />
        </div>

        {/* Center Section */}
        <div className="center-section-ld">
          <h1 className="title">LEADS DESK</h1>
          <h1>Case: 88765 | Floral Avenue Lost Child</h1>
        </div>
      </div>

      <div className="bottom-sec-ld">
        {/* Loop through multiple leads */}
        {leadsData.map((lead, leadIndex) => (
          <div key={leadIndex} className="lead-section">
            {/* Lead Information Table */}
            <div className="">
              <table className="info-table">
                <tbody>
                  <tr>
                    <td>LEAD NUMBER:</td>
                    <td>
                      <input type="text" value={lead.leadNumber} className="input-field" readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td>LEAD ORIGIN:</td>
                    <td>
                      <input type="text" value={lead.leadOrigin} className="input-field" readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td>ASSIGNED OFFICERS:</td>
                    <td>
                      <input type="text" value={lead.assignedOfficer} className="input-field" readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td>ASSIGNED DATE:</td>
                    <td>
                      <input type="text" value={lead.assignedDate} className="input-field" readOnly />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Leads Table */}
            <div className="leads-container">
              <table className="leads-table">
                <tbody>
                  <tr>
                    <td>Lead Instruction</td>
                    <td>
                      <input type="text" value={lead.leadDescription} className="input-field" readOnly />
                    </td>
                  </tr>

                  {/* Dynamically render multiple Lead Returns */}
                  {lead.leadReturns.map((returnItem, index) => (
                    <React.Fragment key={index}>
                      <tr>
                        <td>Lead Return {index + 1}</td>
                        <td>
                          <input type="text" value={returnItem} className="input-field" readOnly />
                        </td>
                      </tr>

                      {/* Options under each Lead Return */}
                      <tr>
                        <td colSpan="2">
                          <div className="options-container">
                            {options.map((option) => (
                              <button key={option.name} className="option-button">
                                {option.name}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* FootBar with navigation */}
      <FootBar onPrevious={() => navigate(-1)} />
    </div>
  );
};
