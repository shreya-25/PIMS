import React, { createContext, useState, useEffect } from "react";

export const CaseContext = createContext();

export const CaseProvider = ({ children }) => {
    // Load from localStorage or initialize with null
    const [selectedCase, setSelectedCase] = useState(() => {
        const storedCase = localStorage.getItem("selectedCase");
        return storedCase ? JSON.parse(storedCase) : null;
    });

    const [selectedLead, setSelectedLead] = useState(() => {
        const storedLead = localStorage.getItem("selectedLead");
        return storedLead ? JSON.parse(storedLead) : null;
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || "";
    });

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

    return (
        <CaseContext.Provider value={{ 
            selectedCase, setSelectedCase, 
            selectedLead, setSelectedLead, 
            token, setToken 
        }}>
            {children}
        </CaseContext.Provider>
    );
};
