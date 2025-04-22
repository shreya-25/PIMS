
import axios from "axios";

const BASE_URL =process.env.NODE_ENV === "development"? "http://localhost:5000": "";
console.log("log process env", process.env.NODE_ENV);
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export { BASE_URL }; // 👈 Export it separately
export default api;

