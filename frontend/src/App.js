import './App.css';
import React from 'react';
import ReactDOM from "react-dom";
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {Login} from './Pages/Login/Login';
import {LoginAdmin} from './Pages/LoginAdmin/LoginAdmin';
import {Register} from './Pages/Register/Register';
import {RegisterAdmin} from './Pages/RegisterAdmin/RegisterAdmin';
import {HomePage} from './Pages/HomePage/HomePage';
import {CasePageManager} from './Pages/CasePageManager/CasePageManager';
import {Investigator} from './Pages/Investigator/Investigator';
import {CreateLead} from './Pages/CreateLead/CreateLead';
import { LeadLog } from './Pages/LeadLog/LeadLog';
import { LeadHierarchy } from './Pages/LeadHierarchy/LeadHierarchy';
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
import { DataProvider } from "./Pages/Context/DataContext";

ReactDOM.render(
  <React.StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Define the route for Login */}
        <Route path="/" element={<Login />} />
        <Route path="/LoginAdmin" element={<LoginAdmin />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/RegisterAdmin" element={<RegisterAdmin />} />
        <Route path="/HomePage" element={<HomePage />} />
        <Route path="/CasePageManager" element={<CasePageManager />} />
        <Route path="/Investigator" element={<Investigator />} />
        <Route path="/CreateLead" element={<CreateLead />} />
        <Route path="/leadlog" element={<LeadLog />} />
        <Route path="/FlaggedLead" element={<FlaggedLead />} />
        <Route path="/LeadHierarchy" element={<LeadHierarchy />} />
        <Route path="/CaseScratchpad" element={<CaseScratchpad />} />
        <Route path="/LeadReturn" element={<LeadReturn />} />
        <Route path="/LRInstruction" element={<LRInstruction />} />
        <Route path="/LRReturn" element={<LRReturn />} />
        <Route path="/LRPerson" element={<LRPerson />} />
        <Route path="/LRPerson1" element={<LRPerson1 />} />
        <Route path="/LRPerson2" element={<LRPerson2 />} />
        <Route path="/LRVehicle" element={<LRVehicle />} />
        <Route path="/LREnclosures" element={<LREnclosures />} />
        <Route path="/LREvidence" element={<LREvidence />} />
        <Route path="/LRPictures" element={<LRPictures />} />
        <Route path="/LRAudio" element={<LRAudio />} />
        <Route path="/LRVideo" element={<LRVideo />} />
        <Route path="/LRFinish" element={<LRFinish />} />
        <Route path="/LRScratchpad" element={<LRScratchpad />} />
        <Route path="/SearchLead" element={<SearchLead />} />
        <Route path="/LRTimeline" element={<LRTimeline />} />
        <Route path="/ViewTimeline" element={<ViewTimeline />} />
        <Route path="/AdminCM" element={<AdminCM />} />
        <Route path="/AdminCM1" element={<AdminCM1 />} />
        <Route path="/AdminUR" element={<AdminUR />} />
        <Route path="/AdminSC" element={<AdminSC />} />
        <Route path="/AdminSP" element={<AdminSP />} />
        <Route path="/AdminDB" element={<AdminDB />} />
        <Route path="/OfficerManagement" element={<OfficerManagement />} />
        <Route path="/LeadInfo" element={<LeadInfo />} />
        <Route path="/CMInstruction" element={<CMInstruction />} />
        <Route path="/CMReturn" element={<CMReturn />} />
        <Route path="/CMPerson" element={<CMPerson />} />
        <Route path="/CMPerson1" element={<CMPerson1 />} />
        <Route path="/CMPerson2" element={<CMPerson2 />} />
        <Route path="/CMVehicle" element={<CMVehicle />} />
        <Route path="/CMEnclosures" element={<CMEnclosures />} />
        <Route path="/CMEvidence" element={<CMEvidence />} />
        <Route path="/CMPictures" element={<CMPictures />} />
        <Route path="/CMAudio" element={<CMAudio />} />
        <Route path="/CMVideo" element={<CMVideo />} />
        <Route path="/CMFinish" element={<CMFinish />} />
        <Route path="/CMScratchpad" element={<CMScratchpad />} />
        <Route path="/CMTimeline" element={<CMTimeline />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/CaseInformation" element={<CaseInformation />} />
        <Route path="/LeadReview" element = {<LeadReview />} />
        <Route path="/LeadsDesk" element= {<LeadsDesk />} />
      </Routes>
    </Router>
  );
}
  // return <Login />;

export default App;
