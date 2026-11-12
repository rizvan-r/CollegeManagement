import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ROLE_COLORS } from '../../../src/constants/colors';
import { USER_ROLES } from '../../../src/constants/roles';
import { useAuth } from '../../../src/hooks/useAuth';
import { useStudentDashboard } from '../../../src/hooks/useStudentData';
import { Card, LoadingSpinner, ErrorView, RoleBadge, NotificationBell } from '../../../src/components';

export default function StudentDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboard, isLoading, isError, error, refetch, isRefetching } = useStudentDashboard();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Loading academic records..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Dashboard"
          message={error?.message || 'Unable to retrieve academic records.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const studentName = dashboard?.studentName || user?.email?.split('@')[0] || 'Student';
  const admissionNumber = dashboard?.admissionNumber || 'N/A';
  const department = dashboard?.department || 'Department Roster';
  const semester = dashboard?.currentSemester || 'Academic Session';
  const overallAttendance = Number(dashboard?.overallAttendance ?? 100);
  const enrolledCoursesCount = dashboard?.enrolledCoursesCount ?? 0;
  const recentNotices = dashboard?.recentNotices || [];
  const subjectAttendance = dashboard?.subjectAttendance || [];

  const isLowAttendance = overallAttendance < 75;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Academic Governance Header Card */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {studentName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <View style={styles.badgeRow}>
                <RoleBadge role={USER_ROLES.STUDENT} />
                <View style={styles.headerActionRow}>
                  <NotificationBell size={20} color={COLORS.textSecondary} style={styles.bellBtn} />
                  <TouchableOpacity
                    onPress={() => router.push('/(student)/(tabs)/profile')}
                    hitSlop={8}
                    style={styles.profileIconBtn}
                  >
                    <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>
                {studentName}
              </Text>
              <Text style={styles.admissionNumber}>{admissionNumber}</Text>
            </View>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Department</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{department}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Standing</Text>
              <Text style={styles.metaValue}>{semester}</Text>
            </View>
          </View>
        </Card>

        {/* Quick Action Matrix */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.7}
            onPress={() => router.push('/(student)/(tabs)/courses')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="book" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTileTitle}>Courses</Text>
            <Text style={styles.actionTileCount}>{enrolledCoursesCount} Enrolled</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.7}
            onPress={() => router.push('/(student)/(tabs)/attendance')}
          >
            <View
              style={[
                styles.actionIconBg,
                { backgroundColor: isLowAttendance ? '#FEF2F2' : '#ECFDF5' },
              ]}
            >
              <Ionicons
                name="calendar"
                size={20}
                color={isLowAttendance ? COLORS.danger : COLORS.accent}
              />
            </View>
            <Text style={styles.actionTileTitle}>Attendance</Text>
            <Text
              style={[
                styles.actionTileCount,
                { color: isLowAttendance ? COLORS.danger : COLORS.success },
              ]}
            >
              {overallAttendance.toFixed(1)}% Avg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.7}
            onPress={() => router.push('/(student)/(tabs)/notices')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="notifications" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.actionTileTitle}>Notices</Text>
            <Text style={styles.actionTileCount}>{recentNotices.length} Unread</Text>
          </TouchableOpacity>
        </View>

        {/* Attendance Summary Card */}
        <Card style={styles.attendanceCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Attendance Standing</Text>
              <Text style={styles.sectionSubtitle}>Institutional Threshold: 75% Required</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/attendance')}>
              <Text style={styles.viewAllText}>View History →</Text>
            </TouchableOpacity>
          </View>

          {isLowAttendance ? (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={18} color={COLORS.danger} />
              <Text style={styles.warningBannerText}>
                Attendance alert: Your current standing is below the 75% semester requirement.
              </Text>
            </View>
          ) : null}

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Metric</Text>
              <Text style={styles.progressValue}>{overallAttendance.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(overallAttendance, 100)}%`,
                    backgroundColor: isLowAttendance ? COLORS.danger : COLORS.success,
                  },
                ]}
              />
            </View>
          </View>

          {/* Subject Snapshot */}
          {subjectAttendance.slice(0, 3).map((subj, idx) => (
            <View key={subj.code || idx} style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectCode}>{subj.code}</Text>
                <Text style={styles.subjectTitle} numberOfLines={1}>{subj.title}</Text>
              </View>
              <View style={styles.subjectStats}>
                <Text
                  style={[
                    styles.subjectPercent,
                    { color: (subj.percent ?? 100) < 75 ? COLORS.danger : COLORS.textPrimary },
                  ]}
                >
                  {(subj.percent ?? 100).toFixed(0)}%
                </Text>
                <Text style={styles.subjectRatio}>
                  {subj.present ?? 0}/{subj.total ?? 0}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Recent Institutional Notices */}
        <Card style={styles.noticesCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Recent Notices</Text>
              <Text style={styles.sectionSubtitle}>Campus & Department Circulars</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/notices')}>
              <Text style={styles.viewAllText}>All Notices →</Text>
            </TouchableOpacity>
          </View>

          {recentNotices.length === 0 ? (
            <Text style={styles.emptyNoticeText}>No recent notices published.</Text>
          ) : (
            recentNotices.slice(0, 3).map((notice) => (
              <TouchableOpacity
                key={notice.id}
                style={styles.noticeItem}
                activeOpacity={0.7}
                onPress={() => router.push(`/(student)/notice/${notice.id}`)}
              >
                <View
                  style={[
                    styles.priorityBar,
                    {
                      backgroundColor:
                        notice.priority === 'HIGH' || notice.priority === 'URGENT'
                          ? COLORS.danger
                          : COLORS.primaryLight,
                    },
                  ]}
                />
                <View style={styles.noticeTextContainer}>
                  <Text style={styles.noticeItemTitle} numberOfLines={1}>
                    {notice.title}
                  </Text>
                  <Text style={styles.noticeItemDate}>
                    {notice.date || 'Recent Notice'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))
          )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeaderCard: {
    padding: 16,
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  studentInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bellBtn: {
    width: 32,
    height: 32,
  },
  profileIconBtn: {
    padding: 4,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  admissionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionTile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    elevation: 1,
  },
  actionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTileTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionTileCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  attendanceCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.danger,
    lineHeight: 16,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  subjectInfo: {
    flex: 1,
    marginRight: 10,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subjectTitle: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  subjectStats: {
    alignItems: 'flex-end',
  },
  subjectPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  subjectRatio: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  noticesCard: {
    padding: 16,
  },
  emptyNoticeText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  priorityBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginRight: 10,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  noticeItemDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

