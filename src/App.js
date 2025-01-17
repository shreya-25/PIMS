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
import { LRFinish } from './Pages/LRFinish/LRFinish';
import { FlaggedLead } from './Pages/FlaggedLead/FlaggedLead';

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
      </Routes>
    </Router>
  );
}
  // return <Login />;

export default App;
