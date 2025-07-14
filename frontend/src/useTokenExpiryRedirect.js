// // src/hooks/useTokenExpiryRedirect.js
// import { useEffect, useState } from "react";
// import { jwtDecode } from "jwt-decode";
// import { useNavigate } from "react-router-dom";

// const useTokenExpiryRedirect = (token) => {
//   const navigate = useNavigate();
//   const [showExpiryWarning, setShowExpiryWarning] = useState(false);


//   useEffect(() => {
//     if (!token) return; // nothing to do if no token

//     let decoded;
//     try {
//       decoded = jwtDecode(token);
//     } catch {
//       localStorage.removeItem("token");
//       navigate("/");
//       return;
//     }

//     const now = Date.now() / 1000;
//     if (decoded.exp < now) {
//       // already expired
//       localStorage.removeItem("token");
//       navigate("/");
//       return;
//     }

//     const msUntilExpiry = (decoded.exp - now) * 1000;
//     const twoMin = 2 * 60 * 1000;

//     // Warn two minutes before expiry
//     let warningTimer;
//     if (msUntilExpiry > twoMin) {
//       warningTimer = setTimeout(() => {
//         setShowExpiryWarning(true);
//       }, msUntilExpiry - twoMin);
//     }

//     // Finally redirect when the token actually expires
//     const expiryTimer = setTimeout(() => {
//       localStorage.removeItem("token");
//       navigate("/");
//     }, msUntilExpiry);

//     return () => {
//       clearTimeout(warningTimer);
//       clearTimeout(expiryTimer);
//     };
//   }, [token, navigate]);
// };

// export default useTokenExpiryRedirect;

// src/hooks/useTokenExpiryRedirect.js
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";     // default import
import { useNavigate } from "react-router-dom";

export default function useTokenExpiryRedirect(token) {
  const navigate = useNavigate();
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);

  useEffect(() => {
    if (!token) return;

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch {
      // invalid token → force logout
      localStorage.removeItem("token");
      navigate("/");
      return;
    }

    const now = Date.now() / 1000;
    if (decoded.exp < now) {
      // already expired
      localStorage.removeItem("token");
      navigate("/");
      return;
    }

    const msUntilExpiry = (decoded.exp - now) * 1000;
    const twoMinutes   = 2 * 60 * 1000;

    // schedule 2-minute warning
    let warnTimer;
    if (msUntilExpiry > twoMinutes) {
      warnTimer = setTimeout(() => {
        setShowExpiryWarning(true);
      }, msUntilExpiry - twoMinutes);
    }

    // schedule actual logout
    const expiryTimer = setTimeout(() => {
      localStorage.removeItem("token");
      navigate("/");
    }, msUntilExpiry);

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(expiryTimer);
    };
  }, [token, navigate]);

  // return the flag plus a dismiss function
  return {
    showExpiryWarning,
    dismissWarning: () => setShowExpiryWarning(false),
  };
}
