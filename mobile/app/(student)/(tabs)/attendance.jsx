import React, { useState } from 'react';
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
import { useStudentAttendance } from '../../../src/hooks/useStudentData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function StudentAttendanceScreen() {
  const router = useRouter();
  const { data: attendanceData, isLoading, isError, error, refetch, isRefetching } = useStudentAttendance();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'SUBJECTS' | 'HISTORY'

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Calculating institutional attendance records..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Attendance"
          message={error?.message || 'Failed to retrieve attendance data.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const summary = attendanceData?.summary || {};
  const overallPercentage = Number(summary.attendance_percentage ?? 100);
  const totalSessions = summary.total_sessions ?? 0;
  const presentCount = summary.present_count ?? 0;
  const onDutyCount = summary.on_duty_count ?? 0;
  const lateCount = summary.late_count ?? 0;
  const absentCount = summary.absent_count ?? 0;
  const subjectList = attendanceData?.subjectAttendance || [];
  const historyList = attendanceData?.history || [];

  const isLowAttendance = overallPercentage < 75;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>Attendance Governance</Text>
        <Text style={styles.screenSubtitle}>
          Mandatory Minimum: 75% • Total Conducted Sessions: {totalSessions}
        </Text>
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
        {/* Overall Percentage Hero Card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.circleContainer}>
              <View
                style={[
                  styles.metricCircle,
                  { borderColor: isLowAttendance ? COLORS.danger : COLORS.success },
                ]}
              >
                <Text
                  style={[
                    styles.metricCircleText,
                    { color: isLowAttendance ? COLORS.danger : COLORS.success },
                  ]}
                >
                  {overallPercentage.toFixed(1)}%
                </Text>
                <Text style={styles.metricCircleLabel}>AGGREGATE</Text>
              </View>
            </View>

            <View style={styles.statsColumn}>
              <View style={styles.statLine}>
                <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.statLabel}>Present Sessions:</Text>
                <Text style={styles.statValue}>{presentCount}</Text>
              </View>

              <View style={styles.statLine}>
                <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
                <Text style={styles.statLabel}>On-Duty (Approved):</Text>
                <Text style={styles.statValue}>{onDutyCount}</Text>
              </View>

              <View style={styles.statLine}>
                <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.statLabel}>Late Check-in:</Text>
                <Text style={styles.statValue}>{lateCount}</Text>
              </View>

              <View style={styles.statLine}>
                <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
                <Text style={styles.statLabel}>Absent Sessions:</Text>
                <Text style={styles.statValue}>{absentCount}</Text>
              </View>
            </View>
          </View>

          {isLowAttendance ? (
            <View style={styles.alertBox}>
              <Ionicons name="warning" size={18} color={COLORS.danger} />
              <Text style={styles.alertText}>
                Compliance Warning: Attendance is below the 75% semester requirement. Failure to meet the threshold may disqualify examination eligibility.
              </Text>
            </View>
          ) : (
            <View style={styles.goodStandingBox}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.goodStandingText}>
                Good Standing: You satisfy academic examination eligibility requirements.
              </Text>
            </View>
          )}
        </Card>

        {/* Tab Filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'ALL' && styles.filterTabTextActive,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'SUBJECTS' && styles.filterTabActive]}
            onPress={() => setActiveFilter('SUBJECTS')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'SUBJECTS' && styles.filterTabTextActive,
              ]}
            >
              Subjects ({subjectList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'HISTORY' && styles.filterTabActive]}
            onPress={() => setActiveFilter('HISTORY')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'HISTORY' && styles.filterTabTextActive,
              ]}
            >
              Logs ({historyList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subject-Wise Attendance Section */}
        {activeFilter === 'ALL' || activeFilter === 'SUBJECTS' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Course-Wise Breakdown</Text>
            {subjectList.length === 0 ? (
              <EmptyState
                icon="book-outline"
                title="No Courses Found"
                message="No enrolled course attendance records are currently registered."
              />
            ) : (
              subjectList.map((item, idx) => {
                const percent = Number(item.percent ?? 100);
                const isItemLow = percent < 75;

                return (
                  <Card key={item.code || idx} style={styles.subjectCard}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => router.push(`/(student)/attendance/${item.course_id || item.code}`)}
                    >
                      <View style={styles.subjectCardHeader}>
                        <View style={styles.subjectCodePill}>
                          <Text style={styles.subjectCodeText}>{item.code}</Text>
                        </View>
                        <View
                          style={[
                            styles.percentBadge,
                            { backgroundColor: isItemLow ? '#FEF2F2' : '#ECFDF5' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.percentBadgeText,
                              { color: isItemLow ? COLORS.danger : COLORS.success },
                            ]}
                          >
                            {percent.toFixed(1)}%
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.subjectCardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>

                      {/* Course progress track */}
                      <View style={styles.progressTrackSmall}>
                        <View
                          style={[
                            styles.progressFillSmall,
                            {
                              width: `${Math.min(percent, 100)}%`,
                              backgroundColor: isItemLow ? COLORS.danger : COLORS.success,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.subjectCardFooter}>
                        <Text style={styles.subjectFooterText}>
                          Present: {item.present || 0} • On-Duty: {item.onDuty || 0} • Absent: {item.absent || 0}
                        </Text>
                        <Text style={styles.subjectFooterTotal}>
                          Total: {item.total || 0}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Card>
                );
              })
            )}
          </View>
        ) : null}

        {/* Session History Log Section */}
        {activeFilter === 'ALL' || activeFilter === 'HISTORY' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent Session Records</Text>
            {historyList.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="No Session Logs"
                message="No attendance check-ins have been recorded yet."
              />
            ) : (
              historyList.map((record, idx) => {
                const isPresent = record.status === 'PRESENT';
                const isOnDuty = record.status === 'ON_DUTY';
                const isLate = record.status === 'LATE';

                const statusColor = isPresent
                  ? COLORS.success
                  : isOnDuty
                  ? COLORS.accent
                  : isLate
                  ? COLORS.warning
                  : COLORS.danger;

                return (
                  <Card key={record.id || idx} style={styles.historyCard}>
                    <View style={styles.historyRow}>
                      <View style={styles.historyLeft}>
                        <Text style={styles.historyCourseCode}>
                          {record.course_code || 'CLASS'} • Period {record.period_number || 1}
                        </Text>
                        <Text style={styles.historyCourseTitle} numberOfLines={1}>
                          {record.course_title || 'Class Session'}
                        </Text>
                        <Text style={styles.historyDate}>
                          {record.session_date ? String(record.session_date).split('T')[0] : 'Recorded Session'}
                        </Text>
                      </View>

                      <View style={[styles.statusTag, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[styles.statusTagText, { color: statusColor }]}>
                          {record.status}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        ) : null}
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
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    padding: 18,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  metricCircleText: {
    fontSize: 18,
    fontWeight: '900',
  },
  metricCircleLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statsColumn: {
    flex: 1,
    gap: 6,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.danger,
    lineHeight: 16,
    fontWeight: '500',
  },
  goodStandingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  goodStandingText: {
    flex: 1,
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#EEF2FF',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  subjectCard: {
    padding: 14,
    marginBottom: 10,
  },
  subjectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectCodePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  subjectCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  percentBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  subjectCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  progressTrackSmall: {
    height: 5,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 3,
  },
  subjectCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectFooterText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  subjectFooterTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  historyCard: {
    padding: 12,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {
    flex: 1,
    marginRight: 10,
  },
  historyCourseCode: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historyCourseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

