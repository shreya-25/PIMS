import './App.css';
import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {Login} from './Pages/Login/Login';
import {LoginAdmin} from './Pages/LoginAdmin/LoginAdmin';
import {Register} from './Pages/Register/Register';
import {RegisterAdmin} from './Pages/RegisterAdmin/RegisterAdmin';
import {MainPage} from './Pages/MainPage/MainPage';
import {CasePageManager} from './Pages/CasePageManager/CasePageManager';
import {Investigator} from './Pages/Investigator/Investigator';
import {CreateLead} from './Pages/CreateLead/CreateLead';
import { LeadLog } from './Pages/LeadLog/LeadLog';
import { LeadHierarchy } from './Pages/LeadHierarchy/LeadHierarchy';
import { CaseScratchpad } from './Pages/CaseScratchpad/CaseScratchpad';
import { LeadReturn } from './Pages/LeadReturn/LeadReturn';
import { LRInstruction } from './Pages/LRInstruction/LRInstruction';
import { LRReturn } from './Pages/LRReturn/LRReturn';
import { LRPerson } from './Pages/LRPerson/LRPerson';
import { LRPerson1 } from './Pages/LRPerson1/LRPerson1';
import { LRPerson2 } from './Pages/LRPerson2/LRPerson2';
import { LRVehicle } from './Pages/LRVehicle/LRVehicle';
import { LREnclosures } from './Pages/LREnclosures/LREnclosures';
import { LREvidence } from './Pages/LREvidence/LREvidence';
import { LRPictures } from './Pages/LRPictures/LRPictures';
import { LRAudio } from './Pages/LRAudio/LRAudio';
import { LRVideo } from './Pages/LRVideo/LRVideo';
import { LRScratchpad } from './Pages/LRScratchpad/LRScratchpad';
import { LRTimeline } from './Pages/LRTimeline/LRTimeline';
import { LRFinish } from './Pages/LRFinish/LRFinish';
import { FlaggedLead } from './Pages/FlaggedLead/FlaggedLead';
import { SearchLead } from './Pages/SearchLead/SearchLead';
import { ViewTimeline } from './Pages/ViewTimeline/ViewTimeline';
import { AdminCM } from './Pages/Admin/AdminCM';
import { AdminCM1 } from './Pages/Admin/AdminCM1';
import { AdminUR } from './Pages/Admin/AdminUR';
import { AdminSC } from './Pages/Admin/AdminSC';
import { AdminSP } from './Pages/Admin/AdminSP';
import { AdminDB } from './Pages/Admin/AdminDB';
import { OfficerManagement } from './Pages/OfficerManagement/OfficerManagement';
import { LeadInfo } from './Pages/LeadInfo/LeadInfo';

function App() {
  return (
    <Router>
      <Routes>
        {/* Define the route for Login */}
        <Route path="/" element={<Login />} />
        <Route path="/LoginAdmin" element={<LoginAdmin />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/RegisterAdmin" element={<RegisterAdmin />} />
        <Route path="/MainPage" element={<MainPage />} />
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
      </Routes>
    </Router>
  );
}
  // return <Login />;

export default App;
