import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useSendTestNotification,
} from '../../src/hooks/useNotifications';
import { COLORS } from '../../src/constants/colors';
import Card from '../../src/components/common/Card';
import Button from '../../src/components/common/Button';

export default function NotificationPreferencesScreen() {
  const { data: prefResponse, isLoading } = useNotificationPreferences();
  const updatePrefMutation = useUpdateNotificationPreferences();
  const testPushMutation = useSendTestNotification();

  const [hasSystemPermission, setHasSystemPermission] = useState(true);
  const [prefs, setPrefs] = useState({
    announcements: true,
    attendance: true,
    requests: true,
    academic: true,
  });

  useEffect(() => {
    if (prefResponse?.data) {
      setPrefs({
        announcements: Boolean(prefResponse.data.announcements),
        attendance: Boolean(prefResponse.data.attendance),
        requests: Boolean(prefResponse.data.requests),
        academic: Boolean(prefResponse.data.academic),
      });
    }
  }, [prefResponse]);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasSystemPermission(status === 'granted');
    } catch {
      setHasSystemPermission(true);
    }
  };

  const handleToggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    updatePrefMutation.mutate(updated, {
      onError: (err) => {
        Alert.alert('Error', 'Failed to save notification preference.');
        setPrefs(prefs); // Revert on failure
      },
    });
  };

  const handleSendTest = () => {
    testPushMutation.mutate(undefined, {
      onSuccess: () => {
        Alert.alert('Test Sent', 'A test push notification has been queued for your device.');
      },
      onError: (err) => {
        Alert.alert('Failed', err?.message || 'Could not dispatch test notification.');
      },
    });
  };

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notification preferences...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Permission Status Banner */}
        {!hasSystemPermission ? (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={24} color={COLORS.warning} />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Notifications are Disabled</Text>
              <Text style={styles.bannerBody}>
                System push permissions are currently turned off for this app. You will not receive alerts.
              </Text>
              <TouchableOpacity onPress={handleOpenSettings} style={styles.bannerLink}>
                <Text style={styles.bannerLinkText}>Open System Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoBanner}>
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
            <Text style={styles.infoBannerText}>
              System push notifications are active for this device.
            </Text>
          </View>
        )}

        <Text style={styles.sectionHeader}>NOTIFICATION CATEGORIES</Text>

        <Card style={styles.card}>
          {/* Announcements Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <Ionicons name="megaphone-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Announcements</Text>
              <Text style={styles.settingDescription}>
                Important college-wide notices, department circulars, and events
              </Text>
            </View>
            <Switch
              value={prefs.announcements}
              onValueChange={() => handleToggle('announcements')}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={prefs.announcements ? COLORS.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Attendance Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrapper, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.danger} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Attendance Alerts</Text>
              <Text style={styles.settingDescription}>
                Session attendance records, absence alerts, and threshold warnings
              </Text>
            </View>
            <Switch
              value={prefs.attendance}
              onValueChange={() => handleToggle('attendance')}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={prefs.attendance ? COLORS.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Requests & Approvals Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrapper, { backgroundColor: '#F0FDFA' }]}>
              <Ionicons name="document-text-outline" size={22} color={COLORS.accent} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Requests & Approvals</Text>
              <Text style={styles.settingDescription}>
                Status updates on leave requests, OD approvals, and certificates
              </Text>
            </View>
            <Switch
              value={prefs.requests}
              onValueChange={() => handleToggle('requests')}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={prefs.requests ? COLORS.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Academic Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrapper, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="school-outline" size={22} color={COLORS.primaryLight} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Academic & Coursework</Text>
              <Text style={styles.settingDescription}>
                Course syllabus updates, grade releases, and faculty assignments
              </Text>
            </View>
            <Switch
              value={prefs.academic}
              onValueChange={() => handleToggle('academic')}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={prefs.academic ? COLORS.primary : '#FFFFFF'}
            />
          </View>
        </Card>

        {/* Diagnostics & Testing */}
        <Text style={styles.sectionHeader}>DEVICE & DIAGNOSTICS</Text>

        <Card style={styles.card}>
          <Text style={styles.cardSubtitle}>
            Test your device notification delivery and Android notification channels.
          </Text>

          <Button
            title={testPushMutation.isPending ? 'Sending...' : 'Send Test Notification'}
            onPress={handleSendTest}
            disabled={testPushMutation.isPending}
            variant="outline"
            style={styles.testButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '500',
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  bannerBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 6,
  },
  bannerLink: {
    alignSelf: 'flex-start',
  },
  bannerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  card: {
    padding: 14,
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  testButton: {
    marginTop: 4,
  },
});

