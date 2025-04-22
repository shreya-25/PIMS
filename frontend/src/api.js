
import axios from "axios";

const BASE_URL = "https://localhost:5000"; // or localhost for dev

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export { BASE_URL }; // 👈 Export it separately
export default api;

