import api from './api';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Centralized service for all authenticated Student API requests.
 * Uses the shared Axios client with automatic Bearer token injection.
 */
export const studentService = {
  /**
   * Fetches real-time academic overview for the student dashboard
   */
  async getDashboard() {
    const res = await api.get(ENDPOINTS.DASHBOARD.STUDENT);
    return res.data;
  },

  /**
   * Fetches the complete institutional profile of the authenticated student
   */
  async getProfile() {
    const res = await api.get(ENDPOINTS.STUDENTS.PROFILE);
    return res.data;
  },

  /**
   * Fetches all courses the authenticated student is currently enrolled in
   */
  async getEnrolledCourses() {
    const res = await api.get(ENDPOINTS.ENROLLMENTS.MY);
    return res.data || [];
  },

  /**
   * Fetches details of a specific course by course ID
   */
  async getCourseDetails(courseId) {
    const res = await api.get(ENDPOINTS.COURSES.DETAIL(courseId));
    return res.data;
  },

  /**
   * Fetches the student's overall attendance, subject breakdown, and recent history
   */
  async getAttendance() {
    const res = await api.get(ENDPOINTS.ATTENDANCE.MY);
    return {
      summary: res.summary || {
        total_sessions: 0,
        present_count: 0,
        on_duty_count: 0,
        late_count: 0,
        absent_count: 0,
        attendance_percentage: 100.0,
      },
      subjectAttendance: res.subjectAttendance || [],
      history: res.history || [],
    };
  },

  /**
   * Fetches audience-authorized notices (college-wide, student-only, or department)
   */
  async getNotices() {
    const res = await api.get(ENDPOINTS.NOTICES.BASE);
    return res.data || [];
  },

  /**
   * Fetches complete details of a specific notice
   */
  async getNoticeDetails(noticeId) {
    const res = await api.get(ENDPOINTS.NOTICES.DETAIL(noticeId));
    return res.data;
  },
};

export default studentService;

