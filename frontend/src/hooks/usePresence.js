import { useEffect, useRef, useState } from "react";
import api from "../api";

/**
 * Presence heartbeat for a case/page.
 * Returns { show, bannerText, others, onlyCaseManagersText }.
 */
export default function usePresence({ caseNo, caseName, page = "CasePageManager", intervalMs = 12000 }) {
  const [others, setOthers] = useState([]);
  const visibleRef = useRef(document.visibilityState !== "hidden");

  useEffect(() => {
    const onVis = () => { visibleRef.current = document.visibilityState !== "hidden"; };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!caseNo || !caseName) return;

    let timerId;

    const beat = async () => {
      try {
        if (!visibleRef.current) return;
        const { data } = await api.post("/api/presence/heartbeat", { caseNo, caseName, page });
        setOthers(Array.isArray(data?.others) ? data.others : []);
      } catch { /* silent */ }
    };

    beat();
    timerId = setInterval(beat, intervalMs);

    return () => {
      clearInterval(timerId);
      api.post("/api/presence/leave", { caseNo, caseName, page }).catch(()=>{});
    };
  }, [caseNo, caseName, page, intervalMs]);

  const show = others.length > 0;
  const bannerText = !show
    ? ""
    : (others.length === 1
        ? `${others[0].username} is also working on this case`
        : `${others[0].username} + ${others.length - 1} more are also here`);

  const managers = others.filter(o => o.role === "Case Manager");
  const onlyCaseManagersText = managers.length
    ? (managers.length === 1
        ? `${managers[0].username} (Case Manager) is also here`
        : `${managers[0].username} + ${managers.length - 1} Case Manager(s) are also here`)
    : "";

  return { show, bannerText, others, onlyCaseManagersText };
}
