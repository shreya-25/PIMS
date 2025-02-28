// import React, { useEffect } from "react";
// import Navbar from "../../../components/Navbar/Navbar";
// import "./AdminDashboard.css";
// import Papa from "papaparse";
// import Chart from "chart.js/auto";
// import L from "leaflet";

// export const AdminDashboard = () => {
//   useEffect(() => {
//     const csvUrl =
//       "https://corgis-edu.github.io/corgis/datasets/csv/state_crime/state_crime.csv";
//     const geoJsonUrl =
//       "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";
//     let dynamicData = [];
//     let barChartCrime,
//       lineChartTrend,
//       pieChartDistribution,
//       groupedBarChart,
//       scatterChart;
//     let geoJsonLayer, map;

//     // Dropdown and summary elements
//     const stateSelect = document.getElementById("state-select");
//     const yearSelect = document.getElementById("year-select");
//     const crimeTypeSelect = document.getElementById("crime-type-select");
//     const summaryPopulation = document.querySelector("#summary-population p");
//     const summaryViolentTotal = document.querySelector(
//       "#summary-violent-total p"
//     );
//     const summaryPropertyTotal = document.querySelector(
//       "#summary-property-total p"
//     );
//     const summaryViolentRate = document.querySelector("#summary-violent-rate p");

//     // Helper functions to process data
//     const getBarChartData = (year) => {
//       return dynamicData
//         .filter((d) => d.Year === year)
//         .map((d) => ({
//           state: d.State,
//           rate: parseFloat(d["Data.Rates.Violent.All"]) || 0,
//         }))
//         .sort((a, b) => b.rate - a.rate);
//     };

//     const getLineChartData = (state) => {
//       return dynamicData
//         .filter((d) => d.State === state)
//         .sort((a, b) => a.Year - b.Year)
//         .map((d) => ({
//           year: d.Year,
//           rate: parseFloat(d["Data.Rates.Violent.All"]) || 0,
//         }));
//     };

//     const getPieChartData = (state, year, crimeType) => {
//       const stateData = dynamicData.find(
//         (d) => d.State === state && d.Year === year
//       );
//       if (!stateData) return [];
//       if (crimeType === "violent") {
//         return [
//           { label: "Assault", value: parseFloat(stateData["Data.Totals.Violent.Assault"]) || 0 },
//           { label: "Murder", value: parseFloat(stateData["Data.Totals.Violent.Murder"]) || 0 },
//           { label: "Rape", value: parseFloat(stateData["Data.Totals.Violent.Rape"]) || 0 },
//           { label: "Robbery", value: parseFloat(stateData["Data.Totals.Violent.Robbery"]) || 0 },
//         ];
//       } else {
//         return [
//           { label: "Burglary", value: parseFloat(stateData["Data.Totals.Property.Burglary"]) || 0 },
//           { label: "Larceny", value: parseFloat(stateData["Data.Totals.Property.Larceny"]) || 0 },
//           { label: "Motor", value: parseFloat(stateData["Data.Totals.Property.Motor"]) || 0 },
//         ];
//       }
//     };

//     const getGroupedBarChartData = (state, year) => {
//       const stateData = dynamicData.find(
//         (d) => d.State === state && d.Year === year
//       );
//       if (!stateData) return { labels: [], datasets: [] };
//       return {
//         labels: ["Totals"],
//         datasets: [
//           {
//             label: "Property Crimes",
//             data: [parseInt(stateData["Data.Totals.Property.All"]) || 0],
//             backgroundColor: "#2ecc71",
//           },
//           {
//             label: "Violent Crimes",
//             data: [parseInt(stateData["Data.Totals.Violent.All"]) || 0],
//             backgroundColor: "#e74c3c",
//           },
//         ],
//       };
//     };

//     const getScatterChartData = (year) => {
//       return dynamicData
//         .filter((d) => d.Year === year)
//         .map((d) => ({
//           x: parseInt(d["Data.Population"]) || 0,
//           y: parseInt(d["Data.Totals.Violent.All"]) || 0,
//           state: d.State,
//         }));
//     };

//     const updateSummaryMetrics = (state, year) => {
//       const stateData = dynamicData.find(
//         (d) => d.State === state && d.Year === year
//       );
//       if (!stateData) return;
//       summaryPopulation.textContent = parseInt(stateData["Data.Population"]).toLocaleString();
//       summaryViolentTotal.textContent = parseInt(stateData["Data.Totals.Violent.All"]).toLocaleString();
//       summaryPropertyTotal.textContent = parseInt(stateData["Data.Totals.Property.All"]).toLocaleString();
//       summaryViolentRate.textContent = parseFloat(stateData["Data.Rates.Violent.All"]).toFixed(2);
//     };

//     const updateDataTable = (state, year) => {
//       const stateData = dynamicData.find(
//         (d) => d.State === state && d.Year === year
//       );
//       const tbody = document.querySelector("#crime-table tbody");
//       tbody.innerHTML = "";
//       if (!stateData) return;
//       const fields = [
//         { key: "Data.Population", label: "Population" },
//         { key: "Data.Rates.Property.All", label: "Property Crime Rate (All)" },
//         { key: "Data.Rates.Violent.All", label: "Violent Crime Rate (All)" },
//         { key: "Data.Totals.Property.All", label: "Total Property Crimes" },
//         { key: "Data.Totals.Violent.All", label: "Total Violent Crimes" },
//         { key: "Data.Rates.Violent.Assault", label: "Assault Rate" },
//         { key: "Data.Rates.Violent.Murder", label: "Murder Rate" },
//         { key: "Data.Rates.Violent.Rape", label: "Rape Rate" },
//         { key: "Data.Rates.Violent.Robbery", label: "Robbery Rate" },
//       ];
//       fields.forEach((f) => {
//         const row = document.createElement("tr");
//         row.innerHTML = `<td>${f.label}</td><td>${stateData[f.key]}</td>`;
//         tbody.appendChild(row);
//       });
//     };

//     // Initialize the Leaflet map
//     map = L.map("map-container").setView([37.8, -96], 4);
//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       attribution: "© OpenStreetMap contributors",
//     }).addTo(map);

//     const getColor = (rate) => {
//       return rate > 1000
//         ? "#800026"
//         : rate > 500
//         ? "#BD0026"
//         : rate > 200
//         ? "#E31A1C"
//         : rate > 100
//         ? "#FC4E2A"
//         : rate > 50
//         ? "#FD8D3C"
//         : rate > 20
//         ? "#FEB24C"
//         : rate > 10
//         ? "#FED976"
//         : "#FFEDA0";
//     };

//     const updateMap = (year) => {
//       if (geoJsonLayer) {
//         geoJsonLayer.setStyle((feature) => {
//           const stateName = feature.properties.name;
//           const stateData = dynamicData.find(
//             (d) => d.State === stateName && d.Year === year
//           );
//           const rate = stateData ? parseFloat(stateData["Data.Rates.Violent.All"]) || 0 : 0;
//           return {
//             fillColor: getColor(rate),
//             weight: 2,
//             opacity: 1,
//             color: "white",
//             fillOpacity: 0.7,
//           };
//         });
//         map.invalidateSize();
//       }
//     };

//     // Load CSV data via PapaParse
//     Papa.parse(csvUrl, {
//       download: true,
//       header: true,
//       complete: function (results) {
//         document.getElementById("loading").style.display = "none";
//         dynamicData = results.data;

//         // Populate dropdowns
//         const states = [...new Set(dynamicData.map((d) => d.State))].sort();
//         const years = [...new Set(dynamicData.map((d) => d.Year))].sort();
//         states.forEach((s) => {
//           const option = document.createElement("option");
//           option.value = s;
//           option.textContent = s;
//           stateSelect.appendChild(option);
//         });
//         stateSelect.value = "Alabama";
//         years.forEach((y) => {
//           const option = document.createElement("option");
//           option.value = y;
//           option.textContent = y;
//           yearSelect.appendChild(option);
//         });
//         yearSelect.value = years[years.length - 1];

//         // 1. Bar Chart: Violent Crime Rates by State
//         const barCtx = document.getElementById("bar-chart-crime").getContext("2d");
//         const barData = getBarChartData(yearSelect.value);
//         barChartCrime = new Chart(barCtx, {
//           type: "bar",
//           data: {
//             labels: barData.map((d) => d.state),
//             datasets: [
//               {
//                 label: "Violent Crime Rate (per 100k)",
//                 data: barData.map((d) => d.rate),
//                 backgroundColor: "rgba(231, 76, 60, 0.7)",
//                 borderColor: "rgba(231, 76, 60, 1)",
//                 borderWidth: 1,
//               },
//             ],
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             scales: {
//               y: { beginAtZero: true, title: { display: true, text: "Rate" } },
//               x: { title: { display: true, text: "State" } },
//             },
//             plugins: {
//               tooltip: {
//                 callbacks: {
//                   label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(2)}`,
//                 },
//               },
//             },
//           },
//         });

//         // 2. Line Chart: Crime Trend Over Time for Selected State
//         const lineCtx = document.getElementById("line-chart-trend").getContext("2d");
//         const lineData = getLineChartData(stateSelect.value);
//         lineChartTrend = new Chart(lineCtx, {
//           type: "line",
//           data: {
//             labels: lineData.map((d) => d.year),
//             datasets: [
//               {
//                 label: "Violent Crime Rate (per 100k)",
//                 data: lineData.map((d) => d.rate),
//                 borderColor: "#3498db",
//                 fill: false,
//                 tension: 0.1,
//               },
//             ],
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             scales: {
//               y: { beginAtZero: true, title: { display: true, text: "Rate" } },
//               x: { title: { display: true, text: "Year" } },
//             },
//           },
//         });

//         // 3. Pie Chart: Crime Distribution Breakdown
//         const pieCtx = document.getElementById("pie-chart-distribution").getContext("2d");
//         const pieData = getPieChartData(stateSelect.value, yearSelect.value, crimeTypeSelect.value);
//         pieChartDistribution = new Chart(pieCtx, {
//           type: "pie",
//           data: {
//             labels: pieData.map((d) => d.label),
//             datasets: [
//               {
//                 data: pieData.map((d) => d.value),
//                 backgroundColor:
//                   crimeTypeSelect.value === "violent"
//                     ? ["#e74c3c", "#c0392b", "#d35400", "#e67e22"]
//                     : ["#2ecc71", "#27ae60", "#16a085"],
//                 borderWidth: 1,
//               },
//             ],
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//               legend: { position: "right" },
//               tooltip: {
//                 callbacks: {
//                   label: (ctx) => {
//                     const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
//                     const percentage = ((ctx.raw / total) * 100).toFixed(2);
//                     return `${ctx.label}: ${ctx.raw} (${percentage}%)`;
//                   },
//                 },
//               },
//             },
//           },
//         });

//         // 4. Grouped Bar Chart: Compare Property vs Violent Crime Totals
//         const groupCtx = document.getElementById("grouped-bar-chart").getContext("2d");
//         const groupData = getGroupedBarChartData(stateSelect.value, yearSelect.value);
//         groupedBarChart = new Chart(groupCtx, {
//           type: "bar",
//           data: groupData,
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             scales: {
//               y: { beginAtZero: true, title: { display: true, text: "Totals" } },
//             },
//           },
//         });

//         // 5. Scatter Chart: Population vs Violent Crimes
//         const scatterCtx = document.getElementById("scatter-chart").getContext("2d");
//         const scatterData = getScatterChartData(yearSelect.value);
//         scatterChart = new Chart(scatterCtx, {
//           type: "scatter",
//           data: {
//             datasets: [
//               {
//                 label: "State Data",
//                 data: scatterData,
//                 backgroundColor: "rgba(52, 152, 219, 0.7)",
//                 pointRadius: 5,
//               },
//             ],
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             scales: {
//               x: {
//                 title: { display: true, text: "Population" },
//                 ticks: { callback: (value) => value.toLocaleString() },
//               },
//               y: {
//                 title: { display: true, text: "Total Violent Crimes" },
//                 ticks: { callback: (value) => value.toLocaleString() },
//               },
//             },
//             plugins: {
//               tooltip: {
//                 callbacks: {
//                   label: (ctx) => {
//                     const { x, y, state } = ctx.raw;
//                     return `${state}: (${x.toLocaleString()}, ${y.toLocaleString()})`;
//                   },
//                 },
//               },
//             },
//           },
//         });

//         // 6. Initialize Choropleth Map (GeoJSON layer)
//         fetch(geoJsonUrl)
//           .then((response) => {
//             if (!response.ok) throw new Error("Failed to load GeoJSON");
//             return response.json();
//           })
//           .then((geojson) => {
//             geoJsonLayer = L.geoJSON(geojson, {
//               style: (feature) => {
//                 const stateName = feature.properties.name;
//                 const stData = dynamicData.find(
//                   (d) => d.State === stateName && d.Year === yearSelect.value
//                 );
//                 const rate = stData ? parseFloat(stData["Data.Rates.Violent.All"]) || 0 : 0;
//                 return {
//                   fillColor: getColor(rate),
//                   weight: 2,
//                   opacity: 1,
//                   color: "white",
//                   fillOpacity: 0.7,
//                 };
//               },
//               onEachFeature: (feature, layer) => {
//                 layer.on({
//                   mouseover: (e) => {
//                     const l = e.target;
//                     l.setStyle({
//                       weight: 5,
//                       color: "#666",
//                       dashArray: "",
//                       fillOpacity: 0.7,
//                     });
//                     if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
//                       l.bringToFront();
//                     }
//                   },
//                   mouseout: (e) => {
//                     geoJsonLayer.resetStyle(e.target);
//                   },
//                   click: (e) => {
//                     const stateName = feature.properties.name;
//                     const stData = dynamicData.find(
//                       (d) => d.State === stateName && d.Year === yearSelect.value
//                     );
//                     if (stData) {
//                       layer.bindPopup(
//                         `<b>${stateName}</b><br>Violent Crime Rate: ${stData["Data.Rates.Violent.All"]}`
//                       ).openPopup();
//                     }
//                   },
//                 });
//               },
//             }).addTo(map);
//             map.invalidateSize();
//           })
//           .catch((error) => {
//             console.error("Map Error:", error);
//             document.getElementById("map-container").innerHTML =
//               "Failed to load map data.";
//           });

//         // Update summary metrics and detailed table for initial selection
//         updateSummaryMetrics(stateSelect.value, yearSelect.value);
//         updateDataTable(stateSelect.value, yearSelect.value);
//         updateMap(yearSelect.value);
//       },
//       error: function (error) {
//         console.error("Error loading CSV:", error);
//         document.getElementById("loading").textContent = "Failed to load data.";
//       },
//     });

//     // Event listeners for filter changes
//     stateSelect.addEventListener("change", () => {
//       const state = stateSelect.value;
//       const year = yearSelect.value;
//       const lineData = getLineChartData(state);
//       lineChartTrend.data.labels = lineData.map((d) => d.year);
//       lineChartTrend.data.datasets[0].data = lineData.map((d) => d.rate);
//       lineChartTrend.update();

//       const pieData = getPieChartData(state, year, crimeTypeSelect.value);
//       pieChartDistribution.data.labels = pieData.map((d) => d.label);
//       pieChartDistribution.data.datasets[0].data = pieData.map((d) => d.value);
//       pieChartDistribution.update();

//       const groupData = getGroupedBarChartData(state, year);
//       groupedBarChart.data = groupData;
//       groupedBarChart.update();

//       updateSummaryMetrics(state, year);
//       updateDataTable(state, year);
//     });

//     yearSelect.addEventListener("change", () => {
//       const year = yearSelect.value;
//       const barData = getBarChartData(year);
//       barChartCrime.data.labels = barData.map((d) => d.state);
//       barChartCrime.data.datasets[0].data = barData.map((d) => d.rate);
//       barChartCrime.update();

//       const scatterData = getScatterChartData(year);
//       scatterChart.data.datasets[0].data = scatterData;
//       scatterChart.update();

//       updateMap(year);
//       const state = stateSelect.value;
//       const groupData = getGroupedBarChartData(state, year);
//       groupedBarChart.data = groupData;
//       groupedBarChart.update();

//       updateSummaryMetrics(state, year);
//       updateDataTable(state, year);
//     });

//     crimeTypeSelect.addEventListener("change", () => {
//       const state = stateSelect.value;
//       const year = yearSelect.value;
//       const pieData = getPieChartData(state, year, crimeTypeSelect.value);
//       pieChartDistribution.data.labels = pieData.map((d) => d.label);
//       pieChartDistribution.data.datasets[0].data = pieData.map((d) => d.value);
//       pieChartDistribution.data.datasets[0].backgroundColor =
//         crimeTypeSelect.value === "violent"
//           ? ["#e74c3c", "#c0392b", "#d35400", "#e67e22"]
//           : ["#2ecc71", "#27ae60", "#16a085"];
//       pieChartDistribution.update();
//     });

//     // Export functions
//     window.exportChart = function (chartId, filename) {
//       const canvas = document.getElementById(chartId);
//       const link = document.createElement("a");
//       link.href = canvas.toDataURL("image/png");
//       link.download = filename;
//       link.click();
//     };

//     window.exportData = function () {
//       const csv = Papa.unparse(dynamicData);
//       const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = "crime_data.csv";
//       link.click();
//     };
//   }, []);

//   return (
//     <div>
//       <Navbar />
//       <div className="dashboard">
//         <h1>Advanced Crime Dashboard</h1>
//         <div
//           id="loading"
//           style={{
//             textAlign: "center",
//             padding: "20px",
//             fontSize: "18px",
//             color: "#666",
//           }}
//         >
//           Loading data...
//         </div>

//         {/* Filter Controls */}
//         <div className="controls">
//           <div>
//             <label htmlFor="state-select">State:</label>
//             <select id="state-select"></select>
//           </div>
//           <div>
//             <label htmlFor="year-select">Year:</label>
//             <select id="year-select"></select>
//           </div>
//           <div>
//             <label htmlFor="crime-type-select">Crime Type:</label>
//             <select id="crime-type-select">
//               <option value="violent">Violent Crimes</option>
//               <option value="property">Property Crimes</option>
//             </select>
//           </div>
//         </div>

//         {/* Summary Metrics */}
//         <div id="summary-metrics">
//           <div className="summary-card" id="summary-population">
//             <h3>Population</h3>
//             <p>—</p>
//           </div>
//           <div className="summary-card" id="summary-violent-total">
//             <h3>Total Violent Crimes</h3>
//             <p>—</p>
//           </div>
//           <div className="summary-card" id="summary-property-total">
//             <h3>Total Property Crimes</h3>
//             <p>—</p>
//           </div>
//           <div className="summary-card" id="summary-violent-rate">
//             <h3>Violent Crime Rate</h3>
//             <p>—</p>
//           </div>
//         </div>

//         {/* Dashboard Grid for Charts */}
//         <div id="dashboard">
//           <div className="chart-container">
//             <h2>Violent Crime Rates by State</h2>
//             <canvas id="bar-chart-crime"></canvas>
//           </div>
//           <div className="chart-container">
//             <h2>Crime Trend Over Time</h2>
//             <canvas id="line-chart-trend"></canvas>
//           </div>
//           <div className="chart-container">
//             <h2>Crime Distribution</h2>
//             <canvas id="pie-chart-distribution"></canvas>
//           </div>
//           <div className="chart-container">
//             <h2>Property vs Violent Crime Totals</h2>
//             <canvas id="grouped-bar-chart"></canvas>
//           </div>
//           <div className="chart-container">
//             <h2>Population vs Violent Crimes</h2>
//             <canvas id="scatter-chart"></canvas>
//           </div>
//         </div>

//         {/* Map and Data Table */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "flex-start",
//             gap: "20px",
//             margin: "20px",
//           }}
//         >
//           <div className="chart-container" style={{ flex: 1 }}>
//             <h2>US Crime Map</h2>
//             <div id="map-container" style={{ height: "400px", width: "100%" }}></div>
//           </div>
//           <div className="chart-container" style={{ flex: 1 }}>
//             <h2>Detailed Crime Data</h2>
//             <table id="crime-table">
//               <thead>
//                 <tr>
//                   <th>Field</th>
//                   <th>Value</th>
//                 </tr>
//               </thead>
//               <tbody></tbody>
//             </table>
//           </div>
//         </div>

//         {/* Export Buttons */}
//         <div className="export-buttons">
//           <h2>Export Charts & Data</h2>
//           <button
//             onClick={() =>
//               window.exportChart("bar-chart-crime", "bar-chart-crime.png")
//             }
//           >
//             Export Violent Crime Rates Chart
//           </button>
//           <button
//             onClick={() =>
//               window.exportChart("line-chart-trend", "line-chart-trend.png")
//             }
//           >
//             Export Crime Trend Chart
//           </button>
//           <button
//             onClick={() =>
//               window.exportChart("pie-chart-distribution", "pie-chart-distribution.png")
//             }
//           >
//             Export Crime Distribution Chart
//           </button>
//           <button
//             onClick={() =>
//               window.exportChart("grouped-bar-chart", "grouped-bar-chart.png")
//             }
//           >
//             Export Comparison Chart
//           </button>
//           <button
//             onClick={() => window.exportChart("scatter-chart", "scatter-chart.png")}
//           >
//             Export Scatter Chart
//           </button>
//           <button onClick={() => window.exportData()}>Export Data CSV</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;
