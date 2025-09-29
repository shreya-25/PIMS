import React from "react";
import ReactDOM from "react-dom/client";
import { CaseProvider } from "./Pages/CaseContext";  // Import CaseProvider
import { DataProvider } from "./Pages/Context/DataContext"; // Import DataProvider
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
const queryClient = new QueryClient();
root.render(
  <React.StrictMode>
    <div className="app-scale">
      <QueryClientProvider client={queryClient}>
      <Router> 
    <CaseProvider>  {/* ✅ Wrap App inside CaseProvider */}
      <DataProvider>  {/* ✅ Wrap App inside DataProvider */}
        <App />
      </DataProvider>
    </CaseProvider>
    </Router>
    </QueryClientProvider>
    </div>
  </React.StrictMode>
);
