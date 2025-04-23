import React from "react";
import ReactDOM from "react-dom/client";
import { CaseProvider } from "./Pages/CaseContext";  // Import CaseProvider
import { DataProvider } from "./Pages/Context/DataContext"; // Import DataProvider
import { BrowserRouter as Router } from "react-router-dom";

import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
      <Router> 
    <CaseProvider>  {/* ✅ Wrap App inside CaseProvider */}
      <DataProvider>  {/* ✅ Wrap App inside DataProvider */}
        <App />
      </DataProvider>
    </CaseProvider>
    </Router>
  </React.StrictMode>
);
