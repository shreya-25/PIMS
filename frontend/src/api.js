
// // import axios from "axios";

// // const BASE_URL =process.env.NODE_ENV === "development"? "http://localhost:5000": "";
// // console.log("log process env", process.env.NODE_ENV);
// // const api = axios.create({
// //   baseURL: BASE_URL,
// //   headers: {
// //     "Content-Type": "application/json",
// //   },
// // });

// // export { BASE_URL }; // 👈 Export it separately
// // export default api;

// // src/api.js
// import axios from "axios";

// export const BASE_URL =
//   process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";

// const api = axios.create({ baseURL: BASE_URL });

// // ---------- helpers ----------
// const isGet = (cfg) => (cfg.method || "get").toLowerCase() === "get";
// const isNetwork = (err) => !err?.response;                           // DNS/CORS/offline/server down
// const isTimeout = (err) => err?.code === "ECONNABORTED";
// const isEmpty404 = (cfg, res) => {
//   if (Number(res?.status) !== 404 || !isGet(cfg)) return false;
//   if (cfg.acceptNotFound) return true;                                // caller opted in
//   const msg = String(res?.data?.message ?? res?.data ?? "").toLowerCase();
//   return /no .*found|not found|no records|empty/.test(msg);           // heuristic
// };

// function emitGlobalError(detail) {
//   if (typeof window !== "undefined") {
//     window.dispatchEvent(new CustomEvent("global-error", { detail }));
//   }
// }

// // ---------- interceptors ----------
// api.interceptors.request.use((cfg) => {
//   cfg.metadata = { start: Date.now() };
//   const token = localStorage.getItem("token");
//   if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
//   return cfg;
// });

// api.interceptors.response.use(
//   (res) => {
//     if (res.config?.metadata?.start) {
//       res.config.metadata.duration = Date.now() - res.config.metadata.start;
//     }
//     return res;
//   },
//   (error) => {
//     const cfg = error?.config || {};
//     const res = error?.response;

//     // --- 404 "empty" → don't show modal ---
//     if (res && isEmpty404(cfg, res)) {
//       // Option A: resolve with []
//       if (cfg.returnEmptyOn404) {
//         return Promise.resolve({
//           data: cfg.emptyData ?? [],
//           status: 200,
//           statusText: "OK",
//           headers: res.headers,
//           config: cfg,
//           request: error.request
//         });
//       }
//       // Option B: reject silently; component decides
//       return Promise.reject(Object.assign(error, { silent404: true }));
//     }

//     // --- network/timeout → show modal ---
//     const headers = res?.headers || {};
//     const status = res?.status;
//     const statusText = res?.statusText;
//     const online = typeof navigator !== "undefined" ? navigator.onLine : undefined;
//     const method = (cfg.method || "GET").toUpperCase();
//     const url = cfg.url;
//     const baseURL = cfg.baseURL;
//     const duration = cfg?.metadata?.start ? Date.now() - cfg.metadata.start : undefined;
//     const requestId = headers["x-request-id"] || headers["x-amzn-requestid"] ||
//                       headers["x-amz-cf-id"] || headers["x-amzn-trace-id"];
//     const timestamp = new Date().toISOString();

//     let title = "Network Issue";
//     let message = "We couldn’t reach the server. Please check your connection and try again.";
//     const summary = [];

//     if (isTimeout(error)) {
//       title = "Request Timed Out";
//       message = "The request took too long. Please retry.";
//     } else if (isNetwork(error)) {
//       title = online === false ? "No Internet Connection" : "Network Issue";
//       message = online === false
//         ? "You’re offline. Reconnect and try again."
//         : "Couldn’t reach the server (VPN/proxy, DNS, CORS, or server down).";
//     } else if (typeof status === "number" && status >= 500) {
//       title = "Service Temporarily Unavailable";
//       message = res?.data?.message || `Server error (${status}). Please try again shortly.`;
//       summary.push(`Status: ${status}${statusText ? ` ${statusText}` : ""}`);
//     } else {
//       // other 4xx – show normally (you can special-case 401 here)
//       title = `Request Failed (${status})`;
//       message = res?.data?.message || res?.data?.error ||
//                 `The server returned ${status}${statusText ? ` ${statusText}` : ""}.`;
//       summary.push(`Status: ${status}${statusText ? ` ${statusText}` : ""}`);
//     }

//     if (method && url) summary.unshift(`Endpoint: ${method} ${url}`);
//     if (baseURL) summary.push(`Base URL: ${baseURL}`);
//     if (typeof duration === "number") summary.push(`Latency: ${duration} ms`);
//     if (requestId) summary.push(`Request ID: ${requestId}`);
//     summary.push(`Time: ${timestamp}`);

//     const debug = {
//       timestamp, method, url, baseURL, duration, status, statusText, requestId,
//       responseHeaders: headers,
//       responseData:
//         typeof res?.data === "string" || typeof res?.data === "number" || res?.data == null
//           ? res?.data
//           : (() => { try { return JSON.parse(JSON.stringify(res.data)); } catch { return "[Unserializable]"; } })(),
//       online, code: error?.code, errorMessage: error?.message
//     };

//     emitGlobalError({ title, message, summary, debug });
//     return Promise.reject(error);
//   }
// );

// export default api;


// %%%%%%%%%%%%%%%%%%%

// src/api.js
import axios from "axios";

export const BASE_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";

const api = axios.create({ baseURL: BASE_URL });

// ---------- helpers ----------
const isGet = (cfg) => (cfg.method || "get").toLowerCase() === "get";
const isNetwork = (err) => !err?.response;
const isTimeout = (err) => err?.code === "ECONNABORTED";
const isEmpty404 = (cfg, res) => {
  if (Number(res?.status) !== 404 || !isGet(cfg)) return false;
  if (cfg.acceptNotFound) return true;
  const msg = String(res?.data?.message ?? res?.data ?? "").toLowerCase();
  return /no .*found|not found|no records|empty/.test(msg);
};

function emitGlobalError(detail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("global-error", { detail }));
  }
}
function emitGlobalErrorClear(detail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("global-error-clear", { detail }));
  }
}

// ---------- interceptors ----------
api.interceptors.request.use((cfg) => {
  cfg.metadata = { start: Date.now() };
  const token = localStorage.getItem("token");
  if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
  return cfg;
});

api.interceptors.response.use(
  (res) => {
    // success → tell provider to clear any visible error
    const cfg = res.config || {};
    const method = (cfg.method || "GET").toUpperCase();
    const url = cfg.url;
    if (cfg.metadata?.start) {
      cfg.metadata.duration = Date.now() - cfg.metadata.start;
    }
    emitGlobalErrorClear({ sig: `${method} ${url}` }); // ← key line
    return res;
  },
  (error) => {
    const cfg = error?.config || {};
    const res = error?.response;

    // suppress benign empty 404s
    if (res && isEmpty404(cfg, res)) {
      if (cfg.returnEmptyOn404) {
        return Promise.resolve({
          data: cfg.emptyData ?? [],
          status: 200,
          statusText: "OK",
          headers: res.headers,
          config: cfg,
          request: error.request
        });
      }
      return Promise.reject(Object.assign(error, { silent404: true }));
    }

    // build modal payload
    const headers = res?.headers || {};
    const status = res?.status;
    const statusText = res?.statusText;
    const online = typeof navigator !== "undefined" ? navigator.onLine : undefined;
    const method = (cfg.method || "GET").toUpperCase();
    const url = cfg.url;
    const baseURL = cfg.baseURL;
    const duration = cfg?.metadata?.start ? Date.now() - cfg.metadata.start : undefined;
    const requestId =
      headers["x-request-id"] || headers["x-amzn-requestid"] ||
      headers["x-amz-cf-id"] || headers["x-amzn-trace-id"];
    const timestamp = new Date().toISOString();

    let title = "Network Issue";
    let message = "We couldn’t reach the server. Please check your connection and try again.";
    const summary = [];

    if (isTimeout(error)) {
      title = "Request Timed Out";
      message = "The request took too long. Please retry.";
    } else if (isNetwork(error)) {
      title = online === false ? "No Internet Connection" : "Network Issue";
      message = online === false
        ? "You’re offline. Reconnect and try again."
        : "Couldn’t reach the server (VPN/proxy, DNS, CORS, or server down).";
    } else if (typeof status === "number" && status >= 500) {
      title = "Service Temporarily Unavailable";
      message = res?.data?.message || `Server error (${status}). Please try again shortly.`;
      summary.push(`Status: ${status}${statusText ? ` ${statusText}` : ""}`);
    } else {
      title = `Request Failed (${status})`;
      message = res?.data?.message || res?.data?.error ||
                `The server returned ${status}${statusText ? ` ${statusText}` : ""}.`;
      summary.push(`Status: ${status}${statusText ? ` ${statusText}` : ""}`);
    }

    if (method && url) summary.unshift(`Endpoint: ${method} ${url}`);
    if (baseURL) summary.push(`Base URL: ${baseURL}`);
    if (typeof duration === "number") summary.push(`Latency: ${duration} ms`);
    if (requestId) summary.push(`Request ID: ${requestId}`);
    summary.push(`Time: ${timestamp}`);

    const debug = {
      timestamp, method, url, baseURL, duration, status, statusText, requestId,
      responseHeaders: headers,
      responseData:
        typeof res?.data === "string" || typeof res?.data === "number" || res?.data == null
          ? res?.data
          : (() => { try { return JSON.parse(JSON.stringify(res.data)); } catch { return "[Unserializable]"; } })(),
      online, code: error?.code, errorMessage: error?.message
    };

    emitGlobalError({ title, message, summary, debug, sig: `${method} ${url}` });
    return Promise.reject(error);
  }
);

export default api;
