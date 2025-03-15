import React from "react";
import ReactDOM from "react-dom/client";
import { CaseProvider } from "./Pages/CaseContext";  // Import CaseProvider
import { DataProvider } from "./Pages/Context/DataContext"; // Import DataProvider
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <CaseProvider>  {/* ✅ Wrap App inside CaseProvider */}
      <DataProvider>  {/* ✅ Wrap App inside DataProvider */}
        <App />
      </DataProvider>
    </CaseProvider>
  </React.StrictMode>
);
