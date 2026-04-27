/**
 * System-level roles — matches the backend userModel.js role enum.
 * Use these when checking localStorage.getItem("role").
 *
 * Admin, Detective Supervisor, and Detective can create cases.
 * Case Specific users have case-level roles only (Case Manager, Investigator, or Read Only).
 */
export const ROLES = {
  ADMIN: "Admin",
  DETECTIVE_SUPERVISOR: "Detective Supervisor",
  DETECTIVE: "Detective",
  CASE_SPECIFIC: "Case Specific",
};

/**
 * Case-level roles — role of a user within a specific case object.
 * Use these when checking selectedCase?.role or c.role from the cases API.
 */
export const CASE_ROLES = {
  DETECTIVE_SUPERVISOR: "Detective Supervisor",
  CASE_MANAGER: "Case Manager",
  INVESTIGATOR: "Investigator",
  OFFICER: "Officer",
  READ_ONLY: "Read Only",
};

/**
 * Roles that can manage cases (create leads, review, etc.)
 */
export const CASE_MANAGER_ROLES = [CASE_ROLES.CASE_MANAGER, CASE_ROLES.DETECTIVE_SUPERVISOR];

/**
 * Returns true if the system role is Detective Supervisor.
 */
export const isDetectiveSupervisor = (systemRole) =>
  systemRole === ROLES.DETECTIVE_SUPERVISOR;
