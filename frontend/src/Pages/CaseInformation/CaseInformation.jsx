import React, { useContext, useState, useEffect} from 'react';
import axios from "axios";
import Navbar from '../../components/Navbar/Navbar';
import { useLocation, useNavigate } from 'react-router-dom';
import './CaseInformation.css'; // Custom CSS
import { CaseContext } from "../CaseContext";


export const CaseInformation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { caseDetails } = location.state || {};

    const { selectedCase } = useContext(CaseContext);
    
    
    const handleHomeClick = () => {
      navigate("/Homepage"); // Replace "/" with the actual home page route if different
    };

    // Example state fields mirroring the police report sections
    const [recentType, setRecentType] = useState('');
    const [reportDateAndTime, setReportDateAndTime] = useState('');
    const [dateTimeFrom, setDateTimeFrom] = useState('');
    const [dateTimeTo, setDateTimeTo] = useState('');
    const [recentLocation, setRecentLocation] = useState('');

    // Offenses can be an array if you want multiple offenses
    const [offenses, setOffenses] = useState([
      { statute: '', desc: '', attemptCommit: '', counts: '' },
    ]);

    // You can allow multiple Subjects; for demonstration, we'll set 3
    const [subjects, setSubjects] = useState([
      {
        name: '',
        isVictimAlsoComplainant: false,
        address: '',
        phone1: '',
        phone2: '',
        phone3: '',
        dob: '',
        age: '',
        sex: '',
        race: '',
        ethnicity: '',
        height: '',
        weight: '',
        hairColor: '',
        eyeColor: '',
        glasses: '',
        alias: '',
        scarsMarksTattoos: '',
        schoolEmployerNameAndAddress: '',
        schoolEmployerPhone: ''
      },
     
    ]);

    const [caseStatus, setCaseStatus] = useState('');
    const [exceptionalClearance, setExceptionalClearance] = useState('');
    const [reportingOfficer, setReportingOfficer] = useState('Lane, Dale 467');
    const [reportDate, setReportDate] = useState('');
    const [reviewedBy, setReviewedBy] = useState('');
    const [reviewedDate, setReviewedDate] = useState('');

    // Example summary handling (like your existing code):
    const defaultCaseSummary = "Initial findings indicate that the suspect was last seen near the crime scene at 9:45 PM. Witness statements collected. Awaiting forensic reports and CCTV footage analysis.";
  

    const handleSaveClick = () => {
      // Save logic or API call can go here
      console.log("Saved report fields:", {
        recentType,
        reportDateAndTime,
        dateTimeFrom,
        dateTimeTo,
        recentLocation,
        offenses,
        subjects,
        caseStatus,
        exceptionalClearance,
        reportingOfficer,
        reportDate,
        reviewedBy,
        reviewedDate,
        caseSummary
      });
      alert("Report Saved!");
    };

    // Helper to handle changes for multiple offense rows
    const handleOffenseChange = (index, field, value) => {
      const updatedOffenses = [...offenses];
      updatedOffenses[index][field] = value;
      setOffenses(updatedOffenses);
    };

    // Helper to handle changes for multiple subjects
    const handleSubjectChange = (index, field, value) => {
      const updatedSubjects = [...subjects];
      updatedSubjects[index][field] = value;
      setSubjects(updatedSubjects);
    };

    // Collapsible sections states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOffensesOpen, setIsOffensesOpen] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false);
  const [isDOpen, setIsDOpen] = useState(false);

  // New: Reject click handler that calls your backend endpoint with token
  const handleRejectClick = async () => {
    // Ensure that we have a valid case number from caseDetails
    // if (!caseDetails || !caseDetails.caseNo) {
    //   alert("Case number not found!");
    //   return;
    // }
    
    try {
      // Retrieve token from localStorage (or any other storage method you're using)
      const token = localStorage.getItem('token');

      // Call the backend endpoint using the case number and include the token in the headers.
      const response = await fetch(`http://localhost:5000/api/cases/1001/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error rejecting case:", result);
        alert("Error rejecting case: " + result.message);
      } else {
        alert("Case rejected. Case Manager changed to 'Admin'.");
        console.log("Updated case details:", result.data);
        // Optionally update local state or navigate to a different page
      }
    } catch (error) {
      console.error("Error in handleRejectClick:", error);
      alert("An error occurred while rejecting the case.");
    }
  };

  const [caseSummary, setCaseSummary] = useState('' ||  defaultCaseSummary);

  const [isEditing, setIsEditing] = useState(false); // Controls whether the textarea is editable
  useEffect(() => {
   const fetchCaseSummary = async () => {
     try {
       if (caseDetails && caseDetails.id) {
         const token = localStorage.getItem("token");
         const response = await axios.get(`http://localhost:5000/api/cases/summary/${selectedCase.caseNo}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         // Update case summary if data is received
         console.log("Response data:", response.data);
         if (response.data) {
           setCaseSummary(response.data.summary );
         }
       }
     } catch (error) {
       console.error("Error fetching case summary:", error);
     }
   };

   fetchCaseSummary();
 }, [caseDetails]);



    return (
      <div className="case-page-manager">
        {/* Navbar */}
        <Navbar />

        <div className="main-container">
          {/* Simple Sidebar */}
          <div className="sideitem">
            <ul className="sidebar-list">
              <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>
              <li className="sidebar-item" onClick={() => navigate('/casepagemanager')}>Case Page</li>
              <li className="sidebar-item" onClick={() => navigate('/createlead')}>Create Lead</li>
              <li className="sidebar-item" onClick={() => navigate("/leadlog")}>View Lead Log</li>
              <li className="sidebar-item" onClick={() => navigate('/OfficerManagement')}>Officer Management</li>
              <li className="sidebar-item" onClick={() => navigate('/casescratchpad')}>Case Scratchpad</li>
              <li className="sidebar-item" onClick={() => navigate('/SearchLead')}>Search Lead</li>
              <li className="sidebar-item" onClick={() => navigate('/LeadHierarchy')}>View Lead Hierarchy</li>
              <li className="sidebar-item">Generate Report</li>
              <li className="sidebar-item" onClick={() => navigate('/FlaggedLead')}>View Flagged Leads</li>
              <li className="sidebar-item" onClick={() => navigate('/ViewTimeline')}>View Timeline Entries</li>
              <li className="sidebar-item" onClick={() => navigate('/ViewDocument')}>View Uploaded Documents</li>
              <li className="sidebar-item">View Lead Chain of Custody</li>
            </ul>
          </div>

          {/* Main Content: Replicate the Police Report Fields */}
          <div className="left-content">
            <div className="case-header">
            {
                        <h1>
                          Case: {selectedCase.caseNo || "N/A"} | {selectedCase.caseName || "Unknown Case"}
                        </h1>
                    }
            </div>

            {/* Detail Section */}
             {/* Case Summary (existing logic) */}
             <div className="case-summary">
              <label className="input-label">Case Summary</label>
              <textarea
                className="textarea-field"
                value={caseSummary}
                onChange={(e) => setCaseSummary(e.target.value)}
              />

               {/* Save Button */}
             <button className="save-btn1" onClick={handleSaveClick}>
              Save
            </button>
            </div>
            {/* <h2> Field Case Report </h2> */}
            <div className ="field-case-sec">
                {/* <div className ="detail-sec">
               <h2 onClick={() => setIsDetailOpen(!isDetailOpen)} 
               style={{ cursor: 'pointer' }} 
               className = "collapsible-header">
                <span> Incident Details  </span>
                <span>{isDetailOpen ? '▲' : '▼'}</span>
                </h2>
              {isDetailOpen && (
                <>
              <div className="form-row">
                <label>Incident Type:</label>
                <input
                  type="text"
                  value={recentType}
                  onChange={(e) => setRecentType(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Report Date and Time:</label>
                <input
                  type="text"
                  value={reportDateAndTime}
                  onChange={(e) => setReportDateAndTime(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Date and Time From:</label>
                <input
                  type="text"
                  value={dateTimeFrom}
                  onChange={(e) => setDateTimeFrom(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Date and Time To:</label>
                <input
                  type="text"
                  value={dateTimeTo}
                  onChange={(e) => setDateTimeTo(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Incident Location:</label>
                <input
                  type="text"
                  value={recentLocation}
                  onChange={(e) => setRecentLocation(e.target.value)}
                />
              </div>
              </>
              )}
            </div>

            <div className="detail-sec">
              <h2 onClick={() => setIsOffensesOpen(!isOffensesOpen)} 
              style={{ cursor: 'pointer' }} className = "collapsible-header">
               <span> Offense Details </span> <span> {isOffensesOpen ? '▲' : '▼'} </span>
                </h2>
              {isOffensesOpen && (
                <>
              {offenses.map((offense, index) => (
                <div key={index} className="offense-block">
                  <div className="form-row">
                    <label>Statute:</label>
                    <input
                      type="text"
                      value={offense.statute}
                      onChange={(e) => handleOffenseChange(index, 'statute', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Description:</label>
                    <input
                      type="text"
                      value={offense.desc}
                      onChange={(e) => handleOffenseChange(index, 'desc', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Attempt/Commit:</label>
                    <input
                      type="text"
                      value={offense.attemptCommit}
                      onChange={(e) => handleOffenseChange(index, 'attemptCommit', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Counts:</label>
                    <input
                      type="text"
                      value={offense.counts}
                      onChange={(e) => handleOffenseChange(index, 'counts', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={() =>
                  setOffenses([...offenses, { statute: '', desc: '', attemptCommit: '', counts: '' }])
                }
              >
                + Add Offense
              </button>
              </>
                )}
            </div>

          
            <div className="detail-sec">
              <h2 onClick={() => setIsSubjectsOpen(!isSubjectsOpen)}
               style={{ cursor: 'pointer' }} className = "collapsible-header">
               <span> Subject(s) Information </span> <span>
               {isSubjectsOpen ? '▲' : '▼'}</span></h2>
              {isSubjectsOpen && (
                <>
              {subjects.map((subj, index) => (
                <div key={index} className="subject-block">

                  <div className="form-row">
                  <label>Subject Type:</label>
                  <input
                    type="text"
                    value={subj.type}
                    onChange={(e) => handleSubjectChange(index, 'type', e.target.value)}
                  />
                  </div>

                  <div className="form-row">
                  <label>Name (Last, First, Middle):</label>
                  <input
                    type="text"
                    value={subj.name}
                    onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                  />
                  </div>

                  <div className="form-row">
                    <label>Victim is Also Complainant:</label>
                    <input
                      type="checkbox"
                      checked={subj.isVictimAlsoComplainant}
                      onChange={(e) =>
                        handleSubjectChange(index, 'isVictimAlsoComplainant', e.target.checked)
                      }
                    />
                  </div>
                  <div className="form-row">
                    <label>Address:</label>
                    <input
                      type="text"
                      value={subj.address}
                      onChange={(e) => handleSubjectChange(index, 'address', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Phone 1:</label>
                    <input
                      type="text"
                      value={subj.phone1}
                      onChange={(e) => handleSubjectChange(index, 'phone1', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Phone 2:</label>
                    <input
                      type="text"
                      value={subj.phone2}
                      onChange={(e) => handleSubjectChange(index, 'phone2', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Phone 3:</label>
                    <input
                      type="text"
                      value={subj.phone3}
                      onChange={(e) => handleSubjectChange(index, 'phone3', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>DOB:</label>
                    <input
                      type="text"
                      value={subj.dob}
                      onChange={(e) => handleSubjectChange(index, 'dob', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Age:</label>
                    <input
                      type="text"
                      value={subj.age}
                      onChange={(e) => handleSubjectChange(index, 'age', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Sex:</label>
                    <input
                      type="text"
                      value={subj.sex}
                      onChange={(e) => handleSubjectChange(index, 'sex', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Race:</label>
                    <input
                      type="text"
                      value={subj.race}
                      onChange={(e) => handleSubjectChange(index, 'race', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Ethnicity:</label>
                    <input
                      type="text"
                      value={subj.ethnicity}
                      onChange={(e) => handleSubjectChange(index, 'ethnicity', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Height:</label>
                    <input
                      type="text"
                      value={subj.height}
                      onChange={(e) => handleSubjectChange(index, 'height', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Weight:</label>
                    <input
                      type="text"
                      value={subj.weight}
                      onChange={(e) => handleSubjectChange(index, 'weight', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Hair Color:</label>
                    <input
                      type="text"
                      value={subj.hairColor}
                      onChange={(e) => handleSubjectChange(index, 'hairColor', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Eye Color:</label>
                    <input
                      type="text"
                      value={subj.eyeColor}
                      onChange={(e) => handleSubjectChange(index, 'eyeColor', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Glasses:</label>
                    <input
                      type="text"
                      value={subj.glasses}
                      onChange={(e) => handleSubjectChange(index, 'glasses', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Alias:</label>
                    <input
                      type="text"
                      value={subj.alias}
                      onChange={(e) => handleSubjectChange(index, 'alias', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Scars/Marks/Tattoos:</label>
                    <input
                      type="text"
                      value={subj.scarsMarksTattoos}
                      onChange={(e) =>
                        handleSubjectChange(index, 'scarsMarksTattoos', e.target.value)
                      }
                    />
                  </div>
                  <div className="form-row">
                    <label>School/Employer Name and Address:</label>
                    <input
                      type="text"
                      value={subj.schoolEmployerNameAndAddress}
                      onChange={(e) =>
                        handleSubjectChange(index, 'schoolEmployerNameAndAddress', e.target.value)
                      }
                    />
                  </div>
                  <div className="form-row">
                    <label>School/Employer Phone:</label>
                    <input
                      type="text"
                      value={subj.schoolEmployerPhone}
                      onChange={(e) =>
                        handleSubjectChange(index, 'schoolEmployerPhone', e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
              </>
              )}
            </div>

            <div className="detail-sec">
              <h2 onClick={() => setIsCaseDetailOpen(!isCaseDetailOpen)} style={{ cursor: 'pointer' }} className = "collapsible-header">
               <span>  Case Details </span>
              <span> {isCaseDetailOpen ? '▲' : '▼'} </span>
              </h2>


              {isCaseDetailOpen && (
                <>
               

                <div className="form-row">
                    <label>Case Status:</label>
                    <input
                    type="text"
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value)}
                    />
                </div>
                <div className="form-row">
                    <label>Exceptional Clearance:</label>
                    <input
                    type="text"
                    value={exceptionalClearance}
                    onChange={(e) => setExceptionalClearance(e.target.value)}
                    />
                </div>
              <div className="form-row">
                <label>Reporting Officer (Last, First, Badge):</label>
                <input
                  type="text"
                  value={reportingOfficer}
                  onChange={(e) => setReportingOfficer(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Date:</label>
                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Reviewed By (Last, First, Badge):</label>
                <input
                  type="text"
                  value={reviewedBy}
                  onChange={(e) => setReviewedBy(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Date:</label>
                <input
                  type="text"
                  value={reviewedDate}
                  onChange={(e) => setReviewedDate(e.target.value)}
                />
              </div>
              </>
              )}
            </div>

            <div className="detail-sec">
              <h2 onClick={() => setIsDOpen(!isDOpen)} style={{ cursor: 'pointer' }} className = "collapsible-header">
               <span>  Property Vehicles Details </span>
              <span> {isDOpen ? '▲' : '▼'} </span>
              </h2>
              </div>

              <div className="detail-sec">
              <h2 onClick={() => setIsDOpen(!isDOpen)} style={{ cursor: 'pointer' }} className = "collapsible-header">
               <span>  Case Vehicles Details </span>
              <span> {isDOpen ? '▲' : '▼'} </span>
              </h2>
              </div>

              <div className="detail-sec">
              <h2 onClick={() => setIsDOpen(!isDOpen)} style={{ cursor: 'pointer' }} className = "collapsible-header">
               <span>  General Items
                 </span>
              <span> {isDOpen ? '▲' : '▼'} </span>
              </h2>
              </div>

              <div className="detail-sec">
              <h2 onClick={() => setIsDOpen(!isDOpen)} style={{ cursor: 'pointer' }} className = "collapsible-header">
               <span>  Fire Alarms
                 </span>
              <span> {isDOpen ? '▲' : '▼'} </span>
              </h2>
              </div>
      
          </div> */}

          <div className="comment-sec">
                <label> Comments </label>
                <input
                  type="text"
                />
              </div>

          </div>
          <div className="btn-sec">

<button className="save-btn1" onClick={handleHomeClick}>
Back
</button>
<button className="save-btn1" onClick={handleSaveClick}>
Accept
</button>

<button className="save-btn1" onClick={handleRejectClick}>
Reject
</button>
<button className="save-btn1" onClick={handleSaveClick}>
Next
</button>
</div>
        </div>
     </div>
     </div>
    );
};
