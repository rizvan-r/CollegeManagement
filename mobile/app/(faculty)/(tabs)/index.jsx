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
import { COLORS } from '../../../src/constants/colors';
import { USER_ROLES } from '../../../src/constants/roles';
import { useAuth } from '../../../src/hooks/useAuth';
import { useFacultyDashboard } from '../../../src/hooks/useFacultyData';
import { Card, LoadingSpinner, ErrorView, RoleBadge, NotificationBell } from '../../../src/components';

export default function FacultyDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboard, isLoading, isError, error, refetch, isRefetching } = useFacultyDashboard();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Loading faculty instructional portal..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Dashboard"
          message={error?.message || 'Unable to retrieve faculty instructional records.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const facultyName = dashboard?.facultyName || user?.email?.split('@')[0] || 'Faculty Member';
  const employeeId = dashboard?.employeeId || 'EMP-CSE-002';
  const designation = dashboard?.designation || 'Faculty Member';
  const department = dashboard?.department || 'Academic Department';
  const assignedCoursesCount = dashboard?.assignedCoursesCount ?? 0;
  const totalEnrolledStudents = dashboard?.totalEnrolledStudents ?? 0;
  const sessionsConducted = dashboard?.sessionsConducted ?? 0;
  const averageAttendance = dashboard?.averageAttendance || '0%';
  const activeCourses = dashboard?.activeCourses || [];
  const recentNotices = dashboard?.recentNotices || [];

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
        {/* Header Profile Card */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {facultyName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.facultyInfo}>
              <View style={styles.badgeRow}>
                <RoleBadge role={USER_ROLES.FACULTY} />
                <View style={styles.headerActionRow}>
                  <NotificationBell size={20} color={COLORS.textSecondary} style={styles.bellBtn} />
                  <TouchableOpacity
                    onPress={() => router.push('/(faculty)/(tabs)/profile')}
                    hitSlop={8}
                    style={styles.profileIconBtn}
                  >
                    <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.facultyName} numberOfLines={1}>
                {facultyName}
              </Text>
              <Text style={styles.designationText}>
                {designation} • {employeeId}
              </Text>
              <Text style={styles.deptText} numberOfLines={1}>
                {department}
              </Text>
            </View>
          </View>
        </Card>

        {/* Instructional KPI Summary Metrics */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.metricValue}>{assignedCoursesCount}</Text>
            <Text style={styles.metricLabel}>Assigned Courses</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people-outline" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.metricValue}>{totalEnrolledStudents}</Text>
            <Text style={styles.metricLabel}>Total Students</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.metricValue}>{sessionsConducted}</Text>
            <Text style={styles.metricLabel}>Sessions Held</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="stats-chart-outline" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.metricValue}>{averageAttendance}</Text>
            <Text style={styles.metricLabel}>Avg Attendance</Text>
          </Card>
        </View>

        {/* Quick Action Matrix */}
        <Text style={styles.sectionHeaderTitle}>Instructional Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(faculty)/attendance/mark')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="checkbox-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTileTitle}>Mark Attendance</Text>
            <Text style={styles.actionTileSub}>Roll call & live sessions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(faculty)/(tabs)/courses')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: COLORS.accent }]}>
              <Ionicons name="library-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTileTitle}>My Courses</Text>
            <Text style={styles.actionTileSub}>Curriculum & rosters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(faculty)/attendance/history')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#0284C7' }]}>
              <Ionicons name="time-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTileTitle}>Session Logs</Text>
            <Text style={styles.actionTileSub}>Historical class records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(faculty)/(tabs)/notices')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#D97706' }]}>
              <Ionicons name="megaphone-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTileTitle}>Circulars</Text>
            <Text style={styles.actionTileSub}>Campus announcements</Text>
          </TouchableOpacity>
        </View>

        {/* Active Teaching Courses Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>My Teaching Courses</Text>
          <TouchableOpacity onPress={() => router.push('/(faculty)/(tabs)/courses')}>
            <Text style={styles.sectionSeeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {activeCourses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="school-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyCardTitle}>No Courses Assigned</Text>
            <Text style={styles.emptyCardSub}>
              Course assignments for this semester will appear once scheduled by the department head.
            </Text>
          </Card>
        ) : (
          activeCourses.map((c, idx) => (
            <Card key={c.id || c.course_assignment_id || idx} style={styles.courseItemCard}>
              <View style={styles.courseHeader}>
                <View style={styles.codePill}>
                  <Text style={styles.codePillText}>{c.code}</Text>
                </View>
                <View style={styles.sectionPill}>
                  <Text style={styles.sectionPillText}>Section {c.section || 'A'}</Text>
                </View>
              </View>

              <Text style={styles.courseTitle} numberOfLines={2}>
                {c.title}
              </Text>

              <View style={styles.courseStatsRow}>
                <View style={styles.courseStatItem}>
                  <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.courseStatText}>{c.students || 0} Students</Text>
                </View>
                <View style={styles.courseStatItem}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.courseStatText}>{c.sessions_count || 0} Sessions Held</Text>
                </View>
              </View>

              <View style={styles.courseActionsRow}>
                <TouchableOpacity
                  style={styles.courseRosterBtn}
                  onPress={() => router.push(`/(faculty)/course/${c.course_assignment_id || c.id}`)}
                >
                  <Text style={styles.courseRosterBtnText}>View Roster</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.courseMarkBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/(faculty)/attendance/mark',
                      params: { courseAssignmentId: c.course_assignment_id || c.id },
                    })
                  }
                >
                  <Ionicons name="checkbox-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.courseMarkBtnText}>Roll Call</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Recent Institutional Circulars */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionHeaderTitle}>Department Notices</Text>
          <TouchableOpacity onPress={() => router.push('/(faculty)/(tabs)/notices')}>
            <Text style={styles.sectionSeeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentNotices.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyCardSub}>No recent notices for this department.</Text>
          </Card>
        ) : (
          recentNotices.slice(0, 3).map((notice) => (
            <Card key={notice.id} style={styles.noticeCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/(faculty)/notice/${notice.id}`)}
              >
                <View style={styles.noticeHeaderRow}>
                  <View
                    style={[
                      styles.priorityPill,
                      {
                        backgroundColor:
                          notice.priority === 'HIGH' || notice.priority === 'URGENT'
                            ? '#FEF2F2'
                            : '#EEF2FF',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityPillText,
                        {
                          color:
                            notice.priority === 'HIGH' || notice.priority === 'URGENT'
                              ? COLORS.danger
                              : COLORS.primary,
                        },
                      ]}
                    >
                      {notice.priority || 'NORMAL'}
                    </Text>
                  </View>
                  <Text style={styles.noticeDate}>
                    {notice.date ? new Date(notice.date).toLocaleDateString() : 'Active'}
                  </Text>
                </View>

                <Text style={styles.noticeTitle} numberOfLines={1}>
                  {notice.title}
                </Text>
                <Text style={styles.noticeExcerpt} numberOfLines={2}>
                  {notice.content}
                </Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
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
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeaderCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  facultyInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    padding: 2,
  },
  facultyName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  designationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  deptText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    padding: 14,
    borderRadius: 12,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionSeeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  actionTile: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  actionTileSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptyCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  courseItemCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  courseStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  courseStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseStatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  courseActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
  courseRosterBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseRosterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  courseMarkBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseMarkBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noticeCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  noticeDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  noticeExcerpt: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});

