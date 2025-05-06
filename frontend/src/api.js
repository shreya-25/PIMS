
import axios from "axios";

const BASE_URL =process.env.NODE_ENV === "development"? "http://localhost:5000": "";
console.log("log process env", process.env.NODE_ENV);
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// api.interceptors.response.use(
//   res => res,
//   err => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem("token");
//       // send them to login:
//       window.location.href = "/login";
//     }
//     return Promise.reject(err);
//   }
// );

export { BASE_URL }; // 👈 Export it separately
export default api;


// api.js
// import axios from "axios";

// const BASE_URL =
//   process.env.NODE_ENV === "development"
//     ? "http://localhost:5000"
//     : "";

// const api = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // 1) Attach officer, caseNo & leadNo headers on every request
// api.interceptors.request.use((config) => {
//   const officer = localStorage.getItem("loggedInUser");
//   const { selectedCase, selectedLead } = JSON.parse(
//     localStorage.getItem("currentContext") || "{}"
//   );

//   if (officer) config.headers["X-Officer"] = officer;
//   if (selectedCase?.caseNo) config.headers["X-Case-No"] = selectedCase.caseNo;
//   if (selectedLead?.leadNo) config.headers["X-Lead-No"] = selectedLead.leadNo;

//   return config;
// });

// // 2) After every response, if you set X-Action-Name on the request, fire off your log POST
// api.interceptors.response.use(
//   async (response) => {
//     const { config } = response;
//     const action = config.headers["X-Action-Name"];
//     const officer = config.headers["X-Officer"];
//     const caseNo = config.headers["X-Case-No"];
//     const leadNo = config.headers["X-Lead-No"];

//     if (action && caseNo && leadNo) {
//       // don’t use `api` here or you’ll recurse into the interceptor!
//       await axios.post(
//         `${BASE_URL}/api/logs`,
//         { action, officer, caseNo, leadNo },
//         { headers: { "Content-Type": "application/json" } }
//       );
//     }
//     return response;
//   },
//   (error) => Promise.reject(error)
// );

// export { BASE_URL };
// export default api;


