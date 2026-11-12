import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';
import ENDPOINTS from '../api/endpoints';
import secureStorage from './secureStorage';

const PUSH_TOKEN_STORAGE_KEY = 'cmp_push_device_token';

// Configure foreground notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Configure Android notification channels with custom sound, lights, and priority
 */
export async function setupAndroidNotificationChannels() {
  if (Platform.OS !== 'android') return;

  try {
    // 1. Announcements Channel
    await Notifications.setNotificationChannelAsync('announcements', {
      name: 'Campus Announcements',
      description: 'Official college and department announcements and updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E3A8A',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // 2. Attendance Channel
    await Notifications.setNotificationChannelAsync('attendance', {
      name: 'Attendance Alerts',
      description: 'Session attendance marks, absence alerts, and threshold warnings',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#EF4444',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // 3. Requests Channel
    await Notifications.setNotificationChannelAsync('requests', {
      name: 'Academic & OD Requests',
      description: 'Updates and approvals on leave, OD, and academic requests',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#0D9488',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // 4. Academic Channel
    await Notifications.setNotificationChannelAsync('academic', {
      name: 'Course & Academic Updates',
      description: 'Course materials, grades, syllabus, and assignment reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#3B82F6',
      enableLights: true,
      showBadge: true,
    });
  } catch (error) {
    console.warn('[NotificationService] Android channel setup warning:', error?.message);
  }
}

/**
 * Register device for push notifications
 * Returns the Expo Push Token string or null
 */
export async function registerForPushNotificationsAsync() {
  await setupAndroidNotificationChannels();

  // Push notifications only deliver to physical devices or EAS dev builds
  if (!Device.isDevice) {
    console.log('[NotificationService] Physical device required for remote push tokens. Running in simulator/web environment.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Notification permission not granted by user.');
      return null;
    }

    // Resolve EAS projectId dynamically from Constants if configured
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const pushToken = tokenData.data;

    if (pushToken) {
      // Store locally so it can be revoked upon logout
      await secureStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);

      // Register with the backend API
      try {
        await api.post(ENDPOINTS.NOTIFICATIONS.DEVICES, {
          pushToken,
          platform: Platform.OS,
          deviceName: Device.modelName || `${Device.brand || 'Device'} ${Device.osName || ''}`.trim(),
        });
        console.log('[NotificationService] Device token registered with backend successfully.');
      } catch (apiErr) {
        console.warn('[NotificationService] Backend token registration error:', apiErr?.message);
      }
    }

    return pushToken;
  } catch (error) {
    console.warn('[NotificationService] Error getting push token:', error?.message);
    return null;
  }
}

/**
 * Unregister device push token upon user logout
 */
export async function unregisterDeviceTokenAsync() {
  try {
    const storedToken = await secureStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (storedToken) {
      await api.delete(ENDPOINTS.NOTIFICATIONS.DEVICES, {
        data: { pushToken: storedToken },
      });
      await secureStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
      console.log('[NotificationService] Push token revoked on logout.');
    }
  } catch (error) {
    console.warn('[NotificationService] Device unregister warning:', error?.message);
  }
}

/**
 * Fetch user notification history
 */
export async function fetchNotifications({ page = 1, limit = 20, category, unreadOnly } = {}) {
  const params = { page, limit };
  if (category && category !== 'ALL') params.category = category;
  if (unreadOnly) params.unreadOnly = 'true';

  const response = await api.get(ENDPOINTS.NOTIFICATIONS.BASE, { params });
  return response.data;
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsRead(notificationId) {
  const response = await api.patch(ENDPOINTS.NOTIFICATIONS.READ(notificationId));
  return response.data;
}

/**
 * Mark all user notifications as read
 */
export async function markAllNotificationsAsRead() {
  const response = await api.patch(ENDPOINTS.NOTIFICATIONS.READ_ALL);
  return response.data;
}

/**
 * Fetch notification preferences
 */
export async function fetchNotificationPreferences() {
  const response = await api.get(ENDPOINTS.NOTIFICATIONS.PREFERENCES);
  return response.data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences) {
  const response = await api.put(ENDPOINTS.NOTIFICATIONS.PREFERENCES, preferences);
  return response.data;
}

/**
 * Dispatch test notification to current user
 */
export async function sendTestNotification() {
  const response = await api.post(ENDPOINTS.NOTIFICATIONS.TEST_PUSH);
  return response.data;
}

/**
 * Admin broadcast notification
 */
export async function sendBroadcastNotification(payload) {
  const response = await api.post(ENDPOINTS.NOTIFICATIONS.BROADCAST, payload);
  return response.data;
}

export default {
  setupAndroidNotificationChannels,
  registerForPushNotificationsAsync,
  unregisterDeviceTokenAsync,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  sendBroadcastNotification,
};

