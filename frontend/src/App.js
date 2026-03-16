import './App.css';
import React, { useContext, useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
import useTokenExpiryRedirect from "./useTokenExpiryRedirect";
import { AlertModal } from "./components/AlertModal/AlertModal";
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
import { CaseScratchpad } from './Pages/CaseScratchpad/CaseScratchpad';
import { LRInstruction } from './Pages/InvestgatorLR/LRInstruction/LRInstruction';
import { LRResult } from './Pages/InvestgatorLR/LRResult/LRResult';
import { LRPerson } from './Pages/InvestgatorLR/LRPerson/LRPerson';
import { LRPerson1 } from './Pages/InvestgatorLR/LRPerson1/LRPerson1';
import { LRVehicle } from './Pages/InvestgatorLR/LRVehicle/LRVehicle';
import { LREnclosures } from './Pages/InvestgatorLR/LREnclosures/LREnclosures';
import { LREvidence } from './Pages/InvestgatorLR/LREvidence/LREvidence';
import { LRPictures } from './Pages/InvestgatorLR/LRPictures/LRPictures';
import { LRAudio } from './Pages/InvestgatorLR/LRAudio/LRAudio';
import { LRVideo } from './Pages/InvestgatorLR/LRVideo/LRVideo';
import { LRScratchpad } from './Pages/InvestgatorLR/LRScratchpad/LRScratchpad';
import { LRTimeline } from './Pages/InvestgatorLR/LRTimeline/LRTimeline';
import { FlaggedLead } from './Pages/FlaggedLead/FlaggedLead';
import { SearchLead } from './Pages/SearchLead/SearchLead';
import { ViewTimeline } from './Pages/ViewTimeline/ViewTimeline';
import { ViewLR } from './Pages/ViewLR/ViewLR';
import { AdminUR } from './Pages/Admin/AdminUR';
import { AdminUserList } from './Pages/Admin/AdminUserList';
import { AdminUR2 } from './Pages/Admin/AdminUR2';
import {LeadReview} from './Pages/LeadReview/LeadReview';
import { LeadsDesk } from './Pages/LeadsDesk/LeadsDesk';
import { ChainOfCustody } from './Pages/ChainOfCustody/ChainOfCustody';
import { GlobalErrorProvider } from './GlobalErrorProvider';
import { DocumentReview } from './Pages/DocumentReview/DocumentReview';
import { ClosedCase } from './Pages/ClosedCase/ClosedCase';
import { LeadVersionHistory } from './Pages/LeadVersionHistory/LeadVersionHistory';
import { GenerateReport } from './Pages/GenerateReport/GenerateReport';
import ProtectedLayout from './protectedLayout';


function App() {

  // useEffect(() => {
  //   const handler = (e) => {
  //     // check any key in sessionStorage that you want to guard
  //     if (
  //       sessionStorage.getItem("selectedCase") ||
  //       sessionStorage.getItem("selectedLead") ||
  //       sessionStorage.getItem("token")
  //     ) {
  //       const msg = "You have unsaved changes—are you sure you want to leave?";
  //       e.returnValue = msg;
  //       return msg;
  //     }
  //   };
  //   window.addEventListener("beforeunload", handler);
  //   return () => window.removeEventListener("beforeunload", handler);
  // }, []);
const token = localStorage.getItem("token");
const { showExpiryWarning, dismissWarning } = useTokenExpiryRedirect(token);


  useTokenExpiryRedirect(); 
  return (
    <GlobalErrorProvider>
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
        <Route path="/CaseScratchpad" element={<ProtectedLayout> <CaseScratchpad /> </ProtectedLayout>} />
        <Route path="/LRInstruction" element={<ProtectedLayout> <LRInstruction /> </ProtectedLayout>} />
        <Route path="/LRReturn" element={<ProtectedLayout> <LRResult /> </ProtectedLayout>} />
        <Route path="/LRPerson" element={<ProtectedLayout> <LRPerson /> </ProtectedLayout>} />
        <Route path="/LRPerson1" element={<ProtectedLayout> <LRPerson1 /> </ProtectedLayout>} />
        <Route path="/LRVehicle" element={<ProtectedLayout> <LRVehicle /> </ProtectedLayout>} />
        <Route path="/LREnclosures" element={<ProtectedLayout> <LREnclosures /> </ProtectedLayout> } />
        <Route path="/LREvidence" element={<ProtectedLayout> <LREvidence /> </ProtectedLayout> } />
        <Route path="/LRPictures" element={<ProtectedLayout>  <LRPictures /> </ProtectedLayout> } />
        <Route path="/LRAudio" element={<ProtectedLayout> <LRAudio /> </ProtectedLayout> } />
        <Route path="/LRVideo" element={<ProtectedLayout> <LRVideo /> </ProtectedLayout> } />
        <Route path="/LRScratchpad" element={<ProtectedLayout>  <LRScratchpad /> </ProtectedLayout> } />
        <Route path="/SearchLead" element={<ProtectedLayout>   <SearchLead /> </ProtectedLayout>} />
        <Route path="/LRTimeline" element={<ProtectedLayout><LRTimeline /> </ProtectedLayout>} />
        <Route path="/ViewTimeline" element={<ProtectedLayout> <ViewTimeline /> </ProtectedLayout>} />
        <Route path="/AdminUR" element={<ProtectedLayout> <AdminUR /> </ProtectedLayout>} />
        <Route path="/AdminUserList" element={<ProtectedLayout> <AdminUserList /> </ProtectedLayout>} />
        <Route path="/AdminUR2" element={<ProtectedLayout> <AdminUR2 /> </ProtectedLayout>} />
        <Route path="/ViewLR" element={<ProtectedLayout> <ViewLR /> </ProtectedLayout>} />
        <Route path="/LeadReview" element = {<ProtectedLayout> <LeadReview /> </ProtectedLayout> } />
        <Route path="/LeadsDesk" element= {<ProtectedLayout>  <LeadsDesk /> </ProtectedLayout> } />
        <Route path="/LeadsDeskTestExecSummary" element= {<ProtectedLayout>  <GenerateReport /> </ProtectedLayout> } />
        <Route path="/GenerateReport" element= {<ProtectedLayout>  <GenerateReport /> </ProtectedLayout> } />
        <Route path="/ChainOfCustody" element= {<ProtectedLayout>  <ChainOfCustody /> </ProtectedLayout> } />
        <Route path="/DocumentReview" element={<ProtectedLayout><DocumentReview /></ProtectedLayout>} />
        <Route path="/ClosedCase" element={<ProtectedLayout><ClosedCase /></ProtectedLayout>} />
        <Route path="/LeadVersionHistory" element={<ProtectedLayout><LeadVersionHistory /></ProtectedLayout>} />
      </Routes>

           <AlertModal
        isOpen={showExpiryWarning}
        title="Session Expiring Soon"
        message="Your session will expire in 2 minutes. Please save your work."
        onConfirm={dismissWarning}
        onClose={dismissWarning}
      />
      
      </ErrorBoundary>
      </GlobalErrorProvider>

      
  );
}
  // return <Login />;

export default App;
