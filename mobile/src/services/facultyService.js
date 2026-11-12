import api from './api';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Centralized service for all authenticated Faculty API requests.
 * Uses the shared Axios client with automatic Bearer token injection.
 */
export const facultyService = {
  /**
   * Fetches real-time academic overview for the faculty dashboard
   */
  async getDashboard() {
    const res = await api.get(ENDPOINTS.DASHBOARD.FACULTY);
    return res.data;
  },

  /**
   * Fetches the complete institutional profile of the authenticated faculty member
   */
  async getProfile() {
    const res = await api.get(ENDPOINTS.FACULTY.PROFILE);
    return res.data;
  },

  /**
   * Fetches all courses assigned to this faculty member for teaching
   */
  async getAssignedCourses() {
    const res = await api.get(ENDPOINTS.FACULTY.COURSES);
    return res.data || [];
  },

  /**
   * Fetches the enrolled student roster with attendance metrics for a specific course assignment
   */
  async getCourseStudents(courseAssignmentId) {
    const res = await api.get(ENDPOINTS.FACULTY.COURSE_STUDENTS(courseAssignmentId));
    return res.data || [];
  },

  /**
   * Fetches full syllabus/details of a course
   */
  async getCourseDetails(courseId) {
    const res = await api.get(ENDPOINTS.COURSES.DETAIL(courseId));
    return res.data;
  },

  /**
   * Fetches recorded attendance sessions for this faculty member's classes
   */
  async getAttendanceSessions(courseAssignmentId = null) {
    const url = courseAssignmentId
      ? `${ENDPOINTS.ATTENDANCE.SESSIONS}?courseAssignmentId=${courseAssignmentId}`
      : ENDPOINTS.ATTENDANCE.SESSIONS;
    const res = await api.get(url);
    return res.data || [];
  },

  /**
   * Submits or updates an attendance session with student attendance records
   * @param {Object} payload - { courseAssignmentId, sessionDate, periodNumber, topic, records: [{ studentId, status, remarks }] }
   */
  async recordAttendance(payload) {
    const res = await api.post(ENDPOINTS.ATTENDANCE.RECORD_SESSION, payload);
    return res;
  },

  /**
   * Checks if an attendance session has already been recorded for a given date and period
   */
  async getCurrentSession(courseAssignmentId, sessionDate, periodNumber) {
    const res = await api.get(
      `${ENDPOINTS.ATTENDANCE.CURRENT_SESSION}?courseAssignmentId=${courseAssignmentId}&sessionDate=${sessionDate}&periodNumber=${periodNumber}`
    );
    return res;
  },

  /**
   * Generates a 6-digit live session PIN for student check-in
   */
  async generateSessionPin(payload) {
    const res = await api.post(ENDPOINTS.ATTENDANCE.GENERATE_PIN, payload);
    return res;
  },

  /**
   * Fetches college and departmental notices
   */
  async getNotices() {
    const res = await api.get(ENDPOINTS.NOTICES.BASE);
    return res.data || [];
  },

  /**
   * Fetches detailed information for a specific notice
   */
  async getNoticeDetails(noticeId) {
    const res = await api.get(ENDPOINTS.NOTICES.DETAIL(noticeId));
    return res.data;
  },
};

export default facultyService;

