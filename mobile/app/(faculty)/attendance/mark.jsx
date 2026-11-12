import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import {
  useFacultyCourses,
  useFacultyCourseStudents,
  useRecordAttendance,
} from '../../../src/hooks/useFacultyData';
import { Card, Button, LoadingSpinner, ErrorView } from '../../../src/components';

export default function FacultyMarkAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { data: courses, isLoading: coursesLoading } = useFacultyCourses();

  // Selected course assignment
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(
    params.courseAssignmentId || null
  );

  // Set first course as default when loaded
  useEffect(() => {
    if (!selectedAssignmentId && courses && courses.length > 0) {
      setSelectedAssignmentId(courses[0].course_assignment_id || courses[0].id);
    }
  }, [courses, selectedAssignmentId]);

  // Enrolled students for selected course assignment
  const {
    data: students,
    isLoading: studentsLoading,
    isError: studentsError,
    error: studentsErr,
    refetch: refetchStudents,
  } = useFacultyCourseStudents(selectedAssignmentId);

  // Session metadata
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [periodNumber, setPeriodNumber] = useState(1);
  const [topic, setTopic] = useState('');

  // Attendance state map: { studentId: 'PRESENT' | 'ABSENT' | 'ON_DUTY' }
  const [attendanceMap, setAttendanceMap] = useState({});

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);

  // TanStack mutation
  const recordMutation = useRecordAttendance();

  // Initialize all students as PRESENT when students load
  useEffect(() => {
    if (students && students.length > 0) {
      const initial = {};
      students.forEach((s) => {
        const sId = s.student_id || s.id;
        initial[sId] = 'PRESENT';
      });
      setAttendanceMap(initial);
    }
  }, [students]);

  const studentList = students || [];

  const handleToggleStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    studentList.forEach((s) => {
      const sId = s.student_id || s.id;
      updated[sId] = status;
    });
    setAttendanceMap(updated);
  };

  // Compute counts
  const presentCount = Object.values(attendanceMap).filter((v) => v === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((v) => v === 'ABSENT').length;
  const onDutyCount = Object.values(attendanceMap).filter((v) => v === 'ON_DUTY').length;
  const totalCount = studentList.length;

  const handleSubmit = async () => {
    if (!selectedAssignmentId) {
      Alert.alert('Validation Error', 'Please select a course.');
      return;
    }
    if (studentList.length === 0) {
      Alert.alert('Validation Error', 'No enrolled students to mark.');
      return;
    }

    const records = studentList.map((s) => {
      const sId = s.student_id || s.id;
      return {
        studentId: sId,
        status: attendanceMap[sId] || 'PRESENT',
        remarks: `Marked by Instructor via Mobile App`,
      };
    });

    try {
      await recordMutation.mutateAsync({
        courseAssignmentId: selectedAssignmentId,
        sessionDate,
        periodNumber: Number(periodNumber),
        topic: topic.trim() || 'Curriculum Lecture Session',
        records,
      });

      setShowReviewModal(false);
      Alert.alert(
        'Success',
        `Attendance recorded successfully for ${records.length} students.`,
        [
          {
            text: 'View Session Records',
            onPress: () => router.replace('/(faculty)/attendance/history'),
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Failed to submit attendance session.');
    }
  };

  if (coursesLoading || (studentsLoading && selectedAssignmentId)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Preparing digital attendance sheet..." />
        </View>
      </SafeAreaView>
    );
  }

  const courseList = courses || [];
  const currentCourse = courseList.find(
    (c) => (c.course_assignment_id || c.id) === selectedAssignmentId
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Course Selection Chips */}
        <Text style={styles.sectionLabel}>Select Teaching Section</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseChipsContainer}
        >
          {courseList.map((c) => {
            const aId = c.course_assignment_id || c.id;
            const isSelected = aId === selectedAssignmentId;
            return (
              <TouchableOpacity
                key={aId}
                style={[styles.courseChip, isSelected && styles.courseChipSelected]}
                onPress={() => setSelectedAssignmentId(aId)}
              >
                <Text style={[styles.courseChipCode, isSelected && styles.courseChipCodeSelected]}>
                  {c.course_code || c.code}
                </Text>
                <Text style={[styles.courseChipSec, isSelected && styles.courseChipSecSelected]}>
                  Sec {c.section || 'A'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Session Details Card */}
        <Card style={styles.sessionMetaCard}>
          <Text style={styles.cardSectionTitle}>Session Information</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Session Date</Text>
              <TextInput
                style={styles.textInput}
                value={sessionDate}
                onChangeText={setSessionDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Period / Slot (1–8)</Text>
              <View style={styles.periodSelector}>
                {[1, 2, 3, 4, 5, 6].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.periodBtn, periodNumber === p && styles.periodBtnActive]}
                    onPress={() => setPeriodNumber(p)}
                  >
                    <Text style={[styles.periodBtnText, periodNumber === p && styles.periodBtnTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>Topic / Curriculum Unit</Text>
            <TextInput
              style={styles.textInput}
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. Chapter 4: Normalization & Query Execution"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </Card>

        {/* Summary Counter Bar */}
        <View style={styles.countersRow}>
          <View style={[styles.counterBox, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.counterNum, { color: COLORS.primary }]}>{totalCount}</Text>
            <Text style={styles.counterLabel}>Total</Text>
          </View>
          <View style={[styles.counterBox, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.counterNum, { color: COLORS.accent }]}>{presentCount}</Text>
            <Text style={styles.counterLabel}>Present</Text>
          </View>
          <View style={[styles.counterBox, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.counterNum, { color: COLORS.danger }]}>{absentCount}</Text>
            <Text style={styles.counterLabel}>Absent</Text>
          </View>
          <View style={[styles.counterBox, { backgroundColor: '#F0F9FF' }]}>
            <Text style={[styles.counterNum, { color: '#0284C7' }]}>{onDutyCount}</Text>
            <Text style={styles.counterLabel}>On Duty</Text>
          </View>
        </View>

        {/* Bulk Action Controls */}
        <View style={styles.bulkRow}>
          <TouchableOpacity
            style={[styles.bulkBtn, { backgroundColor: '#ECFDF5' }]}
            onPress={() => handleMarkAll('PRESENT')}
          >
            <Ionicons name="checkmark-done" size={16} color={COLORS.accent} />
            <Text style={[styles.bulkBtnText, { color: COLORS.accent }]}>All Present</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bulkBtn, { backgroundColor: '#FEF2F2' }]}
            onPress={() => handleMarkAll('ABSENT')}
          >
            <Ionicons name="close" size={16} color={COLORS.danger} />
            <Text style={[styles.bulkBtnText, { color: COLORS.danger }]}>All Absent</Text>
          </TouchableOpacity>
        </View>

        {/* Student Roll Call List */}
        <Text style={styles.rosterSectionTitle}>
          Student Roll Call ({studentList.length} Enrolled)
        </Text>

        {studentList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Students Enrolled</Text>
            <Text style={styles.emptySub}>
              There are no enrolled students registered for this section.
            </Text>
          </Card>
        ) : (
          studentList.map((student, idx) => {
            const sId = student.student_id || student.id;
            const currentStatus = attendanceMap[sId] || 'PRESENT';

            return (
              <Card key={sId || idx} style={styles.studentRollCard}>
                <View style={styles.studentRollHeader}>
                  <View style={styles.rollIndexCircle}>
                    <Text style={styles.rollIndexText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.rollInfo}>
                    <Text style={styles.rollName} numberOfLines={1}>
                      {student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}
                    </Text>
                    <Text style={styles.rollAdmission}>{student.admission_number}</Text>
                  </View>
                </View>

                {/* Status Toggle Buttons */}
                <View style={styles.statusButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      currentStatus === 'PRESENT' && styles.statusPresentActive,
                    ]}
                    onPress={() => handleToggleStatus(sId, 'PRESENT')}
                  >
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={currentStatus === 'PRESENT' ? '#FFFFFF' : COLORS.accent}
                    />
                    <Text
                      style={[
                        styles.statusToggleText,
                        currentStatus === 'PRESENT' && styles.statusTextActive,
                      ]}
                    >
                      Present
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      currentStatus === 'ABSENT' && styles.statusAbsentActive,
                    ]}
                    onPress={() => handleToggleStatus(sId, 'ABSENT')}
                  >
                    <Ionicons
                      name="close"
                      size={14}
                      color={currentStatus === 'ABSENT' ? '#FFFFFF' : COLORS.danger}
                    />
                    <Text
                      style={[
                        styles.statusToggleText,
                        currentStatus === 'ABSENT' && styles.statusTextActive,
                      ]}
                    >
                      Absent
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      currentStatus === 'ON_DUTY' && styles.statusDutyActive,
                    ]}
                    onPress={() => handleToggleStatus(sId, 'ON_DUTY')}
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={14}
                      color={currentStatus === 'ON_DUTY' ? '#FFFFFF' : '#0284C7'}
                    />
                    <Text
                      style={[
                        styles.statusToggleText,
                        currentStatus === 'ON_DUTY' && styles.statusTextActive,
                      ]}
                    >
                      On Duty
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}

        {/* Submit Button */}
        {studentList.length > 0 ? (
          <TouchableOpacity
            style={styles.reviewSubmitBtn}
            onPress={() => setShowReviewModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.reviewSubmitBtnText}>Review & Submit Attendance</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Attendance Submission</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please verify the class roll call details before committing to the institutional database:
            </Text>

            <View style={styles.modalSummaryBox}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Course:</Text>
                <Text style={styles.modalValue}>
                  {currentCourse?.course_code || currentCourse?.code} (Sec {currentCourse?.section || 'A'})
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Date & Period:</Text>
                <Text style={styles.modalValue}>
                  {sessionDate} • Period #{periodNumber}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Topic:</Text>
                <Text style={styles.modalValue} numberOfLines={1}>
                  {topic.trim() || 'Curriculum Lecture Session'}
                </Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalCountsRow}>
                <Text style={[styles.modalCountItem, { color: COLORS.accent }]}>
                  {presentCount} Present
                </Text>
                <Text style={[styles.modalCountItem, { color: COLORS.danger }]}>
                  {absentCount} Absent
                </Text>
                <Text style={[styles.modalCountItem, { color: '#0284C7' }]}>
                  {onDutyCount} On Duty
                </Text>
              </View>
            </View>

            <Text style={styles.modalWarning}>
              Note: Submitting will record or update attendance for this session. Duplicate records for the same session date and period are safely overwritten.
            </Text>

            <View style={styles.modalBtnRow}>
              <Button
                title="Back to Sheet"
                variant="outline"
                onPress={() => setShowReviewModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={recordMutation.isPending ? 'Committing...' : 'Confirm & Save'}
                variant="primary"
                onPress={handleSubmit}
                disabled={recordMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  courseChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  courseChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  courseChipCode: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  courseChipCodeSelected: {
    color: '#FFFFFF',
  },
  courseChipSec: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  courseChipSecSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  sessionMetaCard: {
    padding: 14,
    marginBottom: 14,
    borderRadius: 12,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
  },
  countersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  counterBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  counterNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bulkRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  bulkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  bulkBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rosterSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
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
  studentRollCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  studentRollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rollIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rollIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  rollInfo: {
    flex: 1,
  },
  rollName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rollAdmission: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 7,
    borderRadius: 6,
    gap: 4,
  },
  statusPresentActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  statusAbsentActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  statusDutyActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reviewSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
  },
  reviewSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  modalSummaryBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 8,
  },
  modalCountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalCountItem: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalWarning: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

