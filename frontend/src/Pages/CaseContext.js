import React, { createContext, useState, useEffect } from "react";

export const CaseContext = createContext();

export const CaseProvider = ({ children }) => {
    // Load from localStorage or initialize with null

    const CASE_KEY  = "selectedCase";
    const LEAD_KEY  = "selectedLead";
    const TOKEN_KEY = "token";

    // Emergency: Clear corrupted storage if it exists
    // This runs once on component mount to ensure clean state
    try {
      const testKeys = [CASE_KEY, LEAD_KEY];
      testKeys.forEach(key => {
        try {
          const val = sessionStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            // If it's an array or primitive, clear it immediately
            if (Array.isArray(parsed) || (typeof parsed !== 'object') || parsed === null) {
              console.warn(`Clearing invalid ${key} from sessionStorage (type: ${typeof parsed}, isArray: ${Array.isArray(parsed)})`);
              sessionStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.warn(`Clearing corrupted ${key} from sessionStorage:`, e);
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("Emergency storage cleanup failed:", e);
    }

    // Helper function to safely parse and validate storage data
    const safeParseStorage = (key, storageName = 'sessionStorage') => {
      try {
        const storage = storageName === 'sessionStorage' ? sessionStorage : localStorage;
        const value = storage.getItem(key);
        if (!value) return null;

        const parsed = JSON.parse(value);

        // Validate that parsed value is a plain object (not an array or other type)
        if (parsed === null) return null;
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }

        console.warn(`Invalid data type for ${key} in ${storageName}:`, typeof parsed, parsed);
        storage.removeItem(key);
        return null;
      } catch (error) {
        console.error(`Error parsing ${key} from ${storageName}:`, error);
        try {
          const storage = storageName === 'sessionStorage' ? sessionStorage : localStorage;
          storage.removeItem(key);
        } catch (e) {
          console.error(`Failed to remove corrupted ${key}:`, e);
        }
        return null;
      }
    };

    const [selectedCase, setSelectedCase] = useState(() => safeParseStorage(CASE_KEY));
  const [selectedLead, setSelectedLead] = useState(() => safeParseStorage(LEAD_KEY));
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
    const [leadReturns, setLeadReturns] = useState([]);
    const [leadPersons, setLeadPersons] = useState(null);
    const [leadVehicles, setLeadVehicles] = useState(null);
    const [leadEnclosures, setLeadEnclosures] = useState(null);
    const [leadEvidence, setLeadEvidence] = useState(null);
    const [leadPictures, setLeadPictures] = useState(null);
    const [leadAudio, setLeadAudio] = useState(null);
    const [leadVideos, setLeadVideos] = useState(null);
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
            leadVehicles, setLeadVehicles,
            leadEnclosures, setLeadEnclosures,
            selectedReports, setSelectedReports,
            withAutoRefresh, leadStatus,
            setLeadStatus,
            refreshKey, triggerRefresh
        }}>
            {children}
        </CaseContext.Provider>
    );
};
