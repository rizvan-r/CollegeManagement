/**
 * Central API Endpoints matching backend Express routes.
 */
export const ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  DEPARTMENTS: {
    BASE: '/departments',
    DETAIL: (id) => `/departments/${id}`,
  },
  STUDENTS: {
    BASE: '/students',
    DETAIL: (id) => `/students/${id}`,
    PROFILE: '/students/profile',
  },
  FACULTY: {
    BASE: '/faculty',
    PROFILE: '/faculty/profile',
    COURSES: '/faculty/courses',
    COURSE_STUDENTS: (courseAssignmentId) => `/faculty/courses/${courseAssignmentId}/students`,
    DETAIL: (id) => `/faculty/${id}`,
    ASSIGNMENTS: '/faculty/assignments',
  },
  COURSES: {
    BASE: '/courses',
    DETAIL: (id) => `/courses/${id}`,
  },
  ENROLLMENTS: {
    BASE: '/enrollments',
    MY: '/enrollments/my',
  },
  ATTENDANCE: {
    BASE: '/attendance',
    MY: '/attendance/my',
    ASSIGNMENTS: '/attendance/assignments',
    ROSTER: (courseAssignmentId) => `/attendance/roster/${courseAssignmentId}`,
    SESSIONS: '/attendance/sessions',
    RECORD_SESSION: '/attendance/sessions',
    UPDATE_SESSION: (id) => `/attendance/sessions/${id}`,
    CURRENT_SESSION: '/attendance/current-session',
    GENERATE_PIN: '/attendance/generate-pin',
    ACTIVE_PIN: '/attendance/active-pin',
    CHECK_IN: '/attendance/check-in',
    STUDENT_RECORD: (studentId) => `/attendance/student/${studentId}`,
  },
  NOTICES: {
    BASE: '/notices',
    DETAIL: (id) => `/notices/${id}`,
  },
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    HOD: '/dashboard/department',
    FACULTY: '/dashboard/faculty',
    STUDENT: '/dashboard/student',
  },
  HOD: {
    BASE: '/hod',
    ME: '/hod/me',
    DASHBOARD: '/hod/dashboard',
    FACULTY: '/hod/faculty',
    STUDENTS: '/hod/students',
    COURSES: '/hod/courses',
    ATTENDANCE: '/hod/attendance',
    REQUESTS: '/hod/requests',
    REQUEST_ACTION: (id) => `/hod/requests/${id}`,
    NOTICES: '/hod/notices',
    CREATE_NOTICE: '/hod/notices',
  },
  ADMIN: {
    BASE: '/admin',
    ME: '/admin/me',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER_STATUS: (id) => `/admin/users/${id}/status`,
    USER_ROLE: (id) => `/admin/users/${id}/role`,
    USER_RESET_PASSWORD: (id) => `/admin/users/${id}/reset-password`,
    AUDIT_LOGS: '/admin/audit-logs',
    ATTENDANCE_REPORTS: '/admin/attendance/reports',
    REQUESTS: '/admin/requests',
    REQUEST_ACTION: (id) => `/admin/requests/${id}`,
    COURSE_ASSIGNMENTS: '/admin/course-assignments',
    COURSE_ASSIGNMENT_DETAIL: (id) => `/admin/course-assignments/${id}`,
  },
  AI: {
    CHAT: '/ai/chat',
    ASSIST: '/ai/assist',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    DEVICES: '/notifications/devices',
    READ: (id) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
    PREFERENCES: '/notifications/preferences',
    BROADCAST: '/notifications/broadcast',
    TEST_PUSH: '/notifications/test-push',
  },
};

export default ENDPOINTS;

