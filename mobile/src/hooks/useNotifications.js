import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';
import notificationService from '../services/notificationService';

export const NOTIFICATION_QUERY_KEYS = {
  LIST: (filters) => ['notifications', 'list', filters || {}],
  UNREAD_COUNT: ['notifications', 'unread_count'],
  PREFERENCES: ['notifications', 'preferences'],
};

/**
 * Fetch paginated & filtered notification history
 */
export function useNotificationsList(filters = {}) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.LIST(filters),
    queryFn: () => notificationService.fetchNotifications(filters),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every 60s
  });
}

/**
 * Fetch unread notification count for badge counters
 */
export function useUnreadNotificationCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.UNREAD_COUNT,
    queryFn: async () => {
      const res = await notificationService.fetchNotifications({ limit: 1 });
      return res.unreadCount ?? 0;
    },
    enabled: Boolean(isAuthenticated),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 45, // Refresh every 45s
  });
}

/**
 * Fetch notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.PREFERENCES,
    queryFn: () => notificationService.fetchNotificationPreferences(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Mark single notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationService.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs) => notificationService.updateNotificationPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.PREFERENCES });
    },
  });
}

/**
 * Send test push notification
 */
export function useSendTestNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.sendTestNotification(),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }, 1500);
    },
  });
}

/**
 * Setup lifecycle hook for push token registration & response listeners
 */
export function usePushNotificationSetup() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Register device with backend
    notificationService.registerForPushNotificationsAsync().catch((err) => {
      console.warn('[usePushNotificationSetup] Registration error:', err);
    });

    // 2. Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Invalidate queries so notification count and lists immediately update
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // 3. User notification tap response listener (deep link handling)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      const category = data?.category;
      const role = user?.role;

      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Intelligent deep linking based on notification payload and user role
      if (data?.noticeId) {
        if (role === 'STUDENT') router.push('/(student)/(tabs)/notices');
        else if (role === 'FACULTY') router.push('/(faculty)/(tabs)/notices');
        else if (role === 'DEPARTMENT_STAFF') router.push('/(hod)/(tabs)/notices');
        else if (role === 'ADMIN') router.push('/(admin)/notices');
        else router.push('/notifications');
      } else if (data?.requestId) {
        if (role === 'DEPARTMENT_STAFF') router.push('/(hod)/(tabs)/requests');
        else if (role === 'ADMIN') router.push('/(admin)/requests');
        else router.push('/notifications');
      } else if (category === 'ATTENDANCE') {
        if (role === 'STUDENT') router.push('/(student)/(tabs)/attendance');
        else if (role === 'FACULTY') router.push('/(faculty)/(tabs)/attendance');
        else router.push('/notifications');
      } else {
        router.push('/notifications');
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, user, queryClient, router]);
}

export default {
  useNotificationsList,
  useUnreadNotificationCount,
  useNotificationPreferences,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useUpdateNotificationPreferences,
  useSendTestNotification,
  usePushNotificationSetup,
};

