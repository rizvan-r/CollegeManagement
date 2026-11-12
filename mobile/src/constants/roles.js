/**
 * College Management Portal - Centralized User Roles & Mapping
 * Connects backend Express PostgreSQL ENUMs with internal mobile role identifiers.
 */

// Internal mobile role identifiers (as required in Phase 2 spec)
export const INTERNAL_ROLES = {
  ADMIN: 'admin',
  HOD: 'hod',
  FACULTY: 'faculty',
  STUDENT: 'student',
};

// Backend PostgreSQL ENUMs (database and server/ source of truth)
export const BACKEND_ROLES = {
  ADMIN: 'ADMIN',
  DEPARTMENT_STAFF: 'DEPARTMENT_STAFF',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
};

// Human-readable labels
export const ROLE_LABELS = {
  [INTERNAL_ROLES.ADMIN]: 'College Administrator',
  [INTERNAL_ROLES.HOD]: 'Department Staff / HOD',
  [INTERNAL_ROLES.FACULTY]: 'Faculty',
  [INTERNAL_ROLES.STUDENT]: 'Student',
  [BACKEND_ROLES.ADMIN]: 'College Administrator',
  [BACKEND_ROLES.DEPARTMENT_STAFF]: 'Department Staff / HOD',
  [BACKEND_ROLES.FACULTY]: 'Faculty',
  [BACKEND_ROLES.STUDENT]: 'Student',
};

// Internal role to Expo Router group navigation mapping
export const ROLE_ROUTES = {
  [INTERNAL_ROLES.ADMIN]: '/(admin)',
  [INTERNAL_ROLES.HOD]: '/(hod)',
  [INTERNAL_ROLES.FACULTY]: '/(faculty)',
  [INTERNAL_ROLES.STUDENT]: '/(student)',
  [BACKEND_ROLES.ADMIN]: '/(admin)',
  [BACKEND_ROLES.DEPARTMENT_STAFF]: '/(hod)',
  [BACKEND_ROLES.FACULTY]: '/(faculty)',
  [BACKEND_ROLES.STUDENT]: '/(student)',
};

/**
 * Normalizes any role representation (backend or internal) into standard internal identifier.
 * @param {string} rawRole
 * @returns {'admin' | 'hod' | 'faculty' | 'student' | null}
 */
export function mapBackendRoleToInternal(rawRole) {
  if (!rawRole) return null;
  const upper = String(rawRole).toUpperCase().trim();
  switch (upper) {
    case 'ADMIN':
      return INTERNAL_ROLES.ADMIN;
    case 'DEPARTMENT_STAFF':
    case 'HOD':
      return INTERNAL_ROLES.HOD;
    case 'FACULTY':
      return INTERNAL_ROLES.FACULTY;
    case 'STUDENT':
      return INTERNAL_ROLES.STUDENT;
    default:
      return rawRole.toLowerCase();
  }
}

/**
 * Returns the destination route for any role.
 * @param {string} role
 * @returns {string}
 */
export function getRoleRoute(role) {
  const internal = mapBackendRoleToInternal(role);
  return ROLE_ROUTES[internal] || '/';
}

export const USER_ROLES = BACKEND_ROLES;
export default INTERNAL_ROLES;
