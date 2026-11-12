import api from './api';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Centralized service for College Administrator API operations.
 * Communicates with backend Express routes with Bearer token authentication.
 */
export const adminService = {
  // 1. Dashboard & Profile
  async getDashboard() {
    const res = await api.get(ENDPOINTS.ADMIN.DASHBOARD);
    return res.data;
  },

  async getProfile() {
    const res = await api.get(ENDPOINTS.ADMIN.ME);
    return res.data;
  },

  // 2. User & Role Management
  async getUsers(params = {}) {
    const res = await api.get(ENDPOINTS.ADMIN.USERS, { params });
    return res.data || [];
  },

  async updateUserStatus(userId, isActive) {
    const res = await api.patch(ENDPOINTS.ADMIN.USER_STATUS(userId), { isActive });
    return res.data;
  },

  async updateUserRole(userId, role) {
    const res = await api.patch(ENDPOINTS.ADMIN.USER_ROLE(userId), { role });
    return res.data;
  },

  async resetUserPassword(userId, newPassword) {
    const res = await api.post(ENDPOINTS.ADMIN.USER_RESET_PASSWORD(userId), { newPassword });
    return res;
  },

  // 3. Audit Logs
  async getAuditLogs(params = {}) {
    const res = await api.get(ENDPOINTS.ADMIN.AUDIT_LOGS, { params });
    return res.data || [];
  },

  // 4. Attendance Reports
  async getAttendanceReports() {
    const res = await api.get(ENDPOINTS.ADMIN.ATTENDANCE_REPORTS);
    return res.data;
  },

  // 5. Requests Management
  async getRequests(params = {}) {
    const res = await api.get(ENDPOINTS.ADMIN.REQUESTS, { params });
    return res.data || [];
  },

  async processRequest(requestId, payload) {
    const res = await api.patch(ENDPOINTS.ADMIN.REQUEST_ACTION(requestId), payload);
    return res.data;
  },

  // 6. Course Assignments
  async getCourseAssignments() {
    const res = await api.get(ENDPOINTS.ADMIN.COURSE_ASSIGNMENTS);
    return res.data || [];
  },

  async createCourseAssignment(payload) {
    const res = await api.post(ENDPOINTS.ADMIN.COURSE_ASSIGNMENTS, payload);
    return res.data;
  },

  async deleteCourseAssignment(id) {
    const res = await api.delete(ENDPOINTS.ADMIN.COURSE_ASSIGNMENT_DETAIL(id));
    return res;
  },

  // 7. Department Management
  async getDepartments() {
    const res = await api.get(ENDPOINTS.DEPARTMENTS.BASE);
    return res.data || [];
  },

  async getDepartment(id) {
    const res = await api.get(ENDPOINTS.DEPARTMENTS.DETAIL(id));
    return res.data;
  },

  async createDepartment(payload) {
    const res = await api.post(ENDPOINTS.DEPARTMENTS.BASE, payload);
    return res.data;
  },

  async updateDepartment(id, payload) {
    const res = await api.put(ENDPOINTS.DEPARTMENTS.DETAIL(id), payload);
    return res.data;
  },

  async deleteDepartment(id) {
    const res = await api.delete(ENDPOINTS.DEPARTMENTS.DETAIL(id));
    return res;
  },

  // 8. Student Management
  async getStudents() {
    const res = await api.get(ENDPOINTS.STUDENTS.BASE);
    return res.data || [];
  },

  async getStudent(id) {
    const res = await api.get(ENDPOINTS.STUDENTS.DETAIL(id));
    return res.data;
  },

  async createStudent(payload) {
    const res = await api.post(ENDPOINTS.STUDENTS.BASE, payload);
    return res.data;
  },

  async updateStudent(id, payload) {
    const res = await api.put(ENDPOINTS.STUDENTS.DETAIL(id), payload);
    return res.data;
  },

  async deleteStudent(id) {
    const res = await api.delete(ENDPOINTS.STUDENTS.DETAIL(id));
    return res;
  },

  async resetStudentPassword(id, newPassword) {
    const res = await api.post(`${ENDPOINTS.STUDENTS.DETAIL(id)}/reset-password`, { newPassword });
    return res;
  },

  // 9. Faculty Management
  async getFaculty() {
    const res = await api.get(ENDPOINTS.FACULTY.BASE);
    return res.data || [];
  },

  async getFacultyMember(id) {
    const res = await api.get(ENDPOINTS.FACULTY.DETAIL(id));
    return res.data;
  },

  async createFaculty(payload) {
    const res = await api.post(ENDPOINTS.FACULTY.BASE, payload);
    return res.data;
  },

  async updateFaculty(id, payload) {
    const res = await api.put(ENDPOINTS.FACULTY.DETAIL(id), payload);
    return res.data;
  },

  async deleteFaculty(id) {
    const res = await api.delete(ENDPOINTS.FACULTY.DETAIL(id));
    return res;
  },

  async resetFacultyPassword(id, newPassword) {
    const res = await api.post(`${ENDPOINTS.FACULTY.DETAIL(id)}/reset-password`, { newPassword });
    return res;
  },

  // 10. Course Management
  async getCourses() {
    const res = await api.get(ENDPOINTS.COURSES.BASE);
    return res.data || [];
  },

  async getCourse(id) {
    const res = await api.get(ENDPOINTS.COURSES.DETAIL(id));
    return res.data;
  },

  async createCourse(payload) {
    const res = await api.post(ENDPOINTS.COURSES.BASE, payload);
    return res.data;
  },

  async updateCourse(id, payload) {
    const res = await api.put(ENDPOINTS.COURSES.DETAIL(id), payload);
    return res.data;
  },

  async deleteCourse(id) {
    const res = await api.delete(ENDPOINTS.COURSES.DETAIL(id));
    return res;
  },

  // 11. Notice Management
  async getNotices() {
    const res = await api.get(ENDPOINTS.NOTICES.BASE);
    return res.data || [];
  },

  async getNotice(id) {
    const res = await api.get(ENDPOINTS.NOTICES.DETAIL(id));
    return res.data;
  },

  async createNotice(payload) {
    const res = await api.post(ENDPOINTS.NOTICES.BASE, payload);
    return res.data;
  },

  async updateNotice(id, payload) {
    const res = await api.put(ENDPOINTS.NOTICES.DETAIL(id), payload);
    return res.data;
  },

  async deleteNotice(id) {
    const res = await api.delete(ENDPOINTS.NOTICES.DETAIL(id));
    return res;
  },
};

export default adminService;

