import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import {
  useFacultyCourses,
  useFacultyAttendanceSessions,
} from '../../../src/hooks/useFacultyData';
import { facultyService } from '../../../src/services/facultyService';
import { Card, LoadingSpinner, ErrorView } from '../../../src/components';

export default function FacultyAttendanceHubScreen() {
  const router = useRouter();
  const {
    data: courses,
    isLoading: coursesLoading,
    isError: coursesError,
    refetch: refetchCourses,
    isRefetching: isRefetchingCourses,
  } = useFacultyCourses();

  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: refetchSessions,
    isRefetching: isRefetchingSessions,
  } = useFacultyAttendanceSessions();

  const [activePinData, setActivePinData] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);

  const isRefreshing = isRefetchingCourses || isRefetchingSessions;
  const onRefresh = () => {
    refetchCourses();
    refetchSessions();
  };

  const courseList = courses || [];
  const sessionList = sessions || [];

  const handleGeneratePin = async (courseAssignmentId) => {
    setPinLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await facultyService.generateSessionPin({
        courseAssignmentId,
        sessionDate: today,
        periodNumber: 1,
        topic: 'Regular Lecture Session',
      });

      if (res.success && res.pin) {
        setActivePinData({
          pin: res.pin,
          expiresInSeconds: res.expiresInSeconds || 600,
          courseAssignmentId,
        });
        Alert.alert(
          'Live Check-In PIN Generated',
          `Session PIN: ${res.pin}\n\nValid for 10 minutes. Students can enter this PIN in their portal to record presence.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to generate PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  if (coursesLoading || sessionsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Loading attendance management portal..." />
        </View>
      </SafeAreaView>
    );
  }

  if (coursesError && sessionsError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Attendance Hub"
          message="Unable to retrieve course assignments and session records."
          onRetry={onRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.screenTitle}>Attendance Management</Text>
          <Text style={styles.screenSubtitle}>Roll Call, PIN Sessions & Records</Text>
        </View>
        <TouchableOpacity
          style={styles.newRollCallBtn}
          onPress={() => router.push('/(faculty)/attendance/mark')}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.newRollCallText}>Roll Call</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Live PIN Broadcast Card */}
        {activePinData ? (
          <Card style={styles.pinCard}>
            <View style={styles.pinHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>ACTIVE LIVE SESSION PIN</Text>
              </View>
              <TouchableOpacity onPress={() => setActivePinData(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.pinCode}>{activePinData.pin}</Text>
            <Text style={styles.pinInstructions}>
              Display this 6-digit code to students. Check-in records will sync automatically with database records.
            </Text>

            <TouchableOpacity
              style={styles.viewSessionBtn}
              onPress={() =>
                router.push({
                  pathname: '/(faculty)/attendance/mark',
                  params: { courseAssignmentId: activePinData.courseAssignmentId },
                })
              }
            >
              <Text style={styles.viewSessionBtnText}>View Real-Time Roster</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {/* Quick Launch Courses for Attendance */}
        <Text style={styles.sectionTitle}>Take Attendance (Select Course)</Text>
        <Text style={styles.sectionSubtitle}>
          Choose a section to start manual roll call or generate a dynamic check-in PIN:
        </Text>

        {courseList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Assigned Courses</Text>
            <Text style={styles.emptySub}>No active sections found to record attendance for.</Text>
          </Card>
        ) : (
          courseList.map((course) => {
            const assignmentId = course.course_assignment_id || course.id;
            const code = course.course_code || course.code;
            const title = course.course_title || course.title;
            const enrolled = course.enrolled_count ?? course.enrolled_students ?? 0;

            return (
              <Card key={assignmentId} style={styles.courseItemCard}>
                <View style={styles.courseItemHeader}>
                  <View style={styles.courseCodeBadge}>
                    <Text style={styles.courseCodeText}>{code}</Text>
                  </View>
                  <Text style={styles.sectionText}>Section {course.section || 'A'}</Text>
                  <View style={styles.enrolledPill}>
                    <Ionicons name="people-outline" size={12} color={COLORS.primary} style={{ marginRight: 3 }} />
                    <Text style={styles.enrolledPillText}>{enrolled} Students</Text>
                  </View>
                </View>

                <Text style={styles.courseNameText} numberOfLines={1}>
                  {title}
                </Text>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.manualRollCallBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/(faculty)/attendance/mark',
                        params: { courseAssignmentId: assignmentId },
                      })
                    }
                  >
                    <Ionicons name="checkbox-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.manualRollCallText}>Manual Roll Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.generatePinBtn}
                    onPress={() => handleGeneratePin(assignmentId)}
                    disabled={pinLoading}
                  >
                    <Ionicons name="key-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.generatePinText}>Session PIN</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}

        {/* Recent Session Logs */}
        <View style={styles.recentLogsHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Session Records</Text>
          <TouchableOpacity onPress={() => router.push('/(faculty)/attendance/history')}>
            <Text style={styles.seeAllText}>All Records →</Text>
          </TouchableOpacity>
        </View>

        {sessionList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={28} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Sessions Recorded Yet</Text>
            <Text style={styles.emptySub}>
              Sessions you record via Roll Call or PIN will be logged here.
            </Text>
          </Card>
        ) : (
          sessionList.slice(0, 5).map((session) => {
            const total = session.total_students || 0;
            const present = session.present_count || 0;
            const absent = session.absent_count || 0;
            const onDuty = session.on_duty_count || 0;
            const rate = total > 0 ? Math.round(((present + onDuty) / total) * 100) : 100;

            return (
              <Card key={session.id} style={styles.sessionLogCard}>
                <View style={styles.sessionLogTop}>
                  <View style={styles.sessionCourseBadge}>
                    <Text style={styles.sessionCourseCode}>{session.course_code}</Text>
                  </View>
                  <Text style={styles.sessionDate}>
                    {new Date(session.session_date).toLocaleDateString()} • Period #{session.period_number}
                  </Text>
                </View>

                <Text style={styles.sessionTopic} numberOfLines={1}>
                  {session.topic || 'Curriculum Lecture Session'}
                </Text>

                <View style={styles.sessionStatsBar}>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.statPresent}>{present} Present</Text>
                  </View>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.statAbsent}>{absent} Absent</Text>
                  </View>
                  {onDuty > 0 ? (
                    <View style={styles.sessionStatItem}>
                      <Text style={styles.statDuty}>{onDuty} On Duty</Text>
                    </View>
                  ) : null}
                  <View style={styles.sessionRatePill}>
                    <Text style={styles.sessionRateText}>{rate}% Present</Text>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  newRollCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  newRollCallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  pinCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 14,
  },
  pinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  pinCode: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#78350F',
    textAlign: 'center',
    marginVertical: 10,
  },
  pinInstructions: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  viewSessionBtn: {
    backgroundColor: '#92400E',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewSessionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 12,
  },
  recentLogsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  courseItemCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  courseItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  courseCodeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  courseCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  enrolledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  enrolledPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  courseNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  manualRollCallBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  manualRollCallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  generatePinBtn: {
    flex: 1.2,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  generatePinText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
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
  sessionLogCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  sessionLogTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionCourseBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sessionCourseCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sessionDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sessionTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  sessionStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  sessionStatItem: {
    flex: 1,
  },
  statPresent: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  statAbsent: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.danger,
  },
  statDuty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  sessionRatePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sessionRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
});

