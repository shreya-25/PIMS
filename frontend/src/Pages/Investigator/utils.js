/** Converts a string to title case (e.g. "hello world" → "Hello World"). */
export const toTitleCase = (s = '') =>
  s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());

/** Returns true if a lead status is 'deleted'. */
export const isDeletedStatus = s => String(s || '').toLowerCase() === 'deleted';

/** Returns true if a lead status is 'closed'. */
export const isClosedStatus = s => String(s || '').toLowerCase() === 'closed';

/**
 * Returns the CSS color for a lead's status badge.
 * Red for active/unresolved, yellow for in review, green for done, black otherwise.
 */
export const statusColor = status =>
  ['Assigned', 'Accepted', 'Returned', 'Reopened'].includes(status)
    ? 'red'
    : status === 'In Review'
    ? '#d4a017'
    : ['Approved', 'Completed'].includes(status)
    ? 'green'
    : 'black';

/** Returns days remaining until dueDate (0 if already past). */
export const calculateRemainingDays = dueDate => {
  if (!dueDate || dueDate === 'N/A') return 0;
  const diff = new Date(dueDate) - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
};
