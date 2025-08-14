export const STATUS_RANK = { Pending: 1, Accepted: 2, "In Review": 3, Completed: 4, Closed: 5 };

export function pickHigherStatus(current, incoming) {
  const c = STATUS_RANK[current] ?? 0;
  const n = STATUS_RANK[incoming] ?? 0;
  return n > c ? incoming : current;
}