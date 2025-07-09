import React, { useContext, useState, useEffect} from 'react';

import { useLocation, useNavigate } from "react-router-dom";
import FootBar from '../../../components/FootBar/FootBar';
import Navbar from '../../../components/Navbar/Navbar';
import './LRPerson1.css';
import { CaseContext } from "../../CaseContext";
import api, { BASE_URL } from "../../../api";
import {SideBar } from "../../../components/Sidebar/Sidebar";
import { AlertModal } from "../../../components/AlertModal/AlertModal";



export const LRPerson1 = () => {
      // useEffect(() => {
      //     // Apply style when component mounts
      //     document.body.style.overflow = "hidden";
      
      //     return () => {
      //       // Reset to default when component unmounts
      //       document.body.style.overflow = "auto";
      //     };
      //   }, []);
const navigate = useNavigate(); // Initialize useNavigate hook
const location = useLocation();
const FORM_KEY = "LRPerson1:form";
const MISC_KEY = "LRPerson1:misc";
const [username, setUsername] = useState("");
  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };
  const { leadDetails, caseDetails, person } = location.state || {};
const { selectedCase, selectedLead, leadInstructions, leadReturns } = useContext(CaseContext);
     const [caseDropdownOpen, setCaseDropdownOpen] = useState(true);
                const [leadDropdownOpen, setLeadDropdownOpen] = useState(true);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
const onShowCaseSelector = (route) => {
  navigate(route, { state: { caseDetails } });
};

useEffect(() => {
   const loggedInUser = localStorage.getItem("loggedInUser");
   if (loggedInUser) {
     setUsername(loggedInUser);
   }
  })

  const initialForm = {
    dateEntered:  person?.enteredDate?.slice(0,10)   || "",
    leadReturnId: person?.leadReturnId                || "",
    lastName:     person?.lastName                    || "",
    firstName:    person?.firstName                   || "",
    mi:           person?.middleInitial                || "",
    suffix:       person?.suffix                       || "",
    cellNumber:   person?.cellNumber                   || "",
    alias:        person?.alias                || "",
    businessName: person?.businessName                 || "",
    street1:      person?.address?.street1             || "",
    street2:      person?.address?.street2             || "",
    building:     person?.address?.building            || "",
    apartment:    person?.address?.apartment           || "",
    city:         person?.address?.city                || "",
    state:        person?.address?.state               || "",
    zipCode:      person?.address?.zipCode             || "",
    age:          person?.age                          || "",
    ssn:          person?.ssn                          || "",
    occupation:   person?.occupation                   || "",
    email:        person?.email                        || "",
    personType:   person?.personType                   || "",
    condition:    person?.condition                    || "",
    cautionType:  person?.cautionType                  || "",
    sex:          person?.sex                          || "",
    race:         person?.race                         || "",
    ethnicity:    person?.ethnicity                    || "",
    skinTone:     person?.skinTone                     || "",
    eyeColor:     person?.eyeColor                     || "",
    glasses:      person?.glasses                      || "",
    hairColor:    person?.hairColor                    || "",
    tattoo:       person?.tattoo                       || "",
    scar:         person?.scar                         || "",
    mark:         person?.mark                         || ""
  };

  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem(FORM_KEY);
    return saved
      ? JSON.parse(saved)
      : { 
          dateEntered: person?.enteredDate?.slice(0,10) || "",
          leadReturnId: person?.leadReturnId || "",
          lastName: person?.lastName || "",
          /* …everything else… */
        };
  });

  const [miscDetails, setMiscDetails] = useState(() => {
    const saved = sessionStorage.getItem(MISC_KEY);
    return saved
      ? JSON.parse(saved)
      : person?.additionalData || [];
  });

  // 2) Whenever formData changes, persist it
  useEffect(() => {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(formData));
  }, [formData]);

  // 3) Whenever miscDetails changes, persist it
  useEffect(() => {
    sessionStorage.setItem(MISC_KEY, JSON.stringify(miscDetails));
  }, [miscDetails]);


  
  const addNewRow = () => {
    setMiscDetails([...miscDetails, { category: "", value: "" }]);
  };

  const handleInputChange = (index, field, value) => {
    const updatedDetails = [...miscDetails];
    updatedDetails[index][field] = value;
    setMiscDetails(updatedDetails);
  };

    const getCasePageRoute = () => {
      if (!selectedCase || !selectedCase.role) return "/HomePage"; // Default route if no case is selected
      return selectedCase.role === "Investigator" ? "/Investigator" : "/CasePageManager";
  };
  

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  // const handleNextPage = () => {
  //   navigate('/LRReturn'); // Replace '/nextpage' with the actual next page route
  // };

    const handlePrevPage = () => {
    navigate('/LRInstruction'); // Replace '/nextpage' with the actual next page route
  };


  const handleSave = async () => {
    const token = localStorage.getItem("token");
  
    const payload = {
      leadNo: selectedLead?.leadNo,
      description: selectedLead?.leadName,
      caseNo: selectedCase?.caseNo,
      caseName: selectedCase?.caseName,
      enteredBy: username, 
      enteredDate: formData.dateEntered,
      leadReturnId: formData.leadReturnId,
  
      lastName: formData.lastName,
      firstName: formData.firstName,
      middleInitial: formData.mi,
      suffix: formData.suffix,
      cellNumber: formData.cellNumber,
      alias: formData.alias,
      businessName: formData.businessName,
      address: {
        street1: formData.street1,
        street2: formData.street2,
        building: formData.building,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      },
  
      age: formData.age,
      ssn: formData.ssn,
      occupation: formData.occupation,
      email: formData.email,
      personType: formData.personType,
      condition: formData.condition,
      cautionType: formData.cautionType,
      sex: formData.sex,
      race: formData.race,
      ethnicity: formData.ethnicity,
      skinTone: formData.skinTone,
      eyeColor: formData.eyeColor,
      glasses: formData.glasses,
      hairColor: formData.hairColor,
      tattoo: formData.tattoo,
      scar: formData.scar,
      mark: formData.mark,
  
      additionalData: miscDetails, // Store all misc rows
    };

    console.log(payload);
  
  //   try {
  //     // axios.post(url, data, config)
  //     const response = await api.post(
  //       "/api/lrperson/lrperson",
  //       payload,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           "Authorization": `Bearer ${token}`,
  //         },
  //       }
  //     );
  
  //     // If you get here, status was 2xx:
  //     console.log("Saved entry", response.data);
  //     alert("Entry saved successfully!");
  //   } catch (err) {
  //     // err.response exists when the server replied with non-2xx
  //     if (err.response) {
  //       console.error("Server rejected:", err.response);
  //       // Try to pull out a useful message from your API’s JSON error body:
  //       const serverMsg = err.response.data?.message
  //                       || JSON.stringify(err.response.data);
  //       alert(`Failed to save entry: ${serverMsg}`);
  //     } else {
  //       // Something went wrong setting up the request
  //       console.error("Network or code error:", err);
  //       alert(`An error occurred: ${err.message}`);
  //     }
  //   }
  // };
  try {
    let response;
    if (person) {
      // UPDATE existing record
      response = await api.put(
        `/api/lrperson/${selectedLead.leadNo}/` +
          `${selectedCase.caseNo}/` +
          `${person.leadReturnId}/` +
          `${person.firstName}/` +
          `${person.lastName}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      // CREATE new record
      response = await api.post(
        "/api/lrperson/lrperson",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
    }

    console.log("Server response:", response.data);
    sessionStorage.removeItem(FORM_KEY);
    sessionStorage.removeItem(MISC_KEY);

    // alert(person ? "Updated successfully!" : "Created successfully!");
    setAlertMessage(person ? "Updated successfully!" : "Created successfully!");
    setAlertOpen(true);

    navigate(-1);
    // optionally redirect back or refresh your list here

  } catch (err) {
    console.error("Save failed:", err.response || err);
    // alert("Error: " + (err.response?.data?.message || err.message));
    setAlertMessage("Error: " + (err.response?.data?.message || err.message));
                    setAlertOpen(true);
  }
};

 if (!selectedCase && !caseDetails) {
    return <div>Loading case/lead…</div>;
  }
  
  
  return (
    <div className="person-page">
      {/* Navbar at the top */}
      <Navbar />

       <AlertModal
              isOpen={alertOpen}
              title="Notification"
              message={alertMessage}
              onConfirm={() => setAlertOpen(false)}
              onClose={()   => setAlertOpen(false)}
            />

      {/* <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item" onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item active" onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LREnclosures")}>Enclosures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LREvidence")}>Evidence</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRPictures")}>Pictures</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRAudio")}>Audio</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRVideo")}>Videos</span>
          <span className="menu-item" onClick={() => handleNavigation("/LRScratchpad")}>Scratchpad</span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation("/LRFinish")}>Finish</span>
        </div>
       </div> */}
         <div className="top-menu"   style={{ paddingLeft: '20%' }}>
      <div className="menu-items" >
        <span className="menu-item " onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/LeadReview", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } }} > Lead Information</span>
                   <span className="menu-item active" >Add/View Lead Return</span>
                   <span className="menu-item" onClick={() => {
                  const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
                  const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;

                  if (lead && kase) {
                    navigate("/ChainOfCustody", {
                      state: {
                        caseDetails: kase,
                        leadDetails: lead
                      }
                    });
                  } else {
                    // alert("Please select a case and lead first.");
                    setAlertMessage("Please select a case and lead first.");
                    setAlertOpen(true);
                  }
                }}>Lead Chain of Custody</span>
          
                  </div>
        {/* <div className="menu-items">
      
        <span className="menu-item active" onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRReturn')}>
            Returns
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRScratchpad')}>
            Scratchpad
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> */}
       </div>

       <div className="LRI_Content">
       {/* <div className="sideitem">
       <li className="sidebar-item" onClick={() => navigate("/HomePage", { state: { caseDetails } } )} >Go to Home Page</li>

       <li className="sidebar-item active" onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}>
          Case Related Tabs {caseDropdownOpen ?  "▲": "▼"}
        </li>
        {caseDropdownOpen && (
      <ul >
            <li className="sidebar-item" onClick={() => navigate('/caseInformation')}>Case Information</li>  

                  <li
  className="sidebar-item"
  onClick={() =>
    selectedCase.role === "Investigator"
      ? navigate("/Investigator")
      : navigate("/CasePageManager")
  }
>
Case Page
</li>


            {selectedCase.role !== "Investigator" && (
<li className="sidebar-item " onClick={() => onShowCaseSelector("/CreateLead")}>New Lead </li>)}
            <li className="sidebar-item"onClick={() => navigate('/SearchLead')}>Search Lead</li>
            <li className="sidebar-item active" onClick={() => navigate('/CMInstruction')}>View Lead Return</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/LeadLog")}>View Lead Log</li>
        
              {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/CaseScratchpad")}>
              Add/View Case Notes
            </li>)}
        
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/FlaggedLead")}>View Flagged Leads</li>
            <li className="sidebar-item" onClick={() => onShowCaseSelector("/ViewTimeline")}>View Timeline Entries</li>
            <li className="sidebar-item" onClick={() => navigate("/LeadsDesk", { state: { caseDetails } } )} >View Leads Desk</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/LeadsDeskTestExecSummary", { state: { caseDetails } } )} >Generate Report</li>)}

            </ul>
        )}
          <li className="sidebar-item" style={{ fontWeight: 'bold' }} onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}>
          Lead Related Tabs {leadDropdownOpen ?  "▲": "▼"}
          </li>
        {leadDropdownOpen && (
          <ul>
              <li className="sidebar-item" onClick={() => navigate('/leadReview')}>Lead Information</li>
            {selectedCase.role !== "Investigator" && (
            <li className="sidebar-item" onClick={() => navigate("/ChainOfCustody", { state: { caseDetails } } )}>
              View Lead Chain of Custody
            </li>
             )}
          </ul>

            )}
                </div> */}
                  <SideBar  activePage="CasePageManager" />
                <div className="left-content">

                <div className="top-menu" style={{ marginTop: '2px', backgroundColor: '#3333330e' }}>
       <div className="menu-items" style={{ fontSize: '19px' }}>
       
        <span className="menu-item" style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRInstruction')}>
            Instructions
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRReturn')}>
            Narrative
          </span>
          <span className="menu-item " style={{fontWeight: '400' }} onClick={() => handleNavigation('/LRPerson')} >
            Person
          </span>
           <span className="menu-item active" style={{fontWeight: '600' }} onClick={() => handleNavigation('/LRPerson1')} >
            Add Person
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVehicle')} >
            Vehicles
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREnclosures')} >
            Enclosures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LREvidence')} >
            Evidence
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRPictures')} >
            Pictures
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRAudio')} >
            Audio
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRVideo')}>
            Videos
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRScratchpad')}>
            Notes
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRTimeline')}>
            Timeline
          </span>
          <span className="menu-item" style={{fontWeight: '400' }}  onClick={() => handleNavigation('/LRFinish')}>
            Finish
          </span>
         </div> </div>
   
                <div className = "LRI-content-section">

<div className = "content-subsection">

     {/* Main Content */}
     {/* <div className="form-container1"> */}
        <table className="person-table2">
          <tbody>
            <tr>
              <td>Date Entered *</td>
              <td>
                <input
                  type="date"
                  value={formData.dateEntered}
                  className="input-large"
                  onChange={(e) => handleChange("dateEntered", e.target.value)}
                />
              </td>
              <td>Narrative Id *</td>
              <td>
                <input
                  type="leadReturn"
                  value={formData.leadReturnId}
                  className="input-large"
                  onChange={(e) => handleChange("leadReturnId", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Last Name </td>
              <td>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
              </td>
              <td>First Name *</td>
              <td>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>MI</td>
              <td>
                <input
                  type="text"
                  value={formData.mi}
                  onChange={(e) => handleChange("mi", e.target.value)}
                />
              </td>
              <td>Suffix</td>
              <td>
                <input
                  type="text"
                  value={formData.suffix}
                  onChange={(e) => handleChange("suffix", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Cell Number</td>
              <td>
                <input
                  type="text"
                  value={formData.cellNumber}
                  onChange={(e) => handleChange("cellNumber", e.target.value)}
                />
              </td>

              <td>Alias</td>
              <td>
                <input
                  type="text"
                  value={formData.Alias}
                  onChange={(e) => handleChange("Alias", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Street 1</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.street1}
                  onChange={(e) => handleChange("street1", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Street 2</td>
              <td colSpan="3">
                <input
                  type="text"
                  value={formData.street2}
                  onChange={(e) => handleChange("street2", e.target.value)}
                />
              </td>
            </tr>
            <tr>
                 <td>Business Name</td>
              <td>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                />
              </td>
              <td>Apartment</td>
              <td>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => handleChange("apartment", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>City</td>
              <td>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </td>
              <td>State</td>
              <td>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Zip Code</td>
              <td colSpan="1">
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                />
              </td>
              <td>Age</td>
              <td><input type="text" /></td>

            </tr>

            <tr>
              <td>SSN</td>
              <td><input type="text" /></td>
              
              <td>Occupation</td>
              <td><input type="text" /></td>
            </tr>

                {/* Second Row */}
                <tr>
              <td>Email</td>
              <td colSpan="3"><input type="email" /></td>
            </tr>

            {/* Fourth Row */}
            <tr>
                    <td>Person Type</td>
                    <td>
                      <select
                        value={formData.personType}
                        onChange={(e) => handleChange('personType', e.target.value)}
                      >
                        <option value="">Select Type</option>
                        <option value="Suspect">Suspect</option>
                        <option value="Victim">Victim</option>
                        <option value="Witness">Witness</option>
                        <option value="Officer">Officer</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Condition</td>
                    <td>
                      <select
                        value={formData.condition}
                        onChange={(e) => handleChange('condition', e.target.value)}
                      >
                        <option value="">Select Condition</option>
                        <option value="Cooperative">Cooperative</option>
                        <option value="Uncooperative">Uncooperative</option>
                        <option value="Injured">Injured</option>
                        <option value="Deceased">Deceased</option>
                      </select>
                    </td>
                  </tr>

            {/* Fifth Row */}
            <tr>
                    <td>Caution Type</td>
                    <td>
                      <select
                        value={formData.cautionType}
                        onChange={(e) => handleChange('cautionType', e.target.value)}
                      >
                        <option value="">Select Type</option>
                        <option value="Armed">Armed</option>
                        <option value="Unarmed">Unarmed</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Sex</td>
                    <td>
                      <select
                        value={formData.sex}
                        onChange={(e) => handleChange('sex', e.target.value)}
                      >
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>

            {/* Sixth Row */}
            <tr>
                    <td>Race</td>
                    <td>
                      <select
                        value={formData.race}
                        onChange={(e) => handleChange('race', e.target.value)}
                      >
                        <option value="">Select Race</option>
                        <option value="White">White</option>
                        <option value="Black">Black or African American</option>
                        <option value="Asian">Asian</option>
                        <option value="Native American">Native American</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Ethnicity</td>
                    <td>
                      <select
                        value={formData.ethnicity}
                        onChange={(e) => handleChange('ethnicity', e.target.value)}
                      >
                        <option value="">Select Ethnicity</option>
                        <option value="Hispanic">Hispanic or Latino</option>
                        <option value="Non-Hispanic">Not Hispanic or Latino</option>
                      </select>
                    </td>
                  </tr> 

            {/* Seventh Row */}
            <tr>
                    <td>Skin Tone</td>
                    <td>
                      <select value={formData.skinTone} onChange={(e) => handleChange('skinTone', e.target.value)}>
                        <option value="">Select Skin Tone</option>
                        <option value="Light">Light</option>
                        <option value="Medium">Medium</option>
                        <option value="Dark">Dark</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>Eye Color</td>
                    <td>
                      <select value={formData.eyeColor} onChange={(e) => handleChange('eyeColor', e.target.value)}>
                        <option value="">Select Eye Color</option>
                        <option value="Brown">Brown</option>
                        <option value="Blue">Blue</option>
                        <option value="Green">Green</option>
                        <option value="Hazel">Hazel</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>Glasses</td>
                    <td>
                      <select value={formData.glasses} onChange={(e) => handleChange('glasses', e.target.value)}>
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td>Hair Color</td>
                    <td>
                      <select value={formData.hairColor} onChange={(e) => handleChange('hairColor', e.target.value)}>
                        <option value="">Select Hair Color</option>
                        <option value="Black">Black</option>
                        <option value="Brown">Brown</option>
                        <option value="Blonde">Blonde</option>
                        <option value="Red">Red</option>
                        <option value="Gray">Gray</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>
                       {/* Ninth Row */}
            <tr>
              <td>Height</td>
              <td>
                <input type="text" style={{ width: "40px" }} /> '
                <input type="text" style={{ width: "40px" }} /> "
              </td>
              <td>Weight</td>
              <td><input type="text" /></td>
            </tr>

                  <tr>
                    <td>Tattoo</td>
                    <td><input type="text"  value={formData.tattoo}
                    onChange={(e) =>
                      handleChange("tattoo", e.target.value)
                    } /></td>
                    
                    <td>Scar</td>
              
                    <td><input type="text"  value={formData.scar}
                    onChange={(e) =>
                      handleChange("scar", e.target.value)
                    } /></td>
                    
                  </tr>
                  <tr>
                    <td>Mark</td>
                    {/* <td colSpan="7"> */}
                    <td><input type="text"  value={formData.mark}
                    onChange={(e) =>
                      handleChange("mark", e.target.value)
                    } /></td>
      
                  </tr>
                  {/* Miscellaneous Section */}
                  <tr>
                    <td colSpan="4">
                      <h4>Miscellaneous Information</h4>
                      <table className="misc-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {miscDetails.map((row, i) => (
                            <tr key={i}>
                              <td>
                                <input
                                  type="text"
                                  placeholder="Category"
                                  value={row.category}
                                  onChange={e => handleInputChange(i, "category", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  placeholder="Value"
                                  value={row.value}
                                  onChange={e => handleInputChange(i, "value", e.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button type="button" className ="save-btn1" onClick={addNewRow}>
                        + Add Category / Value
                      </button>
                    </td>
                  </tr>

          </tbody>
        </table>
        

        {/* Buttons */}
        <div className="form-buttons">
       
          <button className="save-btn1" onClick={handleSave}>Save</button>
          {/* <button className="cancel-btn">Cancel</button> */}
        </div>
      {/* </div> */}
        
      </div>
      </div>
      <FootBar
        onPrevious={() => navigate(-1)} // Takes user to the last visited page
        onNext={() => navigate("/LRVehicle")} // Takes user to CM Return page
      />
    </div>
    </div>
    </div>
  );
};