// Ranks mirror the backend Lead.leadStatus enum.
// "Higher" means further along the investigation lifecycle.
// Statuses that move backward (Returned, Reopened) sit at the rank
// of the stage they return the lead to so pickHigherStatus still
// behaves sensibly when merging values from multiple async sources.
export const STATUS_RANK = {
  Pending:      0, // frontend sentinel only (not a backend enum value)
  Created:      1,
  Assigned:     2,
  'To Reassign':2,
  Rejected:     2,
  Reopened:     2,
  Accepted:     3,
  Returned:     3,
  'In Review':  4,
  Approved:     5,
  Completed:    5,
  Closed:       6,
  Deleted:      7,
};

export function pickHigherStatus(current, incoming) {
  const c = STATUS_RANK[current] ?? 0;
  const n = STATUS_RANK[incoming] ?? 0;
  return n > c ? incoming : current;
}