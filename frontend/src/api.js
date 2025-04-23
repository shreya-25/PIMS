
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

