import { useState, useEffect } from 'react';
import api from '../../../api';
import { calculateRemainingDays } from '../utils';

/** How often (ms) to re-poll the server for lead updates. */
const POLL_INTERVAL_MS = 15_000;

/**
 * Maps a raw API lead object to the flat shape used in the UI.
 * Adds a computed `remainingDays` field so tables don't need a cell resolver.
 */
const mapLead = lead => {
  const dueDateStr = lead.dueDate ? lead.dueDate.slice(0, 10) : 'N/A';
  let dueStatus = 'No Due Date';
  if (dueDateStr && dueDateStr !== 'N/A') {
    const [y, m, d] = dueDateStr.split('-').map(Number);
    const now = new Date();
    const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const dueUTC = Date.UTC(y, m - 1, d);
    const diff = Math.round((dueUTC - nowUTC) / (1000 * 60 * 60 * 24));
    dueStatus = diff < 0 ? 'Overdue' : diff === 0 ? 'Due Today' : 'Pending';
  }
  return {
    id: Number(lead.leadNo),
    description: lead.description,
    summary: lead.summary,
    dueDate: dueDateStr,
    dueStatus,
    remainingDays: lead.dueDate ? calculateRemainingDays(lead.dueDate) : 0,
    priority: lead.priority || 'Medium',
    flags: Array.isArray(lead.associatedFlags) ? lead.associatedFlags : [],
    assignedOfficers: Array.isArray(lead.assignedTo)
      ? lead.assignedTo.filter(a => a?.status !== 'declined').map(a => a.username)
      : [],
    leadStatus: lead.leadStatus,
    caseName: lead.caseName,
    caseNo: String(lead.caseNo),
  };
};

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
export function useLeads(caseId, signedInOfficer, isReadOnly = false) {
  const [leads, setLeads] = useState(EMPTY_LEADS);
  const signedInUserId = localStorage.getItem('userId');

  useEffect(() => {
    if (!caseId) return;

    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get(`/api/lead/case/${caseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = Array.isArray(data) ? data : [];

        // Read Only users see all leads in the case; others see only their assigned leads
        const visible = isReadOnly
          ? raw
          : raw.filter(l =>
              l.assignedTo?.some(o =>
                signedInUserId && o.userId
                  ? String(o.userId) === signedInUserId
                  : o.username === signedInOfficer
              )
            );

        const allLeads = visible.map(mapLead).sort((a, b) => b.id - a.id);

        setLeads({
          allLeads,
          assignedLeads:      visible.filter(l => l.leadStatus === 'Assigned').map(mapLead),
          pendingLeads:       visible.filter(l => l.leadStatus === 'Accepted').map(mapLead),
          pendingLeadReturns: visible.filter(l => l.leadStatus === 'In Review').map(mapLead),
        });
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };

    fetchLeads();
    const intervalId = setInterval(fetchLeads, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [caseId, signedInOfficer, isReadOnly]);

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
        `/api/lead/${leadNo}/${encodeURIComponent(description)}/${caseId}`,
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
