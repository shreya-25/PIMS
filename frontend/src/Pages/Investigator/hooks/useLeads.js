import { useState, useEffect } from 'react';
import api from '../../../api';
import { calculateRemainingDays } from '../utils';

/** How often (ms) to re-poll the server for lead updates. */
const POLL_INTERVAL_MS = 15_000;

/**
 * Maps a raw API lead object to the flat shape used in the UI.
 * Adds a computed `remainingDays` field so tables don't need a cell resolver.
 */
const mapLead = lead => ({
  id: Number(lead.leadNo),
  description: lead.description,
  summary: lead.summary,
  dueDate: lead.dueDate
    ? new Date(lead.dueDate).toISOString().split('T')[0]
    : 'N/A',
  remainingDays: lead.dueDate ? calculateRemainingDays(lead.dueDate) : 0,
  priority: lead.priority || 'Medium',
  flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [],
  // Only include assignees who have not declined
  assignedOfficers: Array.isArray(lead.assignedTo)
    ? lead.assignedTo.filter(a => a?.status !== 'declined').map(a => a.username)
    : [],
  leadStatus: lead.leadStatus,
  caseName: lead.caseName,
  caseNo: String(lead.caseNo),
});

const EMPTY_LEADS = {
  allLeads: [],
  assignedLeads: [],
  pendingLeads: [],
  pendingLeadReturns: [],
};

/**
 * Fetches and polls leads for the current case, filtered to the signed-in officer.
 *
 * @param {string} caseNo - The active case number.
 * @param {string} caseName - The active case name.
 * @param {string} signedInOfficer - Username of the logged-in investigator.
 * @returns {{ leads, acceptLead }} - Lead buckets and an accept action.
 */
export function useLeads(caseNo, caseName, signedInOfficer) {
  const [leads, setLeads] = useState(EMPTY_LEADS);

  useEffect(() => {
    if (!caseNo || !caseName) return;

    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get(`/api/lead/case/${caseNo}/${caseName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = Array.isArray(data) ? data : [];

        // Only show leads assigned to the current officer
        const mine = raw.filter(l =>
          l.assignedTo?.some(o => o.username === signedInOfficer)
        );

        const allLeads = mine.map(mapLead).sort((a, b) => b.id - a.id);

        setLeads({
          allLeads,
          assignedLeads:      mine.filter(l => l.leadStatus === 'Assigned').map(mapLead),
          pendingLeads:       mine.filter(l => l.leadStatus === 'Accepted').map(mapLead),
          pendingLeadReturns: mine.filter(l => l.leadStatus === 'In Review').map(mapLead),
        });
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };

    fetchLeads();
    const intervalId = setInterval(fetchLeads, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [caseNo, caseName, signedInOfficer]);

  /**
   * Accepts an assigned lead: calls the API then optimistically updates local state.
   *
   * @param {number} leadNo - The lead number to accept.
   * @param {string} description - The lead description (used in the API URL).
   */
  const acceptLead = async (leadNo, description) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/api/lead/${leadNo}/${encodeURIComponent(description)}/${caseNo}/${encodeURIComponent(caseName)}`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      // Optimistically move the lead from assigned → pending
      setLeads(prev => ({
        ...prev,
        assignedLeads: prev.assignedLeads.filter(l => Number(l.id) !== Number(leadNo)),
        pendingLeads: [
          ...prev.pendingLeads,
          { id: leadNo, description, leadStatus: 'Accepted', dueDate: 'N/A', remainingDays: 0, priority: 'N/A', flags: [], assignedOfficers: [] },
        ],
      }));
    } catch (err) {
      console.error('Error accepting lead:', err);
      alert('Failed to accept lead.');
    }
  };

  return { leads, acceptLead };
}
