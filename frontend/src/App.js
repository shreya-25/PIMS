import './App.css';
import React, { useContext, useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
import useTokenExpiryRedirect from "./useTokenExpiryRedirect";
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import {Login} from './Pages/Login/Login';
import {LoginAdmin} from './Pages/LoginAdmin/LoginAdmin';
import {Register} from './Pages/Register/Register';
import {RegisterAdmin} from './Pages/RegisterAdmin/RegisterAdmin';
import {HomePage} from './Pages/HomePage/HomePage';
import {CasePageManager} from './Pages/CasePageManager/CasePageManager';
import {Investigator} from './Pages/Investigator/Investigator';
import {CreateLead} from './Pages/CreateLead/CreateLead';
import { LeadLog } from './Pages/LeadLog/LeadLog';
import { LeadHierarchy1 } from './Pages/LeadHierarchy/LeadHierarchy1';
import { CaseScratchpad } from './Pages/CaseScratchpad/CaseScratchpad';
import { LeadReturn } from './Pages/LeadReturn/LeadReturn';
import { LRInstruction } from './Pages/InvestgatorLR/LRInstruction/LRInstruction';
import { LRReturn } from './Pages/InvestgatorLR/LRReturn/LRReturn';
import { LRPerson } from './Pages/InvestgatorLR/LRPerson/LRPerson';
import { LRPerson1 } from './Pages/InvestgatorLR/LRPerson1/LRPerson1';
import { LRPerson2 } from './Pages/InvestgatorLR/LRPerson2/LRPerson2';
import { LRVehicle } from './Pages/InvestgatorLR/LRVehicle/LRVehicle';
import { LREnclosures } from './Pages/InvestgatorLR/LREnclosures/LREnclosures';
import { LREvidence } from './Pages/InvestgatorLR/LREvidence/LREvidence';
import { LRPictures } from './Pages/InvestgatorLR/LRPictures/LRPictures';
import { LRAudio } from './Pages/InvestgatorLR/LRAudio/LRAudio';
import { LRVideo } from './Pages/InvestgatorLR/LRVideo/LRVideo';
import { LRScratchpad } from './Pages/InvestgatorLR/LRScratchpad/LRScratchpad';
import { LRTimeline } from './Pages/InvestgatorLR/LRTimeline/LRTimeline';
import { LRFinish } from './Pages/InvestgatorLR/LRFinish/LRFinish';
import { CMInstruction } from './Pages/CaseManagerLR/CMInstruction/CMInstruction';
import { CMReturn } from './Pages/CaseManagerLR/CMReturn/CMReturn';
import { CMPerson } from './Pages/CaseManagerLR/CMPerson/CMPerson';
import { CMPerson1 } from './Pages/CaseManagerLR/CMPerson1/CMPerson1';
import { CMPerson2 } from './Pages/CaseManagerLR/CMPerson2/CMPerson2';
import { CMVehicle } from './Pages/CaseManagerLR/CMVehicle/CMVehicle';
import { CMEnclosures } from './Pages/CaseManagerLR/CMEnclosures/CMEnclosures';
import { CMEvidence } from './Pages/CaseManagerLR/CMEvidence/CMEvidence';
import { CMPictures } from './Pages/CaseManagerLR/CMPictures/CMPictures';
import { CMAudio } from './Pages/CaseManagerLR/CMAudio/CMAudio';
import { CMVideo } from './Pages/CaseManagerLR/CMVideo/CMVideo';
import { CMScratchpad } from './Pages/CaseManagerLR/CMScratchpad/CMScratchpad';
import { CMTimeline } from './Pages/CaseManagerLR/CMTimeline/CMTimeline';
import { CMFinish } from './Pages/CaseManagerLR/CMFinish/CMFinish';
import { FlaggedLead } from './Pages/FlaggedLead/FlaggedLead';
import { SearchLead } from './Pages/SearchLead/SearchLead';
import { ViewTimeline } from './Pages/ViewTimeline/ViewTimeline';
import { AdminCM } from './Pages/Admin/AdminCM';
import { AdminCM1 } from './Pages/Admin/AdminCM1';
import { AdminUR } from './Pages/Admin/AdminUR';
import { AdminSC } from './Pages/Admin/AdminSC';
import { AdminSP } from './Pages/Admin/AdminSP';
import { AdminDB } from './Pages/Admin/AdminDB';
import { AdminDashboard } from './Pages/Admin/Dashboard/AdminDashboard';
import { OfficerManagement } from './Pages/OfficerManagement/OfficerManagement';
import { LeadInfo } from './Pages/LeadInfo/LeadInfo';
import { CaseInformation } from './Pages/CaseInformation/CaseInformation';
import {LeadReview} from './Pages/LeadReview/LeadReview';
import { LeadsDesk } from './Pages/LeadsDesk/LeadsDesk';
import { LeadsDeskTest } from './Pages/LeadsDeskTest/LeadsDeskTest';
import { LeadsDeskContent } from './Pages/LeadsDeskContent/LeadsDeskContent';
import { ChainOfCustody } from './Pages/ChainOfCustody/ChainOfCustody';
import { Chatbot } from './Pages/Admin/Chatbot';
// import { Report} from './Pages/Report/Report'
// import {ReportWrapper} from './Pages/Report/ReportWrapper'
import { LeadsDeskTestExecSummary} from './Pages/LeadsDeskTest/LeadsDeskTestExecSummary';
import ProtectedLayout from './protectedLayout';


function App() {

  useEffect(() => {
    const handler = (e) => {
      // check any key in sessionStorage that you want to guard
      if (
        sessionStorage.getItem("selectedCase") ||
        sessionStorage.getItem("selectedLead") ||
        sessionStorage.getItem("token")
      ) {
        const msg = "You have unsaved changes—are you sure you want to leave?";
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);


  useTokenExpiryRedirect(); 
  return (
    <ErrorBoundary>
      <Routes>
        {/* Define the route for Login */}
        <Route path="/" element={<Login />} />
        <Route path="/LoginAdmin" element={<LoginAdmin />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/RegisterAdmin" element={<RegisterAdmin />} />
        <Route path="/HomePage" element={<ProtectedLayout> <HomePage /> </ProtectedLayout>} />
        <Route path="/CasePageManager" element={<ProtectedLayout><CasePageManager /> </ProtectedLayout>} />
        <Route path="/Investigator" element={<ProtectedLayout> <Investigator /> </ProtectedLayout>} />
        <Route path="/CreateLead" element={<ProtectedLayout> <CreateLead /> </ProtectedLayout>} />
        <Route path="/leadlog" element={<ProtectedLayout> <LeadLog /> </ProtectedLayout>} />
        <Route path="/FlaggedLead" element={<ProtectedLayout> <FlaggedLead /> </ProtectedLayout>} />
        <Route path="/LeadHierarchy1" element={<LeadHierarchy1 />} />
        <Route path="/CaseScratchpad" element={<ProtectedLayout> <CaseScratchpad /> </ProtectedLayout>} />
        <Route path="/LeadReturn" element={<ProtectedLayout> <LeadReturn /> </ProtectedLayout>} />
        <Route path="/LRInstruction" element={<ProtectedLayout> <LRInstruction /> </ProtectedLayout>} />
        <Route path="/LRReturn" element={<ProtectedLayout> <LRReturn /> </ProtectedLayout>} />
        <Route path="/LRPerson" element={<ProtectedLayout> <LRPerson /> </ProtectedLayout>} />
        <Route path="/LRPerson1" element={<ProtectedLayout> <LRPerson1 /> </ProtectedLayout>} />
        <Route path="/LRPerson2" element={<ProtectedLayout>  <LRPerson2 />  </ProtectedLayout>} />
        <Route path="/LRVehicle" element={<ProtectedLayout> <LRVehicle /> </ProtectedLayout>} />
        <Route path="/LREnclosures" element={<ProtectedLayout> <LREnclosures /> </ProtectedLayout> } />
        <Route path="/LREvidence" element={<ProtectedLayout> <LREvidence /> </ProtectedLayout> } />
        <Route path="/LRPictures" element={<ProtectedLayout>  <LRPictures /> </ProtectedLayout> } />
        <Route path="/LRAudio" element={<ProtectedLayout> <LRAudio /> </ProtectedLayout> } />
        <Route path="/LRVideo" element={<ProtectedLayout> <LRVideo /> </ProtectedLayout> } />
        <Route path="/LRFinish" element={<ProtectedLayout> <LRFinish /> </ProtectedLayout> } />
        <Route path="/LRScratchpad" element={<ProtectedLayout>  <LRScratchpad /> </ProtectedLayout> } />
        <Route path="/SearchLead" element={<ProtectedLayout>   <SearchLead /> </ProtectedLayout>} />
        <Route path="/LRTimeline" element={<ProtectedLayout><LRTimeline /> </ProtectedLayout>} />
        <Route path="/ViewTimeline" element={<ProtectedLayout> <ViewTimeline /> </ProtectedLayout>} />
        <Route path="/AdminCM" element={<ProtectedLayout> <AdminCM /> </ProtectedLayout>} />
        <Route path="/AdminCM1" element={<ProtectedLayout>  <AdminCM1 />  </ProtectedLayout>} />
        <Route path="/AdminUR" element={<ProtectedLayout> <AdminUR /> </ProtectedLayout>} />
        <Route path="/AdminSC" element={<ProtectedLayout>  <AdminSC />  </ProtectedLayout>} />
        <Route path="/AdminSP" element={<ProtectedLayout> <AdminSP />  </ProtectedLayout>} />
        <Route path="/AdminDB" element={<ProtectedLayout> <AdminDB /> </ProtectedLayout>} />
        <Route path="/OfficerManagement" element={<ProtectedLayout>  <OfficerManagement />  </ProtectedLayout>} />
        <Route path="/LeadInfo" element={<ProtectedLayout>  <LeadInfo />  </ProtectedLayout>} />
        <Route path="/CMInstruction" element={<ProtectedLayout>   <CMInstruction />   </ProtectedLayout>} />
        <Route path="/CMReturn" element={<ProtectedLayout>  <CMReturn />  </ProtectedLayout>} />
        <Route path="/CMPerson" element={<ProtectedLayout>  <CMPerson />  </ProtectedLayout>} />
        <Route path="/CMPerson1" element={<ProtectedLayout>  <CMPerson1 />  </ProtectedLayout>} />
        <Route path="/CMPerson2" element={<ProtectedLayout>  <CMPerson2 />  </ProtectedLayout>} />
        <Route path="/CMVehicle" element={<ProtectedLayout> <CMVehicle /> </ProtectedLayout>} />
        <Route path="/CMEnclosures" element={<ProtectedLayout>  <CMEnclosures />  </ProtectedLayout>} />
        <Route path="/CMEvidence" element={<ProtectedLayout> <CMEvidence /> </ProtectedLayout>} />
        <Route path="/CMPictures" element={<ProtectedLayout> <CMPictures /> </ProtectedLayout>} />
        <Route path="/CMAudio" element={<ProtectedLayout>  <CMAudio />  </ProtectedLayout>} />
        <Route path="/CMVideo" element={<ProtectedLayout>  <CMVideo />  </ProtectedLayout>} />
        <Route path="/CMFinish" element={<ProtectedLayout> <CMFinish /> </ProtectedLayout>} />
        <Route path="/CMScratchpad" element={<ProtectedLayout> <CMScratchpad /> </ProtectedLayout>} />
        <Route path="/CMTimeline" element={<ProtectedLayout> <CMTimeline /> </ProtectedLayout>} />
        <Route path="/AdminDashboard" element={<ProtectedLayout> <AdminDashboard /> </ProtectedLayout>} />
        <Route path="/CaseInformation" element={<ProtectedLayout>  <CaseInformation /> </ProtectedLayout> } />
        <Route path="/LeadReview" element = {<ProtectedLayout> <LeadReview /> </ProtectedLayout> } />
        <Route path="/LeadsDesk" element= {<ProtectedLayout>  <LeadsDesk /> </ProtectedLayout> } />
        <Route path="/LeadsDeskTest" element= {<ProtectedLayout>  <LeadsDeskTest /> </ProtectedLayout> } />
        <Route path="/LeadsDeskTestExecSummary" element= {<ProtectedLayout>  <LeadsDeskTestExecSummary /> </ProtectedLayout> } />
        <Route path="/LeadsDeskContent" element= {<ProtectedLayout>  <LeadsDeskContent /> </ProtectedLayout> } />
        <Route path="/ChainOfCustody" element= {<ProtectedLayout>  <ChainOfCustody /> </ProtectedLayout> } />
        <Route path="/Chatbot" element= {<ProtectedLayout>  <Chatbot /> </ProtectedLayout> } />
        {/* <Route path ="/Report" element= {<Report />} /> */}
      </Routes>
      </ErrorBoundary>
  );
}
  // return <Login />;

export default App;
