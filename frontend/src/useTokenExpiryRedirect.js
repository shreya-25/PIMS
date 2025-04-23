// src/hooks/useTokenExpiryRedirect.js
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const useTokenExpiryRedirect = (token) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return; // nothing to do if no token

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch {
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
    const twoMin = 2 * 60 * 1000;

    // Warn two minutes before expiry
    let warningTimer;
    if (msUntilExpiry > twoMin) {
      warningTimer = setTimeout(() => {
        alert("Your session will expire in 2 minutes. Please save your work.");
      }, msUntilExpiry - twoMin);
    }

    // Finally redirect when the token actually expires
    const expiryTimer = setTimeout(() => {
      localStorage.removeItem("token");
      navigate("/");
    }, msUntilExpiry);

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(expiryTimer);
    };
  }, [token, navigate]);
};

export default useTokenExpiryRedirect;
