import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { USER_ROLES } from '../../../src/constants/roles';
import { useAuth } from '../../../src/hooks/useAuth';
import { useHodDashboard, useProcessRequest } from '../../../src/hooks/useHodData';
import { Card, LoadingSpinner, ErrorView, RoleBadge, NotificationBell } from '../../../src/components';

export default function HodDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboard, isLoading, isError, error, refetch, isRefetching } = useHodDashboard();
  const processMutation = useProcessRequest();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Loading departmental governance portal..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Dashboard"
          message={error?.message || 'Unable to retrieve departmental statistics.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const hodName = dashboard?.hodName || user?.email?.split('@')[0] || 'Department HOD';
  const departmentName = dashboard?.departmentName || 'Computer Science & Engineering';
  const departmentCode = dashboard?.departmentCode || 'CSE';
  const employeeId = dashboard?.employeeId || 'EMP-CSE-001';
  const studentCount = dashboard?.studentCount ?? 0;
  const facultyCount = dashboard?.facultyCount ?? 0;
  const courseCount = dashboard?.courseCount ?? 0;
  const avgAttendance = dashboard?.avgAttendance || '0%';
  const lowAttendanceCount = dashboard?.lowAttendanceCount ?? 0;
  const pendingRequestsCount = dashboard?.pendingRequestsCount ?? 0;
  const recentRequests = dashboard?.recentRequests || [];
  const recentNotices = dashboard?.recentNotices || [];

  const handleQuickApprove = async (id) => {
    try {
      await processMutation.mutateAsync({
        id,
        status: 'APPROVED',
        remarks: 'Approved by Department Head via Mobile Portal',
      });
      Alert.alert('Request Approved', 'The student request has been sanctioned successfully.');
    } catch (err) {
      Alert.alert('Action Failed', err.message || 'Failed to process request.');
    }
  };

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
        {/* HOD Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{hodName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.badgeRow}>
                <RoleBadge role={USER_ROLES.DEPARTMENT_STAFF} />
                <View style={styles.headerActionRow}>
                  <NotificationBell size={20} color={COLORS.textSecondary} style={styles.bellBtn} />
                  <TouchableOpacity
                    onPress={() => router.push('/(hod)/profile')}
                    hitSlop={8}
                    style={styles.profileBtn}
                  >
                    <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.hodName} numberOfLines={1}>
                {hodName}
              </Text>
              <Text style={styles.designationText}>
                Head of Department • {employeeId}
              </Text>
              <Text style={styles.deptName} numberOfLines={1}>
                {departmentName} ({departmentCode})
              </Text>
            </View>
          </View>
        </Card>

        {/* Department KPI Analytics Grid */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.kpiValue}>{studentCount}</Text>
            <Text style={styles.kpiLabel}>Scholars</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="briefcase-outline" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.kpiValue}>{facultyCount}</Text>
            <Text style={styles.kpiLabel}>Faculty</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="book-outline" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.kpiValue}>{courseCount}</Text>
            <Text style={styles.kpiLabel}>Courses</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="analytics-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.kpiValue}>{avgAttendance}</Text>
            <Text style={styles.kpiLabel}>Attendance</Text>
          </Card>
        </View>

        {/* Urgent Action Alert Banner */}
        {lowAttendanceCount > 0 || pendingRequestsCount > 0 ? (
          <View style={styles.alertBanner}>
            <Ionicons name="alert-circle" size={20} color="#D97706" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertBannerTitle}>Department Attention Required</Text>
              <Text style={styles.alertBannerSub}>
                {pendingRequestsCount} pending approval request(s) • {lowAttendanceCount} student(s) below 75% attendance.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Quick Governance Actions */}
        <Text style={styles.sectionTitle}>Department Management</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(hod)/requests')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#7C3AED' }]}>
              <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Requests</Text>
            <Text style={styles.actionSub}>Approvals & OD</Text>
            {pendingRequestsCount > 0 ? (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{pendingRequestsCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(hod)/(tabs)/faculty')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="people-circle-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Faculty</Text>
            <Text style={styles.actionSub}>Staff & Workload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(hod)/(tabs)/students')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.accent }]}>
              <Ionicons name="school-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Students</Text>
            <Text style={styles.actionSub}>Roster & Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(hod)/(tabs)/attendance')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#0284C7' }]}>
              <Ionicons name="stats-chart-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Attendance</Text>
            <Text style={styles.actionSub}>Audit & Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(hod)/courses')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="library-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Courses</Text>
            <Text style={styles.actionSub}>Curriculum Matrix</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => router.push('/(hod)/notice/create')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E11D48' }]}>
              <Ionicons name="megaphone-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Publish</Text>
            <Text style={styles.actionSub}>Announcements</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Requests Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pending Approvals</Text>
          <TouchableOpacity onPress={() => router.push('/(hod)/requests')}>
            <Text style={styles.seeAllText}>View All ({pendingRequestsCount}) →</Text>
          </TouchableOpacity>
        </View>

        {recentRequests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color={COLORS.accent} />
            <Text style={styles.emptyTitle}>All Requests Clear</Text>
            <Text style={styles.emptySub}>No student academic or leave requests pending approval.</Text>
          </Card>
        ) : (
          recentRequests.map((req) => (
            <Card key={req.id} style={styles.requestCard}>
              <View style={styles.requestTop}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{req.type.replace('_', ' ')}</Text>
                </View>
                <Text style={styles.requestDate}>{req.date}</Text>
              </View>

              <Text style={styles.requestStudent}>{req.studentName} ({req.admissionNumber})</Text>
              <Text style={styles.requestReason} numberOfLines={2}>
                Reason: {req.reason}
              </Text>
              <Text style={styles.requestAffected}>Impact: {req.sessionsAffected}</Text>

              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.quickApproveBtn}
                  onPress={() => handleQuickApprove(req.id)}
                  disabled={processMutation.isPending}
                >
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.quickApproveText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => router.push('/(hod)/requests')}
                >
                  <Text style={styles.detailsBtnText}>Review</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Recent Circulars Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Department Notices</Text>
          <TouchableOpacity onPress={() => router.push('/(hod)/notices')}>
            <Text style={styles.seeAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {recentNotices.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptySub}>No active notices published.</Text>
          </Card>
        ) : (
          recentNotices.slice(0, 3).map((notice) => (
            <Card key={notice.id} style={styles.noticeCard}>
              <View style={styles.noticeTop}>
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
                      styles.priorityText,
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
                  {notice.date ? new Date(notice.date).toLocaleDateString() : 'Current'}
                </Text>
              </View>
              <Text style={styles.noticeTitle} numberOfLines={1}>
                {notice.title}
              </Text>
              <Text style={styles.noticeContent} numberOfLines={2}>
                {notice.content}
              </Text>
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
  headerCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  headerInfo: {
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
  profileBtn: {
    padding: 2,
  },
  hodName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  designationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
    marginTop: 2,
  },
  deptName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    padding: 14,
    borderRadius: 12,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alertBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  alertBannerSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  sectionTitle: {
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
  seeAllText: {
    fontSize: 12,
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
    width: '31%',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    position: 'relative',
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  actionSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  actionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  requestCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  requestDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  requestStudent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  requestReason: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  requestAffected: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 10,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
  },
  quickApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickApproveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  noticeCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  noticeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  noticeDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  noticeContent: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
});

