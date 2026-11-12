import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyService } from '../services/facultyService';

export const FACULTY_QUERY_KEYS = {
  DASHBOARD: ['faculty', 'dashboard'],
  PROFILE: ['faculty', 'profile'],
  COURSES: ['faculty', 'courses'],
  COURSE_DETAIL: (courseId) => ['faculty', 'course', courseId],
  COURSE_STUDENTS: (courseAssignmentId) => ['faculty', 'course-students', courseAssignmentId],
  ATTENDANCE_SESSIONS: (courseAssignmentId) => ['faculty', 'attendance-sessions', courseAssignmentId || 'all'],
  NOTICES: ['faculty', 'notices'],
  NOTICE_DETAIL: (noticeId) => ['faculty', 'notice', noticeId],
};

/**
 * Hook for fetching real-time faculty dashboard statistics
 */
export function useFacultyDashboard() {
  return useQuery({
    queryKey: FACULTY_QUERY_KEYS.DASHBOARD,
    queryFn: () => facultyService.getDashboard(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching the authenticated faculty's institutional profile
 */
export function useFacultyProfile() {
  return useQuery({
    queryKey: FACULTY_QUERY_KEYS.PROFILE,
    queryFn: () => facultyService.getProfile(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching all teaching courses assigned to the faculty
 */
export function useFacultyCourses() {
  return useQuery({
    queryKey: FACULTY_QUERY_KEYS.COURSES,
    queryFn: () => facultyService.getAssignedCourses(),
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Hook for fetching details of a specific course
 */
export function useFacultyCourseDetail(courseId) {
  return useQuery({
    queryKey: FACULTY_QUERY_KEYS.COURSE_DETAIL(courseId),
    queryFn: () => facultyService.getCourseDetails(courseId),
    enabled: !!courseId,
  });
}

/**
 * Hook for fetching the student roster enrolled in a course assignment
 */
export function useFacultyCourseStudents(courseAssignmentId) {
  return useQuery({
    queryKey: FACULTY_QUERY_KEYS.COURSE_STUDENTS(courseAssignmentId),
    queryFn: () => facultyService.getCourseStudents(courseAssignmentId),
    enabled: !!courseAssignmentId,
  });
}

/**
 * Hook for fetching recorded attendance sessions
 */
export function useFacultyAttendanceSessions(courseAssignmentId = null) {
  return useQuery({
    queryKey: FACULTY_QUERY_KEYS.ATTENDANCE_SESSIONS(courseAssignmentId),
    queryFn: () => facultyService.getAttendanceSessions(courseAssignmentId),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook for fetching institutional circulars and department notices
 */
export function useFacultyNotices() {
  return useQuery({
    queryKey: FACULTY_QUERY_KEYS.NOTICES,
    queryFn: () => facultyService.getNotices(),
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Hook for fetching details of a single notice
 */
export function useFacultyNoticeDetail(noticeId) {
  return useQuery({
    queryKey: FACULTY_QUERY_KEYS.NOTICE_DETAIL(noticeId),
    queryFn: () => facultyService.getNoticeDetails(noticeId),
    enabled: !!noticeId,
  });
}

/**
 * Mutation hook for recording/updating an attendance session
 */
export function useRecordAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => facultyService.recordAttendance(payload),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries so UI immediately updates
      queryClient.invalidateQueries({ queryKey: ['faculty', 'attendance-sessions'] });
      queryClient.invalidateQueries({ queryKey: FACULTY_QUERY_KEYS.DASHBOARD });
      if (variables.courseAssignmentId) {
        queryClient.invalidateQueries({
          queryKey: FACULTY_QUERY_KEYS.COURSE_STUDENTS(variables.courseAssignmentId),
        });
      }
    },
  });
}

