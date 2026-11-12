import api from './api';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Centralized service for all authenticated Department Staff / HOD API requests.
 * Uses the shared Axios client with automatic Bearer token injection.
 */
export const hodService = {
  /**
   * Fetches the complete departmental analytics overview for HOD Dashboard
   */
  async getDashboard() {
    const res = await api.get(ENDPOINTS.HOD.DASHBOARD);
    return res.data;
  },

  /**
   * Fetches institutional profile of the authenticated HOD
   */
  async getProfile() {
    const res = await api.get(ENDPOINTS.HOD.ME);
    return res.data;
  },

  /**
   * Fetches all faculty members belonging to the HOD's department
   */
  async getFaculty() {
    const res = await api.get(ENDPOINTS.HOD.FACULTY);
    return res.data || [];
  },

  /**
   * Fetches all students enrolled in the HOD's department with attendance
   */
  async getStudents() {
    const res = await api.get(ENDPOINTS.HOD.STUDENTS);
    return res.data || [];
  },

  /**
   * Fetches all academic courses offered by the department
   */
  async getCourses() {
    const res = await api.get(ENDPOINTS.HOD.COURSES);
    return res.data || [];
  },

  /**
   * Fetches departmental attendance summary, course-wise rates, and low-attendance alerts
   */
  async getAttendance() {
    const res = await api.get(ENDPOINTS.HOD.ATTENDANCE);
    return res.data;
  },

  /**
   * Fetches pending and processed student academic / On-Duty requests
   */
  async getRequests() {
    const res = await api.get(ENDPOINTS.HOD.REQUESTS);
    return res.data || [];
  },

  /**
   * Approves or Rejects a student request with mandatory/optional HOD remarks
   * @param {string} id - Request ID
   * @param {'APPROVED' | 'REJECTED'} status
   * @param {string} remarks
   */
  async processRequest(id, status, remarks = '') {
    const res = await api.patch(ENDPOINTS.HOD.REQUEST_ACTION(id), { status, remarks });
    return res;
  },

  /**
   * Fetches departmental notices and circulars
   */
  async getNotices() {
    const res = await api.get(ENDPOINTS.HOD.NOTICES);
    return res.data || [];
  },

  /**
   * Publishes an institutional announcement from the HOD
   * @param {Object} payload - { title, content, priority, audience, expiryDate }
   */
  async createNotice(payload) {
    const res = await api.post(ENDPOINTS.HOD.CREATE_NOTICE, payload);
    return res;
  },
};

export default hodService;

