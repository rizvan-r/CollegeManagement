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
import { COLORS } from '../../../src/constants/colors';
import { useHodStudents } from '../../../src/hooks/useHodData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function HodStudentsScreen() {
  const { data: students, isLoading, isError, error, refetch, isRefetching } = useHodStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStanding, setFilterStanding] = useState('ALL'); // 'ALL' | 'GOOD' | 'LOW'

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving department student scholars..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Students"
          message={error?.message || 'Unable to retrieve department student roster.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const studentList = students || [];
  const filteredStudents = studentList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const att = Number(s.attendance_percentage ?? 100);
    if (filterStanding === 'GOOD') return att >= 75;
    if (filterStanding === 'LOW') return att < 75;
    return true;
  });

  const lowAttCount = studentList.filter((s) => Number(s.attendance_percentage ?? 100) < 75).length;

  const renderStudentItem = ({ item }) => {
    const attPercentage = Math.round(Number(item.attendance_percentage ?? 100));
    const isLow = attPercentage < 75;

    return (
      <Card style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(item.first_name || item.name || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim()}
            </Text>
            <Text style={styles.admissionText}>{item.admission_number}</Text>
            <Text style={styles.semesterText}>
              Semester {item.current_semester || 1} • {item.academic_year_name || '2025–2026'}
            </Text>
          </View>

          <View style={[styles.attPill, { backgroundColor: isLow ? '#FEF2F2' : '#ECFDF5' }]}>
            <Text style={[styles.attNum, { color: isLow ? COLORS.danger : COLORS.accent }]}>
              {attPercentage}%
            </Text>
            <Text style={styles.attLabel}>Attendance</Text>
          </View>
        </View>

        <View style={styles.academicRow}>
          <View style={styles.academicItem}>
            <Ionicons name="book-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.academicText}>
              {item.enrolled_courses_count || 0} Courses Enrolled
            </Text>
          </View>
          <View style={styles.academicItem}>
            <Ionicons name="checkbox-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.academicText}>
              {item.attended_sessions || 0} / {item.total_sessions_recorded || 0} Sessions
            </Text>
          </View>
        </View>

        {/* Guardian and Contact */}
        <View style={styles.contactFooter}>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
          </View>
          {item.phone ? (
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.contactText}>{item.phone}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.screenTitle}>Department Students</Text>
          <Text style={styles.screenSubtitle}>Student Information System & Performance</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countPillNum}>{studentList.length}</Text>
          <Text style={styles.countPillLabel}>Enrolled</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterStanding === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterStanding('ALL')}
        >
          <Text style={[styles.filterChipText, filterStanding === 'ALL' && styles.filterChipTextActive]}>
            All ({studentList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStanding === 'GOOD' && styles.filterChipActive]}
          onPress={() => setFilterStanding('GOOD')}
        >
          <Text style={[styles.filterChipText, filterStanding === 'GOOD' && styles.filterChipTextActive]}>
            Good Standing (≥75%)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStanding === 'LOW' && [styles.filterChipActive, { backgroundColor: COLORS.danger, borderColor: COLORS.danger }],
          ]}
          onPress={() => setFilterStanding('LOW')}
        >
          <Text style={[styles.filterChipText, filterStanding === 'LOW' && styles.filterChipTextActive]}>
            Low Attendance ({lowAttCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name, admission number..."
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
        keyExtractor={(item) => String(item.id || item.admission_number)}
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
            icon="school-outline"
            title={searchQuery ? 'No Matching Students' : 'No Students Found'}
            message={
              searchQuery
                ? `No students found matching "${searchQuery}".`
                : 'No students are registered in this department for this category.'
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
  countPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
  },
  countPillNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  countPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 8,
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
  studentCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoCol: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  admissionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 1,
  },
  semesterText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  attPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  attNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  attLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  academicRow: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  academicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  academicText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  contactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 6,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  contactText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});

