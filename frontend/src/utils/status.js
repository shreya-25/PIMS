export const STATUS_RANK = { Pending: 1, Assigned: 2, Accepted: 3, "In Review": 4, Completed: 5, Closed: 6 };

export function pickHigherStatus(current, incoming) {
  const c = STATUS_RANK[current] ?? 0;
  const n = STATUS_RANK[incoming] ?? 0;
  return n > c ? incoming : current;
}