import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';

export const ADMIN_QUERY_KEYS = {
  DASHBOARD: ['admin', 'dashboard'],
  PROFILE: ['admin', 'profile'],
  USERS: (params) => ['admin', 'users', params || {}],
  AUDIT_LOGS: (params) => ['admin', 'audit-logs', params || {}],
  ATTENDANCE_REPORTS: ['admin', 'attendance-reports'],
  REQUESTS: (params) => ['admin', 'requests', params || {}],
  COURSE_ASSIGNMENTS: ['admin', 'course-assignments'],
  DEPARTMENTS: ['admin', 'departments'],
  DEPARTMENT_DETAIL: (id) => ['admin', 'departments', id],
  STUDENTS: ['admin', 'students'],
  STUDENT_DETAIL: (id) => ['admin', 'students', id],
  FACULTY: ['admin', 'faculty'],
  FACULTY_DETAIL: (id) => ['admin', 'faculty', id],
  COURSES: ['admin', 'courses'],
  COURSE_DETAIL: (id) => ['admin', 'courses', id],
  NOTICES: ['admin', 'notices'],
  NOTICE_DETAIL: (id) => ['admin', 'notices', id],
};

// 1. Dashboard & Profile
export function useAdminDashboard() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.DASHBOARD,
    queryFn: () => adminService.getDashboard(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}

export function useAdminProfile() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.PROFILE,
    queryFn: () => adminService.getProfile(),
    staleTime: 1000 * 60 * 10,
  });
}

// 2. Users
export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.USERS(params),
    queryFn: () => adminService.getUsers(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }) => adminService.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }) => adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ userId, newPassword }) => adminService.resetUserPassword(userId, newPassword),
  });
}

// 3. Audit Logs
export function useAdminAuditLogs(params = {}) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.AUDIT_LOGS(params),
    queryFn: () => adminService.getAuditLogs(params),
    staleTime: 1000 * 60 * 1,
  });
}

// 4. Attendance Reports
export function useAdminAttendanceReports() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.ATTENDANCE_REPORTS,
    queryFn: () => adminService.getAttendanceReports(),
    staleTime: 1000 * 60 * 3,
  });
}

// 5. Requests
export function useAdminRequests(params = {}) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.REQUESTS(params),
    queryFn: () => adminService.getRequests(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useProcessAdminRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, action, remarks }) => adminService.processRequest(requestId, { action, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

// 6. Course Assignments
export function useAdminCourseAssignments() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.COURSE_ASSIGNMENTS,
    queryFn: () => adminService.getCourseAssignments(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateCourseAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createCourseAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COURSE_ASSIGNMENTS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COURSES });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useDeleteCourseAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteCourseAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COURSE_ASSIGNMENTS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COURSES });
    },
  });
}

// 7. Departments CRUD
export function useAdminDepartments() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.DEPARTMENTS,
    queryFn: () => adminService.getDepartments(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminDepartmentDetail(id) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.DEPARTMENT_DETAIL(id),
    queryFn: () => adminService.getDepartment(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DEPARTMENTS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateDepartment(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DEPARTMENTS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DEPARTMENT_DETAIL(vars.id) });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DEPARTMENTS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

// 8. Students CRUD
export function useAdminStudents() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.STUDENTS,
    queryFn: () => adminService.getStudents(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useAdminStudentDetail(id) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.STUDENT_DETAIL(id),
    queryFn: () => adminService.getStudent(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STUDENTS });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateStudent(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STUDENTS });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STUDENT_DETAIL(vars.id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.STUDENTS });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useResetStudentPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }) => adminService.resetStudentPassword(id, newPassword),
  });
}

// 9. Faculty CRUD
export function useAdminFaculty() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.FACULTY,
    queryFn: () => adminService.getFaculty(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useAdminFacultyDetail(id) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.FACULTY_DETAIL(id),
    queryFn: () => adminService.getFacultyMember(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createFaculty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.FACULTY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useUpdateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateFaculty(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.FACULTY });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.FACULTY_DETAIL(vars.id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDeleteFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteFaculty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.FACULTY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useResetFacultyPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }) => adminService.resetFacultyPassword(id, newPassword),
  });
}

// 10. Courses CRUD
export function useAdminCourses() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.COURSES,
    queryFn: () => adminService.getCourses(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useAdminCourseDetail(id) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.COURSE_DETAIL(id),
    queryFn: () => adminService.getCourse(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COURSES });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateCourse(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COURSES });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COURSE_DETAIL(vars.id) });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COURSES });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

// 11. Notices CRUD
export function useAdminNotices() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.NOTICES,
    queryFn: () => adminService.getNotices(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useAdminNoticeDetail(id) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.NOTICE_DETAIL(id),
    queryFn: () => adminService.getNotice(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateAdminNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createNotice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.NOTICES });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

export function useUpdateAdminNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateNotice(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.NOTICES });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.NOTICE_DETAIL(vars.id) });
    },
  });
}

export function useDeleteAdminNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.NOTICES });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.DASHBOARD });
    },
  });
}

