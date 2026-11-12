import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useStudentCourseDetail } from '../../../src/hooks/useStudentData';
import { Card, LoadingSpinner, ErrorView, Button } from '../../../src/components';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: course, isLoading, isError, error, refetch, isRefetching } = useStudentCourseDetail(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Fetching syllabus and course data..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !course) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Course Not Found"
          message={error?.message || 'Could not retrieve information for this course.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

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
        {/* Course Header Banner */}
        <Card style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{course.code}</Text>
            </View>
            <View style={styles.semesterBadge}>
              <Text style={styles.semesterText}>Semester {course.semester || 1}</Text>
            </View>
          </View>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.departmentName}>
            {course.department_name || 'Academic Department'}
          </Text>
        </Card>

        {/* Course Metrics Card */}
        <Card style={styles.metricsCard}>
          <Text style={styles.sectionHeading}>Course Specifications</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Credit Value</Text>
            <Text style={styles.metaValue}>{course.credits} Academic Credits</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Assigned Faculty</Text>
            <Text style={styles.metaValue}>{course.assigned_faculty || 'Assigned Instructor'}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Department Code</Text>
            <Text style={styles.metaValue}>{course.department_code || 'GEN'}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Course Status</Text>
            <Text style={[styles.metaValue, { color: COLORS.success }]}>
              {course.is_active ? 'ACTIVE CURRICULUM' : 'INACTIVE'}
            </Text>
          </View>
        </Card>

        {/* Attendance Shortcut */}
        <Card style={styles.shortcutCard}>
          <View style={styles.shortcutHeader}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
            <View style={styles.shortcutTextGroup}>
              <Text style={styles.shortcutTitle}>Attendance Tracking</Text>
              <Text style={styles.shortcutDesc}>
                Review your session-by-session attendance history for {course.code}.
              </Text>
            </View>
          </View>
          <Button
            title="Inspect Subject Attendance"
            variant="outline"
            onPress={() => router.push(`/(student)/attendance/${course.id || id}`)}
            style={styles.shortcutButton}
          />
        </Card>
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
    padding: 20,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
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
    letterSpacing: 0.5,
  },
  semesterBadge: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  semesterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 28,
  },
  departmentName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metricsCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  metaLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  shortcutCard: {
    padding: 16,
  },
  shortcutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  shortcutTextGroup: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  shortcutDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  shortcutButton: {
    width: '100%',
  },
});
