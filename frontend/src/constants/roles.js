/**
 * System-level roles — matches the backend userModel.js role enum.
 * Use these when checking localStorage.getItem("role").
 */
export const ROLES = {
  ADMIN: "Admin",
  DETECTIVE_SUPERVISOR: "Detective Supervisor",
  CASE_MANAGER: "CaseManager",
  INVESTIGATOR: "Detective/Investigator",
  EXTERNAL_CONTRIBUTOR: "External Contributor",
  READ_ONLY: "Read Only",
};

/**
 * Case-level roles — role of a user within a specific case object.
 * Use these when checking selectedCase?.role or c.role from the cases API.
 */
export const CASE_ROLES = {
  DETECTIVE_SUPERVISOR: "Detective Supervisor",
  CASE_MANAGER: "Case Manager",
  INVESTIGATOR: "Investigator",
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
