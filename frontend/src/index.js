import React from 'react';
import ReactDOM from 'react-dom/client';
import { DataProvider } from "./Pages/Context/DataContext";

import './index.css';
import App from './App';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//     <App />
// );

const root = ReactDOM.createRoot(document.getElementById("root")); // ✅ Use createRoot()
root.render(
  <React.StrictMode>
    <DataProvider>  {/* ✅ Wrap App inside DataProvider */}
      <App />
    </DataProvider>
  </React.StrictMode>
);
