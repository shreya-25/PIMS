// // src/error/GlobalErrorProvider.jsx
// import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { AlertModal } from "../src/components/AlertModal/AlertModal"; // adjust path if needed

// export const GlobalErrorContext = createContext({ showError: () => {}, clearError: () => {} });

// export function GlobalErrorProvider({ children }) {
//   const [error, setError] = useState(null); // { title, message, details? }
//   const [open, setOpen] = useState(false);
//   const showingRef = useRef(false);
//   const cooldownRef = useRef(0);

//   const clearError = useCallback(() => {
//     setOpen(false);
//     setTimeout(() => {
//       setError(null);
//       showingRef.current = false;
//     }, 200);
//   }, []);

//   useEffect(() => {
//     const onGlobalError = (e) => {
//       const now = Date.now();
//       // avoid spamming if many requests fail together (10s cooldown)
//       if (showingRef.current || now - cooldownRef.current < 10_000) return;
//       showingRef.current = true;
//       cooldownRef.current = now;
//       setError(e.detail || {});
//       setOpen(true);
//     };

//     const onOffline = () => {
//       window.dispatchEvent(new CustomEvent("global-error", {
//         detail: {
//           title: "No Internet Connection",
//           message: "You’re offline. Some data may be outdated. Please reconnect and try again.",
//         }
//       }));
//     };

//     window.addEventListener("global-error", onGlobalError);
//     window.addEventListener("offline", onOffline);

//     return () => {
//       window.removeEventListener("global-error", onGlobalError);
//       window.removeEventListener("offline", onOffline);
//     };
//   }, []);

//   const showError = useCallback((payload) => {
//     window.dispatchEvent(new CustomEvent("global-error", { detail: payload }));
//   }, []);

//   const value = useMemo(() => ({ showError, clearError }), [showError, clearError]);

//   return (
//     <GlobalErrorContext.Provider value={value}>
//       {children}

//       <AlertModal
//         isOpen={open && !!error}
//         title={error?.title ?? "Something went wrong"}
//         message={
//           <>
//             <div>{error?.message ?? "The system is currently unavailable."}</div>
//             {error?.details && (
//               <pre style={{ marginTop: 12, maxHeight: 160, overflow: "auto", fontSize: 12 }}>
//                 {String(error.details)}
//               </pre>
//             )}
//           </>
//         }
//         onConfirm={clearError}
//         onClose={clearError}
//       />
//     </GlobalErrorContext.Provider>
//   );
// }

// src/error/GlobalErrorProvider.jsx
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertModal } from "../src/components/AlertModal/AlertModal";

export const GlobalErrorContext = createContext({ showError: () => {}, clearError: () => {} });

export function GlobalErrorProvider({ children }) {
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const showingRef = useRef(false);
  const cooldownRef = useRef(0);
  const lastErrorSigRef = useRef(null); // remember failing call (METHOD URL)

  const clearError = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setError(null);
      lastErrorSigRef.current = null;
      showingRef.current = false;
    }, 200);
  }, []);

  useEffect(() => {
    const onGlobalError = (e) => {
      const now = Date.now();
      if (showingRef.current || now - cooldownRef.current < 10_000) return;

      const payload = e.detail || {};
      const dbg = payload.debug || {};
      const sig = payload.sig || (dbg.method && dbg.url ? `${dbg.method} ${dbg.url}` : null);
      if (sig) lastErrorSigRef.current = sig;

      showingRef.current = true;
      cooldownRef.current = now;
      setError(payload);
      setOpen(true);
    };

    const onGlobalErrorClear = (e) => {
      const successSig = e.detail?.sig;
      // Clear on any success; if you want stricter matching, require sig equality:
      // if (!successSig || successSig === lastErrorSigRef.current) clearError();
      clearError();
    };

    const onOffline = () => {
      window.dispatchEvent(new CustomEvent("global-error", {
        detail: {
          title: "No Internet Connection",
          message: "You’re offline. Some data may be outdated. Please reconnect and try again.",
        }
      }));
    };

    const onOnline = () => {
      // back online → dismiss stale error
      if (open) clearError();
    };

    window.addEventListener("global-error", onGlobalError);
    window.addEventListener("global-error-clear", onGlobalErrorClear);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("global-error", onGlobalError);
      window.removeEventListener("global-error-clear", onGlobalErrorClear);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [open, clearError]);

  const showError = useCallback((payload) => {
    window.dispatchEvent(new CustomEvent("global-error", { detail: payload }));
  }, []);

  const value = useMemo(() => ({ showError, clearError }), [showError, clearError]);

  return (
    <GlobalErrorContext.Provider value={value}>
      {children}
      <AlertModal
        isOpen={open && !!error}
        title={error?.title ?? "Something went wrong"}
        message={
          <>
            <div>{error?.message ?? "The system is currently unavailable."}</div>
            {error?.details && (
              <pre style={{ marginTop: 12, maxHeight: 160, overflow: "auto", fontSize: 12 }}>
                {String(error.details)}
              </pre>
            )}
          </>
        }
        onConfirm={clearError}
        onClose={clearError}
      />
    </GlobalErrorContext.Provider>
  );
}
