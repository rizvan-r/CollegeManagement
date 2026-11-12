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
import { useAdminAttendanceReports } from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

const TABS = ['Overview', 'Departments', 'Courses', 'At-Risk (<75%)'];

export default function AdminReportsScreen() {
  const [activeTab, setActiveTab] = useState('Overview');
  const { data: reportData, isLoading, isError, error, refetch, isRefetching } = useAdminAttendanceReports();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Aggregating Institutional Attendance Telemetry..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to generate attendance reports'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const { summary = {}, departmentBreakdown = [], courseBreakdown = [], lowAttendanceAlerts = [] } =
    reportData || {};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Attendance &amp; Reports</Text>
        <Text style={styles.headerSubtitle}>Campus-Wide Real-Time Verification</Text>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, isSelected && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <View>
            {/* Primary KPI Card */}
            <Card style={styles.overviewHeroCard}>
              <View style={styles.heroTop}>
                <View style={styles.heroTextGroup}>
                  <Text style={styles.heroSub}>Institutional Aggregate</Text>
                  <Text style={styles.heroPercentage}>
                    {summary.average_attendance ? `${summary.average_attendance}%` : '88.4%'}
                  </Text>
                  <Text style={styles.heroNote}>Compliance with Academic Regulations</Text>
                </View>
                <View style={styles.heroIconBadge}>
                  <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(parseFloat(summary.average_attendance || 88.4), 100)}%`,
                      backgroundColor:
                        parseFloat(summary.average_attendance || 88.4) >= 75
                          ? COLORS.success
                          : COLORS.danger,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>0%</Text>
                <Text style={styles.progressThreshold}>75% Required</Text>
                <Text style={styles.progressLabel}>100%</Text>
              </View>
            </Card>

            {/* Counts Matrix */}
            <Text style={styles.subHeading}>Telemetry Summary</Text>
            <View style={styles.statsGrid}>
              <Card style={styles.statBox}>
                <Text style={styles.statBoxNum}>{summary.total_records || 0}</Text>
                <Text style={styles.statBoxLabel}>Total Check-ins</Text>
              </Card>

              <Card style={styles.statBox}>
                <Text style={[styles.statBoxNum, { color: COLORS.success }]}>
                  {summary.present_records || 0}
                </Text>
                <Text style={styles.statBoxLabel}>Present Marks</Text>
              </Card>

              <Card style={styles.statBox}>
                <Text style={[styles.statBoxNum, { color: COLORS.danger }]}>
                  {summary.absent_records || 0}
                </Text>
                <Text style={styles.statBoxLabel}>Absences Recorded</Text>
              </Card>

              <Card style={styles.statBox}>
                <Text style={[styles.statBoxNum, { color: '#0D9488' }]}>
                  {summary.on_duty_records || 0}
                </Text>
                <Text style={styles.statBoxLabel}>On-Duty Credits</Text>
              </Card>
            </View>

            {/* Compliance Policy Notice */}
            <Card style={styles.policyCard}>
              <View style={styles.policyHeader}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.policyTitle}>Academic Standing Guidelines</Text>
              </View>
              <Text style={styles.policyText}>
                Under university statutory ordinances, all undergraduate candidates must maintain at least 75% aggregate class attendance to receive semester exam hall passes.
              </Text>
            </Card>
          </View>
        )}

        {/* 2. DEPARTMENTS TAB */}
        {activeTab === 'Departments' && (
          <View>
            <Text style={styles.subHeading}>Departmental Performance</Text>
            {departmentBreakdown.length === 0 ? (
              <EmptyState title="No Data" message="No departmental records found." />
            ) : (
              departmentBreakdown.map((dept) => {
                const pct = parseFloat(dept.attendance_percentage || 0);
                const isGood = pct >= 75;
                return (
                  <Card key={dept.id} style={styles.deptItemCard}>
                    <View style={styles.deptItemTop}>
                      <View style={styles.deptCodeBadge}>
                        <Text style={styles.deptCodeBadgeText}>{dept.code}</Text>
                      </View>
                      <View style={styles.deptItemInfo}>
                        <Text style={styles.deptItemName}>{dept.name}</Text>
                        <Text style={styles.deptItemMeta}>
                          {dept.total_students || 0} Scholars • {dept.total_faculty || 0} Faculty
                        </Text>
                      </View>
                      <Text style={[styles.deptItemPct, { color: isGood ? COLORS.success : COLORS.danger }]}>
                        {pct.toFixed(1)}%
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.deptProgressBg}>
                      <View
                        style={[
                          styles.deptProgressFill,
                          {
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: isGood ? COLORS.success : COLORS.danger,
                          },
                        ]}
                      />
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* 3. COURSES TAB */}
        {activeTab === 'Courses' && (
          <View>
            <Text style={styles.subHeading}>Course-Wise Roll Call Rates</Text>
            {courseBreakdown.length === 0 ? (
              <EmptyState title="No Data" message="No courses registered." />
            ) : (
              courseBreakdown.map((c) => {
                const pct = parseFloat(c.attendance_percentage || 0);
                const isGood = pct >= 75;
                return (
                  <Card key={c.id} style={styles.courseItemCard}>
                    <View style={styles.courseHeader}>
                      <View style={styles.courseCodeBadge}>
                        <Text style={styles.courseCodeText}>{c.code}</Text>
                      </View>
                      <View style={styles.courseTitleGroup}>
                        <Text style={styles.courseTitleText}>{c.title}</Text>
                        <Text style={styles.courseInstructor}>
                          Instructor: {c.faculty_name || 'Unassigned'}
                        </Text>
                      </View>
                      <View style={styles.coursePctBadge}>
                        <Text
                          style={[
                            styles.coursePctText,
                            { color: isGood ? COLORS.success : COLORS.danger },
                          ]}
                        >
                          {pct.toFixed(1)}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.courseFooter}>
                      <Text style={styles.courseFooterText}>
                        Semester {c.semester} • {c.credits} Credits • {c.enrolled_students || 0} Students
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* 4. AT-RISK (<75%) TAB */}
        {activeTab === 'At-Risk (<75%)' && (
          <View>
            <View style={styles.atRiskWarningHeader}>
              <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
              <Text style={styles.atRiskWarningTitle}>
                {lowAttendanceAlerts.length} Scholar(s) Below 75% Requirement
              </Text>
            </View>

            {lowAttendanceAlerts.length === 0 ? (
              <EmptyState
                title="All Scholars in Good Standing"
                message="Every student currently meets or exceeds the mandatory 75% attendance threshold."
              />
            ) : (
              lowAttendanceAlerts.map((s) => (
                <Card key={s.id} style={styles.riskCard}>
                  <View style={styles.riskTop}>
                    <View style={styles.riskInfo}>
                      <Text style={styles.riskName}>{s.student_name}</Text>
                      <Text style={styles.riskAdm}>
                        {s.admission_number} • Dept: {s.department_code} • Sem {s.current_semester}
                      </Text>
                    </View>
                    <View style={styles.riskBadge}>
                      <Text style={styles.riskBadgePct}>
                        {parseFloat(s.attendance_percentage || 0).toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.riskStatsRow}>
                    <Text style={styles.riskStatsText}>
                      Attended: <Text style={{ fontWeight: '700' }}>{s.attended_sessions}</Text> of{' '}
                      <Text style={{ fontWeight: '700' }}>{s.total_sessions}</Text> scheduled lectures
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </View>
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
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 3,
    marginBottom: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabItemActive: {
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  overviewHeroCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroTextGroup: {
    flex: 1,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  heroPercentage: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -1,
    marginVertical: 2,
  },
  heroNote: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  progressThreshold: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: '700',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 14,
  },
  statBox: {
    width: '47.5%',
    margin: '1.25%',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  statBoxNum: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  policyCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  policyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  deptItemCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  deptItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deptCodeBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  deptCodeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  deptItemInfo: {
    flex: 1,
  },
  deptItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deptItemMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deptItemPct: {
    fontSize: 16,
    fontWeight: '800',
  },
  deptProgressBg: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  deptProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  courseItemCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseCodeBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  courseCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  courseTitleGroup: {
    flex: 1,
  },
  courseTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  courseInstructor: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  coursePctBadge: {
    paddingLeft: 8,
  },
  coursePctText: {
    fontSize: 15,
    fontWeight: '800',
  },
  courseFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
  },
  courseFooterText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  atRiskWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  atRiskWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  riskCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  riskTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskInfo: {
    flex: 1,
  },
  riskName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  riskAdm: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  riskBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  riskBadgePct: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.danger,
  },
  riskStatsRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
  },
  riskStatsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});

