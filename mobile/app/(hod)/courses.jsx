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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useHodCourses } from '../../src/hooks/useHodData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../src/components';

export default function HodCoursesScreen() {
  const { data: courses, isLoading, isError, error, refetch, isRefetching } = useHodCourses();
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving departmental curriculum matrix..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Courses"
          message={error?.message || 'Unable to retrieve department courses.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const courseList = courses || [];
  const filteredCourses = courseList.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.code?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.faculty_name?.toLowerCase().includes(q)
    );
  });

  const renderCourseItem = ({ item }) => (
    <Card style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <View style={styles.codePill}>
          <Text style={styles.codePillText}>{item.code}</Text>
        </View>
        <View style={styles.secPill}>
          <Text style={styles.secText}>Section {item.section || 'A'}</Text>
        </View>
        <View style={styles.creditsPill}>
          <Text style={styles.creditsText}>{item.credits || 3} Credits</Text>
        </View>
        <View style={styles.semPill}>
          <Text style={styles.semText}>Sem {item.semester || 1}</Text>
        </View>
      </View>

      <Text style={styles.courseTitle}>{item.title}</Text>

      <View style={styles.facultyRow}>
        <Ionicons name="person-outline" size={14} color={COLORS.primary} />
        <Text style={styles.facultyText}>
          Faculty: <Text style={styles.facultyNameBold}>{item.faculty_name || 'Unassigned / TBA'}</Text>
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{item.enrolled_students || 0}</Text>
          <Text style={styles.statLabel}>Enrolled Scholars</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{item.sessions_held || 0}</Text>
          <Text style={styles.statLabel}>Sessions Held</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by course code, title, or instructor..."
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
        data={filteredCourses}
        keyExtractor={(item) => String(item.id || item.code)}
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
            icon="library-outline"
            title={searchQuery ? 'No Matching Courses' : 'No Courses Found'}
            message={
              searchQuery
                ? `No courses found matching "${searchQuery}".`
                : 'No active courses have been configured for this department.'
            }
            actionLabel={searchQuery ? 'Clear Search' : 'Refresh Matrix'}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 10,
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
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  codePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  secPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  secText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  creditsPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creditsText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  semPill: {
    marginLeft: 'auto',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  semText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  facultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  facultyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  facultyNameBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.borderLight,
  },
});

