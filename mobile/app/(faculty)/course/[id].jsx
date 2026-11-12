import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import {
  useFacultyCourses,
  useFacultyCourseStudents,
} from '../../../src/hooks/useFacultyData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function FacultyCourseRosterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: courses } = useFacultyCourses();
  const {
    data: students,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useFacultyCourseStudents(id);

  const [searchQuery, setSearchQuery] = useState('');

  // Find course info from courses cache
  const course = (courses || []).find(
    (c) => c.course_assignment_id === id || c.id === id || c.course_id === id
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving class roster and attendance records..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Roster"
          message={error?.message || 'Failed to retrieve students enrolled in this section.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const studentList = students || [];
  const filteredStudents = studentList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  const code = course?.course_code || course?.code || 'COURSE';
  const title = course?.course_title || course?.title || 'Course Details';
  const section = course?.section || 'A';
  const credits = course?.credits || 3;

  const renderStudentItem = ({ item }) => {
    const attPercentage = Math.round(Number(item.attendance_percentage ?? 100));
    const isLow = attPercentage < 75;

    return (
      <Card style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.studentAvatar}>
            <Text style={styles.avatarText}>
              {(item.first_name || item.name || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.studentDetails}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim()}
            </Text>
            <Text style={styles.admissionText}>{item.admission_number}</Text>
            <Text style={styles.emailText} numberOfLines={1}>
              {item.email || 'No email registered'}
            </Text>
          </View>

          <View style={[styles.percentagePill, { backgroundColor: isLow ? '#FEF2F2' : '#ECFDF5' }]}>
            <Text style={[styles.percentageText, { color: isLow ? COLORS.danger : COLORS.accent }]}>
              {attPercentage}%
            </Text>
            <Text style={styles.percentageLabel}>Attendance</Text>
          </View>
        </View>

        <View style={styles.studentFooter}>
          <View style={styles.footerStat}>
            <Text style={styles.footerStatLabel}>Sessions Attended:</Text>
            <Text style={styles.footerStatValue}>
              {item.attended_sessions || 0} / {item.total_course_sessions || 0}
            </Text>
          </View>

          {item.phone ? (
            <View style={styles.footerContact}>
              <Ionicons name="call-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.phoneText}>{item.phone}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {/* Course Overview Card */}
      <Card style={styles.courseOverviewCard}>
        <View style={styles.overviewTop}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{code}</Text>
          </View>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>Section {section}</Text>
          </View>
          <View style={styles.creditBadge}>
            <Text style={styles.creditBadgeText}>{credits} Credits</Text>
          </View>
        </View>

        <Text style={styles.courseMainTitle}>{title}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.takeAttendanceBtn}
            onPress={() =>
              router.push({
                pathname: '/(faculty)/attendance/mark',
                params: { courseAssignmentId: id },
              })
            }
          >
            <Ionicons name="checkbox-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.takeAttendanceBtnText}>Take Roll Call</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Roster Header & Search */}
      <View style={styles.rosterHeaderRow}>
        <Text style={styles.rosterTitle}>
          Enrolled Students ({studentList.length})
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name or ID..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => String(item.student_id || item.id || item.admission_number)}
        renderItem={renderStudentItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={searchQuery ? 'No Matching Students' : 'No Students Enrolled'}
            message={
              searchQuery
                ? `No students found matching "${searchQuery}".`
                : 'No students have been enrolled in this course section yet.'
            }
            actionLabel={searchQuery ? 'Clear Search' : 'Refresh Roster'}
            onAction={searchQuery ? () => setSearchQuery('') : refetch}
          />
        }
      />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseOverviewCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sectionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  creditBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creditBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  courseMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
  },
  takeAttendanceBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  takeAttendanceBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rosterHeaderRow: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  rosterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  studentCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  admissionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 1,
  },
  emailText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  percentagePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 64,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '800',
  },
  percentageLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: 10,
    paddingTop: 8,
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  footerStatValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  footerContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});

