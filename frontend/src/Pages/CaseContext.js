import React, { createContext, useState, useEffect } from "react";

export const CaseContext = createContext();

export const CaseProvider = ({ children }) => {
    // Load from localStorage or initialize with null

    const CASE_KEY  = "selectedCase";
    const LEAD_KEY  = "selectedLead";
    const TOKEN_KEY = "token";

    const [selectedCase, setSelectedCase] = useState(() => {
    const v = sessionStorage.getItem(CASE_KEY);
    return v ? JSON.parse(v) : null;
  });
  const [selectedLead, setSelectedLead] = useState(() => {
    const v = sessionStorage.getItem(LEAD_KEY);
    return v ? JSON.parse(v) : null;
  });
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  });


    // const [selectedCase, setSelectedCase] = useState(() => {
    //     const storedCase = localStorage.getItem("selectedCase");
    //     return storedCase ? JSON.parse(storedCase) : null;
    // });

    // const [selectedLead, setSelectedLead] = useState(() => {
    //     const storedLead = localStorage.getItem("selectedLead");
    //     return storedLead ? JSON.parse(storedLead) : null;
    // });

    const [selectedReports, setSelectedReports] = useState({
        leadInstruction: false,
        leadReturn: false,
        leadPersons: false,
        leadVehicles: false,
        leadEnclosures: false,
        leadEvidence: false,
        leadPictures: false,
        leadAudio: false,
        leadVideos: false,
        leadScratchpad: false,
        leadTimeline: false,
      });


    // const [token, setToken] = useState(() => {
    //     return localStorage.getItem("token") || "";
    // });

    useEffect(() => {
    if (selectedCase !== null) {
      sessionStorage.setItem(CASE_KEY, JSON.stringify(selectedCase));
    }
  }, [selectedCase]);

  useEffect(() => {
    if (selectedLead !== null) {
      sessionStorage.setItem(LEAD_KEY, JSON.stringify(selectedLead));
    }
  }, [selectedLead]);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }, [token]);
  

    const [refreshKey, setRefreshKey] = useState(0); // <- key to force re-fetch
    const triggerRefresh = () => setRefreshKey(prev => prev + 1); // <- call this when a change happens

    const [leadInstructions, setLeadInstructions] = useState(null);
    const [leadReturns, setLeadReturns] = useState(null);
    const [leadPersons, setLeadPersons] = useState(null);
    const [leadVehicles, setleadVehicles] = useState(null);
    const [leadEnclosures, setleadEnclosures] = useState(null);
    const [leadEvidence, setleadEvidence] = useState(null);
    const [leadPictures, setleadPictures] = useState(null);
    const [leadAudio, setleadAudio] = useState(null);
    const [leadVideos, setleadVideos] = useState(null);
    const [leadStatus, setLeadStatus] = useState("");

    // Persist case details when updated
    useEffect(() => {
        if (selectedCase) {
            localStorage.setItem("selectedCase", JSON.stringify(selectedCase));
        }
    }, [selectedCase]);

    // Persist lead details when updated
    useEffect(() => {
        if (selectedLead) {
            localStorage.setItem("selectedLead", JSON.stringify(selectedLead));
        }
    }, [selectedLead]);

    // Persist token when updated
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        }
    }, [token]);

    // Define the helper function for auto-refreshing
    const withAutoRefresh = async (action) => {
        try {
            await action();
            window.location.reload();
        } catch (error) {
            console.error("Error in action:", error);
        }
    };

    return (
        <CaseContext.Provider value={{ 
            selectedCase, setSelectedCase, 
            selectedLead, setSelectedLead, 
            token, setToken, 
            leadInstructions, setLeadInstructions,
            leadReturns, setLeadReturns,
            leadPersons, setLeadPersons,
            selectedReports, setSelectedReports,
            withAutoRefresh, leadStatus,         
            setLeadStatus,
            refreshKey, triggerRefresh
        }}>
            {children}
        </CaseContext.Provider>
    );
};
