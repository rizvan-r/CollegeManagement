import React, { useState } from 'react';
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
import {
  useFacultyCourses,
  useFacultyAttendanceSessions,
} from '../../../src/hooks/useFacultyData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function FacultyAttendanceHistoryScreen() {
  const router = useRouter();

  const { data: courses } = useFacultyCourses();
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');

  const {
    data: sessions,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useFacultyAttendanceSessions(
    selectedCourseFilter === 'ALL' ? null : selectedCourseFilter
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving institutional session history..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Sessions"
          message={error?.message || 'Failed to retrieve attendance session history.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const sessionList = sessions || [];
  const courseList = courses || [];

  const renderSessionItem = ({ item }) => {
    const total = item.total_students || 0;
    const present = item.present_count || 0;
    const absent = item.absent_count || 0;
    const onDuty = item.on_duty_count || 0;
    const late = item.late_count || 0;
    const rate = total > 0 ? Math.round(((present + onDuty) / total) * 100) : 100;
    const isLow = rate < 75;

    return (
      <Card style={styles.sessionCard}>
        <View style={styles.sessionTopRow}>
          <View style={styles.codeSecPill}>
            <Text style={styles.codeSecText}>
              {item.course_code} • Sec {item.section || 'A'}
            </Text>
          </View>
          <View style={[styles.rateBadge, { backgroundColor: isLow ? '#FEF2F2' : '#ECFDF5' }]}>
            <Text style={[styles.rateBadgeText, { color: isLow ? COLORS.danger : COLORS.accent }]}>
              {rate}% Attendance
            </Text>
          </View>
        </View>

        <Text style={styles.courseTitleText}>{item.course_title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {new Date(item.session_date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>Period #{item.period_number}</Text>
          </View>
        </View>

        {item.topic ? (
          <View style={styles.topicBox}>
            <Text style={styles.topicLabel}>Lecture Topic:</Text>
            <Text style={styles.topicText} numberOfLines={2}>
              {item.topic}
            </Text>
          </View>
        ) : null}

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownNum}>{total}</Text>
            <Text style={styles.breakdownLabel}>Enrolled</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNum, { color: COLORS.accent }]}>{present}</Text>
            <Text style={styles.breakdownLabel}>Present</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNum, { color: COLORS.danger }]}>{absent}</Text>
            <Text style={styles.breakdownLabel}>Absent</Text>
          </View>
          {onDuty > 0 ? (
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownNum, { color: '#0284C7' }]}>{onDuty}</Text>
              <Text style={styles.breakdownLabel}>On Duty</Text>
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {/* Course Filter Bar */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCourseFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedCourseFilter('ALL')}
          >
            <Text style={[styles.filterChipText, selectedCourseFilter === 'ALL' && styles.filterChipTextActive]}>
              All Sections ({sessionList.length})
            </Text>
          </TouchableOpacity>

          {courseList.map((c) => {
            const aId = c.course_assignment_id || c.id;
            const isSelected = selectedCourseFilter === aId;
            return (
              <TouchableOpacity
                key={aId}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedCourseFilter(aId)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {c.course_code || c.code} (Sec {c.section || 'A'})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={sessionList}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSessionItem}
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
            icon="calendar-outline"
            title="No Attendance Sessions"
            message="No attendance sessions have been logged for this section."
            actionLabel="Take Attendance Now"
            onAction={() => router.push('/(faculty)/attendance/mark')}
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
  filterContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sessionCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeSecPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeSecText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  topicBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  topicLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  topicText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownNum: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  breakdownLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});

