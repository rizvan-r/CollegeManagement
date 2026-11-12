import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAdminDashboard } from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, NotificationBell } from '../../../src/components';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { data: dashboard, isLoading, isError, error, refetch, isRefetching } = useAdminDashboard();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Institutional Command Console..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          message={error?.message || 'Failed to retrieve administrative metrics'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const stats = dashboard || {};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* 1. Executive Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerTopRow}>
            <View style={styles.bannerBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.bannerBadgeText}>ACADEMIC REGISTRAR HUB</Text>
            </View>
            <View style={styles.bannerActionRow}>
              <NotificationBell size={20} color="#FFFFFF" style={styles.bellBtn} />
              <TouchableOpacity
                style={styles.profileShortcut}
                onPress={() => router.push('/(admin)/profile')}
                activeOpacity={0.7}
              >
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.bannerTitle}>Executive Institutional Console</Text>
          <Text style={styles.bannerSubtitle}>
            Metropolitan Institute of Technology • AY 2025–2026
          </Text>
        </View>

        {/* 2. Institutional KPI Matrix */}
        <Text style={styles.sectionHeading}>Institutional Metrics</Text>
        <View style={styles.kpiGrid}>
          {/* Total Students */}
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people" size={20} color={COLORS.primaryLight} />
            </View>
            <Text style={styles.kpiNumber}>{stats.totalStudents || 0}</Text>
            <Text style={styles.kpiLabel}>Enrolled Scholars</Text>
          </Card>

          {/* Total Faculty */}
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="briefcase" size={20} color="#D97706" />
            </View>
            <Text style={styles.kpiNumber}>{stats.totalFaculty || 0}</Text>
            <Text style={styles.kpiLabel}>Faculty Members</Text>
          </Card>

          {/* Departments */}
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="business" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.kpiNumber}>{stats.totalDepartments || 0}</Text>
            <Text style={styles.kpiLabel}>Departments</Text>
          </Card>

          {/* Courses */}
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="book" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.kpiNumber}>{stats.totalCourses || 0}</Text>
            <Text style={styles.kpiLabel}>Active Courses</Text>
          </Card>
        </View>

        {/* 3. Institutional Health Summary Strip */}
        <Card style={styles.healthStripCard}>
          <View style={styles.healthRow}>
            <View style={styles.healthMetric}>
              <Text style={styles.healthSub}>Campus Attendance</Text>
              <Text style={styles.healthVal}>{stats.overallAttendanceAvg || '88.4%'}</Text>
            </View>
            <View style={styles.healthDivider} />
            <View style={styles.healthMetric}>
              <Text style={styles.healthSub}>Registered Users</Text>
              <Text style={styles.healthVal}>{stats.totalUsers || 0}</Text>
            </View>
            <View style={styles.healthDivider} />
            <View style={styles.healthMetric}>
              <Text style={styles.healthSub}>Sessions Today</Text>
              <Text style={styles.healthVal}>{stats.sessionsToday || 0}</Text>
            </View>
          </View>
        </Card>

        {/* 4. Attention Required / Attendance Alert Banner */}
        {stats.lowAttendanceAlertCount > 0 ? (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => router.push('/(admin)/(tabs)/reports')}
            activeOpacity={0.8}
          >
            <View style={styles.alertIconWrapper}>
              <Ionicons name="warning" size={22} color={COLORS.danger} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Attendance Shortage Alert</Text>
              <Text style={styles.alertDescription}>
                {stats.lowAttendanceAlertCount} scholar(s) currently below mandatory 75% attendance quota.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        ) : null}

        {/* 5. Executive Quick Action Command Horizon */}
        <Text style={styles.sectionHeading}>Administrative Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(admin)/students/create')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="person-add" size={18} color={COLORS.primaryLight} />
            </View>
            <Text style={styles.actionButtonText}>Enroll Student</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(admin)/faculty/create')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="add-circle" size={18} color="#D97706" />
            </View>
            <Text style={styles.actionButtonText}>Add Faculty</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(admin)/departments/create')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="business-outline" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.actionButtonText}>Add Dept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(admin)/notices/create')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="megaphone" size={18} color="#DB2777" />
            </View>
            <Text style={styles.actionButtonText}>Broadcast</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Pending Academic Approvals */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Pending Approvals</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/requests')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.approvalCard}>
          <View style={styles.approvalHeader}>
            <View style={styles.approvalTag}>
              <Text style={styles.approvalTagText}>CONDONATION</Text>
            </View>
            <Text style={styles.approvalTime}>Submitted Oct 22</Text>
          </View>
          <Text style={styles.approvalStudent}>Alex Mercer • CMP-2025-CSE-0001</Text>
          <Text style={styles.approvalReason}>
            Medical attendance condonation request with hospital discharge certificate.
          </Text>
          <View style={styles.approvalActions}>
            <TouchableOpacity
              style={styles.approvalReviewBtn}
              onPress={() => router.push('/(admin)/requests')}
            >
              <Text style={styles.approvalReviewText}>Review &amp; Authorize</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* 7. Institutional Notices */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Bulletins</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/notices')}>
            <Text style={styles.seeAllText}>Manage</Text>
          </TouchableOpacity>
        </View>

        {stats.recentNotices?.length > 0 ? (
          stats.recentNotices.map((n) => (
            <Card key={n.id} style={styles.noticeCard}>
              <View style={styles.noticeHeader}>
                <View
                  style={[
                    styles.priorityTag,
                    n.priority === 'HIGH' || n.priority === 'URGENT'
                      ? styles.priorityHigh
                      : styles.priorityNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      n.priority === 'HIGH' || n.priority === 'URGENT'
                        ? styles.priorityHighText
                        : styles.priorityNormalText,
                    ]}
                  >
                    {n.priority}
                  </Text>
                </View>
                <Text style={styles.noticeDate}>{n.date ? String(n.date).slice(0, 10) : 'Recent'}</Text>
              </View>
              <Text style={styles.noticeTitle}>{n.title}</Text>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyNote}>No institutional bulletins published yet.</Text>
        )}

        {/* 8. Recent Audit Logs */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Audit Trail Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/audit-logs')}>
            <Text style={styles.seeAllText}>Full Log</Text>
          </TouchableOpacity>
        </View>

        {stats.recentAuditLogs?.length > 0 ? (
          stats.recentAuditLogs.map((log) => (
            <View key={log.id} style={styles.auditItem}>
              <View style={styles.auditIcon}>
                <Ionicons name="git-commit" size={16} color={COLORS.textSecondary} />
              </View>
              <View style={styles.auditBody}>
                <Text style={styles.auditAction}>{log.action}</Text>
                <Text style={styles.auditEntity}>{log.entity}</Text>
                <Text style={styles.auditMeta}>{log.user} • {log.time || log.date}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyNote}>No audit log entries recorded yet.</Text>
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
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerContainer: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  bannerBadgeText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bellBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  profileShortcut: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 10,
  },
  kpiCard: {
    width: '47.5%',
    margin: '1.25%',
    padding: 14,
    borderRadius: 12,
  },
  kpiIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  kpiLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  healthStripCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthMetric: {
    flex: 1,
    alignItems: 'center',
  },
  healthSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  healthVal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  healthDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  alertIconWrapper: {
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  alertDescription: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  actionButton: {
    width: '23%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  approvalCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  approvalTag: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  approvalTagText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  approvalTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  approvalStudent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  approvalReason: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 6,
    lineHeight: 16,
  },
  approvalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  approvalReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  approvalReviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  noticeCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityNormal: {
    backgroundColor: '#EFF6FF',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityHighText: {
    color: COLORS.danger,
  },
  priorityNormalText: {
    color: COLORS.primaryLight,
  },
  noticeDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  auditItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  auditIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  auditBody: {
    flex: 1,
  },
  auditAction: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  auditEntity: {
    fontSize: 11,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  auditMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginVertical: 8,
  },
});

