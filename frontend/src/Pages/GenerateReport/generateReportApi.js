import api from "../../api";
import { safeEncode } from "../../utils/encode";
import { toArray, lrKeyFor, groupSectionsByReturn } from "./generateReportUtils";

// Fetch all sections for one lead — mirrors ViewLR
export async function fetchLeadAllSectionsLikeViewLR({ leadNo, leadName, caseId, token }) {
  const headers  = { headers: { Authorization: `Bearer ${token}` } };
  const encLead  = safeEncode(leadName || "");

  const [
    instrRes, returnsRes, personsRes, vehiclesRes, enclosuresRes,
    evidenceRes, picturesRes, audioRes, videosRes, notesRes, timelineRes, auditRes,
  ] = await Promise.all([
    api.get(`/api/lead/lead/${leadNo}/${encLead}/${caseId}`,           headers).catch(() => ({ data: [] })),
    api.get(`/api/leadReturnResult/${leadNo}/${encLead}/${caseId}`,    headers).catch(() => ({ data: [] })),
    api.get(`/api/lrperson/lrperson/${leadNo}/${encLead}/${caseId}`,   headers).catch(() => ({ data: [] })),
    api.get(`/api/lrvehicle/lrvehicle/${leadNo}/${encLead}/${caseId}`, headers).catch(() => ({ data: [] })),
    api.get(`/api/lrenclosure/${leadNo}/${encLead}/${caseId}`,         headers).catch(() => ({ data: [] })),
    api.get(`/api/lrevidence/${leadNo}/${encLead}/${caseId}`,          headers).catch(() => ({ data: [] })),
    api.get(`/api/lrpicture/${leadNo}/${encLead}/${caseId}`,           headers).catch(() => ({ data: [] })),
    api.get(`/api/lraudio/${leadNo}/${encLead}/${caseId}`,             headers).catch(() => ({ data: [] })),
    api.get(`/api/lrvideo/${leadNo}/${encLead}/${caseId}`,             headers).catch(() => ({ data: [] })),
    api.get(`/api/scratchpad/${leadNo}/${encLead}/${caseId}`,          headers).catch(() => ({ data: [] })),
    api.get(`/api/timeline/${leadNo}/${encLead}/${caseId}`,            headers).catch(() => ({ data: [] })),
    api.get(`/api/audit/logs`, { ...headers, params: { leadNo } })             .catch(() => ({ data: { logs: [] } })),
  ]);

  const leadDoc    = instrRes.data?.[0] || {};
  const returns    = Array.isArray(returnsRes.data)    ? returnsRes.data    : [];
  const persons    = Array.isArray(personsRes.data)    ? personsRes.data    : [];
  const vehicles   = Array.isArray(vehiclesRes.data)   ? vehiclesRes.data   : [];
  const enclosures = Array.isArray(enclosuresRes.data) ? enclosuresRes.data : [];
  const evidence   = Array.isArray(evidenceRes.data)   ? evidenceRes.data   : [];
  const pictures   = Array.isArray(picturesRes.data)   ? picturesRes.data   : [];
  const audio      = Array.isArray(audioRes.data)      ? audioRes.data      : [];
  const videos     = Array.isArray(videosRes.data)     ? videosRes.data     : [];
  const notes      = Array.isArray(notesRes.data)      ? notesRes.data      : [];
  const timeline   = Array.isArray(timelineRes.data)   ? timelineRes.data   : [];
  const auditLogs  = Array.isArray(auditRes.data?.logs) ? auditRes.data.logs : [];

  const buckets = groupSectionsByReturn({
    persons, vehicles, enclosures, evidence, pictures, audio, videos,
    scratchpad: notes, timeline,
  });

  const leadReturns = returns.map((ret) => {
    const k = lrKeyFor(ret);
    const g = buckets.get(k) || {
      persons: [], vehicles: [], enclosures: [], evidence: [],
      pictures: [], audio: [], videos: [], scratchpad: [], timeline: [],
    };
    return { ...ret, ...g };
  });

  // Identify returns that existed before the lead was reopened (pre-reopen snapshot).
  //
  // Two cases:
  //   1. leadStatus === "Reopened"  → all existing returns are pre-reopen.
  //   2. reopenedDate set but status moved on → filter by createdAt (immutable MongoDB
  //      timestamp) so edits after reopen are NOT mistakenly included.
  let preReopenReturns = [];
  if (leadDoc.reopenedDate) {
    const reopenedAt = new Date(leadDoc.reopenedDate).getTime();
    preReopenReturns = leadReturns.filter((ret) => {
      const retDate = new Date(ret.createdAt || ret.enteredDate || 0).getTime();
      return retDate <= reopenedAt;
    });
  } else if (leadDoc.leadStatus === "Reopened") {
    preReopenReturns = [...leadReturns];
  }

  return {
    ...leadDoc,
    leadNo: String(leadNo),
    description: leadDoc?.description ?? leadName,
    leadReturns,
    preReopenReturns,
    notes,
    timelineForLead: timeline,
    auditLogs,
  };
}

export const cleanLeadRecord = (lead) => ({
  ...lead,
  leadNo:       String(lead.leadNo ?? ""),
  parentLeadNo: toArray(lead.parentLeadNo),
});

// Deep fetch for one lead with all sections (ViewLR-style)
export const fetchSingleLeadFullDetails = async (leadNo, leadName, caseId, token) => {
  try {
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    const { data: leadData = [] } = await api.get(`/api/lead/lead/${leadNo}/${caseId}`, headers);
    if (!Array.isArray(leadData) || leadData.length === 0) return null;
    const lead           = cleanLeadRecord(leadData[0]);
    const actualLeadName = lead.description || leadName || "";
    const full = await fetchLeadAllSectionsLikeViewLR({
      leadNo: lead.leadNo, leadName: actualLeadName, caseId, token,
    });
    return full ? { ...lead, ...full } : lead;
  } catch (error) {
    console.error(`Error fetching details for leadNo: ${leadNo}`, error);
    return null;
  }
};

// Recursively fetch entire parent chain for a lead (child → ancestors)
export const fetchLeadHierarchyFullDetails = async (leadNo, leadName, caseId, token, chain = []) => {
  const currentLead = await fetchSingleLeadFullDetails(leadNo, leadName, caseId, token);
  if (!currentLead) return [chain];
  const updatedChain = [...chain, currentLead];
  if (!currentLead.parentLeadNo || currentLead.parentLeadNo.length === 0) return [updatedChain];
  const allChains = [];
  for (const parentNo of toArray(currentLead.parentLeadNo)) {
    const subChains = await fetchLeadHierarchyFullDetails(
      parentNo, currentLead.description || "", caseId, token, updatedChain
    );
    allChains.push(...subChains);
  }
  return allChains;
};
