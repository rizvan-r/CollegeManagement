import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hodService } from '../services/hodService';

export const HOD_QUERY_KEYS = {
  DASHBOARD: ['hod', 'dashboard'],
  PROFILE: ['hod', 'profile'],
  FACULTY: ['hod', 'faculty'],
  STUDENTS: ['hod', 'students'],
  COURSES: ['hod', 'courses'],
  ATTENDANCE: ['hod', 'attendance'],
  REQUESTS: ['hod', 'requests'],
  NOTICES: ['hod', 'notices'],
};

/**
 * Hook for fetching real-time HOD departmental dashboard metrics
 */
export function useHodDashboard() {
  return useQuery({
    queryKey: HOD_QUERY_KEYS.DASHBOARD,
    queryFn: () => hodService.getDashboard(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching the authenticated HOD's profile
 */
export function useHodProfile() {
  return useQuery({
    queryKey: HOD_QUERY_KEYS.PROFILE,
    queryFn: () => hodService.getProfile(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching departmental faculty roster
 */
export function useHodFaculty() {
  return useQuery({
    queryKey: HOD_QUERY_KEYS.FACULTY,
    queryFn: () => hodService.getFaculty(),
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Hook for fetching departmental student directory with attendance stats
 */
export function useHodStudents() {
  return useQuery({
    queryKey: HOD_QUERY_KEYS.STUDENTS,
    queryFn: () => hodService.getStudents(),
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Hook for fetching courses offered by the department
 */
export function useHodCourses() {
  return useQuery({
    queryKey: HOD_QUERY_KEYS.COURSES,
    queryFn: () => hodService.getCourses(),
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Hook for fetching departmental attendance analytics
 */
export function useHodAttendance() {
  return useQuery({
    queryKey: HOD_QUERY_KEYS.ATTENDANCE,
    queryFn: () => hodService.getAttendance(),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook for fetching student leave and on-duty requests
 */
export function useHodRequests() {
  return useQuery({
    queryKey: HOD_QUERY_KEYS.REQUESTS,
    queryFn: () => hodService.getRequests(),
    staleTime: 1000 * 60 * 1,
  });
}

/**
 * Mutation hook for approving or rejecting a student request
 */
export function useProcessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, remarks }) => hodService.processRequest(id, status, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOD_QUERY_KEYS.REQUESTS });
      queryClient.invalidateQueries({ queryKey: HOD_QUERY_KEYS.DASHBOARD });
    },
  });
}

/**
 * Hook for fetching departmental notices
 */
export function useHodNotices() {
  return useQuery({
    queryKey: HOD_QUERY_KEYS.NOTICES,
    queryFn: () => hodService.getNotices(),
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Mutation hook for publishing a departmental announcement
 */
export function useCreateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => hodService.createNotice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOD_QUERY_KEYS.NOTICES });
      queryClient.invalidateQueries({ queryKey: HOD_QUERY_KEYS.DASHBOARD });
    },
  });
}

