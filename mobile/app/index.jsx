import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, ROLE_COLORS } from '../src/constants/colors';
import { USER_ROLES, ROLE_ROUTES } from '../src/constants/roles';
import { API_BASE_URL } from '../src/api/client';
import { useApiStatus } from '../src/hooks/useApiStatus';
import { useAuth } from '../src/hooks/useAuth';
import { Card, Button, LoadingSpinner, RoleBadge } from '../src/components';

export default function WelcomeScreen() {
  const router = useRouter();
  const { data: healthData, isLoading, isError, error, refetch, isFetching } = useApiStatus();
  const { isAuthenticated, user, role } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>PHASE 2 • AUTHENTICATION & AUTHORIZATION</Text>
          </View>
          <Text style={styles.heroTitle}>College Management Portal</Text>
          <Text style={styles.heroSubtitle}>
            Unified mobile companion sharing the existing Node.js + Express REST API and PostgreSQL database.
          </Text>
        </View>

        {/* Authentication Call to Action */}
        <Card style={styles.authActionCard}>
          {isAuthenticated && user ? (
            <View>
              <View style={styles.authStatusRow}>
                <RoleBadge role={role} />
                <Text style={styles.userEmailText}>{user.email}</Text>
              </View>
              <Text style={styles.authNoticeText}>
                Active session stored securely in Expo SecureStore.
              </Text>
              <Button
                title={`Enter ${role || 'User'} Workspace`}
                variant="primary"
                onPress={() => router.push(ROLE_ROUTES[role] || '/')}
                style={styles.primaryActionButton}
              />
              <Button
                title="Switch Account / Sign In"
                variant="outline"
                onPress={() => router.push('/(auth)/login')}
                style={styles.secondaryActionButton}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.authCardTitle}>Institutional Access</Text>
              <Text style={styles.authCardSubtitle}>
                Sign in with your institutional credentials to access your academic role workspace.
              </Text>
              <Button
                title="Sign In to Your Account"
                variant="primary"
                onPress={() => router.push('/(auth)/login')}
                style={styles.primaryActionButton}
              />
            </View>
          )}
        </Card>

        {/* Backend API Health Status */}
        <Card style={styles.statusCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Backend API Connectivity</Text>
            <View
              style={[
                styles.statusDot,
                isLoading || isFetching
                  ? styles.statusPending
                  : healthData?.success
                  ? styles.statusOnline
                  : styles.statusOffline,
              ]}
            />
          </View>

          <Text style={styles.metaLabel}>Configured Base URL:</Text>
          <Text style={styles.codeText}>{API_BASE_URL}</Text>

          <View style={styles.divider} />

          {isLoading || isFetching ? (
            <LoadingSpinner size="small" message="Testing API endpoint connection..." />
          ) : isError ? (
            <View style={styles.infoBoxError}>
              <Text style={styles.errorTitle}>Cannot Reach Backend</Text>
              <Text style={styles.errorText}>
                {error?.message || 'Connection refused. Ensure the backend server is running on port 5000.'}
              </Text>
              <Text style={styles.hintText}>
                Note: In Android Emulator, host localhost is accessed via 10.0.2.2:5000.
              </Text>
            </View>
          ) : healthData ? (
            <View style={styles.infoBoxSuccess}>
              <Text style={styles.successTitle}>Connected Successfully</Text>
              <Text style={styles.successMeta}>
                Application: {healthData.application || 'CMP API'}
              </Text>
              <Text style={styles.successMeta}>
                Status: {healthData.database?.connected ? 'Database Connected' : 'Database Status Check'}
              </Text>
              <Text style={styles.successMeta}>
                Environment: {healthData.environment || 'development'}
              </Text>
            </View>
          ) : null}

          <Button
            title={isFetching ? 'Checking...' : 'Re-verify API Connection'}
            variant="outline"
            loading={isFetching}
            onPress={() => refetch()}
            style={styles.refreshButton}
          />
        </Card>

        {/* User Roles Routing Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Role Workspaces</Text>
          <Text style={styles.sectionSubtitle}>
            Four unified mobile workspaces styled with official role color palettes:
          </Text>
        </View>

        {/* Admin Card */}
        <Card style={styles.roleCard}>
          <View style={styles.roleHeader}>
            <View style={[styles.roleIconBadge, { backgroundColor: ROLE_COLORS[USER_ROLES.ADMIN].background }]}>
              <Text style={[styles.roleIconText, { color: ROLE_COLORS[USER_ROLES.ADMIN].accent }]}>🏛️</Text>
            </View>
            <View style={styles.roleTextGroup}>
              <Text style={styles.roleTitle}>College Administrator</Text>
              <Text style={styles.roleDesc}>Institution-wide metrics, departments, and system oversight.</Text>
            </View>
          </View>
          <Button
            title="Inspect Admin Space"
            variant="outline"
            onPress={() => router.push(ROLE_ROUTES[USER_ROLES.ADMIN])}
            style={styles.roleNavButton}
          />
        </Card>

        {/* HOD Card */}
        <Card style={styles.roleCard}>
          <View style={styles.roleHeader}>
            <View style={[styles.roleIconBadge, { backgroundColor: ROLE_COLORS[USER_ROLES.DEPARTMENT_STAFF].background }]}>
              <Text style={[styles.roleIconText, { color: ROLE_COLORS[USER_ROLES.DEPARTMENT_STAFF].accent }]}>🏢</Text>
            </View>
            <View style={styles.roleTextGroup}>
              <Text style={styles.roleTitle}>Department Staff / HOD</Text>
              <Text style={styles.roleDesc}>Department allocations, faculty timetables, and batch governance.</Text>
            </View>
          </View>
          <Button
            title="Inspect HOD Space"
            variant="outline"
            onPress={() => router.push(ROLE_ROUTES[USER_ROLES.DEPARTMENT_STAFF])}
            style={styles.roleNavButton}
          />
        </Card>

        {/* Faculty Card */}
        <Card style={styles.roleCard}>
          <View style={styles.roleHeader}>
            <View style={[styles.roleIconBadge, { backgroundColor: ROLE_COLORS[USER_ROLES.FACULTY].background }]}>
              <Text style={[styles.roleIconText, { color: ROLE_COLORS[USER_ROLES.FACULTY].accent }]}>👨‍🏫</Text>
            </View>
            <View style={styles.roleTextGroup}>
              <Text style={styles.roleTitle}>Faculty</Text>
              <Text style={styles.roleDesc}>Class attendance, PIN session generation, and grading.</Text>
            </View>
          </View>
          <Button
            title="Inspect Faculty Space"
            variant="outline"
            onPress={() => router.push(ROLE_ROUTES[USER_ROLES.FACULTY])}
            style={styles.roleNavButton}
          />
        </Card>

        {/* Student Card */}
        <Card style={styles.roleCard}>
          <View style={styles.roleHeader}>
            <View style={[styles.roleIconBadge, { backgroundColor: ROLE_COLORS[USER_ROLES.STUDENT].background }]}>
              <Text style={[styles.roleIconText, { color: ROLE_COLORS[USER_ROLES.STUDENT].accent }]}>🎓</Text>
            </View>
            <View style={styles.roleTextGroup}>
              <Text style={styles.roleTitle}>Student</Text>
              <Text style={styles.roleDesc}>PIN check-in attendance, course enrollments, notices, and profile.</Text>
            </View>
          </View>
          <Button
            title="Inspect Student Space"
            variant="outline"
            onPress={() => router.push(ROLE_ROUTES[USER_ROLES.STUDENT])}
            style={styles.roleNavButton}
          />
        </Card>

        {/* System Diagnostics */}
        <Card style={styles.diagnosticsCard}>
          <Text style={styles.diagnosticsTitle}>Environment Information</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Platform Target:</Text>
            <Text style={styles.metaVal}>{Platform.OS.toUpperCase()} (Android Initial)</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Expo Framework:</Text>
            <Text style={styles.metaVal}>Expo SDK 58 + Expo Router</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Authentication:</Text>
            <Text style={styles.metaVal}>JWT + Expo SecureStore</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>State & Network:</Text>
            <Text style={styles.metaVal}>Axios + TanStack Query</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 16,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  authActionCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
  },
  authStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userEmailText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  authNoticeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  authCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  authCardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  primaryActionButton: {
    marginBottom: 8,
  },
  secondaryActionButton: {
    paddingVertical: 10,
  },
  statusCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOnline: {
    backgroundColor: COLORS.success,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
  },
  statusOffline: {
    backgroundColor: COLORS.danger,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 12,
  },
  infoBoxSuccess: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  successMeta: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  infoBoxError: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16,
  },
  hintText: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 6,
    fontStyle: 'italic',
  },
  refreshButton: {
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  roleCard: {
    marginBottom: 12,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleIconText: {
    fontSize: 22,
  },
  roleTextGroup: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roleDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  roleNavButton: {
    paddingVertical: 8,
  },
  diagnosticsCard: {
    marginTop: 4,
    backgroundColor: COLORS.surface,
  },
  diagnosticsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  metaKey: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
