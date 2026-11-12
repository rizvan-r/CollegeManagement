import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useStudentAttendance } from '../../../src/hooks/useStudentData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function SubjectAttendanceDetailScreen() {
  const { courseId } = useLocalSearchParams();
  const { data: attendanceData, isLoading, isError, error, refetch, isRefetching } = useStudentAttendance();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving course attendance metrics..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Course Attendance"
          message={error?.message || 'Failed to retrieve attendance for this course.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const subjectList = attendanceData?.subjectAttendance || [];
  const historyList = attendanceData?.history || [];

  // Match course either by course_id, code, or param
  const subject = subjectList.find(
    (s) => s.course_id === courseId || s.code === courseId || String(s.code).toLowerCase() === String(courseId).toLowerCase()
  ) || subjectList[0];

  const filteredHistory = historyList.filter(
    (h) => h.course_id === courseId || h.course_code === subject?.code
  );

  const percent = Number(subject?.percent ?? 100);
  const isLowAttendance = percent < 75;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
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
        {/* Course Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.codeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{subject?.code || courseId}</Text>
            </View>
            <View
              style={[
                styles.percentPill,
                { backgroundColor: isLowAttendance ? '#FEF2F2' : '#ECFDF5' },
              ]}
            >
              <Text
                style={[
                  styles.percentPillText,
                  { color: isLowAttendance ? COLORS.danger : COLORS.success },
                ]}
              >
                {percent.toFixed(1)}% Attended
              </Text>
            </View>
          </View>

          <Text style={styles.courseTitle}>{subject?.title || 'Academic Course'}</Text>

          {isLowAttendance ? (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={COLORS.danger} />
              <Text style={styles.warningText}>
                Subject Warning: Attendance in this course is below the 75% institutional requirement.
              </Text>
            </View>
          ) : (
            <View style={styles.goodBox}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.goodText}>
                In Compliance: Attendance meets semester examination standards.
              </Text>
            </View>
          )}

          {/* Breakdown Counters */}
          <View style={styles.counterGrid}>
            <View style={styles.counterTile}>
              <Text style={styles.counterNum}>{subject?.total || 0}</Text>
              <Text style={styles.counterLabel}>Conducted</Text>
            </View>
            <View style={styles.counterTile}>
              <Text style={[styles.counterNum, { color: COLORS.success }]}>
                {subject?.present || 0}
              </Text>
              <Text style={styles.counterLabel}>Present</Text>
            </View>
            <View style={styles.counterTile}>
              <Text style={[styles.counterNum, { color: COLORS.accent }]}>
                {subject?.onDuty || 0}
              </Text>
              <Text style={styles.counterLabel}>On-Duty</Text>
            </View>
            <View style={styles.counterTile}>
              <Text style={[styles.counterNum, { color: COLORS.danger }]}>
                {subject?.absent || 0}
              </Text>
              <Text style={styles.counterLabel}>Absent</Text>
            </View>
          </View>
        </Card>

        {/* Course Session Logs */}
        <Text style={styles.historySectionHeading}>Conducted Class Sessions</Text>

        {filteredHistory.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No Session Records"
            message="No individual attendance sessions are logged for this course yet."
          />
        ) : (
          filteredHistory.map((item, idx) => {
            const isPresent = item.status === 'PRESENT';
            const isOnDuty = item.status === 'ON_DUTY';
            const isLate = item.status === 'LATE';

            const statusColor = isPresent
              ? COLORS.success
              : isOnDuty
              ? COLORS.accent
              : isLate
              ? COLORS.warning
              : COLORS.danger;

            return (
              <Card key={item.id || idx} style={styles.historyCard}>
                <View style={styles.historyCardRow}>
                  <View style={styles.historyCardLeft}>
                    <Text style={styles.periodText}>
                      Period {item.period_number || 1} • {item.session_date ? String(item.session_date).split('T')[0] : 'Session'}
                    </Text>
                    {item.remarks ? (
                      <Text style={styles.remarksText}>Note: {item.remarks}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: statusColor + '18' }]}>
                    <Text style={[styles.statusTagText, { color: statusColor }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    padding: 18,
    marginBottom: 16,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  percentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  percentPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.danger,
    lineHeight: 16,
    fontWeight: '500',
  },
  goodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  goodText: {
    flex: 1,
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  counterGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
  },
  counterTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  counterNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  counterLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historySectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  historyCard: {
    padding: 12,
    marginBottom: 8,
  },
  historyCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCardLeft: {
    flex: 1,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  remarksText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
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
