import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useStudentCourses } from '../../../src/hooks/useStudentData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function StudentCoursesScreen() {
  const router = useRouter();
  const { data: courses, isLoading, isError, error, refetch, isRefetching } = useStudentCourses();

  const totalCredits = (courses || []).reduce((sum, item) => sum + (Number(item.credits) || 0), 0);

  const renderCourseItem = ({ item }) => (
    <Card style={styles.courseCard}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/(student)/course/${item.course_id || item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{item.course_code || item.code}</Text>
          </View>
          <View style={styles.creditBadge}>
            <Text style={styles.creditText}>{item.credits} Credits</Text>
          </View>
        </View>

        <Text style={styles.courseTitle}>{item.course_title || item.title}</Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.faculty_name || 'Department Faculty'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="grid-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              Section {item.section || 'A'} • Sem {item.semester || 1}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.enrolledStatus}>
            Status: <Text style={styles.enrolledStatusBold}>{item.status || 'ENROLLED'}</Text>
          </Text>
          <Text style={styles.viewDetailLink}>Details & Roster →</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.screenTitle}>Enrolled Courses</Text>
          <Text style={styles.screenSubtitle}>
            Active Academic Term • {courses?.length || 0} Registered Modules
          </Text>
        </View>
        <View style={styles.totalCreditsPill}>
          <Text style={styles.totalCreditsNum}>{totalCredits}</Text>
          <Text style={styles.totalCreditsLabel}>Total Credits</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <LoadingSpinner message="Fetching your enrolled courses..." />
        </View>
      ) : isError ? (
        <ErrorView
          title="Could Not Load Courses"
          message={error?.message || 'Failed to retrieve your enrolled course list.'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => String(item.enrollment_id || item.course_id || item.id)}
          renderItem={renderCourseItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
              title="No Courses Enrolled"
              message="You are not currently enrolled in any academic courses for this session. Contact your Department Staff or HOD for enrollment authorization."
            />
          }
        />
      )}
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
  totalCreditsPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  totalCreditsNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalCreditsLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  courseCard: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  creditBadge: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  creditText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    lineHeight: 22,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  enrolledStatus: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  enrolledStatusBold: {
    fontWeight: '700',
    color: COLORS.success,
  },
  viewDetailLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
});

