import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAdminCourses } from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function AdminCoursesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const { data: courses, isLoading, isError, error, refetch, isRefetching } = useAdminCourses();

  const departments = useMemo(() => {
    if (!courses) return [];
    const depts = new Set(courses.map((c) => c.department_code).filter(Boolean));
    return ['ALL', ...Array.from(depts)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.assigned_faculty?.toLowerCase().includes(search.toLowerCase());

      const matchDept = selectedDept === 'ALL' || c.department_code === selectedDept;

      return matchSearch && matchDept;
    });
  }, [courses, search, selectedDept]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Institutional Catalog..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to load courses'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Course Catalog</Text>
            <Text style={styles.subtitle}>{courses?.length || 0} Academic Courses</Text>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.assignBtn}
              onPress={() => router.push('/(admin)/courses/assign')}
              activeOpacity={0.8}
            >
              <Ionicons name="git-branch" size={14} color={COLORS.primary} />
              <Text style={styles.assignBtnText}>Assign</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/(admin)/courses/create')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by code, title, or instructor..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Department Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {departments.map((d) => {
            const active = selectedDept === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedDept(d)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {filteredCourses.length === 0 ? (
          <EmptyState
            title="No Courses Found"
            message={search ? 'No courses match your search criteria.' : 'No courses listed in this department.'}
          />
        ) : (
          filteredCourses.map((c) => (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/(admin)/courses/${c.id}`)}
            >
              <Card style={styles.courseCard}>
                <View style={styles.cardTop}>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>{c.code}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.courseTitle}>{c.title}</Text>
                    <Text style={styles.deptMeta}>
                      {c.department_name || c.department_code} • Sem {c.semester} • {c.credits} Credits
                    </Text>
                  </View>
                </View>

                {/* Faculty & Enrollment Status */}
                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.detailText}>
                      Instructor: <Text style={styles.detailBold}>{c.assigned_faculty || 'Unassigned'}</Text>
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.detailText}>
                      <Text style={styles.detailBold}>{c.enrolled_students || 0}</Text> Enrolled
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.manageText}>Manage &amp; Edit Course</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
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
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  assignBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  chipRow: {
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  courseCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  codeBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  infoCol: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deptMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginVertical: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  detailBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  manageText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

