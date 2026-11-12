import { useQuery } from '@tanstack/react-query';
import { studentService } from '../services/studentService';

export const STUDENT_QUERY_KEYS = {
  DASHBOARD: ['student', 'dashboard'],
  PROFILE: ['student', 'profile'],
  COURSES: ['student', 'courses'],
  COURSE_DETAIL: (courseId) => ['student', 'courses', courseId],
  ATTENDANCE: ['student', 'attendance'],
  COURSE_ATTENDANCE: (courseId) => ['student', 'attendance', courseId],
  NOTICES: ['student', 'notices'],
  NOTICE_DETAIL: (noticeId) => ['student', 'notices', noticeId],
};

export function useStudentDashboard() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.DASHBOARD,
    queryFn: () => studentService.getDashboard(),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

export function useStudentProfile() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.PROFILE,
    queryFn: () => studentService.getProfile(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useStudentCourses() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.COURSES,
    queryFn: () => studentService.getEnrolledCourses(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStudentCourseDetail(courseId) {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.COURSE_DETAIL(courseId),
    queryFn: () => studentService.getCourseDetails(courseId),
    enabled: Boolean(courseId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStudentAttendance() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.ATTENDANCE,
    queryFn: () => studentService.getAttendance(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useStudentNotices() {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.NOTICES,
    queryFn: () => studentService.getNotices(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStudentNoticeDetail(noticeId) {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.NOTICE_DETAIL(noticeId),
    queryFn: () => studentService.getNoticeDetails(noticeId),
    enabled: Boolean(noticeId),
    staleTime: 1000 * 60 * 10,
  });
}

