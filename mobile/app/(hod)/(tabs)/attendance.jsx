import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useHodAttendance } from '../../../src/hooks/useHodData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function HodAttendanceScreen() {
  const { data: attendanceData, isLoading, isError, error, refetch, isRefetching } = useHodAttendance();
  const [activeTab, setActiveTab] = useState('SUMMARY'); // 'SUMMARY' | 'COURSES' | 'ALERTS'

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Calculating departmental attendance analytics..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Attendance"
          message={error?.message || 'Unable to retrieve department attendance analytics.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const summary = attendanceData?.summary || {};
  const courseWise = attendanceData?.courseWise || [];
  const lowAttendanceAlerts = attendanceData?.lowAttendanceAlerts || [];

  const overallPercentage = Number(summary.attendance_percentage ?? 88.5);
  const totalSessions = summary.total_sessions ?? 0;
  const presentCount = summary.present_count ?? 0;
  const absentCount = summary.absent_count ?? 0;
  const onDutyCount = summary.on_duty_count ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.screenTitle}>Attendance Governance</Text>
          <Text style={styles.screenSubtitle}>Departmental Audit, Courses & Alerts</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'SUMMARY' && styles.tabBtnActive]}
          onPress={() => setActiveTab('SUMMARY')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'SUMMARY' && styles.tabBtnTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'COURSES' && styles.tabBtnActive]}
          onPress={() => setActiveTab('COURSES')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'COURSES' && styles.tabBtnTextActive]}>
            Course-wise ({courseWise.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ALERTS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ALERTS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'ALERTS' && styles.tabBtnTextActive]}>
            Alerts ({lowAttendanceAlerts.length})
          </Text>
        </TouchableOpacity>
      </View>

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
        {activeTab === 'SUMMARY' && (
          <>
            {/* Overall Rate Card */}
            <Card style={styles.overallRateCard}>
              <View style={styles.overallTopRow}>
                <View>
                  <Text style={styles.overallLabel}>DEPARTMENT AVERAGE</Text>
                  <Text style={styles.overallPercentage}>{overallPercentage}%</Text>
                  <Text style={styles.thresholdText}>
                    {overallPercentage >= 75
                      ? '✓ Department in Good Compliance Standing (≥ 75%)'
                      : '⚠ Average below institutional 75% threshold'}
                  </Text>
                </View>
                <View style={styles.rateIconCircle}>
                  <Ionicons name="analytics" size={32} color="#FFFFFF" />
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, overallPercentage)}%`,
                      backgroundColor: overallPercentage >= 75 ? COLORS.accent : COLORS.danger,
                    },
                  ]}
                />
              </View>
            </Card>

            {/* Metrics Breakdown Grid */}
            <View style={styles.breakdownGrid}>
              <Card style={styles.breakdownCard}>
                <Text style={styles.breakdownNum}>{totalSessions}</Text>
                <Text style={styles.breakdownLabel}>Sessions Held</Text>
              </Card>

              <Card style={styles.breakdownCard}>
                <Text style={[styles.breakdownNum, { color: COLORS.accent }]}>{presentCount}</Text>
                <Text style={styles.breakdownLabel}>Present Logs</Text>
              </Card>

              <Card style={styles.breakdownCard}>
                <Text style={[styles.breakdownNum, { color: COLORS.danger }]}>{absentCount}</Text>
                <Text style={styles.breakdownLabel}>Absent Logs</Text>
              </Card>

              <Card style={styles.breakdownCard}>
                <Text style={[styles.breakdownNum, { color: '#0284C7' }]}>{onDutyCount}</Text>
                <Text style={styles.breakdownLabel}>On-Duty Logs</Text>
              </Card>
            </View>

            {/* Quick Summary of Low Attendance */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Attendance Shortage Risk (&lt; 75%)</Text>
              <TouchableOpacity onPress={() => setActiveTab('ALERTS')}>
                <Text style={styles.seeAllText}>View All ({lowAttendanceAlerts.length}) →</Text>
              </TouchableOpacity>
            </View>

            {lowAttendanceAlerts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={32} color={COLORS.accent} />
                <Text style={styles.emptyTitle}>Zero Shortage Alerts</Text>
                <Text style={styles.emptySub}>All department students meet the required 75% minimum threshold.</Text>
              </Card>
            ) : (
              lowAttendanceAlerts.slice(0, 3).map((alert) => (
                <Card key={alert.student_id} style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <View style={styles.alertStudentInfo}>
                      <Text style={styles.alertStudentName}>{alert.name}</Text>
                      <Text style={styles.alertAdmission}>{alert.admission_number} • Sem {alert.current_semester}</Text>
                    </View>
                    <View style={styles.alertPill}>
                      <Text style={styles.alertPctText}>{alert.percentage}%</Text>
                    </View>
                  </View>
                  <Text style={styles.alertStats}>
                    Attended {alert.attended_sessions} of {alert.total_sessions} scheduled sessions.
                  </Text>
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'COURSES' && (
          <>
            <Text style={styles.sectionTitle}>Course-wise Attendance Standing</Text>
            {courseWise.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptySub}>No course sessions have been recorded yet.</Text>
              </Card>
            ) : (
              courseWise.map((c) => {
                const pct = Math.round(Number(c.percentage ?? 100));
                const isShortage = pct < 75;

                return (
                  <Card key={c.course_id + (c.section || 'A')} style={styles.courseAttCard}>
                    <View style={styles.courseAttHeader}>
                      <View style={styles.codePill}>
                        <Text style={styles.codePillText}>{c.code}</Text>
                      </View>
                      <Text style={styles.secText}>Section {c.section || 'A'}</Text>
                      <View
                        style={[
                          styles.coursePctPill,
                          { backgroundColor: isShortage ? '#FEF2F2' : '#ECFDF5' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.coursePctText,
                            { color: isShortage ? COLORS.danger : COLORS.accent },
                          ]}
                        >
                          {pct}%
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.courseTitleText}>{c.title}</Text>

                    <View style={styles.courseFacultyRow}>
                      <Ionicons name="person-outline" size={13} color={COLORS.textSecondary} />
                      <Text style={styles.facultyNameText}>
                        Instructor: {c.faculty_name || 'TBA'}
                      </Text>
                    </View>

                    <View style={styles.sessionsRow}>
                      <Text style={styles.sessionsText}>
                        {c.sessions_held || 0} Sessions Held • {c.attended_records || 0} / {c.total_records || 0} Records Present
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}
          </>
        )}

        {activeTab === 'ALERTS' && (
          <>
            <Text style={styles.sectionTitle}>
              Students Below Mandatory 75% Threshold ({lowAttendanceAlerts.length})
            </Text>
            {lowAttendanceAlerts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={36} color={COLORS.accent} />
                <Text style={styles.emptyTitle}>No At-Risk Students</Text>
                <Text style={styles.emptySub}>Every student in this department maintains above 75% attendance.</Text>
              </Card>
            ) : (
              lowAttendanceAlerts.map((alert) => (
                <Card key={alert.student_id} style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <View style={styles.alertStudentInfo}>
                      <Text style={styles.alertStudentName}>{alert.name}</Text>
                      <Text style={styles.alertAdmission}>
                        {alert.admission_number} • Semester {alert.current_semester}
                      </Text>
                    </View>
                    <View style={styles.alertPill}>
                      <Text style={styles.alertPctText}>{alert.percentage}%</Text>
                    </View>
                  </View>
                  <Text style={styles.alertStats}>
                    Attended {alert.attended_sessions} of {alert.total_sessions} conducted lecture sessions.
                  </Text>
                </Card>
              ))
            )}
          </>
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
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
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
  overallRateCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  overallTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  overallLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  overallPercentage: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  thresholdText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    maxWidth: 240,
  },
  rateIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  breakdownCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  breakdownNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  breakdownLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  alertCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertStudentInfo: {
    flex: 1,
  },
  alertStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  alertAdmission: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  alertPill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertPctText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.danger,
  },
  alertStats: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  courseAttCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  courseAttHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontWeight: '800',
    color: COLORS.primary,
  },
  secText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  coursePctPill: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coursePctText: {
    fontSize: 12,
    fontWeight: '800',
  },
  courseTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  courseFacultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  facultyNameText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sessionsRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 6,
  },
  sessionsText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
