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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useFacultyCourses } from '../../../src/hooks/useFacultyData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function FacultyCoursesScreen() {
  const router = useRouter();
  const { data: courses, isLoading, isError, error, refetch, isRefetching } = useFacultyCourses();
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving assigned teaching courses..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Courses"
          message={error?.message || 'Unable to retrieve your teaching assignments.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const courseList = courses || [];
  const filteredCourses = courseList.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.code?.toLowerCase().includes(q) ||
      item.course_code?.toLowerCase().includes(q) ||
      item.title?.toLowerCase().includes(q) ||
      item.course_title?.toLowerCase().includes(q) ||
      item.department_name?.toLowerCase().includes(q)
    );
  });

  const totalStudents = courseList.reduce(
    (sum, c) => sum + (Number(c.enrolled_count || c.enrolled_students) || 0),
    0
  );

  const renderCourseItem = ({ item }) => {
    const code = item.course_code || item.code;
    const title = item.course_title || item.title;
    const enrolled = item.enrolled_count ?? item.enrolled_students ?? 0;
    const sessions = item.total_sessions_conducted ?? 0;
    const assignmentId = item.course_assignment_id || item.id;

    return (
      <Card style={styles.courseCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/(faculty)/course/${assignmentId}`)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{code}</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionText}>Section {item.section || 'A'}</Text>
            </View>
            <View style={styles.creditBadge}>
              <Text style={styles.creditText}>{item.credits || 3} Credits</Text>
            </View>
          </View>

          <Text style={styles.courseTitle}>{title}</Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="school-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>
                Sem {item.semester || 1} • {item.department_name || 'Engineering'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{enrolled}</Text>
              <Text style={styles.statLabel}>Enrolled Students</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{sessions}</Text>
              <Text style={styles.statLabel}>Sessions Held</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.markBtn}
              onPress={() =>
                router.push({
                  pathname: '/(faculty)/attendance/mark',
                  params: { courseAssignmentId: assignmentId },
                })
              }
            >
              <Ionicons name="checkbox-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.markBtnText}>Take Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewRosterBtn}
              onPress={() => router.push(`/(faculty)/course/${assignmentId}`)}
            >
              <Text style={styles.viewRosterBtnText}>Student Roster →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.screenTitle}>My Teaching Courses</Text>
          <Text style={styles.screenSubtitle}>Curriculum & Assigned Sections</Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeCount}>{courseList.length}</Text>
          <Text style={styles.summaryBadgeLabel}>Courses</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by course code or title..."
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

      {/* Summary Banner */}
      <View style={styles.overviewBanner}>
        <View style={styles.bannerItem}>
          <Text style={styles.bannerNum}>{courseList.length}</Text>
          <Text style={styles.bannerLabel}>Assigned Courses</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerItem}>
          <Text style={styles.bannerNum}>{totalStudents}</Text>
          <Text style={styles.bannerLabel}>Total Enrolled</Text>
        </View>
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => String(item.course_assignment_id || item.id || item.code)}
        renderItem={renderCourseItem}
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
            icon="book-outline"
            title={searchQuery ? 'No Matching Courses' : 'No Courses Assigned'}
            message={
              searchQuery
                ? `No courses found matching "${searchQuery}".`
                : 'You have not been assigned teaching courses for this active semester.'
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
  summaryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryBadgeCount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  overviewBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  bannerItem: {
    alignItems: 'center',
    flex: 1,
  },
  bannerNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bannerLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bannerDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.borderLight,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    paddingVertical: 4,
    borderRadius: 6,
  },
  sectionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  creditBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  creditText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  detailsRow: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
    gap: 10,
  },
  markBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 8,
  },
  markBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  viewRosterBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewRosterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

