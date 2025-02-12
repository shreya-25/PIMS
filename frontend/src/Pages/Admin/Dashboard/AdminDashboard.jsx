// import React from "react";
// import { Bar, Line, Pie } from "react-chartjs-2";
// import { MapContainer, TileLayer, Marker } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// export const AdminCM = () => {
//   const barData = {
//     labels: ["2013", "2014"],
//     datasets: [
//       {
//         label: "Incidents per Year",
//         data: [123, 86],
//         backgroundColor: ["gray", "lightgray"],
//       },
//     ],
//   };

//   const lineData = {
//     labels: ["Jan 13", "Feb 13", "Mar 13", "Apr 13", "May 13", "Jun 13"],
//     datasets: [
//       {
//         label: "Incidents per Month",
//         data: [5, 8, 10, 15, 7, 12],
//         borderColor: "blue",
//         fill: false,
//       },
//     ],
//   };

//   const pieData = {
//     labels: ["Violent", "Property", "Warrant", "Traffic", "Disturb"],
//     datasets: [
//       {
//         data: [32, 21, 14, 9, 7],
//         backgroundColor: ["red", "blue", "orange", "green", "gray"],
//       },
//     ],
//   };

//   return (
//     <div className="grid grid-cols-3 gap-4 p-4">
//       {/* Incidents per Year */}
//       <div className="bg-white p-4 shadow rounded">
//         <h2 className="text-lg font-bold">Incidents per Year</h2>
//         <Bar data={barData} />
//       </div>
      
//       {/* Incidents per Month */}
//       <div className="bg-white p-4 shadow rounded col-span-2">
//         <h2 className="text-lg font-bold">Incidents per Month</h2>
//         <Line data={lineData} />
//       </div>
      
//       {/* Call Type Distribution */}
//       <div className="bg-white p-4 shadow rounded">
//         <h2 className="text-lg font-bold">Original Call Type</h2>
//         <Pie data={pieData} />
//       </div>
      
//       {/* Map with Incidents */}
//       <div className="bg-white p-4 shadow rounded col-span-2">
//         <h2 className="text-lg font-bold">Incident Map</h2>
//         <MapContainer center={[40.7128, -74.006]} zoom={12} className="h-64 w-full">
//           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//           <Marker position={[40.7128, -74.006]} />
//         </MapContainer>
//       </div>
//     </div>
//   );
// };

import React from "react";
import Navbar from '../../../components/Navbar/Navbar';
import "./AdminDashboard.css"; // Import custom CSS

export const AdminDashboard = () => {
  return (
    <div>
      <Navbar />
    <div className="dashboard">
      {/* Incidents per Year */}
      <div className="card">
        <h2>Incidents per Year</h2>
        <div className="bar-chart">
          <div className="bar" style={{ height: "60%" }}>2013 (123)</div>
          <div className="bar" style={{ height: "40%" }}>2014 (86)</div>
        </div>
      </div>

      {/* Incidents per Month */}
      <div className="card wide">
        <h2>Incidents per Month</h2>
        <svg className="line-chart" viewBox="0 0 100 50">
          <polyline points="10,40 20,30 30,35 40,25 50,30 60,20 70,15 80,10" stroke="blue" fill="none" strokeWidth="2"/>
        </svg>
      </div>

      {/* Call Type Distribution */}
      <div className="card">
        <h2>Original Call Type</h2>
        <div className="pie-chart">
          <div className="slice violent"></div>
          <div className="slice property"></div>
          <div className="slice warrant"></div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="card wide">
        <h2>Incident Map</h2>
        <div className="map-placeholder">[Map Here]</div>
      </div>
    </div>
    </div>
  );
};
